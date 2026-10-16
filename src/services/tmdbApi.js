// Service Client untuk TMDB (The Movie Database) API v3
// Digunakan untuk menarik metadata, poster resmi, episode list secara live

const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const STORAGE_KEY = 'tokuflix_tmdb_api_key';

export const getStoredApiKey = () => {
  return localStorage.getItem(STORAGE_KEY) || import.meta.env.VITE_TMDB_API_KEY || '';
};

export const saveStoredApiKey = (key) => {
  if (!key) {
    localStorage.removeItem(STORAGE_KEY);
  } else {
    localStorage.setItem(STORAGE_KEY, key.trim());
  }
};

/**
 * Validasi apakah API Key TMDB valid dengan memanggil endpoint /configuration
 */
export const testTmdbApiKey = async (apiKey) => {
  const key = apiKey || getStoredApiKey();
  if (!key) {
    return { success: false, message: 'API Key TMDB belum diisi.' };
  }

  try {
    const response = await fetch(`${TMDB_BASE_URL}/configuration?api_key=${key}`);
    const data = await response.json();

    if (response.ok && data.images) {
      return { 
        success: true, 
        message: 'Koneksi ke TMDB API v3 berhasil!',
        secureBaseUrl: data.images.secure_base_url
      };
    } else {
      return { 
        success: false, 
        message: data.status_message || 'API Key TMDB tidak valid.' 
      };
    }
  } catch (error) {
    return { 
      success: false, 
      message: 'Gagal menghubungi server TMDB. Periksa koneksi internet.' 
    };
  }
};

/**
 * Cari serial atau film Tokusatsu di TMDB
 */
export const searchTmdbTokusatsu = async (query, apiKey = getStoredApiKey()) => {
  if (!apiKey || !query.trim()) return [];

  try {
    const url = `${TMDB_BASE_URL}/search/tv?api_key=${apiKey}&query=${encodeURIComponent(query)}&language=id-ID&include_adult=false`;
    const response = await fetch(url);
    if (!response.ok) return [];

    const data = await response.json();
    return (data.results || []).map((item) => formatTmdbSeries(item));
  } catch (error) {
    console.error('Error searching TMDB:', error);
    return [];
  }
};

/**
 * Ambil detail lengkap serial dari TMDB
 */
export const fetchTmdbSeriesDetails = async (tvId, apiKey = getStoredApiKey()) => {
  if (!apiKey || !tvId) return null;

  try {
    const url = `${TMDB_BASE_URL}/tv/${tvId}?api_key=${apiKey}&language=id-ID&append_to_response=credits,videos`;
    const response = await fetch(url);
    if (!response.ok) return null;

    const data = await response.json();
    return formatTmdbSeriesDetail(data);
  } catch (error) {
    console.error('Error fetching series detail:', error);
    return null;
  }
};

/**
 * Ambil daftar episode satu musim dari TMDB
 */
export const fetchTmdbSeasonEpisodes = async (tvId, seasonNumber = 1, apiKey = getStoredApiKey()) => {
  if (!apiKey || !tvId) return [];

  try {
    const url = `${TMDB_BASE_URL}/tv/${tvId}/season/${seasonNumber}?api_key=${apiKey}&language=id-ID`;
    const response = await fetch(url);
    if (!response.ok) return [];

    const data = await response.json();
    return (data.episodes || []).map((ep) => ({
      epNumber: ep.episode_number,
      title: ep.name || `Episode ${ep.episode_number}`,
      duration: ep.runtime ? `${ep.runtime}m` : '24m',
      synopsis: ep.overview || 'Sinopsis episode belum tersedia dalam bahasa Indonesia.',
      stillPath: ep.still_path ? `https://image.tmdb.org/t/p/w500${ep.still_path}` : null,
      airDate: ep.air_date,
      servers: [
        { name: 'Server 1 (DoodStream HD)', url: `https://doodstream.com/e/toku_${tvId}_${ep.episode_number}`, isDefault: true },
        { name: 'Server 2 (StreamWish FHD)', url: `https://streamwish.com/e/toku_${tvId}_${ep.episode_number}` },
        { name: 'Server 3 (Streamtape)', url: `https://streamtape.com/e/toku_${tvId}_${ep.episode_number}` }
      ],
      downloads: [
        { quality: '1080p FHD', links: [{ host: 'Google Drive', url: '#' }, { host: 'Pixeldrain', url: '#' }] },
        { quality: '720p HD', links: [{ host: 'Google Drive', url: '#' }] }
      ]
    }));
  } catch (error) {
    console.error('Error fetching episodes:', error);
    return [];
  }
};

// Formatter Helpers
function formatTmdbSeries(item) {
  let franchise = 'Lainnya';
  const name = item.name || '';
  if (name.toLowerCase().includes('kamen rider')) franchise = 'Kamen Rider';
  else if (name.toLowerCase().includes('sentai') || name.toLowerCase().includes('ranger')) franchise = 'Super Sentai';
  else if (name.toLowerCase().includes('ultraman')) franchise = 'Ultraman';
  else if (name.toLowerCase().includes('garo')) franchise = 'Garo';

  return {
    id: `tmdb-${item.id}`,
    tmdbId: item.id,
    title: item.name,
    japaneseTitle: item.original_name,
    franchise,
    era: 'Modern',
    year: item.first_air_date ? new Date(item.first_air_date).getFullYear() : 2024,
    status: 'Tersedia',
    totalEpisodes: item.episode_count || 48,
    currentEpisode: item.episode_count || 48,
    rating: item.vote_average ? Number(item.vote_average.toFixed(1)) : 8.0,
    quality: '1080p FHD',
    fansub: 'TMDB Live Sync',
    studio: 'Toei / Tsuburaya',
    featured: false,
    backdropUrl: item.backdrop_path ? `https://image.tmdb.org/t/p/original${item.backdrop_path}` : null,
    posterUrl: item.poster_path ? `https://image.tmdb.org/t/p/w600_and_h900_bestv2${item.poster_path}` : null,
    tags: [franchise, 'Action', 'Henshin'],
    synopsis: item.overview || 'Sinopsis belum tersedia dari TMDB.',
    episodes: []
  };
}

function formatTmdbSeriesDetail(data) {
  const formatted = formatTmdbSeries(data);
  formatted.totalEpisodes = data.number_of_episodes || 48;
  formatted.status = data.status === 'Ended' ? 'Tamat' : 'Ongoing';
  formatted.cast = (data.credits?.cast || []).slice(0, 5).map((c) => ({
    name: c.name,
    role: c.character
  }));
  return formatted;
}
