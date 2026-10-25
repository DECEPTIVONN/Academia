import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '@/core/auth/use-auth';
import { useProfileState } from '@/features/profile/useProfileState';
import { DEFAULT_PROFILE_CUSTOMIZATION } from '@/core/db/schema';
import { showToast } from '@/lib/toast';
import { loadLocalData } from '@/core/db/queries';
import { applyTemplate } from '@/features/workout/treinos/treinos-helpers';

interface OnboardingScreenProps {
  open: boolean;
  onComplete: () => void;
}

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

export function OnboardingScreen({ open, onComplete }: OnboardingScreenProps) {
  const { user, updatePassword } = useAuth();
  const { state, update } = useProfileState('local');
  const [step, setStep] = useState<'conta' | 'dados' | 'objetivos'>('conta');
  /* Valores editados pelo usuário; enquanto ele não digitar nada, os campos
     mostram o que já existe (perfil salvo ou dados do provedor). */
  const [edited, setEdited] = useState<{ nome?: string; handle?: string }>({});
  const [password, setPassword] = useState('');
  const [contaError, setContaError] = useState('');
  const [age, setAge] = useState('');
  const [weight, setWeight] = useState('');
  const [activity, setActivity] = useState<'none' | 'weeks' | 'months' | 'years'>('none');
  const [duration, setDuration] = useState('');
  const [saving, setSaving] = useState(false);

  /* Login por Google: a conta não tem senha própria, então perguntamos uma
     (permite entrar depois com e-mail + senha). Contas de e-mail já têm senha. */
  const isGoogleAccount = Boolean(
    user?.app_metadata?.provider === 'google' ||
      user?.identities?.some((identity) => identity.provider === 'google'),
  );

  /* Pré-preenchimento: perfil salvo (se já customizado) → dados do provedor
     (Google/e-mail). O que o usuário digitar tem prioridade. */
  const meta = (user?.user_metadata ?? {}) as {
    full_name?: string;
    name?: string;
    display_name?: string;
  };
  const savedName = state?.customization?.nome?.trim() ?? '';
  const savedHandle = (state?.customization?.handle ?? '').replace(/^@/, '').toLowerCase();
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

  if (!open) return null;

  const handleSaveConta = async () => {
    setContaError('');
    const cleanName = nome.trim();
    const cleanHandle = handle.trim().replace(/^@/, '').toLowerCase();
    const wantsPassword = isGoogleAccount && password.trim().length > 0;

    if (cleanName.length < 2) {
      setContaError('Informe seu nome (mínimo 2 caracteres).');
      return;
    }
    if (!USERNAME_RE.test(cleanHandle)) {
      setContaError('Nome de usuário: de 3 a 20 caracteres (letras, números ou _).');
      return;
    }
    if (wantsPassword && password.trim().length < 6) {
      setContaError('A senha deve ter no mínimo 6 caracteres.');
      return;
    }

    setSaving(true);
    try {
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
          setContaError(
            err instanceof Error ? err.message : 'Não foi possível definir a senha da conta.',
          );
          return;
        }
      }

      setStep('dados');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveDados = async () => {
    setSaving(true);
    try {
      await update((draft) => {
        draft.customization.age = age ? Number(age) : undefined;
        draft.customization.weightKg = weight ? Number(weight) : undefined;
        draft.customization.activityDurationUnit = activity === 'none' ? undefined : activity;
        draft.customization.activityDurationValue = activity === 'none' || !duration ? undefined : Number(duration);
      });
      setStep('objetivos');
    } finally {
      setSaving(false);
    }
  };

  const handleSkipDados = () => setStep('objetivos');

  const OBJECTIVE_TO_TEMPLATE: Record<string, string> = {
    'Hipertrofia (iniciante)': 'hipertrofia_iniciante',
    'Hipertrofia (médio)': 'hipertrofia_medio',
    'Hipertrofia (médio II)': 'hipertrofia_medio_ii',
    'Tonificar': 'tonificar',
    'Perda ponderal (médio) SUP/INF': 'perda_ponderal_media',
    'Perda ponderal (médio II) SUP/INF': 'perda_ponderal_media_ii',
    'Push/Pull': 'push_pull',
  };

  const handleObjective = async (objective: string) => {
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
  };

  return createPortal(
    <div className="fixed inset-0 z-[1200] flex items-center justify-center bg-black/80 p-4">
      <div className="w-full max-w-md rounded-2xl bg-[#0b0b10] border border-white/10 p-6 space-y-4">
        {step === 'conta' && (
          <>
            <h2 className="text-xl font-bold text-white">Sua conta</h2>
            <p className="text-sm text-white/60">Como você quer aparecer no app.</p>

            <label className="block text-sm text-white/70">
              Nome
              <input
                type="text"
                className="mt-1 w-full rounded-lg bg-black/40 border border-white/10 px-3 py-2 text-white"
                value={nome}
                onChange={(e) => setEdited((prev) => ({ ...prev, nome: e.target.value }))}
                placeholder="Seu nome"
                autoComplete="name"
              />
            </label>

            <label className="block text-sm text-white/70">
              Nome de usuário
              <div className="mt-1 flex items-center rounded-lg bg-black/40 border border-white/10 focus-within:border-white/30">
                <span className="pl-3 text-white/40">@</span>
                <input
                  type="text"
                  className="w-full bg-transparent px-1 py-2 text-white outline-none font-mono"
                  value={handle}
                  onChange={(e) => setEdited((prev) => ({ ...prev, handle: e.target.value }))}
                  placeholder="usuario"
                  autoComplete="username"
                  maxLength={20}
                />
              </div>
              <span className="mt-1 block text-xs text-white/40">
                De 3 a 20 caracteres (letras, números ou _).
              </span>
            </label>

            {isGoogleAccount && (
              <label className="block text-sm text-white/70">
                Senha do usuário
                <input
                  type="password"
                  className="mt-1 w-full rounded-lg bg-black/40 border border-white/10 px-3 py-2 text-white"
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

            {contaError && <p className="text-sm text-red-400">{contaError}</p>}

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                className="flex-1 rounded-lg px-4 py-2 text-white"
                style={{ background: '#5b21b6' }}
                onClick={() => void handleSaveConta()}
                disabled={saving}
              >
                {saving ? 'Salvando…' : 'Continuar'}
              </button>
            </div>
          </>
        )}

        {step === 'dados' && (
          <>
            <h2 className="text-xl font-bold text-white">Dados opcionais</h2>
            <p className="text-sm text-white/60">Essas informações ajudam a personalizar seus treinos.</p>

            <label className="block text-sm text-white/70">
              Idade
              <input type="number" className="mt-1 w-full rounded-lg bg-black/40 border border-white/10 px-3 py-2 text-white" value={age} onChange={(e) => setAge(e.target.value)} min={1} max={120} />
            </label>

            <label className="block text-sm text-white/70">
              Peso (kg)
              <input type="number" className="mt-1 w-full rounded-lg bg-black/40 border border-white/10 px-3 py-2 text-white" value={weight} onChange={(e) => setWeight(e.target.value)} min={1} max={400} step="0.1" />
            </label>

            <label className="block text-sm text-white/70">
              Pratica atividade física?
              <select className="mt-1 w-full rounded-lg bg-black/40 border border-white/10 px-3 py-2 text-white" value={activity} onChange={(e) => setActivity(e.target.value as 'none' | 'weeks' | 'months' | 'years')}>
                <option value="none">Não pratico</option>
                <option value="weeks">Sim, há semanas</option>
                <option value="months">Sim, há meses</option>
                <option value="years">Sim, há anos</option>
              </select>
            </label>

            {activity !== 'none' && (
              <label className="block text-sm text-white/70">
                Há quanto tempo?
                <input type="number" className="mt-1 w-full rounded-lg bg-black/40 border border-white/10 px-3 py-2 text-white" value={duration} onChange={(e) => setDuration(e.target.value)} min={1} />
              </label>
            )}

            <div className="flex gap-3 pt-2">
              <button type="button" className="rounded-lg bg-white/10 px-4 py-2 text-white" onClick={() => setStep('conta')} disabled={saving}>
                Voltar
              </button>
              <button type="button" className="flex-1 rounded-lg bg-white/10 px-4 py-2 text-white" onClick={handleSkipDados} disabled={saving}>
                Pular
              </button>
              <button type="button" className="flex-1 rounded-lg px-4 py-2 text-white" style={{ background: '#5b21b6' }} onClick={() => void handleSaveDados()} disabled={saving}>
                {saving ? 'Salvando…' : 'Continuar'}
              </button>
            </div>
          </>
        )}

        {step === 'objetivos' && (
          <>
            <h2 className="text-xl font-bold text-white">Objetivo de treino</h2>
            <p className="text-sm text-white/60">Escolha um objetivo pré-definido ou treino personalizado.</p>
            <div className="grid grid-cols-1 gap-2">
              {OBJECTIVES.map((objective) => (
                <button
                  key={objective}
                  type="button"
                  className="rounded-lg bg-white/10 px-4 py-2 text-left text-white hover:bg-white/20"
                  onClick={() => void handleObjective(objective)}
                  disabled={saving}
                >
                  {objective}
                </button>
              ))}
            </div>
            <button
              type="button"
              className="w-full rounded-lg bg-white/5 px-4 py-2 text-white/70"
              onClick={() => setStep('dados')}
              disabled={saving}
            >
              Voltar
            </button>
          </>
        )}
      </div>
    </div>,
    document.body,
  );
}
