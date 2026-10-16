import React from 'react';
import { Play, Star, Bookmark, BookmarkCheck, Calendar, Tv } from 'lucide-react';

export default function SeriesCard({ 
  series, 
  onSelectSeries, 
  onPlayEpisode, 
  isBookmarked, 
  onToggleBookmark 
}) {
  const bookmarked = isBookmarked(series.id);
  const posterImage = series.posterUrl || series.fallbackPoster;

  // Franchise color helper
  const getBadgeClass = (franchise) => {
    switch (franchise) {
      case 'Kamen Rider': return 'badge-red';
      case 'Super Sentai': return 'badge-gold';
      case 'Ultraman': return 'badge-cyan';
      case 'Garo': return 'badge-purple';
      default: return 'badge-green';
    }
  };

  return (
    <div className="series-card" onClick={() => onSelectSeries(series)}>
      {/* Poster Image & Overlay */}
      <div className="poster-wrapper">
        <img 
          src={posterImage} 
          alt={series.title}
          loading="lazy"
          className="poster-img"
          onError={(e) => {
            e.target.onerror = null;
            if (series.fallbackPoster && !e.target.src.includes(series.fallbackPoster)) {
              e.target.src = series.fallbackPoster;
            } else {
              e.target.src = 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=600&auto=format&fit=crop&q=80';
            }
          }}
        />

        {/* Top Badges */}
        <div className="card-top-badges">
          <span className={`badge ${getBadgeClass(series.franchise)}`}>
            {series.franchise}
          </span>
          <div className="card-rating-badge">
            <Star size={12} fill="var(--accent-gold)" color="var(--accent-gold)" />
            <span>{series.rating}</span>
          </div>
        </div>

        {/* Bottom Tag Badges (Status & Quality) */}
        <div className="card-bottom-tags">
          <span className="mini-tag">{series.quality || '1080p'}</span>
          <span className="mini-tag tag-sub">Sub Indo</span>
        </div>

        {/* Hover Action Overlay */}
        <div className="card-hover-overlay">
          <button 
            className="card-play-btn"
            onClick={(e) => {
              e.stopPropagation();
              onPlayEpisode(series, series.episodes?.[0] || { epNumber: 1, title: 'Episode 1' });
            }}
            title="Tonton Sekarang"
          >
            <Play size={22} fill="#ffffff" />
          </button>

          <button 
            className={`card-bookmark-btn ${bookmarked ? 'active' : ''}`}
            onClick={(e) => {
              e.stopPropagation();
              onToggleBookmark(series);
            }}
            title={bookmarked ? "Hapus dari Favorit" : "Simpan ke Favorit"}
          >
            {bookmarked ? (
              <BookmarkCheck size={18} color="var(--accent-cyan)" />
            ) : (
              <Bookmark size={18} />
            )}
          </button>
        </div>
      </div>

      {/* Series Info */}
      <div className="card-info">
        <h3 className="card-title" title={series.title}>{series.title}</h3>
        {series.japaneseTitle && (
          <p className="card-jp-title">{series.japaneseTitle}</p>
        )}
        <div className="card-meta">
          <span className="card-meta-item">
            <Calendar size={13} />
            {series.year}
          </span>
          <span className="dot-sep" />
          <span className="card-meta-item">
            <Tv size={13} />
            {series.status === 'Tamat' ? `${series.totalEpisodes} Eps` : `Eps ${series.currentEpisode}`}
          </span>
        </div>
      </div>

      <style>{`
        .series-card {
          position: relative;
          background: rgba(16, 23, 38, 0.6);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-md);
          overflow: hidden;
          transition: all var(--transition-normal);
          cursor: pointer;
          display: flex;
          flex-direction: column;
        }
        .series-card:hover {
          transform: translateY(-6px);
          border-color: rgba(255, 32, 78, 0.4);
          box-shadow: 0 12px 30px rgba(0, 0, 0, 0.6), 0 0 20px rgba(255, 32, 78, 0.2);
        }
        .poster-wrapper {
          position: relative;
          aspect-ratio: 2 / 3;
          width: 100%;
          overflow: hidden;
          background: #0f1523;
        }
        .poster-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.4s ease;
        }
        .series-card:hover .poster-img {
          transform: scale(1.06);
        }
        .card-top-badges {
          position: absolute;
          top: 10px;
          left: 10px;
          right: 10px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          z-index: 2;
        }
        .card-rating-badge {
          display: flex;
          align-items: center;
          gap: 4px;
          background: rgba(10, 14, 23, 0.85);
          backdrop-filter: blur(8px);
          border: 1px solid rgba(255, 183, 3, 0.3);
          color: var(--accent-gold);
          font-size: 0.75rem;
          font-weight: 700;
          padding: 2px 7px;
          border-radius: var(--radius-sm);
        }
        .card-bottom-tags {
          position: absolute;
          bottom: 10px;
          left: 10px;
          display: flex;
          gap: 5px;
          z-index: 2;
        }
        .mini-tag {
          background: rgba(9, 13, 22, 0.88);
          backdrop-filter: blur(8px);
          border: 1px solid var(--border-light);
          font-size: 0.65rem;
          font-weight: 700;
          padding: 2px 6px;
          border-radius: 4px;
          color: var(--text-secondary);
        }
        .tag-sub {
          background: rgba(0, 242, 254, 0.15);
          color: var(--accent-cyan);
          border-color: rgba(0, 242, 254, 0.35);
        }
        .card-hover-overlay {
          position: absolute;
          inset: 0;
          background: rgba(5, 7, 10, 0.6);
          backdrop-filter: blur(3px);
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          opacity: 0;
          pointer-events: none;
          transition: opacity var(--transition-fast);
          z-index: 3;
        }
        .series-card:hover .card-hover-overlay {
          opacity: 1;
          pointer-events: auto;
        }
        .card-play-btn {
          width: 50px;
          height: 50px;
          border-radius: 50%;
          background: linear-gradient(135deg, var(--accent-red) 0%, #b5179e 100%);
          color: #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 0 20px var(--accent-red-glow);
          transform: scale(0.85);
          transition: all var(--transition-bounce);
        }
        .series-card:hover .card-play-btn {
          transform: scale(1);
        }
        .card-play-btn:hover {
          transform: scale(1.12);
        }
        .card-bookmark-btn {
          width: 38px;
          height: 38px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.12);
          border: 1px solid var(--border-light);
          color: #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all var(--transition-fast);
        }
        .card-bookmark-btn:hover {
          background: rgba(255, 255, 255, 0.25);
          transform: scale(1.08);
        }
        .card-bookmark-btn.active {
          background: rgba(0, 242, 254, 0.2);
          border-color: var(--accent-cyan);
        }
        .card-info {
          padding: 14px 14px 16px;
          display: flex;
          flex-direction: column;
          flex: 1;
        }
        .card-title {
          font-size: 1rem;
          font-weight: 700;
          color: var(--text-main);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          margin-bottom: 2px;
        }
        .card-jp-title {
          font-size: 0.75rem;
          color: var(--text-muted);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          margin-bottom: 8px;
        }
        .card-meta {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.8rem;
          color: var(--text-secondary);
          margin-top: auto;
        }
        .card-meta-item {
          display: flex;
          align-items: center;
          gap: 5px;
        }
        .dot-sep {
          width: 3px;
          height: 3px;
          border-radius: 50%;
          background: var(--text-muted);
        }
        @media (max-width: 640px) {
          .card-info {
            padding: 8px 10px 10px;
          }
          .card-title {
            font-size: 0.88rem;
          }
          .card-jp-title {
            display: none;
          }
          .card-top-badges {
            top: 6px;
            left: 6px;
            right: 6px;
          }
          .card-bottom-tags {
            bottom: 6px;
            left: 6px;
          }
          .badge {
            font-size: 0.65rem;
            padding: 2px 6px;
          }
          .card-rating-badge {
            font-size: 0.7rem;
            padding: 2px 6px;
          }
          .card-meta {
            font-size: 0.74rem;
          }
        }
      `}</style>
    </div>
  );
}
