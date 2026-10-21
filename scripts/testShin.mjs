async function testShin() {
  const url = 'https://www.tokusatsuindo.com/shin-kamen-rider-sub-indonesia/';
  const html = await (await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } })).text();
  const embedMatch = html.match(/data-embed=["']([A-Za-z0-9+/=]+)["']/);
  const decoded = Buffer.from(embedMatch[1], 'base64').toString('utf8');
  console.log('Decoded embed for Shin:', decoded);
  const src = decoded.match(/src=["']([^"']+)["']/)[1];
  console.log('src for Shin:', src);

  const pRes = await fetch(src, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Referer': url
    }
  });
  console.log('pRes status for Shin:', pRes.status);
  const pText = await pRes.text();
  console.log('pText snippet for Shin:', pText.slice(0, 400));
}

testShin();
