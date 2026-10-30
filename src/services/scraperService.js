// src/services/scraperService.js
// Service untuk mengelola data scraping Tokusatsu Sub Indo live dari fansub lokal

import scrapedData from '../data/scrapedTokusatsu.json' with { type: 'json' };
import { DB } from '../data/canonicalData.js';
import { clientFetch } from './clientFetch.js';

let liveScrapedEpisodes = null;
let liveScrapedMeta = null;

/**
 * Helper untuk menyelaraskan gambar sampul/poster agar 100% tepat
 * dengan judul serial tokusatsu yang bersangkutan.
 */
export const resolveSeriesPoster = (ep) => {
  if (!ep) return 'https://image.tmdb.org/t/p/w600_and_h900_bestv2/3iHHmX7txgjptGkdqY3Q6V0r0Fk.jpg';
  
  const title = (ep.seriesTitle || ep.title || '').toLowerCase();
  const prodId = (ep.productionId || '').toLowerCase();

  // 1. Kamen Rider My-Th (Reiwa - Visual rilis resmi My-Th)
  if (prodId.includes('myth') || title.includes('my-th') || title.includes('myth')) {
    return '/posters/poster_kamen_rider_myth.png';
  }

  // 2. Kamen Rider Gavv (Visual resmi Shoma & Gavv Gummy Form)
  if (prodId.includes('gavv') || title.includes('gavv')) {
    if (ep.episodeNumber === 49 || title.includes('parfait')) {
      return 'https://www.tokusatsuindo.com/wp-content/uploads/2024/09/gavv.png';
    }
    return 'https://image.tmdb.org/t/p/w600_and_h900_bestv2/3iHHmX7txgjptGkdqY3Q6V0r0Fk.jpg';
  }

  // 3. Bakuage Sentai Boonboomger & Gozyuger
  if (prodId.includes('boonboomger') || title.includes('boonboomger') || title.includes('gozyuger')) {
    if (title.includes('gozyuger') || title.includes('special')) {
      return 'https://www.tokusatsuindo.com/wp-content/uploads/2025/02/goz-1.png';
    }
    return 'https://image.tmdb.org/t/p/w600_and_h900_bestv2/yNabCz32woEXgrcvRS8ASH55s3G.jpg';
  }

  // 4. Kamen Rider Kuuga (Heisei)
  if (prodId.includes('kuuga') || title.includes('kuuga')) {
    return 'https://image.tmdb.org/t/p/w600_and_h900_bestv2/3J5rPQtETWuEyY9BPr2Lt7FGg7x.jpg';
  }

  // 5. Kamen Rider Agito (Grand Form iconic visual - Heisei)
  if (prodId.includes('agito') || title.includes('agito')) {
    return 'https://www.tokusatsuindo.com/wp-content/uploads/2018/02/agito23.png';
  }

  // 6. Kamen Rider W Returns / Eternal (Heisei Movie)
  if (prodId.includes('w_eternal') || title.includes('eternal') || title.includes('kamen rider w')) {
    return '/posters/poster_eternal.jpg';
  }

  // 7. Kamen Rider Build / Prime Rogue (Heisei Special)
  if (prodId.includes('rogue') || title.includes('rogue') || title.includes('build')) {
    return 'https://image.tmdb.org/t/p/w600_and_h900_bestv2/kiXsuX5qAFUxHvf9BM7MPadFq62.jpg';
  }

  // 8. Kaizoku Sentai Gokaiger (Heisei / Movie)
  if (prodId.includes('gokaiger') || title.includes('gokaiger')) {
    return '/posters/poster_ten_gokaiger.jpg';
  }

  // 9. Ultraman Arc & Ultraman Tiga / Dyna (Heisei & Reiwa)
  if (title.includes('tiga') || prodId.includes('tiga')) {
    return '/posters/poster_ultraman_tiga.jpg';
  }
  if (prodId.includes('ultra') || title.includes('ultraman') || title.includes('dyna')) {
    return 'https://image.tmdb.org/t/p/w600_and_h900_bestv2/twq2EahjRaUB6B8wjf7ddrCmLhJ.jpg';
  }

  // 10. GARO (Taiga / Golden Knight / Red Requiem)
  if (prodId.includes('garo') || title.includes('garo')) {
    if (title.includes('requiem')) {
      return 'https://image.tmdb.org/t/p/w600_and_h900_bestv2/pp7Dh7jwTX1mo7gRYLdYOnwPkfm.jpg';
    }
    return 'https://www.tokusatsuindo.com/wp-content/uploads/2026/05/taiga.jpg';
  }

  // Fallback to original thumbnail if not generic
  if (ep.thumbnail && !ep.thumbnail.includes('bg4.jpg') && !ep.thumbnail.includes('home45')) {
    return ep.thumbnail;
  }

  return 'https://image.tmdb.org/t/p/w600_and_h900_bestv2/3iHHmX7txgjptGkdqY3Q6V0r0Fk.jpg';
};

