import React from 'react';
import SEO from './SEO';

/**
 * CategorySEO Component for adding optimized meta tags to category pages
 * 
 * @param {Object} props
 * @param {string} props.category - Category name
 * @param {string} props.description - Optional custom description
 * @param {string} props.image - Optional custom image URL
 */
export default function CategorySEO({ category, description, image }) {
  // Default category descriptions for SEO
  const categoryDescriptions = {
    'Necklaces': 'Discover our stunning collection of luxury necklaces at Rare Collectables. From elegant pendants to statement pieces, find the perfect necklace to elevate your style.',
    'Bracelets': 'Browse our exquisite range of luxury bracelets at Rare Collectables. From delicate chains to statement cuffs, find the perfect bracelet to complement your style.',
    'Earrings': 'Explore our beautiful collection of luxury earrings at Rare Collectables. From classic studs to elegant drops, find the perfect pair to enhance your look.',
    'Rings': 'Shop our stunning collection of luxury rings at Rare Collectables. From statement pieces to elegant bands, find the perfect ring to express your style.',
    'Watches': 'Discover our premium collection of luxury watches at Rare Collectables. From classic timepieces to modern designs, find the perfect watch to elevate your style.',
    'Accessories': 'Browse our exclusive range of luxury accessories at Rare Collectables. From elegant cufflinks to stylish keyrings, find the perfect accessory to complete your look.',
  };
  
  // Default category images for SEO
  const categoryImages = {
    'Necklaces': 'https://fhybeyomiivepmlrampr.supabase.co/storage/v1/object/public/products/Necklaces/1-2-Necklace.avif',
    'Bracelets': 'https://fhybeyomiivepmlrampr.supabase.co/storage/v1/object/public/products/Bracelets/1-Bracelet.avif',
    'Earrings': 'https://fhybeyomiivepmlrampr.supabase.co/storage/v1/object/public/products/Earrings/1-Earrings.avif',
    'Rings': 'https://fhybeyomiivepmlrampr.supabase.co/storage/v1/object/public/products/Rings/1-Ring.avif',
    'Watches': 'https://fhybeyomiivepmlrampr.supabase.co/storage/v1/object/public/products/Watches/1-Watch.avif',
    'Accessories': 'https://fhybeyomiivepmlrampr.supabase.co/storage/v1/object/public/products/Accessories/1-Accessory.avif',
  };
  
  // Get category-specific description or use provided description or fallback
  const seoDescription = description || 
    (category && categoryDescriptions[category]) || 
    `Shop our collection of luxury ${category || 'items'} at Rare Collectables. Discover affordable luxury pieces designed to make every moment special.`;
  
  // Get category-specific image or use provided image or fallback
  const seoImage = image || 
    (category && categoryImages[category]) || 
    'https://fhybeyomiivepmlrampr.supabase.co/storage/v1/object/public/products/Necklaces/1-2-Necklace.avif';
  
  // Create structured data for category page
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "name": `${category || 'Products'} | Rare Collectables`,
    "description": seoDescription,
    "url": `https://rarecollectables.co.uk/shop/${category ? category.toLowerCase() : ''}`,
    "image": seoImage,
    "mainEntity": {
      "@type": "ItemList",
      "itemListElement": [
        {
          "@type": "ListItem",
          "position": 1,
          "name": `${category || 'Products'} Collection`,
          "url": `https://rarecollectables.co.uk/shop/${category ? category.toLowerCase() : ''}`
        }
      ]
    }
  };
  
  return (
    <SEO
      title={`${category || 'Products'} | Rare Collectables`}
      description={seoDescription}
      image={seoImage}
      url={`https://rarecollectables.co.uk/shop/${category ? category.toLowerCase() : ''}`}
      type="website"
      structuredData={structuredData}
    />
  );
}
