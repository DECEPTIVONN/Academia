/**
 * ColorPickerModal.tsx — Seletor avançado de cor (v4.1.0-settings)
 *
 * Espelha o ColorSchemeModal de referência (SettingsStandalone.tsx): área
 * S/V + slider de Matiz (H) + campo hex, com aplicação LIVE (onPreview em
 * cada alteração, sem persistir) e reversão exata no cancelar (onClose) —
 * a persistência (academia_theme='custom' + hex) só acontece em onApply.
 *
 * Render via portal no body (mesma abordagem do SocialFeature) para não
 * herdar nenhum contexto de stacking/transform do overlay do Perfil.
 */

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useModalExit } from '@/hooks/useModalPresence';
import { hexToHsv, hsvToHex, normalizeHex } from './theme-colors';

export interface ColorPickerModalProps {
  /** Cor ativa ao abrir (preview inicial não é re-aplicado). */
  initialHex: string;
  /** Aplicação visual temporária (sem localStorage). */
  onPreview: (hex: string) => void;
  /** Confirma: persistir a cor e fechar. */
  onApply: (hex: string) => void;
  /** Cancela: reverter para a cor salva e fechar. */
  onClose: () => void;
}

const SvgX = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

export function ColorPickerModal({
  initialHex,
  onPreview,
  onApply,
  onClose,
}: ColorPickerModalProps) {
  const start = hexToHsv(initialHex);
  const [hsv, setHsv] = useState(start);
  const [hexText, setHexText] = useState(() => normalizeHex(initialHex) ?? initialHex);
  const svRef = useRef<HTMLDivElement>(null);
  /* v4.57.0 — saída animada antes de avisar o pai (que desmonta o modal). */
  const { closing, requestClose } = useModalExit(onClose);

  const hex = hsvToHex(hsv.h, hsv.s, hsv.v);

  const update = (next: { h: number; s: number; v: number }) => {
    setHsv(next);
    const nextHex = hsvToHex(next.h, next.s, next.v);
    setHexText(nextHex);
    onPreview(nextHex);
  };

  /* ESC fecha (cancela) — capture no window para vencer o listener de ESC
     do App.tsx que fecha o overlay do Perfil (bubble em document). */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        requestClose();
      }
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [requestClose]);

  const pickSv = (clientX: number, clientY: number) => {
    const el = svRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = Math.min(Math.max(clientX - rect.left, 0), rect.width);
    const y = Math.min(Math.max(clientY - rect.top, 0), rect.height);
    update({
      h: hsv.h,
      s: rect.width ? x / rect.width : 0,
      v: rect.height ? 1 - y / rect.height : 0,
    });
  };

  const onHexChange = (value: string) => {
    setHexText(value);
    const n = normalizeHex(value);
    if (n) update(hexToHsv(n));
  };

  return createPortal(
    <div
      className={`set-picker-overlay${closing ? ' is-closing' : ''}`}
      role="presentation"
      aria-hidden={closing || undefined}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) requestClose();
      }}
    >
      <div
        className="set-picker"
        role="dialog"
        aria-modal="true"
        aria-label="Seletor avançado de cores"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="set-picker__head">
          <div>
            <div className="set-picker__eyebrow">COR DE DESTAQUE</div>
            <h3 className="set-picker__title">Seletor Avançado</h3>
          </div>
          <button
            type="button"
            className="set-icon-btn"
            aria-label="Fechar seletor"
            onClick={() => requestClose()}
          >
            {SvgX}
          </button>
        </div>

        {/* Área Saturação × Valor */}
        <div
          ref={svRef}
          className="set-picker__sv"
          style={{ backgroundColor: `hsl(${hsv.h}, 100%, 50%)` }}
          onPointerDown={(e) => {
            e.currentTarget.setPointerCapture(e.pointerId);
            pickSv(e.clientX, e.clientY);
          }}
          onPointerMove={(e) => {
            if (e.currentTarget.hasPointerCapture(e.pointerId)) {
              pickSv(e.clientX, e.clientY);
            }
          }}
        >
          <span
            className="set-picker__marker"
            style={{
              left: `${hsv.s * 100}%`,
              top: `${(1 - hsv.v) * 100}%`,
              background: hex,
            }}
          />
        </div>

        {/* Slider de Matiz */}
        <input
          type="range"
          className="set-picker__hue"
          min={0}
          max={360}
          step={1}
          value={Math.round(hsv.h)}
          aria-label="Matiz"
          onChange={(e) => update({ ...hsv, h: Number(e.target.value) })}
        />

        {/* Hex + preview */}
        <div className="set-picker__row">
          <span
            className="set-picker__preview"
            style={{ background: hex }}
            aria-hidden="true"
          />
          <label className="set-picker__hex-label" htmlFor="setPickerHex">
            HEX
          </label>
          <input
            id="setPickerHex"
            className="set-picker__hex"
            type="text"
            spellCheck={false}
            maxLength={7}
            value={hexText}
            onChange={(e) => onHexChange(e.target.value)}
          />
          <span className="set-picker__hsv">
            H {Math.round(hsv.h)}° · S {Math.round(hsv.s * 100)}% · V{' '}
            {Math.round(hsv.v * 100)}%
          </span>
        </div>

        <div className="set-picker__actions">
          <button type="button" className="set-btn" onClick={() => requestClose()}>
            Cancelar
          </button>
          <button
            type="button"
            className="set-btn set-btn--primary"
            onClick={() => requestClose(() => onApply(hex))}
          >
            Aplicar
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

export default ColorPickerModal;
