// scripts/autoUpdateEpisodes.mjs
// Automated Updater for Tokusatsu Episodes & Movies
// Scans RSS Feeds & Category Pages, Extracts Streams & Updates scrapedTokusatsu.json

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const outputPath = path.resolve(__dirname, '../src/data/scrapedTokusatsu.json');
const canonicalPath = path.resolve(__dirname, '../src/data/canonicalData.js');

import { runSawidagoBot } from './sawidagoBot.mjs';

const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

// Feed URLs to scan for fresh releases
const RSS_FEEDS = [
  { url: 'https://www.tokusatsuindo.com/feed/', label: 'Main Fresh Releases' },
  { url: 'https://www.tokusatsuindo.com/category/kamen-rider/feed/', label: 'Kamen Rider Category' },
  { url: 'https://www.tokusatsuindo.com/category/super-sentai/feed/', label: 'Super Sentai Category' },
  { url: 'https://www.tokusatsuindo.com/category/ultraman/feed/', label: 'Ultraman Category' }
];

async function fetchWithRetry(url, retries = 2) {
  for (let i = 0; i <= retries; i++) {
    try {
      const res = await fetch(url, {
        headers: {
          'User-Agent': USER_AGENT,
          'Referer': 'https://www.tokusatsuindo.com/'
        },
        signal: AbortSignal.timeout(12000)
      });
      if (res.ok) return await res.text();
    } catch (e) {
      if (i === retries) return null;
      await new Promise(r => setTimeout(r, 1000));
    }
  }
  return null;
}

// Extract streaming embed and Google Drive payloads
async function extractEpisodeStreams(pageUrl) {
  try {
    const html = await fetchWithRetry(pageUrl);
    if (!html) return null;

    // 1. Data embeds (base64)
    const embedMatches = [...html.matchAll(/data-embed="([^"]+)"/gi)];
    const streams = [];

    for (let i = 0; i < embedMatches.length; i++) {
      const rawB64 = embedMatches[i][1];
      const decoded = Buffer.from(rawB64, 'base64').toString('utf-8');
      const srcMatch = decoded.match(/src="([^"]+)"/i);
      if (srcMatch) {
        streams.push({
          serverName: `Server ${i + 1} (Direct Embed)`,
          embedUrl: srcMatch[1],
          type: 'embed'
        });
      }
    }

    // 2. Resolve internal player & Google Drive links if embedUrl is player.tokusatsuindo.com
    let driveUrl1 = null;
    let driveUrl2 = null;
    let posterUrl = null;

    if (streams.length > 0 && streams[0].embedUrl.includes('player.tokusatsuindo.com')) {
      try {
        const playerHtml = await fetchWithRetry(streams[0].embedUrl);
        if (playerHtml) {
          const frameMatch = playerHtml.match(/id="internalPlayerFrame"[^>]+data-src="([^"]+)"/i);
          if (frameMatch) {
            const rawSrc = frameMatch[1].replace(/&amp;/g, '&');
            const tokenMatch = rawSrc.match(/\?t=([A-Za-z0-9_-]+)/);
            if (tokenMatch) {
              const decodedPayload = Buffer.from(tokenMatch[1], 'base64').toString('utf-8');
              const payload = JSON.parse(decodedPayload);
              if (payload.google_drive_url_1) driveUrl1 = payload.google_drive_url_1;
              if (payload.google_drive_url_2) driveUrl2 = payload.google_drive_url_2;
              if (payload.poster_url) posterUrl = payload.poster_url;
            }
          }
        }
      } catch {
        // silently continue
      }
    }

    // Add Google Drive servers if resolved
    if (driveUrl1) {
      streams.push({
        serverName: 'Server Google Drive 1 (Fast HD)',
        embedUrl: driveUrl1.replace('/view?usp=drivesdk', '/preview'),
        directUrl: driveUrl1,
        type: 'gdrive'
      });
    }
    if (driveUrl2) {
      streams.push({
        serverName: 'Server Google Drive 2 (Mirror HD)',
        embedUrl: driveUrl2.replace('/view?usp=drivesdk', '/preview'),
        directUrl: driveUrl2,
        type: 'gdrive'
      });
    }

    return {
      streams,
      driveUrl1,
      driveUrl2,
      posterUrl
    };
  } catch (err) {
    console.error(`[extractEpisodeStreams] Gagal mengekstrak ${pageUrl}:`, err.message);
    return null;
  }
}

