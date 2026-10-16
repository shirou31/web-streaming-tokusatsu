import React, { useState } from 'react';
import { 
  X, 
  Key, 
  CheckCircle2, 
  AlertCircle, 
  ExternalLink, 
  Loader2, 
  Trash2, 
  ShieldCheck, 
  Info 
} from 'lucide-react';
import { testTmdbApiKey, saveStoredApiKey } from '../services/tmdbApi';

export default function ApiKeyModal({ 
  currentApiKey, 
  onSaveKey, 
  onClose 
}) {
  const [apiKeyInput, setApiKeyInput] = useState(currentApiKey || '');
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);

  const handleTestAndSave = async (e) => {
    e.preventDefault();
    if (!apiKeyInput.trim()) {
      setTestResult({ success: false, message: 'Harap masukkan API Key TMDB terlebih dahulu.' });
      return;
    }

    setTesting(true);
    setTestResult(null);

    const result = await testTmdbApiKey(apiKeyInput.trim());
    setTesting(false);
    setTestResult(result);

    if (result.success) {
      saveStoredApiKey(apiKeyInput.trim());
      onSaveKey(apiKeyInput.trim());
    }
  };

  const handleRemoveKey = () => {
    saveStoredApiKey('');
    setApiKeyInput('');
    setTestResult({ success: true, message: 'API Key berhasil dihapus. Menggunakan database lokal Tokuflix.' });
    onSaveKey('');
  };

  return (
    <div className="api-modal-backdrop" onClick={onClose}>
      <div className="api-modal-card glass-panel" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="api-modal-header">
          <div className="header-icon-box">
            <Key size={20} color="var(--accent-red)" />
          </div>
          <div className="header-titles">
            <h3 className="modal-title">Konfigurasi TMDB API Key</h3>
            <p className="modal-subtitle">Tarik ribuan data serial Tokusatsu & poster resmi secara otomatis</p>
          </div>
          <button id="close-api-modal-btn" className="close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="api-modal-body">
          {/* Info Banner */}
          <div className="info-banner">
            <Info size={18} className="info-icon" />
            <div className="info-text">
              <strong>Mengapa TMDB API?</strong>
              <p>TMDB (The Movie Database) adalah database terlengkap untuk Tokusatsu (Kamen Rider Showa-Reiwa, Super Sentai, Ultraman). API Key bersifat <strong>100% Gratis</strong>.</p>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleTestAndSave} className="api-form">
            <label className="form-label">
              TMDB API Key (v3 auth):
            </label>
            <div className="input-group">
              <input
                type="text"
                placeholder="Contoh: 8a7f9b2c3d4e5f6a1b2c3d4e5f6a7b8c"
                value={apiKeyInput}
                onChange={(e) => setApiKeyInput(e.target.value)}
                className="key-input"
              />
              <button 
                type="submit" 
                className="btn-primary"
                disabled={testing}
              >
                {testing ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Memeriksa...</span>
                  </>
                ) : (
                  <span>Tes & Simpan</span>
                )}
              </button>
            </div>
          </form>

          {/* Feedback message */}
          {testResult && (
            <div className={`feedback-alert ${testResult.success ? 'success' : 'error'}`}>
              {testResult.success ? (
                <CheckCircle2 size={18} />
              ) : (
                <AlertCircle size={18} />
              )}
              <span>{testResult.message}</span>
            </div>
          )}

          {/* Tutorial steps */}
          <div className="tutorial-section">
            <h4 className="tutorial-heading">Cara Mendapatkan API Key Gratis:</h4>
            <ol className="tutorial-steps">
              <li>
                Daftar akun gratis di{' '}
                <a 
                  href="https://www.themoviedb.org/signup" 
                  target="_blank" 
                  rel="noreferrer"
                  className="link-highlight"
                >
                  The Movie Database (themoviedb.org) <ExternalLink size={12} />
                </a>.
              </li>
              <li>Masuk ke menu <strong>Settings</strong> &gt; <strong>API</strong> di profil akun Anda.</li>
              <li>Klik <strong>Create</strong> / <strong>Request an API Key</strong> (pilih tipe <em>Developer</em>).</li>
              <li>Isi formulir aplikasi (misal: "Personal Tokusatsu Streaming Web App").</li>
              <li>Salin string <strong>API Key (v3 auth)</strong> dan tempelkan pada kolom di atas!</li>
            </ol>
          </div>

          {/* Action Footer */}
          <div className="api-modal-footer">
            {currentApiKey && (
              <button 
                type="button" 
                className="remove-key-btn"
                onClick={handleRemoveKey}
              >
                <Trash2 size={15} />
                <span>Hapus API Key</span>
              </button>
            )}
            <button 
              type="button" 
              className="btn-secondary"
              onClick={onClose}
              style={{ marginLeft: 'auto' }}
            >
              Selesai
            </button>
          </div>
        </div>
      </div>

      <style>{`
        .api-modal-backdrop {
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
        .api-modal-card {
          background: #0d121d;
          border: 1px solid var(--border-light);
          border-radius: var(--radius-lg);
          width: 100%;
          max-width: 620px;
          overflow: hidden;
          box-shadow: 0 20px 50px rgba(0, 0, 0, 0.8), 0 0 30px rgba(255, 32, 78, 0.15);
        }
        .api-modal-header {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 18px 24px;
          border-bottom: 1px solid var(--border-subtle);
          background: rgba(16, 23, 38, 0.7);
        }
        .header-icon-box {
          width: 42px;
          height: 42px;
          border-radius: 12px;
          background: rgba(255, 32, 78, 0.15);
          border: 1px solid rgba(255, 32, 78, 0.3);
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .header-titles {
          flex: 1;
        }
        .modal-title {
          font-size: 1.15rem;
          margin-bottom: 2px;
        }
        .modal-subtitle {
          font-size: 0.8rem;
          color: var(--text-muted);
        }
        .close-btn {
          color: var(--text-muted);
          width: 32px;
          height: 32px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .close-btn:hover {
          color: #ffffff;
          background: rgba(255, 255, 255, 0.1);
        }
        .api-modal-body {
          padding: 24px;
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        .info-banner {
          display: flex;
          gap: 12px;
          background: rgba(0, 242, 254, 0.08);
          border: 1px solid rgba(0, 242, 254, 0.2);
          padding: 14px 16px;
          border-radius: var(--radius-md);
          font-size: 0.85rem;
          color: var(--text-secondary);
        }
        .info-icon {
          color: var(--accent-cyan);
          flex-shrink: 0;
          margin-top: 2px;
        }
        .info-text strong {
          color: var(--accent-cyan);
          display: block;
          margin-bottom: 3px;
        }
        .api-form {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .form-label {
          font-size: 0.85rem;
          font-weight: 600;
          color: var(--text-secondary);
        }
        .input-group {
          display: flex;
          gap: 10px;
        }
        .key-input {
          flex: 1;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid var(--border-light);
          border-radius: var(--radius-md);
          padding: 10px 14px;
          font-size: 0.88rem;
          color: #ffffff;
          outline: none;
        }
        .key-input:focus {
          border-color: var(--accent-red);
          box-shadow: 0 0 12px rgba(255, 32, 78, 0.3);
        }
        .feedback-alert {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 14px;
          border-radius: var(--radius-sm);
          font-size: 0.85rem;
          font-weight: 500;
        }
        .feedback-alert.success {
          background: rgba(16, 185, 129, 0.15);
          color: #34d399;
          border: 1px solid rgba(16, 185, 129, 0.3);
        }
        .feedback-alert.error {
          background: rgba(239, 68, 68, 0.15);
          color: #f87171;
          border: 1px solid rgba(239, 68, 68, 0.3);
        }
        .tutorial-section {
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-md);
          padding: 16px;
        }
        .tutorial-heading {
          font-size: 0.9rem;
          margin-bottom: 10px;
          color: var(--text-main);
        }
        .tutorial-steps {
          padding-left: 18px;
          font-size: 0.82rem;
          color: var(--text-secondary);
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .link-highlight {
          color: var(--accent-cyan);
          text-decoration: underline;
          display: inline-flex;
          align-items: center;
          gap: 4px;
        }
        .api-modal-footer {
          display: flex;
          align-items: center;
          padding-top: 10px;
          border-top: 1px solid var(--border-subtle);
        }
        .remove-key-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          color: #f87171;
          font-size: 0.82rem;
          padding: 6px 12px;
          border-radius: var(--radius-sm);
          background: rgba(239, 68, 68, 0.1);
        }
        .remove-key-btn:hover {
          background: rgba(239, 68, 68, 0.2);
        }
      `}</style>
    </div>
  );
}
