/**
 * AlertsView.tsx — Central de avisos do personal
 *
 * Reúne os avisos automáticos (aluno terminando/concluindo ficha, inatividade,
 * sugestão de próxima ficha, renovação) e permite agir direto: abrir o aluno,
 * montar a próxima ficha ou marcar como lido.
 */

import { useMemo, useState } from 'react';
import {
  BellRing,
  CheckCheck,
  CheckCircle2,
  ChevronRight,
  CircleDollarSign,
  Sparkles,
  Timer,
  UserMinus,
} from 'lucide-react';
import { usePtStore } from '../personal-store';
import { PtBadge, PtEmpty, relativeDay } from '../personal-ui';
import type { PtAlert, PtStudent } from '../personal-types';

type Filter = 'todos' | 'finishing' | 'suggestion' | 'inactive' | 'payment';

const ICONS: Record<PtAlert['type'], React.ReactNode> = {
  finishing: <Timer size={18} />,
  completed: <CheckCircle2 size={18} />,
  inactive: <UserMinus size={18} />,
  suggestion: <Sparkles size={18} />,
  payment: <CircleDollarSign size={18} />,
  note: <BellRing size={18} />,
};

const TONE: Record<PtAlert['type'], string> = {
  finishing: 'warn',
  completed: 'success',
  inactive: 'danger',
  suggestion: '',
  payment: 'violet',
  note: '',
};

export function AlertsView({
  onOpenStudent,
  onSuggest,
}: {
  onOpenStudent: (id: string) => void;
  onSuggest: (student: PtStudent) => void;
}) {
  const alerts = usePtStore((s) => s.alerts);
  const students = usePtStore((s) => s.students);
  const readAlert = usePtStore((s) => s.readAlert);
  const readAll = usePtStore((s) => s.readAllAlerts);
  const refresh = usePtStore((s) => s.refreshDerivedAlerts);
  const [filter, setFilter] = useState<Filter>('todos');

  const unread = alerts.filter((a) => !a.read).length;

  const rows = useMemo(
    () => alerts.filter((a) => (filter === 'todos' ? true : a.type === filter)),
    [alerts, filter]
  );

  const counts = (key: Filter) =>
    key === 'todos' ? alerts.length : alerts.filter((a) => a.type === key).length;

  return (
    <div className="pt-page">
      <div className="pt-section-title">
        <div>
          <h2>Central de avisos</h2>
          <p>{unread} não lido{unread === 1 ? '' : 's'} · atualizado em tempo real</p>
        </div>
        <div className="pt-section-title__action">
          <button
            type="button"
            className="pt-btn pt-btn--sm"
            onClick={() => void refresh()}
            title="Recalcular avisos a partir dos dados dos alunos"
          >
            Recalcular
          </button>
          <button
            type="button"
            className="pt-btn pt-btn--sm"
            onClick={() => void readAll()}
            disabled={unread === 0}
          >
            <CheckCheck size={14} /> Marcar tudo como lido
          </button>
        </div>
      </div>

      <div className="pt-chips" role="tablist" aria-label="Filtrar avisos">
        {(['todos', 'finishing', 'suggestion', 'inactive', 'payment'] as Filter[]).map((key) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={filter === key}
            className={`pt-chip${filter === key ? ' pt-chip--active' : ''}`}
            onClick={() => setFilter(key)}
          >
            {filterLabel(key)} · {counts(key)}
          </button>
        ))}
      </div>

      {rows.length === 0 ? (
        <section className="pt-card">
          <PtEmpty
            icon={<BellRing size={22} />}
            title="Nenhum aviso por aqui"
            text="Os avisos surgem quando um aluno está terminando a ficha, passa dias sem treinar, precisa renovar ou já tem uma próxima ficha sugerida."
          />
        </section>
      ) : (
        <div className="pt-alert-list">
          {rows.map((alert) => {
            const student = students.find((s) => s.id === alert.studentId);
            const tone = TONE[alert.type];
            return (
              <article
                key={alert.id}
                className={`pt-alert${alert.read ? '' : ' pt-alert--unread'}`}
              >
                <span className={`pt-alert__icon${tone ? ` pt-alert__icon--${tone}` : ''}`}>
                  {ICONS[alert.type]}
                </span>
                <div className="pt-alert__main">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <span className="pt-alert__title">{alert.title}</span>
                    {!alert.read && <PtBadge tone="accent">Novo</PtBadge>}
                    <PtBadge>{typeLabel(alert.type)}</PtBadge>
                  </div>
                  <span className="pt-alert__body">{alert.body}</span>
                  <span className="pt-alert__time">
                    {new Date(alert.createdAt).toLocaleTimeString('pt-BR', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}{' '}
                    · {relativeDay(new Date(alert.createdAt).toISOString().slice(0, 10))}
                    {student ? ` · ${student.name}` : ''}
                  </span>
                  <div className="pt-alert__actions">
                    {student && (
                      <button
                        type="button"
                        className="pt-btn pt-btn--sm"
                        onClick={() => {
                          void readAlert(alert.id);
                          onOpenStudent(student.id);
                        }}
                      >
                        Abrir aluno <ChevronRight size={13} />
                      </button>
                    )}
                    {(alert.type === 'suggestion' || alert.type === 'finishing') && student && (
                      <button
                        type="button"
                        className="pt-btn pt-btn--sm pt-btn--primary"
                        onClick={() => {
                          void readAlert(alert.id);
                          onSuggest(student);
                        }}
                      >
                        <Sparkles size={13} /> Montar próxima ficha
                      </button>
                    )}
                    {!alert.read && (
                      <button
                        type="button"
                        className="pt-btn pt-btn--sm pt-btn--ghost"
                        onClick={() => void readAlert(alert.id)}
                      >
                        Marcar como lido
                      </button>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}

function filterLabel(key: Filter): string {
  if (key === 'finishing') return 'Terminando ficha';
  if (key === 'suggestion') return 'Sugestões';
  if (key === 'inactive') return 'Inatividade';
  if (key === 'payment') return 'Financeiro';
  return 'Todos';
}

function typeLabel(type: PtAlert['type']): string {
  if (type === 'finishing') return 'Ficha em andamento';
  if (type === 'completed') return 'Ficha concluída';
  if (type === 'inactive') return 'Inatividade';
  if (type === 'suggestion') return 'Sugestão';
  if (type === 'payment') return 'Financeiro';
  return 'Nota';
}
