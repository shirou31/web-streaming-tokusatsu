import { DB } from '../src/data/canonicalData.js';
import fs from 'fs';

const scraped = JSON.parse(fs.readFileSync('./src/data/scrapedTokusatsu.json', 'utf8'));

const driveUsage = new Map();

function record(url, prodName, epTitle, epId, source) {
  if (!url) return;
  const match = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
  if (!match) return;
  const id = match[1];
  if (!driveUsage.has(id)) {
    driveUsage.set(id, []);
  }
  driveUsage.get(id).push({ prodName, epTitle, epId, source });
}

// 1. DB Video Sources
DB.video_sources.forEach(v => {
  const ep = DB.episodes.find(e => e.id === v.episode_id);
  const prod = ep ? DB.productions.find(p => p.id === ep.production_id) : null;
  const prodName = prod ? prod.title : (v.episode_id || 'unknown');
  const epTitle = ep ? ep.title : 'unknown ep';
  record(v.origin_url, prodName, epTitle, v.episode_id, 'canonical_origin');
  record(v.direct_url, prodName, epTitle, v.episode_id, 'canonical_direct');
});

// 2. Scraped Episodes
scraped.episodes.forEach(s => {
  const prodName = s.seriesTitle || s.productionSlug || 'scraped_unknown';
  const epTitle = s.title;
  record(s.embedUrl, prodName, epTitle, s.id, 'scraped_embed');
  record(s.driveDownloadUrl1, prodName, epTitle, s.id, 'scraped_d1');
  record(s.driveDownloadUrl2, prodName, epTitle, s.id, 'scraped_d2');
  if (s.servers) {
    s.servers.forEach(srv => {
      record(srv.embedUrl, prodName, epTitle, s.id, 'scraped_srv_embed');
      record(srv.directUrl, prodName, epTitle, s.id, 'scraped_srv_direct');
    });
  }
});

console.log('Total unique drive IDs found:', driveUsage.size);

const crossProd = [];
for (const [id, entries] of driveUsage.entries()) {
  const prods = [...new Set(entries.map(e => e.prodName))];
  if (prods.length > 1) {
    crossProd.push({ id, prods, count: entries.length, entries });
  }
}

console.log('Drive IDs shared across MULTIPLE distinct productions:', crossProd.length);
crossProd.sort((a, b) => b.count - a.count);

console.log('Top 20 Most Contaminated / Shared Drive IDs:');
crossProd.slice(0, 20).forEach((cp, idx) => {
  console.log(`\n#${idx + 1}. Drive ID: ${cp.id} (used ${cp.count} times across ${cp.prods.length} productions)`);
  console.log(`Productions (${cp.prods.length}):`, cp.prods.slice(0, 8).join(', ') + (cp.prods.length > 8 ? ` +${cp.prods.length - 8} more` : ''));
  const sampleEpisodes = cp.entries.slice(0, 3).map(e => `[${e.prodName}] ${e.epTitle} (${e.source})`);
  console.log('Sample usages:\n - ' + sampleEpisodes.join('\n - '));
});

