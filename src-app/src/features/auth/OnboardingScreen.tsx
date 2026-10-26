import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'motion/react';
import { ArrowLeft, Check, Facebook, Instagram, MessageCircle, MoreHorizontal, Music2, Search, Ticket, Users, ArrowBigRight, TreePine } from 'lucide-react';
import { useAuth } from '@/core/auth/use-auth';
import { useProfileState } from '@/features/profile/useProfileState';
import { DEFAULT_PROFILE_CUSTOMIZATION, type ProfileCustomization } from '@/core/db/schema';
import { showToast } from '@/lib/toast';
import { loadLocalData } from '@/core/db/queries';
import { applyTemplate } from '@/features/workout/treinos/treinos-helpers';

/* Cor em destaque das perguntas pós-login (vermelho, conforme solicitado). */
const ACCENT = '#ef4444';
const ACCENT_SOFT = 'rgba(239, 68, 68, 0.12)';
const CARD_BORDER = '1px solid rgba(255,255,255,0.12)';
const DIVIDER = '1px solid rgba(255,255,255,0.08)';

export interface OnboardingScreenProps {
  open: boolean;
  onComplete: () => void;
}

type StepId =
  | 'conta'
  | 'porque'
  | 'como-conheceu'
  | 'objetivos'
  | 'experiencia'
  | 'sexo'
  | 'corpo'
  | 'frequencia'
  | 'local'
  | 'indicacao'
  | 'plano'
  | 'notificacoes';

export interface OptionDef {
  value: string;
  title: string;
  desc?: string;
  badge?: string;
  icon?: string;
}

export interface StepDef {
  id: StepId;
  label: string;
  title: string;
  subtitle: string;
  options?: OptionDef[];
  skippable?: boolean;
  actionLabel?: string;
  textInput?: boolean;
  multiline?: boolean;
  numInput?: boolean;
  selectOptions?: SelectOption[];
  stepIntro?: string;
}

interface SelectOption {
  value: string;
  label: string;
}

const BODY_STEPS: StepId[] = ['sexo', 'corpo'];
const SOCIO_STEPS: StepId[] = ['indicacao', 'como-conheceu'];
export function OnboardingScreen({ open, onComplete }: OnboardingScreenProps) {
  return (
    <motion.div>
      ok
    </motion.div>
  );
}
const STEPS: StepDef[] = [
  {
    id: 'porque',
    label: 'porque',
    title: 'Por que usar o app de fitness?',
    subtitle: 'Nos conte o motivo que te trouxe aqui — ajudamos a personalizar sua jornada.',
    stepIntro: '1. POR QUE O APP',
    textInput: true,
    skippable: false,
    actionLabel: 'Continuar',
  },
  {
    id: 'como-conheceu',
    label: 'como-conheceu',
    title: 'Como conheceu o app?',
    subtitle: 'Selecione uma opção para termos mais contexto.',
    stepIntro: '2. COMO NOS CONHECEU',
    options: [
      { value: 'Redes sociais', title: 'Redes sociais', icon: 'instagram' },
      { value: 'Indicacao', title: 'Indicação', icon: 'message-circle' },
      { value: 'Busca', title: 'Busca / Google', icon: 'search' },
      { value: 'Outro', title: 'Outro', icon: 'more-horizontal' },
    ],
    skippable: true,
    actionLabel: 'Continuar',
  },
  {
    id: 'sexo',
    label: 'sexo',
    title: 'Informações pessoais',
    subtitle: 'Ajude-nos a entender seu perfil.',
    stepIntro: '3. PERFIL',
    options: [
      { value: 'masculino', title: 'Masculino' },
      { value: 'feminino', title: 'Feminino' },
      { value: 'nao-responderei', title: 'Prefiro não responder' },
    ],
    skippable: true,
    actionLabel: 'Continuar',
  },
  {
    id: 'corpo',
    label: 'corpo',
    title: 'Dados corporais',
    subtitle: 'Peso, altura e idade ajudam a ajustar suas recomendações.',
    stepIntro: '4. DADOS CORPOREOS',
    textInput: true,
    numInput: true,
    skippable: false,
    actionLabel: 'Continuar',
  },
  {
    id: 'frequencia',
    label: 'frequencia',
    title: 'Frequência de treinos',
    subtitle: 'Com base nisso, ajustamos o volume da sua rotina.',
    stepIntro: '5. FREQUÊNCIA',
    selectOptions: [
      { value: 'zero-a-um', label: '0 a 1 treino por semana' },
      { value: 'dois-a-tres', label: '2 a 3 treinos por semana' },
      { value: 'quatro-a-cinco', label: '4 a 5 treinos por semana' },
      { value: 'seis-ou-mais', label: '6 ou mais treinos por semana' },
    ],
    skippable: true,
    actionLabel: 'Continuar',
  },
  {
    id: 'local',
    label: 'local',
    title: 'Local de treinos',
    subtitle: 'Onde você costuma treinar?',
    stepIntro: '6. LOCAL',
    options: [
      { value: 'casa', title: 'Casa' },
      { value: 'academia', title: 'Academia' },
      { value: 'ambos', title: 'Casa e academia' },
      { value: 'nao-tem', title: 'Ainda não tenho' },
    ],
    skippable: true,
    actionLabel: 'Continuar',
  },
  {
    id: 'indicacao',
    label: 'indicacao',
    title: 'Indicadores extras',
    subtitle: 'Fontes e interesses que nos ajudam a conectar você ao app.',
    stepIntro: '7. INDICADORES',
    options: [
      { value: 'instagram', title: 'Instagram' },
      { value: 'youtube', title: 'YouTube' },
      { value: 'tiktok', title: 'TikTok' },
      { value: 'facebook', title: 'Facebook' },
      { value: 'outro', title: 'Outro' },
    ],
    skippable: true,
    actionLabel: 'Continuar',
  },
  {
    id: 'plano',
    label: 'plano',
    title: 'Plano de nutrição',
    subtitle: 'Você tem interesse em um plano alimentar?',
    stepIntro: '8. PLANO',
    options: [
      { value: 'sim', title: 'Sim, quero' },
      { value: 'nao', title: 'Não, obrigado' },
    ],
    skippable: true,
    actionLabel: 'Continuar',
  },
  {
    id: 'notificacoes',
    label: 'notificacoes',
    title: 'Notificações',
    subtitle: 'Receba lembretes de treino, tornozelo e dados de nutrição.',
    stepIntro: '9. NOTIFICAÇÕES',
    options: [
      { value: 'ativar', title: 'Ativar notificações' },
      { value: 'nao-ativar', title: 'Não ativar por enquanto' },
    ],
    skippable: false,
    actionLabel: 'Concluir',
  },
];

