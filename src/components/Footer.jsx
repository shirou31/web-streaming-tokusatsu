import React from 'react';
import { Globe, ShieldCheck, Database, Zap, Smartphone } from 'lucide-react';

export default function Footer({ 
  onOpenSpecs, 
  onOpenScraper, 
  onOpenInstallModal,
  onOpenWatchlist 
}) {
  const scrollTo = (id) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <footer className="sorot-footer">
      <div className="footer-container">
        {/* Top Grid */}
        <div className="footer-links-grid">
          {/* Brand Column */}
          <div className="footer-brand-col">
            <div className="footer-logo-row" onClick={() => scrollTo('beranda')} role="button" tabIndex={0} aria-label="TOKUFLIX Beranda">
              <img 
                src="/logo.png" 
                alt="Logo Resmi TOKUFLIX" 
                className="footer-official-logo" 
                width="34" 
                height="34" 
              />
              <span className="footer-brand-name disp">
                TOKU<span className="footer-highlight">FLIX</span>
              </span>
            </div>
            <p className="footer-tagline">
              Tempat film, serial, dan anime tokusatsu favoritmu menyala. Nonton kapan saja, di mana saja dengan kualitas 1440p 2K QHD Subtitle Indonesia.
            </p>
            <div className="footer-security-pill">
              <ShieldCheck size={15} color="#10b981" />
              <span>Sistem Terproteksi Anti-Tamper & Immutability</span>
            </div>
          </div>

          {/* Column 1: Jelajahi */}
          <div className="footer-nav-col">
            <h4 className="footer-col-title">JELAJAHI</h4>
            <ul className="footer-list">
              <li><button type="button" className="footer-link-btn" onClick={() => scrollTo('top10')}>Terpopuler (Top 10)</button></li>
              <li><button type="button" className="footer-link-btn" onClick={() => scrollTo('baru')}>Baru Rilis</button></li>
              <li><button type="button" className="footer-link-btn" onClick={() => scrollTo('jelajah')}>Semua Genre</button></li>
              <li><button type="button" className="footer-link-btn" onClick={onOpenWatchlist}>Daftar Saya</button></li>
              <li><button type="button" className="footer-link-btn" onClick={onOpenScraper}>Live Fansub Scraper Hub</button></li>
            </ul>
          </div>

          {/* Column 2: Bantuan */}
          <div className="footer-nav-col">
            <h4 className="footer-col-title">BANTUAN</h4>
            <ul className="footer-list">
              <li><button type="button" className="footer-link-btn" onClick={onOpenSpecs}>Smart Cache Inspector</button></li>
              <li><button type="button" className="footer-link-btn" onClick={onOpenInstallModal}>Pasang Aplikasi Mobile (PWA/APK)</button></li>
              <li><a href="#top10" className="footer-link-btn">Serial Terpopuler</a></li>
              <li><a href="#baru" className="footer-link-btn">Update Rilis Terbaru</a></li>
              <li><a href="#beranda" className="footer-link-btn">Pusat Bantuan</a></li>
            </ul>
          </div>

          {/* Column 3: Perusahaan */}
          <div className="footer-nav-col">
            <h4 className="footer-col-title">PERUSAHAAN</h4>
            <ul className="footer-list">
              <li><a href="#beranda" className="footer-link-btn">Tentang TOKUFLIX</a></li>
              <li><a href="#beranda" className="footer-link-btn">Karier</a></li>
              <li><a href="#beranda" className="footer-link-btn">Syarat & Ketentuan</a></li>
              <li><a href="#beranda" className="footer-link-btn">Kebijakan Privasi</a></li>
              <li><a href="#beranda" className="footer-link-btn">Hak Cipta & Disclaimer</a></li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="footer-bottom-bar">
          <div className="footer-lang-group">
            <button type="button" className="footer-lang-btn">
              <Globe size={16} />
              <span>Bahasa Indonesia</span>
            </button>
            <button 
              type="button" 
              className="footer-cache-badge" 
              onClick={onOpenSpecs} 
              title="Smart Cache 100% Otomatis: Auto-Purge, LRU Capacity Eviction, & 48-Hour Inactivity Auto-Cleanup"
            >
              <span className="live-dot-pulse" style={{ width: 8, height: 8, background: '#10b981', borderRadius: '50%', display: 'inline-block' }} />
              <Database size={14} color="#10b981" />
              <span>Smart Cache: 100% Otomatis Aktif</span>
            </button>
          </div>

          <p className="footer-copyright-text">
            © 2026 TOKUFLIX. Seluruh hak cipta dilindungi undang-undang. Seluruh materi, karakter, dan serial Tokusatsu (Toei Company, Tsuburaya Productions, TV Asahi) adalah milik pemegang hak cipta masing-masing.
          </p>
        </div>
      </div>

      <style>{`
        .sorot-footer {
          padding: 64px clamp(16px, 4vw, 56px) 48px;
          background: #080809;
          border-top: 1px solid rgba(255, 255, 255, 0.08);
          margin-top: 60px;
        }
        .footer-container {
          max-width: 1440px;
          margin: 0 auto;
        }
        .footer-links-grid {
          display: flex;
          flex-wrap: wrap;
          gap: 48px;
          justify-content: space-between;
        }
        .footer-brand-col {
          flex: 1 1 260px;
          max-width: 360px;
        }
        .footer-logo-row {
          display: inline-flex;
          align-items: center;
          gap: 12px;
          cursor: pointer;
        }
        .footer-official-logo {
          width: 34px;
          height: 34px;
          object-fit: contain;
          filter: drop-shadow(0 2px 8px rgba(229, 9, 20, 0.45));
          transition: transform var(--transition-bounce);
        }
        .footer-logo-row:hover .footer-official-logo {
          transform: scale(1.1) rotate(-3deg);
        }
        .footer-brand-name {
          font-size: 26px;
          font-weight: 900;
          letter-spacing: -0.02em;
          color: #FFFFFF;
          text-transform: uppercase;
        }
        .footer-highlight {
          color: var(--accent-red, #E50914);
          text-shadow: 0 0 14px rgba(229, 9, 20, 0.5);
        }
        .footer-tagline {
          font-size: 14px;
          line-height: 1.6;
          color: #9A9AA0;
          margin: 14px 0 16px;
        }
        .footer-security-pill {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          padding: 5px 12px;
          border-radius: var(--radius-full);
          background: rgba(16, 185, 129, 0.1);
          border: 1px solid rgba(16, 185, 129, 0.3);
          font-size: 12px;
          font-weight: 600;
          color: #6ee7b7;
        }

        .footer-nav-col {
          flex: 1 1 140px;
        }
        .footer-col-title {
          font-size: 13px;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: #E2E2E5;
          margin-bottom: 16px;
        }
        .footer-list {
          list-style: none;
          margin: 0;
          padding: 0;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .footer-link-btn {
          background: transparent;
          border: 0;
          padding: 0;
          font-size: 14px;
          color: #9A9AA0;
          cursor: pointer;
          text-align: left;
          transition: color var(--transition-fast);
        }
        .footer-link-btn:hover {
          color: #FFFFFF;
          text-decoration: underline;
        }

        .footer-bottom-bar {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          justify-content: space-between;
          gap: 18px;
          margin-top: 48px;
          padding-top: 24px;
          border-top: 1px solid rgba(255, 255, 255, 0.08);
        }
        .footer-lang-group {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
        }
        .footer-lang-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          height: 42px;
          padding: 0 16px;
          border-radius: var(--radius-sm);
          border: 1px solid rgba(255, 255, 255, 0.22);
          background: transparent;
          color: #FFFFFF;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: background var(--transition-fast);
        }
        .footer-lang-btn:hover {
          background: rgba(255, 255, 255, 0.1);
        }
        .footer-cache-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          height: 42px;
          padding: 0 14px;
          border-radius: var(--radius-sm);
          border: 1px solid rgba(0, 242, 254, 0.25);
          background: rgba(0, 242, 254, 0.06);
          color: var(--accent-cyan);
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
        }
        .footer-cache-badge:hover {
          background: rgba(0, 242, 254, 0.14);
        }

        .footer-copyright-text {
          font-size: 13px;
          line-height: 1.5;
          color: #8E8E94;
          max-width: 650px;
        }

        @media (max-width: 768px) {
          .sorot-footer {
            padding: 44px 18px 30px;
          }
          .footer-links-grid {
            gap: 32px;
          }
          .footer-brand-col {
            max-width: 100%;
          }
        }
      `}</style>
    </footer>
  );
}
