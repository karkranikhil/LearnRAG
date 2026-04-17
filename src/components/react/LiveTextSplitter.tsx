import { useState, useMemo } from 'react';
import { chunkText, type ChunkStrategy } from '../../lib/chunking';

const COLORS = [
  '#3B82F6', '#22C55E', '#F59E0B', '#EF4444', '#A855F7',
  '#EC4899', '#14B8A6', '#F97316', '#6366F1', '#84CC16',
];

const sampleText = `Retrieval-Augmented Generation (RAG) is a technique that combines the power of large language models with external knowledge retrieval. Instead of relying solely on what the model learned during training, RAG systems first search through a collection of documents to find relevant information, then use that information to generate more accurate and up-to-date responses.

The key insight behind RAG is simple: language models are great at understanding and generating text, but they have a fixed knowledge cutoff and can hallucinate facts. By giving the model access to external documents at query time, we get the best of both worlds — the model's language understanding plus real, verifiable information.

RAG has become the most popular approach for building AI applications that need access to specific knowledge bases, such as customer support bots, internal documentation search, and question-answering systems over private data. It's simpler and cheaper than fine-tuning, and the knowledge base can be updated without retraining the model.`;

export default function LiveTextSplitter() {
  const [text, setText] = useState(sampleText);
  const [strategy, setStrategy] = useState<ChunkStrategy>('sliding-window');
  const [size, setSize] = useState(200);
  const [overlap, setOverlap] = useState(40);

  const chunks = useMemo(() => chunkText(text, strategy, size, overlap), [text, strategy, size, overlap]);

  return (
    <div style={{
      background: 'var(--sl-color-bg-nav)',
      border: '1px solid var(--sl-color-hairline)',
      borderRadius: '0.75rem',
      padding: '1.5rem',
      margin: '1.5rem 0',
    }}>
      <h3 style={{ margin: '0 0 1rem', fontSize: '1rem' }}>Try It: Live Text Splitter</h3>

      {/* Input */}
      <textarea
        value={text}
        onChange={e => setText(e.target.value)}
        placeholder="Paste any text here..."
        rows={5}
        style={{
          width: '100%',
          padding: '0.75rem',
          background: 'var(--sl-color-bg)',
          border: '1px solid var(--sl-color-hairline)',
          borderRadius: '0.5rem',
          color: 'var(--sl-color-text)',
          fontFamily: 'var(--sl-font)',
          fontSize: '0.875rem',
          resize: 'vertical',
          marginBottom: '1rem',
        }}
      />

      {/* Controls */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
        <div>
          <label style={{ fontSize: '0.8125rem', fontWeight: 500, display: 'block', marginBottom: '0.375rem' }}>
            Strategy
          </label>
          <select
            value={strategy}
            onChange={e => setStrategy(e.target.value as ChunkStrategy)}
            style={{
              width: '100%',
              padding: '0.5rem',
              background: 'var(--sl-color-bg)',
              border: '1px solid var(--sl-color-hairline)',
              borderRadius: '0.375rem',
              color: 'var(--sl-color-text)',
              fontSize: '0.875rem',
            }}
          >
            <option value="fixed">Fixed-size</option>
            <option value="sentence">Sentence-based</option>
            <option value="sliding-window">Sliding Window</option>
          </select>
        </div>
        <div>
          <label style={{ fontSize: '0.8125rem', fontWeight: 500, display: 'block', marginBottom: '0.375rem' }}>
            Chunk Size: {size} chars
          </label>
          <input
            type="range" min={50} max={1000} step={10} value={size}
            onChange={e => setSize(Number(e.target.value))}
            style={{ width: '100%' }}
          />
        </div>
        <div>
          <label style={{ fontSize: '0.8125rem', fontWeight: 500, display: 'block', marginBottom: '0.375rem' }}>
            Overlap: {overlap} chars
          </label>
          <input
            type="range" min={0} max={Math.floor(size / 2)} step={5} value={overlap}
            onChange={e => setOverlap(Number(e.target.value))}
            style={{ width: '100%' }}
          />
        </div>
      </div>

      {/* Stats */}
      <div style={{ fontSize: '0.8125rem', opacity: 0.7, marginBottom: '1rem' }}>
        {chunks.length} chunks | ~{chunks.reduce((sum, c) => sum + c.tokenEstimate, 0)} tokens total
      </div>

      {/* Highlighted text */}
      <div style={{
        padding: '0.75rem',
        background: 'var(--sl-color-bg)',
        borderRadius: '0.5rem',
        marginBottom: '1rem',
        fontSize: '0.875rem',
        lineHeight: 1.8,
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word',
      }}>
        {chunks.length > 0 ? chunks.map((chunk, i) => (
          <span
            key={chunk.id}
            style={{
              background: `${COLORS[i % COLORS.length]}33`,
              borderBottom: `2px solid ${COLORS[i % COLORS.length]}`,
              borderRadius: '2px',
              padding: '1px 0',
            }}
            title={`Chunk ${i + 1}: ${chunk.text.length} chars, ~${chunk.tokenEstimate} tokens`}
          >
            {chunk.text}
          </span>
        )) : (
          <span style={{ opacity: 0.5 }}>Enter text above to see chunks</span>
        )}
      </div>

      {/* Chunk cards */}
      <div style={{ display: 'grid', gap: '0.5rem', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))' }}>
        {chunks.map((chunk, i) => (
          <div key={chunk.id} style={{
            padding: '0.625rem',
            background: `${COLORS[i % COLORS.length]}11`,
            border: `1px solid ${COLORS[i % COLORS.length]}44`,
            borderRadius: '0.375rem',
            fontSize: '0.75rem',
          }}>
            <div style={{ fontWeight: 600, color: COLORS[i % COLORS.length], marginBottom: '0.25rem' }}>
              Chunk {i + 1} • {chunk.text.length} chars • ~{chunk.tokenEstimate} tokens
            </div>
            <div style={{ opacity: 0.8, lineHeight: 1.4, maxHeight: '60px', overflow: 'hidden' }}>
              {chunk.text}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
