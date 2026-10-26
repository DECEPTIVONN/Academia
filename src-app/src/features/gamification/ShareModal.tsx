/**
 * ShareModal.tsx — Modal de compartilhamento `#modalShare` (Fase 3)
 * Port 1:1 do DOM (`componentes/secoes/modais.html` L465–576) e das funções
 * `openShareCard` (secao-perfil.js L702–762), `downloadShareImage` (L774–805),
 * `shareImageNow` (L807–886) e `shareRadar` (L888–911).
 *
 * html2canvas é importado dinamicamente (legado carrega via CDN); instalado
 * como dependência npm.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocalData } from '@/hooks/useLocalData';
import {
  formatCarga,
  formatSeconds,
  getExerciseMap,
  getStreak,
  getTodayTreino,
  pickExercises,
  today,
  todayLabel,
} from '@/core/db/queries';
import { averageLoadKg, effectiveLoadKg } from '@/lib/suggested-load';
import { shareNative, canNativeShare } from '@/lib/native-share';
import type { NativeShareResult } from '@/lib/native-share';
import { useShareStore } from './share-store';
import { useRadarMode } from './useRadarFit';
import { showToast } from '@/lib/toast';
import { convertKgToDisplay, getWeightUnitLabel } from '@/lib/app-prefs';

interface ExStat {
  name: string;
  vol: number;
  carga: string;
}

/** html2canvas(card, opts) — opções idênticas às do legado (L784–789). */
async function renderCanvas(card: HTMLElement): Promise<HTMLCanvasElement> {
  const { default: html2canvas } = await import('html2canvas');
  return html2canvas(card, {
    scale: 1.5,
    backgroundColor: '#000000',
    useCORS: true,
    logging: false,
  });
}

/** Espelha `getActiveShareCardInfo` (L764–772): nome do card ativo. */
function activeCardName(kind: string): 'treino' | 'conquista' | 'radar' {
  if (kind === 'conquista') return 'conquista';
  if (kind === 'radar') return 'radar';
  return 'treino';
}

