import fs from 'fs';

async function fetchPage(url) {
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': 'https://www.tokusatsuindo.com/'
      }
    });
    if (!res.ok) return null;
    return await res.text();
  } catch (err) {
    return null;
  }
}

function extractEmbed(html) {
  if (!html) return null;
  const embedMatches = [...html.matchAll(/data-embed=["']([A-Za-z0-9+/=]+)["']/g)];
  for (const m of embedMatches) {
    try {
      const decoded = Buffer.from(m[1], 'base64').toString('utf8');
      const srcMatch = decoded.match(/src=["']([^"']+)["']/i);
      if (srcMatch && srcMatch[1]) {
        let embedUrl = srcMatch[1];
        if (embedUrl.startsWith('//')) embedUrl = 'https:' + embedUrl;
        return embedUrl;
      }
    } catch (_) {}
  }
  const iframeMatch = html.match(/<iframe[^>]+src=["']([^"']+)["']/i);
  if (iframeMatch) {
    let src = iframeMatch[1];
    if (src.startsWith('//')) src = 'https:' + src;
    return src;
  }
  return null;
}

function extractGdriveLinks(html) {
  if (!html) return [];
  const gdrive = new Set();
  const re = /https:\/\/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/g;
  let m;
  while ((m = re.exec(html)) !== null) {
    const id = m[1];
    if (!id.includes('preview') && !id.includes('toku') && id.length > 15) {
      gdrive.add(`https://drive.google.com/file/d/${id}/preview`);
    }
  }
  return Array.from(gdrive);
}

// Concurrency helper
async function mapConcurrent(items, concurrency, fn) {
  const results = [];
  let index = 0;
  async function worker() {
    while (index < items.length) {
      const i = index++;
      results[i] = await fn(items[i], i);
    }
  }
  const workers = Array.from({ length: Math.min(concurrency, items.length) }, () => worker());
  await Promise.all(workers);
  return results;
}

const seriesConfig = [
  { name: 'Kamen Rider Ryuki', slugPrefix: 'kamen-rider-ryuki', maxEp: 50, prodId: 'kamen-rider-ryuki' },
  { name: 'Kamen Rider Den-O', slugPrefix: 'kamen-rider-den-o', maxEp: 49, prodId: 'kamen-rider-den-o' },
  { name: 'Kamen Rider OOO', slugPrefix: 'kamen-rider-ooo', maxEp: 48, prodId: 'kamen-rider-ooo' },
  { name: 'Kamen Rider Gavv', slugPrefix: 'kamen-rider-gavv', maxEp: 21, prodId: 'kamen-rider-gavv' },
  { name: 'Bakuage Sentai Boonboomger', slugPrefix: 'bakuage-sentai-boonboomger', maxEp: 20, prodId: 'bakuage-sentai-boonboomger' },
  { name: 'Kamen Rider Geats', slugPrefix: 'kamen-rider-geats', maxEp: 49, prodId: 'kamen-rider-geats' },
  { name: 'Ultraman Tiga', slugPrefix: 'ultraman-tiga', maxEp: 52, prodId: 'ultraman-tiga' },
  { name: 'Kamen Rider Zero-One', slugPrefix: 'kamen-rider-zero-one', maxEp: 45, prodId: 'kamen-rider-zero-one' },
  { name: 'Kamen Rider Gotchard', slugPrefix: 'kamen-rider-gotchard', maxEp: 50, prodId: 'kamen-rider-gotchard' },
  { name: 'Kamen Rider Saber', slugPrefix: 'kamen-rider-saber', maxEp: 47, prodId: 'kamen-rider-saber' },
  { name: 'Kamen Rider Revice', slugPrefix: 'kamen-rider-revice', maxEp: 50, prodId: 'kamen-rider-revice' },
];

async function main() {
  const jsonPath = './src/data/scrapedTokusatsu.json';
  const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

  for (const s of seriesConfig) {
    console.log(`\n========================================`);
    console.log(`Scraping: ${s.name} (1 to ${s.maxEp})...`);
    console.log(`========================================`);

    const epsToScrape = Array.from({ length: s.maxEp }, (_, i) => i + 1);

    const scrapedResults = await mapConcurrent(epsToScrape, 6, async (epNum) => {
      const url = `https://www.tokusatsuindo.com/${s.slugPrefix}-episode-${epNum}-sub-indonesia/`;
      const html = await fetchPage(url);
      if (!html) {
        return { epNum, success: false };
      }
      const embed = extractEmbed(html);
      const gd = extractGdriveLinks(html);
      if (embed) {
        process.stdout.write(`[${epNum}✓] `);
        return { epNum, success: true, embed, gdrive: gd, url };
      } else {
        process.stdout.write(`[${epNum}?] `);
        return { epNum, success: false, url };
      }
    });

    console.log(`\nIntegrating ${s.name} into scrapedTokusatsu.json...`);
    let updatedCount = 0;
    for (const res of scrapedResults) {
      if (!res.success || !res.embed) continue;

      // Find existing episode in JSON or create it
      let target = data.episodes.find(e => {
        const matchTitle = (e.seriesTitle && e.seriesTitle.toLowerCase().includes(s.name.toLowerCase())) ||
                           (e.productionId && (e.productionId === s.prodId || e.productionId === `prod_${s.slugPrefix.replace(/-/g, '_')}`));
        return matchTitle && Number(e.episodeNumber) === res.epNum;
      });

      const servers = [
        {
          id: `srv_real_${s.slugPrefix}_${res.epNum}`,
          name: 'Server 1 (Direct Embed HD)',
          embedUrl: res.embed,
          directUrl: null,
          type: 'embed',
          status: 'online'
        }
      ];

      if (res.gdrive && res.gdrive.length > 0) {
        servers.push({
          id: `srv_real_gdrive_${s.slugPrefix}_${res.epNum}`,
          name: 'Server 2 (Google Drive Preview)',
          embedUrl: res.gdrive[0],
          directUrl: res.gdrive[0].replace('/preview', '/view?usp=sharing'),
          type: 'gdrive',
          status: 'online'
        });
      }

      if (target) {
        target.servers = servers;
        target.sourceUrl = res.url;
        if (res.gdrive?.[0]) target.driveDownloadUrl1 = res.gdrive[0].replace('/preview', '/view?usp=sharing');
        updatedCount++;
      } else {
        // Create new entry
        data.episodes.push({
          id: `scraped_${s.slugPrefix}_ep${res.epNum}`,
          productionId: s.prodId,
          franchise: s.name.startsWith('Kamen') ? 'Kamen Rider' : s.name.startsWith('Ultraman') ? 'Ultraman' : 'Super Sentai',
          seriesTitle: s.name,
          title: `${s.name} Episode ${res.epNum} Sub Indo`,
          episodeNumber: res.epNum,
          seasonNumber: 1,
          era: 'Heisei',
          contentType: 'tv_series',
          sourceUrl: res.url,
          fansub: 'TokusatsuIndo / Sawidago Network',
          language: 'Indonesian (Sub Indo)',
          quality: '1080p FHD / 720p HD',
          thumbnail: `/posters/poster_${s.slugPrefix}.jpg`,
          servers,
          scrapedAt: new Date().toISOString()
        });
        updatedCount++;
      }
    }
    console.log(`Updated ${updatedCount} episodes for ${s.name}!`);
  }

  // Save back
  fs.writeFileSync(jsonPath, JSON.stringify(data, null, 2), 'utf8');
  console.log('\n✅ All series scraped and saved successfully to scrapedTokusatsu.json!');
}

main().catch(console.error);
