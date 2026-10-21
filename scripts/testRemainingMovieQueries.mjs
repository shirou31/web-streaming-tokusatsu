import fs from 'fs';

async function fetchPage(url) {
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': 'https://www.tokusatsuindo.com/'
      }
    });
    if (!res.ok) return null;
    return await res.text();
  } catch (err) {
    return null;
  }
}

async function searchTokusatsu(query) {
  const q = encodeURIComponent(query.replace(/[^a-zA-Z0-9 ]/g, ' ').trim());
  const html = await fetchPage(`https://www.tokusatsuindo.com/?s=${q}`);
  if (!html) return [];

  const articleMatches = [...html.matchAll(/<article[^>]*>([\s\S]*?)<\/article>/gi)];
  const results = [];
  articleMatches.forEach((a) => {
    const linkMatch = a[1].match(/<a\s+[^>]*href=["'](https:\/\/www\.tokusatsuindo\.com\/[^"']+)["'][^>]*>([\s\S]*?)<\/a>/i);
    const titleMatch = a[1].match(/<h[1234][^>]*>([\s\S]*?)<\/h[1234]>/i);
    const titleText = titleMatch ? titleMatch[1].replace(/<[^>]+>/g, '').trim() : (linkMatch ? linkMatch[2].replace(/<[^>]+>/g, '').trim() : '');
    const url = linkMatch ? linkMatch[1] : '';
    if (url && titleText && !url.includes('/category/') && !url.includes('/tag/')) {
      results.push({ url, title: titleText });
    }
  });
  return results;
}

const queriesToTest = [
  { slug: 'shin-ultraman', q: 'shin ultraman' },
  { slug: 'reiwa-first-gen', q: 'reiwa the first generation' },
  { slug: 'zero-one-realtime', q: 'zero one real time' },
  { slug: 'vulcan-valkyrie', q: 'vulcan valkyrie' },
  { slug: 'saber-phoenix', q: 'saber phoenix swordsman' },
  { slug: 'saber-trio', q: 'trio of deep sin' },
  { slug: 'beyond-generations', q: 'beyond generations' },
  { slug: 'geats-revice-battle-royale', q: 'geats revice battle royale' },
  { slug: 'gotchard-geats-winter', q: 'gotchard geats winter' },
  { slug: 'gotchard-future-daybreak', q: 'future daybreak' },
  { slug: 'adventure-heaven', q: 'adventure heaven' },
  { slug: 'king-ohger-donbrothers', q: 'king ohger vs donbrothers' },
  { slug: 'trigger-episode-z', q: 'trigger episode z' },
  { slug: 'blazar-tokyo-kaiju', q: 'blazar tokyo kaiju showdown' },
  { slug: 'den-o-ore-tanjou', q: 'den o ore tanjou' },
  { slug: 'climax-deka', q: 'climax deka' },
  { slug: 'saraba-den-o', q: 'saraba den o' },
  { slug: 'onigashima-warship', q: 'onigashima' },
  { slug: 'cho-den-o-red', q: 'cho den o red' },
  { slug: 'cho-den-o-blue', q: 'cho den o blue' },
  { slug: 'cho-den-o-yellow', q: 'cho den o yellow' },
  { slug: 'movie-war-core', q: 'movie war core' },
  { slug: 'ooo-wonderful', q: 'ooo wonderful' },
  { slug: 'movie-war-mega-max', q: 'movie war mega max' },
  { slug: 'ooo-10th', q: 'ooo 10th' },
  { slug: 'gokaiger-199', q: 'gokaiger 199' },
  { slug: 'ghost-ship', q: 'flying ghost ship' },
  { slug: 'gokaiger-gavan', q: 'gokaiger vs gavan' },
  { slug: 'super-hero-taisen', q: 'super hero taisen' },
  { slug: 'go-busters-gokaiger', q: 'go busters vs gokaiger' }
];

async function run() {
  for (const item of queriesToTest) {
    const res = await searchTokusatsu(item.q);
    console.log(`\n[${item.slug}] (Q: "${item.q}") -> ${res.length} results:`);
    res.slice(0, 3).forEach(r => console.log(`   - "${r.title}" -> ${r.url}`));
  }
}

run();
