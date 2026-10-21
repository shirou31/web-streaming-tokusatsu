import fs from 'fs';

async function fetchPage(url) {
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Referer': 'https://www.tokusatsuindo.com/'
    }
  });
  return res.text();
}

function extractEmbed(html) {
  // Check for base64 data-embed
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
  // Check for direct iframe
  const iframeMatch = html.match(/<iframe[^>]+src=["']([^"']+)["']/i);
  if (iframeMatch) {
    let src = iframeMatch[1];
    if (src.startsWith('//')) src = 'https:' + src;
    return src;
  }
  return null;
}

async function main() {
  console.log('1. Scraping TV Series Ep 1 (gokaiger-episode-1-sub-indonesia)...');
  const ep1Html = await fetchPage('https://www.tokusatsuindo.com/gokaiger-episode-1-sub-indonesia/');
  const ep1Embed = extractEmbed(ep1Html);
  console.log('EP1 Embed:', ep1Embed);

  console.log('2. Scraping Movie Ten Gokaiger (kaizoku-sentai-ten-gokaiger-sub-indonesia)...');
  const movieHtml = await fetchPage('https://www.tokusatsuindo.com/kaizoku-sentai-ten-gokaiger-sub-indonesia/');
  const movieEmbed = extractEmbed(movieHtml);
  console.log('Ten Gokaiger Movie Embed:', movieEmbed);

  const jsonPath = './src/data/scrapedTokusatsu.json';
  const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

  // Update TV Series Ep 1 (scraped_prod_ss_gokaiger_ep1)
  const tvEp1 = data.episodes.find(e => e.id === 'scraped_prod_ss_gokaiger_ep1');
  if (tvEp1 && ep1Embed) {
    tvEp1.sourceUrl = 'https://www.tokusatsuindo.com/gokaiger-episode-1-sub-indonesia/';
    tvEp1.driveDownloadUrl1 = 'https://drive.google.com/file/d/1Bf3xSrHmZ0YTQYsYVGgppzVkIjGC63mn/view?usp=sharing';
    tvEp1.servers = [
      {
        id: 'srv_real_tokusatsuindo_gokaiger_1',
        name: 'Server 1 (Direct Embed HD)',
        embedUrl: ep1Embed,
        directUrl: null,
        type: 'embed',
        status: 'online'
      },
      {
        id: 'srv_real_gdrive_gokaiger_1',
        name: 'Server 2 (Google Drive Preview)',
        embedUrl: 'https://drive.google.com/file/d/1Bf3xSrHmZ0YTQYsYVGgppzVkIjGC63mn/preview',
        directUrl: 'https://drive.google.com/file/d/1Bf3xSrHmZ0YTQYsYVGgppzVkIjGC63mn/view?usp=sharing',
        type: 'gdrive',
        status: 'online'
      }
    ];
    console.log('Updated scraped_prod_ss_gokaiger_ep1 successfully!');
  }

  // Update Ten Gokaiger Movie (scraped_prod_ss_ten_gokaiger_ep1)
  const tenMovie = data.episodes.find(e => e.id === 'scraped_prod_ss_ten_gokaiger_ep1');
  if (tenMovie && movieEmbed) {
    tenMovie.sourceUrl = 'https://www.tokusatsuindo.com/kaizoku-sentai-ten-gokaiger-sub-indonesia/';
    tenMovie.servers = [
      {
        id: 'srv_real_tokusatsuindo_ten_gokaiger_movie',
        name: 'Server 1 (Direct Embed HD)',
        embedUrl: movieEmbed,
        directUrl: null,
        type: 'embed',
        status: 'online'
      }
    ];
    console.log('Updated scraped_prod_ss_ten_gokaiger_ep1 successfully!');
  }

  fs.writeFileSync(jsonPath, JSON.stringify(data, null, 2), 'utf8');
  console.log('Saved to scrapedTokusatsu.json!');
}

main().catch(console.error);
