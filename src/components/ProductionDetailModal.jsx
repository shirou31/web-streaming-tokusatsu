import React, { useState, useEffect } from 'react';
import { 
  X, 
  Play, 
  Calendar, 
  Tv, 
  Star, 
  Clock, 
  Film, 
  Layers, 
  Sparkles, 
  Bookmark, 
  BookmarkCheck, 
  ExternalLink, 
  Compass, 
  AlertCircle,
  Share2
} from 'lucide-react';
import { getProductionBySlug } from '../services/apiService';

export default function ProductionDetailModal({ 
  productionSlug, 
  onClose, 
  onPlayEpisode, 
  isBookmarked, 
  onToggleBookmark 
}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('episodes'); // 'episodes' | 'watch_order' | 'related'

  useEffect(() => {
    let isMounted = true;
    async function load() {
      setLoading(true);
      const res = await getProductionBySlug(productionSlug);
      if (isMounted && res.success) {
        setData(res.data);
      }
      if (isMounted) setLoading(false);
    }
    load();
    return () => { isMounted = false; };
  }, [productionSlug]);

  if (loading) {
    return (
      <div className="prod-modal-backdrop" onClick={onClose}>
        <div className="prod-modal-card loading-card glass-panel" onClick={(e) => e.stopPropagation()}>
          <div className="loader-box">
            <Sparkles size={32} className="animate-spin" color="var(--accent-red)" />
            <span>Memuat data produksi sesuai spesifikasi...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!data || !data.production) return null;

  const { production, episodes, related_productions, watch_order } = data;
  const bookmarked = isBookmarked(production.id);

  return (
    <div className="prod-modal-backdrop" onClick={onClose}>
      <div className="prod-modal-card glass-panel" onClick={(e) => e.stopPropagation()}>
        {/* Backdrop Header */}
        <div className="prod-header-banner">
          <img 
            src={production.backdrop_url || production.poster_url} 
            alt={production.title}
            className="prod-backdrop-img"
          />
          <div className="prod-header-overlay" />
          
          <button className="prod-close-btn" onClick={onClose} title="Tutup">
            <X size={22} />
          </button>

          <div className="prod-header-content">
            <div className="prod-badge-row">
              <span className="badge badge-red">{production.franchise?.name || 'Tokusatsu'}</span>
              <span className="badge badge-gold">{production.era?.name || 'Reiwa'} Era</span>
              <span className="badge badge-cyan">{production.type.replace('_', ' ').toUpperCase()}</span>
              <span className="badge badge-green">Rating {production.age_rating}</span>
            </div>

            <h1 className="prod-title">{production.title}</h1>
            {production.title_native && (
              <p className="prod-jp-title">{production.title_native} {production.title_romaji ? `(${production.title_romaji})` : ''}</p>
            )}

            {production.tagline && (
              <p className="prod-tagline">&ldquo;{production.tagline}&rdquo;</p>
            )}

            <div className="prod-actions-row">
              <button 
                className="btn-primary"
                onClick={() => {
                  onClose();
                  onPlayEpisode(production, episodes[0]);
                }}
              >
                <Play size={18} fill="#ffffff" />
                <span>Nonton Episode 1</span>
              </button>

              <button 
                className={`btn-secondary ${bookmarked ? 'active-bookmark' : ''}`}
                onClick={() => onToggleBookmark(production)}
              >
                {bookmarked ? <BookmarkCheck size={18} color="var(--accent-cyan)" /> : <Bookmark size={18} />}
                <span>{bookmarked ? 'Tersimpan di Favorit' : 'Tambah ke Favorit'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="prod-tabs-bar">
          <button 
            className={`prod-tab-btn ${activeTab === 'episodes' ? 'active' : ''}`}
            onClick={() => setActiveTab('episodes')}
          >
            <Tv size={16} />
            <span>Daftar Episode TV ({episodes.length})</span>
          </button>

          {watch_order && (
            <button 
              className={`prod-tab-btn tab-highlight ${activeTab === 'watch_order' ? 'active' : ''}`}
              onClick={() => setActiveTab('watch_order')}
            >
              <Compass size={16} color="var(--accent-cyan)" />
              <span>Urutan Nonton Kronologis</span>
              <span className="order-chip">Canon Order</span>
            </button>
          )}

          {related_productions && related_productions.length > 0 && (
            <button 
              className={`prod-tab-btn ${activeTab === 'related' ? 'active' : ''}`}
              onClick={() => setActiveTab('related')}
            >
              <Film size={16} />
              <span>Movie & Spesial Terkait ({related_productions.length})</span>
            </button>
          )}
        </div>

        {/* Tab Content Area */}
        <div className="prod-tab-body">
          {/* Synopsis & Meta Summary */}
          <div className="prod-synopsis-box">
            <h3 className="section-subheading">Sinopsis Resmi:</h3>
            <p className="synopsis-paragraph">{production.synopsis}</p>
            <div className="prod-tags-list">
              {production.genres?.map((g) => (
                <span key={g.slug} className="genre-pill">#{g.name}</span>
              ))}
            </div>
          </div>

          {/* TAB 1: EPISODES LIST */}
          {activeTab === 'episodes' && (
            <div className="episodes-grid-list">
              {episodes.map((ep) => (
                <div 
                  key={ep.id} 
                  className="episode-card-item"
                  onClick={() => {
                    onClose();
                    onPlayEpisode(production, ep);
                  }}
                >
                  <div className="ep-card-thumb-wrap">
                    <img 
                      src={ep.thumbnail_url || production.backdrop_url} 
                      alt={ep.title} 
                      className="ep-card-thumb"
                    />
                    <div className="ep-play-overlay">
                      <Play size={20} fill="#ffffff" />
                    </div>
                    <span className="ep-duration-badge">
                      {Math.floor((ep.duration_seconds || 1440) / 60)}m
                    </span>
                  </div>
                  <div className="ep-card-meta">
                    <span className="ep-card-number">Episode {ep.episode_number}</span>
                    <h4 className="ep-card-title">{ep.title}</h4>
                    {ep.title_native && <p className="ep-card-jp">{ep.title_native}</p>}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* TAB 2: CHRONOLOGICAL WATCH ORDER (Section 6 of 01_DATABASE_ARCHITECTURE) */}
          {activeTab === 'watch_order' && watch_order && (
            <div className="watch-order-container">
              <div className="watch-order-banner">
                <Compass size={22} color="var(--accent-cyan)" />
                <div>
                  <h4 className="order-name">{watch_order.name}</h4>
                  <p className="order-desc">{watch_order.description || "Urutan resmi yang menyisipkan Movie & Spesial di sela episode TV tanpa spoiler alur cerita."}</p>
                </div>
              </div>

              <div className="watch-order-timeline">
                {watch_order.items.map((item, idx) => {
                  const isMovie = item.production?.type === 'movie' || item.production?.type === 'v_cinema';
                  return (
                    <div key={item.position} className={`timeline-segment ${isMovie ? 'movie-segment' : ''}`}>
                      <div className="segment-number-badge">
                        <span>{item.position}</span>
                      </div>
                      <div className="segment-content glass-panel">
                        <div className="segment-header">
                          <span className={`badge ${isMovie ? 'badge-gold' : 'badge-red'}`}>
                            {item.production?.type.toUpperCase()}
                          </span>
                          <h4 className="segment-title">{item.production?.title}</h4>
                          <span className="segment-count">{item.episode_count} Item</span>
                        </div>

                        <div className="segment-range-info">
                          {isMovie ? (
                            <span className="range-text">Full Theatrical Feature</span>
                          ) : (
                            <span className="range-text">
                              Episode {item.start_episode?.episode_number} s/d Episode {item.end_episode?.episode_number}
                            </span>
                          )}
                        </div>

                        {item.note && (
                          <div className="segment-note-box">
                            <AlertCircle size={14} color="var(--accent-cyan)" />
                            <span>{item.note}</span>
                          </div>
                        )}

                        <button 
                          className="btn-primary mini-segment-btn"
                          onClick={() => {
                            onClose();
                            onPlayEpisode(
                              item.production, 
                              item.start_episode || { epNumber: 1, title: 'Episode 1' },
                              watch_order.slug
                            );
                          }}
                        >
                          <Play size={14} fill="#ffffff" />
                          <span>Tonton Bagian Ini</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: RELATED PRODUCTIONS */}
          {activeTab === 'related' && related_productions && (
            <div className="related-grid">
              {related_productions.map((rel, idx) => (
                <div key={idx} className="related-card glass-panel">
                  <img 
                    src={rel.production.poster_url} 
                    alt={rel.production.title} 
                    className="related-poster"
                  />
                  <div className="related-details">
                    <span className="badge badge-purple">{rel.relation.toUpperCase()}</span>
                    <h4 className="related-title">{rel.production.title}</h4>
                    <span className="related-year">{rel.production.release_year}</span>
                    <button 
                      className="btn-primary mini-btn"
                      onClick={() => {
                        onClose();
                        onPlayEpisode(rel.production, { epNumber: 1, title: rel.production.title });
                      }}
                    >
                      <Play size={14} fill="#ffffff" />
                      <span>Putar Sekarang</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <style>{`
        .prod-modal-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(3, 5, 8, 0.88);
          backdrop-filter: blur(14px);
          z-index: 1050;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          overflow-y: auto;
        }
        .prod-modal-card {
          background: #0d121d;
          border: 1px solid var(--border-light);
          border-radius: var(--radius-lg);
          width: 100%;
          max-width: 1100px;
          max-height: 92vh;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          box-shadow: 0 25px 60px rgba(0, 0, 0, 0.8), 0 0 40px rgba(255, 32, 78, 0.2);
        }
        .loading-card {
          padding: 60px 40px;
          align-items: center;
          justify-content: center;
          max-width: 400px;
        }
        .loader-box {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 16px;
          color: var(--text-secondary);
          font-size: 0.9rem;
        }
        .prod-header-banner {
          position: relative;
          min-height: 320px;
          display: flex;
          align-items: flex-end;
          padding: 28px 32px;
          overflow: hidden;
        }
        .prod-backdrop-img {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          object-position: center 25%;
          filter: brightness(0.65);
        }
        .prod-header-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(0deg, #0d121d 0%, rgba(13, 18, 29, 0.7) 50%, rgba(13, 18, 29, 0.3) 100%);
        }
        .prod-close-btn {
          position: absolute;
          top: 18px;
          right: 18px;
          z-index: 5;
          width: 38px;
          height: 38px;
          border-radius: 50%;
          background: rgba(0, 0, 0, 0.6);
          border: 1px solid var(--border-light);
          color: #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .prod-close-btn:hover {
          background: var(--accent-red);
          transform: rotate(90deg);
        }
        .prod-header-content {
          position: relative;
          z-index: 2;
          max-width: 760px;
        }
        .prod-badge-row {
          display: flex;
          gap: 8px;
          margin-bottom: 10px;
          flex-wrap: wrap;
        }
        .prod-title {
          font-size: 2.3rem;
          margin-bottom: 4px;
        }
        .prod-jp-title {
          font-family: var(--font-display);
          color: var(--accent-red);
          font-size: 0.95rem;
          margin-bottom: 8px;
        }
        .prod-tagline {
          font-style: italic;
          color: var(--text-secondary);
          margin-bottom: 16px;
          font-size: 0.95rem;
        }
        .prod-actions-row {
          display: flex;
          gap: 12px;
        }
        .prod-tabs-bar {
          display: flex;
          gap: 8px;
          padding: 12px 24px;
          border-bottom: 1px solid var(--border-subtle);
          background: rgba(16, 23, 38, 0.7);
          overflow-x: auto;
        }
        .prod-tab-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 9px 18px;
          border-radius: var(--radius-full);
          font-size: 0.88rem;
          font-weight: 600;
          color: var(--text-secondary);
          white-space: nowrap;
        }
        .prod-tab-btn.active {
          background: rgba(255, 32, 78, 0.2);
          border: 1px solid var(--accent-red);
          color: #ffffff;
        }
        .order-chip {
          background: rgba(0, 242, 254, 0.2);
          color: var(--accent-cyan);
          border: 1px solid rgba(0, 242, 254, 0.4);
          font-size: 0.65rem;
          font-weight: 800;
          padding: 1px 6px;
          border-radius: 4px;
        }
        .prod-tab-body {
          padding: 24px 32px;
          overflow-y: auto;
          flex: 1;
        }
        .prod-synopsis-box {
          margin-bottom: 24px;
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid var(--border-subtle);
          padding: 16px 20px;
          border-radius: var(--radius-md);
        }
        .section-subheading {
          font-size: 0.95rem;
          margin-bottom: 6px;
        }
        .synopsis-paragraph {
          font-size: 0.9rem;
          color: var(--text-secondary);
          line-height: 1.6;
          margin-bottom: 10px;
        }
        .prod-tags-list {
          display: flex;
          gap: 6px;
          flex-wrap: wrap;
        }
        .genre-pill {
          font-size: 0.75rem;
          color: var(--accent-cyan);
          background: rgba(0, 242, 254, 0.08);
          padding: 2px 8px;
          border-radius: 4px;
        }
        .episodes-grid-list {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
          gap: 16px;
        }
        .episode-card-item {
          background: rgba(16, 23, 38, 0.5);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-md);
          overflow: hidden;
          cursor: pointer;
          transition: all var(--transition-fast);
        }
        .episode-card-item:hover {
          border-color: var(--accent-red);
          transform: translateY(-4px);
        }
        .ep-card-thumb-wrap {
          position: relative;
          aspect-ratio: 16 / 9;
          background: #000;
        }
        .ep-card-thumb {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .ep-play-overlay {
          position: absolute;
          inset: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          opacity: 0;
          transition: opacity var(--transition-fast);
        }
        .episode-card-item:hover .ep-play-overlay {
          opacity: 1;
        }
        .ep-duration-badge {
          position: absolute;
          bottom: 6px;
          right: 6px;
          background: rgba(0, 0, 0, 0.8);
          color: #fff;
          font-size: 0.7rem;
          font-weight: 700;
          padding: 1px 6px;
          border-radius: 4px;
        }
        .ep-card-meta {
          padding: 10px 12px;
        }
        .ep-card-number {
          font-size: 0.72rem;
          font-weight: 700;
          color: var(--accent-cyan);
          text-transform: uppercase;
        }
        .ep-card-title {
          font-size: 0.88rem;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .ep-card-jp {
          font-size: 0.72rem;
          color: var(--text-muted);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .watch-order-container {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        .watch-order-banner {
          display: flex;
          align-items: center;
          gap: 14px;
          background: rgba(0, 242, 254, 0.08);
          border: 1px solid rgba(0, 242, 254, 0.25);
          padding: 14px 18px;
          border-radius: var(--radius-md);
        }
        .order-name {
          font-size: 1rem;
          color: #ffffff;
        }
        .order-desc {
          font-size: 0.82rem;
          color: var(--text-secondary);
        }
        .watch-order-timeline {
          display: flex;
          flex-direction: column;
          gap: 14px;
          position: relative;
        }
        .timeline-segment {
          display: flex;
          gap: 16px;
          align-items: flex-start;
        }
        .segment-number-badge {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: rgba(255, 32, 78, 0.2);
          border: 1px solid var(--accent-red);
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 800;
          font-size: 0.9rem;
          color: #fff;
          flex-shrink: 0;
        }
        .movie-segment .segment-number-badge {
          background: rgba(255, 183, 3, 0.2);
          border-color: var(--accent-gold);
          color: var(--accent-gold);
        }
        .segment-content {
          flex: 1;
          padding: 14px 18px;
        }
        .segment-header {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 6px;
        }
        .segment-title {
          font-size: 1rem;
        }
        .segment-count {
          font-size: 0.75rem;
          color: var(--text-muted);
          margin-left: auto;
        }
        .segment-range-info {
          font-size: 0.84rem;
          color: var(--text-secondary);
          margin-bottom: 8px;
        }
        .segment-note-box {
          display: flex;
          align-items: center;
          gap: 8px;
          background: rgba(0, 242, 254, 0.08);
          border: 1px solid rgba(0, 242, 254, 0.2);
          padding: 6px 12px;
          border-radius: 6px;
          font-size: 0.8rem;
          color: var(--accent-cyan);
          margin-bottom: 10px;
        }
        .mini-segment-btn {
          font-size: 0.8rem;
          padding: 6px 14px;
        }
        .related-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 16px;
        }
        .related-card {
          display: flex;
          gap: 12px;
          padding: 12px;
          align-items: center;
        }
        .related-poster {
          width: 70px;
          height: 98px;
          object-fit: cover;
          border-radius: 6px;
        }
        .related-details {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .related-title {
          font-size: 0.92rem;
        }
        .related-year {
          font-size: 0.78rem;
          color: var(--text-muted);
        }
        @media (max-width: 640px) {
          .prod-modal-backdrop {
            padding: 0;
            align-items: flex-start;
          }
          .prod-modal-card {
            border-radius: 0;
            width: 100vw;
            height: 100vh;
            max-height: 100vh;
            border: none;
          }
          .prod-header-banner {
            height: auto;
            min-height: 260px;
            padding: 20px 14px;
          }
          .prod-title {
            font-size: 1.5rem;
          }
          .prod-actions-row {
            flex-direction: column;
            width: 100%;
          }
          .prod-actions-row .btn-primary,
          .prod-actions-row .btn-secondary {
            width: 100%;
            justify-content: center;
          }
          .prod-tabs-bar {
            overflow-x: auto;
            padding: 8px 12px;
            scrollbar-width: none;
            -webkit-overflow-scrolling: touch;
          }
          .prod-tabs-bar::-webkit-scrollbar {
            display: none;
          }
          .prod-tab-btn {
            white-space: nowrap;
            flex-shrink: 0;
          }
          .prod-tab-content {
            padding: 14px 12px calc(80px + env(safe-area-inset-bottom, 0px));
          }
        }
      `}</style>
    </div>
  );
}
