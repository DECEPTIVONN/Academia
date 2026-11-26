/**
 * personal-auth.ts — Login do personal (separado do login do aluno)
 *
 * O personal tem credenciais próprias, guardadas no mesmo IndexedDB (perfil
 * `default` da tabela `ptProfiles`). A senha nunca é guardada em texto: o hash
 * SHA-256 é calculado com Web Crypto e um salt aleatório por conta.
 *
 * A sessão vive em `localStorage` (`evofit_pt_session`) e o app inteiro
 * re-renderiza pelo evento `academia:personal-session` — é assim que o login
 * escolhe entre a experiência do aluno e o Painel do Personal sem alterar
 * nenhuma tela do aluno.
 */

import { useEffect, useState } from 'react';
import type { PtProfile } from './personal-types';
import { getPtProfile, saveProfile } from './personal-db';

const SESSION_KEY = 'evofit_pt_session';
export const PERSONAL_SESSION_EVENT = 'academia:personal-session';

export interface PersonalSession {
  profileId: 'default';
  email: string;
  name: string;
  at: number;
}

function randomSalt(): string {
  try {
    const bytes = new Uint8Array(16);
    crypto.getRandomValues(bytes);
    return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
  } catch {
    return Math.random().toString(36).slice(2) + Date.now().toString(36);
  }
}

export async function hashPassword(password: string, salt: string): Promise<string> {
  const data = new TextEncoder().encode(`evofit-personal:${salt}:${password}`);
  try {
    if (typeof crypto !== 'undefined' && crypto.subtle) {
      const digest = await crypto.subtle.digest('SHA-256', data);
      return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, '0')).join('');
    }
  } catch {
    /* contexto não seguro (http não-local): cai no hash simples abaixo */
  }
  let h = 2166136261;
  for (const byte of data) {
    h ^= byte;
    h = Math.imul(h, 16777619);
  }
  return `fnv_${(h >>> 0).toString(16)}`;
}

function dispatchSession(): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(PERSONAL_SESSION_EVENT));
}

export function getPersonalSession(): PersonalSession | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PersonalSession;
    return parsed && typeof parsed.email === 'string' ? parsed : null;
  } catch {
    return null;
  }
}

function writeSession(session: PersonalSession | null): void {
  try {
    if (session) localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    else localStorage.removeItem(SESSION_KEY);
  } catch {
    /* storage indisponível */
  }
  dispatchSession();
}

export async function hasPersonalAccount(): Promise<boolean> {
  return Boolean(await getPtProfile());
}

export interface CreatePersonalInput {
  name: string;
  email: string;
  password: string;
  cref?: string;
}

export async function createPersonalAccount(input: CreatePersonalInput): Promise<PersonalSession> {
  const name = input.name.trim();
  const email = input.email.trim().toLowerCase();
  if (name.length < 2) throw new Error('Informe seu nome completo.');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('Informe um e-mail válido.');
  if (input.password.length < 6) throw new Error('A senha deve ter no mínimo 6 caracteres.');

  const existing = await getPtProfile();
  if (existing && existing.email === email) {
    throw new Error('Já existe um painel com este e-mail. Use "Entrar".');
  }

  const salt = randomSalt();
  const passwordHash = await hashPassword(input.password, salt);
  const profile: PtProfile = {
    id: 'default',
    name,
    email,
    passwordHash,
    salt,
    cref: input.cref?.trim() || undefined,
    planPrices: { Mensal: 250, Trimestral: 320, Online: 190, Avulso: 90 },
    createdAt: new Date().toISOString(),
  };
  await saveProfile(profile);

  const session: PersonalSession = { profileId: 'default', email, name, at: Date.now() };
  writeSession(session);
  return session;
}

export async function signInPersonal(email: string, password: string): Promise<PersonalSession> {
  const profile = await getPtProfile();
  if (!profile) throw new Error('Nenhum painel de personal criado neste aparelho. Crie sua conta.');
  const cleanEmail = email.trim().toLowerCase();
  if (cleanEmail !== profile.email.toLowerCase()) throw new Error('E-mail ou senha incorretos.');
  const hash = await hashPassword(password, profile.salt);
  if (hash !== profile.passwordHash) throw new Error('E-mail ou senha incorretos.');

  const session: PersonalSession = {
    profileId: 'default',
    email: profile.email,
    name: profile.name,
    at: Date.now(),
  };
  writeSession(session);
  return session;
}

export function signOutPersonal(): void {
  writeSession(null);
}

export async function changePersonalPassword(current: string, next: string): Promise<void> {
  const profile = await getPtProfile();
  if (!profile) throw new Error('Painel não encontrado.');
  if ((await hashPassword(current, profile.salt)) !== profile.passwordHash) {
    throw new Error('Senha atual incorreta.');
  }
  if (next.length < 6) throw new Error('A nova senha deve ter no mínimo 6 caracteres.');
  const salt = randomSalt();
  const passwordHash = await hashPassword(next, salt);
  await saveProfile({ ...profile, salt, passwordHash });
}

/** Sessão reativa: o App troca de "aluno" para "personal" na hora. */
export function usePersonalSession(): PersonalSession | null {
  const [session, setSession] = useState<PersonalSession | null>(() => getPersonalSession());
  useEffect(() => {
    const sync = () => setSession(getPersonalSession());
    window.addEventListener(PERSONAL_SESSION_EVENT, sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener(PERSONAL_SESSION_EVENT, sync);
      window.removeEventListener('storage', sync);
    };
  }, []);
  return session;
}
