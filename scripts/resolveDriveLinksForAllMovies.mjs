import fs from 'fs';

async function fetchPage(url, referer) {
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        ...(referer ? { 'Referer': referer } : {})
      }
    });
    if (!res.ok) return null;
    return await res.text();
  } catch (err) {
    return null;
  }
}

async function extractDriveForPost(postUrl) {
  if (!postUrl || !postUrl.startsWith('http')) return [];

  const html = await fetchPage(postUrl, 'https://www.tokusatsuindo.com/');
  if (!html) return [];

  const driveSet = new Set();

  // 1. Check direct drive in post HTML
  const re = /https:\/\/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/g;
  let m;
  while ((m = re.exec(html)) !== null) {
    const id = m[1];
    if (!id.includes('preview') && !id.includes('toku') && id.length > 15) {
      driveSet.add(`https://drive.google.com/file/d/${id}/preview`);
    }
  }

  // 2. Check data-embed
  const embedMatches = [...html.matchAll(/data-embed=["']([A-Za-z0-9+/=]+)["']/g)];
  for (const em of embedMatches) {
    try {
      const decoded = Buffer.from(em[1], 'base64').toString('utf8');
      
      // If embed already contains drive.google.com
      let m2;
      const re2 = /https:\/\/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/g;
      while ((m2 = re2.exec(decoded)) !== null) {
        if (m2[1].length > 15) driveSet.add(`https://drive.google.com/file/d/${m2[1]}/preview`);
      }

      // If it's a player.tokusatsuindo.com URL
      const srcMatch = decoded.match(/src=["']([^"']+)["']/i);
      if (srcMatch && srcMatch[1]) {
        let playerUrl = srcMatch[1].startsWith('//') ? 'https:' + srcMatch[1] : srcMatch[1];
        if (playerUrl.includes('drive.google.com')) {
          const id = playerUrl.match(/\/d\/([a-zA-Z0-9_-]+)/)?.[1];
          if (id) driveSet.add(`https://drive.google.com/file/d/${id}/preview`);
        } else if (playerUrl.includes('player.tokusatsuindo.com')) {
          // Fetch player page
          const playerHtml = await fetchPage(playerUrl, postUrl);
          if (playerHtml) {
            // Find data-src
            const dataSrcMatch = playerHtml.match(/data-src=["']([^"']+)["']/);
            if (dataSrcMatch) {
              const tMatch = dataSrcMatch[1].match(/t=([A-Za-z0-9+/=]+)\./);
              if (tMatch) {
                try {
                  const pld = JSON.parse(Buffer.from(tMatch[1], 'base64').toString('utf8'));
                  if (pld.file_id_1) driveSet.add(`https://drive.google.com/file/d/${pld.file_id_1}/preview`);
                  if (pld.file_id_2) driveSet.add(`https://drive.google.com/file/d/${pld.file_id_2}/preview`);
                  if (pld.file_id) driveSet.add(`https://drive.google.com/file/d/${pld.file_id}/preview`);
                } catch (_) {}
              }
            }

            // Also search all google drive patterns in playerHtml
            let m3;
            const re3 = /https:\/\/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/g;
            while ((m3 = re3.exec(playerHtml)) !== null) {
              if (m3[1].length > 15) driveSet.add(`https://drive.google.com/file/d/${m3[1]}/preview`);
            }
          }
        }
      }
    } catch (_) {}
  }

  return Array.from(driveSet);
}

async function run() {
  const scraped = JSON.parse(fs.readFileSync('./src/data/scrapedTokusatsu.json', 'utf8'));
  const movies = scraped.episodes.filter(e => e.contentType === 'movie');

  console.log(`Checking ${movies.length} movies for permanent Google Drive links...`);

  let resolved = 0;
  for (const m of movies) {
    if (!m.sourceUrl || !m.sourceUrl.startsWith('http')) {
      console.log(`- ${m.title}: No sourceUrl`);
      continue;
    }
    const drives = await extractDriveForPost(m.sourceUrl);
    console.log(`- ${m.title} (${m.id})`);
    console.log(`  Source: ${m.sourceUrl}`);
    console.log(`  Drives found: ${drives.length}`);
    drives.forEach((d, i) => console.log(`    [Drive ${i+1}] ${d}`));
    if (drives.length > 0) resolved++;
  }

  console.log(`\nResolved permanent drive links for ${resolved} / ${movies.length} movies.`);
}

run().catch(console.error);
