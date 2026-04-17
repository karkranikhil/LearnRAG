import { useState, useEffect } from 'react';
import { getEarnedBadges, type BadgeId } from '../../lib/progress';
import { BadgeIcons } from './icons';

const allBadges: { id: BadgeId; label: string; color: string; iconKey: keyof typeof BadgeIcons }[] = [
  { id: 'explorer', label: 'Explorer', color: '#94A3B8', iconKey: 'explorer' },
  { id: 'builder', label: 'Builder', color: '#3B82F6', iconKey: 'builder' },
  { id: 'engineer', label: 'Engineer', color: '#22C55E', iconKey: 'engineer' },
  { id: 'architect', label: 'Architect', color: '#F59E0B', iconKey: 'architect' },
];

export default function BadgeWall() {
  const [earned, setEarned] = useState<BadgeId[]>([]);

  useEffect(() => {
    const update = () => setEarned(getEarnedBadges());
    update();
    window.addEventListener('learnrag-progress', update);
    return () => window.removeEventListener('learnrag-progress', update);
  }, []);

  return (
    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
      {allBadges.map(b => {
        const isEarned = earned.includes(b.id);
        const Icon = isEarned ? BadgeIcons[b.iconKey] : BadgeIcons.locked;
        return (
          <div
            key={b.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.375rem',
              padding: '0.375rem 0.625rem',
              background: isEarned ? `${b.color}08` : '#1A1D27',
              border: `1px ${isEarned ? 'solid' : 'dashed'} ${isEarned ? `${b.color}33` : '#2D3148'}`,
              borderRadius: '0.375rem',
              fontSize: '0.75rem',
              fontWeight: 600,
              color: isEarned ? b.color : '#64748B',
              opacity: isEarned ? 1 : 0.45,
              transition: 'all 0.3s ease',
            }}
            title={isEarned ? `${b.label} — Earned` : `${b.label} — Locked`}
          >
            <Icon size={13} strokeWidth={2} />
            {b.label}
          </div>
        );
      })}
    </div>
  );
}
