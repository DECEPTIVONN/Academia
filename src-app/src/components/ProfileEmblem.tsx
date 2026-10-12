/**
 * ProfileEmblem.tsx — Emblema de identidade do avatar (partilhado)
 *
 * Port de `applyProfileCustomization` (secao-customizacao.js L371–396), já
 * replicado em DashboardFeature (`#dashAvatar`) e ProfileFeature (avatar do
 * cabeçalho): wrapper `.profile-avatar__emblem-wrapper` com `mix-blend screen`
 * (+ `animate-pulse` quando `mainEmblemPulse !== false`), sprite da planilha
 * (300% + offset em %) ou imagem direta.
 *
 * Usado pela Top Bar mobile e pela Sidebar HUD — antes exibiam só a inicial
 * do nome. Sem perfil carregado cai no emblema padrão `prestigio-1`.
 */

import React from 'react';
import { IDENTITY_EMBLEMS, SPRITESHEET_URL } from '@/features/profile/profile-data';
import type { ProfileCustomization } from '@/core/db/schema';

interface ProfileEmblemProps {
  customization?: ProfileCustomization | null;
}

export const ProfileEmblem: React.FC<ProfileEmblemProps> = ({ customization }) => {
  /* v4.9.3-settings — foto customizada (photo) tem prioridade sobre o emblema */
  if (customization?.photo) {
    return (
      <img
        src={customization.photo}
        alt="Foto de perfil"
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          borderRadius: '50%',
        }}
        referrerPolicy="no-referrer"
        onError={(e) => {
          (e.target as HTMLImageElement).style.display = 'none';
        }}
      />
    );
  }

  const emblem = IDENTITY_EMBLEMS.find(
    (e) => e.id === (customization?.mainEmblem || 'prestigio-1')
  );
  if (!emblem) return null;

  const pulsing = customization?.mainEmblemPulse !== false;

  return (
    <div
      className={`profile-avatar__emblem-wrapper${pulsing ? ' animate-pulse' : ''}`}
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        mixBlendMode: 'screen',
      }}
    >
      {emblem.type === 'sprite' ? (
        <img
          src={SPRITESHEET_URL}
          alt=""
          style={{
            position: 'absolute',
            maxWidth: 'none',
            width: '300%',
            height: '300%',
            left: emblem.x,
            top: emblem.y,
          }}
        />
      ) : (
        <img
          src={emblem.url}
          alt=""
          style={{ width: '100%', height: '100%', objectFit: 'contain' }}
        />
      )}
    </div>
  );
};

export default ProfileEmblem;
