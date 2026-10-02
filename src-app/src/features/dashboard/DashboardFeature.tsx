/**
 * DashboardFeature.tsx — Tela Inicial Gamificada (Início / Dashboard)
 * Espelho 1:1 do HTML/CSS original de componentes/secoes/dashboard.html + treino.html
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
    <div className="dash-container px-4 py-4 max-w-lg mx-auto flex flex-col gap-5 pb-24">
      {/* ── TOP SECTION: Redesigned Header calling-card-bg style ── */}
      <header
        className="profile-banner dash-header-calling-card dash-profile-banner-card relative rounded-3xl p-5 overflow-hidden border border-amber-500/30 cursor-pointer bg-gradient-to-b from-[#131313]/90 to-[#0a0514]"
        onClick={onOpenPerfil}
      >
        <div className="dash-header-overlay absolute inset-0 bg-gradient-to-b from-[#131313]/10 to-[#131313]/85 z-10 pointer-events-none" />

        {/* Top bar: Avatar & Nav */}
        <div className="flex justify-between items-start z-20 w-full mb-6 relative">
          <div className="relative -mt-2">
            {/* Dynamic avatar container */}
            <div className="profile-avatar dash-profile-avatar w-24 h-24 border-2 border-[#fde047] p-1 shadow-[0_0_20px_rgba(253,224,71,0.5)] bg-[#1c1b1b] overflow-hidden rounded-2xl flex items-center justify-center">
              <span className="material-symbols-outlined text-4xl text-[#fde047]">shield_person</span>
            </div>
          </div>

          <div className="flex flex-col items-end gap-3 mt-1">
            <div className="flex items-center gap-2">
              <button
                className="dash-header-btn w-11 h-11 rounded-xl bg-[#2a2a2a]/80 backdrop-blur border border-white/10 flex items-center justify-center text-white hover:bg-purple-600/30 transition-all"
                onClick={(e) => {
                  e.stopPropagation();
                  onNavigate('social');
                }}
                aria-label="Social"
              >
                <span className="material-symbols-outlined text-[22px]">person</span>
              </button>

              <button
                className="dash-header-btn w-11 h-11 rounded-xl bg-[#2a2a2a]/80 backdrop-blur border border-white/10 flex items-center justify-center text-white hover:bg-purple-600/30 transition-all relative"
                onClick={(e) => {
                  e.stopPropagation();
                }}
                aria-label="Calendário"
              >
                <span className="material-symbols-outlined text-[22px]">calendar_today</span>
              </button>

              <button
                className="dash-header-btn w-11 h-11 rounded-xl bg-[#2a2a2a]/80 backdrop-blur border border-white/10 flex items-center justify-center text-white hover:bg-purple-600/30 transition-all"
                onClick={(e) => {
                  e.stopPropagation();
                }}
                aria-label="Menu"
              >
                <span className="material-symbols-outlined text-[22px]">menu</span>
              </button>
            </div>
          </div>
        </div>

        {/* Welcome text and missions */}
        <div className="flex justify-between items-end z-20 w-full mt-auto relative">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <span className="font-['Outfit'] text-gray-400 text-xs tracking-widest uppercase">
                Bem vindo de volta,
              </span>
            </div>
            <h1 className="font-['Rajdhani'] font-bold text-3xl text-white uppercase drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)]">
              DECEPTIVON
            </h1>
          </div>

          <div
            className="flex flex-col items-end gap-1 ml-4 cursor-pointer"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="font-['Rajdhani'] text-[9px] bg-black/70 px-2 py-0.5 rounded text-white/90 uppercase whitespace-nowrap mb-0.5">
              MISSÕES
            </div>
            <div className="dash-missions-pill flex items-center gap-2 bg-black/60 backdrop-blur-md rounded-full py-1.5 pr-4 pl-1.5 border border-[#fde047]/40">
              <div className="dash-missions-hexagon w-7 h-7 bg-[#d97706] flex items-center justify-center rounded-lg shadow-[0_0_10px_rgba(217,119,6,0.6)]">
                <span className="material-symbols-outlined text-white text-[16px]">crown</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="dash-missions-val font-mono text-white text-xs font-bold">0/30</span>
                <div className="dash-missions-progress-bar w-24 h-2.5 bg-[#353534] rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-[#fde047] to-[#d97706] w-0 rounded-full shadow-[0_0_8px_rgba(253,224,71,0.5)]" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* ── CENTER SECTION: Unified Arena Card (Tactical Radar) ── */}
      <div className="dash-arena-card bg-[#0a0514]/80 border border-[#8b5cf6]/30 rounded-3xl p-5 backdrop-blur-md shadow-2xl">
        <div className="dash-arena-content">
          <div className="dash-radar-header flex justify-between items-center mb-4">
            <h3 className="font-['Rajdhani'] font-bold text-lg text-white uppercase tracking-wider">
              Atributos de Performance
            </h3>
            <div className="dash-radar-toggle flex gap-1 bg-[#1c1b1b] p-1 rounded-xl border border-white/10">
              <button
                className={`btn btn-sm px-3 py-1 text-[10px] font-extrabold rounded-lg transition-all ${
                  radarFilter === 'MENSAL'
                    ? 'bg-[#8b5cf6] text-white font-bold shadow-[0_0_10px_rgba(139,92,246,0.5)]'
                    : 'text-gray-400 hover:text-white'
                }`}
                onClick={() => setRadarFilter('MENSAL')}
              >
                MENSAL
              </button>
              <button
                className={`btn btn-sm px-3 py-1 text-[10px] font-extrabold rounded-lg transition-all ${
                  radarFilter === 'TOTAL'
                    ? 'bg-[#8b5cf6] text-white font-bold shadow-[0_0_10px_rgba(139,92,246,0.5)]'
                    : 'text-gray-400 hover:text-white'
                }`}
                onClick={() => setRadarFilter('TOTAL')}
              >
                TOTAL
              </button>
            </div>
          </div>

          {/* Radar Chart SVG Visual Hexagon */}
          <div className="dash-radar-container flex justify-center items-center py-6 relative">
            <svg viewBox="0 0 300 240" className="w-full max-w-[280px] h-auto">
              {/* Polygon grids */}
              <polygon points="150,20 250,70 250,170 150,220 50,170 50,70" fill="none" stroke="#353534" strokeWidth="1" />
              <polygon points="150,50 215,82 215,147 150,180 85,147 85,82" fill="none" stroke="#353534" strokeWidth="1" strokeDasharray="3 3" />
              <polygon points="150,80 180,95 180,135 150,150 120,135 120,95" fill="none" stroke="#353534" strokeWidth="1" strokeDasharray="3 3" />
              
              {/* Value Polygon */}
              <polygon points="150,100 170,110 160,130 150,140 135,125 135,105" fill="rgba(192, 132, 252, 0.4)" stroke="#c084fc" strokeWidth="2" />

              {/* Axis labels */}
              <text x="150" y="14" fill="#cbc3d7" fontSize="10" textAnchor="middle" fontFamily="Rajdhani" fontWeight="bold">FORÇA</text>
              <text x="260" y="70" fill="#cbc3d7" fontSize="10" textAnchor="start" fontFamily="Rajdhani" fontWeight="bold">RESISTÊNCIA</text>
              <text x="260" y="175" fill="#cbc3d7" fontSize="10" textAnchor="start" fontFamily="Rajdhani" fontWeight="bold">INTENSIDADE</text>
              <text x="150" y="235" fill="#cbc3d7" fontSize="10" textAnchor="middle" fontFamily="Rajdhani" fontWeight="bold">EQUILÍBRIO</text>
              <text x="40" y="175" fill="#cbc3d7" fontSize="10" textAnchor="end" fontFamily="Rajdhani" fontWeight="bold">CARDIO</text>
              <text x="40" y="70" fill="#cbc3d7" fontSize="10" textAnchor="end" fontFamily="Rajdhani" fontWeight="bold">POTÊNCIA</text>
            </svg>
          </div>
        </div>
      </div>

      {/* ── SUGGESTED WORKOUT CARD (Unified Bottom Bar Card) ── */}
      <div className="dash-suggested-workout-wrapper">
        <div className="dash-suggested-workout-card flex items-center justify-between gap-3 bg-[#1c1b1b] border border-[#8b5cf6]/30 p-3 rounded-2xl shadow-xl">
          {/* Left Card: Workout suggestion details */}
          <button
            className="dash-workout-exercise-card flex items-center gap-3 bg-transparent text-left focus:outline-none"
            onClick={onOpenFicha}
          >
            <div className="dash-workout-img-container relative w-14 h-14 rounded-xl overflow-hidden bg-[#2a2a2a] border border-white/10 flex-shrink-0">
              <div className="w-full h-full bg-gradient-to-br from-purple-900 to-indigo-950 flex items-center justify-center">
                <span className="material-symbols-outlined text-[#c084fc]">fitness_center</span>
              </div>
              <div className="dash-workout-letter-badge absolute bottom-0 right-0 bg-[#8b5cf6] text-white font-['Rajdhani'] font-bold text-xs px-1.5 py-0.5 rounded-tl-md">
                A
              </div>
            </div>
            <div className="dash-workout-card-details">
              <span className="dash-workout-label block font-['Rajdhani'] text-[10px] text-gray-400 tracking-wider uppercase">
                TREINO
              </span>
              <span className="dash-workout-ex-count font-['Rajdhani'] font-bold text-white text-sm">
                8 ex
              </span>
            </div>
          </button>

          {/* Center: Metallic textured "PRÓXIMO PASSO" button */}
          <button
            className="dash-next-step-btn flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 hover:from-purple-500 hover:to-indigo-500 text-white font-['Rajdhani'] font-black text-sm tracking-widest uppercase shadow-[0_0_15px_rgba(139,92,246,0.6)] transition-all border border-purple-400/40 text-center"
            onClick={onOpenFicha}
          >
            PRÓXIMO PASSO
          </button>
        </div>
      </div>
    </div>
  );
};
