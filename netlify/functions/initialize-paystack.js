// Netlify function to initialize Paystack payment
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
    const { email, amount, reference, metadata } = data;

    // Validate required fields
    if (!email || !amount) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          error: 'Missing required fields',
          required: ['email', 'amount'],
          received: Object.keys(data)
        })
      };
    }

    // Get the Paystack secret key from environment variables
    const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;
    // Determine site URL for Paystack redirect after payment
    const SITE_URL =
      process.env.SITE_URL ||
      process.env.URL ||
      process.env.DEPLOY_PRIME_URL ||
      'https://rarecollectables.co.uk';
    
    if (!PAYSTACK_SECRET_KEY) {
      console.error('Paystack secret key is not configured');
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'Payment system is not properly configured' })
      };
    }

    // Log the request (mask sensitive data)
    console.log('Initializing Paystack payment:', {
      email: email,
      amount: amount,
      reference: reference || 'Auto-generated',
      metadata: metadata || {}
    });

    // Initialize Paystack transaction
    const response = await axios({
      method: 'post',
      url: 'https://api.paystack.co/transaction/initialize',
      headers: {
        'Authorization': `Bearer ${PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json'
      },
      data: {
        email: email,
        amount: amount, // amount in kobo
        reference: reference || undefined, // Use undefined to let Paystack generate a reference
        currency: 'NGN',
        // Ensure Paystack redirects back to our success page to complete verification & email
        callback_url: `${SITE_URL.replace(/\/$/, '')}/checkout-success`,
        metadata: metadata || {}
      }
    });

    // Return the authorization URL and access code
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        data: {
          authorizationUrl: response.data.data.authorization_url,
          accessCode: response.data.data.access_code,
          reference: response.data.data.reference
        }
      })
    };
  } catch (error) {
    console.error('Error initializing Paystack payment:', error);
    
    // Return detailed error information
    return {
      statusCode: error.response?.status || 500,
      headers,
      body: JSON.stringify({
        error: 'Failed to initialize payment',
        details: error.response?.data || error.message
      })
    };
  }
};
