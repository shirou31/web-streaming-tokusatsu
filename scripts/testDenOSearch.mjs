async function searchPages() {
  for (let p = 2; p <= 4; p++) {
    const res = await fetch(`https://www.tokusatsuindo.com/page/${p}/?s=kamen+rider+den-o`, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    if (!res.ok) break;
    const html = await res.text();
    const matches = [...html.matchAll(/<article[^>]*>([\s\S]*?)<\/article>/gi)];
    console.log(`Page ${p} -> ${matches.length} articles`);
    matches.forEach(a => {
      const l = a[1].match(/<a\s+[^>]*href=["'](https:\/\/www\.tokusatsuindo\.com\/[^"']+)["'][^>]*>([\s\S]*?)<\/a>/i);
      const t = a[1].match(/<h[1234][^>]*>([\s\S]*?)<\/h[1234]>/i);
      const title = t ? t[1].replace(/<[^>]+>/g, '').trim() : '';
      if (!title.toLowerCase().includes('episode ')) {
        console.log('  -', title, '->', l ? l[1] : '');
      }
    });
  }
}
searchPages();
