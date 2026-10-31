/**
 * ExitConfirmDialog.tsx — confirmação de saída do site
 *
 * Referência: o diálogo "Sair do Clash Royale" — título no cabeçalho, a
 * pergunta centralizada e as duas ações lado a lado (Cancelar vermelho e OK
 * azul). A casca é a do diálogo de saída da guilda (`GuildLeaveDialog` /
 * `.guild-overlay--dialog`), com os botões nas cores do próprio site
 * (`guild-btn--danger` / `guild-btn--blue`).
 *
 * O browser não permite UI personalizada no `beforeunload`; este modal cobre a
 * saída interceptada pelo histórico (botão voltar / gesto do celular).
 */

import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { useModalPresence } from '@/hooks/useModalPresence';
import '@/features/social/guild.css';

export function ExitConfirmDialog({
  open,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onCancel();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onCancel]);

  /* v4.57.0 — o diálogo espera a animação de saída (`.is-closing`) antes de
     sair do DOM; o pai só precisa alternar `open`. */
  const { mounted, closing } = useModalPresence(open);

  if (!mounted) return null;

  return createPortal(
    <div
      className={`guild-overlay guild-overlay--nested guild-overlay--dialog${closing ? ' is-closing' : ''}`}
      role="dialog"
      aria-modal="true"
      aria-label="Sair do EVO FIT"
      aria-hidden={closing || undefined}
      style={{ zIndex: 1300 }}
      onClick={closing ? undefined : onCancel}
    >
      <div className="guild-overlay__panel" onClick={(event) => event.stopPropagation()}>
        <div className="guild-overlay__head">
          <span className="guild-overlay__spacer" />
          <div className="guild-overlay__titles">
            <h2 className="guild-overlay__title">Sair do EVO FIT</h2>
          </div>
          <button
            type="button"
            className="guild-overlay__icon-btn guild-overlay__icon-btn--close"
            onClick={onCancel}
            aria-label="Fechar"
          >
            <X size={18} />
          </button>
        </div>

        <div className="guild-overlay__body">
          <p className="guild-confirm__question">Quer mesmo sair do EVO FIT?</p>
        </div>

        <div className="guild-overlay__foot">
          <div className="guild-confirm__actions">
            <button
              type="button"
              className="guild-btn guild-btn--danger"
              onClick={onCancel}
            >
              Cancelar
            </button>
            <button
              type="button"
              className="guild-btn guild-btn--blue"
              onClick={onConfirm}
            >
              OK
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}

export default ExitConfirmDialog;
