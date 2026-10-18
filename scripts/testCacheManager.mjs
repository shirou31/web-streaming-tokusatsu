// scripts/testCacheManager.mjs
// Automated Verification Suite for Tokuflix Smart Cache Management & User Data Cleanup
// Tests all 10 required scenarios with simulated time/fake clock manipulation (+49 hours)

import { 
  CACHE_CATEGORIES, 
  TTL_48_HOURS_MS,
  initializeCacheManager,
  cleanupExpiredCache,
  cleanupSessionCache,
  clearUserPrivateCache,
  enforceCacheLimits,
  getCacheStats,
  recordUserActivity,
  getLastActiveTimestamp,
  isUserInactive48Hours,
  setTimeOffsetForTesting,
  resetTimeOffsetForTesting,
  getCurrentTime,
  getCacheItem,
  setCacheItem
} from '../src/services/cacheManager.js';

import {
  loginUser,
  logoutUser,
  getAuthSession,
  abortAllInFlightRequests
} from '../src/services/apiService.js';

// Setup Mock LocalStorage for CLI environment
const createLocalStorageMock = () => {
  const store = {};
  const methods = {
    getItem: (key) => (key in store ? store[key] : null),
    setItem: (key, val) => {
      if (store['__SIMULATE_QUOTA_ERROR__'] === 'true' && key !== '__SIMULATE_QUOTA_ERROR__') {
        const err = new Error('Quota exceeded');
        err.name = 'QuotaExceededError';
        err.code = 22;
        throw err;
      }
      store[key] = String(val);
    },
    removeItem: (key) => {
      delete store[key];
    },
    clear: () => {
      Object.keys(store).forEach((k) => delete store[k]);
    },
    get length() {
      return Object.keys(store).length;
    },
    key: (i) => Object.keys(store)[i] || null
  };

  return new Proxy(methods, {
    get(target, prop) {
      if (prop in target) return target[prop];
      return store[prop] !== undefined ? store[prop] : null;
    },
    set(target, prop, value) {
      target.setItem(prop, value);
      return true;
    },
    deleteProperty(target, prop) {
      target.removeItem(prop);
      return true;
    },
    ownKeys() {
      return Object.keys(store);
    },
    getOwnPropertyDescriptor(target, prop) {
      if (prop in store) {
        return {
          value: store[prop],
          writable: true,
          enumerable: true,
          configurable: true
        };
      }
      return undefined;
    }
  });
};

if (typeof globalThis.localStorage === 'undefined') {
  globalThis.localStorage = createLocalStorageMock();
}

// Minimal CustomEvent polyfill for Node
if (typeof globalThis.CustomEvent === 'undefined') {
  globalThis.CustomEvent = class CustomEvent {
    constructor(type, eventInitDict) {
      this.type = type;
      this.detail = eventInitDict?.detail || null;
    }
  };
}

// Minimal window polyfill for Node event dispatching
if (typeof globalThis.window === 'undefined') {
  globalThis.window = {
    location: { origin: 'http://localhost:5173' },
    dispatchEvent: () => true,
    addEventListener: () => {},
    removeEventListener: () => {}
  };
}

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m'
};

const results = [];

function assert(condition, scenarioNum, testName, details = '') {
  if (condition) {
    console.log(`  ${colors.green}✔ PASS${colors.reset} [Skenario ${scenarioNum}] ${testName} ${details ? colors.cyan + '(' + details + ')' + colors.reset : ''}`);
    results.push({ scenarioNum, testName, passed: true, details });
  } else {
    console.error(`  ${colors.red}✖ FAIL${colors.reset} [Skenario ${scenarioNum}] ${testName} - Gagal! ${details}`);
    results.push({ scenarioNum, testName, passed: false, details });
  }
}

