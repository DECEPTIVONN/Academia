/**
 * SupercellIdModal.tsx — tela "FIT ID" (v4.66.0)
 *
 * Histórico: era um port do protótipo "Supercell ID" de outro produto, com
 * abas de jogos fictícios (Retro Tetris/Clash Royale), contas de demonstração,
 * alertas nativos e textos de clã/copas. Nesta versão o arquivo é a tela REAL
 * da conta do usuário:
 *
 *   • identidade (avatar, nome, @usuário, e-mail e situação da conta);
 *   • números reais do app (XP, nível, ofensiva e treinos concluídos);
 *   • atalhos reais: aba Social (amigos), Central de Ajuda, alterar senha e
 *     sair da conta.
 *
 * Sem dados mockados, sem `window.alert` e sem emoji de interface
 * (Diretrizes/Ícones.md): todos os ícones são SVG stroke da lucide-react.
 */

import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'motion/react';
import {
  ArrowLeft,
  ChevronRight,
  Flame,
  HelpCircle,
  LogOut,
  Mail,
  ShieldCheck,
  Sparkles,
  Trophy,
  UserRound,
  Users,
  X,
} from 'lucide-react';
import { useAuth } from '@/core/auth/use-auth';
import { useProfileState } from '@/features/profile/useProfileState';
import { supabase, isSupabaseConfigured } from '@/core/supabase';
import { showToast } from '@/lib/toast';
import { loadAddedFriends } from '@/features/social/friend-invites';

const toBody = (node: React.ReactNode) => createPortal(node, document.body);

export interface FitIdProfile {
  username: string;
  xp: number;
  level: number;
  streak?: number;
  workouts?: number;
}

interface SupercellIdModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: FitIdProfile;
  avatarUrl?: string;
  avatarFrame?: string | null;
}

