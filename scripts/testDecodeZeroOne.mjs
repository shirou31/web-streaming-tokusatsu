async function test() {
  const pUrl = 'https://player.tokusatsuindo.com/x/?t=eyJ2aWRlb19pZCI6MzN9.be89d23b1c359699ca056c5e164dc18f813fa285d88822d5cd6034f3d4391ac2';
  const pRes = await fetch(pUrl, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Referer': 'https://www.tokusatsuindo.com/'
    }
  });
  const text = await pRes.text();
  const dataSrcMatch = text.match(/data-src=["']([^"']+)["']/);
  if (dataSrcMatch) {
    const rawUrl = dataSrcMatch[1];
    const m = rawUrl.match(/t=([A-Za-z0-9_-]+)\./);
    if (m) {
      let b64 = m[1].replace(/-/g, '+').replace(/_/g, '/');
      while (b64.length % 4) b64 += '=';
      console.log('Decoded Zero-One Ep 1:', Buffer.from(b64, 'base64').toString('utf8'));
    }
  }
}
test();
