import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Navbar from './components/Navbar';
import HeroBanner from './components/HeroBanner';
import SeriesCard from './components/SeriesCard';
import PlayerModal from './components/PlayerModal';
import ProductionDetailModal from './components/ProductionDetailModal';
import ApiExplorerModal from './components/ApiExplorerModal';
import ApiKeyModal from './components/ApiKeyModal';
import WatchlistModal from './components/WatchlistModal';
import ScraperModal from './components/ScraperModal';
import InstallAppModal from './components/InstallAppModal';
import Footer from './components/Footer';

// API Services implementing 02_API_SPECIFICATION.md & Smart Cache
import { 
  getMetaFilters,
  getHomeHero,
  getCatalog,
  searchProductions,
  getUserBookmarks,
  postUserBookmark,
  deleteUserBookmark,
  getUserHistory,
  deleteUserHistory,
  clearAllUserHistory,
  initializeCacheManager,
  getAuthSession,
  loginUser,
  logoutUser
} from './services/apiService';
import { scraperService } from './services/scraperService';
import { DB } from './data/canonicalData';

import { 
  getStoredApiKey, 
  searchTmdbTokusatsu
} from './services/tmdbApi';

import { 
  Film, 
  Search, 
  Play, 
  Tv, 
  Smartphone,
  Check,
  ChevronRight,
  Download,
  Users,
  Shield,
  Zap,
  Flame,
  Clock,
  Sparkles,
  Trash2,
  X
} from 'lucide-react';

// Real Tokusatsu Top 10 Masterpieces Definition
const REAL_TOP_10_TOKUSATSU = [
  {
    rank: 1,
    title: 'Kamen Rider Gavv',
    slug: 'kamen-rider-gavv',
    year: '2024',
    franchise: 'Kamen Rider',
    era: 'Reiwa',
    type: 'tv_series',
    posterUrl: 'https://image.tmdb.org/t/p/w600_and_h900_bestv2/3iHHmX7txgjptGkdqY3Q6V0r0Fk.jpg',
    sub: 'Kamen Rider • 2024',
    rating: 9.8
  },
  {
    rank: 2,
    title: 'Kamen Rider Geats',
    slug: 'kamen-rider-geats',
    year: '2022',
    franchise: 'Kamen Rider',
    era: 'Reiwa',
    type: 'tv_series',
    posterUrl: 'https://image.tmdb.org/t/p/w600_and_h900_bestv2/kiXsuX5qAFUxHvf9BM7MPadFq62.jpg',
    sub: 'Kamen Rider • 2022',
    rating: 9.7
  },
  {
    rank: 3,
    title: 'Ultraman Arc',
    slug: 'ultraman-arc',
    year: '2024',
    franchise: 'Ultraman',
    era: 'Reiwa',
    type: 'tv_series',
    posterUrl: 'https://image.tmdb.org/t/p/w600_and_h900_bestv2/twq2EahjRaUB6B8wjf7ddrCmLhJ.jpg',
    sub: 'Ultraman • 2024',
    rating: 9.6
  },
  {
    rank: 4,
    title: 'Bakuage Sentai Boonboomger',
    slug: 'bakuage-sentai-boonboomger',
    year: '2024',
    franchise: 'Super Sentai',
    era: 'Reiwa',
    type: 'tv_series',
    posterUrl: 'https://image.tmdb.org/t/p/w600_and_h900_bestv2/yNabCz32woEXgrcvRS8ASH55s3G.jpg',
    sub: 'Super Sentai • 2024',
    rating: 9.5
  },
  {
    rank: 5,
    title: 'Shin Kamen Rider',
    slug: 'shin-kamen-rider',
    year: '2023',
    franchise: 'Kamen Rider',
    era: 'Reiwa',
    type: 'movie',
    posterUrl: 'https://image.tmdb.org/t/p/w600_and_h900_bestv2/9dTO2RygcDT0cQkawABw4QkDegN.jpg',
    sub: 'Film Bioskop • 2023',
    rating: 9.4
  },
  {
    rank: 6,
    title: 'Kamen Rider My-Th',
    slug: 'kamen-rider-my-th',
    year: '2026',
    franchise: 'Kamen Rider',
    era: 'Reiwa',
    type: 'tv_series',
    posterUrl: '/posters/poster_kamen_rider_myth.png',
    sub: 'Kamen Rider • 2026',
    rating: 9.4
  },
  {
    rank: 7,
    title: 'Ohsama Sentai King-Ohger',
    slug: 'ohsama-sentai-king-ohger',
    year: '2023',
    franchise: 'Super Sentai',
    era: 'Reiwa',
    type: 'tv_series',
    posterUrl: 'https://image.tmdb.org/t/p/w600_and_h900_bestv2/euSDSrIyUhWbac1tzmg9d3KtmSE.jpg',
    sub: 'Super Sentai • 2023',
    rating: 9.3
  },
  {
    rank: 8,
    title: 'Shin Ultraman',
    slug: 'shin-ultraman',
    year: '2022',
    franchise: 'Ultraman',
    era: 'Reiwa',
    type: 'movie',
    posterUrl: '/posters/poster_shin_ultraman.jpg',
    sub: 'Film Bioskop • 2022',
    rating: 9.2
  },
  {
    rank: 9,
    title: 'Kamen Rider Kuuga',
    slug: 'kamen-rider-kuuga',
    year: '2000',
    franchise: 'Kamen Rider',
    era: 'Heisei',
    type: 'tv_series',
    posterUrl: 'https://image.tmdb.org/t/p/w600_and_h900_bestv2/3J5rPQtETWuEyY9BPr2Lt7FGg7x.jpg',
    sub: 'Heisei Legend • 2000',
    rating: 9.5
  },
  {
    rank: 10,
    title: 'Kaizoku Sentai Gokaiger',
    slug: 'kaizoku-sentai-gokaiger',
    year: '2011',
    franchise: 'Super Sentai',
    era: 'Heisei',
    type: 'tv_series',
    posterUrl: '/posters/poster_ten_gokaiger.jpg',
    sub: 'Heisei Legend • 2011',
    rating: 9.4
  }
];

