/**
 * ConnectedDevices.tsx — Dispositivos Conectados (v4.9.0-sync / v4.9.3-settings)
 *
 * Port fiel da Section 3 do SettingsInterfacesStandalone.tsx ligada ao registry
 * real do sync-manager (user_sync :DEVICES):
 *   • banner esmeralda "Conectar Novos Aparelhos" + botão "Conectar dispositivo"
 *     (abre modal com QR Code visual + código de pareamento + countdown);
 *   • lista "STATUS DO DISPOSITIVO" com ícone, nome/customName, badge
 *     "SESSÃO ATUAL" para o dispositivo ativo, meta (browser•os•lastActive) e
 *     chevron que abre o modal de edição;
 *   • modal de edição: renomear + info box (Navegador/SO/Status) +
 *     "Salvar Nome" + "Desconectar Este Aparelho" (apenas não-atual);
 *   • nota de segurança com criptografia de ponta a ponta.
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
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
    <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
    <line x1="8" y1="21" x2="16" y2="21" />
    <line x1="12" y1="17" x2="12" y2="21" />
  </svg>
);

const SvgSmartphone = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
    <rect x="7" y="2" width="10" height="20" rx="2" ry="2" />
    <line x1="12" y1="18" x2="12.01" y2="18" />
  </svg>
);

const SvgTablet = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
    <rect x="4" y="2" width="16" height="20" rx="2" ry="2" />
    <line x1="12" y1="18" x2="12.01" y2="18" />
  </svg>
);

const SvgLaptop = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
    <path d="M20 16V7a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v9" />
    <path d="M2 16h20" />
  </svg>
);

const SvgQr = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
    <rect x="3" y="3" width="7" height="7" />
    <rect x="14" y="3" width="7" height="7" />
    <rect x="3" y="14" width="7" height="7" />
    <line x1="14" y1="14" x2="14.01" y2="14" />
    <line x1="21" y1="14" x2="21.01" y2="14" />
    <line x1="14" y1="21" x2="14.01" y2="21" />
    <line x1="21" y1="21" x2="21.01" y2="21" />
  </svg>
);

const SvgChevron = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
    <polyline points="9 18 15 12 9 6" />
  </svg>
);

const SvgX = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const SvgCheck = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="14" height="14">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const SvgTrash = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="14" height="14">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
  </svg>
);

const SvgInfo = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="14" height="14">
    <circle cx="12" cy="12" r="10" />
    <path d="M12 16v-4" />
    <path d="M12 8h.01" />
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
  const [editingDevice, setEditingDevice] = useState<Device | null>(null);
  const [editName, setEditName] = useState('');
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [connectCountdown, setConnectCountdown] = useState(300);
  const [pairingCode] = useState(() => {
    const n = Math.floor(100000 + Math.random() * 900000);
    return `${String(n).slice(0, 3)} - ${String(n).slice(3)}`;
  });

  /* Carrega a lista ao montar (a lista vive no useDevicesStore) */
  useEffect(() => {
    void loadDevices();
  }, []);

  /* Temporizador regressivo para o QR Code de novo aparelho */
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (showConnectModal && connectCountdown > 0) {
      interval = setInterval(() => {
        setConnectCountdown((c) => (c > 0 ? c - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [showConnectModal, connectCountdown]);

  const startEdit = (d: Device) => {
    setEditingDevice(d);
    setEditName(d.customName || d.name);
  };

  const saveRename = async (id: string) => {
    await renameDevice(id, editName);
    setEditingDevice(null);
  };

  const handleDisconnect = async (d: Device) => {
    const label = d.customName || d.name;
    if (window.confirm(`Deseja realmente desconectar "${label}"? O dispositivo perderá a sincronização.`)) {
      await disconnectDevice(d.id);
      setEditingDevice(null);
    }
  };

  const formatCountdown = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${String(sec).padStart(2, '0')}`;
  };

  return (
    <div className="sy-root">
      <section className="sy-card">
        {/* v4.9.3-settings — Banner esmeralda "Conectar Novos Aparelhos" (reference) */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          padding: '12px 16px',
          background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(5, 150, 105, 0.1) 100%)',
          border: '1px solid rgba(16, 185, 129, 0.25)',
          borderRadius: 12,
          marginBottom: 16,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ padding: 8, borderRadius: 10, background: 'rgba(16, 185, 129, 0.15)', color: '#34d399' }}>
              {SvgLaptop}
            </div>
            <div>
              <p style={{ fontSize: 12, fontWeight: 700, color: '#34d399', margin: 0 }}>Conectar Novos Aparelhos</p>
              <p style={{ fontSize: 10, color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono, monospace)', marginTop: 2 }}>
                Escaneie o QR Code para adicionar um dispositivo
              </p>
            </div>
          </div>
          <button
            type="button"
            className="sy-btn sy-btn--sm"
            style={{ background: 'rgba(16, 185, 129, 0.2)', border: '1px solid rgba(16, 185, 129, 0.4)', color: '#34d399' }}
            onClick={() => {
              setConnectCountdown(300);
              setShowConnectModal(true);
            }}
          >
            {SvgQr}
            Conectar dispositivo
          </button>
        </div>

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
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="14" height="14">
                <polyline points="23 4 23 10 17 10" />
                <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
              </svg>
            </button>
          </div>
        </div>

        {/* v4.9.3-settings — Label "STATUS DO DISPOSITIVO" (reference) */}
        <p style={{
          fontSize: 9,
          fontFamily: 'var(--font-mono, monospace)',
          fontWeight: 700,
          color: 'var(--text-tertiary)',
          textTransform: 'uppercase',
          letterSpacing: '0.15em',
          marginBottom: 8,
        }}>
          STATUS DO DISPOSITIVO
        </p>

        <div className="sy-dev-list">
          {devices.map((d) => (
            <div
              key={d.id}
              className={`sy-dev ${d.isCurrent ? 'sy-dev--current' : ''}`}
              style={{ cursor: 'pointer' }}
              onClick={() => startEdit(d)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  startEdit(d);
                }
              }}
            >
              <div className="sy-dev__main">
                {deviceIcon(d.deviceType)}
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div className="sy-dev__name-row">
                    <span className="sy-dev__name">{d.customName || d.name}</span>
                    {d.isCurrent && (
                      <span style={{
                        fontSize: 8,
                        fontFamily: 'var(--font-mono, monospace)',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        padding: '2px 8px',
                        borderRadius: 999,
                        background: 'rgba(16, 185, 129, 0.1)',
                        color: '#34d399',
                        border: '1px solid rgba(16, 185, 129, 0.2)',
                      }}>
                        SESSÃO ATUAL
                      </span>
                    )}
                  </div>
                  <div className="sy-dev__meta">
                    <span>{d.lastActive}</span>
                  </div>
                </div>
              </div>

              <span style={{ color: 'var(--text-tertiary)', flexShrink: 0 }}>
                {SvgChevron}
              </span>
            </div>
          ))}

          {devices.length === 0 && (
            <div className="sy-feedback">
              {loading ? 'Carregando dispositivos…' : 'Nenhum dispositivo registrado ainda.'}
            </div>
          )}
        </div>

        {/* v4.9.3-settings — Nota de criptografia (reference) */}
        <p style={{
          marginTop: 16,
          fontSize: 10,
          color: 'var(--text-tertiary)',
          fontFamily: 'var(--font-mono, monospace)',
          textAlign: 'center',
          lineHeight: 1.5,
        }}>
          🔒 Todos os dados são protegidos com criptografia de ponta a ponta.
        </p>
      </section>

      {/* v4.9.3-settings — Modal: Conectar Novo Dispositivo (QR + código + countdown) */}
      {showConnectModal && (
        <div className="sy-modal" role="dialog" aria-modal="true" aria-label="Conectar Novo Dispositivo">
          <div className="sy-modal__panel">
            <button
              type="button"
              className="sy-modal__close"
              onClick={() => setShowConnectModal(false)}
              aria-label="Fechar"
            >
              {SvgX}
            </button>
            <div className="sy-modal__head">
              <h3 className="sy-modal__title">Conectar Novo Dispositivo</h3>
              <p className="sy-modal__desc">Escaneie o QR Code ou use o código de pareamento</p>
            </div>
            <div>
              {/* QR Code visual (placeholder) */}
              <div style={{
                width: 160,
                height: 160,
                margin: '0 auto',
                padding: 16,
                background: '#fff',
                borderRadius: 16,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <svg viewBox="0 0 100 100" width="128" height="128">
                  {/* Simulação de QR Code */}
                  <rect x="0" y="0" width="30" height="30" fill="#000" />
                  <rect x="5" y="5" width="20" height="20" fill="#fff" />
                  <rect x="10" y="10" width="10" height="10" fill="#000" />
                  <rect x="70" y="0" width="30" height="30" fill="#000" />
                  <rect x="75" y="5" width="20" height="20" fill="#fff" />
                  <rect x="80" y="10" width="10" height="10" fill="#000" />
                  <rect x="0" y="70" width="30" height="30" fill="#000" />
                  <rect x="5" y="75" width="20" height="20" fill="#fff" />
                  <rect x="10" y="80" width="10" height="10" fill="#000" />
                  <rect x="40" y="10" width="5" height="5" fill="#000" />
                  <rect x="50" y="10" width="5" height="5" fill="#000" />
                  <rect x="40" y="20" width="5" height="5" fill="#000" />
                  <rect x="60" y="20" width="5" height="5" fill="#000" />
                  <rect x="10" y="40" width="5" height="5" fill="#000" />
                  <rect x="20" y="40" width="5" height="5" fill="#000" />
                  <rect x="40" y="40" width="5" height="5" fill="#000" />
                  <rect x="50" y="40" width="5" height="5" fill="#000" />
                  <rect x="60" y="40" width="5" height="5" fill="#000" />
                  <rect x="70" y="40" width="5" height="5" fill="#000" />
                  <rect x="90" y="40" width="5" height="5" fill="#000" />
                  <rect x="40" y="50" width="5" height="5" fill="#000" />
                  <rect x="60" y="50" width="5" height="5" fill="#000" />
                  <rect x="80" y="50" width="5" height="5" fill="#000" />
                  <rect x="10" y="60" width="5" height="5" fill="#000" />
                  <rect x="30" y="60" width="5" height="5" fill="#000" />
                  <rect x="50" y="60" width="5" height="5" fill="#000" />
                  <rect x="70" y="60" width="5" height="5" fill="#000" />
                  <rect x="40" y="70" width="5" height="5" fill="#000" />
                  <rect x="50" y="70" width="5" height="5" fill="#000" />
                  <rect x="60" y="70" width="5" height="5" fill="#000" />
                  <rect x="80" y="70" width="5" height="5" fill="#000" />
                  <rect x="90" y="70" width="5" height="5" fill="#000" />
                  <rect x="40" y="80" width="5" height="5" fill="#000" />
                  <rect x="60" y="80" width="5" height="5" fill="#000" />
                  <rect x="70" y="80" width="5" height="5" fill="#000" />
                  <rect x="90" y="80" width="5" height="5" fill="#000" />
                  <rect x="40" y="90" width="5" height="5" fill="#000" />
                  <rect x="50" y="90" width="5" height="5" fill="#000" />
                  <rect x="80" y="90" width="5" height="5" fill="#000" />
                </svg>
              </div>
              {/* Código de pareamento */}
              <div style={{ textAlign: 'center', marginTop: 16 }}>
                <p style={{ fontSize: 10, color: 'var(--sy-dim)', fontFamily: 'var(--font-mono, monospace)', marginBottom: 4 }}>
                  Código de pareamento
                </p>
                <p style={{ fontSize: 20, fontWeight: 900, fontFamily: 'var(--font-mono, monospace)', letterSpacing: '0.1em', color: 'var(--sy-accent)' }}>
                  {pairingCode}
                </p>
                <p style={{ fontSize: 10, color: 'var(--sy-dim)', fontFamily: 'var(--font-mono, monospace)', marginTop: 8 }}>
                  Expira em {formatCountdown(connectCountdown)}
                </p>
              </div>
            </div>
            <p style={{ fontSize: 10, color: 'var(--sy-dim)', fontFamily: 'var(--font-mono, monospace)', lineHeight: 1.5, textAlign: 'center' }}>
              Abra o Academia no novo dispositivo e escaneie o QR Code ou insira o código de pareamento manualmente.
            </p>
          </div>
        </div>
      )}

      {/* v4.9.3-settings — Modal: Gerenciar Dispositivo (reference) */}
      {editingDevice && (
        <div className="sy-modal" role="dialog" aria-modal="true" aria-label="Gerenciar Dispositivo">
          <div className="sy-modal__panel">
            <button
              type="button"
              className="sy-modal__close"
              onClick={() => setEditingDevice(null)}
              aria-label="Fechar"
            >
              {SvgX}
            </button>
            <div className="sy-modal__head">
              <h3 className="sy-modal__title">Gerenciar Dispositivo</h3>
              <p className="sy-modal__desc">Renomeie ou desconecte este aparelho</p>
            </div>
            <div>
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 10, fontFamily: 'var(--font-mono, monospace)', fontWeight: 700, color: 'var(--sy-dim)', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>
                  Nome do dispositivo
                </label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input
                    type="text"
                    className="sy-input"
                    value={editName}
                    autoFocus
                    onChange={(e) => setEditName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') void saveRename(editingDevice.id);
                      if (e.key === 'Escape') setEditingDevice(null);
                    }}
                    placeholder="Nome do dispositivo"
                  />
                  <button
                    type="button"
                    className="sy-btn sy-btn--sm sy-btn--primary"
                    onClick={() => void saveRename(editingDevice.id)}
                  >
                    {SvgCheck}
                    Salvar Nome
                  </button>
                </div>
              </div>

              {/* Info box */}
              <div style={{
                padding: 12,
                background: 'rgba(24, 24, 27, 0.6)',
                border: '1px solid rgba(63, 63, 70, 0.8)',
                borderRadius: 10,
                display: 'flex',
                flexDirection: 'column',
                gap: 6,
                marginBottom: 16,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ color: 'var(--sy-dim)' }}>{SvgInfo}</span>
                  <span style={{ fontSize: 11, color: 'var(--sy-dim)', fontFamily: 'var(--font-mono, monospace)' }}>
                    Navegador: {editingDevice.browser || 'Desconhecido'}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ color: 'var(--sy-dim)' }}>{SvgInfo}</span>
                  <span style={{ fontSize: 11, color: 'var(--sy-dim)', fontFamily: 'var(--font-mono, monospace)' }}>
                    Sistema: {editingDevice.os || 'Desconhecido'}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ color: 'var(--sy-dim)' }}>{SvgInfo}</span>
                  <span style={{ fontSize: 11, color: 'var(--sy-dim)', fontFamily: 'var(--font-mono, monospace)' }}>
                    Status: {editingDevice.isCurrent ? 'Sessão atual' : 'Dispositivo remoto'}
                  </span>
                </div>
              </div>

              {/* Desconectar (apenas não-atual) */}
              {!editingDevice.isCurrent && (
                <button
                  type="button"
                  className="sy-btn sy-btn--danger"
                  style={{ width: '100%' }}
                  onClick={() => void handleDisconnect(editingDevice)}
                >
                  {SvgTrash}
                  Desconectar Este Aparelho
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ConnectedDevices;
