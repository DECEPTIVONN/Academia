/**
 * BottomNav.tsx — Barra de navegação inferior Clash Royale (BottomNav)
 * Mapeamento 1:1 de treino.html
 */

import React from 'react';

export type SectionType = 'progresso' | 'treinos' | 'dashboard' | 'social' | 'loja';

interface BottomNavProps {
  activeSection: SectionType;
  onSelectSection: (section: SectionType) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeSection,
  onSelectSection,
}) => {
  const navItems = [
    {
      id: 'progresso',
      label: 'Progresso',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
        </svg>
      ),
    },
    {
      id: 'treinos',
      label: 'Treinos',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
          <path d="M6.5 6.5h11M6.5 17.5h11M12 6.5v11" />
          <circle cx="4" cy="12" r="1.5" />
          <circle cx="20" cy="12" r="1.5" />
        </svg>
      ),
    },
    {
      id: 'dashboard',
      label: 'Início',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
          <rect x="3" y="3" width="7" height="9" rx="1" />
          <rect x="14" y="3" width="7" height="5" rx="1" />
          <rect x="14" y="12" width="7" height="9" rx="1" />
          <rect x="3" y="16" width="7" height="5" rx="1" />
        </svg>
      ),
    },
    {
      id: 'social',
      label: 'Social',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
          <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
        </svg>
      ),
    },
    {
      id: 'loja',
      label: 'Loja',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
          <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
          <line x1="3" y1="6" x2="21" y2="6" />
          <path d="M16 10a4 4 0 01-8 0" />
        </svg>
      ),
    },
  ];

  return (
    <nav className="bottom-nav fixed bottom-0 left-0 right-0 z-40 bg-[#0a0514]/95 backdrop-blur-lg border-t border-[#8b5cf6]/30 px-2 py-2 text-white">
      <div className="max-w-md mx-auto flex items-center justify-around">
        {navItems.map((item) => {
          const isActive = activeSection === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onSelectSection(item.id as SectionType)}
              className={`bnav-btn relative flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all ${
                isActive ? 'active text-purple-400 font-bold' : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              <div className="bnav-icon mb-0.5">{item.icon}</div>
              <span className="bnav-label text-[10px] font-['Rajdhani'] uppercase tracking-wider">
                {item.label}
              </span>
              {isActive && <div className="bnav-active-dot" />}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
