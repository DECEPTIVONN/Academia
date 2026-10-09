/**
 * SettingsFeature.tsx — Interface dedicada de Configurações (v4.1.0)
 *
 * Hub com busca + tiles + pilha de navegação (back) no estilo do
 * SettingsStandalone.tsx, renderizado dentro da aba PREFERÊNCIAS do
 * overlay de Perfil. Inclui APENAS configurações que já existiam no site:
 *
 *   • exibicao  → cor de destaque (12 presets + personalizado + seletor
 *                 avançado) e estilo do cronômetro (radar/ampulheta);
 *   • geral     → 4 preferências (sons/vibração/mensagens/online) +
 *                 modo desenvolvedor;
 *   • seguranca → nome, handle, e-mail e senha (useProfileState);
 *   • assinatura→ planos Gratuito / PRO (EM BREVE);
 *   • hub       → backup rápido (exportar/importar JSON).
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
import { HubShell, type HubScreen } from './HubShell';
import './settings.css';

type SettingsScreen = 'exibicao' | 'geral' | 'seguranca' | 'assinatura';

export interface SettingsFeatureProps {
  devMode: boolean;
  onToggleDevMode: (checked: boolean) => void;
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

const SvgStar = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="20" height="20">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 6.91 8.26 12 2" />
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

const SvgShieldCheck = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="14" height="14">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    <polyline points="9 12 11 14 15 10" />
  </svg>
);

const SvgXSm = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="14" height="14">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

export function SettingsFeature({ devMode, onToggleDevMode }: SettingsFeatureProps) {
  const { state: profile, update } = useProfileState();

  /* Cor de destaque — localStorage é a fonte da verdade */
  const [themeKey, setThemeKey] = useState(() => readLS('academia_theme') || 'purple');
  const [customHex, setCustomHex] = useState(
    () => normalizeHex(readLS(THEME_HEX_KEY) || '') || DEFAULT_HEX
  );
  const [pickerOpen, setPickerOpen] = useState(false);

  const [timerStyle, setTimerStyle] = useState(() => readLS('timerStyle') || 'radar');
  const [prefs, setPrefs] = useState(() => ({
    sounds: readLS(PREF_KEYS.sounds) !== 'false',
    vibration: readLS(PREF_KEYS.vibration) !== 'false',
    messages: readLS(PREF_KEYS.messages) !== 'false',
    online: readLS(PREF_KEYS.online) === 'true',
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

  const togglePref = (key: keyof typeof prefs, checked: boolean) => {
    setPrefs((p) => ({ ...p, [key]: checked }));
    writeLS(PREF_KEYS[key], String(checked));
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
  const activePrefsCount = Object.values(prefs).filter(Boolean).length;

  const tiles: {
    id: SettingsScreen;
    title: string;
    desc: string;
    icon: ReactNode;
    badge: string;
    keywords: string[];
  }[] = [
    {
      id: 'exibicao',
      title: 'Sistema de Cores',
      desc: 'Cor de destaque, paletas e estilo do cronômetro',
      icon: SvgPalette,
      badge: themeDisplayName(themeKey),
      keywords: ['cor', 'tema', 'paleta', 'neon', 'personalizado', 'exibicao', 'aparencia', 'cronometro', 'ampulheta', 'radar', 'timer'],
    },
    {
      id: 'geral',
      title: 'Preferências Gerais',
      desc: 'Sons, vibração, mensagens, status online e modo dev',
      icon: SvgSliders,
      badge: `${activePrefsCount} de 4 ativas`,
      keywords: ['geral', 'som', 'sons', 'vibracao', 'mensagens', 'online', 'status', 'dev', 'desenvolvedor', 'toggle'],
    },
    {
      id: 'seguranca',
      title: 'Segurança & Conta',
      desc: 'Nome de exibição, @handle, e-mail e senha',
      icon: SvgLock,
      badge: profile?.customization.handle || 'Local',
      keywords: ['seguranca', 'senha', 'email', 'conta', 'handle', 'usuario', 'nome'],
    },
    {
      id: 'assinatura',
      title: 'Assinatura',
      desc: 'Plano Gratuito e Academia PRO',
      icon: SvgStar,
      badge: 'Gratuito',
      keywords: ['assinatura', 'pro', 'plano', 'pagamento', 'gratis', 'upgrade'],
    },
  ];

  const toggleItems = [
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
      key: 'messages' as const,
      label: 'Mensagens Motivacionais',
      desc: 'Frases de incentivo ao concluir treinos',
      icon: SvgChat,
    },
    {
      key: 'online' as const,
      label: 'Status Online',
      desc: 'Mostrar sua atividade para amigos',
      icon: SvgGlobe,
    },
  ];

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

  const screens: Record<SettingsScreen, HubScreen> = {
    /* ================= EXIBIÇÃO & CORES ================= */
    exibicao: {
      title: 'Cores & Exibição',
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
                <button
                  type="button"
                  className="set-btn"
                  onClick={() => setPickerOpen(true)}
                >
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
                <button
                  type="button"
                  className="set-btn"
                  onClick={() => setPickerOpen(true)}
                >
                  Editar
                </button>
              </div>
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
        </>
      ),
    },

    /* ================= GERAL ================= */
    geral: {
      title: 'Preferências Gerais',
      content: (
        <>
            <section className="set-card">
              <div className="set-card__head">
                <div>
                  <div className="set-card__eyebrow">PREFERÊNCIAS</div>
                  <h3 className="set-card__title">Geral</h3>
                  <p className="set-card__desc">
                    Controle o comportamento do app no dia a dia.
                  </p>
                </div>
              </div>
              <div className="set-toggles">
                {toggleItems.map((item) => (
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

    /* ================= SEGURANÇA ================= */
    seguranca: {
      title: 'Segurança & Conta',
      content: (
        <>
            <section className="set-card">
              <div className="set-card__head">
                <div>
                  <div className="set-card__eyebrow">CONTA</div>
                  <h3 className="set-card__title">Segurança</h3>
                  <p className="set-card__desc">
                    Dados salvos localmente neste dispositivo.
                  </p>
                </div>
              </div>

              {secFields.map((f) => (
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
                  {f.field === 'senha' && (
                    <p className="set-note">🔒 Armazenado localmente no dispositivo.</p>
                  )}
                </div>
              ))}
            </section>
        </>
      ),
    },

    /* ================= ASSINATURA ================= */
    assinatura: {
      title: 'Assinatura',
      content: (
        <>
            <section className="set-card">
              <div className="set-card__head">
                <div>
                  <div className="set-card__eyebrow">PLANOS</div>
                  <h3 className="set-card__title">Assinatura</h3>
                  <p className="set-card__desc">Escolha o plano ideal para sua jornada.</p>
                </div>
              </div>

              <div className="set-plans">
                <div className="set-plan set-plan--active">
                  <div className="set-plan__badge">ATUAL</div>
                  <div className="set-plan__name">Gratuito</div>
                  <div className="set-plan__price">
                    R$ 0<span>/mês</span>
                  </div>
                  <ul className="set-plan__features">
                    <li>{SvgCheck} Fichas de treino ilimitadas</li>
                    <li>{SvgCheck} Calendário de progresso</li>
                    <li>{SvgCheck} Conquistas e badges</li>
                    <li className="set-plan__feature--off">
                      {SvgXSm} Radar Fit avançado
                    </li>
                    <li className="set-plan__feature--off">
                      {SvgXSm} Exportação de dados
                    </li>
                  </ul>
                </div>

                <div className="set-plan set-plan--pro">
                  <div className="set-plan__badge set-plan__badge--pro">PRO</div>
                  <div className="set-plan__name">Academia PRO</div>
                  <div className="set-plan__price">
                    R$ 9<span>/mês</span>
                  </div>
                  <ul className="set-plan__features">
                    <li>{SvgCheck} Tudo do gratuito</li>
                    <li>{SvgCheck} Radar Fit avançado</li>
                    <li>{SvgCheck} Exportação de relatórios</li>
                    <li>{SvgCheck} Banners e emblemas exclusivos</li>
                    <li>{SvgCheck} Suporte prioritário</li>
                  </ul>
                  <button type="button" className="set-btn set-btn--primary set-plan__cta">
                    EM BREVE
                  </button>
                </div>
              </div>

              <div
                className="set-note"
                style={{
                  marginTop: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '7px',
                }}
              >
                {SvgShieldCheck} Seus dados permanecem locais, com ou sem PRO.
              </div>
            </section>
        </>
      ),
    },
  };

  return (
    <>
      <HubShell
        eyebrow="ACADEMIA • PREFERÊNCIAS"
        title="Configurações"
        sub="Ajustes salvos neste dispositivo"
        searchPlaceholder="Buscar ajuste (cores, backup, segurança...)"
        emptyText="Nenhuma configuração encontrada."
        tiles={tiles}
        screens={screens}
        headerActions={
          <button
            type="button"
            className="set-btn"
            title="Exportar backup JSON"
            onClick={() => void handleExport()}
          >
            {SvgDownload}
            Backup
          </button>
        }
        hubExtra={
          /* Quick bar: armazenamento local & portabilidade */
          <div className="set-quickbar">
            <div className="set-quickbar__info">
              <span className="set-quickbar__icon">{SvgDatabase}</span>
              <div>
                <div className="set-quickbar__title">Armazenamento Local</div>
                <p className="set-quickbar__desc">
                  Exporte ou restaure seus dados em JSON.
                </p>
              </div>
            </div>
            <div className="set-quickbar__actions">
              <button
                type="button"
                className="set-btn"
                onClick={() => void handleExport()}
              >
                {SvgDownload}
                Exportar
              </button>
              <button
                type="button"
                className="set-btn"
                onClick={() => fileRef.current?.click()}
              >
                {SvgUpload}
                Importar
              </button>
            </div>
          </div>
        }
      />

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
}

export default SettingsFeature;
