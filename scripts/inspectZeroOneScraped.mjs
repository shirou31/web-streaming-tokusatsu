import fs from 'fs';

const raw = JSON.parse(fs.readFileSync('./src/data/scrapedTokusatsu.json', 'utf8'));
const zeroOneEps = raw.episodes.filter(e => e.id?.includes('zero-one') || e.seriesTitle?.toLowerCase().includes('zero-one') || e.title?.toLowerCase().includes('zero-one'));
console.log('Total zero-one episodes in scrapedTokusatsu.json:', zeroOneEps.length);

zeroOneEps.slice(0, 10).forEach(e => {
  console.log({
    id: e.id,
    title: e.title,
    seriesTitle: e.seriesTitle,
    sourceUrl: e.sourceUrl,
    servers: e.servers?.map(s => ({ name: s.name, embedUrl: s.embedUrl, directUrl: s.directUrl }))
  });
});
