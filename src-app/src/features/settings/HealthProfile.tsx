/**
 * HealthProfile.tsx — "Perfil de Saúde" (Configurações → Perfil) v4.65.0
 *
 * Sexo e Data de nascimento vêm do formulário pós-login e aparecem aqui
 * SOMENTE COMO LEITURA (não são editáveis depois do cadastro). Só Peso e
 * Altura podem ser alterados a qualquer momento — e ambos também são
 * atualizados quando o usuário registra medidas na aba Progresso
 * (Métricas corporais), que gravam em `body-metrics.ts` e espelham o valor
 * aqui via `mergeHealthProfile`.
 *
 * O peso é persistido SEMPRE em kg (`mergeHealthProfile`), mas exibido na
 * unidade escolhida pelo usuário (`getWeightUnit()`), com conversão apenas
 * na entrada/saída do campo — igual ao restante do app (`formatLoadLabel`).
 * Ao mudar a preferência de unidade, o campo é reformatado na hora.
 */

import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { getWeightUnit, type WeightUnit } from '@/lib/app-prefs';
import { showToast } from '@/lib/toast';
import {
  HEALTH_PROFILE_EVENT,
  HEALTH_SEX_OPTIONS,
  KG_TO_LB,
  healthAge,
  mergeHealthProfile,
  readHealthProfile,
  type HealthSex,
} from './health-profile';
import './health-profile.css';

/* ── Ícones SVG stroke (Diretrizes/Ícones.md) ── */

const SvgPulse = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="19" height="19">
    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
  </svg>
);

const SvgLock = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="13" height="13">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

/* ── Conversão de peso (kg canônico ↔ unidade de exibição) ── */

const round1 = (value: number): number => Math.round(value * 10) / 10;

/** kg persistido → texto exibido na unidade atual. */
function weightToText(kg: string, unit: WeightUnit): string {
  const value = parseFloat(kg);
  if (!Number.isFinite(value) || value <= 0) return '';
  return String(round1(unit === 'lb' ? value * KG_TO_LB : value));
}

/** Texto digitado na unidade atual → kg persistido ('' quando inválido). */
function textToKg(text: string, unit: WeightUnit): string {
  const value = parseFloat(text.replace(',', '.'));
  if (!Number.isFinite(value) || value <= 0) return '';
  return String(round1(unit === 'lb' ? value / KG_TO_LB : value));
}

/** Data YYYY-MM-DD → dd/mm/aaaa (exibição do campo bloqueado). */
function formatNascimento(iso: string): string {
  const [y, m, d] = iso.split('-');
  if (!y || !m || !d) return '';
  return `${d}/${m}/${y}`;
}

/** Dados do cadastro pós-login — fallback p/ perfis salvos antes do v4.65.0. */
export interface HealthProfileSeed {
  sexo?: string;
  nascimento?: string;
  pesoKg?: number | null;
  alturaCm?: number | null;
}

interface HealthProfileProps {
  seed?: HealthProfileSeed;
}

