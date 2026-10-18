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
  initializeCacheManager,
  getAuthSession,
  loginUser,
  logoutUser
} from './services/apiService';
import { scraperService } from './services/scraperService';
import { getSecurityStatus } from './services/securityGuard';

import { 
  getStoredApiKey, 
  searchTmdbTokusatsu
} from './services/tmdbApi';

import { 
  Sparkles, 
  Film, 
  Search, 
  AlertCircle,
  Play, 
  Clock, 
  Tv, 
  Smartphone,
  Check,
  ChevronRight,
  Download,
  Users,
  Shield,
  Zap,
  Flame,
  Bookmark
} from 'lucide-react';

// Color & Gradient Generator for Posters (Matching the Sorot template)
export const getPosterGradient = (h, k = 0) => {
  const a = `hsl(${h}, 68%, 34%)`;
  const b = `hsl(${(h + 24) % 360}, 55%, 12%)`;
  const c = `hsl(${h}, 85%, 55%)`;
  if (k === 0) return `radial-gradient(70% 50% at 50% 30%, ${c} 0%, transparent 72%), linear-gradient(170deg, ${a} 0%, ${b} 78%)`;
  if (k === 1) return `repeating-linear-gradient(115deg, rgba(255,255,255,.06) 0 2px, transparent 2px 16px), linear-gradient(160deg, ${a} 0%, ${b} 80%)`;
  if (k === 2) return `conic-gradient(from 200deg at 82% -6%, transparent 0deg, rgba(255,255,255,.2) 20deg, transparent 40deg), linear-gradient(180deg, ${a} 0%, ${b} 85%)`;
  return `radial-gradient(circle at 68% 30%, ${c} 0 15%, transparent 16%), linear-gradient(185deg, ${b} 0%, ${a} 65%, ${b} 100%)`;
};