// Detect franchise based on title & categories
function detectFranchise(title, categories = []) {
  const text = `${title} ${categories.join(' ')}`.toLowerCase();
  if (text.includes('kamen rider') || text.includes('rider')) return 'Kamen Rider';
  if (text.includes('sentai') || text.includes('boonboomger') || text.includes('gozyuger') || text.includes('ranger')) return 'Super Sentai';
  if (text.includes('ultraman') || text.includes('ultra ')) return 'Ultraman';
  if (text.includes('garo')) return 'Garo & Kaiju';
  return 'Metal Hero & Others';
}

// Detect era based on title & series name
function detectEra(title) {
  const t = title.toLowerCase();
  // Reiwa series
  if (
    t.includes('my-th') || t.includes('myth') || t.includes('gavv') ||
    t.includes('gotchard') || t.includes('geats') || t.includes('revice') ||
    t.includes('saber') || t.includes('zero-one') || t.includes('boonboomger') ||
    t.includes('king-ohger') || t.includes('donbrothers') || t.includes('zenkaiger') ||
    t.includes('kiramager') || t.includes('arc') || t.includes('blazar') ||
    t.includes('decker') || t.includes('trigger') || t.includes('z') || t.includes('taiga') ||
    t.includes('omegahorn') || t.includes('gozyuger')
  ) {
    return 'Reiwa';
  }

  // Showa series
  if (
    t.includes('ichigo') || t.includes('v3') || t.includes('x') ||
    t.includes('amazon') || t.includes('stronger') || t.includes('skyrider') ||
    t.includes('super-1') || t.includes('black') || t.includes('black rx') ||
    t.includes('goranger') || t.includes('jakq') || t.includes('battle fever')
  ) {
    return 'Showa';
  }

  // Default to Heisei for others
  return 'Heisei';
}

// Parse series title and episode number
function parseEpisodeInfo(rawTitle) {
  let clean = rawTitle.replace(/<!\[CDATA\[(.*?)\]\]>/g, '$1').trim();
  clean = clean.replace(/\s*sub\s*indonesia/i, '').trim();

  let episodeNumber = 1;
  const epMatch = clean.match(/(?:episode|ep\.?|ep)\s*([0-9]+)/i);
  if (epMatch) {
    episodeNumber = parseInt(epMatch[1], 10);
  }

  const isMovie = /movie|special|the movie|gekijouban/i.test(clean);
  const contentType = isMovie ? 'movie' : 'tv_series';

  // Series title extraction
  let seriesTitle = clean;
  if (epMatch) {
    seriesTitle = clean.substring(0, epMatch.index).trim();
  }

  // Clean common suffixes
  seriesTitle = seriesTitle.replace(/\s*-\s*$/, '').trim();

  // Normalized production ID
  const prodSlug = seriesTitle.toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
  const productionId = `prod_${prodSlug}`;

  // Standardize clean title format
  const cleanTitle = isMovie ? `${clean} Sub Indo` : `${seriesTitle} Episode ${episodeNumber} Sub Indo`;

  return {
    cleanTitle,
    seriesTitle: seriesTitle || 'Tokusatsu Series',
    episodeNumber,
    contentType,
    productionId
  };
}

// Resolve poster
function resolvePoster(seriesTitle, productionId, detectedPoster) {
  const t = (seriesTitle || '').toLowerCase();
  const p = (productionId || '').toLowerCase();

  if (t.includes('my-th') || p.includes('myth')) return '/posters/poster_kamen_rider_myth.png';
  if (t.includes('gavv') || p.includes('gavv')) return 'https://image.tmdb.org/t/p/w600_and_h900_bestv2/3iHHmX7txgjptGkdqY3Q6V0r0Fk.jpg';
  if (t.includes('boonboomger') || p.includes('boonboomger')) return 'https://image.tmdb.org/t/p/w600_and_h900_bestv2/yNabCz32woEXgrcvRS8ASH55s3G.jpg';
  if (t.includes('arc') || p.includes('arc')) return 'https://image.tmdb.org/t/p/w600_and_h900_bestv2/twq2EahjRaUB6B8wjf7ddrCmLhJ.jpg';
  if (t.includes('kuuga')) return 'https://image.tmdb.org/t/p/w600_and_h900_bestv2/3J5rPQtETWuEyY9BPr2Lt7FGg7x.jpg';
  if (t.includes('agito')) return 'https://www.tokusatsuindo.com/wp-content/uploads/2018/02/agito23.png';
  if (t.includes('garo')) return 'https://www.tokusatsuindo.com/wp-content/uploads/2026/05/taiga.jpg';

  if (detectedPoster && !detectedPoster.includes('bg4.jpg') && !detectedPoster.includes('home45')) {
    return detectedPoster;
  }

  return 'https://image.tmdb.org/t/p/w600_and_h900_bestv2/3iHHmX7txgjptGkdqY3Q6V0r0Fk.jpg';
}

