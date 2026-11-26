import { useEffect, useState, type ReactNode } from 'react';
import {
  AlertTriangle,
  BellRing,
  CalendarDays,
  ClipboardList,
  Dumbbell,
  LayoutDashboard,
  LogOut,
  Plus,
  Search,
  Settings,
  Users,
} from 'lucide-react';
import { usePtStore } from './personal-store';
import { usePersonalSession, signOutPersonal } from './personal-auth';
import { readLiveSnapshot } from './personal-bridge';
import { upsertAlert, ptId } from './personal-db';
import { suggestNextSheet } from './personal-engine';

import type { PtSheet, PtStudent } from './personal-types';
import { OverviewView } from './views/OverviewView';
import { StudentsView } from './views/StudentsView';
import { AlertsView } from './views/AlertsView';
import { StudentDetailView } from './views/StudentDetailView';
import { SheetsView } from './views/SheetsView';
import { AgendaView } from './views/AgendaView';
import { SettingsView } from './views/SettingsView';
import { PersonalSheetEditor } from './PersonalSheetEditor';
import { NewStudentModal } from './NewStudentModal';
import { PtAvatar } from './personal-ui';
import './personal.css';
import './personal-views.css';
import './personal-views-2.css';

type View = 'overview' | 'students' | 'sheets' | 'agenda' | 'alerts' | 'settings' | 'student';

const NAV = [
  { id: 'overview', label: 'Visão geral', icon: LayoutDashboard },
  { id: 'students', label: 'Alunos', icon: Users },
  { id: 'sheets', label: 'Fichas', icon: ClipboardList },
  { id: 'agenda', label: 'Agenda', icon: CalendarDays },
  { id: 'alerts', label: 'Avisos', icon: BellRing },
  { id: 'settings', label: 'Configurações', icon: Settings },
] as const;

const TITLES: Record<View, string> = {
  overview: 'Visão geral da carteira',
  students: 'Alunos',
  sheets: 'Fichas de treino',
  agenda: 'Agenda semanal',
  alerts: 'Central de avisos',
  settings: 'Configurações do painel',
  student: 'Detalhe do aluno',
};

