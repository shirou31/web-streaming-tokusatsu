import fs from 'fs';

async function fetchEmbed(url) {
  try {
    const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    const html = await res.text();
    const embedMatches = [...html.matchAll(/data-embed=["']([A-Za-z0-9+/=]+)["']/g)];
    for (const m of embedMatches) {
      try {
        const decoded = Buffer.from(m[1], 'base64').toString('utf8');
        const srcMatch = decoded.match(/src=["']([^"']+)["']/i);
        if (srcMatch && srcMatch[1]) {
          return srcMatch[1].startsWith('//') ? 'https:' + srcMatch[1] : srcMatch[1];
        }
      } catch (_) {}
    }
  } catch (_) {}
  return null;
}

async function updateExtras() {
  const jsonPath = './src/data/scrapedTokusatsu.json';
  const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

  // 1. Gozyuger vs Boonboomger
  const gozUrl = 'https://www.tokusatsuindo.com/no-1-sentai-gozyuger-vs-boonboomger-sub-indonesia/';
  const gozEmbed = await fetchEmbed(gozUrl);
  if (gozEmbed) {
    const item = data.episodes.find(e => e.id === 'scraped_sawidago_no-1-sentai-gozyuger-vs-boonboomger-movie_ep1_mvhzpw7s');
    if (item) {
      item.sourceUrl = gozUrl;
      item.servers = [{ id: 'srv_goz_real', name: 'Server 1 (Direct Embed HD)', embedUrl: gozEmbed, type: 'embed', status: 'online' }];
      console.log('✅ Updated Gozyuger vs Boonboomger with real embed');
    }
  }

  // 2. King-Ohger vs Kyoryuger
  const kyoUrl = 'https://www.tokusatsuindo.com/ohsama-sentai-king-ohger-vs-kyoryuger-sub-indonesia/';
  const kyoEmbed = await fetchEmbed(kyoUrl);
  if (kyoEmbed) {
    const item = data.episodes.find(e => e.id === 'scraped_sawidago_ohsama-sentai-king-ohger-vs-kyoryuger_ep1_mvhzqk7j');
    if (item) {
      item.sourceUrl = kyoUrl;
      item.servers = [{ id: 'srv_kyo_real', name: 'Server 1 (Direct Embed HD)', embedUrl: kyoEmbed, type: 'embed', status: 'online' }];
      console.log('✅ Updated King-Ohger vs Kyoryuger with real embed');
    }
  }

  // 3. Remove duplicate and dummy sawidago leftovers
  data.episodes = data.episodes.filter(e => {
    if (e.id === 'scraped_sawidago_ohsama-sentai-king-ohger-vs-donbrothers_ep1_mvhzqifj') return false; // duplicate of scraped_king-ohger-vs-donbrothers_ep1
    if (e.id === 'scraped_sawidago_no-1-sentai-gozyuger-tegasword-of-ressurection-bd_ep1_mvhzqc0k') return false; // unhosted BD extra
    if (e.id === 'scraped_sawidago_bakuage-sentai-boonboomger-8211-movie-boon-promise-the-circuit_ep1_mvhzqg54') return false; // duplicate of scraped_prod_ss_boonboomger_movie_ep51
    return true;
  });

  fs.writeFileSync(jsonPath, JSON.stringify(data, null, 2), 'utf8');
  console.log('✅ Cleaned extra movie leftovers in scrapedTokusatsu.json!');
}

updateExtras();
