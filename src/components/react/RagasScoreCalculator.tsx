import { useState } from 'react';

function scoreFaithfulness(answer: string, context: string): { score: number; explanation: string } {
  const answerSentences = answer.split(/[.!?]+/).filter(s => s.trim().length > 10);
  const contextLower = context.toLowerCase();
  let grounded = 0;

  for (const sentence of answerSentences) {
    const words = sentence.toLowerCase().trim().split(/\s+/).filter(w => w.length > 3);
    const matchCount = words.filter(w => contextLower.includes(w)).length;
    if (matchCount / words.length > 0.4) grounded++;
  }

  const score = answerSentences.length > 0 ? grounded / answerSentences.length : 0;
  const ungrounded = answerSentences.length - grounded;

  return {
    score: Math.round(score * 100) / 100,
    explanation: ungrounded === 0
      ? 'All claims in the answer appear to be grounded in the provided context.'
      : `${ungrounded} of ${answerSentences.length} statements may not be directly supported by the context. These could be hallucinations.`,
  };
}

function scoreRelevancy(answer: string, question: string): { score: number; explanation: string } {
  const qWords = new Set(question.toLowerCase().split(/\s+/).filter(w => w.length > 3));
  const aWords = answer.toLowerCase().split(/\s+/).filter(w => w.length > 3);
  const overlap = aWords.filter(w => qWords.has(w)).length;
  const score = Math.min(overlap / Math.max(qWords.size, 1) * 0.5 + 0.3, 0.98);

  return {
    score: Math.round(score * 100) / 100,
    explanation: score > 0.7
      ? 'The answer addresses the question directly and stays on topic.'
      : score > 0.4
      ? 'The answer partially addresses the question but may include tangential information.'
      : 'The answer may not directly address what was asked.',
  };
}

function scoreContextPrecision(context: string, question: string): { score: number; explanation: string } {
  const qWords = new Set(question.toLowerCase().split(/\s+/).filter(w => w.length > 3));
  const contextSentences = context.split(/[.!?]+/).filter(s => s.trim().length > 10);
  let relevant = 0;

  for (const sentence of contextSentences) {
    const words = sentence.toLowerCase().split(/\s+/);
    if (words.some(w => qWords.has(w))) relevant++;
  }

  const score = contextSentences.length > 0 ? relevant / contextSentences.length : 0;
  return {
    score: Math.round(score * 100) / 100,
    explanation: score > 0.7
      ? 'Most retrieved chunks are relevant to the question. Good retrieval quality.'
      : score > 0.4
      ? 'Some retrieved chunks are not directly relevant. Consider tuning your retrieval strategy.'
      : 'Many retrieved chunks appear irrelevant. Your retrieval may need significant improvement.',
  };
}

const SAMPLE = {
  question: "What is ChromaDB and how does it store data?",
  answer: "ChromaDB is a vector database that stores embeddings using DuckDB as its backend. It supports both in-memory and persistent storage, making it ideal for prototyping. ChromaDB was founded in 2022 and has over 50,000 GitHub stars.",
  context: "ChromaDB stores embeddings using DuckDB as its default backend. It supports both in-memory and persistent storage modes. For persistent storage, data is saved to a local directory. ChromaDB is one of the easiest vector databases to get started with, requiring just a pip install.",
};

