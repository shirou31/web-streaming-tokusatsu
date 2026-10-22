import fs from 'fs';

async function decodeUrl(pageUrl) {
  try {
    const res = await fetch(pageUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    if (!res.ok) return null;
    const html = await res.text();
    const embedMatches = [...html.matchAll(/data-embed=["']([^"']+)["']/g)];
    for (const em of embedMatches) {
      const rawB64 = em[1];
      const decodedIframe = Buffer.from(rawB64, 'base64').toString('utf8');
      const pUrlMatch = decodedIframe.match(/src=["']([^"']+)["']/);
      if (pUrlMatch) {
        const pUrl = pUrlMatch[1];
        const pRes = await fetch(pUrl, { headers: { 'User-Agent': 'Mozilla/5.0', 'Referer': pageUrl } });
        const pText = await pRes.text();
        const dataSrcMatch = pText.match(/data-src=["']([^"']+)["']/);
        if (dataSrcMatch) {
          const m = dataSrcMatch[1].match(/t=([A-Za-z0-9_-]+)\./);
          if (m) {
            let b64 = m[1].replace(/-/g, '+').replace(/_/g, '/');
            while (b64.length % 4) b64 += '=';
            const decoded = JSON.parse(Buffer.from(b64, 'base64').toString('utf8'));
            return decoded;
          }
        }
      }
    }
  } catch (e) {
    console.error('Error fetching', pageUrl, e.message);
  }
  return null;
}

const seriesToScrape = [
  { slug: 'kamen-rider-ryuki', url: 'https://www.tokusatsuindo.com/kamen-rider-ryuki-episode-1-sub-indonesia/', ep: 1 },
  { slug: 'kamen-rider-den-o', url: 'https://www.tokusatsuindo.com/kamen-rider-den-o-episode-1-sub-indonesia/', ep: 1 },
  { slug: 'kamen-rider-ooo', url: 'https://www.tokusatsuindo.com/kamen-rider-ooo-episode-1-sub-indonesia/', ep: 1 },
  { slug: 'kaizoku-sentai-gokaiger', url: 'https://www.tokusatsuindo.com/gokaiger-episode-1-sub-indonesia/', ep: 1 },
  { slug: 'ultraman-z', url: 'https://www.tokusatsuindo.com/ultraman-z-episode-1-sub-indonesia/', ep: 1 },
  { slug: 'ultraman-trigger-new-generation-tiga', url: 'https://www.tokusatsuindo.com/ultraman-trigger-episode-1-sub-indonesia/', ep: 1 },
  { slug: 'ultraman-decker', url: 'https://www.tokusatsuindo.com/ultraman-decker-episode-1-sub-indonesia/', ep: 1 },
  { slug: 'kamen-rider-black-sun', url: 'https://www.tokusatsuindo.com/kamen-rider-black-sun-episode-1-sub-indonesia/', ep: 1 },
  { slug: 'mashin-sentai-kiramager', url: 'https://www.tokusatsuindo.com/mashin-sentai-kiramager-episode-1-sub-indonesia/', ep: 1 },
  { slug: 'kikai-sentai-zenkaiger', url: 'https://www.tokusatsuindo.com/kikai-sentai-zenkaiger-episode-1-sub-indonesia/', ep: 1 }
];

async function run() {
  const results = {};
  for (const s of seriesToScrape) {
    console.log(`Scraping ${s.slug} Ep ${s.ep}...`);
    const data = await decodeUrl(s.url);
    if (data) {
      console.log(`  -> SUCCESS: ${data.title} | ${data.google_drive_url_1}`);
      results[s.slug] = data;
    } else {
      console.log(`  -> FAILED for ${s.slug}`);
    }
  }
  fs.writeFileSync('./scripts/decoded_batch_ep1.json', JSON.stringify(results, null, 2));
  console.log('Saved to decoded_batch_ep1.json');
}

run();
