/**
 * DashboardFeature.tsx — Tela Inicial Gamificada (Início / Dashboard)
 * Mapeamento pixel-perfect do HTML/CSS original (componentes/secoes/dashboard.html + dashboard.css)
 */

import React, { useState } from 'react';

interface DashboardFeatureProps {
  onNavigate: (section: string) => void;
  onOpenFicha: () => void;
  onOpenPerfil: () => void;
}

export const DashboardFeature: React.FC<DashboardFeatureProps> = ({
  onNavigate,
  onOpenFicha,
  onOpenPerfil,
}) => {
  const [radarFilter, setRadarFilter] = useState<'MENSAL' | 'TOTAL'>('MENSAL');

  return (
    <div className="section-slide" data-section="dashboard" style={{ display: 'block' }}>
      <div className="dash-container">
        
        {/* ROW 1: Profile Banner Card + Top Right Action Buttons */}
        <div className="dash-header-row-1">
          <div
            className="dash-profile-banner-card profile-banner"
            data-banner="roxo-neon"
            onClick={onOpenPerfil}
            role="button"
            tabIndex={0}
          >
            <div className="dash-banner-checkers" />
            <div className="profile-avatar dash-profile-avatar" style={{ width: '48px', height: '48px', margin: '4px' }}>
              <div className="w-full h-full rounded-xl bg-purple-900/60 border border-amber-400 flex items-center justify-center">
                <span className="material-symbols-outlined text-amber-400 text-xl">shield_person</span>
              </div>
            </div>
          </div>

          <div className="dash-top-actions">
            <button
              className="dash-action-circle-btn"
              onClick={() => onNavigate('social')}
              title="Social"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </button>

            <button
              className="dash-action-circle-btn has-notification"
              onClick={() => {}}
              title="Notícias / Calendário"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
            </button>

            <button
              className="dash-action-circle-btn"
              onClick={() => {}}
              title="Menu"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </button>
          </div>
        </div>

        {/* ROW 2: Welcome Text / Nickname + Unified Missions Widget */}
        <div className="dash-header-row-2">
          <div className="dash-user-trophy-display">
            <span className="dash-welcome-text">Bem vindo de volta,</span>
            <h1 className="dash-nickname-text">DECEPTIVON</h1>
          </div>

          <div className="dash-unified-missions-widget" onClick={() => {}}>
            <div className="dash-missions-header-tag">
              <span className="dash-missions-tag-text">MISSÕES</span>
            </div>
            <div className="dash-missions-body-card">
              <div className="dash-missions-diamond-badge">
                <div className="dash-missions-diamond-inner">
                  <span className="material-symbols-outlined dash-missions-diamond-arrow">crown</span>
                </div>
              </div>

              <div className="dash-missions-progress-area">
                <span className="dash-missions-progress-text">0/30</span>
                <div className="dash-missions-progress-track">
                  <div className="dash-missions-progress-fill" style={{ width: '0%' }} />
                </div>
              </div>

              <div className="dash-missions-blue-ribbon">
                <span className="material-symbols-outlined dash-missions-ribbon-crown">workspace_premium</span>
              </div>
            </div>
          </div>
        </div>

        {/* CENTER SECTION: Unified Arena Card (Tactical Radar) */}
        <div className="dash-arena-card">
          <div className="dash-arena-content">
            <div className="dash-radar-header">
              <h3>Atributos de Performance</h3>
              <div className="dash-radar-toggle">
                <button
                  className={`btn btn-sm ${radarFilter === 'MENSAL' ? 'active' : ''}`}
                  onClick={() => setRadarFilter('MENSAL')}
                  style={{
                    padding: '4px 12px',
                    fontSize: '.7rem',
                    borderRadius: '6px',
                    background: radarFilter === 'MENSAL' ? 'var(--primary)' : 'transparent',
                    color: radarFilter === 'MENSAL' ? '#000' : 'var(--text-secondary)',
                    border: 'none',
                    fontWeight: 800,
                    cursor: 'pointer',
                    transition: '.3s',
                  }}
                >
                  MENSAL
                </button>
                <button
                  className={`btn btn-sm ${radarFilter === 'TOTAL' ? 'active' : ''}`}
                  onClick={() => setRadarFilter('TOTAL')}
                  style={{
                    padding: '4px 12px',
                    fontSize: '.7rem',
                    borderRadius: '6px',
                    background: radarFilter === 'TOTAL' ? 'var(--primary)' : 'transparent',
                    color: radarFilter === 'TOTAL' ? '#000' : 'var(--text-secondary)',
                    border: 'none',
                    fontWeight: 800,
                    cursor: 'pointer',
                    transition: '.3s',
                  }}
                >
                  TOTAL
                </button>
              </div>
            </div>

            {/* Radar Chart SVG */}
            <div className="dash-radar-container">
              <div className="radar-wrapper">
                <svg viewBox="0 0 300 240">
                  <polygon points="150,20 250,70 250,170 150,220 50,170 50,70" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
                  <polygon points="150,50 215,82 215,147 150,180 85,147 85,82" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="1" strokeDasharray="3 3" />
                  <polygon points="150,80 180,95 180,135 150,150 120,135 120,95" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="1" strokeDasharray="3 3" />

                  {/* Attribute polygon */}
                  <polygon points="150,110 165,120 158,135 150,142 140,130 140,115" fill="rgba(192, 132, 252, 0.45)" stroke="#c084fc" strokeWidth="2" />

                  {/* Labels */}
                  <text x="150" y="14" fill="#cbc3d7" fontSize="11" textAnchor="middle" fontFamily="Rajdhani" fontWeight="bold">FORÇA</text>
                  <text x="255" y="70" fill="#cbc3d7" fontSize="11" textAnchor="start" fontFamily="Rajdhani" fontWeight="bold">RESISTÊNCIA</text>
                  <text x="255" y="175" fill="#cbc3d7" fontSize="11" textAnchor="start" fontFamily="Rajdhani" fontWeight="bold">INTENSIDADE</text>
                  <text x="150" y="235" fill="#cbc3d7" fontSize="11" textAnchor="middle" fontFamily="Rajdhani" fontWeight="bold">EQUILÍBRIO</text>
                  <text x="45" y="175" fill="#cbc3d7" fontSize="11" textAnchor="end" fontFamily="Rajdhani" fontWeight="bold">CARDIO</text>
                  <text x="45" y="70" fill="#cbc3d7" fontSize="11" textAnchor="end" fontFamily="Rajdhani" fontWeight="bold">POTÊNCIA</text>
                </svg>
              </div>
            </div>
          </div>

          {/* Arena Card Footer */}
          <div className="dash-arena-footer">
            <button className="dash-arena-trophy-btn" onClick={onOpenFicha} aria-label="Selecionar Ficha">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
                <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
                <path d="M4 22h16" />
                <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
                <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
                <path d="M18 2H6v7a6 6 0 0 0 12 0V2z" />
              </svg>
            </button>

            <div className="dash-arena-progress-container">
              <div className="dash-arena-progress-track">
                <div className="dash-arena-progress-fill progress-fill" style={{ width: '15%' }}>
                  <div className="dash-progress-shimmer" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* BOTTOM SECTION: SUGGESTED WORKOUT CARD */}
        <div className="dash-suggested-workout-wrapper">
          <div className="dash-suggested-workout-card">
            <button className="dash-workout-exercise-card" onClick={onOpenFicha}>
              <div className="dash-workout-img-container">
                <div className="w-full h-full bg-purple-950/60 flex items-center justify-center">
                  <span className="material-symbols-outlined text-purple-300">fitness_center</span>
                </div>
                <div className="dash-workout-letter-badge">
                  <span>A</span>
                </div>
              </div>
              <div className="dash-workout-card-details">
                <span className="dash-workout-label">TREINO</span>
                <span className="dash-workout-ex-count">8 ex</span>
              </div>
            </button>

            <button className="dash-next-step-btn" onClick={onOpenFicha}>
              <span className="btn-text">PRÓXIMO PASSO</span>
              <span className="neon-glow-left-pill" />
              <span className="neon-glow-right-pill" />
            </button>

            <div className="dash-cycle-progress-card" onClick={() => onNavigate('progresso')}>
              <div className="dash-cycle-trophy-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
                  <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
                  <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
                  <path d="M4 22h16" />
                  <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
                  <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
                  <path d="M18 2H6v7a6 6 0 0 0 12 0V2z" />
                </svg>
              </div>
              <span className="dash-cycle-value">2/30</span>
              <span className="dash-cycle-label">CICLO</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
