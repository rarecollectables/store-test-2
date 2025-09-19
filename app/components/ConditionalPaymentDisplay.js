import React from 'react';
import { Text } from 'react-native';
import { useCurrency } from '../../context/currency';
import PaymentMethodsRow from '../(components)/PaymentMethodsRow';

/**
 * ConditionalPaymentDisplay - A utility component that conditionally renders content
 * based on the selected country's payment method and currency settings.
 * 
 * This ensures users only see payment and currency elements relevant to their selection.
 */

export const ConditionalPaymentDisplay = ({ 
  children, 
  showFor = 'all', // 'all', 'paystack', 'default', 'uk', 'nigeria', 'international'
  hideFor = null 
}) => {
  const { selectedCountry, isPaystackCountry } = useCurrency();
  
  // Determine if content should be shown
  const shouldShow = () => {
    // If hideFor is specified, check if we should hide
    if (hideFor) {
      if (hideFor === 'paystack' && isPaystackCountry()) return false;
      if (hideFor === 'default' && !isPaystackCountry()) return false;
      if (hideFor === 'nigeria' && selectedCountry === 'NG') return false;
      if (hideFor === 'uk' && selectedCountry === 'UK') return false;
      if (hideFor === 'international' && selectedCountry === 'INTL') return false;
    }
    
    // If showFor is specified, check if we should show
    if (showFor === 'all') return true;
    if (showFor === 'paystack' && isPaystackCountry()) return true;
    if (showFor === 'default' && !isPaystackCountry()) return true;
    if (showFor === 'nigeria' && selectedCountry === 'NG') return true;
    if (showFor === 'uk' && selectedCountry === 'UK') return true;
    if (showFor === 'international' && selectedCountry === 'INTL') return true;
    
    return false;
  };
  
  return shouldShow() ? children : null;
};

/**
 * PaymentMethodDisplay - Shows payment method information based on selected country
 */
export const PaymentMethodDisplay = () => {
  const { selectedCountry, isPaystackCountry, currencyConfig } = useCurrency();
  
  return (
    <>
      <ConditionalPaymentDisplay showFor="nigeria">
        <PaymentMethodsRow iconSize={38} pop style={{ marginBottom: 4 }} />
      </ConditionalPaymentDisplay>
      
      <ConditionalPaymentDisplay showFor="default">
        <PaymentMethodsRow iconSize={38} pop style={{ marginBottom: 4 }} />
      </ConditionalPaymentDisplay>
    </>
  );
};

/**
 * CurrencyDisplay - Shows currency information based on selected country
 */
export const CurrencyDisplay = ({ amount, style }) => {
  const { formatPrice } = useCurrency();
  
  return (
    <Text style={style}>
      {formatPrice(amount)}
    </Text>
  );
};

export default ConditionalPaymentDisplay;
