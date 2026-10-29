/**
 * ExercicioFormModal.tsx — Modal Novo/Editar Exercício (Fase 4)
 * Port 1:1 de componentes/secoes/modais.html L39–234 (modalExercicio) +
 * JS/treino/secao-treinos.js L104–240 (openNew/openEdit/save/resetUpload/
 * renderExChart) + upload/q-tags de app.js L179–188/L433–440.
 */

import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { Exercise, ExerciseTag, MuscleGroup } from '@/core/db/schema';
import { showToast } from '@/lib/toast';
import { getSuggestedLoad } from '@/lib/suggested-load';
import {
  buildHistorico,
  saveExerciseRecord,
  uid,
} from '@/features/workout/treinos/treinos-helpers';
import { useModalPresence } from '@/hooks/useModalPresence';

/* Portal para document.body: o .section-strip tem transform/will-change e
   viraria o containing block do position:fixed do .modal-overlay. */
const toBody = (node: React.ReactNode) => createPortal(node, document.body);

/* ── Chips de grupo muscular (modais.html L68–140) ── */

const GRUPO_CHIPS: { value: MuscleGroup; label: string; icon: React.ReactNode }[] = [
  {
    value: 'Peito',
    label: 'Peito',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width={13} height={13}>
        <path d="M12 20V10M6 20V14M18 20V8" />
        <path d="M3 6c3-2 6-2 9 0s6 2 9 0" />
      </svg>
    ),
  },
  {
    value: 'Costas',
    label: 'Costas',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width={13} height={13}>
        <path d="M6.5 6.5h11M6.5 17.5h11M12 6.5v11" />
        <circle cx="4" cy="12" r="1.5" />
        <circle cx="20" cy="12" r="1.5" />
      </svg>
    ),
  },
  {
    value: 'Pernas',
    label: 'Pernas',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width={13} height={13}>
        <path d="M12 2v10M12 12l-4 8M12 12l4 8M8 6H5a1 1 0 00-1 1v1a1 1 0 001 1h3" />
      </svg>
    ),
  },
  {
    value: 'Ombros',
    label: 'Ombros',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width={13} height={13}>
        <path d="M2 12c0-5.5 10-8 10-8s10 2.5 10 8" />
        <path d="M12 4v16" />
      </svg>
    ),
  },
  {
    value: 'Bíceps',
    label: 'Bíceps',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width={13} height={13}>
        <path d="M6.5 6.5h11M6.5 17.5h11M12 6.5v11" />
        <circle cx="4" cy="12" r="1.5" />
        <circle cx="20" cy="12" r="1.5" />
      </svg>
    ),
  },
  {
    value: 'Tríceps',
    label: 'Tríceps',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width={13} height={13}>
        <path d="M6.5 6.5h11M6.5 17.5h11M12 6.5v11" />
        <circle cx="4" cy="12" r="1.5" />
        <circle cx="20" cy="12" r="1.5" />
      </svg>
    ),
  },
  {
    value: 'Core',
    label: 'Core',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width={13} height={13}>
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
      </svg>
    ),
  },
];

/* ── Tags de movimento (modais.html L145–160) ── */

const TAG_OPTIONS: { value: ExerciseTag; label: string }[] = [
  { value: 'Isolador', label: 'Isolador' },
  { value: 'Multiarticular', label: 'Multiarticular' },
  { value: 'Livre', label: 'Livre / Halter' },
  { value: 'Unilateral', label: 'Unilateral' },
  { value: 'Máquina', label: 'Máquina / Cabo' },
  { value: 'Explosão', label: 'Explosão / Salto' },
  { value: 'Mobilidade', label: 'Mobilidade' },
  { value: 'Peso do Corpo', label: 'Peso do Corpo' },
];

/* ── Quick tags de anotação (modais.html L197–217) ── */