// Title definitions for template compliance
const SOROT_COLOR_MAP = {
  'Lorong 17': [352, 2],
  'Bayang Pulau': [188, 3],
  'Tanah Seribu Api': [28, 0],
  'Rumah di Ujung Hujan': [236, 1],
  'Garis Samudra': [200, 2],
  'Sang Penjaga Kabut': [168, 0],
  'Pasar Malam Terakhir': [340, 3],
  'Kopi dan Kompas': [24, 1],
  'Detak Kota Tua': [40, 2],
  'Sepuluh Menit Lagi': [355, 0],
  'Kapal Baja 9': [214, 1],
  'Dua Musim Terakhir': [8, 3],
  'Sumur Tanpa Dasar': [270, 0],
  'Warung Nomor Dua': [46, 3],
  'Mertua Online': [316, 1],
  'Hutan yang Bernyanyi': [142, 2],
  'Dapur Nusantara': [18, 0],
  'Kirana: Pemburu Bintang': [262, 2],
  'Bocah Seribu Layang': [198, 3],
  'Naga Sungai Merah': [356, 1],
  'Si Kecil dan Peta Ajaib': [172, 0],
  'Kamen Rider Gavv': [345, 0],
  'Kamen Rider Geats': [210, 2],
  'Kamen Rider Black Sun': [0, 1],
  'Ultraman Arc': [195, 3],
  'Boonboomger': [48, 0],
  'Garo: Makai Senki': [280, 2]
};

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
  const [catalogMeta, setCatalogMeta] = useState(null);
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

  // 1. Load Initial Metadata & Dynamic Hero Banner
  useEffect(() => {
    let isMounted = true;
    async function loadHeroBanner() {
      const heroRes = await getHomeHero({ limit: 6 });

      if (!isMounted) return;
      if (heroRes.success && heroRes.data.length > 0) {
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
          rating: 9.6,
          quality: '1440p 2K QHD',
          fansub: 'Sorot Sub Indo',
          featured: true,
          eyebrow: item.production.franchise?.name ? `SERIAL ORIGINAL ${item.production.franchise.name.toUpperCase()}` : 'SERIAL ORIGINAL SOROT',
          age: '16+',
          meta: `Serial · ${item.production.total_episodes} Episode · ${item.production.release_year}`,
          genre: item.production.genres?.[0]?.name ? `${item.production.genres[0].name} Aksi` : 'Thriller Psikologis',
          backdropUrl: item.production.backdrop_url,
          posterUrl: item.production.poster_url,
          fallbackBackdrop: item.production.backdrop_url,
          fallbackPoster: item.production.poster_url,
          tags: item.production.genres?.map((g) => g.name) || ['Aksi', 'Henshin'],
          synopsis: item.production.synopsis,
          cta: item.cta
        }));
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

  // 3. Query Catalog based on 02_API_SPECIFICATION GET /catalog
  useEffect(() => {
    let isMounted = true;
    async function fetchCatalogData() {
      setLoadingCatalog(true);

      const params = {
        franchise: selectedFranchise !== 'all' ? selectedFranchise.toLowerCase().replace(/\s+/g, '-') : undefined,
        q: searchQuery.trim() || undefined,
        sort: 'release_date',
        order: 'desc'
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
            rating: 8.9,
            quality: item.type === 'movie' ? '4K UHD' : '1440p 2K QHD',
            fansub: 'Sorot Sub Indo',
            posterUrl: item.poster_url,
            fallbackPoster: item.poster_url,
            badge: item.status === 'ongoing' ? 'EPISODE BARU' : 'BARU',
            sub: `${genreName} · ${item.release_year}`,
            rawProduction: item
          };
        });
        setCatalogItems(mapped);
        setCatalogMeta(res.meta);
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

  // Launch Player
  const handlePlayEpisodeFromProduction = (production, episode = null, watchOrderSlug = null) => {
    if (production?.id && String(production.id).startsWith('tmdb-')) {
      setPlayerEpisodeId(production.id);
    } else {
      setPlayerEpisodeId(episode?.id || '0192a3f0-2222-7000-8000-000000000001');
    }
    setPlayerWatchOrderSlug(watchOrderSlug);
  };

  // Continue Watching List (Derived from history or rich preset matching Sorot template)
  const continueWatchingItems = useMemo(() => {
    if (history.length > 0) {
      return history.slice(0, 6).map((h, i) => {
        const prod = h.production || {};
        const pcts = [62, 18, 74, 41, 91, 50];
        const pct = pcts[i % pcts.length];
        const v = SOROT_COLOR_MAP[prod.title] || [210 + i * 25, (i % 4)];
        return {
          id: h.episode?.id || prod.id || `hist-${i}`,
          title: prod.title || 'Serial Lanjutan',
          sub: `Ep ${h.episode?.episode_number || 1} · sisa ${Math.max(5, 45 - Math.round(pct * 0.4))} mnt`,
          pct: `${pct}%`,
          posterUrl: prod.backdrop_url || prod.poster_url,
          gradient: getPosterGradient(v[0], v[1]),
          production: prod,
          episodeId: h.episode?.id
        };
      });
    }

    // Default Sorot Continue Watching items
    return [
      { id: 'cw-1', title: 'Detak Kota Tua', sub: 'Ep 3 dari 8 · sisa 21 mnt', pct: '62%', gradient: getPosterGradient(40, 2), slug: 'detak-kota-tua' },
      { id: 'cw-2', title: 'Sang Penjaga Kabut', sub: 'S1 · E5 · sisa 38 mnt', pct: '18%', gradient: getPosterGradient(168, 0), slug: 'sang-penjaga-kabut' },
      { id: 'cw-3', title: 'Kopi dan Kompas', sub: 'S2 · E2 · sisa 12 mnt', pct: '74%', gradient: getPosterGradient(24, 1), slug: 'kopi-dan-kompas' },
      { id: 'cw-4', title: 'Garis Samudra', sub: 'Film · sisa 1j 07m', pct: '41%', gradient: getPosterGradient(200, 2), slug: 'garis-samudra' },
      { id: 'cw-5', title: 'Dua Musim Terakhir', sub: 'S1 · E7 · sisa 5 mnt', pct: '91%', gradient: getPosterGradient(8, 3), slug: 'dua-musim-terakhir' }
    ];
  }, [history]);

  // Top 10 Lineup
  const top10Items = useMemo(() => {
    const list = [
      'Lorong 17', 'Bayang Pulau', 'Tanah Seribu Api', 'Rumah di Ujung Hujan', 'Garis Samudra',
      'Sang Penjaga Kabut', 'Pasar Malam Terakhir', 'Kopi dan Kompas', 'Detak Kota Tua', 'Sepuluh Menit Lagi'
    ];
    return list.map((title, idx) => {
      const v = SOROT_COLOR_MAP[title] || [350, 0];
      // match with catalog item if exists
      const match = catalogItems.find(c => c.title.toLowerCase().includes(title.toLowerCase()));
      return {
        rank: idx + 1,
        title,
        gradient: getPosterGradient(v[0], v[1]),
        posterUrl: match?.posterUrl || null,
        production: match?.rawProduction || { title, slug: title.toLowerCase().replace(/\s+/g, '-') }
      };
    });
  }, [catalogItems]);

  // Fresh Releases
  const freshReleases = useMemo(() => {
    const defaultFresh = [
      { title: 'Rumah di Ujung Hujan', badge: 'BARU', sub: 'Drama · 2026', h: 236, k: 1 },
      { title: 'Kirana: Pemburu Bintang', badge: 'EPISODE BARU', sub: 'Anime · 2026', h: 262, k: 2 },
      { title: 'Sumur Tanpa Dasar', badge: 'BARU', sub: 'Horor · 2024', h: 270, k: 0 },
      { title: 'Hutan yang Bernyanyi', badge: 'BARU', sub: 'Dokumenter · 2025', h: 142, k: 2 },
      { title: 'Warung Nomor Dua', badge: 'EPISODE BARU', sub: 'Komedi · 2025', h: 46, k: 3 },
      { title: 'Kapal Baja 9', badge: 'BARU', sub: 'Aksi · 2026', h: 214, k: 1 },
      { title: 'Si Kecil dan Peta Ajaib', badge: 'BARU', sub: 'Keluarga · 2024', h: 172, k: 0 },
      { title: 'Naga Sungai Merah', badge: 'EPISODE BARU', sub: 'Anime · 2024', h: 356, k: 1 }
    ];

    return defaultFresh.map((item, idx) => {
      const match = catalogItems.find(c => c.title.toLowerCase().includes(item.title.toLowerCase()));
      return {
        id: `fresh-${idx}`,
        title: item.title,
        badge: item.badge,
        sub: item.sub,
        gradient: getPosterGradient(item.h, item.k),
        posterUrl: match?.posterUrl || null,
        production: match?.rawProduction || { title: item.title, slug: item.title.toLowerCase().replace(/\s+/g, '-') }
      };
    });
  }, [catalogItems]);

  // Genre Filters (Exact Sorot list + Tokusatsu universes)
  const genreList = useMemo(() => [
    'Semua', 'Aksi', 'Drama', 'Horor', 'Komedi', 'Dokumenter', 'Anime', 'Keluarga',
    'Kamen Rider', 'Super Sentai', 'Ultraman', 'Garo'
  ], []);

  // Filtered Catalog for "Jelajahi Katalog"
  const filteredCatalog = useMemo(() => {
    // 21 Canonical Sorot titles defined in template
    const templateCatalog = [
      { title: 'Garis Samudra', genre: 'Aksi', year: '2026', h: 200, k: 2 },
      { title: 'Sepuluh Menit Lagi', genre: 'Aksi', year: '2025', h: 355, k: 0 },
      { title: 'Kapal Baja 9', genre: 'Aksi', year: '2026', h: 214, k: 1 },
      { title: 'Rumah di Ujung Hujan', genre: 'Drama', year: '2026', h: 236, k: 1 },
      { title: 'Tanah Seribu Api', genre: 'Drama', year: '2025', h: 28, k: 0 },
      { title: 'Dua Musim Terakhir', genre: 'Drama', year: '2024', h: 8, k: 3 },
      { title: 'Lorong 17', genre: 'Horor', year: '2026', h: 352, k: 2 },
      { title: 'Sang Penjaga Kabut', genre: 'Horor', year: '2025', h: 168, k: 0 },
      { title: 'Sumur Tanpa Dasar', genre: 'Horor', year: '2024', h: 270, k: 0 },
      { title: 'Kopi dan Kompas', genre: 'Komedi', year: '2026', h: 24, k: 1 },
      { title: 'Warung Nomor Dua', genre: 'Komedi', year: '2025', h: 46, k: 3 },
      { title: 'Mertua Online', genre: 'Komedi', year: '2024', h: 316, k: 1 },
      { title: 'Detak Kota Tua', genre: 'Dokumenter', year: '2026', h: 40, k: 2 },
      { title: 'Hutan yang Bernyanyi', genre: 'Dokumenter', year: '2025', h: 142, k: 2 },
      { title: 'Dapur Nusantara', genre: 'Dokumenter', year: '2024', h: 18, k: 0 },
      { title: 'Kirana: Pemburu Bintang', genre: 'Anime', year: '2026', h: 262, k: 2 },
      { title: 'Bocah Seribu Layang', genre: 'Anime', year: '2025', h: 198, k: 3 },
      { title: 'Naga Sungai Merah', genre: 'Anime', year: '2024', h: 356, k: 1 },
      { title: 'Bayang Pulau', genre: 'Keluarga', year: '2026', h: 188, k: 3 },
      { title: 'Pasar Malam Terakhir', genre: 'Keluarga', year: '2025', h: 340, k: 3 },
      { title: 'Si Kecil dan Peta Ajaib', genre: 'Keluarga', year: '2024', h: 172, k: 0 }
    ];

    // Combine Sorot template catalog + Tokusatsu DB catalog
    let allItems = templateCatalog.map((t, idx) => {
      const match = catalogItems.find(c => c.title.toLowerCase().includes(t.title.toLowerCase()));
      return {
        id: `sorot-${idx}`,
        title: t.title,
        genre: t.genre,
        year: t.year,
        sub: `${t.genre} · ${t.year}`,
        gradient: getPosterGradient(t.h, t.k),
        posterUrl: match?.posterUrl || null,
        production: match?.rawProduction || {
          id: `sorot-${idx}`,
          title: t.title,
          slug: t.title.toLowerCase().replace(/\s+/g, '-'),
          total_episodes: 12,
          genres: [{ name: t.genre }]
        }
      };
    });

    // Add active Tokusatsu catalog productions as well
    catalogItems.forEach((c) => {
      if (!allItems.some(a => a.title.toLowerCase() === c.title.toLowerCase())) {
        const v = SOROT_COLOR_MAP[c.title] || [210, 0];
        allItems.push({
          id: c.id,
          title: c.title,
          genre: c.genre || c.franchise,
          franchise: c.franchise,
          year: c.year,
          sub: `${c.genre || c.franchise} · ${c.year}`,
          gradient: getPosterGradient(v[0], v[1]),
          posterUrl: c.posterUrl,
          production: c.rawProduction || c
        });
      }
    });

    // Filter by genre/franchise
    if (selectedGenre !== 'Semua') {
      const gLower = selectedGenre.toLowerCase();
      allItems = allItems.filter(item => {
        const itemGenre = (item.genre || '').toLowerCase();
        const itemFranchise = (item.franchise || '').toLowerCase();
        const itemTitle = item.title.toLowerCase();
        return itemGenre.includes(gLower) || itemFranchise.includes(gLower) || itemTitle.includes(gLower);
      });
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      allItems = allItems.filter(item => 
        item.title.toLowerCase().includes(q) || 
        (item.genre && item.genre.toLowerCase().includes(q))
      );
    }

    return allItems;
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

      {/* 2. Hero Section (Sorot Spotlight + 3D Tilted Poster + "Sorotan Hari Ini" Switcher) */}
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
              {filteredCatalog.length} Ditemukan
            </span>
          </div>
        </div>
      )}

      {/* 3. Section: Lanjutkan Menonton (Horizontal Scroller with Watch Progress Bars) */}
      {!searchQuery && continueWatchingItems.length > 0 && (
        <section id="lanjut" aria-label="Lanjutkan Menonton" style={{ padding: '36px clamp(16px, 4vw, 56px) 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', marginBottom: '8px' }}>
            <h2 className="disp" style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '24px', fontWeight: 700, letterSpacing: '-.01em' }}>
              <span aria-hidden="true" style={{ width: '4px', height: '22px', borderRadius: '2px', background: '#E50914' }} />
              Lanjutkan Menonton
            </h2>
            <a href="#jelajah" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '14px', fontWeight: 700, color: '#B8B8BC' }}>
              Lihat semua
              <ChevronRight size={16} />
            </a>
          </div>

          <div className="scroller">
            {continueWatchingItems.map((c) => (
              <button 
                key={c.id} 
                type="button" 
                className="card" 
                style={{ width: '320px', flex: '0 0 auto' }}
                onClick={() => {
                  if (c.production) {
                    handlePlayEpisodeFromProduction(c.production, c.episodeId ? { id: c.episodeId } : null);
                  } else {
                    setDetailModalSlug(c.slug || 'lorong-17');
                  }
                }}
              >
                <div className="poster" style={{ width: '320px', height: '180px', background: c.posterUrl ? `url(${c.posterUrl}) center/cover no-repeat` : c.gradient }}>
                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'linear-gradient(0deg, rgba(0,0,0,.82), rgba(0,0,0,0) 62%)' }} />
                  <div className="disp" style={{ position: 'absolute', left: '16px', right: '16px', bottom: '18px', fontSize: '22px', fontWeight: 800, lineHeight: 1.1, letterSpacing: '-.015em' }}>
                    {c.title}
                  </div>
                  {/* Red progress bar */}
                  <div aria-hidden="true" style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: '5px', background: 'rgba(255,255,255,.28)' }}>
                    <div style={{ height: '100%', background: '#E50914', width: c.pct }} />
                  </div>
                  <div className="ov">
                    <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '54px', height: '54px', borderRadius: '50%', border: '2px solid #fff', background: 'rgba(0,0,0,.4)' }}>
                      <Play size={24} fill="#fff" />
                    </span>
                  </div>
                </div>
                <div style={{ fontSize: '14px', color: '#9A9AA0', marginTop: '10px' }}>{c.sub}</div>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* 4. Section: Top 10 Minggu Ini di Indonesia (Giant Gradient Numerals 1..10) */}
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
                  if (t.production?.slug) {
                    setDetailModalSlug(t.production.slug);
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
                    background: t.posterUrl ? `url(${t.posterUrl}) center/cover no-repeat` : t.gradient
                  }}
                >
                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'linear-gradient(0deg, rgba(0,0,0,.82), rgba(0,0,0,0) 58%)' }} />
                  <div className="disp" style={{ position: 'absolute', left: '12px', right: '12px', bottom: '12px', fontSize: '18px', fontWeight: 800, lineHeight: 1.05, letterSpacing: '-.01em' }}>
                    {t.title}
                  </div>
                  <div className="ov">
                    <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '46px', height: '46px', borderRadius: '50%', border: '2px solid #fff', background: 'rgba(0,0,0,.4)' }}>
                      <Play size={20} fill="#fff" />
                    </span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* 5. Section: Baru Rilis (Badge Cards) */}
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
                  if (p.production?.slug) {
                    setDetailModalSlug(p.production.slug);
                  } else {
                    handlePlayEpisodeFromProduction(p.production);
                  }
                }}
              >
                <div className="poster" style={{ width: '188px', height: '282px', background: p.posterUrl ? `url(${p.posterUrl}) center/cover no-repeat` : p.gradient }}>
                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'linear-gradient(0deg, rgba(0,0,0,.82), rgba(0,0,0,0) 58%)' }} />
                  <span style={{ position: 'absolute', top: '10px', left: '10px', padding: '4px 8px', borderRadius: '4px', background: p.badge === 'EPISODE BARU' ? '#F6121D' : '#E50914', color: '#fff', fontSize: '11px', fontWeight: 800, letterSpacing: '.06em' }}>
                    {p.badge}
                  </span>
                  <div className="disp" style={{ position: 'absolute', left: '14px', right: '14px', bottom: '14px', fontSize: '20px', fontWeight: 800, lineHeight: 1.05, letterSpacing: '-.01em' }}>
                    {p.title}
                  </div>
                  <div className="ov">
                    <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '50px', height: '50px', borderRadius: '50%', border: '2px solid #fff', background: 'rgba(0,0,0,.4)' }}>
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

      {/* 6. Section: Fitur Sorot ("Satu layar, banyak cara menonton") */}
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
                <span style={{ fontSize: '13px', color: '#E2E2E5', fontWeight: 500 }}>3 teman sedang menonton bareng</span>
              </div>

              <div style={{ position: 'absolute', top: '50%', left: '50%', width: '76px', height: '76px', margin: '-48px 0 0 -38px', borderRadius: '50%', border: '2px solid #fff', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,.45)' }}>
                <Play size={32} fill="#fff" />
              </div>

              <div style={{ position: 'absolute', right: '20px', top: '74px', padding: '10px 14px', borderRadius: '14px 14px 4px 14px', background: 'rgba(255,255,255,.14)', fontSize: '14px', backdropFilter: 'blur(8px)' }}>
                Tunggu, siapa dia?
              </div>
              <div style={{ position: 'absolute', left: '20px', bottom: '64px', padding: '10px 14px', borderRadius: '14px 14px 14px 4px', background: '#E50914', fontSize: '14px', fontWeight: 600 }}>
                Plot twist-nya gila! 🔥
              </div>
              <div style={{ position: 'absolute', left: '20px', right: '20px', bottom: '24px', height: '5px', borderRadius: '3px', background: 'rgba(255,255,255,.25)' }}>
                <div style={{ width: '46%', height: '100%', borderRadius: '3px', background: '#E50914' }} />
              </div>
            </div>

            {/* Feature Description List */}
            <div style={{ flex: '1 1 380px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '12px', fontWeight: 700, letterSpacing: '.14em', textTransform: 'uppercase', color: '#E8E8EA' }}>
                <span aria-hidden="true" style={{ width: '4px', height: '18px', borderRadius: '2px', background: '#E50914' }} />
                Fitur Sorot
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
                      Putar serempak dengan teman dan ngobrol langsung di samping layar, walau beda kota.
                    </p>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '16px' }}>
                  <span style={{ flex: '0 0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(229,9,20,.16)', color: '#FF4B55' }}>
                    <Download size={24} />
                  </span>
                  <div>
                    <h3 className="disp" style={{ fontSize: '19px', fontWeight: 700, marginBottom: '4px' }}>Unduh, lalu tonton offline</h3>
                    <p style={{ fontSize: '15px', lineHeight: 1.55, color: '#B8B8BC' }}>
                      Simpan episode favorit dan lanjutkan di perjalanan tanpa khawatir sinyal.
                    </p>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '16px' }}>
                  <span style={{ flex: '0 0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(229,9,20,.16)', color: '#FF4B55' }}>
                    <Shield size={24} />
                  </span>
                  <div>
                    <h3 className="disp" style={{ fontSize: '19px', fontWeight: 700, marginBottom: '4px' }}>Profil untuk seluruh keluarga</h3>
                    <p style={{ fontSize: '15px', lineHeight: 1.55, color: '#B8B8BC' }}>
                      Rekomendasi dan daftar tonton terpisah untuk tiap anggota, termasuk mode khusus anak.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 7. Section: Jelajahi Katalog (Genre Filter Pills + Responsive Card Grid) */}
      <section id="jelajah" aria-label="Jelajahi Katalog" style={{ padding: '72px clamp(16px, 4vw, 56px) 0' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: '16px', marginBottom: '18px' }}>
          <h2 className="disp" style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '24px', fontWeight: 700, letterSpacing: '-.01em' }}>
            <span aria-hidden="true" style={{ width: '4px', height: '22px', borderRadius: '2px', background: '#E50914' }} />
            Jelajahi Katalog
          </h2>
          <span style={{ fontSize: '14px', color: '#9A9AA0' }}>
            {filteredCatalog.length} judul
          </span>
        </div>

        {/* Filter Pills */}
        <div role="group" aria-label="Filter genre" style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '26px' }}>
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

        {/* Responsive Grid */}
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
                <div className="poster" style={{ width: '100%', aspectRatio: '2/3', background: item.posterUrl ? `url(${item.posterUrl}) center/cover no-repeat` : item.gradient }}>
                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'linear-gradient(0deg, rgba(0,0,0,.82), rgba(0,0,0,0) 58%)' }} />
                  <div className="disp" style={{ position: 'absolute', left: '14px', right: '14px', bottom: '14px', fontSize: '20px', fontWeight: 800, lineHeight: 1.05, letterSpacing: '-.01em' }}>
                    {item.title}
                  </div>
                  <div className="ov">
                    <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '50px', height: '50px', borderRadius: '50%', border: '2px solid #fff', background: 'rgba(0,0,0,.4)' }}>
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
            <p style={{ fontSize: '14px' }}>Coba pilih genre lain atau ubah kata kunci pencarian.</p>
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

      {/* 8. Section: Siap nonton malam ini? (Email CTA banner) */}
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
          Masukkan email untuk membuat akun baru atau melanjutkan tontonanmu di perangkat mana pun.
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
          onClose={() => setPlayerEpisodeId(null)}
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
            seriesTitle: h.production?.title || 'Sorot Series',
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
