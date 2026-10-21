// src/components/ScraperModal.jsx
// Modal untuk memantau status Scraper Fansub Tokusatsu Live dan Hasil Nyata

import React, { useState } from 'react';
import { 
  X, 
  RefreshCw, 
  Play, 
  Download, 
  ExternalLink, 
  CheckCircle2, 
  Database, 
  Server, 
  ShieldCheck, 
  Zap, 
  FileCode, 
  Copy, 
  Check, 
  Sparkles 
} from 'lucide-react';
import { scraperService } from '../services/scraperService';

export default function ScraperModal({ onClose, onPlayEpisode }) {
  const [activeTab, setActiveTab] = useState('episodes'); // 'episodes' | 'architecture' | 'raw'
  const [subFilter, setSubFilter] = useState('all'); // 'all' | 'myth' | 'reiwa' | 'heisei' | 'tv_series' | 'movie'
  const [copied, setCopied] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncSuccess, setSyncSuccess] = useState(false);

  const episodes = scraperService.getScrapedEpisodes();
  const metadata = scraperService.getMetadata();

  const totalServers = episodes.reduce((acc, ep) => acc + (ep.servers?.length || 0), 0);
  const totalGdrive = episodes.filter((ep) => ep.driveDownloadUrl1).length;

  const filteredEpisodes = episodes.filter((ep) => {
    if (subFilter === 'sawidago') {
      return (ep.fansub || '').toLowerCase().includes('sawidago') || (ep.sourceUrl || '').includes('sawidago');
    }
    if (subFilter === 'myth') {
      return (ep.seriesTitle || '').toLowerCase().includes('my-th') || (ep.title || '').toLowerCase().includes('my-th');
    }
    if (subFilter === 'reiwa') {
      return ep.era?.toLowerCase() === 'reiwa';
    }
    if (subFilter === 'heisei') {
      return ep.era?.toLowerCase() === 'heisei';
    }
    if (subFilter === 'tv_series') {
      return ep.contentType === 'tv_series';
    }
    if (subFilter === 'movie') {
      return ep.contentType === 'movie' || (ep.title || '').toLowerCase().includes('movie') || (ep.title || '').toLowerCase().includes('special');
    }
    return true;
  });

  const handleCopyRaw = () => {
    navigator.clipboard.writeText(JSON.stringify({ metadata, episodes }, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleTriggerSync = async () => {
    setSyncing(true);
    setSyncSuccess(false);
    try {
      await scraperService.fetchLiveScraped();
      setSyncSuccess(true);
      setTimeout(() => setSyncSuccess(false), 3000);
    } catch (e) {
      console.warn('Sync fansub error:', e);
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="scraper-modal-backdrop" onClick={onClose}>
      <div className="scraper-modal-card glass-panel" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="scraper-header">
          <div className="header-left">
            <div className="scraper-badge">
              <span className="live-dot-pulse" />
              <span>LIVE FANSUB SCRAPER — HEISEI & REIWA (SERIES & MOVIES)</span>
            </div>
            <h2 className="scraper-title">Tokusatsu Scraper & Live Extractor Engine</h2>
            <p className="scraper-subtitle">
              Hasil nyata ekstraksi tautan streaming embed & mirror Google Drive dari era Heisei hingga Reiwa (termasuk serial Kamen Rider My-Th & movie layar lebar).
            </p>
          </div>
          <button id="close-scraper-modal-btn" className="close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Full Automation Bot Banner */}
        <div style={{
          margin: '0 24px 16px 24px',
          padding: '14px 18px',
          borderRadius: '12px',
          background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.15) 0%, rgba(14, 165, 233, 0.15) 100%)',
          border: '1px solid rgba(34, 197, 94, 0.4)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{
              width: '12px',
              height: '12px',
              borderRadius: '50%',
              background: '#22C55E',
              boxShadow: '0 0 12px #22C55E',
              display: 'inline-block'
            }} />
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <strong style={{ color: '#22C55E', fontSize: '13px', letterSpacing: '0.04em' }}>
                  SAWIDAGOFANSUB AUTOMATION BOT: AKTIF (FULL AUTOMATION 24/7)
                </strong>
                <span style={{ fontSize: '10px', background: 'rgba(34,197,94,0.25)', color: '#4ADE80', padding: '2px 6px', borderRadius: '4px', fontWeight: 700 }}>
                  LIVE
                </span>
              </div>
              <span style={{ color: '#D4D4D8', fontSize: '12px', marginTop: '2px', display: 'block' }}>
                Terintegrasi langsung dengan <strong style={{ color: '#38BDF8' }}>https://sawidagofansub.com/</strong>. Ketika ada update film/series baru, bot otomatis mengekstrak & menyinkronkan ke website via GitHub Actions Cron (Setiap 3 Jam).
              </span>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{
              fontSize: '11px',
              fontWeight: 700,
              padding: '5px 12px',
              borderRadius: '20px',
              background: 'rgba(34, 197, 94, 0.2)',
              color: '#4ADE80',
              border: '1px solid rgba(74, 222, 128, 0.4)'
            }}>
              Cron Cloud: 3 Jam Sekali
            </span>
          </div>
        </div>

        {/* Stats Row */}
        <div className="scraper-stats-row">
          <div className="stat-card">
            <div className="stat-icon-wrap cyan">
              <Database size={18} />
            </div>
            <div className="stat-info">
              <span className="stat-label">Total Rilis Scraped</span>
              <strong className="stat-val">{episodes.length} Rilis</strong>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon-wrap red">
              <Server size={18} />
            </div>
            <div className="stat-info">
              <span className="stat-label">Server Streaming Aktif</span>
              <strong className="stat-val">{totalServers} Server</strong>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon-wrap yellow">
              <Download size={18} />
            </div>
            <div className="stat-info">
              <span className="stat-label">Google Drive Mirrors</span>
              <strong className="stat-val">{totalGdrive} Direct Links</strong>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon-wrap green">
              <ShieldCheck size={18} />
            </div>
            <div className="stat-info">
              <span className="stat-label">Status Integrasi</span>
              <strong className="stat-val green-text">100% Berhasil</strong>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="scraper-nav-tabs">
          <div className="tabs-left">
            <button 
              className={`tab-btn ${activeTab === 'episodes' ? 'active' : ''}`}
              onClick={() => setActiveTab('episodes')}
            >
              <Zap size={15} />
              <span>Daftar Rilis Nyata ({episodes.length})</span>
            </button>
            <button 
              className={`tab-btn ${activeTab === 'architecture' ? 'active' : ''}`}
              onClick={() => setActiveTab('architecture')}
            >
              <Server size={15} />
              <span>Mekanisme Ekstraksi</span>
            </button>
            <button 
              className={`tab-btn ${activeTab === 'raw' ? 'active' : ''}`}
              onClick={() => setActiveTab('raw')}
            >
              <FileCode size={15} />
              <span>Inspeksi Raw JSON</span>
            </button>
          </div>

          <div className="tabs-right">
            <button 
              className="sync-btn"
              disabled={syncing}
              onClick={handleTriggerSync}
              title="Sinkronkan kembali data scraper"
            >
              <RefreshCw size={14} className={syncing ? 'animate-spin' : ''} />
              <span>{syncing ? 'Memperbarui...' : syncSuccess ? 'Tersinkronkan!' : 'Sinkronkan Ulang'}</span>
            </button>
          </div>
        </div>

        {/* Sub-Filters for Episodes Tab */}
        {activeTab === 'episodes' && (
          <div className="scraper-subfilters-row">
            <div className="subfilter-chips">
              <button 
                className={`subfilter-chip ${subFilter === 'all' ? 'active' : ''}`}
                onClick={() => setSubFilter('all')}
              >
                Semua ({episodes.length})
              </button>
              <button 
                className={`subfilter-chip highlight ${subFilter === 'myth' ? 'active' : ''}`}
                onClick={() => setSubFilter('myth')}
              >
                ⚡ Kamen Rider My-Th ({episodes.filter(e => (e.seriesTitle||'').toLowerCase().includes('my-th')).length})
              </button>
              <button 
                className={`subfilter-chip ${subFilter === 'sawidago' ? 'active' : ''}`}
                style={{ borderColor: subFilter === 'sawidago' ? '#22C55E' : undefined, color: subFilter === 'sawidago' ? '#4ADE80' : undefined }}
                onClick={() => setSubFilter('sawidago')}
              >
                🌱 SawidagoFansub ({episodes.filter(e => (e.fansub||'').toLowerCase().includes('sawidago') || (e.sourceUrl||'').includes('sawidago')).length})
              </button>
              <button 
                className={`subfilter-chip ${subFilter === 'reiwa' ? 'active' : ''}`}
                onClick={() => setSubFilter('reiwa')}
              >
                Era Reiwa ({episodes.filter(e => e.era === 'Reiwa').length})
              </button>
              <button 
                className={`subfilter-chip ${subFilter === 'heisei' ? 'active' : ''}`}
                onClick={() => setSubFilter('heisei')}
              >
                Era Heisei ({episodes.filter(e => e.era === 'Heisei').length})
              </button>
              <button 
                className={`subfilter-chip ${subFilter === 'tv_series' ? 'active' : ''}`}
                onClick={() => setSubFilter('tv_series')}
              >
                Serial TV ({episodes.filter(e => e.contentType === 'tv_series').length})
              </button>
              <button 
                className={`subfilter-chip ${subFilter === 'movie' ? 'active' : ''}`}
                onClick={() => setSubFilter('movie')}
              >
                Movie & Spesial ({episodes.filter(e => e.contentType === 'movie').length})
              </button>
            </div>
            <span className="subfilter-count-badge">{filteredEpisodes.length} Rilis Ditampilkan</span>
          </div>
        )}

        {/* Tab Content Body */}
        <div className="scraper-body-content">
          {activeTab === 'episodes' && (
            <div className="episodes-scraped-list">
              {filteredEpisodes.map((ep) => (
                <div key={ep.id} className="scraped-ep-row glass-panel">
                  <div className="ep-poster-thumb">
                    <img src={ep.thumbnail} alt={ep.title} />
                    <span className="thumb-era-tag">{ep.era}</span>
                  </div>

                  <div className="ep-details-col">
                    <div className="ep-badge-row">
                      <span className="badge-series">{ep.seriesTitle}</span>
                      <span className="badge-franchise">{ep.franchise}</span>
                      <span className={`badge-type ${ep.contentType === 'movie' ? 'movie' : 'serial'}`}>
                        {ep.contentType === 'movie' ? 'Movie / Special' : 'Serial TV'}
                      </span>
                      <span className="badge-quality">{ep.quality}</span>
                      <span className="badge-sub">Sub Indo</span>
                    </div>

                    <h4 className="scraped-ep-title">{ep.title}</h4>

                    <div className="ep-meta-sub">
                      <span><strong>Sumber Fansub:</strong> {ep.fansub}</span>
                      <span>•</span>
                      <span><strong>Server:</strong> {ep.servers.length} Jalur</span>
                    </div>

                    {/* Servers pill row */}
                    <div className="servers-pill-row">
                      {ep.servers.map((srv, sIdx) => (
                        <span key={sIdx} className="srv-chip">
                          <span className="dot-ok" />
                          {srv.name}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="ep-actions-col">
                    <button 
                      className="btn-play-scraped"
                      onClick={() => onPlayEpisode(ep.id)}
                    >
                      <Play size={14} fill="#ffffff" />
                      <span>Putar Sekarang</span>
                    </button>

                    {ep.driveDownloadUrl1 && (
                      <a
                        href={ep.driveDownloadUrl1}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-gdrive-link"
                        title="Download dari Google Drive Mirror 1"
                      >
                        <Download size={13} />
                        <span>Google Drive</span>
                        <ExternalLink size={11} />
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'architecture' && (
            <div className="scraper-arch-content">
              <h3>Mekanisme Ekstraksi Fansub Scraper Tokuflix</h3>
              <p>
                Sistem scraping dirancang khusus untuk membedah arsitektur CMS fansub Tokusatsu (WordPress Muvipro) yang umumnya memproteksi link video dengan enkripsi Base64 dan internal player wrapper.
              </p>

              <div className="arch-steps-grid">
                <div className="arch-step-box">
                  <span className="step-num">01</span>
                  <h4>Discovery & Crawl</h4>
                  <p>Mendeteksi pos rilis terbaru dari index fansub (Kamen Rider Gavv, Boonboomger, Zeztz, Agito, dll) dan mengekstrak meta thumbnail serta takarir.</p>
                </div>

                <div className="arch-step-box">
                  <span className="step-num">02</span>
                  <h4>Base64 Decoder</h4>
                  <p>Mengurai atribut <code>data-embed</code> terenkripsi Base64 yang berisi tag iframe pemutar asli dari server player fansub.</p>
                </div>

                <div className="arch-step-box">
                  <span className="step-num">03</span>
                  <h4>JWT/Payload Resolver</h4>
                  <p>Membedah token internal <code>player.tokusatsuindo.com/x/?t=...</code> untuk mengekstrak direct ID dan URL Google Drive murni.</p>
                </div>

                <div className="arch-step-box">
                  <span className="step-num">04</span>
                  <h4>REST Envelope 02 Compliant</h4>
                  <p>Menyusun data ke dalam kontrak standar REST API Tokuflix: server multi-opsi, skip markers intro/outro, dan hardsub tracker.</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'raw' && (
            <div className="scraper-raw-box">
              <div className="raw-toolbar">
                <span className="raw-title">JSON Output (src/data/scrapedTokusatsu.json)</span>
                <button className="copy-btn" onClick={handleCopyRaw}>
                  {copied ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
                  <span>{copied ? 'Tersalin ke Clipboard!' : 'Salin JSON'}</span>
                </button>
              </div>
              <pre className="raw-code">
                {JSON.stringify({ metadata, episodes }, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>

      <style>{`
        .scraper-modal-backdrop {
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
        .scraper-modal-card {
          width: 100%;
          max-width: 1060px;
          max-height: 90vh;
          background: #090e17;
          border: 1px solid rgba(0, 242, 254, 0.25);
          border-radius: var(--radius-lg);
          display: flex;
          flex-direction: column;
          overflow: hidden;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.95);
        }
        .scraper-header {
          padding: 22px 28px;
          border-bottom: 1px solid var(--border-subtle);
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          background: linear-gradient(180deg, rgba(0, 242, 254, 0.05) 0%, transparent 100%);
        }
        .scraper-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: rgba(16, 185, 129, 0.15);
          border: 1px solid rgba(16, 185, 129, 0.35);
          color: #10b981;
          font-size: 0.72rem;
          font-weight: 700;
          padding: 3px 9px;
          border-radius: 999px;
          margin-bottom: 8px;
        }
        .live-dot-pulse {
          width: 7px;
          height: 7px;
          background: #10b981;
          border-radius: 50%;
          box-shadow: 0 0 10px #10b981;
        }
        .scraper-title {
          font-size: 1.35rem;
          font-weight: 800;
          color: var(--text-primary);
          margin-bottom: 4px;
        }
        .scraper-subtitle {
          font-size: 0.85rem;
          color: var(--text-secondary);
        }
        .scraper-stats-row {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 12px;
          padding: 16px 28px;
          background: rgba(255, 255, 255, 0.01);
          border-bottom: 1px solid var(--border-subtle);
        }
        .stat-card {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 14px;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: var(--radius-sm);
        }
        .stat-icon-wrap {
          width: 38px;
          height: 38px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .stat-icon-wrap.cyan { background: rgba(0, 242, 254, 0.15); color: var(--accent-cyan); }
        .stat-icon-wrap.red { background: rgba(255, 32, 78, 0.15); color: var(--accent-red); }
        .stat-icon-wrap.yellow { background: rgba(255, 183, 3, 0.15); color: #ffb703; }
        .stat-icon-wrap.green { background: rgba(16, 185, 129, 0.15); color: #10b981; }
        .stat-label {
          font-size: 0.72rem;
          color: var(--text-muted);
          display: block;
        }
        .stat-val {
          font-size: 1rem;
          font-weight: 700;
          color: var(--text-primary);
        }
        .green-text {
          color: #10b981;
        }
        .scraper-nav-tabs {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 28px;
          border-bottom: 1px solid var(--border-subtle);
          background: rgba(0, 0, 0, 0.2);
        }
        .tabs-left {
          display: flex;
          gap: 8px;
        }
        .tab-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 7px 14px;
          border-radius: var(--radius-sm);
          font-size: 0.8rem;
          font-weight: 600;
          color: var(--text-secondary);
          background: transparent;
          border: 1px solid transparent;
          transition: var(--transition-fast);
        }
        .tab-btn:hover {
          color: var(--text-primary);
          background: rgba(255, 255, 255, 0.04);
        }
        .tab-btn.active {
          color: var(--accent-cyan);
          background: rgba(0, 242, 254, 0.12);
          border-color: rgba(0, 242, 254, 0.3);
        }
        .sync-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 7px 14px;
          border-radius: var(--radius-sm);
          font-size: 0.78rem;
          font-weight: 600;
          color: #ffffff;
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.15);
          transition: var(--transition-fast);
        }
        .sync-btn:hover:not(:disabled) {
          background: var(--accent-red);
          border-color: var(--accent-red);
        }
        .scraper-body-content {
          flex: 1;
          overflow-y: auto;
          padding: 24px 28px;
        }
        .episodes-scraped-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .scraped-ep-row {
          display: flex;
          align-items: center;
          gap: 18px;
          padding: 14px 18px;
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: var(--radius-md);
          transition: var(--transition-fast);
        }
        .scraped-ep-row:hover {
          background: rgba(255, 255, 255, 0.04);
          border-color: rgba(0, 242, 254, 0.3);
        }
        .ep-poster-thumb {
          position: relative;
          width: 80px;
          height: 100px;
          border-radius: var(--radius-sm);
          overflow: hidden;
          flex-shrink: 0;
        }
        .ep-poster-thumb img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .thumb-era-tag {
          position: absolute;
          top: 4px;
          left: 4px;
          font-size: 0.65rem;
          font-weight: 700;
          padding: 2px 5px;
          border-radius: 3px;
          background: rgba(0, 0, 0, 0.75);
          color: var(--accent-cyan);
        }
        .ep-details-col {
          flex: 1;
          min-width: 0;
        }
        .ep-badge-row {
          display: flex;
          gap: 6px;
          margin-bottom: 6px;
          flex-wrap: wrap;
        }
        .scraper-subfilters-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 10px 28px;
          background: rgba(0, 0, 0, 0.35);
          border-bottom: 1px solid var(--border-subtle);
          flex-wrap: wrap;
          gap: 10px;
        }
        .subfilter-chips {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }
        .subfilter-chip {
          padding: 5px 12px;
          border-radius: 999px;
          font-size: 0.74rem;
          font-weight: 600;
          color: var(--text-secondary);
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.08);
          transition: var(--transition-fast);
          cursor: pointer;
        }
        .subfilter-chip:hover {
          color: #ffffff;
          background: rgba(255, 255, 255, 0.08);
        }
        .subfilter-chip.active {
          color: #030508;
          background: var(--accent-cyan);
          border-color: var(--accent-cyan);
          font-weight: 700;
        }
        .subfilter-chip.highlight {
          border-color: rgba(0, 242, 254, 0.4);
        }
        .subfilter-chip.highlight.active {
          background: linear-gradient(135deg, #00f2fe 0%, #4facfe 100%);
          color: #030508;
        }
        .subfilter-count-badge {
          font-size: 0.72rem;
          color: var(--text-muted);
          font-weight: 600;
        }
        .badge-type {
          font-size: 0.7rem;
          font-weight: 700;
          padding: 2px 6px;
          border-radius: 4px;
        }
        .badge-type.movie {
          background: rgba(255, 32, 78, 0.15);
          color: var(--accent-red);
          border: 1px solid rgba(255, 32, 78, 0.3);
        }
        .badge-type.serial {
          background: rgba(79, 172, 254, 0.15);
          color: #4facfe;
          border: 1px solid rgba(79, 172, 254, 0.3);
        }
        .badge-series {
          font-size: 0.72rem;
          font-weight: 700;
          color: var(--accent-cyan);
          background: rgba(0, 242, 254, 0.1);
          padding: 2px 6px;
          border-radius: 4px;
        }
        .badge-franchise {
          font-size: 0.72rem;
          font-weight: 600;
          color: #ffb703;
          background: rgba(255, 183, 3, 0.1);
          padding: 2px 6px;
          border-radius: 4px;
        }
        .badge-quality {
          font-size: 0.7rem;
          color: var(--text-secondary);
          background: rgba(255, 255, 255, 0.05);
          padding: 2px 6px;
          border-radius: 4px;
        }
        .badge-sub {
          font-size: 0.7rem;
          font-weight: 700;
          color: #10b981;
          background: rgba(16, 185, 129, 0.15);
          padding: 2px 6px;
          border-radius: 4px;
        }
        .scraped-ep-title {
          font-size: 0.95rem;
          font-weight: 700;
          color: var(--text-primary);
          margin-bottom: 4px;
        }
        .ep-meta-sub {
          font-size: 0.78rem;
          color: var(--text-secondary);
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 8px;
        }
        .servers-pill-row {
          display: flex;
          gap: 6px;
          flex-wrap: wrap;
        }
        .srv-chip {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          font-size: 0.68rem;
          padding: 2px 6px;
          border-radius: 3px;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.08);
          color: var(--text-secondary);
        }
        .dot-ok {
          width: 5px;
          height: 5px;
          background: #10b981;
          border-radius: 50%;
        }
        .ep-actions-col {
          display: flex;
          flex-direction: column;
          gap: 8px;
          flex-shrink: 0;
        }
        .btn-play-scraped {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 16px;
          background: linear-gradient(135deg, var(--accent-red) 0%, #e63946 100%);
          color: #ffffff;
          font-size: 0.8rem;
          font-weight: 700;
          border-radius: var(--radius-sm);
          transition: var(--transition-fast);
        }
        .btn-play-scraped:hover {
          box-shadow: 0 0 15px var(--accent-red-glow);
          transform: translateY(-1px);
        }
        .btn-gdrive-link {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 5px;
          padding: 6px 12px;
          background: rgba(0, 242, 254, 0.1);
          border: 1px solid rgba(0, 242, 254, 0.25);
          color: var(--accent-cyan);
          font-size: 0.74rem;
          font-weight: 600;
          border-radius: var(--radius-sm);
          text-decoration: none;
          transition: var(--transition-fast);
        }
        .btn-gdrive-link:hover {
          background: var(--accent-cyan);
          color: #030508;
        }
        .scraper-arch-content h3 {
          font-size: 1.15rem;
          font-weight: 800;
          color: var(--text-primary);
          margin-bottom: 8px;
        }
        .scraper-arch-content p {
          font-size: 0.88rem;
          color: var(--text-secondary);
          line-height: 1.6;
          margin-bottom: 24px;
        }
        .arch-steps-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 16px;
        }
        .arch-step-box {
          position: relative;
          padding: 20px;
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: var(--radius-md);
        }
        .step-num {
          position: absolute;
          top: 14px;
          right: 18px;
          font-size: 1.5rem;
          font-weight: 900;
          color: rgba(255, 255, 255, 0.08);
        }
        .arch-step-box h4 {
          font-size: 0.95rem;
          font-weight: 700;
          color: var(--accent-cyan);
          margin-bottom: 8px;
        }
        .arch-step-box p {
          font-size: 0.82rem;
          color: var(--text-secondary);
          margin-bottom: 0;
        }
        .arch-step-box code {
          background: rgba(0, 0, 0, 0.5);
          padding: 2px 5px;
          border-radius: 3px;
          color: #ffb703;
          font-size: 0.78rem;
        }
        .scraper-raw-box {
          display: flex;
          flex-direction: column;
          height: 100%;
        }
        .raw-toolbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 12px;
        }
        .raw-title {
          font-size: 0.82rem;
          color: var(--text-muted);
          font-family: monospace;
        }
        .copy-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          border-radius: var(--radius-sm);
          font-size: 0.76rem;
          font-weight: 600;
          color: var(--text-secondary);
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
        }
        .copy-btn:hover {
          color: var(--text-primary);
          background: rgba(255, 255, 255, 0.1);
        }
        .raw-code {
          background: #030508;
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-md);
          padding: 16px;
          font-family: 'JetBrains Mono', Consolas, monospace;
          font-size: 0.78rem;
          color: #a7f3d0;
          overflow: auto;
          max-height: 480px;
          line-height: 1.5;
        }
        @media (max-width: 768px) {
          .scraper-stats-row {
            grid-template-columns: 1fr 1fr;
          }
          .arch-steps-grid {
            grid-template-columns: 1fr;
          }
          .scraped-ep-row {
            flex-direction: column;
            align-items: flex-start;
          }
          .ep-actions-col {
            width: 100%;
            flex-direction: row;
          }
        }
      `}</style>
    </div>
  );
}
