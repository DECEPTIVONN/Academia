/**
 * OfflineSyncBanner.tsx — Indicador de modo offline (dados.md §5.4)
 *
 * Exibe um badge discreto quando o navegador está offline ou há mutações
 * pendentes na fila aguardando conexão. Transiciona para "Reconectado!
 * Sincronizando..." quando a rede retorna e desaparece após a confirmação.
 */
import { useEffect, useState } from 'react';
import { getOfflinePendingCount } from '@/core/sync/offline-queue';
import './sync.css';

export function OfflineSyncBanner() {
  const [offline, setOffline] = useState<boolean>(
    typeof navigator !== 'undefined' ? !navigator.onLine : false
  );
  const [pending, setPending] = useState(0);
  const [reconnecting, setReconnecting] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const refreshPending = async () => {
      try {
        const n = await getOfflinePendingCount();
        if (!cancelled) setPending(n);
      } catch {
        /* best-effort */
      }
    };

    const onOnline = () => {
      setOffline(false);
      if (pending > 0) {
        setReconnecting(true);
        window.setTimeout(() => setReconnecting(false), 2500);
      }
      void refreshPending();
    };
    const onOffline = () => {
      setOffline(true);
      setReconnecting(false);
    };

    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);

    // Polling leve de pendências (a fila pode mudar sem evento de rede)
    const interval = window.setInterval(() => {
      void refreshPending();
    }, 5000);
    void refreshPending();

    return () => {
      cancelled = true;
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
      window.clearInterval(interval);
    };
  }, [pending]);

  const show = offline || pending > 0 || reconnecting;
  if (!show) return null;

  let text = '';
  if (reconnecting) text = 'Reconectado! Sincronizando dados...';
  else if (offline) text = `Modo Offline${pending > 0 ? `: ${pending} alteração(ões) salvas localmente` : ''}`;
  else if (pending > 0) text = `${pending} alteração(ões) aguardando sincronização`;

  return (
    <div
      className="sy-toast"
      role="status"
      aria-live="polite"
      style={{ bottom: 84, right: 12, left: 12, width: 'auto', maxWidth: 'none' }}
    >
      <div className="sy-toast__icon" style={{ background: 'rgba(245,158,11,0.1)', borderColor: 'rgba(245,158,11,0.25)', color: '#f59e0b' }}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="20" height="20">
          <path d="M1 1l22 22" />
          <path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55" />
          <path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39" />
          <path d="M10.71 5.05A16 16 0 0 1 22.58 9" />
          <path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88" />
          <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
          <line x1="12" y1="20" x2="12.01" y2="20" />
        </svg>
      </div>
      <div className="sy-toast__body">
        <p className="sy-toast__text" style={{ whiteSpace: 'normal' }}>{text}</p>
      </div>
    </div>
  );
}