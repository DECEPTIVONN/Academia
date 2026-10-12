/**
 * ConnectedDevices.tsx — Dispositivos Conectados (v4.10.0)
 *
 * Port fiel da Section 3 do SettingsInterfacesStandalone.tsx ligada ao registry
 * real do sync-manager (user_sync :DEVICES), seguindo as referências:
 *   • banner full-width esmeralda "CONECTAR NOVOS APARELHOS" + botão grande
 *     verde "CONECTAR DISPOSITIVO" (abre modal com input de código 6 dígitos);
 *   • lista "STATUS DO DISPOSITIVO" com cards arredondados, ícone centralizado,
 *     badge "SESSÃO ATUAL" para o dispositivo ativo (borda emerald) e chevron;
 *   • modal "EDITAR DISPOSITIVO": ícone centralizado, nome, RENOMEAR + input +
 *     verde Salvar, linhas info (relogio/globo/escudo), vermelho DESCONECTAR;
 *   • modal "CONECTAR NOVOS APARELHOS": input código 6 dígitos + verde Autorizar
 *     + divisor "OU SIMULAR APARELHO DE TESTE" + botão "Simular Novo Aparelho".
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
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="20" height="20">
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

const SvgQr = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
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

const SvgClock = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="14" height="14">
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

const SvgGlobe = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="14" height="14">
    <circle cx="12" cy="12" r="10" />
    <line x1="2" y1="12" x2="22" y2="12" />
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
  </svg>
);

const SvgShield = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="14" height="14">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
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
  const [pairCode, setPairCode] = useState('');

  useEffect(() => {
    void loadDevices();
  }, []);

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

  return (
    <div className="sy-root">
      <section className="sy-card">
        {/* v4.10.0 — Banner full-width esmeralda (reference img 4) */}
        <div style={{
          padding: '20px 18px',
          background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.18) 0%, rgba(5, 150, 105, 0.12) 100%)',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          borderRadius: 14,
          marginBottom: 20,
          display: 'flex',
          flexDirection: 'column',
          gap: 14,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              padding: 10,
              borderRadius: 12,
              background: 'rgba(16, 185, 129, 0.2)',
              color: '#34d399',
              flexShrink: 0,
            }}>
              {SvgSmartphone}
            </div>
            <div>
              <p style={{ fontSize: 12, fontWeight: 800, color: '#34d399', margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Conectar Novos Aparelhos
              </p>
              <p style={{ fontSize: 10, color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono, monospace)', marginTop: 4, lineHeight: 1.4 }}>
                Adicione outro dispositivo usando um código de pareamento de 6 dígitos.
              </p>
            </div>
          </div>
          <button
            type="button"
            style={{
              width: '100%',
              padding: '10px 16px',
              background: 'rgba(16, 185, 129, 0.25)',
              border: '1px solid rgba(16, 185, 129, 0.5)',
              borderRadius: 10,
              color: '#34d399',
              fontSize: 11,
              fontWeight: 800,
              fontFamily: 'var(--font-mono, monospace)',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
            }}
            onClick={() => setShowConnectModal(true)}
          >
            {SvgQr}
            Conectar Dispositivo
          </button>
        </div>

        {/* Header */}
        <div className="sy-card__head">
          <div className="sy-card__head-left">
            <span className="sy-card__icon">{SvgMonitor}</span>
            <div>
              <h3 className="sy-card__title">Dispositivos Conectados</h3>
              <p className="sy-card__desc">
                Gerenciamento de aparelhos da conta. Toque em um dispositivo para definir um novo nome ou desconectá-lo.
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

        {/* Label STATUS DO DISPOSITIVO (reference img 4) */}
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
                    <span>{d.browser || ''}{d.os ? ` • ${d.os}` : ''}</span>
                    <span>• {d.lastActive}</span>
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

        {/* Nota de criptografia (reference img 4) */}
        <div style={{
          marginTop: 16,
          padding: '10px 14px',
          background: 'rgba(16, 185, 129, 0.06)',
          border: '1px solid rgba(16, 185, 129, 0.15)',
          borderRadius: 10,
          display: 'flex',
          alignItems: 'center',
          gap: 10,
        }}>
          <span style={{ color: '#34d399', flexShrink: 0 }}>{SvgShield}</span>
          <p style={{ fontSize: 10, color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono, monospace)', margin: 0, lineHeight: 1.5 }}>
            Todos os dados são protegidos com criptografia de ponta a ponta.
          </p>
        </div>
      </section>

      {/* Modal: Conectar Novo Dispositivo (reference img 6 — input 6 dígitos, sem QR) */}
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
            </div>

            <div>
              <label style={{
                fontSize: 10,
                fontFamily: 'var(--font-mono, monospace)',
                fontWeight: 700,
                color: 'var(--sy-dim)',
                textTransform: 'uppercase',
                display: 'block',
                marginBottom: 8,
              }}>
                Digitar Código do Outro Aparelho (6 dígitos ou PLN-…):
              </label>
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  type="text"
                  className="sy-input"
                  value={pairCode}
                  onChange={(e) => setPairCode(e.target.value.toUpperCase())}
                  placeholder="EX: 482910"
                  maxLength={12}
                  style={{ flex: 1 }}
                />
                <button
                  type="button"
                  className="sy-btn sy-btn--sm sy-btn--primary"
                  style={{ padding: '10px 16px' }}
                  onClick={() => {
                    /* TODO: validar código com sync-manager */
                    setShowConnectModal(false);
                    setPairCode('');
                  }}
                  disabled={pairCode.length < 6}
                >
                  Autorizar
                </button>
              </div>
              <p style={{ fontSize: 10, color: 'var(--sy-dim)', fontFamily: 'var(--font-mono, monospace)', marginTop: 10, lineHeight: 1.5 }}>
                Abra o Academia no novo dispositivo, vá em Dispositivos → Conectar e digite o código de 6 dígitos exibido.
              </p>
            </div>

            {/* Divisor OU SIMULAR (reference img 6) */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              margin: '18px 0',
            }}>
              <div style={{ flex: 1, height: 1, background: 'rgba(63, 63, 70, 0.6)' }} />
              <span style={{
                fontSize: 9,
                fontFamily: 'var(--font-mono, monospace)',
                fontWeight: 700,
                color: 'var(--sy-dim)',
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
              }}>
                Ou Simular Aparelho de Teste
              </span>
              <div style={{ flex: 1, height: 1, background: 'rgba(63, 63, 70, 0.6)' }} />
            </div>

            <button
              type="button"
              className="sy-btn"
              style={{ width: '100%', justifyContent: 'center' }}
              onClick={() => {
                /* TODO: chamar função de simulação no sync-manager */
                setShowConnectModal(false);
              }}
            >
              Simular Novo Aparelho
            </button>
          </div>
        </div>
      )}

      {/* Modal: Editar Dispositivo (reference img 5) */}
      {editingDevice && (
        <div className="sy-modal" role="dialog" aria-modal="true" aria-label="Editar Dispositivo">
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
              <h3 className="sy-modal__title">Editar Dispositivo</h3>
            </div>

            {/* Ícone centralizado (reference img 5) */}
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 14 }}>
              <div style={{
                padding: 14,
                borderRadius: 14,
                background: 'rgba(24, 24, 27, 0.8)',
                border: '1px solid rgba(63, 63, 70, 0.8)',
                color: editingDevice.isCurrent ? '#34d399' : 'var(--sy-dim)',
              }}>
                {editingDevice.deviceType === 'mobile' ? SvgSmartphone : SvgMonitor}
              </div>
            </div>

            {/* Nome do dispositivo (reference img 5) */}
            <div style={{ textAlign: 'center', marginBottom: 18 }}>
              <p style={{ fontSize: 14, fontWeight: 800, color: 'var(--sy-text)', margin: 0 }}>
                {editingDevice.name}
              </p>
              <p style={{ fontSize: 10, color: 'var(--sy-dim)', fontFamily: 'var(--font-mono, monospace)', marginTop: 4 }}>
                Nome do dispositivo
              </p>
            </div>

            {/* Renomear (reference img 5) */}
            <div style={{ marginBottom: 16 }}>
              <label style={{
                fontSize: 10,
                fontFamily: 'var(--font-mono, monospace)',
                fontWeight: 700,
                color: 'var(--sy-dim)',
                textTransform: 'uppercase',
                display: 'block',
                marginBottom: 6,
              }}>
                Renomear Dispositivo
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
                  style={{ flex: 1 }}
                />
                <button
                  type="button"
                  className="sy-btn sy-btn--sm sy-btn--primary"
                  onClick={() => void saveRename(editingDevice.id)}
                >
                  {SvgCheck}
                  Salvar
                </button>
              </div>
            </div>

            {/* Info rows (reference img 5) */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
              marginBottom: 18,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ color: 'var(--sy-dim)', flexShrink: 0 }}>{SvgClock}</span>
                <div>
                  <p style={{ fontSize: 10, color: 'var(--sy-dim)', fontFamily: 'var(--font-mono, monospace)', margin: 0 }}>
                    Última sessão ativa
                  </p>
                  <p style={{ fontSize: 11, color: 'var(--sy-text)', margin: 0 }}>
                    {editingDevice.isCurrent ? 'Ativo agora nesta janela' : editingDevice.lastActive}
                  </p>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ color: 'var(--sy-dim)', flexShrink: 0 }}>{SvgGlobe}</span>
                <div>
                  <p style={{ fontSize: 10, color: 'var(--sy-dim)', fontFamily: 'var(--font-mono, monospace)', margin: 0 }}>
                    Navegador e SO
                  </p>
                  <p style={{ fontSize: 11, color: 'var(--sy-text)', margin: 0 }}>
                    {editingDevice.browser || 'Desconhecido'}{editingDevice.os ? ` (${editingDevice.os})` : ''}
                  </p>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ color: '#34d399', flexShrink: 0 }}>{SvgShield}</span>
                <div>
                  <p style={{ fontSize: 11, color: '#34d399', margin: 0 }}>
                    Criptografia de ponta a ponta ativa
                  </p>
                </div>
              </div>
            </div>

            {/* Desconectar (reference img 5) */}
            <button
              type="button"
              className="sy-btn sy-btn--danger"
              style={{ width: '100%', justifyContent: 'center', marginBottom: 12 }}
              onClick={() => void handleDisconnect(editingDevice)}
            >
              {SvgTrash}
              Desconectar Dispositivo
            </button>
            <p style={{ fontSize: 9, color: 'var(--sy-dim)', fontFamily: 'var(--font-mono, monospace)', textAlign: 'center', lineHeight: 1.5, margin: 0 }}>
              Ao desconectar, este aparelho perderá acesso aos seus dados de sincronização.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default ConnectedDevices;
