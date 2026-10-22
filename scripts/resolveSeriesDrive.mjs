import fs from 'fs';

async function decodePlayerUrl(pUrl) {
  try {
    const pRes = await fetch(pUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': 'https://www.tokusatsuindo.com/'
      }
    });
    const text = await pRes.text();
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

async function run() {
  const cData = await import('../src/data/canonicalData.js');
  const db = cData.DB;
  
  const tokuindoSources = db.video_sources.filter(vs => (vs.origin_url || vs.url || '').includes('player.tokusatsuindo.com/x/'));
  console.log('Total player.tokusatsuindo.com sources in DB:', tokuindoSources.length);
  
  let success = 0;
  for (let i = 0; i < Math.min(10, tokuindoSources.length); i++) {
    const vs = tokuindoSources[i];
    const u = vs.origin_url || vs.url;
    const res = await decodePlayerUrl(u);
    if (res && (res.google_drive_url_1 || res.file_id_1 || res.file_id)) {
      console.log(`✅ [${i+1}] ${res.title}: ${res.google_drive_url_1 || res.file_id}`);
      success++;
    } else {
      console.log(`❌ [${i+1}] Failed for ${u}`);
    }
  }
  console.log(`Resolved: ${success}/10`);
}
run();
