/**
 * BottomNav.tsx — Barra de navegação inferior (treino.html L1046-1077)
 *
 * DOM 1:1 com o legado: os estilos vêm exclusivamente de 7-nav-icons.css
 * (.bottom-nav / .bnav-btn / .bnav-icon / .bnav-label / .bnav-active-dot).
 * Nenhuma utility Tailwind é aplicada aqui — no legado as utilities do CDN
 * competem com o CSS do mesmo arquivo, e no App (Tailwind v4 em @layer) elas
 * perderiam para as regras não camadeadas do CSS legado, gerando labels
 * sobrepostos (padding/ tracking/ font-size divergentes).
 *
 * v4.8.3-navbars:
 *   • 1º item da barra = Menu (hamburger) → abre a drawer lateral
 *     (MobileDrawer — perfil, busca, atalhos e tela cheia);
 *   • formato da barra controlado por academia_pref_navbar_shape:
 *     'straight' = reta legado; 'oval' = curva neon (shell.css .bnav-oval,
 *     port do MobileCurvedNavbar do NavigationShellStandalone.tsx);
 *   • Progresso REMOVIDO da barra (mantido só na sidebar desktop e na
 *     drawer mobile) — a barra fica Menu + 4 seções.
 */

import React, { useEffect, useRef, useState } from 'react';

export type SectionType = 'progresso' | 'treinos' | 'dashboard' | 'social' | 'loja';

interface BottomNavProps {
  activeSection: SectionType;
  onSelectSection: (section: SectionType) => void;
  /** v4.8.3 — item Menu (1º da barra) abre a drawer lateral */
  onOpenMenu: () => void;
}

/* Pref de navbar (SettingsFeature → Exibição → Barra de Navegação).
   'fixed' = sempre visível (legado); 'flexible' = recolhe ao rolar para
   baixo e volta ao rolar para cima (threshold de 8 px para evitar
   micro-tremores em scroll momentum). */
const NAVBAR_MODE_KEY = 'academia_pref_navbar_mode';
/* v4.8.3 — formato visual: 'straight' (reta legado) | 'oval' (curva neon) */
const NAVBAR_SHAPE_KEY = 'academia_pref_navbar_shape';

const SvgMenu = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="3" y1="6" x2="21" y2="6" />
    <line x1="3" y1="12" x2="21" y2="12" />
    <line x1="3" y1="18" x2="21" y2="18" />
  </svg>
);

export const BottomNav: React.FC<BottomNavProps> = ({
  activeSection,
  onSelectSection,
  onOpenMenu,
}) => {
  const navRef = useRef<HTMLElement>(null);
  const hiddenRef = useRef(false);
  const lastTopRef = useRef(0);
  const [shape, setShape] = useState<string>(() => {
    try {
      return localStorage.getItem(NAVBAR_SHAPE_KEY) || 'straight';
    } catch {
      return 'straight';
    }
  });

  useEffect(() => {
    const isFlexible = () => {
      try {
        return localStorage.getItem(NAVBAR_MODE_KEY) === 'flexible';
      } catch {
        return false;
      }
    };

    const setHidden = (hidden: boolean) => {
      if (hiddenRef.current === hidden) return;
      hiddenRef.current = hidden;
      navRef.current?.classList.toggle('bnav-hidden', hidden);
    };

    /* Scroll acontece dentro de .section-slide (overflow-y:auto) —
       escutamos em window capture para pegar qualquer slide montado. */
    const onScroll = (e: Event) => {
      const target = e.target as HTMLElement | null;
      if (!target || !target.classList?.contains('section-slide')) return;
      if (!isFlexible()) {
        setHidden(false);
        return;
      }
      const top = target.scrollTop;
      const last = lastTopRef.current;
      lastTopRef.current = top;
      if (top < 8) {
        /* perto do topo → sempre mostra */
        setHidden(false);
      } else if (top > last + 8) {
        /* rolando para baixo → recolhe */
        setHidden(true);
      } else if (top < last - 8) {
        /* rolando para cima → mostra */
        setHidden(false);
      }
    };

    /* Troca de seção (novo .section-slide) → reseta referência e mostra */
    const onModeChanged = () => {
      lastTopRef.current = 0;
      if (!isFlexible()) setHidden(false);
    };

    window.addEventListener('scroll', onScroll, true);
    window.addEventListener('academia:navbar-mode-changed', onModeChanged);
    return () => {
      window.removeEventListener('scroll', onScroll, true);
      window.removeEventListener('academia:navbar-mode-changed', onModeChanged);
    };
  }, []);

  /* Formato (reta/oval) — reage ao seletor das Configurações em tempo real */
  useEffect(() => {
    const onShapeChanged = () => {
      try {
        setShape(localStorage.getItem(NAVBAR_SHAPE_KEY) || 'straight');
      } catch {
        setShape('straight');
      }
    };
    window.addEventListener('academia:navbar-shape-changed', onShapeChanged);
    return () => window.removeEventListener('academia:navbar-shape-changed', onShapeChanged);
  }, []);

  /* Troca de seção → novo slide começa no topo; mostra a navbar e zera a ref */
  useEffect(() => {
    lastTopRef.current = 0;
    if (hiddenRef.current) {
      hiddenRef.current = false;
      navRef.current?.classList.remove('bnav-hidden');
    }
  }, [activeSection]);

  /* v4.8.3.1: Progresso saiu da barra inferior (mantido na sidebar desktop
     e na drawer mobile) — a barra fica Menu + Treinos/Início/Social/Loja. */
  const navItems: { id: SectionType; domId: string; label: string; icon: React.ReactNode }[] = [
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

  const isOval = shape === 'oval';

  return (
    <nav
      ref={navRef}
      className={isOval ? 'bottom-nav bnav-oval' : 'bottom-nav'}
      id="bottomNav"
      role="navigation"
      aria-label="Navegação principal"
    >
      {/* Curva neon de fundo (modo oval) — port do MobileCurvedNavbar */}
      {isOval && (
        <svg
          className="bnav-oval__curve"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <path
            className="bnav-oval__curve-fill"
            d="M 0 30 Q 50 0 100 30 L 100 100 L 0 100 Z"
          />
          <path
            className="bnav-oval__curve-stroke"
            d="M 0 30 Q 50 0 100 30"
            vectorEffect="non-scaling-stroke"
          />
        </svg>
      )}

      {/* 1º item: Menu (drawer lateral) — em ambos os formatos */}
      <button
        type="button"
        className="bnav-btn bnav-btn--menu"
        data-section="menu"
        id="bnavMenu"
        aria-label="Menu"
        onClick={onOpenMenu}
      >
        <div className="bnav-icon">{SvgMenu}</div>
        <span className="bnav-label">Menu</span>
        <div className="bnav-active-dot" />
      </button>

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
