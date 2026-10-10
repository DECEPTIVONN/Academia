import { StrictMode } from 'react';
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
import { initPwaInstall } from '@/lib/pwa-install';

// Captura do beforeinstallprompt (instalação PWA) + tela cheia automática
// no primeiro clique/toque (v4.4.0) — precisam estar ativos antes do render.
initPwaInstall();
initAutoFullscreen();

// Seed + migração do localStorage legado (v3.5.7) + flush da fila offline.
// Assíncrono: não bloqueia o primeiro render; a UI escuta 'academia:db-ready'.
void bootstrap();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
