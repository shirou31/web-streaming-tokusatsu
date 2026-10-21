import fs from 'fs';

const jsonPath = './src/data/scrapedTokusatsu.json';
const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

// 1. Tiga Dyna Movie
const tigaDyna = data.episodes.find(e => e.id === 'scraped_prod_ultra_tiga_dyna_movie_ep1');
if (tigaDyna) {
  tigaDyna.productionId = 'ultraman-tiga-dyna-movie';
  tigaDyna.seriesTitle = 'Ultraman Tiga & Ultraman Dyna: Warriors of the Star of Light';
  tigaDyna.title = 'Ultraman Tiga & Ultraman Dyna: Warriors of the Star of Light (Movie)';
  tigaDyna.episodeNumber = 1;
  console.log('✅ Updated Tiga & Dyna Movie in scrapedTokusatsu.json');
}

// 2. Tiga Gaiden (Peradaban Kuno)
const tigaGaiden = data.episodes.find(e => e.id === 'scraped_prod_ultra_tiga_gaiden_ep2' || e.id === 'scraped_prod_ultra_tiga_gaiden_ep1');
if (tigaGaiden) {
  tigaGaiden.id = 'scraped_prod_ultra_tiga_gaiden_ep1';
  tigaGaiden.productionId = 'ultraman-tiga-gaiden';
  tigaGaiden.seriesTitle = 'Ultraman Tiga Gaiden: Revival of the Ancient Giant';
  tigaGaiden.title = 'Ultraman Tiga Gaiden: Revival of the Ancient Giant (Peradaban Kuno Movie)';
  tigaGaiden.episodeNumber = 1;
  console.log('✅ Updated Tiga Gaiden (Peradaban Kuno) in scrapedTokusatsu.json');
}

fs.writeFileSync(jsonPath, JSON.stringify(data, null, 2), 'utf8');
console.log('Saved to scrapedTokusatsu.json!');
