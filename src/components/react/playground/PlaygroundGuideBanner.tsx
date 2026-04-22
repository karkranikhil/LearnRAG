import { useEffect, useState } from 'react';

export type PlaygroundGuideVariant = 'salesforce' | 'generic';

const STORAGE_KEY: Record<PlaygroundGuideVariant, string> = {
  salesforce: 'learnrag-playground-guide-dismissed-salesforce',
  generic: 'learnrag-playground-guide-dismissed-generic',
};

interface PlaygroundGuideBannerProps {
  variant: PlaygroundGuideVariant;
  /** Increment from parent (e.g. header "Tips") to reopen the guide */
  reopenSignal?: number;
}

export default function PlaygroundGuideBanner({ variant, reopenSignal = 0 }: PlaygroundGuideBannerProps) {
  const [visible, setVisible] = useState(false);
  const [mounted, setMounted] = useState(false);

  const accent = variant === 'salesforce'
    ? { border: 'rgba(168,85,247,0.35)', bg: 'rgba(168,85,247,0.06)', title: '#e9d5ff', mono: '#c4b5fd' }
    : { border: 'rgba(59,130,246,0.35)', bg: 'rgba(59,130,246,0.06)', title: '#dbeafe', mono: '#93c5fd' };

  useEffect(() => {
    setMounted(true);
    try {
      setVisible(localStorage.getItem(STORAGE_KEY[variant]) !== '1');
    } catch {
      setVisible(true);
    }
  }, [variant]);

  useEffect(() => {
    if (reopenSignal > 0) setVisible(true);
  }, [reopenSignal]);

  const dismiss = () => {
    try {
      localStorage.setItem(STORAGE_KEY[variant], '1');
    } catch {
      /* ignore */
    }
    setVisible(false);
  };

  if (!mounted || !visible) return null;

  const steps =
    variant === 'salesforce'
      ? [
          'Pick any sample card below to simulate a Data Stream load.',
          'Use Next to walk DLO → DMO → Chunking → Embedding → Retriever → Generate.',
          'Watch the Operations Runbook on the right update as you progress.',
        ]
      : [
          'Choose a sample document under Ingest (or load text).',
          'Press Next through Chunking → Embedding → Search.',
          'Open Generate to compose an answer from retrieved chunks.',
        ];

  return (
    <div
      style={{
        padding: '0 1.5rem',
        paddingTop: '0.75rem',
        paddingBottom: '0.5rem',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        background: 'rgba(22,19,30,0.55)',
      }}
    >
      <div
        style={{
          maxWidth: '1400px',
          margin: '0 auto',
          padding: '0.875rem 1rem',
          borderRadius: '0.75rem',
          border: `1px solid ${accent.border}`,
          background: accent.bg,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 280px', minWidth: 0 }}>
            <div style={{ fontSize: '0.6875rem', fontFamily: "'JetBrains Mono', monospace", color: accent.mono, letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 700, marginBottom: '0.35rem' }}>
              {variant === 'salesforce' ? 'Start here — Data Cloud-style pipeline' : 'Start here — generic RAG pipeline'}
            </div>
            <div style={{ fontSize: '0.9375rem', fontWeight: 700, color: accent.title, marginBottom: '0.5rem', letterSpacing: '-0.02em' }}>
              {variant === 'salesforce'
                ? 'Visualize how unstructured text flows through ingestion-style stages into retrieval.'
                : 'See each stage of RAG in your browser with visible artifacts at every step.'}
            </div>
            <ol style={{ margin: 0, paddingLeft: '1.25rem', fontSize: '0.8125rem', color: '#a8a8a8', lineHeight: 1.55 }}>
              {steps.map((s, i) => (
                <li key={i} style={{ marginBottom: i === steps.length - 1 ? 0 : '0.25rem' }}>{s}</li>
              ))}
            </ol>
          </div>
          <button
            type="button"
            onClick={dismiss}
            style={{
              flexShrink: 0,
              padding: '0.45rem 0.9rem',
              fontSize: '0.8125rem',
              fontWeight: 600,
              borderRadius: '0.5rem',
              border: '1px solid rgba(255,255,255,0.14)',
              background: 'rgba(22,19,30,0.65)',
              color: '#e5e5e5',
              cursor: 'pointer',
              fontFamily: "'Inter', sans-serif",
            }}
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}

/** Always visible under the Salesforce playground header — keeps expectations honest without repeating the full guide */
export function SalesforceFidelityStrip() {
  return (
    <div
      style={{
        padding: '0 1.5rem',
        paddingBottom: '0.65rem',
        background: 'rgba(22,19,30,0.35)',
        borderBottom: '1px solid rgba(255,255,255,0.04)',
      }}
    >
      <p style={{ maxWidth: '1400px', margin: '0 auto', fontSize: '0.75rem', color: '#6b7280', lineHeight: 1.45 }}>
        <span style={{ color: '#94a3b8' }}>Note:</span> Educational visualization of ingestion and retrieval stages inspired by Data Cloud-style thinking — not an official Salesforce product simulator; real orgs differ in naming, services, and behavior.
      </p>
    </div>
  );
}
