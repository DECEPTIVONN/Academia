/**
 * TreinosFeature.tsx — Seção TREINOS completa (Fase 4)
 * Substitui o stub `SheetsFeature`. Port 1:1 do DOM de componentes/secoes/treinos.html
 * (L1–381) + fluxos de:
 *  - nav.js L136–204 (t-tab-btn + sub-nav-btn com fadeSwap/fadeIn)
 *  - secao-treinos.js `renderExercicios` (L21–101) + toolbar (app.js L197–246)
 *  - handlers globais (app.js): modalImage L338–345, ESC L356–363,
 *    btnNovoExercicio L152, confirmDeleteExercicio L242–262.
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import type { AerobicConfig, Exercise } from '@/core/db/schema';
import { useLocalData } from '@/hooks/useLocalData';
import { fadeIn, fadeSwap } from '@/lib/animations';
import { showToast } from '@/lib/toast';
import { useMaestriaUi } from '@/features/gamification/maestria-ui';
import { useTreinosStore, type SubTab } from './treinos-store';
import { deleteExerciseRecord, saveSheetAerobic } from './treinos-helpers';
import { TreinosCollectionCard, TreinosGridCard } from './cards';
import { CustomizacaoSubTabs } from './CustomizacaoTabs';
import { MontarTab } from './MontarTab';
import { ExercicioFormModal } from './ExercicioFormModal';
import { AerobicoModal, ConfirmModal, CRDetailsModal, ImageModal, MaestriaGeralModal } from './TreinosModals';

/* ── Ícones (treinos.html L7–40) ── */

const TAB_ICON_EX = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width={16} height={16}>
    <path d="M6.5 6.5h11M6.5 17.5h11M12 6.5v11" />
    <circle cx="4" cy="12" r="1.5" />
    <circle cx="20" cy="12" r="1.5" />
  </svg>
);

const TAB_ICON_MONTAR = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width={16} height={16}>
    <rect x="3" y="3" width="18" height="18" rx="3" />
    <line x1="9" y1="9" x2="15" y2="9" />
    <line x1="9" y1="13" x2="15" y2="13" />
    <line x1="9" y1="17" x2="12" y2="17" />
  </svg>
);

interface SubNavDef {
  key: SubTab;
  title: string;
  icon: React.ReactNode;
}

const SUB_NAV: SubNavDef[] = [
  {
    key: 'exercicios-lista',
    title: 'Exercícios',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width={20} height={20}>
        <rect x="3" y="3" width="14" height="14" rx="2" />
        <rect x="7" y="7" width="14" height="14" rx="2" />
      </svg>
    ),
  },
  {
    key: 'itens-magicos',
    title: 'Itens Mágicos',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width={20} height={20}>
        <path d="M12 2l9 10-9 10-9-10z" />
      </svg>
    ),
  },
  {
    key: 'emotes',
    title: 'Emotes',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width={20} height={20}>
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    ),
  },
  {
    key: 'torres',
    title: 'Skins de Torre',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width={20} height={20}>
        <path d="M21 20v-2a4 4 0 0 0-3-3.87V7l-2-2-2 2v2l-2-2-2 2v2l-2-2-2 2v7.13A4 4 0 0 0 3 18v2" />
      </svg>
    ),
  },
  {
    key: 'estandartes',
    title: 'Estandartes',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width={20} height={20}>
        <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
        <line x1="4" y1="22" x2="4" y2="15" />
      </svg>
    ),
  },
  {
    key: 'maestrias',
    title: 'Maestrias',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width={20} height={20}>
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
      </svg>
    ),
  },
];

const FILTER_GROUPS = ['all', 'Peito', 'Costas', 'Pernas', 'Ombros', 'Bíceps', 'Tríceps', 'Core'];
const FILTER_LABELS: Record<string, string> = { all: 'Todos' };

/* ── Ícones da toolbar (treinos.html L44–104) ── */

const SEARCH_ICON = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} width={16} height={16}>
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

const FILTER_ICON = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} width={18} height={18}>
    <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
  </svg>
);

const EX_GRID_ICON = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} width={17} height={17}>
    <rect x="3" y="3" width="7" height="7" rx="1" />
    <rect x="14" y="3" width="7" height="7" rx="1" />
    <rect x="3" y="14" width="7" height="7" rx="1" />
    <rect x="14" y="14" width="7" height="7" rx="1" />
  </svg>
);

