import axios from 'axios';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  const { reference } = req.body;
  
  if (!reference) {
    return res.status(400).json({ success: false, message: 'Reference is required' });
  }

  try {
    const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;
    
    if (!PAYSTACK_SECRET_KEY) {
      console.error('Paystack secret key is not configured');
      return res.status(500).json({ success: false, message: 'Server configuration error' });
    }

    // Verify the payment with Paystack
    const response = await axios.get(
      `https://api.paystack.co/transaction/verify/${reference}`,
      {
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const { status, data } = response.data;

    if (status === true && data.status === 'success') {
      // Payment was successful
      return res.status(200).json({
        success: true,
        message: 'Payment verified successfully',
        data: {
          amount: data.amount / 100, // Convert from kobo to naira
          currency: data.currency,
          transactionDate: data.transaction_date,
          customer: data.customer,
          metadata: data.metadata,
          reference: data.reference,
          status: data.status,
        },
      });
    } else {
      return res.status(400).json({
        success: false,
        message: data.message || 'Payment verification failed',
      });
    }
  } catch (error) {
    console.error('Error verifying Paystack payment:', error);
    
    // Handle specific error cases
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error('Paystack API error response:', error.response.data);
      return res.status(error.response.status || 500).json({
        success: false,
        message: error.response.data.message || 'Error verifying payment',
      });
    } else if (error.request) {
      // The request was made but no response was received
      console.error('No response from Paystack API');
      return res.status(503).json({
        success: false,
        message: 'Could not connect to payment processor',
      });
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error('Error setting up payment verification:', error.message);
      return res.status(500).json({
        success: false,
        message: 'Error processing payment verification',
      });
    }
  }
}
