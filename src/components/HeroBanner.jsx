import React, { useState, useEffect } from 'react';
import { 
  Play, 
  Info, 
  Plus, 
  Check, 
  ChevronRight
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
    }, 9000);
    return () => clearInterval(interval);
  }, [featuredItems]);

  if (!featuredItems || featuredItems.length === 0) return null;

  const current = featuredItems[currentIndex] || featuredItems[0];
  const bookmarked = isBookmarked ? isBookmarked(current.id) : false;

  // Compute a tailored cinematic gradient for the hero if backdrop is missing or to tint
  const hueList = [352, 188, 28, 236, 168, 262];
  const activeHue = hueList[currentIndex % hueList.length];

  const heroAmbientBg = `radial-gradient(60% 80% at 75% 35%, hsla(${activeHue}, 80%, 38%, 0.42) 0%, transparent 72%), conic-gradient(from 198deg at 88% -8%, transparent 0deg, rgba(255,255,255,0.12) 16deg, transparent 34deg), linear-gradient(115deg, hsl(${activeHue}, 60%, 10%) 0%, #0B0B0C 68%)`;

  const heroPosterArt = current.posterUrl || current.backdropUrl || `linear-gradient(145deg, hsl(${activeHue}, 70%, 35%) 0%, #0B0B0C 85%)`;

  return (
    <section id="beranda" className="sorot-hero-section" style={{ background: heroAmbientBg }}>
      {/* Background Dim & Bottom Fade Layers */}
      <div className="hero-overlay-dim" aria-hidden="true" />
      <div className="hero-overlay-bottom" aria-hidden="true" />

      {/* Floating 3D Tilted Poster (Hidden on small mobile) */}
      <div 
        className="hero-tilted-poster" 
        aria-hidden="true"
        onClick={() => onSelectSeries && onSelectSeries(current.rawProduction || current)}
        title={current.title}
      >
        <img 
          src={current.posterUrl || current.fallbackPoster || current.backdropUrl} 
          alt={current.title} 
          className="tilted-poster-img"
          onError={(e) => {
            e.target.style.display = 'none';
          }}
        />
        <div className="tilted-poster-shade" />
        <div className="tilted-poster-caption disp">{current.title}</div>
      </div>

      {/* Main Hero Content & Spotlight Cards */}
      <div className="hero-content-grid">
        {/* Left Column: Details & Buttons */}
        <div className="hero-details-col">
          <div className="hero-eyebrow-row">
            <span className="eyebrow-red-bar" aria-hidden="true" />
            <span className="eyebrow-text">
              {current.bannerHeadline || (current.franchise ? `SERIAL ${current.franchise.toUpperCase()}` : 'SERIAL EKSKLUSIF')}
            </span>
          </div>

          <h1 className="hero-headline disp">{current.title}</h1>

          {/* Meta line: Age badge, type, year, genre */}
          <div className="hero-meta-strip">
            <span className="hero-age-tag">16+</span>
            <span className="hero-type-info">
              {current.type === 'movie' ? 'Film' : 'Serial'} • {current.totalEpisodes ? `${current.totalEpisodes} Episode` : 'Lengkap'} • {current.year || 2026}
            </span>
            <span className="meta-bullet" aria-hidden="true" />
            <span className="hero-genre-text">
              {current.tags?.join(', ') || 'Aksi • Sci-Fi • Henshin'}
            </span>
          </div>

          <p className="hero-description">
            {current.synopsis || 'Saksikan pertarungan epik pahlawan keadilan dengan efek visual 1440p 2K QHD, subtitle Indonesia resmi, dan kualitas audio jernih.'}
          </p>

          <div className="hero-actions-row">
            <button 
              type="button" 
              className="btn btn-w hero-play-btn"
              onClick={() => onPlayEpisode && onPlayEpisode(current.rawProduction || current, { id: '0192a3f0-2222-7000-8000-000000000001' })}
            >
              <Play size={20} fill="currentColor" />
              <span>Putar</span>
            </button>

            <button 
              type="button" 
              className="btn btn-g hero-info-btn"
              onClick={() => onSelectSeries && onSelectSeries(current.rawProduction || current)}
            >
              <Info size={20} />
              <span>Info Selengkapnya</span>
            </button>

            <button 
              type="button" 
              className="ibtn hero-bookmark-ibtn" 
              onClick={() => onToggleBookmark && onToggleBookmark(current.rawProduction || current)}
              aria-label={bookmarked ? "Hapus dari Daftar Saya" : "Tambah ke Daftar Saya"}
              title={bookmarked ? "Tersimpan di Daftar Saya" : "Simpan ke Daftar Saya"}
            >
              {bookmarked ? <Check size={22} color="#10b981" /> : <Plus size={22} />}
            </button>
          </div>
        </div>

        {/* Right Column: "Sorotan Hari Ini" Interactive Vertical Switcher */}
        <div className="hero-spotlight-col">
          <div className="spotlight-heading">SOROTAN HARI INI</div>
          <div className="spotlight-cards-stack">
            {featuredItems.slice(0, 4).map((item, idx) => {
              const isActive = idx === currentIndex;
              return (
                <button
                  key={item.id || idx}
                  type="button"
                  className={`spotlight-mini-card ${isActive ? 'active' : ''}`}
                  onClick={() => setCurrentIndex(idx)}
                >
                  <div 
                    className="spotlight-thumb-wrap" 
                    style={{ background: 'linear-gradient(135deg, #7A050B 0%, #1A0002 100%)' }}
                  >
                    <img 
                      src={item.posterUrl || item.backdropUrl || item.fallbackPoster} 
                      alt="" 
                      className="spotlight-thumb-img" 
                      onError={(e) => { e.currentTarget.style.display = 'none'; }}
                    />
                    <div className="spotlight-thumb-overlay" />
                  </div>
                  <div className="spotlight-text-info">
                    <h4 className="spotlight-item-title disp">{item.title}</h4>
                    <span className="spotlight-item-sub">
                      {item.type === 'movie' ? 'Film' : 'Serial'} • {item.tags?.[0] || 'Aksi'}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <style>{`
        .sorot-hero-section {
          position: relative;
          min-height: 720px;
          display: flex;
          flex-direction: column;
          justify-content: flex-end;
          padding: 130px clamp(16px, 4vw, 56px) 56px;
          overflow: hidden;
          transition: background 0.8s ease;
        }

        .hero-overlay-dim {
          position: absolute;
          inset: 0;
          background: linear-gradient(90deg, rgba(11, 11, 12, 0.94) 0%, rgba(11, 11, 12, 0.6) 45%, rgba(11, 11, 12, 0) 78%);
          pointer-events: none;
        }
        .hero-overlay-bottom {
          position: absolute;
          left: 0;
          right: 0;
          bottom: 0;
          height: 260px;
          background: linear-gradient(0deg, #0B0B0C 0%, rgba(11, 11, 12, 0) 100%);
          pointer-events: none;
        }

        .hero-tilted-poster {
          position: absolute;
          right: 30%;
          top: 130px;
          width: 270px;
          height: 405px;
          border-radius: var(--radius-lg);
          transform: rotate(3deg);
          box-shadow: 0 30px 80px rgba(0, 0, 0, 0.8), 0 0 40px rgba(229, 9, 20, 0.2);
          overflow: hidden;
          cursor: pointer;
          transition: transform var(--transition-bounce), box-shadow var(--transition-normal);
          z-index: 2;
        }
        .hero-tilted-poster:hover {
          transform: rotate(0deg) scale(1.04) translateY(-8px);
          box-shadow: 0 40px 100px rgba(0, 0, 0, 0.9), 0 0 50px rgba(229, 9, 20, 0.4);
        }
        .tilted-poster-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .tilted-poster-shade {
          position: absolute;
          inset: 0;
          background: linear-gradient(0deg, rgba(0, 0, 0, 0.82) 0%, rgba(0, 0, 0, 0) 58%);
        }
        .tilted-poster-caption {
          position: absolute;
          left: 18px;
          right: 18px;
          bottom: 18px;
          font-size: 26px;
          font-weight: 800;
          line-height: 1.05;
          letter-spacing: -0.02em;
          color: #FFFFFF;
        }

        .hero-content-grid {
          position: relative;
          z-index: 3;
          display: flex;
          flex-wrap: wrap;
          align-items: flex-end;
          justify-content: space-between;
          gap: 40px;
          max-width: 1440px;
          margin: 0 auto;
          width: 100%;
        }

        .hero-details-col {
          flex: 999 1 420px;
          max-width: 620px;
        }

        .hero-eyebrow-row {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 14px;
        }
        .eyebrow-red-bar {
          width: 4px;
          height: 18px;
          border-radius: 2px;
          background: var(--accent-red);
          box-shadow: 0 0 10px var(--accent-red);
        }
        .eyebrow-text {
          font-size: 13px;
          font-weight: 800;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: #F2F2F4;
        }

        .hero-headline {
          font-size: clamp(38px, 6vw, 76px);
          font-weight: 800;
          line-height: 0.98;
          letter-spacing: -0.03em;
          margin-bottom: 16px;
          color: #FFFFFF;
        }

        .hero-meta-strip {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 12px;
          font-size: 15px;
          color: #D2D2D6;
          margin-bottom: 18px;
        }
        .hero-age-tag {
          padding: 2px 8px;
          border: 1px solid rgba(255, 255, 255, 0.5);
          border-radius: 4px;
          font-size: 13px;
          font-weight: 700;
          color: #FFFFFF;
        }
        .meta-bullet {
          width: 4px;
          height: 4px;
          border-radius: 50%;
          background: #8E8E94;
        }
        .hero-genre-text {
          color: #E2E2E5;
        }

        .hero-description {
          font-size: 17px;
          line-height: 1.55;
          color: #DADADD;
          margin-bottom: 28px;
          max-width: 540px;
        }

        .hero-actions-row {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 12px;
        }
        .hero-play-btn {
          min-width: 140px;
        }
        .hero-info-btn {
          min-width: 190px;
        }

        /* Right Column: "Sorotan Hari Ini" */
        .hero-spotlight-col {
          flex: 1 1 300px;
          max-width: 340px;
        }
        .spotlight-heading {
          font-size: 12px;
          font-weight: 800;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: #B8B8BC;
          margin-bottom: 10px;
        }
        .spotlight-cards-stack {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .spotlight-mini-card {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 8px;
          border-radius: var(--radius-md);
          border: 1.5px solid rgba(255, 255, 255, 0.12);
          background: rgba(18, 18, 20, 0.65);
          backdrop-filter: blur(8px);
          cursor: pointer;
          text-align: left;
          transition: all var(--transition-fast);
        }
        .spotlight-mini-card:hover {
          background: rgba(255, 255, 255, 0.1);
          border-color: rgba(255, 255, 255, 0.3);
        }
        .spotlight-mini-card.active {
          border-color: var(--accent-red);
          background: rgba(229, 9, 20, 0.22);
          box-shadow: 0 4px 20px rgba(229, 9, 20, 0.25);
        }
        .spotlight-thumb-wrap {
          flex: 0 0 auto;
          width: 96px;
          height: 56px;
          border-radius: 6px;
          overflow: hidden;
          position: relative;
        }
        .spotlight-thumb-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .spotlight-thumb-overlay {
          position: absolute;
          inset: 0;
          background: rgba(0, 0, 0, 0.2);
        }
        .spotlight-text-info {
          min-width: 0;
        }
        .spotlight-item-title {
          font-size: 15px;
          font-weight: 700;
          line-height: 1.2;
          color: #FFFFFF;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .spotlight-item-sub {
          font-size: 12px;
          color: #B8B8BC;
          display: block;
          margin-top: 2px;
        }

        @media (max-width: 1280px) {
          .hero-tilted-poster {
            display: none;
          }
        }

        @media (max-width: 768px) {
          .sorot-hero-section {
            padding: 100px 18px 40px;
            min-height: 580px;
          }
          .hero-spotlight-col {
            display: none;
          }
          .hero-headline {
            font-size: 38px;
          }
          .hero-description {
            font-size: 15px;
          }
          .hero-play-btn, .hero-info-btn {
            flex: 1;
            height: 48px;
            font-size: 15px;
          }
        }
      `}</style>
    </section>
  );
}
