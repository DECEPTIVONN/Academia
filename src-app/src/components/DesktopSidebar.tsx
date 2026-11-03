/**
 * DesktopSidebar.tsx — Sidebar HUD do desktop (≥ 1024px)
 *
 * Port adaptado do `DesktopSidebar`/`NavigationSidebar` do
 * NavigationShellStandalone.tsx de referência, no design system do Academia:
 *   • colapsada (76px) → expande no hover OU fixada pelo pin da preferência
 *     `academia_pref_sidebar_pinned` (persistida entre sessões);
 *   • head: avatar com o emblema do perfil (abre o Perfil) + nome/nível + fixar
 *     + micro barra de XP com contagem da ofensiva (dados do useLocalData);
 *   • nav: as 5 seções com ícones stroke (parity com a BottomNav);
 *   • utils: busca, tela cheia, bloquear app + versão.
 *
 * O hover só alterna o estado expandido; a largura do CONTEÚDO (.shell-body)
 * segue apenas a preferência fixada — sem "pulo" de layout ao passar o mouse.
 */

import React, { useState } from 'react';
import { useLocalData } from '@/hooks/useLocalData';
import { useProfileState } from '@/features/profile/useProfileState';
import { isDevMode } from '@/features/profile/profile-data';
import { getLevel, getStreak, getXp } from '@/core/db/queries';
import type { SectionType } from '@/components/BottomNav';
import { NavSectionItems } from '@/components/nav-section-items';
import { ProfileEmblem } from '@/components/ProfileEmblem';
import {
  SvgFlame,
  SvgLock,
  SvgMaximize,
  SvgMinimize,
  SvgPin,
  SvgSearch,
} from '@/components/nav-items';

/* v4.12.0 — atalhos Missões/Configurações na sidebar (parity com a
   drawer mobile e com o reference NavigationShellStandalone). */
const SvgMissions = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="20" height="20">
    <path d="M9 11l3 3L22 4" />
    <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
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

interface DesktopSidebarProps {
  activeSection: SectionType;
  onSelectSection: (sec: SectionType) => void;
  onOpenProfile: () => void;
  onOpenSearch: () => void;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  onLockApp: () => void;
  pinned: boolean;
  onTogglePin: () => void;
  /** v4.12.0 — atalho Missões (overlay do Dashboard) */
  onOpenMissions: () => void;
  /** v4.12.0 — atalho Configurações (hub do Perfil) */
  onOpenSettings: () => void;
  /** v4.21.0 — atalho Músicas e Playlists */
  onOpenMusic: () => void;
}

