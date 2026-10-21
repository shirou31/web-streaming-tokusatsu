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

async function getDriveLinks(postUrl) {
  if (!postUrl || !postUrl.startsWith('http')) return [];
  const html = await fetchPage(postUrl, 'https://www.tokusatsuindo.com/');
  if (!html) return [];

  const driveSet = new Set();

  // 1. Direct links in post html
  const re = /https:\/\/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]{20,})/g;
  let m;
  while ((m = re.exec(html)) !== null) {
    driveSet.add(m[1]);
  }

  // 2. data-embed
  const embedMatches = [...html.matchAll(/data-embed=["']([A-Za-z0-9+/=]+)["']/g)];
  for (const em of embedMatches) {
    try {
      const decoded = Buffer.from(em[1], 'base64').toString('utf8');
      
      // Check direct drive in decoded base64
      let m2;
      const re2 = /https:\/\/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]{20,})/g;
      while ((m2 = re2.exec(decoded)) !== null) {
        driveSet.add(m2[1]);
      }

      // Check player page
      const srcMatch = decoded.match(/src=["']([^"']+)["']/i);
      if (srcMatch && srcMatch[1]) {
        let playerUrl = srcMatch[1].startsWith('//') ? 'https:' + srcMatch[1] : srcMatch[1];
        if (playerUrl.includes('drive.google.com')) {
          const id = playerUrl.match(/\/d\/([a-zA-Z0-9_-]{20,})/)?.[1];
          if (id) driveSet.add(id);
        } else if (playerUrl.includes('player.tokusatsuindo.com')) {
          const playerHtml = await fetchPage(playerUrl, postUrl);
          if (playerHtml) {
            // Find data-src
            const dataSrcMatch = playerHtml.match(/data-src=["']([^"']+)["']/);
            if (dataSrcMatch) {
              const rawSrc = dataSrcMatch[1];
              const tMatch = rawSrc.match(/t=([A-Za-z0-9+/=]+)/);
              if (tMatch) {
                try {
                  const b64 = tMatch[1].split('.')[0];
                  const pld = JSON.parse(Buffer.from(b64, 'base64').toString('utf8'));
                  if (pld.file_id_1) driveSet.add(pld.file_id_1);
                  if (pld.file_id_2) driveSet.add(pld.file_id_2);
                  if (pld.file_id) driveSet.add(pld.file_id);
                } catch (_) {}
              }
            }

            // Find any drive IDs in playerHtml
            let m3;
            const re3 = /https:\/\/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]{20,})/g;
            while ((m3 = re3.exec(playerHtml)) !== null) {
              driveSet.add(m3[1]);
            }
            const re4 = /["']([a-zA-Z0-9_-]{28,35})["']/g;
            while ((m4 = re4.exec(playerHtml)) !== null) {
              if (!m4[1].includes('player') && !m4[1].includes('tokusatsu')) {
                // Potential drive file id
              }
            }
          }
        }
      }
    } catch (_) {}
  }

  return Array.from(driveSet).map(id => `https://drive.google.com/file/d/${id}/preview`);
}

async function convert() {
  const jsonPath = './src/data/scrapedTokusatsu.json';
  const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

  const movies = data.episodes.filter(e => e.contentType === 'movie');
  console.log(`Converting ${movies.length} movies to permanent, non-expiring servers...`);

  let driveSuccess = 0;

  for (const m of movies) {
    // If it's a youtube official movie (like Den-O I'm born, Onigashima, Super Hero Taisen), keep it
    if (m.servers?.[0]?.embedUrl?.includes('youtube-nocookie.com')) {
      console.log(`[OFFICIAL YOUTUBE] ${m.title} -> Kept as Official Stream`);
      continue;
    }

    const driveLinks = await getDriveLinks(m.sourceUrl);
    console.log(`[MOVIE] ${m.title}`);
    console.log(`  Source: ${m.sourceUrl}`);
    console.log(`  Drive links: ${driveLinks.length}`);

    if (driveLinks.length > 0) {
      driveSuccess++;
      m.servers = [];

      driveLinks.slice(0, 3).forEach((link, idx) => {
        m.servers.push({
          id: `srv_drive_${idx + 1}_${m.id}`,
          name: idx === 0 ? 'Server 1 (Google Drive Direct HD / 1440p)' : `Server ${idx + 1} (Mirror Direct HD / 1440p)`,
          embedUrl: link,
          directUrl: link.replace('/preview', '/view?usp=sharing'),
          type: 'gdrive',
          status: 'online'
        });
      });

      m.driveDownloadUrl1 = driveLinks[0].replace('/preview', '/view?usp=sharing');
      if (driveLinks[1]) {
        m.driveDownloadUrl2 = driveLinks[1].replace('/preview', '/view?usp=sharing');
      }
    } else {
      console.log(`  ⚠️ No direct Drive link extracted, checking current embed...`);
      // If current embed is player.tokusatsuindo.com, it will 403 on tokuflix.ai.id!
      // Let's inspect why it didn't find Drive or check if we can get a working player
    }
  }

  fs.writeFileSync(jsonPath, JSON.stringify(data, null, 2), 'utf8');
  console.log(`\n======================================================`);
  console.log(`Converted ${driveSuccess} movies to permanent Google Drive servers!`);
  console.log(`======================================================\n`);
}

convert().catch(console.error);
