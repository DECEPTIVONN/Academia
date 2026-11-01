/**
 * health-profile.ts — persistência do "Perfil de Saúde" (Configurações → Perfil)
 *
 * Dados básicos usados para personalizar treinos: sexo, altura, peso e data de
 * nascimento. Ficam numa chave própria do localStorage
 * (`academia_health_profile_v1`) — NÃO se misturam com as métricas corporais
 * (Dexie `bodyMeasurements`), que continuam sendo o histórico de peso/fotos.
 *
 * Peso é guardado em kg. A tela converte para a unidade escolhida pelo usuário
 * (`getWeightUnit()` em lib/app-prefs.ts) apenas na exibição.
 */

export type HealthSex = 'Masculino' | 'Feminino' | 'Outro' | 'Prefiro não informar';

export const HEALTH_SEX_OPTIONS: HealthSex[] = [
  'Masculino',
  'Feminino',
  'Outro',
  'Prefiro não informar',
];

export interface HealthProfileData {
  sexo: HealthSex | '';
  /** Altura em centímetros (string para preservar o campo vazio). */
  alturaCm: string;
  /** Peso em kg (sempre kg; a tela mostra na unidade da preferência). */
  pesoKg: string;
  /** Data de nascimento em YYYY-MM-DD. */
  nascimento: string;
  updatedAt?: string;
}

export const HEALTH_PROFILE_STORAGE_KEY = 'academia_health_profile_v1';
export const HEALTH_PROFILE_EVENT = 'academia:health-profile-changed';

const EMPTY_HEALTH_PROFILE: HealthProfileData = {
  sexo: '',
  alturaCm: '',
  pesoKg: '',
  nascimento: '',
};

function numericString(value: unknown): string {
  const raw = String(value ?? '').replace(',', '.').trim();
  const n = parseFloat(raw);
  return Number.isFinite(n) && n >= 0 ? String(n) : '';
}

function isSexo(value: unknown): value is HealthSex {
  return typeof value === 'string' && HEALTH_SEX_OPTIONS.includes(value as HealthSex);
}

/** Lê o perfil salvo; campos inválidos/ausentes voltam vazios. */
export function readHealthProfile(): HealthProfileData {
  try {
    const raw = localStorage.getItem(HEALTH_PROFILE_STORAGE_KEY);
    if (!raw) return { ...EMPTY_HEALTH_PROFILE };
    const parsed = JSON.parse(raw) as Partial<HealthProfileData>;
    const nascimento =
      typeof parsed.nascimento === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(parsed.nascimento)
        ? parsed.nascimento
        : '';
    return {
      sexo: isSexo(parsed.sexo) ? parsed.sexo : '',
      alturaCm: numericString(parsed.alturaCm),
      pesoKg: numericString(parsed.pesoKg),
      nascimento,
      updatedAt: typeof parsed.updatedAt === 'string' ? parsed.updatedAt : undefined,
    };
  } catch {
    return { ...EMPTY_HEALTH_PROFILE };
  }
}

/** Grava o perfil e avisa os interessados (evento no window). */
export function saveHealthProfile(data: HealthProfileData): HealthProfileData {
  const next: HealthProfileData = {
    sexo: isSexo(data.sexo) ? data.sexo : '',
    alturaCm: numericString(data.alturaCm),
    pesoKg: numericString(data.pesoKg),
    nascimento:
      typeof data.nascimento === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(data.nascimento)
        ? data.nascimento
        : '',
    updatedAt: new Date().toISOString(),
  };
  try {
    localStorage.setItem(HEALTH_PROFILE_STORAGE_KEY, JSON.stringify(next));
  } catch {
    /* cota cheia: mantém a UI funcionando sem persistir */
  }
  try {
    window.dispatchEvent(new CustomEvent(HEALTH_PROFILE_EVENT, { detail: next }));
  } catch {
    /* SSR/testes */
  }
  return next;
}

/**
 * Atualiza SÓ os campos informados, preservando o resto do perfil. Usado pelo
 * onboarding (sexo/nascimento/peso/altura) e pelas métricas corporais (peso):
 * cada origem conhece apenas parte dos dados e não pode zerar o restante.
 */
export function mergeHealthProfile(partial: Partial<HealthProfileData>): HealthProfileData {
  const current = readHealthProfile();
  return saveHealthProfile({ ...current, ...partial });
}

/** Idade em anos completos a partir da data de nascimento (YYYY-MM-DD). */
export function healthAge(nascimento: string, today = new Date()): number | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(nascimento)) return null;
  const [y, m, d] = nascimento.split('-').map((n) => parseInt(n, 10));
  if (!y || !m || !d) return null;
  let age = today.getFullYear() - y;
  const beforeBirthday =
    today.getMonth() + 1 < m || (today.getMonth() + 1 === m && today.getDate() < d);
  if (beforeBirthday) age -= 1;
  return age >= 0 && age < 130 ? age : null;
}

/** Diferença de conversão usada apenas na exibição do peso. */
export const KG_TO_LB = 2.2046226218;
