import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, useWindowDimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase/client';
import { formatPrice } from '../../utils/formatters';
import { colors, spacing, borderRadius, fontFamily, shadows } from '../../theme';

const TagRecommendations = ({ tag }) => {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isMobile = width < 768;

  // Format tag for display (replace hyphens with spaces and capitalize)
  const formatTagName = (tag) => {
    return tag
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  useEffect(() => {
    const fetchRecommendations = async () => {
      try {
        setLoading(true);
        
        // Fetch products with the same tag, limit to 4
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .contains('tags', [tag])
          .limit(4);
          
        if (error) throw error;
        
        setRecommendations(data || []);
      } catch (error) {
        console.error('Error fetching recommendations:', error);
      } finally {
        setLoading(false);
      }
    };
    
    if (tag) {
      fetchRecommendations();
    }
  }, [tag]);

  const handleProductPress = (productId) => {
    router.push(`/product/${productId}`);
  };

  if (loading || recommendations.length === 0) {
    return null; // Don't show anything while loading or if no recommendations
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>More {formatTagName(tag)} Items You'll Love</Text>
      
      <FlatList
        data={recommendations}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <Pressable 
            style={[styles.card, isMobile && styles.cardMobile]} 
            onPress={() => handleProductPress(item.id)}
          >
            {item.images && item.images.length > 0 && (
              <View style={styles.imageContainer}>
                <img 
                  src={item.images[0]} 
                  alt={item.name}
                  style={styles.image}
                />
              </View>
            )}
            <View style={styles.cardContent}>
              <Text style={styles.productName} numberOfLines={2}>{item.name}</Text>
              <Text style={styles.price}>{formatPrice(item.price)}</Text>
            </View>
          </Pressable>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.xl * 2,
    paddingHorizontal: spacing.lg,
  },
  title: {
    fontFamily: fontFamily.serif,
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.onyxBlack,
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  listContent: {
    paddingVertical: spacing.md,
  },
  card: {
    width: 220,
    marginRight: spacing.lg,
    borderRadius: borderRadius.md,
    backgroundColor: colors.white,
    overflow: 'hidden',
    ...shadows.md,
  },
  cardMobile: {
    width: 160,
  },
  imageContainer: {
    width: '100%',
    height: 180,
    backgroundColor: colors.lightGray,
  },
  image: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  cardContent: {
    padding: spacing.md,
  },
  productName: {
    fontFamily: fontFamily.sans,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: spacing.xs,
    color: colors.onyxBlack,
  },
  price: {
    fontFamily: fontFamily.sans,
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.gold,
  },
});

export default TagRecommendations;
