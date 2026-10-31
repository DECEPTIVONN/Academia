/**
 * GlobalSearchOverlay.tsx — Busca Geral Unificada (v4.6.0-shell)
 *
 * Port adaptado da busca do NavigationShellStandalone.tsx de referência:
 *   • overlay fullscreen (estilo command-palette) aberto por Ctrl/Cmd+K ou
 *     pelos botões de busca (Top Bar mobile / Sidebar desktop);
 *   • ESC fecha; ↑/↓ navega; Enter abre o resultado selecionado;
 *   • grupos: Seções → Configurações → Exercícios → Fichas, com ranking
 *     (search-index.ts) e trecho encontrado em destaque (<mark>);
 *   • a ação de cada item é interpretada pelo App (navegação de seção,
 *     hub profundo do Perfil ou store da seção Treinos).
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import './search.css';
import {
  buildDynamicIndex,
  flattenGroups,
  queryIndex,
  type SearchItem,
} from './search-index';
import { useLocalData } from '@/hooks/useLocalData';
import { useModalExit } from '@/hooks/useModalPresence';

const GROUP_LABELS: Record<string, string> = {
  secoes: 'Seções',
  configs: 'Configurações',
  exercicios: 'Exercícios',
  fichas: 'Fichas',
};

const KIND_ICON: Record<string, React.ReactNode> = {
  secao: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
    </svg>
  ),
  config: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
      <line x1="4" y1="21" x2="4" y2="14" />
      <line x1="4" y1="10" x2="4" y2="3" />
      <line x1="12" y1="21" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12" y2="3" />
      <line x1="20" y1="21" x2="20" y2="16" />
      <line x1="20" y1="12" x2="20" y2="3" />
      <line x1="1" y1="14" x2="7" y2="14" />
      <line x1="9" y1="8" x2="15" y2="8" />
      <line x1="17" y1="16" x2="23" y2="16" />
    </svg>
  ),
  exercicio: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
      <path d="M6.5 6.5h11M6.5 17.5h11M12 6.5v11" />
      <circle cx="4" cy="12" r="1.5" />
      <circle cx="20" cy="12" r="1.5" />
    </svg>
  ),
  ficha: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="8" y1="13" x2="16" y2="13" />
      <line x1="8" y1="17" x2="13" y2="17" />
    </svg>
  ),
};

/** Destaca o trecho da query no título (case-insensitive). */
function Highlight({ text, q }: { text: string; q: string }) {
  if (!q) return <>{text}</>;
  const idx = text.toLowerCase().indexOf(q);
  if (idx === -1) return <>{text}</>;
  return (
    <>
      {text.slice(0, idx)}
      <mark className="gs-mark">{text.slice(idx, idx + q.length)}</mark>
      {text.slice(idx + q.length)}
    </>
  );
}

interface GlobalSearchOverlayProps {
  open: boolean;
  onClose: () => void;
  onPick: (item: SearchItem) => void;
}

