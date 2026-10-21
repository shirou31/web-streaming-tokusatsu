import React, { useState } from 'react';
import { X, ShieldAlert, FileText } from 'lucide-react';

export default function Footer() {
  const [modalType, setModalType] = useState(null); // 'disclaimer' | 'privacy' | null

  return (
    <footer id="footer" className="kuronime-footer" role="contentinfo">
      {/* 1. Top Links: Disclaimers & Privacy Policy */}
      <div className="footermenu">
        <ul className="footer-nav-menu">
          <li>
            <button 
              type="button" 
              className="footer-nav-link" 
              onClick={() => setModalType('disclaimer')}
            >
              Disclaimers
            </button>
          </li>
          <li>
            <button 
              type="button" 
              className="footer-nav-link" 
              onClick={() => setModalType('privacy')}
            >
              Privacy Policy
            </button>
          </li>
        </ul>
      </div>

      {/* 2. Center Brand: Logo + Typography */}
      <div className="footercopyright">
        <div className="footer-brand-wrap" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} role="button" tabIndex={0} title="Kembali ke Atas">
          <img 
            src="/logo.png" 
            alt="TOKUFLIX Logo" 
            className="footer-brand-logo" 
            width="42" 
            height="42" 
          />
          <div className="footer-brand-text">
            <span className="footer-brand-title disp">
              TOKU<span className="footer-highlight">FLIX</span>
            </span>
            <span className="footer-brand-sub">Nonton Tokusatsu Sub Indonesia</span>
          </div>
        </div>

        {/* 3. Copyright Text */}
        <div className="footer-txt">
          <p className="copyright-line">
            Copyright © 2026 <strong className="brand-name">TOKUFLIX</strong>. All Rights Reserved
          </p>
          <p className="disclaimer-line">
            Disclaimer: This site <em>TOKUFLIX</em> does not store any files on its server. All contents are provided by non-affiliated third parties.
          </p>
        </div>
      </div>

      {/* Info Modals for Disclaimers & Privacy Policy */}
      {modalType && (
        <div className="footer-modal-overlay" onClick={() => setModalType(null)}>
          <div className="footer-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="footer-modal-header">
              <div className="footer-modal-title">
                {modalType === 'disclaimer' ? (
                  <>
                    <ShieldAlert size={20} color="#E50914" />
                    <span>Disclaimers</span>
                  </>
                ) : (
                  <>
                    <FileText size={20} color="#E50914" />
                    <span>Privacy Policy</span>
                  </>
                )}
              </div>
              <button 
                type="button" 
                className="footer-modal-close" 
                onClick={() => setModalType(null)}
                aria-label="Tutup"
              >
                <X size={18} />
              </button>
            </div>

            <div className="footer-modal-body">
              {modalType === 'disclaimer' ? (
                <>
                  <p>
                    <strong>TOKUFLIX</strong> adalah portal katalog dan pemutar streaming untuk serial Tokusatsu dengan takarir (subtitle) bahasa Indonesia.
                  </p>
                  <p>
                    <strong>Penyimpanan Berkas:</strong> Website ini tidak mengunggah, menyimpan, atau meng-host berkas video apa pun di server kami sendiri. Semua tautan video dan pemutar disematkan dari penyedia pihak ketiga yang tersedia secara publik di internet.
                  </p>
                  <p>
                    <strong>Hak Cipta:</strong> Seluruh karakter, karya tokusatsu, nama waralaba, dan konten visual (Kamen Rider, Super Sentai, Ultraman, Metal Heroes, dll.) adalah hak cipta dan merek dagang milik masing-masing pemilik resminya, termasuk <em>Toei Company Ltd.</em>, <em>Tsuburaya Productions</em>, dan <em>TV Asahi</em>.
                  </p>
                  <p>
                    Jika Anda adalah pemegang hak cipta sah dan ingin mengajukan permohonan penghapusan indeks, silakan hubungi penyedia host berkas terkait.
                  </p>
                </>
              ) : (
                <>
                  <p>
                    <strong>Privasi Pengguna di TOKUFLIX:</strong> Kami sangat menghargai privasi Anda saat menikmati tontonan Tokusatsu di platform ini.
                  </p>
                  <p>
                    <strong>Data Lokal (Client-Side Storage):</strong> Daftar tontonan (Watchlist), riwayat tontonan (History), serta pengaturan preferensi disimpan langsung di penyimpanan browser perangkat Anda (localStorage) dan tidak dikirimkan ke server kami.
                  </p>
                  <p>
                    <strong>Tanpa Penjualan Data:</strong> TOKUFLIX tidak mengumpulkan, menjual, atau membagikan informasi pribadi apa pun kepada pengiklan atau pihak ketiga.
                  </p>
                  <p>
                    <strong>Layanan Pihak Ketiga:</strong> Pemutar video eksternal yang disematkan mungkin menerapkan kebijakan privasi dan cookie mereka sendiri.
                  </p>
                </>
              )}
            </div>

            <div className="footer-modal-footer">
              <button 
                type="button" 
                className="btn btn-r" 
                style={{ padding: '0 24px', height: '40px', fontSize: '14px', borderRadius: '4px' }}
                onClick={() => setModalType(null)}
              >
                Mengerti
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .kuronime-footer {
          background: #000000;
          border-top: 1px solid rgba(255, 255, 255, 0.08);
          padding: 38px 20px 48px;
          margin-top: 60px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          font-family: 'DM Sans', system-ui, -apple-system, sans-serif;
          user-select: none;
        }

        /* 1. Footermenu (Top Links) */
        .footermenu {
          margin-bottom: 24px;
        }
        .footer-nav-menu {
          list-style: none;
          margin: 0;
          padding: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 36px;
        }
        .footer-nav-link {
          background: transparent;
          border: 0;
          padding: 0;
          color: #FFFFFF;
          font-size: 15px;
          font-weight: 700;
          letter-spacing: -0.01em;
          cursor: pointer;
          transition: color 0.2s ease, transform 0.2s ease;
        }
        .footer-nav-link:hover {
          color: #E50914;
          transform: translateY(-1px);
        }

        /* 2. Center Brand Logo + Text */
        .footercopyright {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 16px;
          max-width: 860px;
          margin: 0 auto;
        }
        .footer-brand-wrap {
          display: inline-flex;
          align-items: center;
          gap: 12px;
          cursor: pointer;
          text-decoration: none;
          padding: 4px 10px;
          border-radius: 8px;
          transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .footer-brand-wrap:hover {
          transform: scale(1.03);
        }
        .footer-brand-logo {
          width: 40px;
          height: 40px;
          object-fit: contain;
          filter: drop-shadow(0 2px 10px rgba(229, 9, 20, 0.4));
        }
        .footer-brand-text {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          text-align: left;
        }
        .footer-brand-title {
          font-size: 22px;
          font-weight: 900;
          letter-spacing: -0.02em;
          color: #FFFFFF;
          line-height: 1.1;
          text-transform: uppercase;
        }
        .footer-highlight {
          color: #E50914;
          text-shadow: 0 0 12px rgba(229, 9, 20, 0.5);
        }
        .footer-brand-sub {
          font-size: 11.5px;
          font-weight: 500;
          color: #8E8E94;
          letter-spacing: 0.01em;
          margin-top: 2px;
        }

        /* 3. Footer Texts */
        .footer-txt {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
        }
        .copyright-line {
          margin: 0;
          font-size: 14px;
          font-weight: 400;
          color: #9A9AA0;
          line-height: 1.5;
        }
        .copyright-line .brand-name {
          color: #E2E2E5;
          font-weight: 700;
        }
        .disclaimer-line {
          margin: 0;
          font-size: 12.5px;
          line-height: 1.6;
          color: #71717A;
          max-width: 780px;
        }
        .disclaimer-line em {
          font-style: italic;
          color: #8E8E94;
        }

        /* Modal Styles */
        .footer-modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.78);
          backdrop-filter: blur(6px);
          z-index: 10000;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          animation: footerFadeIn 0.2s ease;
        }
        .footer-modal-card {
          background: #111113;
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 12px;
          max-width: 540px;
          width: 100%;
          overflow: hidden;
          box-shadow: 0 20px 48px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(229, 9, 20, 0.2);
          animation: footerSlideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .footer-modal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px 20px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
          background: rgba(255, 255, 255, 0.02);
        }
        .footer-modal-title {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 17px;
          font-weight: 700;
          color: #FFFFFF;
        }
        .footer-modal-close {
          background: transparent;
          border: 0;
          color: #9A9AA0;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          border-radius: 6px;
          transition: background 0.15s, color 0.15s;
        }
        .footer-modal-close:hover {
          background: rgba(255, 255, 255, 0.08);
          color: #FFFFFF;
        }
        .footer-modal-body {
          padding: 20px;
          font-size: 14px;
          line-height: 1.65;
          color: #C8C8CC;
          display: flex;
          flex-direction: column;
          gap: 12px;
          text-align: left;
          max-height: 60vh;
          overflow-y: auto;
        }
        .footer-modal-body strong {
          color: #FFFFFF;
        }
        .footer-modal-footer {
          padding: 14px 20px;
          border-top: 1px solid rgba(255, 255, 255, 0.08);
          display: flex;
          justify-content: flex-end;
          background: rgba(255, 255, 255, 0.02);
        }

        @keyframes footerFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes footerSlideUp {
          from { opacity: 0; transform: translateY(16px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }

        @media (max-width: 600px) {
          .kuronime-footer {
            padding: 30px 16px 40px;
          }
          .footer-nav-menu {
            gap: 24px;
          }
          .footer-brand-title {
            font-size: 20px;
          }
          .disclaimer-line {
            font-size: 11.5px;
          }
        }
      `}</style>
    </footer>
  );
}
