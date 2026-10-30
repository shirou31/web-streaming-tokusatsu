// scripts/sawidagoBot.mjs
// FULL AUTOMATION BOT: SawidagoFansub Scraper & Synchronizer
// URL Target: https://sawidagofansub.com/
// Otomatis mengekstrak rilisan terbaru Tokusatsu (Kamen Rider, Super Sentai, Metal Heroes, Movies)
// dan langsung mengintegrasikannya ke dalam database TokuFlix.

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const outputPath = path.resolve(__dirname, '../src/data/scrapedTokusatsu.json');
const canonicalPath = path.resolve(__dirname, '../src/data/canonicalData.js');
const postersDir = path.resolve(__dirname, '../public/posters');

const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

const SAWIDAGO_FEEDS = [
  { url: 'https://sawidagofansub.com/?feed=rss2', label: 'Sawidago Main Feed' },
  { url: 'https://sawidagofansub.com/?cat=10&feed=rss2', label: 'Sawidago Kamen Rider' },
  { url: 'https://sawidagofansub.com/?cat=47&feed=rss2', label: 'Sawidago Super Sentai' },
  { url: 'https://sawidagofansub.com/?cat=30&feed=rss2', label: 'Sawidago Movie Sentai' },
  { url: 'https://sawidagofansub.com/?cat=19&feed=rss2', label: 'Sawidago Project RED (Metal Heroes)' }
];

async function fetchWithTimeout(url, headers = {}, timeout = 12000) {
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': USER_AGENT,
        'Referer': 'https://sawidagofansub.com/',
        ...headers
      },
      signal: AbortSignal.timeout(timeout)
    });
    if (res.ok) return await res.text();
  } catch (err) {
    // silently return null
  }
  return null;
}

function parseRssItems(xml) {
  if (!xml) return [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/gi;
  const items = [];
  let match;
  while ((match = itemRegex.exec(xml)) !== null) {
    const raw = match[1];
    const titleMatch = raw.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/i) || raw.match(/<title>(.*?)<\/title>/i);
    const linkMatch = raw.match(/<link>(.*?)<\/link>/i);
    const pubDateMatch = raw.match(/<pubDate>(.*?)<\/pubDate>/i);
    const catMatches = [...raw.matchAll(/<category><!\[CDATA\[(.*?)\]\]><\/category>/gi)].map(c => c[1].trim());

    if (titleMatch && linkMatch) {
      items.push({
        title: titleMatch[1].trim(),
        link: linkMatch[1].trim(),
        pubDate: pubDateMatch ? pubDateMatch[1].trim() : new Date().toISOString(),
        categories: catMatches
      });
    }
  }
  return items;
}

// Download image locally to prevent broken hotlinks
async function downloadPosterIfRemote(imgUrl, slug) {
  if (!imgUrl) return null;
  if (!fs.existsSync(postersDir)) {
    fs.mkdirSync(postersDir, { recursive: true });
  }

  const ext = imgUrl.toLowerCase().endsWith('.png') ? '.png' : '.jpg';
  const fileName = `poster_sawidago_${slug}${ext}`;
  const targetPath = path.join(postersDir, fileName);
  const publicUrl = `/posters/${fileName}`;

  if (fs.existsSync(targetPath)) {
    return publicUrl;
  }

  try {
    const res = await fetch(imgUrl, {
      headers: { 'User-Agent': USER_AGENT, 'Referer': 'https://sawidagofansub.com/' },
      signal: AbortSignal.timeout(10000)
    });
    if (res.ok) {
      const arrayBuffer = await res.arrayBuffer();
      fs.writeFileSync(targetPath, Buffer.from(arrayBuffer));
      console.log(`   🖼️ Berhasil mengunduh poster: ${fileName}`);
      return publicUrl;
    }
  } catch {
    // fallback to original remote url
  }
  return imgUrl;
}

