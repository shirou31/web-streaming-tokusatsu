import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Navbar from './components/Navbar';
import MobileFranchiseBar from './components/MobileFranchiseBar';
import BottomNav from './components/BottomNav';
import HeroBanner from './components/HeroBanner';
import SeriesCard from './components/SeriesCard';
import PlayerModal from './components/PlayerModal';
import ProductionDetailModal from './components/ProductionDetailModal';
import ApiExplorerModal from './components/ApiExplorerModal';
import ApiKeyModal from './components/ApiKeyModal';
import WatchlistModal from './components/WatchlistModal';
import ScraperModal from './components/ScraperModal';
import Footer from './components/Footer';

// API Services implementing 02_API_SPECIFICATION.md
import { 
  getMetaFilters,
  getHomeHero,
  getCatalog,
  searchProductions,
  getUserBookmarks,
  postUserBookmark,
  deleteUserBookmark,
  getUserHistory,
  deleteUserHistory
} from './services/apiService';
import { scraperService } from './services/scraperService';

import { 
  getStoredApiKey, 
  searchTmdbTokusatsu, 
  fetchTmdbSeriesDetails, 
  fetchTmdbSeasonEpisodes 
} from './services/tmdbApi';

import { 
  Sparkles, 
  Film, 
  Filter, 
  Flame, 
  Tv, 
  Smartphone,
  Search, 
  AlertCircle,
  ExternalLink,
  ShieldCheck,
  Compass,
  Play,
  Clock,
  Terminal,
  Database,
  Zap,
  Download
} from 'lucide-react';

// Metadata profil untuk Halaman Khusus setiap Universe Tokusatsu
const FRANCHISE_METADATA = {
  'ultraman': {
    id: 'ultraman',
    name: 'Ultraman',
    universeTitle: 'ULTRAMAN UNIVERSE',
    nativeTitle: 'ウルトラマンシリーズ (Ultra Series)',
    studio: 'Tsuburaya Productions / TV Tokyo',
    established: '1966',
    color: '#00f2fe',
    badgeGlow: 'rgba(0, 242, 254, 0.4)',
    heroTagline: 'BEBASKAN IMAJINASI, BANGKITKAN CAHAYA KOSMIK M78!',
    description: 'Pahlawan Raksasa Kosmik Cahaya Pembela Kedamaian Alam Semesta karya legendaris Eiji Tsuburaya. Saksikan seluruh serial & movie dari era Showa klasik (1966), era Heisei TDG Trio (Tiga, Dyna, Gaia), hingga era New Generation Reiwa (Blazar, Arc) dengan kualitas 1440p 2K QHD Subtitle Indonesia.',
    erasCovered: 'Showa (1966) • Heisei • Reiwa'
  },
  'kamen-rider': {
    id: 'kamen-rider',
    name: 'Kamen Rider',
    universeTitle: 'KAMEN RIDER UNIVERSE',
    nativeTitle: '仮面ライダーシリーズ (Masked Rider)',
    studio: 'Toei Company / TV Asahi',
    established: '1971',
    color: '#ff204e',
    badgeGlow: 'rgba(255, 32, 78, 0.4)',
    heroTagline: 'PERJUANGAN KEADILAN, HENSHIN SANG PAHLAWAN BERTOPENG!',
    description: 'Franchise superhero bertopeng legendaris ciptaan Shotaro Ishinomori & Toei Company sejak 1971. Pertarungan penuh filosofi dan sabuk Henshin legendaris dari era Showa, Heisei hingga Reiwa (Gavv, My-Th, Geats, Kuuga) dalam kualitas 1440p 2K QHD.',
    erasCovered: 'Showa (1971) • Heisei • Reiwa'
  },
  'super-sentai': {
    id: 'super-sentai',
    name: 'Super Sentai',
    universeTitle: 'SUPER SENTAI UNIVERSE',
    nativeTitle: 'スーパー戦隊シリーズ (Super Sentai)',
    studio: 'Toei Company / TV Asahi',
    established: '1975',
    color: '#ffb703',
    badgeGlow: 'rgba(255, 183, 3, 0.4)',
    heroTagline: 'PASUKAN WARNA-WARNI PEMBELA BUMI & MECHA RAKSASA!',
    description: 'Serial pasukan warna-warni pelindung bumi dengan formasi mecha raksasa persembahan Toei Company. Saksikan kisah kepahlawanan legendaris dari era Showa (Gorenger), Heisei (Gokaiger, Shinkenger) hingga Reiwa (Boonboomger, King-Ohger) Sub Indo.',
    erasCovered: 'Showa (1975) • Heisei • Reiwa'
  },
  'garo': {
    id: 'garo',
    name: 'Garo & Kaiju',
    universeTitle: 'GARO & MAKAI UNIVERSE',
    nativeTitle: '牙狼〈GARO〉シリーズ (Golden Knight)',
    studio: 'Tohokushinsha Film',
    established: '2005',
    color: '#c77dff',
    badgeGlow: 'rgba(199, 125, 255, 0.4)',
    heroTagline: 'ZIRAH EMAS BERSINAR DI TENGAH KEGELAPAN MAKAI!',
    description: 'Tokusatsu gelap aksi bela diri Ksatria Makai berzirah emas karya sutradara Keita Amemiya. Pertarungan penuh aksi membasmi monster Horror pemakan jiwa dalam resolusi 1440p 2K Ultra HD.',
    erasCovered: 'Heisei (2005) • Reiwa'
  }
};

const getFranchiseKey = (franchise) => {
  if (!franchise || franchise === 'all') return null;
  const norm = franchise.toLowerCase().replace(/\s+/g, '-');
  if (norm.includes('ultra')) return 'ultraman';
  if (norm.includes('kamen') || norm.includes('rider')) return 'kamen-rider';
  if (norm.includes('sentai')) return 'super-sentai';
  if (norm.includes('garo')) return 'garo';
  return norm;
};

