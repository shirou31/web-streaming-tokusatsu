import React, { useState, useEffect } from 'react';
import { 
  Smartphone, 
  Download, 
  X, 
  CheckCircle, 
  Sparkles, 
  Share2, 
  Layers, 
  ShieldCheck, 
  Play, 
  HelpCircle,
  ExternalLink,
  Zap,
  ArrowRight
} from 'lucide-react';

export default function InstallAppModal({ isOpen, onClose }) {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [installSuccess, setInstallSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState('pwa'); // 'pwa' | 'apk' | 'ios'

  useEffect(() => {
    // Check if already in standalone PWA / installed
    if (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true) {
      setIsInstalled(true);
    }

    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      window.tokuflixDeferredPrompt = e;
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setInstallSuccess(true);
      setDeferredPrompt(null);
    };

    // If global prompt was captured earlier
    if (window.tokuflixDeferredPrompt) {
      setDeferredPrompt(window.tokuflixDeferredPrompt);
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    const promptEvent = deferredPrompt || window.tokuflixDeferredPrompt;
    if (promptEvent) {
      promptEvent.prompt();
      const { outcome } = await promptEvent.userChoice;
      if (outcome === 'accepted') {
        setInstallSuccess(true);
        setIsInstalled(true);
        setDeferredPrompt(null);
        window.tokuflixDeferredPrompt = null;
      }
    } else {
      // Fallback: guide user
      setActiveTab('pwa');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="install-modal-overlay" onClick={onClose}>
      <div className="install-modal-content glass-panel" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="install-modal-header">
          <div className="install-brand-badge">
            <span className="live-dot-pulse" />
            <Smartphone size={16} color="var(--accent-cyan)" />
            <span>APLIKASI MOBILE RESMI</span>
          </div>
          <button className="btn-close-modal" onClick={onClose} aria-label="Tutup">
            <X size={20} />
          </button>
        </div>

        {/* Hero Section */}
        <div className="install-hero-box">
          <div className="install-logo-wrap">
            <img 
              src="/logo.png" 
              alt="TOKUFLIX Mobile" 
              className="install-app-icon"
              onError={(e) => { e.currentTarget.src = '/pwa-192x192.png'; }}
            />
          </div>
          <div className="install-hero-info">
            <h2 className="install-app-title">TOKUFLIX Mobile</h2>
            <p className="install-app-subtitle">Nonton Streaming Tokusatsu Subtitle Indonesia</p>
            <div className="install-feature-chips">
              <span className="chip-feat">⚡ 100% Gratis</span>
              <span className="chip-feat">🎬 Layar Penuh</span>
              <span className="chip-feat">🚀 Resolusi 1440p</span>
              <span className="chip-feat">📱 Bebas Iklan Browser</span>
            </div>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="install-tabs-nav">
          <button 
            className={`install-tab-btn ${activeTab === 'pwa' ? 'active' : ''}`}
            onClick={() => setActiveTab('pwa')}
          >
            <Sparkles size={15} />
            <span>1-Klik Pasang (PWA)</span>
          </button>
          <button 
            className={`install-tab-btn ${activeTab === 'apk' ? 'active' : ''}`}
            onClick={() => setActiveTab('apk')}
          >
            <Download size={15} />
            <span>Unduh File .APK (Android)</span>
          </button>
          <button 
            className={`install-tab-btn ${activeTab === 'ios' ? 'active' : ''}`}
            onClick={() => setActiveTab('ios')}
          >
            <Share2 size={15} />
            <span>Pengguna iPhone (iOS)</span>
          </button>
        </div>

        {/* Tab 1: PWA Instant Install */}
        {activeTab === 'pwa' && (
          <div className="install-tab-content">
            {installSuccess || isInstalled ? (
              <div className="installed-success-box">
                <CheckCircle size={44} color="#10b981" />
                <h3>Aplikasi Berhasil Terpasang!</h3>
                <p>Ikon TOKUFLIX telah ditambahkan ke layar utama ponsel Anda. Buka dari layar utama untuk pengalaman fullscreen terbaik!</p>
                <button className="btn-done-install" onClick={onClose}>
                  Tutup & Mulai Nonton
                </button>
              </div>
            ) : (
              <div className="install-prompt-body">
                <p className="install-guide-lead">
                  Pasang langsung ke ponsel Android atau Tablet Anda tanpa memakan ruang penyimpanan besar (kurang dari 1 MB). Aplikasi akan muncul di laci aplikasi seperti aplikasi bawaan!
                </p>

                {deferredPrompt ? (
                  <button 
                    id="btn-trigger-pwa-install"
                    className="btn-main-install pulse"
                    onClick={handleInstallClick}
                  >
                    <Download size={20} />
                    <span>Pasang TOKUFLIX di HP Sekarang</span>
                  </button>
                ) : (
                  <div className="manual-install-card">
                    <div className="manual-card-header">
                      <HelpCircle size={18} color="var(--accent-cyan)" />
                      <strong>Cara Pasang Cepat di Browser HP (Chrome / Edge / Samsung Internet):</strong>
                    </div>
                    <ol className="manual-steps-list">
                      <li>Buka menu browser dengan mengetuk <strong>ikon titik tiga (⋮)</strong> di pojok kanan atas layar HP Anda.</li>
                      <li>Cari dan ketuk pilihan <strong>"Instal Aplikasi"</strong> atau <strong>"Tambahkan ke Layar Utama" (Add to Home screen)</strong>.</li>
                      <li>Ketuk <strong>Instal</strong>. Aplikasi TOKUFLIX akan langsung terpasang di HP Anda!</li>
                    </ol>
                  </div>
                )}

                <div className="install-benefits-grid">
                  <div className="benefit-item">
                    <Zap size={18} color="#10b981" />
                    <div>
                      <strong>Akses Instan & Cepat</strong>
                      <span>Langsung terbuka tanpa mengetik URL lagi</span>
                    </div>
                  </div>
                  <div className="benefit-item">
                    <Layers size={18} color="var(--accent-cyan)" />
                    <div>
                      <strong>Mode Layar Penuh</strong>
                      <span>Tanpa bilah alamat browser, streaming lebih lega</span>
                    </div>
                  </div>
                  <div className="benefit-item">
                    <ShieldCheck size={18} color="#ffb703" />
                    <div>
                      <strong>Aman & Selalu Update</strong>
                      <span>Episode dan serial baru otomatis muncul tanpa perlu update manual</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Android APK */}
        {activeTab === 'apk' && (
          <div className="install-tab-content">
            <p className="install-guide-lead">
              Project ini telah dilengkapi dengan paket native <strong>Capacitor Android</strong> (ID: <code>com.tokuflix.streaming</code>). Anda dapat mengunduh file installer <code>.APK</code> resmi yang dikompilasi langsung dari repository GitHub:
            </p>

            <div className="apk-download-box glass-panel">
              <div className="apk-icon-circle">
                <Smartphone size={32} color="#10b981" />
              </div>
              <div className="apk-details">
                <h4>TOKUFLIX Android Package (.APK)</h4>
                <div className="apk-specs">
                  <span>Versi: <strong>v1.0.0 Stable</strong></span>
                  <span>•</span>
                  <span>Kompatibilitas: <strong>Android 7.0 s/d 16</strong></span>
                  <span>•</span>
                  <span>Status: <strong>Gratis</strong></span>
                </div>
              </div>
            </div>

            <div className="apk-action-row" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <a 
                href="https://github.com/shirou31/web-streaming-tokusatsu/releases/download/v1.0.0-release/TOKUFLIX-v1.0.0.apk"
                className="btn-main-install pulse"
                download
              >
                <Download size={20} />
                <span>Unduh TOKUFLIX-v1.0.0.apk (15 MB)</span>
              </a>
              <a 
                href="https://github.com/shirou31/web-streaming-tokusatsu/releases/tag/v1.0.0-release"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  fontSize: '0.78rem',
                  color: 'var(--text-muted)',
                  textDecoration: 'none'
                }}
              >
                <span>Lihat Catatan Rilis di GitHub</span>
                <ExternalLink size={13} />
              </a>
            </div>

            <div className="manual-install-card" style={{ marginTop: '14px' }}>
              <div className="manual-card-header">
                <strong>Langkah Instalasi APK di Android:</strong>
              </div>
              <ol className="manual-steps-list">
                <li>Unduh file <code>TOKUFLIX.apk</code> dari link di atas.</li>
                <li>Setelah unduhan selesai, buka file tersebut di HP Anda.</li>
                <li>Jika muncul peringatan <em>"Izinkan penginstalan dari sumber ini"</em>, aktifkan izin pada setelan Chrome/File Manager Anda.</li>
                <li>Ketuk <strong>Instal</strong> dan aplikasi siap dinikmati!</li>
              </ol>
            </div>
          </div>
        )}

        {/* Tab 3: iOS (iPhone / iPad) */}
        {activeTab === 'ios' && (
          <div className="install-tab-content">
            <p className="install-guide-lead">
              Untuk pengguna perangkat Apple (iPhone & iPad), Apple mendukung Progressive Web App langsung dari browser Safari:
            </p>

            <div className="ios-steps-box">
              <div className="ios-step-item">
                <div className="ios-step-num">1</div>
                <div className="ios-step-text">
                  Buka website ini di browser <strong>Safari</strong> pada iPhone / iPad Anda.
                </div>
              </div>
              <div className="ios-step-item">
                <div className="ios-step-num">2</div>
                <div className="ios-step-text">
                  Ketuk tombol <strong>Bagikan / Share</strong> (ikon kotak dengan tanda panah ke atas <Share2 size={14} style={{ display: 'inline', verticalAlign: 'middle' }} />) di bagian bawah layar Safari.
                </div>
              </div>
              <div className="ios-step-item">
                <div className="ios-step-num">3</div>
                <div className="ios-step-text">
                  Gulir ke bawah dan ketuk opsi <strong>"Tambahkan ke Layar Utama" (Add to Home Screen)</strong>.
                </div>
              </div>
              <div className="ios-step-item">
                <div className="ios-step-num">4</div>
                <div className="ios-step-text">
                  Ketuk <strong>"Tambah"</strong> di pojok kanan atas. Ikon TOKUFLIX akan muncul di Home Screen iPhone Anda seperti aplikasi App Store!
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="install-modal-footer">
          <span className="footer-safe-text">
            <ShieldCheck size={14} color="#10b981" />
            Bebas Virus & 100% Aman Dikembangkan untuk Komunitas Tokusatsu Indonesia
          </span>
        </div>
      </div>

      <style>{`
        .install-modal-overlay {
          position: fixed;
          inset: 0;
          z-index: 2100;
          background: rgba(3, 5, 10, 0.85);
          backdrop-filter: blur(12px);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 16px;
          animation: fadeIn 0.25s ease-out;
        }

        .install-modal-content {
          width: 100%;
          max-width: 580px;
          max-height: 90vh;
          overflow-y: auto;
          background: rgba(11, 16, 28, 0.96);
          border: 1px solid rgba(0, 242, 254, 0.25);
          border-radius: var(--radius-xl, 24px);
          box-shadow: 0 25px 60px rgba(0, 0, 0, 0.75), 0 0 35px rgba(0, 242, 254, 0.15);
          padding: 24px;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        html[data-theme="light"] .install-modal-content {
          background: rgba(255, 255, 255, 0.98);
          border-color: rgba(15, 23, 42, 0.15);
          box-shadow: 0 25px 60px rgba(15, 23, 42, 0.2);
        }

        .install-modal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .install-brand-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 4px 12px;
          border-radius: 999px;
          background: rgba(0, 242, 254, 0.1);
          border: 1px solid rgba(0, 242, 254, 0.3);
          font-size: 0.74rem;
          font-weight: 800;
          letter-spacing: 0.05em;
          color: var(--accent-cyan);
        }

        .install-hero-box {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 16px;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-lg, 16px);
        }

        html[data-theme="light"] .install-hero-box {
          background: #f8fafc;
          border-color: #e2e8f0;
        }

        .install-logo-wrap {
          width: 72px;
          height: 72px;
          border-radius: 18px;
          background: #050811;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 8px;
          border: 1px solid rgba(255, 255, 255, 0.12);
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5);
          flex-shrink: 0;
        }

        .install-app-icon {
          width: 100%;
          height: 100%;
          object-fit: contain;
        }

        .install-hero-info {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .install-app-title {
          font-size: 1.4rem;
          font-weight: 800;
          color: var(--text-main);
          letter-spacing: -0.01em;
          margin: 0;
        }

        .install-app-subtitle {
          font-size: 0.85rem;
          color: var(--text-muted);
          margin: 0;
        }

        .install-feature-chips {
          display: flex;
          gap: 6px;
          flex-wrap: wrap;
          margin-top: 4px;
        }

        .chip-feat {
          font-size: 0.7rem;
          font-weight: 700;
          padding: 2px 8px;
          border-radius: 6px;
          background: rgba(255, 255, 255, 0.06);
          color: var(--text-main);
          border: 1px solid rgba(255, 255, 255, 0.08);
        }

        html[data-theme="light"] .chip-feat {
          background: #e2e8f0;
          color: #0f172a;
          border-color: #cbd5e1;
        }

        .install-tabs-nav {
          display: flex;
          gap: 6px;
          background: rgba(255, 255, 255, 0.04);
          padding: 4px;
          border-radius: 12px;
          border: 1px solid var(--border-subtle);
        }

        html[data-theme="light"] .install-tabs-nav {
          background: #f1f5f9;
        }

        .install-tab-btn {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          padding: 9px 8px;
          border-radius: 8px;
          border: none;
          background: transparent;
          color: var(--text-muted);
          font-size: 0.78rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s;
        }

        .install-tab-btn.active {
          background: var(--accent-red);
          color: #ffffff;
          box-shadow: 0 4px 14px rgba(255, 32, 78, 0.4);
        }

        .install-tab-content {
          display: flex;
          flex-direction: column;
          gap: 14px;
          animation: fadeIn 0.2s ease-out;
        }

        .install-guide-lead {
          font-size: 0.88rem;
          color: var(--text-secondary);
          line-height: 1.5;
          margin: 0;
        }

        .btn-main-install {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          padding: 14px 20px;
          border-radius: 14px;
          background: linear-gradient(135deg, var(--accent-red) 0%, #b5179e 100%);
          color: #ffffff;
          font-size: 0.95rem;
          font-weight: 800;
          border: none;
          cursor: pointer;
          box-shadow: 0 8px 25px rgba(255, 32, 78, 0.45);
          text-decoration: none;
          transition: all 0.2s;
        }

        .btn-main-install:hover {
          transform: translateY(-2px);
          box-shadow: 0 12px 30px rgba(255, 32, 78, 0.6);
        }

        .btn-main-install.pulse {
          animation: pulseGlow 2s infinite;
        }

        @keyframes pulseGlow {
          0%, 100% { box-shadow: 0 0 15px rgba(255, 32, 78, 0.4); }
          50% { box-shadow: 0 0 30px rgba(255, 32, 78, 0.8); }
        }

        .manual-install-card {
          padding: 14px 16px;
          background: rgba(0, 242, 254, 0.05);
          border: 1px solid rgba(0, 242, 254, 0.2);
          border-radius: 12px;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .manual-card-header {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.84rem;
          color: var(--text-main);
        }

        .manual-steps-list {
          margin: 0;
          padding-left: 20px;
          font-size: 0.82rem;
          color: var(--text-secondary);
          line-height: 1.6;
        }

        .install-benefits-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
          gap: 10px;
        }

        .benefit-item {
          display: flex;
          gap: 10px;
          padding: 10px 12px;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid var(--border-subtle);
          border-radius: 10px;
        }

        html[data-theme="light"] .benefit-item {
          background: #f8fafc;
          border-color: #e2e8f0;
        }

        .benefit-item div {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .benefit-item strong {
          font-size: 0.78rem;
          color: var(--text-main);
        }

        .benefit-item span {
          font-size: 0.7rem;
          color: var(--text-muted);
        }

        .apk-download-box {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 14px 16px;
          background: rgba(16, 185, 129, 0.08);
          border: 1px solid rgba(16, 185, 129, 0.25);
          border-radius: 14px;
        }

        .apk-icon-circle {
          width: 52px;
          height: 52px;
          border-radius: 50%;
          background: rgba(16, 185, 129, 0.15);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .apk-details h4 {
          margin: 0 0 4px;
          font-size: 0.95rem;
          color: var(--text-main);
        }

        .apk-specs {
          display: flex;
          gap: 6px;
          flex-wrap: wrap;
          font-size: 0.74rem;
          color: var(--text-muted);
        }

        .ios-steps-box {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .ios-step-item {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          padding: 10px 12px;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid var(--border-subtle);
          border-radius: 10px;
        }

        html[data-theme="light"] .ios-step-item {
          background: #f8fafc;
        }

        .ios-step-num {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: var(--accent-red);
          color: #ffffff;
          font-size: 0.78rem;
          font-weight: 800;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .ios-step-text {
          font-size: 0.82rem;
          color: var(--text-secondary);
          line-height: 1.5;
        }

        .installed-success-box {
          text-align: center;
          padding: 24px 16px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 10px;
        }

        .btn-done-install {
          padding: 10px 24px;
          background: #10b981;
          color: #ffffff;
          font-weight: 700;
          font-size: 0.88rem;
          border-radius: 10px;
          border: none;
          cursor: pointer;
        }

        .install-modal-footer {
          margin-top: auto;
          padding-top: 10px;
          border-top: 1px solid var(--border-subtle);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .footer-safe-text {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 0.72rem;
          color: var(--text-muted);
        }
      `}</style>
    </div>
  );
}
