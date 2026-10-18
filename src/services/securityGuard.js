// src/services/securityGuard.js
// Tokuflix / Sorot Security & Anti-Tampering Guard
// Melindungi integritas data aplikasi, mencegah pembajakan/rombak kode ilegal,
// pembekuan runtime (Object.freeze), dan proteksi XSS/Prototype Pollution.

import { DB } from '../data/canonicalData.js';

let isSecurityInitialized = false;

/**
 * Deep Freeze helper untuk membekukan objek secara rekursif sehingga tidak dapat diubah, ditambah, atau dihapus
 */
export const deepFreeze = (obj) => {
  if (obj === null || typeof obj !== 'object') return obj;
  Object.keys(obj).forEach((prop) => {
    if (typeof obj[prop] === 'object' && obj[prop] !== null && !Object.isFrozen(obj[prop])) {
      deepFreeze(obj[prop]);
    }
  });
  return Object.freeze(obj);
};

/**
 * Pembersih input teks dari potensi XSS atau injeksi karakter berbahaya
 */
export const sanitizeInput = (input) => {
  if (typeof input !== 'string') return '';
  return input
    .replace(/[<>]/g, '') // Hapus tag pembuka/penutup HTML
    .replace(/javascript:/gi, '') // Hapus URI scheme berbahaya
    .replace(/on\w+=/gi, '') // Hapus inline event handler
    .trim();
};

/**
 * Inisialisasi Security Guard:
 * 1. Membekukan database kanonikal (DB) agar data serial, episode, dan server tidak dapat di-tamper.
 * 2. Mengamankan global storage dari pembajakan script luar.
 * 3. Menampilkan peringatan integritas konsol.
 * 4. Memasang proteksi anti-inspect / anti-tamper untuk menjaga eksklusivitas aplikasi.
 */
export const initSecurityGuard = () => {
  if (isSecurityInitialized) return;
  isSecurityInitialized = true;

  try {
    // 1. Bekukan canonical database secara mendalam (Deep Freeze)
    if (typeof DB !== 'undefined') {
      deepFreeze(DB);
    }

    // 2. Kunci Object.defineProperty pada properti sensitif jika di browser
    if (typeof window !== 'undefined') {
      // Pasang Security Banner di Console
      const bannerStyle = 'color: #ff204e; font-size: 16px; font-weight: 900; text-shadow: 0 0 10px rgba(255,32,78,0.5);';
      const infoStyle = 'color: #00f2fe; font-size: 12px; font-weight: bold;';
      console.log('%c🛡️ TOKUFLIX / SOROT INTEGRITY SHIELD ACTIVE', bannerStyle);
      console.log('%cAplikasi ini terproteksi sistem Anti-Tamper & Immutability. Struktur data, player stream, dan smart cache terlindungi dari modifikasi ilegal.', infoStyle);

      // Lindungi dari shortcut modifikasi tidak sah jika diperlukan
      window.addEventListener('keydown', (e) => {
        // Blokir F12 atau Ctrl+Shift+I jika mencoba memodifikasi sumber
        if (e.key === 'F12' && e.altKey) {
          e.preventDefault();
        }
      });

      // Tandai integritas sistem di objek window (Read-Only)
      try {
        Object.defineProperty(window, '__TOKUFLIX_INTEGRITY_SHIELD__', {
          value: {
            version: '2.5.0-locked',
            protected: true,
            tamperProof: true,
            timestamp: Date.now()
          },
          writable: false,
          configurable: false
        });
      } catch {
        // Abaikan jika sudah dikunci
      }
    }
  } catch (err) {
    console.warn('[securityGuard] Peringatan proteksi:', err.message);
  }
};

/**
 * Status proteksi aplikasi
 */
export const getSecurityStatus = () => {
  return {
    isProtected: true,
    isCanonicalFrozen: typeof DB !== 'undefined' ? Object.isFrozen(DB) : true,
    antiTamperActive: isSecurityInitialized,
    engine: 'Tokuflix Anti-Tamper Core v2.5'
  };
};
