import { useMemo, useState } from 'react';
import {
  CalendarDays,
  Plus,
  Trash2,
} from 'lucide-react';
import { usePtStore } from '../personal-store';
import { PtAvatar, PtBadge, PtEmpty, PtModal } from '../personal-ui';
import { isoToday } from '../personal-db';
import type { PtSession } from '../personal-types';

const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

function weekDates(anchor: string): string[] {
  const d = new Date(`${anchor}T12:00:00`);
  const day = d.getDay();
  const start = new Date(d);
  start.setDate(d.getDate() - day);
  return Array.from({ length: 7 }, (_, i) => {
    const x = new Date(start);
    x.setDate(start.getDate() + i);
    return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`;
  });
}

export function AgendaView() {
  const students = usePtStore((s) => s.students);
  const sheets = usePtStore((s) => s.sheets);
  const sessions = usePtStore((s) => s.sessions);
  const addSession = usePtStore((s) => s.addSession);
  const removeSession = usePtStore((s) => s.removeSession);

  const [anchor, setAnchor] = useState(isoToday());
  const [addOpen, setAddOpen] = useState(false);
  const [studentId, setStudentId] = useState('');
  const [sheetId, setSheetId] = useState('');
  const [date, setDate] = useState(isoToday());
  const [duration, setDuration] = useState(50);
  const [completed, setCompleted] = useState(false);
  const [rpe, setRpe] = useState(7);
  const [note, setNote] = useState('');

  const dates = useMemo(() => weekDates(anchor), [anchor]);
  const byDate = useMemo(() => {
    const map = new Map<string, PtSession[]>();
    for (const d of dates) map.set(d, []);
    for (const s of sessions) {
      if (map.has(s.date)) map.get(s.date)!.push(s);
    }
    return map;
  }, [sessions, dates]);

  const studentById = useMemo(() => new Map(students.map((s) => [s.id, s])), [students]);
  const studentSheets = useMemo(() => sheets.filter((sh) => sh.studentId === studentId), [sheets, studentId]);

  const submit = async () => {
    const student = studentById.get(studentId);
    if (!student) return;
    const sheet = sheets.find((sh) => sh.id === sheetId);
    await addSession({
      studentId,
      date,
      sheetId: sheet?.id,
      sheetLabel: sheet?.letter ?? 'A',
      durationMin: duration,
      completed,
      rpe,
      note: note.trim() || undefined,
      origin: 'personal',
    });
    setAddOpen(false);
    setNote('');
  };

  const prevWeek = () => {
    const d = new Date(`${anchor}T12:00:00`);
    d.setDate(d.getDate() - 7);
    setAnchor(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`);
  };
  const nextWeek = () => {
    const d = new Date(`${anchor}T12:00:00`);
    d.setDate(d.getDate() + 7);
    setAnchor(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`);
  };

  return (
    <div className="pt-page">
      <div className="pt-toolbar">
        <button type="button" className="pt-btn pt-btn--sm" onClick={prevWeek}>← Semana anterior</button>
        <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>
          {dates[0].slice(8, 10)}/{dates[0].slice(5, 7)} — {dates[6].slice(8, 10)}/{dates[6].slice(5, 7)}
        </span>
        <button type="button" className="pt-btn pt-btn--sm" onClick={nextWeek}>Próxima semana →</button>
        <button type="button" className="pt-btn pt-btn--primary" onClick={() => { setDate(isoToday()); setAddOpen(true); }}>
          <Plus size={15} /> Agendar treino
        </button>
      </div>

      <div className="pt-week">
        {dates.map((d) => {
          const isToday = d === isoToday();
          const list = byDate.get(d) ?? [];
          const wd = new Date(`${d}T12:00:00`).getDay();
          return (
            <div key={d} className={`pt-day${isToday ? ' pt-day--today' : ''}`}>
              <div className="pt-day__head">
                <strong>{WEEKDAYS[wd]}</strong>
                <span>{d.slice(8, 10)}/{d.slice(5, 7)}</span>
              </div>
              {list.length === 0 ? (
                <PtEmpty title="" text="Sem sessões" />
              ) : (
                list.map((s) => {
                  const st = studentById.get(s.studentId);
                  return (
                    <button
                      key={s.id}
                      type="button"
                      className={`pt-session${s.completed ? ' pt-session--done' : ''}`}
                      onClick={() => {
                        if (confirm('Remover esta sessão?')) void removeSession(s.id);
                      }}
                      title="Clique para remover"
                    >
                      <strong>{st?.name.split(' ')[0] ?? 'Aluno'}</strong>
                      <span>Ficha {s.sheetLabel} · {s.durationMin} min</span>
                      {s.completed && <PtBadge tone="success">Concluído</PtBadge>}
                    </button>
                  );
                })
              )}
              <button type="button" className="pt-day__add" onClick={() => { setDate(d); setAddOpen(true); }}>
                + Agendar
              </button>
            </div>
          );
        })}
      </div>

      <PtModal open={addOpen} onClose={() => setAddOpen(false)} title="Agendar treino" sub="Marque uma sessão para um aluno." size="md">
        <div className="pt-form-grid">
          <label className="pt-field">
            <span>Aluno</span>
            <select className="pt-select" value={studentId} onChange={(e) => { setStudentId(e.target.value); setSheetId(''); }}>
              <option value="">Selecione…</option>
              {students.filter((s) => !s.archived).map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </label>
          <label className="pt-field">
            <span>Ficha</span>
            <select className="pt-select" value={sheetId} onChange={(e) => setSheetId(e.target.value)}>
              <option value="">Sem ficha</option>
              {studentSheets.map((sh) => (
                <option key={sh.id} value={sh.id}>{sh.letter} · {sh.name}</option>
              ))}
            </select>
          </label>
          <label className="pt-field">
            <span>Data</span>
            <input className="pt-input" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </label>
          <label className="pt-field">
            <span>Duração (min)</span>
            <input className="pt-input" type="number" value={duration} onChange={(e) => setDuration(Number(e.target.value))} />
          </label>
          <label className="pt-field">
            <span>RPE</span>
            <input className="pt-input" type="number" min={1} max={10} value={rpe} onChange={(e) => setRpe(Number(e.target.value))} />
          </label>
          <label className="pt-field" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input type="checkbox" checked={completed} onChange={(e) => setCompleted(e.target.checked)} />
            <span>Concluído</span>
          </label>
          <label className="pt-field pt-form-grid--full">
            <span>Observação</span>
            <textarea className="pt-textarea" value={note} onChange={(e) => setNote(e.target.value)} />
          </label>
        </div>
        <div className="pt-modal__foot">
          <button type="button" className="pt-btn" onClick={() => setAddOpen(false)}>Cancelar</button>
          <button type="button" className="pt-btn pt-btn--primary" onClick={() => void submit()} disabled={!studentId}>
            Agendar
          </button>
        </div>
      </PtModal>
    </div>
  );
}

void CalendarDays;
void Trash2;
void PtAvatar;
