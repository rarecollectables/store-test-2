import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Pressable,
  useWindowDimensions,
} from 'react-native';

import {useRouter} from 'expo-router'; // or 'next/router' if you're using Next.js Web

import ProductCard from '../(components)/products/ProductCard';
import {productsService} from '../../lib/supabase/services';
import {colors, spacing, borderRadius, fontFamily, shadows} from '../../theme';

export default function ProductsByCategorySection({
  title,
  categoryId,
  cardWidth,
  numColumns = 2,
  onAddToCartSuccess,
}) {
  const {width} = useWindowDimensions();
  const router = useRouter(); // needed for navigation
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    async function fetchProducts() {
      setLoading(true);
      setError(null);
      try {
        const all = await productsService.getAllProducts();
        const filtered = all.filter(
          item =>
            item.category?.toLowerCase() === categoryId?.toLowerCase() ||
            item.tags?.includes(categoryId),
        );
        if (mounted) setProducts(filtered);
      } catch (err) {
        if (mounted) setError('Failed to load products.');
      } finally {
        if (mounted) setLoading(false);
      }
    }

    fetchProducts();
    return () => {
      mounted = false;
    };
  }, [categoryId]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.gold} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  const displayProducts = products.slice(0, 8); // ✅ Limit to 8

  if (!displayProducts.length) return null;

  return (
    <View style={styles.sectionContainer}>
      {title && <Text style={styles.sectionTitle}>{title}</Text>}

      <FlatList
        data={displayProducts}
        horizontal={numColumns === 1}
        numColumns={numColumns}
        keyExtractor={item => item.id}
        renderItem={({item}) => (
          <View style={numColumns === 1 ? styles.mobileCardSpacing : undefined}>
            <ProductCard
              item={item}
              cardWidth={cardWidth}
              disableImageCycling={true}
              onAddToCartSuccess={onAddToCartSuccess}
            />
          </View>
        )}
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.listContent, {paddingHorizontal: 16}]}
        columnWrapperStyle={numColumns > 1 ? styles.columnWrapper : undefined}
      />

      {/* ✅ View All Button */}
      {products.length > 8 && (
        <Pressable
          onPress={() =>
            router.push(`/shop?category=${encodeURIComponent(categoryId)}`)
          }
          style={styles.viewAllButton}>
          <Text style={styles.viewAllText}>View All</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  sectionContainer: {
    width: '100%',
    maxWidth: 1200,
    alignSelf: 'center',
    backgroundColor: colors.ivory,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.xl,
    marginBottom: spacing.xl,
    alignItems: 'center',
    ...shadows.card,
  },
  sectionTitle: {
    fontFamily: fontFamily.serif,
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.gold,
    marginBottom: spacing.lg,
    textAlign: 'center',
    alignSelf: 'center',
  },
  listContent: {
    gap: spacing.lg,
    paddingVertical: spacing.md,
  },
  mobileCardSpacing: {
    marginRight: spacing.md,
  },
  errorContainer: {
    padding: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    color: colors.red,
    fontSize: 16,
    fontFamily: fontFamily.sans,
    textAlign: 'center',
  },
  loadingContainer: {
    padding: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  columnWrapper: {
    gap: spacing.lg,
  },
  viewAllButton: {
    marginTop: spacing.md,
    backgroundColor: colors.gold,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
  },
  viewAllText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: fontFamily.sans,
  },
});
