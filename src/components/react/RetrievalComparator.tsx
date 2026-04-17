import { useState } from 'react';

// Simulated retrieval results for different strategies
const DEMO_CORPUS = [
  { id: 1, text: "GPT-4 is a large language model created by OpenAI. It was released in March 2023 and supports multimodal inputs.", keywords: ["gpt-4", "openai", "language model", "multimodal"] },
  { id: 2, text: "Large language models like GPT-4 and Claude can understand and generate text. They are trained on massive datasets of internet text.", keywords: ["language model", "gpt-4", "claude", "text", "trained"] },
  { id: 3, text: "OpenAI's pricing for GPT-4 starts at $30 per million input tokens. The model supports a context window of up to 128k tokens.", keywords: ["openai", "gpt-4", "pricing", "tokens", "context window"] },
  { id: 4, text: "Fine-tuning allows you to customise a model's behaviour by training it on your own data. This is different from RAG.", keywords: ["fine-tuning", "training", "customise", "rag"] },
  { id: 5, text: "Retrieval-Augmented Generation combines search with generation. Instead of memorising facts, the model looks them up at query time.", keywords: ["retrieval", "augmented", "generation", "search", "rag"] },
  { id: 6, text: "Vector databases store embeddings and enable fast similarity search. Popular options include ChromaDB, Qdrant, and FAISS.", keywords: ["vector", "database", "embeddings", "similarity", "chromadb", "qdrant", "faiss"] },
  { id: 7, text: "The transformer architecture uses self-attention to process sequences in parallel. This made modern language models possible.", keywords: ["transformer", "attention", "architecture", "language model"] },
  { id: 8, text: "Cosine similarity measures the angle between two vectors. A score of 1.0 means identical direction (same meaning).", keywords: ["cosine", "similarity", "vectors", "angle", "meaning"] },
];

interface Result {
  id: number;
  text: string;
  score: number;
  method: string;
}

function semanticSearch(query: string): Result[] {
  // Simplified: score by word overlap with semantic-like weighting
  const qWords = query.toLowerCase().split(/\s+/);
  return DEMO_CORPUS.map(doc => {
    const docLower = doc.text.toLowerCase();
    let score = 0;
    qWords.forEach(w => {
      if (docLower.includes(w)) score += 0.15;
      doc.keywords.forEach(kw => {
        if (kw.includes(w) || w.includes(kw)) score += 0.1;
      });
    });
    return { id: doc.id, text: doc.text, score: Math.min(score, 0.95), method: 'semantic' };
  }).sort((a, b) => b.score - a.score).slice(0, 3);
}

function keywordSearch(query: string): Result[] {
  const qWords = query.toLowerCase().split(/\s+/);
  return DEMO_CORPUS.map(doc => {
    let matches = 0;
    qWords.forEach(w => {
      if (doc.text.toLowerCase().includes(w)) matches++;
      doc.keywords.forEach(kw => { if (kw === w) matches += 2; });
    });
    const score = Math.min(matches / (qWords.length * 2), 0.95);
    return { id: doc.id, text: doc.text, score, method: 'keyword' };
  }).sort((a, b) => b.score - a.score).slice(0, 3);
}

