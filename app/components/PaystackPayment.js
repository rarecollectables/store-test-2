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
const PAYSTACK_PUBLIC_KEY = process.env.EXPO_PUBLIC_PAYSTACK_PUBLIC_KEY || 
  process.env.PAYSTACK_PUBLIC_KEY || 
  process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY || 
  'pk_test_yourtestkeyhere'; // Replace with your actual test key for development

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

    console.log('Attempting to load Paystack script...');
    
    // First check if Paystack is already available in window
    if (window.PaystackPop) {
      console.log('Paystack already available in window');
      setPaystackLoaded(true);
      return;
    }
    
    // Check if script is already loaded
    const existingScript = document.querySelector('script[src*="paystack"], script[src*="Paystack"]');
    if (existingScript) {
      console.log('Paystack script already exists in document');
      setPaystackLoaded(true);
      return;
    }

    // Define multiple possible script sources to try
    const scriptSources = [
      'https://js.paystack.co/v1/inline.js',
      'https://cdn.paystack.com/v1/inline.js', // Alternative CDN if primary fails
      '/paystack-inline.js' // Local fallback if available
    ];
    
    // Function to try loading from the next source
    const tryLoadScript = (sourceIndex = 0) => {
      if (sourceIndex >= scriptSources.length) {
        console.error('All Paystack script sources failed');
        setError('Failed to load payment system. Please try again later.');
        setPaystackLoaded(false);
        onError?.({ message: 'Failed to load Paystack script from all sources. Please contact support.' });
        return;
      }
      
      try {
        const script = document.createElement('script');
        script.src = scriptSources[sourceIndex];
        script.async = true;
        script.id = 'paystack-script';
        script.crossOrigin = 'anonymous'; // Add crossOrigin attribute
        
        script.onload = () => {
          console.log(`Paystack script loaded successfully from ${scriptSources[sourceIndex]}`);
          setPaystackLoaded(true);
        };
        
        script.onerror = (error) => {
          console.error(`Failed to load Paystack script from ${scriptSources[sourceIndex]}:`, error);
          // Try the next source - only try to remove if it was actually appended
          try {
            // Check if the script is actually in the document before removing
            if (document.body.contains(script)) {
              document.body.removeChild(script);
            }
          } catch (removeError) {
            console.error('Error removing script:', removeError);
          }
          tryLoadScript(sourceIndex + 1);
        };
        
        document.body.appendChild(script);
        console.log(`Attempting to load Paystack script from ${scriptSources[sourceIndex]}`);
      } catch (loadError) {
        console.error('Error setting up Paystack script:', loadError);
        tryLoadScript(sourceIndex + 1);
      }
    };
    
    // Start trying to load from the first source
    tryLoadScript();

    return () => {
      // Cleanup script on unmount or when country changes
      try {
        const scriptToRemove = document.getElementById('paystack-script');
        if (scriptToRemove && document.body.contains(scriptToRemove)) {
          document.body.removeChild(scriptToRemove);
          console.log('Paystack script removed from document');
        }
      } catch (error) {
        console.error('Error cleaning up Paystack script:', error);
      }
    };
  }, [isNigeria, onError]);

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

      // Check if PaystackPop is available in window
      if (Platform.OS === 'web') {
        if (!window.PaystackPop) {
          throw new Error('Paystack is not available. The script may not have loaded correctly.');
        }
        
        console.log('Setting up Paystack payment with config:', {
          key: PAYSTACK_PUBLIC_KEY ? `${PAYSTACK_PUBLIC_KEY.substring(0, 8)}...` : 'MISSING',
          email,
          amount: amountInKobo,
          currency: 'NGN',
          ref: transactionRef
        });
        
        // Define callback and onClose functions separately before passing to setup
        const paystackCallback = function(response) {
          console.log('Paystack callback received:', response);
          setIsLoading(false);
          
          if (response.status === 'success') {
            console.log('Payment successful, reference:', response.reference);
            
            // Call onSuccess with the reference
            onSuccess?.(response.reference);
            
            // Optionally verify the payment server-side
            verifyPayment(response.reference)
              .then(verification => {
                if (verification.success) {
                  console.log('Payment verified successfully');
                } else {
                  const errorMsg = verification.error || 'Payment verification failed';
                  console.error('Payment verification failed:', errorMsg);
                }
              })
              .catch(error => {
                console.error('Error verifying payment:', error);
              });
          } else {
            const errorMsg = response.message || 'Payment was not successful';
            console.error('Payment failed:', errorMsg);
            onError?.({ 
              message: errorMsg,
              response,
              paymentMethod: 'paystack',
              requiresVerification: false
            });
          }
        };
        
        const paystackClose = function() {
          console.log('Payment modal closed');
          setIsLoading(false);
          onCancel?.();
        };
        
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
          callback: paystackCallback,
          onClose: paystackClose
        });

        // Open the payment modal
        try {
          console.log('Opening Paystack iframe...');
          handler.openIframe();
        } catch (iframeError) {
          console.error('Error opening Paystack iframe:', iframeError);
          setIsLoading(false);
          throw new Error(`Failed to open Paystack payment: ${iframeError.message}`);
        }
      } else {
        console.error('Paystack is not available in window');
        throw new Error('Paystack is not available. Please ensure you are using a supported browser.');
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
