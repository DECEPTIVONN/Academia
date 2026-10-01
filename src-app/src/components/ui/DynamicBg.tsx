/**
 * DynamicBg.tsx — Fundo dinâmico Ken Burns + partículas de elixir
 * Migração direta de bg-dinamico.css + estrutura HTML do treino.html
 * Usa Motion para as animações das partículas (substitui CSS @keyframes).
 */

import { motion } from 'motion/react';
import { useAppStore, selectTheme } from '@/store/workout.store';
import '@/styles/dynamic-bg.css';

interface DynamicBgProps {
  blurred?: boolean;
}

export function DynamicBg({ blurred = false }: DynamicBgProps) {
  const theme = useAppStore(selectTheme);

  // Mapeia os temas para os valores de hue-rotate (do DESIGN.md seção 3.2)
  const themeDataAttr = theme === 'roxo' ? undefined : theme;

  return (
    <div
      id="cr-dynamic-bg"
      className={`cr-bg-container${blurred ? ' bg-blurred' : ''}`}
      aria-hidden="true"
    >
      {/* Camada da imagem com Ken Burns */}
      <div
        className="cr-bg-layer"
        data-theme={themeDataAttr}
      />

      {/* Partículas de elixir — Motion substitui CSS animation para controle dinâmico */}
      <div className="cr-bg-particles" aria-hidden="true">
        {PARTICLES.map((p) => (
          <motion.div
            key={p.className}
            className={`cr-particle ${p.className}`}
            animate={{ y: [0, -window.innerHeight * 1.2] }}
            transition={{
              duration: p.duration,
              delay: p.delay,
              repeat: Infinity,
              ease: 'linear',
            }}
          />
        ))}
      </div>

      {/* Overlay glassmorphic */}
      <div className="cr-bg-overlay" />
    </div>
  );
}

const PARTICLES = [
  { className: 'cr-p1', duration: 9,  delay: 0 },
  { className: 'cr-p2', duration: 13, delay: 2 },
  { className: 'cr-p3', duration: 11, delay: 4 },
  { className: 'cr-p4', duration: 16, delay: 1 },
  { className: 'cr-p5', duration: 7,  delay: 3 },
];
