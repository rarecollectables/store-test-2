import React from 'react';
import {
  View,
  Text,
  ImageBackground,
  StyleSheet,
  useWindowDimensions,
  Platform,
} from 'react-native';
import {borderRadius, colors, fontFamily, shadows, spacing} from '../../theme';

const offers = [
  {
    id: 1,
    title: 'DAZZLING GOLD\nBRACELET COLLECTION',
    subtitle: 'Grace your wrist with timeless elegance.',
    image:
      'https://fhybeyomiivepmlrampr.supabase.co/storage/v1/object/public/products/Bracelets/14-bracelets-1.avif',
  },
  {
    id: 2,
    title: 'ELEGANT PINK\nNECKLACE EXCLUSIVE',
    subtitle: 'Celebrate every moment in radiant style.',
    image:
      'https://fhybeyomiivepmlrampr.supabase.co/storage/v1/object/public/products/Necklaces/24-ElegantPink-Necklace-1.webp',
  },
];

export default function ExclusiveOffers() {
  const {width} = useWindowDimensions();

  const isMobile = width < 768;
  const isTablet = width >= 768 && width < 1024;
  const isDesktop = width >= 1024;

  const cardWidth = isDesktop
    ? width / 3 - 48
    : isTablet
    ? width / 2 - 32
    : width - 32;

  return (
    <View style={[styles.container]}>
      <Text
        style={[
          styles.heading,
          isTablet && styles.headingTablet,
          isDesktop && styles.headingDesktop,
        ]}>
        Exclusive Offer!
      </Text>
      <Text
        style={[
          styles.subheading,
          isTablet && styles.subheadingTablet,
          isDesktop && styles.subheadingDesktop,
        ]}>
        Discover unbeatable prices on our best-selling products and treat
        yourself to something special today
      </Text>

      <View
        style={[
          styles.cardRow,
          isDesktop ? {justifyContent: 'space-between'} : {},
        ]}>
        {offers.map(offer => (
          <ImageBackground
            key={offer.id}
            source={{uri: offer.image}}
            style={[styles.card, {width: cardWidth}]}
            imageStyle={styles.cardImage}>
            <View style={styles.cardOverlay}>
              <Text
                style={[
                  styles.cardTitle,
                  isTablet && styles.cardTitleTablet,
                  isDesktop && styles.cardTitleDesktop,
                ]}>
                {offer.title}
              </Text>
              <Text
                style={[
                  styles.cardSubtitle,
                  isTablet && styles.cardSubtitleTablet,
                  isDesktop && styles.cardSubtitleDesktop,
                ]}>
                {offer.subtitle}
              </Text>
            </View>
          </ImageBackground>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    maxWidth: 1200,
    // maxWidth: '100%',
    // backgroundColor: '#FAF7EF',
    // paddingVertical: 40,
    // paddingHorizontal: 16,
    alignSelf: 'center',
    // alignItems: 'center',
    backgroundColor: colors.ivory,
        borderRadius: borderRadius.lg,
        paddingVertical: spacing.xl,
        marginBottom: spacing.xl,
        alignItems: 'center',
        ...shadows.card,
  },
  containerMobile: {
    paddingVertical: 24,
  },
  heading: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#C9A557',
    fontFamily: fontFamily.serif,
    textAlign: 'center',
    marginBottom: 12,
  },
  headingTablet: {
    fontSize: 26,
  },
  headingDesktop: {
    fontSize: 32,
  },
  subheading: {
    color: '#333',
    fontSize: 14,
    textAlign: 'center',
    fontFamily: fontFamily.serif,
    marginBottom: 24,
    paddingHorizontal: 8,
  },
  subheadingTablet: {
    fontSize: 15,
    paddingHorizontal: 32,
  },
  subheadingDesktop: {
    fontSize: 16,
    maxWidth: 600,
  },
  cardRow: {
    width: '80%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 16,
  },
  card: {
    height: 240,
    borderRadius: 12,
    overflow: 'hidden',
    padding: 20,
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.gold,
  },
  cardImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
    borderRadius: 12,
  },
  cardOverlay: {
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderRadius: 12,
    padding: 12,
  },
  cardTitle: {
    fontSize: 18,
    color: '#3E3E3E',
    fontWeight: 'bold',
    fontFamily: fontFamily.serif,
    marginBottom: 8,
    lineHeight: 24,
  },
  cardTitleTablet: {
    fontSize: 20,
  },
  cardTitleDesktop: {
    fontSize: 24,
    lineHeight: 30,
  },
  cardSubtitle: {
    fontSize: 13,
    color: '#5A5A5A',
    fontFamily: fontFamily.serif,
  },
  cardSubtitleTablet: {
    fontSize: 14,
  },
  cardSubtitleDesktop: {
    fontSize: 16,
  },
});
