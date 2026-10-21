import fs from 'fs';

const jsonPath = './src/data/scrapedTokusatsu.json';
const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

// 1. Gavv Ep 1
const gavvEp1 = data.episodes.find(e => e.id === 'scraped_kamen-rider-gavv_ep1');
if (gavvEp1) {
  gavvEp1.servers = [
    {
      id: 'srv_real_gavv_1',
      name: 'Server 1 (Direct Embed HD)',
      embedUrl: 'https://player.tokusatsuindo.com/x/?t=eyJ2aWRlb19pZCI6MzM0fQ.dc2ef6a2a690c0dd150d4946de2e8411da4b66ec5563ee0b918abae885ac3102',
      directUrl: null,
      type: 'embed',
      status: 'online'
    }
  ];
  gavvEp1.driveDownloadUrl1 = null;
  console.log('✅ Fixed Gavv Ep 1 server');
}

// 2. Boonboomger Ep 1
const boonEp1 = data.episodes.find(e => e.id === 'scraped_bakuage-sentai-boonboomger_ep1');
if (boonEp1) {
  boonEp1.servers = [
    {
      id: 'srv_real_boonboomger_1',
      name: 'Server 1 (Direct Embed HD)',
      embedUrl: 'https://player.tokusatsuindo.com/x/?t=eyJ2aWRlb19pZCI6NDQ4N30.af1103dcbf7de25cfc3e7ebd4d57365d0dc96ae131d3e660b5f1f320960e99a6',
      directUrl: null,
      type: 'embed',
      status: 'online'
    }
  ];
  boonEp1.driveDownloadUrl1 = null;
  console.log('✅ Fixed Boonboomger Ep 1 server');
}

// 3. Remove fake Google Drive links from servers across all episodes
let cleanedCount = 0;
data.episodes.forEach(e => {
  if (e.servers && Array.isArray(e.servers)) {
    const beforeLen = e.servers.length;
    e.servers = e.servers.filter(s => {
      const u = s.embedUrl || s.directUrl || '';
      return !u.includes('1xB4kfuHxVLt3AT0yt-I1COdypqHxJxl5') &&
             !u.includes('18U4M_preview') &&
             !u.includes('tokuflix_') &&
             !u.includes('preview_reiwa');
    });
    if (e.servers.length < beforeLen) {
      cleanedCount++;
    }
  }
  if (e.driveDownloadUrl1 && (e.driveDownloadUrl1.includes('1xB4kfu') || e.driveDownloadUrl1.includes('18U4M') || e.driveDownloadUrl1.includes('tokuflix_'))) {
    e.driveDownloadUrl1 = null;
  }
});
console.log(`✅ Cleaned dummy Google Drive links from ${cleanedCount} episodes!`);

fs.writeFileSync(jsonPath, JSON.stringify(data, null, 2), 'utf8');
console.log('Saved to scrapedTokusatsu.json!');
