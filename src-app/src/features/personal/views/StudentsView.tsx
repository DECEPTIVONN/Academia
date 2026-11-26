/**
 * StudentsView.tsx — Carteira de alunos do personal
 *
 * Busca, filtros por status/plano e cards com aderência, último treino e
 * próxima ficha. Clicar abre o detalhe do aluno.
 */

import { useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowUpRight,
  Filter,
  Plus,
  Search,
  Users,
} from 'lucide-react';
import { usePtStore } from '../personal-store';
import { computeMetrics } from '../personal-engine';
import {
  PtAvatar,
  PtBadge,
  PtEmpty,
  PtRing,
  relativeDay,
  type PtTone,
} from '../personal-ui';
import type { PtStudent } from '../personal-types';

type StatusFilter = 'todos' | 'ativo' | 'atencao' | 'inativo';

const STATUS_TONE: Record<PtStudent['status'], PtTone> = {
  ativo: 'success',
  atencao: 'warn',
  inativo: 'danger',
  pausado: 'neutral',
};

export function StudentsView({
  onOpenStudent,
  onSuggest,
  onNewStudent,
}: {
  onOpenStudent: (id: string) => void;
  onSuggest: (student: PtStudent) => void;
  onNewStudent: () => void;
}) {
  const students = usePtStore((s) => s.students);
  const sessions = usePtStore((s) => s.sessions);
  const sheets = usePtStore((s) => s.sheets);
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<StatusFilter>('todos');
  const [sort, setSort] = useState<'nome' | 'recente' | 'aderencia'>('nome');

  const active = students.filter((s) => !s.archived);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = active
      .filter((s) => (status === 'todos' ? true : s.status === status))
      .filter(
        (s) =>
          !q ||
          s.name.toLowerCase().includes(q) ||
          (s.email ?? '').toLowerCase().includes(q) ||
          s.goal.toLowerCase().includes(q)
      )
      .map((s) => ({ student: s, metrics: computeMetrics(s, sessions) }));

    if (sort === 'recente') {
      list.sort((a, b) => (b.metrics.lastSession?.date ?? '').localeCompare(a.metrics.lastSession?.date ?? ''));
    } else if (sort === 'aderencia') {
      list.sort((a, b) => b.metrics.adherence - a.metrics.adherence);
    } else {
      list.sort((a, b) => a.student.name.localeCompare(b.student.name, 'pt-BR'));
    }
    return list;
  }, [active, query, status, sort, sessions]);

  const counts = {
    todos: active.length,
    ativo: active.filter((s) => s.status === 'ativo').length,
    atencao: active.filter((s) => s.status === 'atencao').length,
    inativo: active.filter((s) => s.status === 'inativo').length,
  };

  return (
    <div className="pt-page">
      <div className="pt-toolbar">
        <label className="pt-search">
          <Search size={15} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar aluno, e-mail ou objetivo…"
            aria-label="Buscar aluno"
          />
        </label>
        <label className="pt-field" style={{ minWidth: 170 }}>
          <select
            className="pt-select"
            value={sort}
            onChange={(e) => setSort(e.target.value as typeof sort)}
            aria-label="Ordenar alunos"
          >
            <option value="nome">Ordenar por nome</option>
            <option value="recente">Último treino</option>
            <option value="aderencia">Aderência</option>
          </select>
        </label>
        <button type="button" className="pt-btn pt-btn--primary" onClick={onNewStudent}>
          <Plus size={15} /> Novo aluno
        </button>
      </div>

      <div className="pt-chips" role="tablist" aria-label="Filtrar por status">
        {(['todos', 'ativo', 'atencao', 'inativo'] as StatusFilter[]).map((key) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={status === key}
            className={`pt-chip${status === key ? ' pt-chip--active' : ''}`}
            onClick={() => setStatus(key)}
          >
            {labelFor(key)} · {counts[key]}
          </button>
        ))}
      </div>

      {rows.length === 0 ? (
        <section className="pt-card">
          <PtEmpty
            icon={query ? <Filter size={22} /> : <Users size={22} />}
            title={query ? 'Nenhum aluno encontrado' : 'Sua carteira está vazia'}
            text={
              query
                ? 'Tente outro nome, e-mail ou objetivo — ou limpe os filtros.'
                : 'Cadastre o primeiro aluno para montar fichas, acompanhar treinos e receber avisos automáticos.'
            }
            action={
              query ? (
                <button type="button" className="pt-btn pt-btn--sm" onClick={() => setQuery('')}>
                  Limpar busca
                </button>
              ) : (
                <button type="button" className="pt-btn pt-btn--primary" onClick={onNewStudent}>
                  <Plus size={14} /> Cadastrar aluno
                </button>
              )
            }
          />
        </section>
      ) : (
        <div className="pt-students">
          {rows.map(({ student, metrics }) => {
            const mine = sheets.filter((s) => s.studentId === student.id);
            const last = mine[mine.length - 1];
            return (
              <article
                key={student.id}
                className="pt-student-card"
                style={{ ['--pt-avatar-hue' as string]: String(student.avatarHue) }}
              >
                <span className="pt-student-card__glow" aria-hidden="true" />
                <div className="pt-student-card__top">
                  <PtAvatar name={student.name} hue={student.avatarHue} size={46} />
                  <div className="pt-student-card__id">
                    <strong>{student.name}</strong>
                    <span>{student.goal} · {student.level}</span>
                  </div>
                  <PtRing
                    value={metrics.adherence}
                    size={46}
                    stroke={4}
                    tone={metrics.adherence >= 70 ? 'success' : metrics.adherence >= 40 ? 'warn' : 'danger'}
                  />
                </div>

                <div className="pt-student-card__tags">
                  <PtBadge tone={STATUS_TONE[student.status]}>{statusLabel(student.status)}</PtBadge>
                  <PtBadge>{student.plan}</PtBadge>
                  <PtBadge tone="violet">{student.weeklyGoal}x/semana</PtBadge>
                  {student.linkedDevice && <PtBadge tone="accent">Neste aparelho</PtBadge>}
                </div>

                <div className="pt-student-card__foot">
                  <span className="pt-student-card__metric">
                    <strong>{relativeDay(metrics.lastSession?.date ?? null)}</strong>
                  </span>
                  <span className="pt-student-card__metric">
                    {last ? `Ficha ${last.letter}` : 'Sem ficha'}
                  </span>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button
                      type="button"
                      className="pt-btn pt-btn--sm pt-btn--primary"
                      onClick={() => onSuggest(student)}
                      title="Gerar próxima ficha com progressão"
                    >
                      <ArrowUpRight size={13} />
                    </button>
                    <button
                      type="button"
                      className="pt-btn pt-btn--sm"
                      onClick={() => onOpenStudent(student.id)}
                    >
                      Abrir
                    </button>
                  </div>
                </div>

                {metrics.daysSinceLast !== null && metrics.daysSinceLast >= 7 && (
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center', fontSize: '0.7rem', color: '#ffb45c' }}>
                    <AlertTriangle size={13} /> {metrics.daysSinceLast} dias sem treinar
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}

function labelFor(key: StatusFilter): string {
  if (key === 'atencao') return 'Atenção';
  if (key === 'ativo') return 'Ativos';
  if (key === 'inativo') return 'Inativos';
  return 'Todos';
}

function statusLabel(status: PtStudent['status']): string {
  if (status === 'atencao') return 'Atenção';
  if (status === 'inativo') return 'Inativo';
  if (status === 'pausado') return 'Pausado';
  return 'Ativo';
}
