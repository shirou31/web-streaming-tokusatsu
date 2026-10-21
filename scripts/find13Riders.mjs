async function find13Riders() {
  const res = await fetch('https://www.tokusatsuindo.com/?s=13+riders', { headers: { 'User-Agent': 'Mozilla/5.0' } });
  const html = await res.text();
  const matches = [...html.matchAll(/<article[^>]*>([\s\S]*?)<\/article>/gi)];
  console.log(`Found ${matches.length} articles for 13 riders`);
  matches.forEach(a => {
    const l = a[1].match(/<a\s+[^>]*href=["'](https:\/\/www\.tokusatsuindo\.com\/[^"']+)["'][^>]*>([\s\S]*?)<\/a>/i);
    const t = a[1].match(/<h[1234][^>]*>([\s\S]*?)<\/h[1234]>/i);
    console.log(t ? t[1].replace(/<[^>]+>/g, '').trim() : '', '->', l ? l[1] : '');
  });
}
find13Riders();
