/**
 * ConnectedDevices.tsx — Dispositivos Conectados (v4.9.0-sync)
 *
 * Port da Section 6 do SupabaseSyncSecurityStandalone.tsx ligada ao registry
 * real do sync-manager (user_sync :DEVICES):
 *   • lista com ícone por formato, nome personalizado e atividade relativa;
 *   • renomear (edição inline) e desconectar (revogação remota com confirm);
 *   • chip de contagem + botão atualizar; sem nuvem → só o dispositivo atual.
 */

import { useEffect, useState } from 'react';
import {
  useDevicesStore,
  loadDevices,
  renameDevice,
  disconnectDevice,
} from '@/core/sync/sync-manager';
import type { ConnectedDevice as Device } from '@/core/sync/device';
import './sync.css';

/* ── Ícones SVG stroke (Diretrizes/Ícones.md) ── */

const SvgMonitor = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
    <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
    <line x1="8" y1="21" x2="16" y2="21" />
    <line x1="12" y1="17" x2="12" y2="21" />
  </svg>
);

const SvgSmartphone = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
    <rect x="7" y="2" width="10" height="20" rx="2" ry="2" />
    <line x1="12" y1="18" x2="12.01" y2="18" />
  </svg>
);

const SvgTablet = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
    <rect x="4" y="2" width="16" height="20" rx="2" ry="2" />
    <line x1="12" y1="18" x2="12.01" y2="18" />
  </svg>
);

const SvgPencil = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="12" height="12">
    <path d="M17 3a2.83 2.83 0 0 1 4 4L7.5 20.5 2 22l1.5-5.5z" />
  </svg>
);

const SvgTrash = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="12" height="12">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
  </svg>
);

const SvgCheck = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="14" height="14">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const SvgX = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="14" height="14">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const SvgRefresh = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="14" height="14">
    <polyline points="23 4 23 10 17 10" />
    <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
  </svg>
);

function deviceIcon(type: Device['deviceType']) {
  if (type === 'mobile') return <span className="sy-dev__icon sy-dev__icon--mobile">{SvgSmartphone}</span>;
  if (type === 'tablet') return <span className="sy-dev__icon sy-dev__icon--tablet">{SvgTablet}</span>;
  return <span className="sy-dev__icon sy-dev__icon--desktop">{SvgMonitor}</span>;
}

export function ConnectedDevices() {
  const devices = useDevicesStore((s) => s.devices);
  const loading = useDevicesStore((s) => s.loading);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  /* Carrega o lista ao montar (a lista vive no useDevicesStore) */
  useEffect(() => {
    void loadDevices();
  }, []);

  const startRename = (d: Device) => {
    setEditingId(d.id);
    setEditName(d.customName || d.name);
  };

  const saveRename = async (id: string) => {
    await renameDevice(id, editName);
    setEditingId(null);
  };

  const handleDisconnect = async (d: Device) => {
    const label = d.customName || d.name;
    if (window.confirm(`Deseja realmente desconectar "${label}"? O dispositivo perderá a sincronização.`)) {
      await disconnectDevice(d.id);
    }
  };

  return (
    <div className="sy-root">
      <section className="sy-card">
        <div className="sy-card__head">
          <div className="sy-card__head-left">
            <span className="sy-card__icon">{SvgMonitor}</span>
            <div>
              <h3 className="sy-card__title">Dispositivos Conectados</h3>
              <p className="sy-card__desc">
                Gerencie onde sua conta está ativa. As sessões se sincronizam
                automaticamente em segundo plano.
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span className="sy-chip sy-chip--neutral">
              {devices.length} {devices.length === 1 ? 'dispositivo' : 'dispositivos'}
            </span>
            <button
              type="button"
              className="sy-icon-btn"
              title="Atualizar lista"
              aria-label="Atualizar lista de dispositivos"
              onClick={() => void loadDevices()}
              disabled={loading}
            >
              {SvgRefresh}
            </button>
          </div>
        </div>

        <div className="sy-dev-list">
          {devices.map((d) => (
            <div key={d.id} className={`sy-dev ${d.isCurrent ? 'sy-dev--current' : ''}`}>
              <div className="sy-dev__main">
                {deviceIcon(d.deviceType)}
                <div style={{ minWidth: 0 }}>
                  {editingId === d.id ? (
                    <div className="sy-dev__edit-row">
                      <input
                        type="text"
                        className="sy-dev__edit-input"
                        value={editName}
                        autoFocus
                        onChange={(e) => setEditName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') void saveRename(d.id);
                          if (e.key === 'Escape') setEditingId(null);
                        }}
                      />
                      <button
                        type="button"
                        className="sy-icon-btn sy-icon-btn--ok"
                        title="Salvar nome"
                        aria-label="Salvar nome do dispositivo"
                        onClick={() => void saveRename(d.id)}
                      >
                        {SvgCheck}
                      </button>
                      <button
                        type="button"
                        className="sy-icon-btn"
                        title="Cancelar"
                        aria-label="Cancelar renomeação"
                        onClick={() => setEditingId(null)}
                      >
                        {SvgX}
                      </button>
                    </div>
                  ) : (
                    <div className="sy-dev__name-row">
                      <span className="sy-dev__name">{d.customName || d.name}</span>
                      {d.customName && <span className="sy-dev__alias">({d.name})</span>}
                      {d.isCurrent && <span className="sy-chip sy-chip--ok">Este</span>}
                    </div>
                  )}
                  <div className="sy-dev__meta">
                    <span>{d.lastActive}</span>
                  </div>
                </div>
              </div>

              <div className="sy-dev__actions">
                <button
                  type="button"
                  className="sy-btn sy-btn--sm"
                  title="Renomear este dispositivo"
                  onClick={() => startRename(d)}
                >
                  {SvgPencil}
                  Renomear
                </button>
                {!d.isCurrent && (
                  <button
                    type="button"
                    className="sy-btn sy-btn--sm sy-btn--danger"
                    title="Desconectar dispositivo"
                    onClick={() => void handleDisconnect(d)}
                  >
                    {SvgTrash}
                    Desconectar
                  </button>
                )}
              </div>
            </div>
          ))}

          {devices.length === 0 && (
            <div className="sy-feedback">
              {loading ? 'Carregando dispositivos…' : 'Nenhum dispositivo registrado ainda.'}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

export default ConnectedDevices;