export function HealthProfile({ seed }: HealthProfileProps) {
  const initial = useMemo(() => readHealthProfile(), []);
  const [unit, setUnit] = useState<WeightUnit>(() => getWeightUnit());
  const unitRef = useRef<WeightUnit>(unit);

  /* Sexo/Nascimento: Perfil de Saúde → cadastro pós-login (leitura apenas). */
  const sexo: HealthSex | '' =
    initial.sexo ||
    (HEALTH_SEX_OPTIONS.includes(seed?.sexo as HealthSex) ? (seed?.sexo as HealthSex) : '');
  const nascimento =
    initial.nascimento ||
    (seed?.nascimento && healthAge(seed.nascimento) !== null ? seed.nascimento : '');

  const [alturaCm, setAlturaCm] = useState(
    initial.alturaCm || (seed?.alturaCm != null ? String(seed.alturaCm) : '')
  );
  const [pesoText, setPesoText] = useState(() =>
    weightToText(initial.pesoKg || (seed?.pesoKg != null ? String(seed.pesoKg) : ''), unit)
  );

  /* Preferência de unidade pode mudar em outra tela (Exibição): reformata o
     campo convertendo o texto atual, sem perder o que foi digitado. */
  useEffect(() => {
    const onPrefs = () => {
      const nextUnit = getWeightUnit();
      const prevUnit = unitRef.current;
      if (nextUnit === prevUnit) return;
      unitRef.current = nextUnit;
      setUnit(nextUnit);
      setPesoText((text) => weightToText(textToKg(text, prevUnit), nextUnit));
    };
    window.addEventListener('academia:prefs-changed', onPrefs);
    return () => window.removeEventListener('academia:prefs-changed', onPrefs);
  }, []);

  /* Peso/Altura podem ser gravados fora daqui (Métricas corporais na aba
     Progresso): reidrata os campos quando o perfil mudar. */
  useEffect(() => {
    const onHealth = () => {
      const next = readHealthProfile();
      setAlturaCm(next.alturaCm);
      setPesoText(weightToText(next.pesoKg, unitRef.current));
    };
    window.addEventListener(HEALTH_PROFILE_EVENT, onHealth);
    return () => window.removeEventListener(HEALTH_PROFILE_EVENT, onHealth);
  }, []);

  const idade = healthAge(nascimento);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const altura = parseFloat(alturaCm.replace(',', '.'));
    if (!Number.isFinite(altura) || altura < 50 || altura > 260) {
      showToast('Informe uma altura entre 50 e 260 cm.', 'error');
      return;
    }

    const kg = textToKg(pesoText, unit);
    const kgValue = parseFloat(kg);
    if (!Number.isFinite(kgValue) || kgValue < 20 || kgValue > 400) {
      showToast('Informe um peso entre 20 e 400 kg.', 'error');
      return;
    }

    /* merge (não overwrite): Sexo e Nascimento continuam vindo do cadastro. */
    const saved = mergeHealthProfile({
      alturaCm: String(round1(altura)),
      pesoKg: kg,
    });

    setAlturaCm(saved.alturaCm);
    setPesoText(weightToText(saved.pesoKg, unit));
    showToast('Perfil de Saúde atualizado!', 'success');
  };

  return (
    <section className="set-card hp-card">
      <header className="hp-head">
        <span className="hp-head__icon" aria-hidden="true">
          {SvgPulse}
        </span>
        <div>
          <div className="set-card__eyebrow">SAÚDE</div>
          <h3 className="set-card__title">Perfil de Saúde</h3>
          <p className="set-card__desc hp-head__desc">
            Usamos gênero, peso e idade para fornecer treinos personalizados mais precisos.
          </p>
        </div>
      </header>

      <form className="hp-form" onSubmit={handleSubmit} noValidate>
        {/* Sexo — definido no cadastro pós-login (somente leitura). */}
        <div className="set-field">
          <span className="set-field__label">Sexo</span>
          <div className="hp-locked" aria-readonly="true">
            <span className={sexo ? '' : 'hp-locked__empty'}>
              {sexo || 'Não informado no cadastro'}
            </span>
            {SvgLock}
          </div>
        </div>

        <div className="set-field">
          <label className="set-field__label" htmlFor="hp-altura">
            Altura
          </label>
          <div className="hp-input-wrap">
            <input
              id="hp-altura"
              className="set-input"
              type="text"
              inputMode="decimal"
              autoComplete="off"
              placeholder="Ex.: 178"
              value={alturaCm}
              onChange={(e) => setAlturaCm(e.target.value)}
            />
            <span className="hp-input__unit" aria-hidden="true">
              cm
            </span>
          </div>
        </div>

        <div className="set-field">
          <label className="set-field__label" htmlFor="hp-peso">
            Peso
          </label>
          <div className="hp-input-wrap">
            <input
              id="hp-peso"
              className="set-input"
              type="text"
              inputMode="decimal"
              autoComplete="off"
              placeholder={unit === 'lb' ? 'Ex.: 176' : 'Ex.: 80'}
              value={pesoText}
              onChange={(e) => setPesoText(e.target.value)}
            />
            <span className="hp-input__unit" aria-hidden="true">
              {unit}
            </span>
          </div>
        </div>

        {/* Data de nascimento — definida no cadastro pós-login (somente leitura). */}
        <div className="set-field">
          <span className="set-field__label">Data de nascimento</span>
          <div className="hp-locked" aria-readonly="true">
            <span className={nascimento ? '' : 'hp-locked__empty'}>
              {nascimento ? formatNascimento(nascimento) : 'Não informada no cadastro'}
            </span>
            {SvgLock}
          </div>
          {idade !== null && (
            <p className="hp-hint">
              {idade} {idade === 1 ? 'ano' : 'anos'}
            </p>
          )}
        </div>

        <button type="submit" className="set-btn set-btn--primary hp-submit">
          Concluído
        </button>
        <p className="hp-foot">
          Peso e altura também são atualizados pelas métricas corporais (aba Progresso).
        </p>
      </form>
    </section>
  );
}

export default HealthProfile;
