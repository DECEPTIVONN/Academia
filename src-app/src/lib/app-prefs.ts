/**
 * app-prefs.ts — preferências gerais do app (unidades, semana, treino e avisos).
 *
 * Módulo sem dependências de features para poder ser importado tanto pela UI de
 * Configurações quanto por helpers de dados (ex.: `formatCarga`). Todas as
 * gravações disparam `academia:prefs-changed` para as telas se atualizarem.
 */

export const APP_PREF_KEYS = {
  /** 'monday' (padrão) | 'sunday' */
  firstDayOfWeek: 'academia_pref_first_day_of_week',
  /** 'kg' (padrão) | 'lb' */
  weightUnit: 'academia_pref_weight_unit',
  /** 'km' (padrão) | 'mi' */
  distanceUnit: 'academia_pref_distance_unit',
  /** 'false' desliga o aviso sonoro do fim do descanso (padrão ligado) */
  timerSound: 'academia_pref_timer_sound',
  /** 'true' abre o Modo Foco automaticamente ao iniciar um treino */
  focusDefault: 'academia_pref_focus_default',
  /** placeholders de notificações (salvos, sem push real) */
  notifications: 'academia_pref_notifications_enabled',
  notifyUpdates: 'academia_pref_notify_updates',
  notifyLeagues: 'academia_pref_notify_leagues',
} as const;

export type FirstDayOfWeek = 'monday' | 'sunday';
export type WeightUnit = 'kg' | 'lb';
export type DistanceUnit = 'km' | 'mi';

const KG_TO_LB = 2.2046226218;

function read(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function write(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* storage indisponível */
  }
}

function notifyChange(): void {
  try {
    window.dispatchEvent(new CustomEvent('academia:prefs-changed'));
  } catch {
    /* SSR/testes */
  }
}

/* ── Semana ── */

export function getFirstDayOfWeek(): FirstDayOfWeek {
  return read(APP_PREF_KEYS.firstDayOfWeek) === 'sunday' ? 'sunday' : 'monday';
}

export function setFirstDayOfWeek(value: FirstDayOfWeek): void {
  write(APP_PREF_KEYS.firstDayOfWeek, value);
  notifyChange();
}

export function getWeekDayLabels(firstDay: FirstDayOfWeek = getFirstDayOfWeek()): string[] {
  return firstDay === 'sunday'
    ? ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
    : ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];
}

/* ── Unidades ── */

export function getWeightUnit(): WeightUnit {
  return read(APP_PREF_KEYS.weightUnit) === 'lb' ? 'lb' : 'kg';
}

export function setWeightUnit(value: WeightUnit): void {
  write(APP_PREF_KEYS.weightUnit, value);
  notifyChange();
}

export function getDistanceUnit(): DistanceUnit {
  return read(APP_PREF_KEYS.distanceUnit) === 'mi' ? 'mi' : 'km';
}

export function setDistanceUnit(value: DistanceUnit): void {
  write(APP_PREF_KEYS.distanceUnit, value);
  notifyChange();
}

/** Rótulo da velocidade: "km/h" ou "mph". */
export function getSpeedUnitLabel(unit: DistanceUnit = getDistanceUnit()): string {
  return unit === 'mi' ? 'mph' : 'km/h';
}

/** Rótulo da unidade de peso exibida ("kg" ou "lb"). */
export function getWeightUnitLabel(unit: WeightUnit = getWeightUnit()): WeightUnit {
  return unit;
}

/** Converte um volume/carga armazenado em kg para a unidade escolhida. */
export function convertKgToDisplay(
  valueKg: number,
  unit: WeightUnit = getWeightUnit()
): number {
  return unit === 'lb' ? valueKg * KG_TO_LB : valueKg;
}

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

/**
 * Converte a carga digitada (kg por padrão) para a unidade escolhida.
 * Aceita "10", "10kg", "10,5 kg" e mantém textos que não são numéricos.
 */
