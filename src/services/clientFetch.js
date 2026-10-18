// src/services/clientFetch.js
// Client-Side HTTP Fetching Engine with Smart Cache Integration, In-Flight Abort, Deduplication & CORS Diagnostics
// Mengambil data streaming & katalog langsung dari browser pengguna tanpa melalui perantara server backend

import { 
  CACHE_CATEGORIES, 
  getCacheItem, 
  setCacheItem, 
  cleanupExpiredCache, 
  cleanupSessionCache, 
  recordUserActivity, 
  getCurrentTime 
} from './cacheManager.js';

const STORAGE_KEYS = {
  API_BASE_URL: 'tokuflix_api_base_url',
  AUTH_TOKEN: 'tokuflix_auth_token',
  AUTH_USER: 'tokuflix_auth_user'
};

// Default Base URL dari frontend environment variable (aman dipublikasikan)
const DEFAULT_API_BASE_URL = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_BASE_URL ? import.meta.env.VITE_API_BASE_URL : '').replace(/\/+$/, '');

// In-flight request de-duplication map (URL -> active Promise)
const inFlightRequests = new Map();

// In-flight AbortController map (URL -> active AbortController)
const inFlightControllers = new Map();

/**
 * Mendapatkan API Base URL aktif (LocalStorage override atau Vite Env)
 */
export const getApiBaseUrl = () => {
  try {
    const custom = localStorage.getItem(STORAGE_KEYS.API_BASE_URL);
    if (custom !== null && custom !== undefined) return custom.trim().replace(/\/+$/, '');
  } catch {
    // fallback
  }
  return DEFAULT_API_BASE_URL;
};

/**
 * Mengubah API Base URL aktif secara dinamis di runtime (dari API Explorer / Settings)
 */
export const setApiBaseUrl = (url) => {
  try {
    if (!url) {
      localStorage.removeItem(STORAGE_KEYS.API_BASE_URL);
    } else {
      localStorage.setItem(STORAGE_KEYS.API_BASE_URL, url.trim().replace(/\/+$/, ''));
    }
    // Bersihkan cache jika base URL berubah
    clearClientCache();
  } catch (err) {
    console.warn('Gagal menyimpan API Base URL ke localStorage:', err);
  }
};

/**
 * Membatalkan seluruh request HTTP client-side yang sedang berjalan (in-flight)
 * Dipanggil saat LOGOUT atau pembersihan sesi pengguna
 */
export const abortAllInFlightRequests = () => {
  let count = 0;
  for (const [key, controller] of inFlightControllers.entries()) {
    try {
      controller.abort();
      count++;
    } catch {
      // ignore
    }
  }
  inFlightControllers.clear();
  inFlightRequests.clear();
  return count;
};

/**
 * Bersihkan seluruh cache sementara client-side
 */
export const clearClientCache = () => {
  cleanupSessionCache();
  cleanupExpiredCache();
};

/**
 * Helper untuk membangun query string dari object
 */
export const buildQueryString = (params = {}) => {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, val]) => {
    if (val !== null && val !== undefined && val !== '') {
      query.append(key, String(val));
    }
  });
  const qs = query.toString();
  return qs ? `?${qs}` : '';
};

/**
 * Client-Side HTTP Fetcher
 * - Melakukan HTTP Request langsung dari browser pengguna
 * - Mengintegrasikan Smart Cache Manager (Public / Session / Private)
 * - Mencegah duplikasi in-flight request
 * - Mendukung timeout dan pembatalan segera saat logout via AbortController
 * - Menangani retry dengan exponential backoff
 */
