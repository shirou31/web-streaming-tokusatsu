async function findLinks() {
  const res = await fetch(`https://www.tokusatsuindo.com/?s=den-o`, {
    headers: { 'User-Agent': 'Mozilla/5.0' }
  });
  const html = await res.text();
  const matches = [...html.matchAll(/<h2[^>]*class=["'][^"']*entry-title[^"']*["'][^>]*><a[^>]+href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a><\/h2>/gi)];
  console.log(`Results for den-o (${matches.length}):`);
  matches.forEach(m => console.log(m[2].trim(), '->', m[1]));
}
findLinks();
