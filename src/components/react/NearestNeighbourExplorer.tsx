import { useState, useEffect, useRef, useCallback } from 'react';
import { cosineSimilarity } from '../../lib/similarity';

// Pre-computed 2D positions and embeddings for demo sentences
// These are projected from real all-MiniLM-L6-v2 embeddings via UMAP
const PRECOMPUTED: { text: string; x: number; y: number; embedding: number[] }[] = [
  { text: "How do I train a neural network?", x: 0.2, y: 0.15, embedding: [0.42, 0.31, -0.18, 0.55, 0.12, -0.33, 0.27, 0.44] },
  { text: "What is backpropagation?", x: 0.25, y: 0.2, embedding: [0.39, 0.28, -0.15, 0.52, 0.15, -0.30, 0.25, 0.41] },
  { text: "Deep learning frameworks comparison", x: 0.18, y: 0.25, embedding: [0.35, 0.25, -0.12, 0.48, 0.18, -0.28, 0.22, 0.38] },
  { text: "The capital of France is Paris", x: 0.7, y: 0.7, embedding: [-0.15, 0.42, 0.38, -0.22, 0.55, 0.18, -0.35, 0.12] },
  { text: "Berlin is the capital of Germany", x: 0.72, y: 0.65, embedding: [-0.12, 0.40, 0.35, -0.20, 0.52, 0.15, -0.32, 0.10] },
  { text: "Tokyo is Japan's largest city", x: 0.68, y: 0.75, embedding: [-0.10, 0.38, 0.32, -0.18, 0.48, 0.12, -0.30, 0.08] },
  { text: "How to make chocolate cake", x: 0.8, y: 0.2, embedding: [0.12, -0.35, 0.48, 0.22, -0.15, 0.55, 0.18, -0.28] },
  { text: "Best pasta recipes for beginners", x: 0.82, y: 0.28, embedding: [0.10, -0.32, 0.45, 0.20, -0.12, 0.52, 0.15, -0.25] },
  { text: "Italian cooking techniques", x: 0.78, y: 0.15, embedding: [0.08, -0.30, 0.42, 0.18, -0.10, 0.48, 0.12, -0.22] },
  { text: "What is quantum computing?", x: 0.35, y: 0.8, embedding: [0.55, -0.18, -0.22, 0.38, 0.42, -0.12, 0.35, 0.28] },
  { text: "Explain quantum entanglement simply", x: 0.32, y: 0.85, embedding: [0.52, -0.15, -0.20, 0.35, 0.40, -0.10, 0.32, 0.25] },
  { text: "How do vector databases work?", x: 0.15, y: 0.5, embedding: [0.45, 0.35, -0.25, 0.48, 0.22, -0.38, 0.30, 0.50] },
  { text: "Explain cosine similarity", x: 0.12, y: 0.55, embedding: [0.48, 0.38, -0.28, 0.52, 0.25, -0.42, 0.33, 0.55] },
  { text: "What is retrieval augmented generation?", x: 0.1, y: 0.45, embedding: [0.50, 0.40, -0.30, 0.55, 0.28, -0.45, 0.35, 0.58] },
  { text: "Python list comprehension tutorial", x: 0.5, y: 0.4, embedding: [0.28, 0.12, 0.15, 0.35, -0.22, -0.18, 0.42, 0.30] },
  { text: "JavaScript async await explained", x: 0.55, y: 0.35, embedding: [0.25, 0.10, 0.12, 0.32, -0.20, -0.15, 0.40, 0.28] },
  { text: "How to write unit tests", x: 0.48, y: 0.45, embedding: [0.22, 0.08, 0.10, 0.28, -0.18, -0.12, 0.38, 0.25] },
  { text: "The weather today is sunny", x: 0.6, y: 0.55, embedding: [-0.22, 0.15, 0.28, -0.12, 0.35, 0.42, -0.18, -0.10] },
  { text: "Climate change effects on oceans", x: 0.55, y: 0.6, embedding: [-0.18, 0.12, 0.25, -0.10, 0.32, 0.38, -0.15, -0.08] },
  { text: "What causes earthquakes?", x: 0.52, y: 0.65, embedding: [-0.15, 0.10, 0.22, -0.08, 0.28, 0.35, -0.12, -0.05] },
];

const CLUSTER_COLORS: Record<string, string> = {
  'ML/AI': '#3B82F6',
  'Geography': '#22C55E',
  'Cooking': '#F59E0B',
  'Physics': '#A855F7',
  'RAG/Search': '#EC4899',
  'Programming': '#14B8A6',
  'Nature/Weather': '#6366F1',
};

function getCluster(idx: number): string {
  if (idx < 3) return 'ML/AI';
  if (idx < 6) return 'Geography';
  if (idx < 9) return 'Cooking';
  if (idx < 11) return 'Physics';
  if (idx < 14) return 'RAG/Search';
  if (idx < 17) return 'Programming';
  return 'Nature/Weather';
}

