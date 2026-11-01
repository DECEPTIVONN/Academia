/**
 * OfflineSyncBanner.tsx — Indicador de modo offline (dados.md §5.4)
 *
 * Espelha o OfflineNotificationBanner do guia §8:
 *   • status reativo vindo da fila IndexedDB (`subscribeToMutationQueue`);
 *   • offline: mostra quantas alterações estão salvas localmente — só por
 *     **5 segundos** (v4.63.0); o app continua offline normalmente, o aviso
 *     apenas não fica fixo na tela;
 *   • online com pendências: mostra o envio em andamento e o botão manual
 *     **Sincronizar** (`syncNow`), que também esvazia a fila;
 *   • some sozinho quando online e sem pendências.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  getQueueStatus,
  subscribeToMutationQueue,
  type QueueStatus,
} from '@/core/sync/offline-queue';
import { syncNow } from '@/core/sync/sync-manager';
import { useModalPresence } from '@/hooks/useModalPresence';
import './sync.css';

/** Quanto tempo o aviso de modo offline fica na tela (v4.63.0). */
const OFFLINE_NOTICE_MS = 5_000;

const WifiOffIcon = (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    width="18"
    height="18"
  >
    <path d="M1 1l22 22" />
    <path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55" />
    <path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39" />
    <path d="M10.71 5.05A16 16 0 0 1 22.58 9" />
    <path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88" />
    <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
    <line x1="12" y1="20" x2="12.01" y2="20" />
  </svg>
);

const CloudUploadIcon = (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    width="18"
    height="18"
  >
    <path d="M12 13v8" />
    <path d="m8 17 4-4 4 4" />
    <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3" />
  </svg>
);

const RefreshIcon = (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    width="14"
    height="14"
  >
    <path d="M3 12a9 9 0 0 1 15.5-6.2L21 8" />
    <path d="M21 3v5h-5" />
    <path d="M21 12a9 9 0 0 1-15.5 6.2L3 16" />
    <path d="M3 21v-5h5" />
  </svg>
);

export function OfflineSyncBanner() {
  const [status, setStatus] = useState<QueueStatus>(() => ({
    pendingCount: 0,
    isProcessing: false,
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
  }));
  const [manualSyncing, setManualSyncing] = useState(false);
  const [reconnected, setReconnected] = useState(false);
  const reconnectedTimer = useRef<number | null>(null);
  /* v4.63.0 — o aviso de modo offline é um TOAST, não um selo permanente:
     aparece na transição online → offline e sai sozinho depois de 5 s. O
     estado nasce já correto quando o app abre sem rede. */
  const [offlineNotice, setOfflineNotice] = useState(
    () => typeof navigator !== 'undefined' && !navigator.onLine
  );
  const offlineNoticeTimer = useRef<number | null>(null);

  useEffect(() => {
    let cancelled = false;

    const clearOfflineNotice = () => {
      if (offlineNoticeTimer.current) {
        window.clearTimeout(offlineNoticeTimer.current);
        offlineNoticeTimer.current = null;
      }
    };
    /* Abre a janela de 5 s. Chamado só pelos eventos de rede (e uma vez no
       boot se o app já nasce offline), então mudanças da fila não reiniciam
       a contagem. */
    const armOfflineNotice = () => {
      setOfflineNotice(true);
      clearOfflineNotice();
      offlineNoticeTimer.current = window.setTimeout(() => {
        setOfflineNotice(false);
        offlineNoticeTimer.current = null;
      }, OFFLINE_NOTICE_MS);
    };

    if (!navigator.onLine) {
      /* Já offline no boot: o estado inicial já mostra o aviso, aqui só
         agendamos a saída (o setState acontece no timer, não no efeito). */
      offlineNoticeTimer.current = window.setTimeout(() => {
        setOfflineNotice(false);
        offlineNoticeTimer.current = null;
      }, OFFLINE_NOTICE_MS);
    }

    const applyStatus = (next: QueueStatus) => {
      if (!cancelled) setStatus(next);
    };

    const unsubscribe = subscribeToMutationQueue(applyStatus);

    const refresh = () => {
      void getQueueStatus().then(applyStatus);
    };

    const onOnline = () => {
      clearOfflineNotice();
      setOfflineNotice(false);
      setReconnected(true);
      refresh();
      if (reconnectedTimer.current) window.clearTimeout(reconnectedTimer.current);
      reconnectedTimer.current = window.setTimeout(() => {
        setReconnected(false);
        refresh();
      }, 2500);
    };
    const onOffline = () => {
      setReconnected(false);
      armOfflineNotice();
      refresh();
    };

    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);

    /* Rede de segurança: a fila também pode mudar por caminhos legados. */
    const interval = window.setInterval(refresh, 15_000);
    refresh();

    return () => {
      cancelled = true;
      unsubscribe();
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
      window.clearInterval(interval);
      if (reconnectedTimer.current) window.clearTimeout(reconnectedTimer.current);
      clearOfflineNotice();
    };
  }, []);

  const handleManualSync = useCallback(async () => {
    if (manualSyncing) return;
    setManualSyncing(true);
    try {
      const result = await syncNow();
      setStatus((current) => ({ ...current, pendingCount: result.pending }));
    } finally {
      setManualSyncing(false);
    }
  }, [manualSyncing]);

  const busy = status.isProcessing || manualSyncing;
  /* Offline: só enquanto a janela de 5 s está aberta. Online: continua
     mostrando pendências/reenvio (comportamento que não é um aviso de rede). */
  const show =
    (!status.isOnline && offlineNotice) ||
    (status.isOnline && (status.pendingCount > 0 || busy || reconnected));
  /* v4.57.0 — o banner sai com fade (syToastOut) em vez de desaparecer de uma
     vez quando as pendências acabam. */
  const { mounted, closing } = useModalPresence(show);
  if (!mounted) return null;

  const title = !status.isOnline
    ? 'Modo Offline Ativo'
    : reconnected
      ? 'Reconectado!'
      : busy
        ? 'Sincronizando alterações...'
        : 'Alterações aguardando envio';

  const detail = !status.isOnline
    ? `${status.pendingCount} alteração(ões) salva(s) localmente`
    : `${status.pendingCount} pendente(s) ${busy ? 'enviando para a nuvem' : 'para sincronizar'}`;

  return (
    <div
      className={`sy-offline${status.isOnline ? ' sy-offline--online' : ''}${closing ? ' is-closing' : ''}`}
      role="status"
      aria-live="polite"
      aria-hidden={closing || undefined}
    >
      <div className="sy-offline__icon" aria-hidden="true">
        {status.isOnline ? CloudUploadIcon : WifiOffIcon}
      </div>
      <div className="sy-offline__body">
        <p className="sy-offline__title">{title}</p>
        <p className="sy-offline__text">{detail}</p>
      </div>
      {status.isOnline && status.pendingCount > 0 && (
        <button
          type="button"
          className="sy-offline__btn"
          onClick={() => void handleManualSync()}
          disabled={busy}
        >
          <span className={busy ? 'sy-offline__spin' : undefined}>{RefreshIcon}</span>
          Sincronizar
        </button>
      )}
    </div>
  );
}
