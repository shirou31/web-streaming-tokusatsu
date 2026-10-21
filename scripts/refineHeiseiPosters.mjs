import fs from 'fs';

const pages = [
  { id: 'kamen-rider-ryuki', wiki: 'kamenrider', page: 'Kamen Rider Ryuki' },
  { id: 'kamen-rider-ryuki-episode-final', wiki: 'kamenrider', page: 'Kamen Rider Ryuki: Episode Final' },
  { id: 'kamen-rider-ryuki-13-riders', wiki: 'kamenrider', page: 'Kamen Rider Ryuki Special: 13 RIDERS' },
  { id: 'rider-time-kamen-rider-ryuki', wiki: 'kamenrider', page: 'Rider Time: Kamen Rider Ryuki' },

  { id: 'kamen-rider-den-o', wiki: 'kamenrider', page: 'Kamen Rider Den-O' },
  { id: 'kamen-rider-den-o-im-born', wiki: 'kamenrider', page: "Kamen Rider Den-O: I'm Born!" },
  { id: 'kamen-rider-den-o-kiva-climax-deka', wiki: 'kamenrider', page: 'Kamen Rider Den-O & Kiva: Climax Deka' },
  { id: 'saraba-kamen-rider-den-o-final-countdown', wiki: 'kamenrider', page: 'Saraba Kamen Rider Den-O: Final Countdown' },
  { id: 'cho-kamen-rider-den-o-decade-onigashima', wiki: 'kamenrider', page: 'Cho Kamen Rider Den-O & Decade Neo Generations: The Onigashima Warship' },
  { id: 'kamen-rider-cho-den-o-trilogy-episode-red', wiki: 'kamenrider', page: 'Kamen Rider × Kamen Rider × Kamen Rider The Movie: Cho-Den-O Trilogy: Episode Red - Zero no Star Twinkle' },
  { id: 'kamen-rider-cho-den-o-trilogy-episode-blue', wiki: 'kamenrider', page: 'Kamen Rider × Kamen Rider × Kamen Rider The Movie: Cho-Den-O Trilogy: Episode Blue - The Dispatched Imagin is Newtral' },
  { id: 'kamen-rider-cho-den-o-trilogy-episode-yellow', wiki: 'kamenrider', page: 'Kamen Rider × Kamen Rider × Kamen Rider The Movie: Cho-Den-O Trilogy: Episode Yellow - Treasure DE End Pirates' },

  { id: 'kamen-rider-ooo', wiki: 'kamenrider', page: 'Kamen Rider OOO' },
  { id: 'kamen-rider-ooo-w-featuring-skull-movie-war-core', wiki: 'kamenrider', page: 'Kamen Rider × Kamen Rider OOO & W Featuring Skull: Movie War Core' },
  { id: 'kamen-rider-ooo-wonderful-the-shogun-and-21-core-medals', wiki: 'kamenrider', page: 'Kamen Rider OOO Wonderful: The Shogun and the 21 Core Medals' },
  { id: 'kamen-rider-fourze-ooo-movie-war-mega-max', wiki: 'kamenrider', page: 'Kamen Rider × Kamen Rider Fourze & OOO: Movie War Mega Max' },
  { id: 'kamen-rider-ooo-10th-core-medal-of-resurrection', wiki: 'kamenrider', page: 'Kamen Rider OOO 10th: Core Medal of Resurrection' },

  { id: 'kaizoku-sentai-gokaiger', wiki: 'powerrangers', page: 'Kaizoku Sentai Gokaiger' },
  { id: 'gokaiger-goseiger-super-sentai-199-hero-great-battle', wiki: 'powerrangers', page: 'Gokaiger Goseiger Super Sentai 199 Hero Great Battle' },
  { id: 'kaizoku-sentai-gokaiger-the-flying-ghost-ship', wiki: 'powerrangers', page: 'Kaizoku Sentai Gokaiger the Movie: The Flying Ghost Ship' },
  { id: 'kaizoku-sentai-gokaiger-vs-space-sheriff-gavan', wiki: 'powerrangers', page: 'Kaizoku Sentai Gokaiger vs. Space Sheriff Gavan: The Movie' },
  { id: 'kamen-rider-x-super-sentai-super-hero-taisen', wiki: 'powerrangers', page: 'Kamen Rider × Super Sentai: Super Hero Taisen' },
  { id: 'tokumei-sentai-go-busters-vs-kaizoku-sentai-gokaiger', wiki: 'powerrangers', page: 'Tokumei Sentai Go-Busters vs. Kaizoku Sentai Gokaiger: The Movie' }
];

async function getPagePoster(item) {
  try {
    const url = `https://${item.wiki}.fandom.com/api.php?action=parse&page=${encodeURIComponent(item.page)}&prop=images&format=json`;
    const res = await fetch(url, { headers: { 'User-Agent': 'TokuBot/1.0' } });
    const data = await res.json();
    const images = data.parse?.images || [];
    
    // Pick the best poster image
    const posterFile = images.find(img => /poster/i.test(img)) || images.find(img => !/logo|icon|box|title/i.test(img));
    if (posterFile) {
      const infoUrl = `https://${item.wiki}.fandom.com/api.php?action=query&titles=File:${encodeURIComponent(posterFile)}&prop=imageinfo&iiprop=url&format=json`;
      const infoRes = await fetch(infoUrl, { headers: { 'User-Agent': 'TokuBot/1.0' } });
      const infoData = await infoRes.json();
      const p = Object.values(infoData.query?.pages || {})[0];
      const fileUrl = p?.imageinfo?.[0]?.url;
      console.log(`[OK] ${item.id} -> ${posterFile} -> ${fileUrl?.slice(0, 75)}...`);
      return { id: item.id, url: fileUrl };
    }
    console.warn(`[NO_POSTER] ${item.id} in page ${item.page}`);
  } catch (err) {
    console.error(`[ERR] ${item.id}:`, err.message);
  }
  return null;
}

async function run() {
  const map = {};
  for (const p of pages) {
    const res = await getPagePoster(p);
    if (res?.url) map[res.id] = res.url;
  }
  fs.writeFileSync('scripts/precise_heisei_posters.json', JSON.stringify(map, null, 2));
  console.log(`Saved precise_heisei_posters.json with ${Object.keys(map).length} posters!`);
}

run();
