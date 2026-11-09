/**
 * HelpOverlay.tsx — Central de Ajuda standalone (v4.74.0)
 *
 * Saía de Configurações (tile "Ajuda e Tutoriais"). Agora é uma interface
 * própria, aberta pelo menu do Início, pelo card de Ajuda do Perfil, pela
 * busca geral e pelo evento `academia:open-help`.
 */

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ArrowUpRight, BookOpen, LifeBuoy, Sparkles, X } from 'lucide-react';
import HelpCenter from './HelpCenter';
import './help.css';

interface HelpOverlayProps {
  open: boolean;
  onClose: () => void;
}

const QUICK_LINKS = [
  { id: 'comecando', label: 'Primeiros passos', icon: <Sparkles size={14} /> },
  { id: 'ficha', label: 'Ficha e treino', icon: <BookOpen size={14} /> },
  { id: 'social', label: 'Social e ranking', icon: <LifeBuoy size={14} /> },
];

export function HelpOverlay({ open, onClose }: HelpOverlayProps) {
  const [closing, setClosing] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  /* Fecha com animação curta, igual aos demais overlays do app. */
  const requestClose = () => {
    if (closing) return;
    setClosing(true);
    window.setTimeout(() => {
      setClosing(false);
      onClose();
    }, 220);
  };

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') requestClose();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = previous;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  if (!open) return null;

  const jumpTo = (id: string) => {
    const target = document.getElementById(`help-group-${id}`);
    target?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return createPortal(
    <div
      className={`help-ov${closing ? ' is-closing' : ''}`}
      role="dialog"
      aria-modal="true"
      aria-label="Ajuda e Tutoriais"
    >
      <div className="help-ov__backdrop" onClick={requestClose} aria-hidden="true" />

      <div className="help-ov__shell">
        <header className="help-ov__head">
          <div className="help-ov__head-id">
            <span className="help-ov__head-icon" aria-hidden="true">
              <LifeBuoy size={18} />
            </span>
            <div>
              <span className="help-ov__eyebrow">Suporte EVO FIT</span>
              <h2 className="help-ov__title">Ajuda e Tutoriais</h2>
            </div>
          </div>
          <button
            type="button"
            className="help-ov__close"
            onClick={requestClose}
            aria-label="Fechar ajuda"
          >
            <X size={18} />
          </button>
        </header>

        <div className="help-ov__scroll" ref={scrollRef}>
          <section className="help-ov__hero">
            <span className="help-ov__hero-badge">
              <Sparkles size={12} /> Central de conhecimento
            </span>
            <h1 className="help-ov__hero-title">Como podemos ajudar?</h1>
            <p className="help-ov__hero-desc">
              Respostas diretas sobre ficha, modo foco, progresso, ranking, conta e uso
              offline. Busque por uma palavra ou navegue pelas categorias.
            </p>

            <div className="help-ov__quick">
              {QUICK_LINKS.map((link) => (
                <button
                  type="button"
                  key={link.id}
                  className="help-ov__quick-chip"
                  onClick={() => jumpTo(link.id)}
                >
                  {link.icon}
                  {link.label}
                  <ArrowUpRight size={12} />
                </button>
              ))}
            </div>
          </section>

          <HelpCenter />

          <section className="help-ov__contact">
            <div>
              <span className="help-ov__contact-eyebrow">Não encontrou?</span>
              <p>
                Abra o menu do Início → Ajuda ou fale com o suporte pelo canal oficial do
                app. Seu progresso continua salvo no aparelho enquanto isso.
              </p>
            </div>
            <span className="help-ov__contact-mark" aria-hidden="true">
              <LifeBuoy size={26} />
            </span>
          </section>
        </div>
      </div>
    </div>,
    document.body,
  );
}

export default HelpOverlay;