export const GlobalSearchOverlay: React.FC<GlobalSearchOverlayProps> = ({
  open,
  onClose,
  onPick,
}) => {
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const data = useLocalData();
  /* v4.57.0 — o App monta o overlay condicionalmente; a saída animada roda
     antes de avisar o pai (que então desmonta). */
  const { closing, requestClose } = useModalExit(onClose);

  const dynamic = useMemo(() => buildDynamicIndex(data), [data]);

  const groups = useMemo(() => queryIndex(dynamic, query), [dynamic, query]);
  const flat = useMemo(() => flattenGroups(groups), [groups]);

  const q = query.trim().toLowerCase();

  /* O App só monta o overlay enquanto aberto → o estado nasce limpo a cada
     abertura; aqui só focamos o input. */
  useEffect(() => {
    if (!open) return;
    const t = window.setTimeout(() => inputRef.current?.focus(), 30);
    return () => window.clearTimeout(t);
  }, [open]);

  /* Cursor ativo derivado (sobrevive a mudanças de query sem efeito) */
  const activeIdx = flat.length ? active % flat.length : 0;

  /* Enter abre o item ativo (query vazia não navega) */
  const submit = useCallback(() => {
    if (!q) return;
    const item = flat[activeIdx];
    if (item) onPick(item);
  }, [activeIdx, flat, onPick, q]);

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      requestClose();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((i) => (flat.length ? (i + 1) % flat.length : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((i) => (flat.length ? (i - 1 + flat.length) % flat.length : 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      submit();
    }
  };

  /* Rola o item ativo para a visão */
  useEffect(() => {
    if (!open) return;
    const el = listRef.current?.querySelector<HTMLElement>('.gs-item--active');
    el?.scrollIntoView({ block: 'nearest' });
  }, [activeIdx, open]);

  if (!open && !closing) return null;

  /* Offset de cada grupo no flat (setas/Enter) — derivado, sem mutação */
  const groupStart = (i: number) =>
    groups.ordered.slice(0, i).reduce((sum, g) => sum + g.items.length, 0);

  const renderedGroups = groups.ordered.map(({ key, items }, gIdx) => {
    const start = groupStart(gIdx);
    return (
      <div className="gs-group" key={key}>
        <div className="gs-group__label">{GROUP_LABELS[key]}</div>
        {items.map((item, i) => {
          const idx = start + i;
          return (
            <button
              key={item.id}
              type="button"
              className={idx === activeIdx ? 'gs-item gs-item--active' : 'gs-item'}
              onMouseEnter={() => setActive(idx)}
              onClick={() => onPick(item)}
            >
              <span className="gs-item__icon" aria-hidden="true">
                {KIND_ICON[item.kind]}
              </span>
              <span className="gs-item__body">
                <span className="gs-item__title">
                  <Highlight text={item.title} q={q} />
                </span>
                <span className="gs-item__desc">{item.desc}</span>
              </span>
              <span className="gs-item__kind">{item.kind}</span>
            </button>
          );
        })}
      </div>
    );
  });

  const isEmpty = flat.length === 0;

  return (
    <div
      className={`gs-overlay${closing ? ' is-closing' : ''}`}
      id="globalSearchOverlay"
      role="dialog"
      aria-modal="true"
      aria-hidden={closing || undefined}
      aria-label="Busca geral"
    >
      <div className="gs-backdrop" onClick={() => requestClose()} />
      <div className="gs-panel">
        <div className="gs-head">
          <span className="gs-head__icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
              <circle cx="11" cy="11" r="7" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </span>
          <input
            ref={inputRef}
            type="text"
            className="gs-input"
            placeholder="Buscar seções, exercícios, fichas e configurações…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
            aria-label="Termo de busca"
            autoComplete="off"
            spellCheck={false}
          />
          <kbd className="gs-kbd">ESC</kbd>
        </div>

        <div className="gs-list" ref={listRef}>
          {data.loading && !flat.length ? (
            <div className="gs-empty">Carregando índice…</div>
          ) : isEmpty ? (
            <div className="gs-empty">
              Nada encontrado para <strong>“{query}”</strong>.
            </div>
          ) : (
            <>{renderedGroups}</>
          )}
        </div>

        <div className="gs-foot">
          <span>
            <kbd className="gs-kbd gs-kbd--sm">↑</kbd>
            <kbd className="gs-kbd gs-kbd--sm">↓</kbd> navegar
          </span>
          <span>
            <kbd className="gs-kbd gs-kbd--sm">Enter</kbd> abrir
          </span>
          <span>
            <kbd className="gs-kbd gs-kbd--sm">Ctrl</kbd>+
            <kbd className="gs-kbd gs-kbd--sm">K</kbd> busca
          </span>
        </div>
      </div>
    </div>
  );
};

export default GlobalSearchOverlay;
