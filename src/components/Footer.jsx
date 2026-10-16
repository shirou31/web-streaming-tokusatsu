import React from 'react';
import { Tv, Heart, Shield, Film, Sparkles, ExternalLink } from 'lucide-react';

export default function Footer({ onSelectFranchise }) {
  return (
    <footer className="footer-section">
      <div className="container footer-content">
        {/* Brand & Mission */}
        <div className="footer-brand-col">
          <div className="footer-logo">
            <div className="footer-logo-badge">
              <img 
                src="/logo-512.png" 
                alt="Tokustream Logo" 
                className="footer-logo-img" 
              />
            </div>
            <span className="logo-main">TOKU<span className="logo-accent">FLIX</span></span>
          </div>
          <p className="footer-tagline">
            Platform streaming dan arsip serial Tokusatsu Subtitle Indonesia terlengkap. Dibangun dengan antarmuka modern, pemutar berkecepatan tinggi, dan integrasi metadata TMDB API.
          </p>
          <div className="fansub-credit">
            <Heart size={14} color="var(--accent-red)" fill="var(--accent-red)" />
            <span>Didedikasikan untuk Komunitas Tokusatsu & Penggemar Sub Indo</span>
          </div>
        </div>

        {/* Franchise Navigation */}
        <div className="footer-links-col">
          <h4 className="footer-heading">Kategori Tokusatsu</h4>
          <ul className="footer-links-list">
            <li>
              <button onClick={() => onSelectFranchise('Kamen Rider')}>
                Kamen Rider (Reiwa & Heisei)
              </button>
            </li>
            <li>
              <button onClick={() => onSelectFranchise('Super Sentai')}>
                Super Sentai Series
              </button>
            </li>
            <li>
              <button onClick={() => onSelectFranchise('Ultraman')}>
                Ultraman Chronicles
              </button>
            </li>
            <li>
              <button onClick={() => onSelectFranchise('Garo')}>
                GARO & Tokusatsu Dewasa
              </button>
            </li>
          </ul>
        </div>

        {/* Server & API Info */}
        <div className="footer-links-col">
          <h4 className="footer-heading">Arsitektur & API</h4>
          <ul className="footer-links-list">
            <li>
              <a href="https://www.themoviedb.org/" target="_blank" rel="noreferrer">
                The Movie Database (TMDB v3) <ExternalLink size={12} />
              </a>
            </li>
            <li>
              <span>Video Server Embed (Dood, StreamWish)</span>
            </li>
            <li>
              <span>Sub Indo Fansub Sync (Multi-Host)</span>
            </li>
            <li>
              <span>Framework: Vite + React 19 + Vanilla CSS</span>
            </li>
          </ul>
        </div>

        {/* Copyright & Disclaimer */}
        <div className="footer-disclaimer-col">
          <h4 className="footer-heading">Disclaimer Hak Cipta</h4>
          <p className="disclaimer-text">
            Kamen Rider dan Super Sentai merupakan hak cipta milik Toei Company Ltd. & TV Asahi. Ultraman merupakan hak cipta Tsuburaya Productions. Garo merupakan hak cipta Keita Amemiya & Tohokushinsha. Seluruh video di-host pada server pihak ketiga.
          </p>
        </div>
      </div>

      <div className="footer-bottom-bar">
        <div className="container bottom-bar-inner">
          <p>© {new Date().getFullYear()} TOKUFLIX Indonesia. Dibuat untuk pecinta Tokusatsu.</p>
          <div className="status-badge">
            <span className="dot-live" />
            <span>Sistem Operasional & Siap Streaming</span>
          </div>
        </div>
      </div>

      <style>{`
        .footer-section {
          background: #06090f;
          border-top: 1px solid var(--border-subtle);
          margin-top: 80px;
          padding-top: 60px;
        }
        .footer-content {
          display: grid;
          grid-template-columns: 2fr 1fr 1fr 1.5fr;
          gap: 40px;
          padding-bottom: 50px;
        }
        .footer-logo {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 14px;
        }
        .footer-logo-badge {
          width: 38px;
          height: 38px;
          display: flex;
          align-items: center;
          justify-content: center;
          filter: drop-shadow(0 0 10px rgba(255, 32, 78, 0.5));
        }
        .footer-logo-img {
          width: 100%;
          height: 100%;
          object-fit: contain;
        }
        .footer-tagline {
          font-size: 0.85rem;
          color: var(--text-muted);
          line-height: 1.6;
          margin-bottom: 16px;
          max-width: 360px;
        }
        .fansub-credit {
          display: flex;
          align-items: center;
          gap: 7px;
          font-size: 0.78rem;
          color: var(--text-secondary);
        }
        .footer-heading {
          font-size: 0.95rem;
          margin-bottom: 18px;
          color: var(--text-main);
          letter-spacing: 0.02em;
        }
        .footer-links-list {
          list-style: none;
          display: flex;
          flex-direction: column;
          gap: 10px;
          font-size: 0.84rem;
          color: var(--text-muted);
        }
        .footer-links-list button,
        .footer-links-list a {
          color: var(--text-muted);
          display: inline-flex;
          align-items: center;
          gap: 5px;
          text-align: left;
        }
        .footer-links-list button:hover,
        .footer-links-list a:hover {
          color: var(--accent-red);
        }
        .disclaimer-text {
          font-size: 0.78rem;
          color: var(--text-muted);
          line-height: 1.6;
        }
        .footer-bottom-bar {
          background: #030508;
          border-top: 1px solid rgba(255, 255, 255, 0.04);
          padding: 18px 0;
          font-size: 0.8rem;
          color: var(--text-muted);
        }
        .bottom-bar-inner {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 10px;
        }
        .status-badge {
          display: flex;
          align-items: center;
          gap: 7px;
          color: var(--text-secondary);
          font-size: 0.75rem;
        }
        .dot-live {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #10b981;
          box-shadow: 0 0 8px #10b981;
        }
        @media (max-width: 1024px) {
          .footer-content {
            grid-template-columns: 1fr 1fr;
            gap: 30px;
          }
        }
        @media (max-width: 768px) {
          .footer-content {
            grid-template-columns: 1fr;
            gap: 24px;
          }
          .footer-bottom-bar {
            padding-bottom: calc(85px + env(safe-area-inset-bottom, 0px));
          }
        }
      `}</style>
    </footer>
  );
}
