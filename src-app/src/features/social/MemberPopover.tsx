/**
 * MemberPopover.tsx — popover do jogador (guilda + sub-aba Amigos)
 *
 * Mesmo desenho para membros da guilda e amigos: avatar, nome/tag,
 * função/país/nível, **Último acesso** (mostra "On-line" quando o jogador está
 * on-line) e **Ofensiva**. O rodapé abre o perfil completo
 * (`PlayerProfileModal`), no lugar do antigo aviso "em breve".
 */

import { useEffect, useState } from 'react';
import { Clock, Flame } from 'lucide-react';
import { showToast } from '@/lib/toast';
import { FlagIcon } from './ligas-icons';
import { standaloneSound } from './ligas-data';
import { GuildEmblem } from './GuildEmblem';
import { OverlayShell } from './OverlayShell';
import { PlayerProfileModal } from './PlayerProfileModal';
import { formatLastSeen, playerTag, type PlayerSummaryInput } from './player-profile-data';
import './guild.css';

export interface MemberPopoverProps {
  player: PlayerSummaryInput;
  onClose: () => void;
}

export function MemberPopover({ player, onClose }: MemberPopoverProps) {
  const [profileMounted, setProfileMounted] = useState(false);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      event.stopPropagation();
      onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const streak = Number.isFinite(player.streak) ? Math.max(0, Math.floor(player.streak ?? 0)) : 0;
  const online = player.online === true;
  const tag = playerTag(player.id || player.name);

  const openProfile = () => {
    standaloneSound.playMove();
    setProfileMounted(true);
  };

  const copyTag = () => {
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(tag).then(
        () => showToast(`Tag ${tag} copiada!`, 'success'),
        () => showToast('Não foi possível copiar a tag.', 'error'),
      );
    } else {
      showToast(`Tag do jogador: ${tag}`, 'info');
    }
  };

  return (
    <>
      <OverlayShell
        title={player.kind === 'membro' ? 'Membro' : 'Amigo'}
        subtitle={player.role ?? player.clan ?? undefined}
        nested
        onClose={onClose}
        footer={
          <button
            type="button"
            className="guild-btn guild-btn--primary guild-btn--wide"
            onClick={openProfile}
          >
            Ver perfil
          </button>
        }
      >
        <div className="guild-profile">
          <GuildEmblem
            emblemId={player.clanEmblemId ?? 'prestigio-1'}
            size={78}
            className="guild-profile__avatar"
          />
          <div className="guild-profile__identity">
            <span className="guild-profile__name">{player.name}</span>
            <button type="button" className="guild-profile__tag" onClick={copyTag} title="Copiar tag">
              {tag}
            </button>
            <span className="guild-profile__meta">
              {player.role && (
                <span
                  className={`guild-member__role guild-member__role--${player.role === 'Líder' ? 'leader' : player.role === 'Ancião' ? 'elder' : 'member'}`}
                >
                  {player.role}
                </span>
              )}
              <FlagIcon flag={player.flag ?? 'BR'} size={12} />
              <span>Nível {player.level ?? 1}</span>
              {player.isSelf && <span className="guild-member__you">VOCÊ</span>}
            </span>
          </div>
        </div>

        <div className="guild-profile__stats">
          <div className="guild-profile__stat">
            <Clock
              size={14}
              className={`guild-profile__icon${online ? ' guild-profile__icon--online' : ''}`}
            />
            <span className="guild-profile__label">Último acesso</span>
            <strong
              className={`guild-profile__value${online ? ' guild-profile__value--online' : ''}`}
            >
              {online && <span className="guild-profile__online-dot" aria-hidden="true" />}
              {formatLastSeen(player.lastSeenHours, online)}
            </strong>
          </div>
          <div className="guild-profile__stat">
            <Flame size={14} className="guild-profile__icon guild-profile__icon--fire" />
            <span className="guild-profile__label">Ofensiva</span>
            <strong className="guild-profile__value">
              {streak} {streak === 1 ? 'dia' : 'dias'}
            </strong>
          </div>
        </div>
      </OverlayShell>

      {profileMounted && (
        <PlayerProfileModal player={player} onClose={() => setProfileMounted(false)} />
      )}
    </>
  );
}
