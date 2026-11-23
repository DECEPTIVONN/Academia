/**
 * UpdateCard.tsx — "Sobre o App" + atualização do APK (v4.75.0)
 *
 * Só é montado dentro do APK Android (`isNativeAndroid()` no SettingsFeature):
 * na web a tela nem aparece no hub de Configurações.
 *
 * Estados:
 *   idle → checking → current | available → downloading → installing | error
 *
 * O download acontece no plugin nativo (AppUpdaterPlugin) e emite progresso;
 * ao terminar, o próprio plugin abre o instalador do Android.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  checkForUpdate,
  downloadAndInstall,
  formatBytes,
  getInstalledVersion,
  type AppVersionInfo,
  type UpdateManifest,
} from '@/lib/app-updater';
import { showToast } from '@/lib/toast';
import './update-card.css';

type Status = 'idle' | 'checking' | 'current' | 'available' | 'downloading' | 'installing' | 'error';

const SvgRefresh = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="14" height="14">
    <polyline points="23 4 23 10 17 10" />
    <polyline points="1 20 1 14 7 14" />
    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
  </svg>
);

const SvgDownload14 = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="14" height="14">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </svg>
);

export function UpdateCard() {
  const [status, setStatus] = useState<Status>('idle');
  const [installed, setInstalled] = useState<AppVersionInfo | null>(null);
  const [update, setUpdate] = useState<UpdateManifest | null>(null);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const aliveRef = useRef(true);

  useEffect(() => {
    aliveRef.current = true;
    void getInstalledVersion().then((info) => {
      if (aliveRef.current) setInstalled(info);
    });
    return () => {
      aliveRef.current = false;
    };
  }, []);

  const runCheck = useCallback(async (announce: boolean) => {
    setStatus('checking');
    setError('');
    try {
      const found = await checkForUpdate();
      if (!aliveRef.current) return;
      const info = await getInstalledVersion();
      if (!aliveRef.current) return;
      setInstalled(info);
      setUpdate(found);
      setStatus(found ? 'available' : 'current');
      if (announce) {
        showToast(
          found ? `Atualização ${found.versionName} disponível.` : 'Você já está na versão mais recente.',
          'success'
        );
      }
    } catch (err) {
      if (!aliveRef.current) return;
      const message = err instanceof Error ? err.message : 'Não foi possível verificar as atualizações.';
      setError(message);
      setStatus('error');
      if (announce) showToast(message, 'error');
    }
  }, []);

  /* Verificação automática ao abrir a tela (silenciosa). */
  useEffect(() => {
    void runCheck(false);
  }, [runCheck]);

  const handleInstall = useCallback(async () => {
    if (!update) return;
    setStatus('downloading');
    setProgress(0);
    setError('');
    try {
      const outcome = await downloadAndInstall(update, (p) => {
        if (aliveRef.current) setProgress(p.progress);
      });
      if (!aliveRef.current) return;
      if (outcome === 'permission-required') {
        setStatus('available');
        showToast(
          'Permita "Instalar apps desconhecidos" para o EVO FIT e toque em Baixar e instalar de novo.',
          'error'
        );
        return;
      }
      setStatus('installing');
      showToast('APK baixado. Confirme a instalação na tela do Android.', 'success');
    } catch (err) {
      if (!aliveRef.current) return;
      const message = err instanceof Error ? err.message : 'Falha ao baixar o APK.';
      setError(message);
      setStatus('error');
      showToast(message, 'error');
    }
  }, [update]);

  const busy = status === 'checking' || status === 'downloading' || status === 'installing';
  const installedLabel = installed
    ? `v${installed.versionName} (código ${installed.versionCode})`
    : '—';

  return (
    <section className="set-card upd-card">
      <div className="set-card__head">
        <div>
          <div className="set-card__eyebrow">APLICATIVO</div>
          <h3 className="set-card__title">Atualizações do App</h3>
        </div>
        <span className="upd-version">{installedLabel}</span>
      </div>

      <p className="set-note upd-lead">
        {status === 'checking' && 'Procurando uma versão nova do APK…'}
        {status === 'idle' && 'Toque em verificar para procurar uma versão nova do APK.'}
        {status === 'current' && 'Você está na versão mais recente publicada.'}
        {status === 'available' && 'Existe uma versão mais recente disponível para este aparelho.'}
        {status === 'downloading' && 'Baixando o APK… mantenha o app aberto.'}
        {status === 'installing' && 'APK baixado. Confirme a instalação na tela do Android.'}
        {status === 'error' && (error || 'Não foi possível verificar as atualizações.')}
      </p>

      {update && (status === 'available' || status === 'downloading' || status === 'installing') && (
        <div className="upd-release">
          <div className="upd-release__row">
            <strong className="upd-release__version">
              {update.versionName || `código ${update.versionCode}`}
            </strong>
            <span className="upd-release__meta">
              {formatBytes(update.size)}
              {update.commit ? ` · ${update.commit.slice(0, 7)}` : ''}
            </span>
          </div>
          {update.notes ? (
            <p className="upd-release__notes">{update.notes}</p>
          ) : (
            <p className="upd-release__notes">Atualização do EVO FIT.</p>
          )}
        </div>
      )}

      {status === 'downloading' && (
        <div
          className="upd-progress"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={progress}
          aria-label="Progresso do download"
        >
          <div className="upd-progress__fill" style={{ width: `${progress}%` }} />
        </div>
      )}

      <div className="upd-actions">
        <button
          type="button"
          className="set-btn"
          disabled={busy}
          onClick={() => void runCheck(true)}
        >
          {SvgRefresh}
          Verificar atualizações
        </button>
        {update && status !== 'current' && (
          <button
            type="button"
            className="set-btn set-btn--primary"
            disabled={busy}
            onClick={() => void handleInstall()}
          >
            {SvgDownload14}
            {status === 'installing' ? 'Instalando…' : 'Baixar e instalar'}
          </button>
        )}
      </div>

      <p className="upd-hint">
        O APK é publicado no repositório de releases do projeto. Atualizar por cima mantém
        seus dados locais.
      </p>
    </section>
  );
}

export default UpdateCard;
