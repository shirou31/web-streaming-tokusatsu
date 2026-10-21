import fs from 'fs';

const filePath = 'src/data/canonicalData.js';
let content = fs.readFileSync(filePath, 'utf8');

const slugBackdrops = {
  'shin-ultraman': '/posters/backdrop_shin_ultraman.png',
  'kamen-rider-gavv': '/posters/backdrop_kamen_rider_gavv.png',
  'bakuage-sentai-boonboomger': '/posters/backdrop_boonboomger.jpg',
  'ultraman-arc': '/posters/backdrop_ultraman_arc.jpg',
  'kamen-rider-geats': '/posters/backdrop_kamen_rider_geats.png',
  'ohsama-sentai-king-ohger': '/posters/backdrop_king_ohger.jpg',
  'shin-kamen-rider': '/posters/backdrop_shin_kamen_rider.png'
};

let count = 0;
for (const [slug, backdrop] of Object.entries(slugBackdrops)) {
  // Find block with "slug": "xyz"
  const regex = new RegExp(`("slug":\\s*"${slug}"[\\s\\S]*?"backdrop_url":\\s*")[^"]+(")`, 'g');
  if (regex.test(content)) {
    content = content.replace(regex, `$1${backdrop}$2`);
    console.log(`Updated backdrop for ${slug} -> ${backdrop}`);
    count++;
  } else {
    console.warn(`Could not match backdrop pattern for slug: ${slug}`);
  }
}

fs.writeFileSync(filePath, content, 'utf8');
console.log(`Successfully updated ${count} productions!`);
