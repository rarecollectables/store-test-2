import React, { useState, useRef, useEffect } from 'react';
import { 
  View, 
  Text, 
  Pressable, 
  StyleSheet, 
  Platform,
  Animated,
  ScrollView,
  Modal
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { useCurrency } from '../../context/currency';
import { Dimensions } from 'react-native';
import { colors, fontFamily, spacing, borderRadius, shadows } from '../../theme';

const { width: screenWidth } = Dimensions.get('window');

export default function CountrySelector({ 
  style = {}, 
  compact = false, 
  showFlag = true, 
  showCurrency = true 
}) {
  const { 
    selectedCountry, 
    config, 
    availableCountries, 
    setCountry 
  } = useCurrency();
  
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownLayout, setDropdownLayout] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const buttonRef = useRef(null);

  // Safe array handling to prevent index errors
  const countries = Array.isArray(availableCountries) ? availableCountries : [];
  
  // Find current country config safely
  const currentCountry = countries.find(country => country.code === selectedCountry) || countries[0];

  const handleCountrySelect = (countryCode) => {
    try {
      // Validate country code exists in available countries
      const isValidCountry = countries.some(country => country.code === countryCode);
      
      if (isValidCountry) {
        setCountry(countryCode);
        setIsOpen(false);
      } else {
        console.warn(`Invalid country selection: ${countryCode}`);
      }
    } catch (error) {
      console.error('Error selecting country:', error);
      setIsOpen(false);
    }
  };

  const openDropdown = () => {
    if (buttonRef.current) {
      buttonRef.current.measure((x, y, width, height, pageX, pageY) => {
        setDropdownLayout({
          x: pageX,
          y: pageY + height,
          width: width,
          height: height
        });
        setIsOpen(true);
      });
    } else {
      setIsOpen(true);
    }
  };

  // Render compact version for mobile/small screens
  if (compact) {
    return (
      <View style={[styles.compactContainer, style]}>
        <Pressable
          ref={buttonRef}
          style={styles.compactButton}
          onPress={openDropdown}
          accessibilityLabel={`Select country. Currently ${currentCountry?.name || 'Unknown'}`}
          accessibilityRole="button"
        >
          {showFlag && (
            <Text style={styles.flagText}>
              {currentCountry?.flag || '🌍'}
            </Text>
          )}
          {showCurrency && (
            <Text style={styles.currencyText}>
              {currentCountry?.currency || 'GBP'}
            </Text>
          )}
          <FontAwesome 
            name="chevron-down" 
            size={12} 
            color={colors.grey} 
            style={styles.chevron}
          />
        </Pressable>

        <Modal
          visible={isOpen}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setIsOpen(false)}
        >
          <Pressable 
            style={styles.modalOverlay} 
            onPress={() => setIsOpen(false)}
          >
            <View style={[
              styles.dropdown,
              Platform.OS === 'web' && dropdownLayout.width > 0 ? {
                position: 'absolute',
                top: dropdownLayout.y,
                left: dropdownLayout.x,
                minWidth: dropdownLayout.width
              } : styles.dropdownMobile
            ]}>
              <ScrollView showsVerticalScrollIndicator={false}>
                {countries.map((country, index) => {
                  // Safe array access
                  if (!country || !country.code) return null;
                  
                  return (
                    <Pressable
                      key={`${country.code}-${index}`}
                      style={[
                        styles.dropdownItem,
                        selectedCountry === country.code && styles.dropdownItemSelected
                      ]}
                      onPress={() => handleCountrySelect(country.code)}
                      accessibilityLabel={`Select ${country.name}`}
                      accessibilityRole="button"
                    >
                      <Text style={styles.flagText}>{country.flag}</Text>
                      <View style={styles.countryInfo}>
                        <Text style={styles.countryName}>{country.name}</Text>
                        <Text style={styles.currencyInfo}>
                          {country.currency} ({country.symbol})
                        </Text>
                      </View>
                      {selectedCountry === country.code && (
                        <FontAwesome 
                          name="check" 
                          size={16} 
                          color={colors.gold} 
                        />
                      )}
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>
          </Pressable>
        </Modal>
      </View>
    );
  }

  // Full version for desktop/larger screens
  return (
    <View style={[styles.container, style]}>
      <Pressable
        ref={buttonRef}
        style={styles.button}
        onPress={openDropdown}
        accessibilityLabel={`Select country. Currently ${currentCountry?.name || 'Unknown'}`}
        accessibilityRole="button"
      >
        <View style={styles.buttonContent}>
          <Text style={styles.flag}>
            {currentCountry.flag}
          </Text>
          <FontAwesome 
            name="chevron-down" 
            size={12} 
            color="#BFA054" 
            style={styles.chevron}
          />
        </View>
      </Pressable>

      <Modal
        visible={isOpen}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsOpen(false)}
      >
        <Pressable 
          style={styles.modalOverlay} 
          onPress={() => setIsOpen(false)}
        >
          <View style={[
            styles.dropdown,
            Platform.OS === 'web' && dropdownLayout.width > 0 ? {
              position: 'absolute',
              top: dropdownLayout.y,
              left: dropdownLayout.x,
              minWidth: dropdownLayout.width
            } : styles.dropdownMobile
          ]}>
            <ScrollView showsVerticalScrollIndicator={false}>
              {countries.map((country, index) => {
                // Safe array access
                if (!country || !country.code) return null;
                
                return (
                  <Pressable
                    key={`${country.code}-${index}`}
                    style={[
                      styles.dropdownItem,
                      selectedCountry === country.code && styles.dropdownItemSelected
                    ]}
                    onPress={() => handleCountrySelect(country.code)}
                    accessibilityLabel={`Select ${country.name}`}
                    accessibilityRole="button"
                  >
                    <Text style={styles.flagText}>{country.flag}</Text>
                    <View style={styles.countryInfo}>
                      <Text style={styles.countryName}>{country.name}</Text>
                      <Text style={styles.currencyInfo}>
                        {country.currency} ({country.symbol})
                      </Text>
                      {country.paymentMethod === 'Paystack' && (
                        <Text style={styles.paymentInfo}>
                          Paystack payments
                        </Text>
                      )}
                    </View>
                    {selectedCountry === country.code && (
                      <FontAwesome 
                        name="check" 
                        size={16} 
                        color={colors.gold} 
                      />
                    )}
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    zIndex: 1000,
  },
  compactContainer: {
    position: 'relative',
    zIndex: 1000,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
    backgroundColor: 'transparent',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(191, 160, 84, 0.3)',
    minWidth: 80,
  },
  compactButton: {
    paddingVertical: 3,
    paddingHorizontal: 6,
    minWidth: 70,
  },
  buttonHovered: {
    backgroundColor: 'rgba(191, 160, 84, 0.05)',
    borderColor: 'rgba(191, 160, 84, 0.5)',
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 40,
    gap: 4,
  },
  flag: {
    fontSize: 20,
    lineHeight: 24,
  },
  flagCompact: {
    fontSize: 14,
  },
  countryText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#BFA054',
  },
  countryTextCompact: {
    fontSize: 11,
  },
  currencyText: {
    display: 'none',
  },
  currencyTextCompact: {
    display: 'none',
  },
  chevron: {
    marginLeft: 0,
  },
  chevronRotated: {
    transform: [{ rotate: '180deg' }],
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dropdown: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    marginTop: 2,
    backgroundColor: '#FFFFFF',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(191, 160, 84, 0.3)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 3,
    minWidth: 100,
  },
  dropdownCompact: {
    minWidth: 80,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(240, 240, 240, 0.5)',
  },
  dropdownItemCompact: {
    paddingVertical: 4,
    paddingHorizontal: 6,
  },
  dropdownItemSelected: {
    backgroundColor: colors.lightGold || '#faf6e9',
  },
  countryInfo: {
    flex: 1,
    marginLeft: spacing.small,
  },
  countryName: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.darkText,
    fontFamily: fontFamily.medium,
  },
  currencyInfo: {
    fontSize: 12,
    color: colors.grey,
    marginTop: 2,
  },
  paymentInfo: {
    fontSize: 11,
    color: colors.gold,
    marginTop: 2,
    fontStyle: 'italic',
  },
});
