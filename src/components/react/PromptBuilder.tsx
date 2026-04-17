import { useState, useMemo } from 'react';

const DEFAULT_SYSTEM = `You are a helpful assistant that answers questions based on the provided context.
Only use information from the context below. If the context doesn't contain the answer, say "I don't have enough information to answer that."
Always cite which chunk your answer is based on.`;

const SAMPLE_CHUNKS = [
  { id: 1, text: "ChromaDB stores embeddings using DuckDB as its default backend. It supports both in-memory and persistent storage modes. For persistent storage, data is saved to a local directory." },
  { id: 2, text: "Qdrant is a vector database built in Rust that supports both dense and sparse vectors. It offers a free cloud tier with 1GB of storage and built-in hybrid search capabilities." },
  { id: 3, text: "FAISS (Facebook AI Similarity Search) is a library for efficient similarity search. Unlike ChromaDB and Qdrant, it's not a database — it's a library that requires you to handle persistence yourself." },
];

const DEFAULT_QUERY = "Which vector database should I use for a quick prototype?";

function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

export default function PromptBuilder() {
  const [systemPrompt, setSystemPrompt] = useState(DEFAULT_SYSTEM);
  const chunks = SAMPLE_CHUNKS;
  const [query, setQuery] = useState(DEFAULT_QUERY);
  const [chunkOrder, setChunkOrder] = useState([0, 1, 2]);

  const orderedChunks = chunkOrder.map(i => chunks[i]);

  const assembledPrompt = useMemo(() => {
    const contextBlock = orderedChunks
      .map((c, i) => `[Chunk ${i + 1}]: ${c.text}`)
      .join('\n\n');
    return `SYSTEM: ${systemPrompt}\n\n---\nCONTEXT:\n${contextBlock}\n---\n\nUSER QUESTION: ${query}`;
  }, [systemPrompt, orderedChunks, query]);

  const systemTokens = estimateTokens(systemPrompt);
  const contextTokens = estimateTokens(orderedChunks.map(c => c.text).join(' '));
  const queryTokens = estimateTokens(query);
  const totalTokens = systemTokens + contextTokens + queryTokens + 20; // overhead

  const moveChunk = (from: number, to: number) => {
    const newOrder = [...chunkOrder];
    const [moved] = newOrder.splice(from, 1);
    newOrder.splice(to, 0, moved);
    setChunkOrder(newOrder);
  };

  return (
    <div style={{
      background: 'var(--sl-color-bg-nav)',
      border: '1px solid var(--sl-color-hairline)',
      borderRadius: '0.75rem',
      padding: '1.5rem',
      margin: '1.5rem 0',
    }}>
      <h3 style={{ margin: '0 0 1rem', fontSize: '1rem' }}>Try It: The Prompt Builder</h3>

      {/* System prompt */}
      <div style={{ marginBottom: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.375rem' }}>
          <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#A855F7' }}>System Prompt</label>
          <span style={{ fontSize: '0.6875rem', fontFamily: 'var(--sl-font-mono)', color: '#A855F7' }}>~{systemTokens} tokens</span>
        </div>
        <textarea
          value={systemPrompt}
          onChange={e => setSystemPrompt(e.target.value)}
          rows={3}
          style={{
            width: '100%', padding: '0.625rem', background: '#A855F708', border: '1px solid #A855F733',
            borderRadius: '0.375rem', color: 'var(--sl-color-text)', fontSize: '0.8125rem',
            fontFamily: 'var(--sl-font-mono)', resize: 'vertical',
          }}
        />
      </div>

      {/* Retrieved chunks (draggable order) */}
      <div style={{ marginBottom: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.375rem' }}>
          <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#22C55E' }}>
            Retrieved Chunks (drag to reorder)
          </label>
          <span style={{ fontSize: '0.6875rem', fontFamily: 'var(--sl-font-mono)', color: '#22C55E' }}>~{contextTokens} tokens</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
          {orderedChunks.map((chunk, i) => (
            <div key={chunk.id} style={{
              padding: '0.625rem', background: '#22C55E08', border: '1px solid #22C55E33',
              borderRadius: '0.375rem', fontSize: '0.8125rem',
              display: 'flex', alignItems: 'flex-start', gap: '0.5rem',
            }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.125rem', flexShrink: 0 }}>
                <button
                  onClick={() => i > 0 && moveChunk(i, i - 1)}
                  disabled={i === 0}
                  style={{
                    background: 'transparent', border: 'none', color: i === 0 ? '#2D3148' : '#22C55E',
                    cursor: i === 0 ? 'default' : 'pointer', fontSize: '0.75rem', padding: '0',
                  }}
                >&#9650;</button>
                <button
                  onClick={() => i < orderedChunks.length - 1 && moveChunk(i, i + 1)}
                  disabled={i === orderedChunks.length - 1}
                  style={{
                    background: 'transparent', border: 'none',
                    color: i === orderedChunks.length - 1 ? '#2D3148' : '#22C55E',
                    cursor: i === orderedChunks.length - 1 ? 'default' : 'pointer',
                    fontSize: '0.75rem', padding: '0',
                  }}
                >&#9660;</button>
              </div>
              <div>
                <span style={{ fontWeight: 600, color: '#22C55E', fontSize: '0.75rem' }}>[Chunk {i + 1}] </span>
                {chunk.text}
              </div>
            </div>
          ))}
        </div>
        <p style={{ fontSize: '0.6875rem', color: '#F59E0B', margin: '0.5rem 0 0', opacity: 0.8 }}>
          Tip: LLMs pay more attention to chunks at the beginning and end. Try putting your most important chunk first or last.
        </p>
      </div>

      {/* User query */}
      <div style={{ marginBottom: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.375rem' }}>
          <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#a855f7' }}>User Query</label>
          <span style={{ fontSize: '0.6875rem', fontFamily: 'var(--sl-font-mono)', color: '#a855f7' }}>~{queryTokens} tokens</span>
        </div>
        <input
          type="text" value={query} onChange={e => setQuery(e.target.value)}
          style={{
            width: '100%', padding: '0.625rem', background: '#a855f708', border: '1px solid #a855f733',
            borderRadius: '0.375rem', color: 'var(--sl-color-text)', fontSize: '0.875rem',
          }}
        />
      </div>

      {/* Assembled prompt */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.375rem' }}>
          <label style={{ fontSize: '0.8125rem', fontWeight: 600 }}>Assembled Prompt</label>
          <span style={{ fontSize: '0.6875rem', fontFamily: 'var(--sl-font-mono)', color: totalTokens > 4000 ? '#EF4444' : '#94a3b8' }}>
            ~{totalTokens} total tokens
          </span>
        </div>
        <pre style={{
          padding: '0.75rem', background: 'var(--sl-color-bg)', border: '1px solid var(--sl-color-hairline)',
          borderRadius: '0.5rem', fontSize: '0.75rem', whiteSpace: 'pre-wrap', wordBreak: 'break-word',
          maxHeight: '200px', overflow: 'auto', lineHeight: 1.5, margin: 0,
        }}>
          {assembledPrompt}
        </pre>
      </div>
    </div>
  );
}
