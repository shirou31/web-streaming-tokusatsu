// scripts/scrapeTokusatsu.mjs
// Real Fansub Scraper for Tokuflix - Comprehensive Heisei to Reiwa (Series & Movies)
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const outputPath = path.resolve(__dirname, '../src/data/scrapedTokusatsu.json');

const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

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
      } catch (e) {
        // silently fallback
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
    console.error(`Error processing ${pageUrl}:`, err.message);
    return null;
  }
}

async function scrapeAll() {
  console.log('🚀 Memulai Tokusatsu Sub Indo Fansub Scraper: Heisei & Reiwa (Series & Movies)...');

  const targetEpisodes = [
    // ==========================================
    // 🌟 1. KAMEN RIDER MY-TH (REIWA - SERIAL)
    // Permintaan Utama User!
    // ==========================================
    {
      franchise: 'Kamen Rider',
      seriesTitle: 'Kamen Rider My-Th',
      episodeTitle: 'Kamen Rider My-Th Episode 1 Sub Indo',
      episodeNumber: 1,
      seasonNumber: 1,
      pageUrl: 'https://www.tokusatsuindo.com/kamen-rider-my-th-episode-1-sub-indonesia/',
      productionId: 'prod_kr_myth',
      seriesCover: 'https://www.tokusatsuindo.com/wp-content/uploads/2026/10/myte.png',
      era: 'Reiwa',
      contentType: 'tv_series'
    },
    {
      franchise: 'Kamen Rider',
      seriesTitle: 'Kamen Rider My-Th',
      episodeTitle: 'Kamen Rider My-Th Episode 2 Sub Indo',
      episodeNumber: 2,
      seasonNumber: 1,
      pageUrl: 'https://www.tokusatsuindo.com/kamen-rider-my-th-episode-2-sub-indonesia/',
      productionId: 'prod_kr_myth',
      seriesCover: 'https://www.tokusatsuindo.com/wp-content/uploads/2026/10/myte.png',
      era: 'Reiwa',
      contentType: 'tv_series'
    },
    {
      franchise: 'Kamen Rider',
      seriesTitle: 'Kamen Rider My-Th',
      episodeTitle: 'Kamen Rider My-Th Episode 3 Sub Indo',
      episodeNumber: 3,
      seasonNumber: 1,
      pageUrl: 'https://www.tokusatsuindo.com/kamen-rider-my-th-episode-3-sub-indonesia/',
      productionId: 'prod_kr_myth',
      seriesCover: 'https://www.tokusatsuindo.com/wp-content/uploads/2026/10/myte.png',
      era: 'Reiwa',
      contentType: 'tv_series'
    },
    {
      franchise: 'Kamen Rider',
      seriesTitle: 'Kamen Rider My-Th',
      episodeTitle: 'Kamen Rider My-Th Episode 4 Sub Indo',
      episodeNumber: 4,
      seasonNumber: 1,
      pageUrl: 'https://www.tokusatsuindo.com/kamen-rider-my-th-episode-4-sub-indonesia/',
      productionId: 'prod_kr_myth',
      seriesCover: 'https://www.tokusatsuindo.com/wp-content/uploads/2026/10/myte.png',
      era: 'Reiwa',
      contentType: 'tv_series'
    },
    {
      franchise: 'Kamen Rider',
      seriesTitle: 'Kamen Rider My-Th',
      episodeTitle: 'Kamen Rider My-Th Episode 5 Sub Indo',
      episodeNumber: 5,
      seasonNumber: 1,
      pageUrl: 'https://www.tokusatsuindo.com/kamen-rider-my-th-episode-5-sub-indonesia/',
      productionId: 'prod_kr_myth',
      seriesCover: 'https://www.tokusatsuindo.com/wp-content/uploads/2026/10/myte.png',
      era: 'Reiwa',
      contentType: 'tv_series'
    },
    {
      franchise: 'Kamen Rider',
      seriesTitle: 'Kamen Rider My-Th',
      episodeTitle: 'Kamen Rider My-Th Episode 6 Sub Indo',
      episodeNumber: 6,
      seasonNumber: 1,
      pageUrl: 'https://www.tokusatsuindo.com/kamen-rider-my-th-episode-6-sub-indonesia/',
      productionId: 'prod_kr_myth',
      seriesCover: 'https://www.tokusatsuindo.com/wp-content/uploads/2026/10/myte.png',
      era: 'Reiwa',
      contentType: 'tv_series'
    },

    // ==========================================
    // 🍬 2. KAMEN RIDER GAVV (REIWA - SERIAL & MOVIE)
    // ==========================================
    {
      franchise: 'Kamen Rider',
      seriesTitle: 'Kamen Rider Gavv',
      episodeTitle: 'Kamen Rider Gavv Episode 50 (Final)',
      episodeNumber: 50,
      seasonNumber: 1,
      pageUrl: 'https://www.tokusatsuindo.com/kamen-rider-gavv-episode-50-sub-indonesia-final/',
      productionId: 'prod_kr_gavv',
      seriesCover: 'https://image.tmdb.org/t/p/w600_and_h900_bestv2/3iHHmX7txgjptGkdqY3Q6V0r0Fk.jpg',
      era: 'Reiwa',
      contentType: 'tv_series'
    },
    {
      franchise: 'Kamen Rider',
      seriesTitle: 'Kamen Rider Gavv',
      episodeTitle: 'Kamen Rider Gavv Episode 49',
      episodeNumber: 49,
      seasonNumber: 1,
      pageUrl: 'https://www.tokusatsuindo.com/kamen-rider-gavv-episode-49-sub-indonesia/',
      productionId: 'prod_kr_gavv',
      seriesCover: 'https://www.tokusatsuindo.com/wp-content/uploads/2024/09/gavv.png',
      era: 'Reiwa',
      contentType: 'tv_series'
    },
    {
      franchise: 'Kamen Rider',
      seriesTitle: 'Kamen Rider Gavv',
      episodeTitle: 'Kamen Rider Gavv: The Candy House Invaders (Movie)',
      episodeNumber: 52,
      seasonNumber: 1,
      pageUrl: 'https://www.tokusatsuindo.com/kamen-rider-gavv-the-candy-house-invaders-sub-indonesia/',
      productionId: 'prod_kr_gavv_movie',
      seriesCover: 'https://image.tmdb.org/t/p/w600_and_h900_bestv2/3iHHmX7txgjptGkdqY3Q6V0r0Fk.jpg',
      era: 'Reiwa',
      contentType: 'movie'
    },
    {
      franchise: 'Kamen Rider',
      seriesTitle: 'Kamen Rider Gavv',
      episodeTitle: 'Kamen Rider Gavv: Guilty Parfait (Special)',
      episodeNumber: 51,
      seasonNumber: 1,
      pageUrl: 'https://www.tokusatsuindo.com/kamen-rider-gavv-guilty-parfait-sub-indonesia/',
      productionId: 'prod_kr_gavv_special',
      seriesCover: 'https://www.tokusatsuindo.com/wp-content/uploads/2024/09/gavv.png',
      era: 'Reiwa',
      contentType: 'movie'
    },

    // ==========================================
    // 🏎️ 3. SUPER SENTAI - BOONBOOMGER (REIWA - SERIAL & MOVIE)
    // ==========================================
    {
      franchise: 'Super Sentai',
      seriesTitle: 'Bakuage Sentai Boonboomger',
      episodeTitle: 'Bakuage Sentai Boonboomger Episode 1 Sub Indo',
      episodeNumber: 1,
      seasonNumber: 1,
      pageUrl: 'https://www.tokusatsuindo.com/bakuage-sentai-boonboomger-episode-1-sub-indonesia/',
      productionId: 'prod_ss_boonboomger',
      seriesCover: 'https://image.tmdb.org/t/p/w600_and_h900_bestv2/yNabCz32woEXgrcvRS8ASH55s3G.jpg',
      era: 'Reiwa',
      contentType: 'tv_series'
    },
    {
      franchise: 'Super Sentai',
      seriesTitle: 'Bakuage Sentai Boonboomger',
      episodeTitle: 'Bakuage Sentai Boonboomger: Gekijoboon! (Movie)',
      episodeNumber: 51,
      seasonNumber: 1,
      pageUrl: 'https://www.tokusatsuindo.com/bakuage-sentai-boonboomger-gekijoboon-promise-the-circuit-sub-indonesia/',
      productionId: 'prod_ss_boonboomger_movie',
      seriesCover: 'https://image.tmdb.org/t/p/w600_and_h900_bestv2/yNabCz32woEXgrcvRS8ASH55s3G.jpg',
      era: 'Reiwa',
      contentType: 'movie'
    },
    {
      franchise: 'Super Sentai',
      seriesTitle: 'Bakuage Sentai Boonboomger',
      episodeTitle: 'No.1 Sentai Gozyuger vs Boonboomger (Special)',
      episodeNumber: 52,
      seasonNumber: 1,
      pageUrl: 'https://www.tokusatsuindo.com/no-1-sentai-gozyuger-vs-boonboomger-sub-indonesia/',
      productionId: 'prod_ss_boonboomger_spec',
      seriesCover: 'https://www.tokusatsuindo.com/wp-content/uploads/2025/02/goz-1.png',
      era: 'Reiwa',
      contentType: 'movie'
    },

    // ==========================================
    // 🔴 4. KAMEN RIDER KUUGA (HEISEI - SERIAL & MOVIE/SPECIAL)
    // Legenda permulaan era Heisei (2000)
    // ==========================================
    {
      franchise: 'Kamen Rider',
      seriesTitle: 'Kamen Rider Kuuga',
      episodeTitle: 'Kamen Rider Kuuga Episode 1: Revival Sub Indo',
      episodeNumber: 1,
      seasonNumber: 1,
      pageUrl: 'https://www.tokusatsuindo.com/kamen-rider-kuuga-episode-1-sub-indonesia/',
      productionId: 'prod_kr_kuuga',
      seriesCover: 'https://image.tmdb.org/t/p/w600_and_h900_bestv2/3J5rPQtETWuEyY9BPr2Lt7FGg7x.jpg',
      era: 'Heisei',
      contentType: 'tv_series'
    },
    {
      franchise: 'Kamen Rider',
      seriesTitle: 'Kamen Rider Kuuga',
      episodeTitle: 'Kamen Rider Kuuga: Special Chapter (Movie/Special)',
      episodeNumber: 50,
      seasonNumber: 1,
      pageUrl: 'https://www.tokusatsuindo.com/kamen-rider-kuuga-special-chapter-sub-indonesia/',
      productionId: 'prod_kr_kuuga_spec',
      seriesCover: 'https://image.tmdb.org/t/p/w600_and_h900_bestv2/3J5rPQtETWuEyY9BPr2Lt7FGg7x.jpg',
      era: 'Heisei',
      contentType: 'movie'
    },

    // ==========================================
    // ⚔️ 5. KAMEN RIDER AGITO (HEISEI - SERIAL & SPECIAL)
    // Heisei Era (2001)
    // ==========================================
    {
      franchise: 'Kamen Rider',
      seriesTitle: 'Kamen Rider Agito',
      episodeTitle: 'Kamen Rider Agito Episode 1: Awakening Sub Indo',
      episodeNumber: 1,
      seasonNumber: 1,
      pageUrl: 'https://www.tokusatsuindo.com/kamen-rider-agito-episode-1-sub-indonesia/',
      productionId: 'prod_kr_agito',
      seriesCover: 'https://www.tokusatsuindo.com/wp-content/uploads/2018/02/agito23.png',
      era: 'Heisei',
      contentType: 'tv_series'
    },
    {
      franchise: 'Kamen Rider',
      seriesTitle: 'Kamen Rider Agito',
      episodeTitle: 'Kamen Rider Agito: Psychic War (Movie/Special)',
      episodeNumber: 52,
      seasonNumber: 1,
      pageUrl: 'https://www.tokusatsuindo.com/kamen-rider-agito-psychic-war-sub-indonesia/',
      productionId: 'prod_kr_agito_spec',
      seriesCover: 'https://www.tokusatsuindo.com/wp-content/uploads/2018/02/agito23.png',
      era: 'Heisei',
      contentType: 'movie'
    },

    // ==========================================
    // 🌪️ 6. KAMEN RIDER W / DOUBLE (HEISEI - MOVIE)
    // Kamen Rider W Returns: Eternal (2011)
    // ==========================================
    {
      franchise: 'Kamen Rider',
      seriesTitle: 'Kamen Rider W',
      episodeTitle: 'Kamen Rider W Returns: Kamen Rider Eternal (Movie)',
      episodeNumber: 1,
      seasonNumber: 1,
      pageUrl: 'https://www.tokusatsuindo.com/kamen-rider-w-returns-kamen-rider-eternal-movie-sub-indonesia/',
      productionId: 'prod_kr_w_eternal',
      seriesCover: 'https://image.tmdb.org/t/p/w600_and_h900_bestv2/3iHHmX7txgjptGkdqY3Q6V0r0Fk.jpg',
      era: 'Heisei',
      contentType: 'movie'
    },

    // ==========================================
    // 🧪 7. KAMEN RIDER BUILD (HEISEI - SPECIAL)
    // Kamen Rider Prime Rogue (2018)
    // ==========================================
    {
      franchise: 'Kamen Rider',
      seriesTitle: 'Kamen Rider Build',
      episodeTitle: 'Hyper Battle DVD: Kamen Rider Prime Rogue (Special)',
      episodeNumber: 1,
      seasonNumber: 1,
      pageUrl: 'https://www.tokusatsuindo.com/hyper-battle-dvd-kamen-rider-prime-rogue-sub-indonesia/',
      productionId: 'prod_kr_build_rogue',
      seriesCover: 'https://image.tmdb.org/t/p/w600_and_h900_bestv2/kiXsuX5qAFUxHvf9BM7MPadFq62.jpg',
      era: 'Heisei',
      contentType: 'movie'
    },

    // ==========================================
    // 🏴‍☠️ 8. SUPER SENTAI - GOKAIGER (HEISEI/REIWA MOVIE)
    // Kaizoku Sentai Ten Gokaiger (10th Anniversary Movie)
    // ==========================================
    {
      franchise: 'Super Sentai',
      seriesTitle: 'Kaizoku Sentai Gokaiger',
      episodeTitle: 'Kaizoku Sentai: Ten Gokaiger (Movie Sub Indo)',
      episodeNumber: 1,
      seasonNumber: 1,
      pageUrl: 'https://www.tokusatsuindo.com/kaizoku-sentai-ten-gokaiger-sub-indonesia/',
      productionId: 'prod_ss_ten_gokaiger',
      seriesCover: 'https://image.tmdb.org/t/p/w600_and_h900_bestv2/4Dk0xZ0R9p88rS9zV6C7u8X3bQ1.jpg',
      era: 'Heisei',
      contentType: 'movie'
    },

    // ==========================================
    // 🌌 9. ULTRAMAN TIGA & DYNA (HEISEI - MOVIE)
    // Warriors of the Star of Light (1998)
    // ==========================================
    {
      franchise: 'Ultraman',
      seriesTitle: 'Ultraman Tiga & Dyna',
      episodeTitle: 'Ultraman Tiga & Ultraman Dyna: Warriors of the Star of Light (Movie)',
      episodeNumber: 1,
      seasonNumber: 1,
      pageUrl: 'https://www.tokusatsuindo.com/ultraman-tiga-ultraman-dyna-warriors-of-the-star-of-light-sub-indonesia/',
      productionId: 'prod_ultra_tiga_dyna_movie',
      seriesCover: 'https://image.tmdb.org/t/p/w600_and_h900_bestv2/twq2EahjRaUB6B8wjf7ddrCmLhJ.jpg',
      era: 'Heisei',
      contentType: 'movie'
    },
    {
      franchise: 'Ultraman',
      seriesTitle: 'Ultraman Tiga',
      episodeTitle: 'Ultraman Tiga Gaiden: Revival of the Ancient Giant (Movie)',
      episodeNumber: 2,
      seasonNumber: 1,
      pageUrl: 'https://www.tokusatsuindo.com/ultraman-tiga-gaiden-revival-of-the-ancient-giant-sub-indonesia/',
      productionId: 'prod_ultra_tiga_gaiden',
      seriesCover: 'https://image.tmdb.org/t/p/w600_and_h900_bestv2/twq2EahjRaUB6B8wjf7ddrCmLhJ.jpg',
      era: 'Heisei',
      contentType: 'movie'
    },

    // ==========================================
    // 🛡️ 10. ULTRAMAN ARC (REIWA - MOVIE)
    // The Clash of Light and Evil (2025)
    // ==========================================
    {
      franchise: 'Ultraman',
      seriesTitle: 'Ultraman Arc',
      episodeTitle: 'Ultraman Arc The Movie: The Clash of Light and Evil Sub Indo',
      episodeNumber: 1,
      seasonNumber: 1,
      pageUrl: 'https://www.tokusatsuindo.com/ultraman-arc-the-movie-the-clash-of-light-and-evil-sub-indonesia/',
      productionId: 'prod_ultra_arc_movie',
      seriesCover: 'https://image.tmdb.org/t/p/w600_and_h900_bestv2/twq2EahjRaUB6B8wjf7ddrCmLhJ.jpg',
      era: 'Reiwa',
      contentType: 'movie'
    },

    // ==========================================
    // ⚔️ 11. GARO SERIES (HEISEI & REIWA - MOVIE/SPECIAL)
    // ==========================================
    {
      franchise: 'Metal Hero & Others',
      seriesTitle: 'GARO Series',
      episodeTitle: 'GARO: Taiga Sub Indonesia (Special)',
      episodeNumber: 1,
      seasonNumber: 1,
      pageUrl: 'https://www.tokusatsuindo.com/garo-taiga-sub-indonesia/',
      productionId: 'prod_garo_taiga',
      seriesCover: 'https://www.tokusatsuindo.com/wp-content/uploads/2026/05/taiga.jpg',
      era: 'Reiwa',
      contentType: 'movie'
    },
    {
      franchise: 'Metal Hero & Others',
      seriesTitle: 'GARO Series',
      episodeTitle: 'GARO: Red Requiem Movie Sub Indo',
      episodeNumber: 2,
      seasonNumber: 1,
      pageUrl: 'https://www.tokusatsuindo.com/garo-movie-red-requiem-sub-indonesia/',
      productionId: 'prod_garo_red_requiem',
      seriesCover: 'https://image.tmdb.org/t/p/w600_and_h900_bestv2/pp7Dh7jwTX1mo7gRYLdYOnwPkfm.jpg',
      era: 'Heisei',
      contentType: 'movie'
    }
  ];

  const scrapedEpisodes = [];

  for (const ep of targetEpisodes) {
    console.log(`📡 Scraping [${ep.era} | ${ep.contentType}]: ${ep.episodeTitle}...`);
    const streamData = await extractEpisodeStreams(ep.pageUrl);

    if (streamData && streamData.streams.length > 0) {
      const item = {
        id: `scraped_${ep.productionId}_ep${ep.episodeNumber}`,
        productionId: ep.productionId,
        franchise: ep.franchise,
        seriesTitle: ep.seriesTitle,
        title: ep.episodeTitle,
        episodeNumber: ep.episodeNumber,
        seasonNumber: ep.seasonNumber,
        era: ep.era,
        contentType: ep.contentType,
        sourceUrl: ep.pageUrl,
        fansub: 'TokusatsuIndo / Sawidago Network',
        language: 'Indonesian (Sub Indo)',
        quality: '1080p FHD / 720p HD',
        thumbnail: ep.seriesCover || streamData.posterUrl,
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

      scrapedEpisodes.push(item);
      console.log(`   ✅ Berhasil! Ditemukan ${item.servers.length} server streaming & ${item.driveDownloadUrl1 ? 'Google Drive link' : 'Embed link'}`);
    } else {
      console.log(`   ⚠️ Gagal mengekstrak stream dari ${ep.pageUrl}`);
    }
  }

  const resultData = {
    metadata: {
      generatedAt: new Date().toISOString(),
      totalEpisodes: scrapedEpisodes.length,
      primarySource: 'TokusatsuIndo & Sawidago Network',
      targetFormat: 'Tokuflix REST Schema 01/02 Standard',
      status: 'success'
    },
    episodes: scrapedEpisodes
  };

  fs.writeFileSync(outputPath, JSON.stringify(resultData, null, 2), 'utf-8');
  console.log(`\n🎉 SELESAI! Sebanyak ${scrapedEpisodes.length} rilis Heisei & Reiwa (Series & Movie) berhasil discrape ke:`);
  console.log(`   📁 ${outputPath}`);
}

scrapeAll();
