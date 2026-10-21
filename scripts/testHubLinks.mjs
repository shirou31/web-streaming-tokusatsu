import fs from 'fs';

async function check() {
  const res = await fetch('https://www.tokusatsuindo.com/kamen-rider-2/', { headers: { 'User-Agent': 'Mozilla/5.0' } });
  const html = await res.text();
  const regex = /<a\s+[^>]*href=["'](https:\/\/www\.tokusatsuindo\.com\/[^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  let m;
  const found = [];
  while ((m = regex.exec(html)) !== null) {
    const link = m[1];
    const text = m[2].replace(/<[^>]+>/g, '').trim();
    if (text) found.push({ text, link });
  }
  console.log('Total links:', found.length);
  found.forEach(x => {
    if (/ryuki|den|ooo|faiz|blade|kabuto|decade|w-|fourze|wizard|gaim/i.test(x.text + ' ' + x.link)) {
      console.log(`${x.text} -> ${x.link}`);
    }
  });
}

check();