async function runAllScenarios() {
  console.log(`\n${colors.bold}${colors.cyan}========================================================================${colors.reset}`);
  console.log(`${colors.bold}${colors.cyan}  TOKUFLIX SMART CACHE MANAGEMENT - AUTOMATED 10 SCENARIO TEST SUITE   ${colors.reset}`);
  console.log(`${colors.bold}${colors.cyan}========================================================================${colors.reset}\n`);

  resetTimeOffsetForTesting();
  localStorage.clear();

  // =========================================================================
  // SKENARIO 1: Pengguna membuka website dan cache katalog terbentuk
  // =========================================================================
  console.log(`${colors.yellow}${colors.bold}▶ Skenario 1: Pengguna membuka website dan cache katalog terbentuk${colors.reset}`);
  initializeCacheManager({ force: true });

  const catalogPayload = {
    productions: [
      { id: 'kr-gavv', title: 'Kamen Rider Gavv', year: 2024 },
      { id: 'kr-geats', title: 'Kamen Rider Geats', year: 2022 }
    ]
  };

  setCacheItem('/catalog?franchise=kamen-rider', catalogPayload, CACHE_CATEGORIES.PUBLIC, {
    ttlMs: 24 * 60 * 60 * 1000
  });

  const retrievedCatalog = getCacheItem('/catalog?franchise=kamen-rider', CACHE_CATEGORIES.PUBLIC);
  assert(retrievedCatalog !== null, 1, 'Cache katalog berhasil disimpan dan dibaca', `items: ${retrievedCatalog?.data?.productions?.length}`);
  assert(retrievedCatalog?.data?.productions?.[0]?.title === 'Kamen Rider Gavv', 1, 'Integritas data katalog publik valid');

  // =========================================================================
  // SKENARIO 2: Pengguna logout dan cache privat sesi dihapus
  // =========================================================================
  console.log(`\n${colors.yellow}${colors.bold}▶ Skenario 2: Pengguna logout dan cache privat sesi dihapus${colors.reset}`);
  
  // User login dan mengisi private cache & session cache
  const user1 = { id: 'usr_kotaro_01', name: 'Kotaro Minami', email: 'kotaro@tokuflix.id' };
  await loginUser(user1);

  setCacheItem('/user/profile', { vip_level: 3, signed_url: 'https://secure.stream/hls/key' }, CACHE_CATEGORIES.PRIVATE, {
    userId: user1.id,
    ttlMs: TTL_48_HOURS_MS
  });

  setCacheItem('/session/temp_nonce', { nonce: 'abc123nonce' }, CACHE_CATEGORIES.SESSION, {
    ttlMs: 2 * 60 * 60 * 1000
  });

  // Verifikasi tersimpan sebelum logout
  const preLogoutPrivate = getCacheItem('/user/profile', CACHE_CATEGORIES.PRIVATE, user1.id);
  const preLogoutSession = getCacheItem('/session/temp_nonce', CACHE_CATEGORIES.SESSION);
  assert(preLogoutPrivate !== null && preLogoutSession !== null, 2, 'Cache privat & session aktif sebelum logout');

  // Eksekusi logout
  await logoutUser();

  const postLogoutPrivate = getCacheItem('/user/profile', CACHE_CATEGORIES.PRIVATE, user1.id);
  const postLogoutSession = getCacheItem('/session/temp_nonce', CACHE_CATEGORIES.SESSION);
  assert(postLogoutPrivate === null, 2, 'Cache privat pengguna berhasil dibersihkan saat logout');
  assert(postLogoutSession === null, 2, 'Cache sesi (session-cache) berhasil dibersihkan saat logout');
  assert(localStorage.getItem('tokuflix_auth_token') === null, 2, 'Auth token lokal terhapus saat logout');

  // =========================================================================
  // SKENARIO 3: Cache publik tetap tersedia setelah logout jika masih valid
  // =========================================================================
  console.log(`\n${colors.yellow}${colors.bold}▶ Skenario 3: Cache publik tetap tersedia setelah logout jika masih valid${colors.reset}`);
  const postLogoutCatalog = getCacheItem('/catalog?franchise=kamen-rider', CACHE_CATEGORIES.PUBLIC);
  assert(postLogoutCatalog !== null, 3, 'Cache katalog publik tetap utuh setelah pengguna logout');
  assert(postLogoutCatalog?.data?.productions?.[0]?.id === 'kr-gavv', 3, 'Konten katalog publik tidak terkorupsi oleh logout');

  // =========================================================================
  // SKENARIO 4: Pengguna tidak login selama 48 jam & cache privat kedaluwarsa
  // =========================================================================
  console.log(`\n${colors.yellow}${colors.bold}▶ Skenario 4: Pengguna tidak login selama 48 jam (TTL 48 Jam via Fake Clock)${colors.reset}`);
  
  // Login kembali dan set aktivitas
  await loginUser(user1);
  setCacheItem('/user/playback_token', { token: 'expiring_token_48h' }, CACHE_CATEGORIES.PRIVATE, {
    userId: user1.id,
    ttlMs: TTL_48_HOURS_MS
  });

  assert(isUserInactive48Hours(user1.id) === false, 4, 'User belum dianggap tidak aktif saat baru login (0 jam)');

  // Manipulasi waktu ke depan: +49 Jam (> 48 Jam)
  const offset49h = 49 * 60 * 60 * 1000;
  setTimeOffsetForTesting(offset49h);

  assert(isUserInactive48Hours(user1.id) === true, 4, 'Deteksi inaktivitas berhasil setelah +49 jam');

  // Jalankan cleanup saat website dibuka kembali
  initializeCacheManager({ activeUserId: user1.id, force: true });

  const expiredItem = getCacheItem('/user/playback_token', CACHE_CATEGORIES.PRIVATE, user1.id);
  assert(expiredItem === null, 4, 'Cache privat yang kedaluwarsa > 48 jam otomatis dibersihkan');

  // Reset clock untuk skenario berikutnya
  resetTimeOffsetForTesting();

  // =========================================================================
  // SKENARIO 5: Browser ditutup selama lebih dari 48 jam, lalu dibuka kembali
  // =========================================================================
  console.log(`\n${colors.yellow}${colors.bold}▶ Skenario 5: Browser ditutup selama > 48 jam, lalu dibuka kembali${colors.reset}`);
  
  // Login user baru
  const user2 = { id: 'usr_ace_02', name: 'Ace Ukiyo', email: 'ace@tokuflix.id' };
  await loginUser(user2);

  setCacheItem('/user/secret_recommendations', { items: ['Geats IX', 'Buffa'] }, CACHE_CATEGORIES.PRIVATE, {
    userId: user2.id,
    ttlMs: TTL_48_HOURS_MS
  });

  // Simulasikan browser ditutup: variabel memory dikosongkan (simulasi crash/restart browser)
  // namun localStorage tetap ada
  setTimeOffsetForTesting(50 * 60 * 60 * 1000); // Browser ditutup selama 50 jam

  // Buka kembali aplikasi (initializeCacheManager dipanggil saat startup)
  initializeCacheManager({ activeUserId: user2.id, force: true });

  const retrievedAfterRestart = getCacheItem('/user/secret_recommendations', CACHE_CATEGORIES.PRIVATE, user2.id);
  assert(retrievedAfterRestart === null, 5, 'Setelah browser ditutup > 48 jam, cache privat otomatis bersih saat start');

  resetTimeOffsetForTesting();

  // =========================================================================
  // SKENARIO 6: Dua akun berbeda menggunakan browser yang sama (No Leaks)
  // =========================================================================
  console.log(`\n${colors.yellow}${colors.bold}▶ Skenario 6: Dua akun berbeda pada browser yang sama (Isolasi Data Antar Akun)${colors.reset}`);
  
  // Akun A
  await loginUser(user1);
  setCacheItem('/user/dashboard', { user: 'Kotaro', confidential: 'Secret Rider Pass' }, CACHE_CATEGORIES.PRIVATE, {
    userId: user1.id
  });

  // Akun B
  await loginUser(user2);
  setCacheItem('/user/dashboard', { user: 'Ace', confidential: 'DGP Winner Coin' }, CACHE_CATEGORIES.PRIVATE, {
    userId: user2.id
  });

  // Verifikasi masing-masing akun hanya membaca datanya sendiri
  const kotaroData = getCacheItem('/user/dashboard', CACHE_CATEGORIES.PRIVATE, user1.id);
  const aceData = getCacheItem('/user/dashboard', CACHE_CATEGORIES.PRIVATE, user2.id);

  assert(kotaroData?.data?.confidential === 'Secret Rider Pass', 6, 'Akun Kotaro menerima data privat miliknya sendiri');
  assert(aceData?.data?.confidential === 'DGP Winner Coin', 6, 'Akun Ace menerima data privat miliknya sendiri');
  assert(kotaroData?.data?.confidential !== aceData?.data?.confidential, 6, 'Data privat antar akun TIDAK tercampur (Namespaced)');

  // Logout akun B
  await logoutUser();
  const aceAfterLogout = getCacheItem('/user/dashboard', CACHE_CATEGORIES.PRIVATE, user2.id);
  assert(aceAfterLogout === null, 6, 'Cache privat Akun Ace terhapus setelah logout');

  // =========================================================================
  // SKENARIO 7: Sesi login masih valid tetapi cache kedaluwarsa
  // =========================================================================
  console.log(`\n${colors.yellow}${colors.bold}▶ Skenario 7: Validitas sesi login server dikelola terpisah dari cache TTL${colors.reset}`);
  
  await loginUser(user1);
  // Simpan data privat ber-TTL singkat (1 jam)
  setCacheItem('/user/signed_stream', { stream_url: 'https://cdn/temp_stream.m3u8' }, CACHE_CATEGORIES.PRIVATE, {
    userId: user1.id,
    ttlMs: 1 * 60 * 60 * 1000 // 1 Jam
  });

  // Majukan waktu 2 jam (cache kedaluwarsa, tetapi user belum 48 jam tidak aktif)
  setTimeOffsetForTesting(2 * 60 * 60 * 1000);
  cleanupExpiredCache();

  const expiredStream = getCacheItem('/user/signed_stream', CACHE_CATEGORIES.PRIVATE, user1.id);
  assert(expiredStream === null, 7, 'Resource bertanda tangan yang kedaluwarsa dibersihkan secara independen');

  const sessionCheck = getAuthSession();
  assert(sessionCheck.isAuthenticated === true, 7, 'Sesi autentikasi pengguna tetap valid dan tidak di-logout paksa');

  resetTimeOffsetForTesting();

  // =========================================================================
  // SKENARIO 8: Cache mencapai batas ukuran maksimum (LRU Eviction)
  // =========================================================================
  console.log(`\n${colors.yellow}${colors.bold}▶ Skenario 8: Cache mencapai batas ukuran maksimum (LRU Capacity Eviction)${colors.reset}`);
  
  // Masukkan 70 entri ke public-cache (batas default adalah 60 entri)
  for (let i = 1; i <= 70; i++) {
    setCacheItem(`/catalog/item_${i}`, { title: `Serial Tokusatsu ${i}`, index: i }, CACHE_CATEGORIES.PUBLIC, {
      ttlMs: 24 * 60 * 60 * 1000
    });
  }

  const stats = getCacheStats();
  const publicCount = stats.categories[CACHE_CATEGORIES.PUBLIC].count;
  assert(publicCount <= 60, 8, `Enforce batas maksimum berhasil: ${publicCount} entri (<= 60 batas aman)`);

  // Entri awal (item_1) seharusnya telah di-evict oleh item yang lebih baru
  const oldestItem = getCacheItem('/catalog/item_1', CACHE_CATEGORIES.PUBLIC);
  const newestItem = getCacheItem('/catalog/item_70', CACHE_CATEGORIES.PUBLIC);
  assert(oldestItem === null, 8, 'Item tertua di-evict (LRU eviction berhasil)');
  assert(newestItem !== null, 8, 'Item terbaru tetap tersimpan');

  // =========================================================================
  // SKENARIO 9: Browser menolak akses penyimpanan (QuotaExceededError Recovery)
  // =========================================================================
  console.log(`\n${colors.yellow}${colors.bold}▶ Skenario 9: Penanganan QuotaExceededError dan Kegagalan Storage dengan Aman${colors.reset}`);
  
  // Aktifkan simulasi QuotaExceededError pada mock
  localStorage.setItem('__SIMULATE_QUOTA_ERROR__', 'true');

  let crashed = false;
  const origWarn = console.warn;
  console.warn = () => {};
  try {
    // Fungsi setCacheItem harus menangani error secara elegan tanpa crash ke UI
    setCacheItem('/test/large_item', { data: 'large_payload' }, CACHE_CATEGORIES.PUBLIC);
  } catch (err) {
    crashed = true;
  } finally {
    console.warn = origWarn;
  }

  assert(crashed === false, 9, 'Aplikasi tidak crash saat storage menolak akses atau kuota penuh');

  // Matikan simulasi kuota
  localStorage.removeItem('__SIMULATE_QUOTA_ERROR__');

  // =========================================================================
  // SKENARIO 10: Progres tontonan & bookmark di server tetap aman
  // =========================================================================
  console.log(`\n${colors.yellow}${colors.bold}▶ Skenario 10: Progres tontonan & bookmark server-synced tidak terhapus saat pembersihan cache${colors.reset}`);
  
  // Simpan riwayat dan bookmark
  const permanentBookmarks = [
    { production_id: 'kr-gavv', title: 'Kamen Rider Gavv', status: 'watching' },
    { production_id: 'ultraman-arc', title: 'Ultraman Arc', status: 'plan_to_watch' }
  ];
  const permanentHistory = [
    { episode_id: 'ep-gavv-01', progress_seconds: 1240, duration_seconds: 1440 }
  ];

  localStorage.setItem('tokuflix_user_bookmarks', JSON.stringify(permanentBookmarks));
  localStorage.setItem('tokuflix_watch_history', JSON.stringify(permanentHistory));

  // Jalankan semua fungsi pembersihan yang ada
  cleanupExpiredCache();
  cleanupSessionCache();
  clearUserPrivateCache('usr_kotaro_01');
  clearUserPrivateCache();
  enforceCacheLimits(true);
  await logoutUser();

  const retrievedBookmarks = JSON.parse(localStorage.getItem('tokuflix_user_bookmarks') || '[]');
  const retrievedHistory = JSON.parse(localStorage.getItem('tokuflix_watch_history') || '[]');

  assert(retrievedBookmarks.length === 2, 10, 'Data bookmark permanen pengguna tetap 100% utuh');
  assert(retrievedHistory.length === 1, 10, 'Data progres riwayat tontonan tetap 100% utuh');
  assert(retrievedHistory[0].progress_seconds === 1240, 10, 'Nilai detik progres tontonan tidak berubah');

  // =========================================================================
  // REKAP HASIL PENGUJIAN
  // =========================================================================
  console.log(`\n${colors.bold}${colors.cyan}========================================================================${colors.reset}`);
  const passedCount = results.filter((r) => r.passed).length;
  const totalCount = results.length;
  const failed = results.filter((r) => !r.passed);

  if (failed.length > 0) {
    console.log(`\n${colors.red}${colors.bold}DAFTAR TES YANG GAGAL (${failed.length}):${colors.reset}`);
    failed.forEach(f => console.log(`  ${colors.red}✖ [Skenario ${f.scenarioNum}] ${f.testName}: ${f.details}${colors.reset}`));
  }

  console.log(`\n${colors.bold}HASIL AKHIR PENGUJIAN: ${passedCount}/${totalCount} TES LULUS${colors.reset}`);
  console.log(`${colors.bold}${colors.cyan}========================================================================${colors.reset}\n`);

  if (passedCount !== totalCount) {
    process.exit(1);
  }
}

runAllScenarios().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
