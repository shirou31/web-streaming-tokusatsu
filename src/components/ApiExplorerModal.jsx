import React, { useState } from 'react';
import { 
  X, 
  Terminal, 
  Play, 
  CheckCircle, 
  Copy, 
  Code, 
  Database, 
  Layers,
  Sparkles
} from 'lucide-react';
import { 
  getMetaFilters, 
  getHomeHero, 
  getHomePopular, 
  getCatalog, 
  getProductionBySlug, 
  getWatchOrderBySlug, 
  getStreamPayload, 
  getUserHistory 
} from '../services/apiService';

export default function ApiExplorerModal({ onClose }) {
  const [selectedRoute, setSelectedRoute] = useState('/api/v1/meta/filters');
  const [responseJson, setResponseJson] = useState(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const routes = [
    { label: '1. GET /api/v1/meta/filters', route: '/api/v1/meta/filters', fn: () => getMetaFilters() },
    { label: '2. GET /api/v1/home/hero', route: '/api/v1/home/hero', fn: () => getHomeHero({ limit: 3 }) },
    { label: '3. GET /api/v1/home/popular?group_by=franchise', route: '/api/v1/home/popular?group_by=franchise', fn: () => getHomePopular({ group_by: 'franchise', limit: 4 }) },
    { label: '4. GET /api/v1/catalog?franchise=kamen-rider&era=reiwa', route: '/api/v1/catalog?franchise=kamen-rider&era=reiwa', fn: () => getCatalog({ franchise: 'kamen-rider', era: 'reiwa' }) },
    { label: '5. GET /api/v1/productions/kamen-rider-geats', route: '/api/v1/productions/kamen-rider-geats', fn: () => getProductionBySlug('kamen-rider-geats') },
    { label: '6. GET /api/v1/watch-orders/kamen-rider-geats-chronological', route: '/api/v1/watch-orders/kamen-rider-geats-chronological', fn: () => getWatchOrderBySlug('kamen-rider-geats-chronological') },
    { label: '7. GET /api/v1/stream/0192a3f0-2222-7000-8000-000000000001', route: '/api/v1/stream/0192a3f0-2222-7000-8000-000000000001', fn: () => getStreamPayload('0192a3f0-2222-7000-8000-000000000001') },
    { label: '8. GET /api/v1/user/history', route: '/api/v1/user/history', fn: () => getUserHistory() }
  ];

  const handleExecute = async (routeObj) => {
    setSelectedRoute(routeObj.route);
    setLoading(true);
    setCopied(false);
    try {
      const res = await routeObj.fn();
      setResponseJson(res);
    } catch (err) {
      setResponseJson({ error: err.message });
    }
    setLoading(false);
  };

  const handleCopy = () => {
    if (!responseJson) return;
    navigator.clipboard.writeText(JSON.stringify(responseJson, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="api-explorer-backdrop" onClick={onClose}>
      <div className="api-explorer-card glass-panel" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="explorer-header">
          <div className="title-box">
            <Terminal size={20} color="var(--accent-red)" />
            <h3 className="modal-title">Live API Specification & DB Inspector</h3>
            <span className="badge badge-cyan">02_API_SPECIFICATION.md</span>
          </div>
          <button className="close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Content Body */}
        <div className="explorer-grid">
          {/* Left: Endpoint List */}
          <div className="endpoint-sidebar">
            <span className="sidebar-heading">Pilih Endpoint untuk Diuji:</span>
            <div className="routes-list">
              {routes.map((item, idx) => (
                <button
                  key={idx}
                  className={`route-btn ${selectedRoute === item.route ? 'active' : ''}`}
                  onClick={() => handleExecute(item)}
                >
                  <span className="method-tag">GET</span>
                  <span className="route-text">{item.route}</span>
                </button>
              ))}
            </div>
            
            <div className="db-stats-box">
              <Database size={15} color="var(--accent-gold)" />
              <span className="db-stats-text">Relational Engine: PostgreSQL 15+ Schema (UUIDv7, snake_case, Enums)</span>
            </div>
          </div>

          {/* Right: Response Inspector */}
          <div className="response-panel">
            <div className="response-bar">
              <span className="bar-label">HTTP Response Payload:</span>
              {responseJson && (
                <button className="copy-btn" onClick={handleCopy}>
                  {copied ? <CheckCircle size={14} color="#10b981" /> : <Copy size={14} />}
                  <span>{copied ? 'Tersalin!' : 'Salin JSON'}</span>
                </button>
              )}
            </div>

            <div className="json-code-viewer">
              {loading ? (
                <div className="loading-state">
                  <Sparkles size={24} className="animate-spin" color="var(--accent-cyan)" />
                  <span>Memanggil endpoint {selectedRoute}...</span>
                </div>
              ) : responseJson ? (
                <pre className="json-pre">
                  {JSON.stringify(responseJson, null, 2)}
                </pre>
              ) : (
                <div className="empty-prompt">
                  <Code size={36} color="var(--text-muted)" />
                  <p>Klik salah satu endpoint di sebelah kiri untuk melihat struktur response JSON sesuai spesifikasi.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .api-explorer-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(3, 5, 8, 0.9);
          backdrop-filter: blur(14px);
          z-index: 1200;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
        }
        .api-explorer-card {
          background: #090d16;
          border: 1px solid var(--border-light);
          border-radius: var(--radius-lg);
          width: 100%;
          max-width: 1140px;
          height: 84vh;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          box-shadow: 0 25px 60px rgba(0, 0, 0, 0.8), 0 0 40px rgba(0, 242, 254, 0.15);
        }
        .explorer-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px 24px;
          background: rgba(16, 23, 38, 0.8);
          border-bottom: 1px solid var(--border-subtle);
        }
        .title-box {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .modal-title {
          font-size: 1.15rem;
          color: #ffffff;
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
        .explorer-grid {
          display: grid;
          grid-template-columns: 360px 1fr;
          flex: 1;
          overflow: hidden;
        }
        .endpoint-sidebar {
          background: rgba(11, 16, 26, 0.7);
          border-right: 1px solid var(--border-subtle);
          padding: 18px;
          display: flex;
          flex-direction: column;
          gap: 12px;
          overflow-y: auto;
        }
        .sidebar-heading {
          font-size: 0.82rem;
          font-weight: 700;
          color: var(--text-muted);
          text-transform: uppercase;
        }
        .routes-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .route-btn {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 12px;
          border-radius: var(--radius-md);
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid var(--border-subtle);
          text-align: left;
          transition: all var(--transition-fast);
        }
        .route-btn:hover {
          background: rgba(255, 255, 255, 0.08);
          border-color: var(--border-light);
        }
        .route-btn.active {
          background: rgba(0, 242, 254, 0.12);
          border-color: var(--accent-cyan);
        }
        .method-tag {
          font-size: 0.68rem;
          font-weight: 800;
          color: #34d399;
          background: rgba(16, 185, 129, 0.15);
          padding: 2px 5px;
          border-radius: 3px;
        }
        .route-text {
          font-size: 0.78rem;
          color: var(--text-secondary);
          word-break: break-all;
          font-family: monospace;
        }
        .route-btn.active .route-text {
          color: #ffffff;
        }
        .db-stats-box {
          margin-top: auto;
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 12px;
          border-radius: var(--radius-sm);
          background: rgba(255, 183, 3, 0.06);
          border: 1px solid rgba(255, 183, 3, 0.2);
        }
        .db-stats-text {
          font-size: 0.72rem;
          color: var(--accent-gold);
          line-height: 1.4;
        }
        .response-panel {
          display: flex;
          flex-direction: column;
          height: 100%;
          overflow: hidden;
          background: #06080e;
        }
        .response-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 20px;
          border-bottom: 1px solid var(--border-subtle);
          background: rgba(16, 23, 38, 0.5);
        }
        .bar-label {
          font-size: 0.8rem;
          color: var(--text-muted);
          font-weight: 600;
        }
        .copy-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.75rem;
          color: var(--text-secondary);
          background: rgba(255, 255, 255, 0.06);
          padding: 4px 10px;
          border-radius: 4px;
        }
        .copy-btn:hover {
          color: #ffffff;
          background: rgba(255, 255, 255, 0.12);
        }
        .json-code-viewer {
          flex: 1;
          overflow: auto;
          padding: 16px 20px;
        }
        .json-pre {
          font-family: 'Consolas', 'Courier New', monospace;
          font-size: 0.82rem;
          line-height: 1.5;
          color: #a5f3fc;
          white-space: pre-wrap;
          word-break: break-word;
        }
        .loading-state,
        .empty-prompt {
          height: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 12px;
          color: var(--text-muted);
          font-size: 0.88rem;
          text-align: center;
          padding: 40px;
        }
        @media (max-width: 800px) {
          .explorer-grid {
            grid-template-columns: 1fr;
          }
          .endpoint-sidebar {
            height: 220px;
          }
        }
      `}</style>
    </div>
  );
}
