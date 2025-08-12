import React from 'react';
import SEO from './SEO';

/**
 * BlogSEO Component for adding blog-specific meta tags and structured data
 * 
 * @param {Object} props
 * @param {string} props.title - Blog post title
 * @param {string} props.description - Blog post description/excerpt
 * @param {string} props.image - Featured image URL
 * @param {string} props.url - Canonical URL for the blog post
 * @param {string} props.publishDate - ISO date string when the post was published
 * @param {string} props.modifiedDate - ISO date string when the post was last modified
 * @param {string} props.author - Author name
 * @param {string} props.category - Blog post category
 */
export default function BlogSEO({ 
  title, 
  description, 
  image, 
  url, 
  publishDate,
  modifiedDate,
  author = 'Rare Collectables Team',
  category
}) {
  // Create structured data for the blog post
  const blogStructuredData = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "headline": title,
    "image": image,
    "datePublished": publishDate,
    "dateModified": modifiedDate || publishDate,
    "author": {
      "@type": "Organization",
      "name": author
    },
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
      "@id": url
    },
    "description": description,
    "keywords": [
      "heart-crafted jewelry", 
      "sustainable jewelry", 
      "conflict-free stones", 
      "jewelry gifts for women",
      category.toLowerCase()
    ]
  };

  return (
    <SEO
      title={`${title} | Rare Collectables Blog`}
      description={description}
      image={image}
      url={url}
      type="article"
      structuredData={blogStructuredData}
    />
  );
}
