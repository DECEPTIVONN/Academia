/**
 * InicioMenuModal.tsx — Menu popup do botão "menu" do Início (v4.32.0)
 *
 * Histórico: a v4.31.1 estreou o popup inspirado no Clash Royale, mas saiu
 * CENTRALIZADO, quase da largura da tela, com cabeçalho "MENU" + ✕ e botões
 * "chunky" que destoavam do resto do site — reprovado pelo usuário no
 * comparativo. Refeito sobre a imagem de referência anexada:
 *
 *   • painel ANCORADO no botão que o abre (#dashBtnMenu, canto superior
 *     direito), com seta apontando para ele — como no popup do jogo;
 *   • SEM cabeçalho e SEM botão de fechar (fecha tocando fora ou com ESC);
 *   • largura enxuta (≈ metade da tela; antes ia a 400px centralizados);
 *   • itens no desenho do PRÓPRIO app — ícone em quadrado arredondado +
 *     rótulo, em grupos separados por hairline (mesma linguagem dos cartões
 *     de Configurações) em vez do botão azul "chunky" do jogo;
 *   • "EM BREVE" só aparece AO TOCAR num item placeholder (toast) — a pílula
 *     fixa no botão foi removida.
 *
 * Itens, de cima para baixo: Configurações (hub do Perfil) · Tela cheia
 * (entrar/sair, v4.33.0 — mesmo hook do shell) · Registro de Treinos ·
 * Rankings (interface de ranking) · Mensagens (caixa de mensagens) · Ajuda ·
 * Fit ID.
 *
 * Portal para document.body: o .section-strip tem transform/will-change e
 * passaria a ser o containing block do position:fixed (mesma causa-raiz dos
 * demais overlays do app).
 */

