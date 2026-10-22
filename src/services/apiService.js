// Implementasi Lengkap REST Client & Controller sesuai 02_API_SPECIFICATION.md
// Mendukung in-memory database berdasar 01_DATABASE_ARCHITECTURE.md serta sinkronisasi LocalStorage

import { DB } from '../data/canonicalData.js';
import { scraperService } from './scraperService.js';
import { 
  clientFetch, 
  getApiBaseUrl, 
  setApiBaseUrl, 
  clearClientCache,
  abortAllInFlightRequests 
} from './clientFetch.js';
import {
  CACHE_CATEGORIES,
  TTL_48_HOURS_MS,
  initializeCacheManager,
  cleanupExpiredCache,
  cleanupSessionCache,
  clearUserPrivateCache,
  getCacheStats,
  enforceCacheLimits,
  recordUserActivity,
  getLastActiveTimestamp,
  isUserInactive48Hours,
  setTimeOffsetForTesting,
  resetTimeOffsetForTesting,
  getCurrentTime,
  getCacheItem,
  setCacheItem,
  getAutoCacheStatus,
  runAutoMaintenanceCycle,
  cleanupDanglingData,
  autoTrimStorageQuota
} from './cacheManager.js';

// Re-export configuration & cache helpers for UI components & DevTools testing
export { 
  getApiBaseUrl, 
  setApiBaseUrl, 
  clearClientCache,
  abortAllInFlightRequests,
  CACHE_CATEGORIES,
  TTL_48_HOURS_MS,
  initializeCacheManager,
  cleanupExpiredCache,
  cleanupSessionCache,
  clearUserPrivateCache,
  getCacheStats,
  enforceCacheLimits,
  recordUserActivity,
  getLastActiveTimestamp,
  isUserInactive48Hours,
  setTimeOffsetForTesting,
  resetTimeOffsetForTesting,
  getCurrentTime,
  getCacheItem,
  setCacheItem,
  getAutoCacheStatus,
  runAutoMaintenanceCycle,
  cleanupDanglingData,
  autoTrimStorageQuota
};

// Helper Response Envelope
const makeResponse = (data, pagination = null) => {
  const res = {
    success: true,
    data,
    meta: {
      request_id: `req_${Math.random().toString(36).substring(2, 11)}_${Date.now()}`,
      timestamp: new Date().toISOString()
    }
  };
  if (pagination) {
    res.meta.pagination = pagination;
  }
  return res;
};

// Helper Error Envelope
const makeError = (code, message, status = 400, details = null) => {
  return {
    success: false,
    error: {
      code,
      message,
      ...(details ? { details } : {})
    },
    meta: {
      request_id: `req_${Math.random().toString(36).substring(2, 11)}_${Date.now()}`,
      timestamp: new Date().toISOString()
    }
  };
};

// LocalStorage Persistence Keys
const STORAGE_KEYS = {
  USER: 'tokuflix_auth_user',
  TOKEN: 'tokuflix_auth_token',
  HISTORY: 'tokuflix_watch_history',
  BOOKMARKS: 'tokuflix_user_bookmarks'
};

const getStoredHistory = () => {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.HISTORY) || '[]');
  } catch {
    return [];
  }
};

const setStoredHistory = (history) => {
  localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(history));
};

const getStoredBookmarks = () => {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.BOOKMARKS) || '[]');
  } catch {
    return [];
  }
};

const setStoredBookmarks = (bookmarks) => {
  localStorage.setItem(STORAGE_KEYS.BOOKMARKS, JSON.stringify(bookmarks));
};

// Helper: Format Production Card (1.7.1)
const formatProductionCard = (prod) => {
  const franchise = DB.franchises.find((f) => f.id === prod.franchise_id) || null;
  const era = DB.eras.find((e) => e.id === prod.era_id) || null;
  const genres = (prod.genre_slugs || []).map((slug) => {
    return DB.genres.find((g) => g.slug === slug) || { slug, name: slug, kind: 'theme' };
  });

  return {
    id: prod.id,
    slug: prod.slug,
    title: prod.title,
    title_native: prod.title_native,
    type: prod.type,
    status: prod.status,
    poster_url: prod.poster_url,
    release_date: prod.release_date,
    release_year: prod.release_year,
    total_episodes: prod.total_episodes,
    age_rating: prod.age_rating,
    view_count: prod.view_count,
    franchise: franchise ? { id: franchise.id, slug: franchise.slug, name: franchise.name } : null,
    era: era ? { id: era.id, slug: era.slug, name: era.name } : null,
    genres
  };
};

/* ==========================================================================
   ENDPOINT IMPLEMENTATIONS (02_API_SPECIFICATION.md)
   ========================================================================== */

/**
 * 1. GET /api/v1/meta/filters
 */
export const getMetaFilters = async () => {
  // 1. Coba request langsung dari browser via clientFetch jika Base URL aktif
  try {
    const remote = await clientFetch('/meta/filters', { cacheTtlMs: 300000 });
    if (remote && remote.success && remote.data) {
      return remote;
    }
  } catch (err) {
    console.info('[apiService] Remote /meta/filters gagal, menggunakan fallback data kanonikal lokal:', err.message);
  }

  // 2. Fallback data kanonikal lokal
  const franchises = DB.franchises.map((f) => ({
    id: f.id,
    slug: f.slug,
    name: f.name,
    production_count: DB.productions.filter((p) => p.franchise_id === f.id && p.is_published).length
  }));

  const eras = DB.eras.map((e) => ({
    id: e.id,
    slug: e.slug,
    name: e.name,
    start_year: e.start_year,
    end_year: e.end_year
  }));

  const genres = DB.genres;
  const types = ["tv_series", "movie", "v_cinema", "special", "hyper_battle_dvd", "net_movie", "crossover"];
  const statuses = ["upcoming", "ongoing", "completed", "hiatus"];

  const publishedYears = Array.from(
    new Set(DB.productions.filter((p) => p.is_published).map((p) => p.release_year))
  ).sort((a, b) => b - a);

  return makeResponse({
    franchises,
    eras,
    genres,
    types,
    statuses,
    years: publishedYears,
    sort_options: ["release_date", "title", "popularity", "updated_at"]
  });
};

/**
 * 2. GET /api/v1/home/hero
 */
export const getHomeHero = async ({ limit = 5, franchise = null } = {}) => {
  // 1. Coba request langsung dari browser via clientFetch
  try {
    const remote = await clientFetch('/home/hero', {
      params: { limit, franchise: franchise && franchise !== 'all' ? franchise : undefined },
      cacheTtlMs: 120000
    });
    if (remote && remote.success && remote.data) {
      return remote;
    }
  } catch (err) {
    console.info('[apiService] Remote /home/hero gagal, menggunakan fallback data kanonikal lokal:', err.message);
  }

  // 2. Fallback data kanonikal lokal
  let featured = DB.productions.filter((p) => p.is_featured && p.is_published);

  if (franchise && franchise !== 'all') {
    const fSlugs = franchise.toLowerCase().split(',');
    const matchingFIds = DB.franchises.filter((f) => fSlugs.includes(f.slug.toLowerCase())).map((f) => f.id);
    const franchiseFeatured = featured.filter((p) => matchingFIds.includes(p.franchise_id));
    if (franchiseFeatured.length > 0) {
      featured = franchiseFeatured;
    } else {
      featured = DB.productions.filter((p) => matchingFIds.includes(p.franchise_id) && p.is_published).slice(0, limit);
    }
  }

  featured = featured
    .sort((a, b) => (a.featured_order || 99) - (b.featured_order || 99))
    .slice(0, limit);

  const heroList = featured.map((prod) => {
    const card = formatProductionCard(prod);
    const eps = DB.episodes.filter((e) => e.production_id === prod.id && e.is_published);
    const firstEp = eps[0] || null;

    return {
      production: {
        ...card,
        tagline: prod.tagline,
        synopsis: prod.synopsis ? prod.synopsis.substring(0, 280) + '...' : '',
        backdrop_url: prod.backdrop_url,
        trailer_url: prod.trailer_url
      },
      cta: {
        label: "Nonton Sekarang",
        episode_id: firstEp ? firstEp.id : null,
        watch_url: firstEp ? `/watch/${firstEp.id}` : '#'
      }
    };
  });

  return makeResponse(heroList);
};

