/**
 * app-updater.ts — atualização automática do APK (v4.75.0)
 *
 * Fluxo:
 *   1. o workflow do GitHub Actions gera o APK, publica numa release do repo
 *      público de releases e anexa o `latest.json` (versionName/versionCode,
 *      apkName/apkUrl, size, sha256 e as notas do CHANGELOG);
 *   2. `checkForUpdate()` compara o `versionCode` do latest.json com o do APK
 *      instalado;
 *   3. `downloadAndInstall()` baixa pelo plugin nativo (com progresso) e abre o
 *      instalador do Android.
 *
 * Regras:
 *   • tudo roda SÓ no APK Android (`isNativeAndroid()`); na web estas funções
 *     devolvem null/erro e a UI de atualização nem é montada;
 *   • o manifesto e o APK passam pelo LADO NATIVO (AppUpdaterPlugin): o WebView
 *     não instala APK e o download de release assets do GitHub não tem CORS;
 *   • o versionCode é a única comparação válida (o Android trata APK com mesmo
 *     versionCode como "mesma versão").
 */

import { Capacitor, registerPlugin, type PluginListenerHandle } from '@capacitor/core';

/** Repo público que hospeda os APKs + latest.json (release "latest"). */
export const RELEASE_REPO = 'DECEPTIVONN/EvoFit-releases';
export const UPDATE_MANIFEST_URL = `https://github.com/${RELEASE_REPO}/releases/latest/download/latest.json`;

export interface AppVersionInfo {
  versionName: string;
  versionCode: number;
}

export interface UpdateManifest {
  versionName: string;
  versionCode: number;
  commit?: string;
  releaseName?: string;
  apkName: string;
  apkUrl: string;
  size?: number;
  sha256?: string;
  notes?: string;
}

export interface DownloadProgress {
  /** 0–100 (0 quando o servidor não informa o tamanho) */
  progress: number;
  bytes: number;
  total: number;
}

export interface DownloadResult {
  fileName: string;
  path: string;
  size: number;
  sha256: string;
}

interface AppUpdaterPlugin {
  getVersionInfo(): Promise<AppVersionInfo>;
  fetchManifest(options: { url: string }): Promise<UpdateManifest>;
  downloadApk(options: {
    url: string;
    fileName: string;
    sha256?: string;
  }): Promise<DownloadResult>;
  installApk(options: { fileName: string }): Promise<void>;
  canInstallPackages(): Promise<{ granted: boolean }>;
  openInstallSettings(): Promise<void>;
  addListener(
    eventName: 'downloadProgress',
    listener: (progress: DownloadProgress) => void
  ): Promise<PluginListenerHandle>;
}

const AppUpdater = registerPlugin<AppUpdaterPlugin>('AppUpdater');

/** true apenas no APK Android (nunca na web/PWA nem no desktop). */
export function isNativeAndroid(): boolean {
  return Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android';
}

let installedVersion: Promise<AppVersionInfo | null> | null = null;

/** Versão do APK instalado (null fora do Android nativo). */
export function getInstalledVersion(): Promise<AppVersionInfo | null> {
  if (!isNativeAndroid()) return Promise.resolve(null);
  if (!installedVersion) {
    installedVersion = AppUpdater.getVersionInfo().catch((err) => {
      console.warn('[app-updater] getVersionInfo', err);
      return null;
    });
  }
  return installedVersion;
}

/** Converte o latest.json devolvido pelo plugin em UpdateManifest validado. */
function normalizeManifest(raw: Partial<UpdateManifest> | null): UpdateManifest {
  const versionCode = Number(raw?.versionCode);
  if (!raw?.apkUrl || !Number.isFinite(versionCode)) {
    throw new Error('Manifesto de atualização inválido.');
  }
  return {
    versionName: String(raw.versionName ?? ''),
    versionCode,
    commit: raw.commit,
    releaseName: raw.releaseName,
    apkName: String(raw.apkName ?? 'app-update.apk'),
    apkUrl: String(raw.apkUrl),
    size: Number(raw.size) || 0,
    sha256: raw.sha256,
    notes: raw.notes,
  };
}

/**
 * Consulta o latest.json e devolve a atualização quando o versionCode publicado
 * é maior que o instalado. `null` = já está na versão mais recente.
 */
export async function checkForUpdate(): Promise<UpdateManifest | null> {
  if (!isNativeAndroid()) return null;
  const [installed, raw] = await Promise.all([
    getInstalledVersion(),
    AppUpdater.fetchManifest({ url: `${UPDATE_MANIFEST_URL}?t=${Date.now()}` }),
  ]);
  const latest = normalizeManifest(raw);
  if (!installed) {
    throw new Error('Não foi possível ler a versão instalada do app.');
  }
  return latest.versionCode > installed.versionCode ? latest : null;
}

export type InstallOutcome = 'installing' | 'permission-required';

/**
 * Baixa o APK publicado (emitindo `onProgress`) e abre o instalador do Android.
 * Sem a permissão de "instalar apps desconhecidos" abre os ajustes do sistema e
 * devolve 'permission-required' — o usuário toca em Instalar de novo depois.
 */
export async function downloadAndInstall(
  update: UpdateManifest,
  onProgress?: (progress: DownloadProgress) => void
): Promise<InstallOutcome> {
  if (!isNativeAndroid()) throw new Error('Atualização disponível só no APK Android.');

  const fileName = update.apkName || `evofit-${update.versionCode}.apk`;
  let handle: PluginListenerHandle | null = null;
  try {
    if (onProgress) {
      handle = await AppUpdater.addListener('downloadProgress', onProgress);
    }
    await AppUpdater.downloadApk({
      url: update.apkUrl,
      fileName,
      sha256: update.sha256,
    });

    const { granted } = await AppUpdater.canInstallPackages();
    if (!granted) {
      await AppUpdater.openInstallSettings();
      return 'permission-required';
    }

    await AppUpdater.installApk({ fileName });
    return 'installing';
  } finally {
    await handle?.remove();
  }
}

/** Formata bytes em "12,4 MB" (pt-BR). */
export function formatBytes(bytes: number | undefined | null): string {
  if (!bytes || bytes <= 0) return '—';
  const mb = bytes / (1024 * 1024);
  if (mb >= 1) return `${mb.toFixed(1).replace('.', ',')} MB`;
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}
