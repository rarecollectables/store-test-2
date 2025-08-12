const fs = require('fs');
const path = require('path');

// Import minimal product data (no image requires)
const PRODUCTS = require('./scripts/products-sitemap-data.js');

const siteUrl = 'https://rarecollectables.co.uk';
const currentDate = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format for lastmod

const uniqueCategories = [...new Set(PRODUCTS.map(p => p.category))];

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

// Add product pages
PRODUCTS.forEach(product => {
  urls.push({
    loc: `${siteUrl}/product/${product.id}`,
    priority: 0.7,
    lastmod: currentDate,
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
console.log('sitemap.xml generated in root and public directories!');
