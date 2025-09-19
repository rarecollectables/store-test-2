import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

// Currency context for managing country selection and currency conversion
const CurrencyContext = createContext();

// Country configurations with safe defaults
const COUNTRY_CONFIGS = {
  UK: {
    code: 'UK',
    name: 'United Kingdom',
    currency: 'GBP',
    symbol: '£',
    conversionRate: 1,
    paymentMethod: 'Default',
    flag: '🇬🇧'
  },
  NG: {
    code: 'NG',
    name: 'Nigeria',
    currency: 'NGN',
    symbol: '₦',
    conversionRate: 2050,
    paymentMethod: 'Paystack',
    flag: '🇳🇬'
  },
  INTL: {
    code: 'INTL',
    name: 'Other Countries',
    currency: 'USD',
    symbol: '$',
    conversionRate: 1.35,
    paymentMethod: 'Default',
    flag: '🌍'
  }
};

// Safe array of country codes to prevent index errors
const COUNTRY_CODES = Object.keys(COUNTRY_CONFIGS);

const CURRENCY_STORAGE_KEY = 'RARE_COLLECTABLES_CURRENCY';

const initialState = {
  selectedCountry: 'UK',
  config: COUNTRY_CONFIGS.UK
};

// Helper function to add thousand separators
const addThousandSeparators = (num) => {
  const parts = num.toString().split('.');
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return parts.join('.');
};

// Helper function to safely get country config
const getCountryConfig = (countryCode) => {
  // Ensure we have a valid country code, fallback to UK
  const safeCode = countryCode && COUNTRY_CONFIGS[countryCode] ? countryCode : 'UK';
  return COUNTRY_CONFIGS[safeCode];
};

// Helper function to safely convert currency
const convertCurrency = (gbpAmount, targetCountry) => {
  try {
    const amount = parseFloat(gbpAmount) || 0;
    const config = getCountryConfig(targetCountry);
    const convertedAmount = amount * config.conversionRate;
    const formattedAmount = addThousandSeparators(convertedAmount.toFixed(2));
    
    return {
      amount: convertedAmount,
      currency: config.currency,
      symbol: config.symbol,
      formatted: `${config.symbol}${formattedAmount}`
    };
  } catch (error) {
    console.error('Currency conversion error:', error);
    // Return safe fallback
    const fallbackAmount = parseFloat(gbpAmount) || 0;
    const formattedFallback = addThousandSeparators(fallbackAmount.toFixed(2));
    return {
      amount: fallbackAmount,
      currency: 'GBP',
      symbol: '£',
      formatted: `£${formattedFallback}`
    };
  }
};

// Central function to get checkout configuration
const getCheckoutConfig = (selectedCountry, gbpAmount) => {
  try {
    const config = getCountryConfig(selectedCountry);
    const convertedAmount = (parseFloat(gbpAmount) || 0) * config.conversionRate;
    const formattedAmount = addThousandSeparators(convertedAmount.toFixed(2));
    
    return {
      currency: config.currency,
      amount: convertedAmount,
      paymentMethod: config.paymentMethod,
      symbol: config.symbol,
      formatted: `${config.symbol}${formattedAmount}`,
      countryName: config.name,
      flag: config.flag
    };
  } catch (error) {
    console.error('Checkout config error:', error);
    // Return safe fallback
    const fallbackAmount = parseFloat(gbpAmount) || 0;
    const formattedFallback = addThousandSeparators(fallbackAmount.toFixed(2));
    return {
      currency: 'GBP',
      amount: fallbackAmount,
      paymentMethod: 'Default',
      symbol: '£',
      formatted: `£${formattedFallback}`,
      countryName: 'United Kingdom',
      flag: '🇬🇧'
    };
  }
};

