import fs from 'fs';

async function update13Riders() {
  const url = 'https://www.tokusatsuindo.com/kamen-rider-ryuki-special-13-riders-subtitle-indonesia/';
  const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
  const html = await res.text();
  
  const embedMatches = [...html.matchAll(/data-embed=["']([A-Za-z0-9+/=]+)["']/g)];
  let embed = null;
  for (const m of embedMatches) {
    try {
      const decoded = Buffer.from(m[1], 'base64').toString('utf8');
      const srcMatch = decoded.match(/src=["']([^"']+)["']/i);
      if (srcMatch && srcMatch[1]) {
        embed = srcMatch[1].startsWith('//') ? 'https:' + srcMatch[1] : srcMatch[1];
        break;
      }
    } catch (_) {}
  }
  console.log('13 Riders Embed:', embed);

  const jsonPath = './src/data/scrapedTokusatsu.json';
  const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
  const item = data.episodes.find(e => e.id === 'scraped_prod_kamen-rider-ryuki-13-riders_movie');
  if (item) {
    item.sourceUrl = url;
    item.servers = [
      {
        id: 'srv_real_scraped_prod_kamen-rider-ryuki-13-riders_movie',
        name: 'Server 1 (Direct Embed HD)',
        embedUrl: embed,
        directUrl: null,
        type: 'embed',
        status: 'online'
      }
    ];
    fs.writeFileSync(jsonPath, JSON.stringify(data, null, 2), 'utf8');
    console.log('✅ Updated 13 Riders in scrapedTokusatsu.json!');
  }
}

update13Riders();
