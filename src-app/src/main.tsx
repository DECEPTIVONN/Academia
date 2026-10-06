import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './styles/legacy.css';
import './styles/globals.css';
import './styles/design-tokens.css';
import './styles/dynamic-bg.css';
import App from './App.tsx';
import { bootstrap } from '@/core/db/bootstrap';

// Seed + migração do localStorage legado (v3.5.7) + flush da fila offline.
// Assíncrono: não bloqueia o primeiro render; a UI escuta 'academia:db-ready'.
void bootstrap();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
