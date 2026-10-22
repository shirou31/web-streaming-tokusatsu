import fs from 'fs';

// 1. Load canonicalData.js
console.log('Loading canonicalData.js...');
const canonicalRaw = fs.readFileSync('./src/data/canonicalData.js', 'utf8');

// Parse the DB object by cutting out "export const DB = " and the trailing ";"
const prefix = 'export const DB = ';
const jsonStr = canonicalRaw.slice(canonicalRaw.indexOf(prefix) + prefix.length).replace(/;\s*$/, '');
const DB = JSON.parse(jsonStr);

// 2. Load scrapedTokusatsu.json
console.log('Loading scrapedTokusatsu.json...');
const scraped = JSON.parse(fs.readFileSync('./src/data/scrapedTokusatsu.json', 'utf8'));

// Helper to update canonical video_source
function updateCanonicalSource(epId, s1DriveId, s2DriveId = null) {
  const sources = DB.video_sources.filter(v => v.episode_id === epId);
  sources.forEach(v => {
    const isS2 = v.id.includes('_s2_') || (v.server_name && v.server_name.includes('Server 2'));
    const targetDriveId = (isS2 && s2DriveId) ? s2DriveId : s1DriveId;
    v.origin_url = `https://drive.google.com/file/d/${targetDriveId}/preview`;
    v.direct_url = `https://drive.google.com/file/d/${targetDriveId}/view?usp=sharing&res=${v.quality}`;
    v.source_type = 'gdrive';
    v.is_active = true;
  });
}

// Helper to update scraped episode
function updateScrapedEp(epId, s1DriveId, s2DriveId = null, thumbnail = null) {
  let ep = scraped.episodes.find(e => e.id === epId);
  if (!ep) return;
  if (thumbnail) ep.thumbnail = thumbnail;
  ep.driveDownloadUrl1 = `https://drive.google.com/file/d/${s1DriveId}/view?usp=sharing`;
  ep.driveDownloadUrl2 = s2DriveId ? `https://drive.google.com/file/d/${s2DriveId}/view?usp=sharing` : null;
  ep.servers = [
    {
      id: `srv_real_1_${epId}`,
      name: 'Server 1 (Google Drive Direct HD / 1440p)',
      embedUrl: `https://drive.google.com/file/d/${s1DriveId}/preview`,
      directUrl: `https://drive.google.com/file/d/${s1DriveId}/view?usp=sharing`,
      type: 'gdrive',
      status: 'online'
    }
  ];
  if (s2DriveId) {
    ep.servers.push({
      id: `srv_real_2_${epId}`,
      name: 'Server 2 (Mirror Direct HD / 1440p)',
      embedUrl: `https://drive.google.com/file/d/${s2DriveId}/preview`,
      directUrl: `https://drive.google.com/file/d/${s2DriveId}/view?usp=sharing`,
      type: 'gdrive',
      status: 'online'
    });
  }
}

// A. FIX ZERO-ONE (Episodes 1-6)
console.log('Fixing Kamen Rider Zero-One Episodes 1-6...');
const z1Links = [
  { ep: 1, s1: '1m8KbosDORM5Zovygs8NFbc40O5a-bQCz', s2: '1kdfFWFMd5aEfDeB1B8SjvwDB3JxwmmR4', canId: '0192a3f0-2222-7000-0101-0001' },
  { ep: 2, s1: '1m8KbosDORM5Zovygs8NFbc40O5a-bQCz', s2: '1Nu4Bt2lGBuECmYn5loIxpR34kfReR6rC', canId: '0192a3f0-2222-7000-0101-0002' },
  { ep: 3, s1: '1139u03EwjzQd5xmfxs8E-Shj_4oSHGpA', s2: '1Cb4M2-X-W6Z8sdwZC7VENVWSXwlstlSQ', canId: '0192a3f0-2222-7000-0101-0003' },
  { ep: 4, s1: '1GmjEyC0QXvlkEsnk2-0-MuWyWoYsV1EQ', s2: '1MGFHiH4moOUFy1LP8MoSQ_KobIDMX0KI', canId: '0192a3f0-2222-7000-0101-0004' },
  { ep: 5, s1: '1_fZDjTDvcBe9-mSVfVAH6KDfIxn3DFsr', s2: '1jDlHWBwMtKZzmgMQLrjr37d6-3TnMgE2', canId: '0192a3f0-2222-7000-0101-0005' },
  { ep: 6, s1: '1hgbT7L8x2v3n5HcXV9AOaw-GBp80pkZL', s2: '1KfuoMs2xuHvhQ7iOq4YKWWI-h349r1O-', canId: '0192a3f0-2222-7000-0101-0006' }
];

