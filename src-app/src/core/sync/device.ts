/**
 * device.ts — Identificação e gestão de dispositivos (v4.9.0-sync)
 *
 * Port das Section 4 do SupabaseSyncSecurityStandalone.tsx:
 *   • id persistente e imutável por janela/dispositivo (mbc_device_id);
 *   • auto-detecção de navegador, SO e formato (desktop/mobile/tablet);
 *   • inatividade relativa em português ("Ativo agora nesta janela", "há 12 minutos").
 */

export interface ConnectedDevice {
  id: string;
  name: string;
  customName?: string;
  browser: string;
  os: string;
  isCurrent: boolean;
  lastActive: string;
  lastActiveTimestamp?: number;
  deviceType: 'desktop' | 'mobile' | 'tablet';
}

/** Registro cru persistido no user_sync (jsonb DEVICES). */
export interface DeviceRecord {
  id: string;
  name: string;
  customName?: string;
  browser: string;
  os: string;
  deviceType: 'desktop' | 'mobile' | 'tablet';
  lastActive: number;
}

export const DEVICE_ID_KEY = 'mbc_device_id';

/** Gera ou recupera o identificador persistente deste dispositivo. */
export function getPersistentDeviceId(): string {
  if (typeof window === 'undefined') return 'server-instance';
  let id = localStorage.getItem(DEVICE_ID_KEY);
  if (!id) {
    id = `dev-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 8)}`;
    localStorage.setItem(DEVICE_ID_KEY, id);
  }
  return id;
}

/** Detecta navegador, sistema operacional e formato do aparelho. */
export function detectCurrentDevice(): {
  browser: string;
  os: string;
  fullName: string;
  deviceType: 'desktop' | 'mobile' | 'tablet';
} {
  if (typeof navigator === 'undefined') {
    return { browser: 'Navegador', os: 'Desktop', fullName: 'Computador Padrão', deviceType: 'desktop' };
  }
  const ua = navigator.userAgent;
  let browser = 'Navegador Web';
  let os = 'Dispositivo';

  if (ua.includes('Edg/')) browser = 'Microsoft Edge';
  else if (ua.includes('Chrome/')) browser = 'Google Chrome';
  else if (ua.includes('Safari/') && !ua.includes('Chrome')) browser = 'Apple Safari';
  else if (ua.includes('Firefox/')) browser = 'Mozilla Firefox';
  else if (ua.includes('OPR/') || ua.includes('Opera/')) browser = 'Opera';

  if (ua.includes('Windows')) os = 'Windows';
  else if (ua.includes('Mac OS')) os = 'macOS';
  else if (ua.includes('Android')) os = 'Android';
  else if (ua.includes('iPhone')) os = 'iPhone';
  else if (ua.includes('iPad')) os = 'iPad';
  else if (ua.includes('Linux')) os = 'Linux';

  const isMobile = /Android|webOS|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);
  const isTablet = /iPad|Macintosh/i.test(ua) && navigator.maxTouchPoints > 1;
  const deviceType: 'desktop' | 'mobile' | 'tablet' = isTablet ? 'tablet' : isMobile ? 'mobile' : 'desktop';

  return { browser, os, fullName: `${browser} (${os})`, deviceType };
}

/** Formata um timestamp em texto relativo em português. */
export function formatRelativeActiveTime(timestamp?: number, isCurrent?: boolean): string {
  if (isCurrent) return 'Ativo agora nesta janela';
  if (!timestamp) return 'Ativo recentemente';

  const diffMs = Math.max(0, Date.now() - timestamp);
  const diffMin = Math.floor(diffMs / 60000);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffMin < 1) return 'Ativo agora mesmo';
  if (diffMin < 60) return `Ativo há ${diffMin} ${diffMin === 1 ? 'minuto' : 'minutos'}`;
  if (diffHour < 24) return `Ativo há ${diffHour} ${diffHour === 1 ? 'hora' : 'horas'}`;
  if (diffDay === 1) return 'Ontem';
  return `Há ${diffDay} dias`;
}

/** Registro deste dispositivo (para heartbeat no registry de devices). */
export function buildCurrentDeviceRecord(customName?: string): DeviceRecord {
  const info = detectCurrentDevice();
  return {
    id: getPersistentDeviceId(),
    name: info.fullName,
    customName,
    browser: info.browser,
    os: info.os,
    deviceType: info.deviceType,
    lastActive: Date.now(),
  };
}

/** Converte um registro persistido em ConnectedDevice para a UI. */
export function toConnectedDevice(record: DeviceRecord): ConnectedDevice {
  const currentId = getPersistentDeviceId();
  return {
    id: record.id,
    name: record.name,
    customName: record.customName,
    browser: record.browser,
    os: record.os,
    isCurrent: record.id === currentId,
    lastActive: formatRelativeActiveTime(record.lastActive, record.id === currentId),
    lastActiveTimestamp: record.lastActive,
    deviceType: record.deviceType,
  };
}
