import fs from 'fs';

const filePath = 'src/data/scrapedTokusatsu.json';
const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

// Helper to decode player URL
async function decodePlayerUrl(u) {
  try {
    const r = await fetch(u, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': 'https://www.tokusatsuindo.com/'
      }
    });
    const text = await r.text();
    const dataSrcMatch = text.match(/data-src=["']([^"']+)["']/);
    if (!dataSrcMatch) return null;
    const rawUrl = dataSrcMatch[1];
    const m = rawUrl.match(/t=([A-Za-z0-9_-]+)\./);
    if (!m) return null;
    let b64 = m[1].replace(/-/g, '+').replace(/_/g, '/');
    while (b64.length % 4) b64 += '=';
    const json = JSON.parse(Buffer.from(b64, 'base64').toString('utf8'));
    return json;
  } catch (err) {
    return null;
  }
}

function extractFileId(url) {
  if (!url) return null;
  const m = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/) || url.match(/id=([a-zA-Z0-9_-]+)/);
  return m ? m[1] : null;
}

async function main() {
  console.log(`Starting conversion for ${data.episodes.length} episodes...`);

  // Explicit fix for Ultraman Arc Ep 1
  const arcEp1 = data.episodes.find(e => e.id === 'scraped_ultraman-arc_ep1');
  if (arcEp1) {
    console.log('Explicitly updating scraped_ultraman-arc_ep1...');
    arcEp1.driveDownloadUrl1 = 'https://drive.google.com/file/d/1ZawtRzBvTNufMEWid4xcyOevN7r7z74o/view?usp=sharing';
    arcEp1.driveDownloadUrl2 = 'https://drive.google.com/file/d/1NDB246gu80NzaJawft4TSjZ8o7V_iY4x/view?usp=sharing';
    arcEp1.servers = [
      {
        id: `srv_real_drive_1_${arcEp1.id}`,
        name: 'Server 1 (Google Drive Direct HD / 1440p)',
        embedUrl: 'https://drive.google.com/file/d/1ZawtRzBvTNufMEWid4xcyOevN7r7z74o/preview',
        directUrl: 'https://drive.google.com/file/d/1ZawtRzBvTNufMEWid4xcyOevN7r7z74o/view?usp=sharing',
        type: 'gdrive',
        status: 'online'
      },
      {
        id: `srv_real_drive_2_${arcEp1.id}`,
        name: 'Server 2 (Mirror Direct HD / 1440p)',
        embedUrl: 'https://drive.google.com/file/d/1NDB246gu80NzaJawft4TSjZ8o7V_iY4x/preview',
        directUrl: 'https://drive.google.com/file/d/1NDB246gu80NzaJawft4TSjZ8o7V_iY4x/view?usp=sharing',
        type: 'gdrive',
        status: 'online'
      }
    ];
  }

  // 1. Process all episodes with driveDownloadUrl1 or driveDownloadUrl2
  let updatedFromDl = 0;
  for (const ep of data.episodes) {
    const id1 = extractFileId(ep.driveDownloadUrl1);
    const id2 = extractFileId(ep.driveDownloadUrl2);
    
    if (id1 || id2) {
      const hasDriveSrv = (ep.servers || []).some(s => (s.embedUrl || '').includes('drive.google.com'));
      if (!hasDriveSrv) {
        ep.servers = [];
        if (id1) {
          ep.servers.push({
            id: `srv_real_drive_1_${ep.id}`,
            name: 'Server 1 (Google Drive Direct HD / 1440p)',
            embedUrl: `https://drive.google.com/file/d/${id1}/preview`,
            directUrl: `https://drive.google.com/file/d/${id1}/view?usp=sharing`,
            type: 'gdrive',
            status: 'online'
          });
        }
        if (id2 && id2 !== id1) {
          ep.servers.push({
            id: `srv_real_drive_2_${ep.id}`,
            name: `Server ${ep.servers.length + 1} (Mirror Direct HD / 1440p)`,
            embedUrl: `https://drive.google.com/file/d/${id2}/preview`,
            directUrl: `https://drive.google.com/file/d/${id2}/view?usp=sharing`,
            type: 'gdrive',
            status: 'online'
          });
        }
        updatedFromDl++;
      }
    }
  }
  console.log(`Updated ${updatedFromDl} episodes from existing Drive download URLs.`);

  // 2. Identify all player.tokusatsuindo.com/x/ URLs to resolve
  const toResolve = [];
  for (const ep of data.episodes) {
    for (const s of (ep.servers || [])) {
      const u = s.embedUrl || s.directUrl || '';
      if (u.includes('player.tokusatsuindo.com/x/')) {
        toResolve.push({ ep, server: s, url: u });
      }
    }
  }
  console.log(`Found ${toResolve.length} player.tokusatsuindo.com/x/ URLs to decode.`);

  // Process in batches of 15
  const BATCH_SIZE = 15;
  let resolvedCount = 0;
  for (let i = 0; i < toResolve.length; i += BATCH_SIZE) {
    const batch = toResolve.slice(i, i + BATCH_SIZE);
    const results = await Promise.all(batch.map(item => decodePlayerUrl(item.url)));

    results.forEach((res, idx) => {
      if (!res) return;
      const { ep, server } = batch[idx];
      const gUrl1 = res.google_drive_url_1;
      const gUrl2 = res.google_drive_url_2;
      const id1 = res.file_id_1 || res.file_id || extractFileId(gUrl1);
      const id2 = res.file_id_2 || extractFileId(gUrl2);

      if (id1) {
        server.name = 'Server 1 (Google Drive Direct HD / 1440p)';
        server.embedUrl = `https://drive.google.com/file/d/${id1}/preview`;
        server.directUrl = `https://drive.google.com/file/d/${id1}/view?usp=sharing`;
        server.type = 'gdrive';
        server.status = 'online';

        ep.driveDownloadUrl1 = server.directUrl;
        resolvedCount++;

        if (id2 && id2 !== id1 && !ep.servers.some(s => (s.embedUrl || '').includes(id2))) {
          ep.servers.push({
            id: `srv_real_drive_2_${ep.id}`,
            name: 'Server 2 (Mirror Direct HD / 1440p)',
            embedUrl: `https://drive.google.com/file/d/${id2}/preview`,
            directUrl: `https://drive.google.com/file/d/${id2}/view?usp=sharing`,
            type: 'gdrive',
            status: 'online'
          });
          ep.driveDownloadUrl2 = `https://drive.google.com/file/d/${id2}/view?usp=sharing`;
        }
      }
    });

    console.log(`Processed ${Math.min(i + BATCH_SIZE, toResolve.length)} / ${toResolve.length}...`);
    // Save progress periodically
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
  }

  // Remove any remaining doodstream/streamwish if Drive server is present
  for (const ep of data.episodes) {
    const hasDrive = (ep.servers || []).some(s => (s.embedUrl || '').includes('drive.google.com'));
    if (hasDrive) {
      ep.servers = ep.servers.filter(s => {
        const u = s.embedUrl || s.directUrl || '';
        return !u.includes('doodstream') && !u.includes('streamwish');
      });
    }
  }

  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
  console.log(`Done! Successfully converted ${resolvedCount} player URLs to Google Drive.`);
}

main().catch(console.error);