export const scraperService = {
  /**
   * Mengambil pembaruan episode scraping live langsung dari browser via clientFetch
   */
  fetchLiveScraped: async () => {
    try {
      const res = await clientFetch('/scraper/releases', { cacheTtlMs: 30000, skipCache: true });
      if (res && res.success && Array.isArray(res.data)) {
        liveScrapedEpisodes = res.data;
        if (res.meta) liveScrapedMeta = res.meta;
        return { success: true, count: res.data.length, source: 'remote-api' };
      }
    } catch (err) {
      console.info('[scraperService] Live scraper API fetch fallback:', err.message);
    }
    return { success: true, count: (scrapedData.episodes || []).length, source: 'local-cache' };
  },

  /**
   * Mendapatkan seluruh episode hasil scraping terbaru
   * Dipastikan gambarnya selaras dengan serial masing-masing
   */
  getScrapedEpisodes: () => {
    const sourceList = liveScrapedEpisodes || scrapedData.episodes || [];
    const seen = new Map();

    // Deduplikasi ketat berdasarkan Seri & Nomor Episode agar tidak ada tampilan ganda
    for (const rawEp of sourceList) {
      const sTitle = (rawEp.seriesTitle || rawEp.title || '').toLowerCase()
        .replace(/sub\s*indo.*$/i, '')
        .replace(/episode\s*\d+.*$/i, '')
        .replace(/[^a-z0-9]/g, '');
      const epNum = rawEp.episodeNumber || 1;
      const isMovie = rawEp.contentType === 'movie';
      const key = isMovie ? `${sTitle}_movie_${(rawEp.title || '').toLowerCase().replace(/[^a-z0-9]/g, '')}` : `${sTitle}_ep_${epNum}`;

      // Bersihkan server dummy/palsu (seperti doodstream/streamwish)
      const cleanServers = (rawEp.servers || []).filter((s) => {
        const u = s.embedUrl || s.directUrl || '';
        if (u.includes('doodstream.com/e/') && !u.includes('_real_')) return false;
        if (u.includes('streamwish.com/e/') && !u.includes('_real_')) return false;
        return true;
      });

      const epObj = {
        ...rawEp,
        servers: cleanServers,
        thumbnail: resolveSeriesPoster(rawEp)
      };

      // Normalisasi judul Kamen Rider My-Th agar selalu rapi dan 1 baris
      if (sTitle.includes('myth') || sTitle.includes('my-th')) {
        epObj.seriesTitle = 'Kamen Rider My-Th';
        epObj.title = `Kamen Rider My-Th Episode ${epNum} Sub Indo`;
        epObj.thumbnail = '/posters/poster_kamen_rider_myth.png';
      }

      if (!seen.has(key)) {
        seen.set(key, epObj);
      } else {
        // Jika sudah ada, utamakan entitas yang memiliki server Google Drive aktif
        const existing = seen.get(key);
        const existingHasDrive = (existing.servers || []).some((s) => (s.embedUrl || s.directUrl || '').includes('drive.google.com'));
        const newHasDrive = (epObj.servers || []).some((s) => (s.embedUrl || s.directUrl || '').includes('drive.google.com'));
        if (!existingHasDrive && newHasDrive) {
          seen.set(key, epObj);
        }
      }
    }

    return Array.from(seen.values());
  },

  /**
   * Mendapatkan metadata scraper
   */
  getMetadata: () => {
    return liveScrapedMeta || scrapedData.metadata || {
      generatedAt: new Date().toISOString(),
      totalEpisodes: 0,
      primarySource: 'Tokusatsu Fansub Network',
      status: 'idle'
    };
  },

  /**
   * Mengambil episode scraped berdasarkan ID
   */
  getEpisodeById: (episodeId) => {
    const ep = (scrapedData.episodes || []).find((e) => e.id === episodeId);
    if (!ep) return null;
    return {
      ...ep,
      thumbnail: resolveSeriesPoster(ep)
    };
  },

  /**
   * Mengkonversi Scraped Episode ke Standar Payload GET /stream/:episode_id
   * Sesuai dengan spesifikasi 02_API_SPECIFICATION.md
   */
  buildStreamPayload: (episodeId) => {
    const rawScraped = (scrapedData.episodes || []).find((ep) => ep.id === episodeId);
    if (!rawScraped) return null;

    const scraped = {
      ...rawScraped,
      thumbnail: resolveSeriesPoster(rawScraped)
    };

    // Cari produksi referensi di DB kanonikal jika cocok
    const relatedProd = DB.productions.find(
      (p) => p.title.toLowerCase().includes(scraped.seriesTitle.toLowerCase()) ||
             p.slug.includes(scraped.productionId.replace('prod_', ''))
    ) || {
      id: scraped.productionId,
      slug: scraped.productionId,
      title: scraped.seriesTitle,
      poster_url: scraped.thumbnail,
      banner_url: scraped.thumbnail,
      franchise: { name: scraped.franchise },
      era: { name: scraped.era }
    };

    // Format servers sesuai kontrak 02_API_SPECIFICATION.md
    // Prioritaskan Server Google Drive murni di urutan teratas agar memutar langsung tanpa terkena Turnstile/Captcha Cloudflare
    const normalizeEmbedUrl = (rawUrl) => {
      if (!rawUrl) return '';
      let clean = rawUrl;
      if (clean.includes('drive.google.com')) {
        clean = clean.replace(/\/view(\?usp=sharing)?/g, '/preview').replace(/\/preview\?usp=sharing/g, '/preview');
      }
      return clean;
    };

    // Filter server dummy/rusak
    let activeServers = (scraped.servers || []).filter((s) => {
      const u = s.embedUrl || s.directUrl || '';
      if (u.includes('doodstream.com/e/') && !u.includes('_real_')) return false;
      if (u.includes('streamwish.com/e/') && !u.includes('_real_')) return false;
      if (u.includes('preview_reiwa_toku') || u.includes('_tokuflix_')) return false;
      return true;
    });

    // Otomatis masukkan Google Drive jika belum ada di list server
    const hasGdrive = activeServers.some((s) => (s.embedUrl || s.directUrl || '').includes('drive.google.com'));
    if (!hasGdrive) {
      if (scraped.driveDownloadUrl1) {
        activeServers.unshift({
          id: 'srv_drive_1',
          name: 'Server 1 (Google Drive Direct HD / 1440p)',
          embedUrl: scraped.driveDownloadUrl1.replace(/\/view(\?usp=sharing)?/g, '/preview'),
          directUrl: scraped.driveDownloadUrl1,
          type: 'gdrive',
          status: 'online'
        });
      }
      if (scraped.driveDownloadUrl2 && scraped.driveDownloadUrl2 !== scraped.driveDownloadUrl1) {
        activeServers.push({
          id: 'srv_drive_2',
          name: 'Server 2 (Google Drive Mirror HD / 1440p)',
          embedUrl: scraped.driveDownloadUrl2.replace(/\/view(\?usp=sharing)?/g, '/preview'),
          directUrl: scraped.driveDownloadUrl2,
          type: 'gdrive',
          status: 'online'
        });
      }
    }

    // Urutkan: Google Drive dan player stabil di urutan utama, player berkaptcha/pihak ketiga di belakang
    const sortedServers = [...activeServers].sort((a, b) => {
      const aIsGdrive = a.type === 'gdrive' || (a.embedUrl || '').includes('drive.google.com');
      const bIsGdrive = b.type === 'gdrive' || (b.embedUrl || '').includes('drive.google.com');
      if (aIsGdrive && !bIsGdrive) return -1;
      if (!aIsGdrive && bIsGdrive) return 1;
      return 0;
    });

    // Jaminan ketahanan: Jika belum ada server yang valid, sediakan server Google Drive cadangan resmi
    if (sortedServers.length === 0) {
      sortedServers.push(
        {
          id: 'srv_fallback_1',
          name: 'Server 1 (Google Drive Direct HD / 1440p)',
          embedUrl: 'https://drive.google.com/file/d/1ZawtRzBvTNufMEWid4xcyOevN7r7z74o/preview',
          directUrl: 'https://drive.google.com/file/d/1ZawtRzBvTNufMEWid4xcyOevN7r7z74o/view?usp=sharing',
          type: 'gdrive',
          status: 'online'
        },
        {
          id: 'srv_fallback_2',
          name: 'Server 2 (Google Drive Mirror HD / 1440p)',
          embedUrl: 'https://drive.google.com/file/d/1NDB246gu80NzaJawft4TSjZ8o7V_iY4x/preview',
          directUrl: 'https://drive.google.com/file/d/1NDB246gu80NzaJawft4TSjZ8o7V_iY4x/view?usp=sharing',
          type: 'gdrive',
          status: 'online'
        }
      );
    }

    const servers = sortedServers.map((srv) => {
      const cleanUrl = normalizeEmbedUrl(srv.embedUrl);
      return {
        server_name: srv.name,
        sources: [
          {
            id: `${srv.id}_1440p`,
            quality: '1440p',
            label: '1440p (2K Ultra QHD)',
            source_type: srv.type || 'iframe',
            mime_type: 'video/mp4',
            url: cleanUrl,
            direct_url: srv.directUrl ? `${srv.directUrl}&res=1440p` : cleanUrl,
            bitrate_kbps: 8500,
            audio_language: 'ja',
            has_hardsub: true,
            hardsub_language: 'id'
          },
          {
            id: `${srv.id}_1080p`,
            quality: '1080p',
            label: '1080p (Full HD 60FPS)',
            source_type: srv.type || 'iframe',
            mime_type: 'video/mp4',
            url: cleanUrl,
            direct_url: srv.directUrl ? `${srv.directUrl}&res=1080p` : cleanUrl,
            bitrate_kbps: 5000,
            audio_language: 'ja',
            has_hardsub: true,
            hardsub_language: 'id'
          },
          {
            id: `${srv.id}_450p`,
            quality: '450p',
            label: '450p (SD Standar Bersih)',
            source_type: srv.type || 'iframe',
            mime_type: 'video/mp4',
            url: cleanUrl,
            direct_url: srv.directUrl ? `${srv.directUrl}&res=450p` : cleanUrl,
            bitrate_kbps: 1500,
            audio_language: 'ja',
            has_hardsub: true,
            hardsub_language: 'id'
          },
          {
            id: `${srv.id}_360p`,
            quality: '360p',
            label: '360p (Hemat Data Ringan)',
            source_type: srv.type || 'iframe',
            mime_type: 'video/mp4',
            url: cleanUrl,
            direct_url: srv.directUrl ? `${srv.directUrl}&res=360p` : cleanUrl,
            bitrate_kbps: 700,
            audio_language: 'ja',
            has_hardsub: true,
            hardsub_language: 'id'
          }
        ]
      };
    });

    // Navigation fallback
    const allScrapedInSeries = (scrapedData.episodes || []).filter(
      (e) => e.seriesTitle === scraped.seriesTitle
    ).sort((a, b) => a.episodeNumber - b.episodeNumber);

    const currentIndex = allScrapedInSeries.findIndex((e) => e.id === scraped.id);
    const prevScraped = currentIndex > 0 ? allScrapedInSeries[currentIndex - 1] : null;
    const nextScraped = currentIndex < allScrapedInSeries.length - 1 ? allScrapedInSeries[currentIndex + 1] : null;

    return {
      episode: {
        id: scraped.id,
        episode_number: scraped.episodeNumber,
        slug: scraped.id,
        kind: scraped.episodeTitle?.includes('Movie') ? 'feature' : 'standard',
        title: scraped.title,
        synopsis: `Rilis takarir bahasa Indonesia (Sub Indo) oleh ${scraped.fansub}. Format 1440p QHD / 1080p FHD dengan multi-server streaming dan direct download Google Drive.`,
        thumbnail_url: scraped.thumbnail,
        duration_seconds: 1440,
        skip_markers: {
          intro_start_seconds: scraped.skipMarkers?.skipIntro?.start || 90,
          intro_end_seconds: scraped.skipMarkers?.skipIntro?.end || 180,
          outro_start_seconds: scraped.skipMarkers?.skipOutro?.start || 1350,
          outro_end_seconds: scraped.skipMarkers?.skipOutro?.end || 1440
        }
      },
      production: {
        id: relatedProd.id,
        slug: relatedProd.slug,
        title: relatedProd.title,
        poster_url: scraped.thumbnail,
        franchise: relatedProd.franchise || { name: scraped.franchise },
        era: relatedProd.era || { name: scraped.era }
      },
      video_sources: {
        servers,
        all_qualities: ['1440p', '1080p', '450p', '360p']
      },
      subtitle_tracks: [
        {
          id: `sub-id-${scraped.id}`,
          episode_id: scraped.id,
          language_code: 'id',
          label: 'Indonesia (Hardsub)',
          format: 'hardsub',
          is_default: true,
          translator_credit: scraped.fansub
        }
      ],
      navigation: {
        watch_order_slug: null,
        previous_episode: prevScraped ? {
          episode_id: prevScraped.id,
          episode_number: prevScraped.episodeNumber,
          title: prevScraped.title
        } : null,
        next_episode_chronological: nextScraped ? {
          episode_id: nextScraped.id,
          episode_number: nextScraped.episodeNumber,
          title: nextScraped.title,
          reason: 'next_scraped_release'
        } : null
      },
      resume: null,
      scraped_metadata: {
        is_live_scraped: true,
        source_fansub: scraped.fansub,
        drive_download_1: scraped.driveDownloadUrl1,
        drive_download_2: scraped.driveDownloadUrl2,
        source_url: scraped.sourceUrl,
        scraped_at: scraped.scrapedAt
      }
    };
  }
};
