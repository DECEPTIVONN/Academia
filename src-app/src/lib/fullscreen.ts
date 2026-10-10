/**
 * fullscreen.ts — Modo tela cheia manual com compatibilidade cross-browser.
 *
 * Port adaptado do `useCrossBrowserFullscreen` do NavigationShellStandalone.tsx
 * (arquivo de referência), normalizando os prefixes webkit/moz/ms e mantendo o
 * estado sincronizado em bidirecional via `fullscreenchange`.
 *
 * Não confundir com `lib/auto-fullscreen.ts` (pref de primeiro gesto da v4.4.0):
 * este hook é a UI manual (botões do Top Bar e da Sidebar HUD).
 */

import { useCallback, useEffect, useState } from 'react';

type FsDocument = Document & {
  webkitFullscreenElement?: Element | null;
  mozFullScreenElement?: Element | null;
  msFullscreenElement?: Element | null;
  webkitExitFullscreen?: () => Promise<void> | void;
  mozCancelFullScreen?: () => Promise<void> | void;
  msExitFullscreen?: () => Promise<void> | void;
};

type FsElement = HTMLElement & {
  webkitRequestFullscreen?: () => Promise<void> | void;
  mozRequestFullScreen?: () => Promise<void> | void;
  msRequestFullscreen?: () => Promise<void> | void;
};

const FS_EVENTS = [
  'fullscreenchange',
  'webkitfullscreenchange',
  'mozfullscreenchange',
  'MSFullscreenChange',
] as const;

function activeFullscreen(): boolean {
  const doc = document as FsDocument;
  return !!(
    document.fullscreenElement ||
    doc.webkitFullscreenElement ||
    doc.mozFullScreenElement ||
    doc.msFullscreenElement
  );
}

export function useCrossBrowserFullscreen() {
  const [isFullscreen, setIsFullscreen] = useState<boolean>(() =>
    typeof document === 'undefined' ? false : activeFullscreen()
  );

  useEffect(() => {
    const handleFsChange = () => setIsFullscreen(activeFullscreen());
    for (const evt of FS_EVENTS) document.addEventListener(evt, handleFsChange);
    return () => {
      for (const evt of FS_EVENTS) document.removeEventListener(evt, handleFsChange);
    };
  }, []);

  const toggleFullscreen = useCallback(() => {
    try {
      const doc = document as FsDocument;
      const docEl = document.documentElement as FsElement;

      if (!isFullscreen) {
        if (docEl.requestFullscreen) docEl.requestFullscreen().catch(() => {});
        else if (docEl.webkitRequestFullscreen) docEl.webkitRequestFullscreen();
        else if (docEl.mozRequestFullScreen) docEl.mozRequestFullScreen();
        else if (docEl.msRequestFullscreen) docEl.msRequestFullscreen();
      } else {
        if (doc.exitFullscreen) doc.exitFullscreen().catch(() => {});
        else if (doc.webkitExitFullscreen) doc.webkitExitFullscreen();
        else if (doc.mozCancelFullScreen) doc.mozCancelFullScreen();
        else if (doc.msExitFullscreen) doc.msExitFullscreen();
      }
    } catch (err) {
      console.warn('Fullscreen request failed:', err);
    }
  }, [isFullscreen]);

  return { isFullscreen, toggleFullscreen };
}
