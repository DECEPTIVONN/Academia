/**
 * AuthModal.tsx — Wrapper da tela de login standalone (v4.15.0-auth)
 *
 * O modal antigo (sy-modal sobre o perfil) foi substituído pela AuthScreen
 * full-screen (port do LoginAuthStandalone.tsx com autenticação Supabase
 * real). Este arquivo permanece como ponto de montagem estável para
 * App.tsx / Configurações (z-index 1150, abaixo do LockScreen 1200).
 */

import { AuthScreen } from './AuthScreen';
import { useAuthModalStore } from './auth-modal-store';

export function AuthModal() {
  const open = useAuthModalStore((s) => s.open);
  if (!open) return null;
  return <AuthScreen />;
}
