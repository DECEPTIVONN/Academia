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
 *   • utils: busca (Ctrl/Cmd+K), tela cheia, bloquear app + versão.
 *
 * O hover só alterna o estado expandido; a largura do CONTEÚDO (.shell-body)
 * segue apenas a preferência fixada — sem "pulo" de layout ao passar o mouse.
 */

import React, { useState } from 'react';
import { useLocalData } from '@/hooks/useLocalData';
import { useProfileState } from '@/features/profile/useProfileState';
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
              <span className="side-hud__level">Nível {level}</span>
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
            <span>
              {xpInLevel}/100 XP · {xp} total
            </span>
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
          title="Buscar em tudo (Ctrl/Cmd + K)"
        >
          <span className="side-hud__icon" aria-hidden="true">
            {SvgSearch}
          </span>
          <span className="side-hud__label">
            <span className="side-hud__label-main">Buscar</span>
            <span className="side-hud__label-desc">Ctrl/Cmd + K</span>
          </span>
        </button>
        {NavSectionItems.map((item) => (
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

        <button type="button" className="side-hud__util" onClick={onLockApp} title="Trancar o app agora">
          <span className="side-hud__util-icon" aria-hidden="true">
            {SvgLock}
          </span>
          <span className="side-hud__util-label">Trancar</span>
        </button>

        <div className="side-hud__foot">Academia · v4.6</div>
      </div>
    </aside>
  );
};

export default DesktopSidebar;
