/**
 * QrScannerModal.tsx — leitor de QR Code da aba Social.
 *
 * Abre a câmera traseira (quando disponível), lê os frames com jsQR e aceita
 * tanto o QR padrão (escuro sobre claro) quanto o QR branco do modal de
 * convite (invertido, sobre o cartão verde). O componente só entrega o
 * convite já validado; a persistência fica em friend-invites.ts.
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import jsQR, { type QRCode as ScannedQrCode } from 'jsqr';
import { parseFriendInvite, type FriendInvite } from './friend-invites';
import { standaloneSound } from './ligas-data';
import { useModalExit } from '@/hooks/useModalPresence';

interface QrScannerModalProps {
  onClose: () => void;
  onInvite: (invite: FriendInvite) => void;
}

function cameraErrorMessage(error: unknown): string {
  const name = (error as { name?: string } | null)?.name;
  if (name === 'NotAllowedError' || name === 'SecurityError') {
    return 'Permissão da câmera negada. Libere o acesso nas configurações do navegador.';
  }
  if (name === 'NotFoundError' || name === 'OverconstrainedError') {
    return 'Nenhuma câmera encontrada neste dispositivo.';
  }
  if (name === 'NotReadableError' || name === 'TrackStartError') {
    return 'A câmera está em uso por outro aplicativo.';
  }
  return 'Não foi possível abrir a câmera.';
}

export function QrScannerModal({ onClose, onInvite }: QrScannerModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  const activeRef = useRef(false);
  const handledRef = useRef(false);
  const lastScanRef = useRef(0);
  const lastInvalidRef = useRef(0);
  const onInviteRef = useRef(onInvite);

  const [status, setStatus] = useState<'loading' | 'scanning' | 'error'>('loading');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  /* v4.53.0 — anima a saída antes de o pai desmontar o modal/câmera. */
  const { closing, requestClose } = useModalExit(onClose);

  useEffect(() => {
    onInviteRef.current = onInvite;
  }, [onInvite]);

  const stopCamera = useCallback(() => {
    activeRef.current = false;
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    const stream = streamRef.current;
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    const video = videoRef.current;
    if (video) video.srcObject = null;
  }, []);

  /* Câmera + loop de leitura */
  useEffect(() => {
    let cancelled = false;
    activeRef.current = true;
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d', { willReadFrequently: true });
    let contrastBuffer: Uint8ClampedArray | null = null;

    const scan = () => {
      if (!activeRef.current) return;
      rafRef.current = requestAnimationFrame(scan);

      const now = performance.now();
      if (now - lastScanRef.current < 110) return;
      lastScanRef.current = now;

      const video = videoRef.current;
      if (!video || video.readyState < 2 || !context) return;

      const videoWidth = video.videoWidth;
      const videoHeight = video.videoHeight;
      if (!videoWidth || !videoHeight) return;

      const scale = Math.min(1, 720 / Math.max(videoWidth, videoHeight));
      const width = Math.max(1, Math.round(videoWidth * scale));
      const height = Math.max(1, Math.round(videoHeight * scale));
      if (canvas.width !== width) canvas.width = width;
      if (canvas.height !== height) canvas.height = height;

      try {
        context.drawImage(video, 0, 0, width, height);
        const image = context.getImageData(0, 0, width, height);

        let result: ScannedQrCode | null = null;
        try {
          result = jsQR(image.data, width, height, { inversionAttempts: 'attemptBoth' });
        } catch {
          /* algumas versões do jsQR lançam em imagens sem QR */
        }

        /* 2ª tentativa: binariza o frame. O QR do convite é branco sobre o
           cartão verde (baixo contraste) e às vezes escapa do limiar do jsQR. */
        if (!result?.data) {
          if (!contrastBuffer || contrastBuffer.length !== image.data.length) {
            contrastBuffer = new Uint8ClampedArray(image.data.length);
          }
          const pixels = image.data;
          for (let i = 0; i < pixels.length; i += 4) {
            const luminance = 0.299 * pixels[i] + 0.587 * pixels[i + 1] + 0.114 * pixels[i + 2];
            const value = luminance >= 180 ? 255 : 0;
            contrastBuffer[i] = value;
            contrastBuffer[i + 1] = value;
            contrastBuffer[i + 2] = value;
            contrastBuffer[i + 3] = 255;
          }
          try {
            result = jsQR(contrastBuffer, width, height, { inversionAttempts: 'attemptBoth' });
          } catch {
            /* tenta no próximo frame */
          }
        }

        if (!result?.data) return;

        const invite = parseFriendInvite(result.data);
        if (!invite) {
          if (now - lastInvalidRef.current > 2200) {
            lastInvalidRef.current = now;
            setNotice('QR Code não reconhecido. Use o QR de amigo do EVO FIT.');
          }
          return;
        }

        if (handledRef.current) return;
        handledRef.current = true;
        stopCamera();
        /* v4.53.0 — fecha com animação e só então entrega o convite ao pai. */
        requestClose(() => onInviteRef.current(invite));
      } catch {
        /* frame inválido/segurança do canvas: tenta no próximo */
      }
    };

    const start = async () => {
      if (!navigator.mediaDevices?.getUserMedia) {
        setError('A câmera precisa de HTTPS (ou localhost) e de um navegador compatível.');
        setStatus('error');
        return;
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: { facingMode: { ideal: 'environment' } },
        });
        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        streamRef.current = stream;
        const video = videoRef.current;
        if (!video) {
          stopCamera();
          return;
        }
        video.srcObject = stream;
        /* Não espera o play(): alguns streams (canvas/WebView) só resolvem
           depois; o loop já checa readyState/dimensões a cada frame. */
        void video.play().catch(() => {
          /* o atributo autoPlay/playsInline cobre o restante */
        });
        if (cancelled) return;
        setStatus('scanning');
        scan();
      } catch (err) {
        if (cancelled) return;
        setError(cameraErrorMessage(err));
        setStatus('error');
      }
    };

    void start();

    return () => {
      cancelled = true;
      stopCamera();
    };
  }, [requestClose, stopCamera]);

  /* Limpa o aviso de QR inválido */
  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(''), 2600);
    return () => window.clearTimeout(timer);
  }, [notice]);

  const handleClose = useCallback(() => {
    standaloneSound.playMove();
    stopCamera();
    requestClose();
  }, [requestClose, stopCamera]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') handleClose();
    };
    document.addEventListener('keydown', onKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [handleClose]);

  return createPortal(
    <div
      className={`qr-scanner${closing ? ' is-closing' : ''}`}
      role="dialog"
      aria-modal="true"
      aria-label="Escanear QR Code"
    >
      <video
        ref={videoRef}
        className="qr-scanner__video"
        playsInline
        muted
        autoPlay
        disablePictureInPicture
      />

      <div className="qr-scanner__frame" aria-hidden="true">
        <span className="qr-scanner__line" />
      </div>

      <button type="button" className="qr-scanner__close" onClick={handleClose} aria-label="Fechar câmera">
        <X size={22} strokeWidth={3} />
      </button>

      <p className="qr-scanner__hint">Aponte a câmera para um QR Code ou Código de Barras</p>

      {notice && (
        <div className="qr-scanner__notice" role="status" aria-live="polite">
          {notice}
        </div>
      )}

      {status === 'loading' && <div className="qr-scanner__status">Abrindo câmera…</div>}

      {status === 'error' && (
        <div className="qr-scanner__error" role="alert">
          <p>{error}</p>
          <button type="button" onClick={handleClose}>
            Fechar
          </button>
        </div>
      )}
    </div>,
    document.body,
  );
}