export function PersonalApp() {
  const session = usePersonalSession();
  const load = usePtStore((s) => s.load);
  const students = usePtStore((s) => s.students);
  const alerts = usePtStore((s) => s.alerts);
  const exercises = usePtStore((s) => s.exercises);
  const sheets = usePtStore((s) => s.sheets);
  const sessions = usePtStore((s) => s.sessions);

  const [view, setView] = useState<View>('overview');
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [editor, setEditor] = useState<{
    open: boolean;
    studentId: string;
    sheet?: PtSheet;
    suggested?: ReturnType<typeof suggestNextSheet>;
  }>({ open: false, studentId: '' });
  const [newStudentOpen, setNewStudentOpen] = useState(false);

  useEffect(() => {
    void load();
  }, [load]);

  // Aviso em tempo real quando o aluno vinculado a este aparelho está terminando a ficha.
  useEffect(() => {
    const linked = students.find((s) => s.linkedDevice && !s.archived);
    if (!linked) return;
    let lastKey = '';
    const tick = async () => {
      const snap = await readLiveSnapshot();
      if (!snap || !snap.active || snap.total === 0) return;
      if (snap.percent < 75) return;
      const bucket = Math.floor(snap.percent / 10) * 10;
      const key = `${linked.id}:${snap.sheetKey}:${snap.checks}/${snap.total}`;
      if (key === lastKey) return;
      lastKey = key;
      const today = new Date().toISOString().slice(0, 10);
      await upsertAlert({
        id: ptId('alert'),
        type: 'finishing',
        studentId: linked.id,
        title: `${linked.name.split(' ')[0]} está terminando a ficha ${snap.sheetKey}`,
        body: `${snap.checks} de ${snap.total} exercícios concluídos (${snap.percent}%). Prepare a próxima ficha.`,
        dedupeKey: `finishing:${linked.id}:${today}:${snap.sheetKey}:${bucket}`,
        createdAt: Date.now(),
        read: false,
      });
      await usePtStore.getState().load();
    };
    const id = window.setInterval(() => void tick(), 15000);
    void tick();
    return () => window.clearInterval(id);
  }, [students]);

  const openStudent = (id: string) => {
    setSelectedStudentId(id);
    setView('student');
  };

  const openSuggest = (student: PtStudent) => {
    const mine = sheets.filter((s) => s.studentId === student.id);
    const related = sessions.filter((s) => s.studentId === student.id);
    const next = suggestNextSheet(student, mine, related, exercises);
    setEditor({ open: true, studentId: student.id, suggested: next });
  };

  const unreadCount = alerts.filter((a) => !a.read).length;

  const isStudentView = view === 'student';
  const activeNav = isStudentView ? 'students' : view;

  const title = TITLES[view];

  return (
    <div className="pt-app">
      <aside className="pt-side">
        <div className="pt-brand">
          <span className="pt-brand__mark">
            <Dumbbell size={20} />
          </span>
          <div className="pt-brand__name">
            <strong>Evo Fit</strong>
            <span>Painel Personal</span>
          </div>
        </div>
        <nav className="pt-nav" aria-label="Navegação do painel">
          <span className="pt-nav__group">Workspace</span>
          {NAV.map((item) => {
            const Icon = item.icon;
            const active = activeNav === item.id;
            const badge = item.id === 'alerts' ? unreadCount : 0;
            return (
              <button
                key={item.id}
                type="button"
                className={`pt-nav__item${active ? ' pt-nav__item--active' : ''}`}
                onClick={() => {
                  setView(item.id as View);
                  setSelectedStudentId(null);
                }}
                aria-current={active ? 'page' : undefined}
              >
                <Icon size={17} />
                <span className="pt-nav__label">{item.label}</span>
                {badge > 0 && <span className="pt-nav__count">{badge}</span>}
              </button>
            );
          })}
        </nav>
        <div className="pt-side__foot">
          <PtAvatar name={session?.name ?? 'Personal'} size={34} />
          <div className="pt-side__foot-name">
            <strong>{session?.name ?? 'Personal'}</strong>
            <span>{session?.email}</span>
          </div>
          <button
            type="button"
            className="pt-icon-btn"
            onClick={() => signOutPersonal()}
            title="Sair do painel"
            aria-label="Sair do painel"
          >
            <LogOut size={16} />
          </button>
        </div>
      </aside>

      <div className="pt-main">
        <header className="pt-top">
          <div className="pt-top__titles">
            <span className="pt-top__eyebrow">Personal · CRM</span>
            <span className="pt-top__title">{title}</span>
          </div>
          <label className="pt-top__search">
            <Search size={14} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar aluno, ficha, exercício…"
              aria-label="Buscar"
            />
          </label>
          <div className="pt-top__actions">
            <button
              type="button"
              className="pt-btn pt-btn--primary pt-btn--sm"
              onClick={() => setNewStudentOpen(true)}
            >
              <Plus size={13} /> Novo aluno
            </button>
          </div>
        </header>
        <div className="pt-content">
          {view === 'overview' && (
            <OverviewView
              onOpenStudent={openStudent}
              onSuggest={openSuggest}
              onNewStudent={() => setNewStudentOpen(true)}
              onNavigate={(v) => setView(v as View)}
            />
          )}
          {view === 'students' && (
            <StudentsView
              onOpenStudent={openStudent}
              onSuggest={openSuggest}
              onNewStudent={() => setNewStudentOpen(true)}
            />
          )}
          {view === 'student' && selectedStudentId && (
            <StudentDetailView
              studentId={selectedStudentId}
              onBack={() => setView('students')}
              onSuggest={(s) => openSuggest(s)}
              onEditSheet={(sheet) => setEditor({ open: true, studentId: selectedStudentId, sheet })}
            />
          )}
          {view === 'sheets' && (
            <SheetsView
              onOpenStudent={openStudent}
              onEditSheet={(sheet) => setEditor({ open: true, studentId: sheet.studentId, sheet })}
              onCreateFor={(studentId) => setEditor({ open: true, studentId })}
            />
          )}
          {view === 'agenda' && <AgendaView />}
          {view === 'alerts' && (
            <AlertsView onOpenStudent={openStudent} onSuggest={openSuggest} />
          )}
          {view === 'settings' && <SettingsView />}
        </div>
      </div>

      <nav className="pt-bottom" aria-label="Navegação rápida">
        {NAV.map((item) => {
          const Icon = item.icon;
          const active = activeNav === item.id;
          const badge = item.id === 'alerts' ? unreadCount : 0;
          return (
            <button
              key={item.id}
              type="button"
              className={`pt-bottom__item${active ? ' pt-bottom__item--active' : ''}`}
              onClick={() => {
                setView(item.id as View);
                setSelectedStudentId(null);
              }}
              aria-current={active ? 'page' : undefined}
            >
              <span style={{ position: 'relative', display: 'inline-grid' }}>
                <Icon size={18} />
                {badge > 0 && <span className="pt-bottom__badge">{badge}</span>}
              </span>
              <span>{item.label.split(' ')[0]}</span>
            </button>
          );
        })}
      </nav>

      {editor.open && (
        <PersonalSheetEditor
          studentId={editor.studentId}
          initialSheet={editor.sheet}
          suggested={editor.suggested}
          onClose={() => setEditor({ open: false, studentId: '' })}
        />
      )}

      {newStudentOpen && <NewStudentModal onClose={() => setNewStudentOpen(false)} />}
    </div>
  );
}

