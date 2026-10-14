/**
 * MobileDrawer.tsx — Drawer lateral de navegação mobile (< 1024px)
 *
 * v4.8.3-navbars — aberta pelo item Menu (1º da barra inferior).
 * Port adaptado do MobileDrawer do NavigationShellStandalone.tsx:
 *   • head: avatar do perfil (ProfileEmblem) + nome/nível/XP + fechar;
 *   • nav: Busca Geral, Progresso (atalho da seção), Notícias, Missões,
 *     Configurações;
 *   • rodapé: entrar/sair da tela cheia.
 * Animação: springs (SPRING_SETTLE/SPRING_EXIT); estilos em shell.css (.mdw__*).
 */

import React, { useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { SPRING_SETTLE } from '@/lib/motion-presets';
import { useLocalData } from '@/hooks/useLocalData';
import { useProfileState } from '@/features/profile/useProfileState';
import { getLevel, getStreak, getXp } from '@/core/db/queries';
import { ProfileEmblem } from '@/components/ProfileEmblem';
import { SvgMaximize, SvgMinimize, SvgSearch } from '@/components/nav-items';
import type { SectionType } from '@/components/BottomNav';

interface MobileDrawerProps {
  open: boolean;
  onClose: () => void;
  activeSection: SectionType;
  onSelectSection: (sec: SectionType) => void;
  onOpenSearch: () => void;
  onOpenProfile: () => void;
  /** Navega ao Início e abre o overlay de Notícias */
  onOpenNews: () => void;
  /** Navega ao Início e abre o overlay de Missões */
  onOpenMissions: () => void;
  /** Abre o hub do Perfil já nas Configurações */
  onOpenSettings: () => void;
  /** v4.21.0 — abre a interface de Músicas e Playlists */
  onOpenMusic: () => void;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
}

const SvgX = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const SvgNews = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="20" height="20">
    <path d="M4 22h16a2 2 0 002-2V4a2 2 0 00-2-2H8a2 2 0 00-2 2v16a2 2 0 01-2 2zm0 0a2 2 0 01-2-2v-9c0-1.1.9-2 2-2h2" />
    <path d="M18 14h-8" />
    <path d="M15 18h-5" />
    <path d="M10 6h8v4h-8V6z" />
  </svg>
);

const SvgMissions = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="20" height="20">
    <path d="M9 11l3 3L22 4" />
    <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
  </svg>
);

const SvgProgress = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="20" height="20">
    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
  </svg>
);

const SvgGear = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="20" height="20">
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 01-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
  </svg>
);

/* v4.21.0 — atalho da interface de Músicas e Playlists */
const SvgMusic = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="20" height="20">
    <path d="M9 18V5l12-2v13" />
    <circle cx="6" cy="18" r="3" />
    <circle cx="18" cy="16" r="3" />
  </svg>
);

export const MobileDrawer: React.FC<MobileDrawerProps> = ({
  open,
  onClose,
  activeSection,
  onSelectSection,
  onOpenSearch,
  onOpenProfile,
  onOpenNews,
  onOpenMissions,
  onOpenSettings,
  onOpenMusic,
  isFullscreen,
  onToggleFullscreen,
}) => {
  const { state } = useProfileState();
  const { history } = useLocalData();

  const nome = state?.customization?.nome?.trim() || 'Atleta';
  const xp = getXp(history);
  const level = getLevel(xp);
  const streak = getStreak(history);

  /* Body-lock enquanto aberta (padrão dos overlays do App) */
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  /* ESC fecha a drawer */
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  const items: {
    id: string;
    label: string;
    desc: string;
    icon: React.ReactNode;
    onClick: () => void;
    active?: boolean;
  }[] = [
    {
      id: 'buscar',
      label: 'Busca Geral',
      desc: 'Seções, exercícios, fichas e configs',
      icon: SvgSearch,
      onClick: onOpenSearch,
    },
    {
      id: 'progresso',
      label: 'Progresso',
      desc: 'Gráficos, calendário e histórico',
      icon: SvgProgress,
      onClick: () => onSelectSection('progresso'),
      active: activeSection === 'progresso',
    },
    {
      id: 'noticias',
      label: 'Notícias',
      desc: 'Feed de atualizações do app',
      icon: SvgNews,
      onClick: onOpenNews,
    },
    {
      id: 'missoes',
      label: 'Missões',
      desc: 'Metas diárias e recompensas',
      icon: SvgMissions,
      onClick: onOpenMissions,
    },
    {
      id: 'musicas',
      label: 'Músicas',
      desc: 'Playlists e trilhas do treino',
      icon: SvgMusic,
      onClick: onOpenMusic,
    },
    {
      id: 'config',
      label: 'Configurações',
      desc: 'Cores, exibição, segurança e conta',
      icon: SvgGear,
      onClick: onOpenSettings,
    },
  ];

  return (
    <AnimatePresence>
      {open && (
        <div className="mdw" role="dialog" aria-modal="true" aria-label="Menu de navegação">
          {/* Backdrop escuro translúcido */}
          <motion.button
            type="button"
            className="mdw__backdrop"
            aria-label="Fechar menu"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.28, ease: 'easeOut' }}
            onClick={onClose}
          />

          {/* Painel deslizante */}
          <motion.div
            className="mdw__panel"
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={SPRING_SETTLE}
          >
            {/* Head: eyebrow + fechar */}
            <div className="mdw__head">
              <span className="mdw__eyebrow">Navegação</span>
              <button type="button" className="mdw__close" onClick={onClose} aria-label="Fechar menu">
                {SvgX}
              </button>
            </div>

            {/* Cartão de perfil */}
            <button type="button" className="mdw__profile" onClick={onOpenProfile}>
              <span className="mdw__avatar" aria-hidden="true">
                <ProfileEmblem customization={state?.customization} />
              </span>
              <span className="mdw__id">
                <span className="mdw__name">{nome}</span>
                <span className="mdw__meta">
                  <span className="mdw__level">Nível {level}</span>
                  <span className="mdw__xp">{xp} XP</span>
                  <span className="mdw__streak" title={`Ofensiva de ${streak} dia(s)`}>
                    🔥 {streak}d
                  </span>
                </span>
              </span>
            </button>

            {/* Lista de navegação */}
            <nav className="mdw__nav" aria-label="Atalhos">
              {items.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={item.active ? 'mdw__item mdw__item--active' : 'mdw__item'}
                  onClick={item.onClick}
                  aria-current={item.active ? 'page' : undefined}
                >
                  <span className="mdw__item-icon" aria-hidden="true">
                    {item.icon}
                  </span>
                  <span className="mdw__item-text">
                    <span className="mdw__item-label">{item.label}</span>
                    <span className="mdw__item-desc">{item.desc}</span>
                  </span>
                </button>
              ))}
            </nav>

            {/* Rodapé: tela cheia */}
            <div className="mdw__foot">
              <button
                type="button"
                className="mdw__item mdw__item--foot"
                onClick={onToggleFullscreen}
              >
                <span className="mdw__item-icon" aria-hidden="true">
                  {isFullscreen ? SvgMinimize : SvgMaximize}
                </span>
                <span className="mdw__item-text">
                  <span className="mdw__item-label">
                    {isFullscreen ? 'Sair da tela cheia' : 'Tela cheia'}
                  </span>
                </span>
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default MobileDrawer;
