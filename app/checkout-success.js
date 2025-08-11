import React, { useEffect, useState } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { storeOrder } from './components/orders-modal';
import { trackEvent } from '../lib/trackEvent';
import { loadStripe } from '@stripe/stripe-js';

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
        
        // Check if this is a redirect with payment_intent and redirect_status
        const queryString = window.location.search;
        const urlParams = new URLSearchParams(queryString);
        const paymentIntentId = urlParams.get('payment_intent');
        const redirectStatus = urlParams.get('redirect_status');
        
        // If we have payment_intent in the URL (redirect from Klarna/PayPal)
        if (paymentIntentId && redirectStatus === 'succeeded') {
          // Load Stripe to verify the payment
          const stripe = await loadStripe(process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY);
          const { paymentIntent } = await stripe.retrievePaymentIntent(paymentIntentId);
          
          if (paymentIntent && paymentIntent.status === 'succeeded') {
            // If we have email in params, store the order
            const email = params.email;
            if (email) {
              // Get cart and contact info from localStorage if available
              const cartData = localStorage.getItem('cartData');
              if (cartData) {
                const { cart, contact, address, total } = JSON.parse(cartData);
                
                console.log('Preparing to track purchase event with data:', {
                  cart,
                  total,
                  paymentIntentId,
                  email
                });
                
                // First attempt to track directly
                setTimeout(() => {
                  try {
                    // Check if Google Tag Manager is available
                    const gtmAvailable = typeof window !== 'undefined' && 
                                        typeof window.dataLayer !== 'undefined';
                    console.log('Google Tag Manager available:', gtmAvailable);
                    
                    // Direct dataLayer push (bypasses CSP issues with gtag)
                    if (gtmAvailable) {
                      try {
                        window.dataLayer.push({
                          'event': 'purchase',
                          'ecommerce': {
                            'purchase': {
                              'transaction_id': paymentIntentId,
                              'value': parseFloat(total) || 0,
                              'currency': 'GBP',
                              'items': cart.map(item => ({
                                'item_id': item.id,
                                'item_name': item.name || item.title,
                                'price': parseFloat(item.price) || 0,
                                'quantity': parseInt(item.quantity) || 1,
                              }))
                            }
                          },
                          'userId': email,
                          'payment_method': 'stripe_checkout',
                          'checkout_type': 'regular',
                          'order_status': 'confirmed'
                        });
                        console.log('Direct dataLayer push for purchase event successful');
                      } catch (dataLayerError) {
                        console.error('Error pushing to dataLayer:', dataLayerError);
                      }
                    }
                    
                    // Track the purchase event for conversion tracking
                    trackEvent({
                      eventType: 'purchase',
                      items: cart.map(item => ({
                        id: item.id,
                        name: item.name || item.title,
                        price: parseFloat(item.price) || 0,
                        quantity: parseInt(item.quantity) || 1,
                      })),
                      value: parseFloat(total) || 0,
                      currency: 'GBP',
                      transaction_id: paymentIntentId,
                      userId: email,
                      metadata: { 
                        payment_method: 'stripe_checkout',
                        checkout_type: 'regular',
                        order_status: 'confirmed'
                      },
                    });
                    console.log('trackEvent called for purchase event');
                    
                    // Also try the alternative event name that might be used in GA4 mapping
                    trackEvent({
                      eventType: 'order_completed',
                      items: cart.map(item => ({
                        id: item.id,
                        name: item.name || item.title,
                        price: parseFloat(item.price) || 0,
                        quantity: parseInt(item.quantity) || 1,
                      })),
                      value: parseFloat(total) || 0,
                      currency: 'GBP',
                      transaction_id: paymentIntentId,
                      userId: email,
                      metadata: { 
                        payment_method: 'stripe_checkout',
                        checkout_type: 'regular',
                        order_status: 'confirmed'
                      },
                    });
                    console.log('trackEvent called for order_completed event');
                    
                    // Attempt to store the event directly in Supabase as a backup
                    try {
                      const { supabase } = require('../../lib/supabase/client');
                      supabase.from('user_events').insert([{
                        event_type: 'purchase',
                        user_id: email,
                        product_id: null,
                        quantity: cart.reduce((sum, item) => sum + (parseInt(item.quantity) || 1), 0),
                        metadata: {
                          items: cart,
                          value: parseFloat(total) || 0,
                          currency: 'GBP',
                          transaction_id: paymentIntentId,
                          payment_method: 'stripe_checkout',
                          checkout_type: 'regular',
                          order_status: 'confirmed'
                        }
                      }]).then(result => {
                        console.log('Direct Supabase event insert result:', result);
                      }).catch(err => {
                        console.error('Direct Supabase event insert error:', err);
                      });
                    } catch (supabaseError) {
                      console.error('Error with direct Supabase event insert:', supabaseError);
                    }
                  } catch (trackingError) {
                    console.error('Error tracking purchase event:', trackingError);
                  }
                }, 500); // Small delay to ensure everything is loaded
                
                // Try again after a longer delay as a backup
                setTimeout(() => {
                  try {
                    console.log('Attempting backup purchase event tracking after delay');
                    trackEvent({
                      eventType: 'purchase',
                      items: cart.map(item => ({
                        id: item.id,
                        name: item.name || item.title,
                        price: parseFloat(item.price) || 0,
                        quantity: parseInt(item.quantity) || 1,
                      })),
                      value: parseFloat(total) || 0,
                      currency: 'GBP',
                      transaction_id: paymentIntentId,
                      userId: email,
                      metadata: { 
                        payment_method: 'stripe_checkout',
                        checkout_type: 'regular',
                        order_status: 'confirmed',
                        is_backup_event: true
                      },
                    });
                  } catch (backupTrackingError) {
                    console.error('Error in backup tracking attempt:', backupTrackingError);
                  }
                }, 2000); // Longer delay for backup attempt
                
                try {
                  // Generate a customer-friendly order number (current date + random numbers)
                  const orderDate = new Date();
                  const orderNumber = `ORD-${orderDate.getFullYear()}${String(orderDate.getMonth() + 1).padStart(2, '0')}${String(orderDate.getDate()).padStart(2, '0')}-${Math.floor(1000 + Math.random() * 9000)}`;
                  
                  // Create the order object matching the database schema
                  const orderData = {
                    date: orderDate.toISOString(),
                    items: cart,
                    // Fields that match the schema
                    status: 'confirmed',
                    total_amount: total,
                    total: total, // Keep for backward compatibility
                    shipping_address: address,
                    payment_method: paymentIntent.payment_method_types?.[0] || 'card',
                    payment_intent_id: paymentIntentId,
                    paymentIntentId: paymentIntentId, // Keep for backward compatibility
                    currency: 'GBP',
                    contact_email: email,
                    email: email, // Keep for backward compatibility
                    contact: contact // Keep contact info for local storage
                  };
                  
                  console.log('Attempting to store order:', orderData);
                  
                  // Store the order in both localStorage and database
                  try {
                    const storedOrder = await storeOrder(orderData, email);
                    console.log('Order stored successfully:', storedOrder);
                    
                    // Try to send confirmation email directly here since the Netlify function might be missing
                    try {
                      fetch('/.netlify/functions/send-order-confirmation', {
                        method: 'POST',
                        headers: {
                          'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                          email: email,
                          order: orderData,
                        }),
                      }).then(response => {
                        if (!response.ok) {
                          console.error('Failed to send order confirmation email:', response.status);
                        } else {
                          console.log('Order confirmation email sent successfully');
                        }
                      }).catch(emailError => {
                        console.error('Error sending order confirmation email:', emailError);
                      });
                    } catch (emailError) {
                      console.error('Error sending order confirmation email:', emailError);
                    }
                  } catch (storeError) {
                    console.error('Error in storeOrder function:', storeError);
                  }
                  
                  // Track purchase event
                  try {
                    await trackEvent({
                      eventType: 'purchase',
                      value: total,
                      currency: 'GBP',
                      transaction_id: orderNumber,
                      items: cart.map(item => ({
                        id: item.id,
                        name: item.title || item.name,
                        quantity: item.quantity,
                        price: item.price
                      }))
                    });
                  } catch (trackError) {
                    console.error('Error tracking purchase event:', trackError);
                  }
                  
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