export default function App() {
  // Theme State: 'dark' | 'light' with localStorage persistence
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('tokuflix_theme') || 'dark';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('tokuflix_theme', theme);
  }, [theme]);

  const handleToggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  // Responsive / Mobile Phone Preview Simulator State
  const [isMobilePreview, setIsMobilePreview] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('view') === 'mobile' || false;
  });

  // Navigation & Filter State
  const [selectedFranchise, setSelectedFranchise] = useState('all');
  const [selectedEra, setSelectedEra] = useState('all');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Catalog Data from API
  const [catalogItems, setCatalogItems] = useState([]);
  const [catalogMeta, setCatalogMeta] = useState(null);
  const [filterMeta, setFilterMeta] = useState(null);
  const [heroItems, setHeroItems] = useState([]);
  const [continueWatchingList, setContinueWatchingList] = useState([]);
  const [loadingCatalog, setLoadingCatalog] = useState(true);

  // Scraped Live Releases Data
  const scrapedReleases = useMemo(() => scraperService.getScrapedEpisodes(), []);
  const [scrapedFilter, setScrapedFilter] = useState('all');

  const currentFranchiseKey = getFranchiseKey(selectedFranchise);
  const currentFranchiseInfo = currentFranchiseKey ? FRANCHISE_METADATA[currentFranchiseKey] : null;

  const filteredScrapedReleases = useMemo(() => {
    let list = scrapedReleases;

    // 1. Filter sesuai franchise yang sedang aktif
    if (currentFranchiseKey) {
      if (currentFranchiseKey === 'ultraman') {
        list = list.filter((e) => 
          (e.franchise || '').toLowerCase().includes('ultra') || 
          (e.seriesTitle || '').toLowerCase().includes('ultra') || 
          (e.title || '').toLowerCase().includes('ultra')
        );
      } else if (currentFranchiseKey === 'super-sentai') {
        list = list.filter((e) => 
          (e.franchise || '').toLowerCase().includes('sentai') || 
          (e.seriesTitle || '').toLowerCase().includes('sentai') || 
          (e.seriesTitle || '').toLowerCase().includes('boonboomger') ||
          (e.title || '').toLowerCase().includes('gokaiger') ||
          (e.title || '').toLowerCase().includes('gozyuger')
        );
      } else if (currentFranchiseKey === 'garo') {
        list = list.filter((e) => 
          (e.franchise || '').toLowerCase().includes('garo') || 
          (e.seriesTitle || '').toLowerCase().includes('garo') || 
          (e.title || '').toLowerCase().includes('garo')
        );
      } else if (currentFranchiseKey === 'kamen-rider') {
        list = list.filter((e) => 
          (e.franchise || '').toLowerCase().includes('kamen') || 
          (e.seriesTitle || '').toLowerCase().includes('kamen') || 
          (e.seriesTitle || '').toLowerCase().includes('gavv') ||
          (e.title || '').toLowerCase().includes('my-th')
        );
      }
    }

    // 2. Filter sub-chip
    if (scrapedFilter === 'myth') {
      return list.filter((e) => (e.seriesTitle || '').toLowerCase().includes('my-th') || (e.title || '').toLowerCase().includes('my-th'));
    }
    if (scrapedFilter === 'reiwa') {
      return list.filter((e) => e.era?.toLowerCase() === 'reiwa');
    }
    if (scrapedFilter === 'heisei') {
      return list.filter((e) => e.era?.toLowerCase() === 'heisei');
    }
    if (scrapedFilter === 'serial') {
      return list.filter((e) => e.contentType === 'tv_series');
    }
    if (scrapedFilter === 'movie') {
      return list.filter((e) => e.contentType === 'movie' || (e.title || '').toLowerCase().includes('movie') || (e.title || '').toLowerCase().includes('special'));
    }
    return list;
  }, [scrapedReleases, currentFranchiseKey, scrapedFilter]);

  // Modals state
  const [detailModalSlug, setDetailModalSlug] = useState(null);
  const [playerEpisodeId, setPlayerEpisodeId] = useState(null);
  const [playerWatchOrderSlug, setPlayerWatchOrderSlug] = useState(null);
  const [apiKeyModalOpen, setApiKeyModalOpen] = useState(false);
  const [watchlistModalOpen, setWatchlistModalOpen] = useState(false);
  const [specsModalOpen, setSpecsModalOpen] = useState(false);
  const [scraperModalOpen, setScraperModalOpen] = useState(false);

  // User Stored Data
  const [bookmarks, setBookmarks] = useState([]);
  const [history, setHistory] = useState([]);

  // TMDB Live Integration State
  const [apiKey, setApiKey] = useState(getStoredApiKey());
  const [tmdbSearchResults, setTmdbSearchResults] = useState([]);
  const [isSearchingTmdb, setIsSearchingTmdb] = useState(false);

  // 1. Load Initial Metadata & Dynamic Hero Banner for Active Franchise
  useEffect(() => {
    let isMounted = true;
    async function loadHeroBanner() {
      const franchiseKey = getFranchiseKey(selectedFranchise);
      const [filtersRes, heroRes] = await Promise.all([
        getMetaFilters(),
        getHomeHero({ limit: 5, franchise: franchiseKey })
      ]);

      if (!isMounted) return;
      if (filtersRes.success) setFilterMeta(filtersRes.data);
      if (heroRes.success) {
        // Transform hero list to format expected by HeroBanner
        const mappedHero = heroRes.data.map((item) => ({
          id: item.production.id,
          slug: item.production.slug,
          title: item.production.title,
          japaneseTitle: item.production.title_native,
          franchise: item.production.franchise?.name || 'Tokusatsu',
          era: item.production.era?.name || 'Reiwa',
          year: item.production.release_year,
          status: item.production.status === 'ongoing' ? 'Ongoing' : 'Tamat',
          totalEpisodes: item.production.total_episodes,
          currentEpisode: item.production.total_episodes,
          rating: 9.2,
          quality: '1440p 2K QHD',
          fansub: 'Tokuflix Sub Indo',
          featured: true,
          bannerHeadline: item.production.tagline || (franchiseKey ? `SERIES UNGGULAN ${franchiseKey.toUpperCase()}` : 'SERIES UNGGULAN'),
          backdropUrl: item.production.backdrop_url,
          posterUrl: item.production.poster_url,
          fallbackBackdrop: item.production.backdrop_url,
          fallbackPoster: item.production.poster_url,
          trailerYoutubeId: 'XQxZqjZ3a-Y',
          tags: item.production.genres?.map((g) => g.name) || ['Action', 'Henshin'],
          synopsis: item.production.synopsis,
          cta: item.cta
        }));
        setHeroItems(mappedHero);
      }
    }
    loadHeroBanner();
    return () => { isMounted = false; };
  }, [selectedFranchise]);

  // 2. Load User Bookmarks & History
  const refreshUserData = useCallback(async () => {
    const [bRes, hRes] = await Promise.all([
      getUserBookmarks(),
      getUserHistory({ page: 1, per_page: 20 })
    ]);
    if (bRes.success) setBookmarks(bRes.data);
    if (hRes.success) setHistory(hRes.data);
  }, []);

  useEffect(() => {
    refreshUserData();
  }, [refreshUserData]);

  // 3. Query Catalog based on 02_API_SPECIFICATION GET /catalog
  useEffect(() => {
    let isMounted = true;
    async function fetchCatalogData() {
      setLoadingCatalog(true);

      const params = {
        franchise: selectedFranchise !== 'all' ? selectedFranchise.toLowerCase().replace(/\s+/g, '-') : undefined,
        era: selectedEra !== 'all' ? selectedEra.toLowerCase() : undefined,
        type: selectedType !== 'all' ? selectedType : undefined,
        status: selectedStatus !== 'all' ? selectedStatus.toLowerCase() : undefined,
        q: searchQuery.trim() || undefined,
        sort: 'release_date',
        order: 'desc'
      };

      const res = await getCatalog(params);
      if (isMounted && res.success) {
        // Map catalog format for cards
        const mapped = res.data.map((item) => ({
          id: item.id,
          slug: item.slug,
          title: item.title,
          japaneseTitle: item.title_native,
          franchise: item.franchise?.name || 'Tokusatsu',
          era: item.era?.name || 'Reiwa',
          year: item.release_year,
          status: item.status === 'ongoing' ? 'Ongoing' : 'Tamat',
          totalEpisodes: item.total_episodes,
          currentEpisode: item.total_episodes,
          rating: 8.8,
          quality: item.type === 'movie' ? '4K UHD' : '1080p FHD',
          fansub: 'Tokuflix Sub Indo',
          posterUrl: item.poster_url,
          fallbackPoster: item.poster_url,
          rawProduction: item
        }));
        setCatalogItems(mapped);
        setCatalogMeta(res.meta);
      }
      if (isMounted) setLoadingCatalog(false);
    }

    fetchCatalogData();
    return () => { isMounted = false; };
  }, [selectedFranchise, selectedEra, selectedType, selectedStatus, searchQuery]);

  // 4. Live TMDB Search (Optional enhancement)
  useEffect(() => {
    if (!apiKey || !searchQuery.trim() || searchQuery.trim().length < 2) {
      setTmdbSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearchingTmdb(true);
      const results = await searchTmdbTokusatsu(searchQuery, apiKey);
      setTmdbSearchResults(results);
      setIsSearchingTmdb(false);
    }, 450);

    return () => clearTimeout(timer);
  }, [searchQuery, apiKey]);

  // Bookmarks Helper
  const isBookmarked = (prodId) => {
    return bookmarks.some((b) => b.production?.id === prodId || b.production_id === prodId);
  };

  const handleToggleBookmark = async (production) => {
    const prodId = production.id;
    if (isBookmarked(prodId)) {
      await deleteUserBookmark(prodId);
    } else {
      await postUserBookmark({ production_id: prodId, status: 'plan_to_watch' });
    }
    refreshUserData();
  };

  // Launch Player
  const handlePlayEpisodeFromProduction = (production, episode, watchOrderSlug = null) => {
    // If dynamic TMDB
    if (production.id && production.id.startsWith('tmdb-')) {
      setPlayerEpisodeId(production.id);
    } else {
      setPlayerEpisodeId(episode.id || '0192a3f0-2222-7000-8000-000000000001');
    }
    setPlayerWatchOrderSlug(watchOrderSlug);
  };

  const handleFocusSearch = () => {
    const mobileSearchBtn = document.getElementById('mobile-search-toggle-btn');
    const mobileSearchInput = document.getElementById('mobile-search-input');
    const desktopSearchInput = document.getElementById('search-input');
    
    if (mobileSearchInput) {
      mobileSearchInput.focus();
    } else if (mobileSearchBtn) {
      mobileSearchBtn.click();
      setTimeout(() => {
        document.getElementById('mobile-search-input')?.focus();
      }, 120);
    } else if (desktopSearchInput) {
      desktopSearchInput.focus();
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Franchise categories
  const franchiseList = [
    { id: 'all', name: 'Semua' },
    { id: 'kamen-rider', name: 'Kamen Rider' },
    { id: 'super-sentai', name: 'Super Sentai' },
    { id: 'ultraman', name: 'Ultraman' },
    { id: 'garo', name: 'Garo & Lainnya' }
  ];

  return (
    <div className={`tokuflix-app ${isMobilePreview ? 'force-mobile-mode' : ''}`}>
      {/* Top Sticky Navbar */}
      <Navbar
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        selectedFranchise={selectedFranchise}
        setSelectedFranchise={setSelectedFranchise}
        onOpenApiKeyModal={() => setApiKeyModalOpen(true)}
        onOpenWatchlist={() => setWatchlistModalOpen(true)}
        onOpenSpecs={() => setSpecsModalOpen(true)}
        onOpenScraper={() => setScraperModalOpen(true)}
        scrapedCount={scrapedReleases.length}
        watchlistCount={bookmarks.length}
        hasTmdbKey={Boolean(apiKey)}
        theme={theme}
        onToggleTheme={handleToggleTheme}
      />

      {/* Mobile Horizontal Swipeable Franchise Rail */}
      <MobileFranchiseBar
        selectedFranchise={selectedFranchise}
        onSelectFranchise={(f) => setSelectedFranchise(f)}
      />

      {/* Hero Banner Carousel (Shown when no search query is active) */}
      {!searchQuery && heroItems.length > 0 && (
        <HeroBanner
          featuredItems={heroItems}
          onPlayEpisode={(prod, ep) => handlePlayEpisodeFromProduction(prod, ep)}
          onSelectSeries={(prod) => setDetailModalSlug(prod.slug)}
          isBookmarked={isBookmarked}
          onToggleBookmark={handleToggleBookmark}
        />
      )}

      {/* Main Content Area */}
      <main className="container main-content-wrapper">
        {/* Dedicated Franchise Page Banner (When user clicks Ultraman, Kamen Rider, Sentai, or Garo) */}
        {!searchQuery && currentFranchiseInfo && (
          <section className="franchise-hub-banner glass-panel" style={{ borderColor: currentFranchiseInfo.color }}>
            <div className="franchise-breadcrumb-row">
              <div className="breadcrumb-nav">
                <button 
                  className="breadcrumb-home-btn"
                  onClick={() => {
                    setSelectedFranchise('all');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                >
                  <Compass size={14} />
                  <span>Beranda Tokuflix</span>
                </button>
                <span className="breadcrumb-separator">/</span>
                <span className="breadcrumb-current">Halaman Khusus: {currentFranchiseInfo.name}</span>
              </div>
              <button 
                id="back-to-all-franchises-btn"
                className="back-to-all-btn"
                onClick={() => {
                  setSelectedFranchise('all');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
              >
                <span>&larr; Kembali ke Beranda Utama</span>
              </button>
            </div>

            <div className="franchise-hub-body">
              <div className="franchise-hub-info">
                <div className="franchise-badge-pill" style={{ borderColor: currentFranchiseInfo.color, color: currentFranchiseInfo.color }}>
                  <Sparkles size={14} />
                  <span>{currentFranchiseInfo.studio} • Est. {currentFranchiseInfo.established}</span>
                </div>
                <h1 className="franchise-page-title" style={{ textShadow: `0 0 25px ${currentFranchiseInfo.badgeGlow}` }}>
                  {currentFranchiseInfo.universeTitle}
                </h1>
                <div className="franchise-jp-name">{currentFranchiseInfo.nativeTitle}</div>
                <p className="franchise-page-desc">{currentFranchiseInfo.description}</p>

                <div className="franchise-stats-bar">
                  <div className="franchise-stat-item">
                    <Film size={15} color={currentFranchiseInfo.color} />
                    <span>{catalogItems.length} Serial & Film</span>
                  </div>
                  <div className="franchise-stat-item">
                    <Clock size={15} color={currentFranchiseInfo.color} />
                    <span>{currentFranchiseInfo.erasCovered}</span>
                  </div>
                  <div className="franchise-stat-item">
                    <Zap size={15} color="#10b981" />
                    <span>1440p 2K QHD</span>
                  </div>
                  <div className="franchise-stat-item">
                    <ShieldCheck size={15} color={currentFranchiseInfo.color} />
                    <span>Subtitle Indonesia Resmi</span>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}
        {/* Live Search Indicator */}
        {searchQuery && (
          <div className="search-results-header">
            <div className="search-title-row">
              <Search size={22} color="var(--accent-red)" />
              <h2>Hasil Pencarian: &ldquo;{searchQuery}&rdquo;</h2>
              <span className="results-badge">
                {catalogItems.length + tmdbSearchResults.length} Ditemukan
              </span>
            </div>
            {apiKey ? (
              <p className="search-sub-info">
                Menampilkan hasil dari <strong>Katalog Database Tokusatsu</strong> dan <strong>TMDB Live API v3</strong>.
              </p>
            ) : (
              <div className="tmdb-tip-banner" onClick={() => setApiKeyModalOpen(true)}>
                <AlertCircle size={16} />
                <span>
                  Tip: Hubungkan <strong>TMDB API Key</strong> untuk mencari jutaan judul Tokusatsu langsung dari server TMDB.
                </span>
                <span className="tip-cta">Atur API &rarr;</span>
              </div>
            )}
          </div>
        )}

        {/* Filter Toolbar matching GET /catalog Query Params */}
        {!searchQuery && (
          <section className="catalog-filter-bar">
            {/* Era Filter */}
            <div className="filter-group">
              <div className="filter-label-wrap">
                <Filter size={15} color="var(--accent-red)" />
                <span className="filter-label">Era:</span>
              </div>
              <div className="filter-chips">
                {['all', 'Reiwa', 'Heisei', 'Showa'].map((era) => (
                  <button
                    key={era}
                    className={`filter-chip ${selectedEra.toLowerCase() === era.toLowerCase() ? 'active' : ''}`}
                    onClick={() => setSelectedEra(era)}
                  >
                    {era === 'all' ? 'Semua Era' : `${era} Era`}
                  </button>
                ))}
              </div>
            </div>

            {/* Type Filter */}
            <div className="filter-group">
              <span className="filter-label">Format:</span>
              <div className="filter-chips">
                <button
                  className={`filter-chip ${selectedType === 'all' ? 'active' : ''}`}
                  onClick={() => setSelectedType('all')}
                >
                  Semua
                </button>
                <button
                  className={`filter-chip ${selectedType === 'tv_series' ? 'active' : ''}`}
                  onClick={() => setSelectedType('tv_series')}
                >
                  TV Series
                </button>
                <button
                  className={`filter-chip ${selectedType === 'movie' ? 'active' : ''}`}
                  onClick={() => setSelectedType('movie')}
                >
                  Movie / Layar Lebar
                </button>
              </div>
            </div>

            {/* Status Filter */}
            <div className="filter-group">
              <span className="filter-label">Status:</span>
              <div className="filter-chips">
                <button
                  className={`filter-chip ${selectedStatus === 'all' ? 'active' : ''}`}
                  onClick={() => setSelectedStatus('all')}
                >
                  Semua
                </button>
                <button
                  className={`filter-chip ${selectedStatus === 'Ongoing' ? 'active' : ''}`}
                  onClick={() => setSelectedStatus('Ongoing')}
                >
                  Ongoing (Tayang)
                </button>
                <button
                  className={`filter-chip ${selectedStatus === 'completed' ? 'active' : ''}`}
                  onClick={() => setSelectedStatus('completed')}
                >
                  Tamat
                </button>
              </div>
            </div>
          </section>
        )}

        {/* ⚡ HASIL NYATA LIVE SCRAPING FANSUB (SUB INDO) */}
        {!searchQuery && filteredScrapedReleases.length > 0 && (
          <section className="scraped-live-section">
            <div className="section-header-row">
              <div className="section-title-box">
                <div className="scraped-kicker-row">
                  <span className="live-dot-pulse" />
                  <span className="section-kicker scraped-green">
                    {currentFranchiseInfo 
                      ? `HASIL NYATA LIVE SCRAPING FANSUB ${currentFranchiseInfo.name.toUpperCase()} (SUB INDO)` 
                      : 'HASIL NYATA LIVE SCRAPING FANSUB (HEISEI & REIWA)'}
                  </span>
                  <span className="scraped-count-badge">{filteredScrapedReleases.length} Rilis Live</span>
                </div>
                <h2 className="section-title">
                  {currentFranchiseInfo 
                    ? `Rilis Fansub ${currentFranchiseInfo.name} Sub Indo Terbaru`
                    : 'Rilis Tokusatsu Sub Indo Terbaru (Serial & Movie)'}
                </h2>
                <p className="scraped-desc-text">
                  Hasil scraping nyata dari fansub lokal dengan tautan embed aktif dan mirror Google Drive direct HD lintas era Heisei & Reiwa.
                </p>
              </div>
              <div className="header-meta-actions">
                <button 
                  id="open-scraper-hub-btn"
                  className="btn-scraper-hub"
                  onClick={() => setScraperModalOpen(true)}
                  title="Lihat status scraper dan rilis lengkap"
                >
                  <Zap size={14} color="#10b981" />
                  <span>Scraper Hub & Detail ({filteredScrapedReleases.length})</span>
                </button>
              </div>
            </div>

            {/* Quick Filter Buttons for Scraped Content */}
            <div className="scraped-filter-pills-row">
              <button
                className={`scraped-pill-btn ${scrapedFilter === 'all' ? 'active' : ''}`}
                onClick={() => setScrapedFilter('all')}
              >
                Semua ({scrapedReleases.length})
              </button>
              <button
                className={`scraped-pill-btn highlight ${scrapedFilter === 'myth' ? 'active' : ''}`}
                onClick={() => setScrapedFilter('myth')}
              >
                ⚡ Kamen Rider My-Th ({scrapedReleases.filter(e => (e.seriesTitle || '').toLowerCase().includes('my-th')).length})
              </button>
              <button
                className={`scraped-pill-btn ${scrapedFilter === 'reiwa' ? 'active' : ''}`}
                onClick={() => setScrapedFilter('reiwa')}
              >
                Era Reiwa ({scrapedReleases.filter(e => e.era === 'Reiwa').length})
              </button>
              <button
                className={`scraped-pill-btn ${scrapedFilter === 'heisei' ? 'active' : ''}`}
                onClick={() => setScrapedFilter('heisei')}
              >
                Era Heisei ({scrapedReleases.filter(e => e.era === 'Heisei').length})
              </button>
              <button
                className={`scraped-pill-btn ${scrapedFilter === 'serial' ? 'active' : ''}`}
                onClick={() => setScrapedFilter('serial')}
              >
                Serial TV ({scrapedReleases.filter(e => e.contentType === 'tv_series').length})
              </button>
              <button
                className={`scraped-pill-btn ${scrapedFilter === 'movie' ? 'active' : ''}`}
                onClick={() => setScrapedFilter('movie')}
              >
                Movie / Spesial ({scrapedReleases.filter(e => e.contentType === 'movie').length})
              </button>
            </div>

            <div className="scraped-cards-scroll">
              {filteredScrapedReleases.map((ep) => (
                <div key={ep.id} className="scraped-card glass-panel">
                  <div className="scraped-thumb-wrap" onClick={() => setPlayerEpisodeId(ep.id)}>
                    <img src={ep.thumbnail} alt={ep.title} loading="lazy" />
                    <div className="thumb-hover-play">
                      <div className="play-icon-circle">
                        <Play size={16} fill="#ffffff" />
                      </div>
                    </div>
                    <span className="badge-thumb-sub">{ep.era || 'Sub Indo'}</span>
                    <span className="badge-thumb-quality">1440p QHD</span>
                  </div>

                  <div className="scraped-card-info">
                    <div className="scraped-meta-tags">
                      <span className="tag-series-name">{ep.seriesTitle}</span>
                      <span className="tag-res-qhd">1440p 2K</span>
                      <span className="tag-franchise-name">{ep.franchise}</span>
                    </div>

                    <h4 className="scraped-card-heading" title={ep.title} onClick={() => setPlayerEpisodeId(ep.id)}>
                      {ep.title}
                    </h4>

                    <div className="scraped-fansub-credit">
                      <span>Sumber: {ep.fansub.split('/')[0].trim()}</span>
                      <span>•</span>
                      <span className="green-accent">{ep.servers.length} Server</span>
                    </div>

                    <div className="scraped-card-btn-row">
                      <button 
                        className="btn-scraped-watch"
                        onClick={() => setPlayerEpisodeId(ep.id)}
                      >
                        <Play size={12} fill="#ffffff" />
                        <span>Putar</span>
                      </button>

                      {ep.driveDownloadUrl1 && (
                        <a 
                          href={ep.driveDownloadUrl1}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn-scraped-gdrive"
                          title="Buka Google Drive Server 1"
                        >
                          <Download size={12} />
                          <span>GDrive</span>
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Catalog Section Header */}
        <section className="section-header-row">
          <div className="section-title-box">
            <span className="section-kicker">
              {currentFranchiseInfo ? `KATALOG KHUSUS ${currentFranchiseInfo.name.toUpperCase()} (01 & 02 SPEC)` : 'KATALOG TOKUSATSU RELASIONAL (01 & 02 SPEC)'}
            </span>
            <h2 className="section-title">
              {currentFranchiseInfo ? `Katalog Serial & Film ${currentFranchiseInfo.name} Sub Indo` : 'Semua Judul Tokusatsu'}
            </h2>
          </div>
          <div className="header-meta-actions">
            <span className="catalog-count-pill">
              {catalogItems.length} Produksi Tersedia
            </span>
            <button 
              className="specs-badge-btn"
              onClick={() => setSpecsModalOpen(true)}
              title="Buka Live API Inspector"
            >
              <Terminal size={14} />
              <span>Cek REST Schema</span>
            </button>
          </div>
        </section>

        {/* Series Cards Grid */}
        {catalogItems.length > 0 ? (
          <div className="series-grid">
            {catalogItems.map((series) => (
              <SeriesCard
                key={series.id}
                series={series}
                onSelectSeries={() => setDetailModalSlug(series.slug)}
                onPlayEpisode={(s) => handlePlayEpisodeFromProduction(series.rawProduction || s, { id: '0192a3f0-2222-7000-8000-000000000001' })}
                isBookmarked={() => isBookmarked(series.id)}
                onToggleBookmark={() => handleToggleBookmark(series.rawProduction || series)}
              />
            ))}
          </div>
        ) : (
          <div className="empty-catalog-state glass-panel">
            <Film size={48} className="empty-catalog-icon" />
            <h3>Tidak ada serial yang cocok</h3>
            <p>Coba ubah filter atau kata kunci pencarian kamu.</p>
            <button
              className="btn-secondary"
              onClick={() => {
                setSelectedFranchise('all');
                setSelectedEra('all');
                setSelectedType('all');
                setSelectedStatus('all');
                setSearchQuery('');
              }}
            >
              Reset Semua Filter
            </button>
          </div>
        )}

        {/* Live TMDB API Search Results Section (If active) */}
        {tmdbSearchResults.length > 0 && (
          <section className="tmdb-live-section">
            <div className="section-header-row">
              <div className="section-title-box">
                <span className="badge badge-cyan">TMDB LIVE RESULTS</span>
                <h2 className="section-title">Hasil Langsung dari The Movie Database</h2>
              </div>
            </div>
            <div className="series-grid">
              {tmdbSearchResults.map((series) => (
                <SeriesCard
                  key={series.id}
                  series={series}
                  onSelectSeries={() => setDetailModalSlug(series.id)}
                  onPlayEpisode={(s) => handlePlayEpisodeFromProduction(s, { id: 'ep-1' })}
                  isBookmarked={() => false}
                  onToggleBookmark={() => {}}
                />
              ))}
            </div>
          </section>
        )}
      </main>

      {/* Footer */}
      <Footer onSelectFranchise={(franchise) => setSelectedFranchise(franchise)} />

      {/* 1. Production Detail Modal (With Chronological Watch Order) */}
      {detailModalSlug && (
        <ProductionDetailModal
          productionSlug={detailModalSlug}
          onClose={() => setDetailModalSlug(null)}
          onPlayEpisode={(prod, ep, orderSlug) => {
            handlePlayEpisodeFromProduction(prod, ep, orderSlug);
          }}
          isBookmarked={isBookmarked}
          onToggleBookmark={handleToggleBookmark}
        />
      )}

      {/* 2. Video Player Modal (02_API_SPECIFICATION GET /stream/:episode_id) */}
      {playerEpisodeId && (
        <PlayerModal
          episodeId={playerEpisodeId}
          watchOrderSlug={playerWatchOrderSlug}
          onClose={() => setPlayerEpisodeId(null)}
          onNavigateEpisode={(nextId) => setPlayerEpisodeId(nextId)}
        />
      )}

      {/* 3. API & DB Specs Explorer Modal */}
      {specsModalOpen && (
        <ApiExplorerModal
          onClose={() => setSpecsModalOpen(false)}
        />
      )}

      {/* 4. TMDB API Key Modal */}
      {apiKeyModalOpen && (
        <ApiKeyModal
          currentApiKey={apiKey}
          onSaveKey={(newKey) => setApiKey(newKey)}
          onClose={() => setApiKeyModalOpen(false)}
        />
      )}

      {/* 5. Watchlist Modal */}
      {watchlistModalOpen && (
        <WatchlistModal
          bookmarks={bookmarks.map((b) => b.production || b)}
          history={history.map((h) => ({
            seriesTitle: h.production?.title || 'Tokusatsu',
            episodeTitle: h.episode?.title || 'Episode',
            posterUrl: h.production?.poster_url,
            episodeNumber: h.episode?.episode_number || 1,
            watchedAt: h.last_watched_at
          }))}
          onSelectSeries={(series) => {
            setWatchlistModalOpen(false);
            setDetailModalSlug(series.slug || 'kamen-rider-geats');
          }}
          onPlayEpisode={(series, ep) => {
            setWatchlistModalOpen(false);
            handlePlayEpisodeFromProduction(series, ep || { id: '0192a3f0-2222-7000-8000-000000000001' });
          }}
          onRemoveBookmark={(id) => {
            deleteUserBookmark(id);
            refreshUserData();
          }}
          onClearHistory={() => {
            history.forEach((h) => deleteUserHistory(h.episode?.id));
            refreshUserData();
          }}
          onClose={() => setWatchlistModalOpen(false)}
        />
      )}

      {/* 6. Live Fansub Scraper Modal */}
      {scraperModalOpen && (
        <ScraperModal
          onClose={() => setScraperModalOpen(false)}
          onPlayEpisode={(epId) => {
            setScraperModalOpen(false);
            setPlayerEpisodeId(epId);
          }}
        />
      )}

      {/* Floating Desktop Device Simulator Switch */}
      <div className="desktop-device-toggle-bar">
        <button
          id="mobile-preview-toggle-btn"
          className={`device-toggle-pill ${isMobilePreview ? 'active' : ''}`}
          onClick={() => setIsMobilePreview(!isMobilePreview)}
          title={isMobilePreview ? "Kembali ke Tampilan Desktop Penuh" : "Pratinjau Tampilan Mobile Ponsel (390px)"}
        >
          {isMobilePreview ? (
            <>
              <Tv size={15} />
              <span>Kembali ke Mode Desktop</span>
            </>
          ) : (
            <>
              <Smartphone size={15} color="#00f2fe" />
              <span>Pratinjau Versi Mobile (390px)</span>
            </>
          )}
        </button>
      </div>

      {/* Floating Mobile Bottom Navigation Bar */}
      <BottomNav
        selectedFranchise={selectedFranchise}
        onSelectFranchise={(f) => setSelectedFranchise(f)}
        onOpenScraper={() => setScraperModalOpen(true)}
        onOpenWatchlist={() => setWatchlistModalOpen(true)}
        onFocusSearch={handleFocusSearch}
        watchlistCount={bookmarks.length}
        scrapedCount={filteredScrapedReleases.length}
        theme={theme}
        onToggleTheme={handleToggleTheme}
      />

      <style>{`
        .tokuflix-app {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
        }
        .main-content-wrapper {
          flex: 1;
          padding-top: 30px;
        }
        .search-results-header {
          margin-top: 10px;
          margin-bottom: 28px;
          padding: 20px 24px;
          background: rgba(16, 23, 38, 0.7);
          backdrop-filter: blur(12px);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-md);
        }
        .search-title-row {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 6px;
        }
        .results-badge {
          background: var(--accent-red);
          color: #ffffff;
          font-size: 0.75rem;
          font-weight: 700;
          padding: 3px 8px;
          border-radius: var(--radius-sm);
        }
        .search-sub-info {
          font-size: 0.85rem;
          color: var(--text-secondary);
        }
        .tmdb-tip-banner {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-top: 10px;
          background: rgba(0, 242, 254, 0.08);
          border: 1px solid rgba(0, 242, 254, 0.25);
          padding: 10px 14px;
          border-radius: var(--radius-sm);
          font-size: 0.82rem;
          color: var(--text-secondary);
          cursor: pointer;
        }
        .tmdb-tip-banner:hover {
          background: rgba(0, 242, 254, 0.15);
        }
        .tip-cta {
          color: var(--accent-cyan);
          font-weight: 700;
          margin-left: auto;
        }
        .catalog-filter-bar {
          display: flex;
          align-items: center;
          background: rgba(16, 23, 38, 0.5);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-md);
          padding: 12px 18px;
          margin-bottom: 28px;
          flex-wrap: wrap;
          gap: 20px;
        }
        .filter-group {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .filter-label-wrap {
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .filter-label {
          font-size: 0.82rem;
          font-weight: 700;
          color: var(--text-secondary);
        }
        .filter-chips {
          display: flex;
          gap: 6px;
          flex-wrap: wrap;
        }
        .filter-chip {
          font-size: 0.78rem;
          font-weight: 600;
          padding: 5px 12px;
          border-radius: var(--radius-full);
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid var(--border-subtle);
          color: var(--text-secondary);
          transition: all var(--transition-fast);
        }
        .filter-chip:hover {
          color: #ffffff;
          background: rgba(255, 255, 255, 0.1);
        }
        .filter-chip.active {
          background: rgba(255, 32, 78, 0.18);
          border-color: var(--accent-red);
          color: #ffffff;
        }
        .section-header-row {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          margin-bottom: 22px;
          flex-wrap: wrap;
          gap: 12px;
        }
        .section-title-box {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .section-kicker {
          font-size: 0.75rem;
          font-weight: 800;
          letter-spacing: 0.08em;
          color: var(--accent-red);
        }
        .section-title {
          font-size: 1.6rem;
        }
        .header-meta-actions {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .catalog-count-pill {
          font-size: 0.8rem;
          color: var(--text-muted);
          background: rgba(255, 255, 255, 0.04);
          padding: 5px 12px;
          border-radius: var(--radius-full);
        }
        .specs-badge-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.78rem;
          font-weight: 700;
          color: var(--accent-cyan);
          background: rgba(0, 242, 254, 0.08);
          border: 1px solid rgba(0, 242, 254, 0.25);
          padding: 5px 12px;
          border-radius: var(--radius-full);
          transition: all var(--transition-fast);
        }
        .specs-badge-btn:hover {
          background: rgba(0, 242, 254, 0.18);
          border-color: var(--accent-cyan);
          transform: translateY(-1px);
        }
        .series-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
          gap: 22px;
        }
        .empty-catalog-state {
          padding: 60px 20px;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
        }
        .empty-catalog-icon {
          color: var(--text-muted);
          opacity: 0.5;
        }
        .empty-catalog-state h3 {
          font-size: 1.2rem;
        }
        .empty-catalog-state p {
          color: var(--text-muted);
          font-size: 0.88rem;
          margin-bottom: 10px;
        }
        .tmdb-live-section {
          margin-top: 50px;
          padding-top: 30px;
          border-top: 1px dashed var(--border-subtle);
        }
        /* ⚡ Scraped Live Section Styles */
        .scraped-live-section {
          margin-bottom: 40px;
          padding: 24px;
          background: linear-gradient(135deg, rgba(16, 185, 129, 0.05) 0%, rgba(3, 5, 8, 0.6) 100%);
          border: 1px solid rgba(16, 185, 129, 0.2);
          border-radius: var(--radius-lg);
          position: relative;
          overflow: hidden;
        }
        .scraped-live-section::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          width: 120px;
          height: 2px;
          background: linear-gradient(90deg, transparent, #10b981, transparent);
        }
        .scraped-kicker-row {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 6px;
        }
        .scraped-green {
          color: #10b981 !important;
          letter-spacing: 0.08em;
          font-weight: 800;
        }
        .scraped-desc-text {
          font-size: 0.85rem;
          color: var(--text-secondary);
          margin-top: 4px;
        }
        .btn-scraper-hub {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 8px 14px;
          background: rgba(16, 185, 129, 0.12);
          border: 1px solid rgba(16, 185, 129, 0.35);
          border-radius: var(--radius-sm);
          font-size: 0.8rem;
          font-weight: 700;
          color: #10b981;
          transition: var(--transition-fast);
        }
        .btn-scraper-hub:hover {
          background: #10b981;
          color: #030508;
          box-shadow: 0 0 14px rgba(16, 185, 129, 0.4);
        }
        .scraped-filter-pills-row {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-top: 14px;
          flex-wrap: wrap;
        }
        .scraped-pill-btn {
          padding: 6px 14px;
          border-radius: 999px;
          font-size: 0.76rem;
          font-weight: 600;
          color: var(--text-secondary);
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.08);
          transition: var(--transition-fast);
          cursor: pointer;
        }
        .scraped-pill-btn:hover {
          color: var(--text-primary);
          background: rgba(255, 255, 255, 0.08);
        }
        .scraped-pill-btn.active {
          color: #030508;
          background: #10b981;
          border-color: #10b981;
          font-weight: 700;
          box-shadow: 0 0 12px rgba(16, 185, 129, 0.35);
        }
        .scraped-pill-btn.highlight {
          border-color: rgba(0, 242, 254, 0.35);
        }
        .scraped-pill-btn.highlight.active {
          background: linear-gradient(135deg, #00f2fe 0%, #4facfe 100%);
          border-color: #00f2fe;
          color: #030508;
          box-shadow: 0 0 12px rgba(0, 242, 254, 0.4);
        }
        .scraped-cards-scroll {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
          gap: 16px;
          margin-top: 16px;
        }
        .scraped-card {
          display: flex;
          flex-direction: column;
          background: rgba(16, 23, 38, 0.7);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: var(--radius-md);
          overflow: hidden;
          transition: var(--transition-fast);
        }
        .scraped-card:hover {
          transform: translateY(-4px);
          border-color: rgba(16, 185, 129, 0.4);
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.7);
        }
        .scraped-thumb-wrap {
          position: relative;
          aspect-ratio: 16 / 9;
          overflow: hidden;
          cursor: pointer;
        }
        .scraped-thumb-wrap img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          object-position: center 25%;
          background: #0b111e;
          transition: transform 0.4s ease;
        }
        .scraped-card:hover .scraped-thumb-wrap img {
          transform: scale(1.06);
        }
        .thumb-hover-play {
          position: absolute;
          inset: 0;
          background: rgba(0, 0, 0, 0.4);
          display: flex;
          align-items: center;
          justify-content: center;
          opacity: 0;
          transition: var(--transition-fast);
        }
        .scraped-card:hover .thumb-hover-play {
          opacity: 1;
        }
        .play-icon-circle {
          width: 38px;
          height: 38px;
          background: var(--accent-red);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 0 12px var(--accent-red-glow);
        }
        .badge-thumb-sub {
          position: absolute;
          top: 6px;
          left: 6px;
          background: rgba(16, 185, 129, 0.9);
          color: #ffffff;
          font-size: 0.68rem;
          font-weight: 800;
          padding: 2px 6px;
          border-radius: 4px;
        }
        .badge-thumb-quality {
          position: absolute;
          top: 6px;
          right: 6px;
          background: linear-gradient(135deg, #00f2fe 0%, #4facfe 100%);
          color: #050b14;
          font-size: 0.65rem;
          font-weight: 800;
          padding: 2px 7px;
          border-radius: 4px;
          letter-spacing: 0.3px;
          box-shadow: 0 2px 8px rgba(0, 242, 254, 0.4);
        }
        .tag-res-qhd {
          font-size: 0.65rem;
          font-weight: 800;
          color: #00f2fe;
          background: rgba(0, 242, 254, 0.12);
          border: 1px solid rgba(0, 242, 254, 0.3);
          border-radius: 4px;
          padding: 1px 6px;
        }
        .scraped-card-info {
          padding: 12px 14px 14px;
          display: flex;
          flex-direction: column;
          flex: 1;
        }
        .scraped-meta-tags {
          display: flex;
          gap: 6px;
          margin-bottom: 6px;
        }
        .tag-series-name {
          font-size: 0.7rem;
          font-weight: 700;
          color: var(--accent-cyan);
          background: rgba(0, 242, 254, 0.08);
          padding: 1px 6px;
          border-radius: 3px;
        }
        .tag-franchise-name {
          font-size: 0.7rem;
          color: #ffb703;
          background: rgba(255, 183, 3, 0.08);
          padding: 1px 6px;
          border-radius: 3px;
        }
        .scraped-card-heading {
          font-size: 0.88rem;
          font-weight: 700;
          color: var(--text-primary);
          line-height: 1.35;
          margin-bottom: 6px;
          cursor: pointer;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .scraped-card-heading:hover {
          color: var(--accent-red);
        }
        .scraped-fansub-credit {
          font-size: 0.72rem;
          color: var(--text-muted);
          display: flex;
          align-items: center;
          gap: 6px;
          margin-bottom: 12px;
        }
        .green-accent {
          color: #10b981;
          font-weight: 600;
        }
        .scraped-card-btn-row {
          margin-top: auto;
          display: flex;
          gap: 8px;
        }
        .btn-scraped-watch {
          flex: 1;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 5px;
          padding: 7px 10px;
          background: linear-gradient(135deg, var(--accent-red) 0%, #e63946 100%);
          color: #ffffff;
          font-size: 0.75rem;
          font-weight: 700;
          border-radius: var(--radius-sm);
          transition: var(--transition-fast);
        }
        .btn-scraped-watch:hover {
          box-shadow: 0 0 10px var(--accent-red-glow);
        }
        .btn-scraped-gdrive {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 4px;
          padding: 7px 10px;
          background: rgba(0, 242, 254, 0.1);
          border: 1px solid rgba(0, 242, 254, 0.25);
          color: var(--accent-cyan);
          font-size: 0.74rem;
          font-weight: 600;
          border-radius: var(--radius-sm);
          text-decoration: none;
          transition: var(--transition-fast);
        }
        .btn-scraped-gdrive:hover {
          background: var(--accent-cyan);
          color: #030508;
        }
        @media (max-width: 768px) {
          .tokuflix-app {
            padding-bottom: calc(85px + env(safe-area-inset-bottom, 0px));
          }
          .main-content-wrapper {
            padding-top: 10px;
            padding-left: 12px;
            padding-right: 12px;
          }
          .scraped-cards-scroll {
            grid-template-columns: repeat(2, 1fr) !important;
            gap: 10px !important;
          }
          .series-grid {
            grid-template-columns: repeat(2, 1fr) !important;
            gap: 10px !important;
          }
          .catalog-filter-bar {
            flex-direction: column;
            align-items: stretch;
            gap: 12px;
            padding: 14px 12px;
          }
          .filter-group {
            flex-direction: column;
            align-items: flex-start;
            gap: 6px;
          }
          .filter-chips {
            display: flex;
            overflow-x: auto;
            width: 100%;
            padding-bottom: 4px;
            scrollbar-width: none;
            -webkit-overflow-scrolling: touch;
          }
          .filter-chips::-webkit-scrollbar {
            display: none;
          }
          .franchise-page-title {
            font-size: 1.6rem;
          }
          .franchise-hub-banner {
            padding: 16px 14px;
            margin-bottom: 20px;
          }
          .franchise-stats-bar {
            gap: 8px;
          }
          .franchise-stat-item {
            font-size: 0.74rem;
            padding: 4px 10px;
          }
        }

        /* Desktop Device Simulator Floating Button */
        .desktop-device-toggle-bar {
          position: fixed;
          bottom: 24px;
          right: 24px;
          z-index: 1060;
          display: flex;
        }
        @media (max-width: 768px) {
          .desktop-device-toggle-bar {
            display: none !important;
          }
        }
        .device-toggle-pill {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 10px 18px;
          border-radius: var(--radius-full);
          background: rgba(9, 13, 22, 0.95);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(0, 242, 254, 0.4);
          color: #ffffff;
          font-size: 0.82rem;
          font-weight: 700;
          cursor: pointer;
          box-shadow: 0 8px 30px rgba(0, 0, 0, 0.5), 0 0 15px rgba(0, 242, 254, 0.2);
          transition: all var(--transition-normal);
        }
        .device-toggle-pill:hover {
          transform: translateY(-2px);
          border-color: var(--accent-red);
          box-shadow: 0 10px 35px rgba(255, 32, 78, 0.4);
        }
        .device-toggle-pill.active {
          background: linear-gradient(135deg, var(--accent-red) 0%, #b5179e 100%);
          border-color: transparent;
        }

        /* Force Mobile Mode Simulator Wrapper */
        .force-mobile-mode {
          max-width: 420px !important;
          margin: 20px auto 100px !important;
          border-radius: 44px !important;
          border: 12px solid #1e293b !important;
          box-shadow: 0 25px 80px rgba(0, 0, 0, 0.9), 0 0 50px rgba(255, 32, 78, 0.25) !important;
          overflow: hidden !important;
          position: relative !important;
          padding-bottom: calc(85px + env(safe-area-inset-bottom, 0px)) !important;
          background: var(--bg-darkest) !important;
        }
        html[data-theme="light"] .force-mobile-mode {
          border-color: #cbd5e1 !important;
          box-shadow: 0 25px 80px rgba(15, 23, 42, 0.25) !important;
        }
        .force-mobile-mode .main-content-wrapper {
          padding-top: 10px !important;
          padding-left: 12px !important;
          padding-right: 12px !important;
        }
        .force-mobile-mode .scraped-cards-scroll {
          grid-template-columns: repeat(2, 1fr) !important;
          gap: 10px !important;
        }
        .force-mobile-mode .series-grid {
          grid-template-columns: repeat(2, 1fr) !important;
          gap: 10px !important;
        }
        .force-mobile-mode .catalog-filter-bar {
          flex-direction: column !important;
          align-items: stretch !important;
          gap: 12px !important;
          padding: 14px 12px !important;
        }
        .force-mobile-mode .filter-group {
          flex-direction: column !important;
          align-items: flex-start !important;
          gap: 6px !important;
        }
        .force-mobile-mode .filter-chips {
          display: flex !important;
          overflow-x: auto !important;
          width: 100% !important;
          padding-bottom: 4px !important;
          scrollbar-width: none !important;
        }
        .force-mobile-mode .franchise-page-title {
          font-size: 1.6rem !important;
        }
        .force-mobile-mode .franchise-hub-banner {
          padding: 16px 14px !important;
          margin-bottom: 20px !important;
        }
        .force-mobile-mode .hero-banner {
          min-height: 500px !important;
        }
        .force-mobile-mode .hero-title {
          font-size: 1.8rem !important;
        }

        /* Franchise Hub Dedicated Page Banner Styles */
        .franchise-hub-banner {
          margin-bottom: 30px;
          padding: 24px 28px;
          border-radius: var(--radius-lg);
          background: rgba(9, 13, 22, 0.85);
          backdrop-filter: blur(20px);
          position: relative;
          overflow: hidden;
          box-shadow: 0 16px 40px rgba(0, 0, 0, 0.4);
          animation: fadeIn 0.4s ease-out;
        }
        html[data-theme="light"] .franchise-hub-banner {
          background: rgba(255, 255, 255, 0.95);
          box-shadow: 0 16px 40px rgba(15, 23, 42, 0.08);
        }
        .franchise-breadcrumb-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 18px;
          padding-bottom: 14px;
          border-bottom: 1px solid var(--border-subtle);
          flex-wrap: wrap;
          gap: 10px;
        }
        .breadcrumb-nav {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.85rem;
        }
        .breadcrumb-home-btn {
          display: flex;
          align-items: center;
          gap: 5px;
          color: var(--text-muted);
          font-weight: 600;
          cursor: pointer;
        }
        .breadcrumb-home-btn:hover {
          color: var(--accent-red);
        }
        .breadcrumb-separator {
          color: var(--text-muted);
        }
        .breadcrumb-current {
          color: var(--text-main);
          font-weight: 700;
        }
        .back-to-all-btn {
          padding: 6px 14px;
          font-size: 0.82rem;
          font-weight: 700;
          border-radius: var(--radius-full);
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid var(--border-subtle);
          color: var(--text-main);
          cursor: pointer;
          transition: all var(--transition-fast);
        }
        html[data-theme="light"] .back-to-all-btn {
          background: #f1f5f9;
          border-color: #cbd5e1;
          color: #0f172a;
        }
        .back-to-all-btn:hover {
          background: var(--accent-red);
          color: #ffffff;
          border-color: var(--accent-red);
        }
        .franchise-badge-pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 4px 12px;
          border-radius: var(--radius-full);
          border: 1px solid currentColor;
          background: rgba(255, 255, 255, 0.04);
          font-size: 0.78rem;
          font-weight: 800;
          letter-spacing: 0.03em;
          margin-bottom: 10px;
        }
        .franchise-page-title {
          font-size: 2.6rem;
          font-weight: 900;
          letter-spacing: -0.01em;
          line-height: 1.15;
          margin-bottom: 4px;
          color: var(--text-main);
        }
        .franchise-jp-name {
          font-family: var(--font-display);
          font-size: 1.15rem;
          color: var(--accent-cyan);
          letter-spacing: 0.08em;
          margin-bottom: 14px;
          font-weight: 700;
        }
        .franchise-page-desc {
          max-width: 820px;
          font-size: 0.95rem;
          color: var(--text-secondary);
          line-height: 1.6;
          margin-bottom: 20px;
        }
        .franchise-stats-bar {
          display: flex;
          align-items: center;
          gap: 16px;
          flex-wrap: wrap;
        }
        .franchise-stat-item {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 6px 14px;
          border-radius: var(--radius-md);
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid var(--border-subtle);
          font-size: 0.82rem;
          font-weight: 700;
          color: var(--text-main);
        }
        html[data-theme="light"] .franchise-stat-item {
          background: #f8fafc;
          border-color: #cbd5e1;
          color: #0f172a;
        }
      `}</style>
    </div>
  );
}
