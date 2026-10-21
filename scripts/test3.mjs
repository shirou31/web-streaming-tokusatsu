async function test(q) {
  const res = await fetch('https://www.tokusatsuindo.com/?s=' + encodeURIComponent(q), { headers: { 'User-Agent': 'Mozilla/5.0' } });
  const html = await res.text();
  const matches = [...html.matchAll(/<article[^>]*>([\s\S]*?)<\/article>/gi)];
  console.log(`\nQuery: "${q}" -> ${matches.length} articles`);
  matches.slice(0, 3).forEach(a => {
    const l = a[1].match(/<a\s+[^>]*href=["'](https:\/\/www\.tokusatsuindo\.com\/[^"']+)["'][^>]*>([\s\S]*?)<\/a>/i);
    const t = a[1].match(/<h[1234][^>]*>([\s\S]*?)<\/h[1234]>/i);
    console.log('  -', t ? t[1].replace(/<[^>]+>/g, '').trim() : '', '->', l ? l[1] : '');
  });
}
async function run() {
  await test('den o movie');
  await test('den o born');
  await test('cho den o decade');
  await test('cho den o onigashima');
  await test('super hero taisen');
}
run();
