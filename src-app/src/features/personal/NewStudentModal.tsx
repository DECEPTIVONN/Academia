import { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { usePtStore } from './personal-store';
import { PtModal, PtAvatar } from './personal-ui';
import type { PtPlan, PtStudent } from './personal-types';

const PLANS: PtPlan[] = ['Mensal', 'Trimestral', 'Online', 'Avulso'];
const LEVELS = ['Iniciante', 'Intermediário', 'Avançado'] as const;

export function NewStudentModal({ onClose }: { onClose: () => void }) {
  const addStudent = usePtStore((s) => s.addStudent);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [goal, setGoal] = useState('Hipertrofia');
  const [level, setLevel] = useState<PtStudent['level']>('Intermediário');
  const [plan, setPlan] = useState<PtPlan>('Mensal');
  const [fee, setFee] = useState(250);
  const [weeklyGoal, setWeeklyGoal] = useState(3);
  const [bio, setBio] = useState('');
  const [restrictions, setRestrictions] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setError(null);
    if (name.trim().length < 2) {
      setError('Informe o nome completo do aluno.');
      return;
    }
    setSaving(true);
    try {
      await addStudent({
        name: name.trim(),
        email: email.trim() || undefined,
        phone: phone.trim() || undefined,
        goal,
        level,
        plan,
        monthlyFee: fee,
        weeklyGoal,
        bio: bio.trim() || undefined,
        restrictions: restrictions.trim() || undefined,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível salvar.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <PtModal open onClose={onClose} title="Novo aluno" sub="Cadastre a ficha inicial do aluno na sua carteira." size="lg">
      <div className="pt-form-grid">
        <label className="pt-field">
          <span>Nome completo</span>
          <input className="pt-input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Marina Alves" />
        </label>
        <label className="pt-field">
          <span>E-mail</span>
          <input className="pt-input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="aluno@email.com" />
        </label>
        <label className="pt-field">
          <span>Telefone</span>
          <input className="pt-input" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(11) 99999-9999" />
        </label>
        <label className="pt-field">
          <span>Objetivo</span>
          <select className="pt-select" value={goal} onChange={(e) => setGoal(e.target.value)}>
            {['Hipertrofia', 'Emagrecimento', 'Força', 'Definição', 'Saúde geral'].map((g) => (
              <option key={g} value={g}>{g}</option>
            ))}
          </select>
        </label>
        <label className="pt-field">
          <span>Nível</span>
          <select className="pt-select" value={level} onChange={(e) => setLevel(e.target.value as PtStudent['level'])}>
            {LEVELS.map((l) => (
              <option key={l} value={l}>{l}</option>
            ))}
          </select>
        </label>
        <label className="pt-field">
          <span>Plano</span>
          <select className="pt-select" value={plan} onChange={(e) => setPlan(e.target.value as PtPlan)}>
            {PLANS.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </label>
        <label className="pt-field">
          <span>Mensalidade (R$)</span>
          <input className="pt-input" type="number" value={fee} onChange={(e) => setFee(Number(e.target.value))} />
        </label>
        <label className="pt-field">
          <span>Treinos por semana</span>
          <input className="pt-input" type="number" min={1} max={7} value={weeklyGoal} onChange={(e) => setWeeklyGoal(Number(e.target.value))} />
        </label>
        <label className="pt-field pt-form-grid--full">
          <span>Restrições / observações médicas</span>
          <textarea className="pt-textarea" value={restrictions} onChange={(e) => setRestrictions(e.target.value)} placeholder="Ex: lesão no ombro esquerdo…" />
        </label>
        <label className="pt-field pt-form-grid--full">
          <span>Observações do personal</span>
          <textarea className="pt-textarea" value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Anotações livres sobre o aluno…" />
        </label>
      </div>

      {error && <p style={{ color: 'var(--pt-danger)', fontSize: '0.8rem', marginTop: 12 }}>{error}</p>}

      <div className="pt-modal__foot" style={{ borderTop: 0, paddingTop: 16 }}>
        <button type="button" className="pt-btn" onClick={onClose}>
          <X size={14} /> Cancelar
        </button>
        <button type="button" className="pt-btn pt-btn--primary" onClick={() => void submit()} disabled={saving}>
          <Plus size={14} /> {saving ? 'Salvando…' : 'Cadastrar aluno'}
        </button>
      </div>
    </PtModal>
  );
}

void PtAvatar;
