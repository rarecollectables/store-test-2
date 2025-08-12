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
    const price = parseFloat(product.price).toFixed(2);
    
    // Calculate availability
    const availability = product.stock > 0 
      ? 'https://schema.org/InStock' 
      : 'https://schema.org/OutOfStock';

    // Build the structured data object
    const structuredData = {
      '@context': 'https://schema.org/',
      '@type': 'Product',
      name: product.name,
      image: Array.isArray(product.images) && product.images.length > 0 
        ? product.images.map(img => typeof img === 'string' ? img : img.uri).filter(Boolean)
        : product.image,
      description: product.description,
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
      // Add structured data script
      const script = document.createElement('script');
      script.type = 'application/ld+json';
      script.text = JSON.stringify(structuredData);
      document.head.appendChild(script);
      
      // Add meta description if not present
      if (!document.querySelector('meta[name="description"]')) {
        const metaDescription = document.createElement('meta');
        metaDescription.name = 'description';
        metaDescription.content = product.description?.substring(0, 160) || 
          `Buy ${product.name} from Rare Collectables - Unique collectible items`;
        document.head.appendChild(metaDescription);
      }
      
      // Add canonical URL
      const canonicalLink = document.createElement('link');
      canonicalLink.rel = 'canonical';
      canonicalLink.href = `https://rarecollectables.co.uk/product/${product.id}`;
      document.head.appendChild(canonicalLink);
      
      // Clean up function to remove added elements when component unmounts
      return () => {
        document.head.removeChild(script);
        if (document.querySelector('meta[name="description"]')) {
          document.head.removeChild(document.querySelector('meta[name="description"]'));
        }
        document.head.removeChild(canonicalLink);
      };
    } catch (error) {
      console.error('Error adding structured data:', error);
    }
  }, [product]);

  // This component doesn't render anything visible
  return null;
}
