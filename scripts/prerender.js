const fs = require('fs');
const path = require('path');
const http = require('http');
const puppeteer = require('puppeteer');

function extractRoutesFromSitemap(sitemapXml) {
  const locMatches = sitemapXml.match(/<loc>([^<]+)<\/loc>/g) || [];
  const urls = locMatches
    .map((m) => m.replace('<loc>', '').replace('</loc>', '').trim())
    .filter(Boolean);

  const routes = [];
  for (const url of urls) {
    try {
      const u = new URL(url);
      const route = `${u.pathname}${u.search}`;
      routes.push(route);
    } catch (_) {
      // ignore
    }
  }

  return Array.from(new Set(routes));
}

function serveStaticFile(filePath, res) {
  try {
    const data = fs.readFileSync(filePath);
    const ext = path.extname(filePath).toLowerCase();
    const contentType = ext === '.html'
      ? 'text/html; charset=utf-8'
      : ext === '.js'
        ? 'application/javascript; charset=utf-8'
        : ext === '.css'
          ? 'text/css; charset=utf-8'
          : ext === '.json'
            ? 'application/json; charset=utf-8'
            : ext === '.svg'
              ? 'image/svg+xml'
              : ext === '.png'
                ? 'image/png'
                : ext === '.jpg' || ext === '.jpeg'
                  ? 'image/jpeg'
                  : ext === '.webp'
                    ? 'image/webp'
                    : ext === '.ico'
                      ? 'image/x-icon'
                      : 'application/octet-stream';

    res.writeHead(200, { 'Content-Type': contentType });
    res.end(data);
  } catch (e) {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Not Found');
  }
}

function createStaticServer(rootDir) {
  return http.createServer((req, res) => {
    const urlPath = decodeURIComponent((req.url || '/').split('?')[0]);

    // Try direct file.
    let filePath = path.join(rootDir, urlPath);
    if (urlPath.endsWith('/')) {
      filePath = path.join(rootDir, urlPath, 'index.html');
    }

    // If no extension, treat as route and serve /<route>/index.html if present,
    // else fall back to root index.html (SPA behavior).
    const hasExt = path.extname(filePath) !== '';
    if (!hasExt) {
      const routeIndex = path.join(rootDir, urlPath, 'index.html');
      if (fs.existsSync(routeIndex)) {
        return serveStaticFile(routeIndex, res);
      }
      return serveStaticFile(path.join(rootDir, 'index.html'), res);
    }

    if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
      return serveStaticFile(path.join(filePath, 'index.html'), res);
    }

    return serveStaticFile(filePath, res);
  });
}

function routeToOutputPath(distDir, route) {
  if (route === '/' || route === '') {
    return path.join(distDir, 'index.html');
  }

  // If the route looks like an .html file, write that directly.
  if (route.endsWith('.html')) {
    return path.join(distDir, route.replace(/^\//, ''));
  }

  // Otherwise write to <route>/index.html
  return path.join(distDir, route.replace(/^\//, ''), 'index.html');
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function prerender() {
  const projectRoot = path.join(__dirname, '..');
  const distDir = path.join(projectRoot, 'dist');
  const sitemapPath = path.join(projectRoot, 'public', 'sitemap.xml');

  if (!fs.existsSync(distDir)) {
    throw new Error('dist/ folder not found. Run the web export build first.');
  }

  const defaultRoutes = [
    '/',
    '/shop',
    '/blog',
    '/contact',
    '/privacy-policy',
    '/terms-of-service',
    '/return-policy'
  ];

  let routesFromSitemap = [];
  if (fs.existsSync(sitemapPath)) {
    const sitemapXml = fs.readFileSync(sitemapPath, 'utf8');
    routesFromSitemap = extractRoutesFromSitemap(sitemapXml);
  }

  // react-snap writes HTML files to disk. Querystring routes can produce awkward filenames.
  // Keep product pages and clean routes; skip routes with query params.
  const sitemapRoutes = routesFromSitemap
    .filter((r) => typeof r === 'string' && r.startsWith('/'))
    .filter((r) => !r.includes('?'))
    .filter((r) => !r.startsWith('/checkout'));

  const include = Array.from(new Set([...defaultRoutes, ...sitemapRoutes]));

  console.log(`Prerendering ${include.length} routes...`);

  const server = createStaticServer(distDir);
  await new Promise((resolve) => server.listen(0, resolve));
  const address = server.address();
  const port = typeof address === 'object' && address ? address.port : 0;
  const baseUrl = `http://127.0.0.1:${port}`;

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    // Make prerender deterministic / avoid viewport-dependent layout bugs.
    await page.setViewport({ width: 1365, height: 900 });

    const failures = [];

    for (const route of include) {
      const url = `${baseUrl}${route}`;
      try {
        await page.goto(url, { waitUntil: 'networkidle0', timeout: 120000 });

        // Give your SEO/meta useEffects a moment to run.
        await sleep(500);

        const html = await page.content();
        const outPath = routeToOutputPath(distDir, route);
        fs.mkdirSync(path.dirname(outPath), { recursive: true });
        fs.writeFileSync(outPath, html, 'utf8');
        process.stdout.write(`✓ ${route} -> ${path.relative(projectRoot, outPath)}\n`);
      } catch (e) {
        failures.push({ route, message: e && e.message ? e.message : 'error' });
        process.stdout.write(`✗ ${route} (${e && e.message ? e.message : 'error'})\n`);
      }
    }

    if (failures.length > 0) {
      throw new Error(`Prerender failed for ${failures.length} route(s). Example: ${failures[0].route} (${failures[0].message})`);
    }
  } finally {
    await browser.close();
    await new Promise((resolve) => server.close(resolve));
  }
}

prerender().catch((err) => {
  console.error('Prerender failed:', err);
  process.exit(1);
});
