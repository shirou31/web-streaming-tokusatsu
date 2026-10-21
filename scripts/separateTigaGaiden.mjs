import fs from 'fs';

const jsonPath = './src/data/scrapedTokusatsu.json';
const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

// 1. Remove any old or corrupted Tiga items
data.episodes = data.episodes.filter(e => {
  if (e.id === 'scraped_prod_ultra_tiga_gaiden_ep2') return false;
  if (e.id === 'scraped_ultraman-tiga_ep1' || e.id === 'scraped_ultraman-tiga_ep2') return false;
  return true;
});

// 2. Add real TV Series Episode 1
data.episodes.push({
  id: 'scraped_ultraman-tiga_ep1',
  productionId: 'ultraman-tiga',
  franchise: 'Ultraman',
  seriesTitle: 'Ultraman Tiga',
  title: 'Ultraman Tiga Episode 1: Warisan Cahaya Sub Indo',
  episodeNumber: 1,
  seasonNumber: 1,
  era: 'Heisei',
  contentType: 'tv_series',
  sourceUrl: 'https://www.tokusatsuindo.com/ultraman-tiga-episode-1-sub-indonesia/',
  fansub: 'TokusatsuIndo / Sawidago Network',
  language: 'Indonesian (Sub Indo)',
  quality: '1080p FHD / 720p HD',
  thumbnail: '/posters/poster_ultraman_tiga.jpg',
  servers: [
    {
      id: 'srv_real_tiga_1',
      name: 'Server 1 (Direct Embed HD)',
      embedUrl: 'https://player.tokusatsuindo.com/x/?t=eyJ2aWRlb19pZCI6MjB9.6b9b3e4f395abc9214a0e0bb8b579e5911b44b24b99c44d5eddc9f2e9a861f95',
      directUrl: null,
      type: 'embed',
      status: 'online'
    }
  ],
  scrapedAt: new Date().toISOString()
});

// 3. Add real TV Series Episode 2
data.episodes.push({
  id: 'scraped_ultraman-tiga_ep2',
  productionId: 'ultraman-tiga',
  franchise: 'Ultraman',
  seriesTitle: 'Ultraman Tiga',
  title: 'Ultraman Tiga Episode 2: Cahaya Menembus Batu Sub Indo',
  episodeNumber: 2,
  seasonNumber: 1,
  era: 'Heisei',
  contentType: 'tv_series',
  sourceUrl: 'https://www.tokusatsuindo.com/ultraman-tiga-episode-2-sub-indonesia/',
  fansub: 'TokusatsuIndo / Sawidago Network',
  language: 'Indonesian (Sub Indo)',
  quality: '1080p FHD / 720p HD',
  thumbnail: '/posters/poster_ultraman_tiga.jpg',
  servers: [
    {
      id: 'srv_real_tiga_2',
      name: 'Server 1 (Direct Embed HD)',
      embedUrl: 'https://player.tokusatsuindo.com/x/?t=eyJ2aWRlb19pZCI6NTc5OH0.4e56f733d78cfbeadb84156dea84414bad8007664d63b88cfcef176d2277eeb4',
      directUrl: null,
      type: 'embed',
      status: 'online'
    }
  ],
  scrapedAt: new Date().toISOString()
});

// 4. Ensure Tiga Gaiden Movie is clean and standalone (Ep 1 of Gaiden Movie)
let gaiden = data.episodes.find(e => e.id === 'scraped_prod_ultra_tiga_gaiden_ep1');
if (!gaiden) {
  gaiden = {
    id: 'scraped_prod_ultra_tiga_gaiden_ep1',
    productionId: 'ultraman-tiga-gaiden',
    franchise: 'Ultraman',
    seriesTitle: 'Ultraman Tiga Gaiden: Revival of the Ancient Giant',
    title: 'Ultraman Tiga Gaiden: Revival of the Ancient Giant (Peradaban Kuno Movie)',
    episodeNumber: 1,
    seasonNumber: 1,
    era: 'Heisei',
    contentType: 'movie',
    sourceUrl: 'https://www.tokusatsuindo.com/ultraman-tiga-gaiden-revival-of-the-ancient-giant-sub-indonesia/',
    fansub: 'TokusatsuIndo / Sawidago Network',
    language: 'Indonesian (Sub Indo)',
    quality: '1440p QHD / 1080p FHD',
    thumbnail: '/posters/poster_ultraman_tiga.jpg',
    servers: [
      {
        id: 'srv_1',
        name: 'Server 1 (Direct Embed)',
        embedUrl: 'https://player.tokusatsuindo.com/x/?t=eyJ2aWRlb19pZCI6NzYzfQ.bbc1e8b10fd72bb269682593048bb7dbc68ca6fbb2c723d3173f0d7ccaa0fa9b',
        directUrl: null,
        type: 'embed',
        status: 'online'
      },
      {
        id: 'srv_2',
        name: 'Server Google Drive 1 (Fast HD)',
        embedUrl: 'https://drive.google.com/file/d/1waH4yY4Pc8SFZ9ra9Aa1VRwMke1FVilM/preview',
        directUrl: 'https://drive.google.com/file/d/1waH4yY4Pc8SFZ9ra9Aa1VRwMke1FVilM/view?usp=sharing',
        type: 'gdrive',
        status: 'online'
      }
    ],
    scrapedAt: new Date().toISOString()
  };
  data.episodes.push(gaiden);
} else {
  gaiden.productionId = 'ultraman-tiga-gaiden';
  gaiden.seriesTitle = 'Ultraman Tiga Gaiden: Revival of the Ancient Giant';
  gaiden.title = 'Ultraman Tiga Gaiden: Revival of the Ancient Giant (Peradaban Kuno Movie)';
  gaiden.episodeNumber = 1;
  gaiden.contentType = 'movie';
}

fs.writeFileSync(jsonPath, JSON.stringify(data, null, 2), 'utf8');
console.log('✅ Successfully separated TV Ep 1 & 2 from Gaiden Movie!');
