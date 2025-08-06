import React, {useEffect, useState} from 'react';
import {
  Elements,
  ExpressCheckoutElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import {loadStripe} from '@stripe/stripe-js';
import {View, Text, ActivityIndicator, Alert} from 'react-native';
import {trackEvent} from '../../lib/trackEvent';

// Load Stripe with additional configuration to allow cross-origin frame access
// Use environment variable for the publishable key instead of hardcoding
const STRIPE_PUBLISHABLE_KEY = process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY;

if (!STRIPE_PUBLISHABLE_KEY) {
  console.warn('Stripe publishable key is missing. Payment functionality may not work properly.');
}

const stripePromise = loadStripe(
  STRIPE_PUBLISHABLE_KEY,
  {
    stripeAccount: undefined, // Use undefined for your own account
    apiVersion: '2023-10-16', // Use the latest API version
    locale: 'en', // Set the locale
  }
);

const CheckoutForm = ({clientSecret}) => {
  const options = {
    mode: 'payment',
    amount: 1099, // MUST match your PaymentIntent's amount
    currency: 'usd', // MUST match your PaymentIntent's currency
  };

  return (
    <Elements stripe={stripePromise} options={options}>
      <MultiPaymentExpressCheckoutComponent clientSecret={clientSecret} />
    </Elements>
  );
};

const MultiPaymentExpressCheckoutComponent = ({clientSecret}) => {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!stripe || !elements) {
      console.warn('Stripe.js or Elements not fully loaded yet.');
    }
  }, [stripe, elements]);

  // Track when express checkout option is clicked
  const handleExpressCheckoutClick = (paymentMethod) => {
    // Track with internal tracking system
    trackEvent({
      eventType: 'express_checkout_click',
      metadata: {
        payment_method: paymentMethod
      }
    });
  };
  const handleConfirmPayment = async event => {
    if (!stripe || !elements || !clientSecret) {
      Alert.alert('Error', 'Stripe not initialized or client secret missing.');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const {error, paymentIntent} = await stripe.confirmPayment({
        elements,
        clientSecret,
        confirmParams: {
          return_url: window.location.origin + '/payment-success', // Your post-payment success URL
        },
      });

      if (error) {
        setMessage(`Payment failed: ${error.message}`);
        Alert.alert('Payment Failed', error.message);
      } else if (paymentIntent.status === 'succeeded') {
        setMessage('Payment succeeded!');
        Alert.alert('Payment Succeeded', 'Your payment was successful!');
        // Redirect or update UI for success
      }
    } catch (err) {
      setMessage(`An unexpected error occurred: ${err.message}`);
      Alert.alert('Error', `An unexpected error occurred: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{padding: 20}}>
      <Text style={{fontSize: 18, marginBottom: 15}}>
        Pay with one of these options:
      </Text>
      <ExpressCheckoutElement
        options={{
          // By omitting 'wallets: { ... : "never" }' for Apple Pay, Google Pay,
          // they will show up if enabled in Dashboard and supported by the user's browser/device.
          // PayPal will also show up if enabled in Dashboard and PaymentIntent.
          buttonType: {
            // applePay: 'buy', // Customize button text for Apple Pay
            // googlePay: 'buy', // Customize button text for Google Pay
            paypal: 'paypal', // Customize button text for PayPal
            // link: 'auto', // You can explicitly set 'auto' or 'never' for Link
          },
          buttonTheme: {
            applePay: 'black',
            googlePay: 'black',
            paypal: 'gold',
            link: 'light',
          },
          //   If you want to force specific wallets to show/hide, you can still use:
          wallets: {
            applePay: 'never', // or 'never'
            googlePay: 'never', // or 'never'
            link: 'never', // or 'never'
            amazonPay: 'never', // To explicitly hide Amazon Pay
          },
          // Add onClick handler to track when express checkout options are clicked
          onClick: (event) => {
            handleExpressCheckoutClick(event.paymentMethod);
          },
        }}
        onConfirm={handleConfirmPayment}
      />
      {loading && (
        <ActivityIndicator
          size="small"
          color="#0000ff"
          style={{marginTop: 10}}
        />
      )}
      {message && (
        <Text
          style={{
            marginTop: 10,
            color: message.includes('failed') ? 'red' : 'green',
          }}>
          {message}
        </Text>
      )}
    </View>
  );
};

export default CheckoutForm;
