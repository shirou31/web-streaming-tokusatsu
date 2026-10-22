async function decodePlayer() {
  const pUrl = 'https://player.tokusatsuindo.com/x/?t=eyJ2aWRlb19pZCI6NTg2NH0.11ad804072c1819be3c5c2a0902fb5df5330a427abd1369c54af8d3f9457aa91';
  const pRes = await fetch(pUrl, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Referer': 'https://www.tokusatsuindo.com/'
    }
  });
  const text = await pRes.text();
  console.log('Player text length:', text.length);
  const dataSrcMatch = text.match(/data-src=["']([^"']+)["']/);
  if (dataSrcMatch) {
    const rawUrl = dataSrcMatch[1];
    console.log('Found data-src:', rawUrl);
    const m = rawUrl.match(/t=([A-Za-z0-9_-]+)\./);
    if (m) {
      let b64 = m[1].replace(/-/g, '+').replace(/_/g, '/');
      while (b64.length % 4) b64 += '=';
      console.log('Decoded inner JSON:', Buffer.from(b64, 'base64').toString('utf8'));
    }
  } else {
    console.log('No data-src found, snippet:', text.slice(0, 1000));
  }
}
decodePlayer();
