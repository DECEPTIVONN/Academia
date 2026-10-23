import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useProfileState } from '@/features/profile/useProfileState';
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

export function OnboardingScreen({ open, onComplete }: OnboardingScreenProps) {
  const { update } = useProfileState('local');
  const [step, setStep] = useState<'dados' | 'objetivos'>('dados');
  const [age, setAge] = useState('');
  const [weight, setWeight] = useState('');
  const [activity, setActivity] = useState<'none' | 'weeks' | 'months' | 'years'>('none');
  const [duration, setDuration] = useState('');
  const [saving, setSaving] = useState(false);

  if (!open) return null;

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
        {step === 'dados' ? (
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
              <button type="button" className="flex-1 rounded-lg bg-white/10 px-4 py-2 text-white" onClick={handleSkipDados} disabled={saving}>
                Pular
              </button>
              <button type="button" className="flex-1 rounded-lg px-4 py-2 text-white" style={{ background: '#5b21b6' }} onClick={handleSaveDados} disabled={saving}>
                {saving ? 'Salvando…' : 'Continuar'}
              </button>
            </div>
          </>
        ) : (
          <>
            <h2 className="text-xl font-bold text-white">Objetivo de treino</h2>
            <p className="text-sm text-white/60">Escolha um objetivo pré-definido ou treino personalizado.</p>
            <div className="grid grid-cols-1 gap-2">
              {OBJECTIVES.map((objective) => (
                <button
                  key={objective}
                  type="button"
                  className="rounded-lg bg-white/10 px-4 py-2 text-left text-white hover:bg-white/20"
                  onClick={() => handleObjective(objective)}
                  disabled={saving}
                >
                  {objective}
                </button>
              ))}
            </div>
            <button
              type="button"
              className="w-full rounded-lg bg-white/5 px-4 py-2 text-white/70"
              onClick={handleSkipDados}
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
