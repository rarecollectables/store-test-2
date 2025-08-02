// const express = require('express');
// const Stripe = require('stripe');
// const router = express.Router();

// const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
//   apiVersion: '2022-11-15',
// });

// const allowedOrigins = [
//   'https://rarecollectables1.netlify.app',
//   'https://rarecollectables.netlify.app',
//   'http://localhost:8081',
//   'http://127.0.0.1:8081',
//   'https://rarecollectables.co.uk',
// ];

// // POST /create-payment-intent
// router.post('/', async (req, res) => {
//   const origin = req.headers.origin || req.headers.Origin;
//   if (!allowedOrigins.includes(origin)) {
//     return res.status(403).json({
//       error: 'Invalid origin',
//       requestId: req.id || 'unknown',
//     });
//   }

//   if (
//     !process.env.STRIPE_SECRET_KEY ||
//     !process.env.STRIPE_SECRET_KEY.startsWith('sk_')
//   ) {
//     return res.status(500).json({
//       error: 'Invalid or missing Stripe secret key',
//       details: 'Check STRIPE_SECRET_KEY in your environment',
//     });
//   }

//   try {
//     const {cart, contact, address, coupon, discountAmount} = req.body;

//     if (!Array.isArray(cart) || cart.length === 0) {
//       return res.status(400).json({error: 'Cart is empty or invalid'});
//     }

//     const subtotal = cart.reduce((sum, item) => {
//       return sum + item.price * 100 * item.quantity;
//     }, 0);

//     // Coupon logic
//     let calculatedDiscountAmountCents = 0;
//     if (coupon) {
//       try {
//         const promoCodes = await stripe.promotionCodes.list({
//           code: coupon,
//           active: true,
//           limit: 1,
//         });

//         const promo = promoCodes.data[0];
//         if (promo) {
//           if (promo.coupon.percent_off) {
//             calculatedDiscountAmountCents = Math.round(
//               subtotal * (promo.coupon.percent_off / 100),
//             );
//           } else if (promo.coupon.amount_off) {
//             calculatedDiscountAmountCents = promo.coupon.amount_off;
//           }
//         } else {
//           calculatedDiscountAmountCents = discountAmount
//             ? Math.round(discountAmount * 100)
//             : 0;
//         }
//       } catch (err) {
//         calculatedDiscountAmountCents = discountAmount
//           ? Math.round(discountAmount * 100)
//           : 0;
//       }
//     } else {
//       calculatedDiscountAmountCents = discountAmount
//         ? Math.round(discountAmount * 100)
//         : 0;
//     }

//     const total = Math.max(0, subtotal - calculatedDiscountAmountCents);

//     // Stripe line items (optional, more for display/debug)
//     const line_items = cart.map((item, index) => {
//       const productName = item.name || item.title || `Product ${index + 1}`;
//       const price =
//         typeof item.price === 'number' ? item.price : parseFloat(item.price);
//       return {
//         price_data: {
//           currency: 'gbp',
//           product_data: {
//             name: productName,
//             description: item.description || '',
//             images: item.image_path ? [item.image_path] : undefined,
//           },
//           unit_amount: Math.round(price * 100),
//         },
//         quantity: item.quantity || 1,
//       };
//     });

//     const customer = await stripe.customers.create({
//       email: contact?.email,
//       metadata: {
//         shipping_address: address
//           ? JSON.stringify({
//               line1: address.line1,
//               city: address.city,
//               postal_code: address.zip,
//               country: address.country || 'GB',
//             })
//           : null,
//       },
//     });

//     const paymentIntent = await stripe.paymentIntents.create({
//       amount: total,
//       currency: 'gbp',
//       customer: customer.id,
//       automatic_payment_methods: {
//         enabled: true,
//       },
//       metadata: {
//         contact_email: contact?.email,
//         shipping_address: address ? JSON.stringify(address) : null,
//         original_amount: subtotal.toString(),
//         discount_amount: calculatedDiscountAmountCents.toString(),
//         coupon: coupon || 'none',
//         cart_items: JSON.stringify(
//           cart.map(item => ({
//             id: item.id,
//             name: item.name,
//             price: item.price,
//             quantity: item.quantity,
//           })),
//         ),
//       },
//     });

