/**
 * FichaFeature.tsx — Ficha do Dia (port 1:1 do Vanilla `componentes/secoes/ficha.html`
 * + `JS/treino/secao-ficha.js` + `JS/treino/templates.js`)
 *
 * Emite exatamente o DOM/classes legados (hero, header bar, views table/grid/deck,
 * checkboxes, botões de série, cardio) reaproveitando o CSS legado já importado.
 * Dados: `useLocalData` (exercises/sheets/history/legacy) + `today-entry-store`
 * (checks/séries/conclusão do dia, espelhando `db.historico[today()]`).
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useLocalData } from '@/hooks/useLocalData';
import { useWorkoutStore } from '@/store/workout-store';
import { useTodayEntryStore } from '@/store/today-entry-store';
import { idb } from '@/core/db/idb';
import type { Exercise, SheetKey } from '@/core/db/schema';
import {
  applyFichaCompletion,
  determineNextTreino,
  formatCarga,
  getExerciseMap,
  getStreak,
  getTodayTreino,
  pickExercises,
  selectSheetEntry,
  todayLabel,
  toggleCheckEntry,
  toggleSetEntry,
  type FichaMutation,
  type LocalData,
} from '@/core/db/queries';
import { useShareStore } from '@/features/gamification/share-store';
import { FocusModal } from '@/features/workout/FocusModal';
import { fadeIn, fadeSwap } from '@/lib/animations';
import { showToast } from '@/lib/toast';

/* v4.22.0 — o modo "Coleção" (deck) saiu; o 3º slot virou o botão FOCO. */
type ViewMode = 'table' | 'grid';

interface FichaFeatureProps {
  onStartWorkout: (sheetKey: SheetKey) => void;
  /** Botão "ENCERRAR TREINO" com o cronômetro rodando → modalEncerrarTreino
      (secao-ficha.js L1022-1027 nunca encerra direto). */
  onRequestEncerrar: () => void;
  /** Todo marcado (legado: showConclusao com delay de 400ms — L312/L368). */
  onWorkoutCompleted: () => void;
  /** v4.25.0 — overlay da Ficha aberto: dispara o autoscroll para o conteúdo
      (pula o hero e aterrissa em "Progresso do treino" + exercícios). */
  open?: boolean;
}

/* ── Imagem do exercício (onerror → .premium-placeholder, igual ao legado) ── */

const FichaImg: React.FC<{ ex: Exercise; padded?: boolean; draggable?: boolean }> = ({
  ex,
  padded,
  draggable,
}) => {
  const [failed, setFailed] = useState(false);
  const placeholder = (
    <div className="premium-placeholder">
      <i className="fas fa-dumbbell" />
      <span>EXERCÍCIO</span>
    </div>
  );
  const img =
    ex.imageUrl && !failed ? (
      <img
        src={ex.imageUrl}
        alt={ex.name}
        draggable={draggable}
        onError={() => setFailed(true)}
      />
    ) : null;
  const content = img ?? placeholder;
  return padded ? <div className="img-placeholder">{content}</div> : <>{content}</>;
};

/* ── Botão de anotação rápida (btn-note-toggle-table / -deck) ── */

const NoteButton: React.FC<{
  variant: 'table' | 'deck';
  ex: Exercise;
  onEdit: (ex: Exercise) => void;
}> = ({ variant, ex, onEdit }) => (
  <button
    type="button"
    className={`btn-note-toggle-${variant} ${ex.notes ? 'has-note' : ''}`}
    data-id={ex.id}
    title={ex.notes || 'Adicionar nota'}
    onClick={() => onEdit(ex)}
  >
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      width={14}
      height={14}
    >
      <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
      <path d="M14 2v4a2 2 0 0 0 2 2h4" />
      <path d="M10 9H8" />
      <path d="M16 13H8" />
      <path d="M16 17H8" />
    </svg>
  </button>
);

/* ── Checkbox legado (.check-wrap / .deck-check-wrap) ── */

