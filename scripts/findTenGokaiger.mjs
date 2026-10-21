import fs from 'fs';

async function main() {
  const r = await fetch('https://www.tokusatsuindo.com/?s=ten+gokaiger', {
    headers: { 'User-Agent': 'Mozilla/5.0' }
  });
  const html = await r.text();
  const re = /href=["'](https:\/\/www\.tokusatsuindo\.com\/[^"']+)["']/g;
  let m;
  const links = new Set();
  while ((m = re.exec(html)) !== null) {
    if (m[1].includes('gokaiger') && !m[1].includes('/tag/') && !m[1].includes('/category/')) {
      links.add(m[1]);
    }
  }
  console.log('Found:', Array.from(links));
}

main().catch(console.error);
