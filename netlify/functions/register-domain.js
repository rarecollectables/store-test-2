const Stripe = require('stripe');

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

exports.handler = async (event, context) => {
  try {
    const paymentMethodDomain = await stripe.paymentMethodDomains.create({
      domain_name: 'rarecollectables.co.uk', // updated domain name
    });

    return {
      statusCode: 200,
      body: JSON.stringify({success: true, domain: paymentMethodDomain}),
    };
  } catch (error) {
    return {
      statusCode: 400,
      body: JSON.stringify({error: error.message}),
    };
  }
};
