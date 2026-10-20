/**
 * SyncSettingsPanel.tsx — Painel "Nuvem e Sincronização" (v4.9.0-sync)
 *
 * Port da Section 7 (SettingsSupabaseAndSecuritySection) do reference, só as
 * partes de sincronização (o App Lock do reference já existe nativo aqui):
 *   • Card 1 — Status: chip Ativo/Inativo, chave ativa + copiar, conectar
 *     outra chave (namespace), sincronizar agora e fila offline;
 *   • Card 2 — Credenciais: URL + Anon Key do projeto com teste real na
 *     tabela user_sync (pode vir do .env como fallback).
 */

import { useEffect, useState, type FormEvent } from 'react';
import { showToast } from '@/lib/toast';
import {
  isSyncConfigured,
  isSyncRevoked,
  getSyncKey,
  setSyncKey,
  saveSupabaseCredentials,
  testSupabaseConnection,
  lastSyncedAt,
} from '@/core/sync/supabase-client';
import { syncNow, pullSnapshot, restartSyncEngine, getPendingOfflineCount } from '@/core/sync/sync-manager';
import { formatRelativeActiveTime } from '@/core/sync/device';
import './sync.css';

/* ── Ícones SVG stroke (Diretrizes/Ícones.md) ── */

const SvgCloud = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
    <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z" />
  </svg>
);

const SvgDatabase = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
    <ellipse cx="12" cy="5" rx="9" ry="3" />
    <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
    <path d="M3 12c0 1.66 4 3 9 3s9-1.34 9-3" />
  </svg>
);

const SvgCopy = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="12" height="12">
    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
  </svg>
);

const SvgSync = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="14" height="14">
    <polyline points="23 4 23 10 17 10" />
    <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
  </svg>
);

const SvgCheck = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="12" height="12">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

