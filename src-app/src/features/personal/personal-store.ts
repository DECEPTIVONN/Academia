/**
 * personal-store.ts — Estado do Painel do Personal
 *
 * Um único store zustand concentra os dados carregados do IndexedDB e as
 * ações de escrita. Toda ação regrava no banco e atualiza o estado, então as
 * telas nunca ficam defasadas entre si.
 */

import { create } from 'zustand';
import type { Exercise } from '@/core/db/schema';
import type {
  PtAlert,
  PtMessage,
  PtNote,
  PtProfile,
  PtSession,
  PtSheet,
  PtStudent,
} from './personal-types';
import {
  clearPtData,
  deleteNote,
  deleteSession,
  deleteSheet,
  ensureExerciseLibrary,
  getPtProfile,
  markAlertRead,
  markAllAlertsRead,
  ptId,
  removeStudent,
  saveMessage,
  saveNote,
  saveSession,
  saveSheet,
  saveStudent,
  seedDemoData,
  upsertAlert,
} from './personal-db';
import { buildAlerts } from './personal-engine';
import { publishSheetToStudent, syncDeviceHistory } from './personal-bridge';
import * as db from './personal-db';

interface PtStore {
  loading: boolean;
  profile: PtProfile | null;
  students: PtStudent[];
  sheets: PtSheet[];
  sessions: PtSession[];
  alerts: PtAlert[];
  notes: PtNote[];
  messages: PtMessage[];
  exercises: Exercise[];
  /** Sessão do aviso "terminando a ficha" já disparado (evita spam). */
  lastLiveAlertKey: string | null;

  load: () => Promise<void>;
  addStudent: (input: Omit<PtStudent, 'id' | 'joinedAt' | 'avatarHue' | 'status'> & {
    status?: PtStudent['status'];
    avatarHue?: number;
  }) => Promise<PtStudent>;
  updateStudent: (student: PtStudent) => Promise<void>;
  archiveStudent: (studentId: string, archived: boolean) => Promise<void>;
  deleteStudent: (studentId: string) => Promise<void>;

  saveSheetRecord: (sheet: PtSheet) => Promise<PtSheet>;
  createSheet: (
    studentId: string,
    input: { letter: string; name: string; focus: string; items: PtSheet['items']; notes: string; fromSuggestion?: boolean }
  ) => Promise<PtSheet>;
  removeSheet: (sheetId: string) => Promise<void>;
  sendSheetToStudent: (sheet: PtSheet) => Promise<void>;

  addSession: (input: Omit<PtSession, 'id'> & { id?: string }) => Promise<void>;
  removeSession: (sessionId: string) => Promise<void>;

  addNote: (studentId: string, body: string, pinned?: boolean) => Promise<void>;
  removeNote: (noteId: string) => Promise<void>;

  addMessage: (studentId: string, body: string) => Promise<void>;

  readAlert: (alertId: string) => Promise<void>;
  readAllAlerts: () => Promise<void>;
  refreshDerivedAlerts: () => Promise<number>;
  syncLinked: () => Promise<void>;

