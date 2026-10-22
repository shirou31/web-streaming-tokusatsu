async function test() {
  const res = await fetch('https://www.neosatsu.com/2024/11/blazar-tokyo-kaiju-showdown-sub-indo.html', {
    headers: { 'User-Agent': 'Mozilla/5.0' }
  });
  const html = await res.text();
  const art = html.match(/<article[^>]*>([\s\S]*?)<\/article>/i);
  if (art) {
    console.log('Article text:', art[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').slice(0, 1500));
    const links = [...art[1].matchAll(/<a[^>]+href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi)];
    console.log('Total links in article:', links.length);
    links.forEach(l => console.log('Link:', l[2].replace(/<[^>]+>/g, '').trim(), '->', l[1]));
  } else {
    console.log('Article not found');
  }
}
test();
