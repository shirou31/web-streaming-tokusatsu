async function fetchPage(url) {
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0 Safari/537.36',
      'Referer': 'https://www.tokusatsuindo.com/'
    }
  });
  return res.text();
}

function extractEmbed(html) {
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
  return null;
}

async function main() {
  const ep1Html = await fetchPage('https://www.tokusatsuindo.com/ultraman-tiga-episode-1-sub-indonesia/');
  console.log('TV Ep 1 Embed:', extractEmbed(ep1Html));

  const ep2Html = await fetchPage('https://www.tokusatsuindo.com/ultraman-tiga-episode-2-sub-indonesia/');
  console.log('TV Ep 2 Embed:', extractEmbed(ep2Html));

  const gaidenHtml = await fetchPage('https://www.tokusatsuindo.com/ultraman-tiga-gaiden-revival-of-the-ancient-giant-sub-indonesia/');
  console.log('Gaiden Movie Embed:', extractEmbed(gaidenHtml));
}

main().catch(console.error);
