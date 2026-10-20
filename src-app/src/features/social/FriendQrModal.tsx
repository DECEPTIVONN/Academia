/**
 * FriendQrModal.tsx — modal "Adicionar" da aba Amigos.
 *
 * Exibe o QR permanente do usuário e o link fixo de convite. Não há contagem
 * regressiva: o código é o mesmo em todas as aberturas (ver friend-invites.ts).
 * O visual segue a referência do Clash Royale: cartão verde, QR branco,
 * faixa amarela em zigue-zague e botões roxos "Enviar Link"/"Escanear".
 */

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import QRCode from 'qrcode';
import { Plus, X } from 'lucide-react';
import { shareNative } from '@/lib/native-share';
import { showToast } from '@/lib/toast';
import { standaloneSound } from './ligas-data';

interface FriendQrModalProps {
  inviteUrl: string;
  name: string;
  onClose: () => void;
  onScan: () => void;
}

async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    /* tenta o fallback legado abaixo */
  }

  try {
    const area = document.createElement('textarea');
    area.value = text;
    area.setAttribute('readonly', '');
    area.style.position = 'fixed';
    area.style.top = '-1000px';
    area.style.opacity = '0';
    document.body.appendChild(area);
    area.select();
    const ok = document.execCommand('copy');
    area.remove();
    return ok;
  } catch {
    return false;
  }
}

export function FriendQrModal({ inviteUrl, name, onClose, onScan }: FriendQrModalProps) {
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [qrError, setQrError] = useState(false);
  const [sending, setSending] = useState(false);
  const [manualLink, setManualLink] = useState('');

  /* Gera o QR branco sobre fundo transparente (o verde do cartão aparece). */
  useEffect(() => {
    let alive = true;
    QRCode.toDataURL(inviteUrl, {
      type: 'image/png',
      width: 560,
      margin: 4,
      errorCorrectionLevel: 'M',
      color: { dark: '#ffffff', light: '#00000000' },
    })
      .then((url) => {
        if (alive) setQrDataUrl(url);
      })
      .catch(() => {
        if (alive) setQrError(true);
      });
    return () => {
      alive = false;
    };
  }, [inviteUrl]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [onClose]);

  const handleSendLink = async () => {
    if (sending) return;
    standaloneSound.playMove();
    setSending(true);
    try {
      const result = await shareNative({
        title: 'Amigo no EVO FIT',
        text: `${name} quer ser seu amigo no EVO FIT.`,
        url: inviteUrl,
      });

      if (result === 'shared') {
        showToast('Convite enviado!', 'success');
        return;
      }
      if (result === 'cancelled') return;

      const copied = await copyText(inviteUrl);
      if (copied) {
        setManualLink('');
        showToast('Link de convite copiado!', 'success');
      } else {
        setManualLink(inviteUrl);
        showToast('Copie o link de convite abaixo.', 'info');
      }
    } finally {
      setSending(false);
    }
  };

  return createPortal(
    <div
      className="friend-qr-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="friend-qr-title"
      onClick={onClose}
    >
      <div className="friend-qr-card" onClick={(event) => event.stopPropagation()}>
        <button
          type="button"
          className="friend-qr__close"
          onClick={() => {
            standaloneSound.playMove();
            onClose();
          }}
          aria-label="Fechar"
        >
          <X size={18} strokeWidth={4} />
        </button>

        <div className="friend-qr__body">
          <h2 id="friend-qr-title" className="friend-qr__title">
            <Plus size={22} strokeWidth={4} aria-hidden="true" />
            Adicionar
          </h2>

          <div className="friend-qr__code">
            {qrDataUrl ? (
              <img src={qrDataUrl} alt={`QR Code de convite de ${name}`} draggable={false} />
            ) : (
              <div className="friend-qr__placeholder">
                {qrError ? 'Não foi possível gerar o QR.' : 'Gerando QR…'}
              </div>
            )}
          </div>

          <p className="friend-qr__hint">
            Quem escanear este código será adicionado imediatamente à sua lista de amigos.
          </p>
        </div>

        <div className="friend-qr__footer">
          <svg
            className="friend-qr__zigzag"
            viewBox="0 0 320 14"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <polyline
              points="0,11 16,3 32,11 48,3 64,11 80,3 96,11 112,3 128,11 144,3 160,11 176,3 192,11 208,3 224,11 240,3 256,11 272,3 288,11 304,3 320,11"
              fill="none"
              stroke="#f2c744"
              strokeWidth="5"
              strokeLinecap="square"
            />
          </svg>

          <div className="friend-qr__actions">
            <button
              type="button"
              className="friend-qr__action"
              onClick={handleSendLink}
              disabled={sending}
            >
              {sending ? 'Enviando…' : 'Enviar Link'}
            </button>
            <button
              type="button"
              className="friend-qr__action"
              onClick={() => {
                standaloneSound.playMove();
                onScan();
              }}
            >
              Escanear
            </button>
          </div>

          {manualLink && (
            <div className="friend-qr__manual">
              <label htmlFor="friend-qr-link">Link de convite</label>
              <input
                id="friend-qr-link"
                type="text"
                readOnly
                value={manualLink}
                onFocus={(event) => event.currentTarget.select()}
              />
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}
