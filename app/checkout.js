import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  ActivityIndicator,
  ScrollView,
  Platform,
  Dimensions,
  Alert,
  Linking,
  Image,
} from 'react-native';
import PaymentMethodsRow from './(components)/PaymentMethodsRow';
import {useStore} from '../context/store';
// import { PRODUCTS } from './(data)/products';
import {fetchProductsShipping} from '../lib/supabase/products';
import {getGuestSession} from '../lib/supabase/client';
import {checkoutAttemptService} from '../lib/supabase/services';
import {z} from 'zod';
import {storeOrder} from './components/orders-modal';
import {trackEvent} from '../lib/trackEvent';
import {colors, fontFamily, spacing, borderRadius, shadows} from '../theme';
import ConfirmationModal from './components/ConfirmationModal';
import {useRouter} from 'expo-router';
import {
  CardElement,
  useElements,
  useStripe,
  Elements,
  ExpressCheckoutElement,
  PaymentElement,
  PaymentRequestButtonElement,
} from '@stripe/react-stripe-js';
import {loadStripe} from '@stripe/stripe-js';
import Constants from 'expo-constants';
import CollapsibleSection from './components/CollapsibleSection';
import {FontAwesome} from '@expo/vector-icons';
import {AnimatedButton, FadeIn, SlideIn} from './components/MicroInteractions';
// import CheckoutForm from './components/CheckoutForm';
// Stripe keys from env - try multiple sources
// Use dynamic key resolution based on environment
const STRIPE_PUBLISHABLE_KEY =
  process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY ||
  Constants?.expoConfig?.extra?.STRIPE_PUBLISHABLE_KEY ||
  Constants?.manifest?.extra?.STRIPE_PUBLISHABLE_KEY ||
  // Fallback to test key for local development only
  (process.env.NODE_ENV === 'development'
    ? 'pk_live_51R4UAfD5NhzI6POJJaI3Hbn2S2bD7bH1tYoqYdbo4K0UVWy3cKdXkJRCzIB4UYon2menBLMdddM9KsFpcSU40c7L00o50h13fi'
    : null);

// If no key is found, log an error
if (!STRIPE_PUBLISHABLE_KEY) {
  console.error(
    'No Stripe publishable key found. Payment functionality will not work.',
  );
}

// const NETLIFY_STRIPE_FUNCTION_URL =
//   'http://localhost:4242/create-checkout-session';
const isProd = process.env.NODE_ENV === 'development';

const NETLIFY_STRIPE_FUNCTION_URL =
  // isProd ?
  'https://rarecollectables.co.uk/.netlify/functions/create-checkout-session';
// :
// 'http://localhost:4242/create-checkout-session';

// const NETLIFY_STRIPE_FUNCTION_URL =
//   'https://rarecollectables.co.uk/.netlify/functions/create-checkout-session';

const NETLIFY_STRIPE_CREATE_PAYMENT_FUNCTION_URL =
  'https://rarecollectables.co.uk/.netlify/functions/create-payment-intent';

// Log Stripe key status for debugging (without revealing the full key)
console.log('Checking Stripe key sources:');
console.log(
  '- process.env:',
  process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY ? 'Available' : 'Missing',
);
console.log(
  '- Constants.expoConfig:',
  Constants?.expoConfig?.extra?.STRIPE_PUBLISHABLE_KEY
    ? 'Available'
    : 'Missing',
);
console.log(
  '- Constants.manifest:',
  Constants?.manifest?.extra?.STRIPE_PUBLISHABLE_KEY ? 'Available' : 'Missing',
);
console.log(
  'Final Stripe publishable key status:',
  STRIPE_PUBLISHABLE_KEY
    ? `Available (starts with: ${STRIPE_PUBLISHABLE_KEY.substring(0, 7)}...)`
    : 'MISSING - Please add EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY to your .env file',
);

const contactSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  email: z.string().email('Enter a valid email'),
});
const ukPostcodeRegex = /^(GIR 0AA|[A-Z]{1,2}\d[A-Z\d]? ?\d[A-Z]{2})$/i;
const addressSchema = z.object({
  line1: z.string().min(3, 'Address required'),
  city: z.string().min(2, 'City required'),
  postcode: z
    .string()
    .min(5, 'Postcode required')
    .max(8, 'Postcode too long')
    .regex(ukPostcodeRegex, 'Enter a valid UK postcode (e.g., SW1A 1AA)'),
});

