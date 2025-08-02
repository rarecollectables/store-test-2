import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  Pressable,
  useWindowDimensions,
} from 'react-native';
import {colors, fontFamily, spacing} from '../../theme';

export default function ProductShowcase() {
  const {width} = useWindowDimensions();

  return (
    <View style={styles.container}>
      {/* Top Selections */}
      <View style={styles.selectionContainer}>
        {[
          {title: 'Gold selection', icon: '💍'},
          {title: 'Diamond selection', icon: '💎'},
          {title: 'Silver selection', icon: '📿'},
        ].map((item, index) => (
          <View key={index} style={styles.selectionItem}>
            <Text style={styles.icon}>{item.icon}</Text>
            <Text style={styles.selectionTitle}>{item.title}</Text>
            <Text style={styles.selectionSubtitle}>
              Our consultants will help you to choose the{'\n'}right size Design
              your ring
            </Text>
          </View>
        ))}
      </View>

      {/* Product Details */}
      <View style={styles.productSection}>
        <View style={styles.textBlock}>
          <Text style={styles.productTitle}>
            Silver Round Bracelet For Women
          </Text>
          <Text style={styles.description}>
            Lorem Ipsum is simply dummy text of the printing and typesetting
            industry. Lorem Ipsum has been the industry's standard dummy text
            ever since the 1500s...
          </Text>
          <Pressable style={styles.addToCartBtn}>
            <Text style={styles.addToCartText}>Add To Cart</Text>
            <Text style={styles.arrow}>→</Text>
          </Pressable>
        </View>

        <View style={styles.imageBlock}>
          <Image
            source={{uri: 'https://example.com/bracelet.png'}} // replace with actual image
            style={styles.productImage}
            resizeMode="contain"
          />
          <View style={styles.verticalCounter}>
            <Text style={styles.counterText}>01</Text>
            <View style={styles.counterBar} />
            <Text style={styles.counterText}>03</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FAF8F3',
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
  selectionContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: spacing.xl,
  },
  selectionItem: {
    alignItems: 'center',
    maxWidth: 120,
  },
  icon: {
    fontSize: 28,
    marginBottom: 8,
  },
  selectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    fontFamily: fontFamily.serif,
    textAlign: 'center',
    marginBottom: 4,
  },
  selectionSubtitle: {
    textAlign: 'center',
    fontSize: 12,
    color: colors.darkGray,
    fontFamily: fontFamily.sans,
  },
  productSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  textBlock: {
    flex: 1,
    maxWidth: 480,
    paddingRight: spacing.lg,
  },
  productTitle: {
    fontSize: 20,
    color: colors.gold,
    fontWeight: '600',
    fontFamily: fontFamily.serif,
    marginBottom: spacing.md,
  },
  description: {
    fontSize: 14,
    lineHeight: 22,
    color: colors.gray,
    fontFamily: fontFamily.sans,
    marginBottom: spacing.lg,
  },
  addToCartBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderColor: colors.black,
    paddingBottom: 4,
    width: 160,
  },
  addToCartText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 8,
    fontFamily: fontFamily.sans,
  },
  arrow: {
    fontSize: 18,
  },
  imageBlock: {
    flex: 1,
    alignItems: 'center',
    position: 'relative',
  },
  productImage: {
    width: 250,
    height: 250,
  },
  verticalCounter: {
    position: 'absolute',
    right: -30,
    top: '40%',
    alignItems: 'center',
  },
  counterText: {
    fontSize: 12,
    fontFamily: fontFamily.sans,
    marginVertical: 4,
  },
  counterBar: {
    width: 2,
    height: 40,
    backgroundColor: colors.black,
  },
});
