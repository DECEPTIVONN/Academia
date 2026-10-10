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
import type { HubScreen, HubTile } from './HubShell';
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

const SvgMaximize = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
    <polyline points="15 3 21 3 21 9" />
    <polyline points="9 21 3 21 3 15" />
    <line x1="21" y1="3" x2="14" y2="10" />
    <line x1="3" y1="21" x2="10" y2="14" />
  </svg>
);

const SvgInstall = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="14" height="14">
    <rect x="6" y="2" width="12" height="20" rx="2" ry="2" />
    <line x1="12" y1="9" x2="12" y2="14" />
    <polyline points="9.5 11.5 12 14 14.5 11.5" />
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

const WALL_PRESETS = [
  { id: 'neon', name: 'Neon', bg: 'linear-gradient(160deg, rgba(var(--primary-rgb, 139, 92, 246), 0.65), #0a0a10 70%)' },
  { id: 'grafite', name: 'Grafite', bg: 'linear-gradient(160deg, #3f3f46, #0a0a10 70%)' },
  { id: 'violeta', name: 'Violeta', bg: 'linear-gradient(160deg, #8b5cf6, #0a0a10 70%)' },
  { id: 'magenta', name: 'Magenta', bg: 'linear-gradient(160deg, #d946ef, #0a0a10 70%)' },
];

const LOCK_TIMEOUTS = [
  { v: '60', l: '1 min' },
  { v: '300', l: '5 min' },
  { v: '900', l: '15 min' },
  { v: '1800', l: '30 min' },
  { v: '-1', l: 'Desativado' },
];