/**
 * 3. GET /api/v1/home/latest-episodes
 */
export const getHomeLatestEpisodes = async ({ page = 1, per_page = 12, franchise = null, status = null } = {}) => {
  // 1. Coba request langsung dari browser via clientFetch
  try {
    const remote = await clientFetch('/home/latest-episodes', {
      params: { page, per_page, franchise, status },
      cacheTtlMs: 60000
    });
    if (remote && remote.success && remote.data) {
      return remote;
    }
  } catch (err) {
    console.info('[apiService] Remote /home/latest-episodes gagal, fallback ke data lokal:', err.message);
  }

  // 2. Fallback data kanonikal lokal
  let eps = DB.episodes.filter((e) => e.is_published);

  if (franchise) {
    const fSlugs = franchise.split(',');
    const matchingFranchiseIds = DB.franchises.filter((f) => fSlugs.includes(f.slug)).map((f) => f.id);
    const matchingProdIds = DB.productions.filter((p) => matchingFranchiseIds.includes(p.franchise_id)).map((p) => p.id);
    eps = eps.filter((e) => matchingProdIds.includes(e.production_id));
  }

  if (status) {
    const matchingProdIds = DB.productions.filter((p) => p.status === status).map((p) => p.id);
    eps = eps.filter((e) => matchingProdIds.includes(e.production_id));
  }

  eps.sort((a, b) => new Date(b.published_at || b.air_date) - new Date(a.published_at || a.air_date));

  const total = eps.length;
  const totalPages = Math.ceil(total / per_page) || 1;
  const start = (page - 1) * per_page;
  const pagedEps = eps.slice(start, start + per_page);

  const data = pagedEps.map((ep) => {
    const prod = DB.productions.find((p) => p.id === ep.production_id);
    const fr = prod ? DB.franchises.find((f) => f.id === prod.franchise_id) : null;

    return {
      episode: {
        id: ep.id,
        episode_number: ep.episode_number,
        slug: ep.slug,
        kind: ep.kind,
        title: ep.title,
        thumbnail_url: ep.thumbnail_url,
        duration_seconds: ep.duration_seconds,
        air_date: ep.air_date,
        published_at: ep.published_at
      },
      production: prod ? {
        id: prod.id,
        slug: prod.slug,
        title: prod.title,
        type: prod.type,
        poster_url: prod.poster_url,
        franchise: fr ? { slug: fr.slug, name: fr.name } : null
      } : null
    };
  });

  return makeResponse(data, {
    page,
    per_page,
    total_items: total,
    total_pages: totalPages,
    has_next: page < totalPages,
    has_prev: page > 1
  });
};

/**
 * 4. GET /api/v1/home/popular
 */
export const getHomePopular = async ({ franchise = null, era = null, type = 'tv_series', group_by = 'none', limit = 12 } = {}) => {
  // 1. Coba request langsung dari browser via clientFetch
  try {
    const remote = await clientFetch('/home/popular', {
      params: { franchise, era, type, group_by, limit },
      cacheTtlMs: 120000
    });
    if (remote && remote.success && remote.data) {
      return remote;
    }
  } catch (err) {
    console.info('[apiService] Remote /home/popular gagal, fallback ke data lokal:', err.message);
  }

  // 2. Fallback data kanonikal lokal
  let list = DB.productions.filter((p) => p.is_published);

  if (type) {
    const types = type.split(',');
    list = list.filter((p) => types.includes(p.type));
  }
  if (franchise) {
    const fr = DB.franchises.find((f) => f.slug === franchise);
    if (fr) list = list.filter((p) => p.franchise_id === fr.id);
  }
  if (era) {
    const er = DB.eras.find((e) => e.slug === era);
    if (er) list = list.filter((p) => p.era_id === er.id);
  }

  list.sort((a, b) => (b.view_count || 0) - (a.view_count || 0));

  if (group_by === 'franchise') {
    const groups = DB.franchises.map((fr) => {
      const items = list.filter((p) => p.franchise_id === fr.id).slice(0, limit).map(formatProductionCard);
      return {
        group: { type: 'franchise', slug: fr.slug, name: fr.name },
        items
      };
    }).filter((g) => g.items.length > 0);

    return makeResponse(groups);
  }

  return makeResponse(list.slice(0, limit).map(formatProductionCard));
};

/**
 * 5. GET /api/v1/home/continue-watching
 */
export const getHomeContinueWatching = async ({ limit = 10 } = {}) => {
  // 1. Coba request langsung dari browser via clientFetch jika token/endpoint tersedia
  try {
    const remote = await clientFetch('/home/continue-watching', {
      params: { limit },
      cacheTtlMs: 15000
    });
    if (remote && remote.success && remote.data) {
      return remote;
    }
  } catch (err) {
    // silently fallback to localStorage
  }

  // 2. Fallback data localStorage tersimpan di browser
  const history = getStoredHistory()
    .filter((h) => !h.is_completed)
    .sort((a, b) => new Date(b.last_watched_at) - new Date(a.last_watched_at))
    .slice(0, limit);

  const data = history.map((item) => {
    const ep = DB.episodes.find((e) => e.id === item.episode_id) || {
      id: item.episode_id,
      episode_number: item.episode_number,
      title: item.episode_title,
      thumbnail_url: null,
      duration_seconds: item.duration_seconds
    };
    const prod = DB.productions.find((p) => p.id === item.production_id) || {
      id: item.production_id,
      slug: 'series',
      title: item.series_title,
      type: 'tv_series',
      poster_url: item.poster_url
    };

    return {
      episode: {
        id: ep.id,
        episode_number: ep.episode_number,
        title: ep.title,
        thumbnail_url: ep.thumbnail_url,
        duration_seconds: ep.duration_seconds
      },
      production: {
        id: prod.id,
        slug: prod.slug,
        title: prod.title,
        type: prod.type,
        poster_url: prod.poster_url
      },
      progress_seconds: item.progress_seconds,
      percent_complete: item.duration_seconds ? Number(((item.progress_seconds / item.duration_seconds) * 100).toFixed(2)) : 0,
      last_watched_at: item.last_watched_at
    };
  });

  return makeResponse(data);
};

/**
 * 6. GET /api/v1/search?q=...
 */
export const searchProductions = async ({ q, limit = 8 } = {}) => {
  if (!q || q.trim().length < 2) {
    return makeError('VALIDATION_ERROR', 'Parameter pencarian q minimal 2 karakter.', 400);
  }

  // 1. Coba request langsung dari browser via clientFetch
  try {
    const remote = await clientFetch('/productions/search', {
      params: { q, limit },
      cacheTtlMs: 30000
    });
    if (remote && remote.success && remote.data) {
      return remote;
    }
  } catch (err) {
    console.info('[apiService] Remote /productions/search gagal, fallback ke data lokal:', err.message);
  }

  // 2. Fallback data kanonikal lokal
  const query = q.toLowerCase().trim();
  const matched = DB.productions
    .filter((p) => p.is_published)
    .filter((p) => {
      const matchTitle = p.title.toLowerCase().includes(query);
      const matchNative = p.title_native && p.title_native.toLowerCase().includes(query);
      const matchRomaji = p.title_romaji && p.title_romaji.toLowerCase().includes(query);
      const matchAlts = p.alternative_titles && p.alternative_titles.some((a) => a.toLowerCase().includes(query));
      return matchTitle || matchNative || matchRomaji || matchAlts;
    })
    .slice(0, limit);

  const data = matched.map((p) => {
    const fr = DB.franchises.find((f) => f.id === p.franchise_id);
    return {
      id: p.id,
      slug: p.slug,
      title: p.title,
      title_native: p.title_native,
      type: p.type,
      release_year: p.release_year,
      poster_url: p.poster_url,
      franchise: fr ? { slug: fr.slug, name: fr.name } : null
    };
  });

  return makeResponse(data);
};

/**
 * 7. GET /api/v1/catalog
 */