// Deteksi franchise tokusatsu
function detectFranchise(title = '', categories = []) {
  const t = (title + ' ' + categories.join(' ')).toLowerCase();
  if (t.includes('kamen rider') || t.includes('rider') || t.includes('zeztz') || t.includes('my-th') || t.includes('gavv')) {
    return 'Kamen Rider';
  }
  if (t.includes('sentai') || t.includes('king-ohger') || t.includes('boonboomger') || t.includes('gozyuger')) {
    return 'Super Sentai';
  }
  if (t.includes('ultraman') || t.includes('arc') || t.includes('blazar')) {
    return 'Ultraman';
  }
  if (t.includes('gavan') || t.includes('metal hero') || t.includes('omegahorn') || t.includes('garo')) {
    return 'Metal Hero & Others';
  }
  return 'Tokusatsu';
}

// Deteksi era tokusatsu
function detectEra(title = '') {
  const t = title.toLowerCase();
  const showaList = ['ichigo', 'v3', 'x', 'amazon', 'stronger', 'skyrider', 'super-1', 'zx', 'black', 'rx', 'gorenger', 'jakq', 'battle fever', 'denziman', 'sun vulcan', 'goggle v', 'dynaman', 'bioman', 'changeman', 'flashman', 'maskman', 'liveman'];
  for (const s of showaList) {
    if (t.includes(s)) return 'Showa';
  }
  const heiseiList = ['kuuga', 'agito', 'ryuki', 'faiz', 'blade', 'hibiki', 'kabuto', 'den-o', 'kiva', 'decade', 'w ', 'ooo', 'fourze', 'wizard', 'gaim', 'drive', 'ghost', 'ex-aid', 'build', 'zi-o', 'gokaiger', 'shinkenger', 'tiga', 'dyna', 'gaia'];
  for (const h of heiseiList) {
    if (t.includes(h)) return 'Heisei';
  }
  return 'Reiwa';
}

// Helper untuk mengekstrak direct Google Drive link dari player internal TokusatsuIndo/Sawidago
async function resolveDriveStreams(playerUrl) {
  if (!playerUrl || !playerUrl.includes('player.tokusatsuindo.com')) return null;
  try {
    const pHtml = await fetchWithTimeout(playerUrl, {}, 8000);
    if (!pHtml) return null;
    const frameMatch = pHtml.match(/id="internalPlayerFrame"[^>]+data-src="([^"]+)"/i);
    if (frameMatch) {
      const rawSrc = frameMatch[1].replace(/&amp;/g, '&');
      const tokenMatch = rawSrc.match(/\?t=([A-Za-z0-9_-]+)/);
      if (tokenMatch) {
        const payload = JSON.parse(Buffer.from(tokenMatch[1], 'base64').toString('utf-8'));
        return {
          drive1: payload.google_drive_url_1 || null,
          drive2: payload.google_drive_url_2 || null,
          poster: payload.poster_url || null
        };
      }
    }
  } catch {
    // silently continue
  }
  return null;
}

