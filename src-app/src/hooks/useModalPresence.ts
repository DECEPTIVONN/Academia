/**
 * useModalPresence.ts — pequenas máquinas de estado para animar a SAÍDA dos
 * modais (o CSS legado já anima a entrada: fadeIn do overlay + slideUp do
 * painel).
 *
 * Duas estratégias:
 *   • `useModalPresence` — o modal continua no DOM durante o fechamento e só
 *     desmonta/oculta quando a animação termina. Para componentes que seguem
 *     montados (SheetSelectorModal, CycleModal) ou cujo `key` é estável
 *     (AerobicoModal/ExercicioFormModal com sessão).
 *   • `useModalExit` — para modais renderizados condicionalmente pelo pai
 *     (FriendQrModal/QrScannerModal): a animação roda primeiro e só depois o
 *     `onClose` do pai desmonta o componente.
 */

import { useCallback, useEffect, useRef, useState } from 'react';

/** Duração padrão da animação de saída (deve casar com modal-motion.css). */
export const MODAL_EXIT_MS = 220;

export function useModalPresence(open: boolean, duration = MODAL_EXIT_MS) {
  const [mounted, setMounted] = useState(open);
  const [closing, setClosing] = useState(false);
  const [prevOpen, setPrevOpen] = useState(open);

  /* Ajuste de estado durante o render (padrão do React para prop que mudou):
     abrir monta na hora; fechar liga `closing` e o efeito abaixo agenda a
     desmontagem — nenhum setState síncrono dentro de efeito. */
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) {
      setMounted(true);
      setClosing(false);
    } else if (mounted) {
      setClosing(true);
    }
  }

  useEffect(() => {
    if (open || !closing) return undefined;
    const timer = window.setTimeout(() => {
      setMounted(false);
      setClosing(false);
    }, duration);
    return () => window.clearTimeout(timer);
  }, [open, closing, duration]);

  return { mounted, closing };
}

/**
 * Presença orientada por VALOR (v4.57.0): para modais cuja abertura é um dado
 * (`renaming && <RenameModal playlist={renaming}/>`, `{menuPlaylist && ...}`).
 * Quando o valor vira nulo, guarda o último valor por `duration` e sinaliza
 * `closing`, para o componente continuar montado (e com os dados!) enquanto a
 * animação de saída roda.
 */
export function usePresenceValue<T>(value: T | null | undefined, duration = MODAL_EXIT_MS) {
  const current = value ?? null;
  const [held, setHeld] = useState<T | null>(current);
  const [closing, setClosing] = useState(false);
  const [prev, setPrev] = useState<T | null>(current);

  /* Ajuste durante o render (mesmo padrão de `useModalPresence` — evita
     setState síncrono em efeito): valor novo entra na hora; valor nulo liga
     `closing` e o efeito abaixo agenda a limpeza. */
  if (current !== prev) {
    setPrev(current);
    if (current) {
      setHeld(current);
      setClosing(false);
    } else if (held !== null) {
      setClosing(true);
    }
  }

  useEffect(() => {
    if (current || !closing) return undefined;
    const timer = window.setTimeout(() => {
      setHeld(null);
      setClosing(false);
    }, duration);
    return () => window.clearTimeout(timer);
  }, [current, closing, duration]);

  return { value: held, closing };
}

export function useModalExit(onClose: () => void, duration = MODAL_EXIT_MS) {
  const [closing, setClosing] = useState(false);
  const timerRef = useRef<number | null>(null);
  const closingRef = useRef(false);
  const onCloseRef = useRef(onClose);
  const afterRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  /**
   * Dispara a animação de saída. `after` permite encadear uma ação (ex.: abrir
   * o leitor de QR depois que o modal de amigos terminar de sair); sem ele,
   * chama o `onClose` padrão.
   */
  const requestClose = useCallback(
    (after?: () => void) => {
      if (closingRef.current) return;
      closingRef.current = true;
      afterRef.current = after ?? null;
      setClosing(true);
      timerRef.current = window.setTimeout(() => {
        timerRef.current = null;
        const next = afterRef.current;
        afterRef.current = null;
        if (next) next();
        else onCloseRef.current();
      }, duration);
    },
    [duration]
  );

  useEffect(
    () => () => {
      if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    },
    []
  );

  return { closing, requestClose };
}
