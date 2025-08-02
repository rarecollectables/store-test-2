require('dotenv').config();
const express = require('express');
const Stripe = require('stripe');
const cors = require('cors');

const app = express();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

app.use(cors());
app.use(express.json());

// ✅ FIXED: Payment Intent route (used with PaymentElement)
app.post('/create-payment-intent', async (req, res) => {
  try {
    const {
      cart,
      shipping,
      coupon, // Accept coupon from frontend
      currency = 'gbp',
      automatic_payment_methods = {enabled: true},
    } = req.body;

    if (!cart || !Array.isArray(cart) || cart.length === 0) {
      return res.status(400).json({error: 'Cart is empty.'});
    }

    let amount = cart.reduce((total, item) => {
      const itemPrice =
        typeof item.price === 'number' ? item.price : parseFloat(item.price);
      return total + itemPrice * (item.quantity || 1);
    }, 0);

    // Apply coupon logic
    if (coupon) {
      const promoCodes = await stripe.promotionCodes.list({
        code: coupon,
        active: true,
        limit: 1,
      });

      if (promoCodes.data.length) {
        const promo = promoCodes.data[0];

        if (promo.coupon.percent_off) {
          amount = amount * (1 - promo.coupon.percent_off / 100);
        } else if (promo.coupon.amount_off) {
          amount = amount - promo.coupon.amount_off / 100;
        }

        if (amount < 0) amount = 0; // Ensure it's not negative
      }
    }

    const amountInPence = Math.round(amount * 100); // Convert to minor currency unit

    if (amountInPence <= 0) {
      return res.status(400).json({error: 'Invalid amount after discount.'});
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInPence,
      currency,
      shipping,
      automatic_payment_methods,
    });

    console.log('PaymentIntent created:', paymentIntent.id);

    res.send({clientSecret: paymentIntent.client_secret});
  } catch (err) {
    console.error('Error creating PaymentIntent:', err.message);
    res.status(400).send({error: err.message});
  }
});




// ✅ Checkout Session route (used with Stripe Checkout redirect)
app.post('/create-checkout-session', async (req, res) => {
  try {
    const {
      cart,
      customer_email,
      shipping_address,
      selected_payment_method,
      deliveryType,
      deliveryCost,
      discountAmount,
      coupon,
    } = req.body;

    console.log('Delivery Type:', deliveryType); // expected: 'express' or 'standard'
    console.log('Delivery Cost:', deliveryCost);
    console.log('coupon', coupon);
    console.log('discountAmount', discountAmount);



    if (!cart || !Array.isArray(cart) || cart.length === 0) {
      return res.status(400).json({error: 'Cart is empty.'});
    }

    const line_items = [
      ...cart.map(item => ({
        price_data: {
          currency: 'gbp',
          product_data: {name: item.title || item.name},
          unit_amount: Math.round(
            (typeof item.price === 'number'
              ? item.price
              : parseFloat(item.price)) * 100,
          ),
        },
        quantity: item.quantity || 1,
      })),
    ];

    console.log('Line Items:', JSON.stringify(line_items, null, 2));


    // 👇 Add delivery as a line item if cost > 0
    if (deliveryCost && deliveryCost > 0) {
      line_items.push({
        price_data: {
          currency: 'gbp',
          product_data: {
            name:
              deliveryType === 'express'
                ? 'Express Delivery'
                : 'Standard Delivery',
          },
          unit_amount: Math.round(deliveryCost * 100), // Stripe expects pence
        },
        quantity: 1,
      });
    }
    
    // const line_items = cart.map(item => ({
    //   price_data: {
    //     currency: 'gbp',
    //     product_data: {name: item.title || item.name},
    //     unit_amount: Math.round(
    //       (typeof item.price === 'number'
    //         ? item.price
    //         : parseFloat(item.price)) * 100,
    //     ),
    //   },
    //   quantity: item.quantity || 1,
    // }));

    const session = await stripe.checkout.sessions.create({
      payment_method_types: selected_payment_method
        ? [selected_payment_method]
        : [
            'card',
            'link',
            'afterpay_clearpay',
            'klarna',
            'revolut_pay',
            'amazon_pay',
            'paypal',
          ],
      // payment_method_types: req.body.payment_method_types || ['card', 'link'], // ✅ Express Checkout support
      mode: 'payment',
      line_items,
      shipping_address_collection: shipping_address
        ? {allowed_countries: ['GB', 'US', 'CA', 'IE', 'AU', 'FR', 'DE', 'NG']}
        : undefined,
      customer_email: customer_email || undefined,
      metadata: {
        deliveryType: deliveryType || 'standard', // 👈 add delivery type as metadata
        deliveryCost: deliveryCost,
      },
      success_url: `${
        process.env.API_URL || 'http://localhost:8081'
      }/confirmation?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.API_URL || 'http://localhost:8081'}/cart`,
    });

    res.json({url: session.url});
  } catch (error) {
    res.status(500).json({error: error.message});
  }
});

app.post('/validate-coupon', async (req, res) => {
  console.log(
    'Stripe Key:',
    process.env.STRIPE_SECRET_KEY ? '[SET]' : '[MISSING]',
  );

  try {
    const {coupon} = req.body;

    if (!coupon) {
      return res.status(400).json({error: 'Coupon code is required.'});
    }

    const promoCodes = await stripe.promotionCodes.list({
      code: coupon,
      active: true,
      limit: 1,
    });

    console.log('Stripe promoCodes API result:', JSON.stringify(promoCodes));

    if (!promoCodes.data.length) {
      return res.status(400).json({error: 'Invalid or expired coupon code.'});
    }

    const promo = promoCodes.data[0];
    let discount = null;

    if (promo.coupon.percent_off) {
      discount = {type: 'percent', value: promo.coupon.percent_off};
    } else if (promo.coupon.amount_off) {
      discount = {
        type: 'amount',
        value: promo.coupon.amount_off / 100,
        currency: promo.coupon.currency,
      };
    }

    return res.status(200).json({valid: true, discount, promo});
  } catch (error) {
    console.error('Coupon validation error:', error.message);
    return res.status(500).json({error: error.message});
  }
});



const PORT = process.env.STRIPE_SERVER_PORT || 4242;
app.listen(PORT, () => {
  console.log(`Stripe server running on port ${PORT}`);
});
