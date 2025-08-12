import React from 'react';
import SEO from './SEO';

/**
 * ArticleSEO Component for adding optimized meta tags to article/policy pages
 * 
 * @param {Object} props
 * @param {string} props.title - Article title
 * @param {string} props.description - Article description
 * @param {string} props.image - Optional image URL
 * @param {string} props.path - Page path (e.g., '/privacy-policy')
 * @param {string} props.publishedDate - Optional ISO date string when the article was published
 * @param {string} props.modifiedDate - Optional ISO date string when the article was last modified
 */
export default function ArticleSEO({ 
  title, 
  description, 
  image, 
  path,
  publishedDate,
  modifiedDate
}) {
  // Default image for articles
  const defaultImage = 'https://fhybeyomiivepmlrampr.supabase.co/storage/v1/object/public/products/Necklaces/1-2-Necklace.avif';
  
  // Format dates for structured data
  const published = publishedDate || new Date().toISOString();
  const modified = modifiedDate || published;
  
  // Create structured data for article page
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": title,
    "description": description,
    "image": image || defaultImage,
    "datePublished": published,
    "dateModified": modified,
    "publisher": {
      "@type": "Organization",
      "name": "Rare Collectables",
      "logo": {
        "@type": "ImageObject",
        "url": "https://rarecollectables.co.uk/logo.png"
      }
    },
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": `https://rarecollectables.co.uk${path}`
    }
  };
  
  return (
    <SEO
      title={title}
      description={description}
      image={image || defaultImage}
      url={`https://rarecollectables.co.uk${path}`}
      type="article"
      structuredData={structuredData}
    />
  );
}
