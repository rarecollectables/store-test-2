import React from 'react';
import {
  View,
  Text,
  Image,
  Pressable,
  useWindowDimensions,
  StyleSheet,
  Platform,
} from 'react-native';

export default function ProductShowcase({
  title = 'Heart Pendant Necklaces',
  description = `Lorem Ipsum is simply dummy text of the printing and typesetting industry.`,
  imageUri = 'https://fhybeyomiivepmlrampr.supabase.co/storage/v1/object/public/products/Necklaces/20-champagnebox-Necklace-5.avif',
  onAddToCart,
}) {
  const {width} = useWindowDimensions();

  const isMobile = width < 768;
  const isTablet = width >= 768 && width < 1024;
  const isDesktop = width >= 1024;

  const layoutStyles = [
    styles.container,
    isMobile && styles.mobileContainer,
    isTablet && styles.tabletContainer,
    isDesktop && styles.desktopContainer,
  ];

  const imageWidth = isMobile
    ? width * 0.8
    : isTablet
    ? width * 0.4
    : width * 0.3;

  return (
    <View style={layoutStyles}>
      {/* Left Section */}
      <View
        style={[
          styles.leftSection,
          (isMobile || isTablet) && styles.fullWidth,
        ]}>
        <Text style={[styles.title, isMobile && styles.titleMobile]}>
          {title}
        </Text>
        <Text
          style={[styles.description, isMobile && styles.descriptionMobile]}>
          {description}
        </Text>

        <Pressable style={styles.cartButton} onPress={onAddToCart}>
          <Text style={styles.cartText}>Add To Cart</Text>
          <View style={styles.cartLineArrow}>
            <View style={styles.line} />
            <Text style={styles.arrow}>➝</Text>
          </View>
        </Pressable>
      </View>

      {/* Right Section */}
      <View
        style={[
          styles.rightSection,
          (isMobile || isTablet) && styles.fullWidth,
        ]}>
        <Image
          source={{uri: imageUri}}
          style={[
            styles.productImage,
            {
              width: imageWidth,
              alignSelf: isMobile ? 'center' : 'flex-end',
            },
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    padding: 24,
    backgroundColor: '#FAF6EF',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginBottom: 32,
  },
  mobileContainer: {
    flexDirection: 'column',
    alignItems: 'flex-start',
  },
  tabletContainer: {
    flexDirection: 'column',
    alignItems: 'center',
  },
  desktopContainer: {
    flexDirection: 'row',
  },
  leftSection: {
    flex: 1,
    paddingRight: 16,
  },
  rightSection: {
    flex: 1,
    alignItems: 'flex-end',
    marginTop: 12,
  },
  fullWidth: {
    width: '100%',
    paddingRight: 0,
  },
  title: {
    fontSize: 26,
    color: '#C7A451',
    fontWeight: 'bold',
    marginBottom: 12,
    fontFamily: Platform.select({ios: 'serif', android: 'serif'}),
  },
  titleMobile: {
    fontSize: 22,
  },
  description: {
    fontSize: 16,
    lineHeight: 22,
    color: '#000',
    marginBottom: 24,
    fontFamily: Platform.select({ios: 'sans-serif', android: 'sans-serif'}),
  },
  descriptionMobile: {
    fontSize: 14,
    lineHeight: 20,
  },
  cartButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
  },
  cartText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    fontFamily: 'serif',
  },
  cartLineArrow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 16,
  },
  line: {
    width: 100,
    height: 1,
    backgroundColor: '#000',
  },
  arrow: {
    marginLeft: 8,
    fontSize: 18,
    color: '#000',
  },
  productImage: {
    height: 300,
    resizeMode: 'contain',
    borderRadius: 8,
  },
});
