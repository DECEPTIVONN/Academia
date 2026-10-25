import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'motion/react';
import { ArrowLeft, Check, Facebook, Instagram, MessageCircle, MoreHorizontal, Music2, Search, Ticket, Users } from 'lucide-react';
import { useAuth } from '@/core/auth/use-auth';
import { useProfileState } from '@/features/profile/useProfileState';
import { DEFAULT_PROFILE_CUSTOMIZATION, type ProfileCustomization } from '@/core/db/schema';
import { showToast } from '@/lib/toast';
import { loadLocalData } from '@/core/db/queries';
import { applyTemplate } from '@/features/workout/treinos/treinos-helpers';

interface OnboardingScreenProps {
  open: boolean;
  onComplete: () => void;
}

/* Cor em destaque das perguntas pós-login (vermelho, conforme solicitado). */
const ACCENT = '#ef4444';
const ACCENT_SOFT = 'rgba(239, 68, 68, 0.12)';
const CARD_BORDER = '1px solid rgba(255,255,255,0.12)';
const DIVIDER = '1px solid rgba(255,255,255,0.08)';

const OBJECTIVES = [
  'Hipertrofia (iniciante)',
  'Hipertrofia (médio)',
  'Hipertrofia (médio II)',
  'Tonificar',
  'Perda ponderal (médio) SUP/INF',
  'Perda ponderal (médio II) SUP/INF',
  'Push/Pull',
  'Treino personalizado',
];

/* Mesma regra do cadastro (AuthScreen): 3–20 chars, letras/números/_ */
const USERNAME_RE = /^[a-z0-9_]{3,20}$/;

/* Máximo de motivos da etapa "Motivo" (imagem de referência). */
const MAX_REASONS = 3;

function slugifyUsername(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, '')
    .slice(0, 20);
}

/* ── Ícones da etapa "Indicação" (o lucide não traz TikTok/Reddit) ── */

const REFERRAL_ICONS = {
  afiliado: Ticket,
  instagram: Instagram,
  tiktok: Music2,
  facebook: Facebook,
  reddit: MessageCircle,
  google: Search,
  amigos: Users,
  outro: MoreHorizontal,
} as const;

type ReferralIcon = keyof typeof REFERRAL_ICONS;

/* ── Definição das etapas (ordem do assistente) ── */

type StepId =
  | 'conta'
  | 'motivo'
  | 'objetivos'
  | 'experiencia'
  | 'sexo'
  | 'corpo'
  | 'frequencia'
  | 'local'
  | 'indicacao'
  | 'plano'
  | 'notificacoes';

interface OptionDef {
  value: string;
  title: string;
  desc?: string;
  badge?: string;
  icon?: ReferralIcon;
}

interface StepDef {
  id: StepId;
  /** Nome exibido no cabeçalho ao lado do contador "(n/total)". */
  label: string;
  /** Título da pergunta — trecho entre {chaves} sai em vermelho. */
  title: string;
  subtitle: string;
  options?: OptionDef[];
  skippable?: boolean;
  /** Rótulo do botão do rodapé (padrão: Continuar). */
  actionLabel?: string;
}