export function ShareModal() {
  const { exercises, sheets, history, legacy } = useLocalData();
  const { show, kind, badge, quote, close } = useShareStore();
  const radarMode = useRadarMode((s) => s.mode);
  const [busy, setBusy] = useState<'share' | 'download' | null>(null);
  const [imageReady, setImageReady] = useState(false);
  const radarCloneRef = useRef<HTMLDivElement>(null);
  const canvasFileRef = useRef<File | null>(null);
  const filePromiseRef = useRef<Promise<File | null> | null>(null);
  /** Incrementa a cada card novo: descarta render antigo que termine depois. */
  const renderSeqRef = useRef(0);
  const cardId = kind === 'conquista' ? 'shareCardBadge' : kind === 'radar' ? 'shareCardRadar' : 'shareCard';

  /**
   * v4.52.0-share — gera (uma vez por card) o PNG que vai no compartilhamento.
   * Devolve o `File` de verdade: antes o modal renderizava o canvas mas nunca
   * criava o arquivo, então o compartilhamento caía sempre no texto sem imagem.
   */
  const buildShareFile = useCallback(async (): Promise<File | null> => {
    if (canvasFileRef.current) return canvasFileRef.current;
    if (filePromiseRef.current) return filePromiseRef.current;
    const card = document.getElementById(cardId) as HTMLElement | null;
    if (!card) return null;
    const seq = renderSeqRef.current;
    const job = (async (): Promise<File | null> => {
      try {
        const canvas = await renderCanvas(card);
        if (seq !== renderSeqRef.current) return null;
        const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
        if (!blob) return null;
        const file = new File([blob], `evo-fit-${activeCardName(kind)}-${today()}.png`, {
          type: 'image/png',
        });
        canvasFileRef.current = file;
        return file;
      } catch (err) {
        console.warn('[share] falha ao gerar a imagem', err);
        return null;
      }
    })();
    filePromiseRef.current = job;
    try {
      return await job;
    } finally {
      filePromiseRef.current = null;
    }
  }, [cardId, kind]);

  /** Baixa o PNG gerado (fallback de quem não tem folha de compartilhamento). */
  const downloadFile = (file: File): void => {
    const link = document.createElement('a');
    link.download = file.name;
    link.href = URL.createObjectURL(file);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(link.href), 30000);
  };

  const data = useMemo(
    () => ({ exercises, sheets, history, legacy }),
    [exercises, sheets, history, legacy]
  );
  const dateLabel = useMemo(() => (show ? todayLabel().toUpperCase() : ''), [show]);
  /* v4.44.0 — volume do card respeita a unidade de peso escolhida. */
  const weightUnit = getWeightUnitLabel();

  /* openShareCard L703–755 — stats do treino + destaques */
  const view = useMemo(() => {
    const treino = getTodayTreino(data);
    const fichaIds = sheets.find((s) => s.sheetKey === treino)?.exerciseIds ?? [];
    const exercicios = pickExercises(fichaIds, getExerciseMap(exercises));
    const streak = getStreak(history);

    const cargas = exercicios.map((ex) => effectiveLoadKg(ex));
    const exStats: ExStat[] = exercicios.map((ex, i) => {
      const s = Number(ex.sets) || 0;
      const r = Number(ex.reps) || 0;
      const loadVal = cargas[i];
      const multi = ex.porLado ? 2 : 1;
      return { name: ex.name, vol: s * r * loadVal * multi, carga: formatCarga(ex) };
    });
    const totalVol = exStats.reduce((acc, x) => acc + x.vol, 0);

    const avgVol = averageLoadKg(exercicios).toFixed(1);
    const highlights = [...exStats].sort((a, b) => b.vol - a.vol).slice(0, 3);
    const histHoje = history.find((h) => h.date === today());
    const durStr = histHoje?.durationMin ? formatSeconds(histHoje.durationMin * 60) : '--';

    return { treino, exCount: exercicios.length, totalVol, avgVol, streak, durStr, highlights };
  }, [data, exercises, sheets, history]);

  /** Texto que acompanha a imagem no compartilhamento (personalizado por card). */
  const shareText = useMemo(() => {
    const url = window.location.origin;
    if (kind === 'conquista' && badge?.name) {
      return `Conquista desbloqueada no Evo Fit: ${badge.name}! ${url}`;
    }
    if (kind === 'radar') return `Meu Radar Fit no Evo Fit! ${url}`;
    const vol = Math.round(convertKgToDisplay(view.totalVol, weightUnit)).toLocaleString('pt-BR');
    return `Confira meu treino de hoje na Evo Fit! ${view.exCount} exercícios • ${vol} ${weightUnit.toUpperCase()} totais. ${url}`;
  }, [kind, badge, view, weightUnit]);

  /* shareRadar L894–903 — clona o SVG do radar para o card */
  useEffect(() => {
    if (!show || kind !== 'radar') return;
    const container = radarCloneRef.current;
    if (!container) return;
    container.innerHTML = '';
    const svg = document.querySelector('#radarChartContainer svg');
    if (svg) {
      const clone = svg.cloneNode(true) as SVGElement;
      (clone as SVGElement).style.width = '100%';
      (clone as SVGElement).style.maxWidth = '300px';
      (clone as SVGElement).style.height = 'auto';
      container.appendChild(clone);
    }
  }, [show, kind]);

  /**
   * v4.52.0-share — a imagem é gerada assim que o modal abre, e não no clique:
   * a Web Share API exige gesto do usuário e o html2canvas leva ~1s, o que
   * estourava a ativação transitória e fazia o compartilhamento falhar.
   */
  useEffect(() => {
    if (!show) return;
    renderSeqRef.current += 1;
    canvasFileRef.current = null;
    filePromiseRef.current = null;
    setImageReady(false);
    let alive = true;
    // Deixa o card (e o clone do radar) pintar antes de rasterizar.
    const timer = window.setTimeout(() => {
      void buildShareFile().then((file) => {
        if (alive) setImageReady(!!file);
      });
    }, 150);
    return () => {
      alive = false;
      window.clearTimeout(timer);
    };
  }, [show, kind, badge, quote, view, buildShareFile]);

  /* downloadShareImage L774–805 */
  const handleDownload = async () => {
    if (busy) return;
    setBusy('download');
    try {
      const file = canvasFileRef.current ?? (await buildShareFile());
      if (!file) {
        showToast('Não foi possível gerar a imagem.', 'error');
        return;
      }
      downloadFile(file);
      showToast('Imagem gerada com sucesso! Confira seus downloads.', 'success');
    } catch (err) {
      console.warn('[download]', err);
      showToast('Não foi possível gerar a imagem.', 'error');
    } finally {
      setBusy(null);
    }
  };

  /* shareImageNow L807–886 — Web Share API (texto + imagem) → download/clipboard */
  const handleShare = async () => {
    if (busy) return;
    setBusy('share');
    try {
      // Normalmente já está pronto (pré-renderizado na abertura do modal).
      const file = canvasFileRef.current ?? (await buildShareFile());
      if (!file) {
        showToast('Não foi possível gerar a imagem para compartilhar.', 'error');
        return;
      }

      const text = shareText;
      const nav = navigator as Navigator & { canShare?: (d?: ShareData) => boolean };
      const payload: ShareData = { title: 'Evo Fit', text, files: [file] };
      let canFiles = true;
      try {
        canFiles = !nav.canShare || nav.canShare(payload);
      } catch {
        canFiles = false;
      }

      if (canFiles) {
        const r: NativeShareResult = await shareNative(payload);
        if (r === 'shared') {
          showToast('Compartilhado!', 'success');
          return;
        }
        if (r === 'cancelled') return; // usuário fechou a folha — sem fallback
      }

      // Plataforma sem share de arquivo (ex.: Chrome desktop): compartilha o
      // texto e entrega a imagem baixada para anexar manualmente.
      const textResult = await shareNative({ title: 'Evo Fit', text });
      if (textResult === 'shared' || textResult === 'cancelled') {
        downloadFile(file);
        showToast('Link compartilhado. A imagem foi baixada para você anexar.', 'info');
        return;
      }

      // Sem Web Share: baixa a imagem e tenta copiá-la para a área de transferência.
      downloadFile(file);
      try {
        await navigator.clipboard.write([new ClipboardItem({ [file.type]: file })]);
        showToast('Imagem copiada e baixada. Cole no seu app de mensagens!', 'success');
      } catch {
        showToast('Imagem baixada! Anexe no seu app de mensagens.', 'info');
      }
    } catch (err) {
      console.error(err);
      showToast('Erro ao preparar compartilhamento.', 'error');
    } finally {
      setBusy(null);
    }
  };

  if (!show) return null;

  return (
    <div
      className="modal-overlay"
      id="modalShare"
      style={{ display: 'flex' }}
      role="dialog"
      aria-modal="true"
      aria-hidden={false}
    >
      <div className="share-modal-container">
        {/* Card TREINO (modais.html L468–512) */}
        <div
          className="share-card"
          id="shareCard"
          style={{ display: kind === 'treino' ? 'flex' : 'none' }}
        >
          <div className="share-card-header">
            <div className="share-app-name">
              EVO<span>FIT</span>
            </div>
            <div className="share-date" id="shareDate">
              {dateLabel}
            </div>
          </div>

          <div className="share-card-main">
            <div className="share-badge">TREINO CONCLUÍDO!</div>
            <h2 className="share-title" id="shareTitle">
              TREINO {view.treino}: {view.exCount} EXERCÍCIOS
            </h2>

            {/* v4.22.0 — 2 colunas: Exercícios, volume total, Ofensiva, Duração */}
            <div className="share-stats-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px 30px' }}>
              <div className="s-stat-item">
                <span className="s-stat-val" id="shareExCount">
                  {view.exCount}
                </span>
                <span className="s-stat-lbl">EXERCÍCIOS</span>
              </div>
              <div className="s-stat-item">
                <span className="s-stat-val" id="shareVol">
                  {Math.round(convertKgToDisplay(view.totalVol, weightUnit)).toLocaleString('pt-BR')}
                </span>
                <span className="s-stat-lbl">{weightUnit.toUpperCase()} TOTAIS</span>
              </div>
              <div className="s-stat-item">
                <span className="s-stat-val" id="shareStreak">
                  {view.streak > 0 ? (
                    <>
                      {view.streak}
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        width={16}
                        height={16}
                        style={{
                          color: '#f97316',
                          marginLeft: 2,
                          display: 'inline-block',
                          verticalAlign: 'middle',
                        }}
                      >
                        <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
                      </svg>
                    </>
                  ) : (
                    0
                  )}
                </span>
                <span className="s-stat-lbl">OFENSIVA</span>
              </div>
              <div className="s-stat-item">
                <span className="s-stat-val" id="shareTime">
                  {view.durStr}
                </span>
                <span className="s-stat-lbl">DURAÇÃO</span>
              </div>
            </div>

            <div className="share-highlights">
              <div className="sh-title">DESTAQUES DO DIA</div>
              <div className="sh-list" id="shareHighlightsList">
                {view.highlights.map((h, i) => (
                  <div className="sh-item" key={`${h.name}-${i}`}>
                    <span className="sh-name">{h.name}</span>
                    <span className="sh-val">{h.carga || `${Math.round(convertKgToDisplay(h.vol, weightUnit))}${weightUnit} total`}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="share-card-footer">
            <p className="share-quote">"{quote}"</p>
          </div>
        </div>

        {/* Card CONQUISTA (modais.html L515–535) */}
        <div
          className="share-card share-card-achievement"
          id="shareCardBadge"
          style={{
            display: kind === 'conquista' ? 'flex' : 'none',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div className="share-card-header">
            <div className="share-app-name">
              EVO<span>FIT</span>
            </div>
            <div className="share-date" id="shareBadgeDate">
              {dateLabel}
            </div>
          </div>
          <div
            className="share-card-main"
            style={{
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 20,
              flex: 1,
            }}
          >
            <div className="share-badge">NOVA CONQUISTA!</div>
            <div
              className="share-badge-icon"
              id="shareBadgeIcon"
              style={{
                fontSize: '8rem',
                margin: '20px 0',
                filter: 'drop-shadow(0 0 20px var(--primary))',
              }}
            >
              {badge?.icon ?? '🏆'}
            </div>
            <h2
              className="share-title"
              id="shareBadgeName"
              style={{ fontSize: '2.2rem', marginBottom: 10, lineHeight: 1.1 }}
            >
              {(badge?.name ?? '').toUpperCase()}
            </h2>
            <p
              className="share-badge-desc"
              id="shareBadgeDesc"
              style={{
                color: 'var(--text-secondary)',
                fontSize: '1.1rem',
                maxWidth: '80%',
                lineHeight: 1.4,
              }}
            >
              {badge?.desc ?? ''}
            </p>
          </div>
          <div className="share-card-footer">
            <p className="share-quote">"{quote}"</p>
          </div>
        </div>

        {/* Card RADAR (modais.html L538–554) */}
        <div
          className="share-card share-card-radar"
          id="shareCardRadar"
          style={{
            display: kind === 'radar' ? 'flex' : 'none',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div className="share-card-header">
            <div className="share-app-name">
              EVO<span>FIT</span>
            </div>
            <div className="share-date" id="shareRadarDate">
              {dateLabel}
            </div>
          </div>
          <div className="share-card-main" style={{ textAlign: 'center', flex: 1 }}>
            <div className="share-badge" id="shareRadarMode">
              RADAR {radarMode === 'mensal' ? 'MENSAL' : 'TOTAL'}
            </div>
            <div
              id="shareRadarCloneContainer"
              ref={radarCloneRef}
              style={{
                marginTop: 15,
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                width: '100%',
              }}
            />
          </div>
          <div className="share-card-footer">
            <p className="share-quote">"{quote}"</p>
          </div>
        </div>

        {/* Ações (modais.html L556–574) */}
        <div
          className="share-actions"
          style={{
            marginTop: 20,
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
            width: '100%',
            maxWidth: 350,
          }}
        >
          <button
            type="button"
            className="btn btn-primary"
            id="btnShareNow"
            disabled={busy !== null}
            onClick={() => void handleShare()}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
            }}
          >
            {busy === 'share' || !imageReady ? (
              <span>PREPARANDO...</span>
            ) : (
              <>
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  width={16}
                  height={16}
                >
                  <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
                  <polyline points="16 6 12 2 8 6" />
                  <line x1="12" y1="2" x2="12" y2="15" />
                </svg>{' '}
                COMPARTILHAR
              </>
            )}
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            id="btnDownloadImage"
            disabled={busy !== null}
            onClick={() => void handleDownload()}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
            }}
          >
            {busy === 'download' ? (
              <span>GERANDO...</span>
            ) : (
              <>
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  width={16}
                  height={16}
                >
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>{' '}
                BAIXAR IMAGEM
              </>
            )}
          </button>
            {!canNativeShare() && (
             <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 8, flexWrap: 'wrap' }}>
               <a href={`https://wa.me/?text=${encodeURIComponent(shareText)}`} target="_blank" rel="noopener noreferrer" className="btn btn-secondary">WhatsApp</a>
               <a href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(window.location.origin)}`} target="_blank" rel="noopener noreferrer" className="btn btn-secondary">X</a>
               <a href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.origin)}`} target="_blank" rel="noopener noreferrer" className="btn btn-secondary">Facebook</a>
             </div>
           )}

          <button
            type="button"
            className="btn btn-secondary"
            style={{ background: 'transparent', border: 'none', opacity: 0.6 }}
id="btnFecharShare"
            onClick={close}
          >
            FECHAR
          </button>
        </div>
      </div>
    </div>
  );
}
