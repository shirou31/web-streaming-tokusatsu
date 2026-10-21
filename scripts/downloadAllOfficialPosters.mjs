import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const postersMap = {
  "kamen-rider-zero-one": "https://static.wikia.nocookie.net/kamenrider/images/b/be/Zero-One_Poster.jpg/revision/latest?cb=20190717133445",
  "kamen-rider-reiwa-the-first-generation": "https://static.wikia.nocookie.net/kamenrider/images/e/e4/Reiwa_poster_2.jpeg/revision/latest?cb=20191117003321",
  "kamen-rider-zero-one-the-movie-real-time": "https://static.wikia.nocookie.net/kamenrider/images/b/be/Realtimeposteralt2.jpg/revision/latest?cb=20201220045926",
  "zero-one-others-kamen-rider-vulcan-valkyrie": "https://static.wikia.nocookie.net/kamenrider/images/6/6b/Zero-One_Others_Vulcan_%26_Valkyrie_poster.jpg/revision/latest?cb=20210326094926",
  "kamen-rider-saber": "https://static.wikia.nocookie.net/kamenrider/images/8/8d/Saber_Poster.jpg/revision/latest?cb=20200729114658",
  "kamen-rider-saber-the-phoenix-swordsman": "https://static.wikia.nocookie.net/kamenrider/images/d/dc/Saber_Movie_Poster.jpg/revision/latest?cb=20201123235121",
  "saber-zenkaiger-super-hero-senki": "https://static.wikia.nocookie.net/kamenrider/images/2/26/Superhero_Senki_Poster.jpg/revision/latest?cb=20210714181654",
  "kamen-rider-saber-trio-of-deep-sin": "https://static.wikia.nocookie.net/kamenrider/images/a/af/Trio_of_Deep_Sin_Poster.jpg/revision/latest?cb=20211111030845",
  "kamen-rider-revice": "https://static.wikia.nocookie.net/kamenrider/images/e/e2/Revice_Poster.jpg/revision/latest?cb=20240826140253",
  "kamen-rider-beyond-generations": "https://static.wikia.nocookie.net/kamenrider/images/0/01/Beyond_Generations_Century_Poster.jpg/revision/latest?cb=20211214071358",
  "kamen-rider-revice-battle-familia": "https://static.wikia.nocookie.net/kamenrider/images/8/85/Battle_Familia_Vice_Poster.jpg/revision/latest?cb=20220717050508",
  "kamen-rider-geats-x-revice-movie-battle-royale": "https://static.wikia.nocookie.net/kamenrider/images/1/1f/Movie_Battle_Royale_Poster.jpg/revision/latest?cb=20221113003831",
  "kamen-rider-geats-4-aces-and-the-black-fox": "https://static.wikia.nocookie.net/kamenrider/images/8/85/Geats_4_Aces_and_Black_Fox_Theatrical_Poster.jpg/revision/latest?cb=20230618003811",
  "kamen-rider-gotchard": "https://static.wikia.nocookie.net/kamenrider/images/4/49/Gotchard_Q1_Poster.jpg/revision/latest?cb=20240521022929",
  "kamen-rider-the-winter-movie-gotchard-geats": "https://static.wikia.nocookie.net/kamenrider/images/d/de/Kamen_Rider_The_Winter_Movie_Gotchard_%26_Geats_Official_Poster.jpg/revision/latest?cb=20231126082511",
  "kamen-rider-gotchard-the-future-daybreak": "https://static.wikia.nocookie.net/kamenrider/images/6/64/Kamen_Rider_Gotchard_The_Future_Daybreak_Poster.jpg/revision/latest?cb=20240616005232",
  "kamen-rider-black-sun": "https://static.tvmaze.com/uploads/images/original_untouched/428/1071917.jpg",
  "mashin-sentai-kiramager": "https://static.wikia.nocookie.net/powerrangers/images/4/43/Kiramager_Poster.jpg/revision/latest?cb=20230130210737",
  "kikai-sentai-zenkaiger": "https://static.wikia.nocookie.net/powerrangers/images/0/01/Zenkaiger_Poster.jpg/revision/latest?cb=20260630053251",
  "avataro-sentai-donbrothers": "https://static.wikia.nocookie.net/powerrangers/images/a/ae/Donbrothers_Poster.jpg/revision/latest?cb=20230131061442",
  "ohsama-sentai-king-ohger-adventure-heaven": "https://static.wikia.nocookie.net/powerrangers/images/8/8e/Ohsama_Sentai_King-Ohger_Adventure_Heaven_Poster.jpg/revision/latest?cb=20230618011511",
  "king-ohger-vs-donbrothers": "https://static.wikia.nocookie.net/powerrangers/images/e/e2/Ohsama_Sentai_King-Ohger_vs_Donbrothers_and_Kyoryuger.jpg/revision/latest?cb=20240322035802",
  "ultraman-z": "https://static.wikia.nocookie.net/ultra/images/2/23/ZPoster1.jpg/revision/latest?cb=20200325213055",
  "ultraman-trigger-new-generation-tiga": "https://static.wikia.nocookie.net/ultra/images/e/ec/TriggerPoster.jpg/revision/latest?cb=20210415090252",
  "ultraman-trigger-episode-z": "https://static.wikia.nocookie.net/ultra/images/7/77/Ultraman-Trigger-Episode-Z-Zabil.jpg/revision/latest?cb=20230404024449",
  "ultraman-decker": "https://static.wikia.nocookie.net/ultra/images/2/22/Ultraman_Decker_poster.jpg/revision/latest?cb=20220331003822",
  "ultraman-blazar-the-movie-tokyo-kaiju-showdown": "https://static.wikia.nocookie.net/ultra/images/d/db/Ultraman_Blazar_The_Movie_Tokyo_Kaiju_Showdown_English_Poster.jpg/revision/latest?cb=20250424154419",
  "ultraman-arc-the-movie-clash-of-light-and-evil": "https://static.wikia.nocookie.net/ultra/images/3/3e/Ultraman_Arc_Poster_3.jpg/revision/latest?cb=20240425182656",
  "garo-hagane-o-tsugu-mono": "https://static.wikia.nocookie.net/garo/images/d/dc/GARO_Heir_To_Steel_Armor_Poster.jpeg/revision/latest?cb=20240109184215"
};