const EX_COLECAO_ICON = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} width={17} height={17}>
    <rect x="2" y="5" width="14" height="17" rx="2" />
    <path d="M6 2h12a2 2 0 0 1 2 2v14" />
  </svg>
);

const PLUS_ICON = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} width={18} height={18}>
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

/* ══════════ Componente ══════════ */

export const TreinosFeature: React.FC = () => {
  const data = useLocalData();
  const {
    mainTab,
    subTab,
    exView,
    filter,
    search,
    deckLetter,
    setMainTab,
    setSubTab,
    setExView,
    setFilter,
    setSearch,
    setDeckPage,
  } = useTreinosStore();

  /* ── Modais ── */
  const [formOpen, setFormOpen] = useState(false);
  const [editEx, setEditEx] = useState<Exercise | null>(null);
  const [confirmEx, setConfirmEx] = useState<Exercise | null>(null);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [crEx, setCrEx] = useState<Exercise | null>(null);
  const [mgOpen, setMgOpen] = useState(false);
  const [aeOpen, setAeOpen] = useState(false);

  /* ── Busca expansível (app.js L197–246) ── */
  const [expanded, setExpanded] = useState(false);
  const iconClickRef = useRef(false);
  const blurTimerRef = useRef<number | null>(null);

  /* v4.6.0-shell: a Busca Geral unificada define `search` no store — com
     query o input fica expandido mesmo sem passar pelo ícone (derivado
     durante o render, sem efeito). */
  const showSearch = expanded || !!search.trim();

  const onSearchIconMouseDown = () => {
    iconClickRef.current = true;
  };

  const onSearchBlur = () => {
    if (blurTimerRef.current) window.clearTimeout(blurTimerRef.current);
    blurTimerRef.current = window.setTimeout(() => {
      if (iconClickRef.current) return;
      if (!search.trim()) setExpanded(false);
    }, 150);
  };

  const onSearchIconClick = () => {
    if (showSearch) {
      setExpanded(false);
      setSearch('');
      document.getElementById('searchInput')?.blur();
    } else {
      setExpanded(true);
      window.setTimeout(() => (document.getElementById('searchInput') as HTMLInputElement | null)?.focus(), 0);
    }
    iconClickRef.current = false;
  };

  /* ── Menu ativo no modo coleção da lista (renderExercicios L85–95) ── */
  const [menuId, setMenuId] = useState<string | null>(null);

  /* ── Lista filtrada (renderExercicios L48–52) ── */
  const list = useMemo(() => {
    let out = data.exercises;
    if (filter !== 'all') out = out.filter((e) => e.muscleGroup === filter);
    const q = search.trim().toLowerCase();
    if (q) out = out.filter((e) => e.name.toLowerCase().includes(q) || e.muscleGroup.toLowerCase().includes(q));
    return out;
  }, [data.exercises, filter, search]);

  const aeSheet = data.sheets.find((s) => s.sheetKey === deckLetter);

  /* ── Troca de tab principal (nav.js L136–160) ── */
  const changeMainTab = (t: 'exercicios' | 'montar') => {
    if (t === mainTab) return;
    const activeTab = document.querySelector<HTMLElement>('#section-treinos .t-tab.active');
    const perform = () => {
      flushSync(() => {
        setMainTab(t);
        if (t === 'montar') setDeckPage(['F', 'G', 'H', 'I', 'J'].includes(deckLetter) ? 2 : 1);
      });
      fadeIn(document.getElementById(`tab-${t}`));
    };
    if (activeTab && activeTab !== document.getElementById(`tab-${t}`)) fadeSwap(activeTab, perform);
    else perform();
  };

  /* ── Troca de sub-aba (nav.js L166–204) ── */
  const changeSubTab = (t: SubTab) => {
    if (t === subTab) return;
    const activeContent = document.querySelector<HTMLElement>('#tab-exercicios .sub-tab-content.active');
    const perform = () => {
      flushSync(() => setSubTab(t));
      fadeIn(document.getElementById(`subtab-${t}`));
    };
    if (activeContent && activeContent !== document.getElementById(`subtab-${t}`)) fadeSwap(activeContent, perform);
    else perform();
  };

  /* ── Ações de exercício ── */
  const openNew = () => {
    setEditEx(null);
    setFormOpen(true);
  };

  const openEdit = (ex: Exercise) => {
    setEditEx(ex);
    setFormOpen(true);
  };

  const askDelete = (ex: Exercise) => setConfirmEx(ex);

  const doDelete = async () => {
    const ex = confirmEx;
    setConfirmEx(null);
    if (!ex) return;
    await deleteExerciseRecord(ex.id);
    showToast('Exercício excluído.', 'info');
  };

  /* ── Zoom de imagem (app.js L338–345) ── */
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && t.tagName === 'IMG' && (t.closest('.img-placeholder') || t.closest('.ex-card-img'))) {
        setImageSrc((t as HTMLImageElement).src);
      }
    };
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, []);

  /* ── ESC fecha todos os overlays abertos (app.js L356–363) ── */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (imageSrc) setImageSrc(null);
      else if (confirmEx) setConfirmEx(null);
      else if (formOpen) setFormOpen(false);
      else if (crEx) setCrEx(null);
      else if (mgOpen) setMgOpen(false);
      else if (aeOpen) setAeOpen(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [imageSrc, confirmEx, formOpen, crEx, mgOpen, aeOpen]);

  /* ── Cardio (openAerobicoModal L1070–1096) ── */
  const saveAerobico = async (ae: AerobicConfig) => {
    await saveSheetAerobic(deckLetter, ae);
    showToast('Cardio salvo!', 'success');
    setAeOpen(false);
  };

  return (
    <div className="treino-container">
      <div id="section-treinos" className="main-section" role="tabpanel">
        {/* Sub-abas internas da seção (treinos.html L5–17) */}
        <div className="treino-tabs-section section-subtabs">
          <nav className="treino-tab-nav" role="tablist">
            <button
              type="button"
              className={`t-tab-btn${mainTab === 'exercicios' ? ' active' : ''}`}
              data-tab="exercicios"
              role="tab"
              aria-selected={mainTab === 'exercicios'}
              id="tabBtnExercicios"
              onClick={() => changeMainTab('exercicios')}
            >
              {TAB_ICON_EX}
              EXERCÍCIOS
            </button>
            <button
              type="button"
              className={`t-tab-btn${mainTab === 'montar' ? ' active' : ''}`}
              data-tab="montar"
              role="tab"
              aria-selected={mainTab === 'montar'}
              id="tabBtnMontar"
              onClick={() => changeMainTab('montar')}
            >
              {TAB_ICON_MONTAR}
              MONTAR FICHA
            </button>
          </nav>
        </div>

        {/* ========== TAB: EXERCÍCIOS ========== */}
        <div
          id="tab-exercicios"
          className={`t-tab${mainTab === 'exercicios' ? ' active' : ''}`}
          role="tabpanel"
        >
          {/* Sub-navbar (estilo Clash Royale) */}
          <div className="sub-navbar">
            {SUB_NAV.map((b) => (
              <button
                type="button"
                key={b.key}
                className={`sub-nav-btn${subTab === b.key ? ' active' : ''}`}
                data-subtab={b.key}
                title={b.title}
                onClick={() => changeSubTab(b.key)}
              >
                {b.icon}
              </button>
            ))}
          </div>

          {/* Sub-aba: lista de exercícios */}
          <div
            className={`sub-tab-content${subTab === 'exercicios-lista' ? ' active' : ''}`}
            id="subtab-exercicios-lista"
            style={subTab === 'exercicios-lista' ? undefined : { display: 'none' }}
          >
            <div className="ex-toolbar premium-toolbar">
              <div className={`ex-search-box collapsible${showSearch ? ' expanded' : ''}`} id="exSearchContainer">
                <span className="ex-search-icon" onMouseDown={onSearchIconMouseDown} onClick={onSearchIconClick}>
                  {SEARCH_ICON}
                </span>
                <input
                  type="text"
                  id="searchInput"
                  placeholder="Buscar exercício..."
                  className="ex-search-input"
                  autoComplete="off"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                  onBlur={onSearchBlur}
                />
              </div>

              <div className="toolbar-actions">
                <div className="filter-dropdown-container" tabIndex={0}>
                  <button type="button" className="icon-btn" title="Filtros">
                    {FILTER_ICON}
                  </button>
                  <div className="cr-dropdown-menu">
                    <div className="cr-dropdown-header">Filtro</div>
                    <div className="cr-dropdown-body" id="grupoFilters">
                      {FILTER_GROUPS.map((g) => (
                        <div
                          key={g}
                          className={`g-chip cr-dropdown-item${filter === g ? ' active' : ''}`}
                          data-grupo={g}
                          onClick={() => setFilter(g)}
                        >
                          <div className="cr-checkbox" />
                          <span className="cr-label">{FILTER_LABELS[g] ?? g}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="view-selector">
                  <button
                    type="button"
                    className={`view-btn${exView === 'grid' ? ' active' : ''}`}
                    id="btnExViewGrid"
                    title="Modo Grid"
                    onClick={() => setExView('grid')}
                  >
                    {EX_GRID_ICON}
                  </button>
                  <button
                    type="button"
                    className={`view-btn${exView === 'colecao' ? ' active' : ''}`}
                    id="btnExViewColecao"
                    title="Modo Coleção"
                    onClick={() => setExView('colecao')}
                  >
                    {EX_COLECAO_ICON}
                  </button>
                </div>

                <button
                  type="button"
                  className="icon-btn btn-novo-ex-min"
                  id="btnNovoExercicio"
                  title="Novo Exercício"
                  onClick={openNew}
                >
                  {PLUS_ICON}
                </button>
              </div>
            </div>

            <div
              className={`exercicios-grid${exView === 'colecao' ? ' collection-grid' : ''}`}
              id="exerciciosGrid"
            >
              {list.map((ex) =>
                exView === 'grid' ? (
                  <TreinosGridCard key={ex.id} ex={ex} onEdit={openEdit} onDel={askDelete} />
                ) : (
                  <TreinosCollectionCard
                    key={ex.id}
                    ex={ex}
                    already={false}
                    menuActive={menuId === ex.id}
                    onEdit={openEdit}
                    onDel={askDelete}
                    onCardClick={(e) => setMenuId((cur) => (cur === e.id ? null : e.id))}
                  />
                )
              )}
            </div>

            <div className="ex-empty-state" id="exEmpty" style={{ display: list.length ? 'none' : 'block' }}>
              <div className="empty-icon">🔍</div>
              <p>Nenhum exercício encontrado.</p>
            </div>
          </div>

          {/* Sub-abas de customização */}
          <CustomizacaoSubTabs subtab={subTab} />
        </div>

        {/* ========== TAB: MONTAR FICHA ========== */}
        <div
          id="tab-montar"
          className={`t-tab${mainTab === 'montar' ? ' active' : ''}`}
          role="tabpanel"
        >
          <MontarTab
            onEdit={openEdit}
            onDelete={askDelete}
            onOpenCR={setCrEx}
            onOpenMaestriaGeral={() => setMgOpen(true)}
            onOpenAerobico={() => setAeOpen(true)}
          />
        </div>
      </div>

      {/* ── Modais da seção (key remonta a cada abertura → init via useState) ── */}
      <ExercicioFormModal
        key={formOpen ? `form-${editEx?.id ?? 'new'}` : 'form-closed'}
        open={formOpen}
        editEx={editEx}
        onClose={() => setFormOpen(false)}
        onSaved={() => undefined}
      />
      <ConfirmModal
        open={confirmEx !== null}
        title="Excluir exercício?"
        msg={confirmEx ? `"${confirmEx.name}" será removido permanentemente.` : ''}
        onYes={() => void doDelete()}
        onNo={() => setConfirmEx(null)}
      />
      <ImageModal open={imageSrc !== null} src={imageSrc ?? ''} onClose={() => setImageSrc(null)} />
      <CRDetailsModal
        key={crEx ? `cr-${crEx.id}` : 'cr-closed'}
        open={crEx !== null}
        ex={crEx}
        legacy={data.legacy}
        onClose={() => setCrEx(null)}
        onEdit={openEdit}
        onMaestria={(id) => useMaestriaUi.getState().openMaestriaEx(id)}
      />
      <MaestriaGeralModal
        open={mgOpen}
        exercises={data.exercises}
        legacy={data.legacy}
        onClose={() => setMgOpen(false)}
        onOpenEx={(id) => useMaestriaUi.getState().openMaestriaEx(id)}
      />
      <AerobicoModal
        key={aeOpen ? `ae-${deckLetter}` : 'ae-closed'}
        open={aeOpen}
        letter={deckLetter}
        aerobic={aeSheet?.aerobic ?? null}
        onClose={() => setAeOpen(false)}
        onSave={saveAerobico}
      />
    </div>
  );
};

export default TreinosFeature;
