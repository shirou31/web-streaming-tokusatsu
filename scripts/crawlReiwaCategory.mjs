const urls = [
  'https://www.tokusatsuindo.com/kamen-rider-2/',
  'https://www.tokusatsuindo.com/super-sentai/',
  'https://www.tokusatsuindo.com/ultraman/',
  'https://www.tokusatsuindo.com/movie-special/',
  'https://www.tokusatsuindo.com/movie/movie-kamen-rider/',
  'https://www.tokusatsuindo.com/movie/movie-super-sentai/',
  'https://www.tokusatsuindo.com/movie/movie-ultraman/'
];

for (const u of urls) {
  try {
    const res = await fetch(u, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    console.log(`\nURL: ${u} [${res.status}]`);
    if (!res.ok) continue;
    const html = await res.text();
    const links = [...html.matchAll(/href="(https:\/\/www\.tokusatsuindo\.com\/[^"]+)"[^>]*>([^<]+)<\/a>/g)];
    const unique = [];
    const seen = new Set();
    for (const l of links) {
      const url = l[1];
      const title = l[2].trim();
      if (!seen.has(url) && title.length > 2 && !url.includes('/page/') && !url.includes('/category/')) {
        seen.add(url);
        unique.push({ title, url });
      }
    }
    console.log(`Found ${unique.length} links on ${u}`);
    unique.slice(0, 20).forEach(x => console.log(`  - ${x.title} -> ${x.url}`));
  } catch (e) {
    console.log(`Error ${u}:`, e.message);
  }
}
