/**
 * HubShell.tsx — Shell genérico de hub com busca + tiles + telas (v4.3.0)
 *
 * Extraído da interface de Configurações (v4.1.0, SettingsFeature) e estendido
 * no v4.3.0 com pilha de navegação de profundidade N (raiz → grupo → leaf),
 * para o overlay do Perfil virar um hub fullscreen estilo SettingsStandalone:
 *
 *   • raiz    → 4 tiles de grupo (Perfil, Progressão, Personalizar, Configurações);
 *   • grupo   → tela com `tiles` (filhos) + `head`/`extra` opcionais;
 *   • leaf    → tela com `content` (conteúdo atual).
 *
 * Emite exatamente o DOM BEM `set-*` de settings.css (set-root / set-header /
 * set-eyebrow / set-title / set-sub / set-screen / set-search / set-tiles /
 * set-tile / set-empty) — os checks do cdp-test continuam válidos.
 *
 * Comportamento:
 *   • busca + `hubExtra` apenas na raiz (nos grupos as keywords dos leaves
 *     ficam nos tiles do grupo, então a busca da raiz encontra tudo);
 *   • tile → empilha a tela correspondente; "Voltar" desempilha;
 *   • `headerActions`/`eyebrow` de um screen sobrepõe o do shell; screens
 *     filho herdam do ancestral mais próximo que os definir.
 */

import { useState, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import './settings.css';

export interface HubTile {
  id: string;
  title: string;
  desc: string;
  icon: ReactNode;
  badge?: string;
  keywords?: string[];
}

export interface HubScreen {
  title: string;
  /** Eyebrow específico da tela (herdado do shell se ausente) */
  eyebrow?: string;
  /** Conteúdo da leaf (quando a tela não tem tiles aninhados) */
  content?: ReactNode;
  /** Grupo: tiles filhos */
  tiles?: HubTile[];
  /** Grupo: telas filhas, chaveadas pelo id do tile */
  screens?: Record<string, HubScreen>;
  /** Bloco acima dos tiles (somente telas de grupo) */
  head?: ReactNode;
  /** Bloco abaixo dos tiles (somente telas de grupo) */
  extra?: ReactNode;
  /** Ações de header da tela (herdadas/ substituem a do shell) */
  headerActions?: ReactNode;
}

export interface HubShellProps {
  /** Ex.: "ACADEMIA" */
  eyebrow: string;
  /** Título exibido na raiz */
  title: string;
  /** Subtítulo exibido apenas na raiz */
  sub?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  /** Tiles da raiz (grupos) */
  tiles: HubTile[];
  /** Telas da raiz, chaveadas pelo id do tile de grupo */
  screens: Record<string, HubScreen>;
  /** Ações do header da raiz (ex.: Backup) */
  headerActions?: ReactNode;
  /** Blocos extras sob os tiles apenas na raiz (ex.: quickbar) */
  hubExtra?: ReactNode;
  /** Pilha de navegação controlada (ids de screen, raiz → leaf) */
  navStack?: string[];
  onNavStackChange?: (stack: string[]) => void;
}

/* ── Ícones SVG stroke (Diretrizes/Ícones.md) ── */

const SvgArrowLeft = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
    <line x1="19" y1="12" x2="5" y2="12" />
    <polyline points="12 19 5 12 12 5" />
  </svg>
);

const SvgSearch = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="15" height="15">
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

const SvgX = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="14" height="14">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const SvgChevronRight = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="15" height="15">
    <polyline points="9 18 15 12 9 6" />
  </svg>
);

export function HubShell({
  eyebrow,
  title,
  sub,
  searchPlaceholder,
  emptyText = 'Nenhuma seção encontrada.',
  tiles,
  screens,
  headerActions,
  hubExtra,
  navStack,
  onNavStackChange,
}: HubShellProps) {
  const [internalStack, setInternalStack] = useState<string[]>([]);
  const [search, setSearch] = useState('');

  const stack = navStack ?? internalStack;
  const setStack = (next: string[]) => {
    setInternalStack(next);
    onNavStackChange?.(next);
  };

  /* Resolve a posição atual percorrendo a pilha (raiz → … → leaf) */
  let screensMap: Record<string, HubScreen> | undefined = screens;
  let active: HubScreen | undefined;
  let actionsNow = headerActions;
  let eyebrowNow = eyebrow;
  for (const key of stack) {
    const next: HubScreen | undefined = screensMap?.[key];
    if (!next) break;
    active = next;
    if (next.headerActions !== undefined) actionsNow = next.headerActions;
    if (next.eyebrow) eyebrowNow = next.eyebrow;
    screensMap = next.screens;
  }

  const isRoot = stack.length === 0;
  const isGroup = !isRoot && active?.tiles !== undefined;
  const isLeaf = !isRoot && !isGroup;

  const q = search.trim().toLowerCase();
  const currentTiles = isRoot
    ? !q
      ? tiles
      : tiles.filter(
          (t) =>
            t.title.toLowerCase().includes(q) ||
            t.desc.toLowerCase().includes(q) ||
            (t.keywords ?? []).some((k) => k.includes(q))
        )
    : (active?.tiles ?? []);

  const canGoBack = stack.length > 0;
  const goBack = () => setStack(stack.slice(0, -1));

  return (
    <div className="set-root">
      {/* ── Header: back (nas telas) + eyebrow + título + ações ── */}
      <header className="set-header">
        <div className="set-header__left">
          {canGoBack && (
            <button
              type="button"
              className="set-icon-btn"
              title="Voltar"
              aria-label={`Voltar para ${title}`}
              onClick={goBack}
            >
              {SvgArrowLeft}
            </button>
          )}
          <div>
            <span className="set-eyebrow">{eyebrowNow}</span>
            <h2 className="set-title">{active ? active.title : title}</h2>
            {isRoot && sub && <div className="set-sub">{sub}</div>}
          </div>
        </div>
        {actionsNow && <div className="set-header__actions">{actionsNow}</div>}
      </header>

      <AnimatePresence mode="wait">
        <motion.div
          key={stack.join('/')}
          initial={{ opacity: 0, x: 12 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -12 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
        >
          {isLeaf ? (
            /* ================= LEAF ================= */
            <div className="set-screen">{active?.content}</div>
          ) : (
            /* ================= RAIZ / GRUPO ================= */
            <div className="set-screen">
          {active?.head}

          {isRoot && (
            <div className="set-search">
              <span className="set-search__icon">{SvgSearch}</span>
              <input
                type="text"
                className="set-search__input"
                placeholder={searchPlaceholder}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              {search && (
                <button
                  type="button"
                  className="set-search__clear"
                  aria-label="Limpar busca"
                  onClick={() => setSearch('')}
                >
                  {SvgX}
                </button>
              )}
            </div>
          )}

          {currentTiles.length > 0 ? (
            <div className="set-tiles">
              {currentTiles.map((tile) => (
                <button
                  key={tile.id}
                  type="button"
                  className="set-tile"
                  onClick={() => setStack([...stack, tile.id])}
                >
                  <span className="set-tile__icon">{tile.icon}</span>
                  <span className="set-tile__body">
                    <span className="set-tile__title">{tile.title}</span>
                    <span className="set-tile__desc">{tile.desc}</span>
                    <span className="set-tile__badge">{tile.badge}</span>
                  </span>
                  <span className="set-tile__chev">{SvgChevronRight}</span>
                </button>
              ))}
            </div>
          ) : (
            <div className="set-empty">{emptyText}</div>
          )}

          {isRoot ? hubExtra : active?.extra}
        </div>
      )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

export default HubShell;