  resetDemo: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

/* Single-flight: o React StrictMode (e qualquer chamada concorrente) monta o
   painel duas vezes; sem esta guarda o seed e a geração de alertas rodavam em
   paralelo e o `upsertAlert` inseria o mesmo aviso duas vezes (a checagem de
   `dedupeKey` acontecia antes do primeiro put). */
let loadInFlight: Promise<void> | null = null;
let alertsInFlight: Promise<number> | null = null;

async function reloadLists(): Promise<Pick<PtStore, 'students' | 'sheets' | 'sessions' | 'alerts' | 'notes' | 'messages'>> {
  const [students, sheets, sessions, alerts, notes, messages] = await Promise.all([
    db.listStudents(),
    db.listSheets(),
    db.listSessions(),
    db.listAlerts(),
    db.listNotes(),
    db.listMessages(),
  ]);
  return { students, sheets, sessions, alerts, notes, messages };
}

export const usePtStore = create<PtStore>((set, get) => ({
  loading: true,
  profile: null,
  students: [],
  sheets: [],
  sessions: [],
  alerts: [],
  notes: [],
  messages: [],
  exercises: [],
  lastLiveAlertKey: null,

  load: async () => {
    if (loadInFlight) return loadInFlight;
    loadInFlight = (async () => {
      set({ loading: true });
      const exercises = await ensureExerciseLibrary();
      let profile = await getPtProfile();
      if (profile && !profile.seeded) {
        /* Primeiro acesso de uma conta recém-criada: carteira de exemplo para o
           painel já nascer demonstrável (pode ser apagada em Configurações). */
        await seedDemoData();
        profile = { ...profile, seeded: true };
        await db.saveProfile(profile);
      }
      const lists = await reloadLists();
      set({ profile, exercises, ...lists, loading: false });
      await get().syncLinked();
      await get().refreshDerivedAlerts();
    })().finally(() => {
      loadInFlight = null;
    });
    return loadInFlight;
  },

  addStudent: async (input) => {
    const student: PtStudent = {
      ...input,
      id: ptId('stu'),
      joinedAt: new Date().toISOString().slice(0, 10),
      status: input.status ?? 'ativo',
      avatarHue: input.avatarHue ?? Math.floor(Math.random() * 360),
    };
    await saveStudent(student);
    set({ students: await db.listStudents() });
    return student;
  },

  updateStudent: async (student) => {
    await saveStudent(student);
    set({ students: await db.listStudents() });
  },

  archiveStudent: async (studentId, archived) => {
    const student = get().students.find((s) => s.id === studentId);
    if (!student) return;
    await saveStudent({ ...student, archived });
    set({ students: await db.listStudents() });
  },

  deleteStudent: async (studentId) => {
    await removeStudent(studentId);
    set(await reloadLists());
  },

  saveSheetRecord: async (sheet) => {
    await saveSheet({ ...sheet, updatedAt: new Date().toISOString() });
    set({ sheets: await db.listSheets() });
    return sheet;
  },

  createSheet: async (studentId, input) => {
    const now = new Date().toISOString();
    const sheet: PtSheet = {
      id: ptId('sheet'),
      studentId,
      letter: input.letter,
      name: input.name,
      focus: input.focus,
      items: input.items,
      notes: input.notes,
      status: 'rascunho',
      createdAt: now,
      updatedAt: now,
      fromSuggestion: input.fromSuggestion,
    };
    await saveSheet(sheet);
    set({ sheets: await db.listSheets() });
    return sheet;
  },

  removeSheet: async (sheetId) => {
    await deleteSheet(sheetId);
    set({ sheets: await db.listSheets() });
  },

  sendSheetToStudent: async (sheet) => {
    const student = get().students.find((s) => s.id === sheet.studentId);
    if (!student) return;
    const sent: PtSheet = {
      ...sheet,
      status: 'ativa',
      sentAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await saveSheet(sent);
    if (student.linkedDevice) {
      await publishSheetToStudent(sent, student);
    }
    await upsertAlert({
      id: ptId('alert'),
      type: 'note',
      studentId: student.id,
      title: `Ficha ${sent.letter} enviada para ${student.name.split(' ')[0]}`,
      body: student.linkedDevice
        ? 'A ficha já está disponível no app deste aparelho.'
        : 'Ficha registrada no CRM. O aluno vinculado a este aparelho recebe direto no app.',
      dedupeKey: `sent:${sent.id}:${Date.now()}`,
      createdAt: Date.now(),
      read: false,
    });
    set(await reloadLists());
  },

  addSession: async (input) => {
    const session: PtSession = { ...input, id: input.id ?? ptId('ses') };
    await saveSession(session);
    set({ sessions: await db.listSessions() });
  },

  removeSession: async (sessionId) => {
    await deleteSession(sessionId);
    set({ sessions: await db.listSessions() });
  },

  addNote: async (studentId, body, pinned) => {
    const note: PtNote = {
      id: ptId('note'),
      studentId,
      body: body.trim(),
      createdAt: Date.now(),
      pinned,
    };
    if (!note.body) return;
    await saveNote(note);
    set({ notes: await db.listNotes() });
  },

  removeNote: async (noteId) => {
    await deleteNote(noteId);
    set({ notes: await db.listNotes() });
  },

  addMessage: async (studentId, body) => {
    const text = body.trim();
    if (!text) return;
    const student = get().students.find((s) => s.id === studentId);
    await saveMessage({
      id: ptId('msg'),
      studentId,
      direction: 'coach',
      body: text,
      createdAt: Date.now(),
    });
    if (student?.linkedDevice) {
      try {
        const { pushMessage } = await import('@/features/notifications/inbox');
        pushMessage({
          kind: 'account',
          title: 'Mensagem do seu personal',
          body: text,
          key: `pt-msg-${studentId}-${Date.now()}`,
        });
      } catch {
        /* inbox indisponível */
      }
    }
    set({ messages: await db.listMessages() });
  },

  readAlert: async (alertId) => {
    await markAlertRead(alertId, true);
    set({ alerts: await db.listAlerts() });
  },

  readAllAlerts: async () => {
    await markAllAlertsRead();
    set({ alerts: await db.listAlerts() });
  },

  refreshDerivedAlerts: async () => {
    if (alertsInFlight) return alertsInFlight;
    alertsInFlight = (async () => {
      const { students, sheets, sessions, exercises } = get();
      const drafts = buildAlerts(
        students.filter((s) => !s.archived),
        sheets,
        sessions,
        exercises
      );
      let created = 0;
      for (const draft of drafts) {
        const inserted = await upsertAlert({
          id: ptId('alert'),
          type: draft.type,
          studentId: draft.studentId,
          title: draft.title,
          body: draft.body,
          dedupeKey: draft.dedupeKey,
          createdAt: Date.now(),
          read: false,
        });
        if (inserted) created += 1;
      }
      if (created) set({ alerts: await db.listAlerts() });
      return created;
    })().finally(() => {
      alertsInFlight = null;
    });
    return alertsInFlight;
  },

  syncLinked: async () => {
    const linked = get().students.filter((s) => s.linkedDevice && !s.archived);
    if (!linked.length) return;
    let changed = false;
    for (const student of linked) {
      const imported = await syncDeviceHistory(student.id);
      if (imported > 0) changed = true;
    }
    if (changed) {
      set({ sessions: await db.listSessions() });
    }
  },

  resetDemo: async () => {
    await clearPtData();
    const profile = await getPtProfile();
    if (profile) await db.saveProfile({ ...profile, seeded: false });
    await seedDemoData();
    set(await reloadLists());
    await get().refreshDerivedAlerts();
  },

  refreshProfile: async () => {
    set({ profile: await getPtProfile() });
  },
}));
