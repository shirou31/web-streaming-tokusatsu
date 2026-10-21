import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const queries = [
  // Kamen Rider Series & Movies
  { id: 'kamen-rider-zero-one', wiki: 'kamenrider', search: 'Zero-One Poster.jpg' },
  { id: 'kamen-rider-reiwa-the-first-generation', wiki: 'kamenrider', search: 'Reiwa The First Generation poster' },
  { id: 'kamen-rider-zero-one-the-movie-real-time', wiki: 'kamenrider', search: 'REAL TIME poster' },
  { id: 'zero-one-others-kamen-rider-vulcan-valkyrie', wiki: 'kamenrider', search: 'Vulcan & Valkyrie poster' },
  { id: 'kamen-rider-saber', wiki: 'kamenrider', search: 'Saber Poster.jpg' },
  { id: 'kamen-rider-saber-the-phoenix-swordsman', wiki: 'kamenrider', search: 'Phoenix Swordsman Book of Ruin poster' },
  { id: 'saber-zenkaiger-super-hero-senki', wiki: 'kamenrider', search: 'Super Hero Senki poster' },
  { id: 'kamen-rider-saber-trio-of-deep-sin', wiki: 'kamenrider', search: 'Trio of Deep Sin poster' },
  { id: 'kamen-rider-revice', wiki: 'kamenrider', search: 'Revice Poster.jpg' },
  { id: 'kamen-rider-beyond-generations', wiki: 'kamenrider', search: 'Beyond Generations poster' },
  { id: 'kamen-rider-revice-battle-familia', wiki: 'kamenrider', search: 'Battle Familia poster' },
  { id: 'kamen-rider-geats-x-revice-movie-battle-royale', wiki: 'kamenrider', search: 'Movie Battle Royale poster' },
  { id: 'kamen-rider-geats-4-aces-and-the-black-fox', wiki: 'kamenrider', search: '4 Aces and the Black Fox poster' },
  { id: 'kamen-rider-gotchard', wiki: 'kamenrider', search: 'Gotchard Q1 Poster.jpg' },
  { id: 'kamen-rider-the-winter-movie-gotchard-geats', wiki: 'kamenrider', search: 'Gotchard & Geats poster' },
  { id: 'kamen-rider-gotchard-the-future-daybreak', wiki: 'kamenrider', search: 'Future Daybreak Poster.jpg' },
  { id: 'kamen-rider-black-sun', directUrl: 'https://static.tvmaze.com/uploads/images/original_untouched/428/1071917.jpg' },

  // Super Sentai Series & Movies
  { id: 'mashin-sentai-kiramager', wiki: 'powerrangers', search: 'Kiramager Poster.jpg' },
  { id: 'kikai-sentai-zenkaiger', wiki: 'powerrangers', search: 'Zenkaiger Poster.jpg' },
  { id: 'avataro-sentai-donbrothers', wiki: 'powerrangers', search: 'Donbrothers Poster.jpg' },
  { id: 'ohsama-sentai-king-ohger-adventure-heaven', wiki: 'powerrangers', search: 'Adventure Heaven poster' },
  { id: 'king-ohger-vs-donbrothers', wiki: 'powerrangers', search: 'King-Ohger vs. Donbrothers poster' },

  // Ultraman Series & Movies
  { id: 'ultraman-z', wiki: 'ultra', search: 'Ultraman Z poster' },
  { id: 'ultraman-trigger-new-generation-tiga', wiki: 'ultra', search: 'Ultraman Trigger poster' },
  { id: 'ultraman-trigger-episode-z', wiki: 'ultra', search: 'Episode Z poster' },
  { id: 'ultraman-decker', wiki: 'ultra', search: 'Ultraman Decker poster.jpg' },
  { id: 'ultraman-blazar-the-movie-tokyo-kaiju-showdown', wiki: 'ultra', search: 'Tokyo Kaiju Showdown English Poster' },
  { id: 'ultraman-arc-the-movie-clash-of-light-and-evil', wiki: 'ultra', search: 'Ultraman Arc poster' },

  // Garo
  { id: 'garo-hagane-o-tsugu-mono', wiki: 'garo', search: 'Hagane poster' }
];

async function findPosterUrl(item) {
  if (item.directUrl) return item.directUrl;

  try {
    const searchUrl = `https://${item.wiki}.fandom.com/api.php?action=query&list=search&srsearch=${encodeURIComponent(item.search)}&srnamespace=6&format=json`;
    const res = await fetch(searchUrl, { headers: { 'User-Agent': 'TokuBot/1.0' } });
    const data = await res.json();
    const hits = data.query?.search || [];
    if (hits.length === 0) {
      console.warn(`[MISS] No file found for ${item.id} with query "${item.search}" in ${item.wiki}`);
      return null;
    }

    const title = hits[0].title;
    const infoUrl = `https://${item.wiki}.fandom.com/api.php?action=query&titles=${encodeURIComponent(title)}&prop=imageinfo&iiprop=url&format=json`;
    const infoRes = await fetch(infoUrl, { headers: { 'User-Agent': 'TokuBot/1.0' } });
    const infoData = await infoRes.json();
    const pages = infoData.query?.pages;
    const p = Object.values(pages)[0];
    const url = p?.imageinfo?.[0]?.url;
    console.log(`[FOUND] ${item.id} -> ${title} -> ${url?.slice(0, 80)}...`);
    return url;
  } catch (err) {
    console.error(`[ERROR] ${item.id}:`, err.message);
    return null;
  }
}

async function run() {
  const results = {};
  for (const item of queries) {
    const url = await findPosterUrl(item);
    if (url) results[item.id] = url;
  }
  fs.writeFileSync(path.resolve(__dirname, 'found_posters.json'), JSON.stringify(results, null, 2));
  console.log('Saved found_posters.json with count:', Object.keys(results).length);
}

run();
