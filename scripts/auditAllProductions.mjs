import { DB } from '../src/data/canonicalData.js';
import fs from 'fs';

const scraped = JSON.parse(fs.readFileSync('./src/data/scrapedTokusatsu.json', 'utf8'));

console.log('========================================================================');
console.log('              AUDIT KESELURUHAN PRODUKSI & FILM TOKUFLIX                ');
console.log('========================================================================\n');

console.log(`Total Productions di DB: ${DB.productions.length}`);
console.log(`Total Episodes di DB: ${DB.episodes.length}`);
console.log(`Total Video Sources di DB: ${DB.video_sources.length}`);
console.log(`Total Scraped Episodes: ${scraped.episodes.length}`);

// Group by type
const movies = DB.productions.filter(p => p.type === 'movie' || p.type === 'special');
const series = DB.productions.filter(p => p.type === 'tv_series');

console.log(`\nJumlah Film (Movie & Special): ${movies.length}`);
console.log(`Jumlah Serial TV: ${series.length}`);

// Audit Movies
console.log('\n--- DAFTAR DAN STATUS SEMUA 41 FILM (MOVIE & SPESIAL) ---');
const movieResults = [];
movies.forEach((m, idx) => {
  const eps = DB.episodes.filter(e => e.production_id === m.id);
  const epIds = eps.map(e => e.id);
  const sources = DB.video_sources.filter(v => epIds.includes(v.episode_id));
  
  // Scraped matches
  const scrapedMatches = scraped.episodes.filter(s => 
    s.productionSlug === m.slug || 
    (s.title && s.title.toLowerCase().includes(m.title.toLowerCase().slice(0, 20)))
  );

  const driveUrls = [...new Set(sources.map(s => s.origin_url).filter(Boolean))];

  movieResults.push({
    index: idx + 1,
    id: m.id,
    title: m.title,
    slug: m.slug,
    era: m.era_id,
    poster: m.poster_url,
    canonicalEps: eps.length,
    canonicalSources: sources.length,
    scrapedEps: scrapedMatches.length,
    driveUrls
  });
});

movieResults.forEach(m => {
  console.log(`${m.index}. [${m.slug}] ${m.title}`);
  console.log(`   Canonical Eps: ${m.canonicalEps} | Sources: ${m.canonicalSources} | Poster: ${m.poster}`);
  console.log(`   Drive Streams (${m.driveUrls.length}): ${m.driveUrls.map(u => u.slice(30, 70)).join(', ') || 'NONE'}`);
});

// Audit TV Series
console.log('\n--- DAFTAR DAN STATUS SERIAL TV ---');
series.forEach((s, idx) => {
  const eps = DB.episodes.filter(e => e.production_id === s.id);
  const epIds = eps.map(e => e.id);
  const sources = DB.video_sources.filter(v => epIds.includes(v.episode_id));
  const scrapedMatches = scraped.episodes.filter(sc => 
    sc.productionSlug === s.slug || 
    (sc.seriesTitle && sc.seriesTitle.toLowerCase().includes(s.title.toLowerCase().slice(0, 15)))
  );
  console.log(`${idx + 1}. [${s.slug}] ${s.title}`);
  console.log(`   Canonical Eps: ${eps.length} | DB Sources: ${sources.length} | Scraped Eps: ${scrapedMatches.length}`);
});
