import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Image } from 'expo-image';

// Custom component to display Flaticon icons
export default function FlatIcon({ name, size = 24, color = '#000', style }) {
  // Map of icon names to their asset paths
  const iconMap = {
    'home-outline': require('../../assets/icons/home-outline.svg'),
    'shopping-bag-outline': require('../../assets/icons/shopping-bag-outline.svg'),
  };

  // Get the icon source based on name
  const source = iconMap[name];
  
  if (!source) {
    console.warn(`Icon "${name}" not found in FlatIcon component`);
    return <View style={{ width: size, height: size }} />;
  }

  return (
    <Image
      source={source}
      style={[
        {
          width: size,
          height: size,
          tintColor: color,
        },
        style,
      ]}
      contentFit="contain"
    />
  );
}

const styles = StyleSheet.create({});