export const getCatalog = async (params = {}) => {
  // 1. Coba request langsung dari browser via clientFetch
  try {
    const remote = await clientFetch('/catalog', {
      params,
      cacheTtlMs: 60000
    });
    if (remote && remote.success && remote.data) {
      return remote;
    }
  } catch (err) {
    console.info('[apiService] Remote /catalog gagal, fallback ke data lokal:', err.message);
  }

  // 2. Fallback data kanonikal lokal
  const {
    franchise,
    era,
    type,
    year,
    year_from,
    year_to,
    genre,
    status,
    q,
    sort = 'release_date',
    order = (sort === 'title' ? 'asc' : 'desc'),
    page = 1,
    per_page = 300
  } = params;

  let list = DB.productions.filter((p) => p.is_published);

  // Franchise filter (matches primary franchise OR secondary crossover)
  if (franchise) {
    const fSlugs = franchise.split(',');
    const matchingFIds = DB.franchises.filter((f) => fSlugs.includes(f.slug)).map((f) => f.id);
    list = list.filter((p) => matchingFIds.includes(p.franchise_id));
  }

  // Era filter
  if (era) {
    const eSlugs = era.split(',');
    const matchingEIds = DB.eras.filter((e) => eSlugs.includes(e.slug)).map((e) => e.id);
    list = list.filter((p) => matchingEIds.includes(p.era_id));
  }

  // Type filter
  if (type) {
    const types = type.split(',');
    list = list.filter((p) => types.includes(p.type));
  }

  // Year filters
  if (year) {
    list = list.filter((p) => p.release_year === Number(year));
  }
  if (year_from) {
    list = list.filter((p) => p.release_year >= Number(year_from));
  }
  if (year_to) {
    list = list.filter((p) => p.release_year <= Number(year_to));
  }

  // Genre filter
  if (genre) {
    const gSlugs = genre.split(',');
    list = list.filter((p) => p.genre_slugs && p.genre_slugs.some((gs) => gSlugs.includes(gs)));
  }

  // Status filter
  if (status) {
    list = list.filter((p) => p.status === status);
  }

  // Search filter
  if (q && q.trim().length >= 2) {
    const query = q.toLowerCase().trim();
    list = list.filter((p) => {
      const matchTitle = p.title.toLowerCase().includes(query);
      const matchNative = p.title_native && p.title_native.toLowerCase().includes(query);
      const matchRomaji = p.title_romaji && p.title_romaji.toLowerCase().includes(query);
      return matchTitle || matchNative || matchRomaji;
    });
  }

  // Sorting
  list.sort((a, b) => {
    let comp = 0;
    if (sort === 'release_date') {
      comp = new Date(a.release_date || 0) - new Date(b.release_date || 0);
    } else if (sort === 'title') {
      comp = a.title.localeCompare(b.title);
    } else if (sort === 'popularity') {
      comp = (a.view_count || 0) - (b.view_count || 0);
    } else if (sort === 'updated_at') {
      comp = new Date(a.published_at || 0) - new Date(b.published_at || 0);
    }

    if (order === 'desc') comp = -comp;
    // Tie-breaker: id ASC
    return comp !== 0 ? comp : a.id.localeCompare(b.id);
  });

  const total = list.length;
  const totalPages = Math.ceil(total / per_page) || 1;
  const start = (page - 1) * per_page;
  const pagedList = list.slice(start, start + per_page).map(formatProductionCard);

  const res = makeResponse(pagedList, {
    page: Number(page),
    per_page: Number(per_page),
    total_items: total,
    total_pages: totalPages,
    has_next: page < totalPages,
    has_prev: page > 1
  });

  res.meta.applied_filters = {
    franchise: franchise ? franchise.split(',') : [],
    era: era ? era.split(',') : [],
    type: type ? type.split(',') : [],
    year: year ? Number(year) : null,
    year_from: year_from ? Number(year_from) : null,
    year_to: year_to ? Number(year_to) : null,
    genre: genre ? genre.split(',') : [],
    status: status || null,
    q: q || null,
    sort,
    order
  };

  return res;
};

/**
 * Helper akurat untuk mencocokkan episode hasil scraping dengan produksi kanonikal.
 * Mencegah kontaminasi silang antar judul mirip (misal: Tiga & Dyna vs Tiga Gaiden / Peradaban Kuno).
 */
export const isScrapedEpisodeMatch = (se, prod, episodeNumber = null) => {
  if (!se || !prod) return false;

  const EXPLICIT_PROD_MAP = {
    'ultraman-tiga-dyna-movie': ['scraped_prod_ultra_tiga_dyna_movie_ep1'],
    'ultraman-tiga-gaiden': ['scraped_prod_ultra_tiga_gaiden_ep1', 'scraped_prod_ultra_tiga_gaiden_ep2'],
    'kaizoku-sentai-ten-gokaiger': ['scraped_prod_ss_ten_gokaiger_ep1'],
    'kamen-rider-w-returns-eternal': ['scraped_prod_kr_w_eternal_ep1'],
    'garo-red-requiem': ['scraped_prod_garo_red_requiem_ep2'],
    'shin-ultraman': ['scraped_prod_shin-ultraman_movie'],
    'kamen-rider-ryuki-13-riders': ['scraped_prod_kamen-rider-ryuki-13-riders_movie'],
    'kamen-rider-ryuki-episode-final': ['scraped_prod_kamen-rider-ryuki-episode-final_movie'],
    'ohsama-sentai-king-ohger-vs-kyoryuger': ['scraped_sawidago_ohsama-sentai-king-ohger-vs-kyoryuger_ep1_mvhzqk7j'],
    'no-1-sentai-gozyuger-vs-boonboomger': ['scraped_sawidago_no-1-sentai-gozyuger-vs-boonboomger-movie_ep1_mvhzpw7s']
  };

  if (EXPLICIT_PROD_MAP[prod.slug]) {
    return EXPLICIT_PROD_MAP[prod.slug].includes(se.id);
  }

  const sTitle = (se.seriesTitle || se.title || '').toLowerCase();
  const pSlug = (prod.slug || '').toLowerCase();
  const pTitle = (prod.title || '').toLowerCase();
  const sProdId = (se.productionId || '').toLowerCase();

  // Isolasi tipe konten: Serial TV vs Movie
  if (prod.type === 'movie' && se.contentType === 'tv_series') return false;
  if (prod.type === 'tv_series' && se.contentType === 'movie') return false;

  // Disambiguasi judul Dyna
  if (pSlug.includes('dyna') && !sTitle.includes('dyna') && !sProdId.includes('dyna')) return false;
  if (!pSlug.includes('dyna') && sTitle.includes('dyna') && !pTitle.includes('dyna')) return false;

  // Disambiguasi judul Gaiden / Peradaban Kuno
  if (pSlug.includes('gaiden') && !sTitle.includes('gaiden') && !sProdId.includes('gaiden')) return false;
  if (!pSlug.includes('gaiden') && (sTitle.includes('gaiden') || sProdId.includes('gaiden')) && !pTitle.includes('gaiden')) return false;

  // Disambiguasi Ten Gokaiger vs Serial Utama
  if (pSlug.includes('ten-gokaiger') && !sTitle.includes('ten') && !sProdId.includes('ten')) return false;
  if (!pSlug.includes('ten-gokaiger') && (sTitle.includes('ten gokaiger') || sProdId.includes('ten_gokaiger')) && !pTitle.includes('ten')) return false;

  // Disambiguasi Kamen Rider Zero-One vs Kamen Rider My-Th
  if (pSlug.includes('zero-one') && (sTitle.includes('my-th') || sTitle.includes('myth') || sProdId.includes('myth') || sProdId.includes('my_th'))) return false;
  if ((pSlug.includes('my-th') || pSlug.includes('myth')) && (sTitle.includes('zero-one') || sProdId.includes('zero_one') || sProdId.includes('zero-one'))) return false;

  const matchProd = (prod.id && se.productionId === prod.id) ||
                    sProdId === pSlug ||
                    sProdId === `prod_${pSlug.replace(/-/g, '_')}` ||
                    pSlug === sProdId.replace(/^prod_/, '').replace(/_/g, '-') ||
                    sTitle === pTitle ||
                    sTitle.includes(pSlug.replace(/-/g, ' ')) ||
                    pSlug.replace(/-/g, ' ').includes(sTitle) ||
                    pTitle.includes(sTitle) ||
                    sTitle.includes(pTitle);

  if (!matchProd) return false;

  if (episodeNumber !== null && episodeNumber !== undefined) {
    return Number(se.episodeNumber) === Number(episodeNumber);
  }
  return true;
};

