/**
 * AuthModal.tsx — Wrapper da tela de login standalone (v4.15.0-auth)
 *
 * O modal antigo (sy-modal sobre o perfil) foi substituído pela AuthScreen
 * full-screen (port do LoginAuthStandalone.tsx com autenticação Supabase
 * real). Este arquivo permanece como ponto de montagem estável para
 * App.tsx / Configurações (z-index 1150, abaixo do LockScreen 1200).
 *
 * v4.57.0 — o wrapper usa `useModalPresence`: a tela continua montada durante
 * a animação de saída (`.auth-screen--closing`) em vez de sumir de imediato.
 */

import { AuthScreen } from './AuthScreen';
import { useAuthModalStore } from './auth-modal-store';
import { useModalPresence } from '@/hooks/useModalPresence';

export function AuthModal() {
  const open = useAuthModalStore((s) => s.open);
  const { mounted, closing } = useModalPresence(open);
  if (!mounted) return null;
  return <AuthScreen closing={closing} />;
}
