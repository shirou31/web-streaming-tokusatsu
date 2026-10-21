import fs from 'fs';

async function inspectPost() {
  const res = await fetch('https://sawidagofansub.com/?p=3863', {
    headers: { 'User-Agent': 'Mozilla/5.0' }
  });
  const html = await res.text();
  console.log('Post HTML length:', html.length);
  const imgMatches = [...html.matchAll(/src="([^"]+\.(jpg|png|webp|jpeg))"/gi)];
  console.log('All images in post:');
  const seen = new Set();
  for (const m of imgMatches) {
    if (!seen.has(m[1]) && !m[1].includes('theme') && !m[1].includes('avatar')) {
      seen.add(m[1]);
      console.log(m[1]);
    }
  }
}

inspectPost();
