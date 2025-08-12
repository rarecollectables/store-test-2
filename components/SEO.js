import React, { useEffect } from 'react';
import { Platform } from 'react-native';

/**
 * SEO Component for adding meta tags to improve search engine crawlability
 * 
 * @param {Object} props
 * @param {string} props.title - Page title
 * @param {string} props.description - Meta description (max 160 characters)
 * @param {string} props.image - URL to the main image for social sharing
 * @param {string} props.url - Canonical URL for the page
 * @param {string} props.type - Content type (default: website)
 * @param {Object} props.structuredData - Optional JSON-LD structured data
 */
export default function SEO({ 
  title, 
  description, 
  image, 
  url, 
  type = 'website',
  structuredData = null
}) {
  // Only run on web platform
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    
    try {
      // Set document title
      document.title = title ? `${title} | Rare Collectables` : 'Rare Collectables - Unique Collectible Items';
      
      // Helper function to create or update meta tags
      const setMetaTag = (name, content) => {
        if (!content) return;
        
        // Check if meta tag exists
        let meta = document.querySelector(`meta[name="${name}"]`) || 
                   document.querySelector(`meta[property="${name}"]`);
        
        // Create if it doesn't exist
        if (!meta) {
          meta = document.createElement('meta');
          if (name.startsWith('og:')) {
            meta.setAttribute('property', name);
          } else {
            meta.setAttribute('name', name);
          }
          document.head.appendChild(meta);
        }
        
        // Set content
        meta.setAttribute('content', content);
      };
      
      // Set basic meta tags
      setMetaTag('description', description);
      
      // Open Graph tags (Facebook, LinkedIn, etc.)
      setMetaTag('og:title', title);
      setMetaTag('og:description', description);
      setMetaTag('og:type', type);
      setMetaTag('og:url', url);
      setMetaTag('og:image', image);
      setMetaTag('og:site_name', 'Rare Collectables');
      
      // Twitter Card tags
      setMetaTag('twitter:card', 'summary_large_image');
      setMetaTag('twitter:title', title);
      setMetaTag('twitter:description', description);
      setMetaTag('twitter:image', image);
      
      // Additional meta tags for better SEO
      setMetaTag('author', 'Rare Collectables');
      setMetaTag('robots', 'index, follow');
      
      // Add canonical URL
      let canonicalLink = document.querySelector('link[rel="canonical"]');
      if (!canonicalLink && url) {
        canonicalLink = document.createElement('link');
        canonicalLink.rel = 'canonical';
        document.head.appendChild(canonicalLink);
      }
      if (canonicalLink && url) {
        canonicalLink.href = url;
      }
      
      // Add structured data if provided
      if (structuredData) {
        let script = document.querySelector('script[type="application/ld+json"]');
        if (!script) {
          script = document.createElement('script');
          script.type = 'application/ld+json';
          document.head.appendChild(script);
        }
        script.textContent = JSON.stringify(structuredData);
      }
      
      // Clean up function
      return () => {
        // We don't remove meta tags on cleanup to avoid flickering
        // when navigating between pages
      };
    } catch (error) {
      console.error('Error setting SEO meta tags:', error);
    }
  }, [title, description, image, url, type, structuredData]);
  
  // This component doesn't render anything visible
  return null;
}
