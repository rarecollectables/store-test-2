const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Get environment variables
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Error: Supabase configuration is missing.');
  console.error('Please ensure EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY are set in your environment.');
  process.exit(1);
}

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const siteUrl = 'https://rarecollectables.co.uk';
const currentDate = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format for lastmod

async function generateSitemap() {
  try {
    console.log('Fetching products from Supabase...');
    
    // Fetch all products from Supabase
    const { data: products, error } = await supabase
      .from('products')
      .select('id, category, updated_at')
      .order('id');

    if (error) {
      console.error('Error fetching products:', error);
      process.exit(1);
    }

    console.log(`Found ${products.length} products`);

    // Get unique categories
    const uniqueCategories = [...new Set(products.map(p => p.category))];
    console.log(`Found ${uniqueCategories.length} categories:`, uniqueCategories);

    let urls = [
      { 
        loc: `${siteUrl}/`, 
        priority: 1.0,
        lastmod: currentDate,
        changefreq: 'daily'
      },
      { 
        loc: `${siteUrl}/shop`, 
        priority: 0.9,
        lastmod: currentDate,
        changefreq: 'daily'
      },
    ];

    // Add category pages
    uniqueCategories.forEach(category => {
      urls.push({
        loc: `${siteUrl}/shop?category=${encodeURIComponent(category)}`,
        priority: 0.8,
        lastmod: currentDate,
        changefreq: 'weekly'
      });
    });

    // Add product pages with their last update date
    products.forEach(product => {
      const productLastmod = product.updated_at 
        ? new Date(product.updated_at).toISOString().split('T')[0]
        : currentDate;
      
      urls.push({
        loc: `${siteUrl}/product/${product.id}`,
        priority: 0.7,
        lastmod: productLastmod,
        changefreq: 'weekly'
      });
    });

    // Add blog pages
    urls.push({
      loc: `${siteUrl}/blog`,
      priority: 0.8,
      lastmod: currentDate,
      changefreq: 'weekly'
    });

    // Add individual blog posts
    [
      { slug: 'heart-crafted-jewelry-guide', date: '2025-08-10', changefreq: 'monthly' },
      { slug: 'sustainable-stones-jewelry', date: '2025-08-05', changefreq: 'monthly' },
      { slug: 'perfect-jewelry-gifts-women', date: '2025-07-28', changefreq: 'monthly' }
    ].forEach(post => {
      urls.push({
        loc: `${siteUrl}/blog/${post.slug}`,
        priority: 0.7,
        lastmod: post.date,
        changefreq: post.changefreq
      });
    });

    // Add other important pages
    [
      { path: '/contact', priority: 0.6, changefreq: 'monthly' },
      { path: '/privacy-policy', priority: 0.5, changefreq: 'yearly' },
      { path: '/terms-of-service', priority: 0.5, changefreq: 'yearly' },
      { path: '/return-policy', priority: 0.5, changefreq: 'yearly' }
    ].forEach(page => {
      urls.push({
        loc: `${siteUrl}${page.path}`,
        priority: page.priority,
        lastmod: currentDate,
        changefreq: page.changefreq
      });
    });

    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map(
      url => `  <url>\n    <loc>${url.loc}</loc>\n    <lastmod>${url.lastmod}</lastmod>\n    <changefreq>${url.changefreq}</changefreq>\n    <priority>${url.priority}</priority>\n  </url>`
    ).join('\n')}\n</urlset>\n`;

    // Write to both the root and public directories to ensure it's available
    fs.writeFileSync(path.join(__dirname, 'sitemap.xml'), sitemap, 'utf8');
    fs.writeFileSync(path.join(__dirname, 'public', 'sitemap.xml'), sitemap, 'utf8');
    console.log(`✓ Sitemap generated successfully with ${urls.length} URLs!`);
    console.log(`  - ${products.length} product pages`);
    console.log(`  - ${uniqueCategories.length} category pages`);
    console.log('  - Saved to: sitemap.xml and public/sitemap.xml');
  } catch (error) {
    console.error('Error generating sitemap:', error);
    process.exit(1);
  }
}

// Run the async function
generateSitemap();