const STEPS: StepDef[] = [
  {
    id: 'conta',
    label: 'Sua Conta',
    title: 'Como você quer aparecer {no app}?',
    subtitle: 'Nome, usuário e — se você entrou com Google — a senha da conta.',
    skippable: false,
  },
  {
    id: 'motivo',
    label: 'Motivo',
    title: 'Por que você quer usar um {aplicativo de fitness}?',
    subtitle: `Selecione até ${MAX_REASONS} motivos.`,
    skippable: true,
    options: [
      { value: 'Sou iniciante e quero orientação', title: 'Sou iniciante e quero orientação' },
      { value: 'Quero melhorar minha rotina de treino atual', title: 'Quero melhorar minha rotina de treino atual' },
      { value: 'Quero mais variedade no meu plano de treino', title: 'Quero mais variedade no meu plano de treino' },
      {
        value: 'Quero um plano de treino ideal para as minhas necessidades específicas',
        title: 'Quero um plano de treino ideal para as minhas necessidades específicas',
      },
      {
        value: 'Quero saber exatamente o que fazer na academia todas as vezes',
        title: 'Quero saber exatamente o que fazer na academia todas as vezes',
      },
    ],
  },
  {
    id: 'objetivos',
    label: 'Principais Objetivos',
    title: 'Quais são seus principais {objetivos fitness}?',
    subtitle: 'Escolha um. Vamos adaptar seus treinos.',
    skippable: true,
    options: [
      {
        value: 'Construa músculos e tonifique-se',
        title: 'Construa músculos e tonifique-se',
        desc: 'Treine para ganhar músculos e definição.',
        badge: 'Popular',
      },
      {
        value: 'Melhore sua aptidão física geral',
        title: 'Melhore sua aptidão física geral',
        desc: 'Crie uma rotina de treino equilibrada.',
      },
      {
        value: 'Melhore o condicionamento',
        title: 'Melhore o condicionamento',
        desc: 'Ganhe resistência com mais repetições.',
      },
      {
        value: 'Fique mais forte',
        title: 'Fique mais forte',
        desc: 'Levante mais peso com menos repetições.',
        badge: 'Powerlifting',
      },
    ],
  },
  {
    id: 'experiencia',
    label: 'Tempo de Experiência',
    title: 'Quão {experiente} você é levantando pesos?',
    subtitle: 'Escolha seu nível na musculação.',
    skippable: true,
    options: [
      { value: 'Sem Experiência', title: 'Sem Experiência', desc: 'Estou começando na musculação.' },
      { value: 'Iniciante', title: 'Iniciante', desc: 'Menos de um ano de musculação.' },
      { value: 'Intermediário', title: 'Intermediário', desc: 'De 1 a 3 anos de treino regular.' },
      { value: 'Avançado', title: 'Avançado', desc: 'Mais de 3 anos de treino consistente.' },
    ],
  },
  {
    id: 'sexo',
    label: 'Sexo',
    title: 'Qual é o seu {sexo}?',
    subtitle: 'Ajuda a calibrar cargas e recomendações. A resposta fica só com você.',
    skippable: true,
    options: [
      { value: 'Masculino', title: 'Masculino' },
      { value: 'Feminino', title: 'Feminino' },
      { value: 'Prefiro não informar', title: 'Prefiro não informar' },
    ],
  },
  {
    /* Idade + peso + altura na MESMA etapa (pedido). */
    id: 'corpo',
    label: 'Idade, Peso e Altura',
    title: 'Conte um pouco sobre o seu {corpo}',
    subtitle: 'Idade, peso e altura personalizam cargas, descanso e métricas de progresso.',
    skippable: true,
  },
  {
    id: 'frequencia',
    label: 'Frequência de Treino',
    title: 'Com que {frequência} você quer treinar?',
    subtitle: 'Estabelecer uma meta realista ajudará você a se manter motivado e acompanhar seu progresso.',
    skippable: true,
    options: [
      { value: '1', title: '1 dia por semana' },
      { value: '2', title: '2 dias por semana', badge: 'Recomendado' },
      { value: '3', title: '3 dias por semana', badge: 'Recomendado' },
      { value: '4', title: '4 dias por semana' },
      { value: '5', title: '5 dias por semana' },
      { value: '6', title: '6 dias por semana' },
      { value: '7', title: 'Todos os dias' },
    ],
  },
  {
    id: 'local',
    label: 'Local de Treino',
    title: 'Onde você se {exercita}?',
    subtitle: 'Selecione os equipamentos aos quais você tem acesso. Você pode alterar isso mais tarde.',
    skippable: true,
    options: [
      {
        value: 'Academia Grande',
        title: 'Academia Grande',
        desc: 'Academias completas como Anytime, Fitness First, Golds, Planet Fitness, etc.',
      },
      { value: 'Academia Pequena', title: 'Academia Pequena', desc: 'Academia compacta com equipamentos limitados.' },
      { value: 'Academia em Casa', title: 'Academia em Casa', desc: 'Halteres, suportes para agachamento e mais.' },
      { value: 'Sem equipamentos', title: 'Sem equipamentos', desc: 'Exercícios com o peso do corpo, corrida e calistenia.' },
    ],
  },
  {
    id: 'indicacao',
    label: 'Indicação',
    title: 'Como você {conheceu} o app?',
    subtitle: 'Queremos saber como você nos encontrou para melhorar nosso serviço.',
    skippable: true,
    options: [
      { value: 'Código de afiliado', title: 'Código de afiliado', icon: 'afiliado' },
      { value: 'Instagram', title: 'Instagram', icon: 'instagram' },
      { value: 'TikTok', title: 'TikTok', icon: 'tiktok' },
      { value: 'Facebook', title: 'Facebook', icon: 'facebook' },
      { value: 'Reddit', title: 'Reddit', icon: 'reddit' },
      { value: 'Google', title: 'Google', icon: 'google' },
      { value: 'Amigos ou família', title: 'Amigos ou família', icon: 'amigos' },
      { value: 'Outro', title: 'Outro', icon: 'outro' },
    ],
  },
  {
    id: 'plano',
    label: 'Programa de Treino',
    title: 'Qual {programa} você quer seguir?',
    subtitle: 'Escolha uma pré-definida — aplicamos a ficha na hora — ou monte o seu.',
    skippable: false,
    options: OBJECTIVES.map((objective) => ({ value: objective, title: objective })),
  },
  {
    /* Última etapa (pedido): notificações → tela de boas-vindas. */
    id: 'notificacoes',
    label: 'Notificações',
    title: '{Ativar} notificações',
    subtitle: 'Para obter todos os benefícios do Evo Fit, ative suas notificações para receber:',
    skippable: true,
    actionLabel: 'Ativar',
  },
];

