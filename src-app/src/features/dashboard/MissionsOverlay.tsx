/**
 * MissionsOverlay.tsx — Overlay de Missões (Fase 3)
 *
 * Port 1:1 de `treino.html` L903-1254 (DOM + <style> inline → missions-overlay.css)
 * e das funções L1256-1314 (`openMissionsOverlay` / `closeMissionsOverlay` /
 * `msSwitchTab`).
 *
 * Mockup estático fiel ao legado: contadores/progresso são fixos — o Vanilla
 * v3.5.7 NÃO tem lógica de conclusão, reset diário, XP ou persistência de
 * missões (todos os `0 / N` e `width:0%` são hardcoded). A pílula do widget
 * no Dashboard continua exibindo o progresso real do ciclo (30 treinos).
 *
 * `closeMissionsOverlay` chama `window._transitionTo('dashboard')` no legado;
 * aqui o overlay só é aberto a partir do Dashboard, então fechar = apenas
 * fechar (navegação para o dashboard já é o estado atual).
 */

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import './missions-overlay.css';

type MsTab = 'daily' | 'weekly' | 'guides';

/* Portal para document.body: o .section-strip tem `will-change: transform` e
   passa a ser o containing block de `position: fixed` (mesma causa-raiz dos
   modais da Progresso, v4.7.3) — sem o portal o overlay inteiro (inset:0 +
   max-width 420 centralizado) saía da viewport. */
const toBody = (node: React.ReactNode) => createPortal(node, document.body);

interface MissionsOverlayProps {
  open: boolean;
  /** closeMissionsOverlay (treino.html L1265-1272). */
  onClose: () => void;
}

/* Imagens de baú (treino.html L1131/L1150/L1169 — repetidas no semanal) */
const IMG_WOODEN =
  'https://lh3.googleusercontent.com/aida/ADBb0uiupILeCoAq9yrWKx6sVhOsj-f5vrFle_xSuBDM_EX5I3HD2AT2erF5OhS-MNhwfbo8FZ9qY2jH96_BJYlqdralRquP0RbBeXMwynfxskv9i17dIH1dGizu4LiCkueO-_yOysWkxF4zBdI8k8wx6KMp1qU7kR6tqHye-S-rjwdZGulk_2dzLdTNGcpAUMDHeejf-OezDOmrmMU6dZKdJV18GQG-9wGbeWEbltxzjvra8HC5Pl-7Oo3GfFE';
const IMG_SILVER =
  'https://lh3.googleusercontent.com/aida/ADBb0uggKdm2zATVGAhsTnRGZOZRwhr1J46mIlb6gUliOn2nmRDkzia1p_NHA-kkRJhJmNHC2sNNUESiTqVO9nuc_189iPzSC3JDvm2PSo2LE1dD0NgFXEbDCTAMRllx0Kr4DEFq8Z1UK8DzdorHHpu-6kw6fjqnVEOQi8FKbyRC3lBLRYnqE5CXzbSOaQItJK8gq-xGaigCkRK-xGUTsCiH0dT_MADovJxvij3nIe0LgFG7Ey5hyAbzczOwXTw';
const IMG_GOLD =
  'https://lh3.googleusercontent.com/aida/ADBb0uiXLnHc-8e6E4-2Mf5zstmSfnMGbOE248AroAlmh8ifaWceJ7fF80I2d8V4VacgF_uix_-zVn8qmskJdcVp39yh-i3cO1bBvqhyPEy9krEVfhvav0K98y64k7g_CXAoKD1GwXkt8Np8l-meMoBsfjKnGxRl5hovXAWIksYZ7YoP7IBotu1EUgXUqwKiQebz_DnXVNK0b2HY5ooOeO4NiUaMRjJzKG8OFHqHr_-K7Bfb82tJh7pkVy-DkLw';

/* v4.8.4-color-standard: cores inline na paleta das Configurações
   (painéis #0b0b10, hairlines rgba(255,255,255,0.08), acentos --primary). */
const CARD_STYLE: React.CSSProperties = {
  background: '#0b0b10',
  backdropFilter: 'blur(8px)',
  border: '1px solid rgba(255, 255, 255, 0.08)',
  borderRadius: 12,
  padding: 16,
  display: 'flex',
  alignItems: 'center',
  gap: 16,
  position: 'relative',
  overflow: 'hidden',
  cursor: 'pointer',
};

const COUNTER_STYLE: React.CSSProperties = {
  fontFamily: "'Rajdhani', sans-serif",
  fontWeight: 700,
  fontSize: 14,
  letterSpacing: '0.1em',
  color: '#8a8a9c',
  whiteSpace: 'nowrap',
  fontVariantNumeric: 'tabular-nums',
};

