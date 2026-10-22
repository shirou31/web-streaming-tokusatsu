import fs from 'fs';

async function check() {
  const res = await fetch('https://www.tokusatsuindo.com/kamen-rider-zero-one-episode-1-sub-indonesia/', {
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
  });
  const html = await res.text();
  fs.writeFileSync('./scripts/zero_one_ep1_page.html', html);
  console.log('Saved page HTML, length:', html.length);
  
  // Look for any links with drive, player, stream, server, data-src, etc.
  const regex = /href="([^"]+)"|src="([^"]+)"|data-src="([^"]+)"|value="([^"]+)"/g;
  let match;
  const urls = [];
  while ((match = regex.exec(html)) !== null) {
    const url = match[1] || match[2] || match[3] || match[4];
    if (url && (url.includes('drive') || url.includes('player') || url.includes('video') || url.includes('x/?t=') || url.includes('embed') || url.includes('sorot') || url.includes('stream') || url.includes('download'))) {
      urls.push(url);
    }
  }
  console.log('Relevant URLs found:', urls);
}
check();
