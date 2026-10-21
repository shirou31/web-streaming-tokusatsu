async function testArc() {
  const pageRes = await fetch('https://www.tokusatsuindo.com/ultraman-arc-the-movie-the-clash-of-light-and-evil-sub-indonesia/', {
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
  const m = pText.match(/data-src=["']([^"']+)["']/);
  if (m) {
    console.log('data-src found:', m[1]);
    const tMatch = m[1].match(/t=([A-Za-z0-9+/=]+)\./);
    if (tMatch) {
      const payload = Buffer.from(tMatch[1], 'base64').toString('utf8');
      console.log('Decoded payload:', JSON.parse(payload));
    }
  } else {
    console.log('data-src not found');
  }
}

testArc();