function hybridSearch(query: string): Result[] {
  const sem = semanticSearch(query);
  const kw = keywordSearch(query);
  const scoreMap = new Map<number, { text: string; semScore: number; kwScore: number }>();

  sem.forEach(r => scoreMap.set(r.id, { text: r.text, semScore: r.score, kwScore: 0 }));
  kw.forEach(r => {
    const existing = scoreMap.get(r.id);
    if (existing) {
      existing.kwScore = r.score;
    } else {
      scoreMap.set(r.id, { text: r.text, semScore: 0, kwScore: r.score });
    }
  });

  return Array.from(scoreMap.entries())
    .map(([id, { text, semScore, kwScore }]) => ({
      id, text, score: semScore * 0.6 + kwScore * 0.4, method: 'hybrid',
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);
}

const SAMPLE_QUERIES = [
  "What is GPT-4?",
  "How does RAG work?",
  "vector database comparison",
  "transformer architecture attention",
];

export default function RetrievalComparator() {
  const [query, setQuery] = useState('What is GPT-4?');
  const [results, setResults] = useState<{ semantic: Result[]; keyword: Result[]; hybrid: Result[] } | null>(null);

  const handleSearch = () => {
    if (!query.trim()) return;
    setResults({
      semantic: semanticSearch(query),
      keyword: keywordSearch(query),
      hybrid: hybridSearch(query),
    });
  };

  return (
    <div style={{
      background: 'var(--sl-color-bg-nav)',
      border: '1px solid var(--sl-color-hairline)',
      borderRadius: '0.75rem',
      padding: '1.5rem',
      margin: '1.5rem 0',
    }}>
      <h3 style={{ margin: '0 0 0.75rem', fontSize: '1rem' }}>Try It: Strategy Comparator</h3>
      <p style={{ fontSize: '0.8125rem', opacity: 0.7, marginBottom: '1rem' }}>
        Enter a query and see how three retrieval strategies return different results from the same corpus.
      </p>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem', marginBottom: '0.75rem' }}>
        {SAMPLE_QUERIES.map(sq => (
          <button key={sq} onClick={() => setQuery(sq)} style={{
            padding: '0.25rem 0.625rem', fontSize: '0.75rem', borderRadius: '9999px',
            background: query === sq ? 'rgba(168,85,247,0.08)' : 'transparent',
            border: `1px solid ${query === sq ? '#a855f7' : 'var(--sl-color-hairline)'}`,
            color: 'var(--sl-color-text)', cursor: 'pointer',
          }}>{sq}</button>
        ))}
      </div>

      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
        <input
          type="text" value={query} onChange={e => setQuery(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSearch()}
          placeholder="Enter a search query..."
          style={{
            flex: 1, padding: '0.5rem 0.75rem', background: 'var(--sl-color-bg)',
            border: '1px solid var(--sl-color-hairline)', borderRadius: '0.375rem',
            color: 'var(--sl-color-text)', fontSize: '0.875rem',
          }}
        />
        <button onClick={handleSearch} style={{
          padding: '0.5rem 1.25rem', background: '#a855f7', color: '#fff',
          border: 'none', borderRadius: '0.375rem', cursor: 'pointer',
          fontWeight: 600, fontSize: '0.875rem',
        }}>Compare</button>
      </div>

      {results && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '0.75rem' }}>
          {([
            { key: 'semantic' as const, label: 'Semantic Search', color: '#a855f7', desc: 'By meaning' },
            { key: 'keyword' as const, label: 'Keyword Search (BM25)', color: '#F59E0B', desc: 'By exact terms' },
            { key: 'hybrid' as const, label: 'Hybrid Search', color: '#22C55E', desc: '60% semantic + 40% keyword' },
          ]).map(({ key, label, color, desc }) => (
            <div key={key} style={{
              background: `${color}08`, border: `1px solid ${color}33`,
              borderRadius: '0.5rem', padding: '0.75rem',
            }}>
              <div style={{ fontWeight: 600, color, fontSize: '0.8125rem', marginBottom: '0.125rem' }}>{label}</div>
              <div style={{ fontSize: '0.6875rem', opacity: 0.6, marginBottom: '0.625rem' }}>{desc}</div>
              {results[key].map((r, i) => (
                <div key={r.id} style={{
                  padding: '0.5rem', background: 'var(--sl-color-bg)', borderRadius: '0.375rem',
                  marginBottom: '0.375rem', fontSize: '0.75rem',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                    <span style={{ fontWeight: 600, color }}>#{i + 1}</span>
                    <span style={{ fontFamily: 'var(--sl-font-mono)', color }}>{r.score.toFixed(3)}</span>
                  </div>
                  <div style={{ lineHeight: 1.4, opacity: 0.9 }}>{r.text.slice(0, 120)}...</div>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
