import { useCallback } from 'react';
import { usePlayground, type SearchType } from './usePlaygroundStore';
import { rankBySimilarity } from '../../../lib/similarity';
import { incrementPlaygroundQueries } from '../../../lib/progress';

const SEARCH_TYPES: { id: SearchType; label: string; description: string }[] = [
  { id: 'semantic', label: 'Vector Search', description: 'Search by meaning using cosine similarity between embeddings' },
  { id: 'hybrid', label: 'Hybrid Search', description: 'Combine vector similarity (60%) + keyword matching (40%) for better recall' },
];

/** Simple BM25-like keyword scoring */
function keywordScore(query: string, text: string): number {
  const qTerms = query.toLowerCase().split(/\s+/).filter(t => t.length > 2);
  if (qTerms.length === 0) return 0;
  const textLower = text.toLowerCase();
  const textWords = textLower.split(/\s+/);
  let score = 0;
  for (const term of qTerms) {
    const tf = textWords.filter(w => w.includes(term)).length;
    if (tf > 0) {
      score += (tf * 1.5) / (tf + 1.5 + 0.75); // simplified BM25
    }
  }
  return Math.min(score / qTerms.length, 1);
}

export default function RetrievalPanel() {
  const { state, dispatch } = usePlayground();

  const handleSearch = useCallback(async () => {
    if (!state.query.trim() || state.embeddedChunks.length === 0) return;
    dispatch({ type: 'SET_IS_SEARCHING', payload: true });

    try {
      const { embedText } = await import('../../../lib/embeddings');
      const queryVector = await embedText(state.query);

      const items = state.embeddedChunks.map(chunk => ({
        item: chunk,
        vector: chunk.embedding,
      }));

      let results;

      if (state.searchType === 'semantic') {
        const ranked = rankBySimilarity(queryVector, items, state.topK);
        results = ranked.map(r => ({ chunk: r.item, score: r.score, matchType: 'semantic' as const }));
      } else {
        // Hybrid: 60% semantic + 40% keyword
        const semanticRanked = rankBySimilarity(queryVector, items, state.embeddedChunks.length);
        const hybridScores = semanticRanked.map(r => {
          const kwScore = keywordScore(state.query, r.item.text);
          return {
            chunk: r.item,
            score: r.score * 0.6 + kwScore * 0.4,
            matchType: (kwScore > 0.1 && r.score > 0.3 ? 'both' : kwScore > 0.1 ? 'keyword' : 'semantic') as 'semantic' | 'keyword' | 'both',
          };
        });
        results = hybridScores.sort((a, b) => b.score - a.score).slice(0, state.topK);
      }

      dispatch({ type: 'SET_RESULTS', payload: results });
      incrementPlaygroundQueries();
    } catch (err) {
      console.error('Search failed:', err);
    } finally {
      dispatch({ type: 'SET_IS_SEARCHING', payload: false });
    }
  }, [state.query, state.embeddedChunks, state.searchType, state.topK, dispatch]);

  const noChunks = state.embeddedChunks.length === 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {noChunks && (
        <div style={{
          padding: '1.5rem', textAlign: 'center', fontSize: '0.9375rem',
          background: 'rgba(251,191,36,0.05)', border: '1px solid rgba(251,191,36,0.15)',
          borderRadius: '0.75rem', color: '#fbbf24',
        }}>
          No embedded chunks yet. Go to the Ingest tab, add some text, split it into chunks, and embed them first.
        </div>
      )}

      {/* Search type selector */}
      <div>
        <label style={{
          fontSize: '0.75rem', fontWeight: 600, display: 'block', marginBottom: '0.5rem',
          color: '#b87dff', letterSpacing: '0.08em', textTransform: 'uppercase' as const,
          fontFamily: "'JetBrains Mono', monospace",
        }}>
          Search Strategy
        </label>
        <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap' }}>
          {SEARCH_TYPES.map(st => {
            const isActive = state.searchType === st.id;
            return (
              <button
                key={st.id}
                onClick={() => dispatch({ type: 'SET_SEARCH_TYPE', payload: st.id })}
                title={st.description}
                style={{
                  padding: '0.5rem 1rem',
                  fontSize: '0.875rem',
                  fontWeight: isActive ? 600 : 400,
                  background: isActive ? 'rgba(168,85,247,0.1)' : 'transparent',
                  border: `1px solid ${isActive ? 'rgba(168,85,247,0.3)' : 'rgba(255,255,255,0.06)'}`,
                  borderRadius: '0.5rem',
                  color: isActive ? '#b87dff' : '#8b8b8b',
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
              >
                {st.label}
              </button>
            );
          })}
        </div>
        <p style={{
          margin: '0.375rem 0 0', fontSize: '0.75rem', color: '#636363', lineHeight: 1.4,
        }}>
          {SEARCH_TYPES.find(s => s.id === state.searchType)?.description}
        </p>
      </div>

      {/* Top-K selector */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <label style={{
          fontSize: '0.75rem', fontWeight: 600, color: '#636363',
          fontFamily: "'JetBrains Mono', monospace", letterSpacing: '0.08em',
          textTransform: 'uppercase' as const, whiteSpace: 'nowrap',
        }}>
          Top-K: {state.topK}
        </label>
        <input
          type="range" min={1} max={10} value={state.topK}
          onChange={e => dispatch({ type: 'SET_TOP_K', payload: Number(e.target.value) })}
          style={{ width: '120px', accentColor: '#a855f7' }}
        />
      </div>

      {/* Search input */}
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <input
          type="text"
          value={state.query}
          onChange={e => dispatch({ type: 'SET_QUERY', payload: e.target.value })}
          onKeyDown={e => e.key === 'Enter' && handleSearch()}
          placeholder={noChunks ? 'Embed chunks first...' : 'Ask a question about your documents...'}
          disabled={noChunks}
          style={{
            flex: 1, padding: '0.75rem 1rem',
            background: 'rgba(22,19,30,0.6)', border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '0.5rem', color: '#e0e0e0', fontSize: '1rem',
          }}
        />
        <button
          onClick={handleSearch}
          disabled={noChunks || state.isSearching || !state.query.trim()}
          style={{
            padding: '0.75rem 1.5rem',
            background: (noChunks || !state.query.trim()) ? 'rgba(168,85,247,0.2)' : '#a855f7',
            color: (noChunks || !state.query.trim()) ? 'rgba(240,240,240,0.4)' : '#f0f0f0',
            border: 'none', borderRadius: '0.5rem',
            cursor: (noChunks || !state.query.trim()) ? 'not-allowed' : 'pointer',
            fontWeight: 600, fontSize: '0.9375rem', whiteSpace: 'nowrap',
            boxShadow: (noChunks || !state.query.trim()) ? 'none' : '0 0 20px rgba(168,85,247,0.15)',
            transition: 'all 0.15s',
          }}
        >
          {state.isSearching ? 'Searching...' : 'Search'}
        </button>
      </div>

      {/* Results */}
      {state.results.length > 0 && (
        <div>
          <div style={{
            fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.75rem', color: '#636363',
            fontFamily: "'JetBrains Mono', monospace", letterSpacing: '0.08em', textTransform: 'uppercase' as const,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <span>Top {state.results.length} results — {state.searchType} search</span>
            {state.searchType === 'hybrid' && (
              <span style={{ fontSize: '0.75rem', color: '#636363', fontWeight: 400, textTransform: 'none' }}>
                60% semantic + 40% keyword
              </span>
            )}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {state.results.map((result, i) => (
              <div key={result.chunk.id} style={{
                padding: '1rem',
                background: i === 0 ? 'rgba(74,222,128,0.04)' : 'rgba(30,26,41,0.5)',
                border: `1px solid ${i === 0 ? 'rgba(74,222,128,0.15)' : 'rgba(255,255,255,0.06)'}`,
                borderRadius: '0.75rem',
                backdropFilter: 'blur(4px)',
                transition: 'all 0.15s',
              }}>
                <div style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  marginBottom: '0.5rem',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{
                      fontSize: '0.8125rem', fontWeight: 700,
                      color: i === 0 ? '#4ade80' : '#b87dff',
                    }}>
                      #{i + 1}
                    </span>
                    <span style={{
                      fontSize: '0.75rem', color: '#636363',
                      fontFamily: "'JetBrains Mono', monospace",
                    }}>
                      Chunk {result.chunk.id + 1}
                    </span>
                    {result.matchType && state.searchType === 'hybrid' && (
                      <span style={{
                        fontSize: '0.75rem', fontWeight: 600,
                        padding: '1px 6px', borderRadius: '9999px',
                        fontFamily: "'JetBrains Mono', monospace",
                        letterSpacing: '0.05em', textTransform: 'uppercase' as const,
                        background: result.matchType === 'both' ? 'rgba(168,85,247,0.1)' : result.matchType === 'keyword' ? 'rgba(251,191,36,0.1)' : 'rgba(74,222,128,0.1)',
                        color: result.matchType === 'both' ? '#b87dff' : result.matchType === 'keyword' ? '#fbbf24' : '#4ade80',
                        border: `1px solid ${result.matchType === 'both' ? 'rgba(168,85,247,0.2)' : result.matchType === 'keyword' ? 'rgba(251,191,36,0.2)' : 'rgba(74,222,128,0.2)'}`,
                      }}>
                        {result.matchType}
                      </span>
                    )}
                  </div>
                  <span style={{
                    fontFamily: "'JetBrains Mono', monospace", fontSize: '0.8125rem',
                    padding: '0.125rem 0.5rem', borderRadius: '9999px',
                    background: `${getScoreColor(result.score)}15`,
                    color: getScoreColor(result.score),
                    border: `1px solid ${getScoreColor(result.score)}30`,
                  }}>
                    {result.score.toFixed(4)}
                  </span>
                </div>
                <p style={{ margin: 0, fontSize: '0.875rem', lineHeight: 1.65, color: '#c0c0c0' }}>
                  {result.chunk.text}
                </p>
                <div style={{
                  marginTop: '0.625rem', height: '2px',
                  background: 'rgba(255,255,255,0.04)', borderRadius: '1px', overflow: 'hidden',
                }}>
                  <div style={{
                    width: `${Math.min(result.score * 100, 100)}%`, height: '100%',
                    background: `linear-gradient(90deg, ${getScoreColor(result.score)}66, ${getScoreColor(result.score)})`,
                    borderRadius: '1px',
                  }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {state.results.length === 0 && !noChunks && state.query && !state.isSearching && (
        <div style={{ padding: '1rem', textAlign: 'center', color: '#636363', fontSize: '0.9375rem' }}>
          Press Search or Enter to find relevant chunks.
        </div>
      )}
    </div>
  );
}

function getScoreColor(score: number): string {
  if (score >= 0.7) return '#4ade80';
  if (score >= 0.4) return '#fbbf24';
  return '#f87171';
}