import React, { useEffect, useLayoutEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { MODAL_EXIT_MS, useModalPresence } from '@/hooks/useModalPresence';
import { showToast } from '@/lib/toast';
import { useCrossBrowserFullscreen } from '@/lib/fullscreen';
import './inicio-menu.css';

const toBody = (node: React.ReactNode) => createPortal(node, document.body);

/* ── Ícones próprios do menu (SVG stroke 24/currentColor — Ícones.md §2)
   17px/traço 2: vive dentro do quadrado de 30px do item, mesmo desenho dos
   tiles de Configurações. ── */
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

const IcoRegistro = (
  <svg {...ICON_PROPS}>
    <path d="M3.05 11a9 9 0 1 0 .5-4H1" />
    <polyline points="1 3 1 7 5 7" />
    <polyline points="12 8 12 12 14 14" />
  </svg>
);

const IcoRankings = (
  <svg {...ICON_PROPS}>
    <path d="M6 9H4.5a2.5 2.5 0 010-5H6" />
    <path d="M18 9h1.5a2.5 2.5 0 000-5H18" />
    <path d="M4 22h16" />
    <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
    <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
    <path d="M18 2H6v7a6 6 0 0012 0V2z" />
  </svg>
);

const IcoMensagens = (
  <svg {...ICON_PROPS}>
    <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
  </svg>
);

const IcoConfig = (
  <svg {...ICON_PROPS}>
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 01-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
  </svg>
);

const IcoAjuda = (
  <svg {...ICON_PROPS}>
    <circle cx="12" cy="12" r="10" />
    <path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);

/* v4.33.0 — tela cheia (entrar/sair): mesmos paths do SvgMaximize/SvgMinimize
   do shell (nav-items.tsx), no tamanho dos outros itens deste menu. */
const IcoTelaCheia = (
  <svg {...ICON_PROPS}>
    <path d="M8 3H5a2 2 0 00-2 2v3" />
    <path d="M21 8V5a2 2 0 00-2-2h-3" />
    <path d="M3 16v3a2 2 0 002 2h3" />
    <path d="M16 21h3a2 2 0 002-2v-3" />
  </svg>
);

const IcoSairTelaCheia = (
  <svg {...ICON_PROPS}>
    <path d="M8 3v3a2 2 0 01-2 2H3" />
    <path d="M21 8h-3a2 2 0 01-2-2V3" />
    <path d="M3 16h3a2 2 0 012 2v3" />
    <path d="M16 21v-3a2 2 0 012-2h3" />
  </svg>
);

const IcoFitId = (
  <svg {...ICON_PROPS}>
    <path d="M12 2l8 3v6c0 5-3.4 8.4-8 11-4.6-2.6-8-6-8-11V5l8-3z" />
    <path d="M9 12l2 2 4-4" />
  </svg>
);

interface MenuItem {
  key: string;
  label: string;
  icon: React.ReactNode;
  action: () => void;
}

interface InicioMenuModalProps {
  open: boolean;
  onClose: () => void;
  /** Interface de Rankings (Jogadores / Clãs / Amigos). */
  onOpenRankings: () => void;
  /** Caixa de Mensagens. */
  onOpenMessages: () => void;
  /** Hub de configurações do Perfil. */
  onOpenSettings: () => void;
  /** Tela de identidade Fit ID. */
  onOpenFitId: () => void;
  /** Modal "Ciclos de Treino" (mesmo do card CICLO do Início). */
  onOpenCycles: () => void;
}

export const InicioMenuModal: React.FC<InicioMenuModalProps> = ({
  open,
  onClose,
  onOpenRankings,
  onOpenMessages,
  onOpenSettings,
  onOpenFitId,
  onOpenCycles,
}) => {
  const panelRef = useRef<HTMLDivElement>(null);

  /* v4.33.0 — TELA CHEIA (entrar/sair) dentro do menu: mesmo hook do shell
     (MobileDrawer/Sidebar HUD), então o estado/botão ficam em sincronia com
     qualquer outra entrada de tela cheia do app. */
  const { isFullscreen, toggleFullscreen } = useCrossBrowserFullscreen();

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

  /* v4.32.0 — ANCORAGEM no botão: o painel é portal no <body>, então o
     lugar dele não vem do layout do dashboard. Medimos #dashBtnMenu e
     escrevemos top/right/teto de altura direto no nó (sem estado: nada
     re-renderiza, sem setState em efeito) a cada resize/orientação. */
  useLayoutEffect(() => {
    if (!open) return undefined;

    const place = () => {
      const panel = panelRef.current;
      if (!panel) return;
      const btn = document.getElementById('dashBtnMenu');
      const rect = btn?.getBoundingClientRect();
      const right = rect ? Math.max(12, window.innerWidth - rect.right) : 14;
      const top = rect ? rect.bottom + 10 : 72;
      panel.style.top = `${Math.round(top)}px`;
      panel.style.right = `${Math.round(right)}px`;
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

  const { mounted, closing } = useModalPresence(open);

  if (!mounted) return null;

  /* Ajuda ainda não existe: avisa (só no TOQUE — v4.32.0) e fecha. */
  const soon = (label: string) => {
    onClose();
    showToast(`${label} — em breve.`, 'info');
  };

  /* "Registro de Treinos" abre o modal de Ciclos de Treino (o mesmo do card
     CICLO). Espera o fade de saída do menu (MODAL_EXIT_MS) para o overlay do
     menu não cobrir o modal que tem z-index menor. Mesmo padrão para Rankings
     e Mensagens, que também são overlays de z-index menor. */
  const openAfterClose = (action: () => void) => {
    onClose();
    window.setTimeout(action, MODAL_EXIT_MS);
  };
  const openCycles = () => openAfterClose(onOpenCycles);

  const groups: MenuItem[][] = [
    [
      {
        key: 'config',
        label: 'Configurações',
        icon: IcoConfig,
        action: () => {
          onClose();
          onOpenSettings();
        },
      },
      {
        key: 'fullscreen',
        label: isFullscreen ? 'Sair da tela cheia' : 'Tela cheia',
        icon: isFullscreen ? IcoSairTelaCheia : IcoTelaCheia,
        action: () => {
          onClose();
          toggleFullscreen();
        },
      },
    ],
    [
      { key: 'registro', label: 'Registro de Treinos', icon: IcoRegistro, action: openCycles },
      {
        key: 'rankings',
        label: 'Rankings',
        icon: IcoRankings,
        action: () => openAfterClose(onOpenRankings),
      },
    ],
    [
      {
        key: 'mensagens',
        label: 'Mensagens',
        icon: IcoMensagens,
        action: () => openAfterClose(onOpenMessages),
      },
    ],
    [{ key: 'ajuda', label: 'Ajuda', icon: IcoAjuda, action: () => soon('Ajuda') }],
    [
      {
        key: 'fitid',
        label: 'Fit ID',
        icon: IcoFitId,
        action: () => {
          onClose();
          onOpenFitId();
        },
      },
    ],
  ];

  return toBody(
    <div
      className={`inicio-menu-overlay${closing ? ' is-closing' : ''}`}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="inicio-menu" ref={panelRef} role="dialog" aria-modal="true" aria-label="Menu do Início">
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
                <span className="inicio-menu__icon">{item.icon}</span>
                <span className="inicio-menu__label">{item.label}</span>
              </button>
            ))}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

export default InicioMenuModal;
