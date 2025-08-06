import React from 'react';
import { View, Text, Image, StyleSheet, useWindowDimensions } from 'react-native';
import { colors, spacing, borderRadius, fontFamily, shadows } from '../../theme';

const TagBanner = ({ tag }) => {
  const { width } = useWindowDimensions();
  const isMobile = width < 768;
  
  // Format tag for display (replace hyphens with spaces and capitalize)
  const formatTagName = (tag) => {
    return tag
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  // Map tags to specific banner images and taglines
  const getBannerDetails = (tag) => {
    // Use a single existing banner image for all tags for now
    const bannerImage = require('../../assets/images/banners/celebrate love.webp');
    
    const tagMap = {
      'heart-pendant': {
        image: bannerImage,
        tagline: 'Express your love with our exquisite heart pendants',
      },
      'silver-earrings': {
        image: bannerImage,
        tagline: 'Elegant silver earrings for every occasion',
      },
      // Add more tag mappings as needed
    };
    
    // Return the mapped details or fallback
    return tagMap[tag] || {
      image: bannerImage,
      tagline: `Discover our beautiful ${formatTagName(tag)} collection`,
    };
  };

  const bannerDetails = getBannerDetails(tag);

  return (
    <View style={[styles.container, isMobile && styles.containerMobile]}>
      <Image 
        source={bannerDetails.image}
        style={styles.bannerImage}
        resizeMode="cover"
      />
      <View style={styles.overlay}>
        <Text style={[styles.title, isMobile && styles.titleMobile]}>
          {formatTagName(tag)}
        </Text>
        <Text style={[styles.tagline, isMobile && styles.taglineMobile]}>
          {bannerDetails.tagline}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: 300,
    marginBottom: spacing.xl,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    position: 'relative',
    ...shadows.lg,
  },
  containerMobile: {
    height: 200,
  },
  bannerImage: {
    width: '100%',
    height: '100%',
  },
  overlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: spacing.xl,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  title: {
    fontFamily: fontFamily.serif,
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.white,
    marginBottom: spacing.sm,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  titleMobile: {
    fontSize: 24,
  },
  tagline: {
    fontFamily: fontFamily.sans,
    fontSize: 18,
    color: colors.white,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  taglineMobile: {
    fontSize: 14,
  },
});

export default TagBanner;