// Parse RSS XML text into items
function parseRssItems(xmlText) {
  const items = [];
  const itemMatches = [...xmlText.matchAll(/<item>([\s\S]*?)<\/item>/gi)];

  for (const match of itemMatches) {
    const block = match[1];
    const titleMatch = block.match(/<title>([\s\S]*?)<\/title>/i);
    const linkMatch = block.match(/<link>([\s\S]*?)<\/link>/i);
    const dateMatch = block.match(/<pubDate>([\s\S]*?)<\/pubDate>/i);
    const catMatches = [...block.matchAll(/<category>([\s\S]*?)<\/category>/gi)].map(c => c[1].replace(/<!\[CDATA\[(.*?)\]\]>/g, '$1').trim());

    if (titleMatch && linkMatch) {
      let title = titleMatch[1].replace(/<!\[CDATA\[(.*?)\]\]>/g, '$1').trim();
      let link = linkMatch[1].replace(/<!\[CDATA\[(.*?)\]\]>/g, '$1').trim();
      let pubDate = dateMatch ? dateMatch[1].trim() : new Date().toISOString();

      items.push({
        title,
        link,
        pubDate,
        categories: catMatches
      });
    }
  }

  return items;
}

export async function runAutoUpdate() {
  console.log('🔄 ========================================================');
  console.log('🤖 TOKUFLIX AUTO-UPDATER: Pengecekan Episode Baru Tokusatsu');
  console.log('   Timestamp:', new Date().toISOString());
  console.log('========================================================\n');

  // 1. Jalankan SawidagoFansub Bot terlebih dahulu
  try {
    console.log('🌱 Menjalankan SawidagoFansub Automation Bot...');
    await runSawidagoBot();
  } catch (err) {
    console.warn('⚠️ SawidagoFansub Bot warning:', err.message);
  }

  if (!fs.existsSync(outputPath)) {
    console.error('❌ File scrapedTokusatsu.json tidak ditemukan di:', outputPath);
    process.exit(1);
  }

  const scrapedData = JSON.parse(fs.readFileSync(outputPath, 'utf-8'));
  const existingEpisodes = scrapedData.episodes || [];
  
  // Set existing links and IDs for fast deduplication
  const existingUrls = new Set(existingEpisodes.map(e => (e.sourceUrl || '').toLowerCase().replace(/\/+$/, '')));
  const existingTitles = new Set(existingEpisodes.map(e => (e.title || '').toLowerCase().trim()));

  console.log(`📊 Total episode saat ini di database: ${existingEpisodes.length}`);

  // Scan all feeds
  const discoveredItems = [];
  const seenFeedUrls = new Set();

  for (const feed of RSS_FEEDS) {
    console.log(`📡 Membaca feed: ${feed.label}...`);
    const xml = await fetchWithRetry(feed.url);
    if (!xml) {
      console.log(`   ⚠️ Gagal mengambil ${feed.url}, lewati.`);
      continue;
    }

    const items = parseRssItems(xml);
    console.log(`   ✅ Ditemukan ${items.length} rilis pada feed.`);

    for (const item of items) {
      const cleanUrl = item.link.toLowerCase().replace(/\/+$/, '');
      if (!seenFeedUrls.has(cleanUrl)) {
        seenFeedUrls.add(cleanUrl);
        discoveredItems.push(item);
      }
    }
  }

  console.log(`\n🔍 Total kandidat rilis unik yang ditemukan: ${discoveredItems.length}`);

  // Filter items that are actually new (cek link, judul, serta seri & nomor episode agar anti duplikasi)
  const newReleases = discoveredItems.filter(item => {
    const cleanUrl = item.link.toLowerCase().replace(/\/+$/, '');
    const cleanTitle = `${item.title} Sub Indo`.toLowerCase();
    if (existingUrls.has(cleanUrl) || existingTitles.has(cleanTitle)) {
      return false;
    }
    const parsed = parseEpisodeInfo(item.title);
    const alreadyInDb = existingEpisodes.some(e => {
      const s1 = (e.seriesTitle || e.title || '').toLowerCase().replace(/[^a-z0-9]/g, '');
      const s2 = (parsed.seriesTitle || '').toLowerCase().replace(/[^a-z0-9]/g, '');
      const sameSeries = s1.includes(s2) || s2.includes(s1);
      const sameEp = Number(e.episodeNumber) === Number(parsed.episodeNumber);
      return (sameSeries && sameEp);
    });
    return !alreadyInDb;
  });

  if (newReleases.length === 0) {
    console.log('\n✨ Database sudah up-to-date! Tidak ada episode baru yang perlu ditambahkan.');
    return { added: 0, total: existingEpisodes.length };
  }

  console.log(`\n🆕 Ditemukan ${newReleases.length} EPISODE BARU yang belum ada di database:`);
  newReleases.forEach((item, idx) => {
    console.log(`   ${idx + 1}. ${item.title} (${item.link})`);
  });

  console.log('\n⚡ Memulai proses ekstraksi streaming server & metadata...');

  const newlyAddedEpisodes = [];

  for (const item of newReleases) {
    console.log(`\n📥 Mengekstrak: ${item.title}...`);
    const streamData = await extractEpisodeStreams(item.link);

    if (!streamData || streamData.streams.length === 0) {
      console.log(`   ⚠️ Tidak ditemukan server streaming yang valid, lewati.`);
      continue;
    }

    const franchise = detectFranchise(item.title, item.categories);
    const era = detectEra(item.title);
    const parsed = parseEpisodeInfo(item.title);
    const poster = resolvePoster(parsed.seriesTitle, parsed.productionId, streamData.posterUrl);

    const episodeObj = {
      id: `scraped_${parsed.productionId}_ep${parsed.episodeNumber}_${Date.now().toString(36)}`,
      productionId: parsed.productionId,
      franchise,
      seriesTitle: parsed.seriesTitle,
      title: parsed.cleanTitle,
      episodeNumber: parsed.episodeNumber,
      seasonNumber: 1,
      era,
      contentType: parsed.contentType,
      sourceUrl: item.link,
      fansub: 'TokusatsuIndo / Sawidago Network',
      language: 'Indonesian (Sub Indo)',
      quality: '1440p QHD / 1080p FHD',
      thumbnail: poster,
      driveDownloadUrl1: streamData.driveUrl1,
      driveDownloadUrl2: streamData.driveUrl2,
      servers: streamData.streams.map((s, idx) => ({
        id: `srv_${idx + 1}`,
        name: s.serverName,
        embedUrl: s.embedUrl,
        directUrl: s.directUrl || null,
        type: s.type,
        status: 'online'
      })),
      skipMarkers: {
        skipIntro: { start: 90, end: 180 },
        skipOutro: { start: 1350, end: 1440 }
      },
      scrapedAt: new Date().toISOString()
    };

    newlyAddedEpisodes.push(episodeObj);
    console.log(`   ✅ Berhasil diekstrak! ${episodeObj.servers.length} server streaming online.`);
  }

  if (newlyAddedEpisodes.length > 0) {
    // Sisipkan episode baru di urutan paling awal (agar tampil di "Baru Rilis" utama)
    scrapedData.episodes = [...newlyAddedEpisodes, ...existingEpisodes];
    scrapedData.metadata.totalEpisodes = scrapedData.episodes.length;
    scrapedData.metadata.lastUpdated = new Date().toISOString();
    scrapedData.metadata.status = 'success';

    fs.writeFileSync(outputPath, JSON.stringify(scrapedData, null, 2), 'utf-8');
    console.log(`\n🎉 SUKSES! Sebanyak ${newlyAddedEpisodes.length} episode baru berhasil disimpan ke database.`);
    console.log(`📁 Lokasi file: ${outputPath}`);
    console.log(`📊 Total episode sekarang: ${scrapedData.episodes.length}`);
  } else {
    console.log('\n⚠️ Tidak ada episode baru yang berhasil diekstrak.');
  }

  return {
    added: newlyAddedEpisodes.length,
    total: scrapedData.episodes.length
  };
}

// Run directly if invoked via CLI
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  runAutoUpdate()
    .then((res) => {
      console.log(`\n[AutoUpdate] Selesai dengan status: ${res.added} episode baru ditambahkan.`);
      process.exit(0);
    })
    .catch((err) => {
      console.error('\n❌ [AutoUpdate] Terjadi kesalahan fatal:', err);
      process.exit(1);
    });
}
