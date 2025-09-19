
import React from 'react';
import { View, StyleSheet, Image, Platform } from 'react-native';
import { FontAwesome, FontAwesome5 } from '@expo/vector-icons';
import { useCurrency } from '../../context/currency';

// Use FontAwesome icons which are known to work well with React Native

// Define payment methods by country/region
const paymentMethodsByCountry = {
  // UK and International (default) payment methods
  default: [
    { 
      name: 'Visa', 
      icon: props => <FontAwesome name="cc-visa" {...props} color="#1A1F71" />
    },
    { 
      name: 'Mastercard', 
      icon: props => <FontAwesome name="cc-mastercard" {...props} color="#EB001B" />
    },
    { 
      name: 'American Express', 
      icon: props => <FontAwesome name="cc-amex" {...props} color="#2E77BC" />
    },
    { 
      name: 'PayPal', 
      icon: props => <FontAwesome name="cc-paypal" {...props} color="#003087" />
    },
  ],
  
  // Nigeria payment methods (Paystack)
  nigeria: [
    { 
      name: 'Paystack', 
      icon: props => <FontAwesome5 name="credit-card" {...props} color="#00C851" />
    },
    { 
      name: 'Visa', 
      icon: props => <FontAwesome name="cc-visa" {...props} color="#1A1F71" />
    },
    { 
      name: 'Mastercard', 
      icon: props => <FontAwesome name="cc-mastercard" {...props} color="#EB001B" />
    },
  ],
};

export default function PaymentMethodsRow({ style = {}, iconSize = 38, pop = false }) {
  const { selectedCountry, isPaystackCountry } = useCurrency();
  
  // Calculate dimensions based on iconSize
  const cardWidth = iconSize * 1.6;
  const cardHeight = iconSize * 1.0;
  
  // Determine if we're on web platform
  const isWeb = Platform.OS === 'web';
  
  // Get payment methods based on selected country
  const getPaymentMethods = () => {
    if (isPaystackCountry()) {
      return paymentMethodsByCountry.nigeria;
    }
    return paymentMethodsByCountry.default;
  };
  
  const paymentMethods = getPaymentMethods();
  
  return (
    <View style={[styles.row, style]}>
      {paymentMethods.map(({ name, icon: Icon }) => (
        <View
          key={name}
          style={[
            styles.iconCard,
            {
              width: cardWidth,
              height: cardHeight,
              borderColor: pop ? '#e0e0e0' : '#f0f0f0',
              shadowOpacity: pop ? 0.15 : 0.08,
            },
          ]}
        >
          <View style={{ width: iconSize, height: iconSize, justifyContent: 'center', alignItems: 'center' }}>
            <Icon size={iconSize * 0.8} />
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 4,
  },
  iconCard: {
    backgroundColor: '#fff',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    marginHorizontal: 4,
    marginVertical: 3,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
});

