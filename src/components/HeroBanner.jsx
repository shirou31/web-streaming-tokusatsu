import React, { useState, useEffect } from 'react';
import { 
  Play, 
  Info, 
  Bookmark, 
  BookmarkCheck, 
  Star, 
  ChevronLeft, 
  ChevronRight, 
  Calendar, 
  Tv,
  Sparkles
} from 'lucide-react';

export default function HeroBanner({ 
  featuredItems, 
  onPlayEpisode, 
  onSelectSeries, 
  isBookmarked, 
  onToggleBookmark 
}) {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (!featuredItems || featuredItems.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % featuredItems.length);
    }, 7000);
    return () => clearInterval(interval);
  }, [featuredItems]);

  if (!featuredItems || featuredItems.length === 0) return null;

  const current = featuredItems[currentIndex];
  const bookmarked = isBookmarked(current.id);

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % featuredItems.length);
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + featuredItems.length) % featuredItems.length);
  };

  // Safe backdrop image fallback
  const heroImage = current.backdropUrl || current.fallbackBackdrop;

  return (
    <section className="hero-banner">
      {/* Background Media with Multi-Layer Gradients */}
      <div className="hero-bg-container">
        <img 
          src={heroImage} 
          alt={current.title}
          className="hero-backdrop-img"
          onError={(e) => {
            if (e.target.src !== current.fallbackBackdrop) {
              e.target.src = current.fallbackBackdrop;
            }
          }}
        />
        <div className="hero-gradient-left" />
        <div className="hero-gradient-bottom" />
        <div className="hero-gradient-top" />
      </div>

      {/* Hero Content */}
      <div className="hero-content-wrapper container">
        <div className="hero-info-box">
          {/* Franchise Tag & Highlight */}
          <div className="hero-meta-header">
            <span className="badge badge-red">
              <Sparkles size={13} />
              {current.bannerHeadline || current.franchise}
            </span>
            <span className="badge badge-cyan">{current.quality || '1080p FHD'}</span>
            <span className="badge badge-green">Sub Indo</span>
          </div>

          {/* Title & Japanese Subtitle */}
          <h1 className="hero-title">{current.title}</h1>
          {current.japaneseTitle && (
            <p className="hero-jp-title">{current.japaneseTitle}</p>
          )}

          {/* Meta Details: Rating, Year, Status, Episodes */}
          <div className="hero-meta-row">
            <div className="meta-rating">
              <Star size={16} fill="var(--accent-gold)" color="var(--accent-gold)" />
              <span className="rating-value">{current.rating}</span>
              <span className="rating-scale">/ 10</span>
            </div>
            <div className="meta-divider" />
            <div className="meta-item">
              <Calendar size={15} />
              <span>{current.year}</span>
            </div>
            <div className="meta-divider" />
            <div className="meta-item">
              <Tv size={15} />
              <span>Eps {current.currentEpisode} / {current.totalEpisodes || '?'}</span>
            </div>
            <div className="meta-divider" />
            <span className="meta-status">{current.status}</span>
          </div>

          {/* Tags */}
          <div className="hero-tags">
            {current.tags?.slice(0, 4).map((tag, idx) => (
              <span key={idx} className="hero-tag-chip">#{tag}</span>
            ))}
          </div>

          {/* Synopsis */}
          <p className="hero-synopsis">
            {current.synopsis}
          </p>

          {/* CTAs */}
          <div className="hero-actions">
            <button 
              id="hero-play-btn"
              className="btn-primary"
              onClick={() => onPlayEpisode(current, current.episodes?.[0] || { epNumber: 1, title: 'Episode 1' })}
            >
              <Play size={18} fill="#ffffff" />
              <span>Nonton Episode Terbaru</span>
            </button>

            <button 
              id="hero-episodes-btn"
              className="btn-secondary"
              onClick={() => onSelectSeries(current)}
            >
              <Info size={18} />
              <span>Daftar Episode</span>
            </button>

            <button 
              id="hero-bookmark-btn"
              className={`btn-icon ${bookmarked ? 'active-bookmark' : ''}`}
              onClick={() => onToggleBookmark(current)}
              title={bookmarked ? "Hapus dari Favorit" : "Simpan ke Favorit"}
            >
              {bookmarked ? (
                <BookmarkCheck size={20} color="var(--accent-cyan)" />
              ) : (
                <Bookmark size={20} />
              )}
            </button>
          </div>
        </div>

        {/* Slide Indicators / Thumbnails */}
        <div className="hero-carousel-nav">
          <div className="carousel-arrows">
            <button className="carousel-arrow-btn" onClick={handlePrev} title="Sebelumnya">
              <ChevronLeft size={20} />
            </button>
            <button className="carousel-arrow-btn" onClick={handleNext} title="Selanjutnya">
              <ChevronRight size={20} />
            </button>
          </div>

          <div className="carousel-indicators">
            {featuredItems.map((item, idx) => (
              <button
                key={item.id}
                className={`indicator-dot ${idx === currentIndex ? 'active' : ''}`}
                onClick={() => setCurrentIndex(idx)}
                title={item.title}
              >
                <span className="dot-progress" />
              </button>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        .hero-banner {
          position: relative;
          min-height: 640px;
          display: flex;
          align-items: center;
          margin-top: -85px;
          padding-top: 110px;
          padding-bottom: 60px;
          overflow: hidden;
        }
        .hero-bg-container {
          position: absolute;
          inset: 0;
          z-index: 1;
        }
        .hero-backdrop-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          object-position: center 25%;
          filter: brightness(0.75) contrast(1.1);
          transform: scale(1.02);
          transition: transform 6s cubic-bezier(0.25, 1, 0.5, 1);
        }
        .hero-gradient-left {
          position: absolute;
          inset: 0;
          background: linear-gradient(
            90deg, 
            var(--bg-darkest) 0%, 
            rgba(5, 7, 10, 0.95) 30%, 
            rgba(5, 7, 10, 0.6) 65%, 
            transparent 100%
          );
        }
        .hero-gradient-bottom {
          position: absolute;
          inset: 0;
          background: linear-gradient(
            0deg, 
            var(--bg-darkest) 0%, 
            rgba(5, 7, 10, 0.8) 25%, 
            transparent 60%
          );
        }
        .hero-gradient-top {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 140px;
          background: linear-gradient(180deg, var(--bg-darkest) 0%, transparent 100%);
        }
        .hero-content-wrapper {
          position: relative;
          z-index: 2;
          width: 100%;
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
        }
        .hero-info-box {
          max-width: 680px;
          animation: fadeIn 0.6s ease-out;
        }
        .hero-meta-header {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 14px;
          flex-wrap: wrap;
        }
        .hero-title {
          font-size: 3.2rem;
          font-weight: 800;
          line-height: 1.1;
          margin-bottom: 6px;
          text-shadow: 0 4px 20px rgba(0, 0, 0, 0.8);
          background: linear-gradient(180deg, #ffffff 30%, #e2e8f0 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .hero-jp-title {
          font-family: var(--font-display);
          font-size: 1.1rem;
          color: var(--accent-red);
          letter-spacing: 0.1em;
          margin-bottom: 16px;
          font-weight: 600;
        }
        .hero-meta-row {
          display: flex;
          align-items: center;
          gap: 12px;
          font-size: 0.9rem;
          color: var(--text-secondary);
          margin-bottom: 14px;
        }
        .meta-rating {
          display: flex;
          align-items: center;
          gap: 5px;
          background: rgba(255, 183, 3, 0.12);
          border: 1px solid rgba(255, 183, 3, 0.25);
          padding: 3px 8px;
          border-radius: var(--radius-sm);
        }
        .rating-value {
          font-weight: 800;
          color: var(--accent-gold);
        }
        .rating-scale {
          font-size: 0.75rem;
          color: var(--text-muted);
        }
        .meta-divider {
          width: 4px;
          height: 4px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.2);
        }
        .meta-item {
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .meta-status {
          background: rgba(16, 185, 129, 0.15);
          color: #34d399;
          font-weight: 700;
          font-size: 0.78rem;
          padding: 2px 7px;
          border-radius: var(--radius-sm);
        }
        .hero-tags {
          display: flex;
          gap: 8px;
          margin-bottom: 16px;
          flex-wrap: wrap;
        }
        .hero-tag-chip {
          font-size: 0.78rem;
          color: var(--text-muted);
          background: rgba(255, 255, 255, 0.05);
          padding: 2px 8px;
          border-radius: var(--radius-sm);
        }
        .hero-synopsis {
          font-size: 0.98rem;
          color: var(--text-secondary);
          line-height: 1.6;
          margin-bottom: 26px;
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
          text-shadow: 0 2px 8px rgba(0, 0, 0, 0.6);
        }
        .hero-actions {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
        }
        .active-bookmark {
          border-color: var(--accent-cyan);
          background: rgba(0, 242, 254, 0.15);
        }
        .hero-carousel-nav {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 16px;
          padding-bottom: 10px;
        }
        .carousel-arrows {
          display: flex;
          gap: 8px;
        }
        .carousel-arrow-btn {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(16, 23, 38, 0.7);
          backdrop-filter: blur(10px);
          border: 1px solid var(--border-light);
          color: #ffffff;
        }
        .carousel-arrow-btn:hover {
          background: var(--accent-red);
          border-color: var(--accent-red);
          transform: scale(1.08);
        }
        .carousel-indicators {
          display: flex;
          gap: 8px;
        }
        .indicator-dot {
          width: 32px;
          height: 4px;
          border-radius: 2px;
          background: rgba(255, 255, 255, 0.2);
          overflow: hidden;
          position: relative;
        }
        .indicator-dot.active {
          background: var(--accent-red);
          box-shadow: 0 0 10px var(--accent-red);
          width: 48px;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @media (max-width: 900px) {
          .hero-title {
            font-size: 2.3rem;
          }
          .hero-carousel-nav {
            display: none;
          }
          .hero-banner {
            min-height: 540px;
          }
        }
        @media (max-width: 600px) {
          .hero-title {
            font-size: 1.8rem;
          }
          .hero-actions .btn-primary,
          .hero-actions .btn-secondary {
            font-size: 0.85rem;
            padding: 9px 14px;
          }
        }

        /* Light Theme Overrides for Hero Banner */
        html[data-theme="light"] .hero-gradient-left {
          background: linear-gradient(
            90deg, 
            rgba(241, 245, 249, 0.98) 0%, 
            rgba(241, 245, 249, 0.92) 35%, 
            rgba(241, 245, 249, 0.5) 65%, 
            transparent 100%
          ) !important;
        }
        html[data-theme="light"] .hero-gradient-bottom {
          background: linear-gradient(
            0deg, 
            #f1f5f9 0%, 
            rgba(241, 245, 249, 0.85) 30%, 
            transparent 70%
          ) !important;
        }
        html[data-theme="light"] .hero-gradient-top {
          background: linear-gradient(180deg, rgba(241, 245, 249, 0.9) 0%, transparent 100%) !important;
        }
        html[data-theme="light"] .hero-title {
          background: linear-gradient(180deg, #0f172a 30%, #334155 100%) !important;
          -webkit-background-clip: text !important;
          -webkit-text-fill-color: transparent !important;
          text-shadow: none !important;
        }
        html[data-theme="light"] .hero-synopsis {
          color: #334155 !important;
          text-shadow: 0 1px 2px rgba(255, 255, 255, 0.9) !important;
        }
        html[data-theme="light"] .hero-meta-row {
          color: #475569 !important;
        }
        html[data-theme="light"] .hero-tag-chip {
          background: #e2e8f0 !important;
          color: #334155 !important;
          border: 1px solid #cbd5e1 !important;
        }
        html[data-theme="light"] .meta-divider {
          background: rgba(15, 23, 42, 0.2) !important;
        }
        html[data-theme="light"] .btn-secondary {
          background: #ffffff !important;
          border-color: #cbd5e1 !important;
          color: #0f172a !important;
          box-shadow: 0 2px 6px rgba(15, 23, 42, 0.08) !important;
        }
        html[data-theme="light"] .btn-secondary:hover {
          background: #f1f5f9 !important;
          border-color: #94a3b8 !important;
        }
        html[data-theme="light"] .btn-icon {
          background: #ffffff !important;
          border-color: #cbd5e1 !important;
          color: #0f172a !important;
          box-shadow: 0 2px 6px rgba(15, 23, 42, 0.08) !important;
        }
        html[data-theme="light"] .carousel-arrow-btn {
          background: rgba(255, 255, 255, 0.88) !important;
          border-color: #cbd5e1 !important;
          color: #0f172a !important;
          box-shadow: 0 4px 12px rgba(15, 23, 42, 0.08) !important;
        }
        html[data-theme="light"] .carousel-arrow-btn:hover {
          background: var(--accent-red) !important;
          color: #ffffff !important;
          border-color: var(--accent-red) !important;
        }
        html[data-theme="light"] .indicator-dot {
          background: rgba(15, 23, 42, 0.15) !important;
        }
        html[data-theme="light"] .indicator-dot.active {
          background: var(--accent-red) !important;
        }
      `}</style>
    </section>
  );
}