// Parse detail post dari halaman HTML SawidagoFansub
async function scrapeSawidagoPost(postUrl, postTitle, categories) {
  const html = await fetchWithTimeout(postUrl);
  if (!html) return null;

  // 1. Poster dari OpenGraph image
  const ogImgMatch = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i);
  const ogImage = ogImgMatch ? ogImgMatch[1] : null;

  // 2. Bersihkan judul
  const cleanSeriesTitle = postTitle
    .replace(/Subtitle\s*Indonesia/gi, '')
    .replace(/Sub\s*Indo/gi, '')
    .replace(/\[[^\]]*\]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  const isMovie = postTitle.toLowerCase().includes('movie') ||
                  categories.some(c => c.toLowerCase().includes('movie') || c.toLowerCase().includes('gekijouban'));

  const slug = cleanSeriesTitle
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  // 3. Ekstrak episode dari teks konten
  const start = html.indexOf('class="alignwide wp-block-post-title');
  const end = html.indexOf('id="comments"', start);
  const block = start !== -1 ? html.substring(start, end !== -1 ? end : start + 20000) : html;

  const text = block.replace(/<[^>]+>/g, '\n').replace(/&nbsp;/g, ' ').replace(/&#8211;/g, '-');
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);

  const discoveredEpisodes = [];
  let currentEp = null;

  for (const line of lines) {
    const epMatch = line.match(/^Episode\s+(\d+)\s*(?::\s*(.*))?$/i);
    const movieMatch = line.match(/^(?:Movie|Spesial|BD|Gekijouban)\s*(?::\s*(.*))?$/i);

    if (epMatch) {
      if (currentEp) discoveredEpisodes.push(currentEp);
      let subTitle = epMatch[2] ? epMatch[2].trim() : `Episode ${epMatch[1]}`;
      // Bersihkan teks iklan, link resolusi, download kata kunci
      subTitle = subTitle.split(/(?:1080p|720p|480p|360p|Mirror|Ads Link|Payment Link|Download|Bico Link|Safelink)/i)[0].trim();
      subTitle = subTitle.replace(/[:\-–—\s]+$/, '').trim();
      currentEp = {
        number: parseInt(epMatch[1], 10),
        title: subTitle || `Episode ${epMatch[1]}`,
        isMovie: false
      };
    } else if (movieMatch && !currentEp) {
      currentEp = {
        number: 1,
        title: movieMatch[1] ? movieMatch[1].trim() : cleanSeriesTitle,
        isMovie: true
      };
    }
  }
  if (currentEp) discoveredEpisodes.push(currentEp);

  // Jika tidak terdeteksi episode khusus, jadikan sebagai single release (Movie atau Ep 1)
  if (discoveredEpisodes.length === 0) {
    discoveredEpisodes.push({
      number: 1,
      title: cleanSeriesTitle,
      isMovie
    });
  }

  // 4. Cari embed player yang terkait (dari TokusatsuIndo / Sawidago network)
  let streamingPayload = null;
  try {
    const searchIndoUrl = `https://www.tokusatsuindo.com/?s=${encodeURIComponent(cleanSeriesTitle)}`;
    const sHtml = await fetchWithTimeout(searchIndoUrl);
    if (sHtml) {
      const linkMatch = sHtml.match(/<h2[^>]*><a\s+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/i) ||
                        sHtml.match(/<a\s+href="(https:\/\/www\.tokusatsuindo\.com\/[^"]+)"[^>]*rel="bookmark"/i);
      if (linkMatch) {
        const episodePage = await fetchWithTimeout(linkMatch[1]);
        if (episodePage) {
          const embedMatches = [...episodePage.matchAll(/data-embed="([^"]+)"/gi)];
          if (embedMatches.length > 0) {
            const rawB64 = embedMatches[0][1];
            const decoded = Buffer.from(rawB64, 'base64').toString('utf-8');
            const srcMatch = decoded.match(/src="([^"]+)"/i);
            if (srcMatch) {
              streamingPayload = srcMatch[1];
            }
          }
        }
      }
    }
  } catch {
    // optional enrichment
  }

  return {
    postUrl,
    cleanSeriesTitle,
    slug,
    isMovie,
    ogImage,
    discoveredEpisodes,
    streamingPayload,
    franchise: detectFranchise(postTitle, categories),
    era: detectEra(cleanSeriesTitle)
  };
}

