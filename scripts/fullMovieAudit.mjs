import { DB } from '../src/data/canonicalData.js';
import fs from 'fs';

const scraped = JSON.parse(fs.readFileSync('./src/data/scrapedTokusatsu.json', 'utf8'));

console.log('========================================================');
console.log('COMPLETE TOKUFLIX MOVIE AUDIT');
console.log('========================================================\n');

// 1. All canonical movies
const canonicalMovies = DB.productions.filter(p => p.type === 'movie');
console.log(`Canonical movies in DB: ${canonicalMovies.length}\n`);

const movieReport = [];

canonicalMovies.forEach((m, idx) => {
  // Check in DB.episodes
  const dbEp = DB.episodes.find(e => e.production_id === m.id);
  const dbVs = dbEp ? DB.video_sources.filter(v => v.episode_id === dbEp.id) : [];

  // Check in scrapedTokusatsu
  const scrapedMatches = scraped.episodes.filter(se => {
    if (se.contentType !== 'movie') return false;
    if (se.productionId === m.id) return true;
    if (se.id.includes(m.slug)) return true;
    if (se.id === `scraped_prod_${m.slug.replace(/-/g, '_')}_movie`) return true;
    
    // Explicit known matches
    if (m.slug === 'kamen-rider-w-returns-eternal' && se.id === 'scraped_prod_kr_w_eternal_ep1') return true;
    if (m.slug === 'kaizoku-sentai-ten-gokaiger' && se.id === 'scraped_prod_ss_ten_gokaiger_ep1') return true;
    if (m.slug === 'ultraman-tiga-dyna-movie' && se.id === 'scraped_prod_ultra_tiga_dyna_movie_ep1') return true;
    if (m.slug === 'ultraman-tiga-gaiden' && se.id === 'scraped_prod_ultra_tiga_gaiden_ep1') return true;
    if (m.slug === 'ultraman-arc-the-movie-clash-of-light-and-evil' && se.id === 'scraped_prod_ultra_arc_movie_ep1') return true;
    if (m.slug === 'garo-red-requiem' && se.id === 'scraped_prod_garo_red_requiem_ep2') return true;
    if (m.slug === 'kamen-rider-ryuki-episode-final' && se.id === 'scraped_prod_kamen-rider-ryuki-episode-final_movie') return true;
    
    return false;
  });

  const primaryScraped = scrapedMatches[0];
  const srv1 = primaryScraped?.servers?.[0];
  const isRealServer = srv1 && !srv1.embedUrl?.includes('doodstream.com/e/') && !srv1.embedUrl?.includes('streamwish.com/e/') && !srv1.embedUrl?.includes('preview_reiwa');

  movieReport.push({
    index: idx + 1,
    title: m.title,
    slug: m.slug,
    id: m.id,
    hasDbEp: !!dbEp,
    dbVsCount: dbVs.length,
    scrapedId: primaryScraped?.id || null,
    scrapedTitle: primaryScraped?.title || null,
    serverUrl: srv1?.embedUrl || null,
    isRealServer: !!isRealServer,
    sourceUrl: primaryScraped?.sourceUrl || null
  });
});

console.log(JSON.stringify(movieReport, null, 2));
