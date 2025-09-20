// Netlify function to verify Paystack payment
const axios = require('axios');

exports.handler = async function(event, context) {
  // Set CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  // Handle preflight OPTIONS request
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ message: 'Preflight call successful' })
    };
  }

  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    // Parse the request body
    const data = JSON.parse(event.body);
    const { reference } = data;

    // Validate required fields
    if (!reference) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          error: 'Missing required fields',
          required: ['reference'],
          received: Object.keys(data)
        })
      };
    }

    // Get the Paystack secret key from environment variables
    const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;
    
    if (!PAYSTACK_SECRET_KEY) {
      console.error('Paystack secret key is not configured');
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'Payment system is not properly configured' })
      };
    }

    // Log the verification request
    console.log('Verifying Paystack payment:', { reference });

    // Verify Paystack transaction
    const response = await axios({
      method: 'get',
      url: `https://api.paystack.co/transaction/verify/${reference}`,
      headers: {
        'Authorization': `Bearer ${PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    // Check if the payment was successful
    const success = response.data.data.status === 'success';

    // Return the verification result
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success,
        data: {
          reference: response.data.data.reference,
          amount: response.data.data.amount,
          status: response.data.data.status,
          paidAt: response.data.data.paid_at,
          channel: response.data.data.channel,
          currency: response.data.data.currency,
          customer: {
            email: response.data.data.customer.email
          }
        }
      })
    };
  } catch (error) {
    console.error('Error verifying Paystack payment:', error);
    
    // Return detailed error information
    return {
      statusCode: error.response?.status || 500,
      headers,
      body: JSON.stringify({
        error: 'Failed to verify payment',
        details: error.response?.data || error.message
      })
    };
  }
};
