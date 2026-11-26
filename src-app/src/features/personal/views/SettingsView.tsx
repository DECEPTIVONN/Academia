import { useEffect, useState } from 'react';
import {
  LogOut,
  RefreshCw,
  Save,
  ShieldCheck,
  Trash2,
} from 'lucide-react';
import { usePtStore } from '../personal-store';
import { usePersonalSession, signOutPersonal, changePersonalPassword } from '../personal-auth';
import { getPtProfile, saveProfile } from '../personal-db';
import type { PtProfile } from '../personal-types';

export function SettingsView() {
  const profile = usePtStore((s) => s.profile);
  const refreshProfile = usePtStore((s) => s.refreshProfile);
  const resetDemo = usePtStore((s) => s.resetDemo);
  const session = usePersonalSession();

  const [name, setName] = useState(profile?.name ?? '');
  const [cref, setCref] = useState(profile?.cref ?? '');
  const [specialty, setSpecialty] = useState(profile?.specialty ?? '');
  const [phone, setPhone] = useState(profile?.phone ?? '');
  const [bio, setBio] = useState(profile?.bio ?? '');
  const [prices, setPrices] = useState(profile?.planPrices ?? { Mensal: 250, Trimestral: 320, Online: 190, Avulso: 90 });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const [currentPwd, setCurrentPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [pwdMsg, setPwdMsg] = useState<string | null>(null);
  const [pwdSaving, setPwdSaving] = useState(false);

  const [linkedStudentId, setLinkedStudentId] = useState<string>('');
  const students = usePtStore((s) => s.students);
  const updateStudent = usePtStore((s) => s.updateStudent);

  useEffect(() => {
    if (profile) {
      setName(profile.name);
      setCref(profile.cref ?? '');
      setSpecialty(profile.specialty ?? '');
      setPhone(profile.phone ?? '');
      setBio(profile.bio ?? '');
      setPrices(profile.planPrices);
    }
  }, [profile]);

  const saveProfileData = async () => {
    const p = await getPtProfile();
    if (!p) return;
    setSaving(true);
    try {
      await saveProfile({
        ...p,
        name: name.trim() || p.name,
        cref: cref.trim() || undefined,
        specialty: specialty.trim() || undefined,
        phone: phone.trim() || undefined,
        bio: bio.trim() || undefined,
        planPrices: prices,
      });
      await refreshProfile();
      setMsg('Configurações salvas.');
    } catch (err) {
      setMsg(err instanceof Error ? err.message : 'Falha ao salvar.');
    } finally {
      setSaving(false);
    }
  };

  const changePwd = async () => {
    setPwdMsg(null);
    setPwdSaving(true);
    try {
      await changePersonalPassword(currentPwd, newPwd);
      setPwdMsg('Senha alterada com sucesso.');
      setCurrentPwd('');
      setNewPwd('');
    } catch (err) {
      setPwdMsg(err instanceof Error ? err.message : 'Falha ao alterar senha.');
    } finally {
      setPwdSaving(false);
    }
  };

  const toggleLinked = async () => {
    if (!linkedStudentId) return;
    const st = students.find((s) => s.id === linkedStudentId);
    if (!st) return;
    const next = !st.linkedDevice;
    // ensure only one linked
    if (next) {
      for (const s of students) {
        if (s.linkedDevice && s.id !== st.id) {
          await updateStudent({ ...s, linkedDevice: false });
        }
      }
    }
    await updateStudent({ ...st, linkedDevice: next });
  };

  return (
    <div className="pt-page">
      <div className="pt-settings-grid">
        <section className="pt-card">
          <div className="pt-card__head"><h3>Perfil do personal</h3></div>
          <div className="pt-card__body">
            <div className="pt-form-grid">
              <label className="pt-field">
                <span>Nome</span>
                <input className="pt-input" value={name} onChange={(e) => setName(e.target.value)} />
              </label>
              <label className="pt-field">
                <span>E-mail (login)</span>
                <input className="pt-input" value={session?.email ?? ''} disabled />
              </label>
              <label className="pt-field">
                <span>CREF</span>
                <input className="pt-input" value={cref} onChange={(e) => setCref(e.target.value)} placeholder="000000-G/SP" />
              </label>
              <label className="pt-field">
                <span>Especialidade</span>
                <input className="pt-input" value={specialty} onChange={(e) => setSpecialty(e.target.value)} placeholder="Hipertrofia, força…" />
              </label>
              <label className="pt-field">
                <span>Telefone</span>
                <input className="pt-input" value={phone} onChange={(e) => setPhone(e.target.value)} />
              </label>
              <label className="pt-field pt-form-grid--full">
                <span>Bio</span>
                <textarea className="pt-textarea" value={bio} onChange={(e) => setBio(e.target.value)} />
              </label>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12 }}>
              <button type="button" className="pt-btn pt-btn--primary" onClick={() => void saveProfileData()} disabled={saving}>
                <Save size={14} /> {saving ? 'Salvando…' : 'Salvar perfil'}
              </button>
            </div>
            {msg && <p style={{ color: 'var(--pt-accent)', fontSize: '0.8rem', marginTop: 8 }}>{msg}</p>}
          </div>
        </section>

        <section className="pt-card">
          <div className="pt-card__head"><h3>Preços por plano</h3></div>
          <div className="pt-card__body">
            <div className="pt-price-grid">
              {(Object.keys(prices) as Array<keyof typeof prices>).map((plan) => (
                <label className="pt-price" key={plan}>
                  <span>{plan}</span>
                  <input
                    type="number"
                    value={prices[plan]}
                    onChange={(e) => setPrices({ ...prices, [plan]: Number(e.target.value) })}
                  />
                </label>
              ))}
            </div>
            <p style={{ fontSize: '0.72rem', color: 'var(--pt-muted)', marginTop: 10 }}>
              Usado no cálculo de receita mensal do painel.
            </p>
          </div>
        </section>

        <section className="pt-card">
          <div className="pt-card__head"><h3>Aluno vinculado a este aparelho</h3></div>
          <div className="pt-card__body">
            <p style={{ fontSize: '0.78rem', color: 'var(--pt-muted)', marginBottom: 10 }}>
              O aluno vinculado recebe fichas enviadas e envia o histórico real de treinos para o CRM. Apenas um aluno pode estar vinculado por vez.
            </p>
            <div style={{ display: 'flex', gap: 8 }}>
              <select
                className="pt-select"
                style={{ flex: 1 }}
                value={linkedStudentId}
                onChange={(e) => setLinkedStudentId(e.target.value)}
              >
                <option value="">Selecione…</option>
                {students.filter((s) => !s.archived).map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}{s.linkedDevice ? ' (vinculado)' : ''}
                  </option>
                ))}
              </select>
              <button type="button" className="pt-btn pt-btn--primary pt-btn--sm" onClick={() => void toggleLinked()} disabled={!linkedStudentId}>
                Vincular / Desvincular
              </button>
            </div>
            <div style={{ marginTop: 10, fontSize: '0.75rem', color: 'var(--pt-muted)' }}>
              Vinculado atualmente:{' '}
              {students.find((s) => s.linkedDevice)?.name ?? 'nenhum'}
            </div>
          </div>
        </section>

        <section className="pt-card">
          <div className="pt-card__head"><h3>Segurança</h3></div>
          <div className="pt-card__body">
            <div className="pt-form-grid">
              <label className="pt-field">
                <span>Senha atual</span>
                <input className="pt-input" type="password" value={currentPwd} onChange={(e) => setCurrentPwd(e.target.value)} />
              </label>
              <label className="pt-field">
                <span>Nova senha</span>
                <input className="pt-input" type="password" value={newPwd} onChange={(e) => setNewPwd(e.target.value)} />
              </label>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 10 }}>
              <button type="button" className="pt-btn pt-btn--sm" onClick={() => void changePwd()} disabled={pwdSaving || !currentPwd || !newPwd}>
                <ShieldCheck size={13} /> {pwdSaving ? 'Alterando…' : 'Alterar senha'}
              </button>
            </div>
            {pwdMsg && <p style={{ color: 'var(--pt-accent)', fontSize: '0.8rem', marginTop: 8 }}>{pwdMsg}</p>}
          </div>
        </section>
      </div>

      <section className="pt-card">
        <div className="pt-card__head"><h3>Dados de demonstração</h3></div>
        <div className="pt-card__body pt-danger-zone">
          <p>
            O painel nasce com uma carteira de exemplo (6 alunos, fichas e histórico). Você pode apagar tudo e começar do zero — os alunos cadastrados por você são mantidos apenas se você não resetar.
          </p>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button
              type="button"
              className="pt-btn pt-btn--danger pt-btn--sm"
              onClick={() => {
                if (confirm('Apagar todos os dados de demonstração e recomeçar?')) void resetDemo();
              }}
            >
              <RefreshCw size={13} /> Resetar carteira de exemplo
            </button>
          </div>
        </div>
        </section>

      <section className="pt-card">
        <div className="pt-card__head"><h3>Sessão</h3></div>
        <div className="pt-card__body" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
          <div>
            <strong style={{ display: 'block' }}>{session?.name}</strong>
            <span style={{ fontSize: '0.75rem', color: 'var(--pt-muted)' }}>{session?.email}</span>
          </div>
          <button type="button" className="pt-btn pt-btn--danger" onClick={() => signOutPersonal()}>
            <LogOut size={14} /> Sair do painel
          </button>
        </div>
      </section>

    </div>
  );
}

