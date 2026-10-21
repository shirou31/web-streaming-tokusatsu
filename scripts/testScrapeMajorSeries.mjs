import fs from 'fs';

async function fetchPage(url) {
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': 'https://www.tokusatsuindo.com/'
      }
    });
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
  const re = /https:\/\/drive\.google\.com\/[^\s"'<>]+/g;
  let m;
  while ((m = re.exec(html)) !== null) {
    gdrive.add(m[0]);
  }
  return Array.from(gdrive);
}

const testUrls = [
  { name: 'Ryuki Ep 1', url: 'https://www.tokusatsuindo.com/kamen-rider-ryuki-episode-1-sub-indonesia/' },
  { name: 'Ryuki Ep 1 alt', url: 'https://www.tokusatsuindo.com/ryuki-episode-1-sub-indonesia/' },
  { name: 'Den-O Ep 1', url: 'https://www.tokusatsuindo.com/kamen-rider-den-o-episode-1-sub-indonesia/' },
  { name: 'Den-O Ep 1 alt', url: 'https://www.tokusatsuindo.com/den-o-episode-1-sub-indonesia/' },
  { name: 'OOO Ep 1', url: 'https://www.tokusatsuindo.com/kamen-rider-ooo-episode-1-sub-indonesia/' },
  { name: 'OOO Ep 1 alt', url: 'https://www.tokusatsuindo.com/ooo-episode-1-sub-indonesia/' },
  { name: 'Gavv Ep 1', url: 'https://www.tokusatsuindo.com/kamen-rider-gavv-episode-1-sub-indonesia/' },
  { name: 'Gavv Ep 1 alt', url: 'https://www.tokusatsuindo.com/gavv-episode-1-sub-indonesia/' },
  { name: 'Boonboomger Ep 1', url: 'https://www.tokusatsuindo.com/bakuage-sentai-boonboomger-episode-1-sub-indonesia/' },
  { name: 'Boonboomger Ep 1 alt', url: 'https://www.tokusatsuindo.com/boonboomger-episode-1-sub-indonesia/' },
  { name: 'Tiga Ep 1', url: 'https://www.tokusatsuindo.com/ultraman-tiga-episode-1-sub-indonesia/' },
  { name: 'Tiga Ep 1 alt', url: 'https://www.tokusatsuindo.com/tiga-episode-1-sub-indonesia/' },
];

async function main() {
  for (const item of testUrls) {
    const html = await fetchPage(item.url);
    if (!html || html.includes('Page not found') || html.includes('404 Not Found') || html.includes('Halaman tidak ditemukan')) {
      console.log(`❌ ${item.name}: 404 Not Found (${item.url})`);
      continue;
    }
    const embed = extractEmbed(html);
    const gd = extractGdriveLinks(html);
    console.log(`✅ ${item.name}: EMBED -> ${embed} | GDrive (${gd.length}): ${gd.slice(0, 2)}`);
  }
}

main().catch(console.error);
