/**
 * AppLoadingScreen.tsx — Tela de carregamento com imagem personalizada (v4.9.0-sync)
 *
 * Port da Section 9 do SupabaseSyncSecurityStandalone.tsx: preview da splash
 * com barra de progresso simulada (0→100, +5 a cada 40 ms) e imagem conforme
 * a orientação. Usado pelo botão "Testar Splash" em Telas Personalizadas —
 * a splash real do app vive no index.html e lê as mesmas chaves.
 */

import { useEffect, useState } from 'react';
import './sync.css';

const SvgCloud = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
    <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z" />
  </svg>
);

interface Props {
  verticalImage?: string;
  horizontalImage?: string;
  onComplete: () => void;
}

export function AppLoadingScreen({ verticalImage, horizontalImage, onComplete }: Props) {
  const [progress, setProgress] = useState(0);
  const [portrait, setPortrait] = useState(
    () => typeof window !== 'undefined' && window.innerHeight > window.innerWidth
  );

  useEffect(() => {
    const onResize = () => setPortrait(window.innerHeight > window.innerWidth);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    const t = window.setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          window.clearInterval(t);
          window.setTimeout(onComplete, 150);
          return 100;
        }
        return prev + 10;
      });
    }, 20);
    return () => window.clearInterval(t);
  }, [onComplete]);

  const activeBg = portrait
    ? verticalImage || horizontalImage || ''
    : horizontalImage || verticalImage || '';

  return (
    <div className="sy-loading">
      <div
        className="sy-loading__bg"
        style={activeBg ? { backgroundImage: `url("${activeBg}")` } : { background: 'radial-gradient(circle at 30% 20%, #1c1917, #000 70%)' }}
      />
      <div className="sy-loading__shade" />
      <div className="sy-loading__panel">
        <div className="sy-loading__status">
          <div className="sy-loading__status-left">
            {SvgCloud}
            <span>Sincronizando dados com o banco de dados...</span>
          </div>
          <span className="sy-loading__pct">{progress}%</span>
        </div>
        <div className="sy-loading__bar">
          <div className="sy-loading__fill" style={{ width: `${progress}%` }} />
        </div>
      </div>
    </div>
  );
}

export default AppLoadingScreen;
