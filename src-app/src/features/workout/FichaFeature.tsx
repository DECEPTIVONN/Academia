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
import { useModalExit, useModalPresence } from '@/hooks/useModalPresence';
import { useWorkoutStore } from '@/store/workout-store';
import { useTodayEntryStore } from '@/store/today-entry-store';
import { idb } from '@/core/db/idb';
import type { Exercise, SheetKey } from '@/core/db/schema';
import { effectiveAerobic } from '@/core/db/schema';
import { getSuggestedLoadIfMissing } from '@/lib/suggested-load';
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
import { convertSpeedValue, getSpeedUnitLabel, isFocusModeDefault } from '@/lib/app-prefs';
import './ficha-focus.css';

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

const FichaImg: React.FC<{
  ex: Exercise;
  padded?: boolean;
  draggable?: boolean;
  /** v4.56.19 — clicar no GIF abre o Modo Foco (tabela e grid). */
  onActivate?: () => void;
}> = ({ ex, padded, draggable, onActivate }) => {
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

  /* Clicar no GIF (ou no placeholder) é o gatilho do Modo Foco, tanto na
     tabela quanto no grid. Para de propagar para não disparar o duplo clique
     do grid. */
  const inner = onActivate ? (
    <span
      className="ficha-gif-focus"
      role="button"
      tabIndex={0}
      title="Abrir Modo Foco"
      aria-label={`Abrir Modo Foco — ${ex.name}`}
      onClick={(event) => {
        event.stopPropagation();
        onActivate();
      }}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          event.stopPropagation();
          onActivate();
        }
      }}
    >
      {content}
    </span>
  ) : (
    content
  );

  return padded ? <div className="img-placeholder">{inner}</div> : <>{inner}</>;
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
  /** v4.56.19 — clique no GIF do exercício → Modo Foco. */
  onFocus: () => void;
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
  onFocus,
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
  /* v4.31.0 — exercício ainda sem carga definida: dica do peso inicial. */
  const cargaSugerida = getSuggestedLoadIfMissing(ex);

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
        <FichaImg ex={ex} padded onActivate={onFocus} />
      </td>
      <td>
        <div className="vol-text">
          {ex.sets}×{ex.reps}
          <span>REPS</span>
          {cargaHtml}
          {cargaSugerida && (
            <span className="carga-sugerida"> · Sugerido: {cargaSugerida}</span>
          )}
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
  onFocus,
  mode,
}) => {
  const prefix = mode === 'grid' ? 'chk-grid-' : 'chk-deck-';
  const cargaHtml =
    mode === 'grid' && (ex.load || ex.tags.includes('Peso do Corpo'))
      ? ` | Carga: ${formatCarga(ex)}`
      : '';
  /* v4.31.0 — sem carga definida: dica do peso inicial sugerido (só no grid,
     que é onde a carga aparece). */
  const cargaSugerida = mode === 'grid' ? getSuggestedLoadIfMissing(ex) : null;

  return (
    <div
      className={`deck-card stagger-item card-${ex.muscleGroup} ${checked ? 'row-done' : ''}`}
      data-id={ex.id}
      draggable={mode === 'deck' ? false : undefined}
      style={{ '--item-index': index } as React.CSSProperties}
    >
      <div className="deck-card-header">{ex.muscleGroup}</div>
      <div className="deck-card-img">
        <FichaImg ex={ex} draggable={false} onActivate={onFocus} />
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
        {cargaSugerida && (
          <div className="carga-sugerida deck-card-sugerida">
            Sugerido: {cargaSugerida}
          </div>
        )}
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
    <div className="ex-card-body">
      <div className="ae-card-head">
        <span className="ae-card-label">CARDIO</span>
        <span className="ae-card-type">{tipo}</span>
      </div>
      <div className="ae-card-stats">
        <div className="ae-stat-box">
          <span className="ae-stat-val">{convertSpeedValue(vel)}</span>
          <span className="ae-stat-unit">{getSpeedUnitLabel().toUpperCase()}</span>
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

/* v4.56.18 — no modo TABELA o cardio usa o MESMO componente do modo GRID
   (`FichaCardioCard`), em uma linha que ocupa todas as colunas. Assim rótulo,
   tipo, velocidade/tempo, checkbox e "CONCLUIR CARDIO" ficam idênticos aos do
   card do grid — antes a tabela tinha uma linha própria com outra hierarquia
   (Vel:/Tempo:, engrenagem e checkbox sem texto). */
const FichaCardioRow: React.FC<CardioProps> = (props) => (
  <tr className="row-aerobico-card">
    <td colSpan={5}>
      <FichaCardioCard {...props} />
    </td>
  </tr>
);

/* ── Feature ── */

/* v4.34.0 — o ícone de "Dias Seguidos" do hero é a MESMA chama (ofensiva) da
   aba Início: o Material Symbol `local_fire_department`, usado pelo botão
   #dashBtnOfensiva. O FIRE_SVG (chama desenhada em traço, laranja) saiu — era
   um desenho diferente do da aba Início e só aparecia com a sequência > 0. */

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
  const { exercises, sheets, history, legacy, loading } = useLocalData();
  const { isActive, startTime, startRestTimer, skipRestTimer } = useWorkoutStore();
  /* v4.56.14 — o cronômetro entra e sai do DOM com animação: `useModalPresence`
     mantém o bloco montado durante o fade-out (classe `.is-closing`). */
  const timerPresence = useModalPresence(isActive, 240);
  const entry = useTodayEntryStore((s) => s.entry);
  const entryLoaded = useTodayEntryStore((s) => s.loaded);
  const loadEntry = useTodayEntryStore((s) => s.load);

  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    const stored = localStorage.getItem('academia_view_mode');
    /* v4.22.0 — 'deck' (Coleção) foi removido → migra para 'grid' */
    return stored === 'table' || stored === 'grid' ? stored : 'grid';
  });
  const [now, setNow] = useState(() => Date.now());
  const [focusOpen, setFocusOpen] = useState(false);
  const [noteEx, setNoteEx] = useState<Exercise | null>(null);
  const [noteText, setNoteText] = useState('');
  const { closing: noteClosing, requestClose: requestNoteClose } = useModalExit(() => setNoteEx(null));

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
  /* v4.31.0 — cardio padrão de todo treino (10 min de esteira a 3 km/h): a
     linha de cardio aparece sempre que a ficha tem exercícios, com os valores
     configurados ou o padrão (`effectiveAerobic`). */
  const hasAe =
    (exercicios.length > 0 || Boolean(sheet?.aerobic?.tipo)) &&
    sheet?.aerobic?.tipo !== 'Nenhum';
  /* v4.56.2 — só o cardio CONFIGURADO conta para a conclusão (legado
     `hasAe = ae && ae.tipo`). O card de cardio padrão (10 min de esteira)
     continua visível, mas é opcional: marcar todos os exercícios conclui o
     treino sem exigir esse check extra. */
  const requiresAe = Boolean(sheet?.aerobic?.tipo) && sheet?.aerobic?.tipo !== 'Nenhum';
  const ae = effectiveAerobic(sheet?.aerobic);
  const aeId = `ae-${treino}`;

  /* Container visível (secao-ficha.js L48-50: table-scroll-wrap / grid) */
  const activeViewRef = (): HTMLElement | null => {
    if (viewMode === 'table') return tableViewRef.current;
    return gridViewRef.current;
  };

  const checks = entry.checks ?? [];
  const done =
    checks.filter((c) => fichaIds.includes(c)).length +
    (requiresAe && checks.includes(aeId) ? 1 : 0);
  const total = exercicios.length + (requiresAe ? 1 : 0);
  const pct = total ? Math.round((done / total) * 100) : 0;
  const isDone = (total > 0 && done === total) || entry.completed === true;
  const streak = getStreak(history);

  /* v4.56.2 — Transição para concluído → showConclusao (secao-ficha.js
     L312/L368: `setTimeout(() => showConclusao(db), 400)`).

     O ref guarda o estado da PRIMEIRA carga (para não abrir a conclusão ao
     reabrir uma ficha já concluída). Antes o efeito saía cedo quando
     `entry.completed` já vinha true — e como `applyFichaCompletion` grava
     `completed` no MESMO update do último check, a transição era engolida e
     o usuário ficava preso na interface de treino. Agora a comparação é com o
     valor anterior do próprio `isDone`.

     No Modo Foco o foco é quem conclui (focusCheck, delay de 1.5s), então o
     callback de 400ms é suprimido enquanto o modal está aberto. */
  const doneBaselineRef = useRef<boolean | null>(null);
  const completedCbRef = useRef(onWorkoutCompleted);
  completedCbRef.current = onWorkoutCompleted;
  useEffect(() => {
    if (!entryLoaded || loading) return undefined;
    if (doneBaselineRef.current === null) {
      doneBaselineRef.current = isDone;
      return undefined;
    }
    if (isDone && !doneBaselineRef.current) {
      doneBaselineRef.current = true;
      if (focusOpen) return undefined;
      const timer = window.setTimeout(() => completedCbRef.current(), 400);
      return () => window.clearTimeout(timer);
    }
    doneBaselineRef.current = isDone;
    return undefined;
    // eslint-disable-next-line react-hooks/exhaustive-deps -- dispara só na transição
  }, [isDone, entryLoaded, loading, focusOpen]);

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
     acima (sugestão/timer) assenta depois do start; corrige só se errou > 4px.
     v4.38.13 — as deps passam a ser [open, loading] (antes [open, suggestion]):
     marcar/desmarcar um exercício regrava a entrada do dia → 'academia:db-ready'
     → useLocalData recarrega → o useMemo `suggestion` muda de identidade e o
     efeito reexecutava, puxando o scroll de volta ao topo dos exercícios a cada
     item marcado. `loading` só muda na primeira carga, então o autoscroll roda
     na abertura e, no máximo, quando os dados chegam — nunca a cada check. */
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
      scroller.scrollTo({ top: Math.max(0, scroller.scrollTop + delta), behavior: 'smooth' });
    };
    const timers = [120, 500, 900, 1500].map((ms) => window.setTimeout(goto, ms));
    return () => timers.forEach((t) => window.clearTimeout(t));
  }, [open, loading]);

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
    entry: applyFichaCompletion(mut.entry, treino, fichaIds, requiresAe),
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

  /* v4.56.18 — duplo clique em QUALQUER área do grid abre o Modo Foco (não
     só no miolo do cartão). Ignora os controles que mudam estado (check, nota,
     campos) para não abrir o foco sem querer; os botões de série continuam
     válidos desde que os DOIS cliques caiam no mesmo alvo — assim marcar
     séries em sequência rapidamente não abre o foco. */
  const gridClickTargetRef = useRef<{ target: EventTarget | null; time: number }>({
    target: null,
    time: 0,
  });
  const onGridClick = (event: React.MouseEvent<HTMLDivElement>) => {
    const now = Date.now();
    const prev = gridClickTargetRef.current;
    gridClickTargetRef.current = {
      /* 600ms acompanha a janela do dblclick nativo: se o primeiro clique
         ficou mais tempo que isso, este é um clique novo. */
      target: now - prev.time > 600 ? event.target : prev.target,
      time: now,
    };
  };
  const onGridDoubleClick = (event: React.MouseEvent<HTMLDivElement>) => {
    const target = event.target as HTMLElement | null;
    if (!target) return;
    if (target.closest('input, label, textarea, select, a, .btn-note-toggle-deck')) return;
    const first = gridClickTargetRef.current.target;
    gridClickTargetRef.current = { target: null, time: 0 };
    if (first && first !== event.target) return;
    onStartFocus();
  };

  /* v4.44.0 — pref "Modo Foco por padrão": ao iniciar um treino, abre o foco. */
  const focusDefaultApplied = useRef(false);
  useEffect(() => {
    if (!isActive) {
      focusDefaultApplied.current = false;
      return;
    }
    if (focusDefaultApplied.current) return;
    focusDefaultApplied.current = true;
    if (!isFocusModeDefault() || fichaIds.length === 0) return;
    if (!sessionStorage.getItem('focusStartTime')) {
      sessionStorage.setItem('focusStartTime', String(Date.now()));
    }
    // eslint-disable-next-line react/set-state-in-effect -- preferência abre o foco junto com o treino
    setFocusOpen(true);
  }, [isActive, fichaIds.length]);

  const onEditNote = (ex: Exercise) => {
    setNoteEx(ex);
    setNoteText(ex.notes ?? '');
  };

  const saveNote = async () => {
    if (!noteEx) return;
    await idb.exercises.put({ ...noteEx, notes: noteText.trim() || undefined });
    document.dispatchEvent(new Event('academia:db-ready'));
    requestNoteClose();
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
    onFocus: onStartFocus,
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
          {/* v4.34.0 — "ACADEMIA" virou "EVO FIT" (mesmo nome da marca usado
              no lock screen e no Fit ID). */}
          <div className="treino-badge-label">EVO FIT</div>
          <h1 className="treino-hero-title">
            Fichas de <span className="gradient-text">Treino</span>
          </h1>
          <p className="treino-hero-sub">
            Treine com foco. Marque seus exercícios. Evolua todo dia.
          </p>
          <div className="treino-hero-stats">
            <div className="h-stat">
              {/* v4.34.0 — antes exibia `exercises.length` (o TOTAL do banco:
                  66) e não a ficha aberta. Agora usa `total`, a mesma conta do
                  botão seletor do Início: exercícios da ficha + a linha de
                  cardio (quando existe). */}
              <div className="h-stat-val" id="statTotalEx">
                {total}
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
              {/* v4.34.0 — a chama agora é a MESMA da aba Início (Material
                  Symbol da ofensiva) e aparece SEMPRE, ficando cinza quando a
                  sequência está zerada (mesmo estado do #dashBtnOfensiva). */}
              <div className="h-stat-val" id="statStreak">
                {streak}
                <span
                  className={`material-symbols-outlined h-stat-fire${streak === 0 ? ' h-stat-fire--off' : ''}`}
                  aria-hidden="true"
                >
                  local_fire_department
                </span>
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
                  {/* v4.56.14 — o botão FOCO saiu do seletor de visualização:
                      o Modo Foco agora abre com DOIS CLIQUES no grid. */}
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
              className={`global-timer${timerPresence.closing ? ' is-closing' : ''}`}
              id="globalWorkoutTimer"
              style={{ display: timerPresence.mounted ? 'flex' : 'none' }}
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
                    <th className="col-n">N°</th>
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
            {/* v4.56.14 — duplo clique no grid abre o Modo Foco (o antigo botão
                de foco saiu). Duplo clique em controles (check, séries, nota)
                fica com eles — a ativação exige tocar no cartão. */}
            <div
              ref={gridViewRef}
              id="workoutGrid"
              className="workout-deck-grid"
              style={{ display: showGrid ? 'grid' : 'none' }}
              onClickCapture={onGridClick}
              onDoubleClick={onGridDoubleClick}
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

      {noteEx && (
        <div className={`modal-overlay${noteClosing ? ' is-closing' : ''}`} style={{ display: 'flex' }}>
          <div className="modal-form" style={{ maxWidth: 420 }}>
            <div className="modal-form-header" style={{ marginBottom: 16 }}>
              <h3>Anotações: {noteEx.name}</h3>
              <button type="button" className="modal-close-btn" onClick={() => requestNoteClose()} aria-label="Fechar">
                ✕
              </button>
            </div>
            <textarea
              className="quick-note-input"
              style={{ width: '100%', minHeight: 120 }}
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder="Digite suas anotações..."
            />
            <div className="modal-form-actions" style={{ marginTop: 12, display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button type="button" className="btn" onClick={() => requestNoteClose()}>
                Cancelar
              </button>
              <button type="button" className="btn btn-primary" onClick={() => void saveNote()}>
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
