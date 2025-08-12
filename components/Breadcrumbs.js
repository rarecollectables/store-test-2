import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { colors, fontFamily, spacing } from '../theme';

/**
 * Breadcrumbs Component for navigation and SEO
 * 
 * @param {Object} props
 * @param {Array} props.items - Array of breadcrumb items with label and path
 * @param {string} props.currentPageLabel - Label for the current page
 */
export default function Breadcrumbs({ items = [], currentPageLabel }) {
  const router = useRouter();
  
  // Add structured data for breadcrumbs (web only)
  useEffect(() => {
    if (typeof document !== 'undefined') {
      // Create breadcrumb structured data
      const breadcrumbList = {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": [
          // Home is always the first item
          {
            "@type": "ListItem",
            "position": 1,
            "name": "Home",
            "item": "https://rarecollectables.co.uk/"
          }
        ]
      };
      
      // Add all items from props
      items.forEach((item, index) => {
        breadcrumbList.itemListElement.push({
          "@type": "ListItem",
          "position": index + 2, // +2 because home is position 1
          "name": item.label,
          "item": `https://rarecollectables.co.uk${item.path}`
        });
      });
      
      // Add current page as last item
      if (currentPageLabel) {
        breadcrumbList.itemListElement.push({
          "@type": "ListItem",
          "position": items.length + 2,
          "name": currentPageLabel
        });
      }
      
      // Add the structured data to the page
      const script = document.createElement('script');
      script.type = 'application/ld+json';
      script.innerHTML = JSON.stringify(breadcrumbList);
      script.id = 'breadcrumb-jsonld';
      
      // Remove any existing breadcrumb structured data
      const existingScript = document.getElementById('breadcrumb-jsonld');
      if (existingScript) {
        existingScript.remove();
      }
      
      document.head.appendChild(script);
      
      // Clean up on unmount
      return () => {
        const scriptToRemove = document.getElementById('breadcrumb-jsonld');
        if (scriptToRemove) {
          scriptToRemove.remove();
        }
      };
    }
  }, [items, currentPageLabel]);
  
  return (
    <View style={styles.container} accessibilityRole="navigation" aria-label="Breadcrumb">
      <Pressable 
        onPress={() => router.push('/')} 
        accessibilityRole="link" 
        accessibilityLabel="Home"
      >
        <Text style={styles.link}>Home</Text>
      </Pressable>
      
      {items.map((item, index) => (
        <View key={`breadcrumb-${index}`} style={styles.itemContainer}>
          <Text style={styles.separator}>/</Text>
          <Pressable 
            onPress={() => router.push(item.path)} 
            accessibilityRole="link" 
            accessibilityLabel={item.label}
          >
            <Text style={styles.link}>{item.label}</Text>
          </Pressable>
        </View>
      ))}
      
      {currentPageLabel && (
        <View style={styles.itemContainer}>
          <Text style={styles.separator}>/</Text>
          <Text style={styles.currentPage}>{currentPageLabel}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  itemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  link: {
    color: colors.gold,
    fontSize: 14,
    fontFamily: fontFamily.sans,
    marginHorizontal: 4,
  },
  currentPage: {
    color: colors.onyxBlack,
    fontSize: 14,
    fontFamily: fontFamily.sans,
    marginHorizontal: 4,
  },
  separator: {
    color: colors.onyxBlack,
    fontSize: 14,
    marginHorizontal: 2,
  }
});
