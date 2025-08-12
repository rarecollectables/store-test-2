const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

exports.handler = async (event, context) => {
  // Set CORS headers for browser clients
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
  };

  // Handle preflight OPTIONS request
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ message: 'Preflight call successful' })
    };
  }

  try {
    // Get the session ID from the query parameters
    const sessionId = event.queryStringParameters?.session_id;
    
    if (!sessionId) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Missing session_id parameter' })
      };
    }

    console.log(`Retrieving Stripe Checkout session: ${sessionId}`);
    
    // Retrieve the session from Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['payment_intent', 'line_items']
    });
    
    console.log('Session retrieved successfully:', {
      id: session.id,
      payment_status: session.payment_status,
      payment_intent: session.payment_intent?.id || null
    });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        session: {
          id: session.id,
          payment_status: session.payment_status,
          payment_intent: session.payment_intent?.id || null,
          customer_email: session.customer_details?.email || null,
          amount_total: session.amount_total / 100, // Convert from cents to dollars/pounds
          currency: session.currency,
          payment_method_types: session.payment_method_types,
          line_items: session.line_items?.data || []
        }
      })
    };
  } catch (error) {
    console.error('Error retrieving Stripe Checkout session:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Failed to retrieve Stripe Checkout session',
        message: error.message
      })
    };
  }
};