z1Links.forEach(z => {
  // Update canonical
  const canEp = DB.episodes.find(e => e.id === z.canId);
  if (canEp) {
    canEp.thumbnail_url = '/posters/poster_kamen-rider-zero-one.jpg';
  }
  updateCanonicalSource(z.canId, z.s1, z.s2);

  // Update scraped
  updateScrapedEp(`scraped_kamen-rider-zero-one_ep${z.ep}`, z.s1, z.s2, '/posters/poster_kamen-rider-zero-one.jpg');
});

// B. FIX GEATS EP 1
console.log('Fixing Kamen Rider Geats Ep 1...');
updateCanonicalSource('0192a3f0-2222-7000-8000-000000000001', '14hhHLCKVPyBRu4SQP0gdZeh6DEWlZuU6');
updateScrapedEp('scraped_kamen-rider-geats_ep1', '14hhHLCKVPyBRu4SQP0gdZeh6DEWlZuU6');

// C. FIX SABER (Episodes 1-6)
console.log('Fixing Kamen Rider Saber Episodes 1-6...');
const saberLinks = [
  { ep: 1, s1: '1KqKzrSgkQacAZ-XiuFSY1MKqRK4_wtz6', canId: '0192a3f0-2222-7000-0105-0001' },
  { ep: 2, s1: '1V4DhxZFixTewt7o9dX7TLB9Kkwo2SFUE', canId: '0192a3f0-2222-7000-0105-0002' },
  { ep: 3, s1: '1tRA9fjsIQdO7xdxWhat6e5KVwQUhDMHW', canId: '0192a3f0-2222-7000-0105-0003' },
  { ep: 4, s1: '1wGgrLJBdK24l2zJycCZlFY74nP8WvoJs', canId: '0192a3f0-2222-7000-0105-0004' },
  { ep: 5, s1: '107BMgGmu-45QNJKbhepG0s49JOHUjcvw', canId: '0192a3f0-2222-7000-0105-0005' },
  { ep: 6, s1: '15uwLrxQ4g3JbGiZ0b8jnvypNF2jIzgnd', canId: '0192a3f0-2222-7000-0105-0006' }
];
saberLinks.forEach(s => {
  const canEp = DB.episodes.find(e => e.id === s.canId);
  if (canEp) canEp.thumbnail_url = '/posters/poster_kamen-rider-saber.jpg';
  updateCanonicalSource(s.canId, s.s1);
  updateScrapedEp(`scraped_kamen-rider-saber_ep${s.ep}`, s.s1, null, '/posters/poster_kamen-rider-saber.jpg');
});

// D. FIX REVICE (Episodes 1-6)
console.log('Fixing Kamen Rider Revice Episodes 1-6...');
const reviceLinks = [
  { ep: 1, s1: '1hBZOdEyKNERN9v4AA00DHn312TqorwZS', canId: '0192a3f0-2222-7000-0109-0001' },
  { ep: 2, s1: '17NcMT68hde0eZW3wX7FZsXGUI9ddE0-B', canId: '0192a3f0-2222-7000-0109-0002' },
  { ep: 3, s1: '1wiFvm6ZllZrq8lBVTg3Z0AC88aFRrgxY', canId: '0192a3f0-2222-7000-0109-0003' },
  { ep: 4, s1: '1qW3jirdqcEFzMcnaFd9TnRG-N4gMTVq7', canId: '0192a3f0-2222-7000-0109-0004' },
  { ep: 5, s1: '1bxRwcMXNqYLIiznwxVAgiNN40q7sn84P', canId: '0192a3f0-2222-7000-0109-0005' },
  { ep: 6, s1: '1jsR180L4ZJ1_F7kCI5KFUy2PNJ0MOvfJ', canId: '0192a3f0-2222-7000-0109-0006' }
];
reviceLinks.forEach(r => {
  const canEp = DB.episodes.find(e => e.id === r.canId);
  if (canEp) canEp.thumbnail_url = '/posters/poster_kamen-rider-revice.jpg';
  updateCanonicalSource(r.canId, r.s1);
  updateScrapedEp(`scraped_kamen-rider-revice_ep${r.ep}`, r.s1, null, '/posters/poster_kamen-rider-revice.jpg');
});

