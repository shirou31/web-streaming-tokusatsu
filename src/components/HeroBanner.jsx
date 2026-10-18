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

  const currentBackdrop = current.backdropUrl || current.fallbackBackdrop || current.posterUrl;
  const currentPoster = current.posterUrl || current.fallbackPoster || current.backdropUrl;

  return (
    <section id="beranda" className="sorot-hero-section" style={{ background: heroAmbientBg }}>
      {/* Dynamic Fullscreen Cinematic Backdrop Architecture */}
      <div className="hero-backdrop-wrapper" aria-hidden="true">
        {/* Glow Ambient Layer (Blurred Backdrop for OLED/HDR ambiance) */}
        <div 
          className="hero-backdrop-glow"
          style={{ backgroundImage: `url(${currentBackdrop})` }}
        />

        {/* Sharp High-Definition Scene Backdrop */}
        <img 
          key={current.id || currentIndex}
          src={currentBackdrop}
          alt=""
          className="hero-backdrop-scene"
          onError={(e) => {
            if (current.fallbackBackdrop && e.currentTarget.src !== current.fallbackBackdrop) {
              e.currentTarget.src = current.fallbackBackdrop;
            } else if (currentPoster && e.currentTarget.src !== currentPoster) {
              e.currentTarget.src = currentPoster;
            }
          }}
        />

        {/* Cinematic Vignette Overlays */}
        {/* 1. Left Gradient Mask: keeps text readable */}
        <div className="hero-vignette-left" />

        {/* 2. Bottom Fade to Content */}
        <div className="hero-vignette-bottom" />

        {/* 3. Top Navbar Shade */}
        <div className="hero-vignette-top" />

        {/* 4. Radial Spotlight Color Wash */}
        <div 
          className="hero-vignette-radial"
          style={{
            background: `radial-gradient(ellipse 70% 60% at 70% 30%, hsla(${activeHue}, 85%, 45%, 0.18) 0%, transparent 70%)`
          }}
        />
      </div>

      {/* Floating 3D Tilted Poster (Hidden on small mobile) */}
      <div 
        className="hero-tilted-poster" 
        aria-hidden="true"
        onClick={() => onSelectSeries && onSelectSeries(current.rawProduction || current)}
        title={current.title}
      >
        <img 
          src={currentPoster} 
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
          min-height: 740px;
          display: flex;
          flex-direction: column;
          justify-content: flex-end;
          padding: 130px clamp(16px, 4vw, 56px) 56px;
          overflow: hidden;
          background-color: #0B0B0C;
          transition: background 0.8s ease;
        }

        /* DYNAMIC CINEMATIC BACKDROP */
        .hero-backdrop-wrapper {
          position: absolute;
          inset: 0;
          z-index: 1;
          overflow: hidden;
          pointer-events: none;
        }

        .hero-backdrop-glow {
          position: absolute;
          inset: -40px;
          background-size: cover;
          background-position: center 25%;
          filter: blur(60px);
          opacity: 0.42;
          transform: scale(1.15);
          transition: background-image 1.2s ease, opacity 0.8s ease;
        }

        .hero-backdrop-scene {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          object-position: center 20%;
          opacity: 0.88;
          filter: contrast(1.08) saturate(1.18) brightness(0.9);
          animation: heroKenBurns 22s ease-in-out infinite alternate;
          transition: opacity 1s cubic-bezier(0.16, 1, 0.3, 1), transform 1.2s cubic-bezier(0.16, 1, 0.3, 1);
        }

        @keyframes heroKenBurns {
          0% {
            transform: scale(1.02) translate(0, 0);
          }
          50% {
            transform: scale(1.07) translate(-1.5%, -1%);
          }
          100% {
            transform: scale(1.03) translate(1%, 0.5%);
          }
        }

        .hero-vignette-left {
          position: absolute;
          inset: 0;
          background: linear-gradient(90deg, 
            #0B0B0C 0%, 
            rgba(11, 11, 12, 0.98) 28%, 
            rgba(11, 11, 12, 0.82) 48%, 
            rgba(11, 11, 12, 0.45) 72%, 
            rgba(11, 11, 12, 0.65) 100%
          );
        }

        .hero-vignette-bottom {
          position: absolute;
          left: 0;
          right: 0;
          bottom: 0;
          height: 360px;
          background: linear-gradient(0deg, 
            #0B0B0C 0%, 
            rgba(11, 11, 12, 0.96) 30%, 
            rgba(11, 11, 12, 0.6) 65%, 
            rgba(11, 11, 12, 0) 100%
          );
        }

        .hero-vignette-top {
          position: absolute;
          left: 0;
          right: 0;
          top: 0;
          height: 200px;
          background: linear-gradient(180deg, 
            rgba(11, 11, 12, 0.95) 0%, 
            rgba(11, 11, 12, 0.5) 50%, 
            rgba(11, 11, 12, 0) 100%
          );
        }

        .hero-vignette-radial {
          position: absolute;
          inset: 0;
          mix-blend-mode: screen;
          pointer-events: none;
        }

        /* 3D TILTED POSTER CARD */
        .hero-tilted-poster {
          position: absolute;
          right: 28%;
          top: 120px;
          width: 280px;
          height: 420px;
          border-radius: var(--radius-lg);
          transform: rotate(3deg);
          box-shadow: 0 35px 90px rgba(0, 0, 0, 0.92), 0 0 50px rgba(229, 9, 20, 0.28), inset 0 0 0 1px rgba(255, 255, 255, 0.18);
          overflow: hidden;
          cursor: pointer;
          transition: transform var(--transition-bounce), box-shadow var(--transition-normal);
          z-index: 2;
        }
        .hero-tilted-poster:hover {
          transform: rotate(0deg) scale(1.05) translateY(-8px);
          box-shadow: 0 45px 110px rgba(0, 0, 0, 0.95), 0 0 60px rgba(229, 9, 20, 0.45), inset 0 0 0 1px rgba(255, 255, 255, 0.3);
        }
        .tilted-poster-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .tilted-poster-shade {
          position: absolute;
          inset: 0;
          background: linear-gradient(0deg, rgba(0, 0, 0, 0.85) 0%, rgba(0, 0, 0, 0) 60%);
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
          text-shadow: 0 2px 10px rgba(0, 0, 0, 0.9);
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
          text-shadow: 0 2px 6px rgba(0, 0, 0, 0.8);
        }

        .hero-headline {
          font-size: clamp(38px, 6vw, 76px);
          font-weight: 800;
          line-height: 0.98;
          letter-spacing: -0.03em;
          margin-bottom: 16px;
          color: #FFFFFF;
          text-shadow: 0 4px 28px rgba(0, 0, 0, 0.95), 0 2px 8px rgba(0, 0, 0, 0.85);
        }

        .hero-meta-strip {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 12px;
          font-size: 15px;
          color: #D2D2D6;
          margin-bottom: 18px;
          text-shadow: 0 2px 6px rgba(0, 0, 0, 0.8);
        }
        .hero-age-tag {
          padding: 2px 8px;
          border: 1px solid rgba(255, 255, 255, 0.5);
          border-radius: 4px;
          font-size: 13px;
          font-weight: 700;
          color: #FFFFFF;
          background: rgba(0, 0, 0, 0.4);
          backdrop-filter: blur(4px);
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
          color: #E2E2E5;
          margin-bottom: 28px;
          max-width: 560px;
          text-shadow: 0 2px 10px rgba(0, 0, 0, 0.9);
        }

        .hero-actions-row {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 12px;
        }
        .hero-play-btn {
          min-width: 140px;
          box-shadow: 0 4px 20px rgba(255, 255, 255, 0.2);
        }
        .hero-info-btn {
          min-width: 190px;
          backdrop-filter: blur(8px);
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
          color: #D4D4D8;
          margin-bottom: 10px;
          text-shadow: 0 2px 6px rgba(0, 0, 0, 0.8);
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
          border: 1.5px solid rgba(255, 255, 255, 0.15);
          background: rgba(14, 14, 18, 0.72);
          backdrop-filter: blur(12px);
          cursor: pointer;
          text-align: left;
          transition: all var(--transition-fast);
        }
        .spotlight-mini-card:hover {
          background: rgba(255, 255, 255, 0.14);
          border-color: rgba(255, 255, 255, 0.4);
          transform: translateX(4px);
        }
        .spotlight-mini-card.active {
          border-color: var(--accent-red);
          background: rgba(229, 9, 20, 0.28);
          box-shadow: 0 4px 24px rgba(229, 9, 20, 0.35);
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
            min-height: 600px;
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
