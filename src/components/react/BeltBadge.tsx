import type { BadgeId } from '../../lib/progress';
import { BadgeIcons } from './icons';

const config: Record<string, { label: string; color: string; borderStyle: string; iconKey: keyof typeof BadgeIcons }> = {
  none: { label: 'Locked', color: '#64748B', borderStyle: 'dashed', iconKey: 'locked' },
  explorer: { label: 'Explorer', color: '#94A3B8', borderStyle: 'dashed', iconKey: 'explorer' },
  builder: { label: 'Builder', color: '#3B82F6', borderStyle: 'solid', iconKey: 'builder' },
  engineer: { label: 'Engineer', color: '#22C55E', borderStyle: 'solid', iconKey: 'engineer' },
  architect: { label: 'Architect', color: '#F59E0B', borderStyle: 'solid', iconKey: 'architect' },
};

interface Props {
  badge: BadgeId;
  earned?: boolean;
  size?: 'sm' | 'md';
}

export default function BadgeBadge({ badge, earned = true, size = 'md' }: Props) {
  const c = config[badge] || config.none;
  const isLocked = !earned;
  const iconSize = size === 'sm' ? 12 : 14;
  const fontSize = size === 'sm' ? '0.75rem' : '0.875rem';
  const padding = size === 'sm' ? '0.125rem 0.5rem' : '0.25rem 0.75rem';
  const IconComponent = isLocked ? BadgeIcons.locked : BadgeIcons[c.iconKey];

  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '0.375rem',
      padding,
      borderRadius: '0.375rem',
      fontSize,
      fontWeight: 600,
      background: isLocked ? '#1A1D27' : `${c.color}12`,
      color: isLocked ? '#64748B' : c.color,
      border: `1px ${isLocked ? 'dashed' : c.borderStyle} ${isLocked ? '#2D3148' : `${c.color}33`}`,
      opacity: isLocked ? 0.5 : 1,
    }}>
      <IconComponent size={iconSize} strokeWidth={2} />
      {isLocked ? 'Locked' : c.label}
    </span>
  );
}