export default function CheckoutScreen() {
  const router = useRouter();
  // Coupon state (must be defined before use)
  const [coupon, setCoupon] = useState('');
  const [couponStatus, setCouponStatus] = useState(null); // { valid: bool, discount: {type, value}, error }
  const [applyingCoupon, setApplyingCoupon] = useState(false);

  const {cart, removeFromCart} = useStore();
  const [contact, setContact] = useState({name: '', email: ''});
  const [address, setAddress] = useState({line1: '', city: '', postcode: ''});
  // Debounce timer for logging checkout attempts
  const [debounceTimer, setDebounceTimer] = useState(null);
  const [errors, setErrors] = useState({});
  const [stripeLoading, setStripeLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [stripe, setStripe] = useState(null);
  const [clientSecret, setClientSecret] = useState('');
  const [stripeError, setStripeError] = useState(null);
  const [confirmationOpen, setConfirmationOpen] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(null);
  const [paymentRequest, setPaymentRequest] = useState(null);
  const [canUsePaymentRequest, setCanUsePaymentRequest] = useState(false);
  // Check if we're on desktop (width > 768px)
  const [isDesktop, setIsDesktop] = useState(false);
  // const stripePromise = loadStripe(
  //   'pk_test_51NXgqJFuJhKOEDQxYKlOmh9qoNIY9RvnMNnWbiIuRNQ1VqA0wPLxsL8jFWwRmKvNj1YwGpL8s1OlZnwbUZAtj2Vv00zysCLzSJ',
  // );

  // const [reservationMinutes, setReservationMinutes] = useState(8);
  // const [reservationSeconds, setReservationSeconds] = useState(32);


  // useEffect(() => {
  //   // Track when user views the checkout page
  //   // trackEvent('checkout_view', {});
  //   // Track when user proceeds to checkout (from cart) d
  //   // trackEvent('proceed_to_checkout', {items: cart.length, cart: cart});

  //   // Initialize Stripe
  //   const initializeStripe = async () => {
  //     if (!STRIPE_PUBLISHABLE_KEY) {
  //       setStripeError(
  //         'Stripe configuration is missing. Please contact support.',
  //       );
  //       setStripeLoading(false);
  //       return;
  //     }

  //     try {
  //       const stripeInstance = await stripePromise;
  //       setStripe(stripeInstance);
  //     } catch (error) {
  //       console.error('Error initializing Stripe:', error);
  //       setStripeError(
  //         'Could not initialize payment system. Please try again later.',
  //       );
  //     } finally {
  //       setStripeLoading(false);
  //     }
  //   };

  //   initializeStripe();

  //   // Start reservation timer
  //   const timerInterval = setInterval(() => {
  //     setReservationSeconds(prev => {
  //       if (prev === 0) {
  //         if (reservationMinutes === 0) {
  //           clearInterval(timerInterval);
  //           return 0;
  //         }
  //         // Use a callback to avoid dependency on reservationMinutes
  //         setReservationMinutes(prevMinutes => prevMinutes - 1);
  //         return 59;
  //       }
  //       return prev - 1;
  //     });
  //   }, 1000);

  //   return () => clearInterval(timerInterval);
  // }, []);

  const NETLIFY_STRIPE_CREATE_PAYMENT_FUNCTION_URL =
    // isProd?
    'https://rarecollectables.co.uk/.netlify/functions/create-payment-intent';
  // :
  // 'http://localhost:4242/create-payment-intent';

  const paymentintent = async () => {
    trackEvent({
      eventType: 'begin_checkout',
      items: cart.map(item => ({
        id: item.id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        image_url: item.image_url,
      })),
      value: total,
      currency: 'GBP',
      metadata: {coupon},
    });

    const shipping = {
      name: contact.name || 'Customer', // Stripe requires a name
      address: {
        line1: address.line1,
        city: address.city,
        postal_code: address.postcode,
        country: 'GB', // optional but highly recommended
      },
    };

    // const shipping = {
    //   line1: address.line1,
    //   city: address.city,
    //   postcode: address.postcode,
    // };

    const requestBody = {
      cart,
      customer_email: contact.email,
      email: contact.email,
      contact_name: contact.name,
      amount: Math.round((total - discountAmount + shippingCost) * 100),
      shipping: shipping,
      coupon: coupon || null,
      discountAmount: discountAmount || 0,
      automatic_payment_methods: {enabled: true},
      // payment_method_types: paymentMethodTypes, // optional
    };

    const response = await fetch(NETLIFY_STRIPE_CREATE_PAYMENT_FUNCTION_URL, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(requestBody),
      // body: JSON.stringify({
      //   cart,
      //   customer_email: contact.email,
      //   email: contact.email,
      //   contact_name: contact.name,
      //   // amount: total * 100,
      //   amount: Math.round((total - discountAmount + shippingCost) * 100),
      //   shipping: shipping,
      //   // billing_address: billing,
      //   coupon: coupon || null,
      //   discountAmount: discountAmount || 0,
      //   automatic_payment_methods: {enabled: true},
      //   // payment_method_types: paymentMethodTypes, // 👈 send dynamic method
      // }),
    });
    console.log('====================================');
    console.log('requestBody', requestBody);
    console.log('====================================');
    const data = await response.json();
    console.log('Payment intent response:', data);
    if (data.clientSecret) {
      setClientSecret(data.clientSecret);
      setStripeLoading(false);
      // For analytics - track payment form view
      trackEvent({eventType: 'view_payment_form'});
    } else {
      setStripeError(
        'Failed to create payment intent. Please try again later.',
      );
      setStripeLoading(false);
    }
  };
  useEffect(() => {
    paymentintent();
    // Call your backend to create a PaymentIntent
  }, []);
  // Update isDesktop state when window size changes
  useEffect(() => {
    const updateLayout = () => {
      setIsDesktop(Dimensions.get('window').width > 768);
    };

    // Set initial value
    updateLayout();

    // Add event listener for window resize
    if (typeof window !== 'undefined') {
      Dimensions.addEventListener('change', updateLayout);
    }

    return () => {
      if (typeof window !== 'undefined') {
        // Clean up
        Dimensions.removeEventListener?.('change', updateLayout);
      }
    };
  }, []);

  // Called after successful payment
  const handleCheckoutSuccess = email => {
    setConfirmationOpen(true);
    setTimeout(() => {
      router.push({
        pathname: '/checkout-success',
        params: {email: email},
      });
    }, 1500);
  };

  // Called when user closes modal or continues shopping
  const handleContinueShopping = () => {
    setConfirmationOpen(false);
    router.replace('/(tabs)/shop'); // Redirect to shop tab after order success
  };

  useEffect(() => {
    // Track when user views the checkout page
    trackEvent({eventType: 'checkout_view'});
    // Track when user proceeds to checkout (from cart)
    trackEvent({
      eventType: 'proceed_to_checkout',
      items: cart.length,
      metadata: {cart},
    });
    const initializeStripe = async () => {
      try {
        setStripeLoading(true);
        setStripeError(null);
        if (!STRIPE_PUBLISHABLE_KEY) {
          setStripeError(
            'Stripe publishable key is missing. Please check your environment configuration.',
          );
          return;
        }
        const stripeInstance = await loadStripe(STRIPE_PUBLISHABLE_KEY);
        if (stripeInstance) setStripe(stripeInstance);
        else
          setStripeError(
            'Failed to initialize Stripe. Please check your publishable key and network connection.',
          );
      } catch (error) {
        setStripeError(
          'Failed to initialize Stripe: ' + (error.message || error),
        );
      } finally {
        setStripeLoading(false);
      }
    };
    initializeStripe();
  }, []);

  // Create payment intent when contact and address are filled - only run once when component mounts
  useEffect(() => {
    console.log('Payment intent creation conditions:', {
      hasCart: cart.length > 0,
      hasEmail: Boolean(contact.email),
      hasAddress: Boolean(address.line1),
      hasStripe: Boolean(stripe),
      hasNoClientSecret: !clientSecret,
    });

    // Create a new payment intent only when we have Stripe loaded, cart items, and user contact info
    if (stripe && cart.length > 0 && contact.email && address.line1) {
      const createPaymentIntent = async () => {
        try {
          setStripeLoading(true);
          console.log('Creating new payment intent');

          // Only use actual user data, no fallbacks
          const paymentData = {
            cart,
            contact,
            address,
            coupon: couponStatus?.valid ? coupon : null,
            discountAmount: discountAmount || 0,
          };

          const response = await fetch(NETLIFY_STRIPE_FUNCTION_URL, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(paymentData),
          });

          if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Server error (${response.status}): ${errorText}`);
          }

          const data = await response.json();

          if (data.clientSecret) {
            console.log('Client secret received successfully');
            setClientSecret(data.clientSecret);
            setStripeLoading(false);

            // For analytics - track payment form view
            trackEvent({eventType: 'view_payment_form'});
          } else {
            throw new Error('No client secret in server response');
          }
        } catch (err) {
          console.error('Error creating payment intent:', err);
          setStripeError(
            'Could not initialize payment: ' + (err.message || err),
          );
          setStripeLoading(false);
        }
      };

      // Only create a new client secret if we don't have one yet
      if (!clientSecret) {
        createPaymentIntent();
      }
    }
  }, [stripe, cart, clientSecret]);

  // This section was commented out as we're now handling payment intent creation in the useEffect above

  const handleInputChange = (type, field, value) => {
    // Compute the next state for contact and address
    let nextContact = contact;
    let nextAddress = address;

    if (type === 'contact') {
      nextContact = {...contact, [field]: value};
      setContact(nextContact);
    } else if (type === 'address') {
      nextAddress = {...address, [field]: value};
      setAddress(nextAddress);
    }
    // Debounced log to Supabase with the latest state
    if (debounceTimer) clearTimeout(debounceTimer);
    setDebounceTimer(
      setTimeout(async () => {
        try {
          const guest_session_id = await getGuestSession();
          const payload = {
            guest_session_id,
            email:
              type === 'contact' && field === 'email'
                ? value
                : nextContact.email,
            contact: nextContact,
            address: nextAddress,
            cart,
            status: 'started',
            metadata: {},
          };
          console.log('[CHECKOUT_ATTEMPT_PAYLOAD]', payload);
          await checkoutAttemptService.upsertAttempt(payload);
        } catch (e) {
          console.error('Checkout attempt logging failed:', e);
        }
      }, 600),
    );
  };

  // Coupon validation handler
  const handleApplyCoupon = async () => {
    if (!coupon) return;
    setApplyingCoupon(true);
    setCouponStatus(null);
    try {
      const response = await fetch('/.netlify/functions/validate-coupon', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({coupon}),
      });
      const data = await response.json();

      if (response.ok && data.valid) {
        setCouponStatus({
          valid: true,
          discount: data.discount,
          promo: data.promo,
        });

        // ✅ Recalculate total and recreate PaymentIntent
        const newDiscountAmount =
          data.discount.type === 'percent'
            ? subtotal * (data.discount.value / 100)
            : data.discount.value;

        const updatedTotal = Math.max(
          0,
          subtotal - newDiscountAmount + shippingCost,
        );

        const shipping = {
          name: contact.name || 'Customer',
          address: {
            line1: address.line1,
            city: address.city,
            postal_code: address.postcode,
            country: 'GB',
          },
        };

        const requestBody = {
          cart,
          customer_email: contact.email,
          contact_name: contact.name,
          amount: Math.round(updatedTotal * 100),
          shipping,
          coupon: coupon,
          discountAmount: newDiscountAmount,
          automatic_payment_methods: {enabled: true},
        };

        const intentResponse = await fetch(
          NETLIFY_STRIPE_CREATE_PAYMENT_FUNCTION_URL,
          {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(requestBody),
          },
        );

        const intentData = await intentResponse.json();
        if (intentData.clientSecret) {
          setClientSecret(intentData.clientSecret);
          setStripeLoading(false);
          trackEvent({eventType: 'view_payment_form'});
        } else {
          setStripeError('Failed to update payment intent.');
        }
      } else {
        setCouponStatus({
          valid: false,
          error: data.error || 'Invalid or expired coupon code.',
        });
      }
    } catch (err) {
      setCouponStatus({
        valid: false,
        error: err.message || 'Failed to validate coupon.',
      });
    } finally {
      setApplyingCoupon(false);
    }
  };
  
  // const handleApplyCoupon = async () => {
  //   if (!coupon) return;
  //   setApplyingCoupon(true);
  //   setCouponStatus(null);
  //   try {
  //     const response = await fetch('/.netlify/functions/validate-coupon', {
  //       method: 'POST',
  //       headers: {'Content-Type': 'application/json'},
  //       body: JSON.stringify({coupon}),
  //     });
  //     const data = await response.json();
  //     if (response.ok && data.valid) {
  //       setCouponStatus({
  //         valid: true,
  //         discount: data.discount,
  //         promo: data.promo,
  //       });
  //     } else {
  //       setCouponStatus({
  //         valid: false,
  //         error: data.error || 'Invalid or expired coupon code.',
  //       });
  //     }
  //   } catch (err) {
  //     setCouponStatus({
  //       valid: false,
  //       error: err.message || 'Failed to validate coupon.',
  //     });
  //   } finally {
  //     setApplyingCoupon(false);
  //   }
  // };
  

  const validateForm = () => {
    const contactErrors = {};
    const addressErrors = {};
    const paymentErrors = [];

    try {
      contactSchema.parse(contact);
    } catch (error) {
      if (error.errors)
        error.errors.forEach(err => {
          contactErrors[err.path[0]] = err.message;
        });
    }
    // try { addressSchema.parse(address); } catch (error) {
    //   if (error.errors) error.errors.forEach(err => { addressErrors[err.path[0]] = err.message; });
    // }

    // We no longer require clientSecret to be set before proceeding
    // This allows the payment form to be shown and used immediately
    // The clientSecret will be created during payment processing if needed

    setErrors({
      contact: Object.values(contactErrors),
      address: Object.values(addressErrors),
      payment: paymentErrors,
    });

    return (
      Object.keys(contactErrors).length === 0 &&
      Object.keys(addressErrors).length === 0 &&
      paymentErrors.length === 0
    );
  };

  // Shipping selection: 'free' or 'next_day'
  // const [shippingOption, setShippingOption] = useState('free');
  const [shippingOption, setShippingOption] = useState('standard');
  const [shippingCost, setShippingCost] = useState(0); // Free shipping by default
  // Dynamic shipping eligibility from Supabase
  const [shippingLoading, setShippingLoading] = useState(false);
  const [allNextDayEligible, setAllNextDayEligible] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const fetchShipping = async () => {
      if (cart.length === 0) {
        setAllNextDayEligible(false);
        return;
      }
      setShippingLoading(true);
      try {
        const shippingData = await fetchProductsShipping(
          cart.map(item => item.id),
        );
        if (!cancelled) {
          const eligible =
            shippingData.length > 0 &&
            shippingData.every(
              product => product.shipping_label === 'next_day',
            );
          setAllNextDayEligible(eligible);
        }
      } catch (e) {
        if (!cancelled) setAllNextDayEligible(false);
      } finally {
        if (!cancelled) setShippingLoading(false);
      }
    };
    fetchShipping();
    return () => {
      cancelled = true;
    };
  }, [cart]);

  const SHIPPING_OPTIONS = [
    {key: 'free', label: 'Free Shipping (2-4 business days)', cost: 0},
    ...(allNextDayEligible
      ? [{key: 'next_day', label: 'Next Day Delivery (£3.99)', cost: 3.99}]
      : []),
  ];

  const subtotal = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );
  let discountAmount = 0;
  if (couponStatus?.valid && couponStatus.discount) {
    if (couponStatus.discount.type === 'percent') {
      discountAmount = subtotal * (couponStatus.discount.value / 100);
    } else if (couponStatus.discount.type === 'amount') {
      discountAmount = couponStatus.discount.value;
    }
  }
  // Calculate shipping cost
  // const shippingCost = SHIPPING_OPTIONS.find(opt => opt.key === shippingOption)?.cost || 0;
  const total = Math.max(0, subtotal - discountAmount + shippingCost);

  if (stripeLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.gold} />
        <Text style={styles.loadingText}>Loading secure payment form...</Text>
      </View>
    );
  }
  if (stripeError) {
    return (
      <ScrollView contentContainerStyle={styles.container}>
        <Pressable
          style={{
            alignSelf: 'flex-start',
            marginBottom: 8,
            paddingHorizontal: 0,
            paddingVertical: 2,
          }}
          onPress={() => router.push('/cart')}
          accessibilityLabel="Back to cart"
          accessibilityRole="link">
          <Text
            style={{
              color: colors.gold,
              fontSize: 15,
              textDecorationLine: 'underline',
              fontWeight: '400',
            }}>
            ← Back to Cart
          </Text>
        </Pressable>
        <Text style={styles.header}>Checkout</Text>
        <Text style={styles.errorTitle}>{stripeError}</Text>
        <Text style={styles.errorText}>
          Please contact support or try again later.
        </Text>
      </ScrollView>
    );
  }

  const handleStripeCheckout = async () => {
    if (!validateForm()) return;

    if (
      !contact?.name ||
      !contact?.email
      // !address?.line1 ||
      // !address?.city ||
      // !address?.postcode
    ) {
      setErrors({
        ...errors,
        payment: [
          'Please complete all required contact and shipping information.',
        ],
      });
      return;
    }

    try {
      setPaying(true);

      // 1. Calculate pricing
      const subtotal = cart.reduce(
        (sum, item) => sum + calculateDiscountedPrice(item) * item.quantity,
        0,
      );
      const discountedSubtotal = Math.max(0, subtotal - (discountAmount || 0));
      const shippingFee = shippingOption === 'express' ? 4.99 : 0;
      const total = discountedSubtotal + shippingFee;
      // const total = Math.max(0, discountedSubtotal);

      console.log('Payment calculation:', {
        subtotal,
        discountAmount: discountAmount || 0,
        discountedSubtotal,
        total,
      });

      // 2. Track checkout initiation
      trackEvent({
        eventType: 'begin_checkout',
        items: cart.map(item => ({
          id: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          image_url: item.image_url,
        })),
        value: total,
        currency: 'GBP',
        metadata: {coupon},
      });

      // 3. Define shipping/billing data
      const shipping = {
        line1: address.line1,
        city: address.city,
        postcode: address.postcode,
      };


      // 4. Call Netlify function
      const response = await fetch(NETLIFY_STRIPE_FUNCTION_URL, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          cart,
          contact,
          address,
          shipping_address: shipping,
          coupon: coupon || null, // Send the coupon directly if it exists
          discountAmount: discountAmount || 0, // Pass the discount amount to the server
          selected_payment_method: selectedPaymentMethod,
          deliveryType: shippingOption, // 👈 NEW: "express" or "standard"
          deliveryCost: shippingFee, // 👈 NEW: numeric value (e.g. 4.99)
          payment_method_types: [
            'card',
            'link',
            'afterpay_clearpay',
            'klarna',
            'revolut_pay',
            'amazon_pay',
            'paypal', // optional if available in your country
          ],
          // payment_method_types: paymentMethodTypes,
        }),
        // body: JSON.stringify({
        //   cart,
        //   customer_email: contact.email,
        //   email: contact.email,
        //   contact_name: contact.name,
        //   shipping_address: shipping,
        //   // billing_address: billing,
        //   coupon: coupon || null,
        //   discountAmount: discountAmount || 0,
        //   // automatic_payment_methods: {enabled: true},
        //   payment_method_types: paymentMethodTypes, // 👈 send dynamic method
        // }),
      });

      const data = await response.json();
      console.log('Stripe checkout session response:', data);
      if (data.url) {
        // 5. Store order locally before redirect
        const orderDate = new Date();
        const orderNumber = `ORD-${orderDate.getFullYear()}${String(
          orderDate.getMonth() + 1,
        ).padStart(2, '0')}${String(orderDate.getDate()).padStart(
          2,
          '0',
        )}-${Math.floor(1000 + Math.random() * 9000)}`;

        const orderData = {
          id: orderNumber,
          date: orderDate.toISOString(),
          items: cart,
          contact,
          address,
          // billing,
          total,
          discount: discountAmount || 0,
          coupon: coupon || null,
          paymentIntentId: null,
          status: 'pending',
        };

        await storeOrder(orderData, contact.email);

        // 6. Optional: send confirmation email
        try {
          const emailResponse = await fetch(
            '/.netlify/functions/sendConfirmationEmail',
            {
              method: 'POST',
              headers: {'Content-Type': 'application/json'},
              body: JSON.stringify({
                to: contact.email,
                order: {
                  order_number: orderNumber,
                  amount: total * 100,
                  quantity: cart.reduce((sum, item) => sum + item.quantity, 0),
                  created_at: orderDate.toISOString(),
                  shipping_address: address,
                  product_image: cart[0]?.image_url || null,
                },
              }),
            },
          );

          if (!emailResponse.ok) {
            console.warn(
              'Confirmation email failed:',
              await emailResponse.text(),
            );
          } else {
            console.log('Confirmation email sent');
          }
        } catch (err) {
          console.warn('Email sending failed', err);
        }

        // 7. Redirect to Stripe-hosted checkout
        window.location.href = data.url;
        // handleCheckoutSuccess()
      } else {
        throw new Error('Stripe did not return a checkout URL.');
      }
    } catch (error) {
      console.error('Checkout error:', error);
      setErrors({...errors, payment: [error.message || 'Checkout failed.']});

      trackEvent({
        eventType: 'checkout_payment_failed',
        error: error.message,
        total: cart.reduce((sum, item) => sum + item.price * item.quantity, 0),
        items: cart.length,
        coupon,
      });
    } finally {
      setPaying(false);
    }
  };

  const getDiscountAmount = () => {
    if (!couponStatus?.valid) return 0;

    const subtotal = cart.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0,
    );

    if (couponStatus.discount.type === 'percentage' || 'percent') {
      return (subtotal * couponStatus.discount.value) / 100;
    } else if (couponStatus.discount.type === 'fixed') {
      return couponStatus.discount.value;
    }

    return 0;
  };

  const calculateTotal = () => {
    const subtotal = cart.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0,
    );
    const discount = getDiscountAmount();
    const shipping = shippingOption === 'express' ? 4.99 : 0;

    return (subtotal - discount + shipping).toFixed(2);
  };

  const GooglePayCheckout = ({clientSecret, totalAmount, contact}) => {
    const stripe = useStripe();
    const [paymentRequest, setPaymentRequest] = useState(null);
    const [canUsePaymentRequest, setCanUsePaymentRequest] = useState(false);
    const [loading, setLoading] = useState(true); // ✅ Add loading state

    useEffect(() => {
      if (!stripe) return;

      const initPaymentRequest = async () => {
        setLoading(true); // Start loading
        const pr = stripe.paymentRequest({
          country: 'GB',
          currency: 'gbp',
          total: {
            label: 'Total',
            amount: Math.round(totalAmount * 100),
          },
          requestPayerName: true,
          requestPayerEmail: true,
          requestShipping: true,
          supportedPaymentMethods: [
            {
              supportedMethods: 'google_pay',
              data: {
                environment: 'PRODUCTION',
                merchantInfo: {
                  merchantName: 'Your Business',
                },
                paymentMethodTokenizationParameters: {
                  tokenizationType: 'PAYMENT_GATEWAY',
                  parameters: {
                    gateway: 'stripe',
                    'stripe:publishableKey': STRIPE_PUBLISHABLE_KEY,
                    'stripe:version': '2020-08-27',
                  },
                },
              },
            },
            // Add other methods if needed
          ],
        });

        pr.on('shippingaddresschange', event => {
          event.updateWith({
            status: 'success',
            shippingOptions: [
              {
                id: 'free-shipping',
                label: 'Free Shipping',
                detail: '2–4 business days',
                amount: 0,
              },
              {
                id: 'next-day',
                label: 'Next Day Delivery',
                detail: '1–2 business days',
                amount: 399,
              },
            ],
          });
        });

        pr.on('shippingoptionchange', event => {
          const shippingAmount =
            event.shippingOption.id === 'next-day' ? 399 : 0;
          event.updateWith({
            status: 'success',
            total: {
              label: 'Total',
              amount: Math.round(totalAmount * 100) + shippingAmount,
            },
          });
        });
        

        pr.on('paymentmethod', async event => {
          const {error} = await stripe.confirmCardPayment(clientSecret, {
            payment_method: event.paymentMethod.id,
            shipping: {
              name: contact.name,
              address: {
                line1: address.line1,
                city: address.city,
                postal_code: address.postcode,
                country: 'GB',
              },
            },
            receipt_email: contact.email,
          });

          if (error) {
            event.complete('fail');
            Alert.alert('Payment failed', error.message);
          } else {
            event.complete('success');
            router.push({
              pathname: '/checkout-success',
              params: {email: contact.email},
            });
          }
        });

        const result = await pr.canMakePayment();
        if (result) {
          setPaymentRequest(pr);
          setCanUsePaymentRequest(true);
        } else {
          setCanUsePaymentRequest(false);
        }
        setLoading(false); // ✅ End loading
      };

      initPaymentRequest();
    }, [stripe, clientSecret, totalAmount, contact, address]);

    return (
      <>
        {loading ? (
          <ActivityIndicator size="large" color={colors.gold} />
        ) : canUsePaymentRequest && paymentRequest ? (
          <PaymentRequestButtonElement
            options={{paymentRequest}}
            style={{
              paymentRequestButton: {
                type: 'buy',
                theme: 'dark',
                height: '45px',
              },
            }}
          />
        ) : (
          <></>
          // <Text>
          //   Payment Request API (Apple/Google Pay) not available on this device
          // </Text>
        )}
      </>
    );
  };
  

  const showAlert = (title, message) => {
    if (Platform.OS === 'web') {
      window.alert(`${title}\n\n${message}`);
    } else {
      Alert.alert(title, message);
    }
  };

  const CheckoutForm = (
    // clientSecret,
    // total,
    // discountAmount,
    // shippingCost,
 ) => {
   
  const updatedTotal = Math.max(0, subtotal - discountAmount + shippingCost);

  const options = {
    // clientSecret,
    mode: 'payment',
    amount: Math.max(50, Math.round(updatedTotal * 100)), // Minimum £0.50 or 50p
    currency: 'gbp',
    appearance: {
      theme: 'stripe',
    },
  };

    return (
      <Elements stripe={stripe} options={options}>
        <MultiPaymentExpressCheckoutComponent />
      </Elements>
    );
  };

  
  const MultiPaymentExpressCheckoutComponent = () => {
    const stripe = useStripe();
    const elements = useElements();
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');

    useEffect(() => {
      if (!stripe || !elements) {
        console.warn('Stripe.js or Elements not fully loaded yet.');
      }
    }, [stripe, elements]);

    const handleConfirmPayment = async () => {
      if (!stripe || !elements) {
        alert('Stripe has not loaded yet.');
        return;
      }

      try {
        setLoading(true);
        const result = await stripe.confirmPayment({
          clientSecret,
          elements,
          confirmParams: {
            // return_url: 'https://rarecollectables.co.uk/checkout-success',
            return_url: `${window.location.origin}/checkout-success`,
          },
          redirect: 'if_required',
        });

        if (result.error) {
          console.error('Payment failed:', result.error.message);
          setMessage(`Payment failed: ${result.error.message}`);
          // showAlert('Payment failed', result.error.message);
        } else if (result.paymentIntent) {
          const {status} = result.paymentIntent;
          if (status === 'succeeded') {
            setMessage('Payment successful!');
            // showAlert('Success', 'Payment successful!');
            router.push({
              pathname: '/checkout-success',
              params: {email: contact.email},
            });
          } else {
            setMessage(`Payment status: ${status}`);
          }
        } else {
          setMessage('Unknown response');
        }
      } catch (error) {
        console.error('Payment exception:', error);
        setMessage('Payment exception occurred.');
      } finally {
        setLoading(false);
      }
    };

    return (
      <View style={{padding: 20}}>
        <ExpressCheckoutElement
          options={{
            buttonType: {paypal: 'paypal'},
            buttonTheme: {
              paypal: 'gold',
            },
            wallets: {
              applePay: 'never',
              googlePay: 'never',
              link: 'never',
              amazonPay: 'never',
            },
          }}
          onConfirm={handleConfirmPayment}
        />
        {loading && (
          <ActivityIndicator
            size="small"
            color={colors.gold}
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
  


  // const GooglePayCheckout = ({clientSecret, totalAmount, contact, address}) => {
  //   const stripe = useStripe();
  //   const [paymentRequest, setPaymentRequest] = useState(null);
  //   const [canUsePaymentRequest, setCanUsePaymentRequest] = useState(false);

  //   useEffect(() => {
  //     if (!stripe) return;

  //     const initPaymentRequest = async () => {
  //       const pr = stripe.paymentRequest({
  //         country: 'GB', // Or your country
  //         currency: 'gbp', // Use the correct currency
  //         total: {
  //           label: 'Total',
  //           amount: Math.round(totalAmount * 100), // Stripe requires amount in cents
  //         },
  //         requestPayerName: true,
  //         requestPayerEmail: true,
  //         requestShipping: true,
  //         supportedPaymentMethods: [
  //           {
  //             supportedMethods: 'google_pay',
  //             data: {
  //               environment: 'TEST', // Change to PRODUCTION for live
  //               merchantInfo: {
  //                 merchantName: 'Your Business',
  //               },
  //               paymentMethodTokenizationParameters: {
  //                 tokenizationType: 'PAYMENT_GATEWAY',
  //                 parameters: {
  //                   gateway: 'stripe',
  //                   'stripe:publishableKey': STRIPE_PUBLISHABLE_KEY,
  //                   'stripe:version': '2020-08-27',
  //                 },
  //               },
  //             },
  //           },
  //         ],
  //       });

  //       pr.on('shippingaddresschange', event => {
  //         event.updateWith({
  //           status: 'success',
  //           shippingOptions: [
  //             {
  //               id: 'free-shipping',
  //               label: 'Free Shipping',
  //               detail: '2–4 business days',
  //               amount: 0,
  //             },
  //             {
  //               id: 'next-day',
  //               label: 'Next Day Delivery',
  //               detail: '1–2 business days',
  //               amount: 399,
  //             },
  //           ],
  //         });
  //       });

  //       pr.on('shippingoptionchange', event => {
  //         const shippingAmount =
  //           event.shippingOption.id === 'next-day' ? 399 : 0;
  //         event.updateWith({
  //           status: 'success',
  //           total: {
  //             label: 'Total',
  //             amount: Math.round(totalAmount * 100) + shippingAmount,
  //           },
  //         });
  //       });

  //       pr.on('paymentmethod', async event => {
  //         const {error} = await stripe.confirmCardPayment(clientSecret, {
  //           payment_method: event.paymentMethod.id,
  //           shipping: {
  //             name: contact.name,
  //             address: {
  //               line1: address.line1,
  //               city: address.city,
  //               postal_code: address.postcode,
  //               country: 'GB',
  //             },
  //           },
  //           receipt_email: contact.email,
  //         });

  //         if (error) {
  //           event.complete('fail');
  //           Alert.alert('Payment failed', error.message);
  //         } else {
  //           event.complete('success');
  //           router.push({
  //             pathname: '/checkout-success',
  //             params: {email: contact.email},
  //           });
  //         }
  //       });

  //       const result = await pr.canMakePayment();
  //       if (result) {
  //         setPaymentRequest(pr);
  //         setCanUsePaymentRequest(true);
  //       } else {
  //         setCanUsePaymentRequest(false);
  //       }
  //     };

  //     initPaymentRequest();
  //   }, [stripe, clientSecret, totalAmount, contact, address]);

  //   return (
  //     <>
  //       {canUsePaymentRequest && paymentRequest ? (
  //         <PaymentRequestButtonElement
  //           options={{paymentRequest}}
  //           style={{
  //             paymentRequestButton: {
  //               type: 'buy',
  //               theme: 'dark',
  //               height: '45px',
  //             },
  //           }}
  //         />
  //       ) : (
  //         <Text>Google Pay not available on this device</Text>
  //       )}
  //     </>
  //   );
  // };
  

  // Desktop detection was moved to the top of the component

  return (
    <ScrollView
      style={{flex: 1, backgroundColor: colors.white}}
      contentContainerStyle={[
        styles.container,
        {
          flexGrow: 1,
          minHeight: '100vh',
          paddingHorizontal: isDesktop ? 32 : 16,
        },
      ]}
      keyboardShouldPersistTaps="handled">
      <View style={[styles.pageTitle, isDesktop && {alignItems: 'center'}]}>
        <Text style={styles.header}>Checkout</Text>
        <Text style={styles.subHeader}>
          Please fill in your details to complete your order
        </Text>
      </View>
      {/* Trust badges and incentives */}
      <View style={styles.trustBadgesContainer}>
        <View style={styles.trustBadge}>
          <Text style={styles.trustBadgeIcon}>🎁</Text>
          <Text style={styles.trustBadgeText}>Free Premium Packaging</Text>
        </View>
        <View style={styles.trustBadge}>
          <Text style={styles.trustBadgeIcon}>🔒</Text>
          <Text style={styles.trustBadgeText}>Secure Checkout</Text>
        </View>
        <View style={styles.trustBadge}>
          <Text style={styles.trustBadgeIcon}>⚡</Text>
          <Text style={styles.trustBadgeText}>Fast Dispatch</Text>
        </View>
      </View>
      
      {/* Mobile Order Summary - Collapsible */}
      {!isDesktop && (
        <CollapsibleSection
          title={`Order Summary (${cart.length} ${cart.length === 1 ? 'item' : 'items'}) - £${total.toFixed(2)}`}
          initiallyCollapsed={true}>
          <View style={styles.mobileSummaryContainer}>
            {/* Cart Items Summary */}
            <View style={styles.cartItemsContainer}>
              {cart.map((item, index) => (
                <View
                  key={item.id}
                  style={[
                    styles.cartItemRow,
                    index < cart.length - 1 && styles.cartItemBorder,
                  ]}>
                  <View style={styles.cartItemImageContainer}>
                    <Image 
                      source={{ uri: item.image }} 
                      style={styles.cartItemImage} 
                      resizeMode="cover"
                    />
                  </View>
                  <View style={styles.cartItemInfo}>
                    <Text style={styles.cartItemName}>
                      {item.name}
                    </Text>
                    <Text style={styles.cartItemQuantity}>
                      Qty: {item.quantity}
                    </Text>
                  </View>
                  <Text style={styles.cartItemPrice}>
                    £{(item.price * item.quantity).toFixed(2)}
                  </Text>
                </View>
              ))}
            </View>

            <View style={styles.summaryDivider} />
            
            {/* Price Summary */}
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Subtotal</Text>
              <Text style={styles.summaryValue}>£{subtotal.toFixed(2)}</Text>
            </View>
            
            {couponStatus?.valid && discountAmount > 0 && (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Discount</Text>
                <Text style={styles.summaryValue}>-£{discountAmount.toFixed(2)}</Text>
              </View>
            )}
            
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Shipping</Text>
              <Text style={styles.summaryValue}>£{shippingCost.toFixed(2)}</Text>
            </View>
            
            <View style={[styles.summaryRow, styles.totalRow]}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>£{total.toFixed(2)}</Text>
            </View>
            
            {/* Discount Code Field */}
            <View style={styles.mobileCouponContainer}>
              <Text style={styles.mobileCouponLabel}>Have a discount code?</Text>
              <View style={styles.mobileCouponInputRow}>
                <TextInput
                  style={styles.mobileCouponInput}
                  placeholder="Enter coupon code"
                  value={coupon}
                  onChangeText={setCoupon}
                  autoCapitalize="characters"
                  autoCorrect={false}
                  placeholderTextColor={colors.platinum}
                />
                <Pressable
                  style={({pressed}) => [
                    styles.mobileCouponButton,
                    applyingCoupon && styles.checkoutButtonDisabled,
                    pressed && !applyingCoupon && {opacity: 0.93},
                  ]}
                  onPress={handleApplyCoupon}
                  disabled={applyingCoupon}
                  accessibilityRole="button"
                  accessibilityLabel="Apply Coupon">
                  <Text style={styles.mobileCouponButtonText}>
                    {applyingCoupon ? 'Applying...' : 'Apply'}
                  </Text>
                </Pressable>
              </View>
              
              {/* Coupon Status Message */}
              {couponStatus && (
                <Text 
                  style={[
                    styles.mobileCouponStatus,
                    couponStatus.valid ? styles.mobileCouponValid : styles.mobileCouponError
                  ]}
                >
                  {couponStatus.valid 
                    ? `Coupon applied: ${coupon.toUpperCase()} ${couponStatus.discount.type === 'percent' 
                      ? `(${couponStatus.discount.value}% off)` 
                      : `(-£${couponStatus.discount.value.toFixed(2)})`}`
                    : couponStatus.error
                  }
                </Text>
              )}
            </View>
          </View>
        </CollapsibleSection>
      )}
      
      {/* <View style={[styles.leftColumn, isDesktop && styles.leftColumnDesktop]}>
        Order Reservation Timer
        <View style={styles.reservationTimerContainer}>
          <Text style={styles.reservationTimerText}>
            <FontAwesome name="clock-o" size={16} color={colors.gold} /> Your
            order is reserved for {reservationMinutes}:
            {reservationSeconds < 10
              ? `0${reservationSeconds}`
              : reservationSeconds}{' '}
            minutes
          </Text>
        </View>
      </View> */}
      <View style={styles.Expresscontainer}>
        <Text style={styles.Expresstitle}>Express checkout</Text>
        {clientSecret && (
          <Elements
            stripe={stripe}
            options={{
              clientSecret,
              appearance: {
                theme: 'stripe',
                variables: {
                  colorPrimary: '#000', // Optional customization
                },
                // You can customize layout here if needed
              },
              layout: 'tabs', // optional layout mode: 'tabs' or 'accordion' (for Stripe hosted options)
            }}>
            <GooglePayCheckout
              clientSecret={clientSecret}
              totalAmount={total} // calculated dynamically already
              contact={contact}
              address={address}
            />
            <CheckoutForm
              clientSecret={clientSecret}
              total={total}
              // discountAmount={discountAmount}
              // shippingCost={shippingCost}
            />
            {/* <GooglePayCheckout clientSecret={clientSecret} /> */}
            {/* <ExpressCheckoutElement
            // onChange={event => {
            //   setSelectedPaymentMethod(event.value.type);
            //   console.log('Selected method:', event.value.type);
            // }}
            /> */}
            {/* <Pressable onPress={() => handleStripeCheckout()}>
                <Text>Pay Now</Text>
              </Pressable> */}
          </Elements>
        )}
      </View>
      <View style={styles.orDivider}>
        <View style={styles.dividerLine} />
        <Text style={styles.orText}>OR</Text>
        <View style={styles.dividerLine} />
      </View>

      <View style={[styles.desktopContainer, isDesktop && styles.desktopRow]}>
        {/* Main Form Column */}
        <View style={[styles.checkoutBox, isDesktop && styles.formColumn]}>
          {/* Contact & Address */}
          <View style={styles.formSection}>
            <Text style={styles.sectionTitle}>Contact Information</Text>
            <Text style={styles.sectionSubtitle}>
              Required for order confirmation
            </Text>

            <Text style={styles.label}>Email Address</Text>
            <TextInput
              style={[
                styles.input,
                errors.contact?.includes('Enter a valid email') &&
                  styles.inputError,
              ]}
              placeholder="you@example.com"
              value={contact.email}
              onChangeText={v => handleInputChange('contact', 'email', v)}
              keyboardType="email-address"
              autoComplete="email"
              placeholderTextColor={colors.platinum}
            />

            <Text style={styles.label}>Full Name</Text>
            <TextInput
              style={[
                styles.input,
                errors.contact?.includes('Name is required') &&
                  styles.inputError,
              ]}
              placeholder="John Doe"
              value={contact.name}
              onChangeText={v => handleInputChange('contact', 'name', v)}
              autoComplete="name"
              placeholderTextColor={colors.platinum}
            />
          </View>
          {/* Coupon Code Input */}
          {/* <View style={styles.formSection}>
            <Text style={styles.sectionTitle}>Discount Code</Text>
            <View
              style={{
                flexDirection: 'row',
                flexWrap: 'wrap',
                alignItems: 'center',
                marginBottom: 8,
              }}>
              <TextInput
                style={[styles.input, {flex: 1, marginRight: 12}]}
                placeholder="Enter coupon code"
                value={coupon}
                onChangeText={setCoupon}
                autoCapitalize="characters"
                autoCorrect={false}
                placeholderTextColor={colors.platinum}
              />
              <Pressable
                style={({pressed}) => [
                  styles.checkoutButton,
                  applyingCoupon && styles.checkoutButtonDisabled,
                  pressed && !applyingCoupon && {opacity: 0.93},
                ]}
                onPress={handleApplyCoupon}
                disabled={applyingCoupon}
                accessibilityRole="button"
                accessibilityLabel="Apply Coupon">
                {applyingCoupon ? (
                  <ActivityIndicator
                    color={colors.gold}
                    style={{marginVertical: 2}}
                  />
                ) : (
                  <Text style={styles.checkoutButtonText}>Apply</Text>
                )}
              </Pressable>
            </View>
            {couponStatus &&
              (couponStatus.valid ? (
                <Text style={[styles.successText, {marginBottom: 4}]}>
                  Coupon applied: {coupon.toUpperCase()}{' '}
                  {couponStatus.discount.type === 'percent'
                    ? `(${couponStatus.discount.value}% off)`
                    : `(-₤${couponStatus.discount.value.toFixed(2)})`}
                </Text>
              ) : (
                <Text style={[styles.errorText, {marginBottom: 4}]}>
                  {couponStatus.error}
                </Text>
              ))}
          </View> */}
          {/* Shipping Options */}
          <CollapsibleSection
            title="Delivery Method"
            initiallyCollapsed={false}>
            <Text style={styles.sectionTitle}>Delivery method</Text>

            <Pressable
              style={[
                styles.shippingOption,
                shippingOption === 'standard' && styles.shippingOptionSelected,
              ]}
              onPress={() => setShippingOption('standard')}>
              <View
                style={[
                  styles.radioCircle,
                  shippingOption === 'standard' && styles.radioCircleSelected,
                ]}>
                {shippingOption === 'standard' && (
                  <View style={styles.radioCircleDot} />
                )}
              </View>
              <View style={styles.shippingOptionDetails}>
                <Text style={styles.shippingOptionLabel}>
                  Standard Delivery
                </Text>
              </View>
              <Text style={styles.shippingOptionPrice}>Free</Text>
            </Pressable>

            <Pressable
              style={[
                styles.shippingOption,
                shippingOption === 'express' && styles.shippingOptionSelected,
              ]}
              onPress={() => setShippingOption('express')}>
              <View
                style={[
                  styles.radioCircle,
                  shippingOption === 'express' && styles.radioCircleSelected,
                ]}>
                {shippingOption === 'express' && (
                  <View style={styles.radioCircleDot} />
                )}
              </View>
              <View style={styles.shippingOptionDetails}>
                <Text style={styles.shippingOptionLabel}>Next Day Delivery</Text>
              </View>
              <Text style={styles.shippingOptionPrice}>£3.99</Text>
            </Pressable>
          </CollapsibleSection>

          <CollapsibleSection title="Payment" initiallyCollapsed={false}>
            <Text style={styles.sectionTitle}>Payment</Text>

            <View style={styles.paymentMethodsContainer}>
              <Pressable
                style={[
                  styles.paymentMethod,
                  selectedPaymentMethod === 'card' &&
                    styles.paymentMethodSelected,
                ]}
                onPress={() => setSelectedPaymentMethod('card')}>
                <View style={styles.radioCircle}>
                  {selectedPaymentMethod === 'card' && (
                    <View style={styles.radioCircleDot} />
                  )}
                </View>
                <View style={styles.paymentMethodDetails}>
                  <Text style={styles.paymentMethodLabel}>
                    Credit / Debit Card
                  </Text>
                  <Text style={styles.paymentMethodDescription}>
                    All major cards accepted
                  </Text>
                </View>
                <Image
                  source={require('../assets/images/payment-logo.png')}
                  style={styles.paymentMethodIcon}
                  resizeMode="contain"
                />
              </Pressable>

              <Pressable
                style={[
                  styles.paymentMethod,
                  selectedPaymentMethod === 'paypal' &&
                    styles.paymentMethodSelected,
                ]}
                onPress={() => setSelectedPaymentMethod('paypal')}>
                <View style={styles.radioCircle}>
                  {selectedPaymentMethod === 'paypal' && (
                    <View style={styles.radioCircleDot} />
                  )}
                </View>
                <View style={styles.paymentMethodDetails}>
                  <Text style={styles.paymentMethodLabel}>PayPal</Text>
                  <Text style={styles.paymentMethodDescription}>
                    Fast and secure checkout
                  </Text>
                </View>
                <FontAwesome
                  name="paypal"
                  size={24}
                  color="#003087"
                  style={{marginHorizontal: 8}}
                />
              </Pressable>

              <Pressable
                style={[
                  styles.paymentMethod,
                  selectedPaymentMethod === 'klarna' &&
                    styles.paymentMethodSelected,
                ]}
                onPress={() => setSelectedPaymentMethod('klarna')}>
                <View style={styles.radioCircle}>
                  {selectedPaymentMethod === 'klarna' && (
                    <View style={styles.radioCircleDot} />
                  )}
                </View>
                <View style={styles.paymentMethodDetails}>
                  <Text style={styles.paymentMethodLabel}>Klarna</Text>
                  <Text style={styles.paymentMethodDescription}>
                    Pay in 3 interest-free installments
                  </Text>
                </View>
                <Image
                  source={require('../assets/images/klarna-logo.png')}
                  style={[styles.paymentMethodIcon, {width: 40}]}
                  resizeMode="contain"
                  defaultSource={require('../assets/images/klarna-logo.png')}
                  fallback={
                    <Text style={{color: colors.gold, fontWeight: 'bold'}}>
                      Klarna
                    </Text>
                  }
                />
              </Pressable>

              <Pressable
                style={[
                  styles.paymentMethod,
                  selectedPaymentMethod === 'afterpay_clearpay' &&
                    styles.paymentMethodSelected,
                ]}
                onPress={() => setSelectedPaymentMethod('afterpay_clearpay')}>
                <View style={styles.radioCircle}>
                  {selectedPaymentMethod === 'afterpay_clearpay' && (
                    <View style={styles.radioCircleDot} />
                  )}
                </View>
                <View style={styles.paymentMethodDetails}>
                  <Text style={styles.paymentMethodLabel}>Clearpay</Text>
                  <Text style={styles.paymentMethodDescription}>
                    Pay in 4 interest-free installments
                  </Text>
                </View>
                <Image
                  source={require('../assets/images/clearpay-logo.png')}
                  style={[styles.paymentMethodIcon, {width: 40}]}
                  resizeMode="contain"
                  defaultSource={require('../assets/images/clearpay-logo.png')}
                  fallback={
                    <Text style={{color: colors.gold, fontWeight: 'bold'}}>
                      Clearpay
                    </Text>
                  }
                />
              </Pressable>
            </View>

            {/* {selectedPaymentMethod === 'card' && (
              <StripePaymentForm
                cart={cart}
                contact={contact}
                address={address}
                errors={errors}
                setErrors={setErrors}
                paying={paying}
                setPaying={setPaying}
                validateForm={validateForm}
                removeFromCart={removeFromCart}
                onSuccess={handleCheckoutSuccess}
                coupon={coupon}
                discountAmount={getDiscountAmount()}
                // preferredPaymentMethodId={preferredPaymentMethodId}
              />
            )} */}

            {selectedPaymentMethod === 'paypal' && (
              <FadeIn>
                <View style={styles.alternativePaymentContainer}>
                  {/* <Text style={styles.alternativePaymentText}>
                    You will be redirected to PayPal to complete your purchase.
                  </Text> */}
                  <AnimatedButton
                    style={styles.checkoutButton}
                    onPress={() => handleStripeCheckout('paypal')}
                    accessibilityLabel="Continue to PayPal">
                    Continue to PayPal
                  </AnimatedButton>
                </View>
              </FadeIn>
            )}

            {selectedPaymentMethod === 'klarna' && (
              <FadeIn>
                <View style={styles.alternativePaymentContainer}>
                  {/* <Text style={styles.alternativePaymentText}>
                    Pay in 3 interest-free installments with Klarna.
                  </Text> */}
                  <AnimatedButton
                    style={styles.checkoutButton}
                    onPress={() => handleStripeCheckout('klarna')}
                    accessibilityLabel="Continue to Klarna">
                    Continue to Klarna
                  </AnimatedButton>
                </View>
              </FadeIn>
            )}

            {selectedPaymentMethod === 'afterpay_clearpay' && (
              <FadeIn>
                <View style={styles.alternativePaymentContainer}>
                  {/* <Text style={styles.alternativePaymentText}>
                    Pay in 4 interest-free installments with Clearpay.
                  </Text> */}
                  <AnimatedButton
                    style={styles.checkoutButton}
                    onPress={() => handleStripeCheckout('afterpay_clearpay')}
                    accessibilityLabel="Continue to Clearpay">
                    Continue to Clearpay
                  </AnimatedButton>
                </View>
              </FadeIn>
            )}
            {selectedPaymentMethod === 'card' && (
              <FadeIn>
                <View style={styles.alternativePaymentContainer}>
                  {/* <Text style={styles.alternativePaymentText}>
                    Pay in 3 interest-free installments with Klarna.
                  </Text> */}
                  <AnimatedButton
                    style={styles.checkoutButton}
                    onPress={() => handleStripeCheckout('card')}
                    accessibilityLabel="Continue to card">
                    Continue to card
                  </AnimatedButton>
                </View>
              </FadeIn>
            )}
          </CollapsibleSection>
          {errors.contact?.length > 0 && (
            <View style={styles.errorBox}>
              {errors.contact.map((msg, idx) => (
                <Text key={idx} style={styles.errorText}>
                  {msg}
                </Text>
              ))}
            </View>
          )}
        </View>

        {/* Order Summary Column */}
        <View style={[isDesktop ? styles.summaryColumn : styles.checkoutBox]}>
          <Text style={[styles.sectionTitle, {marginBottom: 15}]}>
            Order Summary
          </Text>

          {/* Cart Items Summary */}
          <View style={styles.cartItemsContainer}>
            {cart.map((item, index) => (
              <View
                key={item.id}
                style={[
                  styles.cartItemRow,
                  index < cart.length - 1 && styles.cartItemBorder,
                ]}>
                <View style={styles.cartItemImageContainer}>
                  <Image 
                    source={{ uri: item.image }} 
                    style={styles.cartItemImage} 
                    resizeMode="cover"
                  />
                </View>
                <View style={styles.cartItemInfo}>
                  <Text style={styles.cartItemName}>
                    {item.name}
                  </Text>
                  <Text style={styles.cartItemQuantity}>
                    Qty: {item.quantity}
                  </Text>
                </View>
                <Text style={styles.cartItemPrice}>
                  ₤{(item.price * item.quantity).toFixed(2)}
                </Text>
              </View>
            ))}
          </View>

          <View style={styles.summaryDivider} />
          <View
            style={{
              flexDirection: 'row',
              flexWrap: 'wrap',
              alignItems: 'center',
              marginBottom: 8,
            }}>
            <TextInput
              style={[styles.input, {flex: 1, marginRight: 12, width: '50%'}]}
              placeholder="Enter coupon code"
              value={coupon}
              onChangeText={setCoupon}
              autoCapitalize="characters"
              autoCorrect={false}
              placeholderTextColor={colors.platinum}
            />
            <Pressable
              style={({pressed}) => [
                styles.checkoutButton,
                applyingCoupon && styles.checkoutButtonDisabled,
                pressed && !applyingCoupon && {opacity: 0.93},
              ]}
              onPress={handleApplyCoupon}
              disabled={applyingCoupon}
              accessibilityRole="button"
              accessibilityLabel="Apply Coupon">
              {applyingCoupon ? (
                <ActivityIndicator
                  color={colors.gold}
                  style={{marginVertical: 2}}
                />
              ) : (
                <Text style={styles.checkoutButtonText}>Apply</Text>
              )}
            </Pressable>
          </View>
          {couponStatus &&
            (couponStatus.valid ? (
              <Text style={[styles.successText, {marginBottom: 4}]}>
                Coupon applied: {coupon.toUpperCase()}{' '}
                {couponStatus.discount.type === 'percent'
                  ? `(${couponStatus.discount.value}% off)`
                  : `(-₤${couponStatus.discount.value.toFixed(2)})`}
              </Text>
            ) : (
              <Text style={[styles.errorText, {marginBottom: 4}]}>
                {couponStatus.error}
              </Text>
            ))}

          {/* Price Summary */}
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Subtotal</Text>
            <Text style={styles.summaryValue}>{`₤${subtotal.toFixed(2)}`}</Text>
          </View>
          {couponStatus?.valid && discountAmount > 0 && (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Discount</Text>
              <Text style={[styles.summaryValue, {color: colors.gold}]}>
                -₤{discountAmount.toFixed(2)}
              </Text>
            </View>
          )}
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Shipping</Text>
            <Text style={styles.summaryValue}>
              {shippingOption === 'express' ? '£4.99' : 'Free'}
              {/* {shippingCost === 0 ? 'Free' : `₤${shippingCost.toFixed(2)}`} */}
            </Text>
          </View>

          <View style={styles.summaryDivider} />

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabelTotal}>Total</Text>
            <Text style={styles.summaryValueTotal}>
              £{calculateTotal()}
              {/* {`₤${total.toFixed(
              2,
            )}`} */}
            </Text>
          </View>

          {/* Order incentives */}
          <View style={styles.orderIncentives}>
            <Text style={styles.incentiveText}>
              Free standard delivery on all orders
            </Text>
          </View>
        </View>
      </View>
      {/* Additional offers */}
      <View
        style={[
          styles.additionalOffersContainer,
          isDesktop && styles.additionalOffersDesktop,
        ]}>
        <View style={styles.offerBox}>
          <Text style={styles.offerIcon}>🔄</Text>
          <View style={styles.offerContent}>
            <Text style={styles.offerTitle}>60-Day Returns</Text>
            <Text style={styles.offerDescription}>
              Not completely satisfied? Return within 60 days for a full refund.
            </Text>
          </View>
        </View>
        <View style={styles.offerBox}>
          <Text style={styles.offerIcon}>🛡️</Text>
          <View style={styles.offerContent}>
            <Text style={styles.offerTitle}>Authenticity Guarantee</Text>
            <Text style={styles.offerDescription}>
              Every item is verified for authenticity before dispatch.
            </Text>
          </View>
        </View>
      </View>
      {/* Stripe Payment - Full width */}
      <View
        style={[
          styles.checkoutBox,
          {
            marginTop: 24,
            width: '100%',
            borderTopWidth: 2,
            borderTopColor: '#f5f2ea',
          },
        ]}>
        {stripeLoading && (
          <View style={{padding: 20, alignItems: 'center'}}>
            <ActivityIndicator size="large" color={colors.gold} />
            <Text style={{marginTop: 10, color: colors.text}}>
              Loading payment form...
            </Text>
          </View>
        )}

        {stripeError && (
          <View style={{padding: 20}}>
            <Text style={{color: 'red', marginBottom: 10}}>Payment Error:</Text>
            <Text style={{color: colors.text}}>{stripeError}</Text>
          </View>
        )}
      </View>
      {/* Confirmation Modal */}
      <ConfirmationModal
        open={confirmationOpen}
        onClose={handleContinueShopping}
        onContinue={handleContinueShopping}
        autoCloseMs={15000}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: colors.white,
    // top:60,
  },
  pageTitle: {
    width: '100%',
    marginBottom: 28,
    textAlign: 'center',
  },
  desktopContainer: {
    width: '100%',
    maxWidth: 1200,
    marginHorizontal: 'auto',
  },
  desktopRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 24,
  },
  formColumn: {
    flex: 3,
    minWidth: 300,
    maxWidth: '100%',
  },
  summaryColumn: {
    flex: 1,
    minWidth: 300,
    maxWidth: '100%',
    alignSelf: 'flex-start',
    position: 'sticky',
    top: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#ece6d7',
    backgroundColor: '#fafaf8',
    borderRadius: 10,
    padding: 20,
    shadowColor: colors.black,
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 4,
  },
  checkoutBox: {
    backgroundColor: colors.white,
    borderRadius: 10,
    padding: 20,
    shadowColor: colors.black,
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  header: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 10,
    fontFamily: fontFamily.serif,
    color: colors.onyxBlack,
  },
  subHeader: {
    fontSize: 16,
    color: colors.grey,
    marginBottom: 20,
  },
  formSection: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },

  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 6,
    color: '#111',
  },

  sectionSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },

  label: {
    fontSize: 14,
    color: '#444',
    marginBottom: 6,
    marginTop: 12,
  },

  input: {
    backgroundColor: '#fafafa',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#ddd',
    marginBottom: 4,
    color: '#000',
  },

  inputError: {
    borderColor: '#e74c3c',
    backgroundColor: '#fff5f5',
  },

  errorBox: {
    marginBottom: 12,
    padding: 10,
    backgroundColor: '#ffeaea',
    borderRadius: 8,
  },

  errorText: {
    color: '#c0392b',
    fontSize: 13,
    marginBottom: 4,
  },
  successText: {
    fontSize: 14,
    color: '#2e7d32',
    marginBottom: 10,
  },
  trustBadgesContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    flexWrap: 'wrap',
    marginBottom: 24,
    paddingVertical: 12,
    paddingHorizontal: 8,
    backgroundColor: '#f9f7f2',
    borderRadius: 8,
  },
  trustBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 8,
    marginVertical: 4,
  },
  trustBadgeIcon: {
    fontSize: 18,
    marginRight: 6,
  },
  trustBadgeText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.onyxBlack,
  },
  orderIncentives: {
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0ece2',
  },
  incentiveText: {
    fontSize: 14,
    color: colors.grey,
    textAlign: 'center',
  },
  additionalOffersContainer: {
    marginVertical: 24,
    flexDirection: 'column',
    justifyContent: 'space-between',
    gap: 16,
  },
  additionalOffersDesktop: {
    flexDirection: 'row',
  },
  offerBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9f7f2',
    borderRadius: 8,
    padding: 16,
    flex: 1,
  },
  offerIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  offerContent: {
    flex: 1,
  },
  offerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
    color: colors.onyxBlack,
  },
  offerDescription: {
    fontSize: 14,
    color: colors.grey,
    lineHeight: 18,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 16,
    color: colors.grey,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  summaryLabelTotal: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.onyxBlack,
  },
  summaryValueTotal: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.gold,
  },
  summaryDivider: {
    height: 1,
    backgroundColor: '#ece6d7',
    marginVertical: 12,
  },
  cartItemsContainer: {
    marginBottom: 16,
  },
  cartItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    alignItems: 'center',
  },
  cartItemImageContainer: {
    width: 50,
    height: 50,
    marginRight: 12,
    borderRadius: 4,
    overflow: 'hidden',
  },
  cartItemImage: {
    width: '100%',
    height: '100%',
  },
  cartItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#f0ece2',
  },
  cartItemInfo: {
    flex: 1,
    marginRight: 8,
  },
  cartItemName: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 2,
    flexWrap: 'wrap',
  },
  cartItemQuantity: {
    fontSize: 13,
    color: colors.grey,
  },
  cartItemPrice: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  mobileSummaryContainer: {
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  mobileCouponContainer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#eaeaea',
  },
  mobileCouponLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
    color: colors.darkText,
  },
  mobileCouponInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  mobileCouponInput: {
    flex: 1,
    height: 40,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    paddingHorizontal: 12,
    marginRight: 8,
    backgroundColor: '#fff',
  },
  mobileCouponButton: {
    backgroundColor: colors.gold, // Changed to blue for better visibility
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 80,
  },
  mobileCouponButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  mobileCouponStatus: {
    marginTop: 8,
    fontSize: 13,
  },
  mobileCouponValid: {
    color: '#2e7d32',
  },
  mobileCouponError: {
    color: '#d32f2f',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#999',
    textAlign: 'center',
    paddingTop: 10,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  checkoutButton: {
    backgroundColor: colors.gold,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.gold,
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 6,
    marginTop: 10,
    marginBottom: 10,
  },
  checkoutButtonText: {
    color: colors.white,
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 0.5,
    fontFamily: fontFamily.serif,
    textShadowColor: '#e6c98b',
    textShadowOffset: {width: 0, height: 1},
    textShadowRadius: 2,
    // color: colors.white,
    // fontSize: 18,
    // fontWeight: 'bold',
    // letterSpacing: 0.5,
    // fontFamily: fontFamily.serif,
    // textShadowColor: '#e6c98b',
    // textShadowOffset: {width: 0, height: 1},
    // textShadowRadius: 2,
  },
  checkoutButtonDisabled: {
    backgroundColor: '#e5d9c3',
    opacity: 0.6,
  },
  // Stripe card element styles
  // cardElementLuxuryContainer: {
  //   marginBottom: 20,
  //   padding: 16,
  //   backgroundColor: '#fafaf8',
  //   borderRadius: 8,
  //   borderWidth: 1,
  //   borderColor: '#ece6d7',
  // },
  stripeCardLuxuryWrapper: {
    height: 50,
    paddingHorizontal: 12,
    paddingVertical: 15,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d0d0d0',
    borderRadius: 6,
    marginBottom: 10,
  },
  secureIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  inputLabel: {
    fontSize: 15,
    fontWeight: '500',
    marginBottom: 8,
    color: colors.onyxBlack,
  },
  cardHelperText: {
    fontSize: 13,
    color: colors.grey,
    marginTop: 4,
    marginBottom: 10,
  },
  paymentSection: {
    marginTop: 20,
    marginBottom: 20,
  },
  errorText: {
    color: colors.ruby,
    marginBottom: 10,
    fontSize: 14,
  },
  successText: {
    color: '#2e7d32',
    marginBottom: 10,
    fontSize: 14,
  },
  expressContainer: {
    backgroundColor: '#fff',
    padding: 20,
    marginBottom: 24,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },

  expressButton: {
    backgroundColor: '#1a73e8', // GPay blue
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 12,
  },

  expressButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },

  apple: {
    backgroundColor: '#000',
  },
  paypalButton: {
    backgroundColor: '#003087',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 8,
    marginBottom: 12,
    justifyContent: 'center',
  },
  klarnaButton: {
    backgroundColor: '#ffb3c6',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 8,
    justifyContent: 'center',
  },
  paymentText: {
    color: '#fff',
    fontSize: 16,
    marginLeft: 10,
    fontWeight: '600',
  },
  paymentIcon: {
    width: 24,
    height: 24,
    resizeMode: 'contain',
    tintColor: '#fff',
  },
  // paymentOptionsRow: {
  //   flexDirection: 'row',
  //   justifyContent: 'space-between',
  //   marginTop: 12,
  //   marginBottom: 16,
  // },
  // methodButton: {
  //   paddingVertical: 10,
  //   paddingHorizontal: 14,
  //   backgroundColor: '#F0F0F0',
  //   borderRadius: 8,
  //   borderWidth: 1,
  //   borderColor: '#CCC',
  //   flex: 1,
  //   alignItems: 'center',
  //   marginHorizontal: 4,
  // },
  // methodButtonSelected: {
  //   backgroundColor: '#D4AF37',
  //   borderColor: '#D4AF37',
  // },
  // methodButtonText: {
  //   fontWeight: 'bold',
  //   color: '#333',
  // },
  methodText: {
    fontSize: 16,
    fontWeight: '500',
  },
  paymentOptionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    marginBottom: 16,
  },
  methodButton: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    backgroundColor: '#F0F0F0',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#CCC',
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  methodButtonSelected: {
    backgroundColor: '#D4AF37',
    borderColor: '#D4AF37',
  },
  methodButtonText: {
    fontWeight: 'bold',
    color: '#333',
  },
  Expresscontainer: {
    width: '90%',
    justifyContent: 'center',
    alignSelf: 'center',
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 6,
    shadowOffset: {width: 0, height: 3},
    elevation: 4, // Android shadow
    marginVertical: 16,
  },
  Expresstitle: {
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '400',
    marginBottom: 10,
    color: '#777',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    color: colors.darkText,
  },
  shippingOption: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.lightGrey,
    borderRadius: 4,
  },
  shippingOptionSelected: {
    borderColor: colors.gold,
    backgroundColor: '#faf6e9',
  },
  shippingOptionRadio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.grey,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  shippingOptionRadioSelected: {
    borderColor: colors.gold,
  },
  shippingOptionRadioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.gold,
  },
  shippingOptionDetails: {
    flex: 1,
  },
  shippingOptionLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.darkText,
  },
  shippingOptionPrice: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.darkText,
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.grey,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  radioCircleSelected: {
    borderColor: colors.gold,
  },
  radioCircleDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.gold,
  },
  paymentMethodsContainer: {
    marginBottom: 24,
  },
  paymentMethod: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderWidth: 1,
    borderColor: colors.lightGrey,
    borderRadius: 4,
    marginBottom: 12,
    backgroundColor: colors.white,
  },
  paymentMethodSelected: {
    borderColor: colors.gold,
  },
  paymentMethodDetails: {
    flex: 1,
  },
  paymentMethodLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.darkText,
  },
  paymentMethodDescription: {
    fontSize: 12,
    color: colors.grey,
    marginTop: 4,
  },
  paymentMethodIcon: {
    width: 60,
    height: 24,
    marginHorizontal: 8,
  },
  leftColumn: {
    flex: 1,
    paddingBottom: 24,
    backgroundColor: colors.white,
  },
  leftColumnDesktop: {
    // marginRight: 32,
    marginLeft:40,
    maxWidth: '93%',
    backgroundColor: colors.white,
    borderRadius: 4,
    padding: 24,
    ...shadows.light,
  },
  reservationTimerContainer: {
    backgroundColor: '#f8f4e5',
    padding: 12,
    borderRadius: 4,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  reservationTimerText: {
    color: colors.darkText,
    fontSize: 14,
  },
  timerIcon: {
    marginRight: 8,
    fontSize: 16,
    color: colors.gold,
  },
  orDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.lightGrey,
  },
});



