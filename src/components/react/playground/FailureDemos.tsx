import { useState } from 'react';
import { chunkFixed } from '../../../lib/chunking';

type Demo = 'bad-chunking' | 'no-context' | null;

const SAMPLE_TEXT = `Retrieval-Augmented Generation (RAG) is a technique that combines the power of large language models with external knowledge retrieval. Instead of relying solely on what the model learned during training, RAG systems first search through a collection of documents to find relevant information, then use that information to generate more accurate and up-to-date responses. The key insight behind RAG is simple: language models are great at understanding and generating text, but they have a fixed knowledge cutoff and can hallucinate facts.`;

const SAMPLE_QUESTION = "What is the key insight behind RAG?";

const GOOD_ANSWER = `Based on the retrieved context, the key insight behind RAG is simple: language models are great at understanding and generating text, but they have a fixed knowledge cutoff and can hallucinate facts. RAG addresses this by first searching through documents to find relevant information, then using that information to generate more accurate responses.

[Source: Chunk 2, similarity score: 0.89]`;

const NO_CONTEXT_ANSWER = `RAG, or Retrieval-Augmented Generation, is fundamentally about bridging the gap between static language model training and dynamic real-world information needs. The key insight is that by combining retrieval mechanisms with generative models, we can leverage the best of both worlds — the fluency of language models and the precision of information retrieval systems. This was first proposed in the seminal 2020 paper by Lewis et al.

[Note: This answer sounds confident but contains generic information. Without retrieved context, the AI is working from memory and may include inaccuracies or vague generalisations.]`;

export default function FailureDemos() {
  const [activeDemo, setActiveDemo] = useState<Demo>(null);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <p style={{ fontSize: '0.9375rem', color: '#94a3b8', margin: 0 }}>
        These demos show what happens when RAG goes wrong. Understanding failure modes helps you build better systems.
      </p>

      {/* Demo buttons */}
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        <button
          onClick={() => setActiveDemo(activeDemo === 'bad-chunking' ? null : 'bad-chunking')}
          style={{
            padding: '0.5rem 1rem', fontSize: '0.9375rem', fontWeight: 600,
            background: activeDemo === 'bad-chunking' ? '#EF444422' : 'transparent',
            border: `1px solid ${activeDemo === 'bad-chunking' ? '#EF4444' : '#2D3148'}`,
            borderRadius: '0.375rem', color: activeDemo === 'bad-chunking' ? '#EF4444' : '#e2e8f0',
            cursor: 'pointer',
          }}
        >
          Bad Chunking Demo
        </button>
        <button
          onClick={() => setActiveDemo(activeDemo === 'no-context' ? null : 'no-context')}
          style={{
            padding: '0.5rem 1rem', fontSize: '0.9375rem', fontWeight: 600,
            background: activeDemo === 'no-context' ? '#F59E0B22' : 'transparent',
            border: `1px solid ${activeDemo === 'no-context' ? '#F59E0B' : '#2D3148'}`,
            borderRadius: '0.375rem', color: activeDemo === 'no-context' ? '#F59E0B' : '#e2e8f0',
            cursor: 'pointer',
          }}
        >
          No Context Demo
        </button>
      </div>

      {/* Bad Chunking Demo */}
      {activeDemo === 'bad-chunking' && (
        <BadChunkingDemo />
      )}

      {/* No Context Demo */}
      {activeDemo === 'no-context' && (
        <NoContextDemo />
      )}
    </div>
  );
}