export default function RagasScoreCalculator() {
  const [question, setQuestion] = useState(SAMPLE.question);
  const [answer, setAnswer] = useState(SAMPLE.answer);
  const [context, setContext] = useState(SAMPLE.context);
  const [scores, setScores] = useState<null | {
    faithfulness: { score: number; explanation: string };
    relevancy: { score: number; explanation: string };
    precision: { score: number; explanation: string };
  }>(null);

  const handleEvaluate = () => {
    setScores({
      faithfulness: scoreFaithfulness(answer, context),
      relevancy: scoreRelevancy(answer, question),
      precision: scoreContextPrecision(context, question),
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
      <h3 style={{ margin: '0 0 1rem', fontSize: '1rem' }}>Try It: Your RAG Score</h3>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1rem' }}>
        <div>
          <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#a855f7', display: 'block', marginBottom: '0.25rem' }}>Question</label>
          <input type="text" value={question} onChange={e => setQuestion(e.target.value)}
            style={{ width: '100%', padding: '0.5rem', background: 'var(--sl-color-bg)', border: '1px solid var(--sl-color-hairline)', borderRadius: '0.375rem', color: 'var(--sl-color-text)', fontSize: '0.875rem' }} />
        </div>
        <div>
          <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#22C55E', display: 'block', marginBottom: '0.25rem' }}>Retrieved Context (chunks)</label>
          <textarea value={context} onChange={e => setContext(e.target.value)} rows={3}
            style={{ width: '100%', padding: '0.5rem', background: 'var(--sl-color-bg)', border: '1px solid var(--sl-color-hairline)', borderRadius: '0.375rem', color: 'var(--sl-color-text)', fontSize: '0.8125rem', resize: 'vertical' }} />
        </div>
        <div>
          <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#A855F7', display: 'block', marginBottom: '0.25rem' }}>Generated Answer</label>
          <textarea value={answer} onChange={e => setAnswer(e.target.value)} rows={3}
            style={{ width: '100%', padding: '0.5rem', background: 'var(--sl-color-bg)', border: '1px solid var(--sl-color-hairline)', borderRadius: '0.375rem', color: 'var(--sl-color-text)', fontSize: '0.8125rem', resize: 'vertical' }} />
        </div>
      </div>

      <button onClick={handleEvaluate} style={{
        padding: '0.5rem 1.25rem', background: '#a855f7', color: '#fff', border: 'none',
        borderRadius: '0.375rem', cursor: 'pointer', fontWeight: 600, fontSize: '0.875rem', marginBottom: '1rem',
      }}>
        Evaluate
      </button>

      {scores && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem' }}>
          {([
            { key: 'faithfulness' as const, label: 'Faithfulness', color: '#22C55E', desc: 'Is the answer grounded in the context?' },
            { key: 'relevancy' as const, label: 'Answer Relevancy', color: '#a855f7', desc: 'Does the answer address the question?' },
            { key: 'precision' as const, label: 'Context Precision', color: '#F59E0B', desc: 'Were the retrieved chunks relevant?' },
          ]).map(({ key, label, color, desc }) => {
            const s = scores[key];
            return (
              <div key={key} style={{
                padding: '0.75rem', background: `${color}08`,
                border: `1px solid ${color}33`, borderRadius: '0.5rem',
              }}>
                <div style={{ fontSize: '0.75rem', color, fontWeight: 600, marginBottom: '0.125rem' }}>{label}</div>
                <div style={{ fontSize: '0.6875rem', opacity: 0.6, marginBottom: '0.5rem' }}>{desc}</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 700, color, marginBottom: '0.375rem' }}>
                  {s.score.toFixed(2)}
                </div>
                <div style={{
                  height: '4px', background: 'var(--sl-color-hairline)', borderRadius: '2px', marginBottom: '0.5rem',
                }}>
                  <div style={{ width: `${s.score * 100}%`, height: '100%', background: color, borderRadius: '2px' }} />
                </div>
                <div style={{ fontSize: '0.6875rem', lineHeight: 1.4, opacity: 0.8 }}>{s.explanation}</div>
              </div>
            );
          })}
        </div>
      )}

      {scores && (
        <p style={{ fontSize: '0.6875rem', color: '#F59E0B', margin: '0.75rem 0 0', opacity: 0.8 }}>
          Note: These scores use a simplified heuristic for demonstration. Production evaluation with RAGAS uses LLM-as-judge for more accurate assessment.
        </p>
      )}
    </div>
  );
}
