/**
 * OverlayShell.tsx — casca dos overlays da aba Social
 *
 * Compartilhada entre o painel da guilda (detalhes, emblema, criação, saída) e
 * o popover do jogador (aba Social) e os Rankings. Monta via
 * `createPortal(document.body)` porque o `.section-strip` (will-change:
 * transform) é containing block do `position: fixed` — causa-raiz histórica de
 * overlays "fora da tela".
 *
 * O visual fica em `guild.css` (`.guild-overlay*`).
 */

import React from 'react';
import { createPortal } from 'react-dom';
import { ArrowLeft, X } from 'lucide-react';

export interface OverlayShellProps {
  title: string;
  subtitle?: string;
  onClose: () => void;
  onBack?: () => void;
  footer?: React.ReactNode;
  nested?: boolean;
  dialog?: boolean;
  /** Animação de saída (o pai mantém o overlay montado até o fim). */
  closing?: boolean;
  /** Clique no backdrop fecha o overlay. Padrão: true (só vale para `nested`). */
  backdropClose?: boolean;
  children: React.ReactNode;
}

export function OverlayShell({
  title,
  subtitle,
  onClose,
  onBack,
  footer,
  nested,
  dialog,
  closing,
  backdropClose = true,
  children,
}: OverlayShellProps) {
  return createPortal(
    <div
      className={`guild-overlay${nested ? ' guild-overlay--nested' : ''}${dialog ? ' guild-overlay--dialog' : ''}${closing ? ' is-closing' : ''}`}
      role="dialog"
      aria-modal="true"
      aria-label={title}
      aria-hidden={closing || undefined}
      onClick={nested && backdropClose && !closing ? onClose : undefined}
    >
      <div className="guild-overlay__panel" onClick={(event) => event.stopPropagation()}>
        <div className="guild-overlay__head">
          {onBack ? (
            <button
              type="button"
              className="guild-overlay__icon-btn"
              onClick={onBack}
              aria-label="Voltar"
            >
              <ArrowLeft size={18} />
            </button>
          ) : (
            <span className="guild-overlay__spacer" />
          )}
          <div className="guild-overlay__titles">
            <h2 className="guild-overlay__title">{title}</h2>
            {subtitle && <p className="guild-overlay__subtitle">{subtitle}</p>}
          </div>
          <button
            type="button"
            className="guild-overlay__icon-btn guild-overlay__icon-btn--close"
            onClick={onClose}
            aria-label="Fechar"
          >
            <X size={18} />
          </button>
        </div>
        <div className="guild-overlay__body">{children}</div>
        {footer && <div className="guild-overlay__foot">{footer}</div>}
      </div>
    </div>,
    document.body,
  );
}
