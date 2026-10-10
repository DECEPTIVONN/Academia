/**
 * MobileTopBar.tsx — Top Bar de utilitários do mobile (< 1024px)
 *
 * Port fiel ao `MobileTopBar` do NavigationShellStandalone.tsx de referência,
 * no design system do Academia (tokens roxos, glassmorphism, BEM `.top-bar*`):
 *   • barra FIXED translúcida por cima do conteúdo (sem texto de marca);
 *   • esquerda: avatar (atalho direto para o overlay do Perfil);
 *   • direita: busca geral unificada + alternador de tela cheia.
 *
 * No desktop (≥ 1024px) some via CSS (shell.css) — quem aparece é a
 * Sidebar HUD. Como é fixed, o `.shell-body` compensa com padding-top.
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
        title="Abrir Perfil"
      >
        {initial}
      </button>

      <div className="top-bar__actions">
        <button
          type="button"
          className="top-bar__btn"
          onClick={onOpenSearch}
          aria-label="Buscar em tudo"
          title="Buscar Geral (Ctrl+K)"
        >
          {SvgSearch}
        </button>
        <button
          type="button"
          className={isFullscreen ? 'top-bar__btn top-bar__btn--active' : 'top-bar__btn'}
          onClick={onToggleFullscreen}
          aria-label={isFullscreen ? 'Sair da tela cheia' : 'Ativar tela cheia'}
          title="Modo Tela Cheia"
        >
          {isFullscreen ? SvgMinimize : SvgMaximize}
        </button>
      </div>
    </header>
  );
};

export default MobileTopBar;
