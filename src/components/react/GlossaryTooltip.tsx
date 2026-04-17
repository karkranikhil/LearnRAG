import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import glossary from '../../data/glossary.json';

interface Props {
  term: string;
  children?: React.ReactNode;
}

export default function GlossaryTooltip({ term, children }: Props) {
  const [show, setShow] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [tooltipPos, setTooltipPos] = useState<{ top: number; left: number }>({ top: 0, left: 0 });
  const ref = useRef<HTMLSpanElement>(null);
  const definition = (glossary as Record<string, string>)[term];

  if (!definition) return <>{children || term}</>;

  const updatePosition = () => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    setTooltipPos({
      top: rect.top - 8,
      left: rect.left + rect.width / 2,
    });
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!show) return;
    updatePosition();
    window.addEventListener('scroll', updatePosition, true);
    window.addEventListener('resize', updatePosition);
    return () => {
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
    };
  }, [show]);

  return (
    <span
      ref={ref}
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
      onFocus={() => setShow(true)}
      onBlur={() => setShow(false)}
      tabIndex={0}
      style={{ position: 'relative', cursor: 'help' }}
    >
      <span style={{
        borderBottom: '1px dashed var(--sl-color-accent)',
        color: 'var(--sl-color-text-accent)',
      }}>
        {children || term}
      </span>
      {mounted && show && createPortal(
        <span style={{
          position: 'fixed',
          top: `${tooltipPos.top}px`,
          left: `${tooltipPos.left}px`,
          transform: 'translate(-50%, -100%)',
          background: '#1a1625',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '0.75rem',
          padding: '0.75rem 0.875rem',
          fontSize: '0.8125rem',
          lineHeight: 1.5,
          color: '#e0e0e0',
          width: '280px',
          maxWidth: 'min(90vw, 280px)',
          zIndex: 9999,
          boxShadow: '0 8px 24px rgba(0,0,0,0.5), 0 0 0 1px rgba(168,85,247,0.08)',
          pointerEvents: 'none',
          backdropFilter: 'blur(12px)',
        }}>
          <strong style={{ color: '#b87dff' }}>{term}</strong>
          <br />
          {definition}
        </span>,
        document.body
      )}
    </span>
  );
}
