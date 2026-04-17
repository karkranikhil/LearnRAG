import { useState } from 'react';

interface Pattern {
  id: string;
  name: string;
  tagline: string;
  color: string;
  when: string[];
  how: string;
  tradeoffs: string;
  example: string;
}

const patterns: Pattern[] = [
  {
    id: 'hyde',
    name: 'HyDE (Hypothetical Document Embeddings)',
    tagline: 'Generate a fake answer first, then search for real documents similar to it.',
    color: '#3B82F6',
    when: ['User queries are vague or poorly worded', 'Questions are abstract (e.g., "What should I know about X?")', 'Your embedding model struggles with question-to-document matching'],
    how: 'Instead of embedding the user\'s question directly, you first ask an LLM to generate a hypothetical answer. Then you embed that hypothetical answer and use it to search your document store. Since the hypothetical answer looks like a document, it matches real documents better than a question would.',
    tradeoffs: 'Adds one extra LLM call per query (latency + cost). The hypothetical answer might be wrong, but that\'s OK — you\'re only using it for search, not as the final answer.',
    example: 'User asks: "Tell me about safety." → HyDE generates: "AI safety encompasses alignment research, red-teaming, and evaluation frameworks..." → This hypothetical doc finds better matches than the vague original query.',
  },
  {
    id: 'decomposition',
    name: 'Query Decomposition',
    tagline: 'Break a complex question into simpler sub-questions, answer each separately.',
    color: '#22C55E',
    when: ['Questions involve comparisons ("Compare X and Y")', 'Questions have multiple parts ("What is X, how does it work, and when should I use it?")', 'Single retrieval misses information spread across multiple document sections'],
    how: 'Use an LLM to split the user\'s question into 2-4 sub-questions. Run retrieval separately for each sub-question. Combine all retrieved chunks and generate a unified answer.',
    tradeoffs: 'Multiplies retrieval calls (one per sub-question). Works brilliantly for complex queries but is overkill for simple ones. Need logic to decide when to decompose.',
    example: 'User asks: "Compare ChromaDB and Qdrant for production use." → Decomposed into: "What are ChromaDB\'s production features?" + "What are Qdrant\'s production features?" + "What are the trade-offs between local and cloud vector databases?"',
  },
  {
    id: 'selfrag',
    name: 'Self-RAG',
    tagline: 'The model decides whether to retrieve, and checks if its answer is grounded.',
    color: '#A855F7',
    when: ['Some questions need retrieval and others don\'t', 'You want the system to self-check for hallucinations', 'You need high reliability with mixed query types'],
    how: 'Train or prompt the model to output special tokens: [Retrieve] (should I search?), [IsRelevant] (is this chunk useful?), [IsSupported] (is my answer grounded?). The model becomes its own quality checker.',
    tradeoffs: 'More complex to implement. Requires either a fine-tuned model or careful prompting. Adds latency from self-checking. But significantly reduces hallucinations.',
    example: 'User asks: "What is 2+2?" → Model: [No Retrieve needed] → "4". User asks: "What\'s our refund policy?" → Model: [Retrieve] → searches docs → generates answer → [IsSupported: Yes] → returns answer.',
  },
  {
    id: 'crag',
    name: 'Corrective RAG (CRAG)',
    tagline: 'If retrieval fails, detect it and fall back to web search.',
    color: '#EF4444',
    when: ['Your document collection has gaps', 'Retrieval sometimes returns irrelevant results', 'You need a safety net for when your knowledge base doesn\'t have the answer'],
    how: 'After retrieval, score the relevance of results. If scores are high → use them normally. If scores are ambiguous → refine the query and retry. If scores are low → fall back to web search or say "I don\'t know."',
    tradeoffs: 'Requires a relevance scoring mechanism (can use the LLM). Web search fallback adds external dependency. But makes your system much more resilient.',
    example: 'User asks about a topic not in your docs → retrieval returns low-scoring chunks → CRAG detects this → falls back to web search → finds the answer → generates response with web citation.',
  },
  {
    id: 'multivector',
    name: 'Multi-Vector Retrieval',
    tagline: 'Store multiple representations of each document for richer matching.',
    color: '#F59E0B',
    when: ['Documents are long and complex', 'Different queries should match different aspects of the same document', 'You want to match against summaries, not just raw text'],
    how: 'For each document, create multiple vectors: one from the full text, one from a summary, one from hypothetical questions the document answers. At query time, search all representations. This gives you more angles to find relevant content.',
    tradeoffs: 'Multiplies storage requirements (3x or more vectors per document). Ingestion is slower (need to generate summaries and questions). But retrieval quality improves significantly for complex documents.',
    example: 'A 10-page technical document gets stored as: [full-text chunks] + [1-paragraph summary embedding] + [5 generated Q&A pair embeddings]. A vague query matches the summary; a specific query matches the Q&A pairs.',
  },
];