/**
 * 8. GET /api/v1/productions/:slug
 */
export const getProductionBySlug = async (slug, { watch_order = null } = {}) => {
  // 1. Coba request langsung dari browser via clientFetch
  try {
    const remote = await clientFetch(`/productions/${slug}`, {
      params: watch_order ? { watch_order } : null,
      cacheTtlMs: 180000
    });
    if (remote && remote.success && remote.data) {
      return remote;
    }
  } catch (err) {
    console.info(`[apiService] Remote /productions/${slug} gagal, fallback ke data lokal:`, err.message);
  }

  // 2. Fallback data kanonikal lokal
  const prod = DB.productions.find((p) => p.slug === slug && p.is_published);
  if (!prod) {
    return makeError('NOT_FOUND', `Production dengan slug "${slug}" tidak ditemukan.`, 404);
  }

  const franchise = DB.franchises.find((f) => f.id === prod.franchise_id);
  const era = DB.eras.find((e) => e.id === prod.era_id);
  const genres = (prod.genre_slugs || []).map((s) => DB.genres.find((g) => g.slug === s) || { slug: s, name: s, kind: 'theme' });

  // Episodes of this production
  const history = getStoredHistory();
  const episodes = DB.episodes
    .filter((e) => e.production_id === prod.id && e.is_published)
    .sort((a, b) => a.episode_number - b.episode_number)
    .map((ep) => {
      const activeSubs = DB.subtitle_tracks
        .filter((st) => st.episode_id === ep.id && st.is_active)
        .map((st) => st.language_code);
      const userHist = history.find((h) => h.episode_id === ep.id) || null;

      return {
        id: ep.id,
        episode_number: ep.episode_number,
        episode_label: ep.episode_label,
        slug: ep.slug,
        kind: ep.kind,
        title: ep.title,
        thumbnail_url: ep.thumbnail_url,
        duration_seconds: ep.duration_seconds,
        air_date: ep.air_date,
        has_subtitles: Array.from(new Set(activeSubs.length > 0 ? activeSubs : ['id'])),
        user_progress: userHist ? { progress_seconds: userHist.progress_seconds, is_completed: userHist.is_completed } : null
      };
    });

  // Sinkronisasi otomatis dengan hasil Scraper Live untuk episode rilis baru
  try {
    const scrapedList = scraperService.getScrapedEpisodes();
    const existingEpNumbers = new Set(episodes.map((e) => e.episode_number));
    
    scrapedList.forEach((se) => {
      const isMatch = isScrapedEpisodeMatch(se, prod);

      if (isMatch && se.episodeNumber && !existingEpNumbers.has(se.episodeNumber)) {
        existingEpNumbers.add(se.episodeNumber);
        const userHist = history.find((h) => h.episode_id === se.id) || null;
        episodes.push({
          id: se.id,
          episode_number: se.episodeNumber,
          episode_label: `Ep ${se.episodeNumber}`,
          slug: `episode-${se.episodeNumber}`,
          kind: se.contentType === 'movie' ? 'movie' : 'episode',
          title: se.title,
          thumbnail_url: se.thumbnail || prod.poster_url,
          duration_seconds: 1440,
          air_date: se.scrapedAt ? se.scrapedAt.substring(0, 10) : '2026-02-21',
          has_subtitles: ['id'],
          user_progress: userHist ? { progress_seconds: userHist.progress_seconds, is_completed: userHist.is_completed } : null
        });
      }
    });

    episodes.sort((a, b) => a.episode_number - b.episode_number);
  } catch (err) {
    console.warn('[apiService] Error merging scraped episodes:', err);
  }

  // Related productions (children, parent, shared watch order)
  const relatedProds = [];
  // Children (e.g. movies of this TV series)
  const children = DB.productions.filter((p) => p.parent_production_id === prod.id && p.is_published);
  children.forEach((c) => {
    const firstEp = DB.episodes.find((e) => e.production_id === c.id && e.is_published);
    relatedProds.push({
      relation: c.type,
      production: {
        id: c.id,
        slug: c.slug,
        title: c.title,
        type: c.type,
        poster_url: c.poster_url,
        release_year: c.release_year,
        playable_episode_id: firstEp ? firstEp.id : null
      }
    });
  });

  // Parent (if this is a movie)
  if (prod.parent_production_id) {
    const parent = DB.productions.find((p) => p.id === prod.parent_production_id && p.is_published);
    if (parent) {
      const firstEp = DB.episodes.find((e) => e.production_id === parent.id && e.is_published);
      relatedProds.push({
        relation: 'parent_series',
        production: {
          id: parent.id,
          slug: parent.slug,
          title: parent.title,
          type: parent.type,
          poster_url: parent.poster_url,
          release_year: parent.release_year,
          playable_episode_id: firstEp ? firstEp.id : null
        }
      });
    }
  }

  // Watch order for this production
  let selectedWatchOrder = null;
  const availableOrders = DB.watch_orders.filter((wo) => wo.anchor_production_id === prod.id && wo.is_published);

  if (watch_order) {
    selectedWatchOrder = DB.watch_orders.find((wo) => wo.slug === watch_order && wo.is_published) || null;
  } else if (availableOrders.length > 0) {
    selectedWatchOrder = availableOrders.find((wo) => wo.is_default) || availableOrders[0];
  }

  let watchOrderPayload = null;
  if (selectedWatchOrder) {
    const items = DB.watch_order_items
      .filter((woi) => woi.watch_order_id === selectedWatchOrder.id)
      .sort((a, b) => a.position - b.position)
      .map((item) => {
        const itemProd = DB.productions.find((p) => p.id === item.production_id);
        const startEp = DB.episodes.find((e) => e.id === item.start_episode_id);
        const endEp = DB.episodes.find((e) => e.id === item.end_episode_id);

        const count = (startEp && endEp) ? (endEp.episode_number - startEp.episode_number + 1) : 1;

        return {
          position: item.position,
          production: itemProd ? {
            id: itemProd.id,
            slug: itemProd.slug,
            title: itemProd.title,
            type: itemProd.type
          } : null,
          start_episode: startEp ? { id: startEp.id, episode_number: startEp.episode_number } : null,
          end_episode: endEp ? { id: endEp.id, episode_number: endEp.episode_number } : null,
          episode_count: count,
          note: item.note,
          is_optional: item.is_optional
        };
      });

    watchOrderPayload = {
      id: selectedWatchOrder.id,
      slug: selectedWatchOrder.slug,
      name: selectedWatchOrder.name,
      order_type: selectedWatchOrder.order_type,
      is_default: selectedWatchOrder.is_default,
      items
    };
  }

  // User state
  const bookmarks = getStoredBookmarks();
  const bookmark = bookmarks.find((b) => b.production_id === prod.id);
  const recentHistory = history
    .filter((h) => h.production_id === prod.id && !h.is_completed)
    .sort((a, b) => new Date(b.last_watched_at) - new Date(a.last_watched_at))[0];

  const userState = {
    bookmark_status: bookmark ? bookmark.status : null,
    resume_episode_id: recentHistory ? recentHistory.episode_id : null,
    resume_progress_seconds: recentHistory ? recentHistory.progress_seconds : null
  };

  return makeResponse({
    production: {
      id: prod.id,
      slug: prod.slug,
      title: prod.title,
      title_native: prod.title_native,
      title_romaji: prod.title_romaji,
      alternative_titles: prod.alternative_titles || [],
      type: prod.type,
      status: prod.status,
      synopsis: prod.synopsis,
      tagline: prod.tagline,
      poster_url: prod.poster_url,
      backdrop_url: prod.backdrop_url,
      trailer_url: prod.trailer_url,
      release_date: prod.release_date,
      end_date: prod.end_date,
      release_year: prod.release_year,
      total_episodes: Math.max(prod.total_episodes || 0, episodes.length),
      runtime_minutes: prod.runtime_minutes,
      age_rating: prod.age_rating,
      view_count: prod.view_count,
      parent_production: null,
      franchise: franchise ? { id: franchise.id, slug: franchise.slug, name: franchise.name } : null,
      additional_franchises: [],
      era: era ? { id: era.id, slug: era.slug, name: era.name } : null,
      genres,
      seo: {
        meta_title: prod.meta_title || `Nonton ${prod.title} Sub Indo`,
        meta_description: prod.meta_description || prod.synopsis,
        canonical_url: `https://tokuflix.id/series/${prod.slug}`
      }
    },
    episodes,
    related_productions: relatedProds,
    watch_order: watchOrderPayload,
    available_watch_orders: availableOrders.map((wo) => ({
      slug: wo.slug,
      name: wo.name,
      order_type: wo.order_type
    })),
    user_state: userState
  });
};

