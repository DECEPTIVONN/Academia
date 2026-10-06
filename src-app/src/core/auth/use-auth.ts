/**
 * use-auth.ts — hook de consumo do AuthContext (separado de auth-context.tsx
 * para o fast-refresh só ver componentes nesse arquivo).
 */
import { useContext } from 'react';
import { AuthContext, type AuthContextValue } from './auth-context';

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth deve ser usado dentro de <AuthProvider>');
  return ctx;
}
