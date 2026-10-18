import React, { useState, useEffect } from 'react';
import { 
  X, 
  Terminal, 
  Play, 
  CheckCircle, 
  Copy, 
  Database, 
  Globe, 
  RefreshCw, 
  Zap,
  ShieldCheck,
  Trash2,
  Clock,
  HardDrive,
  UserCheck,
  UserX,
  AlertCircle,
  Activity
} from 'lucide-react';
import { 
  getMetaFilters, 
  getHomeHero, 
  getHomeLatestEpisodes, 
  getHomePopular, 
  getCatalog, 
  searchProductions, 
  getProductionBySlug, 
  getWatchOrderBySlug, 
  getStreamPayload, 
  getUserHistory, 
  getUserBookmarks, 
  getScrapedReleases, 
  getScraperStatus, 
  getApiBaseUrl, 
  setApiBaseUrl, 
  clearClientCache,
  CACHE_CATEGORIES,
  getCacheStats,
  cleanupExpiredCache,
  cleanupSessionCache,
  clearUserPrivateCache,
  enforceCacheLimits,
  initializeCacheManager,
  setTimeOffsetForTesting,
  resetTimeOffsetForTesting,
  getCurrentTime,
  getAuthSession,
  loginUser,
  logoutUser,
  setCacheItem
} from '../services/apiService';

