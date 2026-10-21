async function checkPlayerContent() {
  const pageRes = await fetch('https://www.tokusatsuindo.com/kamen-rider-geats-4-aces-and-the-black-fox-sub-indonesia/', {
    headers: { 'User-Agent': 'Mozilla/5.0' }
  });
  const html = await pageRes.text();
  const embedMatch = html.match(/data-embed=["']([A-Za-z0-9+/=]+)["']/);
  if (!embedMatch) {
    console.log('No embed found');
    return;
  }
  const decoded = Buffer.from(embedMatch[1], 'base64').toString('utf8');
  const src = decoded.match(/src=["']([^"']+)["']/)[1];
  console.log('Fresh player URL:', src);

  // Now fetch fresh player URL with proper referer
  const pRes = await fetch(src, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Referer': 'https://www.tokusatsuindo.com/'
    }
  });
  console.log('Player status:', pRes.status);
  const pText = await pRes.text();
  console.log('Player HTML length:', pText.length);
  console.log('Player HTML head/body sample:\n', pText.slice(0, 1000));
}

checkPlayerContent();
