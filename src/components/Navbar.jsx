import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Search, 
  Key, 
  Bookmark, 
  Menu, 
  X, 
  ShieldCheck, 
  Flame, 
  Zap, 
  Swords,
  Tv,
  Terminal,
  Smartphone,
  Database,
  Bell,
  LogOut,
  LogIn,
  User,
  Sparkles
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
  onOpenInstallModal,
  scrapedCount = 11,
  watchlistCount, 
  hasTmdbKey,
  authSession = null,
  onLogin = null,
  onLogout = null
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('beranda');
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0, opacity: 0 });
  const navContainerRef = useRef(null);
  const buttonRefs = useRef({});

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

  const isManualClickRef = useRef(false);
  const manualClickTimer = useRef(null);

  const setManualTab = (tabId) => {
    isManualClickRef.current = true;
    setActiveTab(tabId);
    clearTimeout(manualClickTimer.current);
    manualClickTimer.current = setTimeout(() => {
      isManualClickRef.current = false;
    }, 1500);
  };

  const scrollToSection = (id) => {
    const el = document.getElementById(id);
    if (el) {
      const headerOffset = 70;
      const elementPosition = el.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
      window.scrollTo({
        top: Math.max(0, offsetPosition),
        behavior: 'smooth'
      });
    }
    setMobileMenuOpen(false);
  };

  const desktopNavItems = [
    {
      id: 'beranda',
      label: 'Beranda',
      onClick: () => {
        setManualTab('beranda');
        handleSelectFranchise('all');
        scrollToSection('beranda');
      }
    },
    {
      id: 'top10',
      label: 'Terpopuler',
      onClick: () => {
        setManualTab('top10');
        scrollToSection('top10');
      }
    },
    {
      id: 'baru',
      label: 'Baru Rilis',
      onClick: () => {
        setManualTab('baru');
        scrollToSection('baru');
      }
    },
    {
      id: 'jelajah',
      label: 'Jelajah',
      onClick: () => {
        setManualTab('jelajah');
        scrollToSection('jelajah');
      }
    },
    {
      id: 'watchlist',
      label: 'Daftar Saya',
      badge: watchlistCount,
      onClick: () => {
        setManualTab('watchlist');
        onOpenWatchlist?.();
      }
    }
  ];

  const updateIndicator = useCallback((tabId) => {
    const targetEl = buttonRefs.current[tabId];
    const container = navContainerRef.current;
    if (targetEl && container) {
      const containerRect = container.getBoundingClientRect();
      const targetRect = targetEl.getBoundingClientRect();
      setIndicatorStyle({
        left: targetRect.left - containerRect.left,
        width: targetRect.width,
        opacity: 1
      });
    }
  }, []);

  useEffect(() => {
    updateIndicator(activeTab);
  }, [activeTab, updateIndicator]);

  useEffect(() => {
    const handleResize = () => updateIndicator(activeTab);
    window.addEventListener('resize', handleResize);

    const t1 = setTimeout(() => updateIndicator(activeTab), 50);
    const t2 = setTimeout(() => updateIndicator(activeTab), 300);

    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [activeTab, updateIndicator]);

  useEffect(() => {
    let scrollTimeout;
    const handleScroll = () => {
      if (isManualClickRef.current) return;
      if (scrollTimeout) return;
      scrollTimeout = setTimeout(() => {
        scrollTimeout = null;
        if (isManualClickRef.current) return;
        if (searchQuery) return;
        const scrollY = window.scrollY;
        if (scrollY < 200) {
          setActiveTab('beranda');
          return;
        }
        const sections = [
          { id: 'jelajah', el: document.getElementById('jelajah') },
          { id: 'baru', el: document.getElementById('baru') },
          { id: 'top10', el: document.getElementById('top10') }
        ];
        for (const s of sections) {
          if (s.el) {
            const top = s.el.offsetTop - 120;
            const bottom = top + s.el.offsetHeight;
            if (scrollY >= top && scrollY < bottom) {
              setActiveTab(s.id);
              break;
            }
          }
        }
      }, 100);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (scrollTimeout) clearTimeout(scrollTimeout);
    };
  }, [searchQuery]);

  return (
    <header className="sorot-header">
      <div className="header-inner">
        {/* Brand Logo */}
        <div 
          className="brand-logo" 
          onClick={() => {
            setManualTab('beranda');
            handleSelectFranchise('all');
            scrollToSection('beranda');
          }} 
          role="button" 
          tabIndex={0}
          aria-label="TOKUFLIX Beranda"
        >
          <img 
            src="/logo.png" 
            alt="Logo Resmi TOKUFLIX" 
            className="brand-official-logo" 
            width="38" 
            height="38" 
          />
          <div className="brand-title-box">
            <span className="brand-text disp">
              TOKU<span className="brand-highlight">FLIX</span>
            </span>
          </div>
        </div>

        {/* Desktop Nav Links with Animated Sliding Indicator */}
        <nav className="desktop-nav-links" ref={navContainerRef} aria-label="Menu Utama">
          {desktopNavItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button 
                key={item.id}
                id={`nav-tab-${item.id}`}
                ref={(el) => { if (el) buttonRefs.current[item.id] = el; }}
                type="button"
                className={`nav-link-btn ${isActive ? 'active' : ''}`}
                onClick={item.onClick}
              >
                {item.label}
                {item.badge > 0 && <span className="nav-badge-pill">{item.badge}</span>}
              </button>
            );
          })}
          {/* Animated Sliding Underline Indicator */}
          <span 
            className="nav-sliding-indicator" 
            style={{
              left: `${indicatorStyle.left}px`,
              width: `${indicatorStyle.width}px`,
              opacity: indicatorStyle.opacity
            }}
            aria-hidden="true"
          />
        </nav>

        {/* Flex spacer */}
        <div className="nav-spacer" />

        {/* Header Right Actions */}
        <div className="header-actions">
          {/* Desktop Search Capsule */}
          <div className="searchbox">
            <Search size={18} className="search-icon" aria-hidden="true" />
            <input
              id="search-input"
              type="search"
              placeholder="Cari judul atau genre"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="sr-input"
              aria-label="Cari judul atau genre"
            />
            {searchQuery && (
              <button 
                type="button" 
                className="clear-search-btn" 
                onClick={() => setSearchQuery('')}
                aria-label="Hapus kata kunci pencarian"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Mobile Search Toggle */}
          <button
            type="button"
            id="mobile-search-toggle-btn"
            className="mobile-search-toggle-btn"
            onClick={() => setMobileSearchOpen(!mobileSearchOpen)}
            aria-label="Buka pencarian"
          >
            <Search size={18} />
          </button>


          {/* Notifications Bell */}
          <button 
            type="button" 
            id="nav-bell-btn"
            className="ibtn nav-bell-btn" 
            aria-label="Notifikasi Rilis Fansub Terbaru"
            onClick={onOpenScraper}
            title={`${scrapedCount} Episode Baru Siap Ditonton`}
          >
            <Bell size={18} />
            {scrapedCount > 0 && <span className="bell-badge-dot" aria-hidden="true" />}
          </button>

          {/* User Account / Profile Button */}
          {authSession?.isAuthenticated ? (
            <div className="user-profile-badge" title={`Akun: ${authSession.user?.name} (${authSession.user?.email})`}>
              <img 
                src={authSession.user?.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'} 
                alt="Avatar Pengguna" 
                className="user-avatar-img"
              />
              <span className="user-firstname">{authSession.user?.name?.split(' ')[0]}</span>
              <button 
                type="button"
                id="nav-logout-btn"
                className="user-logout-btn"
                onClick={onLogout}
                title="Logout & Bersihkan Cache Sesi"
              >
                <LogOut size={13} />
              </button>
            </div>
          ) : (
            <button 
              type="button"
              id="nav-login-btn"
              className="user-login-btn"
              onClick={onLogin}
              title="Masuk Akun Pengguna"
            >
              <LogIn size={15} />
              <span>Masuk</span>
            </button>
          )}

          {/* Mobile Menu Toggle Button */}
          <button 
            type="button"
            id="mobile-menu-toggle-btn"
            className="mobile-hamburger-btn"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? "Tutup menu" : "Buka menu"}
          >
            {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile Search Input Dropdown */}
      {mobileSearchOpen && (
        <div className="mobile-search-dropdown">
          <Search size={18} className="mobile-search-icon" />
          <input
            id="mobile-search-input"
            type="search"
            placeholder="Cari Kamen Rider, Sentai, Ultraman..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            autoFocus
            className="mobile-search-input"
          />
          {searchQuery && (
            <button type="button" className="clear-search-btn" onClick={() => setSearchQuery('')}>
              <X size={15} />
            </button>
          )}
        </div>
      )}

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div className="mobile-drawer-overlay" onClick={() => setMobileMenuOpen(false)}>
          <div className="mobile-drawer-panel" onClick={(e) => e.stopPropagation()}>
            <div className="mobile-drawer-header">
              <div className="brand-logo">
                <img 
                  src="/logo.png" 
                  alt="Logo Resmi TOKUFLIX" 
                  className="brand-official-logo" 
                  width="32" 
                  height="32" 
                />
                <span className="brand-text disp" style={{ fontSize: '24px' }}>
                  TOKU<span className="brand-highlight">FLIX</span>
                </span>
              </div>
              <button 
                type="button" 
                className="close-drawer-btn" 
                onClick={() => setMobileMenuOpen(false)}
                aria-label="Tutup Menu"
              >
                <X size={20} />
              </button>
            </div>

            {/* User Session Profile in Mobile */}
            <div className="mobile-user-card">
              {authSession?.isAuthenticated ? (
                <div className="mobile-user-info-row">
                  <img 
                    src={authSession.user?.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'} 
                    alt="User Avatar" 
                    className="mobile-avatar-img"
                  />
                  <div className="mobile-user-details">
                    <span className="mobile-name">{authSession.user?.name}</span>
                    <span className="mobile-email">{authSession.user?.email}</span>
                  </div>
                  <button 
                    type="button" 
                    className="mobile-logout-btn" 
                    onClick={() => {
                      onLogout?.();
                      setMobileMenuOpen(false);
                    }}
                  >
                    <LogOut size={14} />
                    <span>Logout</span>
                  </button>
                </div>
              ) : (
                <div className="mobile-guest-row">
                  <div>
                    <div className="mobile-guest-title">Mode Tamu (Guest)</div>
                    <div className="mobile-guest-sub">Masuk untuk menyimpan riwayat personal</div>
                  </div>
                  <button 
                    type="button" 
                    className="mobile-login-btn" 
                    onClick={() => {
                      onLogin?.();
                      setMobileMenuOpen(false);
                    }}
                  >
                    <LogIn size={15} />
                    <span>Masuk</span>
                  </button>
                </div>
              )}
            </div>

            {/* Navigation links */}
            <div className="mobile-section-label">NAVIGASI UTAMA</div>
            <div className="mobile-nav-list">
              <button 
                type="button" 
                className="mobile-link-item" 
                onClick={() => {
                  handleSelectFranchise('all');
                  scrollToSection('beranda');
                }}
              >
                Beranda
              </button>
              <button 
                type="button" 
                className="mobile-link-item" 
                onClick={() => scrollToSection('top10')}
              >
                Top 10 Minggu Ini
              </button>
              <button 
                type="button" 
                className="mobile-link-item" 
                onClick={() => scrollToSection('baru')}
              >
                Baru Rilis
              </button>
              <button 
                type="button" 
                className="mobile-link-item" 
                onClick={() => scrollToSection('fitur')}
              >
                Fitur Tokuflix
              </button>
              <button 
                type="button" 
                className="mobile-link-item" 
                onClick={() => scrollToSection('jelajah')}
              >
                Jelajahi Katalog
              </button>
              <button 
                type="button" 
                className="mobile-link-item" 
                onClick={() => {
                  onOpenWatchlist?.();
                  setMobileMenuOpen(false);
                }}
              >
                <span>Daftar Saya (Watchlist & History)</span>
                {watchlistCount > 0 && <span className="scraped-badge">{watchlistCount}</span>}
              </button>
            </div>

            {/* Tokusatsu Franchises */}
            <div className="mobile-section-label">UNIVERSE TOKUSATSU</div>
            <div className="mobile-franchise-grid">
              {navFranchises.map((item) => {
                const Icon = item.icon;
                const isActive = (selectedFranchise || 'all').toLowerCase().replace(/\s+/g, '-') === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    className={`mobile-franchise-chip ${isActive ? 'active' : ''}`}
                    onClick={() => {
                      handleSelectFranchise(item.id);
                      setMobileMenuOpen(false);
                    }}
                  >
                    <Icon size={15} color={item.color || '#fff'} />
                    <span>{item.name}</span>
                  </button>
                );
              })}
            </div>

            {/* Additional Features */}
            <div className="mobile-section-label">ALAT & KONTROL SISTEM</div>
            <div className="mobile-tools-list">
              <button
                type="button"
                className="mobile-tool-item"
                onClick={() => {
                  onOpenSpecs?.();
                  setMobileMenuOpen(false);
                }}
              >
                <Database size={18} color="var(--accent-cyan)" />
                <div className="tool-text">
                  <strong>Smart Cache & API Inspector</strong>
                  <small>Audit Storage, 48h TTL & Sesi</small>
                </div>
              </button>

              <button
                type="button"
                className="mobile-tool-item"
                onClick={() => {
                  onOpenScraper?.();
                  setMobileMenuOpen(false);
                }}
              >
                <Zap size={18} color="#10b981" />
                <div className="tool-text">
                  <strong>Live Fansub Scraper Hub</strong>
                  <small>{scrapedCount} Rilis Aktif & GDrive Mirror</small>
                </div>
              </button>

              <button
                type="button"
                className="mobile-tool-item"
                onClick={() => {
                  onOpenInstallModal?.();
                  setMobileMenuOpen(false);
                }}
              >
                <Smartphone size={18} color="var(--accent-red)" />
                <div className="tool-text">
                  <strong>Pasang Aplikasi Mobile</strong>
                  <small>Instal PWA & Unduh APK Android</small>
                </div>
              </button>

              <button
                type="button"
                className="mobile-tool-item"
                onClick={() => {
                  onOpenApiKeyModal?.();
                  setMobileMenuOpen(false);
                }}
              >
                <Key size={18} color="#f59e0b" />
                <div className="tool-text">
                  <strong>TMDB Live API Key</strong>
                  <small>{hasTmdbKey ? 'Status: Terhubung Online' : 'Status: Belum Terhubung'}</small>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .sorot-header {
          position: sticky;
          top: 0;
          z-index: 100;
          background: linear-gradient(180deg, rgba(11, 11, 12, 0.95) 0%, rgba(11, 11, 12, 0.82) 75%, rgba(11, 11, 12, 0) 100%);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          transition: background var(--transition-normal);
        }
        .header-inner {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 16px clamp(16px, 4vw, 56px);
          max-width: 1440px;
          margin: 0 auto;
        }
        .brand-logo {
          display: flex;
          align-items: center;
          gap: 12px;
          cursor: pointer;
          user-select: none;
          text-decoration: none;
        }
        .brand-official-logo {
          width: 38px;
          height: 38px;
          object-fit: contain;
          filter: drop-shadow(0 2px 10px rgba(229, 9, 20, 0.55));
          transition: transform var(--transition-bounce);
        }
        .brand-logo:hover .brand-official-logo {
          transform: scale(1.1) rotate(-3deg);
        }
        .brand-title-box {
          display: flex;
          align-items: center;
        }
        .brand-text {
          font-size: 26px;
          font-weight: 900;
          letter-spacing: -0.02em;
          line-height: 1;
          color: #FFFFFF;
          text-transform: uppercase;
        }
        .brand-highlight {
          color: var(--accent-red, #E50914);
          text-shadow: 0 0 16px rgba(229, 9, 20, 0.55);
        }

        .desktop-nav-links {
          position: relative;
          display: flex;
          align-items: center;
          gap: 24px;
          margin-left: 28px;
        }
        .nav-link-btn {
          position: relative;
          background: transparent;
          border: none;
          color: #D2D2D6;
          font-size: 15px;
          font-weight: 500;
          cursor: pointer;
          padding: 8px 0;
          transition: color 0.22s cubic-bezier(0.4, 0, 0.2, 1);
          display: flex;
          align-items: center;
          gap: 6px;
          z-index: 1;
        }
        .nav-link-btn:hover {
          color: #FFFFFF;
        }
        .nav-link-btn.active {
          color: #FFFFFF;
          font-weight: 700;
        }
        .nav-sliding-indicator {
          position: absolute;
          bottom: 0px;
          height: 3px;
          background: var(--accent-red, #E50914);
          border-radius: 4px 4px 0 0;
          box-shadow: 0 0 12px rgba(229, 9, 20, 0.75), 0 0 4px rgba(229, 9, 20, 0.95);
          transition: left 0.35s cubic-bezier(0.25, 1, 0.5, 1), 
                      width 0.35s cubic-bezier(0.25, 1, 0.5, 1), 
                      opacity 0.25s ease;
          pointer-events: none;
          z-index: 2;
        }
        .nav-badge-pill {
          background: var(--accent-red);
          color: #FFFFFF;
          font-size: 11px;
          font-weight: 700;
          padding: 1px 6px;
          border-radius: 10px;
        }

        .nav-spacer {
          flex: 1 1 auto;
        }

        .header-actions {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .searchbox {
          display: flex;
          align-items: center;
          gap: 8px;
          height: 42px;
          padding: 0 14px;
          border: 1px solid rgba(255, 255, 255, 0.22);
          border-radius: 999px;
          background: rgba(0, 0, 0, 0.45);
          color: #D2D2D6;
          transition: border-color var(--transition-fast), background var(--transition-fast);
        }
        .searchbox:focus-within {
          border-color: #FFFFFF;
          background: rgba(0, 0, 0, 0.7);
        }
        .search-icon {
          color: #8E8E94;
          flex-shrink: 0;
        }
        .sr-input {
          width: 180px;
          background: transparent;
          border: 0;
          outline: none;
          color: #FFFFFF;
          font-size: 14px;
          font-family: var(--font-body);
        }
        .sr-input::placeholder {
          color: #8E8E94;
        }
        .clear-search-btn {
          background: transparent;
          border: 0;
          color: #8E8E94;
          cursor: pointer;
          display: flex;
          align-items: center;
        }
        .clear-search-btn:hover {
          color: #FFFFFF;
        }

        .mobile-search-toggle-btn {
          display: none;
          align-items: center;
          justify-content: center;
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.15);
          color: #FFFFFF;
          cursor: pointer;
        }

        .nav-action-btn.smart-cache-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          height: 40px;
          padding: 0 14px;
          border-radius: var(--radius-full);
          background: rgba(0, 242, 254, 0.08);
          border: 1px solid rgba(0, 242, 254, 0.3);
          color: var(--accent-cyan);
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
          transition: all var(--transition-fast);
        }
        .nav-action-btn.smart-cache-btn:hover {
          background: rgba(0, 242, 254, 0.18);
          border-color: var(--accent-cyan);
          box-shadow: 0 0 14px rgba(0, 242, 254, 0.3);
        }

        .nav-bell-btn {
          width: 42px;
          height: 42px;
          border-color: rgba(255, 255, 255, 0.22);
        }
        .bell-badge-dot {
          position: absolute;
          top: 10px;
          right: 11px;
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: var(--accent-red);
          box-shadow: 0 0 8px var(--accent-red);
        }

        .user-profile-badge {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 4px 10px 4px 4px;
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.15);
          border-radius: var(--radius-full);
        }
        .user-avatar-img {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          object-fit: cover;
          border: 1.5px solid var(--accent-red);
        }
        .user-firstname {
          font-size: 13px;
          font-weight: 700;
          color: #FFFFFF;
        }
        .user-logout-btn {
          background: transparent;
          border: none;
          color: #8E8E94;
          cursor: pointer;
          display: flex;
          align-items: center;
          padding: 4px;
          border-radius: 50%;
        }
        .user-logout-btn:hover {
          color: var(--accent-red);
        }

        .user-login-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          height: 38px;
          padding: 0 16px;
          border-radius: 4px;
          background: var(--accent-red, #E50914);
          color: #FFFFFF;
          border: 1px solid rgba(255, 255, 255, 0.15);
          font-size: 14px;
          font-weight: 700;
          cursor: pointer;
          transition: all var(--transition-fast);
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.35);
        }
        .user-login-btn:hover {
          background: var(--accent-red-hover, #F6121D);
          box-shadow: 0 0 14px rgba(229, 9, 20, 0.6);
          transform: translateY(-1px);
        }

        .mobile-hamburger-btn {
          display: none;
          align-items: center;
          justify-content: center;
          width: 42px;
          height: 42px;
          border-radius: 10px;
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.15);
          color: #FFFFFF;
          cursor: pointer;
        }

        /* Mobile Search Dropdown */
        .mobile-search-dropdown {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px 18px;
          background: #111113;
          border-bottom: 1px solid rgba(255, 255, 255, 0.12);
        }
        .mobile-search-icon {
          color: #8E8E94;
        }
        .mobile-search-input {
          flex: 1;
          background: transparent;
          border: 0;
          outline: none;
          color: #FFFFFF;
          font-size: 15px;
        }

        /* Mobile Drawer */
        .mobile-drawer-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.85);
          backdrop-filter: blur(12px);
          z-index: 1000;
          display: flex;
          justify-content: flex-end;
        }
        .mobile-drawer-panel {
          width: 86%;
          max-width: 380px;
          height: 100vh;
          background: #0E0E10;
          border-left: 1px solid rgba(255, 255, 255, 0.1);
          overflow-y: auto;
          padding: 20px 22px;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .mobile-drawer-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding-bottom: 14px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
        }
        .close-drawer-btn {
          background: transparent;
          border: 0;
          color: #8E8E94;
          cursor: pointer;
        }

        .mobile-user-card {
          padding: 12px 14px;
          border-radius: var(--radius-md);
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
        }
        .mobile-user-info-row {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .mobile-avatar-img {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          border: 2px solid var(--accent-red);
        }
        .mobile-user-details {
          flex: 1;
          display: flex;
          flex-direction: column;
          min-width: 0;
        }
        .mobile-name {
          font-size: 14px;
          font-weight: 700;
          color: #FFFFFF;
        }
        .mobile-email {
          font-size: 12px;
          color: #8E8E94;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .mobile-logout-btn {
          display: flex;
          align-items: center;
          gap: 4px;
          padding: 6px 10px;
          background: rgba(229, 9, 20, 0.15);
          color: var(--accent-red);
          border: 1px solid rgba(229, 9, 20, 0.3);
          border-radius: var(--radius-sm);
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
        }
        .mobile-guest-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .mobile-guest-title {
          font-size: 14px;
          font-weight: 700;
          color: #FFFFFF;
        }
        .mobile-guest-sub {
          font-size: 12px;
          color: #8E8E94;
        }
        .mobile-login-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 14px;
          background: var(--accent-red, #E50914);
          color: #FFFFFF;
          border: 1px solid rgba(255, 255, 255, 0.15);
          border-radius: 4px;
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
          transition: all var(--transition-fast);
        }
        .mobile-login-btn:hover {
          background: var(--accent-red-hover, #F6121D);
        }

        .mobile-section-label {
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 0.12em;
          color: #8E8E94;
          margin-top: 6px;
        }
        .mobile-nav-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .mobile-link-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 10px 12px;
          border-radius: var(--radius-sm);
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid transparent;
          color: #E8E8EA;
          font-size: 14px;
          font-weight: 600;
          text-align: left;
          cursor: pointer;
        }
        .mobile-link-item:hover {
          background: rgba(255, 255, 255, 0.08);
          color: #FFFFFF;
        }
        .scraped-badge {
          background: var(--accent-red);
          color: #FFFFFF;
          font-size: 11px;
          font-weight: 700;
          padding: 2px 7px;
          border-radius: 999px;
        }

        .mobile-franchise-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
        }
        .mobile-franchise-chip {
          display: flex;
          align-items: center;
          gap: 7px;
          padding: 8px 10px;
          border-radius: var(--radius-sm);
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: #D2D2D6;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
        }
        .mobile-franchise-chip.active {
          border-color: var(--accent-red);
          background: rgba(229, 9, 20, 0.18);
          color: #FFFFFF;
        }

        .mobile-tools-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .mobile-tool-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px 12px;
          border-radius: var(--radius-sm);
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.08);
          color: #FFFFFF;
          cursor: pointer;
          text-align: left;
        }
        .mobile-tool-item .tool-text {
          display: flex;
          flex-direction: column;
        }
        .mobile-tool-item strong {
          font-size: 13px;
        }
        .mobile-tool-item small {
          font-size: 11px;
          color: #8E8E94;
        }

        @media (max-width: 960px) {
          .desktop-nav-links {
            display: none;
          }
          .nav-action-btn.smart-cache-btn {
            display: none;
          }
          .user-profile-badge {
            display: none;
          }
          .user-login-btn {
            display: none;
          }
          .searchbox {
            display: none;
          }
          .mobile-search-toggle-btn {
            display: flex;
          }
          .mobile-hamburger-btn {
            display: flex;
          }
        }
      `}</style>
    </header>
  );
}
