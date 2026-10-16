import React from 'react';
import { Home, Zap, Search, Bookmark, Sun, Moon, Compass } from 'lucide-react';

export default function BottomNav({
  selectedFranchise,
  onSelectFranchise,
  onOpenScraper,
  onOpenWatchlist,
  onFocusSearch,
  watchlistCount = 0,
  scrapedCount = 25,
  theme = 'dark',
  onToggleTheme
}) {
  const isHome = selectedFranchise === 'all';

  const handleHomeClick = () => {
    onSelectFranchise?.('all');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <nav className="mobile-bottom-nav-container" aria-label="Navigasi Bawah Mobile">
      <div className="mobile-bottom-nav-bar glass-panel">
        {/* 1. Beranda */}
        <button
          id="bottom-nav-home"
          className={`bottom-nav-item ${isHome ? 'active' : ''}`}
          onClick={handleHomeClick}
          title="Beranda Utama"
        >
          <div className="bottom-nav-icon-wrap">
            <Home size={20} />
            {isHome && <span className="bottom-nav-active-dot" />}
          </div>
          <span className="bottom-nav-label">Beranda</span>
        </button>

        {/* 2. Rilis Fansub / Scraper */}
        <button
          id="bottom-nav-scraper"
          className="bottom-nav-item"
          onClick={onOpenScraper}
          title="Rilis Live Scraper Tokusatsu"
        >
          <div className="bottom-nav-icon-wrap">
            <Zap size={20} color="#10b981" />
            {scrapedCount > 0 && (
              <span className="bottom-nav-badge green">{scrapedCount}</span>
            )}
          </div>
          <span className="bottom-nav-label">Rilis Fansub</span>
        </button>

        {/* 3. Pencarian Cepat */}
        <button
          id="bottom-nav-search"
          className="bottom-nav-item highlight-btn"
          onClick={onFocusSearch}
          title="Cari Tokusatsu"
        >
          <div className="bottom-nav-search-bubble">
            <Search size={20} color="#ffffff" />
          </div>
          <span className="bottom-nav-label">Pencarian</span>
        </button>

        {/* 4. Favorit / Watchlist */}
        <button
          id="bottom-nav-watchlist"
          className="bottom-nav-item"
          onClick={onOpenWatchlist}
          title="Daftar Tontonan Favorit"
        >
          <div className="bottom-nav-icon-wrap">
            <Bookmark size={20} />
            {watchlistCount > 0 && (
              <span className="bottom-nav-badge red">{watchlistCount}</span>
            )}
          </div>
          <span className="bottom-nav-label">Favorit</span>
        </button>

        {/* 5. Ganti Tema (Terang / Gelap) */}
        <button
          id="bottom-nav-theme"
          className="bottom-nav-item"
          onClick={onToggleTheme}
          title={theme === 'dark' ? "Beralih ke Tema Terang" : "Beralih ke Tema Gelap"}
        >
          <div className="bottom-nav-icon-wrap">
            {theme === 'dark' ? (
              <Sun size={20} color="#f59e0b" />
            ) : (
              <Moon size={20} color="#6366f1" />
            )}
          </div>
          <span className="bottom-nav-label">{theme === 'dark' ? 'Terang' : 'Gelap'}</span>
        </button>
      </div>

      <style>{`
        .mobile-bottom-nav-container {
          display: none;
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          z-index: 1050;
          padding: 0 12px 10px;
          pointer-events: none;
        }

        @media (max-width: 768px) {
          .mobile-bottom-nav-container {
            display: block;
          }
        }

        .force-mobile-mode .mobile-bottom-nav-container {
          display: block;
        }

        .mobile-bottom-nav-bar {
          pointer-events: auto;
          max-width: 480px;
          margin: 0 auto;
          display: flex;
          align-items: center;
            justify-content: space-around;
            background: rgba(9, 13, 22, 0.92);
            backdrop-filter: blur(24px);
            -webkit-backdrop-filter: blur(24px);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 28px;
            padding: 8px 10px;
            box-shadow: 0 -4px 25px rgba(0, 0, 0, 0.6), 0 0 15px rgba(255, 32, 78, 0.15);
            padding-bottom: calc(8px + env(safe-area-inset-bottom, 0px));
          }

          html[data-theme="light"] .mobile-bottom-nav-bar {
            background: rgba(255, 255, 255, 0.95) !important;
            border-color: rgba(15, 23, 42, 0.12) !important;
            box-shadow: 0 8px 30px rgba(15, 23, 42, 0.15) !important;
          }

          .bottom-nav-item {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 3px;
            flex: 1;
            padding: 4px 0;
            color: var(--text-muted);
            transition: all var(--transition-fast);
            cursor: pointer;
            user-select: none;
          }

          html[data-theme="light"] .bottom-nav-item {
            color: #64748b;
          }

          .bottom-nav-item:hover,
          .bottom-nav-item.active {
            color: #ffffff;
          }

          html[data-theme="light"] .bottom-nav-item:hover,
          html[data-theme="light"] .bottom-nav-item.active {
            color: #0f172a;
          }

          .bottom-nav-item.active .bottom-nav-icon-wrap {
            color: var(--accent-red);
          }

          html[data-theme="light"] .bottom-nav-item.active .bottom-nav-icon-wrap {
            color: var(--accent-red);
          }

          .bottom-nav-icon-wrap {
            position: relative;
            display: flex;
            align-items: center;
            justify-content: center;
            height: 24px;
            transition: transform 0.2s ease;
          }

          .bottom-nav-item:active .bottom-nav-icon-wrap {
            transform: scale(0.9);
          }

          .bottom-nav-active-dot {
            position: absolute;
            bottom: -5px;
            width: 4px;
            height: 4px;
            border-radius: 50%;
            background: var(--accent-red);
            box-shadow: 0 0 6px var(--accent-red);
          }

          .bottom-nav-label {
            font-size: 0.68rem;
            font-weight: 700;
            letter-spacing: 0.02em;
          }

          .bottom-nav-item.active .bottom-nav-label {
            color: var(--accent-red);
          }

          .bottom-nav-badge {
            position: absolute;
            top: -4px;
            right: -8px;
            font-size: 0.6rem;
            font-weight: 800;
            padding: 1px 4px;
            border-radius: 999px;
            line-height: 1;
          }

          .bottom-nav-badge.red {
            background: var(--accent-red);
            color: #ffffff;
            box-shadow: 0 0 6px rgba(255, 32, 78, 0.6);
          }

          .bottom-nav-badge.green {
            background: #10b981;
            color: #050b14;
            box-shadow: 0 0 6px rgba(16, 185, 129, 0.6);
          }

          .bottom-nav-search-bubble {
            width: 38px;
            height: 38px;
            border-radius: 50%;
            background: linear-gradient(135deg, var(--accent-red) 0%, #b5179e 100%);
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 4px 15px rgba(255, 32, 78, 0.45);
            margin-top: -14px;
            border: 2px solid rgba(255, 255, 255, 0.2);
            transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
          }

          .bottom-nav-item.highlight-btn:active .bottom-nav-search-bubble {
            transform: scale(0.92);
          }
      `}</style>
    </nav>
  );
}
