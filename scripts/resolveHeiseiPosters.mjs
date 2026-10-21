import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const queries = [
  // Kamen Rider Ryuki
  { id: 'kamen-rider-ryuki', wiki: 'kamenrider', search: 'Ryuki Poster.jpg' },
  { id: 'kamen-rider-ryuki-episode-final', wiki: 'kamenrider', search: 'Episode Final poster' },
  { id: 'kamen-rider-ryuki-13-riders', wiki: 'kamenrider', search: '13 Riders poster' },
  { id: 'rider-time-kamen-rider-ryuki', wiki: 'kamenrider', search: 'Rider Time Ryuki poster' },

  // Kamen Rider Den-O
  { id: 'kamen-rider-den-o', wiki: 'kamenrider', search: 'Den-O Poster.jpg' },
  { id: 'kamen-rider-den-o-im-born', wiki: 'kamenrider', search: "I'm Born poster" },
  { id: 'kamen-rider-den-o-kiva-climax-deka', wiki: 'kamenrider', search: 'Climax Deka poster' },
  { id: 'saraba-kamen-rider-den-o-final-countdown', wiki: 'kamenrider', search: 'Final Countdown poster' },
  { id: 'cho-kamen-rider-den-o-decade-onigashima', wiki: 'kamenrider', search: 'Onigashima Warship poster' },
  { id: 'kamen-rider-cho-den-o-trilogy-episode-red', wiki: 'kamenrider', search: 'Episode Red poster' },
  { id: 'kamen-rider-cho-den-o-trilogy-episode-blue', wiki: 'kamenrider', search: 'Episode Blue poster' },
  { id: 'kamen-rider-cho-den-o-trilogy-episode-yellow', wiki: 'kamenrider', search: 'Episode Yellow poster' },

  // Kamen Rider OOO
  { id: 'kamen-rider-ooo', wiki: 'kamenrider', search: 'OOO Poster.jpg' },
  { id: 'kamen-rider-ooo-w-featuring-skull-movie-war-core', wiki: 'kamenrider', search: 'Movie War Core poster' },
  { id: 'kamen-rider-ooo-wonderful-the-shogun-and-21-core-medals', wiki: 'kamenrider', search: 'Wonderful The Shogun 21 Core Medals poster' },
  { id: 'kamen-rider-fourze-ooo-movie-war-mega-max', wiki: 'kamenrider', search: 'Movie War Mega Max poster' },
  { id: 'kamen-rider-ooo-10th-core-medal-of-resurrection', wiki: 'kamenrider', search: 'Core Medal of Resurrection poster' },

  // Kaizoku Sentai Gokaiger
  { id: 'kaizoku-sentai-gokaiger', wiki: 'powerrangers', search: 'Gokaiger Poster.jpg' },
  { id: 'gokaiger-goseiger-super-sentai-199-hero-great-battle', wiki: 'powerrangers', search: '199 Hero Great Battle poster' },
  { id: 'kaizoku-sentai-gokaiger-the-flying-ghost-ship', wiki: 'powerrangers', search: 'Flying Ghost Ship poster' },
  { id: 'kaizoku-sentai-gokaiger-vs-space-sheriff-gavan', wiki: 'powerrangers', search: 'Gokaiger vs Gavan poster' },
  { id: 'kamen-rider-x-super-sentai-super-hero-taisen', wiki: 'powerrangers', search: 'Super Hero Taisen poster' },
  { id: 'tokumei-sentai-go-busters-vs-kaizoku-sentai-gokaiger', wiki: 'powerrangers', search: 'Go-Busters vs Gokaiger poster' }
];

async function findPosterUrl(item) {
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
    return { id: item.id, title, url };
  } catch (err) {
    console.error(`[ERROR] ${item.id}:`, err.message);
    return null;
  }
}

async function run() {
  const results = {};
  for (const item of queries) {
    const res = await findPosterUrl(item);
    if (res?.url) results[res.id] = res.url;
  }
  fs.writeFileSync(path.resolve(__dirname, 'found_heisei_posters.json'), JSON.stringify(results, null, 2));
  console.log('Saved found_heisei_posters.json with count:', Object.keys(results).length);
}

run();
