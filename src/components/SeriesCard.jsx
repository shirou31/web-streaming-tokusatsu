import React from 'react';
import { Play, Bookmark, BookmarkCheck } from 'lucide-react';

export default function SeriesCard({ 
  series, 
  onSelectSeries, 
  onPlayEpisode, 
  isBookmarked, 
  onToggleBookmark 
}) {
  const bookmarked = isBookmarked ? isBookmarked(series.id) : false;
  const posterImage = series.posterUrl || series.fallbackPoster;

  // Determine badge label
  let badgeText = series.status === 'Ongoing' ? 'EPISODE BARU' : (series.year >= 2024 ? 'BARU' : series.franchise);

  return (
    <button 
      type="button" 
      className="card sorot-series-card"
      onClick={() => onSelectSeries && onSelectSeries(series.rawProduction || series)}
    >
      <div className="poster sorot-poster-box">
        <img 
          src={posterImage} 
          alt={series.title}
          loading="lazy"
          className="sorot-poster-img"
          onError={(e) => {
            e.target.onerror = null;
            if (series.fallbackPoster && !e.target.src.includes(series.fallbackPoster)) {
              e.target.src = series.fallbackPoster;
            } else {
              e.target.src = 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=600&auto=format&fit=crop&q=80';
            }
          }}
        />

        {/* Ambient bottom shadow gradient */}
        <div className="sorot-poster-gradient" />

        {/* Top Badges */}
        <div className="sorot-badge-row">
          <span className="sorot-card-badge">{badgeText}</span>
          <button 
            type="button"
            className={`sorot-card-bookmark-btn ${bookmarked ? 'bookmarked' : ''}`}
            onClick={(e) => {
              e.stopPropagation();
              onToggleBookmark && onToggleBookmark(series.rawProduction || series);
            }}
            title={bookmarked ? "Hapus dari Daftar Saya" : "Simpan ke Daftar Saya"}
          >
            {bookmarked ? (
              <BookmarkCheck size={16} color="#10b981" />
            ) : (
              <Bookmark size={16} />
            )}
          </button>
        </div>

        {/* Poster Bottom Title */}
        <div className="sorot-poster-title disp">{series.title}</div>

        {/* Hover Action Overlay */}
        <div className="ov">
          <span 
            className="sorot-play-circle"
            onClick={(e) => {
              e.stopPropagation();
              onPlayEpisode && onPlayEpisode(series.rawProduction || series, series.episodes?.[0] || null);
            }}
            title="Putar Sekarang"
          >
            <Play size={24} fill="#FFFFFF" />
          </span>
        </div>
      </div>

      {/* Series Metadata below poster */}
      <div className="sorot-card-sub">
        {(series.tags?.[0] || series.franchise || 'Aksi')} • {series.year || 2026}
      </div>

      <style>{`
        .sorot-series-card {
          width: 100%;
        }
        .sorot-poster-box {
          width: 100%;
          aspect-ratio: 2 / 3;
          background: #18181B;
          position: relative;
        }
        .sorot-poster-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }
        .sorot-poster-gradient {
          position: absolute;
          inset: 0;
          background: linear-gradient(0deg, rgba(0, 0, 0, 0.82) 0%, rgba(0, 0, 0, 0.2) 45%, rgba(0, 0, 0, 0) 65%);
        }
        .sorot-badge-row {
          position: absolute;
          top: 10px;
          left: 10px;
          right: 10px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          z-index: 2;
        }
        .sorot-card-badge {
          padding: 3px 7px;
          border-radius: 4px;
          background: var(--accent-red);
          color: #FFFFFF;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 0.05em;
          text-transform: uppercase;
        }
        .sorot-card-bookmark-btn {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: rgba(0, 0, 0, 0.55);
          backdrop-filter: blur(8px);
          border: 1px solid rgba(255, 255, 255, 0.3);
          color: #FFFFFF;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all var(--transition-fast);
        }
        .sorot-card-bookmark-btn:hover {
          background: rgba(255, 255, 255, 0.2);
          border-color: #FFFFFF;
          transform: scale(1.1);
        }
        .sorot-card-bookmark-btn.bookmarked {
          border-color: #10b981;
          background: rgba(16, 185, 129, 0.2);
        }

        .sorot-poster-title {
          position: absolute;
          left: 12px;
          right: 12px;
          bottom: 12px;
          font-size: 19px;
          font-weight: 800;
          line-height: 1.05;
          letter-spacing: -0.01em;
          color: #FFFFFF;
          z-index: 2;
          overflow: hidden;
          text-overflow: ellipsis;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
        }

        .sorot-play-circle {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 52px;
          height: 52px;
          border-radius: 50%;
          border: 2px solid #FFFFFF;
          background: rgba(0, 0, 0, 0.35);
          cursor: pointer;
          transition: transform var(--transition-bounce), background var(--transition-fast);
        }
        .sorot-play-circle:hover {
          transform: scale(1.15);
          background: var(--accent-red);
          border-color: var(--accent-red);
        }

        .sorot-card-sub {
          font-size: 13px;
          color: #9A9AA0;
          margin-top: 10px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
      `}</style>
    </button>
  );
}
