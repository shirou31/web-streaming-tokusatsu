// src/services/cacheManager.js
// Smart Cache Management & Automatic User Data Cleanup Engine
// Mengelola Public Cache, Session Cache, dan Private User Cache (48-Hour Inactivity TTL & Safe Logout Cleanup)

export const CACHE_CATEGORIES = {
  PUBLIC: 'public-cache',       // Katalog publik, metadata serial/film, kategori
  SESSION: 'session-cache',     // Data sesi sementara, ephemeral state
  PRIVATE: 'private-cache',     // Data privat pengguna (namespaced per userId)
  STATIC: 'static-cache'        // Resource konfigurasi statis frontend
};

// 48 Jam dalam Milidetik (48 * 60 * 60 * 1000)
export const TTL_48_HOURS_MS = 48 * 60 * 60 * 1000;

// Default TTL untuk kategori lain
export const DEFAULT_TTLS = {
  [CACHE_CATEGORIES.PUBLIC]: 24 * 60 * 60 * 1000,    // 24 jam untuk katalog publik
  [CACHE_CATEGORIES.SESSION]: 2 * 60 * 60 * 1000,     // 2 jam untuk data sesi
  [CACHE_CATEGORIES.PRIVATE]: TTL_48_HOURS_MS,       // 48 jam untuk cache privat pengguna
  [CACHE_CATEGORIES.STATIC]: 7 * 24 * 60 * 60 * 1000  // 7 hari untuk config statis
};

// Batas entri maksimum per kategori untuk mencegah QuotaExceededError (LRU eviction)
export const MAX_ENTRIES = {
  [CACHE_CATEGORIES.PUBLIC]: 60,
  [CACHE_CATEGORIES.SESSION]: 30,
  [CACHE_CATEGORIES.PRIVATE]: 40,
  [CACHE_CATEGORIES.STATIC]: 20
};

const STORAGE_PREFIX = 'tokuflix_cache_';
const LAST_ACTIVE_KEY_PREFIX = 'tokuflix_user_last_active_';
const GLOBAL_LAST_ACTIVE_KEY = 'tokuflix_global_last_active';

// Memory Tier (L1 Cache)
const memoryCache = new Map();

// Hook untuk simulasi / manipulasi waktu saat pengujian otomatis (Fake Clock)
let customTimeOffsetMs = 0;

export const setTimeOffsetForTesting = (offsetMs) => {
  customTimeOffsetMs = offsetMs;
};

export const resetTimeOffsetForTesting = () => {
  customTimeOffsetMs = 0;
};

export const getCurrentTime = () => {
  return Date.now() + customTimeOffsetMs;
};

/* ==========================================================================
   SAFE STORAGE ACCESSORS (Menangani Mode Penyamaran / QuotaExceededError)
   ========================================================================== */

const calcByteSize = (str) => {
  if (typeof str !== 'string') return 0;
  if (typeof Blob !== 'undefined') {
    return new Blob([str]).size;
  }
  if (typeof Buffer !== 'undefined') {
    return Buffer.byteLength(str, 'utf8');
  }
  return str.length;
};

const safeGetItem = (key) => {
  try {
    if (typeof localStorage !== 'undefined') {
      return localStorage.getItem(key);
    }
    return null;
  } catch (err) {
    console.warn(`[cacheManager] Gagal membaca storage untuk key "${key}":`, err.message);
    return null;
  }
};

let isEmergencyEvicting = false;

const safeSetItem = (key, value) => {
  try {
    if (typeof localStorage === 'undefined') return false;
    localStorage.setItem(key, value);
    return true;
  } catch (err) {
    if ((err.name === 'QuotaExceededError' || err.code === 22) && !isEmergencyEvicting) {
      isEmergencyEvicting = true;
      console.warn('[cacheManager] QuotaExceededError terdeteksi! Menjalankan evict LRU darurat...');
      try {
        enforceCacheLimits(true);
      } catch (evictErr) {
        console.warn('[cacheManager] Error saat evict darurat:', evictErr.message);
      } finally {
        isEmergencyEvicting = false;
      }

      try {
        localStorage.setItem(key, value);
        return true;
      } catch {
        return false;
      }
    }
    console.warn(`[cacheManager] Gagal menulis storage untuk key "${key}":`, err.message);
    return false;
  }
};

const safeRemoveItem = (key) => {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(key);
    }
  } catch (err) {
    console.warn(`[cacheManager] Gagal menghapus key "${key}":`, err.message);
  }
};

