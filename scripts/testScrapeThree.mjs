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
    gdrive.add(`https://drive.google.com/file/d/${m[1]}/preview`);
  }
  return Array.from(gdrive);
}

async function testSeries(name, slugPrefix, count) {
  console.log(`\nTesting ${name}...`);
  for (let i = 1; i <= count; i++) {
    const url = `https://www.tokusatsuindo.com/${slugPrefix}-episode-${i}-sub-indonesia/`;
    const html = await fetchPage(url);
    if (!html) {
      console.log(`[Ep ${i}] ❌ Failed to fetch`);
      continue;
    }
    const embed = extractEmbed(html);
    const gd = extractGdriveLinks(html);
    console.log(`[Ep ${i}] ✅ Embed: ${embed ? embed.slice(0, 50) + '...' : 'NONE'} | GDrive: ${gd.length}`);
  }
}

async function main() {
  await testSeries('Ryuki', 'kamen-rider-ryuki', 3);
  await testSeries('Den-O', 'kamen-rider-den-o', 3);
  await testSeries('OOO', 'kamen-rider-ooo', 3);
}

main().catch(console.error);
