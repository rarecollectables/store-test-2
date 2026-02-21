import React, { useEffect } from 'react';
import { View, Platform } from 'react-native';

/**
 * Component to add JSON-LD structured data for products
 * This helps search engines understand product information
 * and can enable rich results in search listings
 */
export default function ProductStructuredData({ product }) {
  // Only run on web platform
  useEffect(() => {
    if (Platform.OS !== 'web' || !product) return;
    
    // Format price correctly
    const numericPrice = typeof product.price === 'number'
      ? product.price
      : parseFloat(String(product.price || '').replace(/[^0-9.]/g, ''));
    const price = Number.isFinite(numericPrice) ? numericPrice.toFixed(2) : '0.00';
    
    // Calculate availability
    const availability = product.stock > 0 
      ? 'https://schema.org/InStock' 
      : 'https://schema.org/OutOfStock';

    const title = product.title || product.name || 'Product';
    const description = product.short_description || product.description || '';
    const images = [
      product.image_url || product.image,
      ...(Array.isArray(product.additional_images) ? product.additional_images : [])
    ].filter(Boolean);

    // Build the structured data object
    const structuredData = {
      '@context': 'https://schema.org/',
      '@type': 'Product',
      name: title,
      image: images.length > 0 ? images : undefined,
      description: description,
      sku: product.id,
      brand: {
        '@type': 'Brand',
        name: 'Rare Collectables'
      },
      offers: {
        '@type': 'Offer',
        url: `https://rarecollectables.co.uk/product/${product.id}`,
        priceCurrency: 'GBP',
        price: price,
        availability: availability,
        itemCondition: 'https://schema.org/NewCondition'
      }
    };

    // Add review data if available
    if (product.reviews && product.reviews.length > 0) {
      const reviewCount = product.reviews.length;
      const ratingSum = product.reviews.reduce((sum, review) => sum + review.rating, 0);
      const ratingValue = (ratingSum / reviewCount).toFixed(1);
      
      structuredData.aggregateRating = {
        '@type': 'AggregateRating',
        ratingValue: ratingValue,
        reviewCount: reviewCount
      };
      
      // Add individual reviews (limit to 5 for performance)
      structuredData.review = product.reviews.slice(0, 5).map(review => ({
        '@type': 'Review',
        author: {
          '@type': 'Person',
          name: review.author || 'Anonymous'
        },
        reviewRating: {
          '@type': 'Rating',
          ratingValue: review.rating
        },
        datePublished: review.date || new Date().toISOString().split('T')[0],
        reviewBody: review.text
      }));
    }

    // Add meta tags for SEO
    try {
      let script = document.getElementById('product-structured-data');
      if (!script) {
        script = document.createElement('script');
        script.id = 'product-structured-data';
        script.type = 'application/ld+json';
        document.head.appendChild(script);
      }
      script.text = JSON.stringify(structuredData);
    } catch (error) {
      console.error('Error adding structured data:', error);
    }
  }, [product]);

  // This component doesn't render anything visible
  return null;
}