const safeStorageKeys = () => {
  try {
    if (typeof localStorage !== 'undefined') {
      return Object.keys(localStorage);
    }
  } catch (err) {
    console.warn('[cacheManager] Gagal membaca keys localStorage:', err.message);
  }
  return [];
};

/* ==========================================================================
   MANIFEST & METADATA HELPERS
   ========================================================================== */

const getManifestKey = (category, userId = null) => {
  if (category === CACHE_CATEGORIES.PRIVATE && userId) {
    return `${STORAGE_PREFIX}${category}_${userId}_manifest`;
  }
  return `${STORAGE_PREFIX}${category}_manifest`;
};

const getDataKey = (category, itemKey, userId = null) => {
  if (category === CACHE_CATEGORIES.PRIVATE && userId) {
    return `${STORAGE_PREFIX}${category}_${userId}_data_${encodeURIComponent(itemKey)}`;
  }
  return `${STORAGE_PREFIX}${category}_data_${encodeURIComponent(itemKey)}`;
};

const readManifest = (category, userId = null) => {
  const mKey = getManifestKey(category, userId);
  const raw = safeGetItem(mKey);
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
};

const writeManifest = (category, manifest, userId = null) => {
  const mKey = getManifestKey(category, userId);
  safeSetItem(mKey, JSON.stringify(manifest));
};

/* ==========================================================================
   LAST ACTIVE & 48-HOUR TTL TRACKING
   ========================================================================== */

/**
 * Mencatat waktu aktivitas pengguna terakhir secara persisten
 */
export const recordUserActivity = (userId = null) => {
  const now = getCurrentTime();
  safeSetItem(GLOBAL_LAST_ACTIVE_KEY, String(now));
  if (userId) {
    safeSetItem(`${LAST_ACTIVE_KEY_PREFIX}${userId}`, String(now));
  }
};

/**
 * Mendapatkan timestamp aktivitas terakhir untuk user tertentu atau global
 */
export const getLastActiveTimestamp = (userId = null) => {
  if (userId) {
    const userVal = safeGetItem(`${LAST_ACTIVE_KEY_PREFIX}${userId}`);
    if (userVal) return parseInt(userVal, 10);
  }
  const globalVal = safeGetItem(GLOBAL_LAST_ACTIVE_KEY);
  return globalVal ? parseInt(globalVal, 10) : null;
};

/**
 * Memeriksa apakah user telah tidak aktif / tidak login lebih dari 48 jam
 */
export const isUserInactive48Hours = (userId = null) => {
  const lastActive = getLastActiveTimestamp(userId);
  if (!lastActive) return false;
  const now = getCurrentTime();
  return (now - lastActive) > TTL_48_HOURS_MS;
};

/* ==========================================================================
   CORE CACHE GET / SET / REMOVE METHODS
   ========================================================================== */

/**
 * Mengambil item cache dari L1 (Memory) atau L2 (LocalStorage)
 */
export const getCacheItem = (key, category = CACHE_CATEGORIES.PUBLIC, userId = null) => {
  const now = getCurrentTime();
  const memKey = `${category}:${userId || 'anon'}:${key}`;

  // 1. Cek L1 Memory Cache
  if (memoryCache.has(memKey)) {
    const item = memoryCache.get(memKey);
    if (now < item.expiresAt) {
      return {
        data: item.data,
        from: 'memory',
        expiresAt: item.expiresAt,
        cachedAt: item.cachedAt
      };
    }
    memoryCache.delete(memKey);
  }

  // 2. Cek L2 Persistent Storage
  const manifest = readManifest(category, userId);
  const entryMeta = manifest[key];

  if (!entryMeta) return null;

  // Cek apakah item telah kedaluwarsa
  if (now > entryMeta.expiresAt) {
    removeCacheItem(key, category, userId);
    return null;
  }

  // Untuk private cache, cek juga aturan 48 jam tidak aktif
  if (category === CACHE_CATEGORIES.PRIVATE && userId && isUserInactive48Hours(userId)) {
    clearUserPrivateCache(userId);
    return null;
  }

  const dataKey = getDataKey(category, key, userId);
  const rawData = safeGetItem(dataKey);
  if (!rawData) {
    // Data hilang dari storage, bersihkan metadata
    delete manifest[key];
    writeManifest(category, manifest, userId);
    return null;
  }

  try {
    const parsedData = JSON.parse(rawData);
    // Masukkan kembali ke memory cache untuk request berikutnya
    memoryCache.set(memKey, {
      data: parsedData,
      cachedAt: entryMeta.cachedAt,
      expiresAt: entryMeta.expiresAt
    });

    return {
      data: parsedData,
      from: 'persistent',
      expiresAt: entryMeta.expiresAt,
      cachedAt: entryMeta.cachedAt
    };
  } catch (err) {
    console.warn(`[cacheManager] Gagal parse data cache key "${key}":`, err.message);
    removeCacheItem(key, category, userId);
    return null;
  }
};

