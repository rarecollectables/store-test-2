import React, { useEffect, useState } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { storeOrder } from './components/orders-modal';
import { loadStripe } from '@stripe/stripe-js';
import { trackEvent } from '../lib/trackEvent';

// Define getUserOrders function directly to avoid import issues
function getUserOrders(email) {
  // Orders are stored locally by email (if provided), else by device key
  if (typeof window !== 'undefined' && window.localStorage) {
    if (email) {
      const key = `ORDERS_EMAIL_${email.toLowerCase()}`;
      const data = window.localStorage.getItem(key);
      return data ? JSON.parse(data) : [];
    }
    const key = `ORDERS_${getDeviceKey()}`;
    const data = window.localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  }
  return [];
}

// Helper function to get device key
function getDeviceKey() {
  // Simple device fingerprinting
  const userAgent = navigator.userAgent;
  const key = `device_${userAgent.length}_${userAgent.split('').reduce((a, c) => a + c.charCodeAt(0), 0)}`;
  return key;
}

export default function CheckoutSuccess() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    const checkPaymentStatus = async () => {
      try {
        setLoading(true);
        console.log('=== CHECKOUT SUCCESS PAGE LOADED ===');
        
        // Check for URL parameters from different payment flows
        const queryString = window.location.search;
        const urlParams = new URLSearchParams(queryString);
        const paymentIntentId = urlParams.get('payment_intent');
        const redirectStatus = urlParams.get('redirect_status');
        const sessionId = urlParams.get('session_id');
        
        console.log('URL Parameters:', { paymentIntentId, redirectStatus, sessionId, queryString });
        
        // Handle both payment_intent flow and session_id (Stripe Checkout) flow
        if ((paymentIntentId && redirectStatus === 'succeeded') || sessionId) {
          console.log('Payment verification needed, loading Stripe...');
          // Load Stripe to verify the payment
          const stripe = await loadStripe(process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY);
          console.log('Stripe loaded successfully');
          
          // Handle different payment flows
          let paymentSuccess = false;
          let paymentDetails = null;
          
          if (paymentIntentId && redirectStatus === 'succeeded') {
            // Payment Intent flow (Klarna/PayPal)
            console.log('Retrieving payment intent:', paymentIntentId);
            const { paymentIntent } = await stripe.retrievePaymentIntent(paymentIntentId);
            console.log('Payment intent retrieved:', paymentIntent?.status);
            
            if (paymentIntent && paymentIntent.status === 'succeeded') {
              paymentSuccess = true;
              paymentDetails = paymentIntent;
            }
          } else if (sessionId) {
            // Stripe Checkout Session flow
            console.log('Retrieving checkout session:', sessionId);
            try {
              // Use fetch to retrieve session from our backend
              const sessionResponse = await fetch(`/.netlify/functions/retrieve-checkout-session?session_id=${sessionId}`);
              if (sessionResponse.ok) {
                const sessionData = await sessionResponse.json();
                console.log('Session data retrieved:', sessionData);
                
                if (sessionData.session && sessionData.session.payment_status === 'paid') {
                  paymentSuccess = true;
                  paymentDetails = {
                    id: sessionData.session.payment_intent,
                    status: 'succeeded',
                    payment_method_types: [sessionData.session.payment_method_types?.[0] || 'card']
                  };
                }
              } else {
                console.error('Failed to retrieve session:', await sessionResponse.text());
              }
            } catch (sessionError) {
              console.error('Error retrieving session:', sessionError);
            }
          }
          
          if (paymentSuccess) {
            console.log('Payment confirmed as succeeded, proceeding with order processing');
            
            // Get email from params or session data
            let email = params.email;
            let sessionData = null;
            
            // If we're in session flow and don't have email, try to get it from the session
            if (!email && sessionId) {
              try {
                console.log('Attempting to get customer email from session');
                const sessionResponse = await fetch(`/.netlify/functions/retrieve-checkout-session?session_id=${sessionId}`);
                if (sessionResponse.ok) {
                  sessionData = await sessionResponse.json();
                  email = sessionData.session?.customer_email;
                  console.log('Retrieved customer email from session:', email);
                }
              } catch (emailError) {
                console.error('Error retrieving customer email from session:', emailError);
              }
            }
            
            console.log('Using email:', email);
            if (email) {
              // Get cart and contact info from localStorage if available
              console.log('Attempting to retrieve cart data from localStorage');
              const cartData = localStorage.getItem('cartData');
              console.log('Cart data retrieved from localStorage:', cartData ? 'Found' : 'Not found');
              if (cartData) {
                const { cart, contact, address, total } = JSON.parse(cartData);
                console.log('Cart data parsed successfully:', { 
                  cartItems: cart?.length, 
                  hasContact: !!contact, 
                  hasAddress: !!address, 
                  total 
                });
                try {
                  console.log('Creating order from cart data...');
                  // Generate a customer-friendly order number (current date + random numbers)
                  const orderDate = new Date();
                  const orderNumber = `ORD-${orderDate.getFullYear()}${String(orderDate.getMonth() + 1).padStart(2, '0')}${String(orderDate.getDate()).padStart(2, '0')}-${Math.floor(1000 + Math.random() * 9000)}`;
                  console.log('Generated order number:', orderNumber);
                  
                  // Create the order object
                  const orderData = {
                    id: orderNumber,
                    date: orderDate.toISOString(),
                    items: cart,
                    contact,
                    address,
                    total,
                    paymentIntentId: paymentIntentId,
                    paymentMethod: paymentIntent.payment_method_types?.[0] || 'unknown',
                    status: 'confirmed'
                  };
                  console.log('Order data created:', JSON.stringify(orderData, null, 2));
                  
                  // Track purchase event for analytics
                  console.log('Tracking purchase event for analytics');
                  try {
                    // Try direct dataLayer push as a backup method
                    if (typeof window !== 'undefined' && window.dataLayer) {
                      console.log('Pushing directly to dataLayer');
                      window.dataLayer.push({
                        'event': 'purchase',
                        'ecommerce': {
                          'transaction_id': orderNumber,
                          'value': total,
                          'currency': 'GBP',
                          'items': cart.map(item => ({
                            'item_id': item.id,
                            'item_name': item.name || item.title,
                            'price': parseFloat(item.price),
                            'quantity': item.quantity
                          }))
                        }
                      });
                    }
                    
                    // Use our trackEvent function
                    console.log('Calling trackEvent function');
                    trackEvent({
                      eventType: 'purchase',
                      items: cart.map(item => ({
                        id: item.id,
                        name: item.name || item.title,
                        price: parseFloat(item.price),
                        quantity: item.quantity,
                      })),
                      value: total,
                      currency: 'GBP',
                      transaction_id: orderNumber,
                      metadata: { payment_method: paymentIntent.payment_method_types?.[0] || 'card' },
                    });
                    console.log('trackEvent function called successfully');
                  } catch (trackErr) {
                    console.error('Error tracking purchase event:', trackErr);
                  }
                  
                  // Store the order in both localStorage and database
                  console.log('Storing order in database:', orderData);
                  try {
                    const storeResult = await storeOrder(orderData, email);
                    console.log('Order storage result:', storeResult);
                    
                    // Check if we got a valid result from storeOrder
                    if (!storeResult) {
                      console.warn('storeOrder returned no result, but did not throw an error');
                    }
                  } catch (storeError) {
                    console.error('Error storing order:', storeError);
                  }
                  
                  // Send order confirmation email
                  try {
                    console.log('Sending order confirmation email to:', email);
                    // Use the correct endpoint and payload structure
                    // The Netlify function expects 'to' instead of 'email'
                    const emailPayload = {
                      to: email, // Changed from 'email' to 'to' to match backend expectation
                      order: orderData
                    };
                    console.log('Email payload:', JSON.stringify(emailPayload, null, 2));
                    
                    const emailResponse = await fetch('/.netlify/functions/send-order-confirmation', {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                      },
                      body: JSON.stringify(emailPayload)
                    });
                    
                    console.log('Email response status:', emailResponse.status, emailResponse.statusText);
                    
                    try {
                      const emailResult = await emailResponse.json();
                      console.log('Email sending result:', emailResult);
                      
                      if (!emailResponse.ok) {
                        console.error('Failed to send order confirmation email:', emailResult);
                      } else {
                        console.log('Email sent successfully!');
                      }
                    } catch (jsonError) {
                      console.error('Error parsing email response JSON:', jsonError);
                      const textResponse = await emailResponse.text();
                      console.log('Raw email response:', textResponse);
                    }
                  } catch (emailError) {
                    console.error('Error sending order confirmation email:', emailError);
                    // Don't block the checkout process for email errors
                  }
                  
                  // Track purchase event
                  await trackEvent({
                    eventType: 'purchase',
                    items: cart,
                    value: total,
                    transaction_id: orderData.id
                  });
                  
                  // Clear cart data
                  localStorage.removeItem('cartData');
                } catch (orderError) {
                  console.error('Error storing order:', orderError);
                  // Continue with success flow even if order storage fails
                }
              }
            }
          }
        }
        
        // Try to get the most recent order from localStorage
        const email = params.email;
        if (email) {
          const orders = getUserOrders(email);
          if (orders && orders.length > 0) {
            setOrder(orders[0]); // Get the most recent order
          }
        } else {
          const orders = getUserOrders(); // Get by device
          if (orders && orders.length > 0) {
            setOrder(orders[0]); // Get the most recent order
          }
        }
      } catch (err) {
        console.error('Error checking payment status:', err);
        setError('There was an issue verifying your payment. Please contact customer support.');
      } finally {
        setLoading(false);
      }
    };
    
    checkPaymentStatus();
  }, [params.email]);

  return (
    <div className="checkout-success-page" style={{ maxWidth: 540, margin: '60px auto', padding: 32, background: '#fff', borderRadius: 12, boxShadow: '0 2px 18px rgba(44,62,80,0.10)' }}>
      {loading ? (
        <div style={{ textAlign: 'center', padding: '20px 0' }}>
          <div style={{ width: 40, height: 40, margin: '0 auto', border: '3px solid #f3f3f3', borderTop: '3px solid #BFA054', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
          <p style={{ marginTop: 16 }}>Verifying your payment...</p>
          <style jsx>{`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      ) : error ? (
        <div style={{ color: '#e53e3e', marginBottom: 24 }}>
          <h2 style={{ fontSize: 24, marginBottom: 12 }}>Payment Verification Issue</h2>
          <p>{error}</p>
        </div>
      ) : (
        <>
          <h1 style={{ color: '#38a169', fontSize: 32, marginBottom: 12 }}>Thank you for your purchase!</h1>
          <p style={{ fontSize: 18, marginBottom: 24 }}>
            Your order has been placed successfully. You will receive a confirmation email soon.
          </p>
        </>
      )}
      
      {order && (
        <div style={{ marginBottom: 24, padding: 16, backgroundColor: '#f9f9f9', borderRadius: 8 }}>
          <h3 style={{ fontSize: 18, marginBottom: 12 }}>Order Summary</h3>
          <p style={{ fontSize: 16, marginBottom: 8 }}>
            <strong>Order Number:</strong> {order.id || `ORD-${order.paymentIntentId?.slice(-8)}`}
          </p>
          <p style={{ fontSize: 16, marginBottom: 8 }}>
            <strong>Date:</strong> {order.date 
              ? new Date(order.date).toLocaleDateString('en-GB', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric'
                })
              : new Date().toLocaleDateString('en-GB')}
          </p>
          <p style={{ fontSize: 16, marginBottom: 8 }}>
            <strong>Status:</strong> {order.status || 'Confirmed'}
          </p>
          <p style={{ fontSize: 16, marginBottom: 8 }}>
            <strong>Total:</strong> £{order.total?.toFixed(2)}
          </p>
          <div style={{ marginTop: 16 }}>
            <p style={{ fontSize: 16, marginBottom: 8, fontWeight: 'bold' }}>Items:</p>
            {order.items && order.items.map((item, idx) => (
              <div key={idx} style={{ marginBottom: 8, paddingLeft: 12 }}>
                <p style={{ fontSize: 14, margin: 0 }}>
                  • {item.title || item.name} x{item.quantity} - £{(item.price * item.quantity).toFixed(2)}
                </p>
              </div>
            ))}
          </div>
          {order.discount > 0 && (
            <p style={{ fontSize: 16, marginTop: 8, color: '#4CAF50' }}>
              <strong>Discount:</strong> -£{order.discount.toFixed(2)}
            </p>
          )}
          <div style={{ marginTop: 12, fontSize: 14 }}>
            <p>You can view this order anytime in your <a href="/profile" style={{ color: '#BFA054', textDecoration: 'underline' }}>order history</a>.</p>
          </div>
        </div>
      )}
      
      <button
        style={{ background: '#BFA054', color: '#fff', border: 'none', borderRadius: 8, padding: '12px 32px', fontSize: 18, cursor: 'pointer', marginBottom: 12 }}
        onClick={() => router.replace('/')}>
        Continue Shopping
      </button>
      <div style={{ marginTop: 18, color: '#374151', fontSize: 16 }}>
        <span role="img" aria-label="delivery">🚚</span> Estimated delivery: 2-4 business days
      </div>
    </div>
  );
}
