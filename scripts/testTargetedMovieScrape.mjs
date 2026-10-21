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

function extractEmbed(html) {
  if (!html) return null;
  const embedMatches = [...html.matchAll(/data-embed=["']([A-Za-z0-9+/=]+)["']/g)];
  for (const m of embedMatches) {
    try {
      const decoded = Buffer.from(m[1], 'base64').toString('utf8');
      const srcMatch = decoded.match(/src=["']([^"']+)["']/i);
      if (srcMatch && srcMatch[1]) {
        let embedUrl = srcMatch[1];
        if (embedUrl.startsWith('//')) embedUrl = 'https:' + embedUrl;
        return embedUrl;
      }
    } catch (_) {}
  }
  const iframeMatch = html.match(/<iframe[^>]+src=["']([^"']+)["']/i);
  if (iframeMatch) {
    let src = iframeMatch[1];
    if (src.startsWith('//')) src = 'https:' + src;
    return src;
  }
  return null;
}

function extractGdriveLinks(html) {
  if (!html) return [];
  const gdrive = new Set();
  const re = /https:\/\/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/g;
  let m;
  while ((m = re.exec(html)) !== null) {
    const id = m[1];
    if (!id.includes('preview') && !id.includes('toku') && id.length > 15) {
      gdrive.add(`https://drive.google.com/file/d/${id}/preview`);
    }
  }
  return Array.from(gdrive);
}

// Targeted search parsing from <article> tags
async function searchMovieArticles(query) {
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

const testTargets = [
  { slug: 'geats-4-aces', query: 'geats 4 aces' },
  { slug: 'shin-kamen-rider', query: 'shin kamen rider' },
  { slug: 'battle-familia', query: 'battle familia' },
  { slug: 'super-hero-senki', query: 'super hero senki' },
  { slug: 'ryuki-final', query: 'ryuki episode final' }
];

async function run() {
  for (const t of testTargets) {
    console.log(`\nSearching for: ${t.slug} (query: "${t.query}")...`);
    const articles = await searchMovieArticles(t.query);
    console.log(`Found ${articles.length} articles`);
    let found = false;
    for (const art of articles.slice(0, 3)) {
      console.log(`  Checking article: ${art.title} -> ${art.url}`);
      const pageHtml = await fetchPage(art.url);
      const embed = extractEmbed(pageHtml);
      const gdrive = extractGdriveLinks(pageHtml);
      if (embed || gdrive.length > 0) {
        console.log(`    ✅ SUCCESS! Embed: ${embed ? embed.slice(0, 50) + '...' : 'none'} | GDrive: ${gdrive.length}`);
        found = true;
        break;
      }
    }
    if (!found) {
      console.log(`    ❌ No embed found for ${t.slug}`);
    }
  }
}

run();
