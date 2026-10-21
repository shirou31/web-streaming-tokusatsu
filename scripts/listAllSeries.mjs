const urls = [
  'https://www.tokusatsuindo.com/kamen-rider/',
  'https://www.tokusatsuindo.com/super-sentai/',
  'https://www.tokusatsuindo.com/ultraman/'
];

for (const u of urls) {
  const res = await fetch(u, { headers: { 'User-Agent': 'Mozilla/5.0' } });
  const html = await res.text();
  const links = [...html.matchAll(/href="(https:\/\/www\.tokusatsuindo\.com\/[^"]+)"[^>]*>([^<]+)<\/a>/g)];
  console.log(`\n=== Links on ${u} ===`);
  const unique = new Map();
  for (const l of links) {
    if (!l[1].includes('/category/') && !l[1].includes('/tag/') && l[2].trim().length > 3) {
      unique.set(l[1], l[2].trim());
    }
  }
  for (const [url, title] of unique) {
    console.log(`${title} -> ${url}`);
  }
}