function BadChunkingDemo() {
  const goodChunks = chunkFixed(SAMPLE_TEXT, 200, 30);
  const badChunks = chunkFixed(SAMPLE_TEXT, 50, 0);

  return (
    <div style={{
      padding: '1rem', background: '#EF444408', border: '1px solid #EF444433', borderRadius: '0.5rem',
    }}>
      <h4 style={{ margin: '0 0 0.5rem', color: '#EF4444', fontSize: '1rem' }}>
        Bad Chunking: What Happens with 50-Character Chunks
      </h4>
      <p style={{ fontSize: '0.875rem', opacity: 0.7, marginBottom: '0.75rem' }}>
        Question: "{SAMPLE_QUESTION}"
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        {/* Bad chunks */}
        <div>
          <div style={{ fontWeight: 600, fontSize: '0.875rem', color: '#EF4444', marginBottom: '0.5rem' }}>
            50-char chunks (too small)
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            {badChunks.slice(0, 6).map((c, i) => (
              <div key={i} style={{
                padding: '0.375rem 0.5rem', background: '#EF444411', border: '1px solid #EF444422',
                borderRadius: '0.25rem', fontSize: '0.75rem', fontFamily: "'JetBrains Mono', monospace",
              }}>
                "{c.text}"
              </div>
            ))}
            {badChunks.length > 6 && (
              <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>...+{badChunks.length - 6} more fragments</div>
            )}
          </div>
          <p style={{ fontSize: '0.8125rem', color: '#EF4444', marginTop: '0.5rem' }}>
            These fragments are meaningless on their own. "RAG systems first" tells you nothing. Retrieval will match random fragments.
          </p>
        </div>

        {/* Good chunks */}
        <div>
          <div style={{ fontWeight: 600, fontSize: '0.875rem', color: '#22C55E', marginBottom: '0.5rem' }}>
            200-char chunks (right-sized)
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            {goodChunks.slice(0, 3).map((c, i) => (
              <div key={i} style={{
                padding: '0.375rem 0.5rem', background: '#22C55E11', border: '1px solid #22C55E22',
                borderRadius: '0.25rem', fontSize: '0.75rem', fontFamily: "'JetBrains Mono', monospace",
              }}>
                "{c.text.slice(0, 80)}..."
              </div>
            ))}
          </div>
          <p style={{ fontSize: '0.8125rem', color: '#22C55E', marginTop: '0.5rem' }}>
            Each chunk contains a complete thought. Retrieval can find the right chunk and it has enough context to be useful.
          </p>
        </div>
      </div>

      <div style={{
        marginTop: '0.75rem', padding: '0.625rem', background: '#F59E0B11', border: '1px solid #F59E0B33',
        borderRadius: '0.375rem', fontSize: '0.8125rem', color: '#F59E0B',
      }}>
        Lesson: Chunk size directly affects retrieval quality. Too small = no context. Aim for 200-500 tokens per chunk.
      </div>
    </div>
  );
}

function NoContextDemo() {
  return (
    <div style={{
      padding: '1rem', background: '#F59E0B08', border: '1px solid #F59E0B33', borderRadius: '0.5rem',
    }}>
      <h4 style={{ margin: '0 0 0.5rem', color: '#F59E0B', fontSize: '1rem' }}>
        No Context: What Happens Without Retrieved Chunks
      </h4>
      <p style={{ fontSize: '0.875rem', opacity: 0.7, marginBottom: '0.75rem' }}>
        Question: "{SAMPLE_QUESTION}"
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        {/* Without RAG */}
        <div>
          <div style={{ fontWeight: 600, fontSize: '0.875rem', color: '#EF4444', marginBottom: '0.5rem' }}>
            Without RAG (no context provided)
          </div>
          <div style={{
            padding: '0.75rem', background: '#EF444408', border: '1px solid #EF444422',
            borderRadius: '0.375rem', fontSize: '0.875rem', lineHeight: 1.6,
          }}>
            {NO_CONTEXT_ANSWER}
          </div>
        </div>

        {/* With RAG */}
        <div>
          <div style={{ fontWeight: 600, fontSize: '0.875rem', color: '#22C55E', marginBottom: '0.5rem' }}>
            With RAG (context provided)
          </div>
          <div style={{
            padding: '0.75rem', background: '#22C55E08', border: '1px solid #22C55E22',
            borderRadius: '0.375rem', fontSize: '0.875rem', lineHeight: 1.6,
          }}>
            {GOOD_ANSWER}
          </div>
        </div>
      </div>

      <div style={{
        marginTop: '0.75rem', padding: '0.625rem', background: '#F59E0B11', border: '1px solid #F59E0B33',
        borderRadius: '0.375rem', fontSize: '0.8125rem', color: '#F59E0B',
      }}>
        Lesson: Without RAG, the AI sounds confident but gives vague, generic answers. With RAG, the answer is specific, grounded, and citable. This is why RAG exists.
      </div>
    </div>
  );
}