export function SupercellIdStandalone({
  isOpen,
  onClose,
  profile,
  avatarUrl,
  avatarFrame,
}: SupercellIdModalProps) {
  const { user, signOut, isTestMode } = useAuth();
  const { state } = useProfileState();
  const [busy, setBusy] = useState(false);

  const pc = state?.customization;
  const handle = pc?.handle ? `@${pc.handle.replace(/^@/, '')}` : `@${profile.username.replace(/^@/, '')}`;
  const email = user?.email ?? '';
  const provider = (user?.app_metadata?.provider as string | undefined) ?? 'email';
  const friends = useMemo(() => (isOpen ? loadAddedFriends() : []), [isOpen]);

  useEffect(() => {
    if (!isOpen) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener('keydown', onKey);
    };
  }, [isOpen, onClose]);

  const changePassword = async () => {
    if (!isSupabaseConfigured || !email) {
      showToast('Entre com uma conta na nuvem para alterar a senha.', 'error');
      return;
    }
    setBusy(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/`,
      });
      showToast(
        error ? 'Não foi possível enviar o e-mail de redefinição.' : 'Enviamos um link de redefinição para o seu e-mail.',
        error ? 'error' : 'success'
      );
    } finally {
      setBusy(false);
    }
  };

  const handleSignOut = async () => {
    setBusy(true);
    try {
      await signOut();
      onClose();
      showToast('Você saiu da conta.', 'info');
    } catch {
      showToast('Não foi possível sair agora.', 'error');
    } finally {
      setBusy(false);
    }
  };

  const openHelp = () => {
    onClose();
    window.dispatchEvent(new CustomEvent('academia:open-help'));
  };

  const openSocial = () => {
    onClose();
    window.dispatchEvent(new CustomEvent('academia:open-social'));
  };

  const stats = [
    { icon: <Sparkles className="h-4 w-4" />, label: 'XP total', value: profile.xp.toLocaleString('pt-BR') },
    { icon: <Trophy className="h-4 w-4" />, label: 'Nível', value: String(profile.level) },
    { icon: <Flame className="h-4 w-4" />, label: 'Ofensiva', value: `${profile.streak ?? 0} d` },
    { icon: <Users className="h-4 w-4" />, label: 'Amigos', value: String(friends.length) },
  ];

  return toBody(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="fitid"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.22 }}
          className="fixed inset-0 z-[1150] flex items-end justify-center bg-black/70 backdrop-blur-sm sm:items-center sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-label="FIT ID"
          onClick={(e) => {
            if (e.target === e.currentTarget) onClose();
          }}
        >
          <motion.div
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 30, opacity: 0 }}
            transition={{ duration: 0.26, ease: [0.16, 1, 0.3, 1] }}
            className="flex max-h-[92vh] w-full max-w-md flex-col overflow-y-auto rounded-t-3xl border border-white/10 bg-[#0d0d11] text-white shadow-2xl sm:rounded-3xl"
          >
            {/* Cabeçalho */}
            <header className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-white/10 bg-[#0d0d11]/95 px-5 py-4 backdrop-blur">
              <div className="flex items-center gap-2.5">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-[rgba(var(--primary-rgb,249,115,22),0.35)] bg-[rgba(var(--primary-rgb,249,115,22),0.12)] text-[var(--primary-light,#fdba74)]">
                  <ShieldCheck className="h-[18px] w-[18px]" />
                </span>
                <div>
                  <h2 className="text-[15px] font-bold leading-tight">FIT ID</h2>
                  <p className="text-[10.5px] text-white/45">Sua conta e identidade</p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Fechar FIT ID"
                className="rounded-lg p-1.5 text-white/50 transition-colors hover:bg-white/5 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </header>

            <div className="flex flex-col gap-4 px-5 py-5">
              {/* Identidade */}
              <section className="flex items-center gap-3.5 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <div
                  className="h-16 w-16 shrink-0 overflow-hidden rounded-2xl border border-white/15 bg-black/40"
                  style={avatarFrame ? { boxShadow: `0 0 0 2px ${avatarFrame}` } : undefined}
                >
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="" className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    <span className="flex h-full w-full items-center justify-center text-white/40">
                      <UserRound className="h-7 w-7" />
                    </span>
                  )}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-[15px] font-bold leading-tight">{profile.username}</p>
                  <p className="truncate font-mono text-[11.5px] text-white/45">{handle}</p>
                  <span className="mt-1 inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-emerald-300">
                    {isTestMode ? 'Modo teste' : provider === 'google' ? 'Google conectado' : 'Conta conectada'}
                  </span>
                </div>
              </section>

              {/* Números reais */}
              <section className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {stats.map((item) => (
                  <div
                    key={item.label}
                    className="flex flex-col gap-1 rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2.5"
                  >
                    <span className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-wider text-white/40">
                      <span className="text-[var(--primary-light,#fdba74)]">{item.icon}</span>
                      {item.label}
                    </span>
                    <span className="text-[15px] font-black leading-none">{item.value}</span>
                  </div>
                ))}
              </section>

              {/* Conta */}
              <section className="overflow-hidden rounded-2xl border border-white/10">
                <div className="flex items-center justify-between gap-3 px-4 py-3">
                  <span className="flex items-center gap-2 text-[12.5px] text-white/70">
                    <Mail className="h-4 w-4 text-white/35" /> E-mail
                  </span>
                  <span className="max-w-[58%] truncate font-mono text-[11.5px] text-white/85">
                    {email || 'Não informado'}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => void changePassword()}
                  disabled={busy}
                  className="flex w-full items-center justify-between gap-3 border-t border-white/10 px-4 py-3 text-left transition-colors hover:bg-white/[0.04] disabled:opacity-50"
                >
                  <span className="flex items-center gap-2 text-[12.5px] text-white/80">
                    <ShieldCheck className="h-4 w-4 text-white/35" /> Alterar senha
                  </span>
                  <ChevronRight className="h-4 w-4 text-white/25" />
                </button>

                <button
                  type="button"
                  onClick={openSocial}
                  className="flex w-full items-center justify-between gap-3 border-t border-white/10 px-4 py-3 text-left transition-colors hover:bg-white/[0.04]"
                >
                  <span className="flex items-center gap-2 text-[12.5px] text-white/80">
                    <Users className="h-4 w-4 text-white/35" /> Amigos
                  </span>
                  <span className="flex items-center gap-1 text-[11.5px] text-white/45">
                    {friends.length > 0 ? `${friends.length} adicionados` : 'Abrir aba Social'}
                    <ChevronRight className="h-4 w-4 text-white/25" />
                  </span>
                </button>

                <button
                  type="button"
                  onClick={openHelp}
                  className="flex w-full items-center justify-between gap-3 border-t border-white/10 px-4 py-3 text-left transition-colors hover:bg-white/[0.04]"
                >
                  <span className="flex items-center gap-2 text-[12.5px] text-white/80">
                    <HelpCircle className="h-4 w-4 text-white/35" /> Central de ajuda
                  </span>
                  <ChevronRight className="h-4 w-4 text-white/25" />
                </button>
              </section>

              <p className="text-[10.5px] leading-relaxed text-white/35">
                Seus dados de treino ficam neste dispositivo e são sincronizados com a nuvem quando você
                configura a chave em Configurações → Nuvem.
              </p>

              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => void handleSignOut()}
                  disabled={busy}
                  className="flex h-11 items-center justify-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 text-[12.5px] font-bold text-rose-300 transition-colors hover:bg-rose-500/15 disabled:opacity-50"
                >
                  <LogOut className="h-4 w-4" /> Sair da conta
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="flex h-11 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] text-[12.5px] font-bold text-white/75 transition-colors hover:bg-white/[0.08]"
                >
                  <ArrowLeft className="h-4 w-4" /> Voltar
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default SupercellIdStandalone;
