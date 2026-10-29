/**
 * ExitConfirmDialog.tsx — confirmação de saída do site
 *
 * Reaproveita a linguagem visual do diálogo de saída da guilda
 * (`GuildLeaveDialog` / `.guild-overlay--dialog`): painel pequeno e centrado,
 * título, pergunta, texto de apoio e ações Cancelar/Sair. O browser não
 * permite UI personalizada no `beforeunload`; este modal cobre a saída
 * interceptada pelo histórico (botão voltar / gesto do celular).
 */

import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
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

  if (!open) return null;

  return createPortal(
    <div
      className="guild-overlay guild-overlay--nested guild-overlay--dialog"
      role="dialog"
      aria-modal="true"
      aria-label="Sair do app?"
      style={{ zIndex: 1300 }}
      onClick={onCancel}
    >
      <div className="guild-overlay__panel" onClick={(event) => event.stopPropagation()}>
        <div className="guild-overlay__head">
          <span className="guild-overlay__spacer" />
          <div className="guild-overlay__titles">
            <h2 className="guild-overlay__title">Sair do app?</h2>
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
          <p className="guild-confirm__question">Quer mesmo sair?</p>
          <p className="guild-confirm__text">
            Seu progresso já está salvo. Você pode voltar ao EVO FIT quando quiser.
          </p>
        </div>

        <div className="guild-overlay__foot">
          <div className="guild-confirm__actions">
            <button type="button" className="guild-btn guild-btn--ghost" onClick={onCancel}>
              Cancelar
            </button>
            <button type="button" className="guild-btn guild-btn--danger" onClick={onConfirm}>
              Sair
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}

export default ExitConfirmDialog;