const BAR_TRACK_STYLE: React.CSSProperties = {
  position: 'relative',
  width: '100%',
  background: '#14141b',
  height: 6,
  overflow: 'hidden',
  border: '1px solid rgba(255, 255, 255, 0.08)',
  borderRadius: 9999,
};

const IMG_STYLE: React.CSSProperties = {
  width: '100%',
  height: '100%',
  objectFit: 'contain',
  border: '2px solid var(--primary)',
  borderRadius: 8,
  filter: 'drop-shadow(0 0 8px rgba(var(--primary-rgb, 139, 92, 246), 0.6))',
};

/* Fill das barras de progresso: acento do tema (era rosa/verde/âmbar fixos) */
const FILL_STYLE: React.CSSProperties = {
  background: 'var(--primary)',
  boxShadow: '0 0 8px rgba(var(--primary-rgb, 139, 92, 246), 0.5)',
};

/* Card de missão (article.ms-hover-lift + barra + contador + baú) */
function MissionCard({
  title,
  counter,
  barClass,
  barStyle,
  image,
}: {
  title: string;
  counter: string;
  barClass?: string;
  barStyle: React.CSSProperties;
  image: string;
}) {
  return (
    <article className="ms-hover-lift" style={CARD_STYLE}>
      <div style={{ flex: 1, position: 'relative', zIndex: 10 }}>
        <h4 className="ms-mission-title">{title}</h4>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={BAR_TRACK_STYLE}>
            <div
              className={barClass}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                height: '100%',
                width: '0%',
                borderRadius: 9999,
                ...barStyle,
              }}
            />
          </div>
          <span style={COUNTER_STYLE}>{counter}</span>
        </div>
      </div>
      <div style={{ width: 64, height: 64, position: 'relative', flexShrink: 0, zIndex: 10 }}>
        <img alt="Chest" style={IMG_STYLE} src={image} />
      </div>
    </article>
  );
}

/* Cabeçalho de relógio (monthly "3 DIAS" e diário "9H 15M") */
function ClockChip({ label, dim }: { label: string; dim?: boolean }) {
  return (
    <div
      style={
        dim
          ? { display: 'flex', alignItems: 'center', gap: 4, color: '#8a8a9c' }
          : {
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              color: 'white',
              background: '#14141b',
              padding: '4px 8px',
              borderRadius: 6,
              border: '1px solid rgba(255, 255, 255, 0.08)',
            }
      }
    >
      <svg style={{ width: 16, height: 16 }} fill="none" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
        <circle cx="12" cy="12" fill="currentColor" r="1" />
        <g className={dim ? 'ms-animate-clock' : undefined} style={{ transformOrigin: '12px 12px' }}>
          <line stroke="currentColor" strokeLinecap="round" strokeWidth="2" x1="12" x2="12" y1="12" y2="7" />
        </g>
      </svg>
      <span
        style={{
          fontFamily: "'Rajdhani', sans-serif",
          fontWeight: 700,
          fontSize: 14,
          letterSpacing: '0.1em',
        }}
      >
        {label}
      </span>
    </div>
  );
}

