/**
 * InicioMenuModal.tsx — Menu popup do botão "menu" do Início (v4.31.1)
 *
 * Desenho inspirado no popup de menu do Clash Royale (imagem de referência):
 * painel escuro arredondado com uma lista vertical de botões "chunky" e
 * separadores, adaptado à paleta/tema do site. Itens, de cima para baixo:
 *   Registro de Treinos (placeholder) · Rankings (placeholder)
 *   ── Mensagens (aba Social) · Configurações (hub do Perfil)
 *   ── Ajuda (placeholder)
 *   ── Fit ID (abre o FitIdOverlay)
 *
 * Portal para document.body: o .section-strip tem transform/will-change e
 * passaria a ser o containing block do position:fixed (mesma causa-raiz dos
 * demais overlays do app).
 */

import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { showToast } from '@/lib/toast';
import './inicio-menu.css';

const toBody = (node: React.ReactNode) => createPortal(node, document.body);

interface MenuItem {
  key: string;
  label: string;
  icon: string;
  soon?: boolean;
  action: () => void;
}

interface InicioMenuModalProps {
  open: boolean;
  onClose: () => void;
  /** Aba Social (Mensagens). */
  onOpenMessages: () => void;
  /** Hub de configurações do Perfil. */
  onOpenSettings: () => void;
  /** Tela de identidade Fit ID. */
  onOpenFitId: () => void;
}

export const InicioMenuModal: React.FC<InicioMenuModalProps> = ({
  open,
  onClose,
  onOpenMessages,
  onOpenSettings,
  onOpenFitId,
}) => {
  /* Esc fecha + trava o scroll do body enquanto aberto (padrão dos overlays) */
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;

  /* Registro de Treinos / Rankings / Ajuda ainda não existem: avisam e fecham. */
  const soon = (label: string) => {
    onClose();
    showToast(`${label} — em breve.`, 'info');
  };

  const groups: MenuItem[][] = [
    [
      { key: 'registro', label: 'Registro de Treinos', icon: 'history', soon: true, action: () => soon('Registro de Treinos') },
      { key: 'rankings', label: 'Rankings', icon: 'military_tech', soon: true, action: () => soon('Rankings') },
    ],
    [
      {
        key: 'mensagens',
        label: 'Mensagens',
        icon: 'chat_bubble',
        action: () => {
          onClose();
          onOpenMessages();
        },
      },
      {
        key: 'config',
        label: 'Configurações',
        icon: 'settings',
        action: () => {
          onClose();
          onOpenSettings();
        },
      },
    ],
    [{ key: 'ajuda', label: 'Ajuda', icon: 'help', soon: true, action: () => soon('Ajuda') }],
    [
      {
        key: 'fitid',
        label: 'Fit ID',
        icon: 'verified_user',
        action: () => {
          onClose();
          onOpenFitId();
        },
      },
    ],
  ];

  return toBody(
    <div
      className="inicio-menu-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="inicio-menu" role="dialog" aria-modal="true" aria-label="Menu">
        <header className="inicio-menu__head">
          <h3 className="inicio-menu__title">Menu</h3>
          <button type="button" className="inicio-menu__close" aria-label="Fechar" onClick={onClose}>
            ✕
          </button>
        </header>

        <nav className="inicio-menu__list">
          {groups.map((group, gi) => (
            <React.Fragment key={group[0].key}>
              {gi > 0 && <div className="inicio-menu__sep" />}
              {group.map((item) => (
                <button
                  type="button"
                  key={item.key}
                  className="inicio-menu__item"
                  data-menu-item={item.key}
                  onClick={item.action}
                >
                  <span className="material-symbols-outlined">{item.icon}</span>
                  <span className="inicio-menu__label">{item.label}</span>
                  {item.soon && <span className="inicio-menu__soon">Em breve</span>}
                </button>
              ))}
            </React.Fragment>
          ))}
        </nav>
      </div>
    </div>
  );
};

export default InicioMenuModal;
