import fs from 'fs';

async function scrapeAllGokaiger() {
  console.log('Starting full scrape for Kaizoku Sentai Gokaiger (Ep 1 - 51)...');
  const filePath = 'src/data/scrapedTokusatsu.json';
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  const episodes = data.episodes;

  let scrapedCount = 0;
  for (let ep = 1; ep <= 51; ep++) {
    const pageUrl = ep === 51 
      ? 'https://www.tokusatsuindo.com/gokaiger-episode-51-sub-indonesia-tamat/' 
      : `https://www.tokusatsuindo.com/gokaiger-episode-${ep}-sub-indonesia/`;
    
    try {
      const res = await fetch(pageUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } });
      if (!res.ok) {
        console.warn(`Ep ${ep}: HTTP ${res.status}`);
        continue;
      }
      const html = await res.text();
      const match = html.match(/data-embed="([^"]+)"/i);
      if (match) {
        const decoded = Buffer.from(match[1], 'base64').toString('utf8');
        const srcMatch = decoded.match(/src="([^"]+)"/i);
        const embedUrl = srcMatch ? srcMatch[1] : null;

        if (embedUrl) {
          // Find or create in scrapedTokusatsu.json
          const existing = episodes.find(e => 
            (e.seriesTitle === 'Kaizoku Sentai Gokaiger' || e.title.includes('Gokaiger')) && 
            e.episodeNumber === ep
          );

          const realServers = [
            {
              id: `srv_real_tokusatsuindo_gokaiger_${ep}`,
              name: 'Server 1 (Direct Embed HD)',
              embedUrl: embedUrl,
              directUrl: null,
              type: 'embed',
              status: 'online'
            }
          ];

          if (existing) {
            existing.servers = realServers;
            existing.sourceUrl = pageUrl;
            existing.quality = '1080p FHD / 720p HD';
          } else {
            episodes.push({
              id: `scraped_prod_ss_gokaiger_ep${ep}`,
              productionId: '0192a3f0-1111-7000-8000-000000000019',
              franchise: 'Super Sentai',
              seriesTitle: 'Kaizoku Sentai Gokaiger',
              title: `Kaizoku Sentai Gokaiger Episode ${ep} Sub Indo`,
              episodeNumber: ep,
              seasonNumber: 1,
              era: 'Heisei',
              contentType: 'tv_series',
              sourceUrl: pageUrl,
              fansub: 'TokusatsuIndo',
              language: 'Indonesian (Sub Indo)',
              quality: '1080p FHD / 720p HD',
              thumbnail: '/posters/poster_ten_gokaiger.jpg',
              servers: realServers,
              scrapedAt: new Date().toISOString()
            });
          }
          scrapedCount++;
          process.stdout.write(`✓ Ep ${ep} `);
        }
      }
    } catch (err) {
      console.error(`\nError scraping Ep ${ep}:`, err.message);
    }
  }

  console.log(`\nDone! Scraped and updated ${scrapedCount} episodes.`);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
  console.log('Saved updated scrapedTokusatsu.json successfully.');
}

scrapeAllGokaiger();
