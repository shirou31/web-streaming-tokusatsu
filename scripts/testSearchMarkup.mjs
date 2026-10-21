async function test(query) {
  const res = await fetch(`https://www.tokusatsuindo.com/?s=${encodeURIComponent(query)}`, {
    headers: { 'User-Agent': 'Mozilla/5.0' }
  });
  const html = await res.text();
  const articleMatches = [...html.matchAll(/<article[^>]*>([\s\S]*?)<\/article>/gi)];
  console.log(`\nQuery: "${query}" -> Articles found: ${articleMatches.length}`);
  const results = [];
  articleMatches.forEach((a, i) => {
    const linkMatch = a[1].match(/<a\s+[^>]*href=["'](https:\/\/www\.tokusatsuindo\.com\/[^"']+)["'][^>]*>([\s\S]*?)<\/a>/i);
    const titleMatch = a[1].match(/<h[1234][^>]*>([\s\S]*?)<\/h[1234]>/i);
    const titleText = titleMatch ? titleMatch[1].replace(/<[^>]+>/g, '').trim() : (linkMatch ? linkMatch[2].replace(/<[^>]+>/g, '').trim() : '');
    const url = linkMatch ? linkMatch[1] : '';
    if (url && titleText) {
      results.push({ url, title: titleText });
    }
  });
  console.log(results.slice(0, 5));
}

async function run() {
  await test('geats 4 aces');
  await test('shin kamen rider');
  await test('battle familia');
  await test('super hero senki');
}

run();
