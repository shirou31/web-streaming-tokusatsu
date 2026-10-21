import fs from 'fs';

async function inspectPage(url) {
  try {
    const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    const html = await res.text();
    const regex = /<a\s+[^>]*href=["'](https:\/\/www\.tokusatsuindo\.com\/[^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
    const matches = [];
    let m;
    while ((m = regex.exec(html)) !== null) {
      const link = m[1];
      const text = m[2].replace(/<[^>]+>/g, '').trim();
      if (text && !link.includes('/feed/') && !link.includes('/tag/') && !link.includes('/author/')) {
        matches.push({ link, text });
      }
    }
    console.log(`\n=== Links in ${url} (${matches.length}) ===`);
    matches.filter(m => /ryuki|den-o|den o|ooo|gokaiger|sentai|kamen-rider/i.test(m.link + ' ' + m.text))
           .forEach(m => console.log(`${m.text} -> ${m.link}`));
    return matches;
  } catch (err) {
    console.error(err.message);
    return [];
  }
}

async function run() {
  await inspectPage('https://www.tokusatsuindo.com/kamen-rider-2/');
  await inspectPage('https://www.tokusatsuindo.com/super-sentai/');
  await inspectPage('https://www.tokusatsuindo.com/movie-special/');
}

run();
