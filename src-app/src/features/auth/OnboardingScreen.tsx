import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { ArrowLeft } from 'lucide-react';
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

function slugifyUsername(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, '')
    .slice(0, 20);
}

/* ── Definição das etapas (ordem do assistente) ── */

type StepId =
  | 'conta'
  | 'motivo'
  | 'objetivos'
  | 'experiencia'
  | 'sexo'
  | 'idade'
  | 'peso'
  | 'frequencia'
  | 'local'
  | 'plano';

interface OptionDef {
  value: string;
  title: string;
  desc?: string;
  badge?: string;
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
    label: 'Motivo de Uso',
    title: 'Qual é o seu {motivo} de usar o app?',
    subtitle: 'Conte pra que isso serve pra você. Usamos a resposta pra ajustar dicas e metas.',
    skippable: true,
    options: [
      { value: 'Emagrecer', title: 'Emagrecer', desc: 'Perder peso com constância e acompanhamento.' },
      { value: 'Ganhar massa muscular', title: 'Ganhar massa muscular', desc: 'Hipertrofia e força no treino.' },
      { value: 'Sentir-me mais saudável', title: 'Sentir-me mais saudável', desc: 'Mais disposição e bem-estar no dia a dia.' },
      { value: 'Organizar minha rotina', title: 'Organizar minha rotina', desc: 'Montar fichas e acompanhar o progresso.' },
      { value: 'Manter a constância', title: 'Manter a constância', desc: 'Motivação, metas e gamificação para não parar.' },
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
  { id: 'idade', label: 'Idade', title: 'Qual é a sua {idade}?', subtitle: 'Usamos sua idade para personalizar suas recomendações de treino.', skippable: true },
  { id: 'peso', label: 'Peso', title: 'Qual é o seu {peso}?', subtitle: 'Usamos seu peso para personalizar cálculos de cargas e treinos.', skippable: true },
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
    id: 'plano',
    label: 'Programa de Treino',
    title: 'Qual {programa} você quer seguir?',
    subtitle: 'Escolha uma pré-definida — aplicamos a ficha na hora — ou monte o seu.',
    skippable: false,
    options: OBJECTIVES.map((objective) => ({ value: objective, title: objective })),
  },
];

/* Campos do perfil gravados por cada etapa de opção. */
function fieldsForStep(stepId: StepId, value: string): Partial<ProfileCustomization> {
  switch (stepId) {
    case 'motivo':
      return { appReason: value };
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
    default:
      return {};
  }
}

/* ── Peças visuais (estilo das imagens de referência, destaque vermelho) ── */