/**
 * 9. GET /api/v1/watch-orders/:slug
 */
export const getWatchOrderBySlug = async (slug) => {
  // 1. Coba request langsung dari browser via clientFetch
  try {
    const remote = await clientFetch(`/watch-orders/${slug}`, {
      cacheTtlMs: 180000
    });
    if (remote && remote.success && remote.data) {
      return remote;
    }
  } catch (err) {
    console.info(`[apiService] Remote /watch-orders/${slug} gagal, fallback ke data lokal:`, err.message);
  }

  // 2. Fallback data kanonikal lokal
  const wo = DB.watch_orders.find((w) => w.slug === slug && w.is_published);
  if (!wo) {
    return makeError('NOT_FOUND', `Watch order dengan slug "${slug}" tidak ditemukan.`, 404);
  }

  const franchise = DB.franchises.find((f) => f.id === wo.franchise_id) || null;
  const anchorProd = DB.productions.find((p) => p.id === wo.anchor_production_id) || null;

  const items = DB.watch_order_items
    .filter((woi) => woi.watch_order_id === wo.id)
    .sort((a, b) => a.position - b.position)
    .map((item) => {
      const prod = DB.productions.find((p) => p.id === item.production_id);
      const startEp = DB.episodes.find((e) => e.id === item.start_episode_id);
      const endEp = DB.episodes.find((e) => e.id === item.end_episode_id);
      const count = (startEp && endEp) ? (endEp.episode_number - startEp.episode_number + 1) : 1;

      return {
        position: item.position,
        production: prod ? {
          id: prod.id,
          slug: prod.slug,
          title: prod.title,
          type: prod.type,
          poster_url: prod.poster_url
        } : null,
        start_episode: startEp ? { id: startEp.id, episode_number: startEp.episode_number } : null,
        end_episode: endEp ? { id: endEp.id, episode_number: endEp.episode_number } : null,
        episode_count: count,
        note: item.note,
        is_optional: item.is_optional
      };
    });

  const totalEpisodes = items.reduce((acc, it) => acc + (it.episode_count || 1), 0);

  return makeResponse({
    id: wo.id,
    slug: wo.slug,
    name: wo.name,
    description: wo.description,
    order_type: wo.order_type,
    is_default: wo.is_default,
    franchise: franchise ? { slug: franchise.slug, name: franchise.name } : null,
    anchor_production: anchorProd ? { id: anchorProd.id, slug: anchorProd.slug, title: anchorProd.title } : null,
    total_episodes: totalEpisodes,
    items
  });
};

/**
 * 10. GET /api/v1/stream/:episode_id
 * Everything needed by the Video Player
 */
