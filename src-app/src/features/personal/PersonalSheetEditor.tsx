import { useMemo, useState } from 'react';
import {
  Check,
  ChevronDown,
  Plus,
  Save,
  Send,
  Trash2,
  X,
} from 'lucide-react';
import { usePtStore } from './personal-store';
import { PtEmpty } from './personal-ui';
import type { PtSheet, PtSheetItem, PtNextSheet, PtNextSheetItem } from './personal-types';

const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];

interface Props {
  studentId: string;
  initialSheet?: PtSheet;
  suggested?: PtNextSheet;
  onClose: () => void;
}

export function PersonalSheetEditor({ studentId, initialSheet, suggested, onClose }: Props) {
  const students = usePtStore((s) => s.students);
  const exercises = usePtStore((s) => s.exercises);
  const createSheet = usePtStore((s) => s.createSheet);
  const saveSheetRecord = usePtStore((s) => s.saveSheetRecord);
  const sendSheetToStudent = usePtStore((s) => s.sendSheetToStudent);

  const student = students.find((s) => s.id === studentId);

  const seedItems: PtSheetItem[] = useMemo(() => {
    if (initialSheet) return initialSheet.items.map((i) => ({ ...i }));
    if (suggested) {
      return suggested.items.map((i: PtNextSheetItem) => ({
        exerciseId: i.exerciseId,
        sets: i.sets,
        reps: i.reps,
        load: i.load,
        rest: i.rest,
        note: i.note,
      }));
    }
    return [];
  }, [initialSheet, suggested]);

  const [letter, setLetter] = useState(initialSheet?.letter ?? suggested?.letter ?? 'A');
  const [name, setName] = useState(initialSheet?.name ?? suggested?.name ?? '');
  const [focus, setFocus] = useState(initialSheet?.focus ?? suggested?.focus ?? '');
  const [notes, setNotes] = useState(initialSheet?.notes ?? '');
  const [items, setItems] = useState<PtSheetItem[]>(seedItems);
  const [query, setQuery] = useState('');
  const [groupFilter, setGroupFilter] = useState('Todos');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const groups = useMemo(() => ['Todos', ...Array.from(new Set(exercises.map((e) => e.muscleGroup)))], [exercises]);

  const filteredExercises = useMemo(() => {
    const q = query.trim().toLowerCase();
    return exercises.filter((ex) => {
      if (groupFilter !== 'Todos' && ex.muscleGroup !== groupFilter) return false;
      if (!q) return true;
      return ex.name.toLowerCase().includes(q) || ex.muscleGroup.toLowerCase().includes(q);
    });
  }, [exercises, query, groupFilter]);

  const pickedIds = useMemo(() => new Set(items.map((i) => i.exerciseId)), [items]);

  const addExercise = (exerciseId: string) => {
    if (pickedIds.has(exerciseId)) return;
    const ex = exercises.find((e) => e.id === exerciseId);
    setItems((prev) => [
      ...prev,
      {
        exerciseId,
        sets: 3,
        reps: '10',
        load: '',
        rest: 45,
        note: '',
      },
    ]);
    void ex;
  };

  const removeItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, patch: Partial<PtSheetItem>) => {
    setItems((prev) => prev.map((it, i) => (i === index ? { ...it, ...patch } : it)));
  };

  const moveItem = (index: number, dir: -1 | 1) => {
    setItems((prev) => {
      const next = [...prev];
      const target = index + dir;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  };

  const totalVolume = useMemo(() => {
    return items.reduce((acc, it) => {
      const load = parseFloat(String(it.load).replace(',', '.')) || 0;
      const reps = parseInt(it.reps, 10) || 10;
      return acc + load * reps * (it.sets || 0);
    }, 0);
  }, [items]);

  const saveDraft = async () => {
    setError(null);
    if (!name.trim()) {
      setError('Informe o nome da ficha.');
      return;
    }
    if (items.length === 0) {
      setError('Adicione pelo menos um exercício.');
      return;
    }
    setSaving(true);
    try {
      if (initialSheet) {
        await saveSheetRecord({
          ...initialSheet,
          letter,
          name: name.trim(),
          focus: focus.trim() || 'Corpo inteiro',
          items,
          notes: notes.trim(),
        });
      } else {
        await createSheet(studentId, {
          letter,
          name: name.trim(),
          focus: focus.trim() || 'Corpo inteiro',
          items,
          notes: notes.trim(),
          fromSuggestion: Boolean(suggested),
        });
      }
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao salvar.');
    } finally {
      setSaving(false);
    }
  };

  const send = async () => {
    setError(null);
    if (!name.trim() || items.length === 0) {
      setError('Preencha nome e ao menos um exercício antes de enviar.');
      return;
    }
    setSaving(true);
    try {
      let sheet: PtSheet;
      if (initialSheet) {
        const updated: PtSheet = {
          ...initialSheet,
          letter,
          name: name.trim(),
          focus: focus.trim() || 'Corpo inteiro',
          items,
          notes: notes.trim(),
          updatedAt: new Date().toISOString(),
        };
        await saveSheetRecord(updated);
        sheet = updated;
      } else {
        sheet = await createSheet(studentId, {
          letter,
          name: name.trim(),
          focus: focus.trim() || 'Corpo inteiro',
          items,
          notes: notes.trim(),
          fromSuggestion: Boolean(suggested),
        });
      }
      await sendSheetToStudent(sheet);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao enviar.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="pt-editor">
      <div className="pt-editor__top">
        <div className="pt-editor__title">
          <h2>{initialSheet ? `Editando ficha ${initialSheet.letter}` : suggested ? 'Nova ficha (sugestão)' : 'Nova ficha'}</h2>
          <span>
            {student?.name ?? 'Aluno'} · {items.length} exercício{items.length === 1 ? '' : 's'} · volume ≈ {totalVolume.toLocaleString('pt-BR')} kg
          </span>
        </div>
        <div className="pt-editor__fields">
          <label className="pt-field">
            <span>Letra</span>
            <select className="pt-select" value={letter} onChange={(e) => setLetter(e.target.value)}>
              {LETTERS.map((l) => (
                <option key={l} value={l}>{l}</option>
              ))}
            </select>
          </label>
          <label className="pt-field">
            <span>Nome da ficha</span>
            <input className="pt-input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ficha A · Empurrar" />
          </label>
          <label className="pt-field">
            <span>Foco</span>
            <input className="pt-input" value={focus} onChange={(e) => setFocus(e.target.value)} placeholder="Peito e Ombros" />
          </label>
        </div>
        <div className="pt-editor__actions">
          <button type="button" className="pt-btn pt-btn--ghost" onClick={onClose}>
            <X size={14} /> Cancelar
          </button>
          <button type="button" className="pt-btn" onClick={() => void saveDraft()} disabled={saving}>
            <Save size={14} /> Rascunho
          </button>
          <button type="button" className="pt-btn pt-btn--primary" onClick={() => void send()} disabled={saving}>
            <Send size={14} /> Enviar ao aluno
          </button>
        </div>
      </div>

      <div className="pt-editor__body">
        <div className="pt-editor__col">
          <section className="pt-card" style={{ flex: 1 }}>
            <div className="pt-card__head">
              <h3>Exercícios da ficha</h3>
              <span>{items.length}</span>
            </div>
            <div className="pt-card__body pt-card__body--flush" style={{ maxHeight: 'none' }}>
              {items.length === 0 ? (
                <PtEmpty icon={<Plus size={22} />} title="Ficha vazia" text="Adicione exercícios pelo painel ao lado." />
              ) : (
                <div className="pt-picked">
                  {items.map((it, index) => {
                    const ex = exercises.find((e) => e.id === it.exerciseId);
                    return (
                      <div className="pt-picked__row" key={`${it.exerciseId}-${index}`}>
                        <span className="pt-picked__drag" aria-hidden="true">
                          <ChevronDown size={14} />
                        </span>
                        <div className="pt-picked__id">
                          <strong>{ex?.name ?? it.exerciseId}</strong>
                          <span>{ex?.muscleGroup ?? '—'}</span>
                        </div>
                        <div className="pt-picked__nums">
                          <label className="pt-num">
                            <span>Séries</span>
                            <input
                              type="number"
                              min={1}
                              max={8}
                              value={it.sets}
                              onChange={(e) => updateItem(index, { sets: Number(e.target.value) })}
                            />
                          </label>
                          <label className="pt-num">
                            <span>Reps</span>
                            <input
                              value={it.reps}
                              onChange={(e) => updateItem(index, { reps: e.target.value })}
                            />
                          </label>
                          <label className="pt-num">
                            <span>Carga</span>
                            <input
                              value={it.load}
                              onChange={(e) => updateItem(index, { load: e.target.value })}
                              placeholder="kg"
                            />
                          </label>
                          <label className="pt-num">
                            <span>Desc.</span>
                            <input
                              type="number"
                              value={it.rest}
                              onChange={(e) => updateItem(index, { rest: Number(e.target.value) })}
                            />
                          </label>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                          <button type="button" className="pt-icon-btn" onClick={() => moveItem(index, -1)} aria-label="Subir">
                            ↑
                          </button>
                          <button type="button" className="pt-icon-btn" onClick={() => moveItem(index, 1)} aria-label="Descer">
                            ↓
                          </button>
                        </div>
                        <button type="button" className="pt-icon-btn" onClick={() => removeItem(index)} aria-label="Remover">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </section>

          <label className="pt-field">
            <span>Observações da ficha</span>
            <textarea className="pt-textarea" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Progressão, cadência, cuidados…" />
          </label>

          {error && <p style={{ color: 'var(--pt-danger)', fontSize: '0.8rem' }}>{error}</p>}
        </div>

        <div className="pt-editor__col">
          <section className="pt-card" style={{ flex: 1 }}>
            <div className="pt-card__head">
              <h3>Biblioteca de exercícios</h3>
              <span>{filteredExercises.length}</span>
            </div>
            <div className="pt-card__body">
              <div className="pt-picker">
                <input
                  className="pt-input"
                  style={{ flex: 1, minWidth: 160 }}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Buscar exercício…"
                />
                <select className="pt-select" value={groupFilter} onChange={(e) => setGroupFilter(e.target.value)}>
                  {groups.map((g) => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
              </div>
              <div className="pt-picker__list">
                {filteredExercises.map((ex) => {
                  const added = pickedIds.has(ex.id);
                  return (
                    <button
                      key={ex.id}
                      type="button"
                      className={`pt-picker__row${added ? ' is-added' : ''}`}
                      onClick={() => addExercise(ex.id)}
                      disabled={added}
                    >
                      <div className="pt-picker__row-main">
                        <strong>{ex.name}</strong>
                        <span>{ex.muscleGroup} · {ex.sets}×{ex.reps}</span>
                      </div>
                      {added ? <Check size={14} color="var(--pt-accent)" /> : <Plus size={14} />}
                    </button>
                  );
                })}
              </div>
            </div>
          </section>
        </div>
      </div>

      <div className="pt-editor__foot">
        <span className="pt-editor__foot-meta">
          {items.length} exercício{items.length === 1 ? '' : 's'} · volume ≈ {totalVolume.toLocaleString('pt-BR')} kg
        </span>
        <div style={{ display: 'flex', gap: 8 }}>
          <button type="button" className="pt-btn pt-btn--ghost" onClick={onClose}>
            Cancelar
          </button>
          <button type="button" className="pt-btn" onClick={() => void saveDraft()} disabled={saving}>
            <Save size={14} /> Rascunho
          </button>
          <button type="button" className="pt-btn pt-btn--primary" onClick={() => void send()} disabled={saving}>
            <Send size={14} /> Enviar ao aluno
          </button>
        </div>
      </div>
    </div>
  );
}

void PtEmpty;
