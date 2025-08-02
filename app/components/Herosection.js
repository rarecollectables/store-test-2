import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ImageBackground,
  TouchableOpacity,
  useWindowDimensions,
} from 'react-native';

export default function HeroSection() {
  const {width} = useWindowDimensions();

  return (
    <ImageBackground
      source={{
        uri: 'https://fhybeyomiivepmlrampr.supabase.co/storage/v1/object/public/products/Necklaces/25-ElegantBlue-Necklace-3.jpg', // Replace with your HD hero image
      }}
      resizeMode="cover"
      style={[styles.background, {height: width > 768 ? 500 : 400}]}>
      <View style={styles.overlay} />

      <View style={styles.contentWrapper}>
        <View style={styles.textBox}>
          <Text style={styles.label}>PREMIUM JEWELLERY</Text>
          <Text style={styles.heading}>
            Desire Meets{'\n'}New Style Jewellery
          </Text>
          <Text style={styles.description}>
            Sed viverra ipsum nunc aliquet bibendum enim facilisis gravida
            neque. In hac habitasse platea dictumst vestibulum rhoncus est.
          </Text>

          <TouchableOpacity style={styles.button}>
            <Text style={styles.buttonText}>Explore Now →</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    width: '100%',
    justifyContent: 'center',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.5)', // Optional soft overlay to help text visibility
  },
  contentWrapper: {
    paddingHorizontal: 24,
    paddingVertical: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  textBox: {
    maxWidth: 500,
    // backgroundColor: 'rgba(255,255,255,0.85)',
    padding: 24,
    borderRadius: 12,
  },
  label: {
    fontSize: 14,
    color: '#000',
    fontWeight: '600',
    fontFamily: 'serif',
    marginBottom: 8,
  },
  heading: {
    fontSize: 32,
    color: '#C9A557',
    fontWeight: 'bold',
    fontFamily: 'serif',
    marginBottom: 16,
    lineHeight: 38,
  },
  description: {
    fontSize: 16,
    color: '#333',
    fontFamily: 'serif',
    marginBottom: 24,
  },
  button: {
    width: '50%',
    backgroundColor: '#C9A557',
    paddingVertical: 12,
    paddingHorizontal: 28,
    borderRadius: 30,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'serif',
    fontWeight: '600',
  },
});
