/**
 * personal-ui.tsx — Primitivas visuais do Painel do Personal
 *
 * Kit pequeno (avatar, selo, anel de progresso, cartão de métrica, modal e
 * cabeçalho de seção) para manter consistência entre as telas do CRM sem
 * acoplar as telas ao CSS legado do app do aluno.
 */

import { type ReactNode } from 'react';
import { motion } from 'motion/react';
import { X } from 'lucide-react';
import { useModalPresence } from '@/hooks/useModalPresence';

/* ── Formatação ── */

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function formatMoney(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });
}

export function formatDateBR(iso: string): string {
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

export function relativeDay(iso: string | null): string {
  if (!iso) return 'sem treinos';
  const today = new Date();
  today.setHours(12, 0, 0, 0);
  const target = new Date(`${iso}T12:00:00`);
  const diff = Math.round((today.getTime() - target.getTime()) / 86400000);
  if (diff <= 0) return 'hoje';
  if (diff === 1) return 'ontem';
  if (diff < 7) return `há ${diff} dias`;
  if (diff < 30) return `há ${Math.floor(diff / 7)} semana(s)`;
  return `há ${Math.floor(diff / 30)} mês(es)`;
}

/* ── Avatar com identidade por matiz ── */

export function PtAvatar({
  name,
  hue = 268,
  size = 44,
  ring,
}: {
  name: string;
  hue?: number;
  size?: number;
  ring?: boolean;
}) {
  return (
    <span
      className={`pt-avatar${ring ? ' pt-avatar--ring' : ''}`}
      style={{
        width: size,
        height: size,
        fontSize: size * 0.34,
        ['--pt-avatar-hue' as string]: String(hue),
      }}
      aria-hidden="true"
    >
      {initials(name)}
    </span>
  );
}

/* ── Selo ── */

export type PtTone = 'neutral' | 'success' | 'warn' | 'danger' | 'accent' | 'violet';

export function PtBadge({ children, tone = 'neutral' }: { children: ReactNode; tone?: PtTone }) {
  return <span className={`pt-badge pt-badge--${tone}`}>{children}</span>;
}

/* ── Anel de progresso ── */

export function PtRing({
  value,
  size = 56,
  stroke = 5,
  label,
  tone = 'accent',
}: {
  value: number;
  size?: number;
  stroke?: number;
  label?: ReactNode;
  tone?: PtTone;
}) {
  const clamped = Math.max(0, Math.min(100, value));
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  return (
    <span className={`pt-ring pt-ring--${tone}`} style={{ width: size, height: size }}>
      <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size} aria-hidden="true">
        <circle className="pt-ring__track" cx={size / 2} cy={size / 2} r={r} strokeWidth={stroke} fill="none" />
        <circle
          className="pt-ring__bar"
          cx={size / 2}
          cy={size / 2}
          r={r}
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c - (c * clamped) / 100}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      <span className="pt-ring__label">{label ?? `${clamped}%`}</span>
    </span>
  );
}

/* ── Cartão de métrica ── */

export function PtStatCard({
  label,
  value,
  hint,
  icon,
  tone = 'accent',
  delay = 0,
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  icon?: ReactNode;
  tone?: PtTone;
  delay?: number;
}) {
  return (
    <motion.div
      className={`pt-stat pt-stat--${tone}`}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="pt-stat__top">
        <span className="pt-stat__label">{label}</span>
        {icon && <span className="pt-stat__icon">{icon}</span>}
      </div>
      <strong className="pt-stat__value">{value}</strong>
      {hint && <span className="pt-stat__hint">{hint}</span>}
    </motion.div>
  );
}

/* ── Título de seção ── */

export function PtSectionTitle({
  title,
  sub,
  action,
}: {
  title: string;
  sub?: string;
  action?: ReactNode;
}) {
  return (
    <div className="pt-section-title">
      <div>
        <h2>{title}</h2>
        {sub && <p>{sub}</p>}
      </div>
      {action && <div className="pt-section-title__action">{action}</div>}
    </div>
  );
}

/* ── Estado vazio ── */

export function PtEmpty({
  icon,
  title,
  text,
  action,
}: {
  icon?: ReactNode;
  title: string;
  text: string;
  action?: ReactNode;
}) {
  return (
    <div className="pt-empty">
      <span className="pt-empty__icon">{icon}</span>
      <strong>{title}</strong>
      <p>{text}</p>
      {action}
    </div>
  );
}

/* ── Modal (entrada + saída animadas — §12.4 do DESIGN.md) ── */

export function PtModal({
  open,
  onClose,
  title,
  sub,
  children,
  size = 'md',
  footer,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  sub?: string;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg';
  footer?: ReactNode;
}) {
  const presence = useModalPresence(open);
  if (!presence.mounted) return null;
  return (
    <div
      className={`pt-modal${presence.closing ? ' is-closing' : ''}`}
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className={`pt-modal__panel pt-modal__panel--${size}`}>
        <header className="pt-modal__head">
          <div>
            <h3>{title}</h3>
            {sub && <p>{sub}</p>}
          </div>
          <button type="button" className="pt-icon-btn" onClick={onClose} aria-label="Fechar">
            <X size={18} />
          </button>
        </header>
        <div className="pt-modal__body">{children}</div>
        {footer && <footer className="pt-modal__foot">{footer}</footer>}
      </div>
    </div>
  );
}

/* ── Barras semanais ── */

export function PtBars({
  data,
  max,
  height = 64,
}: {
  data: { label: string; count: number; highlight?: boolean }[];
  max?: number;
  height?: number;
}) {
  const peak = Math.max(1, max ?? Math.max(...data.map((d) => d.count)));
  return (
    <div className="pt-bars" style={{ height }} role="img" aria-label="Treinos por dia">
      {data.map((d, i) => (
        <div className="pt-bars__col" key={`${d.label}-${i}`}>
          <div className="pt-bars__track">
            <motion.span
              className={`pt-bars__fill${d.highlight ? ' pt-bars__fill--hot' : ''}`}
              initial={{ height: 0 }}
              animate={{ height: `${Math.max(6, (d.count / peak) * 100)}%` }}
              transition={{ duration: 0.5, delay: i * 0.04, ease: [0.16, 1, 0.3, 1] }}
              title={`${d.label}: ${d.count}`}
            />
          </div>
          <span className="pt-bars__label">{d.label}</span>
        </div>
      ))}
    </div>
  );
}
