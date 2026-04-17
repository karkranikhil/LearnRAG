import { useEffect, useRef, useState } from 'react';

interface Props {
  chart: string;
  caption?: string;
}

let initDone = false;

/** Decode HTML entities that Astro/MDX may inject into the chart string */
function decodeHtml(html: string): string {
  if (typeof document === 'undefined') return html;
  const txt = document.createElement('textarea');
  txt.innerHTML = html;
  return txt.value;
}

export default function MermaidDiagram({ chart, caption }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<'loading' | 'done' | 'error'>('loading');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    // Only run in browser
    if (typeof window === 'undefined') return;

    let cancelled = false;

    (async () => {
      try {
        const mermaid = (await import('mermaid')).default;

        if (!initDone) {
          mermaid.initialize({
            startOnLoad: false,
            theme: 'dark',
            securityLevel: 'loose',
            themeVariables: {
              primaryColor: '#a855f7',
              primaryTextColor: '#e2e8f0',
              primaryBorderColor: '#2D3148',
              lineColor: '#a855f7',
              secondaryColor: '#1A1D27',
              tertiaryColor: '#0F1117',
            },
          });
          initDone = true;
        }

        if (cancelled || !containerRef.current) return;

        // Generate unique ID
        const id = `m${Date.now()}${Math.random().toString(36).slice(2, 6)}`;

        // Decode HTML entities (Astro escapes > in --> to &gt;)
        const decodedChart = decodeHtml(chart);
        const { svg } = await mermaid.render(id, decodedChart);

        if (cancelled || !containerRef.current) return;

        // Remove any script tags for safety, then insert
        containerRef.current.innerHTML = svg.replace(/<script[\s\S]*?<\/script>/gi, '');
        setStatus('done');
      } catch (err: any) {
        if (!cancelled) {
          const msg = err?.message || err?.str || String(err);
          setErrorMsg(msg);
          setStatus('error');
        }
      }
    })();

    return () => { cancelled = true; };
  }, [chart]);

  return (
    <figure style={{ margin: '1.5rem 0' }}>
      <div
        ref={containerRef}
        style={{
          background: 'rgba(30,26,41,0.5)',
          border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: '0.75rem',
          padding: '1rem',
          overflow: 'auto',
          textAlign: 'center',
          minHeight: status === 'loading' ? '80px' : undefined,
          backdropFilter: 'blur(4px)',
        }}
      >
        {status === 'loading' && <span style={{ color: '#636363', fontSize: '0.8125rem' }}>Loading diagram...</span>}
        {status === 'error' && (
          <div style={{ color: '#f87171', fontSize: '0.75rem', textAlign: 'left' }}>
            <div style={{ marginBottom: '0.375rem' }}>Diagram render error</div>
            <pre style={{ margin: 0, fontSize: '0.6875rem', color: '#8b8b8b', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{errorMsg}</pre>
          </div>
        )}
      </div>
      {caption && (
        <figcaption style={{ textAlign: 'center', fontSize: '0.8125rem', opacity: 0.7, marginTop: '0.5rem' }}>
          {caption}
        </figcaption>
      )}
    </figure>
  );
}
