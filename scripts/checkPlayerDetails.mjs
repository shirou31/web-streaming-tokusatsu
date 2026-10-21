async function checkInternalFrame() {
  const pageRes = await fetch('https://www.tokusatsuindo.com/kamen-rider-geats-4-aces-and-the-black-fox-sub-indonesia/', {
    headers: { 'User-Agent': 'Mozilla/5.0' }
  });
  const html = await pageRes.text();
  const embedMatch = html.match(/data-embed=["']([A-Za-z0-9+/=]+)["']/);
  const decoded = Buffer.from(embedMatch[1], 'base64').toString('utf8');
  const src = decoded.match(/src=["']([^"']+)["']/)[1];

  const pRes = await fetch(src, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Referer': 'https://www.tokusatsuindo.com/'
    }
  });
  const pText = await pRes.text();
  const frameMatch = pText.match(/<iframe[^>]*id=["']internalPlayerFrame["'][^>]*>/i);
  console.log('internalPlayerFrame:', frameMatch ? frameMatch[0] : 'not found');
  
  // Also check all data attributes or URLs inside pText
  const allUrls = [...pText.matchAll(/https?:\/\/[^"'\s<>]+/gi)].map(m => m[0]);
  console.log('All URLs in player page:', Array.from(new Set(allUrls)));
}
checkInternalFrame();