const LOCK_PREF_MAP = {
  enabled: 'appLockEnabled',
  biometric: 'appLockBiometric',
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

  /* Cor de destaque — localStorage é a fonte da verdade */
  const [themeKey, setThemeKey] = useState(() => readLS('academia_theme') || 'purple');
  const [customHex, setCustomHex] = useState(
    () => normalizeHex(readLS(THEME_HEX_KEY) || '') || DEFAULT_HEX
  );
  const [pickerOpen, setPickerOpen] = useState(false);

  const [timerStyle, setTimerStyle] = useState(() => readLS('timerStyle') || 'radar');
  const [navbarMode, setNavbarMode] = useState<string>(
    () => readLS(PREF_KEYS.navbarMode) || 'fixed'
  );
  const [autoFullscreen, setAutoFullscreen] = useState(
    () => readLS(PREF_KEYS.autoFullscreen) === 'true'
  );
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
  }));

  /* Placeholders de Segurança/Notificações — prefs salvas, sem efeito real */
  const [lock, setLock] = useState<LockState>(() => ({
    enabled: readLS(PREF_KEYS.appLockEnabled) === 'true' ? 'true' : 'false',
    biometric: readLS(PREF_KEYS.appLockBiometric) === 'true' ? 'true' : 'false',
    timeout: readLS(PREF_KEYS.appLockTimeout) || '300',
    wallV: readLS(PREF_KEYS.lockWallVertical) || 'neon',
    wallH: readLS(PREF_KEYS.lockWallHorizontal) || 'grafite',
    reminder: readLS(PREF_KEYS.workoutReminder) === 'true' ? 'true' : 'false',
    reminderTime: readLS(PREF_KEYS.workoutReminderTime) || '18:00',
  }));

  /* Campos de segurança (init único quando o estado carrega) */
  const [sec, setSec] = useState({ nome: '', handle: '', email: '', senha: '' });
  const secInitedRef = useRef(false);
  useEffect(() => {
    if (!profile || secInitedRef.current) return;
    secInitedRef.current = true;
    const p = profile.customization;
    setSec({ nome: p.nome || '', handle: p.handle || '', email: p.email || '', senha: '' });
  }, [profile]);

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
  };

  const selectNavbarMode = (value: string) => {
    writeLS(PREF_KEYS.navbarMode, value);
    setNavbarMode(value);
    window.dispatchEvent(new CustomEvent('academia:navbar-mode-changed'));
  };

  const toggleAutoFullscreen = (checked: boolean) => {
    writeLS(PREF_KEYS.autoFullscreen, String(checked));
    setAutoFullscreen(checked);
    window.dispatchEvent(new CustomEvent('academia:auto-fullscreen-changed'));
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
  };

  const updateLock = (key: LockKey, value: string) => {
    setLock((l) => ({ ...l, [key]: value }));
    writeLS(PREF_KEYS[LOCK_PREF_MAP[key]], value);
  };

  const saveSecurityField = async (
    field: 'nome' | 'handle' | 'email' | 'senha',
    value: string
  ) => {
    await update((d) => {
      d.customization = { ...d.customization, [field]: value };
    });
    showToast('Campo atualizado!', 'success');
    if (field === 'senha') setSec((s) => ({ ...s, senha: '' }));
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

  const deviceInfo = (() => {
    const ua = typeof navigator !== 'undefined' ? navigator.userAgent : '';
    const browser = /Edg\//.test(ua)
      ? 'Edge'
      : /OPR\//.test(ua)
        ? 'Opera'
        : /Chrome\//.test(ua)
          ? 'Chrome'
          : /Firefox\//.test(ua)
            ? 'Firefox'
            : /Safari\//.test(ua)
              ? 'Safari'
              : 'Navegador';
    const os = /Windows/.test(ua)
      ? 'Windows'
      : /Android/.test(ua)
        ? 'Android'
        : /iPhone|iPad|iPod/.test(ua)
          ? 'iOS'
          : /Mac OS/.test(ua)
            ? 'macOS'
            : /Linux/.test(ua)
              ? 'Linux'
              : 'Sistema local';
    return { browser, os };
  })();

  const secFields = [
    {
      field: 'nome' as const,
      label: 'Nome de Exibição',
      type: 'text',
      placeholder: 'Seu nome...',
      icon: SvgUser,
    },
    {
      field: 'handle' as const,
      label: 'Nome de Usuário (@handle)',
      type: 'text',
      placeholder: '@usuario...',
      icon: SvgUser,
    },
    {
      field: 'email' as const,
      label: 'E-mail',
      type: 'email',
      placeholder: 'seu@email.com',
      icon: SvgMail,
    },
    {
      field: 'senha' as const,
      label: 'Senha',
      type: 'password',
      placeholder: 'Nova senha...',
      icon: SvgLockSm,
    },
  ];

  const renderSecField = (f: (typeof secFields)[number]) => (
    <div className="set-field" key={f.field}>
      <label className="set-field__label" htmlFor={`setSec-${f.field}`}>
        {f.icon}
        {f.label}
      </label>
      <div className="set-field__row">
        <input
          id={`setSec-${f.field}`}
          type={f.type}
          className="set-input"
          placeholder={f.placeholder}
          value={sec[f.field]}
          onChange={(e) => setSec((s) => ({ ...s, [f.field]: e.target.value }))}
        />
        <button
          type="button"
          className="set-save"
          title={`Salvar ${f.label}`}
          aria-label={`Salvar ${f.label}`}
          onClick={() => void saveSecurityField(f.field, sec[f.field])}
        >
          {SvgCheck}
        </button>
      </div>
    </div>
  );

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
      badge: lock.enabled === 'true' ? 'Bloqueio Ativo' : 'Desativado',
      keywords: [
        'seguranca', 'bloqueio', 'senha', 'pin', 'biometria', 'digital',
        'impressao', 'inatividade', 'wallpaper', 'tela de bloqueio',
        'dispositivos', 'sessoes', 'aparelhos', 'privacidade',
      ],
    },
    {
      id: 'notificacoes',
      title: 'Notificações',
      desc: 'Lembrete de treino e mensagens motivacionais',
      icon: SvgBell,
      badge: lock.reminder === 'true' ? 'Lembrete ativo' : 'Silenciadas',
      keywords: [
        'notificacoes', 'lembrete', 'treino', 'horario', 'alarme',
        'mensagens', 'motivacionais', 'frases', 'incentivo',
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
      desc: 'Tela cheia, cronômetro, navbar, instalar app e interação',
      icon: SvgSliders,
      badge: autoFullscreen ? 'Tela cheia' : 'Padrão',
      keywords: [
        'exibicao', 'acessibilidade', 'tela cheia', 'fullscreen', 'telacheia',
        'pwa', 'instalar', 'app', 'aplicativo', 'install', 'cronometro',
        'timer', 'ampulheta', 'radar', 'navbar', 'barra', 'navegacao',
        'sons', 'som', 'vibracao', 'online', 'status', 'dev', 'desenvolvedor',
      ],
    },
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

  const screens: Record<string, HubScreen> = {
    /* ================= SUA CONTA (GRUPO) ================= */
    conta: {
      title: 'Sua Conta',
      tiles: contaTiles,
      screens: {
        informacoes: {
          title: 'Informações da Conta',
          content: (
            <section className="set-card">
              <div className="set-card__head">
                <div>
                  <div className="set-card__eyebrow">CONTA</div>
                  <h3 className="set-card__title">Informações da Conta</h3>
                  <p className="set-card__desc">Dados salvos localmente neste dispositivo.</p>
                </div>
              </div>
              {secFields.filter((f) => f.field !== 'senha').map(renderSecField)}
            </section>
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
              {secFields.filter((f) => f.field === 'senha').map(renderSecField)}
              <p className="set-note" style={{ marginTop: 10 }}>
                🔒 Armazenado localmente no dispositivo.
              </p>
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
      },
    },

    /* ================= SEGURANÇA (PLACEHOLDERS) ================= */
    seguranca: {
      title: 'Segurança e Acesso à Conta',
      content: (
        <>
          <section className="set-card">
            <div className="set-card__head">
              <div>
                <div className="set-card__eyebrow">SEGURANÇA</div>
                <h3 className="set-card__title">
                  Bloqueio do App
                  <span className="set-badge-soon">EM BREVE</span>
                </h3>
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
                    <span className="set-toggle__label">Bloqueio por Impressão Digital</span>
                    <span className="set-toggle__desc">
                      Desbloqueio com digital, Touch ID ou Windows Hello
                    </span>
                  </div>
                </div>
                <label className="set-switch">
                  <input
                    type="checkbox"
                    checked={lock.biometric === 'true'}
                    onChange={(e) => updateLock('biometric', String(e.target.checked))}
                  />
                  <span className="set-switch__track" />
                </label>
              </div>
            </div>
            <div className="set-field" style={{ marginTop: 14, marginBottom: 0 }}>
              <label className="set-field__label">
                {SvgTimer}
                Intervalo de Inatividade
              </label>
              <div className="set-chips">
                {LOCK_TIMEOUTS.map((o) => (
                  <button
                    key={o.v}
                    type="button"
                    className={`set-chip ${lock.timeout === o.v ? 'set-chip--active' : ''}`}
                    onClick={() => updateLock('timeout', o.v)}
                  >
                    {o.l}
                  </button>
                ))}
              </div>
            </div>
            <p className="set-note" style={{ marginTop: 10 }}>
              Em breve: as preferências ficam salvas neste dispositivo, mas o
              bloqueio ainda não tem efeito.
            </p>
          </section>

          <section className="set-card">
            <div className="set-card__head">
              <div>
                <div className="set-card__eyebrow">PERSONALIZAÇÃO</div>
                <h3 className="set-card__title">
                  Wallpaper da Tela de Bloqueio
                  <span className="set-badge-soon">EM BREVE</span>
                </h3>
                <p className="set-card__desc">
                  Escolha o visual da tela de bloqueio em orientação vertical e horizontal.
                </p>
              </div>
            </div>
            <div className="set-wall-grid">
              {wallCard('v')}
              {wallCard('h')}
            </div>
            <p className="set-note" style={{ marginTop: 10 }}>
              Em breve: o wallpaper escolhido será exibido na tela de bloqueio do app.
            </p>
          </section>

          <section className="set-card">
            <div className="set-card__head">
              <div>
                <div className="set-card__eyebrow">DISPOSITIVOS</div>
                <h3 className="set-card__title">Dispositivos Conectados</h3>
                <p className="set-card__desc">
                  Sessões ativas e dispositivos autorizados.
                </p>
              </div>
            </div>
            <div className="set-toggles">
              <div className="set-toggle">
                <div className="set-toggle__info">
                  <span className="set-toggle__icon">
                    {/Android|iPhone|iPad|iPod/.test(navigator.userAgent)
                      ? SvgSmartphone
                      : SvgLaptop}
                  </span>
                  <div>
                    <span className="set-toggle__label">
                      Este Dispositivo
                      <span className="set-badge-dev" style={{ marginLeft: 7 }}>
                        ATUAL
                      </span>
                    </span>
                    <span className="set-toggle__desc">
                      {deviceInfo.browser} • {deviceInfo.os}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <p className="set-note" style={{ marginTop: 10 }}>
              A sincronização entre dispositivos chega em breve. Por enquanto
              seus dados são 100% locais.
            </p>
          </section>
        </>
      ),
    },

    /* ================= NOTIFICAÇÕES ================= */
    notificacoes: {
      title: 'Notificações',
      content: (
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
                <span className="set-toggle__icon">{SvgTimer}</span>
                <div>
                  <span className="set-toggle__label">
                    Lembrete de Horário de Treino
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
                <span className="set-toggle__icon">{SvgChat}</span>
                <div>
                  <span className="set-toggle__label">Mensagens Motivacionais</span>
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
            Em breve: o lembrete de treino será enviado por notificações do
            sistema no horário definido.
          </p>
        </section>
      ),
    },

    /* ================= ESQUEMA DE CORES ================= */
    cores: {
      title: 'Esquema de Cores e Personalização',
      content: (
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
      ),
    },

    /* ================= ACESSIBILIDADE, EXIBIÇÃO E PWA ================= */
    exibicao: {
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
                  Escolha se a navbar inferior fica sempre visível ou se recolhe ao rolar.
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
          </section>

          <section className="set-card">
            <div className="set-card__head">
              <div>
                <div className="set-card__eyebrow">APLICATIVO</div>
                <h3 className="set-card__title">Instalar App (PWA)</h3>
                <p className="set-card__desc">
                  Instale o Academia na tela inicial para abrir como um app
                  independente, mais rápido e 100% offline.
                </p>
              </div>
            </div>
            <div className="set-install">
              <button
                type="button"
                className="set-btn set-btn--primary"
                disabled={installState !== 'available'}
                onClick={() => void handleInstallApp()}
              >
                {SvgInstall}
                {installState === 'installed' ? 'App instalado' : 'Instalar agora'}
              </button>
            </div>
            <p className="set-note" style={{ marginTop: 10 }}>
              {installState === 'installed'
                ? 'Este app já está instalado neste dispositivo.'
                : installState === 'available'
                  ? 'Toque em "Instalar agora" e confirme o prompt do navegador.'
                  : 'Seu navegador não ofereceu o prompt. Use o menu do navegador → "Instalar aplicativo" ou "Adicionar à tela inicial".'}
            </p>
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
        </>
      ),
    },
  };

  const rootExtra = (
    <button
      type="button"
      className="set-logout"
      onClick={() =>
        showToast('Sessão local: não há login remoto para sair — em breve!', 'info')
      }
    >
      {SvgLogOut}
      <span className="set-logout__body">
        <span className="set-logout__title">Sair da Conta</span>
        <span className="set-logout__desc">Desconecte a sessão local deste dispositivo</span>
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