export function formatLoadLabel(raw: string): string {
  const text = raw.trim();
  if (!text) return '';

  /* Preserva o sufixo "cada lado" (vindo de cargas legadas/sugestões) sem
     atrapalhar a leitura do número e da unidade. */
  const sideMatch = text.match(/^(.*?)\s*cada\s*lado$/i);
  const core = (sideMatch ? sideMatch[1] : text).trim();
  const suffix = sideMatch ? ' cada lado' : '';
  const unit = getWeightUnit();
  const match = core.match(/^(\d+(?:[.,]\d+)?)\s*(kg|lbs?|lib)?$/i);

  if (match) {
    const value = Number.parseFloat(match[1].replace(',', '.'));
    if (Number.isFinite(value)) {
      const sourceIsLb = /^lb|^lib/i.test(match[2] ?? '');
      const converted = unit === 'lb'
        ? (sourceIsLb ? value : value * KG_TO_LB)
        : (sourceIsLb ? value / KG_TO_LB : value);
      return `${round1(converted)}${unit}${suffix}`;
    }
  }

  if (/(kg|lbs?|lib)$/i.test(core)) return `${core}${suffix}`;
  return `${core}${unit}${suffix}`;
}

/** Converte uma velocidade em km/h para a unidade escolhida. */
export function formatSpeed(value: string | number | null | undefined): string {
  if (value === null || value === undefined || value === '') return '--';
  const unit = getDistanceUnit();
  const numeric = typeof value === 'number'
    ? value
    : Number.parseFloat(String(value).replace(',', '.'));

  if (!Number.isFinite(numeric)) return `${value} ${getSpeedUnitLabel(unit)}`;
  return `${convertSpeedValue(numeric, unit)} ${getSpeedUnitLabel(unit)}`;
}

/** Velocidade convertida (sem unidade) para exibição em cards com rótulo fixo. */
export function convertSpeedValue(
  value: string | number | null | undefined,
  unit: DistanceUnit = getDistanceUnit()
): string {
  if (value === null || value === undefined || value === '') return '--';
  const numeric = typeof value === 'number'
    ? value
    : Number.parseFloat(String(value).replace(',', '.'));
  if (!Number.isFinite(numeric)) return String(value);
  return String(round1(unit === 'mi' ? numeric * 0.621371 : numeric));
}

/* ── Treino ── */

export function isTimerSoundEnabled(): boolean {
  return read(APP_PREF_KEYS.timerSound) !== 'false';
}

export function setTimerSoundEnabled(enabled: boolean): void {
  write(APP_PREF_KEYS.timerSound, String(enabled));
  notifyChange();
}

export function isFocusModeDefault(): boolean {
  return read(APP_PREF_KEYS.focusDefault) === 'true';
}

export function setFocusModeDefault(enabled: boolean): void {
  write(APP_PREF_KEYS.focusDefault, String(enabled));
  notifyChange();
}

/**
 * Aviso sonoro de fim do descanso entre séries — idêntico ao `playBeep()` da
 * versão legacy (Legacy/JS/treino/secao-ficha.js L732–750): um bipe único de
 * 800 Hz (seno) com decaimento de 0,5 s + vibração [200, 100, 200] quando o
 * dispositivo suporta. Respeita a preferência e nunca lança em navegadores sem
 * Web Audio.
 */
export function playRestTimerSound(): void {
  if (!isTimerSoundEnabled()) return;
  if (typeof window === 'undefined') return;

  try {
    const Ctor =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return;

    const ctx = new Ctor();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, ctx.currentTime);
    gain.gain.setValueAtTime(0.5, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.5);

    if (navigator.vibrate) {
      navigator.vibrate([200, 100, 200]);
    }

    window.setTimeout(() => {
      void ctx.close().catch(() => {});
    }, 700);
  } catch {
    /* áudio bloqueado sem gesto do usuário */
  }
}
