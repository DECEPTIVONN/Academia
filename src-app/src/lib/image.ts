/**
 * image.ts — redução de imagens do usuário para data URL (JPEG)
 *
 * Usado por tudo que grava imagem no banco (fotos de progresso das Métricas
 * corporais e foto de perfil do avatar): ler o arquivo escolhido, desenhar num
 * canvas com o lado maior limitado e devolver um data URL JPEG. O limite de
 * resolução é o que mantém o IndexedDB (e o snapshot de sync) num tamanho
 * aceitável — sem ele uma foto de celular passa fácil de vários MB.
 */

export interface ResizeImageOptions {
  /** Lado maior da imagem final, em px (padrão 720). */
  maxSide?: number;
  /** Qualidade do JPEG (0–1, padrão 0.72). */
  quality?: number;
}

/**
 * Lê o arquivo e devolve um data URL JPEG reduzido.
 * Rejeita quando o arquivo não é uma imagem decodificável.
 */
export function fileToDataUrl(file: File, options: ResizeImageOptions = {}): Promise<string> {
  const { maxSide = 720, quality = 0.72 } = options;

  return new Promise((resolve, reject) => {
    if (typeof document === 'undefined') {
      reject(new Error('sem DOM'));
      return;
    }
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      try {
        const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
        const width = Math.max(1, Math.round(img.width * scale));
        const height = Math.max(1, Math.round(img.height * scale));
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('canvas 2d indisponível');
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      } catch (err) {
        reject(err instanceof Error ? err : new Error(String(err)));
      } finally {
        URL.revokeObjectURL(objectUrl);
      }
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('imagem inválida'));
    };
    img.src = objectUrl;
  });
}
