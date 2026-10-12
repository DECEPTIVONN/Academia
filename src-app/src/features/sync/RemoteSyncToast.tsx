/**
 * RemoteSyncToast.tsx — Aviso de sincronização remota (v4.9.0-sync)
 *
 * Port da Section 5 do SupabaseSyncSecurityStandalone.tsx:
 *   • "DISPOSITIVO SINCRONIZADO" ao receber mudanças em tempo real
 *     (evento academia:sync-remote-update, some sozinho em ~4 s);
 *   • aviso de revogação com botão "Reconectar"
 *     (evento academia:sync-revoked → reconnectAfterRevocation).
 */

import { useEffect, useState } from 'react';
import { reconnectAfterRevocation } from '@/core/sync/sync-manager';
import './sync.css';

const SvgCloud = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="20" height="20">
    <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z" />
  </svg>
);

const SvgShield = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="20" height="20">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    <line x1="4" y1="4" x2="20" y2="20" />
  </svg>
);

const SvgX = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

interface ToastState {
  kind: 'sync' | 'revoked';
  deviceName: string;
}

export function RemoteSyncToast() {
  const [toast, setToast] = useState<ToastState | null>(null);

  useEffect(() => {
    let hideTimer: number | null = null;

    const onRemote = (ev: Event) => {
      const detail = (ev as CustomEvent<{ deviceName?: string }>).detail || {};
      setToast({ kind: 'sync', deviceName: detail.deviceName || 'outro dispositivo' });
      if (hideTimer) window.clearTimeout(hideTimer);
      hideTimer = window.setTimeout(() => setToast(null), 4000);
    };

    const onRevoked = (ev: Event) => {
      const detail = (ev as CustomEvent<{ deviceName?: string }>).detail || {};
      setToast({ kind: 'revoked', deviceName: detail.deviceName || 'este dispositivo' });
      if (hideTimer) window.clearTimeout(hideTimer);
    };

    document.addEventListener('academia:sync-remote-update', onRemote);
    document.addEventListener('academia:sync-revoked', onRevoked);
    return () => {
      document.removeEventListener('academia:sync-remote-update', onRemote);
      document.removeEventListener('academia:sync-revoked', onRevoked);
      if (hideTimer) window.clearTimeout(hideTimer);
    };
  }, []);

  if (!toast) return null;

  const revoked = toast.kind === 'revoked';

  return (
    <div className="sy-toast" role="status" aria-live="polite">
      <div
        className="sy-toast__icon"
        style={
          revoked
            ? { background: 'rgba(248,113,113,0.1)', borderColor: 'rgba(248,113,113,0.25)', color: '#f87171' }
            : undefined
        }
      >
        {revoked ? SvgShield : SvgCloud}
      </div>
      <div className="sy-toast__body">
        <h4 className="sy-toast__title">
          {revoked ? 'DISPOSITIVO DESCONECTADO' : 'DISPOSITIVO SINCRONIZADO'}
          {!revoked && <span className="sy-toast__dot" />}
        </h4>
        <p className="sy-toast__text">
          {revoked
            ? `Este aparelho foi desconectado por ${toast.deviceName}.`
            : `Mudanças recebidas em tempo real de ${toast.deviceName}.`}
        </p>
        {revoked && (
          <button
            type="button"
            className="sy-btn sy-btn--sm sy-btn--primary"
            style={{ marginTop: 8 }}
            onClick={() => {
              reconnectAfterRevocation();
              setToast(null);
            }}
          >
            Reconectar
          </button>
        )}
      </div>
      <button
        type="button"
        className="sy-toast__close"
        aria-label="Fechar aviso"
        onClick={() => setToast(null)}
      >
        {SvgX}
      </button>
    </div>
  );
}

export default RemoteSyncToast;
