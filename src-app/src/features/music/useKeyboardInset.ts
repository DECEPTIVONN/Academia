/**
 * useKeyboardInset.ts — altura real do teclado Android (v4.21.0-music)
 *
 * O `interactive-widget=resizes-content` do viewport resolve o caso "normal",
 * mas em PWA fullscreen/standalone (e em navegadores que ignoram a diretriz)
 * o teclado COBRE a viewport de layout e os bottom-sheets ficam atrás dele.
 *
 * Este hook mede o buraco real entre a viewport de LAYOUT e a VISUAL
 * (window.visualViewport) e devolve quantos px o teclado está ocupando.
 * Os modais aplicam esse valor como `padding-bottom` do flex-container
 * (.mu-modal, align-items:flex-end) → o painel sobe acima do teclado.
 *
 * Quando o navegador já redimensiona o layout (resizes-content ativo), a
 * diferença é ~0 e nada muda (sem "empurrão" duplo).
 */

import { useEffect, useState } from 'react';

export function useKeyboardInset(): number {
  const [inset, setInset] = useState(0);

  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;

    const update = () => {
      const kb = Math.max(0, Math.round(window.innerHeight - vv.height - vv.offsetTop));
      setInset(kb);
    };

    update();
    vv.addEventListener('resize', update);
    vv.addEventListener('scroll', update);
    window.addEventListener('resize', update);
    return () => {
      vv.removeEventListener('resize', update);
      vv.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
    };
  }, []);

  return inset;
}

export default useKeyboardInset;
