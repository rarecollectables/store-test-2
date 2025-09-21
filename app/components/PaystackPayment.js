import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  Alert,
  Platform,
  Linking
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { useCurrency } from '../../context/currency';
import { useStore } from '../../context/store';
import { colors, fontFamily, spacing, borderRadius, shadows } from '../../theme';

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
  const { selectedCountry } = useCurrency();
  const { cart } = useStore();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Check if Paystack should be enabled for the current country
  const isNigeria = selectedCountry === ALLOWED_COUNTRY_CODE;
  
  // Note: `amount` is expected to already be in NGN (not GBP)

  // Verification is now handled by the checkout-success page

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

    setIsLoading(true);
    setError(null);

    try {
      // Treat amount as already in NGN; convert to kobo for Paystack
      const amountInKobo = Math.round(Number(amount) * 100);
      const transactionRef = `RC_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
      
      console.log('Initiating server-side Paystack payment:', {
        amount: amountInKobo,
        email,
        reference: transactionRef,
        itemCount: Array.isArray(cart) ? cart.length : 0
      });

      // Use our Netlify function to initialize the payment
      const response = await fetch('/.netlify/functions/initialize-paystack', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          amount: amountInKobo,
          reference: transactionRef,
          metadata: {
            cart_items: Array.isArray(cart) ? cart.length : 0
          }
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Server error (${response.status})`);
      }

      const data = await response.json();
      
      if (data.success && data.data.authorizationUrl) {
        console.log('Payment initialized successfully, redirecting to:', data.data.authorizationUrl);
        
        // For web, redirect to the Paystack hosted checkout page
        if (Platform.OS === 'web') {
          // Store the reference for verification after redirect
          localStorage.setItem('paystackReference', data.data.reference);
          
          // Store a minimal currentOrder so checkout-success can render items and totals
          try {
            const minimalOrder = {
              items: Array.isArray(cart) ? cart : [],
              total: Number.isFinite(Number(amount)) ? Number(amount) : 0,
              currency: 'NGN',
              created_at: new Date().toISOString(),
            };
            localStorage.setItem('currentOrder', JSON.stringify(minimalOrder));
          } catch (e) {
            console.warn('Failed to store minimal currentOrder:', e);
          }
          
          // Redirect to the Paystack checkout page
          window.location.href = data.data.authorizationUrl;
        } else {
          // For mobile, open the URL in the device browser
          const supported = await Linking.canOpenURL(data.data.authorizationUrl);
          
          if (supported) {
            await Linking.openURL(data.data.authorizationUrl);
          } else {
            throw new Error(`Cannot open URL: ${data.data.authorizationUrl}`);
          }
        }
      } else {
        throw new Error('Failed to initialize payment');
      }
    } catch (error) {
      console.error('Paystack payment error:', error);
      setIsLoading(false);
      setError(error.message || 'Failed to process payment');
      onError?.({ message: error.message || 'Failed to process payment' });
    }
  }, [isNigeria, email, amount, cart, onError]);

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

  // Show loading state while payment is processing
  if (isLoading) {
    return (
      <View style={[styles.container, style, styles.loadingContainer]}>
        <ActivityIndicator size="small" color={colors.primary} />
        <Text style={styles.loadingText}>Processing payment...</Text>
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
        disabled={disabled || isLoading}
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
            <View style={{ flex: 1 }}>
              <Text style={styles.buttonText}>Pay</Text>
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
    backgroundColor: colors.gold, // Use theme color
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
    fontSize: 15,
    fontFamily: fontFamily.semiBold,
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