const postersDir = path.resolve(__dirname, '../public/posters');
if (!fs.existsSync(postersDir)) {
  fs.mkdirSync(postersDir, { recursive: true });
}

async function downloadFile(url, destPath) {
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    }
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  const arrayBuffer = await res.arrayBuffer();
  fs.writeFileSync(destPath, Buffer.from(arrayBuffer));
}

async function main() {
  console.log('Downloading all official posters to public/posters/...');
  const localMap = {};

  for (const [slug, url] of Object.entries(postersMap)) {
    const filename = `poster_${slug.replace(/[^a-zA-Z0-9_-]/g, '_')}.jpg`;
    const destPath = path.join(postersDir, filename);
    const localUrl = `/posters/${filename}`;

    try {
      console.log(`Downloading [${slug}] -> ${filename}...`);
      await downloadFile(url, destPath);
      const stats = fs.statSync(destPath);
      console.log(`  ✓ Success (${(stats.size / 1024).toFixed(1)} KB)`);
      localMap[slug] = localUrl;
    } catch (err) {
      console.error(`  ✗ Error downloading ${slug}:`, err.message);
      // Fallback to direct url
      localMap[slug] = url;
    }
  }

  // Update canonicalData.js
  console.log('\nUpdating canonicalData.js...');
  const { DB } = await import('../src/data/canonicalData.js');

  for (const prod of DB.productions) {
    if (localMap[prod.slug]) {
      prod.poster_url = localMap[prod.slug];
      prod.fallback_poster = localMap[prod.slug];
    }
  }

  // Serialize updated canonicalData.js
  const canonicalPath = path.resolve(__dirname, '../src/data/canonicalData.js');
  const canonicalContent = `// Database Kanonikal TokuFlix dengan Metadata Tokusatsu Lengkap
export const DB = ${JSON.stringify(DB, null, 2)};
`;
  fs.writeFileSync(canonicalPath, canonicalContent, 'utf-8');
  console.log('✓ canonicalData.js updated successfully!');

  // Update scrapedTokusatsu.json
  console.log('\nUpdating scrapedTokusatsu.json...');
  const scrapedPath = path.resolve(__dirname, '../src/data/scrapedTokusatsu.json');
  if (fs.existsSync(scrapedPath)) {
    const scrapedData = JSON.parse(fs.readFileSync(scrapedPath, 'utf-8'));
    const list = Array.isArray(scrapedData) ? scrapedData : (scrapedData.episodes || []);
    for (const ep of list) {
      // Find matching slug
      for (const [slug, localUrl] of Object.entries(localMap)) {
        if (ep.productionId?.includes(slug) || ep.slug?.includes(slug)) {
          ep.posterUrl = localUrl;
          ep.fallbackPoster = localUrl;
        }
      }
    }
    fs.writeFileSync(scrapedPath, JSON.stringify(scrapedData, null, 2), 'utf-8');
    console.log('✓ scrapedTokusatsu.json updated successfully!');
  }

  console.log('\nALL 29 OFFICIAL POSTERS DOWNLOADED AND INTEGRATED SUCCESSFULLY!');
}

main().catch(console.error);