const CheckWrap: React.FC<{
  wrap: 'check' | 'deck';
  id: string;
  exId: string;
  checked: boolean;
  onToggle: (exId: string) => void;
}> = ({ wrap, id, exId, checked, onToggle }) => (
  <div className={wrap === 'check' ? 'check-wrap' : 'deck-check-wrap'}>
    <input
      type="checkbox"
      className="check-input"
      id={id}
      data-id={exId}
      checked={checked}
      onChange={() => onToggle(exId)}
    />
    <label className="check-label" htmlFor={id}>
      <span className="check-mark">✓</span>
    </label>
  </div>
);

/* ── Card/linha de exercício (espelha templates.js) ── */

interface CardProps {
  ex: Exercise;
  index: number;
  checked: boolean;
  seriesDone: boolean[];
  onToggle: (exId: string) => void;
  onSet: (exId: string, idx: number) => void;
  onNote: (ex: Exercise) => void;
}

const buildSeriesButtons = (
  ex: Exercise,
  seriesDone: boolean[],
  onSet: (exId: string, idx: number) => void,
  withTitle: boolean
) =>
  Array.from({ length: ex.sets || 0 }, (_, s) => (
    <button
      key={s}
      type="button"
      className={`btn-set ${seriesDone[s] ? 'done' : ''}`}
      data-id={ex.id}
      data-idx={s}
      title={withTitle ? `Série ${s + 1}` : undefined}
      onClick={(e) => {
        e.stopPropagation();
        onSet(ex.id, s);
      }}
    >
      {s + 1}
    </button>
  ));

const FichaTableRow: React.FC<CardProps & { idPrefix: string }> = ({
  ex,
  index,
  checked,
  seriesDone,
  onToggle,
  onSet,
  onNote,
  idPrefix,
}) => {
  const cells = buildSeriesButtons(ex, seriesDone, onSet, true);
  while (cells.length < 3) {
    cells.push(
      <div key={`ph-${cells.length}`} className="empty-grid-cell" style={{ width: 30, height: 30 }} />
    );
  }
  cells.splice(
    3,
    0,
    <NoteButton key="note" variant="table" ex={ex} onEdit={onNote} />
  );

  const cargaHtml =
    ex.load || ex.tags.includes('Peso do Corpo') ? ` · ${formatCarga(ex)}` : '';

  return (
    <tr
      className={`stagger-item ${checked ? 'row-done' : ''}`}
      data-id={ex.id}
      style={{ '--item-index': index } as React.CSSProperties}
    >
      <td>
        <div className="row-num">{index + 1}</div>
      </td>
      <td>
        <span className="ex-name">{ex.name}</span>
      </td>
      <td>
        <FichaImg ex={ex} padded />
      </td>
      <td>
        <div className="vol-text">
          {ex.sets}×{ex.reps}
          <span>REPS</span>
          {cargaHtml}
        </div>
        <div className="series-grid-table">{cells}</div>
      </td>
      <td>
        <CheckWrap
          wrap="check"
          id={`${idPrefix}${ex.id}`}
          exId={ex.id}
          checked={checked}
          onToggle={onToggle}
        />
      </td>
    </tr>
  );
};

const FichaCard: React.FC<CardProps & { mode: 'grid' | 'deck' }> = ({
  ex,
  index,
  checked,
  seriesDone,
  onToggle,
  onSet,
  onNote,
  mode,
}) => {
  const prefix = mode === 'grid' ? 'chk-grid-' : 'chk-deck-';
  const cargaHtml =
    mode === 'grid' && (ex.load || ex.tags.includes('Peso do Corpo'))
      ? ` | Carga: ${formatCarga(ex)}`
      : '';

  return (
    <div
      className={`deck-card stagger-item card-${ex.muscleGroup} ${checked ? 'row-done' : ''}`}
      data-id={ex.id}
      draggable={mode === 'deck' ? false : undefined}
      style={{ '--item-index': index } as React.CSSProperties}
    >
      <div className="deck-card-header">{ex.muscleGroup}</div>
      <div className="deck-card-img">
        <FichaImg ex={ex} draggable={false} />
      </div>
      <div className="deck-card-info">
        <div className="deck-card-name">{ex.name}</div>
        <div
          className="deck-card-meta-row"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginTop: 6,
            width: '100%',
          }}
        >
          <span className="deck-card-vol">
            Séries: {ex.sets}×{ex.reps}
            {cargaHtml}
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <NoteButton variant="deck" ex={ex} onEdit={onNote} />
            <CheckWrap
              wrap="deck"
              id={`${prefix}${ex.id}`}
              exId={ex.id}
              checked={checked}
              onToggle={onToggle}
            />
          </div>
        </div>
      </div>
      <div className="deck-card-actions">
        <div
          className="series-wrap-deck"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            gap: 6,
            padding: '4px 0 8px 0',
          }}
        >
          {buildSeriesButtons(ex, seriesDone, onSet, mode === 'grid')}
        </div>
      </div>
    </div>
  );
};

