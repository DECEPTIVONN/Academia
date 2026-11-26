import { useMemo, useState } from 'react';
import {
  ArrowLeft,
  CheckCircle2,
  Dumbbell,
  MessageSquare,
  NotebookPen,
  Plus,
  Send,
  Sparkles,
  Trash2,
} from 'lucide-react';
import { usePtStore } from '../personal-store';
import {
  computeMetrics,
  suggestNextSheet,
} from '../personal-engine';
import {
  PtAvatar,
  PtBadge,
  PtEmpty,
  PtRing,
  formatMoney,
  relativeDay,
  type PtTone,
} from '../personal-ui';
import type { PtSheet, PtStudent } from '../personal-types';

type Tab = 'resumo' | 'fichas' | 'historico' | 'notas' | 'mensagens';

export function StudentDetailView({
  studentId,
  onBack,
  onSuggest,
  onEditSheet,
}: {
  studentId: string;
  onBack: () => void;
  onSuggest: (student: PtStudent) => void;
  onEditSheet: (sheet: PtSheet) => void;
}) {
  const students = usePtStore((s) => s.students);
  const sheets = usePtStore((s) => s.sheets);
  const sessions = usePtStore((s) => s.sessions);
  const notes = usePtStore((s) => s.notes);
  const messages = usePtStore((s) => s.messages);
  const exercises = usePtStore((s) => s.exercises);
  const addNote = usePtStore((s) => s.addNote);
  const removeNote = usePtStore((s) => s.removeNote);
  const addMessage = usePtStore((s) => s.addMessage);
  const removeSheet = usePtStore((s) => s.removeSheet);
  const sendSheetToStudent = usePtStore((s) => s.sendSheetToStudent);
  const updateStudent = usePtStore((s) => s.updateStudent);
  const archiveStudent = usePtStore((s) => s.archiveStudent);

  const student = students.find((s) => s.id === studentId);
  const [tab, setTab] = useState<Tab>('resumo');
  const [noteText, setNoteText] = useState('');
  const [msgText, setMsgText] = useState('');

  const mineSheets = useMemo(() => sheets.filter((s) => s.studentId === studentId), [sheets, studentId]);
  const mineSessions = useMemo(() => sessions.filter((s) => s.studentId === studentId), [sessions, studentId]);
  const mineNotes = useMemo(() => notes.filter((n) => n.studentId === studentId), [notes, studentId]);
  const mineMessages = useMemo(() => messages.filter((m) => m.studentId === studentId), [messages, studentId]);
  const metrics = useMemo(() => (student ? computeMetrics(student, mineSessions) : null), [student, mineSessions]);

  const suggestion = useMemo(() => {
    if (!student || !mineSheets.length) return null;
    return suggestNextSheet(student, mineSheets, mineSessions, exercises);
  }, [student, mineSheets, mineSessions, exercises]);

  if (!student || !metrics) {
    return (
      <div className="pt-page">
        <button type="button" className="pt-back" onClick={onBack}>
          <ArrowLeft size={14} /> Voltar
        </button>
        <p style={{ color: 'var(--pt-muted)' }}>Aluno não encontrado.</p>
      </div>
    );
  }

  const statusTone: PtTone =
    student.status === 'ativo' ? 'success' : student.status === 'atencao' ? 'warn' : student.status === 'inativo' ? 'danger' : 'neutral';

  return (
    <div className="pt-page">
      <button type="button" className="pt-back" onClick={onBack}>
        <ArrowLeft size={14} /> Voltar para alunos
      </button>

      <div className="pt-detail-hero" style={{ ['--pt-avatar-hue' as string]: String(student.avatarHue) }}>
        <PtAvatar name={student.name} hue={student.avatarHue} size={62} ring />
        <div className="pt-detail-hero__id">
          <h1>{student.name}</h1>
          <div className="pt-detail-hero__sub">
            <span>{student.goal}</span>
            <span>·</span>
            <span>{student.level}</span>
            <span>·</span>
            <span>{student.plan}</span>
            {student.linkedDevice && <PtBadge tone="accent">Neste aparelho</PtBadge>}
          </div>
          <div className="pt-detail-hero__tags">
            <PtBadge tone={statusTone}>{student.status}</PtBadge>
            <PtBadge>{student.weeklyGoal}x/semana</PtBadge>
            <PtBadge tone="violet">{formatMoney(student.monthlyFee)}/mês</PtBadge>
            {student.restrictions && <PtBadge tone="danger">Restrição</PtBadge>}
          </div>
        </div>
        <div className="pt-detail-hero__actions">
          <button type="button" className="pt-btn pt-btn--primary pt-btn--sm" onClick={() => onSuggest(student)}>
            <Sparkles size={13} /> Sugerir próxima ficha
          </button>
          <button
            type="button"
            className="pt-btn pt-btn--sm"
            onClick={() => updateStudent({ ...student, status: student.status === 'ativo' ? 'pausado' : 'ativo' })}
          >
            {student.status === 'pausado' ? 'Reativar' : 'Pausar'}
          </button>
          <button
            type="button"
            className="pt-btn pt-btn--sm pt-btn--danger"
            onClick={() => {
              if (confirm(`Arquivar ${student.name}? Os dados são mantidos.`)) void archiveStudent(student.id, true);
            }}
          >
            Arquivar
          </button>
        </div>
      </div>

      <div className="pt-detail-tabs" role="tablist">
        {(['resumo', 'fichas', 'historico', 'notas', 'mensagens'] as Tab[]).map((t) => (
          <button
            key={t}
            type="button"
            role="tab"
            aria-selected={tab === t}
            className={`pt-detail-tab${tab === t ? ' pt-detail-tab--active' : ''}`}
            onClick={() => setTab(t)}
          >
            {tabLabel(t)}
          </button>
        ))}
      </div>

      {tab === 'resumo' && (
        <div className="pt-detail-grid">
          <div className="pt-col">
            <section className="pt-card">
              <div className="pt-card__head">
                <h3>Métricas (30 dias)</h3>
                <span>{metrics.sessions30} treinos</span>
              </div>
              <div className="pt-card__body">
                <div className="pt-kv">
                  <div className="pt-kv__row"><span>Aderência</span><strong>{metrics.adherence}%</strong></div>
                  <div className="pt-kv__row"><span>Treinos na semana</span><strong>{metrics.sessions7}</strong></div>
                  <div className="pt-kv__row"><span>Ofensiva (dias)</span><strong>{metrics.streak}</strong></div>
                  <div className="pt-kv__row"><span>Taxa de conclusão</span><strong>{metrics.completionRate}%</strong></div>
                  <div className="pt-kv__row"><span>Tempo total</span><strong>{metrics.totalMinutes} min</strong></div>
                  <div className="pt-kv__row"><span>Último treino</span><strong>{relativeDay(metrics.lastSession?.date ?? null)}</strong></div>
                  <div className="pt-kv__row"><span>Dias sem treinar</span><strong>{metrics.daysSinceLast ?? '—'}</strong></div>
                </div>
                <div style={{ marginTop: 16, display: 'flex', justifyContent: 'center' }}>
                  <PtRing value={metrics.adherence} size={86} stroke={7} />
                </div>
              </div>
            </section>

            {suggestion && (
              <section className="pt-suggestion">
                <div className="pt-suggestion__head">
                  <span><Sparkles size={15} /></span>
                  <strong>{suggestion.name}</strong>
                </div>
                <p>{suggestion.reason}</p>
                <div className="pt-suggestion__items">
                  {suggestion.items.slice(0, 6).map((it) => (
                    <span className="pt-ex-chip" key={it.exerciseId}>
                      <b>{it.name}</b> · {it.sets}×{it.reps}
                    </span>
                  ))}
                </div>
                <button type="button" className="pt-btn pt-btn--primary pt-btn--sm" onClick={() => onSuggest(student)}>
                  Abrir no editor <Sparkles size={13} />
                </button>
              </section>
            )}
          </div>

          <div className="pt-col">
            <section className="pt-card">
              <div className="pt-card__head"><h3>Dados do aluno</h3></div>
              <div className="pt-card__body">
                <div className="pt-kv">
                  <div className="pt-kv__row"><span>E-mail</span><strong>{student.email || '—'}</strong></div>
                  <div className="pt-kv__row"><span>Telefone</span><strong>{student.phone || '—'}</strong></div>
                  <div className="pt-kv__row"><span>Cadastro</span><strong>{student.joinedAt}</strong></div>
                  <div className="pt-kv__row"><span>Restrições</span><strong>{student.restrictions || 'Nenhuma'}</strong></div>
                  <div className="pt-kv__row"><span>Observações</span><strong>{student.bio || '—'}</strong></div>
                </div>
              </div>
            </section>

            <section className="pt-card">
              <div className="pt-card__head"><h3>Últimas sessões</h3><span>{mineSessions.length}</span></div>
              <div className="pt-card__body pt-card__body--flush">
                {mineSessions.length === 0 ? (
                  <PtEmpty icon={<Dumbbell size={22} />} title="Sem histórico" text="As sessões aparecem aqui quando o aluno treina." />
                ) : (
                  <div className="pt-list">
                    {mineSessions.slice(0, 6).map((s) => (
                      <div className="pt-list__row" key={s.id}>
                        <span className={`pt-list__dot${s.completed ? '' : ' pt-list__dot--warn'}`} />
                        <span className="pt-list__main">
                          <strong>{s.date} · Ficha {s.sheetLabel}</strong>
                          <span>{s.durationMin} min · RPE {s.rpe ?? '—'}</span>
                        </span>
                        <PtBadge tone={s.completed ? 'success' : 'neutral'}>{s.completed ? 'Concluído' : 'Agendado'}</PtBadge>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>
          </div>
        </div>
      )}

      {tab === 'fichas' && (
        <div className="pt-sheet-grid">
          {mineSheets.length === 0 ? (
            <section className="pt-card" style={{ gridColumn: '1 / -1' }}>
              <PtEmpty icon={<Dumbbell size={22} />} title="Sem fichas" text="Monte a primeira ficha para este aluno." />
            </section>
          ) : (
            mineSheets.map((sheet) => (
              <article className="pt-sheet-card" key={sheet.id}>
                <div className="pt-sheet-card__top">
                  <span className="pt-sheet-letter">{sheet.letter}</span>
                  <div className="pt-sheet-card__id">
                    <strong>{sheet.name}</strong>
                    <span>{sheet.focus} · {sheet.items.length} exercícios · {sheet.status}</span>
                  </div>
                </div>
                <div className="pt-sheet-card__items">
                  {sheet.items.slice(0, 8).map((it, i) => {
                    const ex = exercises.find((e) => e.id === it.exerciseId);
                    return <span className="pt-ex-chip" key={i}>{ex?.name ?? it.exerciseId}</span>;
                  })}
                </div>
                <div className="pt-sheet-card__foot">
                  <PtBadge tone={sheet.status === 'ativa' ? 'success' : sheet.status === 'enviada' ? 'accent' : 'neutral'}>
                    {sheet.status}
                  </PtBadge>
                  <div className="pt-sheet-card__actions">
                    <button type="button" className="pt-btn pt-btn--sm" onClick={() => onEditSheet(sheet)}>Editar</button>
                    <button type="button" className="pt-btn pt-btn--sm pt-btn--primary" onClick={() => void sendSheetToStudent(sheet)}>Enviar</button>
                    <button
                      type="button"
                      className="pt-btn pt-btn--sm pt-btn--danger"
                      onClick={() => { if (confirm('Excluir esta ficha?')) void removeSheet(sheet.id); }}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              </article>
            ))
          )}
        </div>
      )}

      {tab === 'historico' && (
        <section className="pt-card">
          <div className="pt-card__body pt-card__body--flush">
            {mineSessions.length === 0 ? (
              <PtEmpty icon={<Dumbbell size={22} />} title="Sem sessões" text="O histórico de treinos aparece aqui." />
            ) : (
              <div className="pt-list">
                {mineSessions.map((s) => (
                  <div className="pt-list__row" key={s.id}>
                    <span className={`pt-list__dot${s.completed ? '' : ' pt-list__dot--warn'}`} />
                    <span className="pt-list__main">
                      <strong>{s.date} · Ficha {s.sheetLabel}</strong>
                      <span>{s.durationMin} min · RPE {s.rpe ?? '—'} · {s.origin ?? '—'}</span>
                      {s.note && <span style={{ display: 'block', marginTop: 2 }}>{s.note}</span>}
                    </span>
                    <PtBadge tone={s.completed ? 'success' : 'neutral'}>{s.completed ? 'Concluído' : 'Agendado'}</PtBadge>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {tab === 'notas' && (
        <section className="pt-card">
          <div className="pt-card__head"><h3>Notas do personal</h3></div>
          <div className="pt-card__body">
            <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
              <input
                className="pt-input"
                style={{ flex: 1 }}
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder="Anote uma observação sobre o aluno…"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && noteText.trim()) {
                    void addNote(studentId, noteText);
                    setNoteText('');
                  }
                }}
              />
              <button
                type="button"
                className="pt-btn pt-btn--primary pt-btn--sm"
                onClick={() => {
                  if (noteText.trim()) {
                    void addNote(studentId, noteText);
                    setNoteText('');
                  }
                }}
              >
                <Plus size={13} /> Adicionar
              </button>
            </div>
            {mineNotes.length === 0 ? (
              <PtEmpty icon={<NotebookPen size={22} />} title="Sem notas" text="As anotações do personal aparecem aqui." />
            ) : (
              <div className="pt-list">
                {mineNotes.map((n) => (
                  <div className="pt-list__row" key={n.id}>
                    <span className="pt-list__main">
                      <strong>{new Date(n.createdAt).toLocaleString('pt-BR')}</strong>
                      <span>{n.body}</span>
                    </span>
                    <button type="button" className="pt-icon-btn" onClick={() => void removeNote(n.id)} aria-label="Excluir nota">
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {tab === 'mensagens' && (
        <section className="pt-card">
          <div className="pt-card__head"><h3>Mensagens</h3><span>Caixa do aluno</span></div>
          <div className="pt-card__body">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12, maxHeight: 320, overflowY: 'auto' }}>
              {mineMessages.length === 0 ? (
                <PtEmpty icon={<MessageSquare size={22} />} title="Sem mensagens" text="Envie uma mensagem que aparece na caixa do aluno (se vinculado a este aparelho)." />
              ) : (
                mineMessages.map((m) => (
                  <div
                    key={m.id}
                    style={{
                      alignSelf: m.direction === 'coach' ? 'flex-end' : 'flex-start',
                      maxWidth: '80%',
                      padding: '8px 12px',
                      borderRadius: 12,
                      background: m.direction === 'coach' ? 'var(--pt-accent-soft)' : 'rgba(255,255,255,0.06)',
                      fontSize: '0.8rem',
                    }}
                  >
                    {m.body}
                    <div style={{ fontSize: '0.62rem', color: 'var(--pt-muted)', marginTop: 4 }}>
                      {new Date(m.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                ))
              )}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                className="pt-input"
                style={{ flex: 1 }}
                value={msgText}
                onChange={(e) => setMsgText(e.target.value)}
                placeholder="Mensagem para o aluno…"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && msgText.trim()) {
                    void addMessage(studentId, msgText);
                    setMsgText('');
                  }
                }}
              />
              <button
                type="button"
                className="pt-btn pt-btn--primary pt-btn--sm"
                onClick={() => {
                  if (msgText.trim()) {
                    void addMessage(studentId, msgText);
                    setMsgText('');
                  }
                }}
              >
                <Send size={13} /> Enviar
              </button>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

function tabLabel(t: Tab): string {
  if (t === 'resumo') return 'Resumo';
  if (t === 'fichas') return 'Fichas';
  if (t === 'historico') return 'Histórico';
  if (t === 'notas') return 'Notas';
  return 'Mensagens';
}

void CheckCircle2;
