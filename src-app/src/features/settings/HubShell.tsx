/**
 * HubShell.tsx — Shell genérico de hub com busca + tiles + telas (v4.2.0)
 *
 * Extraído da interface de Configurações (v4.1.0, SettingsFeature) para
 * reaproveitar o MESMO estilo em todas as abas do overlay de Perfil:
 * Perfil, Progressão, Personalizar e Preferências.
 *
 * Emite exatamente o DOM BEM `set-*` de settings.css (set-root / set-header /
 * set-eyebrow / set-title / set-sub / set-screen / set-search / set-tiles /
 * set-tile / set-empty) — os checks do cdp-test continuam válidos.
 *
 * Comportamento:
 *   • hub → busca filtra tiles (título, descrição e keywords);
 *   • tile → tela com título próprio + botão "Voltar" no header;
 *   • voltar → hub (busca preservada, estado interno do shell).
 */

import { useState, type ReactNode } from 'react';
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
  content: ReactNode;
}

export interface HubShellProps {
  /** Ex.: "ACADEMIA • PERFIL" */
  eyebrow: string;
  /** Título exibido no hub */
  title: string;
  /** Subtítulo exibido apenas no hub */
  sub?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  tiles: HubTile[];
  screens: Record<string, HubScreen>;
  /** Ações do header (ex.: Backup, Salvar) — visíveis no hub e nas telas */
  headerActions?: ReactNode;
  /** Blocos extras sob os tiles apenas no hub (ex.: quickbar) */
  hubExtra?: ReactNode;
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
}: HubShellProps) {
  const [screen, setScreen] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const active = screen != null ? screens[screen] : undefined;
  const q = search.trim().toLowerCase();
  const filteredTiles =
    !q
      ? tiles
      : tiles.filter(
          (t) =>
            t.title.toLowerCase().includes(q) ||
            t.desc.toLowerCase().includes(q) ||
            (t.keywords ?? []).some((k) => k.includes(q))
        );

  return (
    <div className="set-root">
      {/* ── Header: back (nas telas) + eyebrow + título + ações ── */}
      <header className="set-header">
        <div className="set-header__left">
          {active && (
            <button
              type="button"
              className="set-icon-btn"
              title="Voltar"
              aria-label={`Voltar para ${title}`}
              onClick={() => setScreen(null)}
            >
              {SvgArrowLeft}
            </button>
          )}
          <div>
            <span className="set-eyebrow">{eyebrow}</span>
            <h2 className="set-title">{active ? active.title : title}</h2>
            {!active && sub && <div className="set-sub">{sub}</div>}
          </div>
        </div>
        {headerActions && <div className="set-header__actions">{headerActions}</div>}
      </header>

      {!active ? (
        /* ================= HUB ================= */
        <div className="set-screen">
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

          {filteredTiles.length > 0 ? (
            <div className="set-tiles">
              {filteredTiles.map((tile) => (
                <button
                  key={tile.id}
                  type="button"
                  className="set-tile"
                  onClick={() => setScreen(tile.id)}
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

          {hubExtra}
        </div>
      ) : (
        /* ================= TELA ================= */
        <div className="set-screen">{active.content}</div>
      )}
    </div>
  );
}

export default HubShell;
