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
  { slug: 'kamen-rider-geats', eps: [1] },
  { slug: 'kamen-rider-saber', eps: [1, 2, 3, 4, 5, 6] },
  { slug: 'kamen-rider-revice', eps: [1, 2, 3, 4, 5, 6] },
  { slug: 'kamen-rider-gotchard', eps: [1, 2, 3, 4, 5, 6] }
];

async function run() {
  const allResults = {};
  for (const s of seriesToScrape) {
    allResults[s.slug] = [];
    for (const ep of s.eps) {
      const u = `https://www.tokusatsuindo.com/${s.slug}-episode-${ep}-sub-indonesia/`;
      console.log(`Checking ${s.slug} Ep ${ep}...`);
      const data = await decodeUrl(u);
      if (data) {
        console.log(`  -> SUCCESS: ${data.title} | ${data.google_drive_url_1}`);
        allResults[s.slug].push({ ep, data });
      } else {
        console.log(`  -> FAILED for Ep ${ep}`);
      }
    }
  }
  return allResults;
}

run();