// E. FIX GOTCHARD (Episodes 1-6)
console.log('Fixing Kamen Rider Gotchard Episodes 1-6...');
const gotchardLinks = [
  { ep: 1, s1: '1VBaGs7b63kBw5J4pR-ca40ZRkICb_ko9', canId: '0192a3f0-2222-7000-0113-0001' },
  { ep: 2, s1: '1EELtk14g34EGQfqHi3Ziq2WRHu3bOy7q', canId: '0192a3f0-2222-7000-0113-0002' },
  { ep: 3, s1: '1QPLv0YL_Nh2bHYVV4esr4-UkSC4yMJJ7', canId: '0192a3f0-2222-7000-0113-0003' },
  { ep: 4, s1: '1BZrVRVQIeZdCGR2yL9J27i8Kqaj89lZO', canId: '0192a3f0-2222-7000-0113-0004' },
  { ep: 5, s1: '1Iz4PWAh5y0EZ-uPhxi2JlfRRm13Z8ckj', canId: '0192a3f0-2222-7000-0113-0005' },
  { ep: 6, s1: '1d8eJODQKkeh6o66kXOQUIuJh340t0xfu', canId: '0192a3f0-2222-7000-0113-0006' }
];
gotchardLinks.forEach(g => {
  const canEp = DB.episodes.find(e => e.id === g.canId);
  if (canEp) canEp.thumbnail_url = '/posters/poster_kamen-rider-gotchard.jpg';
  updateCanonicalSource(g.canId, g.s1);
  updateScrapedEp(`scraped_kamen-rider-gotchard_ep${g.ep}`, g.s1, null, '/posters/poster_kamen-rider-gotchard.jpg');
});

// F. FIX RYUKI EP 1, DEN-O EP 1, OOO EP 1, GOKAIGER EP 1
console.log('Fixing Ryuki, Den-O, OOO, Gokaiger Episode 1...');
updateCanonicalSource('prod_kr_ryuki_ep1', '1IKayg2x89yhUYHLxJjs1yJ5hq13pgNNP');
updateScrapedEp('scraped_prod_kr_ryuki_ep1', '1IKayg2x89yhUYHLxJjs1yJ5hq13pgNNP');

updateCanonicalSource('prod_kr_den_o_ep1', '1--YwUOd0BdAmzBoVbg9BU7N2Em4H58Su');
updateScrapedEp('scraped_prod_kr_den_o_ep1', '1--YwUOd0BdAmzBoVbg9BU7N2Em4H58Su');

updateCanonicalSource('prod_kr_ooo_ep1', '13Ytpt9kX1Tv7BAs_qYWKnnJfYQd9ybN1');
updateScrapedEp('scraped_prod_kr_ooo_ep1', '13Ytpt9kX1Tv7BAs_qYWKnnJfYQd9ybN1');

updateCanonicalSource('prod_ss_gokaiger_ep1', '1Bf3xSrHmZ0YTQYsYVGgppzVkIjGC63mn');
updateScrapedEp('scraped_prod_ss_gokaiger_ep1', '1Bf3xSrHmZ0YTQYsYVGgppzVkIjGC63mn');

// G. FIX ULTRAMAN Z, TRIGGER, DECKER, BLACK SUN, KIRAMAGER, ZENKAIGER (Ep 1)
console.log('Fixing Ultraman & Sentai Series Ep 1...');
updateCanonicalSource('0192a3f0-2222-7000-0121-0001', '1CexaQ6dgn1RuoQeXOSfLKWOr1X0emppm'); // Ultraman Z
updateCanonicalSource('0192a3f0-2222-7000-0122-0001', '1y7MKbupK0mILtBlUvHhfmJ9o3P91vXil'); // Trigger
updateCanonicalSource('0192a3f0-2222-7000-0124-0001', '1jjGTmEBl72c7P0EjsZCXhGmpkbRhm-lF'); // Decker
updateCanonicalSource('0192a3f0-2222-7000-0116-0001', '1PqTB5qcErBnT7JJOXUprnroTSNaFJt9z'); // Black Sun
updateCanonicalSource('0192a3f0-2222-7000-0117-0001', '1eDdu40s99YZYfBXLuRkH7Gi_gHqrLiN4'); // Kiramager
updateCanonicalSource('0192a3f0-2222-7000-0118-0001', '1Q-F_csKk7w1Ymi-a1PQzVYAJAN1XMQcW'); // Zenkaiger

// H. CLEANUP FALLBACK THUMBNAILS FOR ALL CANONICAL EPISODES (Replace broken TMDB with series poster)
console.log('Cleaning up broken TMDB episode thumbnails in canonical DB...');
DB.episodes.forEach(e => {
  if (e.thumbnail_url && e.thumbnail_url.includes('mXnF4R6U8y1cWJg6J45eB8k1HhT.jpg')) {
    const prod = DB.productions.find(p => p.id === e.production_id);
    e.thumbnail_url = prod?.poster_url || '/favicon.png';
  }
});

// Save canonicalData.js
const newCanonicalContent = `// Database Kanonikal TokuFlix dengan Metadata Tokusatsu Lengkap\nexport const DB = ${JSON.stringify(DB, null, 2)};\n`;
fs.writeFileSync('./src/data/canonicalData.js', newCanonicalContent, 'utf8');
console.log('Successfully written updated canonicalData.js!');

// Save scrapedTokusatsu.json
fs.writeFileSync('./src/data/scrapedTokusatsu.json', JSON.stringify(scraped, null, 2), 'utf8');
console.log('Successfully written updated scrapedTokusatsu.json!');
