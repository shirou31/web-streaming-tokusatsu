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

function extractDriveIds(str) {
  if (!str) return [];
  const ids = [];
  const re = /https:\/\/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]{20,})/g;
  let m;
  while ((m = re.exec(str)) !== null) {
    ids.push(m[1]);
  }
  return ids;
}

async function resolveDriveLinksForMovie(movie) {
  // If already official youtube, keep it
  if (movie.servers?.[0]?.embedUrl?.includes('youtube-nocookie.com')) {
    return {
      type: 'youtube',
      servers: movie.servers
    };
  }

  const postUrl = movie.sourceUrl;
  if (!postUrl || !postUrl.startsWith('http')) return null;

  const html = await fetchPage(postUrl, 'https://www.tokusatsuindo.com/');
  if (!html) return null;

  const driveIds = new Set();

  // 1. Direct links in post html
  extractDriveIds(html).forEach(id => driveIds.add(id));

  // 2. data-embed
  const embedMatches = [...html.matchAll(/data-embed=["']([A-Za-z0-9+/=]+)["']/g)];
  for (const em of embedMatches) {
    try {
      const decoded = Buffer.from(em[1], 'base64').toString('utf8');
      extractDriveIds(decoded).forEach(id => driveIds.add(id));

      const src = decoded.match(/src=["']([^"']+)["']/i)?.[1];
      if (src && src.includes('player.tokusatsuindo.com')) {
        const playerHtml = await fetchPage(src, postUrl);
        if (playerHtml) {
          const dataSrcMatch = playerHtml.match(/data-src=["']([^"']+)["']/);
          if (dataSrcMatch) {
            const rawSrc = dataSrcMatch[1];
            const tMatch = rawSrc.match(/t=([A-Za-z0-9+/=_-]+)/);
            if (tMatch) {
              const b64 = tMatch[1].split('.')[0].replace(/-/g, '+').replace(/_/g, '/');
              const pld = JSON.parse(Buffer.from(b64, 'base64').toString('utf8'));
              if (pld.file_id_1) driveIds.add(pld.file_id_1);
              if (pld.file_id_2) driveIds.add(pld.file_id_2);
              if (pld.file_id) driveIds.add(pld.file_id);
              if (pld.google_drive_url_1) extractDriveIds(pld.google_drive_url_1).forEach(id => driveIds.add(id));
              if (pld.google_drive_url_2) extractDriveIds(pld.google_drive_url_2).forEach(id => driveIds.add(id));
            }
          }
          extractDriveIds(playerHtml).forEach(id => driveIds.add(id));
        }
      }
    } catch (_) {}
  }

  const idsArray = Array.from(driveIds).filter(id => id.length > 15 && !id.includes('preview') && !id.includes('toku'));
  if (idsArray.length === 0) return null;

  const servers = idsArray.slice(0, 3).map((id, idx) => ({
    id: `srv_real_drive_${idx + 1}_${movie.id}`,
    name: idx === 0 ? 'Server 1 (Google Drive Direct HD / 1440p)' : `Server ${idx + 1} (Mirror Direct HD / 1440p)`,
    embedUrl: `https://drive.google.com/file/d/${id}/preview`,
    directUrl: `https://drive.google.com/file/d/${id}/view?usp=sharing`,
    type: 'gdrive',
    status: 'online'
  }));

  return {
    type: 'gdrive',
    servers,
    driveDownloadUrl1: `https://drive.google.com/file/d/${idsArray[0]}/view?usp=sharing`,
    driveDownloadUrl2: idsArray[1] ? `https://drive.google.com/file/d/${idsArray[1]}/view?usp=sharing` : null
  };
}

async function main() {
  const jsonPath = './src/data/scrapedTokusatsu.json';
  const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

  const movies = data.episodes.filter(e => e.contentType === 'movie');
  console.log(`Processing ${movies.length} movies for permanent, non-expiring Google Drive embeds...`);

  let successCount = 0;
  for (const m of movies) {
    console.log(`\nProcessing: "${m.title}"`);
    const resolved = await resolveDriveLinksForMovie(m);
    if (resolved && resolved.servers?.length > 0) {
      m.servers = resolved.servers;
      if (resolved.driveDownloadUrl1) m.driveDownloadUrl1 = resolved.driveDownloadUrl1;
      if (resolved.driveDownloadUrl2) m.driveDownloadUrl2 = resolved.driveDownloadUrl2;
      console.log(`  ✅ Successfully updated with ${m.servers.length} permanent servers!`);
      m.servers.forEach(s => console.log(`     -> ${s.name}: ${s.embedUrl}`));
      successCount++;
    } else {
      console.log(`  ⚠️ Could not extract Google Drive links, keeping current servers.`);
    }
  }

  fs.writeFileSync(jsonPath, JSON.stringify(data, null, 2), 'utf8');
  console.log(`\n======================================================`);
  console.log(`🎉 FINISHED: Successfully applied permanent servers to ${successCount} / ${movies.length} movies!`);
  console.log(`======================================================\n`);
}

main().catch(console.error);