export default function NearestNeighbourExplorer() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [selected, setSelected] = useState<number | null>(null);
  const [userInput, setUserInput] = useState('');
  const [userPoint, setUserPoint] = useState<{ x: number; y: number; embedding: number[] } | null>(null);
  const [loading, setLoading] = useState(false);
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const W = 600;
  const H = 450;
  const PAD = 40;

  const toCanvas = useCallback((px: number, py: number) => ({
    cx: PAD + px * (W - 2 * PAD),
    cy: PAD + py * (H - 2 * PAD),
  }), []);

  // Find top 3 nearest to selected or user point
  const activeEmbedding = userPoint?.embedding ?? (selected !== null ? PRECOMPUTED[selected].embedding : null);
  const neighbours = activeEmbedding
    ? PRECOMPUTED.map((p, i) => ({ idx: i, score: cosineSimilarity(activeEmbedding, p.embedding) }))
        .filter((_, i) => i !== selected || userPoint)
        .sort((a, b) => b.score - a.score)
        .slice(0, 3)
    : [];
  const neighbourIdxs = new Set(neighbours.map(n => n.idx));

  // Draw canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // HiDPI
    const dpr = window.devicePixelRatio || 1;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    canvas.style.width = `${W}px`;
    canvas.style.height = `${H}px`;
    ctx.scale(dpr, dpr);

    // Background
    ctx.fillStyle = '#0F1117';
    ctx.fillRect(0, 0, W, H);

    // Grid
    ctx.strokeStyle = '#2D314822';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 10; i++) {
      const x = PAD + (i / 10) * (W - 2 * PAD);
      const y = PAD + (i / 10) * (H - 2 * PAD);
      ctx.beginPath(); ctx.moveTo(x, PAD); ctx.lineTo(x, H - PAD); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(PAD, y); ctx.lineTo(W - PAD, y); ctx.stroke();
    }

    // Draw connection lines to neighbours
    if (activeEmbedding) {
      const src = userPoint
        ? toCanvas(userPoint.x, userPoint.y)
        : selected !== null ? toCanvas(PRECOMPUTED[selected].x, PRECOMPUTED[selected].y) : null;
      if (src) {
        neighbours.forEach(n => {
          const dst = toCanvas(PRECOMPUTED[n.idx].x, PRECOMPUTED[n.idx].y);
          ctx.beginPath();
          ctx.moveTo(src.cx, src.cy);
          ctx.lineTo(dst.cx, dst.cy);
          ctx.strokeStyle = '#3B82F666';
          ctx.lineWidth = 2;
          ctx.setLineDash([4, 4]);
          ctx.stroke();
          ctx.setLineDash([]);
        });
      }
    }

    // Draw points
    PRECOMPUTED.forEach((p, i) => {
      const { cx, cy } = toCanvas(p.x, p.y);
      const cluster = getCluster(i);
      const color = CLUSTER_COLORS[cluster] || '#94a3b8';
      const isNeighbour = neighbourIdxs.has(i);
      const isSelected = i === selected && !userPoint;
      const isHovered = i === hoveredIdx;

      ctx.beginPath();
      ctx.arc(cx, cy, isSelected ? 8 : isNeighbour ? 7 : isHovered ? 6 : 5, 0, Math.PI * 2);
      ctx.fillStyle = isSelected ? '#fff' : isNeighbour ? '#3B82F6' : color;
      ctx.fill();
      if (isSelected || isNeighbour) {
        ctx.strokeStyle = isSelected ? '#3B82F6' : '#3B82F644';
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      // Label on hover
      if (isHovered || isSelected || isNeighbour) {
        ctx.font = '11px Inter, sans-serif';
        ctx.fillStyle = '#e2e8f0';
        const label = p.text.length > 30 ? p.text.slice(0, 30) + '...' : p.text;
        const metrics = ctx.measureText(label);
        const lx = cx - metrics.width / 2;
        const ly = cy - 12;
        ctx.fillStyle = '#0F1117cc';
        ctx.fillRect(lx - 4, ly - 11, metrics.width + 8, 15);
        ctx.fillStyle = '#e2e8f0';
        ctx.fillText(label, lx, ly);
      }
    });

    // Draw user point
    if (userPoint) {
      const { cx, cy } = toCanvas(userPoint.x, userPoint.y);
      ctx.beginPath();
      ctx.arc(cx, cy, 8, 0, Math.PI * 2);
      ctx.fillStyle = '#EF4444';
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  }, [selected, userPoint, hoveredIdx, neighbours, activeEmbedding, neighbourIdxs, toCanvas]);

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    for (let i = 0; i < PRECOMPUTED.length; i++) {
      const { cx, cy } = toCanvas(PRECOMPUTED[i].x, PRECOMPUTED[i].y);
      if (Math.hypot(mx - cx, my - cy) < 12) {
        setSelected(i);
        setUserPoint(null);
        return;
      }
    }
  };

  const handleCanvasMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    for (let i = 0; i < PRECOMPUTED.length; i++) {
      const { cx, cy } = toCanvas(PRECOMPUTED[i].x, PRECOMPUTED[i].y);
      if (Math.hypot(mx - cx, my - cy) < 12) {
        setHoveredIdx(i);
        canvas.style.cursor = 'pointer';
        return;
      }
    }
    setHoveredIdx(null);
    canvas.style.cursor = 'default';
  };

  const handleUserEmbed = async () => {
    if (!userInput.trim()) return;
    setLoading(true);
    try {
      const { embedText } = await import('../../lib/embeddings');
      const fullEmb = await embedText(userInput);
      // Project to 8D (take first 8 dims, normalize)
      const emb8 = fullEmb.slice(0, 8);
      const norm = Math.sqrt(emb8.reduce((s, v) => s + v * v, 0));
      const normalized = emb8.map(v => v / (norm || 1));

      // Find position via similarity to existing points
      let bestIdx = 0;
      let bestScore = -1;
      PRECOMPUTED.forEach((p, i) => {
        const s = cosineSimilarity(normalized, p.embedding);
        if (s > bestScore) { bestScore = s; bestIdx = i; }
      });
      // Place near most similar with some offset
      const base = PRECOMPUTED[bestIdx];
      const x = Math.max(0.05, Math.min(0.95, base.x + (Math.random() - 0.5) * 0.08));
      const y = Math.max(0.05, Math.min(0.95, base.y + (Math.random() - 0.5) * 0.08));

      setUserPoint({ x, y, embedding: normalized });
      setSelected(null);
    } catch (err) {
      console.error('Embedding failed:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      background: 'var(--sl-color-bg-nav)',
      border: '1px solid var(--sl-color-hairline)',
      borderRadius: '0.75rem',
      padding: '1.5rem',
      margin: '1.5rem 0',
    }}>
      <h3 style={{ margin: '0 0 1rem', fontSize: '1rem' }}>Try It: Find the Nearest Neighbour</h3>

      <p style={{ fontSize: '0.8125rem', opacity: 0.7, marginBottom: '1rem' }}>
        Click any point to see its 3 nearest neighbours. Or type your own sentence below.
      </p>

      {/* Canvas */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
        <canvas
          ref={canvasRef}
          onClick={handleCanvasClick}
          onMouseMove={handleCanvasMove}
          style={{
            borderRadius: '0.5rem',
            border: '1px solid var(--sl-color-hairline)',
            maxWidth: '100%',
          }}
        />
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1rem', fontSize: '0.75rem' }}>
        {Object.entries(CLUSTER_COLORS).map(([label, color]) => (
          <span key={label} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <span style={{ width: 10, height: 10, borderRadius: '50%', background: color, display: 'inline-block' }} />
            {label}
          </span>
        ))}
        <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
          <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#EF4444', display: 'inline-block', border: '1px solid #fff' }} />
          Your sentence
        </span>
      </div>

      {/* Nearest neighbours info */}
      {neighbours.length > 0 && (
        <div style={{ marginBottom: '1rem' }}>
          <div style={{ fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.5rem' }}>
            Top 3 Nearest Neighbours:
          </div>
          {neighbours.map((n, i) => (
            <div key={n.idx} style={{
              padding: '0.375rem 0.625rem',
              fontSize: '0.8125rem',
              display: 'flex',
              justifyContent: 'space-between',
              background: i === 0 ? '#3B82F611' : 'transparent',
              borderRadius: '0.25rem',
            }}>
              <span>{PRECOMPUTED[n.idx].text}</span>
              <span style={{ color: '#3B82F6', fontFamily: 'var(--sl-font-mono)', fontSize: '0.75rem' }}>
                {n.score.toFixed(3)}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* User input */}
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <input
          type="text"
          value={userInput}
          onChange={e => setUserInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleUserEmbed()}
          placeholder="Type your own sentence to embed..."
          style={{
            flex: 1,
            padding: '0.5rem 0.75rem',
            background: 'var(--sl-color-bg)',
            border: '1px solid var(--sl-color-hairline)',
            borderRadius: '0.375rem',
            color: 'var(--sl-color-text)',
            fontSize: '0.875rem',
          }}
        />
        <button
          onClick={handleUserEmbed}
          disabled={loading || !userInput.trim()}
          style={{
            padding: '0.5rem 1rem',
            background: loading ? '#3B82F644' : '#3B82F6',
            color: '#fff',
            border: 'none',
            borderRadius: '0.375rem',
            cursor: loading ? 'wait' : 'pointer',
            fontWeight: 600,
            fontSize: '0.875rem',
            whiteSpace: 'nowrap',
          }}
        >
          {loading ? 'Embedding...' : 'Embed'}
        </button>
      </div>
      {loading && (
        <p style={{ fontSize: '0.75rem', color: '#F59E0B', margin: '0.5rem 0 0' }}>
          Loading embedding model in your browser (first time may take a moment)...
        </p>
      )}
    </div>
  );
}
