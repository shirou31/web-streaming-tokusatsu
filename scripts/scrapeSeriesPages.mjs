import fs from 'fs';

async function fetchPageContent(title, url) {
  try {
    const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    const html = await res.text();
    console.log(`\n================== ${title} ==================`);
    console.log(`URL: ${url} (length: ${html.length})`);

    // Extract all anchor links with download or episode or stream
    const linkRegex = /<a\s+[^>]*href=["'](https?:\/\/[^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
    let m;
    const links = [];
    while ((m = linkRegex.exec(html)) !== null) {
      const href = m[1];
      const text = m[2].replace(/<[^>]+>/g, '').trim();
      if (text && !href.includes('/feed/') && !href.includes('/category/')) {
        links.push({ text, href });
      }
    }
    console.log(`Total sub-links found: ${links.length}`);
    const interesting = links.filter(l => /episode|eps|movie|batch|gdrive|drive|mega|streamwish|dood|bithls|pixeldrain|terabox|mirror/i.test(l.text + ' ' + l.href));
    console.log(`Interesting links (${interesting.length}):`);
    interesting.slice(0, 15).forEach(l => console.log(`  - [${l.text}] -> ${l.href}`));

    return { title, url, links: interesting };
  } catch (err) {
    console.error(`Error fetching ${title}:`, err.message);
    return null;
  }
}

async function run() {
  await fetchPageContent('Kamen Rider Ryuki', 'https://www.tokusatsuindo.com/kamen-rider-2/kamen-rider-ryuki/');
  await fetchPageContent('Kamen Rider Den-O', 'https://www.tokusatsuindo.com/kamen-rider-2/kamen-rider-den-o/');
  await fetchPageContent('Kamen Rider OOO', 'https://www.tokusatsuindo.com/kamen-rider-2/kamen-rider-ooo');
  await fetchPageContent('Kaizoku Sentai Gokaiger', 'https://www.tokusatsuindo.com/super-sentai2/gokaiger/');
}

run();