function renderTitle(text: string) {
  return text.split(/\{|\}/).map((part, i) =>
    i % 2 === 1 ? (
      <span key={i} style={{ color: ACCENT }}>
        {part}
      </span>
    ) : (
      <React.Fragment key={i}>{part}</React.Fragment>
    ),
  );
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

function OptionCard({
  option,
  selected,
  onSelect,
}: {
  option: OptionDef;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className="w-full flex items-center gap-4 rounded-2xl border px-4 py-4 text-left transition-colors"
      style={{
        borderColor: selected ? ACCENT : 'rgba(255,255,255,0.12)',
        background: selected ? ACCENT_SOFT : 'rgba(255,255,255,0.02)',
      }}
    >
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

export function OnboardingScreen({ open, onComplete }: OnboardingScreenProps) {
  const { user, updatePassword } = useAuth();
  const { state, update } = useProfileState('local');
  const [stepIndex, setStepIndex] = useState(0);
  const [answers, setAnswers] = useState<Partial<Record<StepId, string>>>({});
  const [edited, setEdited] = useState<{ nome?: string; handle?: string }>({});
  const [password, setPassword] = useState('');
  const [age, setAge] = useState<string | undefined>(undefined);
  const [weight, setWeight] = useState<string | undefined>(undefined);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

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

  const step = STEPS[stepIndex];
  const total = STEPS.length;

  const answerOf = (id: StepId): string => {
    if (answers[id]) return answers[id] as string;
    const fromProfile: Record<string, string | undefined> = {
      motivo: saved?.appReason,
      objetivos: saved?.mainGoals,
      experiencia: saved?.experienceLevel,
      sexo: saved?.gender,
      frequencia: saved?.trainingFrequencyDays != null ? String(saved.trainingFrequencyDays) : undefined,
      local: saved?.trainingPlace,
      plano: saved?.onboardingObjective,
    };
    return fromProfile[id] ?? '';
  };
  const answer = step.options ? answerOf(step.id) : '';

  const canContinue = step.options
    ? Boolean(answer)
    : step.id === 'idade'
      ? ageValue.trim() !== ''
      : step.id === 'peso'
        ? weightValue.trim() !== ''
        : true;

  if (!open) return null;

  const goTo = (index: number) => {
    setStepIndex(Math.max(0, Math.min(total - 1, index)));
    setError('');
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

    /* Última etapa: aplica o programa + fecha o onboarding. */
    if (current.id === 'plano') {
      const objective = answer;
      if (!objective) return;
      setSaving(true);
      try {
        await update((draft) => {
          draft.customization.onboardingObjective = objective;
          draft.customization.onboarded = true;
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
        onComplete();
      } finally {
        setSaving(false);
      }
      return;
    }

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

    /* Idade / Peso: validação numérica quando preenchidos. */
    if (current.id === 'idade') {
      const value = Number(ageValue);
      if (!Number.isFinite(value) || value < 1 || value > 120 || !Number.isInteger(value)) {
        setError('Idade: informe um número inteiro entre 1 e 120.');
        return;
      }
      setSaving(true);
      try {
        await update((draft) => { draft.customization.age = value; });
        goTo(stepIndex + 1);
      } finally {
        setSaving(false);
      }
      return;
    }

    if (current.id === 'peso') {
      const value = Number(weightValue);
      if (!Number.isFinite(value) || value < 1 || value > 400) {
        setError('Peso: informe um valor entre 1 e 400 kg.');
        return;
      }
      setSaving(true);
      try {
        await update((draft) => { draft.customization.weightKg = value; });
        goTo(stepIndex + 1);
      } finally {
        setSaving(false);
      }
      return;
    }

    goTo(stepIndex + 1);
  };

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
            onClick={() => goTo(stepIndex + 1)}
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
          {step.options?.map((option) => (
            <OptionCard
              key={option.value}
              option={option}
              selected={answer === option.value}
              onSelect={() => setAnswers((prev) => ({ ...prev, [step.id]: option.value }))}
            />
          ))}

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
            </div>
          )}

          {step.id === 'idade' && (
            <div className="rounded-2xl border border-white/12 bg-white/[0.03] px-4 py-8 flex items-center justify-center gap-3">
              <input
                type="number"
                inputMode="numeric"
                className="w-28 bg-transparent text-5xl font-bold text-white text-center outline-none focus:outline-none"
                style={{ caretColor: ACCENT }}
                value={ageValue}
                onChange={(e) => setAge(e.target.value)}
                min={1}
                max={120}
                placeholder="--"
                aria-label="Idade"
              />
              <span className="text-xl font-semibold text-white/40">anos</span>
            </div>
          )}

          {step.id === 'peso' && (
            <div className="rounded-2xl border border-white/12 bg-white/[0.03] px-4 py-8 flex items-center justify-center gap-3">
              <input
                type="number"
                inputMode="decimal"
                className="w-32 bg-transparent text-5xl font-bold text-white text-center outline-none focus:outline-none"
                style={{ caretColor: ACCENT }}
                value={weightValue}
                onChange={(e) => setWeight(e.target.value)}
                min={1}
                max={400}
                step="0.1"
                placeholder="--"
                aria-label="Peso em quilogramas"
              />
              <span className="text-xl font-semibold text-white/40">kg</span>
            </div>
          )}
        </div>
      </div>

      {/* Rodapé: Continuar — div (não <footer>): o CSS legado decora footer::before/::after
          com posicionamento absoluto e bloquearia os cliques no botão. */}
      <div className="shrink-0 px-5 pt-2 pb-7">
        <button
          type="button"
          onClick={() => void handleContinue()}
          disabled={!canContinue || saving}
          className="w-full h-12 rounded-full text-[15px] font-bold transition-colors"
          style={
            canContinue
              ? { background: ACCENT, color: '#fff' }
              : { background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.35)' }
          }
        >
          {saving ? 'Salvando…' : 'Continuar'}
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
