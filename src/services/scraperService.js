// src/services/scraperService.js
// Service untuk mengelola data scraping Tokusatsu Sub Indo live dari fansub lokal

import scrapedData from '../data/scrapedTokusatsu.json';
import { DB } from '../data/canonicalData';

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
    return 'https://www.tokusatsuindo.com/wp-content/uploads/2026/10/myte.png';
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
   * Mendapatkan seluruh episode hasil scraping terbaru
   * Dipastikan gambarnya selaras dengan serial masing-masing
   */
  getScrapedEpisodes: () => {
    return (scrapedData.episodes || []).map((ep) => ({
      ...ep,
      thumbnail: resolveSeriesPoster(ep)
    }));
  },

  /**
   * Mendapatkan metadata scraper
   */
  getMetadata: () => {
    return scrapedData.metadata || {
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
    // Prioritaskan Direct Embed Player (Server 1 & Server 2) di urutan pertama agar langsung memutar tanpa hambatan izin akun Google Drive!
    const normalizeEmbedUrl = (rawUrl) => {
      if (!rawUrl) return '';
      let clean = rawUrl;
      if (clean.includes('drive.google.com')) {
        clean = clean.replace(/\/view(\?usp=sharing)?/g, '/preview').replace(/\/preview\?usp=sharing/g, '/preview');
      }
      return clean;
    };

    const sortedServers = [...(scraped.servers || [])].sort((a, b) => {
      // Non-gdrive (Direct Web Embed) diprioritaskan di awal
      if (a.type !== 'gdrive' && b.type === 'gdrive') return -1;
      if (a.type === 'gdrive' && b.type !== 'gdrive') return 1;
      return 0;
    });

    const servers = sortedServers.map((srv) => {
      const cleanUrl = normalizeEmbedUrl(srv.embedUrl);
      return {
        server_name: srv.name,
        sources: [
          {
            id: `${srv.id}_1440p`,
            quality: '1440p',
            label: '1440p (2K QHD Ultra)',
            source_type: srv.type || 'iframe',
            mime_type: 'video/mp4',
            url: cleanUrl,
            direct_url: srv.directUrl ? `${srv.directUrl}&res=1440p` : cleanUrl,
            bitrate_kbps: 8000,
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
            id: `${srv.id}_720p`,
            quality: '720p',
            label: '720p (HD Jernih)',
            source_type: srv.type || 'iframe',
            mime_type: 'video/mp4',
            url: cleanUrl,
            direct_url: srv.directUrl ? `${srv.directUrl}&res=720p` : cleanUrl,
            bitrate_kbps: 2800,
            audio_language: 'ja',
            has_hardsub: true,
            hardsub_language: 'id'
          },
          {
            id: `${srv.id}_480p`,
            quality: '480p',
            label: '480p (Hemat Kuota)',
            source_type: srv.type || 'iframe',
            mime_type: 'video/mp4',
            url: cleanUrl,
            direct_url: srv.directUrl ? `${srv.directUrl}&res=480p` : cleanUrl,
            bitrate_kbps: 1200,
            audio_language: 'ja',
            has_hardsub: true,
            hardsub_language: 'id'
          },
          {
            id: `${srv.id}_360p`,
            quality: '360p',
            label: '360p (Standar Mobile)',
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
        all_qualities: ['1440p', '1080p', '720p', '480p', '360p']
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