const problemMap: { problem: string; patterns: string[] }[] = [
  { problem: 'My queries are vague or abstract', patterns: ['hyde'] },
  { problem: 'My queries are complex multi-part questions', patterns: ['decomposition'] },
  { problem: 'My retrieval sometimes returns irrelevant results', patterns: ['crag', 'multivector'] },
  { problem: 'I need to reduce hallucinations', patterns: ['selfrag', 'crag'] },
  { problem: 'My documents are long and complex', patterns: ['multivector', 'decomposition'] },
  { problem: 'Some questions don\'t need retrieval at all', patterns: ['selfrag'] },
];

export default function PatternSelector() {
  const [mode, setMode] = useState<'browse' | 'diagnose'>('diagnose');
  const [selectedProblem, setSelectedProblem] = useState<string | null>(null);
  const [selectedPattern, setSelectedPattern] = useState<string | null>(null);

  const pattern = patterns.find(p => p.id === selectedPattern);
  const recommendedIds = selectedProblem
    ? problemMap.find(p => p.problem === selectedProblem)?.patterns || []
    : [];

  return (
    <div style={{
      background: 'var(--sl-color-bg-nav)',
      border: '1px solid var(--sl-color-hairline)',
      borderRadius: '0.75rem',
      padding: '1.5rem',
      margin: '1.5rem 0',
    }}>
      <h3 style={{ margin: '0 0 0.75rem', fontSize: '1rem' }}>Which Pattern Do I Need?</h3>

      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
        <button onClick={() => { setMode('diagnose'); setSelectedPattern(null); }}
          style={{ padding: '0.375rem 0.875rem', fontSize: '0.8125rem', borderRadius: '9999px', border: `1px solid ${mode === 'diagnose' ? '#3B82F6' : 'var(--sl-color-hairline)'}`, background: mode === 'diagnose' ? '#3B82F622' : 'transparent', color: 'var(--sl-color-text)', cursor: 'pointer' }}>
          Diagnose My Problem
        </button>
        <button onClick={() => { setMode('browse'); setSelectedProblem(null); }}
          style={{ padding: '0.375rem 0.875rem', fontSize: '0.8125rem', borderRadius: '9999px', border: `1px solid ${mode === 'browse' ? '#3B82F6' : 'var(--sl-color-hairline)'}`, background: mode === 'browse' ? '#3B82F622' : 'transparent', color: 'var(--sl-color-text)', cursor: 'pointer' }}>
          Browse All Patterns
        </button>
      </div>

      {mode === 'diagnose' && !selectedPattern && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
          <p style={{ fontSize: '0.8125rem', opacity: 0.7, margin: '0 0 0.5rem' }}>What problem are you facing?</p>
          {problemMap.map(p => (
            <button key={p.problem} onClick={() => { setSelectedProblem(p.problem); setSelectedPattern(p.patterns[0]); }}
              style={{
                padding: '0.625rem 0.875rem', textAlign: 'left', background: selectedProblem === p.problem ? '#3B82F611' : 'var(--sl-color-bg)',
                border: `1px solid ${selectedProblem === p.problem ? '#3B82F644' : 'var(--sl-color-hairline)'}`,
                borderRadius: '0.375rem', color: 'var(--sl-color-text)', cursor: 'pointer', fontSize: '0.875rem',
              }}>
              {p.problem}
            </button>
          ))}
        </div>
      )}

      {mode === 'browse' && !selectedPattern && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '0.5rem' }}>
          {patterns.map(p => (
            <button key={p.id} onClick={() => setSelectedPattern(p.id)}
              style={{
                padding: '0.75rem', textAlign: 'left',
                background: `${p.color}08`, border: `1px solid ${p.color}33`,
                borderRadius: '0.5rem', color: 'var(--sl-color-text)', cursor: 'pointer',
              }}>
              <div style={{ fontWeight: 600, color: p.color, fontSize: '0.875rem', marginBottom: '0.25rem' }}>{p.name}</div>
              <div style={{ fontSize: '0.75rem', opacity: 0.7 }}>{p.tagline}</div>
            </button>
          ))}
        </div>
      )}

      {pattern && (
        <div style={{ marginTop: mode === 'diagnose' ? '1rem' : 0 }}>
          {recommendedIds.length > 1 && (
            <div style={{ display: 'flex', gap: '0.375rem', marginBottom: '0.75rem' }}>
              {recommendedIds.map(id => {
                const rp = patterns.find(p => p.id === id)!;
                return (
                  <button key={id} onClick={() => setSelectedPattern(id)}
                    style={{
                      padding: '0.25rem 0.625rem', fontSize: '0.75rem', borderRadius: '9999px',
                      background: id === selectedPattern ? `${rp.color}22` : 'transparent',
                      border: `1px solid ${id === selectedPattern ? rp.color : 'var(--sl-color-hairline)'}`,
                      color: id === selectedPattern ? rp.color : 'var(--sl-color-text)', cursor: 'pointer',
                    }}>
                    {rp.name.split('(')[0].trim()}
                  </button>
                );
              })}
            </div>
          )}

          <div style={{ padding: '1rem', background: `${pattern.color}08`, border: `1px solid ${pattern.color}33`, borderRadius: '0.5rem' }}>
            <h4 style={{ margin: '0 0 0.25rem', color: pattern.color }}>{pattern.name}</h4>
            <p style={{ fontSize: '0.875rem', opacity: 0.8, margin: '0 0 1rem' }}>{pattern.tagline}</p>

            <div style={{ marginBottom: '0.75rem' }}>
              <div style={{ fontWeight: 600, fontSize: '0.8125rem', marginBottom: '0.375rem' }}>When to use:</div>
              <ul style={{ margin: 0, paddingLeft: '1.25rem', fontSize: '0.8125rem', lineHeight: 1.6 }}>
                {pattern.when.map((w, i) => <li key={i}>{w}</li>)}
              </ul>
            </div>

            <div style={{ marginBottom: '0.75rem' }}>
              <div style={{ fontWeight: 600, fontSize: '0.8125rem', marginBottom: '0.375rem' }}>How it works:</div>
              <p style={{ margin: 0, fontSize: '0.8125rem', lineHeight: 1.6 }}>{pattern.how}</p>
            </div>

            <div style={{ marginBottom: '0.75rem' }}>
              <div style={{ fontWeight: 600, fontSize: '0.8125rem', marginBottom: '0.375rem' }}>Tradeoffs:</div>
              <p style={{ margin: 0, fontSize: '0.8125rem', lineHeight: 1.6, color: '#F59E0B' }}>{pattern.tradeoffs}</p>
            </div>

            <div style={{ padding: '0.625rem', background: 'var(--sl-color-bg)', borderRadius: '0.375rem', fontSize: '0.8125rem' }}>
              <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>Example:</div>
              <p style={{ margin: 0, lineHeight: 1.5, opacity: 0.9 }}>{pattern.example}</p>
            </div>
          </div>

          <button onClick={() => { setSelectedPattern(null); setSelectedProblem(null); }}
            style={{
              marginTop: '0.75rem', padding: '0.375rem 0.875rem', fontSize: '0.8125rem',
              background: 'transparent', border: '1px solid var(--sl-color-hairline)',
              borderRadius: '0.375rem', color: 'var(--sl-color-text)', cursor: 'pointer',
            }}>
            Back to {mode === 'diagnose' ? 'problems' : 'all patterns'}
          </button>
        </div>
      )}
    </div>
  );
}
