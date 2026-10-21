async function test(query) {
  const url = `https://www.tokusatsuindo.com/?s=${encodeURIComponent(query)}`;
  const res = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0' }
  });
  const text = await res.text();
  const regex = /<a\s+[^>]*href=["'](https:\/\/www\.tokusatsuindo\.com\/[^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  const matches = [];
  let m;
  while ((m = regex.exec(text)) !== null) {
    const rawLink = m[1];
    const rawText = m[2].replace(/<[^>]+>/g, '').trim();
    if (rawText && !rawLink.includes('/category/') && !rawLink.includes('/tag/') && !rawLink.includes('/search/') && !rawLink.includes('/page/')) {
      matches.push({ link: rawLink, title: rawText });
    }
  }
  console.log(`\nResults for "${query}":`, matches.slice(0, 10));
}

async function run() {
  await test('ryuki');
  await test('den-o');
  await test('ooo');
  await test('gokaiger');
}

run();
