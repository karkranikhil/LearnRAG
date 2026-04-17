import { useState } from 'react';

interface ExampleResponse {
  answer: string;
  label: string;
  note: string;
  context?: string;
}

interface HallucinationExample {
  question: string;
  withoutRAG: ExampleResponse;
  withRAG: ExampleResponse;
}

const examples: HallucinationExample[] = [
  {
    question: "What were the key findings of the 2026 Global AI Safety Report?",
    withoutRAG: {
      answer: "The 2026 Global AI Safety Report found that 78% of organizations have implemented basic AI safety measures, with a particular focus on bias detection and model interpretability. The report highlighted three major breakthroughs in automated red-teaming techniques.",
      label: "Without RAG — The AI made this up",
      note: "This sounds confident and specific, but the AI has no access to this document. Every detail here is fabricated — the 78% figure, the 'three breakthroughs,' all of it. This is a hallucination.",
    },
    withRAG: {
      context: "Source: 2026_ai_safety_report.pdf, Page 3\n\"The report surveyed 450 organizations across 30 countries. Key finding: only 34% have formal AI safety policies. The biggest gap is in deployment monitoring — 89% lack real-time safety checks after models go live.\"",
      answer: "According to the 2026 Global AI Safety Report (p.3), only 34% of the 450 organizations surveyed across 30 countries have formal AI safety policies. The report identified deployment monitoring as the biggest gap, with 89% lacking real-time safety checks after models go live.",
      label: "With RAG — Grounded in the actual document",
      note: "Same question, but now the AI was given the actual document chunk first. Every number is cited, and the answer matches the source exactly.",
    },
  },
  {
    question: "What is our company's refund policy for enterprise customers?",
    withoutRAG: {
      answer: "Enterprise customers are typically eligible for a full refund within 30 days of purchase, with a prorated refund available for the remaining contract period. Most enterprise agreements include a satisfaction guarantee clause.",
      label: "Without RAG — Generic guess",
      note: "The AI doesn't have access to your company's policies. It generated a plausible-sounding answer based on common patterns, but none of this may be accurate for your specific company.",
    },
    withRAG: {
      context: "Source: enterprise_terms_v4.md, Section 7.2\n\"Enterprise Plan refunds: 14-day full refund from activation date. After 14 days, no refunds are issued. Credits may be applied to future billing cycles at the discretion of the account manager. Annual contracts are non-refundable after the 14-day window.\"",
      answer: "According to our Enterprise Terms (Section 7.2): Enterprise customers get a full refund within 14 days of activation. After that 14-day window, no refunds are issued, though credits may be applied to future billing cycles at the account manager's discretion. Annual contracts follow the same 14-day rule.",
      label: "With RAG — From your actual policy docs",
      note: "The AI found the relevant policy section and quoted it accurately. The answer is grounded in your real documentation, with the source clearly cited.",
    },
  },
];

export default function HallucinationToggle() {
  const [ragEnabled, setRagEnabled] = useState(false);
  const [exampleIdx, setExampleIdx] = useState(0);
  const ex = examples[exampleIdx];
  const data: ExampleResponse = ragEnabled ? ex.withRAG : ex.withoutRAG;

  return (
    <div style={{
      background: 'var(--sl-color-bg-nav)',
      border: '1px solid var(--sl-color-hairline)',
      borderRadius: '0.75rem',
      padding: '1.5rem',
      margin: '1.5rem 0',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
        <h3 style={{ margin: 0, fontSize: '1rem' }}>Try It: The Hallucination Toggle</h3>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {examples.map((_, i) => (
            <button
              key={i}
              onClick={() => setExampleIdx(i)}
              style={{
                padding: '0.375rem 0',
                width: '5.5rem',
                fontSize: '0.75rem',
                borderRadius: '0.375rem',
                border: `1px solid ${i === exampleIdx ? '#a855f7' : 'var(--sl-color-hairline)'}`,
                background: i === exampleIdx ? 'rgba(168,85,247,0.1)' : 'transparent',
                color: 'var(--sl-color-text)',
                cursor: 'pointer',
                textAlign: 'center' as const,
              }}
            >
              Example {i + 1}
            </button>
          ))}
        </div>
      </div>

      {/* Question */}
      <div style={{
        padding: '0.75rem',
        background: 'var(--sl-color-bg)',
        borderRadius: '0.5rem',
        marginBottom: '1rem',
        fontSize: '0.875rem',
      }}>
        <strong>User asks:</strong> "{ex.question}"
      </div>

      {/* Toggle */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
        <span style={{ fontSize: '0.8125rem', opacity: ragEnabled ? 0.5 : 1, fontWeight: ragEnabled ? 400 : 600, color: ragEnabled ? 'var(--sl-color-text)' : '#EF4444' }}>
          No RAG
        </span>
        <button
          onClick={() => setRagEnabled(!ragEnabled)}
          style={{
            width: '48px',
            height: '26px',
            borderRadius: '13px',
            border: 'none',
            background: ragEnabled ? '#22C55E' : '#EF4444',
            position: 'relative',
            cursor: 'pointer',
            transition: 'background 0.2s',
          }}
        >
          <span style={{
            position: 'absolute',
            top: '3px',
            left: ragEnabled ? '25px' : '3px',
            width: '20px',
            height: '20px',
            borderRadius: '50%',
            background: '#fff',
            transition: 'left 0.2s',
          }} />
        </button>
        <span style={{ fontSize: '0.8125rem', opacity: ragEnabled ? 1 : 0.5, fontWeight: ragEnabled ? 600 : 400, color: ragEnabled ? '#22C55E' : 'var(--sl-color-text)' }}>
          With RAG
        </span>
      </div>

      {/* Retrieved context (only with RAG) */}
      {ragEnabled && 'context' in data && (
        <div style={{
          padding: '0.75rem',
          background: '#22C55E11',
          border: '1px solid #22C55E33',
          borderRadius: '0.5rem',
          marginBottom: '0.75rem',
          fontSize: '0.8125rem',
          fontFamily: 'var(--sl-font-mono)',
          whiteSpace: 'pre-wrap',
        }}>
          <div style={{ color: '#22C55E', fontWeight: 600, marginBottom: '0.375rem', fontFamily: 'var(--sl-font)' }}>
            Retrieved Context:
          </div>
          {data.context}
        </div>
      )}

      {/* Answer */}
      <div style={{
        padding: '0.75rem',
        background: ragEnabled ? '#22C55E08' : '#EF444408',
        border: `1px solid ${ragEnabled ? '#22C55E33' : '#EF444433'}`,
        borderRadius: '0.5rem',
        marginBottom: '0.75rem',
      }}>
        <div style={{
          fontSize: '0.75rem',
          fontWeight: 600,
          color: ragEnabled ? '#22C55E' : '#EF4444',
          marginBottom: '0.375rem',
        }}>
          {data.label}
        </div>
        <p style={{ margin: 0, fontSize: '0.875rem', lineHeight: 1.6 }}>{data.answer}</p>
      </div>

      {/* Explanation */}
      <div style={{
        padding: '0.625rem 0.75rem',
        background: '#F59E0B11',
        border: '1px solid #F59E0B33',
        borderRadius: '0.5rem',
        fontSize: '0.8125rem',
        color: '#F59E0B',
      }}>
        {data.note}
      </div>
    </div>
  );
}
