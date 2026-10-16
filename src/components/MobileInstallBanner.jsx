import React, { useState, useEffect } from 'react';
import { Smartphone, Download, X } from 'lucide-react';

export default function MobileInstallBanner({ onOpenInstallModal }) {
  const [dismissed, setDismissed] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check if running inside installed PWA / standalone
    const standalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
    setIsStandalone(standalone);

    // Check session dismissal
    const wasDismissed = sessionStorage.getItem('tokuflix_install_banner_dismissed');
    if (wasDismissed) {
      setDismissed(true);
    }
  }, []);

  const handleDismiss = (e) => {
    e.stopPropagation();
    setDismissed(true);
    sessionStorage.setItem('tokuflix_install_banner_dismissed', 'true');
  };

  if (dismissed || isStandalone) return null;

  return (
    <div className="mobile-install-banner" onClick={onOpenInstallModal}>
      <div className="install-banner-inner glass-panel">
        <div className="install-banner-icon">
          <img 
            src="/pwa-192x192.png" 
            alt="App Icon" 
            onError={(e) => { e.currentTarget.src = '/logo-512.png'; }}
          />
        </div>
        <div className="install-banner-text">
          <span className="banner-title">Pasang Aplikasi TOKUFLIX</span>
          <span className="banner-sub">Streaming Fullscreen Lebih Cepat di HP</span>
        </div>
        <button 
          className="btn-banner-action"
          onClick={(e) => {
            e.stopPropagation();
            onOpenInstallModal();
          }}
        >
          <Download size={14} />
          <span>Pasang</span>
        </button>
        <button 
          className="btn-banner-dismiss"
          onClick={handleDismiss}
          aria-label="Tutup Banner"
        >
          <X size={16} />
        </button>
      </div>

      <style>{`
        .mobile-install-banner {
          display: none;
          position: fixed;
          top: 64px;
          left: 0;
          right: 0;
          z-index: 1040;
          padding: 8px 12px;
          animation: slideDown 0.3s ease-out;
        }

        @media (max-width: 768px) {
          .mobile-install-banner {
            display: block;
          }
        }

        .force-mobile-mode .mobile-install-banner {
          display: block;
        }

        .install-banner-inner {
          max-width: 500px;
          margin: 0 auto;
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 8px 12px;
          border-radius: 16px;
          background: rgba(11, 16, 28, 0.94);
          border: 1px solid rgba(0, 242, 254, 0.3);
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5), 0 0 15px rgba(0, 242, 254, 0.15);
          cursor: pointer;
        }

        html[data-theme="light"] .install-banner-inner {
          background: rgba(255, 255, 255, 0.95);
          border-color: rgba(15, 23, 42, 0.15);
          box-shadow: 0 8px 24px rgba(15, 23, 42, 0.15);
        }

        .install-banner-icon {
          width: 38px;
          height: 38px;
          border-radius: 10px;
          background: #050811;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          flex-shrink: 0;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .install-banner-icon img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .install-banner-text {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 2px;
          min-width: 0;
        }

        .banner-title {
          font-size: 0.8rem;
          font-weight: 800;
          color: var(--text-main);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .banner-sub {
          font-size: 0.68rem;
          color: var(--text-muted);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .btn-banner-action {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 6px 12px;
          border-radius: 999px;
          background: linear-gradient(135deg, var(--accent-red) 0%, #b5179e 100%);
          color: #ffffff;
          font-size: 0.72rem;
          font-weight: 800;
          border: none;
          cursor: pointer;
          flex-shrink: 0;
          box-shadow: 0 2px 10px rgba(255, 32, 78, 0.3);
        }

        .btn-banner-dismiss {
          background: transparent;
          border: none;
          color: var(--text-muted);
          padding: 4px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        @keyframes slideDown {
          from { transform: translateY(-20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
