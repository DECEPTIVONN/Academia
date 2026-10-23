import { Component, StrictMode, type ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import './styles/legacy.css';
import './styles/globals.css';
import './styles/design-tokens.css';
// v4.6.0-shell — casca adaptativa (Top Bar/Sidebar HUD/medi queries): precisa
// vir DEPOIS de legacy.css/globals.css para sobrescrever larguras legadas.
import './styles/shell.css';
import App from './App.tsx';
import { bootstrap } from '@/core/db/bootstrap';
import { initAutoFullscreen } from '@/lib/auto-fullscreen';
import { initBackgroundMusic } from '@/lib/background-music';
import { initAudioEngine } from '@/features/music/audio-engine';
import { initPwaInstall } from '@/lib/pwa-install';

/* v4.16.0-boot — API de boot publicada pelo script inline do index.html
   (watchdog da splash). Usada para mostrar o overlay de erro imediatamente
   quando a UI quebra, em vez de deixar a tela preta. */
interface BootApi {
  showError(msg: string): void;
  showLoading(): void;
}
declare global {
  interface Window {
    __academiaBoot?: BootApi;
  }
}

/**
 * ErrorBoundary de boot (v4.16.0-boot).
 *
 * Sem ele, uma exceção durante o primeiro render desmontava a árvore React
 * inteira → `#root` ficava vazio → TELA PRETA (sintoma reportado no mobile).
 * Agora a falha vira uma tela de erro acionável (Tentar novamente) + detalhes,
 * com o mesmo visual do overlay de boot do index.html.
 */
export class BootErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    console.error('[academia] falha ao renderizar a UI:', err);
    try {
      window.__academiaBoot?.showError('Erro na interface: ' + err.message);
    } catch {
      /* overlay indisponível — o fallback renderizado abaixo assume */
    }
  }

  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <div className="boot-overlay" role="alert">
        <div className="boot-title">Não foi possível carregar o app</div>
        <div className="boot-msg">
          A interface encontrou um erro e foi interrompida. Tente novamente — se o
          problema persistir, recarregue a página.
        </div>
        <div className="boot-actions">
          <button type="button" className="boot-btn" onClick={() => window.location.reload()}>
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }
}

// Captura do beforeinstallprompt (instalação PWA) + tela cheia automática
// no primeiro clique/toque (v4.4.0) — precisam estar ativos antes do render.
initPwaInstall();
initAutoFullscreen();
// v4.19.0-music — motor multi-contexto (treino/conclusão/missões + playlists)
// assume a reprodução ANTES do initBackgroundMusic (senão haveria dois
// players de MAIN.mp3 em paralelo; claimMusicPlayback() troca a posse).
initAudioEngine();
// v4.18.0-music — prefs de música (master/volume): com a posse no motor,
// só aplica as prefs salvas (a reprodução é do audio-engine).
initBackgroundMusic();

// Reset único de dados legados (v4.43.2): remove sync keys/dados antigos para
// garantir vinculação automática da sync key à conta. Usuários logados precisam
// fazer login novamente e começam "do zero".
const RESET_VERSION = 'v4.43.2-account-sync';
try {
  if (localStorage.getItem('academia_reset_version') !== RESET_VERSION) {
    // Limpa localStorage (auth, sync, prefs, tema, etc.)
    try { localStorage.clear(); } catch { /* noop */ }
    try { sessionStorage.clear(); } catch { /* noop */ }
    // Remove bancos IndexedDB locais.
    for (const name of ['academia-v4', 'academia_offline_resilience_db', 'academia_media_db', 'mbc_offline_sync_db']) {
      try { indexedDB.deleteDatabase(name); } catch { /* noop */ }
    }
    localStorage.setItem('academia_reset_version', RESET_VERSION);
    // Recarrega para aplicar o reset limpo.
    window.location.reload();
  }
} catch {
  /* storage indisponível — segue sem reset */
}

// Seed + migração do localStorage legado (v3.5.7) + flush da fila offline.
// Assíncrono: não bloqueia o primeiro render; a UI escuta 'academia:db-ready'.
void bootstrap();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BootErrorBoundary>
      <App />
    </BootErrorBoundary>
  </StrictMode>,
);
