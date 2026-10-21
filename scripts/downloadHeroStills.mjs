import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const postersDir = path.resolve(__dirname, '../public/posters');

async function downloadFile(url, filename) {
  const destPath = path.join(postersDir, filename);
  console.log(`Downloading ${filename} from: ${url}`);
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    }
  });
  if (!res.ok) {
    throw new Error(`Failed to download: HTTP ${res.status}`);
  }
  const buffer = Buffer.from(await res.arrayBuffer());
  fs.writeFileSync(destPath, buffer);
  console.log(`✓ Saved ${filename} (${(buffer.length / 1024).toFixed(1)} KB)`);
}

async function run() {
  // 1. Shin Ultraman: Real Movie Still Cut (Spacium Beam / Rising Ultraman)
  // Let's download Shin-Ultraman-Type-A-Ripia-Spacium-Beam.png or ShinUltramanPunchGabora.jpg
  await downloadFile(
    'https://static.wikia.nocookie.net/ultra/images/4/4d/Shin-Ultraman-Type-A-Ripia-Spacium-Beam.png/revision/latest',
    'backdrop_shin_ultraman.png'
  );

  // Also download alternative Shin Ultraman movie still (Punch Gabora)
  await downloadFile(
    'https://static.wikia.nocookie.net/ultra/images/0/00/ShinUltramanPunchGabora.jpg/revision/latest',
    'backdrop_shin_ultraman_punch.jpg'
  );

  // 2. Kamen Rider Gavv: Real Episode Still Cut (1920x1080)
  await downloadFile(
    'https://static.wikia.nocookie.net/kamenrider/images/b/b2/Gavv_1.png/revision/latest',
    'backdrop_kamen_rider_gavv.png'
  );

  // 3. Bakuage Sentai Boonboomger: Real Episode Transformation / Action Still Cut (1920x1080)
  await downloadFile(
    'https://static.wikia.nocookie.net/powerrangers/images/1/1d/Boonboom_Changer_Transformation.png/revision/latest',
    'backdrop_boonboomger.png'
  );

  console.log('All hero stills downloaded successfully!');
}

run().catch(console.error);
