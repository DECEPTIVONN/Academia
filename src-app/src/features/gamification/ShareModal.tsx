/**
 * ShareModal.tsx — Modal de compartilhamento `#modalShare` (Fase 3)
 * Port 1:1 do DOM (`componentes/secoes/modais.html` L465–576) e das funções
 * `openShareCard` (secao-perfil.js L702–762), `downloadShareImage` (L774–805),
 * `shareImageNow` (L807–886) e `shareRadar` (L888–911).
 *
 * html2canvas é importado dinamicamente (legado carrega via CDN); instalado
 * como dependência npm.
 */

import { useEffect, useMemo, useRef, useState } from 'react';
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
  const radarCloneRef = useRef<HTMLDivElement>(null);/* Canvas pronto sob demanda ao clicar — elimina race condition do setTimeout(60ms).     O card é renderizado no próprio gesto do usuário (share/download),     garantindo que a imagem esteja pronta quando a API for chamada.   */
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const canvasFileRef = useRef<File | null>(null);
  const cardId = (kind === 'conquista' ? 'shareCardBadge' : kind === 'radar' ? 'shareCardRadar' : 'shareCard');

  /* Renderiza o canvas sob demanda quando necessário.     Garante que a imagem exista antes de tentar share/download.   */
  const ensureCanvasReady = async (): Promise<HTMLCanvasElement | null> => {
    // Se já temos o canvas renderizado, retorna ele
    if (canvasRef.current) return canvasRef.current;
    // Tenta renderizar o card agora
    const card = document.getElementById(cardId);
    if (!card) return null;
    try {
      const canvas = await renderCanvas(card);
      canvasRef.current = canvas;
      return canvas;
    } catch {
      return null;
    }
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

  /* downloadShareImage L774–805 */
  const handleDownload = async () => {
    if (busy) return;
    setBusy('download');
    try {
      let file = canvasFileRef.current;
      if (!file) {
        // Garante que o canvas está pronto antes de baixar
        const canvas = await ensureCanvasReady();
        if (!canvas) return;
        canvasFileRef.current = canvasFileRef.current || null;
        const blob = await new Promise<Blob | null>((resolve) =>
          canvas.toBlob(resolve, 'image/png')
        );
        if (!blob) throw new Error('canvas sem blob');
        file = new File([blob], `meu-${activeCardName(kind)}-${today()}.jpg`, { type: 'image/png' });
        canvasFileRef.current = file;
      }
      const link = document.createElement('a');
      link.download = file.name;
      link.href = URL.createObjectURL(file);
      link.click();
      window.setTimeout(() => URL.revokeObjectURL(link.href), 30000);
      showToast('Imagem gerada com sucesso! Confira seus downloads.', 'success');
    } catch (err) {
      console.warn('[download]', err);
      showToast('Não foi possível gerar a imagem.', 'error');
    } finally {
      setBusy(null);
    }
  };

  /* shareImageNow L807–886 — Web Share API → clipboard → download */
  const handleShare = async () => {
    if (busy) return;
    // Garante que o canvas está pronto antes de tentar compartilhar
    let file = canvasFileRef.current;
    if (!file) {
      const canvas = await ensureCanvasReady();
      if (!canvas) {
        showToast('Não foi possível gerar a imagem para compartilhamento.', 'error');
        return;
      }
      // Atualiza o ref após renderização
      canvasFileRef.current = canvasFileRef.current || null;
    }

    setBusy('share');
    try {
      const text = `Confira meu progresso na Evo Fit! ${window.location.origin}`;
      const nav = navigator as Navigator & { canShare?: (d?: ShareData) => boolean };
      const canFiles = !nav.canShare || nav.canShare({ files: [file] });

      let r: NativeShareResult;
      if (canFiles) {
        r = await shareNative({ title: 'Evo Fit', text, files: [file] }); // sem url (evita duplicado)
      } else {
        r = 'unsupported';
      }

      if (r === 'unsupported') {
        // nenhum share com arquivo foi tentado
        r = await shareNative({ title: 'Evo Fit', text });
        if (r === 'unsupported') r = 'error';
      }

      if (r === 'shared') {
        showToast('Compartilhado!', 'success');
        return;
      }
      if (r === 'cancelled') return; // silêncio total

      // erro real: vai direto para download + clipboard, sem segundo share
      const link = document.createElement('a');
      link.download = file.name;
      link.href = URL.createObjectURL(file);
      link.click();
      window.setTimeout(() => URL.revokeObjectURL(link.href), 30000);
      try {
        const canvas = canvasRef.current;
        if (canvas) {
          const pngBlob = await new Promise<Blob | null>((resolve) =>
            canvas.toBlob(resolve, 'image/png')
          );
          if (pngBlob) {
            await navigator.clipboard.write([new ClipboardItem({ 'image/png': pngBlob })]);
            showToast('Imagem copiada para a área de transferência. Compartilhe com seus amigos!', 'success');
            return;
          }
        }
      } catch {
        /* ignora */
      }
      showToast('Compartilhamento não suportado. Imagem baixada!', 'info');
    } catch (err) {
      console.error(err);
      showToast('Erro ao preparar compartilhamento.', 'error');
    } finally {
      setBusy(null);
    }
  };
;

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
            disabled={busy !== null || !imageReady}
            onClick={() => void handleShare()}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
            }}
          >
            {busy === 'share' ? (
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
               <a href={`https://wa.me/?text=${encodeURIComponent('Confira meu progresso na Evo Fit! ' + window.location.origin)}`} target="_blank" rel="noopener noreferrer" className="btn btn-secondary">WhatsApp</a>
               <a href={`https://twitter.com/intent/tweet?text=${encodeURIComponent('Confira meu progresso na Evo Fit!')}&url=${encodeURIComponent(window.location.origin)}`} target="_blank" rel="noopener noreferrer" className="btn btn-secondary">X</a>
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
