import fs from 'fs';

async function check() {
  const res = await fetch('https://www.tokusatsuindo.com/super-sentai/', { headers: { 'User-Agent': 'Mozilla/5.0' } });
  const html = await res.text();
  const regex = /<a\s+[^>]*href=["'](https:\/\/www\.tokusatsuindo\.com\/[^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  let m;
  const found = [];
  while ((m = regex.exec(html)) !== null) {
    const link = m[1];
    const text = m[2].replace(/<[^>]+>/g, '').trim();
    if (text) found.push({ text, link });
  }
  console.log('Total Sentai links:', found.length);
  found.forEach(x => {
    if (/gokai|shinken|dekaranger|donbrothers|king/i.test(x.text + ' ' + x.link)) {
      console.log(`${x.text} -> ${x.link}`);
    }
  });
}

check();
