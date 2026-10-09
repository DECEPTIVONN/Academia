/**
 * pwa-install.ts — Instalação do app como PWA (v4.4.0)
 *
 * O app já é um PWA (vite-plugin-pwa: manifest + Service Worker + offline).
 * Este módulo captura o evento `beforeinstallprompt` (Chrome/Edge/Android)
 * e expõe os helpers usados pelo botão "Instalar app" das Configurações.
 *
 * Estados:
 *  • 'available'   → o navegador ofereceu o prompt de instalação;
 *  • 'installed'   → o app já roda instalado (appinstalled ou standalone);
 *  • 'unavailable' → navegador sem suporte (ex.: iOS Safari — mostrar
 *                    instruções de "Adicionar à Tela de Início").
 */

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export type InstallState = 'available' | 'installed' | 'unavailable';

let deferredPrompt: BeforeInstallPromptEvent | null = null;
let installed = false;

function isStandalone(): boolean {
  try {
    if (window.matchMedia?.('(display-mode: standalone)').matches) return true;
    return (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
  } catch {
    return false;
  }
}

export function getInstallState(): InstallState {
  if (installed || isStandalone()) return 'installed';
  return deferredPrompt ? 'available' : 'unavailable';
}

/** Dispara o prompt nativo de instalação. */
export async function promptInstall(): Promise<'accepted' | 'dismissed' | 'unavailable'> {
  const state = getInstallState();
  if (state !== 'available' || !deferredPrompt) return 'unavailable';
  try {
    await deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    if (choice.outcome === 'accepted') {
      deferredPrompt = null;
      return 'accepted';
    }
    return 'dismissed';
  } catch {
    return 'unavailable';
  }
}

/**
 * Inicializa no boot da página (chamar antes do React, ex.: main.tsx) —
 * o `beforeinstallprompt` só é capturado se o listener já existir quando o
 * navegador o disparar.
 */
export function initPwaInstall(): void {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e as BeforeInstallPromptEvent;
    window.dispatchEvent(new CustomEvent('academia:pwa-install-available'));
  });

  window.addEventListener('appinstalled', () => {
    installed = true;
    deferredPrompt = null;
    window.dispatchEvent(new CustomEvent('academia:pwa-installed'));
  });
}
