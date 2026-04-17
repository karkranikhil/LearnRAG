import { useState, useEffect } from 'react';
import { BadgeIcons } from './icons';

// oklch equivalents as hex for React inline styles
// background: oklch(0.1 0.005 285) → #16131e
// card: oklch(0.14 0.005 285) → #1e1a29
// foreground: oklch(0.95 0 0) → #f0f0f0
// muted: oklch(0.6 0 0) → #8b8b8b
// muted-dim: oklch(0.45 0 0) → #636363
// primary: oklch(0.65 0.281 293) → #a855f7
// primary-light: oklch(0.7 0.2 293) → #b87dff
const C = {
  bg: '#16131e',
  card: 'rgba(30,26,41,0.5)',
  fg: '#f0f0f0',
  muted: '#8b8b8b',
  dim: '#636363',
  primary: '#a855f7',
  primaryLight: '#b87dff',
  border: 'rgba(255,255,255,0.08)',
  borderLight: 'rgba(255,255,255,0.06)',
  green: '#4ade80',
  amber: '#fbbf24',
};

interface Props {
  chapterNumber: number;
  totalChapters?: number;
  badge: string;
  readTime: number;
}

const badgeConfig: Record<string, { color: string; bg: string; borderColor: string; label: string; iconKey: keyof typeof BadgeIcons }> = {
  explorer: { color: C.primaryLight, bg: 'rgba(168,85,247,0.08)', borderColor: 'rgba(168,85,247,0.2)', label: 'Explorer', iconKey: 'explorer' },
  builder: { color: C.primaryLight, bg: 'rgba(168,85,247,0.08)', borderColor: 'rgba(168,85,247,0.2)', label: 'Builder', iconKey: 'builder' },
  engineer: { color: C.green, bg: 'rgba(74,222,128,0.1)', borderColor: 'rgba(74,222,128,0.2)', label: 'Engineer', iconKey: 'engineer' },
  architect: { color: C.amber, bg: 'rgba(251,191,36,0.1)', borderColor: 'rgba(251,191,36,0.2)', label: 'Architect', iconKey: 'architect' },
};

export default function ChapterProgress({ chapterNumber, totalChapters = 8, badge, readTime }: Props) {
  const [, forceUpdate] = useState(0);

  useEffect(() => {
    const update = () => forceUpdate(n => n + 1);
    update();
    window.addEventListener('learnrag-progress', update);
    return () => window.removeEventListener('learnrag-progress', update);
  }, []);

  const pct = (chapterNumber / totalChapters) * 100;
  const bc = badgeConfig[badge] || badgeConfig.explorer;
  const Icon = BadgeIcons[bc.iconKey];

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '0.875rem',
      padding: '0.75rem 1rem',
      background: C.card,
      border: `1px solid ${C.border}`,
      borderRadius: '0.75rem',
      marginBottom: '1.5rem',
      flexWrap: 'wrap',
      fontSize: '0.875rem',
      backdropFilter: 'blur(4px)',
    }}>
      <span style={{ fontWeight: 600, color: C.fg, whiteSpace: 'nowrap' }}>
        Chapter {chapterNumber} of {totalChapters}
      </span>
      <div style={{
        flex: 1,
        minWidth: '80px',
        height: '3px',
        background: C.borderLight,
        borderRadius: '2px',
        overflow: 'hidden',
      }}>
        <div style={{
          width: `${pct}%`,
          height: '100%',
          background: `linear-gradient(90deg, ${C.primary}99, ${C.primary})`,
          borderRadius: '2px',
          transition: 'width 0.3s ease',
        }} />
      </div>
      <span style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.375rem',
        padding: '0.25rem 0.625rem',
        borderRadius: '9999px',
        fontSize: '0.75rem',
        fontWeight: 600,
        background: bc.bg,
        color: bc.color,
        border: `1px solid ${bc.borderColor}`,
      }}>
        <Icon size={12} strokeWidth={2.5} />
        {bc.label}
      </span>
      <span style={{ color: C.dim, fontSize: '0.8125rem', whiteSpace: 'nowrap' }}>
        ~{readTime} min
      </span>
    </div>
  );
}