/* Campos do perfil gravados por cada etapa de opção única. */
function fieldsForStep(stepId: StepId, value: string): Partial<ProfileCustomization> {
  switch (stepId) {
    case 'objetivos':
      return { mainGoals: value };
    case 'experiencia':
      return { experienceLevel: value };
    case 'sexo':
      return { gender: value };
    case 'frequencia':
      return { trainingFrequencyDays: Number(value) };
    case 'local':
      return { trainingPlace: value };
    case 'indicacao':
      return { referralSource: value };
    default:
      return {};
  }
}

/* ── Peças visuais (estilo das imagens de referência, destaque vermelho) ── */

function renderTitle(text: string) {
  return text.split(/\\{|\\}/).map((part, i) => {
    if (i % 2 === 1) {
      return <span key={i} style={{ color: ACCENT }}>{part}</span>;
    } else {
      return <React.Fragment key={i}>{part}</React.Fragment>;
    }
  });
}

function Radio({ selected }: { selected: boolean }) {
  return (
    <span
      aria-hidden="true"
      className="shrink-0 flex items-center justify-center w-6 h-6 rounded-full border-2 transition-colors"
      style={{
        borderColor: selected ? ACCENT : 'rgba(255,255,255,0.35)',
        background: selected ? ACCENT_SOFT : 'transparent',
      }}
    >
      {selected && <span className="w-2.5 h-2.5 rounded-full" style={{ background: ACCENT }} />}
    </span>
  );
}

function Checkbox({ checked }: { checked: boolean }) {
  return (
    <span
      aria-hidden="true"
      className="shrink-0 flex items-center justify-center w-6 h-6 rounded-md border-2 transition-colors"
      style={{
        borderColor: checked ? ACCENT : 'rgba(255,255,255,0.3)',
        background: checked ? ACCENT : 'transparent',
      }}
    >
      {checked && <Check className="w-4 h-4" strokeWidth={3} style={{ color: '#07070a' }} />}
    </span>
  );
}

/** Linha de múltipla escolha (etapa Motivo): texto à esquerda, check à direita. */
function CheckRow({
  title,
  checked,
  onToggle,
}: {
  title: string;
  checked: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={checked}
      className="w-full flex items-center gap-4 py-4 text-left"
      style={{ borderTop: DIVIDER }}
    >
      <span className="flex-1 text-[15px] leading-snug text-white">{title}</span>
      <Checkbox checked={checked} />
    </button>
  );
}

function OptionCard({
  option,
  selected,
  onSelect,
}: {
  option: OptionDef;
  selected: boolean;
  onSelect: () => void;
}) {
  const Icon = option.icon ? REFERRAL_ICONS[option.icon] : null;
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className="w-full flex items-center gap-4 rounded-2xl px-4 py-4 text-left transition-colors"
      style={{
        border: CARD_BORDER,
        borderColor: selected ? ACCENT : 'rgba(255,255,255,0.12)',
        background: selected ? ACCENT_SOFT : 'rgba(255,255,255,0.02)',
      }}
    >
      {Icon && (
        <span
          className="shrink-0 flex items-center justify-center w-9 h-9 rounded-lg"
          style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.85)' }}
        >
          <Icon className="w-5 h-5" />
        </span>
      )}
      <span className="min-w-0 flex-1">
        {option.badge && (
          <span
            className="inline-block mb-1.5 rounded-md px-2 py-0.5 text-[11px] font-bold"
            style={{ background: ACCENT_SOFT, color: '#fca5a5' }}
          >
            {option.badge}
          </span>
        )}
        <span className="block font-semibold text-white">{option.title}</span>
        {option.desc && <span className="block mt-1 text-sm text-white/50 leading-snug">{option.desc}</span>}
      </span>
      <Radio selected={selected} />
    </button>
  );
}

