import { DB } from '../src/data/canonicalData.js';
import fs from 'fs';

const scrapedData = JSON.parse(fs.readFileSync('./src/data/scrapedTokusatsu.json', 'utf8'));

console.log('====================================================');
console.log('AUDIT ALL MOVIES IN CANONICAL DATA & SCRAPED DATA');
console.log('====================================================\n');

// 1. Get all canonical movies
const canonicalMovies = DB.productions.filter(p => p.type === 'movie');
console.log(`Total Canonical Movies: ${canonicalMovies.length}\n`);

const issues = [];
const verified = [];

for (const m of canonicalMovies) {
  // Find episodes in DB.episodes
  const dbEps = DB.episodes.filter(e => e.production_id === m.id);
  
  // Find matching scraped episodes
  const scrapedMatches = scrapedData.episodes.filter(se => {
    const sTitle = (se.seriesTitle || se.title || '').toLowerCase();
    const pSlug = (m.slug || '').toLowerCase();
    const pTitle = (m.title || '').toLowerCase();
    const sProdId = (se.productionId || '').toLowerCase();

    if (se.contentType !== 'movie') return false;

    // Check slug / ID
    if (m.id && se.productionId === m.id) return true;
    if (sProdId === pSlug || sProdId === `prod_${pSlug.replace(/-/g, '_')}`) return true;
    if (pSlug === sProdId.replace(/^prod_/, '').replace(/_/g, '-')) return true;

    // Disambiguation
    if (pSlug.includes('dyna') && !sTitle.includes('dyna') && !sProdId.includes('dyna')) return false;
    if (!pSlug.includes('dyna') && sTitle.includes('dyna') && !pTitle.includes('dyna')) return false;

    if (pSlug.includes('gaiden') && !sTitle.includes('gaiden') && !sProdId.includes('gaiden')) return false;
    if (!pSlug.includes('gaiden') && (sTitle.includes('gaiden') || sProdId.includes('gaiden')) && !pTitle.includes('gaiden')) return false;

    if (pSlug.includes('ten-gokaiger') && !sTitle.includes('ten') && !sProdId.includes('ten')) return false;
    if (!pSlug.includes('ten-gokaiger') && (sTitle.includes('ten gokaiger') || sProdId.includes('ten_gokaiger')) && !pTitle.includes('ten')) return false;

    return sTitle === pTitle || sTitle.includes(pSlug.replace(/-/g, ' ')) || pSlug.replace(/-/g, ' ').includes(sTitle);
  });

  const totalEps = dbEps.length + scrapedMatches.length;

  console.log(`[MOVIE] ${m.title}`);
  console.log(`  Slug: ${m.slug} | ID: ${m.id}`);
  console.log(`  DB Episodes: ${dbEps.length} | Scraped Matches: ${scrapedMatches.length}`);

  if (scrapedMatches.length > 0) {
    scrapedMatches.forEach(sm => {
      const srv1 = sm.servers?.[0];
      console.log(`  -> Scraped: "${sm.title}"`);
      console.log(`     Source URL: ${sm.sourceUrl}`);
      console.log(`     Server 1: ${srv1?.name} => ${srv1?.embedUrl?.slice(0, 60)}...`);
      
      // Check title match
      const pWords = m.title.toLowerCase().split(/[^a-z0-9]+/);
      const sWords = sm.title.toLowerCase().split(/[^a-z0-9]+/);
      const common = pWords.filter(w => w.length > 3 && sWords.includes(w));
      if (common.length < 2 && !m.title.toLowerCase().includes(sm.title.toLowerCase().slice(0, 10))) {
        issues.push({
          movie: m.title,
          slug: m.slug,
          scrapedTitle: sm.title,
          reason: 'Judul film dan judul video scraper tampak berbeda / tidak cocok!'
        });
      }
    });
  } else if (dbEps.length > 0) {
    dbEps.forEach(de => {
      const vs = DB.video_sources.filter(v => v.episode_id === de.id);
      console.log(`  -> DB Ep: "${de.title}" (${vs.length} video sources)`);
      vs.forEach(v => console.log(`     VS: ${v.server_name} => ${v.origin_url.slice(0, 60)}...`));
    });
  } else {
    console.log(`  ⚠️ TIDAK ADA EPISODE / VIDEO TERHUBUNG!`);
    issues.push({
      movie: m.title,
      slug: m.slug,
      reason: 'Tidak memiliki episode / video terdaftar!'
    });
  }
  console.log('');
}

// 2. Also check all standalone movies in scrapedTokusatsu.json
console.log('====================================================');
console.log('CHECKING ALL MOVIES IN SCRAPED DATA:');
console.log('====================================================');
const scrapedMovies = scrapedData.episodes.filter(e => e.contentType === 'movie');
console.log(`Total Scraped Movies: ${scrapedMovies.length}\n`);

scrapedMovies.forEach(sm => {
  const srv1 = sm.servers?.[0];
  const isDummy = srv1?.embedUrl?.includes('doodstream.com/e/') || srv1?.embedUrl?.includes('streamwish.com/e/');
  console.log(`[SCRAPED MOVIE] ${sm.title}`);
  console.log(`  ID: ${sm.id} | Series: ${sm.seriesTitle}`);
  console.log(`  Source: ${sm.sourceUrl}`);
  console.log(`  Server: ${srv1?.name} => ${srv1?.embedUrl?.slice(0, 70)}`);
  console.log(`  Status: ${isDummy ? '⚠️ DUMMY SERVER (perlu scrape asli)' : '✅ SERVER AKTIF'}`);
  if (isDummy) {
    issues.push({
      movie: sm.title,
      id: sm.id,
      sourceUrl: sm.sourceUrl,
      reason: 'Menggunakan dummy doodstream / streamwish'
    });
  }
  console.log('');
});

console.log('====================================================');
console.log(`AUDIT SUMMARY: ${issues.length} ISSUES FOUND`);
console.log('====================================================');
issues.forEach((iss, idx) => {
  console.log(`${idx + 1}. [${iss.movie || iss.slug}]: ${iss.reason}`);
  if (iss.scrapedTitle) console.log(`   Scraped: ${iss.scrapedTitle}`);
  if (iss.sourceUrl) console.log(`   Source: ${iss.sourceUrl}`);
});
