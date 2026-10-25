/**
 * SettingsFeature.tsx — Grupo "Configurações" reutilizável (v4.5.0)
 *
 * v4.5.0: reorganização do hub de Configurações no estilo do
 * SettingsStandalone.tsx de referência (tipografia atual mantida):
 *
 *   • conta       → grupo "Sua Conta" (informações, senha, exportar/
 *                   restaurar backup, desativar conta);
 *   • seguranca   → "Segurança e Acesso à Conta" (bloqueio do app,
 *                   biometria, inatividade, wallpaper de bloqueio e
 *                   dispositivos — placeholders com prefs salvas);
 *   • notificacoes→ "Notificações" (lembrete de treino placeholder +
 *                   mensagens motivacionais real);
 *   • cores       → "Esquema de Cores e Personalização" (12 presets +
 *                   personalizado + ColorPickerModal);
 *   • exibicao    → "Acessibilidade, Exibição e PWA" (tela cheia,
 *                   cronômetro, navbar, PWA, interação e modo dev);
 *   • rootExtra   → linha vermelha "Sair da Conta" (placeholder);
 *   • tile "Assinatura" removido.
 *
 * Cores aplicadas globalmente via theme-colors.ts (variáveis --primary*).
 */

import { useEffect, useRef, useState, type ReactNode } from 'react';
/* v4.13.0 — ícone do opt "Só no Botão" (fonte autorizada Diretrizes/Ícones.md §11) */
import { MousePointerClick } from 'lucide-react';
import { useProfileState } from '@/features/profile/useProfileState';
import { PREF_KEYS, readLS, writeLS } from '@/features/profile/profile-data';
import { exportBackupData, importBackupFile } from '@/features/profile/backup';
import { showToast } from '@/lib/toast';
import {
  CUSTOM_THEME_ID,
  DEFAULT_HEX,
  THEME_HEX_KEY,
  THEME_PRESETS,
  activeThemeHex,
  applyCustomTheme,
  applySavedTheme,
  applyThemeColor,
  applyThemePreset,
  normalizeHex,
  themeDisplayName,
} from './theme-colors';
import { ColorPickerModal } from './ColorPickerModal';
import { getInstallState, promptInstall, type InstallState } from '@/lib/pwa-install';
/* v4.18.0-music — música de fundo (MAIN.mp3) com prefs de ligar/volume */
import {
  getMusicVolume,
  isMusicEnabled,
  setMusicEnabled,
  setMusicVolume,
} from '@/lib/background-music';
import { WALL_PRESETS } from '@/features/lock/lock-wallpapers';
import {
  getDistanceUnit,
  getFirstDayOfWeek,
  getWeightUnit,
  isFocusModeDefault,
  isTimerSoundEnabled,
  setDistanceUnit,
  setFirstDayOfWeek,
  setFocusModeDefault,
  setTimerSoundEnabled,
  setWeightUnit,
  type DistanceUnit,
  type FirstDayOfWeek,
  type WeightUnit,
} from '@/lib/app-prefs';
/* v4.22.0 — preferências do miniplayer (modo fixo/flexível) */
import {
  getDrawerThickness,
  getDrawerVpHeight,
  getPlayerDrawer,
  getPlayerEnabled,
  getPlayerHideSecs,
  getPlayerMode,
  getPlayerPersist,
  getPlayerPos,
  PLAYER_POSITIONS,
  setDrawerThickness,
  setDrawerVpHeight,
  setPlayerDrawer,
  setPlayerEnabled,
  setPlayerHideSecs,
  setPlayerMode,
  setPlayerPersist,
  setPlayerPos,
  type PlayerMode,
  type PlayerPersist,
  type PlayerPos,
} from '@/features/music/player-prefs';
import {
  clearBiometric,
  clearPin,
  getPinLength,
  lockApp,
  lockPrefsChanged,
  registerBiometric,
  savePin,
} from '@/features/lock/lock-store';
import type { HubScreen, HubTile } from './HubShell';
import { SyncSettingsPanel } from '@/features/sync/SyncSettingsPanel';
import { ScreensCustomizationPanel } from '@/features/sync/ScreensCustomizationPanel';
import { ConnectedDevices } from '@/features/sync/ConnectedDevices';
import { useAuthModalStore } from '@/features/auth/auth-modal-store';
import { useAuth } from '@/core/auth/use-auth';
import { supabase, isSupabaseConfigured } from '@/core/supabase';
import { isSyncConfigured, getSyncKey } from '@/core/sync/supabase-client';
import { ProfileEmblem } from '@/components/ProfileEmblem';
import './settings.css';

export interface SettingsGroupProps {
  devMode: boolean;
  onToggleDevMode: (checked: boolean) => void;
}

export interface SettingsGroup {
  tiles: HubTile[];
  screens: Record<string, HubScreen>;
  /** Bloco sob os tiles da raiz do grupo (linha "Sair da Conta") */
  rootExtra: ReactNode;
  /** Botão Backup do header do grupo */
  headerActions: ReactNode;
  /** Modais + input de arquivo (renderizar fora do HubShell) */
  modals: ReactNode;
}

/* ── Ícones SVG stroke (Diretrizes/Ícones.md) ── */

const SvgPalette = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="20" height="20">
    <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.93 0 1.65-.75 1.65-1.69 0-.44-.18-.83-.44-1.12-.29-.29-.44-.65-.44-1.13a1.64 1.64 0 0 1 1.67-1.67h2c3.05 0 5.56-2.5 5.56-5.55C21.97 6.01 17.46 2 12 2z" />
    <circle cx="13.5" cy="6.5" r="0.6" />
    <circle cx="17.5" cy="10.5" r="0.6" />
    <circle cx="8.5" cy="7.5" r="0.6" />
    <circle cx="6.5" cy="12.5" r="0.6" />
  </svg>
);

const SvgSliders = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="20" height="20">
    <line x1="4" y1="6" x2="20" y2="6" />
    <line x1="4" y1="12" x2="20" y2="12" />
    <line x1="4" y1="18" x2="20" y2="18" />
    <circle cx="9" cy="6" r="2" />
    <circle cx="15" cy="12" r="2" />
    <circle cx="8" cy="18" r="2" />
  </svg>
);

const SvgLock = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="20" height="20">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

const SvgShield = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="20" height="20">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
);

/* Olho mostrar/ocultar senha da tela de Segurança (v4.9.0-sync) */
const SvgEye = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="17" height="17">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const SvgUser20 = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="20" height="20">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const SvgDatabase = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
    <ellipse cx="12" cy="5" rx="9" ry="3" />
    <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
    <path d="M3 12c0 1.66 4 3 9 3s9-1.34 9-3" />
  </svg>
);

const SvgDownload = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="14" height="14">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </svg>
);

const SvgUpload = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="14" height="14">
    <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
    <polyline points="16 6 12 2 8 6" />
    <line x1="12" y1="2" x2="12" y2="15" />
  </svg>
);

const SvgDownload20 = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="20" height="20">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </svg>
);

const SvgUpload20 = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="20" height="20">
    <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
    <polyline points="16 6 12 2 8 6" />
    <line x1="12" y1="2" x2="12" y2="15" />
  </svg>
);

const SvgCheck = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="14" height="14">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const SvgTimer = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="22" height="22">
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

/* v4.44.0 — Preferências do App */
const SvgGear = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="20" height="20">
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </svg>
);

const SvgCalendar = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="19" height="19">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);

const SvgDumbbell = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="19" height="19">
    <path d="m6.5 6.5 11 11" />
    <path d="m21 21-1.5-1.5" />
    <path d="m3 3 1.5 1.5" />
    <path d="m18 22 4-4" />
    <path d="m2 6 4-4" />
    <path d="m3 10 7-7" />
    <path d="m14 21 7-7" />
  </svg>
);

const SvgRoute = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="19" height="19">
    <circle cx="6" cy="19" r="3" />
    <path d="M9 19h8.5a3.5 3.5 0 0 0 0-7h-11a3.5 3.5 0 0 1 0-7H15" />
    <circle cx="18" cy="5" r="3" />
  </svg>
);

const SvgTarget = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
    <circle cx="12" cy="12" r="10" />
    <circle cx="12" cy="12" r="6" />
    <circle cx="12" cy="12" r="2" />
  </svg>
);

const SvgMegaphone = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
    <path d="m3 11 18-5v12L3 14v-3z" />
    <path d="M11.6 16.8a3 3 0 1 1-5.8-1.6" />
  </svg>
);

const SvgTrophy = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
    <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
    <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
    <path d="M4 22h16" />
    <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
    <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
    <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
  </svg>
);

const SvgChevronRightSm = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
    <polyline points="9 18 15 12 9 6" />
  </svg>
);

const SvgHourglass = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="22" height="22">
    <path d="M5 2h14" />
    <path d="M5 22h14" />
    <path d="M17 2v4a5 5 0 0 1-5 5 5 5 0 0 1-5-5V2" />
    <path d="M17 22v-4a5 5 0 0 0-5-5 5 5 0 0 0-5 5v4" />
  </svg>
);

const SvgPin = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="22" height="22">
    <path d="M12 17v5" />
    <path d="M9 10.8V7a3 3 0 0 1 6 0v3.8" />
    <path d="M5 11h14v2a7 7 0 0 1-7 7 7 7 0 0 1-7-7v-2z" />
  </svg>
);

const SvgScrollY = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="22" height="22">
    <path d="m21 16-4 4-4-4" />
    <path d="M17 20V4" />
    <path d="m3 8 4-4 4 4" />
    <path d="M7 4v16" />
  </svg>
);

/* v4.8.3-navbars — formato da barra inferior (reta / oval) */
const SvgBarStraight = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="22" height="22">
    <path d="M3 16h18" />
    <path d="M6 12V8" />
    <path d="M12 12V8" />
    <path d="M18 12V8" />
  </svg>
);

const SvgBarCurve = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="22" height="22">
    <path d="M3 14c3-6 15-6 18 0" />
    <path d="M6 11V8" />
    <path d="M12 9.5V7" />
    <path d="M18 11V8" />
  </svg>
);

const SvgMaximize = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
    <polyline points="15 3 21 3 21 9" />
    <polyline points="9 21 3 21 3 15" />
    <line x1="21" y1="3" x2="14" y2="10" />
    <line x1="3" y1="21" x2="10" y2="14" />
  </svg>
);

const SvgVolume = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
    <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
    <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
  </svg>
);

const SvgVibrate = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
    <path d="M12 2a10 10 0 1 0 10 10" />
    <path d="M12 6v6l4 2" />
  </svg>
);

const SvgChat = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
);

const SvgGlobe = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
    <circle cx="12" cy="12" r="10" />
    <line x1="2" y1="12" x2="22" y2="12" />
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
  </svg>
);

const SvgCode = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
    <polyline points="16 18 22 12 16 6" />
    <polyline points="8 6 2 12 8 18" />
  </svg>
);

const SvgUser = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="14" height="14">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const SvgMail = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="14" height="14">
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
    <polyline points="22,6 12,13 2,6" />
  </svg>
);

const SvgLockSm = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="14" height="14">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

const SvgBell = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="20" height="20">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
  </svg>
);

const SvgBan = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="20" height="20">
    <circle cx="12" cy="12" r="10" />
    <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
  </svg>
);

const SvgLogOut = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <polyline points="16 17 21 12 16 7" />
    <line x1="21" y1="12" x2="9" y2="12" />
  </svg>
);

/* v4.9.0-sync — entrada (login na nuvem) */
const SvgLogIn = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
    <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
    <polyline points="10 17 15 12 10 7" />
    <line x1="15" y1="12" x2="3" y2="12" />
  </svg>
);

const SvgFingerprint = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
    <path d="M12 10a2 2 0 0 0-2 2c0 1.02-.1 2.51-.26 4" />
    <path d="M14 13.12c0 2.38 0 6.38-1 8.88" />
    <path d="M17.29 21.02c.12-.6.43-2.3.5-3.02" />
    <path d="M2 12a10 10 0 0 1 18-6" />
    <path d="M2 16h.01" />
    <path d="M21.8 16c.2-2 .131-5.354 0-6" />
    <path d="M5 19.5C5.5 18 6 15 6 12a6 6 0 0 1 .34-2" />
    <path d="M8.65 22c.21-.66.45-1.32.57-2" />
    <path d="M9 6.8a6 6 0 0 1 9 5.2v2" />
  </svg>
);

const SvgSmartphone = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
    <rect x="7" y="2" width="10" height="20" rx="2" ry="2" />
    <line x1="12" y1="18" x2="12.01" y2="18" />
  </svg>
);

const SvgLaptop = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
    <path d="M20 16V7a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v9" />
    <path d="M2 16h20" />
  </svg>
);

const SvgPlay = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="14" height="14">
    <polygon points="5 3 19 12 5 21 5 3" />
  </svg>
);

/* WALL_PRESETS agora vem de @/features/lock/lock-wallpapers (v4.6.0-shell —
   fonte única compartilhada com a tela de bloqueio). */

const LOCK_PREF_MAP = {
  enabled: 'appLockEnabled',
  biometric: 'appLockBiometric',
  /* v4.13.0 — solicitação automática da biometria (default 'true') */
  bioAuto: 'appLockBioAuto',
  timeout: 'appLockTimeout',
  wallV: 'lockWallVertical',
  wallH: 'lockWallHorizontal',
  reminder: 'workoutReminder',
  reminderTime: 'workoutReminderTime',
} as const;

type LockKey = keyof typeof LOCK_PREF_MAP;
type LockState = Record<LockKey, string>;

/**
 * Hook que concentra estado/handlers das configurações e devolve os blocos
 * prontos para o hub do Perfil embutir como o grupo "Configurações".
 */
