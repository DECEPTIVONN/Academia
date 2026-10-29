/**
 * GuildEmblem.tsx — emblema da guilda/jogador
 *
 * Usa os emblemas de identidade já existentes no perfil (`IDENTITY_EMBLEMS`)
 * para não duplicar arte. Módulo próprio para que o perfil do jogador e o
 * popover possam reutilizá-lo sem criar ciclo com `GuildPanel.tsx`.
 */

import { Shield } from 'lucide-react';
import { IDENTITY_EMBLEMS } from '@/features/profile/profile-data';

export function GuildEmblem({
  emblemId,
  size = 48,
  className,
}: {
  emblemId?: string | null;
  size?: number;
  className?: string;
}) {
  const emblem = IDENTITY_EMBLEMS.find((e) => e.id === emblemId) ?? IDENTITY_EMBLEMS[0];
  return (
    <span
      className={`guild-emblem${className ? ` ${className}` : ''}`}
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      {emblem?.url ? (
        <img src={emblem.url} alt="" draggable={false} loading="lazy" />
      ) : (
        <Shield size={Math.round(size * 0.5)} />
      )}
    </span>
  );
}
