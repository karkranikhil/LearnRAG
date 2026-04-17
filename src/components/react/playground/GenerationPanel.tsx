import { useState, useMemo } from 'react';
import { usePlayground } from './usePlaygroundStore';

function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

const DEFAULT_SYSTEM_PROMPT = `You are a helpful assistant that answers questions based on the provided context.

Rules:
- Answer ONLY using information from the context chunks below
- If the context doesn't contain enough information, say "I don't have enough information to answer that based on the provided documents."
- Always cite which chunk(s) your answer is based on, e.g. [Chunk 1], [Chunk 3]
- Be concise and direct`;

export default function GenerationPanel() {
  const { state, dispatch } = usePlayground();
  const [systemPrompt, setSystemPrompt] = useState(DEFAULT_SYSTEM_PROMPT);
  const [showFullPrompt, setShowFullPrompt] = useState(false);

  const hasResults = state.results.length > 0;
  const topChunks = useMemo(() => state.results.slice(0, 5), [state.results]);

  const systemTokens = useMemo(() => estimateTokens(systemPrompt), [systemPrompt]);
  const contextTokens = useMemo(() => estimateTokens(topChunks.map(r => r.chunk.text).join(' ')), [topChunks]);
  const queryTokens = useMemo(() => estimateTokens(state.query), [state.query]);
  const totalTokens = systemTokens + contextTokens + queryTokens + 20;

  const assembledPrompt = useMemo(() => {
    if (!hasResults) return '';
    const contextBlock = topChunks
      .map((r, i) => `[Chunk ${i + 1}] (similarity: ${r.score.toFixed(3)})\n${r.chunk.text}`)
      .join('\n\n');
    return `SYSTEM:\n${systemPrompt}\n\n---\nCONTEXT:\n${contextBlock}\n---\n\nUSER QUESTION:\n${state.query}`;
  }, [systemPrompt, topChunks, state.query, hasResults]);

  const handleGenerate = async () => {
    if (!hasResults || topChunks.length === 0) return;
    dispatch({ type: 'SET_IS_GENERATING', payload: true });

    await new Promise(r => setTimeout(r, 1200));

    // Strip markdown formatting so headers/bold don't leak into the answer
    const stripMarkdown = (text: string) =>
      text
        .replace(/^#+\s+/gm, '')   // ## headings
        .replace(/\*\*(.+?)\*\*/g, '$1')  // **bold**
        .replace(/\*(.+?)\*/g, '$1')      // *italic*
        .replace(/`(.+?)`/g, '$1')        // `code`
        .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // [link](url)
        .replace(/^\s*[-*>]\s+/gm, '')    // list markers / blockquotes
        .trim();

    // Extract meaningful sentences (non-empty, not just symbols)
    const getSentences = (text: string) =>
      stripMarkdown(text)
        .match(/[^.!?\n]+[.!?]+/g)
        ?.map(s => s.trim())
        .filter(s => s.length > 20) ?? [];

    const topSentences = getSentences(topChunks[0].chunk.text);
    const core = topSentences.slice(0, 2).join(' ').trim()
      || stripMarkdown(topChunks[0].chunk.text).slice(0, 300);

    let answerBody = core;

    if (topChunks.length > 1) {
      const supporting = getSentences(topChunks[1].chunk.text);
      const extra = supporting[0]?.trim();
      if (extra && extra !== core) {
        answerBody += `\n\n${extra}`;
      }
    }

    const sourceList = topChunks
      .slice(0, 2)
      .map((r, i) => `[Chunk ${i + 1}] (${r.score.toFixed(3)})`)
      .join(', ');

    const answer = `${answerBody}\n\n---\nSources: ${sourceList}\n\n[Simulated — connect an LLM API for real generation]`;

    dispatch({ type: 'SET_GENERATED_ANSWER', payload: answer });
    dispatch({ type: 'SET_IS_GENERATING', payload: false });
  };

  if (!hasResults) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', color: '#636363' }}>
        Complete the Retrieve step first to generate an answer.
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

      {/* Generated answer — shown first once available */}
      {state.generatedAnswer && (
        <div style={{ padding: '1.25rem', background: 'rgba(168,85,247,0.05)', border: '1px solid rgba(168,85,247,0.2)', borderRadius: '0.75rem' }}>
          <div style={{ fontSize: '0.6875rem', fontWeight: 600, color: '#b87dff', fontFamily: "'JetBrains Mono', monospace", letterSpacing: '0.08em', textTransform: 'uppercase' as const, marginBottom: '0.75rem' }}>
            Generated Answer
          </div>
          {/* Answer body */}
          <div style={{ fontSize: '0.9rem', lineHeight: 1.75, color: '#e0e0e0', whiteSpace: 'pre-wrap', marginBottom: '0.75rem' }}>
            {state.generatedAnswer.split('\n\n---\n')[0]}
          </div>
          {/* Sources + disclaimer */}
          {state.generatedAnswer.includes('---') && (
            <div style={{ borderTop: '1px solid rgba(168,85,247,0.12)', paddingTop: '0.625rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              {state.generatedAnswer.split('\n\n---\n').slice(1).join('\n\n---\n').split('\n').filter(Boolean).map((line, i) => (
                <div key={i} style={{
                  fontSize: '0.75rem',
                  fontFamily: line.startsWith('[Simulated') ? "'Inter', sans-serif" : "'JetBrains Mono', monospace",
                  color: line.startsWith('Sources:') ? '#4ade80' : '#636363',
                  fontStyle: line.startsWith('[Simulated') ? 'italic' : 'normal',
                }}>
                  {line}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Generate button */}
      <button onClick={handleGenerate} disabled={state.isGenerating} style={{
        padding: '0.75rem 2rem', background: state.isGenerating ? 'rgba(168,85,247,0.2)' : '#a855f7',
        color: state.isGenerating ? '#636363' : '#f0f0f0', border: 'none', borderRadius: '0.5rem',
        cursor: state.isGenerating ? 'wait' : 'pointer', fontWeight: 600, fontSize: '0.9375rem',
        alignSelf: 'flex-start', boxShadow: state.isGenerating ? 'none' : '0 0 20px rgba(168,85,247,0.15)',
        transition: 'all 0.15s',
      }}>
        {state.isGenerating ? 'Generating...' : state.generatedAnswer ? 'Regenerate Answer' : 'Generate Answer'}
      </button>

      {/* Divider */}
      <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', marginTop: '0.25rem' }} />

      {/* User query (read-only) */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.375rem' }}>
          <label style={{ fontSize: '0.6875rem', fontWeight: 600, color: '#fbbf24', fontFamily: "'JetBrains Mono', monospace", letterSpacing: '0.08em', textTransform: 'uppercase' as const }}>User Query</label>
          <span style={{ fontSize: '0.6875rem', fontFamily: "'JetBrains Mono', monospace", color: '#636363' }}>~{queryTokens} tokens</span>
        </div>
        <div style={{
          padding: '0.625rem 0.875rem', background: 'rgba(251,191,36,0.04)',
          border: '1px solid rgba(251,191,36,0.1)', borderRadius: '0.5rem',
          fontSize: '0.875rem', color: '#e0e0e0',
        }}>
          {state.query}
        </div>
      </div>

      {/* System prompt (editable) */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.375rem' }}>
          <label style={{ fontSize: '0.6875rem', fontWeight: 600, color: '#b87dff', fontFamily: "'JetBrains Mono', monospace", letterSpacing: '0.08em', textTransform: 'uppercase' as const }}>System Prompt</label>
          <span style={{ fontSize: '0.6875rem', fontFamily: "'JetBrains Mono', monospace", color: '#636363' }}>~{systemTokens} tokens</span>
        </div>
        <textarea value={systemPrompt} onChange={e => setSystemPrompt(e.target.value)} rows={4}
          style={{ width: '100%', padding: '0.625rem', background: 'rgba(22,19,30,0.6)', border: '1px solid rgba(168,85,247,0.15)', borderRadius: '0.5rem', color: '#e0e0e0', fontSize: '0.8125rem', fontFamily: "'JetBrains Mono', monospace", resize: 'vertical', lineHeight: 1.5 }} />
      </div>

      {/* Retrieved chunks (read-only summary) */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.375rem' }}>
          <label style={{ fontSize: '0.6875rem', fontWeight: 600, color: '#4ade80', fontFamily: "'JetBrains Mono', monospace", letterSpacing: '0.08em', textTransform: 'uppercase' as const }}>Retrieved Context ({topChunks.length} chunks)</label>
          <span style={{ fontSize: '0.6875rem', fontFamily: "'JetBrains Mono', monospace", color: '#636363' }}>~{contextTokens} tokens</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          {topChunks.map((r, i) => (
            <div key={r.chunk.id} style={{ padding: '0.5rem 0.625rem', background: 'rgba(74,222,128,0.04)', border: '1px solid rgba(74,222,128,0.08)', borderRadius: '0.375rem', fontSize: '0.75rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.125rem' }}>
                <span style={{ fontWeight: 600, color: '#4ade80', fontSize: '0.6875rem' }}>[Chunk {i + 1}]</span>
                <span style={{ color: '#636363', fontFamily: "'JetBrains Mono', monospace", fontSize: '0.6875rem' }}>{r.score.toFixed(3)}</span>
              </div>
              <div style={{ color: '#8b8b8b', lineHeight: 1.4 }}>{r.chunk.text.slice(0, 120)}{r.chunk.text.length > 120 ? '...' : ''}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Token summary bar */}
      <div style={{
        display: 'flex', gap: '1rem', fontSize: '0.6875rem', padding: '0.625rem 0.875rem',
        background: 'rgba(10,8,16,0.6)', borderRadius: '0.5rem',
        fontFamily: "'JetBrains Mono', monospace", flexWrap: 'wrap',
        alignItems: 'center',
      }}>
        <span style={{ color: '#b87dff' }}>system: ~{systemTokens}</span>
        <span style={{ color: '#4ade80' }}>context: ~{contextTokens}</span>
        <span style={{ color: '#fbbf24' }}>query: ~{queryTokens}</span>
        <span style={{ color: totalTokens > 4000 ? '#f87171' : '#636363', fontWeight: 600 }}>total: ~{totalTokens} tokens</span>
        <span style={{ flex: 1 }} />
        <button onClick={() => setShowFullPrompt(!showFullPrompt)} style={{
          background: 'none', border: 'none', color: '#636363', cursor: 'pointer',
          fontSize: '0.6875rem', fontFamily: "'JetBrains Mono', monospace",
          textDecoration: 'underline', textUnderlineOffset: '2px',
        }}>
          {showFullPrompt ? 'Hide' : 'View'} full prompt
        </button>
      </div>

      {/* Full assembled prompt (collapsible) */}
      {showFullPrompt && (
        <pre style={{
          padding: '0.875rem', background: 'rgba(10,8,16,0.8)',
          border: '1px solid rgba(255,255,255,0.04)', borderRadius: '0.5rem',
          fontSize: '0.75rem', color: '#8b8b8b', whiteSpace: 'pre-wrap', wordBreak: 'break-word',
          maxHeight: '300px', overflow: 'auto', lineHeight: 1.5, margin: 0,
          fontFamily: "'JetBrains Mono', monospace",
        }}>
          {assembledPrompt}
        </pre>
      )}

    </div>
  );
}
