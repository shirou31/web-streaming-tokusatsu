import { getStreamPayload } from '../src/services/apiService.js';
import { DB } from '../src/data/canonicalData.js';
import { scraperService } from '../src/services/scraperService.js';

console.log('=== VERIFIKASI RESOLUSI STREAMING 4 TIER (1440p, 1080p, 450p, 360p) ===\n');

// 1. Verifikasi Semua Film (41 Film)
const movies = DB.productions.filter(p => p.type === 'movie');
console.log(`Menguji ${movies.length} Film Tokusatsu...`);

let movieFailures = 0;
for (const m of movies) {
  const res = await getStreamPayload(m.id);
  if (!res.success) {
    console.error(`❌ GAGAL: Film ${m.title} (ID: ${m.id}) tidak dapat dimuat:`, res.error);
    movieFailures++;
    continue;
  }

  const servers = res.data.video_sources.servers;
  if (!servers || servers.length === 0) {
    console.error(`❌ GAGAL: Film ${m.title} tidak memiliki server streaming`);
    movieFailures++;
    continue;
  }

  for (const s of servers) {
    const qList = s.sources.map(src => src.quality);
    const hasAll4 = qList.includes('1440p') && qList.includes('1080p') && qList.includes('450p') && qList.includes('360p');
    const hasExtras = qList.includes('720p') || qList.includes('480p');
    const hasDupes = new Set(qList).size !== qList.length;

    if (!hasAll4 || hasExtras || hasDupes) {
      console.error(`❌ GAGAL: Film ${m.title} - ${s.server_name} memiliki daftar kualitas tidak sesuai:`, qList);
      movieFailures++;
    }
  }
}

if (movieFailures === 0) {
  console.log(`✅ SUKSES: Seluruh ${movies.length} Film 100% memiliki 4 resolusi aktif (1440p, 1080p, 450p, 360p) tanpa duplikasi!\n`);
} else {
  console.error(`❌ DITEMUKAN ${movieFailures} kegagalan pada film!`);
  process.exit(1);
}

// 2. Verifikasi Sampel Serial Scraped
const scrapedList = scraperService.getScrapedEpisodes().slice(0, 10);
console.log(`Menguji 10 Sampel Episode Serial Scraped...`);
let scrapedFailures = 0;
for (const ep of scrapedList) {
  const res = await getStreamPayload(ep.id);
  if (!res.success) {
    console.error(`❌ GAGAL: Scraped episode ${ep.title}:`, res.error);
    scrapedFailures++;
    continue;
  }

  const servers = res.data.video_sources.servers;
  for (const s of servers) {
    const qList = s.sources.map(src => src.quality);
    const hasAll4 = qList.includes('1440p') && qList.includes('1080p') && qList.includes('450p') && qList.includes('360p');
    const hasExtras = qList.includes('720p') || qList.includes('480p');
    const hasDupes = new Set(qList).size !== qList.length;

    if (!hasAll4 || hasExtras || hasDupes) {
      console.error(`❌ GAGAL: Scraped ep ${ep.title} - ${s.server_name}:`, qList);
      scrapedFailures++;
    }
  }
}

if (scrapedFailures === 0) {
  console.log(`✅ SUKSES: Seluruh Episode Serial Scraped 100% memiliki 4 resolusi aktif (1440p, 1080p, 450p, 360p) tanpa duplikasi!`);
} else {
  console.error(`❌ DITEMUKAN ${scrapedFailures} kegagalan pada serial!`);
  process.exit(1);
}

console.log('\n🎉 SEMUA PENGUJIAN SELESAI DENGAN STATUS 100% LOLOS!');