/**
 * Menyimpan item ke L1 (Memory) dan L2 (LocalStorage) dengan TTL & limit
 */
export const setCacheItem = (key, data, category = CACHE_CATEGORIES.PUBLIC, options = {}) => {
  const {
    userId = null,
    ttlMs = DEFAULT_TTLS[category] || DEFAULT_TTLS[CACHE_CATEGORIES.PUBLIC],
    skipPersistent = false
  } = options;

  const now = getCurrentTime();
  const expiresAt = now + ttlMs;
  const memKey = `${category}:${userId || 'anon'}:${key}`;

  // 1. Simpan ke L1 Memory Cache
  memoryCache.set(memKey, {
    data,
    cachedAt: now,
    expiresAt
  });

  if (skipPersistent) return true;

  // 2. Simpan ke L2 Persistent Storage
  try {
    const serialized = JSON.stringify(data);
    const sizeBytes = calcByteSize(serialized);

    // Jangan simpan item individual yang melebihi 512KB ke localStorage
    if (sizeBytes > 512 * 1024) {
      return true; // Tetap tersimpan di L1 memory cache
    }

    const manifest = readManifest(category, userId);

    // Enforce category capacity limit
    const keys = Object.keys(manifest);
    const maxAllowed = MAX_ENTRIES[category] || 50;

    if (keys.length >= maxAllowed && !manifest[key]) {
      // Evict item terlama (LRU berdasarkan cachedAt)
      let oldestKey = keys[0];
      let oldestTime = manifest[keys[0]]?.cachedAt ?? Infinity;
      keys.forEach((k) => {
        const itemTime = manifest[k]?.cachedAt ?? Infinity;
        if (itemTime < oldestTime) {
          oldestTime = itemTime;
          oldestKey = k;
        }
      });
      if (oldestKey) {
        removeCacheItem(oldestKey, category, userId);
        delete manifest[oldestKey];
      }
    }

    const dataKey = getDataKey(category, key, userId);
    const success = safeSetItem(dataKey, serialized);

    if (success) {
      manifest[key] = {
        cachedAt: now,
        expiresAt,
        sizeBytes
      };
      writeManifest(category, manifest, userId);
    }

    return success;
  } catch (err) {
    console.warn(`[cacheManager] Gagal menyimpan cache item "${key}":`, err.message);
    return false;
  }
};

/**
 * Menghapus satu item dari cache
 */
export const removeCacheItem = (key, category = CACHE_CATEGORIES.PUBLIC, userId = null) => {
  const memKey = `${category}:${userId || 'anon'}:${key}`;
  memoryCache.delete(memKey);

  const manifest = readManifest(category, userId);
  if (manifest[key]) {
    delete manifest[key];
    writeManifest(category, manifest, userId);
  }

  const dataKey = getDataKey(category, key, userId);
  safeRemoveItem(dataKey);
};

/* ==========================================================================
   SPECIFIED CLEANUP METHODS
   ========================================================================== */

/**
 * 1. cleanupExpiredCache()
 * Memeriksa dan membersihkan semua entri cache yang telah melewati TTL.
 * Termasuk memeriksa aturan ketidakaktifan 48 jam untuk cache privat.
 */
