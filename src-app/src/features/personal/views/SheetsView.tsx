import { useMemo, useState } from 'react';
import {
  ClipboardList,
  Plus,
  Search,
  Send,
  Trash2,
} from 'lucide-react';
import { usePtStore } from '../personal-store';
import { PtAvatar, PtBadge, PtEmpty } from '../personal-ui';
import type { PtSheet } from '../personal-types';

export function SheetsView({
  onOpenStudent,
  onEditSheet,
  onCreateFor,
}: {
  onOpenStudent: (id: string) => void;
  onEditSheet: (sheet: PtSheet) => void;
  onCreateFor: (studentId: string) => void;
}) {
  const sheets = usePtStore((s) => s.sheets);
  const students = usePtStore((s) => s.students);
  const exercises = usePtStore((s) => s.exercises);
  const removeSheet = usePtStore((s) => s.removeSheet);
  const sendSheetToStudent = usePtStore((s) => s.sendSheetToStudent);
  const [query, setQuery] = useState('');
  const [studentFilter, setStudentFilter] = useState<string>('todos');
  const [newFor, setNewFor] = useState<string>('');

  const studentById = useMemo(() => new Map(students.map((s) => [s.id, s])), [students]);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return sheets
      .filter((sh) => (studentFilter === 'todos' ? true : sh.studentId === studentFilter))
      .filter((sh) => {
        if (!q) return true;
        const st = studentById.get(sh.studentId);
        return (
          sh.name.toLowerCase().includes(q) ||
          sh.focus.toLowerCase().includes(q) ||
          (st?.name.toLowerCase().includes(q) ?? false) ||
          sh.letter.toLowerCase().includes(q)
        );
      });
  }, [sheets, query, studentFilter, studentById]);

  return (
    <div className="pt-page">
      <div className="pt-toolbar">
        <label className="pt-search">
          <Search size={15} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar ficha, aluno ou foco…"
            aria-label="Buscar ficha"
          />
        </label>
        <label className="pt-field" style={{ minWidth: 200 }}>
          <select
            className="pt-select"
            value={studentFilter}
            onChange={(e) => setStudentFilter(e.target.value)}
            aria-label="Filtrar por aluno"
          >
            <option value="todos">Todos os alunos</option>
            {students
              .filter((s) => !s.archived)
              .map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
          </select>
        </label>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <select
            className="pt-select"
            value={newFor}
            onChange={(e) => setNewFor(e.target.value)}
            aria-label="Aluno para nova ficha"
            style={{ minWidth: 180 }}
          >
            <option value="">Nova ficha para…</option>
            {students
              .filter((s) => !s.archived)
              .map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
          </select>
          <button
            type="button"
            className="pt-btn pt-btn--primary"
            disabled={!newFor}
            onClick={() => {
              if (newFor) {
                onCreateFor(newFor);
                setNewFor('');
              }
            }}
          >
            <Plus size={15} /> Nova ficha
          </button>
        </div>
      </div>

      {rows.length === 0 ? (
        <section className="pt-card">
          <PtEmpty
            icon={<ClipboardList size={22} />}
            title="Nenhuma ficha encontrada"
            text="Crie a primeira ficha para um aluno usando o seletor acima."
          />
        </section>
      ) : (
        <div className="pt-sheet-grid">
          {rows.map((sheet) => {
            const student = studentById.get(sheet.studentId);
            return (
              <article className="pt-sheet-card" key={sheet.id}>
                <div className="pt-sheet-card__top">
                  <span className="pt-sheet-letter">{sheet.letter}</span>
                  <div className="pt-sheet-card__id">
                    <strong>{sheet.name}</strong>
                    <span>
                      {student?.name ?? 'Aluno removido'} · {sheet.focus} · {sheet.items.length} exercícios
                    </span>
                  </div>
                </div>
                <div className="pt-sheet-card__items">
                  {sheet.items.slice(0, 8).map((it, i) => {
                    const ex = exercises.find((e) => e.id === it.exerciseId);
                    return (
                      <span className="pt-ex-chip" key={i}>
                        {ex?.name ?? it.exerciseId}
                      </span>
                    );
                  })}
                </div>
                <div className="pt-sheet-card__foot">
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    {student && <PtAvatar name={student.name} hue={student.avatarHue} size={24} />}
                    <PtBadge tone={sheet.status === 'ativa' ? 'success' : sheet.status === 'enviada' ? 'accent' : 'neutral'}>
                      {sheet.status}
                    </PtBadge>
                  </div>
                  <div className="pt-sheet-card__actions">
                    <button type="button" className="pt-btn pt-btn--sm" onClick={() => onEditSheet(sheet)}>
                      Editar
                    </button>
                    <button
                      type="button"
                      className="pt-btn pt-btn--sm pt-btn--primary"
                      onClick={() => void sendSheetToStudent(sheet)}
                      disabled={!student?.linkedDevice}
                      title={student?.linkedDevice ? 'Enviar ao app do aluno' : 'Aluno não vinculado a este aparelho'}
                    >
                      <Send size={13} /> Enviar
                    </button>
                    <button
                      type="button"
                      className="pt-btn pt-btn--sm pt-btn--danger"
                      onClick={() => {
                        if (confirm('Excluir esta ficha?')) void removeSheet(sheet.id);
                      }}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
                {student && (
                  <button
                    type="button"
                    className="pt-back"
                    style={{ margin: 0 }}
                    onClick={() => onOpenStudent(student.id)}
                  >
                    Abrir aluno →
                  </button>
                )}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}

void PtBadge;
