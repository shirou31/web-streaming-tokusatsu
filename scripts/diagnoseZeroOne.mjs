import { DB } from '../src/data/canonicalData.js';
import { scraperService } from '../src/services/scraperService.js';
import { isScrapedEpisodeMatch, getProductionBySlug } from '../src/services/apiService.js';

const prodWithThatId = DB.productions.find(p => p.id === '0192a3f0-1111-7000-8000-000000000010');
console.log('Production with ID 0192a3f0-1111-7000-8000-000000000010:', prodWithThatId);

// Check all productions to see if any has My-Th in their episodes
for (const p of DB.productions) {
  const res = await getProductionBySlug(p.slug);
  const mythInP = (res.data?.episodes || []).filter(e => 
    (e.title || '').toLowerCase().includes('my-th') || 
    (e.title || '').toLowerCase().includes('myth')
  );
  if (mythInP.length > 0) {
    console.log(`FOUND MY-TH IN PRODUCTION: "${p.title}" (${p.slug})! Count: ${mythInP.length}`);
    mythInP.forEach(e => console.log('   Episode:', e.episode_number, e.title, e.id));
  }
}

// Also check Zero-One movies:
const zeroOneMovies = DB.productions.filter(p => p.slug.includes('zero-one'));
console.log('\nZero One related productions:');
for (const p of zeroOneMovies) {
  const res = await getProductionBySlug(p.slug);
  console.log(`Slug: ${p.slug}, Title: ${p.title}, Episodes:`, res.data?.episodes?.length);
  res.data?.episodes?.forEach(e => {
    console.log(`  [Ep ${e.episode_number}] ${e.title} (ID: ${e.id})`);
  });
}
