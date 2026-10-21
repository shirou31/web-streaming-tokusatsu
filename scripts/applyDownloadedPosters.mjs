import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const postersDir = path.resolve(__dirname, '../public/posters');
const files = fs.readdirSync(postersDir).filter(f => f.startsWith('poster_') && f.endsWith('.jpg'));

console.log(`Found ${files.length} poster files in public/posters/`);

// Map filename to slug
const posterMap = {};
for (const file of files) {
  // e.g. poster_kamen-rider-zero-one.jpg -> kamen-rider-zero-one
  const slug = file.replace(/^poster_/, '').replace(/\.jpg$/, '');
  posterMap[slug] = `/posters/${file}`;
}

// 1. Update canonicalData.js
const canonicalPath = path.resolve(__dirname, '../src/data/canonicalData.js');
const { DB } = await import('../src/data/canonicalData.js');

let updatedCount = 0;
for (const prod of DB.productions) {
  if (posterMap[prod.slug]) {
    prod.poster_url = posterMap[prod.slug];
    prod.fallback_poster = posterMap[prod.slug];
    updatedCount++;
    console.log(`Updated canonical prod [${prod.slug}] -> ${posterMap[prod.slug]}`);
  }
}

fs.writeFileSync(
  canonicalPath,
  `// Database Kanonikal TokuFlix dengan Metadata Tokusatsu Lengkap\nexport const DB = ${JSON.stringify(DB, null, 2)};\n`,
  'utf-8'
);
console.log(`✓ canonicalData.js updated ${updatedCount} productions!`);

// 2. Update scrapedTokusatsu.json
const scrapedPath = path.resolve(__dirname, '../src/data/scrapedTokusatsu.json');
if (fs.existsSync(scrapedPath)) {
  const scrapedData = JSON.parse(fs.readFileSync(scrapedPath, 'utf-8'));
  const list = Array.isArray(scrapedData) ? scrapedData : (scrapedData.episodes || []);
  let scrapedUpdated = 0;
  for (const ep of list) {
    for (const [slug, url] of Object.entries(posterMap)) {
      if (ep.productionId?.includes(slug) || ep.slug?.includes(slug)) {
        ep.posterUrl = url;
        ep.fallbackPoster = url;
        scrapedUpdated++;
        break;
      }
    }
  }
  fs.writeFileSync(scrapedPath, JSON.stringify(scrapedData, null, 2), 'utf-8');
  console.log(`✓ scrapedTokusatsu.json updated ${scrapedUpdated} episodes!`);
}

console.log('ALL LOCAL POSTER PATHS APPLIED PERFECTLY!');