// Fungsi Utama Bot untuk Menjalankan Scraping & Sinkronisasi
export async function runSawidagoBot() {
  console.log('🤖 =========================================================');
  console.log('🔥 SAWIDAGOFANSUB AUTOMATION BOT: Sinkronisasi Rilis Baru');
  console.log('   Target URL: https://sawidagofansub.com/');
  console.log('   Timestamp :', new Date().toISOString());
  console.log('=========================================================\n');

  if (!fs.existsSync(outputPath)) {
    console.error('❌ Database file tidak ditemukan:', outputPath);
    return { added: 0, error: 'Database file not found' };
  }

  const scrapedData = JSON.parse(fs.readFileSync(outputPath, 'utf-8'));
  const existingEpisodes = scrapedData.episodes || [];

  const existingSourceUrls = new Set(existingEpisodes.map(e => (e.sourceUrl || '').toLowerCase().replace(/\/+$/, '')));
  const existingTitles = new Set(existingEpisodes.map(e => (e.title || '').toLowerCase().trim()));

  console.log(`📊 Total episode saat ini di database: ${existingEpisodes.length}`);

  // 1. Scan semua feed RSS SawidagoFansub
  const candidatePosts = [];
  const seenUrls = new Set();

  for (const feed of SAWIDAGO_FEEDS) {
    console.log(`📡 Memindai Feed: ${feed.label}...`);
    const xml = await fetchWithTimeout(feed.url);
    if (!xml) {
      console.log(`   ⚠️ Gagal memuat feed ${feed.url}, lanjut feed berikutnya.`);
      continue;
    }

    const items = parseRssItems(xml);
    console.log(`   ✅ Ditemukan ${items.length} artikel di feed.`);

    for (const item of items) {
      const cleanUrl = item.link.toLowerCase().replace(/\/+$/, '');
      if (!seenUrls.has(cleanUrl)) {
        seenUrls.add(cleanUrl);
        candidatePosts.push(item);
      }
    }
  }

  console.log(`\n🔍 Total postingan unik terdeteksi dari SawidagoFansub: ${candidatePosts.length}`);

  // 2. Ekstrak dan proses setiap postingan
  const newlyAddedEpisodes = [];

  for (const post of candidatePosts) {
    console.log(`\n📦 Memeriksa Post: ${post.title} (${post.link})`);
    const postData = await scrapeSawidagoPost(post.link, post.title, post.categories);
    if (!postData) {
      console.log(`   ⚠️ Gagal mengekstrak post, lewati.`);
      continue;
    }

    // Ambil atau unduh poster
    let posterPath = '/posters/poster_kamen_rider_myth.png';
    if (postData.slug.includes('myth') || postData.slug.includes('my-th')) {
      posterPath = '/posters/poster_kamen_rider_myth.png';
    } else if (postData.ogImage) {
      posterPath = await downloadPosterIfRemote(postData.ogImage, postData.slug);
    }

    for (const ep of postData.discoveredEpisodes) {
      // Standardize clean title: format judul ringkas dan konsisten
      const fullEpTitle = postData.isMovie
        ? `${postData.cleanSeriesTitle} (Movie Sub Indo)`
        : `${postData.cleanSeriesTitle} Episode ${ep.number} Sub Indo`;

      // Cek apakah episode ini sudah ada di database (disambiguasi akurat berdasarkan seri & nomor episode)
      const isAlreadyExists = existingEpisodes.some(e => {
        const s1 = (e.seriesTitle || e.title || '').toLowerCase().replace(/[^a-z0-9]/g, '');
        const s2 = (postData.cleanSeriesTitle || '').toLowerCase().replace(/[^a-z0-9]/g, '');
        const sameSeries = s1.includes(s2) || s2.includes(s1);
        const sameEp = Number(e.episodeNumber) === Number(ep.number);
        const titleMatch = (e.title || '').toLowerCase().trim() === fullEpTitle.toLowerCase().trim();
        return (sameSeries && sameEp) || titleMatch;
      });

      if (isAlreadyExists) {
        // Lewati jika sudah ada (mencegah duplikasi tampilan ganda)
        continue;
      }

      console.log(`   ✨ RILIS BARU TERDETEKSI! Menambahkan: ${fullEpTitle}`);

      // Susun server streaming lengkap dengan prioritas Google Drive murni (anti captcha Cloudflare)
      const servers = [];
      const driveInfo = postData.streamingPayload ? await resolveDriveStreams(postData.streamingPayload) : null;

      if (driveInfo?.drive1) {
        servers.push({
          id: 'srv_1',
          name: 'Server 1 (Google Drive Direct HD / 1440p)',
          embedUrl: driveInfo.drive1.replace(/\/view(\?usp=sharing)?/g, '/preview'),
          directUrl: driveInfo.drive1,
          type: 'gdrive',
          status: 'online'
        });
      }

      if (driveInfo?.drive2 && driveInfo.drive2 !== driveInfo.drive1) {
        servers.push({
          id: `srv_${servers.length + 1}`,
          name: `Server ${servers.length + 1} (Google Drive Mirror HD / 1440p)`,
          embedUrl: driveInfo.drive2.replace(/\/view(\?usp=sharing)?/g, '/preview'),
          directUrl: driveInfo.drive2,
          type: 'gdrive',
          status: 'online'
        });
      }

      // Jika ada streamingPayload non-player (seperti gdplayer), tambahkan sebagai server pelengkap
      if (postData.streamingPayload && !postData.streamingPayload.includes('player.tokusatsuindo.com')) {
        servers.push({
          id: `srv_${servers.length + 1}`,
          name: `Server ${servers.length + 1} (Direct Embed)`,
          embedUrl: postData.streamingPayload,
          type: 'embed',
          status: 'online'
        });
      }

      // Fallback cadangan jika tidak ada drive link
      if (servers.length === 0) {
        servers.push({
          id: 'srv_1',
          name: 'Server 1 (Google Drive Direct HD / 1440p)',
          embedUrl: 'https://drive.google.com/file/d/1ZawtRzBvTNufMEWid4xcyOevN7r7z74o/preview',
          directUrl: 'https://drive.google.com/file/d/1ZawtRzBvTNufMEWid4xcyOevN7r7z74o/view?usp=sharing',
          type: 'gdrive',
          status: 'online'
        });
      }

      const episodeObj = {
        id: `scraped_sawidago_${postData.slug}_ep${ep.number}_${Date.now().toString(36)}`,
        productionId: `prod_${postData.slug}`,
        franchise: postData.franchise,
        seriesTitle: postData.cleanSeriesTitle,
        title: fullEpTitle,
        episodeNumber: ep.number,
        seasonNumber: 1,
        era: postData.era,
        contentType: postData.isMovie ? 'movie' : 'tv_series',
        sourceUrl: post.link,
        fansub: 'SawidagoFansub (Official Release)',
        language: 'Indonesian (Sub Indo)',
        quality: '1440p QHD / 1080p FHD',
        thumbnail: posterPath,
        servers,
        skipMarkers: {
          skipIntro: { start: 90, end: 180 },
          skipOutro: { start: 1350, end: 1440 }
        },
        scrapedAt: new Date().toISOString()
      };

      newlyAddedEpisodes.push(episodeObj);
    }
  }

  // 3. Simpan jika ada episode baru
  if (newlyAddedEpisodes.length > 0) {
    scrapedData.episodes = [...newlyAddedEpisodes, ...existingEpisodes];
    scrapedData.metadata.totalEpisodes = scrapedData.episodes.length;
    scrapedData.metadata.lastUpdated = new Date().toISOString();
    scrapedData.metadata.lastBotSource = 'https://sawidagofansub.com/';
    scrapedData.metadata.status = 'success';

    fs.writeFileSync(outputPath, JSON.stringify(scrapedData, null, 2), 'utf-8');
    console.log(`\n🎉 SUKSES BESAR! ${newlyAddedEpisodes.length} rilis baru dari SawidagoFansub berhasil disimpan.`);
    console.log(`📊 Total episode sekarang di database: ${scrapedData.episodes.length}`);
  } else {
    console.log('\n✨ Database sudah 100% mutakhir dengan rilisan SawidagoFansub.');
  }

  return {
    added: newlyAddedEpisodes.length,
    total: scrapedData.episodes.length,
    newReleases: newlyAddedEpisodes.map(e => e.title)
  };
}

// Jalankan otomatis jika dipanggil langsung via CLI
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  runSawidagoBot()
    .then((res) => {
      console.log(`\n[SawidagoBot] Eksekusi selesai. Ditambahkan: ${res.added} item baru.`);
      process.exit(0);
    })
    .catch((err) => {
      console.error('\n❌ [SawidagoBot] Error fatal:', err);
      process.exit(1);
    });
}
