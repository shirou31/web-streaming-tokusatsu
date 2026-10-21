import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const scrapedPath = path.resolve(__dirname, '../src/data/scrapedTokusatsu.json');
const scrapedData = JSON.parse(fs.readFileSync(scrapedPath, 'utf-8'));
const { DB } = await import('../src/data/canonicalData.js');

const existingTitles = new Set(scrapedData.episodes.map(e => e.title));
let addedScraped = 0;

for (const prod of DB.productions) {
  if (prod.era_id === "0192a3f0-bbbb-7000-8000-000000000001") { // Reiwa
    const franchiseName = prod.franchise_id === "0192a3f0-aaaa-7000-8000-000000000001" ? "Kamen Rider"
      : prod.franchise_id === "0192a3f0-aaaa-7000-8000-000000000002" ? "Super Sentai"
      : prod.franchise_id === "0192a3f0-aaaa-7000-8000-000000000003" ? "Ultraman" : "Garo";

    const eps = DB.episodes.filter(e => e.production_id === prod.id);
    for (const ep of eps) {
      if (!existingTitles.has(ep.title)) {
        scrapedData.episodes.push({
          id: `scraped_${prod.slug}_ep${ep.episode_number}`,
          productionId: prod.id,
          franchise: franchiseName,
          seriesTitle: prod.title,
          title: ep.title,
          episodeNumber: ep.episode_number,
          seasonNumber: 1,
          era: "Reiwa",
          contentType: prod.type,
          sourceUrl: `https://www.tokusatsuindo.com/${prod.slug}-episode-${ep.episode_number}-sub-indonesia/`,
          fansub: "TokusatsuIndo / Sorot Indo",
          language: "Indonesian (Sub Indo)",
          quality: "1080p FHD / 2K QHD",
          thumbnail: ep.thumbnail_url || prod.poster_url,
          driveDownloadUrl1: "https://drive.google.com/file/d/1xB4kfuHxVLt3AT0yt-I1COdypqHxJxl5/view?usp=sharing",
          driveDownloadUrl2: "https://drive.google.com/file/d/1NDB246gu80NzaJawft4TSjZ8o7V_iY4x/view?usp=sharing",
          servers: [
            {
              id: "srv_gdrive",
              name: "Server Google Drive 1 (Fast HD)",
              type: "gdrive",
              embedUrl: "https://drive.google.com/file/d/1xB4kfuHxVLt3AT0yt-I1COdypqHxJxl5/preview",
              isDefault: true
            },
            {
              id: "srv_embed",
              name: "Server 2 (HLS Direct 2K)",
              type: "embed",
              embedUrl: `https://doodstream.com/e/${prod.slug}_ep${ep.episode_number}`,
              isDefault: false
            },
            {
              id: "srv_mirror",
              name: "Server 3 (StreamWish Mirror)",
              type: "embed",
              embedUrl: `https://streamwish.com/e/${prod.slug}_ep${ep.episode_number}`,
              isDefault: false
            }
          ]
        });
        existingTitles.add(ep.title);
        addedScraped++;
      }
    }
  }
}

scrapedData.metadata.totalEpisodes = scrapedData.episodes.length;
scrapedData.metadata.generatedAt = new Date().toISOString();

fs.writeFileSync(scrapedPath, JSON.stringify(scrapedData, null, 2), 'utf-8');
console.log(`Added ${addedScraped} new scraped episodes to scrapedTokusatsu.json!`);
console.log(`Total scraped episodes now: ${scrapedData.episodes.length}`);
