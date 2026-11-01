/**
 * PairingAuthorizeDialog.tsx — autoriza o login por QR em outro aparelho
 *
 * Tela do aparelho que JÁ está conectado: recebe o código exibido no outro
 * aparelho (ou abre direto pelo link do QR) e publica a sessão atual no canal
 * de pareamento (`features/auth/qr-pairing.ts`).
 *
 * Entradas:
 *   • App.tsx (`PairingGate`) quando a URL traz `#qr=CODIGO`;
 *   • Configurações → Segurança → “Autorizar outro aparelho” (código digitado).
 */

import { useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { CheckCircle2, KeyRound, Loader2, ShieldCheck, X } from 'lucide-react';
import { useModalPresence } from '@/hooks/useModalPresence';
import { supabase } from '@/core/supabase';
import { showToast } from '@/lib/toast';
import {
  PAIRING_TTL_MS,
  isPairingSupported,
  normalizePairingCode,
  sendPairingTokens,
} from './qr-pairing';

interface PairingAuthorizeDialogProps {
  open: boolean;
  /** Código vindo do link/QR (pode ser editado). */
  initialCode?: string | null;
  onClose: () => void;
}

const toBody = (node: React.ReactNode) => createPortal(node, document.body);

export function PairingAuthorizeDialog({
  open,
  initialCode = null,
  onClose,
}: PairingAuthorizeDialogProps) {
  const { mounted, closing } = useModalPresence(open);
  const [code, setCode] = useState(initialCode ?? '');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  /* Abrir com um código novo (link) reinicia o formulário. */
  const [seed, setSeed] = useState(initialCode);
  if (initialCode !== seed) {
    setSeed(initialCode);
    setCode(initialCode ?? '');
    setDone(false);
    setError('');
  }

  const normalized = useMemo(() => normalizePairingCode(code), [code]);
  const supported = isPairingSupported();

  if (!mounted) return null;

  const authorize = async () => {
    if (!normalized) {
      setError('Informe o código completo (PLN-XXXX-XXXX).');
      return;
    }
    setBusy(true);
    setError('');
    try {
      const { data, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !data.session) {
        setError('Nenhuma conta conectada neste aparelho. Entre primeiro para autorizar.');
        return;
      }
      const result = await sendPairingTokens(normalized, {
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
        expiresAt: Date.now() + PAIRING_TTL_MS,
        account: data.session.user.email ?? data.session.user.id.slice(0, 8),
      });

      if (!result.ok) {
        setError(
          result.reason === 'used'
            ? 'Este código já foi usado. Gere um novo no aparelho que quer entrar.'
            : result.reason === 'expired'
              ? 'Código expirado. Gere um novo no aparelho que quer entrar.'
              : 'Não foi possível falar com o servidor de pareamento. Tente novamente.',
        );
        return;
      }

      setDone(true);
      showToast(
        result.reason === 'degraded'
          ? 'Aparelho autorizado (modo offline: o código não pôde ser revogado).'
          : 'Aparelho autorizado! O login aparece no outro dispositivo.',
        result.reason === 'degraded' ? 'info' : 'success',
      );
      window.setTimeout(onClose, 1200);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao autorizar o aparelho.');
    } finally {
      setBusy(false);
    }
  };

  return toBody(
    <div
      className={`fixed inset-0 z-[1300] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm transition-opacity duration-200 ${
        closing ? 'opacity-0' : 'opacity-100'
      }`}
      role="dialog"
      aria-modal="true"
      aria-label="Autorizar login em outro aparelho"
      onClick={(e) => {
        if (e.target === e.currentTarget && !busy) onClose();
      }}
    >
      <div
        className={`w-full max-w-sm rounded-3xl border border-zinc-800 bg-[#121216] p-6 text-white shadow-2xl transition-transform duration-200 ${
          closing ? 'scale-95' : 'scale-100'
        }`}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-400">
              <ShieldCheck className="h-5 w-5" />
            </span>
            <div>
              <h3 className="text-[15px] font-bold leading-tight">Autorizar outro aparelho</h3>
              <p className="text-[11px] text-zinc-400">Login por QR Code / código</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            aria-label="Fechar"
            className="rounded-lg p-1.5 text-zinc-500 transition-colors hover:bg-white/5 hover:text-white disabled:opacity-40"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {done ? (
          <div className="mt-6 flex flex-col items-center gap-2 py-4 text-center">
            <CheckCircle2 className="h-9 w-9 text-emerald-400" />
            <p className="text-sm font-bold">Aparelho autorizado</p>
            <p className="text-xs text-zinc-400">O outro dispositivo entra automaticamente.</p>
          </div>
        ) : (
          <>
            <p className="mt-4 text-xs leading-relaxed text-zinc-400">
              Informe o código exibido no aparelho que quer entrar. Ele vale{' '}
              <strong className="text-zinc-200">uma única vez</strong>, por 5 minutos, e libera a
              sessão <strong className="text-zinc-200">desta conta</strong>.
            </p>

            <label className="mt-4 block text-[11px] font-bold uppercase tracking-[0.12em] text-zinc-500">
              Código de pareamento
              <div className="mt-1.5 flex items-center gap-2 rounded-xl border border-zinc-800 bg-[#09090b] px-3">
                <KeyRound className="h-4 w-4 text-zinc-600" />
                <input
                  type="text"
                  inputMode="text"
                  autoComplete="off"
                  spellCheck={false}
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="PLN-XXXX-XXXX"
                  className="h-11 w-full bg-transparent font-mono text-[15px] tracking-wider text-white placeholder-zinc-600 focus:outline-none"
                />
              </div>
            </label>

            {!supported && (
              <p className="mt-3 rounded-xl border border-amber-500/25 bg-amber-500/10 px-3 py-2 text-[11px] text-amber-300">
                Configure o Supabase em Configurações → Nuvem para o pareamento funcionar.
              </p>
            )}
            {error && (
              <p className="mt-3 rounded-xl border border-rose-500/25 bg-rose-500/10 px-3 py-2 text-[11px] text-rose-300">
                {error}
              </p>
            )}

            <button
              type="button"
              onClick={() => void authorize()}
              disabled={busy || !normalized || !supported}
              className="mt-4 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 text-sm font-bold text-black transition-colors hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
              {busy ? 'Autorizando…' : 'Autorizar login'}
            </button>

            <p className="mt-3 text-center text-[10px] leading-relaxed text-zinc-500">
              Só autorize se o código estiver na sua tela. Ele expira automaticamente.
            </p>
          </>
        )}
      </div>
    </div>
  );
}

export default PairingAuthorizeDialog;
