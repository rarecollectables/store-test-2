import React, { useState, useEffect } from 'react';
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

// Paystack configuration
const PAYSTACK_PUBLIC_KEY = process.env.EXPO_PUBLIC_PAYSTACK_PUBLIC_KEY || 'pk_test_your_key_here';

export default function PaystackPayment({
  amount,
  email,
  onSuccess,
  onError,
  onCancel,
  disabled = false,
  style = {}
}) {
  const { getCheckoutConfiguration, isPaystackCountry } = useCurrency();
  const { cart } = useStore();
  const [isLoading, setIsLoading] = useState(false);
  const [paystackLoaded, setPaystackLoaded] = useState(false);

  // Only show Paystack for Nigeria
  if (!isPaystackCountry()) {
    return null;
  }

  // Get converted amount for Nigeria
  const checkoutConfig = getCheckoutConfiguration(amount);

  // Load Paystack script for web
  useEffect(() => {
    if (Platform.OS === 'web') {
      const script = document.createElement('script');
      script.src = 'https://js.paystack.co/v1/inline.js';
      script.async = true;
      script.onload = () => setPaystackLoaded(true);
      script.onerror = () => {
        console.error('Failed to load Paystack script');
        setPaystackLoaded(false);
      };
      document.body.appendChild(script);

      return () => {
        // Cleanup script on unmount
        try {
          document.body.removeChild(script);
        } catch (error) {
          // Script might already be removed
        }
      };
    } else {
      // For React Native, you would need to use a Paystack React Native SDK
      setPaystackLoaded(true);
    }
  }, []);

  const handlePaystackPayment = async () => {
    if (!email || !amount) {
      Alert.alert('Error', 'Email and amount are required for payment');
      return;
    }

    if (!paystackLoaded) {
      Alert.alert('Error', 'Payment system is not ready. Please try again.');
      return;
    }

    setIsLoading(true);

    try {
      // Convert amount to kobo (Paystack uses kobo, not naira)
      const amountInKobo = Math.round(checkoutConfig.amount * 100);

      if (Platform.OS === 'web' && window.PaystackPop) {
        const handler = window.PaystackPop.setup({
          key: PAYSTACK_PUBLIC_KEY,
          email: email,
          amount: amountInKobo,
          currency: 'NGN',
          ref: `RC_${Date.now()}_${Math.random().toString(36).substring(2)}`,
          metadata: {
            custom_fields: [
              {
                display_name: "Cart Items",
                variable_name: "cart_items",
                value: Array.isArray(cart) ? cart.length : 0
              }
            ]
          },
          callback: function(response) {
            setIsLoading(false);
            if (response.status === 'success') {
              onSuccess && onSuccess({
                reference: response.reference,
                transaction: response.transaction,
                message: response.message
              });
            } else {
              onError && onError({
                message: 'Payment was not completed',
                response
              });
            }
          },
          onClose: function() {
            setIsLoading(false);
            onCancel && onCancel();
          }
        });

        handler.openIframe();
      } else {
        // For React Native, you would integrate with Paystack React Native SDK
        // This is a placeholder for the native implementation
        Alert.alert(
          'Payment',
          'Paystack payment integration for mobile is not yet implemented. Please use web version.',
          [
            {
              text: 'OK',
              onPress: () => {
                setIsLoading(false);
                onCancel && onCancel();
              }
            }
          ]
        );
      }
    } catch (error) {
      console.error('Paystack payment error:', error);
      setIsLoading(false);
      onError && onError({
        message: 'Payment initialization failed',
        error
      });
    }
  };

  return (
    <View style={[styles.container, style]}>
      <Pressable
        style={[
          styles.paystackButton,
          (disabled || isLoading) && styles.paystackButtonDisabled
        ]}
        onPress={handlePaystackPayment}
        disabled={disabled || isLoading || !paystackLoaded}
        accessibilityLabel="Pay with Paystack"
        accessibilityRole="button"
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

      {!paystackLoaded && (
        <Text style={styles.loadingText}>
          Loading payment system...
        </Text>
      )}

      <View style={styles.securityInfo}>
        <FontAwesome 
          name="shield" 
          size={12} 
          color={colors.grey} 
          style={styles.shieldIcon}
        />
        <Text style={styles.securityText}>
          Secured by Paystack • Your payment information is encrypted
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: spacing.medium,
  },
  paystackButton: {
    backgroundColor: '#00C851', // Paystack green
    borderRadius: borderRadius.medium,
    paddingHorizontal: spacing.large,
    paddingVertical: spacing.medium,
    ...shadows.medium,
  },
  paystackButtonDisabled: {
    backgroundColor: colors.grey,
    opacity: 0.6,
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
    fontWeight: '600',
    fontFamily: fontFamily.semiBold,
  },
  amountText: {
    color: colors.white,
    fontSize: 14,
    opacity: 0.9,
    marginTop: 2,
  },
  loadingText: {
    textAlign: 'center',
    color: colors.grey,
    fontSize: 12,
    marginTop: spacing.small,
    fontStyle: 'italic',
  },
  securityInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.small,
  },
  shieldIcon: {
    marginRight: spacing.xsmall,
  },
  securityText: {
    fontSize: 11,
    color: colors.grey,
    textAlign: 'center',
  },
});