export const cleanupExpiredCache = () => {
  const now = getCurrentTime();
  let totalCleaned = 0;

  // 1. Bersihkan expired dari memory
  for (const [memKey, item] of memoryCache.entries()) {
    if (now > item.expiresAt) {
      memoryCache.delete(memKey);
      totalCleaned++;
    }
  }

  // 2. Iterasi seluruh storage key untuk manifest
  try {
    const keys = safeStorageKeys();
    for (const storageKey of keys) {
      if (storageKey.startsWith(STORAGE_PREFIX) && storageKey.endsWith('_manifest')) {
        const rawManifest = safeGetItem(storageKey);
        if (!rawManifest) continue;

        let manifest = {};
        try {
          manifest = JSON.parse(rawManifest);
        } catch {
          continue;
        }

        let isModified = false;
        for (const [itemKey, meta] of Object.entries(manifest)) {
          if (now > meta.expiresAt) {
            delete manifest[itemKey];
            isModified = true;
            totalCleaned++;

            // Cari dan hapus data key pasangannya
            const dataPrefix = storageKey.replace('_manifest', '_data_');
            safeRemoveItem(`${dataPrefix}${encodeURIComponent(itemKey)}`);
          }
        }

        if (isModified) {
          safeSetItem(storageKey, JSON.stringify(manifest));
        }
      }

      // Periksa aturan ketidakaktifan 48 jam per user
      if (storageKey.startsWith(LAST_ACTIVE_KEY_PREFIX)) {
        const uId = storageKey.replace(LAST_ACTIVE_KEY_PREFIX, '');
        const lastActive = parseInt(safeGetItem(storageKey) || '0', 10);
        if (lastActive && (now - lastActive) > TTL_48_HOURS_MS) {
          console.info(`[cacheManager] Pengguna "${uId}" tidak aktif > 48 jam. Membersihkan private cache...`);
          clearUserPrivateCache(uId);
          totalCleaned++;
        }
      }
    }
  } catch (err) {
    console.warn('[cacheManager] Error saat menjalankan cleanupExpiredCache:', err.message);
  }

  return totalCleaned;
};

/**
 * 2. cleanupSessionCache()
 * Membersihkan seluruh data sesi sementara (session-cache) saat sesi berakhir / logout.
 */
export const cleanupSessionCache = () => {
  let cleanedCount = 0;

  // 1. Bersihkan dari L1 memory
  for (const memKey of memoryCache.keys()) {
    if (memKey.startsWith(`${CACHE_CATEGORIES.SESSION}:`)) {
      memoryCache.delete(memKey);
      cleanedCount++;
    }
  }

  // 2. Bersihkan manifest dan data session-cache dari L2 localStorage
  try {
    const manifest = readManifest(CACHE_CATEGORIES.SESSION);
    for (const itemKey of Object.keys(manifest)) {
      const dataKey = getDataKey(CACHE_CATEGORIES.SESSION, itemKey);
      safeRemoveItem(dataKey);
      cleanedCount++;
    }
    const manifestKey = getManifestKey(CACHE_CATEGORIES.SESSION);
    safeRemoveItem(manifestKey);
  } catch (err) {
    console.warn('[cacheManager] Gagal membersihkan session cache:', err.message);
  }

  return cleanedCount;
};

/**
 * 3. clearUserPrivateCache(userId)
 * Menghapus seluruh data lokal privat milik pengguna tertentu.
 * Dipanggil saat LOGOUT atau ketika pengguna tidak aktif selama 48 JAM.
 * PENTING: TIDAK MENGHAPUS bookmark/history yang sudah tersinkronisasi permanen!
 */
export const clearUserPrivateCache = (userId = null) => {
  let cleanedCount = 0;

  // 1. Bersihkan dari memory cache
  for (const memKey of memoryCache.keys()) {
    if (memKey.startsWith(`${CACHE_CATEGORIES.PRIVATE}:`)) {
      if (!userId || memKey.includes(`:${userId}:`)) {
        memoryCache.delete(memKey);
        cleanedCount++;
      }
    }
  }

  // 2. Bersihkan storage data untuk user tersebut
  try {
    const keys = safeStorageKeys();
    const targetSubstring = userId ? `private-cache_${userId}_` : `private-cache_`;

    for (const storageKey of keys) {
      if (storageKey.startsWith(STORAGE_PREFIX) && storageKey.includes(targetSubstring)) {
        safeRemoveItem(storageKey);
        cleanedCount++;
      }
    }

    // Reset timestamp last active untuk user tersebut
    if (userId) {
      safeRemoveItem(`${LAST_ACTIVE_KEY_PREFIX}${userId}`);
    }
  } catch (err) {
    console.warn(`[cacheManager] Gagal membersihkan private cache untuk user ${userId}:`, err.message);
  }

  return cleanedCount;
};

/**
 * 4. enforceCacheLimits(aggressive = false)
 * Memastikan penggunaan penyimpanan browser tidak melampaui batas maksimum kuota.
 */