/* ── Cardio (espelha secao-ficha.js: linha de tabela + card grid/deck) ── */

interface CardioProps {
  tipo: string;
  vel: string;
  tempo: string;
  index: number;
  checked: boolean;
  aeId: string;
  prefix: string;
  onToggle: (exId: string) => void;
}

const FichaCardioCard: React.FC<CardioProps> = ({
  tipo,
  vel,
  tempo,
  index,
  checked,
  aeId,
  prefix,
  onToggle,
}) => (
  <div
    className={`ex-card ex-card-aerobico stagger-item ${checked ? 'row-done' : ''}`}
    data-id={aeId}
    style={{ '--item-index': index } as React.CSSProperties}
  >
    <div className="ae-card-header">
      <div className="ae-icon">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          width={20}
          height={20}
        >
          <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
        </svg>
      </div>
      <div className="ae-label">CARDIO</div>
    </div>
    <div className="ex-card-body">
      <div className="ae-card-type">{tipo}</div>
      <div className="ae-card-stats">
        <div className="ae-stat-box">
          <span className="ae-stat-val">{vel || '--'}</span>
          <span className="ae-stat-unit">KM/H</span>
        </div>
        <div className="ae-stat-divider" />
        <div className="ae-stat-box">
          <span className="ae-stat-val">{tempo || '--'}</span>
          <span className="ae-stat-unit">MIN</span>
        </div>
      </div>
      <div className="check-wrap ae-check-wrap">
        <input
          type="checkbox"
          className="check-input"
          id={`${prefix}${aeId}`}
          data-id={aeId}
          checked={checked}
          onChange={() => onToggle(aeId)}
        />
        <label className="check-label" htmlFor={`${prefix}${aeId}`}>
          <span className="check-mark">✓</span>
        </label>
        <span className="ae-check-text">CONCLUIR CARDIO</span>
      </div>
    </div>
  </div>
);

const FichaCardioRow: React.FC<CardioProps> = ({
  tipo,
  vel,
  tempo,
  index,
  checked,
  aeId,
  onToggle,
}) => (
  <tr
    className={`row-aerobico stagger-item ${checked ? 'row-done' : ''}`}
    data-id={aeId}
    style={{ '--item-index': index } as React.CSSProperties}
  >
    <td>
      <div className="row-num" style={{ background: 'var(--gym-green)' }}>
        🏃
      </div>
    </td>
    <td>
      <span className="ae-table-type">{tipo}</span>
      <span className="ae-table-label">AERÓBICO</span>
    </td>
    <td colSpan={2}>
      <div className="ae-table-stats">
        <div className="ae-t-stat">
          <span>Vel:</span> <strong>{vel || '--'} km/h</strong>
        </div>
        <div className="ae-t-stat">
          <span>Tempo:</span> <strong>{tempo || '--'} min</strong>
        </div>
        <button
          type="button"
          className="btn-edit-ae-ficha"
          data-treino={aeId.replace('ae-', '')}
          title="Editar Cardio"
          style={{
            marginLeft: 'auto',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: 'var(--text-secondary)',
            padding: 4,
          }}
        >
          <span>⚙️</span>
        </button>
      </div>
    </td>
    <td>
      <div className="ae-progress-pill">
        <div className="ae-progress-fill" style={{ width: checked ? '100%' : '0%' }} />
        <span className="ae-progress-text">{checked ? 'CONCLUÍDO' : 'PENDENTE'}</span>
      </div>
    </td>
    <td>
      <CheckWrap
        wrap="check"
        id={`chk-${aeId}`}
        exId={aeId}
        checked={checked}
        onToggle={onToggle}
      />
    </td>
  </tr>
);

