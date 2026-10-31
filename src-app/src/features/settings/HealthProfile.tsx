/**
 * HealthProfile.tsx — "Perfil de Saúde" (Configurações → Perfil) v4.56.22
 *
 * Tela no desenho da referência (Sexo, Altura, Peso, Data de nascimento e o
 * botão "Concluído"), adaptada ao design system `set-*` das Configurações.
 * Usa o mesmo subtítulo da referência e mantém os dados só neste dispositivo.
 *
 * O peso é persistido SEMPRE em kg (`saveHealthProfile`), mas exibido na
 * unidade escolhida pelo usuário (`getWeightUnit()`), com conversão apenas
 * na entrada/saída do campo — igual ao restante do app (`formatLoadLabel`).
 * Ao mudar a preferência de unidade, o campo é reformatado na hora.
 */

import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { getWeightUnit, type WeightUnit } from '@/lib/app-prefs';
import { showToast } from '@/lib/toast';
import {
  HEALTH_SEX_OPTIONS,
  KG_TO_LB,
  healthAge,
  readHealthProfile,
  saveHealthProfile,
  type HealthSex,
} from './health-profile';
import './health-profile.css';

/* ── Ícones SVG stroke (Diretrizes/Ícones.md) ── */

const SvgPulse = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="19" height="19">
    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
  </svg>
);

const SvgChevronDown = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="15" height="15">
    <polyline points="6 9 12 15 18 9" />
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

/** Data de hoje em YYYY-MM-DD (limite do input type="date"). */
function todayISO(): string {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${now.getFullYear()}-${month}-${day}`;
}

export function HealthProfile() {
  const initial = useMemo(() => readHealthProfile(), []);
  const [unit, setUnit] = useState<WeightUnit>(() => getWeightUnit());
  const unitRef = useRef<WeightUnit>(unit);

  const [sexo, setSexo] = useState<HealthSex | ''>(initial.sexo);
  const [alturaCm, setAlturaCm] = useState(initial.alturaCm);
  const [pesoText, setPesoText] = useState(() => weightToText(initial.pesoKg, unit));
  const [nascimento, setNascimento] = useState(initial.nascimento);

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

  const idade = healthAge(nascimento);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!sexo) {
      showToast('Selecione uma opção em Sexo.', 'error');
      return;
    }

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

    if (healthAge(nascimento) === null) {
      showToast('Informe uma data de nascimento válida.', 'error');
      return;
    }

    const saved = saveHealthProfile({
      sexo,
      alturaCm: String(round1(altura)),
      pesoKg: kg,
      nascimento,
    });

    setSexo(saved.sexo);
    setAlturaCm(saved.alturaCm);
    setPesoText(weightToText(saved.pesoKg, unit));
    setNascimento(saved.nascimento);
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
        <div className="set-field">
          <label className="set-field__label" htmlFor="hp-sexo">
            Sexo
          </label>
          <div className="hp-select-wrap">
            <select
              id="hp-sexo"
              className="set-input hp-select"
              value={sexo}
              onChange={(e) => setSexo(e.target.value as HealthSex | '')}
            >
              <option value="">Selecione</option>
              {HEALTH_SEX_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            <span className="hp-select__chev" aria-hidden="true">
              {SvgChevronDown}
            </span>
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

        <div className="set-field">
          <label className="set-field__label" htmlFor="hp-nascimento">
            Data de nascimento
          </label>
          <input
            id="hp-nascimento"
            className="set-input hp-date"
            type="date"
            max={todayISO()}
            value={nascimento}
            onChange={(e) => setNascimento(e.target.value)}
          />
          {idade !== null && (
            <p className="hp-hint">
              {idade} {idade === 1 ? 'ano' : 'anos'}
            </p>
          )}
        </div>

        <button type="submit" className="set-btn set-btn--primary hp-submit">
          Concluído
        </button>
        <p className="hp-foot">Seus dados ficam salvos apenas neste dispositivo.</p>
      </form>
    </section>
  );
}

export default HealthProfile;