export default function ApiExplorerModal({ onClose }) {
  const [activeTab, setActiveTab] = useState('cache'); // 'cache' | 'api'
  const [selectedRoute, setSelectedRoute] = useState('/api/v1/meta/filters');
  const [responseJson, setResponseJson] = useState(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [execMeta, setExecMeta] = useState(null);
  
  // Custom API Base URL state
  const [baseUrlInput, setBaseUrlInput] = useState(getApiBaseUrl());
  const [baseUrlSaved, setBaseUrlSaved] = useState(false);

  // Smart Cache Dashboard State
  const [cacheStats, setCacheStats] = useState(getCacheStats());
  const [authSession, setAuthSession] = useState(getAuthSession());
  const [simulatedHours, setSimulatedHours] = useState(0);
  const [operationLogs, setOperationLogs] = useState([
    `[${new Date().toLocaleTimeString()}] Smart Cache Manager siap dipantau.`
  ]);

  const addLog = (msg) => {
    setOperationLogs((prev) => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev.slice(0, 15)]);
  };

  const refreshCacheData = () => {
    const session = getAuthSession();
    setAuthSession(session);
    setCacheStats(getCacheStats(session.user?.id));
  };

  useEffect(() => {
    refreshCacheData();
  }, []);

  const routes = [
    { label: '1. GET /api/v1/meta/filters', route: '/api/v1/meta/filters', fn: () => getMetaFilters() },
    { label: '2. GET /api/v1/home/hero?limit=3', route: '/api/v1/home/hero?limit=3', fn: () => getHomeHero({ limit: 3 }) },
    { label: '3. GET /api/v1/home/latest-episodes', route: '/api/v1/home/latest-episodes', fn: () => getHomeLatestEpisodes({ page: 1, per_page: 6 }) },
    { label: '4. GET /api/v1/home/popular?group_by=franchise', route: '/api/v1/home/popular?group_by=franchise', fn: () => getHomePopular({ group_by: 'franchise', limit: 4 }) },
    { label: '5. GET /api/v1/catalog?franchise=kamen-rider&era=reiwa', route: '/api/v1/catalog?franchise=kamen-rider&era=reiwa', fn: () => getCatalog({ franchise: 'kamen-rider', era: 'reiwa' }) },
    { label: '6. GET /api/v1/productions/search?q=gavv', route: '/api/v1/productions/search?q=gavv', fn: () => searchProductions({ q: 'gavv', limit: 5 }) },
    { label: '7. GET /api/v1/productions/kamen-rider-geats', route: '/api/v1/productions/kamen-rider-geats', fn: () => getProductionBySlug('kamen-rider-geats') },
    { label: '8. GET /api/v1/watch-orders/kamen-rider-geats-chronological', route: '/api/v1/watch-orders/kamen-rider-geats-chronological', fn: () => getWatchOrderBySlug('kamen-rider-geats-chronological') },
    { label: '9. GET /api/v1/stream/0192a3f0-2222-7000-8000-000000000001', route: '/api/v1/stream/0192a3f0-2222-7000-8000-000000000001', fn: () => getStreamPayload('0192a3f0-2222-7000-8000-000000000001') },
    { label: '10. GET /api/v1/scraper/releases', route: '/api/v1/scraper/releases', fn: () => getScrapedReleases() },
    { label: '11. GET /api/v1/scraper/status', route: '/api/v1/scraper/status', fn: () => getScraperStatus() },
    { label: '12. GET /api/v1/user/history', route: '/api/v1/user/history', fn: () => getUserHistory() },
    { label: '13. GET /api/v1/user/bookmarks', route: '/api/v1/user/bookmarks', fn: () => getUserBookmarks() }
  ];

  const handleSaveBaseUrl = (e) => {
    e.preventDefault();
    setApiBaseUrl(baseUrlInput);
    setBaseUrlSaved(true);
    setTimeout(() => setBaseUrlSaved(false), 2500);
    refreshCacheData();
  };

  const handleExecute = async (routeObj) => {
    setSelectedRoute(routeObj.route);
    setLoading(true);
    setCopied(false);
    const startTime = performance.now();

    try {
      const res = await routeObj.fn();
      const endTime = performance.now();
      const latencyMs = Math.round(endTime - startTime);

      let source = 'Local Canonical Engine (Offline/Fallback)';
      if (res?._networkDirect) {
        source = `Browser Client Fetch (HTTP ${res._status || 200})`;
      } else if (res?._fromCache) {
        source = `Smart Cache [${res._cacheCategory || 'cache'}] via ${res._cacheTier || 'memory'} (${res._cacheAgeMs || 0}ms ago)`;
      }

      setExecMeta({
        latencyMs,
        source,
        origin: window.location.origin,
        targetUrl: baseUrlInput ? `${baseUrlInput}${routeObj.route.replace('/api/v1', '')}` : 'In-Memory DB'
      });

      setResponseJson(res);
      refreshCacheData();
    } catch (err) {
      const endTime = performance.now();
      setExecMeta({
        latencyMs: Math.round(endTime - startTime),
        source: 'Error',
        isCorsError: err.isCorsError,
        corsDiagnostic: err.corsDiagnostic
      });
      setResponseJson({
        error: {
          message: err.message,
          isCorsError: Boolean(err.isCorsError),
          diagnostic: err.corsDiagnostic || null
        }
      });
    }
    setLoading(false);
  };

  const handleCopy = () => {
    if (!responseJson) return;
    navigator.clipboard.writeText(JSON.stringify(responseJson, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  /* ==========================================================================
     SMART CACHE CONTROLS
     ========================================================================== */

  const handleRunCleanupExpired = () => {
    const cleaned = cleanupExpiredCache();
    addLog(`cleanupExpiredCache() berhasil dijalankan: ${cleaned} item kedaluwarsa dibersihkan.`);
    refreshCacheData();
  };

  const handleRunCleanupSession = () => {
    const cleaned = cleanupSessionCache();
    addLog(`cleanupSessionCache() berhasil dijalankan: ${cleaned} item sesi dihapus.`);
    refreshCacheData();
  };

  const handleRunClearPrivate = () => {
    const userId = authSession.user?.id;
    const cleaned = clearUserPrivateCache(userId);
    addLog(`clearUserPrivateCache(${userId || 'aktif'}) berhasil dijalankan: ${cleaned} data privat dihapus.`);
    refreshCacheData();
  };

  const handleEnforceQuotaLimits = () => {
    const evicted = enforceCacheLimits(true);
    addLog(`enforceCacheLimits(aggressive=true) berhasil dijalankan: ${evicted} item terlama di-evict (LRU).`);
    refreshCacheData();
  };

  const handleSimulateFastForwardClock = () => {
    const offset = 49 * 60 * 60 * 1000; // 49 Jam ke depan
    setTimeOffsetForTesting(offset);
    setSimulatedHours(49);
    addLog(`⏱️ Jam dimanipulasi: +49 Jam ke depan. Memeriksa aturan 48-Hour TTL...`);
    // Jalankan pemeriksaan lifecycle seperti saat browser dibuka kembali
    initializeCacheManager({ activeUserId: authSession.user?.id, force: true });
    refreshCacheData();
  };

  const handleResetClock = () => {
    resetTimeOffsetForTesting();
    setSimulatedHours(0);
    addLog(`🔄 Jam dikembalikan ke waktu normal sistem saat ini.`);
    refreshCacheData();
  };

  const handleSimulateLogin = async (userChoice = 'kotaro') => {
    const profile = userChoice === 'kotaro'
      ? { id: 'usr_kotaro_01', name: 'Kotaro Minami (Black Sun)', email: 'kotaro@tokuflix.id' }
      : { id: 'usr_ace_02', name: 'Ace Ukiyo (Geats IX)', email: 'ace@tokuflix.id' };

    await loginUser(profile);
    // Simpan dummy private cache untuk menguji isolasi
    setCacheItem(
      `https://api.tokuflix.id/user/profile`,
      { status: 'vip', name: profile.name, signed_token: 'tok_jwt_secure_123' },
      CACHE_CATEGORIES.PRIVATE,
      { userId: profile.id }
    );
    setCacheItem(
      `https://api.tokuflix.id/session/temp_token`,
      { temp_nonce: Math.random().toString(36) },
      CACHE_CATEGORIES.SESSION
    );

    addLog(`👤 Login sebagai ${profile.name}. Private cache & session cache terbuat.`);
    refreshCacheData();
  };

  const handleSimulateLogout = async () => {
    const res = await logoutUser();
    addLog(`🚪 Logout Berhasil: Private cache & Session cache dibersihkan. Request in-flight dibatalkan. Bookmark & History aman tersimpan!`);
    refreshCacheData();
  };

  const formatBytes = (bytes) => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatLastActive = (ts) => {
    if (!ts) return 'Belum tercatat';
    const d = new Date(ts);
    return `${d.toLocaleDateString()} ${d.toLocaleTimeString()}`;
  };

  const currentBase = getApiBaseUrl();

  return (
    <div className="api-explorer-backdrop" onClick={onClose}>
      <div className="api-explorer-card glass-panel" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="explorer-header">
          <div className="title-box">
            <Database size={22} color="var(--accent-cyan)" />
            <div>
              <h3 className="modal-title">Smart Cache & Client-Side API Hub</h3>
              <span className="modal-sub">Multi-Tier Smart Caching • 48h Inactivity TTL • Safe Logout Cleanup</span>
            </div>
          </div>

          {/* Tab Switcher */}
          <div className="tab-switcher">
            <button 
              id="tab-btn-cache"
              className={`tab-btn ${activeTab === 'cache' ? 'active' : ''}`}
              onClick={() => setActiveTab('cache')}
            >
              <Zap size={14} />
              <span>Smart Cache Manager</span>
            </button>
            <button 
              id="tab-btn-api"
              className={`tab-btn ${activeTab === 'api' ? 'active' : ''}`}
              onClick={() => setActiveTab('api')}
            >
              <Terminal size={14} />
              <span>Direct Browser API Tester</span>
            </button>
          </div>

          <button className="close-btn" onClick={onClose} aria-label="Tutup Modal">
            <X size={20} />
          </button>
        </div>

        {/* ====================================================================
            TAB 1: SMART CACHE MANAGEMENT & INSPECTOR
            ==================================================================== */}
        {activeTab === 'cache' && (
          <div className="cache-dashboard-container">
            {/* Top Stat Cards */}
            <div className="cache-stats-grid">
              <div className="cache-stat-card">
                <div className="card-icon-box cyan">
                  <HardDrive size={18} />
                </div>
                <div className="card-content">
                  <span className="card-label">TOTAL PENGGUNAAN STORAGE</span>
                  <div className="card-value-row">
                    <span className="card-value">{formatBytes(cacheStats.totalSizeBytes)}</span>
                    <span className="card-badge">{cacheStats.totalEntries} Entri</span>
                  </div>
                  <span className="card-note">Tersimpan di Browser LocalStorage L2</span>
                </div>
              </div>

              <div className="cache-stat-card">
                <div className="card-icon-box gold">
                  <Activity size={18} />
                </div>
                <div className="card-content">
                  <span className="card-label">TIER 1 (MEMORY CACHE)</span>
                  <div className="card-value-row">
                    <span className="card-value">{cacheStats.memoryEntries} Item</span>
                    <span className="card-badge gold">RAM Instan</span>
                  </div>
                  <span className="card-note">In-Memory Map untuk akses 0ms</span>
                </div>
              </div>

              <div className="cache-stat-card">
                <div className="card-icon-box red">
                  <Clock size={18} />
                </div>
                <div className="card-content">
                  <span className="card-label">STATUS TTL 48 JAM</span>
                  <div className="card-value-row">
                    <span className={`card-value ${cacheStats.is48HoursInactive ? 'danger' : 'safe'}`}>
                      {cacheStats.is48HoursInactive ? 'KEDALUWARSA (>48h)' : 'VALID & AKTIF'}
                    </span>
                    {simulatedHours > 0 && <span className="card-badge red">+{simulatedHours}h Fast-Fwd</span>}
                  </div>
                  <span className="card-note">Aktif: {formatLastActive(cacheStats.lastActive)}</span>
                </div>
              </div>

              <div className="cache-stat-card">
                <div className="card-icon-box purple">
                  {authSession.isAuthenticated ? <UserCheck size={18} /> : <UserX size={18} />}
                </div>
                <div className="card-content">
                  <span className="card-label">AKUN PENGGUNA AKTIF</span>
                  <div className="card-value-row">
                    <span className="card-value">{authSession.user?.name || 'Tamu (Guest)'}</span>
                  </div>
                  <span className="card-note">
                    {authSession.user ? `ID: ${authSession.user.id}` : 'Belum login (anonim)'}
                  </span>
                </div>
              </div>
            </div>

            {/* Split Section: Table & Controls */}
            <div className="cache-details-split">
              {/* Left Column: Categories Table */}
              <div className="categories-table-card">
                <div className="panel-title-row">
                  <ShieldCheck size={16} color="var(--accent-cyan)" />
                  <h4>Pengelompokan Cache & Kebijakan Pembersihan</h4>
                </div>
                <div className="table-responsive">
                  <table className="cache-table">
                    <thead>
                      <tr>
                        <th>Kategori</th>
                        <th>Peruntukan</th>
                        <th>TTL</th>
                        <th>Entri</th>
                        <th>Ukuran</th>
                        <th>Saat Logout</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td><span className="badge-cat public">public-cache</span></td>
                        <td>Katalog serial, film, metadata, genre, filter</td>
                        <td>24 Jam</td>
                        <td>{cacheStats.categories[CACHE_CATEGORIES.PUBLIC]?.count || 0}</td>
                        <td>{formatBytes(cacheStats.categories[CACHE_CATEGORIES.PUBLIC]?.sizeBytes)}</td>
                        <td><span className="policy-badge keep">Dipertahankan</span></td>
                      </tr>
                      <tr>
                        <td><span className="badge-cat session">session-cache</span></td>
                        <td>State sementara sesi aktif, temporary nonce</td>
                        <td>2 Jam</td>
                        <td>{cacheStats.categories[CACHE_CATEGORIES.SESSION]?.count || 0}</td>
                        <td>{formatBytes(cacheStats.categories[CACHE_CATEGORIES.SESSION]?.sizeBytes)}</td>
                        <td><span className="policy-badge purge">Dibersihkan</span></td>
                      </tr>
                      <tr>
                        <td><span className="badge-cat private">private-cache</span></td>
                        <td>Metadata privat akun, signed stream token</td>
                        <td>48 Jam (TTL)</td>
                        <td>{cacheStats.categories[CACHE_CATEGORIES.PRIVATE]?.count || 0}</td>
                        <td>{formatBytes(cacheStats.categories[CACHE_CATEGORIES.PRIVATE]?.sizeBytes)}</td>
                        <td><span className="policy-badge purge">Dibersihkan</span></td>
                      </tr>
                      <tr>
                        <td><span className="badge-cat static">static-cache</span></td>
                        <td>Konfigurasi aplikasi frontend dan schema</td>
                        <td>7 Hari</td>
                        <td>{cacheStats.categories[CACHE_CATEGORIES.STATIC]?.count || 0}</td>
                        <td>{formatBytes(cacheStats.categories[CACHE_CATEGORIES.STATIC]?.sizeBytes)}</td>
                        <td><span className="policy-badge keep">Dipertahankan</span></td>
                      </tr>
                      <tr className="protected-row">
                        <td><span className="badge-cat protected">Data Permanen</span></td>
                        <td>Riwayat tontonan (History) & Favorit (Bookmarks)</td>
                        <td>Permanen</td>
                        <td>Server-Synced</td>
                        <td>LocalStorage</td>
                        <td><span className="policy-badge permanent">Dilindungi Penuh</span></td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Live Console Output */}
                <div className="live-log-box">
                  <div className="log-header">
                    <Terminal size={14} color="var(--accent-gold)" />
                    <span>Live Audit Log Operasi Cache:</span>
                  </div>
                  <div className="log-messages">
                    {operationLogs.map((log, idx) => (
                      <div key={idx} className="log-line">{log}</div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Column: Interactive Action Trigger Panel */}
              <div className="cache-actions-panel">
                <div className="panel-title-row">
                  <Zap size={16} color="var(--accent-red)" />
                  <h4>Simulasi & Pengujian Otomatis</h4>
                </div>

                <div className="action-button-group">
                  <div className="btn-group-label">Pembersihan Sesuai Aturan:</div>
                  <button className="btn-action-trigger" onClick={handleRunCleanupExpired}>
                    <RefreshCw size={15} />
                    <div>
                      <strong>cleanupExpiredCache()</strong>
                      <span>Hapus item yang melewati batas masa berlaku TTL</span>
                    </div>
                  </button>

                  <button className="btn-action-trigger" onClick={handleRunCleanupSession}>
                    <Trash2 size={15} />
                    <div>
                      <strong>cleanupSessionCache()</strong>
                      <span>Bersihkan data sementara session-cache</span>
                    </div>
                  </button>

                  <button className="btn-action-trigger" onClick={handleRunClearPrivate}>
                    <UserX size={15} />
                    <div>
                      <strong>clearUserPrivateCache()</strong>
                      <span>Hapus cache privat akun aktif tanpa menyentuh public</span>
                    </div>
                  </button>

                  <button className="btn-action-trigger" onClick={handleEnforceQuotaLimits}>
                    <HardDrive size={15} />
                    <div>
                      <strong>enforceCacheLimits()</strong>
                      <span>Simulasi kuota penuh: jalankan LRU capacity eviction</span>
                    </div>
                  </button>
                </div>

                <div className="action-button-group">
                  <div className="btn-group-label">Uji Inaktivitas 48 Jam (Fake Clock):</div>
                  <div className="split-two-btns">
                    <button className="btn-clock-action ff" onClick={handleSimulateFastForwardClock}>
                      <Clock size={15} />
                      <span>+49 Jam (Uji 48h TTL)</span>
                    </button>
                    <button className="btn-clock-action reset" onClick={handleResetClock}>
                      <RefreshCw size={15} />
                      <span>Reset Jam Normal</span>
                    </button>
                  </div>
                </div>

                <div className="action-button-group">
                  <div className="btn-group-label">Uji Skenario Akun & Logout:</div>
                  <div className="split-two-btns">
                    <button className="btn-account-action login" onClick={() => handleSimulateLogin('kotaro')}>
                      <UserCheck size={15} />
                      <span>Login Kotaro</span>
                    </button>
                    <button className="btn-account-action login" onClick={() => handleSimulateLogin('ace')}>
                      <UserCheck size={15} />
                      <span>Login Ace</span>
                    </button>
                  </div>
                  <button className="btn-account-action logout" onClick={handleSimulateLogout}>
                    <UserX size={15} />
                    <span>Simulasi Logout & Bersihkan Sesi</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ====================================================================
            TAB 2: DIRECT BROWSER API TESTER (EXISTING ROUTE EXPLORER)
            ==================================================================== */}
        {activeTab === 'api' && (
          <div className="api-tester-container">
            {/* Client-Side Endpoint Configuration Bar */}
            <div className="explorer-config-bar">
              <form className="config-form" onSubmit={handleSaveBaseUrl}>
                <div className="config-input-group">
                  <Globe size={16} color="var(--accent-cyan)" />
                  <label htmlFor="api-base-input" className="config-label">API Streaming Base URL:</label>
                  <input
                    id="api-base-input"
                    type="text"
                    placeholder="Contoh: http://localhost:3000/api/v1 atau kosongkan untuk in-memory"
                    value={baseUrlInput}
                    onChange={(e) => setBaseUrlInput(e.target.value)}
                    className="config-text-input"
                  />
                </div>
                <div className="config-btn-group">
                  <button type="submit" className="btn-save-endpoint">
                    {baseUrlSaved ? <CheckCircle size={14} color="#10b981" /> : <Zap size={14} />}
                    <span>{baseUrlSaved ? 'Tersimpan!' : 'Simpan Endpoint'}</span>
                  </button>
                  <button type="button" className="btn-clear-cache" onClick={clearClientCache} title="Bersihkan cache client-side">
                    <RefreshCw size={14} />
                    <span>Reset Cache</span>
                  </button>
                </div>
              </form>

              <div className="active-mode-indicator">
                <span className="mode-dot" style={{ background: currentBase ? '#10b981' : '#f59e0b' }} />
                <span className="mode-text">
                  Mode: <strong>{currentBase ? `Direct Browser Request ke ${currentBase}` : 'In-Memory Local Engine (Client Fallback)'}</strong>
                </span>
              </div>
            </div>

            {/* Content Body */}
            <div className="explorer-grid">
              {/* Left: Endpoint List */}
              <div className="endpoint-sidebar">
                <span className="sidebar-heading">Pilih Endpoint untuk Diuji:</span>
                <div className="routes-list">
                  {routes.map((item, idx) => (
                    <button
                      key={idx}
                      className={`route-btn ${selectedRoute === item.route ? 'active' : ''}`}
                      onClick={() => handleExecute(item)}
                    >
                      <span className="method-tag">GET</span>
                      <span className="route-text">{item.route}</span>
                    </button>
                  ))}
                </div>
                
                <div className="db-stats-box">
                  <Database size={15} color="var(--accent-gold)" />
                  <span className="db-stats-text">
                    Arsitektur: Perangkat Pengguna → Direct Request ke Streaming API (Client Smart Caching)
                  </span>
                </div>
              </div>

              {/* Right: Response Inspector */}
              <div className="response-panel">
                <div className="response-bar">
                  <div className="response-meta-chips">
                    <span className="bar-label">HTTP Response Payload:</span>
                    {execMeta && (
                      <>
                        <span className="meta-chip latency">⚡ {execMeta.latencyMs} ms</span>
                        <span className="meta-chip source">📡 {execMeta.source}</span>
                      </>
                    )}
                  </div>
                  {responseJson && (
                    <button className="copy-btn" onClick={handleCopy}>
                      {copied ? <CheckCircle size={14} color="#10b981" /> : <Copy size={14} />}
                      <span>{copied ? 'Tersalin' : 'Salin JSON'}</span>
                    </button>
                  )}
                </div>

                <div className="json-container">
                  {loading ? (
                    <div className="loading-state">
                      <div className="spinner" />
                      <span>Melakukan client-side fetch langsung dari browser...</span>
                    </div>
                  ) : responseJson ? (
                    execMeta?.isCorsError ? (
                      <div className="cors-error-box">
                        <div className="cors-error-title">
                          <AlertCircle size={20} color="#ff204e" />
                          <h4>CORS / Network Error Terdeteksi di Browser</h4>
                        </div>
                        <p className="cors-desc">
                          Browser Anda memblokir request langsung ke URL target karena server tujuan tidak mengizinkan origin <code>{execMeta.origin}</code> atau tidak menyertakan header <code>Access-Control-Allow-Origin</code>.
                        </p>
                        <div className="cors-code-preview">
                          <pre>{JSON.stringify(responseJson, null, 2)}</pre>
                        </div>
                      </div>
                    ) : (
                      <pre className="json-code">
                        {JSON.stringify(responseJson, null, 2)}
                      </pre>
                    )
                  ) : (
                    <div className="empty-state">
                      <Play size={40} className="empty-icon" />
                      <h4>Siap Menguji Client-Side Fetch Langsung</h4>
                      <p>Klik salah satu endpoint di sebelah kiri untuk melihat request langsung dari browser beserta payload JSON.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <style>{`
        .api-explorer-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(3, 5, 8, 0.9);
          backdrop-filter: blur(14px);
          z-index: 1200;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
        }
        .api-explorer-card {
          background: #090d16;
          border: 1px solid var(--border-light);
          border-radius: var(--radius-lg);
          width: 100%;
          max-width: 1200px;
          height: 88vh;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          box-shadow: 0 25px 60px rgba(0, 0, 0, 0.8), 0 0 40px rgba(0, 242, 254, 0.15);
        }
        .explorer-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 14px 22px;
          background: rgba(16, 23, 38, 0.95);
          border-bottom: 1px solid var(--border-subtle);
          gap: 16px;
          flex-wrap: wrap;
        }
        .title-box {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .modal-title {
          font-size: 1.15rem;
          color: #ffffff;
          margin-bottom: 2px;
        }
        .modal-sub {
          font-size: 0.75rem;
          color: var(--text-muted);
        }
        .tab-switcher {
          display: flex;
          gap: 8px;
          background: rgba(255, 255, 255, 0.05);
          padding: 4px;
          border-radius: var(--radius-full);
          border: 1px solid var(--border-subtle);
        }
        .tab-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 6px 14px;
          border-radius: var(--radius-full);
          font-size: 0.8rem;
          font-weight: 700;
          color: var(--text-secondary);
          background: transparent;
          border: none;
          cursor: pointer;
          transition: all var(--transition-fast);
        }
        .tab-btn:hover {
          color: #ffffff;
        }
        .tab-btn.active {
          background: linear-gradient(135deg, rgba(0, 242, 254, 0.25) 0%, rgba(255, 32, 78, 0.25) 100%);
          color: #ffffff;
          border: 1px solid var(--accent-cyan);
        }
        .close-btn {
          color: var(--text-muted);
          width: 32px;
          height: 32px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          background: transparent;
          border: none;
          cursor: pointer;
        }
        .close-btn:hover {
          color: #ffffff;
          background: rgba(255, 255, 255, 0.1);
        }

        /* SMART CACHE DASHBOARD */
        .cache-dashboard-container {
          flex: 1;
          display: flex;
          flex-direction: column;
          overflow-y: auto;
          padding: 20px 24px;
          gap: 20px;
        }
        .cache-stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
          gap: 16px;
        }
        .cache-stat-card {
          background: rgba(16, 23, 38, 0.7);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-md);
          padding: 14px 18px;
          display: flex;
          align-items: flex-start;
          gap: 14px;
        }
        .card-icon-box {
          width: 38px;
          height: 38px;
          border-radius: var(--radius-sm);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .card-icon-box.cyan { background: rgba(0, 242, 254, 0.15); color: var(--accent-cyan); }
        .card-icon-box.gold { background: rgba(255, 183, 3, 0.15); color: #ffb703; }
        .card-icon-box.red { background: rgba(255, 32, 78, 0.15); color: var(--accent-red); }
        .card-icon-box.purple { background: rgba(199, 125, 255, 0.15); color: #c77dff; }
        
        .card-content {
          display: flex;
          flex-direction: column;
          gap: 2px;
          min-width: 0;
        }
        .card-label {
          font-size: 0.72rem;
          font-weight: 800;
          letter-spacing: 0.05em;
          color: var(--text-muted);
        }
        .card-value-row {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }
        .card-value {
          font-size: 1.15rem;
          font-weight: 800;
          color: #ffffff;
        }
        .card-value.danger { color: #ff4d6d; }
        .card-value.safe { color: #10b981; }
        .card-badge {
          font-size: 0.72rem;
          font-weight: 700;
          padding: 2px 8px;
          border-radius: var(--radius-full);
          background: rgba(0, 242, 254, 0.15);
          color: var(--accent-cyan);
        }
        .card-badge.gold { background: rgba(255, 183, 3, 0.2); color: #ffb703; }
        .card-badge.red { background: rgba(255, 32, 78, 0.2); color: #ff4d6d; }
        .card-note {
          font-size: 0.74rem;
          color: var(--text-secondary);
        }

        .cache-details-split {
          display: grid;
          grid-template-columns: 1.4fr 1fr;
          gap: 20px;
          flex: 1;
        }
        @media (max-width: 900px) {
          .cache-details-split {
            grid-template-columns: 1fr;
          }
        }

        .categories-table-card, .cache-actions-panel {
          background: rgba(16, 23, 38, 0.5);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-md);
          padding: 16px 18px;
          display: flex;
          flex-direction: column;
          gap: 14px;
        }
        .panel-title-row {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .panel-title-row h4 {
          font-size: 0.95rem;
          color: #ffffff;
          font-weight: 700;
        }

        .table-responsive {
          overflow-x: auto;
        }
        .cache-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 0.8rem;
          text-align: left;
        }
        .cache-table th {
          padding: 8px 10px;
          color: var(--text-muted);
          border-bottom: 1px solid var(--border-subtle);
          font-weight: 700;
        }
        .cache-table td {
          padding: 9px 10px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
          color: var(--text-main);
        }
        .cache-table tr.protected-row td {
          background: rgba(16, 185, 129, 0.05);
        }
        .badge-cat {
          display: inline-block;
          font-family: monospace;
          font-size: 0.75rem;
          font-weight: 700;
          padding: 2px 6px;
          border-radius: 4px;
        }
        .badge-cat.public { background: rgba(0, 242, 254, 0.15); color: var(--accent-cyan); }
        .badge-cat.session { background: rgba(255, 183, 3, 0.15); color: #ffb703; }
        .badge-cat.private { background: rgba(255, 32, 78, 0.15); color: #ff204e; }
        .badge-cat.static { background: rgba(199, 125, 255, 0.15); color: #c77dff; }
        .badge-cat.protected { background: rgba(16, 185, 129, 0.15); color: #10b981; }

        .policy-badge {
          font-size: 0.72rem;
          font-weight: 700;
          padding: 2px 7px;
          border-radius: var(--radius-full);
        }
        .policy-badge.keep { background: rgba(0, 242, 254, 0.15); color: var(--accent-cyan); }
        .policy-badge.purge { background: rgba(255, 32, 78, 0.15); color: #ff4d6d; }
        .policy-badge.permanent { background: rgba(16, 185, 129, 0.2); color: #10b981; }

        .live-log-box {
          background: #030508;
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-sm);
          padding: 10px 14px;
          display: flex;
          flex-direction: column;
          gap: 6px;
          flex: 1;
          min-height: 120px;
        }
        .log-header {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.76rem;
          font-weight: 700;
          color: var(--accent-gold);
        }
        .log-messages {
          display: flex;
          flex-direction: column;
          gap: 4px;
          overflow-y: auto;
          max-height: 120px;
          font-family: monospace;
          font-size: 0.74rem;
        }
        .log-line {
          color: #a0aec0;
          line-height: 1.4;
        }

        /* ACTIONS PANEL */
        .action-button-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .btn-group-label {
          font-size: 0.74rem;
          font-weight: 800;
          color: var(--text-muted);
          letter-spacing: 0.04em;
        }
        .btn-action-trigger {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 8px 12px;
          border-radius: var(--radius-sm);
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid var(--border-subtle);
          color: var(--text-main);
          cursor: pointer;
          text-align: left;
          transition: all var(--transition-fast);
        }
        .btn-action-trigger:hover {
          background: rgba(0, 242, 254, 0.1);
          border-color: var(--accent-cyan);
          color: #ffffff;
        }
        .btn-action-trigger strong {
          display: block;
          font-size: 0.8rem;
          font-family: monospace;
        }
        .btn-action-trigger span {
          display: block;
          font-size: 0.72rem;
          color: var(--text-secondary);
        }

        .split-two-btns {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
        }
        .btn-clock-action, .btn-account-action {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          padding: 8px 10px;
          border-radius: var(--radius-sm);
          font-size: 0.78rem;
          font-weight: 700;
          cursor: pointer;
          border: 1px solid transparent;
          transition: all var(--transition-fast);
        }
        .btn-clock-action.ff {
          background: rgba(255, 32, 78, 0.15);
          color: #ff4d6d;
          border-color: rgba(255, 32, 78, 0.3);
        }
        .btn-clock-action.ff:hover {
          background: var(--accent-red);
          color: #ffffff;
        }
        .btn-clock-action.reset {
          background: rgba(255, 255, 255, 0.06);
          color: var(--text-secondary);
          border-color: var(--border-subtle);
        }
        .btn-clock-action.reset:hover {
          background: rgba(255, 255, 255, 0.15);
          color: #ffffff;
        }

        .btn-account-action.login {
          background: rgba(0, 242, 254, 0.12);
          color: var(--accent-cyan);
          border-color: rgba(0, 242, 254, 0.3);
        }
        .btn-account-action.login:hover {
          background: var(--accent-cyan);
          color: #030508;
        }
        .btn-account-action.logout {
          background: rgba(255, 32, 78, 0.12);
          color: var(--accent-red);
          border-color: rgba(255, 32, 78, 0.3);
          width: 100%;
        }
        .btn-account-action.logout:hover {
          background: var(--accent-red);
          color: #ffffff;
        }

        /* TAB 2: API TESTER STYLES */
        .api-tester-container {
          flex: 1;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }
        .explorer-config-bar {
          background: rgba(13, 18, 30, 0.95);
          border-bottom: 1px solid var(--border-subtle);
          padding: 10px 22px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          flex-wrap: wrap;
        }
        .config-form {
          display: flex;
          align-items: center;
          gap: 12px;
          flex: 1;
          flex-wrap: wrap;
        }
        .config-input-group {
          display: flex;
          align-items: center;
          gap: 8px;
          flex: 1;
          min-width: 300px;
        }
        .config-label {
          font-size: 0.8rem;
          font-weight: 700;
          color: var(--text-secondary);
          white-space: nowrap;
        }
        .config-text-input {
          flex: 1;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-sm);
          padding: 6px 10px;
          color: #ffffff;
          font-size: 0.8rem;
          font-family: monospace;
        }
        .config-btn-group {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .btn-save-endpoint {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 6px 14px;
          background: var(--accent-cyan);
          color: #030508;
          font-size: 0.8rem;
          font-weight: 700;
          border-radius: var(--radius-sm);
          border: none;
          cursor: pointer;
        }
        .btn-clear-cache {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          background: rgba(255, 255, 255, 0.08);
          color: var(--text-secondary);
          font-size: 0.8rem;
          font-weight: 600;
          border-radius: var(--radius-sm);
          border: 1px solid var(--border-subtle);
          cursor: pointer;
        }
        .btn-clear-cache:hover {
          color: #ffffff;
          background: rgba(255, 255, 255, 0.15);
        }

        .active-mode-indicator {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.8rem;
          color: var(--text-secondary);
        }
        .mode-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
        }

        .explorer-grid {
          flex: 1;
          display: grid;
          grid-template-columns: 360px 1fr;
          overflow: hidden;
        }
        @media (max-width: 800px) {
          .explorer-grid {
            grid-template-columns: 1fr;
          }
        }
        .endpoint-sidebar {
          background: rgba(10, 15, 25, 0.95);
          border-right: 1px solid var(--border-subtle);
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 10px;
          overflow-y: auto;
        }
        .sidebar-heading {
          font-size: 0.75rem;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: var(--text-muted);
        }
        .routes-list {
          display: flex;
          flex-direction: column;
          gap: 6px;
          flex: 1;
        }
        .route-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 10px;
          border-radius: var(--radius-sm);
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid transparent;
          color: var(--text-secondary);
          font-size: 0.78rem;
          text-align: left;
          cursor: pointer;
          transition: all var(--transition-fast);
        }
        .route-btn:hover {
          background: rgba(255, 255, 255, 0.08);
          color: #ffffff;
        }
        .route-btn.active {
          background: rgba(0, 242, 254, 0.12);
          border-color: var(--accent-cyan);
          color: #ffffff;
        }
        .method-tag {
          font-size: 0.68rem;
          font-weight: 800;
          color: #10b981;
          background: rgba(16, 185, 129, 0.15);
          padding: 2px 5px;
          border-radius: 3px;
        }
        .route-text {
          font-family: monospace;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .db-stats-box {
          margin-top: auto;
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px;
          background: rgba(255, 183, 3, 0.08);
          border: 1px solid rgba(255, 183, 3, 0.2);
          border-radius: var(--radius-sm);
        }
        .db-stats-text {
          font-size: 0.72rem;
          color: var(--text-secondary);
          line-height: 1.35;
        }

        .response-panel {
          display: flex;
          flex-direction: column;
          overflow: hidden;
          background: #050811;
        }
        .response-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 10px 18px;
          background: rgba(16, 23, 38, 0.8);
          border-bottom: 1px solid var(--border-subtle);
        }
        .response-meta-chips {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .bar-label {
          font-size: 0.8rem;
          font-weight: 700;
          color: var(--text-muted);
        }
        .meta-chip {
          font-size: 0.74rem;
          font-weight: 600;
          padding: 2px 8px;
          border-radius: var(--radius-full);
          background: rgba(255, 255, 255, 0.05);
          color: var(--text-secondary);
        }
        .meta-chip.latency { color: var(--accent-gold); }
        .meta-chip.source { color: var(--accent-cyan); }

        .copy-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 4px 10px;
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-sm);
          color: var(--text-secondary);
          font-size: 0.75rem;
          cursor: pointer;
        }
        .copy-btn:hover {
          color: #ffffff;
          background: rgba(255, 255, 255, 0.15);
        }

        .json-container {
          flex: 1;
          overflow: auto;
          padding: 16px;
        }
        .json-code {
          margin: 0;
          font-family: 'Fira Code', 'Courier New', monospace;
          font-size: 0.78rem;
          color: #e2e8f0;
          line-height: 1.5;
        }
        .loading-state, .empty-state {
          height: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 12px;
          color: var(--text-muted);
          text-align: center;
        }
        .spinner {
          width: 30px;
          height: 30px;
          border: 3px solid rgba(0, 242, 254, 0.2);
          border-top-color: var(--accent-cyan);
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .cors-error-box {
          background: rgba(255, 32, 78, 0.08);
          border: 1px solid rgba(255, 32, 78, 0.3);
          border-radius: var(--radius-md);
          padding: 16px;
        }
        .cors-error-title {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 8px;
        }
        .cors-error-title h4 {
          color: var(--accent-red);
          font-size: 0.95rem;
        }
        .cors-desc {
          font-size: 0.82rem;
          color: var(--text-secondary);
          line-height: 1.5;
          margin-bottom: 12px;
        }
        .cors-code-preview pre {
          background: #030508;
          padding: 12px;
          border-radius: var(--radius-sm);
          font-size: 0.76rem;
          color: #cbd5e1;
          overflow-x: auto;
        }
      `}</style>
    </div>
  );
}