export function useSettingsGroup({ devMode, onToggleDevMode }: SettingsGroupProps): SettingsGroup {
  const { state: profile, update } = useProfileState();

  /* v4.9.0-sync — sessão Supabase + modal de login */
  const { user } = useAuth();
  const openAuthModal = useAuthModalStore((s) => s.openModal);
  const cloudConfigured = isSyncConfigured() || isSupabaseConfigured;

  /* Cor de destaque — localStorage é a fonte da verdade */
  const [themeKey, setThemeKey] = useState(() => readLS('academia_theme') || 'purple');
  const [customHex, setCustomHex] = useState(
    () => normalizeHex(readLS(THEME_HEX_KEY) || '') || DEFAULT_HEX
  );
  const [pickerOpen, setPickerOpen] = useState(false);

  /* v4.44.0 — Preferências do App (unidades, semana, treino e avisos) */
  const [firstDay, setFirstDayState] = useState<FirstDayOfWeek>(() => getFirstDayOfWeek());
  const [weightUnit, setWeightUnitState] = useState<WeightUnit>(() => getWeightUnit());
  const [distanceUnit, setDistanceUnitState] = useState<DistanceUnit>(() => getDistanceUnit());
  const [openPref, setOpenPref] = useState<string | null>(null);
  const [language, setLanguage] = useState(() => readLS('academia_lang') || 'pt');
  const [timerSound, setTimerSoundState] = useState(() => isTimerSoundEnabled());
  const [focusDefault, setFocusDefaultState] = useState(() => isFocusModeDefault());

  const [timerStyle, setTimerStyle] = useState(() => readLS('timerStyle') || 'radar');
  const [navbarMode, setNavbarMode] = useState<string>(
    () => readLS(PREF_KEYS.navbarMode) || 'fixed'
  );
  /* v4.8.3-navbars — formato visual da barra inferior mobile */
  const [navbarShape, setNavbarShape] = useState<string>(
    () => readLS(PREF_KEYS.navbarShape) || 'straight'
  );
  const [autoFullscreen, setAutoFullscreen] = useState(
    () => readLS(PREF_KEYS.autoFullscreen) === 'true'
  );
  /* v4.18.0-music — estado da música de fundo (espelha lib/background-music) */
  const [musicEnabled, setMusicEnabledState] = useState(() => isMusicEnabled());
  const [musicVolume, setMusicVolumeState] = useState(() => getMusicVolume());
  /* v4.19.0-music — faixas do site durante o treino (padrão ligado) */
  const [workoutMusic, setWorkoutMusicState] = useState(
    () => readLS(PREF_KEYS.workoutMusic) !== 'false'
  );
  /* v4.22.0 — miniplayer: modo (flexível/fixo), posição fixa e visibilidade */
  const [playerEnabled, setPlayerEnabledState] = useState(() => getPlayerEnabled());
  const [playerMode, setPlayerModeState] = useState<PlayerMode>(() => getPlayerMode());
  const [playerPos, setPlayerPosState] = useState<PlayerPos>(() => getPlayerPos());
  const [playerPersist, setPlayerPersistState] = useState<PlayerPersist>(() => getPlayerPersist());
  const [playerSecs, setPlayerSecsState] = useState<number>(() => getPlayerHideSecs());
  /* v4.24.0 — gaveta (barra deslizante que abre o player minimizado) */
  const [drawerOn, setDrawerOnState] = useState(() => getPlayerDrawer() === 'on');
  const [drawerThick, setDrawerThickState] = useState<number>(() => getDrawerThickness());
  const [drawerVp, setDrawerVpState] = useState<number>(() => getDrawerVpHeight());
  /* Instalação PWA — estado sincronizado com os eventos do lib/pwa-install */
  const [installState, setInstallState] = useState<InstallState>(() => getInstallState());
  useEffect(() => {
    const syncInstall = () => setInstallState(getInstallState());
    window.addEventListener('academia:pwa-install-available', syncInstall);
    window.addEventListener('academia:pwa-installed', syncInstall);
    window.addEventListener('appinstalled', syncInstall);
    return () => {
      window.removeEventListener('academia:pwa-install-available', syncInstall);
      window.removeEventListener('academia:pwa-installed', syncInstall);
      window.removeEventListener('appinstalled', syncInstall);
    };
  }, []);
  const [prefs, setPrefs] = useState(() => ({
    sounds: readLS(PREF_KEYS.sounds) !== 'false',
    vibration: readLS(PREF_KEYS.vibration) !== 'false',
    messages: readLS(PREF_KEYS.messages) !== 'false',
    online: readLS(PREF_KEYS.online) === 'true',
    notifications: readLS(PREF_KEYS.notifications) === 'true',
    notifyUpdates: readLS(PREF_KEYS.notifyUpdates) === 'true',
    notifyLeagues: readLS(PREF_KEYS.notifyLeagues) === 'true',
  }));

  /* v4.44.0 — mantém a UI alinhada quando as preferências chegam do sync. */
  useEffect(() => {
    const syncPrefs = () => {
      setFirstDayState(getFirstDayOfWeek());
      setWeightUnitState(getWeightUnit());
      setDistanceUnitState(getDistanceUnit());
      setTimerSoundState(isTimerSoundEnabled());
      setFocusDefaultState(isFocusModeDefault());
      setPrefs((current) => ({
        ...current,
        notifications: readLS(PREF_KEYS.notifications) === 'true',
        notifyUpdates: readLS(PREF_KEYS.notifyUpdates) === 'true',
        notifyLeagues: readLS(PREF_KEYS.notifyLeagues) === 'true',
      }));
    };
    window.addEventListener('academia:prefs-changed', syncPrefs);
    return () => window.removeEventListener('academia:prefs-changed', syncPrefs);
  }, []);

  /* Segurança/Notificações — prefs salvas; o Bloqueio do App passou a ter
     efeito real na v4.6.0-shell (PIN + inatividade + biometria fake). */
  const [lock, setLock] = useState<LockState>(() => ({
    enabled: readLS(PREF_KEYS.appLockEnabled) === 'true' ? 'true' : 'false',
    biometric: readLS(PREF_KEYS.appLockBiometric) === 'true' ? 'true' : 'false',
    /* Ausente = 'true' — mantém o comportamento atual (auto ao entrar). */
    bioAuto: readLS(PREF_KEYS.appLockBioAuto) === 'false' ? 'false' : 'true',
    timeout: readLS(PREF_KEYS.appLockTimeout) || '300',
    wallV: readLS(PREF_KEYS.lockWallVertical) || 'neon',
    wallH: readLS(PREF_KEYS.lockWallHorizontal) || 'grafite',
    reminder: readLS(PREF_KEYS.workoutReminder) === 'true' ? 'true' : 'false',
    reminderTime: readLS(PREF_KEYS.workoutReminderTime) || '18:00',
  }));

  /* v4.6.0-shell / v4.9.0-sync — fluxo da senha de bloqueio local
     (alfanumérica, 4–32 caracteres) */
  const [pinLen, setPinLen] = useState(() => getPinLength());
  const [pinFormOpen, setPinFormOpen] = useState(false);
  const [pinDraft, setPinDraft] = useState('');
  const [pinConfirm, setPinConfirm] = useState('');
  const [pinError, setPinError] = useState('');
  const [showPinDraft, setShowPinDraft] = useState(false);
  const [showPinConfirm, setShowPinConfirm] = useState(false);

  /* Campos de segurança (init único quando o estado carrega) */
  const [sec, setSec] = useState({ nome: '', handle: '', email: '', senha: '', photo: '' });
  const [showAvatarDropdown, setShowAvatarDropdown] = useState(false);
  const secInitedRef = useRef(false);
  useEffect(() => {
    if (!profile || secInitedRef.current) return;
    secInitedRef.current = true;
    const p = profile.customization;
    setSec({ nome: p.nome || '', handle: p.handle || '', email: p.email || user?.email || '', senha: '', photo: p.photo || '' });
  }, [profile, user?.email]);

  /* Preenche campos que chegam depois do mount (ex.: e-mail/foto da conta
     Google sincronizados pelo App) sem sobrescrever o que o usuário digitou. */
  const profileEmail = profile?.customization.email;
  const profilePhoto = profile?.customization.photo;
  useEffect(() => {
    if (!profileEmail && !profilePhoto && !user?.email) return;
    setSec((s) => {
      const email = s.email || profileEmail || user?.email || '';
      const photo = s.photo || profilePhoto || '';
      return email === s.email && photo === s.photo ? s : { ...s, email, photo };
    });
  }, [profileEmail, profilePhoto, user?.email]);

  /* Backup */
  const fileRef = useRef<HTMLInputElement>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);

  /* ── Handlers ── */

  const selectPreset = (id: string) => {
    applyThemePreset(id);
    setThemeKey(id);
  };

  const selectTimer = (value: string) => {
    writeLS('timerStyle', value);
    setTimerStyle(value);
    window.dispatchEvent(new CustomEvent('academia:timer-style-changed'));
  };

  const selectNavbarMode = (value: string) => {
    writeLS(PREF_KEYS.navbarMode, value);
    setNavbarMode(value);
    window.dispatchEvent(new CustomEvent('academia:navbar-mode-changed'));
  };

  const selectNavbarShape = (value: string) => {
    writeLS(PREF_KEYS.navbarShape, value);
    setNavbarShape(value);
    window.dispatchEvent(new CustomEvent('academia:navbar-shape-changed'));
  };

  const toggleAutoFullscreen = (checked: boolean) => {
    writeLS(PREF_KEYS.autoFullscreen, String(checked));
    setAutoFullscreen(checked);
    window.dispatchEvent(new CustomEvent('academia:auto-fullscreen-changed'));
  };

  /* v4.18.0-music — handlers da música de fundo (persistência + player) */
  const toggleMusic = (checked: boolean) => {
    setMusicEnabledState(checked);
    setMusicEnabled(checked);
  };

  const changeMusicVolume = (value: number) => {
    setMusicVolumeState(value);
    setMusicVolume(value);
  };

  /* v4.19.0-music — faixas do site durante o treino (pref + re-render) */
  const toggleWorkoutMusic = (checked: boolean) => {
    setWorkoutMusicState(checked);
    writeLS(PREF_KEYS.workoutMusic, String(checked));
    // Notifica (em tempo real) os consumidores — ex.: WorkoutNowPlayingBar no
    // rodapé da Ficha — para sumir/aparecer conforme a opção.
    window.dispatchEvent(new CustomEvent('academia:music-changed'));
  };

  /* v4.22.0 — handlers do miniplayer (prefs + re-render em sessão) */
  /* v4.28.0 — interruptor mestre do widget (padrão desligado). */
  const changePlayerEnabled = (on: boolean) => {
    setPlayerEnabledState(on);
    setPlayerEnabled(on);
  };
  const changePlayerMode = (m: PlayerMode) => {
    setPlayerModeState(m);
    setPlayerMode(m);
  };
  const changePlayerPos = (p: PlayerPos) => {
    setPlayerPosState(p);
    setPlayerPos(p);
  };
  const changePlayerPersist = (p: PlayerPersist) => {
    setPlayerPersistState(p);
    setPlayerPersist(p);
  };
  const changePlayerSecs = (secs: number) => {
    const clamped = Math.min(60, Math.max(3, Math.round(secs)));
    setPlayerSecsState(clamped);
    setPlayerHideSecs(clamped);
  };
  /* v4.24.0 — gaveta */
  const changeDrawerOn = (on: boolean) => {
    setDrawerOnState(on);
    setPlayerDrawer(on ? 'on' : 'off');
  };
  const changeDrawerThick = (px: number) => {
    const clamped = Math.min(14, Math.max(3, Math.round(px)));
    setDrawerThickState(clamped);
    setDrawerThickness(clamped);
  };
  const changeDrawerVp = (pct: number) => {
    const clamped = Math.min(100, Math.max(0.5, Math.round(pct * 2) / 2));
    setDrawerVpState(clamped);
    setDrawerVpHeight(clamped);
  };

  const handleInstallApp = async () => {
    const result = await promptInstall();
    if (result === 'accepted') {
      showToast('App instalado com sucesso!', 'success');
      setInstallState(getInstallState());
    } else if (result === 'dismissed') {
      showToast('Instalação cancelada.', 'info');
    } else {
      showToast(
        'Instalação indisponível aqui. Use o menu do navegador → "Instalar aplicativo" ou "Adicionar à tela inicial".',
        'info'
      );
    }
  };

  const togglePref = (key: keyof typeof prefs, checked: boolean) => {
    setPrefs((p) => ({ ...p, [key]: checked }));
    writeLS(PREF_KEYS[key], String(checked));
    window.dispatchEvent(new CustomEvent('academia:prefs-changed'));
  };

  /* v4.44.0 — Preferências do App: unidades, semana, treino e tema */
  const changeFirstDay = (value: FirstDayOfWeek) => {
    setFirstDayOfWeek(value);
    setFirstDayState(value);
    showToast(
      `Semana começa em ${value === 'monday' ? 'segunda-feira' : 'domingo'}.`,
      'success'
    );
  };

  const changeWeightUnit = (value: WeightUnit) => {
    setWeightUnit(value);
    setWeightUnitState(value);
    showToast(`Unidade de peso: ${value === 'kg' ? 'quilogramas (kg)' : 'libras (lb)'}.`, 'success');
  };

  const changeDistanceUnit = (value: DistanceUnit) => {
    setDistanceUnit(value);
    setDistanceUnitState(value);
    showToast(`Unidade de distância: ${value === 'km' ? 'quilômetros (km)' : 'milhas (mi)'}.`, 'success');
  };

  const changeLanguage = (value: string) => {
    writeLS('academia_lang', value);
    setLanguage(value);
    window.dispatchEvent(new CustomEvent('academia:prefs-changed'));
    showToast(`Idioma definido como ${value === 'pt' ? 'Português' : 'English'}.`, 'success');
  };

  const toggleTimerSound = (checked: boolean) => {
    setTimerSoundEnabled(checked);
    setTimerSoundState(checked);
  };

  const toggleFocusDefault = (checked: boolean) => {
    setFocusModeDefault(checked);
    setFocusDefaultState(checked);
  };

  const toggleNotifications = async (checked: boolean) => {
    if (!checked) {
      togglePref('notifications', false);
      return;
    }
    if (typeof Notification === 'undefined') {
      togglePref('notifications', true);
      showToast('Notificações simuladas ativadas!', 'info');
      return;
    }
    if (Notification.permission === 'granted') {
      togglePref('notifications', true);
      showToast('Permissão de notificações já concedida!', 'success');
      return;
    }
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      togglePref('notifications', true);
      showToast('Permissão de notificações concedida!', 'success');
    } else {
      togglePref('notifications', false);
      showToast('Permissão negada nas preferências do navegador.', 'error');
    }
  };

  const updateLock = (key: LockKey, value: string) => {
    setLock((l) => ({ ...l, [key]: value }));
    writeLS(PREF_KEYS[LOCK_PREF_MAP[key]], value);
    /* v4.6.0-shell: re-arma o timer de inatividade e o estado do lock */
    lockPrefsChanged();

    /* Ligar o bloqueio sem senha definida → abre a criação da senha na hora */
    if (key === 'enabled' && value === 'true' && getPinLength() === 0) {
      setPinFormOpen(true);
      setPinError('');
    }
    /* Desligar → o app destrava (e o formulário de PIN fecha) */
    if (key === 'enabled' && value === 'false') {
      setPinFormOpen(false);
    }
  };

  /* ── Senha de bloqueio local: cria/altera/remove (v4.6.0-shell) ── */

  const resetPinForm = () => {
    setPinDraft('');
    setPinConfirm('');
    setPinError('');
    setPinFormOpen(false);
    setShowPinDraft(false);
    setShowPinConfirm(false);
  };

  const submitPin = () => {
    /* v4.9.0-sync — senha alfanumérica: letras/números/símbolos são aceitos
       (antes o replace(/\D/g) descartava letras e a senha "não salvava"). */
    const pw = pinDraft.trim();
    if (pw.length < 4 || pw.length > 32) {
      setPinError('Use de 4 a 32 caracteres (letras, números e símbolos).');
      return;
    }
    if (pw !== pinConfirm.trim()) {
      setPinError('As senhas não coincidem.');
      return;
    }
    savePin(pw);
    setPinLen(pw.length);
    writeLS(PREF_KEYS.appLockEnabled, 'true');
    setLock((l) => ({ ...l, enabled: 'true' }));
    lockPrefsChanged();
    resetPinForm();
    showToast(
      pinLen > 0 ? 'Senha alterada com sucesso.' : 'Bloqueio ativado! O app pedirá a senha ao abrir.',
      'success'
    );
  };

  const removePin = () => {
    clearPin();
    setPinLen(0);
    writeLS(PREF_KEYS.appLockEnabled, 'false');
    setLock((l) => ({ ...l, enabled: 'false' }));
    lockPrefsChanged();
    resetPinForm();
    showToast('Senha removida — bloqueio do app desativado.', 'info');
  };

  const saveSecurityField = async (
    field: 'nome' | 'handle' | 'email' | 'senha' | 'photo',
    value: string
  ) => {
    await update((d) => {
      d.customization = { ...d.customization, [field]: value };
    });
    showToast('Campo atualizado!', 'success');
    if (field === 'senha') setSec((s) => ({ ...s, senha: '' }));
  };

  const saveAccountInfo = async () => {
    await update((d) => {
      d.customization = {
        ...d.customization,
        nome: sec.nome,
        handle: sec.handle,
        email: sec.email,
        photo: sec.photo,
      };
    });
    showToast('Informações atualizadas!', 'success');
  };

  const handleExport = async () => {
    try {
      const result = await exportBackupData();
      showToast(
        result === 'shared' ? 'Backup compartilhado!' : 'Dados exportados com sucesso!',
        'success'
      );
    } catch (err) {
      console.error(err);
      showToast('Erro ao exportar dados.', 'error');
    }
  };

  const handleImportFile = (file: File) => {
    if (file.size > 20 * 1024 * 1024) {
      showToast('Arquivo muito grande (máx. 20MB).', 'error');
      return;
    }
    setPendingFile(file);
    setConfirmOpen(true);
  };

  const confirmImport = async () => {
    const file = pendingFile;
    setConfirmOpen(false);
    setPendingFile(null);
    if (!file) return;
    try {
      await importBackupFile(file);
      showToast('Importação bem-sucedida! Atualizando interface...', 'success');
      document.dispatchEvent(new CustomEvent('academia:db-ready'));
    } catch (err) {
      console.error('[importData]', err);
      showToast(`Erro ao importar: ${(err as Error).message || 'arquivo inválido.'}`, 'error');
    }
  };

  const cancelImport = () => {
    setConfirmOpen(false);
    setPendingFile(null);
    showToast('Importação cancelada.', 'info');
  };

  /* ── Derivados de UI ── */

  const activeHex = activeThemeHex(themeKey, customHex);
  const handleBadge = profile?.customization.handle || 'Local';

  /* v4.9.0-sync — sai só da sessão nuvem (NÃO limpa o banco local: o
     signOut do AuthProvider chama clearLocalDB, destrutivo no modo sync) */
  const handleSignOut = async () => {
    try {
      if (isSupabaseConfigured) await supabase.auth.signOut();
      showToast('Desconectado da conta nuvem. Seus dados continuam neste dispositivo.', 'info');
    } catch (err) {
      showToast(`Erro ao sair: ${(err as Error).message}`, 'error');
    }
  };

  const wallCard = (kind: 'v' | 'h') => {
    const key: LockKey = kind === 'v' ? 'wallV' : 'wallH';
    const current = WALL_PRESETS.find((p) => p.id === lock[key]) ?? WALL_PRESETS[0];
    return (
      <div className="set-wall-card">
        <div className="set-wall-card__head">
          <span className="set-wall-card__title">
            {kind === 'v' ? SvgSmartphone : SvgLaptop}
            {kind === 'v' ? 'Vertical (9:16)' : 'Horizontal (16:9)'}
          </span>
        </div>
        <div
          className={`set-wall-preview set-wall-preview--${kind}`}
          style={{ background: current.bg }}
        />
        <div className="set-wall-presets">
          {WALL_PRESETS.map((p) => (
            <button
              key={p.id}
              type="button"
              title={p.name}
              aria-label={`Wallpaper ${p.name}`}
              className={`set-wall-dot ${lock[key] === p.id ? 'set-wall-dot--active' : ''}`}
              style={{ background: p.bg }}
              onClick={() => updateLock(key, p.id)}
            />
          ))}
        </div>
      </div>
    );
  };

  /* ── Telas: Sua Conta (grupo) ── */

  const contaTiles: HubTile[] = [
    {
      id: 'informacoes',
      title: 'Informações da Conta',
      desc: 'Nome de exibição, @handle e e-mail',
      icon: SvgUser20,
      keywords: ['informacoes', 'nome', 'handle', 'email', 'usuario', 'perfil'],
    },
    {
      id: 'senha',
      title: 'Alterar Senha da Conta do Usuário',
      desc: 'Senha local de acesso ao perfil',
      icon: SvgLock,
      keywords: ['senha', 'password', 'alterar', 'credencial', 'protecao'],
    },
    /* v4.9.3-settings — atalho "Dispositivos conectados" (reference) */
    {
      id: 'dispositivos',
      title: 'Dispositivos Conectados',
      desc: 'Veja em quais aparelhos ou navegadores sua conta está conectada.',
      icon: SvgLaptop,
      keywords: ['dispositivos', 'conectados', 'aparelhos', 'celular', 'computador'],
    },
    {
      id: 'exportar',
      title: 'Exportar Backup (Baixar .JSON)',
      desc: 'Gere um arquivo com seus dados',
      icon: SvgDownload20,
      keywords: ['exportar', 'backup', 'json', 'baixar', 'download'],
    },
    {
      id: 'restaurar',
      title: 'Restaurar Backup (Upload .JSON)',
      desc: 'Importe um arquivo de backup',
      icon: SvgUpload20,
      keywords: ['restaurar', 'importar', 'upload', 'recuperar', 'backup'],
    },
    {
      id: 'desativar',
      title: 'Desativar Sua Conta',
      desc: 'Desative seu perfil local (em breve)',
      icon: SvgBan,
      keywords: ['desativar', 'excluir', 'deletar', 'remover'],
    },
  ];

  /* ── Tiles raiz do grupo ── */

  const tiles: HubTile[] = [
    {
      id: 'conta',
      title: 'Sua Conta',
      desc: 'Informações da conta, senha, backup e desativação',
      icon: SvgUser20,
      badge: handleBadge,
      keywords: [
        'conta', 'perfil', 'usuario', 'nome', 'handle', 'email', 'senha',
        'backup', 'exportar', 'importar', 'json', 'desativar', 'sair', 'dados',
      ],
    },
    {
      id: 'seguranca',
      title: 'Segurança e Acesso à Conta',
      desc: 'Bloqueio do app, biometria, inatividade e wallpaper',
      icon: SvgShield,
      badge: lock.enabled === 'true' && pinLen > 0 ? 'Bloqueio Ativo' : 'Desativado',
      keywords: [
        'seguranca', 'bloqueio', 'senha', 'pin', 'biometria', 'digital',
        'impressao', 'inatividade', 'wallpaper', 'tela de bloqueio',
        'dispositivos', 'sessoes', 'aparelhos', 'privacidade',
      ],
    },
    /* v4.9.3-settings — tile "Dispositivos conectados" no nível raiz (reference) */
    {
      id: 'dispositivos',
      title: 'Dispositivos Conectados',
      desc: 'Veja e gerencie celulares, computadores e navegadores em que sua conta está ativa.',
      icon: SvgLaptop,
      badge: 'Dispositivos',
      keywords: [
        'dispositivos', 'conectados', 'aparelhos', 'celular', 'computador',
        'navegador', 'sessao', 'sessoes', 'qr', 'pareamento',
      ],
    },
    {
      id: 'preferencias',
      title: 'Preferências do App',
      desc: 'Primeiro dia da semana, unidades de peso e distância, tema, som do temporizador e modo foco',
      icon: SvgGear,
      badge: `${firstDay === 'monday' ? 'Seg' : 'Dom'} · ${weightUnit} · ${distanceUnit}`,
      keywords: [
        'preferencias', 'preferências', 'app', 'geral', 'primeiro dia', 'semana',
        'segunda', 'domingo', 'unidade', 'medida', 'peso', 'kg', 'lb', 'libras',
        'distancia', 'distância', 'km', 'milhas', 'mi', 'tema', 'idioma',
        'som', 'temporizador', 'timer', 'descanso', 'series', 'séries',
        'modo foco', 'foco', 'treino',
      ],
    },
    {
      id: 'notificacoes',
      title: 'Notificações',
      desc: 'Permissão, lembretes de treino, novidades, ligas e mensagens',
      icon: SvgBell,
      badge: prefs.notifications ? 'Ativas' : 'Silenciadas',
      keywords: [
        'notificacoes', 'lembrete', 'treino', 'horario', 'alarme',
        'mensagens', 'motivacionais', 'frases', 'incentivo', 'pwa',
      ],
    },
    {
      id: 'cores',
      title: 'Esquema de Cores e Personalização',
      desc: '12 presets, tom personalizado e seletor avançado',
      icon: SvgPalette,
      badge: themeDisplayName(themeKey),
      keywords: [
        'cor', 'cores', 'tema', 'paleta', 'neon', 'personalizado',
        'esquema', 'seletor', 'identidade', 'visual',
      ],
    },
    {
      id: 'exibicao',
      title: 'Acessibilidade, Exibição e PWA',
      desc: 'Tela cheia, cronômetro, navbar, instalar app e modo dev',
      icon: SvgSliders,
      badge: autoFullscreen ? 'Tela cheia' : 'Padrão',
      keywords: [
        'exibicao', 'acessibilidade', 'tela cheia', 'fullscreen', 'telacheia',
        'pwa', 'instalar', 'app', 'aplicativo', 'install', 'cronometro',
        'timer', 'ampulheta', 'radar', 'navbar', 'barra', 'navegacao',
        'online', 'status', 'dev', 'desenvolvedor',
        'idioma', 'language', 'pt', 'en',
      ],
    },
    /* v4.20.0 — seção própria de áudio (saiu de Exibição) */
    {
      id: 'audio',
      title: 'Áudio e Música',
      desc: 'Música de fundo, faixas do treino, efeitos sonoros e playlists',
      icon: SvgVolume,
      badge: musicEnabled ? (musicVolume > 0 ? `${musicVolume}%` : 'Mudo') : 'Desligada',
      keywords: [
        'audio', 'áudio', 'musica', 'música', 'som', 'sons', 'volume', 'bgm',
        'trilha', 'fundo', 'efeitos', 'sonoros', 'vibracao', 'vibração',
        'treino', 'playlist', 'playlists', 'youtube', 'spotify', 'upload',
        'faixa', 'player', 'músicas',
      ],
    },
    /* v4.10.0 — nuvem movida para dentro de Sua Conta (ProfileFeature);
       telas movida para dentro de Esquema de Cores (abaixo) */
  ];

  const toggleItemsInteraction = [
    {
      key: 'sounds' as const,
      label: 'Efeitos Sonoros',
      desc: 'Sons ao marcar exercícios e conquistas',
      icon: SvgVolume,
    },
    {
      key: 'vibration' as const,
      label: 'Vibração',
      desc: 'Feedback háptico ao interagir',
      icon: SvgVibrate,
    },
    {
      key: 'online' as const,
      label: 'Status Online',
      desc: 'Mostrar sua atividade para amigos',
      icon: SvgGlobe,
    },
  ];

  /* v4.9.0-sync — Entrar (abre o AuthModal) ou Sair (sessão nuvem) */
  const rootExtra = user ? (
    <button type="button" className="set-logout" onClick={() => void handleSignOut()}>
      {SvgLogOut}
      <span className="set-logout__body">
        <span className="set-logout__title">Sair da Conta</span>
        <span className="set-logout__desc">
          {user.email || 'Conta nuvem'} • desconecta a sessão (dados locais mantidos)
        </span>
      </span>
    </button>
  ) : (
    <button type="button" className="set-logout" onClick={() => openAuthModal()}>
      {SvgLogIn}
      <span className="set-logout__body">
        <span className="set-logout__title">Entrar</span>
        <span className="set-logout__desc">
          Sincronize seus dados na nuvem em todos os aparelhos
        </span>
      </span>
    </button>
  );

  const headerActions = (
    <button
      type="button"
      className="set-btn"
      title="Exportar backup JSON"
      onClick={() => void handleExport()}
    >
      {SvgDownload}
      Backup
    </button>
  );

  const screens: Record<string, HubScreen> = {
    /* ================= SUA CONTA (GRUPO) ================= */
    conta: {
      eyebrow: 'ACADEMIA • CONTA',
      title: 'Sua Conta',
      headerActions,
      tiles: contaTiles,
      screens: {
        informacoes: {
          title: 'Informações da Conta',
          content: (
            <>
              {/* v4.9.3-settings — Integração Google (reference) */}
              <section className="set-card">
                <div className="set-card__head">
                  <div>
                    <div className="set-card__eyebrow">INTEGRAÇÃO</div>
                    <h3 className="set-card__title">Integração Google</h3>
                    <p className="set-card__desc">
                      Conecte sua conta Google para sincronizar seus dados de perfil.
                    </p>
                  </div>
                </div>
                {user ? (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ width: 36, height: 36, borderRadius: 12, background: 'rgba(var(--primary-rgb, 249, 115, 22), 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {SvgLogIn}
                      </div>
                      <div>
                        <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)' }}>{user.email || 'Usuário Google'}</p>
                        <p style={{ fontSize: 10, color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono, monospace)' }}>Conta conectada</p>
                      </div>
                    </div>
                    <button type="button" className="set-btn" onClick={() => void handleSignOut()}>
                      Desconectar
                    </button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                      Conecte sua conta do Google para sincronizar seus dados de perfil e acessos.
                    </p>
                    <button type="button" className="set-btn set-btn--primary" onClick={() => openAuthModal()}>
                      {SvgLogIn}
                      Conectar Google
                    </button>
                  </div>
                )}
              </section>

              {/* v4.9.3-settings — Customizador de Foto de Perfil (reference) */}
              <section className="set-card">
                <div className="set-card__head">
                  <div>
                    <div className="set-card__eyebrow">FOTO DE PERFIL</div>
                    <h3 className="set-card__title">Foto de Perfil</h3>
                    <p className="set-card__desc">
                      Personalize sua foto de perfil com URL, presets ou upload.
                    </p>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                  <div style={{ width: 64, height: 64, borderRadius: 16, overflow: 'hidden', border: '1px solid rgba(63, 63, 70, 0.8)', flexShrink: 0 }}>
                    <ProfileEmblem
                      customization={
                        profile?.customization
                          ? { ...profile.customization, photo: sec.photo }
                          : null
                      }
                    />
                  </div>
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <input
                      type="url"
                      className="set-input"
                      placeholder="URL da imagem ou cole aqui..."
                      value={sec.photo || ''}
                      onChange={(e) => setSec((s) => ({ ...s, photo: e.target.value }))}
                    />
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, fontSize: 10 }}>
                      <button
                        type="button"
                        style={{ background: 'transparent', border: 0, color: 'var(--primary, #f97316)', fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-mono, monospace)' }}
                        onClick={() => setShowAvatarDropdown((v) => !v)}
                      >
                        {showAvatarDropdown ? 'Fechar presets' : 'Escolher presets'}
                      </button>
                      <span style={{ color: 'var(--text-tertiary)' }}>•</span>
                      <label style={{ color: 'var(--text-secondary)', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'var(--font-mono, monospace)' }}>
                        {SvgUpload}
                        <span>Carregar Arquivo</span>
                        <input
                          type="file"
                          accept="image/*"
                          style={{ display: 'none' }}
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onloadend = () => {
                                if (typeof reader.result === 'string') {
                                  setSec((s) => ({ ...s, photo: reader.result as string }));
                                }
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                        />
                      </label>
                    </div>
                    <button
                      type="button"
                      className="set-btn"
                      style={{ alignSelf: 'flex-start' }}
                      onClick={() => void saveSecurityField('photo', sec.photo)}
                    >
                      Salvar foto
                    </button>
                  </div>
                </div>
                {showAvatarDropdown && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 8, marginTop: 12, padding: 12, background: 'rgba(24, 24, 27, 0.6)', borderRadius: 12, border: '1px solid rgba(63, 63, 70, 0.8)' }}>
                    {[
                      'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?q=80&w=150',
                      'https://images.unsplash.com/photo-1608155686393-8fdd966d784d?q=80&w=150',
                      'https://images.unsplash.com/photo-1584290860587-211bfb66aa0f?q=80&w=150',
                      'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?q=80&w=150',
                      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=150',
                      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=150',
                    ].map((preset, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => {
                          setSec((s) => ({ ...s, photo: preset }));
                          setShowAvatarDropdown(false);
                        }}
                        style={{ aspectRatio: '1', borderRadius: 8, overflow: 'hidden', border: '1px solid rgba(63, 63, 70, 0.8)', cursor: 'pointer', padding: 0, background: 'transparent' }}
                      >
                        <img src={preset} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} referrerPolicy="no-referrer" />
                      </button>
                    ))}
                  </div>
                )}
              </section>

              {/* Campos: Nome, Handle e E-mail (reference: single submit) */}
              <section className="set-card">
                <div className="set-card__head">
                  <div>
                    <div className="set-card__eyebrow">CONTA</div>
                    <h3 className="set-card__title">Informações da Conta</h3>
                    <p className="set-card__desc">Dados salvos localmente neste dispositivo.</p>
                  </div>
                </div>
                <form onSubmit={(e) => { e.preventDefault(); void saveAccountInfo(); }} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div className="set-field">
                    <label className="set-field__label" htmlFor="setSec-nome">
                      {SvgUser}
                      Nome
                    </label>
                    <input
                      id="setSec-nome"
                      type="text"
                      className="set-input"
                      placeholder="Seu nome..."
                      value={sec.nome}
                      onChange={(e) => setSec((s) => ({ ...s, nome: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="set-field">
                    <label className="set-field__label" htmlFor="setSec-handle">
                      {SvgUser}
                      Nome de Usuário (@handle)
                    </label>
                    <input
                      id="setSec-handle"
                      type="text"
                      className="set-input"
                      placeholder="@usuario..."
                      value={sec.handle}
                      onChange={(e) => setSec((s) => ({ ...s, handle: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="set-field">
                    <label className="set-field__label" htmlFor="setSec-email">
                      {SvgMail}
                      E-mail
                    </label>
                    <input
                      id="setSec-email"
                      type="email"
                      className="set-input"
                      placeholder="seu@email.com"
                      value={sec.email}
                      onChange={(e) => setSec((s) => ({ ...s, email: e.target.value }))}
                      required
                    />
                  </div>
                  <button type="submit" className="set-btn set-btn--primary" style={{ width: '100%' }}>
                    Salvar Informações
                  </button>
                </form>
              </section>
            </>
          ),
        },
        senha: {
          title: 'Alterar Senha',
          content: (
            <section className="set-card">
              <div className="set-card__head">
                <div>
                  <div className="set-card__eyebrow">CONTA</div>
                  <h3 className="set-card__title">Alterar Senha da Conta do Usuário</h3>
                  <p className="set-card__desc">Defina a senha local de acesso ao seu perfil.</p>
                </div>
              </div>
              {/* v4.9.3-settings — Info box explicando usuário vs bloqueio (reference) */}
              <div style={{ padding: 16, background: 'rgba(9, 9, 11, 0.8)', border: '1px solid rgba(63, 63, 70, 0.8)', borderRadius: 12, marginBottom: 16 }}>
                <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
                  Sua <strong style={{ color: 'var(--text)' }}>Senha de Usuário</strong> é utilizada para autenticar seu perfil e proteger suas configurações pessoais. Ela é totalmente independente da <strong style={{ color: 'var(--primary, #f97316)' }}>Senha de Bloqueio do App</strong>.
                </p>
              </div>
              <form onSubmit={(e) => { e.preventDefault(); void saveSecurityField('senha', sec.senha); }} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div className="set-field" style={{ marginBottom: 0 }}>
                  <label className="set-field__label" htmlFor="setSec-senha">
                    {SvgLockSm}
                    Nova Senha da Conta
                  </label>
                  <div className="set-input-wrap">
                    <input
                      id="setSec-senha"
                      type={showPinDraft ? 'text' : 'password'}
                      className="set-input"
                      placeholder="Defina a nova senha do usuário"
                      value={sec.senha}
                      onChange={(e) => setSec((s) => ({ ...s, senha: e.target.value }))}
                      required
                    />
                    <button
                      type="button"
                      className="set-eye"
                      onClick={() => setShowPinDraft((v) => !v)}
                      aria-label={showPinDraft ? 'Ocultar senha' : 'Mostrar senha'}
                    >
                      {SvgEye}
                    </button>
                  </div>
                </div>
                <button type="submit" className="set-btn set-btn--primary" style={{ width: '100%' }}>
                  Salvar Senha do Usuário
                </button>
              </form>
            </section>
          ),
        },
        exportar: {
          title: 'Exportar Backup',
          content: (
            <section className="set-card">
              <div className="set-card__head">
                <div>
                  <div className="set-card__eyebrow">BACKUP</div>
                  <h3 className="set-card__title">Exportar Backup (Baixar .JSON)</h3>
                  <p className="set-card__desc">
                    Baixe um arquivo com seus dados em JSON.
                  </p>
                </div>
                <span className="set-toggle__icon">{SvgDatabase}</span>
              </div>
              <div className="set-install">
                <button
                  type="button"
                  className="set-btn set-btn--primary"
                  onClick={() => void handleExport()}
                >
                  {SvgDownload}
                  Baixar .JSON
                </button>
              </div>
              <p className="set-note" style={{ marginTop: 10 }}>
                O arquivo inclui treinos, histórico, conquistas e personalização.
              </p>
            </section>
          ),
        },
        restaurar: {
          title: 'Restaurar Backup',
          content: (
            <section className="set-card">
              <div className="set-card__head">
                <div>
                  <div className="set-card__eyebrow">BACKUP</div>
                  <h3 className="set-card__title">Restaurar Backup (Upload .JSON)</h3>
                  <p className="set-card__desc">
                    Importe um arquivo de backup gerado anteriormente.
                  </p>
                </div>
                <span className="set-toggle__icon">{SvgDatabase}</span>
              </div>
              <div className="set-install">
                <button
                  type="button"
                  className="set-btn set-btn--primary"
                  onClick={() => fileRef.current?.click()}
                >
                  {SvgUpload}
                  Selecionar arquivo
                </button>
              </div>
              <p className="set-note" style={{ marginTop: 10 }}>
                ⚠️ A importação substitui todos os dados atuais e não pode ser desfeita.
              </p>
            </section>
          ),
        },
        desativar: {
          title: 'Desativar Sua Conta',
          content: (
            <section className="set-card">
              <div className="set-card__head">
                <div>
                  <div className="set-card__eyebrow">CONTA</div>
                  <h3 className="set-card__title">
                    Desativar Sua Conta
                    <span className="set-badge-soon">EM BREVE</span>
                  </h3>
                  <p className="set-card__desc">
                    Desative ou exclua seu perfil local.
                  </p>
                </div>
              </div>
              <p className="set-note" style={{ marginTop: 0 }}>
                Em breve: a desativação de conta será liberada em uma atualização
                futura. Seus dados continuam armazenados apenas neste dispositivo.
              </p>
              <div className="set-install" style={{ marginTop: 12 }}>
                <button type="button" className="set-btn" disabled>
                  {SvgBan}
                  Desativar conta
                </button>
              </div>
            </section>
          ),
        },
        /* v4.9.3-settings — atalho "Dispositivos conectados" dentro de Sua Conta */
        dispositivos: {
          title: 'Dispositivos Conectados',
          content: <ConnectedDevices />,
        },
      },
    },

    /* ================= DISPOSITIVOS CONECTADOS (v4.9.3-settings) ================= */
    dispositivos: {
      eyebrow: 'ACADEMIA • DISPOSITIVOS',
      title: 'Dispositivos Conectados',
      content: <ConnectedDevices />,
    },

    /* ================= SEGURANÇA ================= */
    seguranca: {
      eyebrow: 'ACADEMIA • SEGURANÇA',
      title: 'Segurança e Sincronização',
      content: (
        <>
          {/* v4.9.3-settings — Card 1: STATUS DA SINCRONIZAÇÃO (reference) */}
          <section className="set-card">
            <div className="set-card__head">
              <div>
                <div className="set-card__eyebrow">SINCRONIZAÇÃO</div>
                <h3 className="set-card__title">Status da Sincronização</h3>
                <p className="set-card__desc">
                  Chave de sincronização criptografada e status do perfil.
                </p>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
              <div>
                <p style={{ fontSize: 12, fontWeight: 700, fontFamily: 'var(--font-mono, monospace)', color: 'var(--text)', margin: 0 }}>
                  {getSyncKey()}
                </p>
                <p style={{ fontSize: 10, color: '#34d399', fontFamily: 'var(--font-mono, monospace)', marginTop: 4 }}>
                  {cloudConfigured ? 'Perfil sincronizado em nuvem ativo' : 'Modo local — sem nuvem configurada'}
                </p>
              </div>
              <button
                type="button"
                className="set-btn"
                onClick={() => {
                  navigator.clipboard.writeText(getSyncKey());
                  showToast('Chave de sincronização copiada!', 'success');
                }}
              >
                {SvgDatabase}
                Copiar Chave
              </button>
            </div>
          </section>

          {/* Card 2: App Lock master toggle + Testar Bloqueio */}
          <section className="set-card">
            <div className="set-card__head">
              <div>
                <div className="set-card__eyebrow">SEGURANÇA</div>
                <h3 className="set-card__title">Bloqueio do App</h3>
                <p className="set-card__desc">
                  Proteja seus dados com senha local e autenticação por biometria.
                </p>
              </div>
            </div>
            <div className="set-toggles">
              <div className="set-toggle">
                <div className="set-toggle__info">
                  <span className="set-toggle__icon">{SvgLock}</span>
                  <div>
                    <span className="set-toggle__label">Ativar Bloqueio por Senha do App</span>
                    <span className="set-toggle__desc">
                      Exige uma senha local ao abrir o app
                    </span>
                  </div>
                </div>
                <label className="set-switch">
                  <input
                    type="checkbox"
                    checked={lock.enabled === 'true'}
                    onChange={(e) => updateLock('enabled', String(e.target.checked))}
                  />
                  <span className="set-switch__track" />
                </label>
              </div>
              <div className="set-toggle">
                <div className="set-toggle__info">
                  <span className="set-toggle__icon">{SvgFingerprint}</span>
                  <div>
                    <span className="set-toggle__label">
                      Bloqueio por Impressão Digital
                      {lock.biometric === 'true' && (
                        <span className="set-badge" style={{ marginLeft: 8, fontSize: 8, background: 'rgba(16, 185, 129, 0.1)', color: '#34d399', border: '1px solid rgba(16, 185, 129, 0.2)', padding: '2px 8px', borderRadius: 999, fontFamily: 'var(--font-mono, monospace)', textTransform: 'uppercase' }}>
                          Ativado
                        </span>
                      )}
                    </span>
                    <span className="set-toggle__desc">
                      Desbloqueio com digital, Touch ID ou Windows Hello
                    </span>
                  </div>
                </div>
                <label className="set-switch">
                  <input
                    type="checkbox"
                    checked={lock.biometric === 'true'}
                    onChange={(e) => {
                      const on = e.target.checked;
                      if (on) {
                        /* v4.10.0: registra credencial WebAuthn real */
                        void registerBiometric().then((ok) => {
                          if (ok) {
                            updateLock('biometric', 'true');
                            showToast('Biometria registrada com sucesso!', 'success');
                          } else {
                            showToast('Falha ao registrar biometria. Verifique se seu dispositivo suporta Windows Hello, Touch ID ou digital.', 'error');
                          }
                        });
                      } else {
                        clearBiometric();
                        updateLock('biometric', 'false');
                      }
                    }}
                  />
                  <span className="set-switch__track" />
                </label>
              </div>
            </div>

            {/* v4.13.0 — como a biometria é solicitada: automática (padrão,
                prompt 400ms ao entrar/travar) ou só no botão "Desbloquear
                com Digital" (a senha continua disponível). */}
            {lock.biometric === 'true' && (
              <>
                <div className="set-card__head" style={{ marginTop: 22 }}>
                  <div>
                    <h3 className="set-card__title">Solicitação da Digital</h3>
                    <p className="set-card__desc">
                      Quando a biometria é pedida na tela de bloqueio.
                    </p>
                  </div>
                </div>
                <div className="set-opts">
                  <button
                    type="button"
                    className={`set-opt ${lock.bioAuto === 'true' ? 'set-opt--active' : ''}`}
                    onClick={() => updateLock('bioAuto', 'true')}
                  >
                    {SvgFingerprint}
                    <span className="set-opt__label">Automática</span>
                  </button>
                  <button
                    type="button"
                    className={`set-opt ${lock.bioAuto === 'false' ? 'set-opt--active' : ''}`}
                    onClick={() => updateLock('bioAuto', 'false')}
                  >
                    <MousePointerClick size={18} />
                    <span className="set-opt__label">Só no Botão</span>
                  </button>
                </div>
                <p className="set-note" style={{ marginTop: 10 }}>
                  {lock.bioAuto === 'true'
                    ? 'A digital é solicitada sozinha ao entrar no app ou ao travar.'
                    : 'A digital só é pedida ao tocar em "Desbloquear com Digital"; a senha continua disponível.'}
                </p>
              </>
            )}
            {/* v4.9.3-settings — Botão "Testar Bloqueio Agora" (reference) */}
            {lock.enabled === 'true' && (
              <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid rgba(63, 63, 70, 0.6)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 10, color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono, monospace)' }}>
                  Testar mecanismo de bloqueio:
                </span>
                <button
                  type="button"
                  className="set-btn"
                  style={{ color: 'var(--primary, #f97316)', borderColor: 'rgba(var(--primary-rgb, 249, 115, 22), 0.3)', background: 'rgba(var(--primary-rgb, 249, 115, 22), 0.1)' }}
                  onClick={() => lockApp()}
                >
                  <span style={{ display: 'inline-flex', alignItems: 'center' }}>{SvgPlay}</span>
                  Testar Bloqueio Agora
                </button>
              </div>
            )}
          </section>

          {/* Card 4: Slider de Inatividade (reference: 1–60) */}
          {lock.enabled === 'true' && (
            <section className="set-card">
              <div className="set-card__head">
                <div>
                  <div className="set-card__eyebrow">INATIVIDADE</div>
                  <h3 className="set-card__title">Tempo de Inatividade para Bloqueio</h3>
                  <p className="set-card__desc">
                    O app trava automaticamente após o intervalo escolhido.
                  </p>
                </div>
                <span style={{ fontSize: 12, fontFamily: 'var(--font-mono, monospace)', fontWeight: 700, color: 'var(--primary, #f97316)', background: 'rgba(var(--primary-rgb, 249, 115, 22), 0.1)', padding: '4px 10px', borderRadius: 8, border: '1px solid rgba(var(--primary-rgb, 249, 115, 22), 0.2)' }}>
                  {lock.timeout === '-1' ? 'Sempre Logado' : `${Math.round(Number(lock.timeout) / 60)} min`}
                </span>
              </div>
              <input
                type="range"
                min="1"
                max="60"
                step="1"
                value={lock.timeout === '-1' ? 5 : Math.round(Number(lock.timeout) / 60)}
                onChange={(e) => updateLock('timeout', String(Number(e.target.value) * 60))}
                style={{ width: '100%', accentColor: 'var(--primary, #f97316)', background: 'rgba(24, 24, 27, 0.8)', height: 8, borderRadius: 8, cursor: 'pointer' }}
              />
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
                {[1, 5, 15, 30, 60].map((mins) => (
                  <button
                    key={mins}
                    type="button"
                    className={`set-chip ${lock.timeout === String(mins * 60) ? 'set-chip--active' : ''}`}
                    onClick={() => updateLock('timeout', String(mins * 60))}
                  >
                    {mins} min
                  </button>
                ))}
                <button
                  type="button"
                  className={`set-chip ${lock.timeout === '-1' ? 'set-chip--active' : ''}`}
                  onClick={() => updateLock('timeout', '-1')}
                >
                  Nunca (Sempre Logado)
                </button>
              </div>
            </section>
          )}

          {/* Card 5: Gerenciar Senha de Bloqueio do App (reference layout) */}
          <section className="set-card">
            <div className="set-card__head">
              <div>
                <div className="set-card__eyebrow">SENHA</div>
                <h3 className="set-card__title">Senha de Bloqueio do App</h3>
                <p className="set-card__desc">
                  Senha local para desbloquear o aplicativo.
                </p>
              </div>
              <button
                type="button"
                className="set-btn"
                onClick={() => {
                  setPinDraft('');
                  setPinConfirm('');
                  setPinError('');
                  setPinFormOpen(true);
                }}
              >
                Alterar Senha
              </button>
            </div>

            {pinFormOpen ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 12 }}>
                <div className="set-input-wrap">
                  <input
                    type={showPinDraft ? 'text' : 'password'}
                    autoComplete="new-password"
                    maxLength={32}
                    className="set-input"
                    placeholder="Nova senha (mín. 4 caracteres)"
                    value={pinDraft}
                    onChange={(e) => setPinDraft(e.target.value)}
                  />
                  <button
                    type="button"
                    className="set-eye"
                    onClick={() => setShowPinDraft((v) => !v)}
                    aria-label={showPinDraft ? 'Ocultar senha' : 'Mostrar senha'}
                  >
                    {SvgEye}
                  </button>
                </div>
                <div className="set-input-wrap">
                  <input
                    type={showPinConfirm ? 'text' : 'password'}
                    autoComplete="new-password"
                    maxLength={32}
                    className="set-input"
                    placeholder="Repita a senha"
                    value={pinConfirm}
                    onChange={(e) => setPinConfirm(e.target.value)}
                  />
                  <button
                    type="button"
                    className="set-eye"
                    onClick={() => setShowPinConfirm((v) => !v)}
                    aria-label={showPinConfirm ? 'Ocultar senha' : 'Mostrar senha'}
                  >
                    {SvgEye}
                  </button>
                </div>
                {pinError && (
                  <span className="set-note" style={{ color: '#fb7185', marginTop: 0 }}>
                    {pinError}
                  </span>
                )}
                <div className="set-install" style={{ marginTop: 0 }}>
                  <button type="button" className="set-btn set-btn--primary" onClick={submitPin}>
                    Salvar Nova Senha de Bloqueio
                  </button>
                  <button type="button" className="set-btn" onClick={resetPinForm}>
                    Cancelar
                  </button>
                </div>
              </div>
            ) : pinLen > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 12 }}>
                <span className="set-note" style={{ marginTop: 0 }}>
                  Senha de {pinLen} caractere{pinLen > 1 ? 's' : ''} definida neste dispositivo.
                </span>
                <div className="set-install" style={{ marginTop: 0, flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    className="set-btn"
                    onClick={() => {
                      setPinDraft('');
                      setPinConfirm('');
                      setPinError('');
                      setPinFormOpen(true);
                    }}
                  >
                    Alterar Senha
                  </button>
                  <button type="button" className="set-btn" onClick={removePin}>
                    Remover Senha
                  </button>
                  <button
                    type="button"
                    className="set-btn set-btn--primary"
                    onClick={() => lockApp()}
                    title="Travar o app imediatamente"
                  >
                    {SvgLock}
                    Trancar Agora
                  </button>
                </div>
              </div>
            ) : (
              <div className="set-install" style={{ marginTop: 12 }}>
                <button type="button" className="set-btn set-btn--primary" onClick={() => setPinFormOpen(true)}>
                  Criar Senha
                </button>
              </div>
            )}
          </section>

          {/* Card 6: Wallpapers com Upload/Remover/URL (reference) */}
          <section className="set-card">
            <div className="set-card__head">
              <div>
                <div className="set-card__eyebrow">PERSONALIZAÇÃO</div>
                <h3 className="set-card__title">Papéis de Parede da Tela de Bloqueio</h3>
                <p className="set-card__desc">
                  Escolha o visual da tela de bloqueio em orientação vertical e horizontal.
                </p>
              </div>
              <span style={{ fontSize: 9, fontFamily: 'var(--font-mono, monospace)', fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>
                Desktop & Mobile
              </span>
            </div>
            <div className="set-wall-grid">
              {wallCard('v')}
              {wallCard('h')}
            </div>
            {/* v4.9.3-settings — Upload/Remover/URL por orientação (reference) */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginTop: 16 }}>
              {(['h', 'v'] as const).map((kind) => {
                const storageKey = kind === 'v' ? 'mbc_lock_mobile' : 'mbc_lock_desktop';
                const customVal = localStorage.getItem(storageKey) || '';
                return (
                  <div key={kind} style={{ padding: 12, background: 'rgba(24, 24, 27, 0.4)', border: '1px solid rgba(63, 63, 70, 0.8)', borderRadius: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <span style={{ fontSize: 10, fontFamily: 'var(--font-mono, monospace)', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                      {kind === 'v' ? 'Celular / Mobile (Vertical)' : 'Computador / Desktop (Horizontal)'}
                    </span>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <label style={{ flex: 1, padding: '6px 12px', background: 'rgba(39, 39, 42, 0.8)', border: '1px solid rgba(63, 63, 70, 0.6)', borderRadius: 8, textAlign: 'center', fontSize: 10, fontFamily: 'var(--font-mono, monospace)', fontWeight: 700, color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                        {SvgUpload}
                        <span>Upload</span>
                        <input
                          type="file"
                          accept="image/*"
                          style={{ display: 'none' }}
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (f) {
                              const r = new FileReader();
                              r.onloadend = () => {
                                localStorage.setItem(storageKey, r.result as string);
                                lockPrefsChanged();
                                showToast('Imagem aplicada!', 'success');
                              };
                              r.readAsDataURL(f);
                            }
                          }}
                        />
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          localStorage.removeItem(storageKey);
                          lockPrefsChanged();
                          showToast('Imagem removida.', 'info');
                        }}
                        style={{ padding: '6px 12px', background: 'rgba(127, 29, 29, 0.2)', border: '1px solid rgba(127, 29, 29, 0.3)', color: '#f87171', borderRadius: 8, fontSize: 10, fontFamily: 'var(--font-mono, monospace)', fontWeight: 700, cursor: 'pointer' }}
                      >
                        Remover
                      </button>
                    </div>
                    <input
                      type="url"
                      className="set-input"
                      placeholder="URL da imagem..."
                      defaultValue={customVal}
                      onBlur={(e) => {
                        const v = e.target.value.trim();
                        if (v) {
                          localStorage.setItem(storageKey, v);
                          lockPrefsChanged();
                          showToast('URL aplicada!', 'success');
                        }
                      }}
                    />
                  </div>
                );
              })}
            </div>
            <p className="set-note" style={{ marginTop: 10 }}>
              Aplicado na próxima tela de bloqueio, conforme a orientação do dispositivo.
            </p>
          </section>
        </>
      ),
    },

    /* ================= NUVEM E SINCRONIZAÇÃO (v4.9.0-sync) ================= */
    nuvem: {
      eyebrow: 'ACADEMIA • NUVEM',
      title: 'Nuvem e Sincronização',
      content: <SyncSettingsPanel />,
    },

    /* ================= PREFERÊNCIAS DO APP ================= */
    preferencias: {
      eyebrow: 'ACADEMIA • PREFERÊNCIAS',
      title: 'Preferências do App',
      content: (
        <>
          <section className="set-card">
            <div className="set-card__head">
              <div>
                <div className="set-card__eyebrow">GERAL</div>
                <h3 className="set-card__title">Unidades e calendário</h3>
                <p className="set-card__desc">
                  Defina como pesos, distâncias e a semana aparecem no aplicativo.
                </p>
              </div>
            </div>

            <div className="set-pref-list">
              <button
                type="button"
                className={`set-pref-row${openPref === 'week' ? ' is-open' : ''}`}
                aria-expanded={openPref === 'week'}
                onClick={() => setOpenPref((current) => (current === 'week' ? null : 'week'))}
              >
                <span className="set-pref-row__icon">{SvgCalendar}</span>
                <span className="set-pref-row__label">Primeiro dia da semana</span>
                <span className="set-pref-row__value">
                  {firstDay === 'monday' ? 'Segunda-feira' : 'Domingo'}
                </span>
                <span className="set-pref-row__chev">{SvgChevronRightSm}</span>
              </button>
              {openPref === 'week' && (
                <div className="set-pref-options" role="group" aria-label="Primeiro dia da semana">
                  {([
                    { value: 'monday', label: 'Segunda-feira' },
                    { value: 'sunday', label: 'Domingo' },
                  ] as const).map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      className={`set-pref-option${firstDay === option.value ? ' is-active' : ''}`}
                      onClick={() => changeFirstDay(option.value)}
                    >
                      {firstDay === option.value && SvgCheck}
                      {option.label}
                    </button>
                  ))}
                </div>
              )}

              <button
                type="button"
                className={`set-pref-row${openPref === 'weight' ? ' is-open' : ''}`}
                aria-expanded={openPref === 'weight'}
                onClick={() => setOpenPref((current) => (current === 'weight' ? null : 'weight'))}
              >
                <span className="set-pref-row__icon">{SvgDumbbell}</span>
                <span className="set-pref-row__label">Unidade de medida</span>
                <span className="set-pref-row__value">{weightUnit === 'kg' ? 'kg' : 'lb'}</span>
                <span className="set-pref-row__chev">{SvgChevronRightSm}</span>
              </button>
              {openPref === 'weight' && (
                <div className="set-pref-options" role="group" aria-label="Unidade de peso">
                  {([
                    { value: 'kg', label: 'Quilogramas (kg)' },
                    { value: 'lb', label: 'Libras (lb)' },
                  ] as const).map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      className={`set-pref-option${weightUnit === option.value ? ' is-active' : ''}`}
                      onClick={() => changeWeightUnit(option.value)}
                    >
                      {weightUnit === option.value && SvgCheck}
                      {option.label}
                    </button>
                  ))}
                </div>
              )}

              <button
                type="button"
                className={`set-pref-row${openPref === 'distance' ? ' is-open' : ''}`}
                aria-expanded={openPref === 'distance'}
                onClick={() => setOpenPref((current) => (current === 'distance' ? null : 'distance'))}
              >
                <span className="set-pref-row__icon">{SvgRoute}</span>
                <span className="set-pref-row__label">Unidade de distância</span>
                <span className="set-pref-row__value">{distanceUnit === 'km' ? 'km' : 'mi'}</span>
                <span className="set-pref-row__chev">{SvgChevronRightSm}</span>
              </button>
              {openPref === 'distance' && (
                <div className="set-pref-options" role="group" aria-label="Unidade de distância">
                  {([
                    { value: 'km', label: 'Quilômetros (km)' },
                    { value: 'mi', label: 'Milhas (mi)' },
                  ] as const).map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      className={`set-pref-option${distanceUnit === option.value ? ' is-active' : ''}`}
                      onClick={() => changeDistanceUnit(option.value)}
                    >
                      {distanceUnit === option.value && SvgCheck}
                      {option.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </section>

          <section className="set-card">
            <div className="set-card__head">
              <div>
                <div className="set-card__eyebrow">APARÊNCIA</div>
                <h3 className="set-card__title">Tema</h3>
                <p className="set-card__desc">
                  Cor de destaque usada em todo o aplicativo.
                </p>
              </div>
            </div>

            <div className="set-pref-list">
              <button
                type="button"
                className={`set-pref-row${openPref === 'theme' ? ' is-open' : ''}`}
                aria-expanded={openPref === 'theme'}
                onClick={() => setOpenPref((current) => (current === 'theme' ? null : 'theme'))}
              >
                <span className="set-pref-row__icon">{SvgPalette}</span>
                <span className="set-pref-row__label">Tema</span>
                <span
                  className="set-pref-swatch"
                  style={{ background: activeHex }}
                  aria-hidden="true"
                />
                <span className="set-pref-row__value">{themeDisplayName(themeKey)}</span>
                <span className="set-pref-row__chev">{SvgChevronRightSm}</span>
              </button>
              {openPref === 'theme' && (
                <div className="set-pref-theme">
                  <div className="set-pref-theme-dots" role="group" aria-label="Temas do app">
                    {THEME_PRESETS.map((preset) => (
                      <button
                        key={preset.id}
                        type="button"
                        title={preset.name}
                        aria-label={`Tema ${preset.name}`}
                        className={`set-pref-theme-dot${themeKey === preset.id ? ' is-active' : ''}`}
                        style={{ background: preset.p }}
                        onClick={() => selectPreset(preset.id)}
                      />
                    ))}
                  </div>
                  <button
                    type="button"
                    className="set-btn"
                    onClick={() => setPickerOpen(true)}
                  >
                    {SvgPalette}
                    Cor personalizada
                  </button>
                </div>
              )}
            </div>
          </section>

          <section className="set-card">
            <div className="set-card__head">
              <div>
                <div className="set-card__eyebrow">IDIOMA</div>
                <h3 className="set-card__title">Idioma do aplicativo</h3>
                <p className="set-card__desc">Idioma de preferência para a interface.</p>
              </div>
            </div>

            <div className="set-pref-list">
              <button
                type="button"
                className={`set-pref-row${openPref === 'language' ? ' is-open' : ''}`}
                aria-expanded={openPref === 'language'}
                onClick={() => setOpenPref((current) => (current === 'language' ? null : 'language'))}
              >
                <span className="set-pref-row__icon">{SvgGlobe}</span>
                <span className="set-pref-row__label">Idioma</span>
                <span className="set-pref-row__value">
                  {language === 'pt' ? 'Português (BR)' : 'English (US)'}
                </span>
                <span className="set-pref-row__chev">{SvgChevronRightSm}</span>
              </button>
              {openPref === 'language' && (
                <div className="set-pref-options" role="group" aria-label="Idioma">
                  {([
                    { value: 'pt', label: 'Português (BR)' },
                    { value: 'en', label: 'English (US)' },
                  ] as const).map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      className={`set-pref-option${language === option.value ? ' is-active' : ''}`}
                      onClick={() => changeLanguage(option.value)}
                    >
                      {language === option.value && SvgCheck}
                      {option.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </section>

          <section className="set-card">
            <div className="set-card__head">
              <div>
                <div className="set-card__eyebrow">TREINO</div>
                <h3 className="set-card__title">Durante o treino</h3>
                <p className="set-card__desc">
                  Ajustes de descanso e foco para as suas sessões.
                </p>
              </div>
            </div>
            <div className="set-toggles">
              <div className="set-toggle">
                <div className="set-toggle__info">
                  <span className="set-toggle__icon">{SvgVolume}</span>
                  <div>
                    <span className="set-toggle__label">Som do temporizador (entre as séries)</span>
                    <span className="set-toggle__desc">
                      Toca um aviso sonoro ao terminar o descanso entre séries
                    </span>
                  </div>
                </div>
                <label className="set-switch">
                  <input
                    type="checkbox"
                    checked={timerSound}
                    onChange={(e) => toggleTimerSound(e.target.checked)}
                  />
                  <span className="set-switch__track" />
                </label>
              </div>
              <div className="set-toggle">
                <div className="set-toggle__info">
                  <span className="set-toggle__icon">{SvgTarget}</span>
                  <div>
                    <span className="set-toggle__label">Modo Foco por padrão nos treinos</span>
                    <span className="set-toggle__desc">
                      Abre automaticamente o Modo Foco ao iniciar um treino
                    </span>
                  </div>
                </div>
                <label className="set-switch">
                  <input
                    type="checkbox"
                    checked={focusDefault}
                    onChange={(e) => toggleFocusDefault(e.target.checked)}
                  />
                  <span className="set-switch__track" />
                </label>
              </div>
            </div>
          </section>
        </>
      ),
    },

    /* ================= NOTIFICAÇÕES ================= */
    notificacoes: {
      eyebrow: 'ACADEMIA • NOTIFICAÇÕES',
      title: 'Notificações',
      content: (
        <>
          {/* v4.44.0 — notificações em estilo de lista (placeholders salvos) */}
          <section className="set-card">
            <div className="set-card__head">
              <div>
                <div className="set-card__eyebrow">SISTEMA</div>
                <h3 className="set-card__title">Notificações do Sistema & Segundo Plano (PWA)</h3>
                <p className="set-card__desc">
                  Permita os avisos do navegador e escolha o que receber.
                </p>
              </div>
            </div>
            <div className="set-toggles">
              <div className="set-toggle">
                <div className="set-toggle__info">
                  <span className="set-toggle__icon">{SvgBell}</span>
                  <div>
                    <span className="set-toggle__label">Permitir notificações</span>
                    <span className="set-toggle__desc">
                      Solicita permissão do navegador para enviar notificações
                    </span>
                  </div>
                </div>
                <label className="set-switch">
                  <input
                    type="checkbox"
                    checked={prefs.notifications}
                    onChange={(e) => void toggleNotifications(e.target.checked)}
                  />
                  <span className="set-switch__track" />
                </label>
              </div>
              <div className="set-toggle">
                <div className="set-toggle__info">
                  <span className="set-toggle__icon">{SvgGlobe}</span>
                  <div>
                    <span className="set-toggle__label">Segundo Plano</span>
                    <span className="set-toggle__desc">
                      Receber alertas mesmo com o app fechado
                    </span>
                  </div>
                </div>
                <label className="set-switch">
                  <input
                    type="checkbox"
                    checked={prefs.online}
                    onChange={(e) => togglePref('online', e.target.checked)}
                  />
                  <span className="set-switch__track" />
                </label>
              </div>
              <div className="set-toggle">
                <div className="set-toggle__info">
                  <span className="set-toggle__icon">{SvgBell}</span>
                  <div>
                    <span className="set-toggle__label">Testar Disparo</span>
                    <span className="set-toggle__desc">
                      Envia uma notificação de teste imediata
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  className="set-btn"
                  onClick={() => {
                    if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
                      new Notification('⏰ Teste de Alarme EVO FIT', {
                        body: 'Disparo de notificação em segundo plano testado com sucesso!',
                        icon: '/icon-192.png',
                      });
                    } else {
                      showToast('⚡ Teste de alerta disparado na interface!', 'info');
                    }
                  }}
                >
                  Testar
                </button>
              </div>
            </div>
          </section>

          <section className="set-card">
            <div className="set-card__head">
              <div>
                <div className="set-card__eyebrow">ALERTAS</div>
                <h3 className="set-card__title">Notificações e Lembretes</h3>
                <p className="set-card__desc">
                  Escolha o que o app avisa durante a sua rotina.
                </p>
              </div>
            </div>
            <div className="set-toggles">
              <div className="set-toggle">
                <div className="set-toggle__info">
                  <span className="set-toggle__icon">{SvgDumbbell}</span>
                  <div>
                    <span className="set-toggle__label">
                      Lembretes de treino
                      <span className="set-badge-soon" style={{ marginLeft: 7 }}>
                        EM BREVE
                      </span>
                    </span>
                    <span className="set-toggle__desc">
                      Receba um lembrete diário no horário do seu treino
                    </span>
                  </div>
                </div>
                <label className="set-switch">
                  <input
                    type="checkbox"
                    checked={lock.reminder === 'true'}
                    onChange={(e) => updateLock('reminder', String(e.target.checked))}
                  />
                  <span className="set-switch__track" />
                </label>
              </div>
              <div className="set-toggle">
                <div className="set-toggle__info">
                  <span className="set-toggle__icon">{SvgMegaphone}</span>
                  <div>
                    <span className="set-toggle__label">
                      Novidades e atualizações
                      <span className="set-badge-soon" style={{ marginLeft: 7 }}>
                        EM BREVE
                      </span>
                    </span>
                    <span className="set-toggle__desc">
                      Avisos sobre novos recursos e versões do app
                    </span>
                  </div>
                </div>
                <label className="set-switch">
                  <input
                    type="checkbox"
                    checked={prefs.notifyUpdates}
                    onChange={(e) => togglePref('notifyUpdates', e.target.checked)}
                  />
                  <span className="set-switch__track" />
                </label>
              </div>
              <div className="set-toggle">
                <div className="set-toggle__info">
                  <span className="set-toggle__icon">{SvgTrophy}</span>
                  <div>
                    <span className="set-toggle__label">
                      Ligas
                      <span className="set-badge-soon" style={{ marginLeft: 7 }}>
                        EM BREVE
                      </span>
                    </span>
                    <span className="set-toggle__desc">
                      Avisos de temporadas, subidas de divisão e resultados
                    </span>
                  </div>
                </div>
                <label className="set-switch">
                  <input
                    type="checkbox"
                    checked={prefs.notifyLeagues}
                    onChange={(e) => togglePref('notifyLeagues', e.target.checked)}
                  />
                  <span className="set-switch__track" />
                </label>
              </div>
              <div className="set-toggle">
                <div className="set-toggle__info">
                  <span className="set-toggle__icon">{SvgChat}</span>
                  <div>
                    <span className="set-toggle__label">
                      Mensagens motivacionais
                      <span className="set-badge-soon" style={{ marginLeft: 7 }}>
                        EM BREVE
                      </span>
                    </span>
                    <span className="set-toggle__desc">
                      Frases de incentivo ao concluir treinos
                    </span>
                  </div>
                </div>
                <label className="set-switch">
                  <input
                    type="checkbox"
                    checked={prefs.messages}
                    onChange={(e) => togglePref('messages', e.target.checked)}
                  />
                  <span className="set-switch__track" />
                </label>
              </div>
            </div>
            {lock.reminder === 'true' && (
              <div className="set-field" style={{ marginTop: 14, marginBottom: 0 }}>
                <label className="set-field__label">
                  {SvgTimer}
                  Horário do Lembrete
                </label>
                <input
                  type="time"
                  className="set-time"
                  value={lock.reminderTime}
                  onChange={(e) => updateLock('reminderTime', e.target.value)}
                />
              </div>
            )}
            <p className="set-note" style={{ marginTop: 10 }}>
              Estas opções são placeholders: as preferências ficam salvas, mas o
              envio real de push será ativado em uma próxima versão.
            </p>
          </section>
        </>
      ),
    },

    /* ================= ESQUEMA DE CORES ================= */
    cores: {
      eyebrow: 'ACADEMIA • CORES',
      title: 'Esquema de Cores e Personalização',
      content: (
        <>
        <section className="set-card">
          <div className="set-card__head">
            <div>
              <div className="set-card__eyebrow">PALETA DE CORES</div>
              <h3 className="set-card__title">Cor de Destaque</h3>
              <p className="set-card__desc">
                Escolha a identidade visual do app ou crie um tom exclusivo.
              </p>
            </div>
            <button type="button" className="set-btn" onClick={() => setPickerOpen(true)}>
              {SvgPalette}
              Seletor
            </button>
          </div>

          <div className="set-presets">
            {THEME_PRESETS.map((preset) => {
              const isActive = themeKey === preset.id;
              return (
                <button
                  key={preset.id}
                  type="button"
                  className={`set-preset ${isActive ? 'set-preset--active' : ''}`}
                  onClick={() => selectPreset(preset.id)}
                >
                  <span className="set-preset__dot" style={{ background: preset.p }} />
                  <span className="set-preset__name">{preset.name}</span>
                  <span className="set-preset__hex">{preset.p}</span>
                  <span className="set-preset__check">{SvgCheck}</span>
                </button>
              );
            })}
          </div>

          <div className="set-custom-row">
            <div className="set-custom-row__left">
              <span
                className="set-custom-row__swatch"
                style={{ background: themeKey === CUSTOM_THEME_ID ? customHex : activeHex }}
              />
              <div>
                <div className="set-custom-row__label">Tom Personalizado</div>
                <div className="set-custom-row__hex">
                  {themeKey === CUSTOM_THEME_ID ? customHex : 'não aplicado'}
                </div>
              </div>
            </div>
            <button type="button" className="set-btn" onClick={() => setPickerOpen(true)}>
              Editar
            </button>
          </div>
        </section>

        {/* v4.10.0 — Telas Personalizadas movida para dentro de Cores */}
        <section className="set-card" style={{ marginTop: 14 }}>
          <div className="set-card__head">
            <div>
              <div className="set-card__eyebrow">TELAS PERSONALIZADAS</div>
              <h3 className="set-card__title">Imagens de Bloqueio e Splash</h3>
              <p className="set-card__desc">
                Personalize a tela de bloqueio e a splash de carregamento.
              </p>
            </div>
          </div>
          <ScreensCustomizationPanel />
        </section>
        </>
      ),
    },

    /* ================= ACESSIBILIDADE, EXIBIÇÃO E PWA ================= */
    /* v4.20.0 — seção própria de Áudio e Música (saiu de Exibição) */
    audio: {
      eyebrow: 'ACADEMIA • ÁUDIO E MÚSICA',
      title: 'Áudio e Música',
      content: (
        <>
          {/* v4.18.0-music — música de fundo (MAIN.mp3 em loop) */}
          <section className="set-card">
            <div className="set-card__head">
              <div>
                <div className="set-card__eyebrow">SOM</div>
                <h3 className="set-card__title">Música de Fundo</h3>
                <p className="set-card__desc">
                  Trilha sonora ambiente enquanto você usa o app. O início pode
                  acontecer no primeiro toque da tela (regra de autoplay dos
                  navegadores).
                </p>
              </div>
              <span
                style={{
                  fontSize: 12,
                  fontFamily: 'var(--font-mono, monospace)',
                  fontWeight: 700,
                  color: 'var(--primary, #f97316)',
                  background: 'rgba(var(--primary-rgb, 249, 115, 22), 0.1)',
                  padding: '4px 10px',
                  borderRadius: 8,
                  border: '1px solid rgba(var(--primary-rgb, 249, 115, 22), 0.2)',
                }}
              >
                {musicEnabled ? `Ligada • ${musicVolume}%` : 'Desligada'}
              </span>
            </div>
            <div className="set-toggles">
              <div className="set-toggle">
                <div className="set-toggle__info">
                  <span className="set-toggle__icon">{SvgVolume}</span>
                  <div>
                    <span className="set-toggle__label">Tocar Música</span>
                    <span className="set-toggle__desc">
                      Ativa a trilha sonora de fundo do app em loop contínuo
                    </span>
                  </div>
                </div>
                <label className="set-switch">
                  <input
                    type="checkbox"
                    checked={musicEnabled}
                    onChange={(e) => toggleMusic(e.target.checked)}
                  />
                  <span className="set-switch__track" />
                </label>
              </div>
            </div>
            <div
              className="set-card__head"
              style={{ marginTop: 22, marginBottom: 12 }}
            >
              <div>
                <h3 className="set-card__title">Volume</h3>
                <p className="set-card__desc">Intensidade da música de 0 a 100.</p>
              </div>
              <span
                style={{
                  fontSize: 12,
                  fontFamily: 'var(--font-mono, monospace)',
                  fontWeight: 700,
                  color: 'var(--primary, #f97316)',
                  background: 'rgba(var(--primary-rgb, 249, 115, 22), 0.1)',
                  padding: '4px 10px',
                  borderRadius: 8,
                  border: '1px solid rgba(var(--primary-rgb, 249, 115, 22), 0.2)',
                }}
              >
                {musicVolume}%
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              step="5"
              value={musicVolume}
              disabled={!musicEnabled}
              onChange={(e) => changeMusicVolume(Number(e.target.value))}
              style={{
                width: '100%',
                accentColor: 'var(--primary, #f97316)',
                background: 'rgba(24, 24, 27, 0.8)',
                height: 8,
                borderRadius: 8,
                cursor: musicEnabled ? 'pointer' : 'not-allowed',
                opacity: musicEnabled ? 1 : 0.5,
              }}
            />
            <p className="set-note" style={{ marginTop: 10 }}>
              {musicEnabled
                ? `Volume atual: ${musicVolume}%. 0% silencia a trilha sem desligá-la.`
                : 'Música desligada — ative "Tocar Música" para ajustar o volume.'}
            </p>
          </section>

          {/* v4.19.0-music — preferências de treino + acesso à interface */}
          <section className="set-card">
            <div className="set-card__head">
              <div>
                <div className="set-card__eyebrow">SOM • TREINO</div>
                <h3 className="set-card__title">Músicas Durante o Treino</h3>
                <p className="set-card__desc">
                  Se você tiver uma playlist marcada "Usar no treino", ela toca no
                  lugar das faixas do app. Sem playlist, a faixa de treino do site
                  é a trilha padrão.
                </p>
              </div>
              <span
                style={{
                  fontSize: 12,
                  fontFamily: 'var(--font-mono, monospace)',
                  fontWeight: 700,
                  color: 'var(--primary, #f97316)',
                  background: 'rgba(var(--primary-rgb, 249, 115, 22), 0.1)',
                  padding: '4px 10px',
                  borderRadius: 8,
                  border: '1px solid rgba(var(--primary-rgb, 249, 115, 22), 0.2)',
                }}
              >
                {workoutMusic ? 'Ligadas' : 'Desligadas'}
              </span>
            </div>
            <div className="set-toggles">
              <div className="set-toggle">
                <div className="set-toggle__info">
                  <span className="set-toggle__icon">{SvgVolume}</span>
                  <div>
                    <span className="set-toggle__label">Músicas do App no Treino</span>
                    <span className="set-toggle__desc">
                      Toca a faixa de treino do site quando não há playlist sua ativa
                    </span>
                  </div>
                </div>
                <label className="set-switch">
                  <input
                    type="checkbox"
                    checked={workoutMusic}
                    onChange={(e) => toggleWorkoutMusic(e.target.checked)}
                  />
                  <span className="set-switch__track" />
                </label>
              </div>
            </div>
            <button
              type="button"
              className="set-btn set-btn--music"
              style={{ width: '100%', marginTop: 14 }}
              onClick={() => window.dispatchEvent(new CustomEvent('academia:open-music'))}
            >
              Abrir Músicas e Playlists
            </button>
            <p className="set-note" style={{ marginTop: 10 }}>
              Envie suas próprias músicas, monte playlists e adicione playlists do
              YouTube ou Spotify para tocar no treino.
            </p>
          </section>

          {/* v4.22.0 — miniplayer: modo flexível (padrão) ou fixo no estilo
              do contador de duração do treino */}
          <section className="set-card">
            <div className="set-card__head">
              <div>
                <div className="set-card__eyebrow">SOM • PLAYER</div>
                <h3 className="set-card__title">Player de Música</h3>
                <p className="set-card__desc">
                  O player fica <strong>oculto por padrão</strong> — ligue em
                  "Mostrar Player" para exibi-lo. No modo <strong>Fixo</strong>{" "}
                  ele fica parado na posição escolhida; no{" "}
                  <strong>Flexível</strong> é uma pastilha que você arrasta. A{" "}
                  <strong>Gaveta</strong> esconde o player numa barra na
                  lateral: deslize pra dentro pra abrir.
                </p>
              </div>
              <span
                style={{
                  fontSize: 12,
                  fontFamily: 'var(--font-mono, monospace)',
                  fontWeight: 700,
                  color: 'var(--primary, #f97316)',
                  background: 'rgba(var(--primary-rgb, 249, 115, 22), 0.1)',
                  padding: '4px 10px',
                  borderRadius: 8,
                  border: '1px solid rgba(var(--primary-rgb, 249, 115, 22), 0.2)',
                }}
              >
                {!playerEnabled
                  ? 'Desativado'
                  : `${playerMode === 'fixed' ? 'Fixo' : 'Flexível'}${drawerOn ? ' • Gaveta' : ''}`}
              </span>
            </div>

            {/* v4.28.0 — interruptor mestre do WIDGET do player (padrão
                desligado). Não afeta a música do app ("Tocar Música"). */}
            <div className="set-toggles" style={{ marginBottom: 4 }}>
              <div className="set-toggle">
                <div className="set-toggle__info">
                  <span className="set-toggle__icon">{SvgVolume}</span>
                  <div>
                    <span className="set-toggle__label">Mostrar Player</span>
                    <span className="set-toggle__desc">
                      Exibe o player flutuante no app. Desligado, ele fica
                      oculto — a música continua seguindo "Tocar Música".
                    </span>
                  </div>
                </div>
                <label className="set-switch">
                  <input
                    type="checkbox"
                    checked={playerEnabled}
                    onChange={(e) => changePlayerEnabled(e.target.checked)}
                  />
                  <span className="set-switch__track" />
                </label>
              </div>
            </div>

            {playerEnabled && (
              <>
            <div className="set-player-modes">
              <button
                type="button"
                className={`set-player-mode${playerMode === 'flex' ? ' set-player-mode--on' : ''}`}
                onClick={() => changePlayerMode('flex')}
              >
                <span className="set-player-mode__name">Flexível</span>
                <span className="set-player-mode__desc">
                  Pastilha flutuante que você arrasta
                </span>
              </button>
              <button
                type="button"
                className={`set-player-mode${playerMode === 'fixed' ? ' set-player-mode--on' : ''}`}
                onClick={() => changePlayerMode('fixed')}
              >
                <span className="set-player-mode__name">Fixo</span>
                <span className="set-player-mode__desc">
                  Pastilha minimizada, no estilo do contador do treino
                </span>
              </button>
            </div>

            {(playerMode === 'fixed' || drawerOn) && (
              <>
                <div className="set-card__head" style={{ marginTop: 22, marginBottom: 10 }}>
                  <div>
                    <h3 className="set-card__title" style={{ fontSize: '0.95rem' }}>
                      Posição na tela
                    </h3>
                    <p className="set-card__desc">
                      Onde o player fixo fica (topo/base + esquerda/direita) e
                      de que canto nasce a barra da gaveta. No modo Flexível a
                      barra nasce na extremidade mais próxima do player.
                    </p>
                  </div>
                </div>
                <div className="set-player-positions">
                  {PLAYER_POSITIONS.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      className={`set-player-pos${playerPos === p.id ? ' set-player-pos--on' : ''}`}
                      onClick={() => changePlayerPos(p.id)}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </>
            )}

            <div className="set-card__head" style={{ marginTop: 22, marginBottom: 10 }}>
              <div>
                <h3 className="set-card__title" style={{ fontSize: '0.95rem' }}>
                  Visibilidade
                </h3>
                <p className="set-card__desc">
                  Sempre ativo, ou só alguns segundos após trocar de música.
                </p>
              </div>
            </div>
            <div className="set-player-modes">
              <button
                type="button"
                className={`set-player-mode${playerPersist === 'always' ? ' set-player-mode--on' : ''}`}
                onClick={() => changePlayerPersist('always')}
              >
                <span className="set-player-mode__name">Sempre ativo</span>
                <span className="set-player-mode__desc">Fica visível o tempo todo</span>
              </button>
              <button
                type="button"
                className={`set-player-mode${playerPersist === 'timed' ? ' set-player-mode--on' : ''}`}
                onClick={() => changePlayerPersist('timed')}
              >
                <span className="set-player-mode__name">Só após tocar</span>
                <span className="set-player-mode__desc">
                  Some após {playerSecs}s da última troca de música
                </span>
              </button>
            </div>

            {playerPersist === 'timed' && (
              <div style={{ marginTop: 16 }}>
                <div
                  className="set-card__head"
                  style={{ marginBottom: 8 }}
                >
                  <div>
                    <h3 className="set-card__title" style={{ fontSize: '0.9rem' }}>
                      Tempo visível
                    </h3>
                  </div>
                  <span
                    style={{
                      fontSize: 12,
                      fontFamily: 'var(--font-mono, monospace)',
                      fontWeight: 700,
                      color: 'var(--primary, #f97316)',
                      background: 'rgba(var(--primary-rgb, 249, 115, 22), 0.1)',
                      padding: '4px 10px',
                      borderRadius: 8,
                      border: '1px solid rgba(var(--primary-rgb, 249, 115, 22), 0.2)',
                    }}
                  >
                    {playerSecs}s
                  </span>
                </div>
                <input
                  type="range"
                  min="3"
                  max="30"
                  step="1"
                  value={playerSecs}
                  onChange={(e) => changePlayerSecs(Number(e.target.value))}
                  style={{
                    width: '100%',
                    accentColor: 'var(--primary, #f97316)',
                    background: 'rgba(24, 24, 27, 0.8)',
                    height: 8,
                    borderRadius: 8,
                    cursor: 'pointer',
                  }}
                />
                <p className="set-note" style={{ marginTop: 8 }}>
                  Quantos segundos o player fica visível após a última troca
                  de música (3 a 30s).
                </p>
              </div>
            )}

            {/* ─────────── v4.24.0 — GAVETA (convive com Flexível/Fixo) ─────────── */}
            <div className="set-card__head" style={{ marginTop: 22, marginBottom: 10 }}>
              <div>
                <h3 className="set-card__title" style={{ fontSize: '0.95rem' }}>
                  Gaveta (barra deslizante)
                </h3>
                <p className="set-card__desc">
                  Esconde o player numa barra na lateral da tela. Deslize a barra
                  pra dentro para abrir o mesmo player minimizado; clique fora para
                  recolher. No modo Fixo a barra segue a posição escolhida acima;
                  no Flexível, a última posição do player.
                </p>
              </div>
            </div>
            <div className="set-player-modes">
              <button
                type="button"
                className={`set-player-mode${!drawerOn ? ' set-player-mode--on' : ''}`}
                onClick={() => changeDrawerOn(false)}
              >
                <span className="set-player-mode__name">Desligada</span>
                <span className="set-player-mode__desc">Player aparece direto na tela</span>
              </button>
              <button
                type="button"
                className={`set-player-mode${drawerOn ? ' set-player-mode--on' : ''}`}
                onClick={() => changeDrawerOn(true)}
              >
                <span className="set-player-mode__name">Ligada</span>
                <span className="set-player-mode__desc">Barra na lateral; deslize p/ abrir</span>
              </button>
            </div>

            {drawerOn && (
              <div style={{ marginTop: 16 }}>
                <div className="set-card__head" style={{ marginBottom: 8 }}>
                  <div>
                    <h3 className="set-card__title" style={{ fontSize: '0.9rem' }}>
                      Espessura da barra
                    </h3>
                  </div>
                  <span
                    style={{
                      fontSize: 12,
                      fontFamily: 'var(--font-mono, monospace)',
                      fontWeight: 700,
                      color: 'var(--primary, #f97316)',
                      background: 'rgba(var(--primary-rgb, 249, 115, 22), 0.1)',
                      padding: '4px 10px',
                      borderRadius: 8,
                      border: '1px solid rgba(var(--primary-rgb, 249, 115, 22), 0.2)',
                    }}
                  >
                    {drawerThick}px
                  </span>
                </div>
                <input
                  type="range"
                  min="3"
                  max="14"
                  step="1"
                  value={drawerThick}
                  onChange={(e) => changeDrawerThick(Number(e.target.value))}
                  style={{
                    width: '100%',
                    accentColor: 'var(--primary, #f97316)',
                    background: 'rgba(24, 24, 27, 0.8)',
                    height: 8,
                    borderRadius: 8,
                    cursor: 'pointer',
                  }}
                />

                <div className="set-card__head" style={{ marginTop: 16, marginBottom: 8 }}>
                  <div>
                    <h3 className="set-card__title" style={{ fontSize: '0.9rem' }}>
                      Altura da barra
                    </h3>
                  </div>
                  <span
                    style={{
                      fontSize: 12,
                      fontFamily: 'var(--font-mono, monospace)',
                      fontWeight: 700,
                      color: 'var(--primary, #f97316)',
                      background: 'rgba(var(--primary-rgb, 249, 115, 22), 0.1)',
                      padding: '4px 10px',
                      borderRadius: 8,
                      border: '1px solid rgba(var(--primary-rgb, 249, 115, 22), 0.2)',
                    }}
                  >
                    {drawerVp}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="100"
                  step="0.5"
                  value={drawerVp}
                  onChange={(e) => changeDrawerVp(Number(e.target.value))}
                  style={{
                    width: '100%',
                    accentColor: 'var(--primary, #f97316)',
                    background: 'rgba(24, 24, 27, 0.8)',
                    height: 8,
                    borderRadius: 8,
                    cursor: 'pointer',
                  }}
                />
                <p className="set-note" style={{ marginTop: 8 }}>
                  Altura em % da tela (0,5 a 100; padrão 5,5 = barra de meia
                  tela).
                </p>
              </div>
            )}
              </>
            )}
          </section>

          <section className="set-card">
            <div className="set-card__head">
              <div>
                <div className="set-card__eyebrow">INTERAÇÃO</div>
                <h3 className="set-card__title">Preferências de Interação</h3>
                <p className="set-card__desc">
                  Sons, vibração e status de atividade do app.
                </p>
              </div>
            </div>
            <div className="set-toggles">
              {toggleItemsInteraction.map((item) => (
                <div className="set-toggle" key={item.key}>
                  <div className="set-toggle__info">
                    <span className="set-toggle__icon">{item.icon}</span>
                    <div>
                      <span className="set-toggle__label">{item.label}</span>
                      <span className="set-toggle__desc">{item.desc}</span>
                    </div>
                  </div>
                  <label className="set-switch">
                    <input
                      type="checkbox"
                      checked={prefs[item.key]}
                      onChange={(e) => togglePref(item.key, e.target.checked)}
                    />
                    <span className="set-switch__track" />
                  </label>
                </div>
              ))}
            </div>
          </section>
        </>
      ),
    },
    exibicao: {
      eyebrow: 'ACADEMIA • EXIBIÇÃO',
      title: 'Acessibilidade, Exibição e PWA',
      content: (
        <>
          <section className="set-card">
            <div className="set-card__head">
              <div>
                <div className="set-card__eyebrow">EXIBIÇÃO</div>
                <h3 className="set-card__title">Tela Cheia</h3>
                <p className="set-card__desc">
                  Entre em modo tela cheia automaticamente ao abrir o app.
                </p>
              </div>
            </div>
            <div className="set-toggles">
              <div className="set-toggle">
                <div className="set-toggle__info">
                  <span className="set-toggle__icon">{SvgMaximize}</span>
                  <div>
                    <span className="set-toggle__label">Tela Cheia Automática</span>
                    <span className="set-toggle__desc">
                      Ao recarregar a página, o primeiro clique ou toque em
                      qualquer lugar da tela aciona o modo tela cheia
                    </span>
                  </div>
                </div>
                <label className="set-switch">
                  <input
                    type="checkbox"
                    checked={autoFullscreen}
                    onChange={(e) => toggleAutoFullscreen(e.target.checked)}
                  />
                  <span className="set-switch__track" />
                </label>
              </div>
            </div>
            <p className="set-note" style={{ marginTop: 10 }}>
              {autoFullscreen
                ? 'Ativo: o próximo clique ou toque após recarregar entra em tela cheia. Para sair, pressione ESC.'
                : 'Desativo: o app continua na janela normal do navegador.'}
            </p>
          </section>

          <section className="set-card">
            <div className="set-card__head">
              <div>
                <div className="set-card__eyebrow">EXIBIÇÃO</div>
                <h3 className="set-card__title">Estilo do Cronômetro</h3>
                <p className="set-card__desc">
                  Visual do cronômetro de descanso durante o treino.
                </p>
              </div>
            </div>
            <div className="set-opts">
              <button
                type="button"
                className={`set-opt ${timerStyle === 'radar' ? 'set-opt--active' : ''}`}
                onClick={() => selectTimer('radar')}
              >
                {SvgTimer}
                <span className="set-opt__label">Radar</span>
              </button>
              <button
                type="button"
                className={`set-opt ${timerStyle === 'hourglass' ? 'set-opt--active' : ''}`}
                onClick={() => selectTimer('hourglass')}
              >
                {SvgHourglass}
                <span className="set-opt__label">Ampulheta</span>
              </button>
            </div>
          </section>

          <section className="set-card">
            <div className="set-card__head">
              <div>
                <div className="set-card__eyebrow">EXIBIÇÃO</div>
                <h3 className="set-card__title">Barra de Navegação</h3>
                <p className="set-card__desc">
                  Comportamento e formato da barra inferior de navegação.
                </p>
              </div>
            </div>
            <div className="set-opts">
              <button
                type="button"
                className={`set-opt ${navbarMode === 'fixed' ? 'set-opt--active' : ''}`}
                onClick={() => selectNavbarMode('fixed')}
              >
                {SvgPin}
                <span className="set-opt__label">Fixa</span>
              </button>
              <button
                type="button"
                className={`set-opt ${navbarMode === 'flexible' ? 'set-opt--active' : ''}`}
                onClick={() => selectNavbarMode('flexible')}
              >
                {SvgScrollY}
                <span className="set-opt__label">Flexível</span>
              </button>
            </div>
            <p className="set-note" style={{ marginTop: 10 }}>
              {navbarMode === 'flexible'
                ? 'A navbar recolhe ao deslizar para baixo e volta ao deslizar para cima.'
                : 'A navbar fica sempre visível na parte inferior.'}
            </p>

            {/* v4.8.3-navbars — formato visual (reta / oval) */}
            <div className="set-card__head" style={{ marginTop: 22 }}>
              <div>
                <h3 className="set-card__title">Formato da Barra</h3>
                <p className="set-card__desc">
                  Visual da barra inferior: clássica (reta) ou curva neon.
                </p>
              </div>
            </div>
            <div className="set-opts">
              <button
                type="button"
                className={`set-opt ${navbarShape === 'straight' ? 'set-opt--active' : ''}`}
                onClick={() => selectNavbarShape('straight')}
              >
                {SvgBarStraight}
                <span className="set-opt__label">Reta</span>
              </button>
              <button
                type="button"
                className={`set-opt ${navbarShape === 'oval' ? 'set-opt--active' : ''}`}
                onClick={() => selectNavbarShape('oval')}
              >
                {SvgBarCurve}
                <span className="set-opt__label">Oval</span>
              </button>
            </div>
            <p className="set-note" style={{ marginTop: 10 }}>
              {navbarShape === 'oval'
                ? 'Barra com curva neon no topo e destaque do item ativo no tema escolhido.'
                : 'Barra clássica reta, como no layout original.'}
            </p>
          </section>

          {/* v4.11.0 — Instalar Aplicativo (PWA) — reference layout */}
          <section className="set-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '4px 0' }}>
              {/* Ícone do app com glow */}
              <div style={{
                width: 56,
                height: 56,
                borderRadius: 14,
                background: '#0a0a0d',
                border: '1px solid rgba(var(--primary-rgb, 249, 115, 22), 0.4)',
                boxShadow: '0 0 20px rgba(var(--primary-rgb, 249, 115, 22), 0.25)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="var(--primary, #f97316)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="28" height="28">
                  <path d="M12 20h9" />
                  <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
                </svg>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <h3 style={{ fontFamily: 'var(--font-family)', fontSize: '1rem', fontWeight: 800, color: 'var(--text)', margin: 0 }}>
                  Instalar Aplicativo (PWA)
                </h3>
                <p style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: '0.7rem', color: 'var(--text-tertiary)', margin: '4px 0 0', lineHeight: 1.5 }}>
                  Adicione à tela inicial com o ícone oficial estilizado.
                </p>
              </div>
              <button
                type="button"
                disabled={installState === 'installed'}
                onClick={() => void handleInstallApp()}
                style={{
                  padding: '10px 18px',
                  borderRadius: 12,
                  border: installState === 'installed'
                    ? '1px solid rgba(220, 38, 38, 0.5)'
                    : '1px solid rgba(var(--primary-rgb, 249, 115, 22), 0.5)',
                  background: installState === 'installed'
                    ? 'rgba(220, 38, 38, 0.12)'
                    : 'rgba(var(--primary-rgb, 249, 115, 22), 0.12)',
                  color: installState === 'installed' ? '#f87171' : 'var(--primary, #f97316)',
                  fontFamily: 'var(--font-family)',
                  fontSize: '0.68rem',
                  fontWeight: 800,
                  letterSpacing: '1.2px',
                  textTransform: 'uppercase',
                  cursor: installState === 'installed' ? 'default' : 'pointer',
                  opacity: installState === 'installed' ? 0.7 : 1,
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                }}
              >
                {installState === 'installed' ? 'Instalado ✓' : 'Instalar'}
              </button>
            </div>
          </section>

          <section className="set-card">
            <div className="set-card__head">
              <div>
                <div className="set-card__eyebrow">DESENVOLVIMENTO</div>
                <h3 className="set-card__title">Modo Desenvolvedor</h3>
                <p className="set-card__desc">
                  Desbloqueia itens de personalização para testes.
                </p>
              </div>
            </div>
            <div className="set-toggles">
              <div className="set-toggle">
                <div className="set-toggle__info">
                  <span className="set-toggle__icon">{SvgCode}</span>
                  <div>
                    <span className="set-toggle__label">
                      Modo Desenvolvedor
                      <span className="set-badge-dev">DEV</span>
                    </span>
                    <span className="set-toggle__desc">
                      Desbloqueia itens de customização para testes
                    </span>
                  </div>
                </div>
                <label className="set-switch">
                  <input
                    type="checkbox"
                    checked={devMode}
                    onChange={(e) => onToggleDevMode(e.target.checked)}
                  />
                  <span className="set-switch__track" />
                </label>
              </div>
            </div>
          </section>

          {/* v4.9.3-settings — Esquema de Cores row (reference) */}
          <section className="set-card">
            <div className="set-card__head">
              <div>
                <div className="set-card__eyebrow">PERSONALIZAÇÃO</div>
                <h3 className="set-card__title">Esquema de Cores</h3>
                <p className="set-card__desc">
                  Escolha a cor de destaque do aplicativo.
                </p>
              </div>
              <button type="button" className="set-btn" onClick={() => setPickerOpen(true)}>
                {SvgPalette}
                Personalizar
              </button>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span
                style={{ width: 24, height: 24, borderRadius: 8, background: activeHex, border: '1px solid rgba(63, 63, 70, 0.8)' }}
              />
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)' }}>{themeDisplayName(themeKey)}</div>
                <div style={{ fontSize: 10, color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono, monospace)' }}>{activeHex}</div>
              </div>
            </div>
          </section>

          {/* v4.11.0 — Idioma do Sistema / Language — reference layout */}
          <section className="set-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '4px 0' }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <h3 style={{ fontFamily: 'var(--font-family)', fontSize: '1rem', fontWeight: 800, color: 'var(--text)', margin: 0 }}>
                  Idioma do Sistema / Language
                </h3>
                <p style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: '0.7rem', color: 'var(--text-tertiary)', margin: '4px 0 0', lineHeight: 1.5 }}>
                  Selecione o idioma de preferência para a interface.
                </p>
              </div>
              <select
                id="setLang"
                value={readLS('academia_lang') || 'pt'}
                onChange={(e) => {
                  writeLS('academia_lang', e.target.value);
                  showToast(`Idioma definido como ${e.target.value === 'pt' ? 'Português' : 'English'}.`, 'success');
                }}
                style={{
                  padding: '10px 14px',
                  borderRadius: 12,
                  border: '1px solid rgba(63, 63, 70, 0.8)',
                  background: '#18181b',
                  color: 'var(--text)',
                  fontFamily: 'var(--font-family)',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  flexShrink: 0,
                  minWidth: 160,
                }}
              >
                <option value="pt">Português (BR)</option>
                <option value="en">English (US)</option>
              </select>
            </div>
          </section>
        </>
      ),
    },
  };

  const modals = (
    <>
      {/* Seletor avançado de cores (portal no body) */}
      {pickerOpen && (
        <ColorPickerModal
          initialHex={activeHex}
          onPreview={applyThemeColor}
          onApply={(hex) => {
            applyCustomTheme(hex);
            setThemeKey(CUSTOM_THEME_ID);
            setCustomHex(hex);
            setPickerOpen(false);
            showToast('Cor personalizada aplicada!', 'success');
          }}
          onClose={() => {
            applySavedTheme();
            setPickerOpen(false);
          }}
        />
      )}

      {/* Confirmação de importação (classes legadas já existentes) */}
      {confirmOpen && (
        <div className="modal-overlay" id="modalConfirm" style={{ display: 'flex' }}>
          <div className="modal-confirm">
            <div className="confirm-icon">⚠️</div>
            <h3 id="confirmTitle">⚠️ Importar backup?</h3>
            <p id="confirmMsg">
              Esta ação irá SUBSTITUIR todos os seus dados atuais (exercícios, histórico,
              conquistas, fichas e personalização) pelos dados do arquivo selecionado. Esta ação
              não pode ser desfeita.
            </p>
            <div className="confirm-actions">
              <button type="button" className="btn btn-secondary" id="btnConfirmNo" onClick={cancelImport}>
                Cancelar
              </button>
              <button type="button" className="btn btn-danger" id="btnConfirmYes" onClick={() => void confirmImport()}>
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

      <input
        type="file"
        ref={fileRef}
        id="inputImportarJSON"
        style={{ display: 'none' }}
        accept=".json"
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = '';
          if (file) handleImportFile(file);
        }}
      />
    </>
  );

  return { tiles, screens, rootExtra, headerActions, modals };
}

export default useSettingsGroup;
