import React, { useState } from 'react';
import { 
  Sparkles, 
  Search, 
  Key, 
  Bookmark, 
  History, 
  Menu, 
  X, 
  ShieldCheck, 
  Flame, 
  Zap, 
  Swords,
  Tv,
  Terminal,
  Sun,
  Moon
} from 'lucide-react';

export default function Navbar({ 
  searchQuery, 
  setSearchQuery, 
  selectedFranchise, 
  setSelectedFranchise, 
  onOpenApiKeyModal, 
  onOpenWatchlist, 
  onOpenSpecs,
  onOpenScraper,
  scrapedCount = 11,
  watchlistCount, 
  hasTmdbKey,
  theme = 'dark',
  onToggleTheme
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

  const navFranchises = [
    { id: 'all', name: 'Semua', icon: Sparkles },
    { id: 'kamen-rider', name: 'Kamen Rider', icon: ShieldCheck, color: '#ff204e' },
    { id: 'super-sentai', name: 'Super Sentai', icon: Flame, color: '#ffb703' },
    { id: 'ultraman', name: 'Ultraman', icon: Zap, color: '#00f2fe' },
    { id: 'garo', name: 'Garo & Kaiju', icon: Swords, color: '#c77dff' }
  ];

  const handleSelectFranchise = (id) => {
    setSelectedFranchise(id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <header className="navbar-container">
      <div className="navbar-glass">
        {/* Brand Logo */}
        <div className="brand-logo" onClick={() => handleSelectFranchise('all')}>
          <div className="logo-icon-wrapper">
            <img 
              src="/logo-512.png" 
              alt="Tokustream Logo" 
              className="brand-logo-img" 
            />
          </div>
          <div className="logo-text">
            <span className="logo-main">TOKU<span className="logo-accent">FLIX</span></span>
            <span className="logo-badge">SUB INDO</span>
          </div>
        </div>

        {/* Desktop Franchise Navigation */}
        <nav className="nav-franchises">
          {navFranchises.map((item) => {
            const Icon = item.icon;
            const currentNorm = (selectedFranchise || 'all').toLowerCase().replace(/\s+/g, '-');
            const isActive = currentNorm === item.id;
            return (
              <button
                key={item.id}
                id={`nav-franchise-${item.id}`}
                className={`nav-pill ${isActive ? 'active' : ''}`}
                onClick={() => handleSelectFranchise(item.id)}
              >
                <Icon size={16} color={isActive ? '#ffffff' : (item.color || 'currentColor')} />
                <span>{item.name}</span>
              </button>
            );
          })}
        </nav>

        {/* Search & Actions */}
        <div className="nav-actions">
          {/* Desktop Search Bar */}
          <div className="search-input-wrapper">
            <Search size={16} className="search-icon" />
            <input
              id="search-input"
              type="text"
              placeholder="Cari Kamen Rider, Sentai..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
            {searchQuery && (
              <button id="clear-search-btn" className="clear-search-btn" onClick={() => setSearchQuery('')}>
                <X size={14} />
              </button>
            )}
          </div>

          {/* Mobile Search Toggle Button */}
          <button
            id="mobile-search-toggle-btn"
            className="mobile-search-toggle-btn"
            onClick={() => setMobileSearchOpen(!mobileSearchOpen)}
            title="Cari Tokusatsu"
          >
            <Search size={18} />
          </button>

          {/* Watchlist / Favorit */}
          <button 
            id="watchlist-nav-btn"
            className="watchlist-btn"
            onClick={onOpenWatchlist}
            title="Daftar Tontonan & Favorit Saya"
          >
            <Bookmark size={18} />
            {watchlistCount > 0 && (
              <span className="watchlist-badge">{watchlistCount}</span>
            )}
          </button>

          {/* Dark / Light Theme Toggle */}
          <button 
            id="theme-toggle-btn"
            className="theme-toggle-btn"
            onClick={onToggleTheme}
            title={theme === 'dark' ? "Beralih ke Tema Terang (Light Mode)" : "Beralih ke Tema Gelap (Dark Mode)"}
            aria-label="Ganti Tema"
          >
            <div className="theme-toggle-icon-wrap">
              {theme === 'dark' ? (
                <Sun size={17} className="theme-sun-icon" />
              ) : (
                <Moon size={17} className="theme-moon-icon" />
              )}
            </div>
            <span className="theme-toggle-label">{theme === 'dark' ? 'Terang' : 'Gelap'}</span>
          </button>

          {/* Mobile Menu Toggle */}
          <button 
            id="mobile-menu-toggle-btn"
            className="mobile-toggle-btn"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Menu"
          >
            {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile Search Bar Dropdown */}
      {mobileSearchOpen && (
        <div className="mobile-search-dropdown glass-panel">
          <Search size={16} className="search-icon" />
          <input
            id="mobile-search-input"
            type="text"
            placeholder="Cari Kamen Rider, Sentai, Ultraman..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            autoFocus
            className="mobile-search-input"
          />
          {searchQuery && (
            <button className="clear-search-btn" onClick={() => setSearchQuery('')}>
              <X size={15} />
            </button>
          )}
        </div>
      )}

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div className="mobile-menu-drawer glass-panel">
          <div className="mobile-drawer-section-title">UNIVERSE TOKUSATSU</div>
          <div className="mobile-franchise-list">
            {navFranchises.map((item) => {
              const Icon = item.icon;
              const currentNorm = (selectedFranchise || 'all').toLowerCase().replace(/\s+/g, '-');
              const isActive = currentNorm === item.id;
              return (
                <button
                  key={item.id}
                  className={`mobile-nav-item ${isActive ? 'active' : ''}`}
                  onClick={() => {
                    handleSelectFranchise(item.id);
                    setMobileMenuOpen(false);
                  }}
                >
                  <Icon size={18} color={item.color || 'currentColor'} />
                  <span>{item.name}</span>
                </button>
              );
            })}
          </div>

          <div className="mobile-drawer-section-title">FITUR & AKSES</div>
          <div className="mobile-tools-list">
            {/* Live Fansub Scraper */}
            <button
              className="mobile-tool-item"
              onClick={() => {
                onOpenScraper?.();
                setMobileMenuOpen(false);
              }}
            >
              <Zap size={18} color="#10b981" />
              <div className="tool-text-group">
                <span className="tool-title">Live Fansub Scraper</span>
                <span className="tool-desc">Hasil rilis episode & GDrive</span>
              </div>
              <span className="scraped-count-badge">{scrapedCount}</span>
            </button>

            {/* Watchlist & History */}
            <button
              className="mobile-tool-item"
              onClick={() => {
                onOpenWatchlist?.();
                setMobileMenuOpen(false);
              }}
            >
              <Bookmark size={18} color="var(--accent-red)" />
              <div className="tool-text-group">
                <span className="tool-title">Daftar Favorit & Riwayat</span>
                <span className="tool-desc">Tersimpan di perangkat</span>
              </div>
              {watchlistCount > 0 && <span className="watchlist-badge">{watchlistCount}</span>}
            </button>

            {/* TMDB API Key */}
            <button
              className="mobile-tool-item"
              onClick={() => {
                onOpenApiKeyModal?.();
                setMobileMenuOpen(false);
              }}
            >
              <Key size={18} color="#f59e0b" />
              <div className="tool-text-group">
                <span className="tool-title">TMDB Live API Key</span>
                <span className="tool-desc">{hasTmdbKey ? 'Status: Terhubung Online' : 'Status: Belum Terhubung'}</span>
              </div>
              <span className={`status-indicator ${hasTmdbKey ? 'online' : 'offline'}`} />
            </button>

            {/* REST API Specs */}
            <button
              className="mobile-tool-item"
              onClick={() => {
                onOpenSpecs?.();
                setMobileMenuOpen(false);
              }}
            >
              <Terminal size={18} color="var(--accent-cyan)" />
              <div className="tool-text-group">
                <span className="tool-title">REST API & DB Schema</span>
                <span className="tool-desc">01 & 02 Specification Specs</span>
              </div>
            </button>
          </div>

          <div className="mobile-drawer-footer">
            <button 
              id="mobile-theme-toggle-btn"
              className="mobile-theme-toggle-btn"
              onClick={() => {
                onToggleTheme?.();
                setMobileMenuOpen(false);
              }}
            >
              {theme === 'dark' ? (
                <>
                  <Sun size={18} color="#f59e0b" />
                  <span>Beralih ke Tema Terang (Light Mode)</span>
                </>
              ) : (
                <>
                  <Moon size={18} color="#6366f1" />
                  <span>Beralih ke Tema Gelap (Dark Mode)</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      <style>{`
        .navbar-container {
          position: sticky;
          top: 0;
          z-index: 100;
          padding: 14px 24px;
        }
        .navbar-glass {
          max-width: 1440px;
          margin: 0 auto;
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: rgba(9, 13, 22, 0.85);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: var(--radius-lg);
          padding: 10px 18px;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.4);
        }
        .brand-logo {
          display: flex;
          align-items: center;
          gap: 10px;
          cursor: pointer;
          user-select: none;
        }
        .logo-icon-wrapper {
          width: 44px;
          height: 44px;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          filter: drop-shadow(0 0 8px rgba(255, 32, 78, 0.45));
          transition: transform var(--transition-bounce), filter var(--transition-fast);
        }
        .brand-logo:hover .logo-icon-wrapper {
          transform: scale(1.1) rotate(-4deg);
          filter: drop-shadow(0 0 16px rgba(0, 242, 254, 0.7));
        }
        .brand-logo-img {
          width: 100%;
          height: 100%;
          object-fit: contain;
        }
        .logo-text {
          display: flex;
          align-items: baseline;
          gap: 6px;
        }
        .logo-main {
          font-family: var(--font-display);
          font-size: 1.4rem;
          font-weight: 800;
          letter-spacing: 0.04em;
          color: #ffffff;
        }
        .logo-accent {
          color: var(--accent-red);
          text-shadow: 0 0 12px var(--accent-red-glow);
        }
        .logo-badge {
          background: rgba(0, 242, 254, 0.15);
          color: var(--accent-cyan);
          border: 1px solid rgba(0, 242, 254, 0.3);
          font-size: 0.65rem;
          font-weight: 800;
          padding: 2px 5px;
          border-radius: 4px;
        }
        .nav-franchises {
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .nav-pill {
          display: flex;
          align-items: center;
          gap: 7px;
          padding: 7px 14px;
          font-size: 0.85rem;
          font-weight: 600;
          color: var(--text-secondary);
          border-radius: var(--radius-full);
          border: 1px solid transparent;
          transition: all var(--transition-fast);
        }
        .nav-pill:hover {
          color: #ffffff;
          background: rgba(255, 255, 255, 0.06);
        }
        .nav-pill.active {
          color: #ffffff;
          background: rgba(255, 32, 78, 0.18);
          border-color: rgba(255, 32, 78, 0.4);
          box-shadow: 0 0 12px rgba(255, 32, 78, 0.25);
        }
        .nav-actions {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .search-input-wrapper {
          position: relative;
          display: flex;
          align-items: center;
        }
        .search-icon {
          position: absolute;
          left: 12px;
          color: var(--text-muted);
          pointer-events: none;
        }
        .search-input {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-full);
          padding: 8px 32px 8px 34px;
          font-size: 0.84rem;
          color: #ffffff;
          outline: none;
          width: 200px;
          transition: all var(--transition-normal);
        }
        .search-input:focus {
          width: 250px;
          background: rgba(255, 255, 255, 0.09);
          border-color: var(--accent-red);
          box-shadow: 0 0 15px rgba(255, 32, 78, 0.25);
        }
        .clear-search-btn {
          position: absolute;
          right: 10px;
          color: var(--text-muted);
        }
        .clear-search-btn:hover {
          color: #ffffff;
        }
        .scraper-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          font-size: 0.8rem;
          font-weight: 700;
          background: rgba(16, 185, 129, 0.1);
          border: 1px solid rgba(16, 185, 129, 0.3);
          border-radius: var(--radius-full);
          color: #10b981;
          transition: all var(--transition-fast);
        }
        .scraper-btn:hover {
          background: rgba(16, 185, 129, 0.2);
          border-color: #10b981;
          box-shadow: 0 0 12px rgba(16, 185, 129, 0.35);
        }
        .live-dot-pulse {
          width: 7px;
          height: 7px;
          background: #10b981;
          border-radius: 50%;
          box-shadow: 0 0 8px #10b981;
          animation: pulse-dot 1.8s infinite;
        }
        @keyframes pulse-dot {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(0.8); }
        }
        .scraped-count-badge {
          background: #10b981;
          color: #030508;
          font-size: 0.68rem;
          font-weight: 800;
          padding: 1px 6px;
          border-radius: 999px;
        }
        .specs-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 7px 12px;
          font-size: 0.8rem;
          font-weight: 700;
          background: rgba(0, 242, 254, 0.08);
          border: 1px solid rgba(0, 242, 254, 0.25);
          border-radius: var(--radius-full);
          color: var(--accent-cyan);
          transition: all var(--transition-fast);
        }
        .specs-btn:hover {
          background: rgba(0, 242, 254, 0.18);
          border-color: var(--accent-cyan);
          box-shadow: 0 0 10px rgba(0, 242, 254, 0.3);
        }
        .api-key-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 7px 13px;
          font-size: 0.82rem;
          font-weight: 600;
          background: rgba(255, 255, 255, 0.06);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-full);
          color: var(--text-secondary);
        }
        .api-key-btn:hover {
          background: rgba(255, 255, 255, 0.12);
          color: #ffffff;
        }
        .api-key-btn.connected {
          border-color: rgba(16, 185, 129, 0.4);
          background: rgba(16, 185, 129, 0.1);
          color: #a7f3d0;
        }
        .status-indicator {
          width: 7px;
          height: 7px;
          border-radius: 50%;
        }
        .status-indicator.online {
          background: #10b981;
          box-shadow: 0 0 8px #10b981;
        }
        .status-indicator.offline {
          background: #f59e0b;
        }
        .watchlist-btn {
          position: relative;
          width: 38px;
          height: 38px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(255, 255, 255, 0.06);
          border: 1px solid var(--border-subtle);
          color: var(--text-secondary);
        }
        .watchlist-btn:hover {
          color: #ffffff;
          background: rgba(255, 255, 255, 0.12);
        }
        .watchlist-badge {
          position: absolute;
          top: -2px;
          right: -2px;
          background: var(--accent-red);
          color: #ffffff;
          font-size: 0.65rem;
          font-weight: 800;
          width: 17px;
          height: 17px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 0 8px var(--accent-red);
        }
        .mobile-search-toggle-btn {
          display: none;
          align-items: center;
          justify-content: center;
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.06);
          border: 1px solid var(--border-subtle);
          color: var(--text-main);
          cursor: pointer;
        }
        .mobile-toggle-btn {
          display: none;
          align-items: center;
          justify-content: center;
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.06);
          border: 1px solid var(--border-subtle);
          color: var(--text-main);
          cursor: pointer;
        }
        .mobile-search-dropdown {
          margin-top: 8px;
          padding: 8px 14px;
          display: flex;
          align-items: center;
          gap: 10px;
          border-radius: var(--radius-md);
          background: rgba(9, 13, 22, 0.95);
          backdrop-filter: blur(20px);
          border: 1px solid var(--border-light);
          animation: fadeIn 0.2s ease-out;
        }
        html[data-theme="light"] .mobile-search-dropdown {
          background: rgba(255, 255, 255, 0.98) !important;
          border-color: rgba(15, 23, 42, 0.12) !important;
          box-shadow: 0 4px 15px rgba(15, 23, 42, 0.08) !important;
        }
        .mobile-search-input {
          flex: 1;
          background: transparent;
          border: none;
          color: var(--text-main);
          font-size: 0.9rem;
          font-weight: 500;
          outline: none;
          font-family: inherit;
        }
        .mobile-menu-drawer {
          margin-top: 10px;
          padding: 14px;
          display: flex;
          flex-direction: column;
          gap: 8px;
          max-height: 80vh;
          overflow-y: auto;
        }
        .mobile-drawer-section-title {
          font-size: 0.68rem;
          font-weight: 800;
          letter-spacing: 0.08em;
          color: var(--text-muted);
          margin-top: 6px;
          margin-bottom: 2px;
          padding: 0 6px;
        }
        .mobile-nav-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 9px 12px;
          border-radius: var(--radius-md);
          font-size: 0.9rem;
          font-weight: 600;
          text-align: left;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid transparent;
        }
        .mobile-nav-item.active {
          background: rgba(255, 32, 78, 0.2);
          border-color: rgba(255, 32, 78, 0.4);
          color: #ffffff;
        }
        .mobile-tools-list {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .mobile-tool-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 9px 12px;
          border-radius: var(--radius-md);
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid var(--border-subtle);
          color: var(--text-main);
          text-align: left;
          cursor: pointer;
        }
        .mobile-tool-item:active {
          background: rgba(255, 255, 255, 0.08);
        }
        .tool-text-group {
          flex: 1;
          display: flex;
          flex-direction: column;
        }
        .tool-title {
          font-size: 0.86rem;
          font-weight: 700;
        }
        .tool-desc {
          font-size: 0.72rem;
          color: var(--text-muted);
        }

        /* Dark / Light Theme Toggle Button */
        .theme-toggle-btn {
          display: flex;
          align-items: center;
          gap: 7px;
          height: 38px;
          padding: 0 12px;
          border-radius: var(--radius-full);
          background: rgba(255, 255, 255, 0.06);
          border: 1px solid var(--border-subtle);
          color: var(--text-main);
          cursor: pointer;
          transition: all var(--transition-normal);
          user-select: none;
        }
        .theme-toggle-btn:hover {
          background: rgba(255, 255, 255, 0.12);
          border-color: var(--accent-red);
          transform: translateY(-1px);
        }
        .theme-toggle-icon-wrap {
          display: flex;
          align-items: center;
          justify-content: center;
          transition: transform 0.3s ease;
        }
        .theme-toggle-btn:hover .theme-toggle-icon-wrap {
          transform: rotate(25deg) scale(1.1);
        }
        .theme-sun-icon {
          color: #f59e0b;
          filter: drop-shadow(0 0 6px rgba(245, 158, 11, 0.6));
        }
        .theme-moon-icon {
          color: #6366f1;
          filter: drop-shadow(0 0 6px rgba(99, 102, 241, 0.6));
        }
        .theme-toggle-label {
          font-size: 0.8rem;
          font-weight: 700;
          letter-spacing: 0.02em;
        }

        .mobile-drawer-footer {
          margin-top: 10px;
          padding-top: 10px;
          border-top: 1px solid var(--border-subtle);
        }
        .mobile-theme-toggle-btn {
          display: flex;
          align-items: center;
          gap: 10px;
          width: 100%;
          padding: 11px 14px;
          border-radius: var(--radius-md);
          background: rgba(255, 255, 255, 0.06);
          border: 1px solid var(--border-subtle);
          color: var(--text-main);
          font-weight: 600;
          font-size: 0.88rem;
          cursor: pointer;
          transition: all var(--transition-fast);
        }
        .mobile-theme-toggle-btn:hover {
          background: rgba(255, 255, 255, 0.12);
        }

        /* Light Theme Overrides for Navbar */
        html[data-theme="light"] .navbar-glass {
          background: rgba(255, 255, 255, 0.88) !important;
          border-color: rgba(15, 23, 42, 0.08) !important;
          box-shadow: 0 10px 30px rgba(15, 23, 42, 0.07) !important;
        }
        html[data-theme="light"] .brand-logo .logo-main {
          color: #0f172a !important;
        }
        html[data-theme="light"] .nav-pill {
          color: #475569 !important;
        }
        html[data-theme="light"] .nav-pill:hover {
          color: #0f172a !important;
          background: #f1f5f9 !important;
        }
        html[data-theme="light"] .nav-pill.active {
          color: var(--accent-red) !important;
          background: rgba(225, 29, 72, 0.1) !important;
          border-color: rgba(225, 29, 72, 0.3) !important;
          box-shadow: 0 2px 8px rgba(225, 29, 72, 0.15) !important;
        }
        html[data-theme="light"] .search-input {
          background: #f1f5f9 !important;
          border-color: #cbd5e1 !important;
          color: #0f172a !important;
        }
        html[data-theme="light"] .search-input:focus {
          background: #ffffff !important;
          border-color: var(--accent-red) !important;
          box-shadow: 0 0 0 3px rgba(225, 29, 72, 0.15) !important;
        }
        html[data-theme="light"] .theme-toggle-btn {
          background: #f1f5f9 !important;
          border-color: #cbd5e1 !important;
          color: #0f172a !important;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05) !important;
        }
        html[data-theme="light"] .theme-toggle-btn:hover {
          background: #e2e8f0 !important;
          border-color: var(--accent-red) !important;
        }
        html[data-theme="light"] .api-key-btn {
          background: #f1f5f9 !important;
          border-color: #cbd5e1 !important;
          color: #334155 !important;
        }
        html[data-theme="light"] .api-key-btn:hover {
          background: #e2e8f0 !important;
          color: #0f172a !important;
        }
        html[data-theme="light"] .api-key-btn.connected {
          background: rgba(16, 185, 129, 0.12) !important;
          border-color: rgba(16, 185, 129, 0.35) !important;
          color: #065f46 !important;
        }
        html[data-theme="light"] .watchlist-btn {
          background: #f1f5f9 !important;
          border-color: #cbd5e1 !important;
          color: #334155 !important;
        }
        html[data-theme="light"] .watchlist-btn:hover {
          background: #e2e8f0 !important;
          color: #0f172a !important;
        }
        html[data-theme="light"] .mobile-toggle-btn {
          color: #0f172a !important;
        }
        html[data-theme="light"] .mobile-menu-drawer {
          background: rgba(255, 255, 255, 0.95) !important;
          border-color: rgba(15, 23, 42, 0.1) !important;
          box-shadow: 0 12px 30px rgba(15, 23, 42, 0.12) !important;
        }
        html[data-theme="light"] .mobile-nav-item {
          color: #334155 !important;
        }
        html[data-theme="light"] .mobile-nav-item:hover {
          background: #f1f5f9 !important;
          color: #0f172a !important;
        }
        html[data-theme="light"] .mobile-nav-item.active {
          background: rgba(225, 29, 72, 0.1) !important;
          color: var(--accent-red) !important;
        }
        html[data-theme="light"] .mobile-theme-toggle-btn {
          background: #f1f5f9 !important;
          border-color: #cbd5e1 !important;
          color: #0f172a !important;
        }

        @media (max-width: 1024px) {
          .nav-franchises {
            display: none;
          }
          .api-btn-text,
          .specs-btn-text,
          .scraper-btn-text,
          .theme-toggle-label {
            display: none;
          }
        }

        @media (max-width: 768px) {
          .nav-franchises {
            display: none !important;
          }
          .navbar-container {
            padding: 8px 12px;
          }
          .navbar-glass {
            padding: 6px 12px;
          }
          .brand-logo .logo-main {
            font-size: 1.15rem;
          }
          .logo-badge {
            font-size: 0.6rem;
            padding: 1px 4px;
          }
          .logo-icon-wrapper {
            width: 32px;
            height: 32px;
          }
          /* Hide overcrowded desktop buttons on mobile */
          .search-input-wrapper,
          .scraper-btn,
          .specs-btn,
          .api-key-btn,
          .watchlist-btn,
          .theme-toggle-btn {
            display: none !important;
          }
          /* Show mobile search and hamburger buttons */
          .mobile-search-toggle-btn {
            display: flex !important;
          }
          .mobile-toggle-btn {
            display: flex !important;
          }
          .nav-actions {
            gap: 8px;
          }
        }

        .force-mobile-mode .nav-franchises {
          display: none !important;
        }
        .force-mobile-mode .navbar-container {
          padding: 8px 12px;
        }
        .force-mobile-mode .navbar-glass {
          padding: 6px 12px;
        }
        .force-mobile-mode .brand-logo .logo-main {
          font-size: 1.15rem;
        }
        .force-mobile-mode .logo-badge {
          font-size: 0.6rem;
          padding: 1px 4px;
        }
        .force-mobile-mode .logo-icon-wrapper {
          width: 32px;
          height: 32px;
        }
        .force-mobile-mode .search-input-wrapper,
        .force-mobile-mode .scraper-btn,
        .force-mobile-mode .specs-btn,
        .force-mobile-mode .api-key-btn,
        .force-mobile-mode .watchlist-btn,
        .force-mobile-mode .theme-toggle-btn {
          display: none !important;
        }
        .force-mobile-mode .mobile-search-toggle-btn {
          display: flex !important;
        }
        .force-mobile-mode .mobile-toggle-btn {
          display: flex !important;
        }
        .force-mobile-mode .nav-actions {
          gap: 8px;
        }
      `}</style>
    </header>
  );
}
