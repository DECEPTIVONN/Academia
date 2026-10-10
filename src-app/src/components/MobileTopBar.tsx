/**
 * MobileTopBar.tsx — Top Bar de utilitários do mobile (< 1024px)
 *
 * Port adaptado do `MobileTopBar` do NavigationShellStandalone.tsx de referência,
 * no design system do Academia (tokens roxos, glassmorphism, BEM `.top-bar*`):
 *   • esquerda: avatar (atalho direto para o overlay do Perfil);
 *   • centro: marca ACADEMIA / WORKOUT TRACKER;
 *   • direita: busca geral unificada + alternador de tela cheia.
 *
 * Layout em `lg:hidden` via CSS (shell.css) — no desktop quem aparece é a
 * Sidebar HUD. O elemento é item de fluxo da coluna flex do App (não fixed),
 * então nada rola por baixo dele.
 */

import React from 'react';
import { useProfileState } from '@/features/profile/useProfileState';
import { SvgMaximize, SvgMinimize, SvgSearch } from '@/components/nav-items';

interface MobileTopBarProps {
  onOpenProfile: () => void;
  onOpenSearch: () => void;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
}

export const MobileTopBar: React.FC<MobileTopBarProps> = ({
  onOpenProfile,
  onOpenSearch,
  isFullscreen,
  onToggleFullscreen,
}) => {
  const { state } = useProfileState();
  const nome = state?.customization?.nome?.trim() || 'Atleta';
  const initial = nome.charAt(0).toUpperCase();

  return (
    <header className="top-bar" id="mobileTopBar">
      <button
        type="button"
        className="top-bar__avatar"
        onClick={onOpenProfile}
        aria-label={`Abrir perfil de ${nome}`}
        title="Meu Perfil"
      >
        {initial}
      </button>

      <div className="top-bar__brand" aria-hidden="true">
        <span className="top-bar__brand-main">Academia</span>
        <span className="top-bar__brand-sub">Workout Tracker</span>
      </div>

      <div className="top-bar__actions">
        <button
          type="button"
          className="top-bar__btn"
          onClick={onOpenSearch}
          aria-label="Buscar em tudo"
          title="Buscar geral (Ctrl+K)"
        >
          {SvgSearch}
        </button>
        <button
          type="button"
          className={isFullscreen ? 'top-bar__btn top-bar__btn--active' : 'top-bar__btn'}
          onClick={onToggleFullscreen}
          aria-label={isFullscreen ? 'Sair da tela cheia' : 'Ativar tela cheia'}
          title={isFullscreen ? 'Sair de tela cheia' : 'Modo tela cheia'}
        >
          {isFullscreen ? SvgMinimize : SvgMaximize}
        </button>
      </div>
    </header>
  );
};

export default MobileTopBar;
