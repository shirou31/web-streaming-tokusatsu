import fs from 'fs';

async function searchTokuIndo(keyword) {
  try {
    const url = `https://www.tokusatsuindo.com/?s=${encodeURIComponent(keyword)}`;
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    const html = await res.text();
    const articles = [];
    // Match <article ...> or <h2 class="entry-title"><a href="..." ...>title</a></h2>
    const regex = /<h2 class="entry-title"><a href="([^"]+)"[^>]*>([^<]+)<\/a><\/h2>/g;
    let match;
    while ((match = regex.exec(html)) !== null) {
      articles.push({ url: match[1], title: match[2] });
    }
    console.log(`\n=== Keyword: ${keyword} (${articles.length} found) ===`);
    articles.slice(0, 10).forEach(a => console.log(`- ${a.title} -> ${a.url}`));
    return articles;
  } catch (err) {
    console.error(`Error searching ${keyword}:`, err.message);
    return [];
  }
}

async function run() {
  await searchTokuIndo('Kamen Rider Ryuki');
  await searchTokuIndo('Kamen Rider Den-O');
  await searchTokuIndo('Kamen Rider OOO');
  await searchTokuIndo('Gokaiger');
}

run();
