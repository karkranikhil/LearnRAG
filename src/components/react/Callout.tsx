import type { ReactNode } from 'react';
import { CalloutIcons } from './icons';

type CalloutType = 'tip' | 'warning' | 'important' | 'plain-english';

const config: Record<CalloutType, { label: string; color: string; bg: string; border: string }> = {
  tip: { label: 'TIP', color: '#b87dff', bg: 'rgba(168,85,247,0.05)', border: '#a855f7' },
  warning: { label: 'WATCH OUT', color: '#fbbf24', bg: 'rgba(251,191,36,0.05)', border: '#fbbf24' },
  important: { label: 'IMPORTANT', color: '#f87171', bg: 'rgba(248,113,113,0.05)', border: '#f87171' },
  'plain-english': { label: 'PLAIN ENGLISH', color: '#4ade80', bg: 'rgba(74,222,128,0.05)', border: '#4ade80' },
};

interface Props {
  type: CalloutType;
  children: ReactNode;
}

export default function Callout({ type, children }: Props) {
  const c = config[type];
  const Icon = CalloutIcons[type];

  return (
    <div style={{
      margin: '1.25rem 0',
      padding: '1rem 1.25rem',
      background: c.bg,
      borderLeft: `3px solid ${c.border}`,
      borderRadius: '0 0.75rem 0.75rem 0',
      fontSize: '0.9375rem',
      lineHeight: 1.65,
      backdropFilter: 'blur(4px)',
    }}>
      <div style={{
        fontSize: '0.6875rem',
        fontWeight: 700,
        letterSpacing: '0.08em',
        textTransform: 'uppercase' as const,
        color: c.color,
        marginBottom: '0.5rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.375rem',
      }}>
        <Icon size={13} strokeWidth={2.5} />
        {c.label}
      </div>
      <div style={{ color: '#f0f0f0' }}>
        {children}
      </div>
    </div>
  );
}