const inputCls =
  'w-full h-11 rounded-xl bg-black/40 border border-white/12 px-3 text-[15px] text-white placeholder-white/30 focus:outline-none focus:border-[#ef4444] transition-colors';

/** Campo numérico compacto da etapa "corpo" (rótulo • valor • unidade). */
function MetricField({
  label,
  unit,
  value,
  onChange,
  placeholder,
  min,
  max,
  step,
  inputMode,
  ariaLabel,
}: {
  label: string;
  unit: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  min: number;
  max: number;
  step?: string;
  inputMode?: 'numeric' | 'decimal';
  ariaLabel: string;
}) {
  return (
    <label
      className="flex items-center gap-3 rounded-2xl px-4 py-3"
      style={{ border: CARD_BORDER, background: 'rgba(255,255,255,0.02)' }}
    >
      <span className="flex-1 text-sm text-white/60">{label}</span>
      <input
        type="number"
        inputMode={inputMode}
        className="w-24 bg-transparent text-2xl font-bold text-white text-right outline-none"
        style={{ caretColor: ACCENT }}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        min={min}
        max={max}
        step={step}
        placeholder={placeholder}
        aria-label={ariaLabel}
      />
      <span className="w-10 text-sm text-white/40">{unit}</span>
    </label>
  );
}

