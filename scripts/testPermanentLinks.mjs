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

async function extractPermanentDriveLinks(moviePostUrl) {
  const html = await fetchPage(moviePostUrl, 'https://www.tokusatsuindo.com/');
  if (!html) return null;

  // 1. Direct gdrive in post html
  const directGdrives = [];
  const re = /https:\/\/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/g;
  let m;
  while ((m = re.exec(html)) !== null) {
    const id = m[1];
    if (!id.includes('preview') && !id.includes('toku') && id.length > 15) {
      directGdrives.push(`https://drive.google.com/file/d/${id}/preview`);
    }
  }

  // 2. data-embed
  const embedMatch = html.match(/data-embed=["']([A-Za-z0-9+/=]+)["']/);
  if (!embedMatch) return { directGdrives, innerDriveLinks: [] };

  try {
    const decoded = Buffer.from(embedMatch[1], 'base64').toString('utf8');
    const srcMatch = decoded.match(/src=["']([^"']+)["']/i);
    if (!srcMatch || !srcMatch[1]) return { directGdrives, innerDriveLinks: [] };

    let playerUrl = srcMatch[1];
    if (playerUrl.startsWith('//')) playerUrl = 'https:' + playerUrl;

    // Fetch player page with post as referer
    const playerHtml = await fetchPage(playerUrl, moviePostUrl);
    if (!playerHtml) return { directGdrives, innerDriveLinks: [] };

    const dataSrcMatch = playerHtml.match(/data-src=["']([^"']+)["']/);
    if (dataSrcMatch) {
      const rawUrl = dataSrcMatch[1];
      const tParam = rawUrl.match(/t=([A-Za-z0-9+/=]+)\./);
      if (tParam) {
        const payload = JSON.parse(Buffer.from(tParam[1], 'base64').toString('utf8'));
        const innerDriveLinks = [];
        if (payload.google_drive_url_1) innerDriveLinks.push(payload.google_drive_url_1.replace('/view?usp=sharing', '/preview').replace('/view?usp=drivesdk', '/preview').replace('/view', '/preview'));
        if (payload.google_drive_url_2) innerDriveLinks.push(payload.google_drive_url_2.replace('/view?usp=sharing', '/preview').replace('/view?usp=drivesdk', '/preview').replace('/view', '/preview'));
        if (payload.file_id_1) innerDriveLinks.push(`https://drive.google.com/file/d/${payload.file_id_1}/preview`);
        if (payload.file_id_2) innerDriveLinks.push(`https://drive.google.com/file/d/${payload.file_id_2}/preview`);
        return {
          directGdrives,
          innerDriveLinks: Array.from(new Set(innerDriveLinks)),
          title: payload.title
        };
      }
    }
  } catch (err) {
    console.error('Error decoding player:', err);
  }

  return { directGdrives, innerDriveLinks: [] };
}

async function testSample() {
  const sampleUrls = [
    'https://www.tokusatsuindo.com/kamen-rider-geats-4-aces-and-the-black-fox-sub-indonesia/',
    'https://www.tokusatsuindo.com/shin-kamen-rider-sub-indonesia/',
    'https://www.tokusatsuindo.com/ultraman-arc-the-movie-the-clash-of-light-and-evil-sub-indonesia/',
    'https://www.tokusatsuindo.com/kamen-rider-revice-battle-familia-sub-indonesia/'
  ];

  for (const url of sampleUrls) {
    console.log(`\nTesting: ${url}`);
    const res = await extractPermanentDriveLinks(url);
    console.log('Result:', res);
  }
}

testSample();