export async function clientFetch(endpoint, options = {}) {
  const {
    method = 'GET',
    params = null,
    body = null,
    headers = {},
    timeoutMs = 8000,
    retries = method === 'GET' ? 2 : 0,
    cacheTtlMs = 60000, // Default 1 menit untuk GET
    skipCache = false,
    category: explicitCategory = null,
    userId: explicitUserId = null,
    customBaseUrl = null
  } = options;

  const baseUrl = customBaseUrl !== null ? customBaseUrl : getApiBaseUrl();
  const queryString = params ? buildQueryString(params) : '';
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;

  // Deteksi user aktif untuk namespacing cache privat
  let activeUserId = explicitUserId;
  if (!activeUserId) {
    try {
      const uStr = localStorage.getItem(STORAGE_KEYS.AUTH_USER);
      if (uStr) {
        const u = JSON.parse(uStr);
        if (u?.id) activeUserId = u.id;
      }
    } catch {
      // fallback
    }
  }

  // Tentukan kategori cache berdasarkan route / options
  let category = explicitCategory;
  if (!category) {
    if (cleanEndpoint.startsWith('/user/') || cleanEndpoint.startsWith('/auth/')) {
      category = CACHE_CATEGORIES.PRIVATE;
    } else {
      category = CACHE_CATEGORIES.PUBLIC;
    }
  }

  // Jika tidak ada baseUrl yang diset, kembalikan sinyal agar menggunakan local canonical data
  if (!baseUrl) {
    return {
      success: false,
      isNoBaseUrl: true,
      message: 'Base URL API belum dikonfigurasi (menggunakan data lokal)'
    };
  }

  const fullUrl = `${baseUrl}${cleanEndpoint}${queryString}`;
  const cacheKey = `${method}:${fullUrl}:${activeUserId || 'anon'}`;

  // 1. Cek Smart Cache (L1 Memory / L2 Persistent) jika GET & !skipCache
  if (method === 'GET' && !skipCache && cacheTtlMs > 0) {
    const cached = getCacheItem(fullUrl, category, activeUserId);
    if (cached && cached.data) {
      return {
        ...cached.data,
        _fromCache: true,
        _cacheCategory: category,
        _cacheTier: cached.from,
        _cacheAgeMs: Math.max(0, getCurrentTime() - (cached.cachedAt || getCurrentTime()))
      };
    }
  }

  // 2. Cek In-Flight Request Deduplication (mencegah request ganda simultan ke endpoint sama)
  if (method === 'GET' && inFlightRequests.has(cacheKey)) {
    return inFlightRequests.get(cacheKey);
  }

  // Eksekusi request dengan retry & timeout
  const executeRequest = async () => {
    let lastError = null;

    for (let attempt = 0; attempt <= retries; attempt++) {
      const controller = new AbortController();
      inFlightControllers.set(cacheKey, controller);

      const timer = setTimeout(() => controller.abort(), timeoutMs);

      try {
        const reqHeaders = {
          'Accept': 'application/json',
          ...headers
        };

        // Sertakan token autentikasi jika tersimpan di browser
        const authToken = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
        if (authToken && !reqHeaders['Authorization']) {
          reqHeaders['Authorization'] = `Bearer ${authToken}`;
        }

        if (body && !reqHeaders['Content-Type']) {
          reqHeaders['Content-Type'] = 'application/json';
        }

        const fetchOptions = {
          method,
          headers: reqHeaders,
          signal: controller.signal,
          mode: 'cors', // Pastikan request CORS langsung dari browser
          credentials: 'same-origin'
        };

        if (body) {
          fetchOptions.body = typeof body === 'string' ? body : JSON.stringify(body);
        }

        const response = await fetch(fullUrl, fetchOptions);
        clearTimeout(timer);

        // Parse Response JSON
        let data = null;
        const contentType = response.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
          data = await response.json();
        } else {
          const text = await response.text();
          try {
            data = JSON.parse(text);
          } catch {
            data = { text };
          }
        }

        if (!response.ok) {
          const statusError = new Error(data?.error?.message || `HTTP ${response.status}: ${response.statusText}`);
          statusError.status = response.status;
          statusError.data = data;
          
          if (response.status >= 500 && attempt < retries) {
            lastError = statusError;
            await new Promise((res) => setTimeout(res, 300 * Math.pow(2, attempt)));
            continue;
          }
          throw statusError;
        }

        // Catat aktivitas jika request berhasil
        if (activeUserId) {
          recordUserActivity(activeUserId);
        }

        // Simpan ke Smart Cache jika GET & cacheTtlMs > 0
        if (method === 'GET' && cacheTtlMs > 0) {
          setCacheItem(fullUrl, data, category, {
            userId: activeUserId,
            ttlMs: cacheTtlMs
          });
        }

        return {
          ...data,
          _networkDirect: true,
          _url: fullUrl,
          _status: response.status
        };

      } catch (err) {
        clearTimeout(timer);

        let isCors = false;
        let isTimeout = false;

        if (err.name === 'AbortError') {
          isTimeout = true;
          err.message = `Request timeout atau dibatalkan ke ${fullUrl}`;
        } else if (err instanceof TypeError && err.message.toLowerCase().includes('failed to fetch')) {
          isCors = true;
          err.isCorsError = true;
          err.corsDiagnostic = {
            targetUrl: fullUrl,
            origin: typeof window !== 'undefined' ? window.location.origin : 'unknown',
            note: 'Request diblokir oleh kebijakan CORS browser atau server tidak mengirim header Access-Control-Allow-Origin.'
          };
        }

        lastError = err;

        if (!isTimeout && !isCors && attempt < retries) {
          await new Promise((res) => setTimeout(res, 300 * Math.pow(2, attempt)));
          continue;
        }

        break;
      } finally {
        inFlightControllers.delete(cacheKey);
      }
    }

    throw lastError;
  };

  if (method === 'GET') {
    const promise = executeRequest().finally(() => {
      inFlightRequests.delete(cacheKey);
    });
    inFlightRequests.set(cacheKey, promise);
    return promise;
  }

  return executeRequest();
}
