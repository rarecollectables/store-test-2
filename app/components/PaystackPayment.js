import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  Alert,
  Platform
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { useCurrency } from '../../context/currency';
import { useStore } from '../../context/store';
import { colors, fontFamily, spacing, borderRadius, shadows } from '../../theme';

// Paystack configuration - should be set in your environment variables
const PAYSTACK_PUBLIC_KEY = process.env.PAYSTACK_PUBLIC_KEY;

if (!PAYSTACK_PUBLIC_KEY) {
  console.warn('Paystack public key is not configured. Paystack payments will not work.');
}

// Only allow Paystack for Nigeria
const ALLOWED_COUNTRY_CODE = 'NG';

/**
 * PaystackPayment Component
 * 
 * A payment component that integrates with Paystack for Nigerian customers only.
 * Automatically hides and disables itself for non-Nigerian customers.
 */
const PaystackPayment = ({
  amount,
  email,
  onSuccess,
  onError,
  onCancel,
  disabled = false,
  style = {}
}) => {
  // This effect will trigger the payment when the component mounts
  useEffect(() => {
    if (!disabled) {
      handlePaystackPayment();
    }
    
    // Cleanup function to handle component unmount
    return () => {
      // Any cleanup if needed when component unmounts
    };
  }, [disabled]);
  const { getCheckoutConfiguration, selectedCountry } = useCurrency();
  const { cart } = useStore();
  const [isLoading, setIsLoading] = useState(false);
  const [paystackLoaded, setPaystackLoaded] = useState(false);
  const [error, setError] = useState(null);

  // Check if Paystack should be enabled for the current country
  const isNigeria = selectedCountry === ALLOWED_COUNTRY_CODE;
  
  // Get converted amount for Nigeria
  const checkoutConfig = getCheckoutConfiguration(amount);

  // Load Paystack script for web - only for Nigeria
  useEffect(() => {
    // Only load Paystack for web and Nigeria
    if (Platform.OS !== 'web' || !isNigeria) {
      return;
    }

    // Check if script is already loaded
    if (document.querySelector('script[src*="paystack"], script[src*="Paystack"]')) {
      setPaystackLoaded(true);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://js.paystack.co/v1/inline.js';
    script.async = true;
    script.onload = () => {
      console.log('Paystack script loaded successfully');
      setPaystackLoaded(true);
    };
    
    script.onerror = (error) => {
      console.error('Failed to load Paystack script:', error);
      setError('Failed to load payment system. Please try again later.');
      setPaystackLoaded(false);
    };
    
    document.body.appendChild(script);

    return () => {
      // Cleanup script on unmount or when country changes
      try {
        if (document.body.contains(script)) {
          document.body.removeChild(script);
        }
      } catch (error) {
        console.error('Error cleaning up Paystack script:', error);
      }
    };
  }, [isNigeria]);

  const verifyPayment = async (reference) => {
    try {
      const response = await fetch('/api/verify-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reference }),
      });

      const data = await response.json();
      
      if (data.success) {
        console.log('Payment verified successfully:', data);
        return { success: true, data };
      } else {
        console.error('Payment verification failed:', data.message);
        return { success: false, error: data.message };
      }
    } catch (error) {
      console.error('Error verifying payment:', error);
      return { success: false, error: 'Failed to verify payment' };
    }
  };

  const handlePaystackPayment = useCallback(async () => {
    if (!isNigeria) {
      console.warn('Paystack payment initiated for non-Nigeria country');
      return;
    }

    if (!email || !amount) {
      const errorMsg = 'Email and amount are required for payment';
      console.error(errorMsg);
      Alert.alert('Payment Error', errorMsg);
      onError?.({ message: errorMsg });
      return;
    }

    if (!paystackLoaded) {
      const errorMsg = 'Payment system is not ready. Please try again.';
      console.error(errorMsg);
      Alert.alert('Payment Error', errorMsg);
      onError?.({ message: errorMsg });
      return;
    }

    if (!PAYSTACK_PUBLIC_KEY) {
      const errorMsg = 'Payment processing is not properly configured. Please contact support.';
      console.error('Paystack public key is not configured');
      Alert.alert('Configuration Error', errorMsg);
      onError?.({ message: errorMsg });
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Convert amount to kobo (Paystack uses kobo, not naira)
      const amountInKobo = Math.round(checkoutConfig.amount * 100);
      const transactionRef = `RC_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
      
      console.log('Initiating Paystack payment:', {
        amount: amountInKobo,
        email,
        reference: transactionRef,
        itemCount: Array.isArray(cart) ? cart.length : 0
      });

      if (Platform.OS === 'web' && window.PaystackPop) {
        const handler = window.PaystackPop.setup({
          key: PAYSTACK_PUBLIC_KEY,
          email: email,
          amount: amountInKobo,
          currency: 'NGN',
          ref: transactionRef,
          metadata: {
            custom_fields: [
              {
                display_name: "Cart Items",
                variable_name: "cart_items",
                value: Array.isArray(cart) ? cart.length : 0
              }
            ]
          },
          callback: async function(response) {
            console.log('Paystack callback:', response);
            setIsLoading(false);
            
            if (response.status === 'success') {
              console.log('Payment successful, verifying...', response.reference);
              
              try {
                // Verify the payment on your server
                const verification = await verifyPayment(response.reference);
                
                if (verification.success) {
                  console.log('Payment verified, reference:', response.reference);
                  onSuccess?.({
                    reference: response.reference,
                    status: 'success',
                    paymentMethod: 'paystack',
                    transactionId: response.transaction,
                    verified: true,
                    verificationData: verification.data
                  });
                } else {
                  const errorMsg = verification.error || 'Payment verification failed';
                  console.error('Payment verification failed:', errorMsg);
                  onError?.({
                    message: errorMsg,
                    response,
                    paymentMethod: 'paystack',
                    requiresVerification: true
                  });
                }
              } catch (verificationError) {
                console.error('Error during payment verification:', verificationError);
                onError?.({
                  message: 'Error verifying payment',
                  error: verificationError,
                  paymentMethod: 'paystack',
                  requiresVerification: true
                });
              }
            } else {
              const errorMsg = response.message || 'Payment was not completed';
              console.error('Payment failed:', errorMsg);
              onError?.({
                message: errorMsg,
                response,
                paymentMethod: 'paystack',
                requiresVerification: false
              });
            }
          },
          onClose: function() {
            console.log('Paystack payment window closed by user');
            setIsLoading(false);
            onCancel?.();
          }
        });

        handler.openIframe();
      } else {
        throw new Error('Paystack is not available');
      }
    } catch (error) {
      console.error('Paystack payment error:', error);
      setIsLoading(false);
      const errorMsg = error.message || 'Failed to initialize payment';
      setError(errorMsg);
      onError?.({
        message: errorMsg,
        error,
        paymentMethod: 'paystack'
      });
    }
  }, [amount, checkoutConfig.amount, email, isNigeria, onCancel, onError, onSuccess, paystackLoaded, cart]);

  // Don't render anything if not Nigeria
  if (!isNigeria) {
    return null;
  }

  // Show error state if Paystack failed to load
  if (error) {
    return (
      <View style={[styles.container, style]}>
        <Text style={styles.errorText}>
          Payment system is currently unavailable. Please try another payment method.
        </Text>
      </View>
    );
  }

  // Show loading state while Paystack loads
  if (!paystackLoaded) {
    return (
      <View style={[styles.container, style, styles.loadingContainer]}>
        <ActivityIndicator size="small" color={colors.primary} />
        <Text style={styles.loadingText}>Loading payment options...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, style]}>
      <Pressable
        style={({ pressed }) => [
          styles.paystackButton,
          (disabled || isLoading) && styles.paystackButtonDisabled,
          pressed && styles.paystackButtonPressed
        ]}
        onPress={handlePaystackPayment}
        disabled={disabled || isLoading || !paystackLoaded}
        accessibilityLabel="Pay with Paystack"
        accessibilityRole="button"
        accessibilityState={{ busy: isLoading }}
      >
        <View style={styles.buttonContent}>
          <View style={styles.leftContent}>
            <FontAwesome 
              name="credit-card" 
              size={20} 
              color={colors.white} 
              style={styles.icon}
            />
            <View>
              <Text style={styles.buttonText}>
                Pay with Paystack
              </Text>
              <Text style={styles.amountText}>
                {checkoutConfig.formatted}
              </Text>
            </View>
          </View>
          
          {isLoading ? (
            <ActivityIndicator size="small" color={colors.white} />
          ) : (
            <FontAwesome 
              name="arrow-right" 
              size={16} 
              color={colors.white} 
            />
          )}
        </View>
      </Pressable>

      <View style={styles.securityInfo}>
        <FontAwesome 
          name="lock" 
          size={12} 
          color={colors.textSecondary} 
          style={styles.lockIcon}
        />
        <Text style={styles.securityText}>
          Secure payment powered by Paystack
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: spacing.medium,
    width: '100%',
  },
  paystackButton: {
    backgroundColor: '#00C851', // Paystack green
    borderRadius: borderRadius.medium,
    padding: spacing.medium,
    ...shadows.medium,
  },
  paystackButtonDisabled: {
    opacity: 0.6,
  },
  paystackButtonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.99 }],
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  leftContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  icon: {
    marginRight: spacing.medium,
  },
  buttonText: {
    color: colors.white,
    fontSize: 16,
    fontFamily: fontFamily.semiBold,
  },
  amountText: {
    color: colors.white,
    fontSize: 14,
    opacity: 0.9,
    marginTop: 2,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.medium,
  },
  loadingText: {
    marginLeft: spacing.small,
    color: colors.textSecondary,
    fontFamily: fontFamily.regular,
  },
  errorText: {
    color: colors.error,
    fontFamily: fontFamily.regular,
    textAlign: 'center',
    padding: spacing.medium,
  },
  securityInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.small,
  },
  lockIcon: {
    marginRight: spacing.xsmall,
  },
  securityText: {
    fontSize: 11,
    color: colors.textSecondary,
    fontFamily: fontFamily.regular,
  },
});

export default PaystackPayment;
