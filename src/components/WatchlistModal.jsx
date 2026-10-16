import React, { useState } from 'react';
import { 
  X, 
  Bookmark, 
  History, 
  Play, 
  Trash2, 
  Tv, 
  Sparkles,
  Clock
} from 'lucide-react';

export default function WatchlistModal({ 
  bookmarks, 
  history, 
  onSelectSeries, 
  onPlayEpisode, 
  onRemoveBookmark, 
  onClearHistory, 
  onClose 
}) {
  const [activeTab, setActiveTab] = useState('bookmarks'); // 'bookmarks' | 'history'

  return (
    <div className="watchlist-modal-backdrop" onClick={onClose}>
      <div className="watchlist-modal-card glass-panel" onClick={(e) => e.stopPropagation()}>
        {/* Header with Tabs */}
        <div className="modal-top-bar">
          <div className="tabs-list">
            <button
              className={`tab-btn ${activeTab === 'bookmarks' ? 'active' : ''}`}
              onClick={() => setActiveTab('bookmarks')}
            >
              <Bookmark size={16} />
              <span>Daftar Favorit ({bookmarks.length})</span>
            </button>
            <button
              className={`tab-btn ${activeTab === 'history' ? 'active' : ''}`}
              onClick={() => setActiveTab('history')}
            >
              <History size={16} />
              <span>Riwayat Tonton ({history.length})</span>
            </button>
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Content Area */}
        <div className="modal-tab-content">
          {activeTab === 'bookmarks' ? (
            /* Favorit Tab */
            bookmarks.length === 0 ? (
              <div className="empty-state">
                <Bookmark size={44} className="empty-icon" />
                <h4 className="empty-title">Belum ada serial favorit</h4>
                <p className="empty-desc">
                  Tekan ikon bookmark pada serial Tokusatsu apa pun untuk menyimpannya ke daftar tontonan kamu.
                </p>
              </div>
            ) : (
              <div className="items-list">
                {bookmarks.map((series) => (
                  <div key={series.id} className="item-row">
                    <img 
                      src={series.posterUrl || series.fallbackPoster} 
                      alt={series.title}
                      className="item-poster"
                    />
                    <div className="item-details">
                      <span className="badge badge-red">{series.franchise}</span>
                      <h4 className="item-name">{series.title}</h4>
                      <p className="item-sub">
                        {series.year} • {series.quality || '1080p'} • ★ {series.rating}
                      </p>
                    </div>
                    <div className="item-actions">
                      <button 
                        className="btn-primary mini-btn"
                        onClick={() => {
                          onClose();
                          onSelectSeries(series);
                        }}
                      >
                        <Play size={14} fill="#ffffff" />
                        <span>Tonton</span>
                      </button>
                      <button 
                        className="remove-icon-btn"
                        onClick={() => onRemoveBookmark(series.id)}
                        title="Hapus dari favorit"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : (
            /* History Tab */
            history.length === 0 ? (
              <div className="empty-state">
                <History size={44} className="empty-icon" />
                <h4 className="empty-title">Belum ada riwayat menonton</h4>
                <p className="empty-desc">
                  Episode yang kamu tonton akan tersimpan otomatis di sini agar bisa dilanjutkan kapan saja.
                </p>
              </div>
            ) : (
              <div>
                <div className="history-header-actions">
                  <span className="history-summary">
                    {history.length} episode terakhir ditonton
                  </span>
                  <button className="clear-history-link" onClick={onClearHistory}>
                    <Trash2 size={14} />
                    <span>Bersihkan Riwayat</span>
                  </button>
                </div>
                <div className="items-list">
                  {history.map((item, idx) => (
                    <div key={idx} className="item-row">
                      <img 
                        src={item.posterUrl} 
                        alt={item.seriesTitle}
                        className="item-poster"
                      />
                      <div className="item-details">
                        <span className="badge badge-cyan">Eps {item.episodeNumber}</span>
                        <h4 className="item-name">{item.seriesTitle}</h4>
                        <p className="item-sub">{item.episodeTitle}</p>
                        <div className="history-timestamp">
                          <Clock size={12} />
                          <span>
                            {new Date(item.watchedAt).toLocaleDateString('id-ID', {
                              day: 'numeric',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          )}
        </div>
      </div>

      <style>{`
        .watchlist-modal-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(3, 5, 8, 0.85);
          backdrop-filter: blur(12px);
          z-index: 1100;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
        }
        .watchlist-modal-card {
          background: #0d121d;
          border: 1px solid var(--border-light);
          border-radius: var(--radius-lg);
          width: 100%;
          max-width: 680px;
          max-height: 85vh;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          box-shadow: 0 20px 50px rgba(0, 0, 0, 0.8);
        }
        .modal-top-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 14px 20px;
          border-bottom: 1px solid var(--border-subtle);
          background: rgba(16, 23, 38, 0.8);
        }
        .tabs-list {
          display: flex;
          gap: 8px;
        }
        .tab-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 16px;
          border-radius: var(--radius-full);
          font-size: 0.88rem;
          font-weight: 600;
          color: var(--text-secondary);
        }
        .tab-btn.active {
          background: rgba(255, 32, 78, 0.18);
          border: 1px solid rgba(255, 32, 78, 0.4);
          color: #ffffff;
        }
        .modal-close-btn {
          color: var(--text-muted);
          width: 32px;
          height: 32px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .modal-close-btn:hover {
          color: #ffffff;
          background: rgba(255, 255, 255, 0.1);
        }
        .modal-tab-content {
          padding: 20px;
          overflow-y: auto;
          flex: 1;
        }
        .empty-state {
          padding: 40px 20px;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        .empty-icon {
          color: var(--text-muted);
          margin-bottom: 12px;
          opacity: 0.5;
        }
        .empty-title {
          font-size: 1.1rem;
          margin-bottom: 6px;
          color: var(--text-main);
        }
        .empty-desc {
          font-size: 0.85rem;
          color: var(--text-muted);
          max-width: 380px;
          line-height: 1.5;
        }
        .history-header-actions {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 14px;
          padding-bottom: 10px;
          border-bottom: 1px solid var(--border-subtle);
        }
        .history-summary {
          font-size: 0.82rem;
          color: var(--text-muted);
        }
        .clear-history-link {
          display: flex;
          align-items: center;
          gap: 5px;
          font-size: 0.8rem;
          color: #f87171;
        }
        .clear-history-link:hover {
          text-decoration: underline;
        }
        .items-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .item-row {
          display: flex;
          align-items: center;
          gap: 14px;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid var(--border-subtle);
          padding: 10px 14px;
          border-radius: var(--radius-md);
        }
        .item-poster {
          width: 50px;
          height: 70px;
          object-fit: cover;
          border-radius: 6px;
        }
        .item-details {
          flex: 1;
          min-width: 0;
        }
        .item-name {
          font-size: 0.95rem;
          font-weight: 700;
          color: var(--text-main);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          margin: 3px 0 2px;
        }
        .item-sub {
          font-size: 0.78rem;
          color: var(--text-muted);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .history-timestamp {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 0.72rem;
          color: var(--accent-cyan);
          margin-top: 3px;
        }
        .item-actions {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .mini-btn {
          padding: 6px 14px;
          font-size: 0.8rem;
        }
        .remove-icon-btn {
          color: var(--text-muted);
          padding: 8px;
          border-radius: var(--radius-sm);
        }
        .remove-icon-btn:hover {
          color: #f87171;
          background: rgba(239, 68, 68, 0.1);
        }
        @media (max-width: 640px) {
          .watchlist-modal-backdrop {
            padding: 0;
            align-items: flex-start;
          }
          .watchlist-modal-card {
            border-radius: 0;
            width: 100vw;
            height: 100vh;
            max-height: 100vh;
            border: none;
          }
          .modal-tab-content {
            padding: 14px 12px calc(80px + env(safe-area-inset-bottom, 0px));
          }
          .tab-btn {
            padding: 6px 12px;
            font-size: 0.8rem;
          }
        }
      `}</style>
    </div>
  );
}