export function MissionsOverlay({ open, onClose }: MissionsOverlayProps) {
  const [tab, setTab] = useState<MsTab>('daily');

  /* Reset p/ aba daily ao abrir (msSwitchTab('daily') em openMissionsOverlay):
     padrão "adjusting state when props change" do React (setState em render) */
  const [prevOpen, setPrevOpen] = useState(open);
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) setTab('daily');
  }

  /* openMissionsOverlay (L1257-1263): display block + lock de body */
  useEffect(() => {
    if (!open) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  return toBody(
    <div
      id="missions-overlay"
      className="missions-overlay"
      style={{ display: open ? 'block' : 'none' }}
    >
      {/* Dynamic Background */}
      <div className="arena-bg">
        <div className="ms-bg-overlay" />
      </div>

      {/* Full-screen Container */}
      <div
        style={{
          width: '100%',
          maxWidth: 420,
          margin: '0 auto',
          minHeight: '100vh',
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          background: 'transparent',
        }}
      >
        {/* Custom Top Bar (Modal Style) */}
        <header
          style={{
            position: 'relative',
            zIndex: 20,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            padding: '32px 16px 0 16px',
            background: 'rgba(11, 11, 16, 0.85)',
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
          }}
        >
          {/* Tabs Area */}
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              className={`ms-tab-btn${tab === 'daily' ? ' active' : ''}`}
              id="ms-tab-daily"
              onClick={() => setTab('daily')}
            >
              <svg style={{ width: 20, height: 20 }} fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
                <rect height="4" rx="1" ry="1" width="8" x="8" y="2" />
              </svg>
              DIÁRIAS
              <div className="ms-tab-indicator" />
            </button>
            <button
              className={`ms-tab-btn${tab === 'weekly' ? ' active' : ''}`}
              id="ms-tab-weekly"
              onClick={() => setTab('weekly')}
            >
              <svg style={{ width: 20, height: 20 }} fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24">
                <rect height="18" rx="2" ry="2" width="18" x="3" y="4" />
                <line x1="16" x2="16" y1="2" y2="6" />
                <line x1="8" x2="8" y1="2" y2="6" />
                <line x1="3" x2="21" y1="10" y2="10" />
              </svg>
              SEMANAIS
            </button>
            <button
              className={`ms-tab-btn${tab === 'guides' ? ' active' : ''}`}
              id="ms-tab-guides"
              onClick={() => setTab('guides')}
            >
              <span
                className="material-symbols-outlined"
                style={{
                  fontSize: 20,
                  fontVariationSettings: "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24",
                }}
              >
                list
              </span>
              GUIAS
            </button>
          </div>
          {/* Close Action */}
          <button onClick={onClose} className="ms-close-btn">
            <span className="material-symbols-outlined">close</span>
          </button>
        </header>

        {/* Main Scrollable Content */}
        <main
          style={{
            position: 'relative',
            zIndex: 10,
            flex: 1,
            overflowY: 'auto',
            padding: '16px 20px 48px 20px',
            display: 'flex',
            flexDirection: 'column',
            gap: 24,
          }}
        >
          {/* Persistent Monthly Mission (estático: L1076-1103) */}
          <section
            style={{
              background: '#0b0b10',
              backdropFilter: 'blur(24px)',
              WebkitBackdropFilter: 'blur(24px)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: 12,
              padding: 20,
              boxShadow: '0 8px 30px rgba(0,0,0,0.6)',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            {/* Decorative Glow */}
            <div
              style={{
                position: 'absolute',
                top: '-50%',
                right: '-20%',
                width: 256,
                height: 256,
                background: 'rgba(var(--primary-rgb, 139, 92, 246), 0.35)',
                filter: 'blur(48px)',
                borderRadius: '50%',
                pointerEvents: 'none',
              }}
            />
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 16,
                position: 'relative',
                zIndex: 10,
              }}
            >
              <h2
                style={{
                  fontFamily: "'Rajdhani', sans-serif",
                  fontWeight: 900,
                  letterSpacing: '1.5px',
                  fontSize: 28,
                  lineHeight: 1.2,
                  color: 'white',
                  textTransform: 'uppercase',
                }}
              >
                MISSÃO DE MAIO
              </h2>
              <ClockChip label="3 DIAS" />
            </div>
            {/* Progress Bar */}
            <div
              style={{
                position: 'relative',
                width: '100%',
                background: '#14141b',
                height: 16,
                marginBottom: 12,
                overflow: 'hidden',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.3)',
                borderRadius: 9999,
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  height: '100%',
                  background: 'var(--primary)',
                  boxShadow: '0 0 12px rgba(var(--primary-rgb, 139, 92, 246), 0.5)',
                  width: '65%',
                  borderRadius: 9999,
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    background:
                      'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)',
                    transform: 'translateX(-100%)',
                    animation: 'msShimmer 2s infinite',
                  }}
                />
              </div>
            </div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                position: 'relative',
                zIndex: 10,
              }}
            >
              <p
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: 16,
                  lineHeight: 1.6,
                  color: '#8a8a9c',
                }}
              >
                Ganhe 40 pontos de missão
              </p>
              <span
                style={{
                  fontFamily: "'Rajdhani', sans-serif",
                  fontWeight: 700,
                  fontSize: 14,
                  letterSpacing: '0.1em',
                  color: 'white',
                  background: '#14141b',
                  padding: '2px 8px',
                  borderRadius: 4,
                }}
              >
                26 / 40
              </span>
            </div>
          </section>

          {/* Tab Contents Container (msSwitchTab L1274-1312) */}
          <div className="ms-content-area">
            {/* DAILY (ativo por padrão) */}
            <div
              className={tab === 'daily' ? 'ms-active' : undefined}
              id="ms-content-daily"
              style={{ gap: 12 }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 4,
                  paddingLeft: 4,
                }}
              >
                <h3
                  style={{
                    fontFamily: "'Rajdhani', sans-serif",
                    fontWeight: 900,
                    letterSpacing: '1.5px',
                    fontSize: 24,
                    lineHeight: 1.3,
                    color: 'white',
                    textTransform: 'uppercase',
                    opacity: 0.9,
                  }}
                >
                  MISSÕES DO DIA
                </h3>
                <ClockChip label="9H 15M" dim />
              </div>

              <MissionCard
                title="Ganhe 10 XP"
                counter="0 / 10"
                barStyle={FILL_STYLE}
                image={IMG_WOODEN}
              />
              <MissionCard
                title="Faça 2 lições"
                counter="0 / 2"
                barStyle={FILL_STYLE}
                image={IMG_SILVER}
              />
              <MissionCard
                title="Vença uma partida de xadrez"
                counter="0 / 1"
                barStyle={FILL_STYLE}
                image={IMG_GOLD}
              />

              <div
                style={{
                  marginTop: 16,
                  paddingTop: 8,
                  borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                  textAlign: 'center',
                }}
              >
                <p
                  style={{
                    fontFamily: "'Rajdhani', sans-serif",
                    fontWeight: 700,
                    fontSize: 14,
                    letterSpacing: '0.2em',
                    color: '#5d5d70',
                    textTransform: 'uppercase',
                  }}
                >
                  Volte todos os dias para mais missões
                </p>
              </div>
            </div>

            {/* WEEKLY (oculto por padrão) */}
            <div
              id="ms-content-weekly"
              className={tab === 'weekly' ? 'ms-active' : undefined}
              style={{ gap: 12 }}
            >
              <h3
                style={{
                  fontFamily: "'Rajdhani', sans-serif",
                  fontWeight: 900,
                  letterSpacing: '1.5px',
                  fontSize: 24,
                  lineHeight: 1.3,
                  color: 'white',
                  textTransform: 'uppercase',
                  opacity: 0.9,
                  paddingLeft: 4,
                }}
              >
                MISSÕES DA SEMANA
              </h3>

              <MissionCard
                title="Complete 5 treinos"
                counter="0 / 5"
                barStyle={FILL_STYLE}
                image={IMG_WOODEN}
              />
              <MissionCard
                title="Ganhe 50 pontos de maestria"
                counter="0 / 50"
                barStyle={FILL_STYLE}
                image={IMG_SILVER}
              />
              <MissionCard
                title="Participe de 1 torneio"
                counter="0 / 1"
                barStyle={FILL_STYLE}
                image={IMG_GOLD}
              />

              <div
                style={{
                  marginTop: 24,
                  paddingTop: 16,
                  borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 12,
                }}
              >
                <p
                  style={{
                    fontFamily: "'Rajdhani', sans-serif",
                    fontWeight: 700,
                    fontSize: 14,
                    letterSpacing: '0.1em',
                    color: '#8a8a9c',
                    textAlign: 'center',
                    textTransform: 'uppercase',
                  }}
                >
                  Conclua todas as missões semanais para ganhar um bônus
                </p>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    width: '100%',
                    maxWidth: 200,
                  }}
                >
                  <div style={BAR_TRACK_STYLE}>
                    <div
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        height: '100%',
                        ...FILL_STYLE,
                        width: '0%',
                        borderRadius: 9999,
                      }}
                    />
                  </div>
                  <span
                    style={{
                      fontFamily: "'Rajdhani', sans-serif",
                      fontWeight: 700,
                      fontSize: 10,
                      color: '#8a8a9c',
                      letterSpacing: '-0.05em',
                    }}
                  >
                    0/5
                  </span>
                </div>
              </div>
            </div>

            {/* GUIDES (oculto por padrão) */}
            <div
              id="ms-content-guides"
              className={tab === 'guides' ? 'ms-active' : undefined}
              style={{
                alignItems: 'center',
                justifyContent: 'center',
                paddingTop: 32,
                paddingBottom: 16,
              }}
            >
              <article
                style={{
                  background: '#0b0b10',
                  backdropFilter: 'blur(24px)',
                  WebkitBackdropFilter: 'blur(24px)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: 12,
                  padding: 32,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 24,
                  boxShadow: '0 8px 30px rgba(0,0,0,0.6)',
                  animation: 'msFloat 4s ease-in-out infinite',
                  width: '100%',
                  textAlign: 'center',
                }}
              >
                <div style={{ position: 'relative' }}>
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      background: 'rgba(var(--primary-rgb, 139, 92, 246), 0.35)',
                      filter: 'blur(32px)',
                      borderRadius: '50%',
                    }}
                  />
                  <span
                    className="material-symbols-outlined"
                    style={{
                      fontSize: 60,
                      color: 'var(--primary-light)',
                      filter: 'drop-shadow(0 0 15px rgba(var(--primary-rgb, 139, 92, 246), 0.6))',
                      position: 'relative',
                      zIndex: 10,
                      fontVariationSettings: "'FILL' 1",
                    }}
                  >
                    menu_book
                  </span>
                </div>
                <h3
                  style={{
                    fontFamily: "'Rajdhani', sans-serif",
                    fontWeight: 900,
                    letterSpacing: '1.5px',
                    fontSize: 24,
                    lineHeight: 1.3,
                    color: 'white',
                    textTransform: 'uppercase',
                  }}
                >
                  GUIAS CHEGANDO EM BREVE
                </h3>
              </article>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