export function SyncSettingsPanel() {
  /* Recarrega ao mudar o status do motor */
  const [, setTick] = useState(0);
  useEffect(() => {
    const onStatus = () => setTick((t) => t + 1);
    document.addEventListener('academia:sync-status-changed', onStatus);
    document.addEventListener('academia:devices-updated', onStatus);
    return () => {
      document.removeEventListener('academia:sync-status-changed', onStatus);
      document.removeEventListener('academia:devices-updated', onStatus);
    };
  }, []);

  /* Credenciais */
  const [url, setUrl] = useState(() => localStorage.getItem('mbc_supabase_url') || '');
  const [anonKey, setAnonKey] = useState(() => localStorage.getItem('mbc_supabase_anon_key') || '');
  const [credFeedback, setCredFeedback] = useState<{ ok: boolean; text: string } | null>(null);
  const [testing, setTesting] = useState(false);

  /* Chave de sincronização */
  const [syncKey, setSyncKeyState] = useState(() => getSyncKey());
  const [keyInput, setKeyInput] = useState('');
  const [keyFeedback, setKeyFeedback] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);

  /* Sync manual + fila offline */
  const [syncing, setSyncing] = useState(false);
  const [pulling, setPulling] = useState(false);
  const [pending, setPending] = useState(0);
  const [lastSync, setLastSync] = useState(() => lastSyncedAt());

  useEffect(() => {
    void getPendingOfflineCount().then(setPending);
  }, []);

  const configured = isSyncConfigured();
  const revoked = isSyncRevoked();

  const statusChip = revoked ? (
    <span className="sy-chip sy-chip--bad">Revogado</span>
  ) : configured ? (
    <span className="sy-chip sy-chip--ok">
      {SvgCheck} Ativo
    </span>
  ) : (
    <span className="sy-chip sy-chip--neutral">Desativado</span>
  );

  const handleCopyKey = async () => {
    try {
      await navigator.clipboard.writeText(syncKey);
      setKeyFeedback('Chave copiada para a área de transferência!');
    } catch {
      setKeyFeedback(`Chave: ${syncKey}`);
    }
    window.setTimeout(() => setKeyFeedback(null), 3000);
  };

  const handleConnectKey = (e: FormEvent) => {
    e.preventDefault();
    if (!keyInput.trim()) return;
    setConnecting(true);
    window.setTimeout(() => {
      const next = keyInput.trim().toUpperCase();
      setSyncKey(next);
      setSyncKeyState(next);
      setKeyInput('');
      setConnecting(false);
      restartSyncEngine();
      setKeyFeedback('Chave conectada com sucesso! Dados sincronizados.');
      showToast(`Chave "${next}" conectada!`, 'success');
      window.setTimeout(() => setKeyFeedback(null), 3000);
    }, 500);
  };

  const handleTestSupabase = async (e: FormEvent) => {
    e.preventDefault();
    if (!url.trim() || !anonKey.trim()) {
      setCredFeedback({ ok: false, text: 'Preencha a URL e a Anon Key do Supabase!' });
      return;
    }
    const wasConfigured = isSyncConfigured();
    saveSupabaseCredentials(url, anonKey);
    setTesting(true);
    setCredFeedback({ ok: true, text: 'Validando conexão com a tabela user_sync…' });
    const result = await testSupabaseConnection();
    setTesting(false);
    setCredFeedback({ ok: result.ok, text: result.message });
    if (result.ok) {
      showToast('Conexão com o Supabase validada!', 'success');
      if (!wasConfigured) {
        showToast('Recarregue a página para liberar o login com as credenciais.', 'info');
      }
      restartSyncEngine();
      void getPendingOfflineCount().then(setPending);
    }
  };

  const handleSyncNow = async () => {
    setSyncing(true);
    const result = await syncNow();
    setSyncing(false);
    setPending(result.pending);
    setLastSync(lastSyncedAt());
    if (result.ok) showToast('Dados locais enviados para a nuvem!', 'success');
    else showToast('Sem conexão — alterações ficaram na fila offline.', 'info');
  };

  const handlePullNow = async () => {
    const confirmed = window.confirm(
      'Baixar os dados da nuvem e substituir os dados locais deste dispositivo?'
    );
    if (!confirmed) return;
    setPulling(true);
    const applied = await pullSnapshot(true);
    setPulling(false);
    setLastSync(lastSyncedAt());
    if (applied) {
      showToast('Dados da nuvem baixados! Recarregando…', 'success');
      window.setTimeout(() => window.location.reload(), 800);
    } else {
      showToast('Não há dados na nuvem para baixar.', 'info');
    }
  };

  return (
    <div className="sy-root">
      {/* ══ Card 1: Status da Sincronização ══ */}
      <section className="sy-card">
        <div className="sy-card__head">
          <div className="sy-card__head-left">
            <span className="sy-card__icon">{SvgCloud}</span>
            <div>
              <h3 className="sy-card__title">Status da Sincronização em Nuvem</h3>
              <p className="sy-card__desc">
                Exercícios, fichas, histórico e personalização sincronizados em
                tempo real entre seus dispositivos.
              </p>
            </div>
          </div>
          {statusChip}
        </div>

        <div className="sy-row">
          <div>
            <span className="sy-row__label">Chave Ativa</span>
            <span className="sy-row__value">{syncKey}</span>
          </div>
          <button type="button" className="sy-btn sy-btn--sm" onClick={() => void handleCopyKey()}>
            {SvgCopy}
            Copiar
          </button>
        </div>

        <div className="sy-row">
          <div>
            <span className="sy-row__label">Última sincronização</span>
            <span className="sy-row__value">
              {lastSync ? formatRelativeActiveTime(lastSync) : 'nunca'}
            </span>
          </div>
          <button
            type="button"
            className="sy-btn sy-btn--sm sy-btn--primary"
            onClick={() => void handleSyncNow()}
            disabled={syncing || pulling}
          >
            {SvgSync}
            {syncing ? 'Enviando…' : 'Enviar dados locais'}
          </button>
        </div>

        <div className="sy-row">
          <div>
            <span className="sy-row__label">Dados da nuvem</span>
            <span className="sy-row__value">
              Baixar o snapshot remoto e substituir os dados locais deste dispositivo
            </span>
          </div>
          <button
            type="button"
            className="sy-btn sy-btn--sm"
            onClick={() => void handlePullNow()}
            disabled={syncing || pulling}
          >
            {pulling ? 'Baixando…' : 'Baixar da nuvem'}
          </button>
        </div>

        {pending > 0 && (
          <div className="sy-feedback sy-feedback--accent">
            {pending} alteração(ões) aguardando conexão para ir à nuvem.
          </div>
        )}
        {revoked && (
          <div className="sy-feedback sy-feedback--bad">
            Este dispositivo foi desconectado por outro dispositivo. Use
            "Reconectar" no aviso ou salve as credenciais novamente em Nuvem.
          </div>
        )}

        {keyFeedback && <div className="sy-feedback sy-feedback--accent">{keyFeedback}</div>}

        <form onSubmit={handleConnectKey}>
          <label className="sy-label" htmlFor="sySyncKey">
            Conectar Outra Chave de Sincronização
          </label>
          <div className="sy-form-row">
            <input
              id="sySyncKey"
              type="text"
              className="sy-input"
              placeholder="Ex: MEU_DISPOSITIVO_2026"
              value={keyInput}
              onChange={(e) => setKeyInput(e.target.value)}
            />
            <button
              type="submit"
              className="sy-btn sy-btn--primary"
              disabled={connecting || !keyInput.trim()}
            >
              {connecting ? 'Conectando…' : 'Conectar'}
            </button>
          </div>
        </form>
      </section>

      {/* ══ Card 2: Credenciais do Supabase ══ */}
      <section className="sy-card">
        <div className="sy-card__head">
          <div className="sy-card__head-left">
            <span className="sy-card__icon">{SvgDatabase}</span>
            <div>
              <h3 className="sy-card__title">Credenciais do Banco Supabase</h3>
              <p className="sy-card__desc">
                URL e chave pública do projeto. Também aceitam as variáveis{' '}
                <code>VITE_SUPABASE_URL</code> e <code>VITE_SUPABASE_ANON_KEY</code> do .env.
              </p>
            </div>
          </div>
          {configured && <span className="sy-chip sy-chip--accent">Configurado</span>}
        </div>

        <form onSubmit={(e) => void handleTestSupabase(e)} className="sy-modal__stack">
          <div>
            <label className="sy-label" htmlFor="sySupaUrl">URL do Projeto</label>
            <input
              id="sySupaUrl"
              type="text"
              className="sy-input"
              placeholder="https://sua-instancia.supabase.co"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
          </div>
          <div>
            <label className="sy-label" htmlFor="sySupaKey">Chave Pública (Anon Key)</label>
            <input
              id="sySupaKey"
              type="password"
              className="sy-input"
              placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9…"
              value={anonKey}
              onChange={(e) => setAnonKey(e.target.value)}
            />
          </div>

          {credFeedback && (
            <div className={`sy-feedback ${credFeedback.ok ? 'sy-feedback--ok' : 'sy-feedback--bad'}`}>
              {credFeedback.text}
            </div>
          )}

          <button type="submit" className="sy-btn sy-btn--block" disabled={testing}>
            {testing ? 'Testando…' : 'Salvar e Testar Conexão com Supabase'}
          </button>
        </form>
      </section>
    </div>
  );
}

export default SyncSettingsPanel;
