/**
 * BottomNav.tsx — Barra de navegação inferior (treino.html L1046-1077)
 *
 * DOM 1:1 com o legado: os estilos vêm exclusivamente de 7-nav-icons.css
 * (.bottom-nav / .bnav-btn / .bnav-icon / .bnav-label / .bnav-active-dot).
 * Nenhuma utility Tailwind é aplicada aqui — no legado as utilities do CDN
 * competem com o CSS do mesmo arquivo, e no App (Tailwind v4 em @layer) elas
 * perderiam para as regras não camadeadas do CSS legado, gerando labels
 * sobrepostos (padding/ tracking/ font-size divergentes).
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
  const navItems: { id: SectionType; domId: string; label: string; icon: React.ReactNode }[] = [
    {
      id: 'progresso',
      domId: 'bnavProgresso',
      label: 'Progresso',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
        </svg>
      ),
    },
    {
      id: 'treinos',
      domId: 'bnavTreinos',
      label: 'Treinos',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6.5 6.5h11M6.5 17.5h11M12 6.5v11" />
          <circle cx="4" cy="12" r="1.5" />
          <circle cx="20" cy="12" r="1.5" />
        </svg>
      ),
    },
    {
      id: 'dashboard',
      domId: 'bnavDashboard',
      label: 'Início',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="7" height="9" rx="1" />
          <rect x="14" y="3" width="7" height="5" rx="1" />
          <rect x="14" y="12" width="7" height="9" rx="1" />
          <rect x="3" y="16" width="7" height="5" rx="1" />
        </svg>
      ),
    },
    {
      id: 'social',
      domId: 'bnavSocial',
      label: 'Social',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
        </svg>
      ),
    },
    {
      id: 'loja',
      domId: 'bnavLoja',
      label: 'Loja',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
          <line x1="3" y1="6" x2="21" y2="6" />
          <path d="M16 10a4 4 0 01-8 0" />
        </svg>
      ),
    },
  ];

  return (
    <nav className="bottom-nav" id="bottomNav" role="navigation" aria-label="Navegação principal">
      {navItems.map((item) => {
        const isActive = activeSection === item.id;

        return (
          <button
            key={item.id}
            type="button"
            className={isActive ? 'bnav-btn active' : 'bnav-btn'}
            data-section={item.id}
            id={item.domId}
            aria-label={item.label}
            onClick={() => onSelectSection(item.id)}
          >
            <div className="bnav-icon">{item.icon}</div>
            <span className="bnav-label">{item.label}</span>
            <div className="bnav-active-dot" />
          </button>
        );
      })}
    </nav>
  );
};
