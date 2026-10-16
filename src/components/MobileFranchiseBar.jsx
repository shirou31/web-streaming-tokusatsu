import React from 'react';
import { Sparkles, ShieldCheck, Flame, Zap, Swords } from 'lucide-react';

export default function MobileFranchiseBar({ selectedFranchise, onSelectFranchise }) {
  const franchises = [
    { id: 'all', name: 'Semua', icon: Sparkles, color: '#ff204e' },
    { id: 'kamen-rider', name: 'Kamen Rider', icon: ShieldCheck, color: '#ff204e' },
    { id: 'super-sentai', name: 'Super Sentai', icon: Flame, color: '#ffb703' },
    { id: 'ultraman', name: 'Ultraman', icon: Zap, color: '#00f2fe' },
    { id: 'garo', name: 'Garo & Makai', icon: Swords, color: '#c77dff' }
  ];

  const currentNorm = (selectedFranchise || 'all').toLowerCase().replace(/\s+/g, '-');

  const handleSelect = (id) => {
    onSelectFranchise?.(id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="mobile-franchise-rail-wrapper">
      <div className="mobile-franchise-rail">
        {franchises.map((f) => {
          const Icon = f.icon;
          const isActive = currentNorm === f.id;
          return (
            <button
              key={f.id}
              id={`mobile-chip-${f.id}`}
              className={`mobile-chip-pill ${isActive ? 'active' : ''}`}
              onClick={() => handleSelect(f.id)}
              style={isActive ? { borderColor: f.color, boxShadow: `0 2px 14px ${f.color}33` } : {}}
            >
              <Icon size={14} color={isActive ? f.color : 'currentColor'} />
              <span>{f.name}</span>
              {isActive && <span className="active-dot" style={{ background: f.color }} />}
            </button>
          );
        })}
      </div>

      <style>{`
        .mobile-franchise-rail-wrapper {
          display: none;
          width: 100%;
          padding: 8px 12px 12px;
          overflow: hidden;
          position: relative;
          z-index: 90;
        }

        @media (max-width: 768px) {
          .mobile-franchise-rail-wrapper {
            display: block;
          }
        }

        .force-mobile-mode .mobile-franchise-rail-wrapper {
          display: block;
        }

        .mobile-franchise-rail {
          display: flex;
          align-items: center;
            gap: 8px;
            overflow-x: auto;
            scroll-behavior: smooth;
            -webkit-overflow-scrolling: touch;
            padding-bottom: 4px;
            scrollbar-width: none;
          }

          .mobile-franchise-rail::-webkit-scrollbar {
            display: none;
          }

          .mobile-chip-pill {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            padding: 7px 14px;
            border-radius: var(--radius-full);
            background: rgba(16, 23, 38, 0.85);
            backdrop-filter: blur(12px);
            border: 1px solid var(--border-light);
            color: var(--text-secondary);
            font-size: 0.82rem;
            font-weight: 700;
            white-space: nowrap;
            flex-shrink: 0;
            transition: all var(--transition-fast);
            cursor: pointer;
            user-select: none;
          }

          html[data-theme="light"] .mobile-chip-pill {
            background: rgba(255, 255, 255, 0.95);
            border-color: rgba(15, 23, 42, 0.12);
            color: #334155;
            box-shadow: 0 1px 3px rgba(15, 23, 42, 0.05);
          }

          .mobile-chip-pill:hover,
          .mobile-chip-pill:active {
            transform: scale(0.97);
            color: #ffffff;
          }

          html[data-theme="light"] .mobile-chip-pill:hover,
          html[data-theme="light"] .mobile-chip-pill:active {
            color: #0f172a;
          }

          .mobile-chip-pill.active {
            background: rgba(255, 255, 255, 0.12);
            color: #ffffff;
            font-weight: 800;
          }

          html[data-theme="light"] .mobile-chip-pill.active {
            background: #ffffff;
            color: #0f172a;
          }

          .active-dot {
            width: 5px;
            height: 5px;
            border-radius: 50%;
            margin-left: 2px;
          }
      `}</style>
    </div>
  );
}
