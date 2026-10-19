/**
 * MontarMenuModal.tsx — Menu popup do botão "menu" da aba Minha Ficha (Montar)
 * (v4.x) — mesmo estilo do InicioMenuModal (portal + painel ancorado).
 */
import React, { useEffect, useLayoutEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import '../../dashboard/inicio-menu.css';

const toBody = (node: React.ReactNode) => createPortal(node, document.body);

const ICON_PROPS = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  width: 17,
  height: 17,
} as const;

const IcoPlus = (
  <svg {...ICON_PROPS}>
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);
const IcoTrash = (
  <svg {...ICON_PROPS} stroke="#f87171">
    <path d="M3 6h18" />
    <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
    <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
  </svg>
);
const IcoCopy = (
  <svg {...ICON_PROPS}>
    <rect x="9" y="9" width="13" height="13" rx="2" />
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
  </svg>
);
const IcoPaste = (
  <svg {...ICON_PROPS}>
    <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
    <rect x="8" y="2" width="8" height="4" rx="1" />
  </svg>
);
const IcoShare = (
  <svg {...ICON_PROPS}>
    <circle cx="18" cy="5" r="3" />
    <circle cx="6" cy="12" r="3" />
    <circle cx="18" cy="19" r="3" />
    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
    <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
  </svg>
);
const IcoLink = (
  <svg {...ICON_PROPS}>
    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
  </svg>
);

interface MenuItem {
  key: string;
  label: string;
  icon: React.ReactNode;
  action: () => void;
  danger?: boolean;
}

interface MontarMenuModalProps {
  open: boolean;
  onClose: () => void;
  onAddSheet: () => void;
  onDeleteSheet: () => void;
  onCopySheet: () => void;
  onPasteSheet: () => void;
  onShowInGuild: () => void;
  onLink: () => void;
  canAdd: boolean;
  canDelete: boolean;
  hasClipboard: boolean;
}

export const MontarMenuModal: React.FC<MontarMenuModalProps> = ({
  open,
  onClose,
  onAddSheet,
  onDeleteSheet,
  onCopySheet,
  onPasteSheet,
  onShowInGuild,
  onLink,
  canAdd,
  canDelete,
  hasClipboard,
}) => {
  const panelRef = useRef<HTMLDivElement>(null);

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

  useLayoutEffect(() => {
    if (!open) return undefined;
    const place = () => {
      const panel = panelRef.current;
      if (!panel) return;
      const btn = document.getElementById('btnDeckMenu');
      const rect = btn?.getBoundingClientRect();
      // Painel abaixo do botão Menu, alinhado à direita do botão.
      const top = rect ? Math.min(rect.bottom + 10, window.innerHeight - 200) : 72;
      const right = rect ? Math.max(12, window.innerWidth - rect.right) : 14;
      panel.style.top = `${Math.round(top)}px`;
      panel.style.right = `${Math.round(right)}px`;
      panel.style.width = 'min(60vw, 240px)';
      panel.style.maxHeight = `${Math.max(180, Math.round(window.innerHeight - top - 16))}px`;
    };
    place();
    window.addEventListener('resize', place);
    window.addEventListener('orientationchange', place);
    return () => {
      window.removeEventListener('resize', place);
      window.removeEventListener('orientationchange', place);
    };
  }, [open]);

  if (!open) return null;

  const groups: MenuItem[][] = [
    [
      { key: 'add', label: 'Adicionar Ficha', icon: IcoPlus, action: () => { onClose(); onAddSheet(); }, },
      { key: 'delete', label: 'Excluir Ficha', icon: IcoTrash, action: () => { onClose(); onDeleteSheet(); }, danger: true },
    ],
    [
      { key: 'copy', label: 'Copiar Ficha', icon: IcoCopy, action: () => { onClose(); onCopySheet(); } },
      { key: 'paste', label: 'Colar Ficha', icon: IcoPaste, action: () => { onClose(); onPasteSheet(); } },
    ],
    [
      { key: 'guild', label: 'Mostrar na Guilda', icon: IcoShare, action: () => { onClose(); onShowInGuild(); } },
      { key: 'link', label: 'Link', icon: IcoLink, action: () => { onClose(); onLink(); } },
    ],
  ];

  // Desabilita itens quando não aplicável
  const isDisabled = (key: string) => {
    if (key === 'add' && !canAdd) return true;
    if (key === 'delete' && !canDelete) return true;
    if (key === 'paste' && !hasClipboard) return true;
    return false;
  };

  return toBody(
    <div
      className="inicio-menu-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="inicio-menu" ref={panelRef} role="dialog" aria-modal="true" aria-label="Menu da Ficha">
        {groups.map((group, gi) => (
          <React.Fragment key={group[0].key}>
            {gi > 0 && <div className="inicio-menu__sep" />}
            {group.map((item) => (
              <button
                type="button"
                key={item.key}
                className="inicio-menu__item"
                data-menu-item={item.key}
                disabled={isDisabled(item.key)}
                style={isDisabled(item.key) ? { opacity: 0.4, pointerEvents: 'none' } : undefined}
                onClick={item.action}
              >
                <span className="inicio-menu__icon" style={item.danger ? { color: '#f87171' } : undefined}>
                  {item.icon}
                </span>
                <span className="inicio-menu__label" style={item.danger ? { color: '#f87171' } : undefined}>
                  {item.label}
                </span>
              </button>
            ))}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

export default MontarMenuModal;