function currencyReducer(state, action) {
  switch (action.type) {
    case 'SET_COUNTRY': {
      const countryCode = action.payload;
      // Validate country code exists
      if (!countryCode || !COUNTRY_CONFIGS[countryCode]) {
        console.warn(`Invalid country code: ${countryCode}, falling back to UK`);
        return {
          ...state,
          selectedCountry: 'UK',
          config: COUNTRY_CONFIGS.UK
        };
      }
      
      return {
        ...state,
        selectedCountry: countryCode,
        config: COUNTRY_CONFIGS[countryCode]
      };
    }
    case 'HYDRATE': {
      const { selectedCountry } = action.payload || {};
      const safeCountry = selectedCountry && COUNTRY_CONFIGS[selectedCountry] ? selectedCountry : 'UK';
      
      return {
        ...state,
        selectedCountry: safeCountry,
        config: COUNTRY_CONFIGS[safeCountry]
      };
    }
    default:
      return state;
  }
}

// Storage helpers with error handling
const getStorageItem = async (key) => {
  try {
    if (Platform.OS === 'web') {
      const value = window.localStorage?.getItem(key);
      return value;
    } else {
      const value = await SecureStore.getItemAsync(key);
      return value;
    }
  } catch (error) {
    console.error('Error getting storage item:', error);
    return null;
  }
};

const setStorageItem = async (key, value) => {
  try {
    const toSave = typeof value === 'string' ? value : JSON.stringify(value);
    if (Platform.OS === 'web') {
      window.localStorage?.setItem(key, toSave);
    } else {
      await SecureStore.setItemAsync(key, toSave);
    }
  } catch (error) {
    console.error('Error setting storage item:', error);
  }
};

export function CurrencyProvider({ children }) {
  const [state, dispatch] = useReducer(currencyReducer, initialState);

  // Hydrate state from storage on mount
  useEffect(() => {
    (async () => {
      try {
        const data = await getStorageItem(CURRENCY_STORAGE_KEY);
        if (data) {
          let parsedData;
          try {
            parsedData = JSON.parse(data);
          } catch (parseErr) {
            console.error('Error parsing currency data:', parseErr);
            parsedData = {};
          }
          
          dispatch({ type: 'HYDRATE', payload: parsedData });
        }
      } catch (error) {
        console.error('Error loading currency state:', error);
      }
    })();
  }, []);

  // Persist state changes
  useEffect(() => {
    (async () => {
      try {
        await setStorageItem(CURRENCY_STORAGE_KEY, JSON.stringify({
          selectedCountry: state.selectedCountry
        }));
      } catch (error) {
        console.error('Error saving currency state:', error);
      }
    })();
  }, [state.selectedCountry]);

  // Memoized functions to prevent unnecessary re-renders
  const setCountry = (countryCode) => {
    dispatch({ type: 'SET_COUNTRY', payload: countryCode });
  };

  const convertPrice = (gbpAmount) => {
    return convertCurrency(gbpAmount, state.selectedCountry);
  };

  const getCheckoutConfiguration = (gbpAmount) => {
    return getCheckoutConfig(state.selectedCountry, gbpAmount);
  };

  const value = {
    // State
    selectedCountry: state.selectedCountry,
    config: state.config,
    
    // Available countries (safe array)
    availableCountries: COUNTRY_CODES.map(code => ({
      code,
      ...COUNTRY_CONFIGS[code]
    })),
    
    // Actions
    setCountry,
    
    // Utilities
    convertPrice,
    getCheckoutConfiguration,
    
    // Helper functions
    formatPrice: (gbpAmount) => {
      const converted = convertPrice(gbpAmount);
      return converted.formatted;
    },
    
    // Check if current selection uses Paystack
    isPaystackCountry: () => state.config.paymentMethod === 'Paystack',
    
    // Get currency symbol
    getCurrencySymbol: () => state.config.symbol
  };

  return (
    <CurrencyContext.Provider value={value}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
}

// Export utility functions for use outside of React components
export { getCheckoutConfig, convertCurrency, COUNTRY_CONFIGS };
