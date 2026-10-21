import fs from 'fs';

const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

async function searchTokusatsu(query) {
  try {
    const url = `https://www.tokusatsuindo.com/?s=${encodeURIComponent(query)}`;
    const res = await fetch(url, {
      headers: {
        'User-Agent': USER_AGENT,
        'Referer': 'https://www.tokusatsuindo.com/'
      },
      signal: AbortSignal.timeout(10000)
    });
    if (!res.ok) return [];
    const html = await res.text();
    const articleRegex = /<article[\s\S]*?<\/article>/gi;
    const articles = html.match(articleRegex) || [];
    const results = [];
    for (const art of articles) {
      const linkMatch = art.match(/<a\s+href="([^"]+)"[^>]*rel="bookmark"[^>]*>([\s\S]*?)<\/a>/i) || art.match(/<h2[^>]*><a\s+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/i);
      const imgMatch = art.match(/<img[^>]+src="([^"]+)"/i);
      if (linkMatch) {
        results.push({
          title: linkMatch[2].replace(/<[^>]+>/g, '').trim(),
          url: linkMatch[1],
          image: imgMatch ? imgMatch[1] : null
        });
      }
    }
    return results;
  } catch (err) {
    console.error(`Search error for ${query}:`, err.message);
    return [];
  }
}

async function run() {
  const queries = [
    'Zero-One',
    'Saber',
    'Revice',
    'Geats',
    'Gotchard',
    'Gavv',
    'Kiramager',
    'Zenkaiger',
    'Donbrothers',
    'King-Ohger',
    'Boonboomger',
    'Ultraman Z',
    'Ultraman Trigger',
    'Ultraman Decker',
    'Ultraman Blazar',
    'Ultraman Arc'
  ];

  for (const q of queries) {
    console.log(`\n=== Searching: ${q} ===`);
    const items = await searchTokusatsu(q);
    console.log(`Found ${items.length} items`);
    for (const item of items.slice(0, 4)) {
      console.log(`- [${item.title}] -> ${item.url}`);
    }
    await new Promise(r => setTimeout(r, 600));
  }
}

run();