export const enforceCacheLimits = (aggressive = false) => {
  let evictedCount = 0;

  Object.values(CACHE_CATEGORIES).forEach((category) => {
    try {
      const maxAllowed = aggressive 
        ? Math.floor((MAX_ENTRIES[category] || 30) / 2) 
        : (MAX_ENTRIES[category] || 50);

      const manifestKey = getManifestKey(category);
      const rawManifest = safeGetItem(manifestKey);
      if (!rawManifest) return;

      const manifest = JSON.parse(rawManifest);
      const keys = Object.keys(manifest);

      if (keys.length > maxAllowed) {
        // Urutkan item berdasarkan cachedAt terlama
        const sorted = keys.sort((a, b) => (manifest[a]?.cachedAt || 0) - (manifest[b]?.cachedAt || 0));
        const toEvict = sorted.slice(0, keys.length - maxAllowed);

        toEvict.forEach((k) => {
          removeCacheItem(k, category);
          evictedCount++;
        });
      }
    } catch (err) {
      console.warn(`[cacheManager] Gagal membatasi kapasitas untuk kategori ${category}:`, err.message);
    }
  });

  return evictedCount;
};

/**
 * 5. getCacheStats()
 * Menghasilkan ringkasan statistik penggunaan cache (jumlah entri, ukuran perkiraan bytes, rincian per kategori)
 */
export const getCacheStats = (activeUserId = null) => {
  const stats = {
    totalEntries: 0,
    totalSizeBytes: 0,
    memoryEntries: memoryCache.size,
    lastActive: getLastActiveTimestamp(activeUserId),
    is48HoursInactive: isUserInactive48Hours(activeUserId),
    categories: {
      [CACHE_CATEGORIES.PUBLIC]: { count: 0, sizeBytes: 0 },
      [CACHE_CATEGORIES.SESSION]: { count: 0, sizeBytes: 0 },
      [CACHE_CATEGORIES.PRIVATE]: { count: 0, sizeBytes: 0 },
      [CACHE_CATEGORIES.STATIC]: { count: 0, sizeBytes: 0 }
    }
  };

  try {
    const keys = safeStorageKeys();
    for (const key of keys) {
      if (key.startsWith(STORAGE_PREFIX)) {
        const val = safeGetItem(key) || '';
        const size = calcByteSize(val);
        stats.totalSizeBytes += size;

        Object.values(CACHE_CATEGORIES).forEach((cat) => {
          if (key.includes(cat)) {
            if (key.endsWith('_manifest')) {
              try {
                const parsed = JSON.parse(val);
                stats.categories[cat].count = Object.keys(parsed).length;
              } catch {
                // fallback
              }
            } else if (key.includes('_data_')) {
              stats.categories[cat].sizeBytes += size;
            }
          }
        });
      }
    }

    stats.totalEntries = Object.values(stats.categories).reduce((acc, c) => acc + c.count, 0);
  } catch (err) {
    console.warn('[cacheManager] Gagal menghitung statistik cache:', err.message);
  }

  return stats;
};

/* ==========================================================================
   INITIALIZATION & LIFECYCLE LISTENER
   ========================================================================== */

let isInitialized = false;

/**
 * 6. initializeCacheManager(options)
 * Memeriksa dan menyiapkan sistem cache saat aplikasi dibuka.
 * - Memeriksa apakah user tidak aktif selama > 48 jam dan membersihkan private cache yang kedaluwarsa.
 * - Menjalankan cleanupExpiredCache() untuk membuang entri basi.
 * - Memasang event listener visibilitychange dan pageshow untuk lifecycle cleanup.
 */
export const initializeCacheManager = (options = {}) => {
  const { activeUserId = null, force = false } = options;

  if (isInitialized && !force) {
    // Tetap jalankan periodic verification
    cleanupExpiredCache();
    recordUserActivity(activeUserId);
    return;
  }

  isInitialized = true;
  console.info('[cacheManager] Menginisialisasi Smart Cache Manager...');

  // 1. Periksa aturan 48 jam tidak aktif untuk pengguna yang sedang tersimpan
  if (isUserInactive48Hours(activeUserId)) {
    console.warn('[cacheManager] Aktivitas terakhir melebihi 48 jam! Membersihkan private cache pengguna...');
    clearUserPrivateCache(activeUserId);
    cleanupSessionCache();
  }

  // 2. Jalankan pembersihan item kedaluwarsa (TTL)
  cleanupExpiredCache();

  // 3. Batasi kapasitas penyimpanan jika mendekati batas kuota
  enforceCacheLimits();

  // 4. Catat waktu buka aplikasi sebagai aktivitas
  recordUserActivity(activeUserId);

  // 5. Lifecycle listener: Ketika halaman kembali aktif dari background / tab lain
  if (typeof document !== 'undefined') {
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        recordUserActivity(activeUserId);
        cleanupExpiredCache();
      }
    });
  }

  if (typeof window !== 'undefined') {
    window.addEventListener('pageshow', () => {
      recordUserActivity(activeUserId);
      cleanupExpiredCache();
    });
  }
};