export function OnboardingScreen({ open, onComplete }: OnboardingScreenProps) {
  const { user, updatePassword } = useAuth();
  const { state, update } = useProfileState('local');
  const [stepIndex, setStepIndex] = useState(0);
  /* 'wizard' = perguntas; 'welcome' = tela "Bem-vindo ao Evo Fit". */
  const [phase, setPhase] = useState<'wizard' | 'welcome'>('wizard');
  const [answers, setAnswers] = useState<Partial<Record<StepId, string>>>({});
  const [reasons, setReasons] = useState<string[] | undefined>(undefined);
  const [edited, setEdited] = useState<{ nome?: string; handle?: string }>({});
  const [password, setPassword] = useState('');
  const [age, setAge] = useState<string | undefined>(undefined);
  const [weight, setWeight] = useState<string | undefined>(undefined);
  const [height, setHeight] = useState<string | undefined>(undefined);
  const [notifPerm, setNotifPerm] = useState<string>(() =>
    typeof Notification !== 'undefined' ? Notification.permission : 'unsupported',
  );
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  /** Perguntas concluídas (onboarded gravado) — evita duplicar a escrita. */
  const onboardedRef = useRef(false);
  /** Boas-vindas encerrada — o onComplete do pai dispara uma única vez. */
  const closedRef = useRef(false);
  const completeRef = useRef(onComplete);

  /* Login por Google: a conta não tem senha própria, então perguntamos uma
     (permite entrar depois com e-mail + senha). Contas de e-mail já têm senha. */
  const isGoogleAccount = Boolean(
    user?.app_metadata?.provider === 'google' ||
      user?.identities?.some((identity) => identity.provider === 'google'),
  );

  /* Pré-preenchimento: perfil salvo (se já respondido) → dados do provedor
     (Google/e-mail). O que o usuário digitar tem prioridade. */
  const meta = (user?.user_metadata ?? {}) as {
    full_name?: string;
    name?: string;
    display_name?: string;
  };
  const saved = state?.customization;
  const savedName = saved?.nome?.trim() ?? '';
  const savedHandle = (saved?.handle ?? '').replace(/^@/, '').toLowerCase();
  const nome =
    edited.nome ??
    (savedName && savedName !== DEFAULT_PROFILE_CUSTOMIZATION.nome
      ? savedName
      : meta.full_name || meta.name || meta.display_name || '');
  const handle =
    edited.handle ??
    (savedHandle && savedHandle !== 'deceptivon'
      ? savedHandle
      : slugifyUsername((user?.email ?? '').split('@')[0] ?? ''));
  const ageValue = age ?? (saved?.age != null ? String(saved.age) : '');
  const weightValue = weight ?? (saved?.weightKg != null ? String(saved.weightKg) : '');
  const heightValue = height ?? (saved?.heightCm != null ? String(saved.heightCm) : '');

  const step = STEPS[stepIndex];
  const total = STEPS.length;
  const selectedReasons = reasons ?? saved?.appReasons ?? [];

  const answerOf = (id: StepId): string => {
    if (answers[id]) return answers[id] as string;
    const fromProfile: Record<string, string | undefined> = {
      objetivos: saved?.mainGoals,
      experiencia: saved?.experienceLevel,
      sexo: saved?.gender,
      frequencia: saved?.trainingFrequencyDays != null ? String(saved.trainingFrequencyDays) : undefined,
      local: saved?.trainingPlace,
      indicacao: saved?.referralSource,
      plano: saved?.onboardingObjective,
    };
    return fromProfile[id] ?? '';
  };
  const answer = step.options && step.id !== 'motivo' ? answerOf(step.id) : '';

  const canContinue =
    step.id === 'motivo'
      ? selectedReasons.length > 0
      : step.id === 'corpo'
        ? ageValue.trim() !== '' && weightValue.trim() !== '' && heightValue.trim() !== ''
        : step.options
          ? Boolean(answer)
          : true;

  /* Guarda o callback mais novo do pai (fecha o onboarding no fim das boas-vindas). */
  useEffect(() => {
    completeRef.current = onComplete;
  });

  useEffect(() => {
    if (phase !== 'welcome') return;
    const timer = window.setTimeout(() => closeWelcome(), 2800);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  if (!open) return null;

  const goTo = (index: number) => {
    setStepIndex(Math.max(0, Math.min(total - 1, index)));
    setError('');
  };

  /** Marca o onboarding como concluído e entra na tela de boas-vindas. */
  async function enterWelcome(): Promise<void> {
    if (onboardedRef.current) return;
    onboardedRef.current = true;
    try {
      await update((draft) => {
        draft.customization.onboarded = true;
      });
    } finally {
      setPhase('welcome');
    }
  }

  /** Sai do onboarding (toque ou timer da tela de boas-vindas). */
  function closeWelcome(): void {
    if (closedRef.current) return;
    closedRef.current = true;
    completeRef.current();
  }

  const handleSkip = () => {
    /* Última etapa: pular também conclui (vai para as boas-vindas). */
    if (stepIndex >= total - 1) {
      void enterWelcome();
      return;
    }
    goTo(stepIndex + 1);
  };

  const toggleReason = (value: string) => {
    const current = selectedReasons;
    if (current.includes(value)) {
      setReasons(current.filter((item) => item !== value));
      setError('');
      return;
    }
    if (current.length >= MAX_REASONS) {
      setError(`Selecione no máximo ${MAX_REASONS} motivos.`);
      return;
    }
    setError('');
    setReasons([...current, value]);
  };

  const handleSaveConta = async (): Promise<boolean> => {
    const cleanName = nome.trim();
    const cleanHandle = handle.trim().replace(/^@/, '').toLowerCase();
    const wantsPassword = isGoogleAccount && password.trim().length > 0;

    if (cleanName.length < 2) {
      setError('Informe seu nome (mínimo 2 caracteres).');
      return false;
    }
    if (!USERNAME_RE.test(cleanHandle)) {
      setError('Nome de usuário: de 3 a 20 caracteres (letras, números ou _).');
      return false;
    }
    if (wantsPassword && password.trim().length < 6) {
      setError('A senha deve ter no mínimo 6 caracteres.');
      return false;
    }

    await update((draft) => {
      draft.customization.nome = cleanName;
      draft.customization.handle = `@${cleanHandle}`;
    });

    if (wantsPassword) {
      try {
        await updatePassword(password.trim());
        setPassword('');
        showToast('Senha da conta definida! Você também pode entrar com e-mail e senha.', 'success');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Não foi possível definir a senha da conta.');
        return false;
      }
    }
    return true;
  };

  const handleContinue = async () => {
    setError('');
    const current = STEPS[stepIndex];

    if (current.id === 'conta') {
      setSaving(true);
      try {
        const ok = await handleSaveConta();
        if (!ok) return;
        goTo(stepIndex + 1);
      } finally {
        setSaving(false);
      }
      return;
    }

    /* Motivo: múltipla escolha (até 3), salva como lista. */
    if (current.id === 'motivo') {
      if (selectedReasons.length === 0) {
        setError('Escolha pelo menos um motivo — ou toque em "Pular".');
        return;
      }
      setSaving(true);
      try {
        await update((draft) => {
          draft.customization.appReasons = selectedReasons;
        });
        goTo(stepIndex + 1);
      } finally {
        setSaving(false);
      }
      return;
    }

    /* Idade + peso + altura na mesma etapa. */
    if (current.id === 'corpo') {
      const ageNum = Number(ageValue);
      const weightNum = Number(weightValue);
      const heightNum = Number(heightValue);
      if (!Number.isInteger(ageNum) || ageNum < 1 || ageNum > 120) {
        setError('Idade: informe um número inteiro entre 1 e 120.');
        return;
      }
      if (!Number.isFinite(weightNum) || weightNum < 1 || weightNum > 400) {
        setError('Peso: informe um valor entre 1 e 400 kg.');
        return;
      }
      if (!Number.isFinite(heightNum) || heightNum < 100 || heightNum > 250) {
        setError('Altura: informe um valor entre 100 e 250 cm.');
        return;
      }
      setSaving(true);
      try {
        await update((draft) => {
          draft.customization.age = ageNum;
          draft.customization.weightKg = weightNum;
          draft.customization.heightCm = heightNum;
        });
        goTo(stepIndex + 1);
      } finally {
        setSaving(false);
      }
      return;
    }

    /* Última etapa: pede permissão de notificação e conclui. */
    if (current.id === 'notificacoes') {
      setSaving(true);
      try {
        let granted = notifPerm === 'granted';
        if (!granted && typeof Notification !== 'undefined' && Notification.permission !== 'denied') {
          try {
            const result = await Notification.requestPermission();
            setNotifPerm(result);
            granted = result === 'granted';
          } catch {
            granted = false;
          }
        }
        if (granted) showToast('Notificações ativadas!', 'success');
        else if (notifPerm === 'denied')
          showToast('Notificações bloqueadas no navegador. Ative-as nas configurações do site.', 'info');
        else showToast('Tudo certo! Você pode ativar depois em Configurações.', 'info');

        await update((draft) => {
          draft.customization.notificationsEnabled = granted;
        });
        await enterWelcome();
      } finally {
        setSaving(false);
      }
      return;
    }

    /* Programa de treino: aplica a ficha (o onboarding só fecha no fim). */
    if (current.id === 'plano') {
      const objective = answer;
      if (!objective) return;
      setSaving(true);
      try {
        await update((draft) => {
          draft.customization.onboardingObjective = objective;
        });
        if (objective === 'Treino personalizado') {
          try { localStorage.setItem('academia_open_ficha', '1'); } catch { /* ignore */ }
          showToast('Bons treinos! Monte sua ficha em "Minha Ficha".', 'success');
        } else {
          const tplKey = OBJECTIVE_TO_TEMPLATE[objective];
          if (tplKey) {
            try {
              const data = await loadLocalData();
              await applyTemplate(data, tplKey);
            } catch (e) {
              console.warn('[onboarding] falha ao aplicar template:', e);
            }
          }
          showToast('Bons treinos! Predefinição aplicada às fichas.', 'success');
        }
        goTo(stepIndex + 1);
      } finally {
        setSaving(false);
      }
      return;
    }

    /* Etapas de resposta única: exige seleção antes de avançar. */
    if (current.options) {
      if (!answer) {
        setError('Escolha uma opção para continuar — ou toque em "Pular".');
        return;
      }
      setSaving(true);
      try {
        const fields = fieldsForStep(current.id, answer);
        await update((draft) => {
          Object.assign(draft.customization, fields);
        });
        goTo(stepIndex + 1);
      } finally {
        setSaving(false);
      }
      return;
    }

    goTo(stepIndex + 1);
  };

  /* ═════════════ Tela de boas-vindas (pós-perguntas) ═════════════ */
  if (phase === 'welcome') {
    const firstName = nome.trim().split(/\s+/)[0] || '';
    return createPortal(
      <div
        className="fixed inset-0 z-[1200] flex flex-col items-center justify-center gap-6 px-6 cursor-pointer select-none"
        style={{ background: '#07070a' }}
        onClick={closeWelcome}
        role="status"
      >
        <motion.img
          src="/assets/Logo.png"
          alt="Logo Evo Fit"
          width={128}
          height={128}
          className="rounded-[32px] shadow-2xl"
          initial={{ opacity: 0, scale: 0.86 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        />
        <motion.h1
          className="text-3xl sm:text-4xl font-bold text-white text-center leading-snug"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
        >
          Bem-vindo ao Evo Fit{firstName ? `, ${firstName}` : ''}!
        </motion.h1>
      </div>,
      document.body,
    );
  }

  const footerLabel = saving
    ? 'Salvando…'
    : step.id === 'notificacoes' && notifPerm === 'granted'
      ? 'Continuar'
      : (step.actionLabel ?? 'Continuar');

  return createPortal(
    <div className="fixed inset-0 z-[1200] flex flex-col text-white" style={{ background: '#07070a' }}>
      {/* Cabeçalho: voltar • nome da pergunta + contador • pular */}

      <div className="flex items-center justify-between h-14 px-4 shrink-0">
        {stepIndex > 0 ? (
          <button
            type="button"
            onClick={() => goTo(stepIndex - 1)}
            aria-label="Voltar"
            className="w-9 h-9 flex items-center justify-center rounded-full transition-colors hover:bg-white/10"
            style={{ color: ACCENT }}
            disabled={saving}
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        ) : (
          <span className="w-9" />
        )}

        <div className="text-[15px] font-bold text-white">
          {step.label}{' '}
          <span className="font-semibold text-white/70">
            ({stepIndex + 1}/{total})
          </span>
        </div>

        {step.skippable ? (
          <button
            type="button"
            onClick={handleSkip}
            className="w-12 text-right text-[15px] text-white/70 hover:text-white transition-colors"
            disabled={saving}
          >
            Pular
          </button>
        ) : (
          <span className="w-12" />
        )}
      </div>

      {/* Conteúdo — div (não <main>): o CSS legado dá min-height:100vh a main */}

      <div
        key={step.id}
        className="flex-1 min-h-0 overflow-y-auto px-5 pb-6"
        style={{ minHeight: 0 }}
      >
        <h1 className="text-3xl leading-tight font-bold text-white">{renderTitle(step.title)}</h1>
        <p className="mt-3 text-[15px] leading-relaxed text-white/55">{step.subtitle}</p>

        {error && (
          <p className="mt-4 text-sm font-medium" style={{ color: '#f87171' }}>
            {error}
          </p>
        )}

        <div className="mt-6 space-y-3">
          {/* Motivo: linhas com checkbox (múltipla escolha) */}

          {step.id === 'motivo' &&
            step.options?.map((option) => (
              <CheckRow
                key={option.value}
                title={option.title}
                checked={selectedReasons.includes(option.value)}
                onToggle={() => toggleReason(option.value)}
              />
            ))}

          {/* Demais etapas de opção: cartões com rádio */}

          {step.id !== 'motivo' &&
            step.options?.map((option) => (
              <OptionCard
                key={option.value}
                option={option}
                selected={answer === option.value}
                onSelect={() => setAnswers((prev) => ({ ...prev, [step.id]: option.value }))}
              />
            ))}

          {/* Prévia das notificações (ilustração, como na imagem) */}

          {step.id === 'notificacoes' && (
            <div className="mt-6 space-y-3">
              <div className="rounded-2xl p-4" style={{ border: CARD_BORDER, background: 'rgba(255,255,255,0.04)' }}>
                <div className="flex items-center justify-between text-xs text-white/45">
                  <span>Treino</span>
                  <span>07:42</span>
                </div>
                <div className="mt-1 font-semibold text-white">Levantamento Terra</div>
                <div className="text-sm text-white/50">Próximo: Série 2/3 - 10 reps - 80kg</div>
                <div className="mt-3 text-sm text-white/70">Descanso</div>
              </div>

              <div className="rounded-2xl p-4 flex items-start gap-3" style={{ border: CARD_BORDER, background: 'rgba(255,255,255,0.04)' }}>
                <img src="/assets/icons/icon-192.png" alt="" width={36} height={36} className="rounded-lg shrink-0" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-sm font-semibold text-white">O tempo de descanso está terminado</span>
                    <span className="text-xs text-white/40 shrink-0">agora</span>
                  </div>
                  <div className="text-sm text-white/50">Próximo: Levantamento Terra - 8 reps - 80kg</div>
                </div>
              </div>

              <div className="rounded-2xl p-4 flex items-start gap-3" style={{ border: CARD_BORDER, background: 'rgba(255,255,255,0.04)' }}>
                <span
                  className="shrink-0 flex items-center justify-center w-9 h-9 rounded-full text-xs font-bold"
                  style={{ background: ACCENT_SOFT, color: '#fca5a5' }}
                >
                  CA
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-sm font-semibold text-white">Coach Alex</span>
                    <span className="text-xs text-white/40 shrink-0">agora</span>
                  </div>
                  <div className="text-sm text-white/50">
                    Ei, vi seu último treino. Como foi o supino inclinado com 75 kg?
                  </div>
                </div>
              </div>

              <div className="rounded-2xl p-4 flex items-start gap-3" style={{ border: CARD_BORDER, background: 'rgba(255,255,255,0.04)' }}>
                <span
                  className="shrink-0 flex items-center justify-center w-9 h-9 rounded-lg text-lg font-black"
                  style={{ color: ACCENT }}
                >
                  ⌃
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-sm font-semibold text-white">Pontuação de Força</span>
                    <span className="text-xs text-white/40 shrink-0">agora</span>
                  </div>
                  <div className="text-sm text-white/50">Sua Pontuação de Força aumentou em 4 pontos</div>
                </div>
              </div>
            </div>
          )}

          {step.id === 'conta' && (
            <div className="space-y-4">
              <label className="block text-sm text-white/70">
                Nome
                <input
                  type="text"
                  className={`mt-1.5 ${inputCls}`}
                  value={nome}
                  onChange={(e) => setEdited((prev) => ({ ...prev, nome: e.target.value }))}
                  placeholder="Seu nome"
                  autoComplete="name"
                />
              </label>

              <label className="block text-sm text-white/70">
                Nome de usuário
                <span className="mt-1.5 flex items-center rounded-xl bg-black/40 border border-white/12 focus-within:border-[#ef4444] transition-colors">
                  <span className="pl-3 text-white/40">@</span>
                  <input
                    type="text"
                    className="w-full bg-transparent px-1 py-2.5 text-white outline-none font-mono"
                    value={handle}
                    onChange={(e) => setEdited((prev) => ({ ...prev, handle: e.target.value }))}
                    placeholder="usuario"
                    autoComplete="username"
                    maxLength={20}
                  />
                </span>
                <span className="mt-1 block text-xs text-white/40">
                  De 3 a 20 caracteres (letras, números ou _).
                </span>
              </label>

              {isGoogleAccount && (
                <label className="block text-sm text-white/70">
                  Senha do usuário
                  <input
                    type="password"
                    className={`mt-1.5 ${inputCls}`}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Crie uma senha (mínimo 6 caracteres)"
                    autoComplete="new-password"
                  />
                  <span className="mt-1 block text-xs text-white/40">
                    Sua conta entrou pelo Google e ainda não tem senha. Definir uma permite entrar também
                    com e-mail e senha. Deixe em branco para continuar só com o Google.
                  </span>
                </label>
              )}

              {/* Nova pergunta: Porque usar o app fitness? - como texto informativo */}
              {!isGoogleAccount && (
                <label className="block text-sm text-white/70">
                  <p className="text-white mb-1">Por que usar o app fitness?</p>
                  <p className="text-white/50 text-xs">Ajude-nos a entender suas motivações para melhorar o app.</p>
                </label>
              )}

              {/* Nova pergunta: Como conheceu o app? - como texto informativo */}
              {!isGoogleAccount && (
                <label className="block text-sm text-white/70">
                  <p className="text-white mb-1">Como conheceu o app?</p>
                  <p className="text-white/50 text-xs">Queremos saber como você nos encontrou para melhorar nosso serviço.</p>
                </label>
              )}

              {/* Peso, idade e altura devem estar juntos - já estão na etapa corpo */}
            </div>
          )}

          {/* Idade + peso + altura juntos na mesma etapa */}
          {step.id === 'corpo' && (
            <div className="space-y-3">
              <MetricField
                label="Idade"
                unit="anos"
                value={ageValue}
                onChange={setAge}
                placeholder="--"
                min={1}
                max={120}
                inputMode="numeric"
                ariaLabel="Idade"
              />
              <MetricField
                label="Peso"
                unit="kg"
                value={weightValue}
                onChange={setWeight}
                placeholder="--"
                min={1}
                max={400}
                step="0.1"
                inputMode="decimal"
                ariaLabel="Peso em quilogramas"
              />
              <MetricField
                label="Altura"
                unit="cm"
                value={heightValue}
                onChange={setHeight}
                placeholder="--"
                min={100}
                max={250}
                inputMode="numeric"
                ariaLabel="Altura em centímetros"
              />
            </div>
          )}
        </div>
      </div>

      {/* Rodapé: Continuar/Ativar — div (não <footer>): o CSS legado decora
          footer::before/::after posicionados e bloquearia os cliques. */}

      <div className="shrink-0 px-5 pt-2 pb-7">
        <button
          type="button"
          onClick={() => void handleContinue()}
          disabled={!canContinue || saving}
          className="w-full h-12 rounded-full text-[15px] font-bold transition-colors"
          style={{
            canContinue
              ? { background: ACCENT, color: '#fff' }
              : { background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.35)' },
          }}
        >
          {footerLabel}
        </button>
      </div>
    </div>,
    document.body,
  );
}

const OBJECTIVE_TO_TEMPLATE: Record<string, string> = {
  'Hipertrofia (iniciante)': 'hipertrofia_iniciante',
  'Hipertrofia (médio)': 'hipertrofia_medio',
  'Hipertrofia (médio II)': 'hipertrofia_medio_ii',
  'Tonificar': 'tonificar',
  'Perda ponderal (médio) SUP/INF': 'perda_ponderal_media',
  'Perda ponderal (médio II) SUP/INF': 'perda_ponderal_media_ii',
  'Push/Pull': 'push_pull',
};