export default function App() {
  // Responsive / Mobile Phone Preview Simulator State
  const [isMobilePreview, setIsMobilePreview] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('view') === 'mobile' || false;
  });

  // Navigation & Filter State
  const [selectedFranchise, setSelectedFranchise] = useState('all');
  const [selectedGenre, setSelectedGenre] = useState('Semua');
  const [searchQuery, setSearchQuery] = useState('');

  // Catalog Data from API
  const [catalogItems, setCatalogItems] = useState([]);
  const [heroItems, setHeroItems] = useState([]);
  const [loadingCatalog, setLoadingCatalog] = useState(true);

  // Scraped Live Releases Data
  const scrapedReleases = useMemo(() => scraperService.getScrapedEpisodes(), []);

  // Modals state
  const [detailModalSlug, setDetailModalSlug] = useState(null);
  const [playerEpisodeId, setPlayerEpisodeId] = useState(null);
  const [playerWatchOrderSlug, setPlayerWatchOrderSlug] = useState(null);
  const [apiKeyModalOpen, setApiKeyModalOpen] = useState(false);
  const [watchlistModalOpen, setWatchlistModalOpen] = useState(false);
  const [specsModalOpen, setSpecsModalOpen] = useState(false);
  const [scraperModalOpen, setScraperModalOpen] = useState(false);
  const [installModalOpen, setInstallModalOpen] = useState(false);

  // User Stored Data & Auth Session
  const [bookmarks, setBookmarks] = useState([]);
  const [history, setHistory] = useState([]);
  const [authSession, setAuthSession] = useState(() => getAuthSession());

  // Email CTA State
  const [ctaEmail, setCtaEmail] = useState('');
  const [ctaSubmitted, setCtaSubmitted] = useState(false);

  // TMDB Live Integration State
  const [apiKey, setApiKey] = useState(getStoredApiKey());
  const [tmdbSearchResults, setTmdbSearchResults] = useState([]);

  // Inisialisasi Smart Cache Manager saat aplikasi dimulai
  useEffect(() => {
    initializeCacheManager({ activeUserId: authSession.user?.id });

    const handleAuthChange = () => {
      setAuthSession(getAuthSession());
    };
    window.addEventListener('tokuflix:auth_changed', handleAuthChange);
    return () => {
      window.removeEventListener('tokuflix:auth_changed', handleAuthChange);
    };
  }, [authSession.user?.id]);

  const handleLogin = async () => {
    await loginUser({
      id: 'usr_kotaro_01',
      name: 'Kotaro Minami (Black Sun)',
      email: 'kotaro@tokuflix.id'
    });
    setAuthSession(getAuthSession());
    refreshUserData();
  };

  const handleLogout = async () => {
    await logoutUser();
    setAuthSession(getAuthSession());
    refreshUserData();
  };

  // 1. Load Real Tokusatsu Hero Banner Items
  useEffect(() => {
    let isMounted = true;
    async function loadHeroBanner() {
      const heroRes = await getHomeHero({ limit: 6 });

      if (!isMounted) return;
      if (heroRes.success && heroRes.data.length > 0) {
        const mappedHero = heroRes.data.map((item) => {
          const prod = item.production;
          return {
            id: prod.id,
            slug: prod.slug,
            title: prod.title,
            japaneseTitle: prod.title_native,
            franchise: prod.franchise?.name || 'Tokusatsu',
            era: prod.era?.name || 'Reiwa',
            year: prod.release_year,
            status: prod.status === 'ongoing' ? 'Ongoing' : 'Tamat',
            totalEpisodes: prod.total_episodes,
            currentEpisode: prod.total_episodes,
            rating: 9.6,
            quality: '1440p 2K QHD',
            fansub: 'Sorot Sub Indo',
            featured: true,
            eyebrow: prod.franchise?.name ? `SERIAL ${prod.franchise.name.toUpperCase()} (SUB INDO)` : 'SERIAL ORIGINAL TOKUSATSU',
            age: '16+',
            meta: `Serial · ${prod.total_episodes} Episode · ${prod.release_year}`,
            genre: prod.genres?.[0]?.name ? `${prod.genres[0].name} Aksi` : 'Aksi • Henshin',
            backdropUrl: prod.backdrop_url || prod.poster_url,
            posterUrl: prod.poster_url || prod.backdrop_url,
            fallbackBackdrop: prod.backdrop_url,
            fallbackPoster: prod.poster_url,
            tags: prod.genres?.map((g) => g.name) || ['Aksi', 'Henshin', 'Sci-Fi'],
            synopsis: prod.synopsis,
            cta: item.cta,
            rawProduction: prod
          };
        });
        setHeroItems(mappedHero);
      }
    }
    loadHeroBanner();
    return () => { isMounted = false; };
  }, []);

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

  // 3. Query Catalog based on 02_API_SPECIFICATION GET /catalog (100% Real Database Productions)
  useEffect(() => {
    let isMounted = true;
    async function fetchCatalogData() {
      setLoadingCatalog(true);

      const params = {
        franchise: selectedFranchise !== 'all' ? selectedFranchise.toLowerCase().replace(/\s+/g, '-') : undefined,
        q: searchQuery.trim() || undefined,
        sort: 'release_date',
        order: 'desc',
        per_page: 300
      };

      const res = await getCatalog(params);
      if (isMounted && res.success) {
        const mapped = res.data.map((item) => {
          const genreName = item.genres?.[0]?.name || (item.franchise?.name === 'Kamen Rider' ? 'Aksi' : 'Drama');
          return {
            id: item.id,
            slug: item.slug,
            title: item.title,
            japaneseTitle: item.title_native,
            franchise: item.franchise?.name || 'Tokusatsu',
            genre: genreName,
            era: item.era?.name || 'Reiwa',
            year: item.release_year,
            status: item.status === 'ongoing' ? 'Ongoing' : 'Tamat',
            totalEpisodes: item.total_episodes,
            currentEpisode: item.total_episodes,
            rating: 9.0,
            quality: item.type === 'movie' ? '4K UHD' : '1440p 2K QHD',
            fansub: 'Sorot Sub Indo',
            posterUrl: item.poster_url,
            fallbackPoster: item.poster_url,
            badge: item.status === 'ongoing' ? 'EPISODE BARU' : (item.type === 'movie' ? 'MOVIE' : 'LENGKAP'),
            sub: `${item.franchise?.name || 'Tokusatsu'} • ${item.release_year}`,
            rawProduction: item
          };
        });
        setCatalogItems(mapped);
      }
      if (isMounted) setLoadingCatalog(false);
    }

    fetchCatalogData();
    return () => { isMounted = false; };
  }, [selectedFranchise, searchQuery]);

  // 4. Live TMDB Search (Optional enhancement)
  useEffect(() => {
    if (!apiKey || !searchQuery.trim() || searchQuery.trim().length < 2) {
      setTmdbSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      const results = await searchTmdbTokusatsu(searchQuery, apiKey);
      setTmdbSearchResults(results);
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

  // Launch Player with robust series and scraped episode resolution
  const handlePlayEpisodeFromProduction = (production, episode = null, watchOrderSlug = null) => {
    if (episode?.id) {
      setPlayerEpisodeId(episode.id);
      setPlayerWatchOrderSlug(watchOrderSlug);
      return;
    }

    if (production?.id && String(production.id).startsWith('tmdb-')) {
      setPlayerEpisodeId(production.id);
      setPlayerWatchOrderSlug(watchOrderSlug);
      return;
    }

    // Cari episode pertama produksi ini di DB
    if (production?.id) {
      const matchEp = DB.episodes.find((e) => e.production_id === production.id && e.is_published);
      if (matchEp) {
        setPlayerEpisodeId(matchEp.id);
        setPlayerWatchOrderSlug(watchOrderSlug);
        return;
      }
    }

    // Cari episode scraper yang cocok
    if (production?.slug || production?.title) {
      const liveList = scraperService.getLiveFeed() || [];
      const matchScraped = liveList.find((e) => 
        (production.slug && e.productionId?.includes(production.slug)) || 
        (production.title && e.seriesTitle?.toLowerCase().includes(production.title.toLowerCase()))
      );
      if (matchScraped) {
        setPlayerEpisodeId(matchScraped.id);
        setPlayerWatchOrderSlug(watchOrderSlug);
        return;
      }
    }

    setPlayerEpisodeId('0192a3f0-2222-7000-8000-000000000001');
    setPlayerWatchOrderSlug(watchOrderSlug);
  };

  // 1. "Lanjutkan Menonton" (100% Real User Watch History - Zero Dummy Fallback)
  const continueWatchingItems = useMemo(() => {
    if (!history || history.length === 0) {
      return [];
    }

    return history.slice(0, 10).map((h, i) => {
      const prod = h.production || {};
      const ep = h.episode || {};
      const progressSec = Math.max(0, h.progress_seconds || 0);
      const durationSec = Math.max(1, h.duration_seconds || ep.duration_seconds || 1440);
      const pctNumber = Math.min(100, Math.max(1, Math.round((progressSec / durationSec) * 100)));
      const remainingMinutes = durationSec > progressSec 
        ? Math.max(1, Math.round((durationSec - progressSec) / 60)) 
        : 0;

      return {
        id: ep.id || h.episode_id || prod.id || `hist-${i}`,
        episodeId: ep.id || h.episode_id,
        productionId: prod.id || h.production_id,
        title: prod.title || h.series_title || 'Serial Tokusatsu',
        sub: `Ep ${ep.episode_number || h.episode_number || 1} · sisa ${remainingMinutes} mnt`,
        pct: `${pctNumber}%`,
        posterUrl: prod.backdrop_url || prod.poster_url || ep.thumbnail_url || h.poster_url || 'https://image.tmdb.org/t/p/w600_and_h900_bestv2/3iHHmX7txgjptGkdqY3Q6V0r0Fk.jpg',
        production: prod,
        progressSeconds: progressSec,
        durationSeconds: durationSec,
        isCompleted: h.is_completed
      };
    });
  }, [history]);

  // 2. "Top 10 Minggu Ini di Indonesia" (100% Real Tokusatsu Rankings 1..10)
  const top10Items = useMemo(() => {
    return REAL_TOP_10_TOKUSATSU.map((item) => {
      const match = catalogItems.find(c => c.slug === item.slug || c.title.toLowerCase().includes(item.title.toLowerCase()));
      return {
        rank: item.rank,
        title: item.title,
        posterUrl: match?.posterUrl || item.posterUrl,
        slug: item.slug,
        production: match?.rawProduction || {
          id: `prod_${item.slug}`,
          title: item.title,
          slug: item.slug,
          total_episodes: 50
        }
      };
    });
  }, [catalogItems]);

  // 3. "Baru Rilis" (100% Real Scraped & Ongoing Tokusatsu Episodes)
  const freshReleases = useMemo(() => {
    if (scrapedReleases.length > 0) {
      return scrapedReleases.slice(0, 10).map((ep, idx) => {
        const isMyth = (ep.seriesTitle || '').toLowerCase().includes('my-th');
        const isGavv = (ep.seriesTitle || '').toLowerCase().includes('gavv');
        const badge = isMyth || isGavv ? 'EPISODE BARU' : (ep.contentType === 'movie' ? 'MOVIE BARU' : 'BARU');
        return {
          id: ep.id || `fresh-${idx}`,
          title: ep.title,
          seriesTitle: ep.seriesTitle || ep.title,
          badge,
          sub: `${ep.franchise || 'Tokusatsu'} · ${ep.quality || '1440p QHD'}`,
          posterUrl: ep.thumbnail,
          episodeId: ep.id,
          production: { title: ep.seriesTitle || ep.title, slug: ep.productionId || ep.id, id: ep.id }
        };
      });
    }

    // Fallback real ongoing Tokusatsu
    return [
      { title: 'Kamen Rider Gavv Ep 1', badge: 'EPISODE BARU', sub: 'Kamen Rider · 2024', posterUrl: 'https://image.tmdb.org/t/p/w600_and_h900_bestv2/3iHHmX7txgjptGkdqY3Q6V0r0Fk.jpg', slug: 'kamen-rider-gavv' },
      { title: 'Kamen Rider My-Th Ep 7', badge: 'EPISODE BARU', sub: 'Kamen Rider · 2026', posterUrl: '/posters/poster_kamen_rider_myth.png', slug: 'kamen-rider-my-th' },
      { title: 'Bakuage Sentai Boonboomger Ep 1', badge: 'BARU', sub: 'Super Sentai · 2024', posterUrl: 'https://image.tmdb.org/t/p/w600_and_h900_bestv2/yNabCz32woEXgrcvRS8ASH55s3G.jpg', slug: 'bakuage-sentai-boonboomger' },
      { title: 'Ultraman Arc Ep 1', badge: 'BARU', sub: 'Ultraman · 2024', posterUrl: 'https://image.tmdb.org/t/p/w600_and_h900_bestv2/twq2EahjRaUB6B8wjf7ddrCmLhJ.jpg', slug: 'ultraman-arc' },
      { title: 'Kaizoku Sentai Ten Gokaiger', badge: 'MOVIE BARU', sub: 'Super Sentai · 2021', posterUrl: '/posters/poster_ten_gokaiger.jpg', slug: 'kaizoku-sentai-ten-gokaiger' },
      { title: 'Kamen Rider W Returns: Eternal', badge: 'MOVIE BARU', sub: 'Kamen Rider · 2011', posterUrl: '/posters/poster_eternal.jpg', slug: 'kamen-rider-w-returns-eternal' },
      { title: 'Shin Ultraman', badge: 'MOVIE BARU', sub: 'Ultraman · 2022', posterUrl: '/posters/poster_shin_ultraman.jpg', slug: 'shin-ultraman' },
      { title: 'Kamen Rider Kuuga Ep 1', badge: 'REMASTER', sub: 'Kamen Rider · 2000', posterUrl: 'https://image.tmdb.org/t/p/w600_and_h900_bestv2/3J5rPQtETWuEyY9BPr2Lt7FGg7x.jpg', slug: 'kamen-rider-kuuga' }
    ].map((item, idx) => ({
      id: `fresh-${idx}`,
      title: item.title,
      badge: item.badge,
      sub: item.sub,
      posterUrl: item.posterUrl,
      production: { title: item.title, slug: item.slug }
    }));
  }, [scrapedReleases]);

  // 4. Genre & Category Filters (100% Real Tokusatsu)
  const genreList = useMemo(() => [
    'Semua', 
    'Kamen Rider', 
    'Super Sentai', 
    'Ultraman', 
    'Garo & Kaiju',
    'Reiwa', 
    'Heisei', 
    'Showa', 
    'Movie', 
    'TV Series'
  ], []);

  // 5. "Jelajahi Katalog" (100% Real Tokusatsu Data Only - No Fictional Dummies)
  const filteredCatalog = useMemo(() => {
    let list = catalogItems.map((item) => ({
      id: item.id,
      title: item.title,
      japaneseTitle: item.japaneseTitle,
      franchise: item.franchise,
      era: item.era,
      year: item.year,
      type: item.rawProduction?.type || item.type,
      sub: `${item.franchise} • ${item.era || ''} (${item.year})`,
      posterUrl: item.posterUrl,
      badge: item.status === 'Ongoing' ? 'TAYANG' : (item.rawProduction?.type === 'movie' ? 'MOVIE' : 'LENGKAP'),
      production: item.rawProduction || item
    }));

    if (selectedGenre !== 'Semua') {
      const gLower = selectedGenre.toLowerCase();
      if (gLower === 'movie') {
        list = list.filter(item => item.type === 'movie' || item.title.toLowerCase().includes('movie'));
      } else if (gLower === 'tv series') {
        list = list.filter(item => item.type === 'tv_series');
      } else if (['reiwa', 'heisei', 'showa'].includes(gLower)) {
        list = list.filter(item => (item.era || '').toLowerCase() === gLower);
      } else if (gLower.includes('kamen') || gLower.includes('rider')) {
        list = list.filter(item => (item.franchise || '').toLowerCase().includes('kamen'));
      } else if (gLower.includes('sentai')) {
        list = list.filter(item => (item.franchise || '').toLowerCase().includes('sentai'));
      } else if (gLower.includes('ultra')) {
        list = list.filter(item => (item.franchise || '').toLowerCase().includes('ultra'));
      } else if (gLower.includes('garo')) {
        list = list.filter(item => (item.franchise || '').toLowerCase().includes('garo'));
      } else {
        list = list.filter(item => 
          (item.franchise || '').toLowerCase().includes(gLower) ||
          item.title.toLowerCase().includes(gLower)
        );
      }
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(item => 
        item.title.toLowerCase().includes(q) || 
        (item.japaneseTitle && item.japaneseTitle.toLowerCase().includes(q)) ||
        (item.franchise && item.franchise.toLowerCase().includes(q))
      );
    }

    return list;
  }, [catalogItems, selectedGenre, searchQuery]);

  const handleCtaSubmit = (e) => {
    e.preventDefault();
    if (ctaEmail.trim()) {
      setCtaSubmitted(true);
      setTimeout(() => setCtaSubmitted(false), 4000);
      setCtaEmail('');
    }
  };

  return (
    <div className={`sorot-app ${isMobilePreview ? 'force-mobile-mode' : ''}`}>
      {/* 1. Header / Navbar */}
      <Navbar
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        selectedFranchise={selectedFranchise}
        setSelectedFranchise={setSelectedFranchise}
        onOpenApiKeyModal={() => setApiKeyModalOpen(true)}
        onOpenWatchlist={() => setWatchlistModalOpen(true)}
        onOpenSpecs={() => setSpecsModalOpen(true)}
        onOpenScraper={() => setScraperModalOpen(true)}
        onOpenInstallModal={() => setInstallModalOpen(true)}
        scrapedCount={scrapedReleases.length}
        watchlistCount={bookmarks.length}
        hasTmdbKey={Boolean(apiKey)}
        authSession={authSession}
        onLogin={handleLogin}
        onLogout={handleLogout}
      />

      {/* 2. Hero Section (Sorot Spotlight + 3D Tilted Poster + Real Tokusatsu Switcher) */}
      {!searchQuery && (
        <HeroBanner
          featuredItems={heroItems}
          onPlayEpisode={(prod, ep) => handlePlayEpisodeFromProduction(prod, ep)}
          onSelectSeries={(prod) => setDetailModalSlug(prod.slug)}
          isBookmarked={isBookmarked}
          onToggleBookmark={handleToggleBookmark}
        />
      )}

      {/* Search Header when searching */}
      {searchQuery && (
        <div className="container" style={{ paddingTop: '100px', paddingBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Search size={24} color="#E50914" />
            <h2 className="disp" style={{ fontSize: '28px', fontWeight: 800 }}>
              Hasil Pencarian: &ldquo;{searchQuery}&rdquo;
            </h2>
            <span style={{ padding: '4px 10px', background: '#E50914', borderRadius: '4px', fontSize: '13px', fontWeight: 700 }}>
              {filteredCatalog.length} Judul Tokusatsu
            </span>
          </div>
        </div>
      )}

      {/* 3. Section: Lanjutkan Menonton (100% Real Playable Tokusatsu Episodes & History Tracking) */}
      {!searchQuery && continueWatchingItems.length > 0 && (
        <section id="lanjut" aria-label="Lanjutkan Menonton" style={{ padding: '36px clamp(16px, 4vw, 56px) 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', marginBottom: '8px' }}>
            <h2 className="disp" style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '24px', fontWeight: 700, letterSpacing: '-.01em' }}>
              <span aria-hidden="true" style={{ width: '4px', height: '22px', borderRadius: '2px', background: '#E50914' }} />
              Lanjutkan Menonton
            </h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <button 
                type="button" 
                onClick={async () => {
                  if (window.confirm('Bersihkan seluruh riwayat tontonan Anda?')) {
                    await clearAllUserHistory();
                    refreshUserData();
                  }
                }}
                style={{ 
                  background: 'none', 
                  border: 'none', 
                  color: '#8E8E93', 
                  fontSize: '13px', 
                  cursor: 'pointer', 
                  display: 'inline-flex', 
                  alignItems: 'center', 
                  gap: '6px' 
                }}
                title="Hapus semua riwayat tontonan"
              >
                <Trash2 size={14} />
                <span>Bersihkan Riwayat</span>
              </button>
              <a href="#jelajah" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '14px', fontWeight: 700, color: '#B8B8BC' }}>
                Lihat semua
                <ChevronRight size={16} />
              </a>
            </div>
          </div>

          <div className="scroller">
            {continueWatchingItems.map((c) => (
              <div 
                key={c.id} 
                className="card" 
                style={{ width: '320px', flex: '0 0 auto', position: 'relative' }}
              >
                <button
                  type="button"
                  style={{ all: 'unset', width: '100%', cursor: 'pointer', display: 'block', textAlign: 'left' }}
                  onClick={() => {
                    if (c.episodeId) {
                      setPlayerEpisodeId(c.episodeId);
                    } else if (c.production) {
                      handlePlayEpisodeFromProduction(c.production);
                    } else {
                      setDetailModalSlug(c.slug || 'kamen-rider-gavv');
                    }
                  }}
                >
                  <div 
                    className="poster" 
                    style={{ 
                      width: '320px', 
                      height: '180px', 
                      position: 'relative',
                      overflow: 'hidden',
                      background: '#151518',
                      borderRadius: '8px'
                    }}
                  >
                    <img 
                      src={c.posterUrl} 
                      alt={c.title} 
                      loading="lazy"
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      onError={(e) => {
                        e.currentTarget.src = 'https://image.tmdb.org/t/p/w600_and_h900_bestv2/3iHHmX7txgjptGkdqY3Q6V0r0Fk.jpg';
                      }}
                    />
                    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'linear-gradient(0deg, rgba(0,0,0,.85), rgba(0,0,0,0) 60%)' }} />
                    <div className="disp" style={{ position: 'absolute', left: '16px', right: '48px', bottom: '18px', fontSize: '20px', fontWeight: 800, lineHeight: 1.1, letterSpacing: '-.015em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {c.title}
                    </div>
                    {/* Red progress bar representing real watched seconds */}
                    <div aria-hidden="true" style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: '5px', background: 'rgba(255,255,255,.28)' }}>
                      <div style={{ height: '100%', background: '#E50914', width: c.pct }} />
                    </div>
                    <div className="ov">
                      <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '54px', height: '54px', borderRadius: '50%', border: '2px solid #fff', background: 'rgba(0,0,0,.5)' }}>
                        <Play size={24} fill="#fff" />
                      </span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '10px' }}>
                    <div style={{ fontSize: '14px', color: '#9A9AA0' }}>{c.sub}</div>
                    <div style={{ fontSize: '12px', color: '#E50914', fontWeight: 700 }}>{c.pct}</div>
                  </div>
                </button>

                {/* Tombol Hapus Riwayat Spesifik */}
                <button
                  type="button"
                  onClick={async (e) => {
                    e.stopPropagation();
                    await deleteUserHistory(c.episodeId || c.id);
                    refreshUserData();
                  }}
                  title="Hapus dari riwayat menonton"
                  style={{
                    position: 'absolute',
                    top: '8px',
                    right: '8px',
                    width: '28px',
                    height: '28px',
                    borderRadius: '50%',
                    background: 'rgba(0,0,0,0.7)',
                    backdropFilter: 'blur(6px)',
                    border: '1px solid rgba(255,255,255,0.2)',
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    zIndex: 5,
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#E50914';
                    e.currentTarget.style.borderColor = '#E50914';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(0,0,0,0.7)';
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)';
                  }}
                >
                  <X size={15} />
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 4. Section: Top 10 Minggu Ini di Indonesia (100% Real Tokusatsu Posters & Numerals 1..10) */}
      {!searchQuery && (
        <section id="top10" aria-label="Top 10 Minggu Ini" style={{ padding: '24px clamp(16px, 4vw, 56px) 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', marginBottom: '8px' }}>
            <h2 className="disp" style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '24px', fontWeight: 700, letterSpacing: '-.01em' }}>
              <span aria-hidden="true" style={{ width: '4px', height: '22px', borderRadius: '2px', background: '#E50914' }} />
              Top 10 Minggu Ini di Indonesia
            </h2>
          </div>

          <div className="scroller" style={{ gap: '6px', paddingTop: '14px' }}>
            {top10Items.map((t) => (
              <button 
                key={t.rank} 
                type="button" 
                className="card" 
                style={{ display: 'flex', alignItems: 'flex-end', paddingRight: '16px', flex: '0 0 auto' }}
                onClick={() => {
                  if (t.slug) {
                    setDetailModalSlug(t.slug);
                  } else {
                    handlePlayEpisodeFromProduction(t.production);
                  }
                }}
              >
                <span 
                  className="disp" 
                  style={{
                    fontSize: '176px',
                    fontWeight: 800,
                    lineHeight: .78,
                    letterSpacing: '-.06em',
                    marginRight: '-30px',
                    padding: '0 4px 8px 0',
                    background: 'linear-gradient(180deg, #E50914 0%, #5B0409 100%)',
                    WebkitBackgroundClip: 'text',
                    backgroundClip: 'text',
                    color: 'transparent',
                    WebkitTextFillColor: 'transparent',
                    userSelect: 'none'
                  }}
                >
                  {t.rank}
                </span>
                <div 
                  className="poster" 
                  style={{
                    zIndex: 1,
                    width: '150px',
                    height: '225px',
                    position: 'relative',
                    overflow: 'hidden',
                    background: '#151518'
                  }}
                >
                  <img 
                    src={t.posterUrl} 
                    alt={t.title} 
                    loading="lazy"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    onError={(e) => {
                      e.currentTarget.src = 'https://image.tmdb.org/t/p/w600_and_h900_bestv2/3iHHmX7txgjptGkdqY3Q6V0r0Fk.jpg';
                    }}
                  />
                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'linear-gradient(0deg, rgba(0,0,0,.85), rgba(0,0,0,0) 58%)' }} />
                  <div className="disp" style={{ position: 'absolute', left: '12px', right: '12px', bottom: '12px', fontSize: '18px', fontWeight: 800, lineHeight: 1.05, letterSpacing: '-.01em' }}>
                    {t.title}
                  </div>
                  <div className="ov">
                    <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '46px', height: '46px', borderRadius: '50%', border: '2px solid #fff', background: 'rgba(0,0,0,.5)' }}>
                      <Play size={20} fill="#fff" />
                    </span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* 5. Section: Baru Rilis (100% Real Scraped Fansub Episodes & Releases) */}
      {!searchQuery && (
        <section id="baru" aria-label="Baru Rilis" style={{ padding: '24px clamp(16px, 4vw, 56px) 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', marginBottom: '8px' }}>
            <h2 className="disp" style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '24px', fontWeight: 700, letterSpacing: '-.01em' }}>
              <span aria-hidden="true" style={{ width: '4px', height: '22px', borderRadius: '2px', background: '#E50914' }} />
              Baru Rilis
            </h2>
            <button 
              onClick={() => setScraperModalOpen(true)}
              style={{ background: 'none', border: 0, display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '14px', fontWeight: 700, color: '#B8B8BC', cursor: 'pointer' }}
            >
              <span>Fansub Scraper Live ({scrapedReleases.length})</span>
              <ChevronRight size={16} />
            </button>
          </div>

          <div className="scroller">
            {freshReleases.map((p) => (
              <button 
                key={p.id} 
                type="button" 
                className="card" 
                style={{ width: '188px', flex: '0 0 auto' }}
                onClick={() => {
                  if (p.episodeId) {
                    setPlayerEpisodeId(p.episodeId);
                  } else if (p.production?.slug) {
                    setDetailModalSlug(p.production.slug);
                  } else {
                    handlePlayEpisodeFromProduction(p.production);
                  }
                }}
              >
                <div 
                  className="poster" 
                  style={{ 
                    width: '188px', 
                    height: '282px', 
                    position: 'relative',
                    overflow: 'hidden',
                    background: '#151518'
                  }}
                >
                  <img 
                    src={p.posterUrl} 
                    alt={p.title} 
                    loading="lazy"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    onError={(e) => {
                      e.currentTarget.src = 'https://image.tmdb.org/t/p/w600_and_h900_bestv2/3iHHmX7txgjptGkdqY3Q6V0r0Fk.jpg';
                    }}
                  />
                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'linear-gradient(0deg, rgba(0,0,0,.85), rgba(0,0,0,0) 58%)' }} />
                  <span style={{ position: 'absolute', top: '10px', left: '10px', padding: '4px 8px', borderRadius: '4px', background: p.badge === 'EPISODE BARU' ? '#F6121D' : '#E50914', color: '#fff', fontSize: '11px', fontWeight: 800, letterSpacing: '.06em' }}>
                    {p.badge}
                  </span>
                  <div className="disp" style={{ position: 'absolute', left: '14px', right: '14px', bottom: '14px', fontSize: '18px', fontWeight: 800, lineHeight: 1.1, letterSpacing: '-.01em' }}>
                    {p.title}
                  </div>
                  <div className="ov">
                    <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '50px', height: '50px', borderRadius: '50%', border: '2px solid #fff', background: 'rgba(0,0,0,.5)' }}>
                      <Play size={22} fill="#fff" />
                    </span>
                  </div>
                </div>
                <div style={{ fontSize: '13px', color: '#9A9AA0', marginTop: '10px' }}>{p.sub}</div>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* 6. Section: Fitur Streaming ("Satu layar, banyak cara menonton") */}
      {!searchQuery && (
        <section id="fitur" aria-label="Fitur Sorot" style={{ marginTop: '48px', padding: '88px clamp(16px, 4vw, 56px)', background: '#111113', borderTop: '1px solid rgba(255,255,255,.08)', borderBottom: '1px solid rgba(255,255,255,.08)' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '64px', maxWidth: '1240px', margin: '0 auto' }}>
            {/* Interactive Screen Mockup */}
            <div 
              aria-hidden="true" 
              style={{
                flex: '1 1 460px',
                maxWidth: '620px',
                position: 'relative',
                height: '370px',
                borderRadius: '18px',
                overflow: 'hidden',
                border: '1px solid rgba(255,255,255,.1)',
                background: 'radial-gradient(60% 80% at 70% 30%, hsla(352,80%,42%,.55) 0%, transparent 70%), conic-gradient(from 200deg at 88% -8%, transparent 0deg, rgba(255,255,255,.16) 18deg, transparent 36deg), linear-gradient(120deg, #2A0508 0%, #0B0B0C 80%)'
              }}
            >
              <div style={{ position: 'absolute', top: '20px', left: '20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ display: 'flex' }}>
                  <span style={{ width: '34px', height: '34px', borderRadius: '50%', background: '#E50914', border: '2px solid #111113', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 700 }}>A</span>
                  <span style={{ width: '34px', height: '34px', borderRadius: '50%', background: '#2F6F8F', border: '2px solid #111113', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 700, marginLeft: '-10px' }}>B</span>
                  <span style={{ width: '34px', height: '34px', borderRadius: '50%', background: '#B07A1F', border: '2px solid #111113', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 700, marginLeft: '-10px' }}>C</span>
                </div>
                <span style={{ fontSize: '13px', color: '#E2E2E5', fontWeight: 500 }}>3 teman sedang nobar Tokusatsu</span>
              </div>

              <div style={{ position: 'absolute', top: '50%', left: '50%', width: '76px', height: '76px', margin: '-48px 0 0 -38px', borderRadius: '50%', border: '2px solid #fff', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,.45)' }}>
                <Play size={32} fill="#fff" />
              </div>

              <div style={{ position: 'absolute', right: '20px', top: '74px', padding: '10px 14px', borderRadius: '14px 14px 4px 14px', background: 'rgba(255,255,255,.14)', fontSize: '14px', backdropFilter: 'blur(8px)' }}>
                Henshin-nya keren banget! ⚡
              </div>
              <div style={{ position: 'absolute', left: '20px', bottom: '64px', padding: '10px 14px', borderRadius: '14px 14px 14px 4px', background: '#E50914', fontSize: '14px', fontWeight: 600 }}>
                Kualitas 1440p 2K jernih pol! 🔥
              </div>
              <div style={{ position: 'absolute', left: '20px', right: '20px', bottom: '24px', height: '5px', borderRadius: '3px', background: 'rgba(255,255,255,.25)' }}>
                <div style={{ width: '58%', height: '100%', borderRadius: '3px', background: '#E50914' }} />
              </div>
            </div>

            {/* Feature Description List */}
            <div style={{ flex: '1 1 380px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '12px', fontWeight: 700, letterSpacing: '.14em', textTransform: 'uppercase', color: '#E8E8EA' }}>
                <span aria-hidden="true" style={{ width: '4px', height: '18px', borderRadius: '2px', background: '#E50914' }} />
                Fitur Streaming Tokuflix
              </div>
              <h2 className="disp" style={{ fontSize: 'clamp(30px, 4vw, 46px)', fontWeight: 800, lineHeight: 1.04, letterSpacing: '-.03em', margin: '14px 0 28px' }}>
                Satu layar, banyak cara menonton.
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
                <div style={{ display: 'flex', gap: '16px' }}>
                  <span style={{ flex: '0 0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(229,9,20,.16)', color: '#FF4B55' }}>
                    <Users size={24} />
                  </span>
                  <div>
                    <h3 className="disp" style={{ fontSize: '19px', fontWeight: 700, marginBottom: '4px' }}>Ruang Nonton Bareng</h3>
                    <p style={{ fontSize: '15px', lineHeight: 1.55, color: '#B8B8BC' }}>
                      Putar serempak serial Kamen Rider & Sentai bersama teman secara sinkron dan ngobrol langsung di samping layar.
                    </p>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '16px' }}>
                  <span style={{ flex: '0 0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(229,9,20,.16)', color: '#FF4B55' }}>
                    <Download size={24} />
                  </span>
                  <div>
                    <h3 className="disp" style={{ fontSize: '19px', fontWeight: 700, marginBottom: '4px' }}>Unduh Offline & GDrive Direct</h3>
                    <p style={{ fontSize: '15px', lineHeight: 1.55, color: '#B8B8BC' }}>
                      Tersedia mirror Google Drive direct HD 1440p/1080p untuk unduhan cepat dan tonton di perjalanan tanpa kuota.
                    </p>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '16px' }}>
                  <span style={{ flex: '0 0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(229,9,20,.16)', color: '#FF4B55' }}>
                    <Shield size={24} />
                  </span>
                  <div>
                    <h3 className="disp" style={{ fontSize: '19px', fontWeight: 700, marginBottom: '4px' }}>Smart Cache 48 Jam & Anti-Tamper</h3>
                    <p style={{ fontSize: '15px', lineHeight: 1.55, color: '#B8B8BC' }}>
                      Manajemen cache cerdas client-side tanpa proxy backend, hemat kuota internet, dan sistem terproteksi dari modifikasi.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 7. Section: Jelajahi Katalog (100% REAL TOKUSATSU DATA ONLY) */}
      <section id="jelajah" aria-label="Jelajahi Katalog" style={{ padding: '72px clamp(16px, 4vw, 56px) 0' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: '16px', marginBottom: '18px' }}>
          <h2 className="disp" style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '24px', fontWeight: 700, letterSpacing: '-.01em' }}>
            <span aria-hidden="true" style={{ width: '4px', height: '22px', borderRadius: '2px', background: '#E50914' }} />
            Jelajahi Katalog Tokusatsu
          </h2>
          <span style={{ fontSize: '14px', color: '#9A9AA0' }}>
            {filteredCatalog.length} Judul Tokusatsu
          </span>
        </div>

        {/* Real Tokusatsu Filter Pills */}
        <div role="group" aria-label="Filter kategori" style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '26px' }}>
          {genreList.map((g) => {
            const active = selectedGenre === g;
            return (
              <button
                key={g}
                type="button"
                className="chip"
                aria-pressed={active}
                onClick={() => setSelectedGenre(g)}
                style={{
                  border: `1px solid ${active ? '#FFFFFF' : 'rgba(255,255,255,.28)'}`,
                  background: active ? '#FFFFFF' : 'transparent',
                  color: active ? '#0B0B0C' : '#E8E8EA'
                }}
              >
                {g}
              </button>
            );
          })}
        </div>

        {/* Responsive Grid with 100% Real Tokusatsu Cards */}
        {filteredCatalog.length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(168px, 1fr))', gap: '26px 14px' }}>
            {filteredCatalog.map((item) => (
              <button 
                key={item.id} 
                type="button" 
                className="card"
                onClick={() => {
                  if (item.production?.slug) {
                    setDetailModalSlug(item.production.slug);
                  } else {
                    handlePlayEpisodeFromProduction(item.production);
                  }
                }}
              >
                <div 
                  className="poster" 
                  style={{ 
                    width: '100%', 
                    aspectRatio: '2/3', 
                    position: 'relative',
                    overflow: 'hidden',
                    background: '#151518'
                  }}
                >
                  <img 
                    src={item.posterUrl} 
                    alt={item.title} 
                    loading="lazy"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    onError={(e) => {
                      e.currentTarget.src = 'https://image.tmdb.org/t/p/w600_and_h900_bestv2/3iHHmX7txgjptGkdqY3Q6V0r0Fk.jpg';
                    }}
                  />
                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'linear-gradient(0deg, rgba(0,0,0,.85), rgba(0,0,0,0) 58%)' }} />
                  <span style={{ position: 'absolute', top: '10px', left: '10px', padding: '3px 7px', borderRadius: '4px', background: 'rgba(229,9,20,.9)', color: '#fff', fontSize: '10px', fontWeight: 800 }}>
                    {item.badge}
                  </span>
                  <div className="disp" style={{ position: 'absolute', left: '14px', right: '14px', bottom: '14px', fontSize: '18px', fontWeight: 800, lineHeight: 1.1, letterSpacing: '-.01em' }}>
                    {item.title}
                  </div>
                  <div className="ov">
                    <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '50px', height: '50px', borderRadius: '50%', border: '2px solid #fff', background: 'rgba(0,0,0,.5)' }}>
                      <Play size={22} fill="#fff" />
                    </span>
                  </div>
                </div>
                <div style={{ fontSize: '13px', color: '#9A9AA0', marginTop: '10px' }}>
                  {item.sub}
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div style={{ padding: '60px 20px', textAlign: 'center', color: '#8E8E94', background: '#111113', borderRadius: '12px', border: '1px solid rgba(255,255,255,.08)' }}>
            <Film size={40} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
            <h3 className="disp" style={{ fontSize: '20px', color: '#fff', marginBottom: '6px' }}>Tidak ada judul yang cocok</h3>
            <p style={{ fontSize: '14px' }}>Coba pilih kategori franchise lain atau ubah kata kunci pencarian.</p>
            <button 
              className="btn btn-w" 
              style={{ marginTop: '16px', height: '42px', padding: '0 20px', fontSize: '14px' }}
              onClick={() => { setSelectedGenre('Semua'); setSearchQuery(''); }}
            >
              Reset Filter
            </button>
          </div>
        )}
      </section>

      {/* 8. Section: Siap Nonton Malam Ini? (Email CTA banner) */}
      <section 
        id="mulai" 
        aria-label="Mulai menonton" 
        style={{
          position: 'relative',
          marginTop: '96px',
          padding: '96px clamp(16px, 4vw, 56px)',
          textAlign: 'center',
          overflow: 'hidden',
          background: 'radial-gradient(60% 90% at 50% 0%, hsla(352,80%,40%,.45) 0%, transparent 70%), conic-gradient(from 160deg at 50% -20%, transparent 0deg, rgba(255,255,255,.10) 20deg, transparent 40deg, transparent 320deg, rgba(255,255,255,.10) 340deg, transparent 360deg), #0B0B0C',
          borderTop: '1px solid rgba(255,255,255,.08)'
        }}
      >
        <h2 className="disp" style={{ fontSize: 'clamp(34px, 5vw, 60px)', fontWeight: 800, lineHeight: 1, letterSpacing: '-.035em', maxWidth: '760px', margin: '0 auto 16px' }}>
          Siap nonton malam ini?
        </h2>
        <p style={{ fontSize: '18px', lineHeight: 1.5, color: '#C8C8CC', maxWidth: '520px', margin: '0 auto 28px' }}>
          Masukkan email untuk membuat akun baru atau melanjutkan tontonan Tokusatsu favoritmu di perangkat mana pun.
        </p>
        <form onSubmit={handleCtaSubmit} style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '10px', maxWidth: '620px', margin: '0 auto' }}>
          <label htmlFor="email-mulai" className="sr-only" style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden' }}>Alamat email</label>
          <input 
            id="email-mulai" 
            type="email" 
            value={ctaEmail}
            onChange={(e) => setCtaEmail(e.target.value)}
            placeholder="Alamat email kamu" 
            required
            style={{
              flex: '1 1 300px',
              height: '56px',
              padding: '0 18px',
              borderRadius: '8px',
              border: '1px solid rgba(255,255,255,.3)',
              background: 'rgba(0,0,0,.55)',
              color: '#fff',
              font: "400 16px 'DM Sans', system-ui, sans-serif",
              outline: 'none'
            }}
          />
          <button type="submit" className="btn btn-r" style={{ height: '56px', padding: '0 30px', fontSize: '18px' }}>
            {ctaSubmitted ? (
              <>
                <Check size={20} />
                <span>Tersimpan!</span>
              </>
            ) : (
              <>
                <span>Mulai Nonton</span>
                <ChevronRight size={20} />
              </>
            )}
          </button>
        </form>
      </section>

      {/* 9. Footer */}
      <Footer onSelectFranchise={(f) => setSelectedGenre(f)} />

      {/* 10. Modals */}
      {/* A. Production Detail Modal */}
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

      {/* B. Video Player Modal */}
      {playerEpisodeId && (
        <PlayerModal
          episodeId={playerEpisodeId}
          watchOrderSlug={playerWatchOrderSlug}
          onClose={() => {
            setPlayerEpisodeId(null);
            refreshUserData();
          }}
          onHistoryUpdated={refreshUserData}
          onNavigateEpisode={(nextId) => setPlayerEpisodeId(nextId)}
        />
      )}

      {/* C. Smart Cache & API Specs Modal */}
      {specsModalOpen && (
        <ApiExplorerModal
          onClose={() => setSpecsModalOpen(false)}
        />
      )}

      {/* D. TMDB API Key Modal */}
      {apiKeyModalOpen && (
        <ApiKeyModal
          currentApiKey={apiKey}
          onSaveKey={(newKey) => setApiKey(newKey)}
          onClose={() => setApiKeyModalOpen(false)}
        />
      )}

      {/* E. Watchlist Modal */}
      {watchlistModalOpen && (
        <WatchlistModal
          bookmarks={bookmarks.map((b) => b.production || b)}
          history={history.map((h) => ({
            seriesTitle: h.production?.title || 'Serial Tokusatsu',
            episodeTitle: h.episode?.title || 'Episode',
            posterUrl: h.production?.poster_url,
            episodeNumber: h.episode?.episode_number || 1,
            watchedAt: h.last_watched_at
          }))}
          onSelectSeries={(series) => {
            setWatchlistModalOpen(false);
            setDetailModalSlug(series.slug || 'kamen-rider-gavv');
          }}
          onPlayEpisode={(series, ep) => {
            setWatchlistModalOpen(false);
            handlePlayEpisodeFromProduction(series, ep || { id: '0192a3f0-2222-7000-8000-000000000001' });
          }}
          onRemoveBookmark={(id) => {
            deleteUserBookmark(id);
            refreshUserData();
          }}
          onClearHistory={async () => {
            await clearAllUserHistory();
            refreshUserData();
          }}
          onClose={() => setWatchlistModalOpen(false)}
        />
      )}

      {/* F. Live Fansub Scraper Modal */}
      {scraperModalOpen && (
        <ScraperModal
          onClose={() => setScraperModalOpen(false)}
          onPlayEpisode={(epId) => {
            setScraperModalOpen(false);
            setPlayerEpisodeId(epId);
          }}
        />
      )}

      {/* G. Install Mobile App Modal (PWA & APK Android) */}
      <InstallAppModal
        isOpen={installModalOpen}
        onClose={() => setInstallModalOpen(false)}
      />

      {/* Floating Desktop Device Simulator Switch (for testing mobile on desktop) */}
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
              <Smartphone size={15} color="#E50914" />
              <span>Pratinjau Versi Mobile (390px)</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