const QTAGS: { tag: string; label: string; icon: React.ReactNode }[] = [
  {
    tag: '[BANCO] ',
    label: 'Banco',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width={13} height={13}>
        <path d="M19 9h2a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1h-2M5 9H3a1 1 0 0 0-1 1v2a1 1 0 0 0 1 1h2M12 2v7M5 9h14v9H5z" />
      </svg>
    ),
  },
  {
    tag: '[PEGADA] ',
    label: 'Pegada',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width={13} height={13}>
        <path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.7-6-2.2L2 16.5a1.5 1.5 0 0 1 0-2.1l1-1a1.5 1.5 0 0 1 2.1 0L7 15V4a2 2 0 0 1 4 0v7a1 1 0 0 0 2 0V5a2 2 0 1 1 4 0v6a1 1 0 0 0 2 0V8z" />
      </svg>
    ),
  },
  {
    tag: '[DICA] ',
    label: 'Dica',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width={13} height={13}>
        <path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .6 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5" />
        <path d="M9 18h6M10 22h4" />
      </svg>
    ),
  },
];

interface ExercicioFormModalProps {
  open: boolean;
  editEx: Exercise | null;
  onClose: () => void;
  onSaved: () => void;
}

export const ExercicioFormModal: React.FC<ExercicioFormModalProps> = ({
  open,
  editEx,
  onClose,
  onSaved,
}) => {
  /* openNewExercicio (L104–116) / openEditExercicio (L118–146):
     o componente é remontado via `key` a cada abertura (novo/edição), então o
     estado inicial derivado das props substitui o effect de init do legado. */
  const [nome, setNome] = useState(() => editEx?.name ?? '');
  const [grupo, setGrupo] = useState(() => editEx?.muscleGroup ?? '');
  const [tags, setTags] = useState<ExerciseTag[]>(() => [...(editEx?.tags ?? [])]);
  const [porLado, setPorLado] = useState(() => Boolean(editEx?.porLado));
  const [series, setSeries] = useState(() => String(editEx?.sets ?? 3));
  const [reps, setReps] = useState(() => editEx?.reps ?? '10');
  const [carga, setCarga] = useState(() => editEx?.load ?? '');
  const [descanso, setDescanso] = useState(() =>
    editEx?.rest !== undefined && editEx?.rest !== null ? String(editEx.rest) : '30'
  );
  const [anotacoes, setAnotacoes] = useState(() => editEx?.notes ?? '');
  const [imagem, setImagem] = useState<string | null>(() => editEx?.imageUrl ?? null);
  /* Garante que as anotações do exercício em edição sejam exibidas (o estado
     inicial via useState só roda no mount; ao reabrir/editar outro item o
     valor pode ficar stale). */
  useEffect(() => {
    setAnotacoes(editEx?.notes ?? '');
  }, [editEx?.id, editEx?.notes]);
  const fileRef = useRef<HTMLInputElement>(null);
  const taRef = useRef<HTMLTextAreaElement>(null);

  /* v4.31.1 — peso inicial sugerido pelo NOME/grupo/tags: ele PREENCHE o campo
     Carga por padrão. Enquanto o usuário não digitar nada, o campo acompanha a
     sugestão (inclusive ao trocar o nome); ao editar, o valor do usuário manda.
     Num exercício já salvo a sugestão só entra quando a carga está vazia. */
  const sugestaoCarga = getSuggestedLoad({ name: nome, muscleGroup: grupo, tags });
  const cargaTouchedRef = useRef(Boolean(editEx?.load));
  useEffect(() => {
    if (cargaTouchedRef.current) return;
    setCarga(sugestaoCarga ?? '');
  }, [sugestaoCarga]);

  /* Upload (app.js L179–188): click área → input; máx. 2MB; FileReader */
  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      showToast('Imagem muito grande (máx. 2MB).', 'error');
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => setImagem(String(ev.target?.result ?? ''));
    reader.readAsDataURL(file);
  };

  const toggleTag = (t: ExerciseTag) =>
    setTags((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]));

  /* q-tags (app.js L433–440) */
  const appendQTag = (tag: string) => {
    setAnotacoes((prev) => prev + (prev && !prev.endsWith('\n') ? '\n' : '') + tag);
    window.setTimeout(() => taRef.current?.focus(), 0);
  };

  /* saveExercicio (L189–240) */
  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const nomeV = nome.trim();
    const repsV = reps.trim() || '10';
    const seriesV = parseInt(series) || 3;
    const descansoV = parseInt(descanso) || 0;
    const anotacoesV = anotacoes.trim();

    if (!nomeV || !grupo) {
      showToast('Preencha nome e grupo muscular.', 'error');
      return;
    }

    const { historicoCargas, recordToast } = buildHistorico(
      editEx?.historicoCargas,
      carga.trim(),
      editEx?.load,
      Boolean(editEx)
    );

    const payload: Exercise = {
      id: editEx?.id ?? uid(),
      name: nomeV,
      muscleGroup: grupo as MuscleGroup,
      sets: seriesV,
      reps: repsV,
      load: carga.trim(),
      rest: descansoV,
      imageUrl: imagem || null,
      tags: tags as ExerciseTag[],
      porLado,
      notes: anotacoesV || undefined,
      historicoCargas,
      createdAt: editEx?.createdAt,
    };

    const msg = await saveExerciseRecord(payload, !editEx);
    showToast(recordToast ?? msg, 'success');
    onClose();
    onSaved();
  };

  const hist = editEx?.historicoCargas ?? [];
  const showChart = Boolean(editEx) && hist.length > 0;
  const maxValor = hist.length ? Math.max(...hist.map((h) => h.valor)) : 0;
  /* v4.53.0 — mantém montado durante o fade de saída. */
  const { mounted, closing } = useModalPresence(open);

  if (!mounted) return null;

  return toBody(
    <div
      className={`modal-overlay${closing ? ' is-closing' : ''}`}
      id="modalExercicio"
      role="dialog"
      aria-modal="true"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal-form modal-form--exercicio">
        <div className="modal-form-header">
          <h3 id="modalExTitulo">{editEx ? 'Editar Exercício' : 'Novo Exercício'}</h3>
          <button type="button" className="modal-close-btn" id="btnFecharExercicio" aria-label="Fechar" onClick={onClose}>
            ✕
          </button>
        </div>
        <form id="formExercicio" noValidate onSubmit={onSubmit}>
          {/* Upload de imagem */}
          <div className="upload-area" id="uploadArea" onClick={() => fileRef.current?.click()}>
            <input ref={fileRef} type="file" id="uploadInput" accept="image/*" style={{ display: 'none' }} onChange={onFileChange} />
            <div className="upload-placeholder" id="uploadPlaceholder" style={{ display: imagem ? 'none' : 'block' }}>
              <div className="upload-icon">📷</div>
              <div className="upload-text">Clique para adicionar foto do aparelho</div>
              <div className="upload-hint">JPG, PNG ou WEBP — máx. 2MB</div>
            </div>
            <img id="uploadPreview" className="upload-preview" src={imagem ?? ''} alt="Preview" style={{ display: imagem ? 'block' : 'none' }} />
            <button
              type="button"
              className="upload-remove"
              id="btnRemoveImg"
              style={{ display: imagem ? 'inline-block' : 'none' }}
              onClick={(e) => {
                e.stopPropagation();
                setImagem(null);
                if (fileRef.current) fileRef.current.value = '';
              }}
            >
              ✕ Remover foto
            </button>
          </div>

          <div className="form-group">
            <label htmlFor="inputNome">Nome do Exercício *</label>
            <input
              type="text"
              id="inputNome"
              placeholder="Ex: Supino Articulado"
              required
              value={nome}
              onChange={(e) => setNome(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label htmlFor="inputGrupo">Grupo Muscular *</label>
            <select
              id="inputGrupo"
              value={grupo}
              onChange={(e) => setGrupo(e.target.value)}
              className="mu-select"
              required
            >
              <option value="" disabled>Selecione o grupo muscular</option>
              {GRUPO_CHIPS.map((chip) => (
                <option key={chip.value} value={chip.value}>
                  {chip.label}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="inputTipoMovimento">Tipo de Movimento / Foco</label>
            <select
              id="inputTipoMovimento"
              value={tags.join(' ')}
              onChange={(e) => {
                const selected = e.target.value
                  .split(' ')
                  .filter((v) => v !== '')
                  .map((v) => v as ExerciseTag);
                setTags(selected);
              }}
              className="mu-select"
              required
            >
              <option value="" disabled>Selecione o tipo de movimento</option>
              {TAG_OPTIONS.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group" style={{ marginTop: 20, marginBottom: 20 }}>
            <label
              className="custom-checkbox"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                cursor: 'pointer',
                background: 'rgba(255,255,255,0.03)',
                padding: '12px',
                borderRadius: '12px',
                border: '1px solid var(--card-border)',
                transition: '0.3s',
              }}
            >
              <input
                type="checkbox"
                id="inputPorLado"
                style={{ width: 18, height: 18, cursor: 'pointer', accentColor: 'var(--primary)' }}
                checked={porLado}
                onChange={(e) => setPorLado(e.target.checked)}
              />
              <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                Esta carga é <b>por lado</b> (ex: halteres)
              </span>
            </label>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="inputSeries">Séries</label>
              <input type="number" id="inputSeries" min={1} max={10} value={series} onChange={(e) => setSeries(e.target.value)} />
            </div>
            <div className="form-group">
              <label htmlFor="inputReps">Repetições</label>
              <input type="text" id="inputReps" placeholder="Ex: 10 ou 8-12" value={reps} onChange={(e) => setReps(e.target.value)} />
            </div>
            <div className="form-group">
              <label htmlFor="inputCarga">Carga</label>
              <input
                type="text"
                id="inputCarga"
                placeholder={sugestaoCarga ? `Sugerido: ${sugestaoCarga}` : 'Ex: 40kg'}
                value={carga}
                onChange={(e) => {
                  cargaTouchedRef.current = true;
                  setCarga(e.target.value);
                }}
              />
            </div>
            <div className="form-group">
              <label htmlFor="inputDescanso">Descanso (s)</label>
              <input
                type="number"
                id="inputDescanso"
                min={0}
                max={300}
                placeholder="0 = desativado"
                value={descanso}
                onChange={(e) => setDescanso(e.target.value)}
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="inputAnotacoes">Anotações e Dicas de Execução</label>
            <textarea
              ref={taRef}
              id="inputAnotacoes"
              rows={3}
              placeholder="Ex: Altura do banco, tipo de pegada, ajuste do aparelho..."
              value={anotacoes}
              onChange={(e) => setAnotacoes(e.target.value)}
            />
            <div className="note-quick-tags">
              {QTAGS.map((q) => (
                <button
                  type="button"
                  key={q.tag}
                  className="q-tag"
                  data-tag={q.tag}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                  onClick={() => appendQTag(q.tag)}
                >
                  {q.icon}
                  {q.label}
                </button>
              ))}
            </div>
          </div>

          {/* Evolução de Força (renderExChart L163–187) */}
          <div className="ex-chart-container" id="exChartContainer" style={{ display: showChart ? 'block' : 'none' }}>
            <h4>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="16" height="16" style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '6px' }}>
                <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
                <polyline points="17 6 23 6 23 12" />
              </svg>
              Evolução de Força (Carga)
            </h4>
            <div className="ex-chart" id="exChart">
              {hist.map((h, i) => {
                const heightPct = maxValor > 0 ? (h.valor / maxValor) * 100 : 0;
                const dateLbl = new Date(h.data + 'T12:00:00').toLocaleDateString('pt-BR', {
                  day: '2-digit',
                  month: '2-digit',
                });
                return (
                  <div className="chart-bar-wrap" key={`${h.data}-${i}`}>
                    <div className="chart-val">{h.label}</div>
                    <div className="chart-bar" style={{ height: `${heightPct}%` }} title={`${h.label} em ${dateLbl}`} />
                    <div className="chart-date">{dateLbl}</div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="form-actions">
            <button type="button" className="btn btn-secondary" id="btnCancelarEx" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary" id="btnSalvarEx">
              Salvar Exercício
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