export const DesktopSidebar: React.FC<DesktopSidebarProps> = ({
  activeSection,
  onSelectSection,
  onOpenProfile,
  onOpenSearch,
  isFullscreen,
  onToggleFullscreen,
  onLockApp,
  pinned,
  onTogglePin,
  onOpenMissions,
  onOpenSettings,
  onOpenMusic,
}) => {
  const [hovered, setHovered] = useState(false);
  const expanded = pinned || hovered;

  const { state } = useProfileState();
  const { history } = useLocalData();

  const nome = state?.customization?.nome?.trim() || 'Atleta';

  const xp = getXp(history);
  const level = getLevel(xp);
  const xpInLevel = xp % 100;
  const streak = getStreak(history);

  return (
    <aside
      id="desktopSidebar"
      className={expanded ? 'side-hud side-hud--expanded' : 'side-hud'}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      aria-label="Navegação principal (desktop)"
    >
      {/* ── Head: perfil + fixar + XP/ofensiva ── */}
      <div className="side-hud__head">
        <div className="side-hud__head-row">
          <button
            type="button"
            className="side-hud__profile"
            onClick={onOpenProfile}
            aria-label={`Abrir perfil de ${nome}`}
            title="Meu Perfil"
          >
            <span className="side-hud__avatar" aria-hidden="true">
              <ProfileEmblem customization={state?.customization} />
            </span>
            <span className="side-hud__id">
              <span className="side-hud__name">{nome}</span>
            </span>
          </button>
          <button
            type="button"
            className={pinned ? 'side-hud__pin side-hud__pin--on' : 'side-hud__pin'}
            onClick={onTogglePin}
            aria-pressed={pinned}
            aria-label={pinned ? 'Soltar sidebar (colapsar)' : 'Fixar sidebar expandida'}
            title={pinned ? 'Soltar sidebar' : 'Manter expandida'}
          >
            {SvgPin}
          </button>
        </div>

        <div className="side-hud__xp-wrap">
          <div className="side-hud__xp-track" role="progressbar" aria-valuenow={xpInLevel} aria-valuemin={0} aria-valuemax={100} aria-label={`Progresso do nível ${level}`}>
            <div className="side-hud__xp-fill" style={{ width: `${xpInLevel}%` }} />
          </div>
          <div className="side-hud__xp-meta">
            <span className="side-hud__streak" title={`Ofensiva de ${streak} dia(s)`}>
              {SvgFlame}
              {streak}d
            </span>
          </div>
        </div>
      </div>

      {/* ── Seções (v4.8.2: Buscar é o 1º item; ordem Início→Social→Treinos→Progresso→Loja) ── */}
      <nav className="side-hud__nav" aria-label="Seções">
        <button
          type="button"
          className="side-hud__item"
          onClick={onOpenSearch}
          title="Buscar em tudo"
        >
          <span className="side-hud__icon" aria-hidden="true">
            {SvgSearch}
          </span>
          <span className="side-hud__label">
            <span className="side-hud__label-main">Buscar</span>
          </span>
        </button>
        {(['dashboard', 'treinos'] as const).map((id) => {
          const item = NavSectionItems.find((x) => x.id === id);
          if (!item) return null;
          return (
            <button
              key={item.id}
              type="button"
              className={
                item.id === activeSection
                  ? 'side-hud__item side-hud__item--active'
                  : 'side-hud__item'
              }
              onClick={() => onSelectSection(item.id)}
              aria-current={item.id === activeSection ? 'page' : undefined}
              title={item.label}
            >
              <span className="side-hud__icon" aria-hidden="true">
                {item.icon}
              </span>
              <span className="side-hud__label">
                <span className="side-hud__label-main">{item.label}</span>
                <span className="side-hud__label-desc">{item.desc}</span>
              </span>
            </button>
          );
        })}
        {/* v4.21.0 — atalho Músicas e Playlists */}
        <button
          type="button"
          className="side-hud__item"
          onClick={onOpenMusic}
          title="Músicas e Playlists"
        >
          <span className="side-hud__icon" aria-hidden="true">
            {SvgMusic}
          </span>
          <span className="side-hud__label">
            <span className="side-hud__label-main">Músicas</span>
            <span className="side-hud__label-desc">Playlists e trilhas</span>
          </span>
        </button>
        {NavSectionItems.filter((item) => item.id !== 'dashboard' && item.id !== 'treinos').map((item) => (
          <button
            key={item.id}
            type="button"
            className={
              item.id === activeSection
                ? 'side-hud__item side-hud__item--active'
                : 'side-hud__item'
            }
            onClick={() => onSelectSection(item.id)}
            aria-current={item.id === activeSection ? 'page' : undefined}
            title={item.label}
          >
            <span className="side-hud__icon" aria-hidden="true">
              {item.icon}
            </span>
            <span className="side-hud__label">
              <span className="side-hud__label-main">{item.label}</span>
              <span className="side-hud__label-desc">{item.desc}</span>
            </span>
          </button>
        ))}

        {/* v4.12.0 — atalho de Configurações (parity com drawer mobile).
            v4.66.0 — Missões DEMO parqueadas: só no modo desenvolvedor. */}
        {isDevMode() && (
          <button
            type="button"
            className="side-hud__item"
            onClick={onOpenMissions}
            title="Missões"
          >
            <span className="side-hud__icon" aria-hidden="true">
              {SvgMissions}
            </span>
            <span className="side-hud__label">
              <span className="side-hud__label-main">Missões</span>
              <span className="side-hud__label-desc">Metas e recompensas</span>
            </span>
          </button>
        )}
        <button
          type="button"
          className="side-hud__item"
          onClick={onOpenSettings}
          title="Configurações"
        >
          <span className="side-hud__icon" aria-hidden="true">
            {SvgGear}
          </span>
          <span className="side-hud__label">
            <span className="side-hud__label-main">Configurações</span>
            <span className="side-hud__label-desc">Cores, exibição e conta</span>
          </span>
        </button>
      </nav>

      {/* ── Utilitários (v4.8.2: Buscar saiu daqui — virou o 1º item da nav) ── */}
      <div className="side-hud__utils">
        <button
          type="button"
          className={isFullscreen ? 'side-hud__util side-hud__util--on' : 'side-hud__util'}
          onClick={onToggleFullscreen}
          title={isFullscreen ? 'Sair da tela cheia' : 'Modo tela cheia'}
        >
          <span className="side-hud__util-icon" aria-hidden="true">
            {isFullscreen ? SvgMinimize : SvgMaximize}
          </span>
          <span className="side-hud__util-label">
            {isFullscreen ? 'Sair da tela cheia' : 'Tela cheia'}
          </span>
        </button>

        <div className="side-hud__foot">EVO FIT · v4.6</div>
      </div>
    </aside>
  );
};

export default DesktopSidebar;