export const getStreamPayload = async (episodeId, { watch_order = null } = {}) => {
  // 1. Coba request langsung dari browser via clientFetch jika Base URL aktif
  try {
    const remote = await clientFetch(`/stream/${episodeId}`, {
      params: watch_order ? { watch_order } : null,
      cacheTtlMs: 30000
    });
    if (remote && remote.success && remote.data) {
      return remote;
    }
  } catch (err) {
    console.info(`[apiService] Remote /stream/${episodeId} gagal, fallback ke data lokal:`, err.message);
  }

  // 2. Fallback data scraper & kanonikal lokal
  // Check if requested episode is from live scraper
  if (typeof episodeId === 'string' && (episodeId.startsWith('scraped_') || scraperService.getEpisodeById(episodeId))) {
    const scrapedPayload = scraperService.buildStreamPayload(episodeId);
    if (scrapedPayload) {
      const history = getStoredHistory();
      const epHist = history.find((h) => h.episode_id === episodeId);
      scrapedPayload.resume = epHist ? {
        progress_seconds: epHist.progress_seconds,
        duration_seconds: epHist.duration_seconds,
        is_completed: epHist.is_completed,
        last_watched_at: epHist.last_watched_at
      } : null;
      return makeResponse(scrapedPayload);
    }
  }

  let ep = DB.episodes.find((e) => (e.id === episodeId || e.production_id === episodeId) && e.is_published) ||
           DB.episodes.find((e) => (e.id?.includes(episodeId) || e.production_id?.includes(episodeId)) && e.is_published);
  
  if (!ep) {
    const matchedProd = DB.productions.find((p) => 
      p.id === episodeId || 
      p.slug === episodeId || 
      (p.slug && episodeId.includes(p.slug)) ||
      (p.slug && episodeId.toLowerCase().includes(p.slug.toLowerCase()))
    );
    if (matchedProd) {
      ep = DB.episodes.find((e) => e.production_id === matchedProd.id && e.is_published);
    }
  }

  if (!ep) {
    return makeError('NOT_FOUND', `Episode tidak ditemukan atau belum dipublikasikan.`, 404);
  }

  const prod = DB.productions.find((p) => p.id === ep.production_id && p.is_published);
  if (!prod) {
    return makeError('NOT_FOUND', `Serial tidak ditemukan atau belum dipublikasikan.`, 404);
  }

  const franchise = DB.franchises.find((f) => f.id === prod.franchise_id);

  // Active Video Sources grouped by server_name
  let sources = DB.video_sources.filter((vs) => vs.episode_id === ep.id && vs.is_active);

  // 1. Cek apakah ada data episode asli dari scraper fansub TokusatsuIndo / Sawidago
  let matchedScraped = null;
  try {
    const allScraped = scraperService.getScrapedEpisodes();
    matchedScraped = allScraped.find((se) => isScrapedEpisodeMatch(se, prod, ep.episode_number));

    if (matchedScraped) {
      const QUALITY_TIERS = [
        { quality: '1440p', label: '1440p (2K Ultra QHD)', bitrate_kbps: 8500 },
        { quality: '1080p', label: '1080p (Full HD 60FPS)', bitrate_kbps: 5000 },
        { quality: '450p', label: '450p (SD Standar Bersih)', bitrate_kbps: 1500 },
        { quality: '360p', label: '360p (Hemat Data Ringan)', bitrate_kbps: 700 }
      ];

      // Auto-synthesize Google Drive servers if missing from matchedScraped.servers
      let serversToUse = [...(matchedScraped.servers || [])];
      const hasDriveInServers = serversToUse.some((s) => (s.embedUrl || s.directUrl || '').includes('drive.google.com'));
      if (!hasDriveInServers) {
        const id1 = (matchedScraped.driveDownloadUrl1 || '').match(/\/file\/d\/([a-zA-Z0-9_-]+)/)?.[1];
        const id2 = (matchedScraped.driveDownloadUrl2 || '').match(/\/file\/d\/([a-zA-Z0-9_-]+)/)?.[1];
        if (id1) {
          serversToUse.unshift({
            name: 'Server 1 (Google Drive Direct HD / 1440p)',
            embedUrl: `https://drive.google.com/file/d/${id1}/preview`,
            directUrl: `https://drive.google.com/file/d/${id1}/view?usp=sharing`,
            type: 'gdrive'
          });
        }
        if (id2 && id2 !== id1) {
          serversToUse.push({
            name: 'Server 2 (Mirror Direct HD / 1440p)',
            embedUrl: `https://drive.google.com/file/d/${id2}/preview`,
            directUrl: `https://drive.google.com/file/d/${id2}/view?usp=sharing`,
            type: 'gdrive'
          });
        }
      }

      if (serversToUse.length > 0) {
        const scrapedSources = [];
        serversToUse.forEach((srv, sIdx) => {
          QUALITY_TIERS.forEach((qt) => {
            scrapedSources.push({
              id: `scraped-srv-${ep.id}-${sIdx}-${qt.quality}`,
              episode_id: ep.id,
              server_name: srv.name || `Server ${sIdx + 1} (Direct HD / 1440p)`,
              source_type: srv.type || 'iframe',
              quality: qt.quality,
              label: qt.label,
              origin_url: srv.embedUrl || srv.directUrl,
              mime_type: null,
              bitrate_kbps: qt.bitrate_kbps,
              audio_language: 'ja',
              has_hardsub: true,
              hardsub_language: 'id',
              is_protected: false,
              priority: 1 + sIdx,
              is_active: true
            });
          });
        });
        // Prioritaskan server scraper aktif
        sources = scrapedSources;
      }
    }
  } catch (err) {
    console.warn('[apiService] Error checking scraped episode servers:', err);
  }

  // Bersihkan server fake/dummy yang memicu error
  sources = sources.filter((s) => {
    const u = s.origin_url || s.url || '';
    if (
      u.includes('preview_reiwa_toku') ||
      u.includes('_tokuflix_') ||
      u.includes('18U4M_preview') ||
      u.includes('doodstream.com') ||
      u.includes('streamwish.com')
    ) {
      return false;
    }
    return true;
  });

  const QUALITY_STANDARDS = [
    { quality: '1440p', label: '1440p (2K Ultra QHD)', bitrate_kbps: 8500 },
    { quality: '1080p', label: '1080p (Full HD 60FPS)', bitrate_kbps: 5000 },
    { quality: '450p', label: '450p (SD Standar Bersih)', bitrate_kbps: 1500 },
    { quality: '360p', label: '360p (Hemat Data Ringan)', bitrate_kbps: 700 }
  ];

  if (sources.length === 0) {
    // Generate resilient fallback sources across all 4 quality tiers
    const fallbackStream = "https://drive.google.com/file/d/1ZawtRzBvTNufMEWid4xcyOevN7r7z74o/preview";
    QUALITY_STANDARDS.forEach((qt) => {
      sources.push({
        id: `gen-src-demo-${ep.id}-${qt.quality}`,
        episode_id: ep.id,
        server_name: "Server 1 (Google Drive Direct HD / 1440p)",
        source_type: "gdrive",
        quality: qt.quality,
        label: qt.label,
        origin_url: fallbackStream,
        mime_type: null,
        bitrate_kbps: qt.bitrate_kbps,
        audio_language: "ja",
        has_hardsub: true,
        hardsub_language: "id",
        is_protected: false,
        priority: 1,
        is_active: true
      });
    });
  } else {
    // Pastikan setiap server memiliki lengkap 4 tier kualitas: 1440p, 1080p, 450p, 360p
    const serverNames = [...new Set(sources.map((s) => s.server_name))];
    const normalizedSources = [];

    serverNames.forEach((sName) => {
      const serverSources = sources.filter((s) => s.server_name === sName);
      const repSource = serverSources[0];

      QUALITY_STANDARDS.forEach((qt) => {
        const existing = serverSources.find((s) => s.quality === qt.quality);
        if (existing) {
          normalizedSources.push({
            ...existing,
            label: qt.label,
            bitrate_kbps: qt.bitrate_kbps
          });
        } else {
          normalizedSources.push({
            ...repSource,
            id: `${repSource.id || 'src'}_${qt.quality}`,
            quality: qt.quality,
            label: qt.label,
            bitrate_kbps: qt.bitrate_kbps
          });
        }
      });
    });

    sources = normalizedSources;
  }

  // Group by server_name
  const serverMap = {};
  sources.forEach((src) => {
    if (!serverMap[src.server_name]) {
      serverMap[src.server_name] = [];
    }
    serverMap[src.server_name].push({
      id: src.id,
      quality: src.quality,
      label: src.label || `${src.quality}`,
      source_type: src.source_type,
      mime_type: src.mime_type,
      url: src.origin_url,
      direct_url: src.direct_url,
      expires_at: src.is_protected ? new Date(Date.now() + 3600000).toISOString() : null,
      audio_language: src.audio_language,
      has_hardsub: src.has_hardsub,
      hardsub_language: src.hardsub_language,
      bitrate_kbps: src.bitrate_kbps
    });
  });

  const qualityRank = { '1440p': 1, '1080p': 2, '450p': 3, '360p': 4 };
  const servers = Object.keys(serverMap).map((sName) => ({
    server_name: sName,
    sources: serverMap[sName].sort((a, b) => (qualityRank[a.quality] || 99) - (qualityRank[b.quality] || 99))
  }));

  const allQualities = ['1440p', '1080p', '450p', '360p'].filter((q) =>
    sources.some((s) => s.quality === q)
  );

  // Subtitle Tracks
  let subs = DB.subtitle_tracks.filter((st) => st.episode_id === ep.id && st.is_active);
  if (subs.length === 0) {
    subs = [
      {
        id: `sub-id-${ep.id}`,
        episode_id: ep.id,
        language_code: "id",
        label: "Indonesia (Sub Indo)",
        format: "vtt",
        file_url: "https://cdn.example.com/subs/id.vtt",
        is_default: true,
        is_forced: false,
        translator_credit: "TokuIndo Fansub"
      },
      {
        id: `sub-en-${ep.id}`,
        episode_id: ep.id,
        language_code: "en",
        label: "English",
        format: "vtt",
        file_url: "https://cdn.example.com/subs/en.vtt",
        is_default: false,
        is_forced: false,
        translator_credit: "AnonRider Subs"
      }
    ];
  }

  // Navigation Logic (Section 6.4 of 01_DATABASE_ARCHITECTURE)
  const allProdEpisodes = DB.episodes
    .filter((e) => e.production_id === prod.id && e.is_published)
    .sort((a, b) => a.episode_number - b.episode_number);

  const curIndex = allProdEpisodes.findIndex((e) => e.id === ep.id);
  const prevEp = curIndex > 0 ? allProdEpisodes[curIndex - 1] : null;
  const nextTvEp = curIndex < allProdEpisodes.length - 1 ? allProdEpisodes[curIndex + 1] : null;

  // Chronological Next Episode Resolution
  let nextChronological = null;
  let activeOrderSlug = watch_order;

  // Find chronological watch order that covers this production
  const matchingOrder = DB.watch_orders.find(
    (wo) => (watch_order ? wo.slug === watch_order : wo.anchor_production_id === prod.id) && wo.is_published
  );

  if (matchingOrder) {
    activeOrderSlug = matchingOrder.slug;
    const items = DB.watch_order_items
      .filter((woi) => woi.watch_order_id === matchingOrder.id)
      .sort((a, b) => a.position - b.position);

    // Find segment covering current episode
    for (let i = 0; i < items.length; i++) {
      const seg = items[i];
      if (seg.production_id === prod.id) {
        const startEp = DB.episodes.find((e) => e.id === seg.start_episode_id);
        const endEp = DB.episodes.find((e) => e.id === seg.end_episode_id);

        if (startEp && endEp && ep.episode_number >= startEp.episode_number && ep.episode_number <= endEp.episode_number) {
          // If still within segment range
          if (ep.episode_number < endEp.episode_number) {
            const nextInSeg = DB.episodes.find(
              (e) => e.production_id === prod.id && e.episode_number === ep.episode_number + 1 && e.is_published
            );
            if (nextInSeg) {
              nextChronological = {
                episode_id: nextInSeg.id,
                production_id: prod.id,
                production_slug: prod.slug,
                production_type: prod.type,
                episode_number: nextInSeg.episode_number,
                kind: nextInSeg.kind,
                title: nextInSeg.title,
                thumbnail_url: nextInSeg.thumbnail_url,
                reason: "same_segment"
              };
            }
          } else if (i < items.length - 1) {
            // Segment boundary reached! Point to next segment (e.g. Movie after Ep 15!)
            const nextSeg = items[i + 1];
            const nextSegProd = DB.productions.find((p) => p.id === nextSeg.production_id);
            const nextSegStartEp = DB.episodes.find((e) => e.id === nextSeg.start_episode_id);

            if (nextSegProd && nextSegStartEp) {
              nextChronological = {
                episode_id: nextSegStartEp.id,
                production_id: nextSegProd.id,
                production_slug: nextSegProd.slug,
                production_type: nextSegProd.type,
                episode_number: nextSegStartEp.episode_number,
                kind: nextSegStartEp.kind,
                title: nextSegStartEp.title,
                thumbnail_url: nextSegStartEp.thumbnail_url,
                reason: "watch_order_segment_boundary"
              };
            }
          }
          break;
        }
      }
    }
  }

  // Fallback to next TV episode if chronological didn't resolve
  if (!nextChronological && nextTvEp) {
    nextChronological = {
      episode_id: nextTvEp.id,
      production_id: prod.id,
      production_slug: prod.slug,
      production_type: prod.type,
      episode_number: nextTvEp.episode_number,
      kind: nextTvEp.kind,
      title: nextTvEp.title,
      thumbnail_url: nextTvEp.thumbnail_url,
      reason: "next_tv_episode"
    };
  }

  // User resume progress
  const history = getStoredHistory();
  const epHist = history.find((h) => h.episode_id === ep.id);

  return makeResponse({
    episode: {
      id: ep.id,
      episode_number: ep.episode_number,
      slug: ep.slug,
      kind: ep.kind,
      title: ep.title,
      synopsis: ep.synopsis,
      thumbnail_url: ep.thumbnail_url,
      duration_seconds: ep.duration_seconds,
      air_date: ep.air_date,
      skip_markers: {
        intro_start_seconds: ep.intro_start_seconds,
        intro_end_seconds: ep.intro_end_seconds,
        outro_start_seconds: ep.outro_start_seconds
      }
    },
    production: {
      id: prod.id,
      slug: prod.slug,
      title: prod.title,
      type: prod.type,
      poster_url: prod.poster_url,
      franchise: franchise ? { slug: franchise.slug, name: franchise.name } : null
    },
    video_sources: {
      default_source_id: sources[0]?.id || null,
      servers,
      available_qualities: allQualities
    },
    subtitle_tracks: subs.map((s) => ({
      id: s.id,
      language_code: s.language_code,
      label: s.label,
      format: s.format,
      url: s.file_url,
      is_default: s.is_default,
      is_forced: s.is_forced,
      translator_credit: s.translator_credit
    })),
    navigation: {
      watch_order_slug: activeOrderSlug,
      previous_episode: prevEp ? {
        episode_id: prevEp.id,
        production_id: prod.id,
        production_slug: prod.slug,
        production_type: prod.type,
        episode_number: prevEp.episode_number,
        kind: prevEp.kind,
        title: prevEp.title,
        thumbnail_url: prevEp.thumbnail_url,
        reason: "previous_tv_episode"
      } : null,
      next_episode_chronological: nextChronological,
      next_episode_tv_only: nextTvEp ? {
        episode_id: nextTvEp.id,
        production_id: prod.id,
        production_slug: prod.slug,
        production_type: prod.type,
        episode_number: nextTvEp.episode_number,
        kind: nextTvEp.kind,
        title: nextTvEp.title,
        thumbnail_url: nextTvEp.thumbnail_url,
        reason: "next_tv_episode"
      } : null,
      next_episode: nextChronological || (nextTvEp ? {
        episode_id: nextTvEp.id,
        production_id: prod.id,
        production_slug: prod.slug,
        production_type: prod.type,
        episode_number: nextTvEp.episode_number,
        kind: nextTvEp.kind,
        title: nextTvEp.title,
        thumbnail_url: nextTvEp.thumbnail_url,
        reason: "next_tv_episode"
      } : null)
    },
    resume: epHist ? {
      progress_seconds: epHist.progress_seconds,
      duration_seconds: epHist.duration_seconds,
      is_completed: epHist.is_completed,
      last_watched_at: epHist.last_watched_at
    } : null,
    scraped_metadata: matchedScraped ? {
      drive_download_1: matchedScraped.driveDownloadUrl1 || matchedScraped.servers?.[0]?.directUrl || null,
      drive_download_2: matchedScraped.driveDownloadUrl2 || matchedScraped.servers?.[1]?.directUrl || null
    } : null
  });
};

