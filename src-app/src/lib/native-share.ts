/**
 * native-share.ts — Compartilhamento nativo do sistema (Web Share API) (v4.14.0)
 *
 * v4.59.0 — app Android (Capacitor): o WebView NÃO compartilha arquivo pelo
 * `navigator.share` (e em várias versões nem expõe a API), então o share saía
 * sempre sem a imagem. Agora, dentro do app empacotado, o PNG é gravado no
 * cache e entregue ao plugin nativo `@capacitor/share` JUNTO com o texto, no
 * mesmo gesto do usuário (intent com EXTRA_TEXT + EXTRA_STREAM).
 *
 * Contexto: na versão legacy o app rodava localmente via HTTP e
 * `navigator.share` NÃO EXISTIA fora de contexto seguro (HTTPS/localhost) —
 * por isso os compartilhamentos "não funcionavam" e caíam sempre no
 * clipboard. Agora o app está hospedado na Vercel (HTTPS), então a folha de
 * compartilhamento NATIVA da plataforma (Android/Windows/iOS) passa a ser
 * usada automaticamente, conforme o sistema do usuário.
 *
 * Regras:
 *  • `shareNative()` tenta a folha nativa, com `canShare` de guarda (ex.:
 *    desktop Windows não aceita `files`; Chrome desktop sem Web Share não tem
 *    a API) — quem chama decide o fallback (clipboard/download + toast);
 *  • 'cancelled' (AbortError) = o usuário FECHOU a folha — NÃO é erro e não
 *    deve disparar fallback (senão o clipboard dispara em cima do sheet);
 *  • API sempre chamada dentro de gesto do usuário (requisito do navegador).
 */

export type NativeShareResult = 'shared' | 'cancelled' | 'unsupported' | 'error';

/** true quando o app roda dentro do invólucro nativo do Capacitor (APK/IPA). */
export function isNativeApp(): boolean {
  if (typeof window === 'undefined') return false;
  const cap = (window as unknown as {
    Capacitor?: { isNativePlatform?: () => boolean };
  }).Capacitor;
  try {
    return Boolean(cap?.isNativePlatform?.());
  } catch {
    return false;
  }
}

/** Converte o Blob do PNG em base64 (o Filesystem grava base64 no Android). */
async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result ?? '');
      const comma = result.indexOf(',');
      resolve(comma >= 0 ? result.slice(comma + 1) : result);
    };
    reader.onerror = () => reject(reader.error ?? new Error('Falha ao ler a imagem'));
    reader.readAsDataURL(file);
  });
}

/** Imagem + texto pelo plugin nativo. Só roda no app empacotado. */
export async function shareImageInNativeApp(
  file: File,
  text?: string,
  title = 'Evo Fit'
): Promise<NativeShareResult> {
  if (!isNativeApp()) return 'unsupported';
  try {
    const data = await fileToBase64(file);
    const [{ Filesystem, Directory }, { Share }] = await Promise.all([
      import('@capacitor/filesystem'),
      import('@capacitor/share'),
    ]);
    const saved = await Filesystem.writeFile({
      path: `share/${file.name}`,
      data,
      directory: Directory.Cache,
      recursive: true,
    });
    const can = await Share.canShare();
    if (!can.value) return 'unsupported';
    await Share.share({
      title,
      text,
      files: [saved.uri],
      dialogTitle: 'Compartilhar',
    });
    return 'shared';
  } catch (err) {
    const message = String((err as { message?: string })?.message ?? err);
    if (/cancel/i.test(message)) return 'cancelled';
    console.warn('[shareImageInNativeApp]', err);
    return 'error';
  }
}

/**
 * Salva o PNG no app (Documentos → cache, como reserva). Usado no lugar do
 * download por <a download>, que o WebView do Android ignora.
 */
export async function saveImageInNativeApp(file: File): Promise<boolean> {
  if (!isNativeApp()) return false;
  try {
    const data = await fileToBase64(file);
    const { Filesystem, Directory } = await import('@capacitor/filesystem');
    const targets = [Directory.Documents, Directory.Cache];
    for (const directory of targets) {
      try {
        await Filesystem.writeFile({
          path: `EvoFit/${file.name}`,
          data,
          directory,
          recursive: true,
        });
        return true;
      } catch {
        /* tenta o próximo diretório */
      }
    }
    return false;
  } catch (err) {
    console.warn('[saveImageInNativeApp]', err);
    return false;
  }
}

export interface NativeSharePayload {
  title?: string;
  text?: string;
  url?: string;
  files?: File[];
}

/** true quando a plataforma expõe a Web Share API (contexto seguro + browser). */
export function canNativeShare(): boolean {
  return typeof navigator !== 'undefined' && typeof navigator.share === 'function';
}

/**
 * A plataforma consegue compartilhar ESTE arquivo pelo Web Share?
 *
 * `canShare` só aceita a propriedade `files`; quando ele não existe a
 * plataforma não suporta arquivos (caso do Firefox Android, que expõe
 * `share` apenas para texto/URL) e devolver `false` deixa o chamador entregar
 * a imagem por download ANTES de abrir a folha.
 */
export function canShareFiles(file?: File | null): boolean {
  if (!file || !canNativeShare()) return false;
  const nav = navigator as Navigator & { canShare?: (d?: ShareData) => boolean };
  if (!nav.canShare) return false;
  try {
    return nav.canShare({ files: [file] });
  } catch {
    return false;
  }
}

/**
 * Abre a folha de compartilhamento nativa do SO.
 * Retorna o desfecho para o chamador decidir o fallback.
 */
export async function shareNative(data: NativeSharePayload): Promise<NativeShareResult> {
  if (!canNativeShare()) return 'unsupported';
  const nav = navigator as Navigator & { canShare?: (d?: ShareData) => boolean };
  try {
    // canShare recusa combos inválidos (ex.: files no desktop) → fallback.
    // v4.52.1-share — quando HÁ arquivo, a checagem usa SÓ `{ files }`: alguns
    // navegadores validam apenas essa propriedade e devolviam false para
    // `{ files, title, text }`, o que descartava a imagem e o compartilhamento
    // virava "só texto" (o share em si aceita os três campos juntos).
    if (nav.canShare) {
      const probe: ShareData = data.files?.length ? { files: data.files } : data;
      let allowed = false;
      try {
        allowed = nav.canShare(probe);
      } catch {
        allowed = false;
      }
      if (!allowed) return 'unsupported';
    }
    await navigator.share(data);
    return 'shared';
  } catch (err) {
    const e = err as { name?: string; message?: string };
    if (e?.name === 'AbortError') return 'cancelled';
    /* v4.59.0 — loga nome+mensagem: no Android é comum o share de arquivo
       recusar o combo (NotSupportedError/TypeError) e aí o chamador tenta o
       próximo payload (imagem sem texto) antes de cair no texto. */
    console.warn('[shareNative]', e?.name ?? '', e?.message ?? '', err);
    return 'error';
  }
}
