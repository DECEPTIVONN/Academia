/**
 * PlayerAvatar.tsx — avatar compartilhado dos jogadores (Social)
 *
 * Mesma prioridade do avatar do site: foto de perfil → emblema de identidade
 * (arte real do `IDENTITY_EMBLEMS`) → glifo. Antes as listas de amigos e de
 * membros da guilda usavam uma imagem fixa de prestígio; agora cada jogador
 * mostra a própria foto/emblema. O visual (círculo escuro com brilho do tema)
 * é o mesmo do emblema da guilda, para todas as listas ficarem coerentes.
 *
 * `PlayerAvatar` desenha o contêiner; `PlayerAvatarMedia` desenha só a mídia,
 * para reaproveitar wrappers que já têm posicionamento próprio (ponto de
 * on-line, moldura do perfil etc.).
 */

import { IDENTITY_EMBLEMS } from '@/features/profile/profile-data';
import { AvatarGlyph } from './ligas-icons';
import type { AvatarGlyphKey } from './ligas-data';
import './player-avatar.css';

export interface PlayerAvatarMediaProps {
  /** Foto de perfil (customization.photo / OAuth). */
  photo?: string | null;
  /** Emblema de identidade equipado (mainEmblem / avatarEmblemId). */
  emblemId?: string | null;
  /** Glifo de fallback quando não há foto nem emblema. */
  glyph?: AvatarGlyphKey;
  /** Tamanho do glifo de fallback (o das imagens é 100% do contêiner). */
  size?: number;
}

export function PlayerAvatarMedia({ photo, emblemId, glyph = 'crown', size = 32 }: PlayerAvatarMediaProps) {
  if (photo) {
    return <img className="player-avatar__photo" src={photo} alt="" referrerPolicy="no-referrer" loading="lazy" />;
  }

  const emblem = IDENTITY_EMBLEMS.find((item) => item.id === emblemId);
  if (emblem?.url) {
    return (
      <img
        className="player-avatar__emblem"
        src={emblem.url}
        alt=""
        draggable={false}
        loading="lazy"
      />
    );
  }

  return <AvatarGlyph glyph={glyph} size={Math.round(size * 0.5)} className="text-white" />;
}

export interface PlayerAvatarProps extends PlayerAvatarMediaProps {
  /** Diâmetro em pixels. */
  size?: number;
  className?: string;
}

export function PlayerAvatar({ size = 32, className, ...media }: PlayerAvatarProps) {
  return (
    <span
      className={`player-avatar${className ? ` ${className}` : ''}`}
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      <PlayerAvatarMedia {...media} size={size} />
    </span>
  );
}

export default PlayerAvatar;