/**
 * 11. POST /api/v1/stream/sources/:source_id/refresh
 */
export const refreshStreamSource = async (sourceId) => {
  return makeResponse({
    id: sourceId,
    url: `https://stream.example.com/hls/refresh_${sourceId}.m3u8?token=fresh_token_${Date.now()}&expires=3600`,
    expires_at: new Date(Date.now() + 3600000).toISOString()
  });
};

/**
 * 12. POST /api/v1/user/history
 * Autosave player position (real watch tracking with client-side persistence)
 */
export const postUserHistory = async ({ 
  episode_id, 
  progress_seconds, 
  duration_seconds, 
  is_completed = false,
  series_title,
  episode_title,
  episode_number,
  poster_url,
  backdrop_url,
  production_id
}) => {
  const ep = DB.episodes.find((e) => e.id === episode_id);
  const prod = ep ? DB.productions.find((p) => p.id === ep.production_id) : null;
  const scrapedEp = !ep && typeof scraperService !== 'undefined' ? scraperService.getEpisodeById(episode_id) : null;

  const totalDuration = duration_seconds || (ep ? ep.duration_seconds : 1440);
  const completed = is_completed || (totalDuration > 0 && progress_seconds / totalDuration >= 0.92);

  const resolvedSeriesTitle = series_title || (prod ? prod.title : (scrapedEp ? scrapedEp.seriesTitle : 'Serial Tokusatsu'));
  const resolvedEpisodeTitle = episode_title || (ep ? ep.title : (scrapedEp ? scrapedEp.title : `Episode ${episode_number || 1}`));
  const resolvedEpisodeNumber = episode_number || (ep ? ep.episode_number : (scrapedEp ? scrapedEp.episodeNumber : 1));
  const resolvedPoster = backdrop_url || poster_url || (prod ? (prod.backdrop_url || prod.poster_url) : (scrapedEp ? scrapedEp.thumbnail : null));
  const resolvedProductionId = production_id || (prod ? prod.id : (scrapedEp ? scrapedEp.productionId : 'unknown'));

  const history = getStoredHistory();
  const existingIdx = history.findIndex((h) => h.episode_id === episode_id);

  const record = {
    episode_id,
    production_id: resolvedProductionId,
    episode_number: resolvedEpisodeNumber,
    episode_title: resolvedEpisodeTitle,
    series_title: resolvedSeriesTitle,
    poster_url: resolvedPoster,
    backdrop_url: resolvedPoster,
    progress_seconds: Math.round(progress_seconds || 0),
    duration_seconds: Math.round(totalDuration),
    is_completed: completed,
    last_watched_at: new Date().toISOString()
  };

  if (existingIdx !== -1) {
    history[existingIdx] = record;
  } else {
    history.unshift(record);
  }

  setStoredHistory(history.slice(0, 50));

  // Background sync langsung dari browser ke API streaming jika Base URL aktif
  clientFetch('/user/history', {
    method: 'POST',
    body: { episode_id, progress_seconds: record.progress_seconds, duration_seconds: totalDuration, is_completed: completed }
  }).catch(() => {});

  return makeResponse({
    episode_id,
    production_id: record.production_id,
    progress_seconds: record.progress_seconds,
    duration_seconds: record.duration_seconds,
    is_completed: completed,
    last_watched_at: record.last_watched_at
  });
};

/**
 * 13. GET /api/v1/user/history
 */
export const getUserHistory = async ({ production_id = null, completed = null, page = 1, per_page = 24 } = {}) => {
  let list = getStoredHistory();

  if (production_id) {
    list = list.filter((h) => h.production_id === production_id);
  }
  if (completed !== null) {
    list = list.filter((h) => h.is_completed === completed);
  }

  const total = list.length;
  const totalPages = Math.ceil(total / per_page) || 1;
  const start = (page - 1) * per_page;
  const pagedList = list.slice(start, start + per_page).map((item) => ({
    episode: {
      id: item.episode_id,
      episode_number: item.episode_number,
      title: item.episode_title,
      thumbnail_url: item.poster_url,
      duration_seconds: item.duration_seconds
    },
    production: {
      id: item.production_id,
      title: item.series_title,
      poster_url: item.poster_url,
      backdrop_url: item.backdrop_url || item.poster_url
    },
    progress_seconds: item.progress_seconds,
    duration_seconds: item.duration_seconds,
    percent_complete: item.duration_seconds ? Number(((item.progress_seconds / item.duration_seconds) * 100).toFixed(2)) : 0,
    is_completed: item.is_completed,
    last_watched_at: item.last_watched_at
  }));

  return makeResponse(pagedList, {
    page,
    per_page,
    total_items: total,
    total_pages: totalPages,
    has_next: page < totalPages,
    has_prev: page > 1
  });
};