//     return res.status(200).json({
//       clientSecret: paymentIntent.client_secret,
//       paymentDetails: {
//         subtotal,
//         discount: calculatedDiscountAmountCents,
//         total,
//         couponApplied: coupon || null,
//       },
//     });
//   } catch (error) {
//     console.error('Payment intent error:', error);
//     return res.status(error.statusCode || 500).json({
//       error: error.message || 'Server error',
//       code: error.code,
//       type: error.type,
//       details: error.details,
//     });
//   }
// });

// module.exports = router;



const Stripe = require('stripe');
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2022-11-15',
});

exports.handler = async event => {
  const allowedOrigins = [
    'https://rarecollectables1.netlify.app',
    'https://rarecollectables.co.uk',
    'https://rarecollectables.netlify.app',
    'http://localhost:8081',
    'http://127.0.0.1:8081',
  ];
  const origin = event.headers.origin || event.headers.Origin || '';
  const isAllowedOrigin = allowedOrigins.includes(origin);

  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': isAllowedOrigin ? origin : '',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
      body: '',
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({error: 'Method Not Allowed'}),
    };
  }

  try {
    const body = JSON.parse(event.body);
    const {
      cart,
      contact,
      address,
      coupon,
      amount,
      shippingAddress,
      deliveryType,
      discountAmount = 0,
      deliveryCost = 0,
    } = body;

    if (!Array.isArray(cart) || cart.length === 0) {
      return {
        statusCode: 400,
        body: JSON.stringify({error: 'Cart is empty or invalid'}),
      };
    }

    const subtotal = cart.reduce((sum, item) => {
      return sum + item.price * 100 * item.quantity;
    }, 0);

    // 🔍 Fetch and validate promotion code
    let calculatedDiscountAmountCents = 0;
    let promoCodeId = null;

    if (coupon) {
      try {
        const promoCodes = await stripe.promotionCodes.list({
          code: coupon,
          active: true,
          limit: 1,
        });

        if (promoCodes.data.length > 0) {
          const promo = promoCodes.data[0];
          promoCodeId = promo.id;

          if (promo.coupon.percent_off) {
            calculatedDiscountAmountCents = Math.round(
              subtotal * (promo.coupon.percent_off / 100),
            );
          } else if (promo.coupon.amount_off) {
            calculatedDiscountAmountCents = promo.coupon.amount_off;
          }
        } else {
          calculatedDiscountAmountCents = discountAmount
            ? Math.round(discountAmount * 100)
            : 0;
        }
      } catch (err) {
        console.error('Promo code error:', err);
        calculatedDiscountAmountCents = discountAmount
          ? Math.round(discountAmount * 100)
          : 0;
      }
    }

    const total = Math.max(0, subtotal - calculatedDiscountAmountCents);


    // 🔻 Apply discount
    // let total = subtotal - discountAmount;

    // 🚚 Add delivery cost if any
    // total += deliveryCost;

    // 💰 Convert to smallest currency unit (e.g., cents or pence)
    // const amountInCents = Math.round(total * 100);

    const paymentIntent = await stripe.paymentIntents.create({
      amount: total,
      currency: 'gbp', // or 'usd', based on your store
      // payment_method_types: ['card'],
      automatic_payment_methods: {
        enabled: true,
      },
      shippingAddress: shippingAddress,
      metadata: {
        shippingAddress: JSON.stringify(shippingAddress),
        deliveryType: deliveryType || 'standard', // 👈 add delivery type as metadata
        deliveryCost: deliveryCost,

        // other metadata
      },
    });

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': isAllowedOrigin ? origin : '',
      },
      body: JSON.stringify({clientSecret: paymentIntent.client_secret}),
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': isAllowedOrigin ? origin : '',
      },
      body: JSON.stringify({error: error.message}),
    };
  }
};