/* ── Feature ── */

const FIRE_SVG = (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    width={16}
    height={16}
    style={{ color: '#f97316', marginLeft: 2, display: 'inline-block', verticalAlign: 'middle' }}
  >
    <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
  </svg>
);

function formatElapsed(ms: number): string {
  const hours = Math.floor(ms / 3600000);
  const minutes = Math.floor((ms % 3600000) / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  const hStr = hours > 0 ? `${String(hours).padStart(2, '0')}:` : '';
  return `${hStr}${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

export const FichaFeature: React.FC<FichaFeatureProps> = ({
  onStartWorkout,
  onRequestEncerrar,
  onWorkoutCompleted,
  open = true,
}) => {
  const { exercises, sheets, history, legacy } = useLocalData();
  const { isActive, startTime, startRestTimer, skipRestTimer } = useWorkoutStore();
  const entry = useTodayEntryStore((s) => s.entry);
  const loadEntry = useTodayEntryStore((s) => s.load);

  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    const stored = localStorage.getItem('academia_view_mode');
    /* v4.22.0 — 'deck' (Coleção) foi removido → migra para 'grid' */
    return stored === 'table' || stored === 'grid' ? stored : 'grid';
  });
  const [now, setNow] = useState(() => Date.now());
  const [focusOpen, setFocusOpen] = useState(false);

  /* Containers das views (display toggling, como o DOM legado) */
  const tableViewRef = useRef<HTMLDivElement>(null);
  const gridViewRef = useRef<HTMLDivElement>(null);
  /* v4.25.0 — âncora do autoscroll (abre a Ficha "aterrissando" no progresso) */
  const progressRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    void loadEntry();
  }, [loadEntry]);

  /* Cronômetro global do treino (globalWorkoutTimer / gtTime).
     Legado `initGlobalTimer`/`startInterval` (secao-ficha.js L988-1028) chama
     `updateGlobalTimerUI()` imediatamente ao iniciar; aqui sincroniza `now`
     no mesmo instante em que `isActive` liga (senão o estado fica defasado no
     mount da Ficha e o display mostra `now - startTime` negativo por ~1s). */
  useEffect(() => {
    if (!isActive) return;
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [isActive]);

  const data = useMemo<LocalData>(
    () => ({ exercises, sheets, history, legacy }),
    [exercises, sheets, history, legacy]
  );

  const treino = entry.sheetKey ?? getTodayTreino(data);
  const sheet = sheets.find((s) => s.sheetKey === treino);
  const fichaIds = useMemo(() => sheet?.exerciseIds ?? [], [sheet]);
  const exMap = useMemo(() => getExerciseMap(exercises), [exercises]);
  const exercicios = useMemo(() => pickExercises(fichaIds, exMap), [fichaIds, exMap]);
  const hasAe = Boolean(sheet?.aerobic?.tipo);
  const ae = sheet?.aerobic ?? null;
  const aeId = `ae-${treino}`;

  /* Container visível (secao-ficha.js L48-50: table-scroll-wrap / grid) */
  const activeViewRef = (): HTMLElement | null => {
    if (viewMode === 'table') return tableViewRef.current;
    return gridViewRef.current;
  };

  const checks = entry.checks ?? [];
  const done =
    checks.filter((c) => fichaIds.includes(c)).length + (hasAe && checks.includes(aeId) ? 1 : 0);
  const total = exercicios.length + (hasAe ? 1 : 0);
  const pct = total ? Math.round((done / total) * 100) : 0;
  const isDone = (total > 0 && done === total) || entry.completed === true;
  const streak = getStreak(history);

  /* Transição para concluído → showConclusao com delay de 400ms
     (secao-ficha.js L312/L368: setTimeout(() => showConclusao(db), 400)).
     No Modo Foco o foco é quem conclui (focusCheck L910-915, delay de 1.5s),
     então o callback de 400ms é suprimido enquanto o modal está aberto —
     marcamos como já tratado para não re disparar ao fechar. */
  const wasDoneRef = useRef(isDone);
  const completedCbRef = useRef(onWorkoutCompleted);
  completedCbRef.current = onWorkoutCompleted;
  useEffect(() => {
    if (isDone && !wasDoneRef.current) {
      wasDoneRef.current = true;
      if (focusOpen) return undefined;
      const timer = window.setTimeout(() => completedCbRef.current(), 400);
      return () => window.clearTimeout(timer);
    }
    if (!isDone) wasDoneRef.current = false;
    return undefined;
    // eslint-disable-next-line react-hooks/exhaustive-deps -- dispara só na transição
  }, [isDone, focusOpen]);

  /* Sugestão (renderFichaSuggestion): último treino CONCLUÍDO + próximo sugerido */
  const suggestion = useMemo(() => {
    const withDone = history
      .filter((h) => h.completed || (h.completedKeys?.length ?? 0) > 0)
      .sort((a, b) => b.date.localeCompare(a.date));
    const last = withDone[0];
    if (!last) return null;
    const letter = last.completedKeys?.length
      ? last.completedKeys[last.completedKeys.length - 1]
      : last.sheetKey;
    if (!letter) return null;
    const d = new Date(`${last.date}T12:00:00`);
    return {
      letter,
      dateLabel: d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
      suggested: determineNextTreino(data),
    };
  }, [history, data]);

  /* v4.25.0 — autoscroll ao ABRIR a Ficha: pula o hero e posiciona o
     "Progresso do treino" no topo do scroller (.ficha-overlay__scroll),
     deixando os exercícios em vista. Roda em passes curtos porque o conteúdo
     acima (sugestão/timer) assenta depois do start; corrige só se errou > 4px. */
  useEffect(() => {
    if (!open) {
      return undefined;
    }
    const goto = () => {
      const el = progressRef.current;
      const scroller = el?.closest('.ficha-overlay__scroll') as HTMLElement | null;
      if (!el || !scroller) return;
      const delta = el.getBoundingClientRect().top - scroller.getBoundingClientRect().top;
      if (Math.abs(delta) < 2) return;
      scroller.scrollTo({ top: Math.max(0, scroller.scrollTop + delta), behavior: 'auto' });
    };
    const timers = [120, 500, 900, 1500].map((ms) => window.setTimeout(goto, ms));
    return () => timers.forEach((t) => window.clearTimeout(t));
  }, [open, suggestion]);

  /* Mutações (espelham os handlers de change de secao-ficha.js) ── */

  const applyMutation = (fn: (base: typeof entry) => FichaMutation) => {
    const store = useTodayEntryStore.getState();
    const { entry: next, rest } = fn(store.entry);
    if (!next.sheetKey) next.sheetKey = treino;
    void store.update(() => next);
    if (rest === 'stop') skipRestTimer();
    else if (rest) startRestTimer(rest);
  };

  const withCompletion = (mut: FichaMutation): FichaMutation => ({
    ...mut,
    entry: applyFichaCompletion(mut.entry, treino, fichaIds, hasAe),
  });

  const onToggleCheck = (exId: string) => {
    const exercise = exId.startsWith('ae-') ? undefined : exMap.get(exId);
    applyMutation((base) => withCompletion(toggleCheckEntry(base, exId, exercise)));
  };

  const onToggleSet = (exId: string, idx: number) => {
    const ex = exMap.get(exId);
    if (!ex) return;
    applyMutation((base) => withCompletion(toggleSetEntry(base, exId, idx, ex)));
  };

  const onSelectSheet = (letter: SheetKey) => {
    /* app.js L90-96: fadeSwap no container ativo → setTodayTreino → toast */
    fadeSwap(activeViewRef(), () => {
      applyMutation((base) => ({ entry: selectSheetEntry(base, letter) }));
    });
    showToast(`Treino ${letter} selecionado!`, 'info');
  };

  /* startFocusMode (secao-ficha.js L759-776): valida ficha + marca o início */
  const onStartFocus = () => {
    if (fichaIds.length === 0) {
      showToast('Adicione exercícios à ficha antes de iniciar o Modo Foco!', 'error');
      return;
    }
    if (!sessionStorage.getItem('focusStartTime')) {
      sessionStorage.setItem('focusStartTime', String(Date.now()));
    }
    setFocusOpen(true);
  };

  const onEditNote = async (ex: Exercise) => {
    const value = window.prompt('Anotação do exercício:', ex.notes ?? '');
    if (value === null) return;
    await idb.exercises.put({ ...ex, notes: value.trim() || undefined });
    document.dispatchEvent(new Event('academia:db-ready'));
  };

  const changeView = (mode: ViewMode) => {
    /* secao-ficha.js L46-64: fadeSwap no container visível → troca → localStorage */
    fadeSwap(activeViewRef(), () => {
      setViewMode(mode);
      localStorage.setItem('academia_view_mode', mode);
    });
  };

  /* fadeIn ao terminar o re-render da view ativa (secao-ficha.js L153/L212/L271:
     renderFicha refaz o container e reaplica ui-fade-in a cada atualização).
     v4.30.1: `checks` SAIU da chave — marcar/desmarcar um exercício reaplicava
     o ui-fade-in (e reiniciava TODOS os .stagger-item), o que aparecia como um
     "refresh" da página inteira a cada toque. O fade segue na troca de
     visualização (tabela/grid) e de ficha. */
  const viewAnimKey = `${viewMode}|${fichaIds.join(',')}`;
  useEffect(() => {
    fadeIn(activeViewRef());
    // eslint-disable-next-line react-hooks/exhaustive-deps -- espelha o fadeIn final de renderFicha
  }, [viewAnimKey]);

  const hasAnyContent = exercicios.length > 0 || hasAe;
  const showTable = hasAnyContent && viewMode === 'table';
  const showGrid = hasAnyContent && viewMode === 'grid';

  const cardProps = (ex: Exercise, i: number) => ({
    ex,
    index: i,
    checked: checks.includes(ex.id),
    seriesDone: entry.seriesDone?.[ex.id] ?? [],
    onToggle: onToggleCheck,
    onSet: onToggleSet,
    onNote: onEditNote,
  });

  const cardioProps: CardioProps = {
    tipo: ae?.tipo ?? '',
    vel: ae?.vel ?? '',
    tempo: ae?.tempo ?? '',
    index: exercicios.length,
    checked: checks.includes(aeId),
    aeId,
    prefix: 'chk-grid-',
    onToggle: onToggleCheck,
  };

  /* btnStartWorkout (secao-ficha.js L1007-1028): timer parado → inicia;
     timer rodando → modalEncerrarTreino (nunca encerra direto) */
  const handleStartClick = () => {
    if (!isActive) onStartWorkout(treino);
    else onRequestEncerrar();
  };

  return (
    <>
      {/* ===== HERO ===== */}
      <section className="treino-hero">
        <div className="hero-orb orb-1" />
        <div className="hero-orb orb-2" />
        <div className="treino-hero-content">
          <div className="treino-badge-label">🏋️ ACADEMIA</div>
          <h1 className="treino-hero-title">
            Fichas de <span className="gradient-text">Treino</span>
          </h1>
          <p className="treino-hero-sub">
            Treine com foco. Marque seus exercícios. Evolua todo dia.
          </p>
          <div className="treino-hero-stats">
            <div className="h-stat">
              <div className="h-stat-val" id="statTotalEx">
                {exercises.length}
              </div>
              <div className="h-stat-lbl">Exercícios</div>
            </div>
            <div className="h-stat-div" />
            <div className="h-stat">
              <div className="h-stat-val" id="statFichas">
                A + B
              </div>
              <div className="h-stat-lbl">Fichas</div>
            </div>
            <div className="h-stat-div" />
            <div className="h-stat">
              <div className="h-stat-val" id="statStreak">
                {streak}
                {streak > 0 && FIRE_SVG}
              </div>
              <div className="h-stat-lbl">Dias Seguidos</div>
            </div>
          </div>
        </div>
      </section>

      <div className="treino-container">
        <div id="section-ficha" className="main-section" role="tabpanel">
          <div id="tab-ficha" className="t-tab active" role="tabpanel">
            {/* ===== HEADER BAR ===== */}
            <div className="ficha-header-bar">
              <div className="ficha-left">
                <div className="ficha-treino-badge" id="fichaTreinoBadge">
                  TREINO {treino}
                </div>
                <div className="ficha-date" id="fichaDate">
                  {todayLabel()}
                </div>
              </div>
              <div className="ficha-right">
                <button
                  type="button"
                  className={`btn-start-workout ${isActive ? 'active' : ''}`}
                  id="btnStartWorkout"
                  onClick={handleStartClick}
                >
                  {isActive ? (
                    <>
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        width={16}
                        height={16}
                        style={{ marginRight: 6 }}
                      >
                        <rect x={4} y={4} width={16} height={16} rx={2} ry={2} />
                      </svg>
                      ENCERRAR TREINO
                    </>
                  ) : (
                    <>
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        width={16}
                        height={16}
                      >
                        <polygon points="5 3 19 12 5 21 5 3" />
                      </svg>
                      INICIAR TREINO
                    </>
                  )}
                </button>
                <div className="v-divider" />
                <div className="view-selector">
                  <button
                    type="button"
                    className={`view-btn ${viewMode === 'table' ? 'active' : ''}`}
                    data-view="table"
                    id="viewBtnTable"
                    title="Visualização em Tabela"
                    onClick={() => changeView('table')}
                  >
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      width={18}
                      height={18}
                    >
                      <rect x={3} y={3} width={18} height={18} rx={2} />
                      <line x1={3} y1={9} x2={21} y2={9} />
                      <line x1={3} y1={15} x2={21} y2={15} />
                      <line x1={9} y1={9} x2={9} y2={21} />
                    </svg>
                  </button>
                  <button
                    type="button"
                    className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
                    data-view="grid"
                    id="viewBtnGrid"
                    title="Visualização em Grid"
                    onClick={() => changeView('grid')}
                  >
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      width={18}
                      height={18}
                    >
                      <rect x={3} y={3} width={7} height={7} rx={1} />
                      <rect x={14} y={3} width={7} height={7} rx={1} />
                      <rect x={3} y={14} width={7} height={7} rx={1} />
                      <rect x={14} y={14} width={7} height={7} rx={1} />
                    </svg>
                  </button>
                  {/* v4.22.0 — o slot da "Coleção" virou o botão FOCO */}
                  <button
                    type="button"
                    className="view-btn view-btn--focus"
                    id="viewBtnFocus"
                    title="Iniciar Treino Foco"
                    onClick={onStartFocus}
                  >
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      width={18}
                      height={18}
                    >
                      <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                    </svg>
                  </button>
                </div>
                <div className="v-divider" />
                <span className="switch-label">Treino:</span>
                <div className="treino-selector">
                  {(['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'] as SheetKey[]).map(
                    (letter) => {
                      const s = sheets.find((sh) => sh.sheetKey === letter);
                      const temConteudo = (s?.exerciseIds?.length ?? 0) > 0 || Boolean(s?.aerobic?.tipo);
                      return (
                        <button
                          key={letter}
                          type="button"
                          className={`sel-btn ${treino === letter ? 'active' : ''}`}
                          data-treino={letter}
                          id={`selBtn${letter}`}
                          style={{ display: temConteudo ? 'flex' : 'none' }}
                          onClick={() => onSelectSheet(letter)}
                        >
                          {letter}
                        </button>
                      );
                    }
                  )}
                </div>
              </div>
            </div>

            {/* ===== CRONÔMETRO GLOBAL ===== */}
            <div
              className="global-timer"
              id="globalWorkoutTimer"
              style={{ display: isActive ? 'flex' : 'none' }}
            >
              <div className="gt-icon">
                <i className="fas fa-stopwatch" />
              </div>
              <div className="gt-content">
                <span className="gt-label">Duração do Treino</span>
                <span className="gt-time" id="gtTime">
                  {formatElapsed(startTime ? Math.max(0, now - startTime) : 0)}
                </span>
              </div>
            </div>

            {/* ===== SUGESTÃO ===== */}
            <div
              className="ficha-suggestion"
              id="fichaSuggestion"
              style={{ display: suggestion ? 'block' : 'none' }}
            >
              <div className="suggestion-content">
                <span className="suggestion-icon">💡</span>
                <span id="suggestionText">
                  {suggestion && (
                    <>
                      Último treino: <strong>{suggestion.letter}</strong> ({suggestion.dateLabel}
                      ). Hoje sugerimos o <strong>Treino {suggestion.suggested}</strong>.
                    </>
                  )}
                </span>
              </div>
            </div>

            {/* ===== PROGRESSO ===== */}
            <div className="progress-wrapper" ref={progressRef}>
              <div className="progress-meta">
                <span className="progress-label">Progresso do treino</span>
                <span className="progress-nums">
                  <span id="progressDone">{done}</span> / <span id="progressTotal">{total}</span>{' '}
                  exercícios
                </span>
              </div>
              <div className="progress-track">
                <div className="progress-fill" id="progressFill" style={{ width: `${pct}%` }} />
              </div>
            </div>

            {/* v4.22.0 — FAB FOCO removido: o botão de foco vive no seletor
                de visualização (slot que era da "Coleção"), evitando sobrepor
                a barra "tocando agora" do treino. */}

            {/* ===== TABELA ===== */}
            <div
              ref={tableViewRef}
              className="table-scroll-wrap"
              style={{ display: showTable ? 'block' : 'none' }}
            >
              <table className="workout-table" id="workoutTable">
                <thead>
                  <tr>
                    <th className="col-n">#</th>
                    <th className="col-ex">Exercício / Aparelho</th>
                    <th className="col-img">Imagem</th>
                    <th className="col-vol">Volume</th>
                    <th className="col-chk">✓</th>
                  </tr>
                </thead>
                <tbody id="workoutTableBody">
                  {exercicios.map((ex, i) => (
                    <FichaTableRow key={ex.id} idPrefix="chk-" {...cardProps(ex, i)} />
                  ))}
                  {hasAe && <FichaCardioRow {...cardioProps} prefix="chk-" />}
                </tbody>
              </table>
              <div
                className="table-empty-state"
                id="tableEmpty"
                style={{ display: hasAnyContent ? 'none' : 'block' }}
              >
                <div className="empty-icon">🏋️</div>
                <p>Nenhum exercício nesta ficha ainda.</p>
                <p>
                  Vá em <strong>Minha Ficha</strong> para adicionar exercícios.
                </p>
              </div>
            </div>

            {/* ===== GRID ===== */}
            <div
              ref={gridViewRef}
              id="workoutGrid"
              className="workout-deck-grid"
              style={{ display: showGrid ? 'grid' : 'none' }}
            >
              {exercicios.map((ex, i) => (
                <FichaCard key={ex.id} mode="grid" {...cardProps(ex, i)} />
              ))}
              {hasAe && <FichaCardioCard {...cardioProps} />}
            </div>

            {/* v4.22.0 — view "Coleção" (deck) removida */}

            {/* ===== AÇÕES DE CONCLUSÃO ===== */}
            <div
              className="ficha-actions"
              id="fichaDoneActions"
              style={{ display: isDone ? 'block' : 'none', marginTop: 30 }}
            >
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => useShareStore.getState().openTreino()}
                style={{
                  width: '100%',
                  padding: 16,
                  fontWeight: 800,
                  letterSpacing: '1px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                }}
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  width={18}
                  height={18}
                >
                  <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
                  <polyline points="16 6 12 2 8 6" />
                  <line x1={12} y1={2} x2={12} y2={15} />
                </svg>
                ÚLTIMO TREINO
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ===== MODAL: TREINO FOCO (modais.html L410-462) ===== */}
      <FocusModal
        open={focusOpen}
        onClose={() => setFocusOpen(false)}
        onCompleted={onWorkoutCompleted}
      />
    </>
  );
};