/**
 * 14. DELETE /api/v1/user/history/:episode_id
 */
export const deleteUserHistory = async (episodeId) => {
  const history = getStoredHistory();
  const filtered = history.filter((h) => h.episode_id !== episodeId);
  setStoredHistory(filtered);

  // Background sync langsung dari browser ke API streaming
  clientFetch(`/user/history/${episodeId}`, { method: 'DELETE' }).catch(() => {});

  return { success: true, status: 204 };
};

/**
 * 14b. DELETE /api/v1/user/history (Clear all history)
 */
export const clearAllUserHistory = async () => {
  setStoredHistory([]);
  clientFetch('/user/history', { method: 'DELETE' }).catch(() => {});
  return { success: true, status: 204 };
};

/**
 * 15. GET /api/v1/user/bookmarks
 */
export const getUserBookmarks = async ({ status = null } = {}) => {
  // 1. Coba request langsung dari browser via clientFetch jika token/endpoint tersedia
  try {
    const remote = await clientFetch('/user/bookmarks', {
      params: status ? { status } : null,
      cacheTtlMs: 15000
    });
    if (remote && remote.success && remote.data) {
      return remote;
    }
  } catch (err) {
    // silently fallback to localStorage
  }

  // 2. Fallback data localStorage tersimpan di browser
  let bookmarks = getStoredBookmarks();

  if (status) {
    bookmarks = bookmarks.filter((b) => b.status === status);
  }

  const data = bookmarks.map((b) => {
    const prod = DB.productions.find((p) => p.id === b.production_id) || {
      id: b.production_id,
      slug: 'series',
      title: b.title,
      poster_url: b.poster_url,
      release_year: 2024
    };

    return {
      status: b.status,
      created_at: b.created_at,
      updated_at: b.updated_at,
      production: formatProductionCard(prod)
    };
  });

  return makeResponse(data);
};

/**
 * 16. POST /api/v1/user/bookmarks
 */
export const postUserBookmark = async ({ production_id, status = 'plan_to_watch' }) => {
  const bookmarks = getStoredBookmarks();
  const existingIdx = bookmarks.findIndex((b) => b.production_id === production_id);
  const now = new Date().toISOString();

  if (existingIdx !== -1) {
    bookmarks[existingIdx].status = status;
    bookmarks[existingIdx].updated_at = now;
  } else {
    const prod = DB.productions.find((p) => p.id === production_id);
    bookmarks.unshift({
      production_id,
      title: prod ? prod.title : 'Tokusatsu',
      poster_url: prod ? prod.poster_url : null,
      status,
      created_at: now,
      updated_at: now
    });
  }

  setStoredBookmarks(bookmarks);

  // Background sync langsung dari browser ke API streaming
  clientFetch('/user/bookmarks', {
    method: 'POST',
    body: { production_id, status }
  }).catch(() => {});

  return makeResponse({ production_id, status });
};

/**
 * 17. DELETE /api/v1/user/bookmarks/:production_id
 */
export const deleteUserBookmark = async (productionId) => {
  const bookmarks = getStoredBookmarks();
  const filtered = bookmarks.filter((b) => b.production_id !== productionId);
  setStoredBookmarks(filtered);

  // Background sync langsung dari browser ke API streaming
  clientFetch(`/user/bookmarks/${productionId}`, { method: 'DELETE' }).catch(() => {});

  return { success: true, status: 204 };
};

/**
 * 18. User Auth & Session Management
 */
export const getCurrentUser = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.USER);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch {
    // fallback
  }
  return DB.users[0];
};

export const getAuthToken = () => {
  try {
    return localStorage.getItem(STORAGE_KEYS.TOKEN);
  } catch {
    return null;
  }
};

export const getAuthSession = () => {
  try {
    const rawUser = localStorage.getItem(STORAGE_KEYS.USER);
    const token = localStorage.getItem(STORAGE_KEYS.TOKEN);
    if (rawUser && token) {
      const user = JSON.parse(rawUser);
      const is48hExpired = isUserInactive48Hours(user.id);
      return {
        isAuthenticated: true,
        user,
        token,
        is48hExpired
      };
    }
  } catch {
    // fallback
  }
  return {
    isAuthenticated: false,
    user: null,
    token: null,
    is48hExpired: false
  };
};

export const loginUser = async ({ id, name, email, avatar_url, token } = {}) => {
  const user = {
    id: id || DB.users[0].id,
    name: name || DB.users[0].name,
    email: email || DB.users[0].email,
    avatar_url: avatar_url || DB.users[0].avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'
  };
  const authToken = token || `tok_sess_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

  try {
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
    localStorage.setItem(STORAGE_KEYS.TOKEN, authToken);
  } catch (err) {
    console.warn('[apiService] Gagal menyimpan auth user:', err);
  }

  // Catat waktu aktivitas / autentikasi terakhir
  recordUserActivity(user.id);

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('tokuflix:auth_changed', { detail: { user, action: 'login' } }));
  }

  return makeResponse({ user, token: authToken });
};

export const logoutUser = async () => {
  let activeUserId = null;
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.USER);
    if (raw) {
      const u = JSON.parse(raw);
      activeUserId = u.id;
    }
  } catch {
    // fallback
  }

  // 1. Batalkan semua request yang masih berjalan (in-flight)
  const abortedRequestsCount = abortAllInFlightRequests();

  // 2. Hapus cache privat yang hanya berlaku untuk sesi pengguna tersebut
  const clearedPrivateCount = clearUserPrivateCache(activeUserId);

  // 3. Hapus data sementara terkait sesi
  const clearedSessionCount = cleanupSessionCache();

  // 4. Hapus access token dan data autentikasi lokal
  try {
    localStorage.removeItem(STORAGE_KEYS.USER);
    localStorage.removeItem(STORAGE_KEYS.TOKEN);
  } catch (err) {
    console.warn('[apiService] Gagal menghapus auth tokens:', err);
  }

  // PENTING: Pertahankan tokuflix_watch_history & tokuflix_user_bookmarks!
  // PENTING: Pertahankan public-cache yang masih valid!

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('tokuflix:auth_changed', { detail: { user: null, action: 'logout' } }));
  }

  return makeResponse({
    logged_out: true,
    aborted_requests: abortedRequestsCount,
    cleared_private_cache_items: clearedPrivateCount,
    cleared_session_cache_items: clearedSessionCount
  });
};

/**
 * 19. GET /api/v1/scraper/releases
 * Rilis Live Fansub Hasil Scraping Tokusatsu Sub Indo
 */
export const getScrapedReleases = async () => {
  // 1. Coba request langsung dari browser via clientFetch jika Base URL aktif
  try {
    const remote = await clientFetch('/scraper/releases', { cacheTtlMs: 60000 });
    if (remote && remote.success && remote.data) {
      return remote;
    }
  } catch (err) {
    console.info('[apiService] Remote /scraper/releases gagal, fallback ke data lokal:', err.message);
  }

  // 2. Fallback data scraper lokal
  const episodes = scraperService.getScrapedEpisodes();
  return makeResponse(episodes, {
    total: episodes.length,
    page: 1,
    per_page: episodes.length,
    total_pages: 1
  });
};

/**
 * 20. GET /api/v1/scraper/status
 * Status & Health Scraper Tokusatsu Fansub
 */
export const getScraperStatus = async () => {
  // 1. Coba request langsung dari browser via clientFetch jika Base URL aktif
  try {
    const remote = await clientFetch('/scraper/status', { cacheTtlMs: 60000 });
    if (remote && remote.success && remote.data) {
      return remote;
    }
  } catch (err) {
    console.info('[apiService] Remote /scraper/status gagal, fallback ke data lokal:', err.message);
  }

  // 2. Fallback metadata scraper lokal
  const meta = scraperService.getMetadata();
  return makeResponse(meta);
};

