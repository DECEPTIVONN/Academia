/**
 * OverviewView.tsx — Visão geral do Painel do Personal
 *
 * Responde em 5 segundos: como está a carteira hoje? Quem precisa de atenção,
 * o que está na agenda e qual ficha sugerir para cada aluno.
 */

import { useMemo } from 'react';
import {
  AlertTriangle,
  ArrowUpRight,
  BellRing,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Dumbbell,
  Plus,
  Sparkles,
  TrendingUp,
  Users,
  Wallet,
} from 'lucide-react';
import { usePtStore } from '../personal-store';
import {
  computeMetrics,
  estimatedRevenue,
  sheetVolume,
  suggestNextSheet,
  todayKey,
} from '../personal-engine';
import {
  PtAvatar,
  PtBadge,
  PtBars,
  PtEmpty,
  PtRing,
  PtSectionTitle,
  PtStatCard,
  formatDateBR,
  formatMoney,
  relativeDay,
} from '../personal-ui';
import type { PtStudent } from '../personal-types';

export function OverviewView({
  onOpenStudent,
  onSuggest,
  onNewStudent,
  onNavigate,
}: {
  onOpenStudent: (id: string) => void;
  onSuggest: (student: PtStudent) => void;
  onNewStudent: () => void;
  onNavigate: (view: 'students' | 'agenda' | 'alerts' | 'sheets') => void;
}) {
  const students = usePtStore((s) => s.students);
  const sheets = usePtStore((s) => s.sheets);
  const sessions = usePtStore((s) => s.sessions);
  const alerts = usePtStore((s) => s.alerts);
  const exercises = usePtStore((s) => s.exercises);
  const profile = usePtStore((s) => s.profile);
  const readAlert = usePtStore((s) => s.readAlert);

  const active = students.filter((s) => !s.archived);
  const unread = alerts.filter((a) => !a.read);

  const metrics = useMemo(() => {
    const map = new Map(active.map((s) => [s.id, computeMetrics(s, sessions)]));
    return map;
  }, [active, sessions]);

  const weekSessions = sessions.filter((s) => s.date >= weekStart() && s.date <= todayKey());
  const totalWeek = weekSessions.length;
  const adherenceAvg = active.length
    ? Math.round(
        active.reduce((acc, s) => acc + (metrics.get(s.id)?.adherence ?? 0), 0) / active.length
      )
    : 0;
  const revenue = estimatedRevenue(active);
  const atRisk = active.filter((s) => {
    const d = metrics.get(s.id)?.daysSinceLast;
    if (d == null) return false;
    return d >= 7;
  });
  const todaySessions = sessions.filter((s) => s.date === todayKey());

  const suggestions = useMemo(
    () =>
      active
        .map((student) => {
          const mine = sheets.filter((s) => s.studentId === student.id);
          if (!mine.length) return null;
          const related = sessions.filter((s) => s.studentId === student.id);
          const m = metrics.get(student.id);
          if (!m || (m.daysSinceLast ?? 99) > 3) return null;
          return { student, next: suggestNextSheet(student, mine, related, exercises) };
        })
        .filter((v): v is { student: PtStudent; next: ReturnType<typeof suggestNextSheet> } => Boolean(v))
        .slice(0, 4),
    [active, sheets, sessions, exercises, metrics]
  );

  const weekBars = useMemo(() => {
    const today = new Date();
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(today);
      d.setDate(d.getDate() - (6 - i));
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      const count = sessions.filter((s) => s.date === key).length;
      return {
        label: ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'][d.getDay()],
        count,
        highlight: i === 6,
      };
    });
  }, [sessions]);

  const totalVolume = sheets.reduce((acc, sheet) => {
    const map = new Map(exercises.map((ex) => [ex.id, ex]));
    return acc + sheetVolume(sheet, map);
  }, 0);

  const greeting = (() => {
    const hour = new Date().getHours();
    if (hour < 6) return 'Boa madrugada';
    if (hour < 12) return 'Bom dia';
    if (hour < 18) return 'Boa tarde';
    return 'Boa noite';
  })();

  return (
    <div className="pt-page">
      <section className="pt-hero">
        <div className="pt-hero__main">
          <span className="pt-hero__eyebrow">
            <Sparkles size={13} /> {greeting}, {profile?.name?.split(' ')[0] ?? 'personal'}
          </span>
          <h1 className="pt-hero__title">
            {active.length} aluno{active.length === 1 ? '' : 's'} sob sua orientação
          </h1>
          <p className="pt-hero__text">
            {totalWeek} treino{totalWeek === 1 ? '' : 's'} nesta semana · {unread.length} aviso
            {unread.length === 1 ? '' : 's'} novo{unread.length === 1 ? '' : 's'} · próxima ficha
            pronta para {suggestions.length} aluno{suggestions.length === 1 ? '' : 's'}.
          </p>
          <div className="pt-hero__actions">
            <button type="button" className="pt-btn pt-btn--primary" onClick={onNewStudent}>
              <Plus size={15} /> Novo aluno
            </button>
            <button type="button" className="pt-btn" onClick={() => onNavigate('agenda')}>
              <CalendarDays size={15} /> Agenda
            </button>
            <button type="button" className="pt-btn pt-btn--ghost" onClick={() => onNavigate('alerts')}>
              <BellRing size={15} /> Central de avisos
            </button>
          </div>
        </div>
        <div className="pt-hero__aside">
          <PtRing value={adherenceAvg} size={74} stroke={7} label={`${adherenceAvg}%`} />
          <div className="pt-hero__aside-meta">
            <strong>Aderência média</strong>
            <span>Últimos 30 dias · meta da carteira</span>
          </div>
        </div>
      </section>

      <div className="pt-grid pt-grid--stats">
        <PtStatCard
          label="Alunos ativos"
          value={active.length}
          hint={`${active.filter((s) => s.status === 'ativo').length} em dia`}
          icon={<Users size={17} />}
          delay={0}
        />
        <PtStatCard
          label="Treinos na semana"
          value={totalWeek}
          hint={`${weekSessions.filter((s) => s.completed).length} concluídos`}
          icon={<Dumbbell size={17} />}
          tone="violet"
          delay={0.05}
        />
        <PtStatCard
          label="Precisam de atenção"
          value={atRisk.length}
          hint={atRisk.length ? '7+ dias sem treinar' : 'Carteira em dia'}
          icon={<AlertTriangle size={17} />}
          tone={atRisk.length ? 'warn' : 'accent'}
          delay={0.1}
        />
        <PtStatCard
          label="Receita mensal"
          value={formatMoney(revenue)}
          hint={`${active.filter((s) => s.plan !== 'Avulso').length} planos recorrentes`}
          icon={<Wallet size={17} />}
          tone="success"
          delay={0.15}
        />
      </div>

      <div className="pt-grid pt-grid--2">
        <section className="pt-card">
          <div className="pt-card__head">
            <h3>Avisos recentes</h3>
            <span>{unread.length} não lidos</span>
          </div>
          <div className="pt-card__body pt-card__body--flush">
            {alerts.length === 0 ? (
              <PtEmpty
                icon={<CheckCircle2 size={22} />}
                title="Tudo tranquilo"
                text="Nenhum aviso pendente. Os alertas aparecem aqui quando um aluno está terminando a ficha, fica inativo ou recebe uma sugestão."
              />
            ) : (
              <div className="pt-list">
                {alerts.slice(0, 5).map((alert) => {
                  const student = students.find((s) => s.id === alert.studentId);
                  const danger = alert.type === 'inactive' || alert.type === 'payment';
                  return (
                    <button
                      key={alert.id}
                      type="button"
                      className="pt-list__row"
                      onClick={() => {
                        void readAlert(alert.id);
                        if (student) onOpenStudent(student.id);
                      }}
                      style={{ textAlign: 'left', background: 'transparent', border: 'none' }}
                    >
                      <span className={`pt-list__dot${danger ? ' pt-list__dot--danger' : alert.type === 'finishing' ? ' pt-list__dot--warn' : ''}`} />
                      <span className="pt-list__main">
                        <strong>{alert.title}</strong>
                        <span>{alert.body}</span>
                      </span>
                      <ChevronRight size={15} style={{ color: '#6f746a', flex: 'none' }} />
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        <section className="pt-card">
          <div className="pt-card__head">
            <h3>Hoje na agenda</h3>
            <span>{formatDateBR(todayKey())}</span>
          </div>
          <div className="pt-card__body pt-card__body--flush">
            {todaySessions.length === 0 ? (
              <PtEmpty
                icon={<CalendarDays size={22} />}
                title="Nenhum treino marcado"
                text="Marque as sessões do dia para acompanhar presença e evolução nos relatórios."
                action={
                  <button type="button" className="pt-btn pt-btn--sm" onClick={() => onNavigate('agenda')}>
                    <Plus size={13} /> Agendar treino
                  </button>
                }
              />
            ) : (
              <div className="pt-list">
                {todaySessions.map((session) => {
                  const student = students.find((s) => s.id === session.studentId);
                  if (!student) return null;
                  return (
                    <button
                      key={session.id}
                      type="button"
                      className="pt-list__row"
                      onClick={() => onOpenStudent(student.id)}
                      style={{ textAlign: 'left', background: 'transparent', border: 'none' }}
                    >
                      <PtAvatar name={student.name} hue={student.avatarHue} size={34} />
                      <span className="pt-list__main">
                        <strong>{student.name}</strong>
                        <span>
                          Ficha {session.sheetLabel} · {session.durationMin} min
                        </span>
                      </span>
                      <PtBadge tone={session.completed ? 'success' : 'neutral'}>
                        {session.completed ? 'Concluído' : 'Agendado'}
                      </PtBadge>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      </div>

      <div className="pt-grid pt-grid--2">
        <section className="pt-card">
          <div className="pt-card__head">
            <h3>Próximas fichas sugeridas</h3>
            <span>Progressão automática</span>
          </div>
          <div className="pt-card__body pt-card__body--flush">
            {suggestions.length === 0 ? (
              <PtEmpty
                icon={<TrendingUp size={22} />}
                title="Sem sugestões no radar"
                text="Assim que um aluno concluir treinos recentes, a próxima ficha com progressão de carga aparece aqui."
              />
            ) : (
              <div>
                {suggestions.map(({ student, next }) => (
                  <div className="pt-suggest-row" key={student.id}>
                    <PtAvatar name={student.name} hue={student.avatarHue} size={36} />
                    <div className="pt-suggest-row__main">
                      <strong>{student.name}</strong>
                      <span>
                        {next.name} · {next.items.length} exercícios
                      </span>
                    </div>
                    <button
                      type="button"
                      className="pt-btn pt-btn--sm pt-btn--primary"
                      onClick={() => onSuggest(student)}
                    >
                      Revisar <ArrowUpRight size={13} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        <section className="pt-card">
          <div className="pt-card__head">
            <h3>Ritmo da semana</h3>
            <span>{totalVolume.toLocaleString('pt-BR')} kg de volume prescrito</span>
          </div>
          <div className="pt-card__body">
            <PtBars data={weekBars} height={120} />
            <div className="pt-kv" style={{ marginTop: 16 }}>
              <div className="pt-kv__row">
                <span>Alunos em risco</span>
                <strong>
                  {atRisk.length === 0
                    ? 'Nenhum'
                    : atRisk.map((s) => s.name.split(' ')[0]).join(', ')}
                </strong>
              </div>
              <div className="pt-kv__row">
                <span>Último acesso da carteira</span>
                <strong>
                  {relativeDay(
                    [metrics.get(active[0]?.id ?? '')?.lastSession?.date]
                      .filter(Boolean)
                      .sort()
                      .pop() ?? null
                  )}
                </strong>
              </div>
              <div className="pt-kv__row">
                <span>Fichas montadas</span>
                <strong>{sheets.length}</strong>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

function weekStart(): string {
  const d = new Date();
  const day = d.getDay();
  d.setDate(d.getDate() - ((day + 6) % 7));
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
