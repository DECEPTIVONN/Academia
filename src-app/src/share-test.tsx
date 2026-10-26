/* TEMPORÁRIO (verificação do compartilhamento) — não faz parte do app. */
import { createRoot } from 'react-dom/client';
import './styles/legacy.css';
import './styles/globals.css';
import './styles/design-tokens.css';
import './styles/shell.css';
import { ShareModal } from '@/features/gamification/ShareModal';
import { useShareStore } from '@/features/gamification/share-store';
import { bootstrap } from '@/core/db/bootstrap';

void bootstrap().then(() => {
  createRoot(document.getElementById('root')!).render(<ShareModal />);
  useShareStore.getState().openTreino();
});
