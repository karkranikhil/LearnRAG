import { useReducer, useCallback, useState, useMemo, useRef, useEffect } from 'react';
import { Database, Layers, Brain, Search, Sparkles, ChevronLeft, ChevronRight, Check } from 'lucide-react';
import { PlaygroundContext, defaultState, playgroundReducer, usePlayground } from './usePlaygroundStore';
import { chunkText, STRATEGY_INFO, type ChunkStrategy } from '../../../lib/chunking';
import { cosineSimilarity } from '../../../lib/similarity';
import { rankBySimilarity } from '../../../lib/similarity';
import type { EmbeddedChunk } from './usePlaygroundStore';
import IngestionPanel from './IngestionPanel';
import GenerationPanel from './GenerationPanel';

const STEPS = [
  { id: 'stream' as const, num: 1, label: 'Data Stream', icon: Database, desc: 'Source load event' },
  { id: 'dlo' as const, num: 2, label: 'DLO Populate', icon: Database, desc: 'Raw object values' },
  { id: 'dmo' as const, num: 3, label: 'DMO Populate', icon: Database, desc: 'Mapped semantic fields' },
  { id: 'chunk' as const, num: 4, label: 'Chunking', icon: Layers, desc: 'Chunk DMO for search index' },
  { id: 'embed' as const, num: 5, label: 'Embedding', icon: Brain, desc: 'Create vector embeddings' },
  { id: 'retrieve' as const, num: 6, label: 'Retriever', icon: Search, desc: 'Vector search + answer' },
  { id: 'generate' as const, num: 7, label: 'Generate', icon: Sparkles, desc: 'Compose grounded answer' },
] as const;

type StepId = typeof STEPS[number]['id'];

interface DloField {
  label: string;
  apiName: string;
  dataType: string;
  fieldUsedAs?: string;
  keyQualifier?: string;
}

interface DmoFieldValue {
  dmoField: string;
  sourceField: string;
  value: string;
}

interface DataCloudOperation {
  id: string;
  stage: 'DLO' | 'DMO' | 'Chunk DMO' | 'IDMO' | 'Retriever' | 'Generate';
  title: string;
  detail: string;
}

// UDLO schema — source: Salesforce Data Cloud UDLO Schema Attributes doc
const DLO_FIELDS: DloField[] = [
  { label: 'File Path',            apiName: 'FilePath__c',             dataType: 'Text',   fieldUsedAs: 'Primary Key' },
  { label: 'Resolved FilePath',    apiName: 'ResolvedFilePath__c',     dataType: 'Text' },
  { label: 'Content Type',         apiName: 'ContentType__c',          dataType: 'Text' },
  { label: 'Parent Id',            apiName: 'ParentId__c',             dataType: 'Text' },
  { label: 'Size',                 apiName: 'Size__c',                 dataType: 'Number' },
  { label: 'Col1',                 apiName: 'Col1__c',                 dataType: 'Text' },
  { label: 'Col2',                 apiName: 'Col2__c',                 dataType: 'Text' },
  { label: 'Col3',                 apiName: 'Col3__c',                 dataType: 'Text' },
  { label: 'Col4',                 apiName: 'Col4__c',                 dataType: 'Text' },
  { label: 'Col5',                 apiName: 'Col5__c',                 dataType: 'Text' },
  { label: 'Data Source',          apiName: 'DataSource__c',           dataType: 'Text' },
  { label: 'Data Source Object',   apiName: 'DataSourceObject__c',     dataType: 'Text' },
  { label: 'Internal Organization',apiName: 'InternalOrganization__c', dataType: 'Text' },
  { label: 'ETag',                 apiName: 'ETag__c',                 dataType: 'Text' },
  { label: 'KQ_FilePath',          apiName: 'KQ_FilePath__c',          dataType: 'Text', keyQualifier: '"FilePath__c" Key Qualifier' },
];

const DATA_CLOUD_OPERATIONS: DataCloudOperation[] = [
  {
    id: 'op-ingest',
    stage: 'DLO',
    title: 'Ingest source object record',
    detail: 'Landing raw object fields into DLO with source metadata, identifiers, and timestamps.',
  },
  {
    id: 'op-map',
    stage: 'DMO',
    title: 'Map semantic fields',
    detail: 'Resolve core fields used for retrieval (Title, Body, Language, URL, Source) into DMO semantics.',
  },
  {
    id: 'op-chunk',
    stage: 'Chunk DMO',
    title: 'Create chunk rows',
    detail: 'Slice body text into chunk records with overlap and chunk-level metadata for recall coverage.',
  },
  {
    id: 'op-embed',
    stage: 'IDMO',
    title: 'Generate vectors and index',
    detail: 'Translate each chunk to embeddings and write vector references for nearest-neighbor retrieval.',
  },
  {
    id: 'op-query',
    stage: 'Retriever',
    title: 'Run vector retrieval',
    detail: 'Embed query, rank chunk candidates by cosine similarity (semantic/hybrid), return top-K results.',
  },
  {
    id: 'op-generate',
    stage: 'Generate',
    title: 'Generate grounded answer',
    detail: 'Assemble system prompt + retrieved chunks + user query, then call Groq (or distilbert) to produce a cited answer.',
  },
];

function toExternalId(label: string): string {
  return label.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

function toShortHash(input: string): string {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = (hash << 5) - hash + input.charCodeAt(i);
    hash |= 0;
  }
  return `h_${Math.abs(hash).toString(16)}`;
}

// ── Shared styles ──

const labelStyle: React.CSSProperties = {
  fontSize: '0.6875rem', fontWeight: 600, display: 'block', marginBottom: '0.375rem',
  color: '#636363', letterSpacing: '0.08em', textTransform: 'uppercase',
  fontFamily: "'JetBrains Mono', monospace",
};

const selectStyle: React.CSSProperties = {
  width: '100%', padding: '0.5rem',
  background: 'rgba(22,19,30,0.6)', border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: '0.5rem', color: '#e0e0e0', fontSize: '0.8125rem',
};

const tableCellStyle: React.CSSProperties = {
  padding: '0.45rem 0.625rem',
  fontSize: '0.75rem',
  color: '#b0b0b0',
  borderBottom: '1px solid rgba(255,255,255,0.04)',
  whiteSpace: 'nowrap',
};

const tableCodeStyle: React.CSSProperties = {
  color: '#93c5fd',
  fontFamily: "'JetBrains Mono', monospace",
  fontSize: '0.68rem',
};

const COLORS = ['#a855f7', '#4ade80', '#fbbf24', '#f87171', '#3b82f6', '#ec4899', '#14b8a6', '#f97316'];

function scoreColor(score: number): string {
  if (score >= 0.7) return '#4ade80';
  if (score >= 0.4) return '#fbbf24';
  return '#f87171';
}

const STEP_IDX: Record<string, number> = {
  stream: 0, dlo: 1, dmo: 2, chunk: 3, embed: 4, retrieve: 5, generate: 6,
};

function getOperationStatus(
  opId: string,
  status: { hasData: boolean; hasChunks: boolean; hasEmbeddings: boolean; hasResults: boolean; hasAnswer: boolean },
  currentStep: string
): { done: boolean; active: boolean } {
  const { hasData, hasChunks, hasEmbeddings, hasResults, hasAnswer } = status;
  const idx = STEP_IDX[currentStep] ?? 0;

  // "done" = data condition met AND user has already navigated past this operation's step
  // "active" = user is currently on this operation's step
  if (opId === 'op-ingest')   return { done: hasData && idx > 0,       active: currentStep === 'stream' };
  if (opId === 'op-map')      return { done: hasData && idx > 2,       active: currentStep === 'dlo' || currentStep === 'dmo' };
  if (opId === 'op-chunk')    return { done: hasChunks,                active: currentStep === 'chunk' };
  if (opId === 'op-embed')    return { done: hasEmbeddings,            active: currentStep === 'embed' };
  if (opId === 'op-query')    return { done: hasResults,               active: currentStep === 'retrieve' };
  if (opId === 'op-generate') return { done: hasAnswer,                active: currentStep === 'generate' };
  return { done: false, active: false };
}

function DataCloudOperationsPanel({ status, currentStep }: {
  status: { hasData: boolean; hasChunks: boolean; hasEmbeddings: boolean; hasResults: boolean; hasAnswer: boolean };
  currentStep: string;
}) {
  const doneCount = DATA_CLOUD_OPERATIONS.filter(op => getOperationStatus(op.id, status, currentStep).done).length;
  const progressPct = Math.round((doneCount / DATA_CLOUD_OPERATIONS.length) * 100);

  return (
    <div style={{
      padding: '1rem',
      background: 'rgba(22,19,30,0.7)',
      border: '1px solid rgba(255,255,255,0.07)',
      borderRadius: '0.875rem',
      backdropFilter: 'blur(12px)',
    }}>
      {/* Header */}
      <div style={{
        fontSize: '0.625rem',
        fontFamily: "'JetBrains Mono', monospace",
        color: '#4ade80',
        letterSpacing: '0.09em',
        textTransform: 'uppercase' as const,
        fontWeight: 700,
        marginBottom: '0.875rem',
      }}>
        Operations Runbook
      </div>

      {/* Overall progress bar */}
      <div style={{ marginBottom: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
          <span style={{ fontSize: '0.625rem', color: '#6b7280', fontFamily: "'JetBrains Mono', monospace" }}>
            {doneCount}/{DATA_CLOUD_OPERATIONS.length} complete
          </span>
          <span style={{ fontSize: '0.625rem', color: progressPct === 100 ? '#4ade80' : '#93c5fd', fontFamily: "'JetBrains Mono', monospace", fontWeight: 700 }}>
            {progressPct}%
          </span>
        </div>
        <div style={{ height: '4px', borderRadius: '2px', background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
          <div style={{
            height: '100%',
            width: `${progressPct}%`,
            borderRadius: '2px',
            background: progressPct === 100 ? '#4ade80' : 'linear-gradient(90deg, #3b82f6, #a855f7)',
            transition: 'width 0.4s ease',
            boxShadow: progressPct > 0 ? '0 0 8px rgba(168,85,247,0.4)' : 'none',
          }} />
        </div>
      </div>

      {/* Vertical timeline */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
        {DATA_CLOUD_OPERATIONS.map((op, i) => {
          const opState = getOperationStatus(op.id, status, currentStep);
          const isLast = i === DATA_CLOUD_OPERATIONS.length - 1;
          const dotColor = opState.done ? '#4ade80' : opState.active ? '#93c5fd' : 'rgba(255,255,255,0.12)';
          const lineColor = opState.done ? 'rgba(74,222,128,0.3)' : 'rgba(255,255,255,0.06)';

          return (
            <div key={op.id} style={{ display: 'flex', gap: '0.625rem' }}>
              {/* Timeline line + dot */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0, width: '14px' }}>
                <div style={{
                  width: '12px', height: '12px', borderRadius: '50%', flexShrink: 0, marginTop: '0.3rem',
                  background: opState.done ? '#4ade80' : opState.active ? 'rgba(147,197,253,0.15)' : 'rgba(255,255,255,0.04)',
                  border: `2px solid ${dotColor}`,
                  boxShadow: opState.active ? '0 0 8px rgba(147,197,253,0.5)' : opState.done ? '0 0 6px rgba(74,222,128,0.4)' : 'none',
                  transition: 'all 0.25s',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {opState.done && (
                    <svg width="6" height="6" viewBox="0 0 6 6" fill="none">
                      <path d="M1 3l1.5 1.5L5 1.5" stroke="#16131e" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                  {opState.active && (
                    <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#93c5fd' }} />
                  )}
                </div>
                {!isLast && (
                  <div style={{ flex: 1, width: '2px', minHeight: '1.5rem', background: lineColor, margin: '2px 0', transition: 'background 0.3s' }} />
                )}
              </div>

              {/* Content */}
              <div style={{ paddingBottom: isLast ? 0 : '0.875rem', flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', marginBottom: '0.1rem' }}>
                  <span style={{
                    fontSize: '0.72rem', fontWeight: 600,
                    color: opState.done ? '#d1fae5' : opState.active ? '#bfdbfe' : '#9ca3af',
                    transition: 'color 0.2s',
                  }}>
                    {op.title}
                  </span>
                </div>
                <div style={{
                  fontSize: '0.5625rem',
                  fontFamily: "'JetBrains Mono', monospace",
                  color: opState.done ? 'rgba(74,222,128,0.7)' : opState.active ? 'rgba(147,197,253,0.7)' : '#4b5563',
                  marginBottom: '0.2rem',
                  letterSpacing: '0.04em',
                }}>
                  {op.stage} · {opState.done ? '✓ done' : opState.active ? '⟳ running' : 'pending'}
                </div>
                <div style={{ fontSize: '0.6875rem', color: '#6b7280', lineHeight: 1.4 }}>
                  {op.detail}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Step navigation bar (reusable for top & bottom) ──

function StepNav({ canGoBack, canGoNext, goBack, goNext, currentIdx, nextLabel, prevLabel }: {
  canGoBack: boolean; canGoNext: boolean; goBack: () => void; goNext: () => void;
  currentIdx: number; nextLabel: string; prevLabel: string;
}) {
  return (
    <div style={{
      padding: '0.625rem 1.5rem',
      background: 'rgba(22,19,30,0.85)', backdropFilter: 'blur(16px)',
      borderTop: '1px solid rgba(255,255,255,0.04)',
      borderBottom: '1px solid rgba(255,255,255,0.04)',
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    }}>
      <button onClick={goBack} disabled={!canGoBack}
        style={{
          display: 'flex', alignItems: 'center', gap: '0.375rem',
          padding: '0.5rem 1rem', background: 'transparent',
          border: `1px solid ${canGoBack ? 'rgba(255,255,255,0.1)' : 'transparent'}`,
          borderRadius: '0.5rem', color: canGoBack ? '#c0c0c0' : 'transparent',
          cursor: canGoBack ? 'pointer' : 'default', fontSize: '0.8125rem', fontWeight: 500,
          transition: 'border-color 0.15s, color 0.15s',
        }}>
        <ChevronLeft size={16} />
        {canGoBack ? prevLabel : ''}
      </button>
      <div style={{ fontSize: '0.6875rem', fontFamily: "'JetBrains Mono', monospace", color: '#636363', letterSpacing: '0.05em' }}>
        Step {currentIdx + 1} of {STEPS.length}
      </div>
      <button onClick={goNext} disabled={!canGoNext}
        style={{
          display: 'flex', alignItems: 'center', gap: '0.375rem',
          padding: '0.5rem 1rem',
          background: canGoNext ? '#a855f7' : 'rgba(168,85,247,0.15)',
          border: 'none', borderRadius: '0.5rem',
          color: canGoNext ? '#f0f0f0' : '#4a4a4a',
          cursor: canGoNext ? 'pointer' : 'default', fontSize: '0.8125rem', fontWeight: 600,
          boxShadow: canGoNext ? '0 0 20px rgba(168,85,247,0.2)' : 'none',
          transition: 'all 0.15s',
        }}>
        {nextLabel}
        <ChevronRight size={16} />
      </button>
    </div>
  );
}

// ══════════════════════════════════════════════════
// Main App
// ══════════════════════════════════════════════════

export default function PlaygroundApp() {
  const [state, dispatch] = useReducer(playgroundReducer, defaultState);
  const [currentStep, setCurrentStep] = useState<StepId>('stream');
  const [maxStepIdx, setMaxStepIdx] = useState(0);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const hasData = state.rawText.length > 0;
  const hasChunks = state.chunks.length > 0;
  const hasEmbeddings = state.embeddedChunks.length > 0;
  const hasResults = state.results.length > 0;

  // A step's connector fills only when the user has explicitly navigated past it,
  // not just because the underlying data happens to satisfy multiple steps at once.
  const hasAnswer = state.generatedAnswer.length > 0;

  const stepComplete = {
    stream: maxStepIdx > 0,
    dlo: maxStepIdx > 1,
    dmo: maxStepIdx > 2,
    chunk: maxStepIdx > 3,
    embed: maxStepIdx > 4,
    retrieve: maxStepIdx > 5,
    generate: hasAnswer,
  };

  const currentIdx = STEPS.findIndex(s => s.id === currentStep);

  const canGoNext = currentIdx < STEPS.length - 1 && (
    (currentStep === 'stream' && hasData) ||
    (currentStep === 'dlo' && hasData) ||
    (currentStep === 'dmo' && hasData) ||
    (currentStep === 'chunk' && hasChunks) ||
    (currentStep === 'embed' && hasEmbeddings) ||
    (currentStep === 'retrieve' && hasResults)
  );
  const canGoBack = currentIdx > 0;

  const goNext = () => {
    if (canGoNext) {
      const nextIdx = currentIdx + 1;
      setCurrentStep(STEPS[nextIdx].id);
      setMaxStepIdx(prev => Math.max(prev, nextIdx));
    }
  };
  const goBack = () => { if (canGoBack) setCurrentStep(STEPS[currentIdx - 1].id); };

  const nextLabel = currentIdx < STEPS.length - 1 ? STEPS[currentIdx + 1].label : 'Done';
  const prevLabel = canGoBack ? STEPS[currentIdx - 1].label : '';

  return (
    <PlaygroundContext.Provider value={{ state, dispatch }}>
      <div style={{
        minHeight: '100vh', background: '#16131e', color: '#f0f0f0',
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
        WebkitFontSmoothing: 'antialiased', position: 'relative', overflow: 'hidden',
      }}>
        {/* Mobile overlay */}
        {isMobile && (
          <div style={{
            position: 'fixed', inset: 0, zIndex: 200,
            background: '#16131e', display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            padding: '2rem', textAlign: 'center',
          }}>
            <div style={{ fontSize: '3.5rem', marginBottom: '1.25rem', lineHeight: 1 }}>🖥️</div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#f0f0f0', marginBottom: '0.75rem' }}>
              Best viewed on Desktop
            </h2>
            <p style={{ fontSize: '0.875rem', color: '#8b8b8b', lineHeight: 1.6, maxWidth: '300px', marginBottom: '1.5rem' }}>
              The Data Cloud RAG Playground is interactive and requires a wider screen. Open it on a laptop or desktop for the full experience.
            </p>
            <a href="/" style={{ padding: '0.625rem 1.25rem', background: 'rgba(168,85,247,0.15)', border: '1px solid rgba(168,85,247,0.3)', borderRadius: '0.5rem', color: '#b87dff', fontSize: '0.875rem', textDecoration: 'none', fontWeight: 500 }}>
              ← Back to LearnRAG
            </a>
          </div>
        )}

        {/* Grid bg */}
        <div style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none', backgroundImage: 'linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)', backgroundSize: '60px 60px' }} />
        <div style={{ position: 'fixed', width: '500px', height: '500px', top: '-100px', right: '-150px', borderRadius: '9999px', background: 'rgba(168,85,247,0.04)', filter: 'blur(120px)', pointerEvents: 'none', zIndex: 0 }} />

        <div style={{ position: 'relative', zIndex: 1 }}>
          {/* Header */}
          <header style={{
            padding: '0 1.5rem', height: '3.5rem', borderBottom: '1px solid rgba(255,255,255,0.04)',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            background: 'rgba(22,19,30,0.6)', backdropFilter: 'blur(20px)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <a href="/" style={{ color: '#f0f0f0', fontSize: '1.125rem', fontWeight: 700, letterSpacing: '-0.03em', textDecoration: 'none' }}>LearnRAG</a>
              <span style={{ width: '1px', height: '18px', background: 'rgba(255,255,255,0.08)' }} />
              <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#b87dff', fontFamily: "'JetBrains Mono', monospace", letterSpacing: '0.05em', textTransform: 'uppercase' as const }}>Salesforce Data Cloud</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ display: 'flex', gap: '0.5rem', fontSize: '0.6875rem', fontFamily: "'JetBrains Mono', monospace" }}>
                {hasData && <span style={{ color: '#4ade80', background: 'rgba(74,222,128,0.08)', padding: '0.125rem 0.5rem', borderRadius: '9999px' }}>{state.rawText.split(/\s+/).length} words</span>}
                {hasChunks && <span style={{ color: '#b87dff', background: 'rgba(168,85,247,0.08)', padding: '0.125rem 0.5rem', borderRadius: '9999px' }}>{state.chunks.length} chunks</span>}
                {hasEmbeddings && <span style={{ color: '#4ade80', background: 'rgba(74,222,128,0.08)', padding: '0.125rem 0.5rem', borderRadius: '9999px' }}>{state.embeddedChunks[0].embedding.length}d vectors</span>}
              </div>
              <a href="/playground/" style={{ fontSize: '0.6875rem', color: '#94a3b8', fontFamily: "'JetBrains Mono', monospace", textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.25rem', transition: 'color 0.15s', padding: '0.25rem 0.5rem', borderRadius: '0.375rem', border: '1px solid rgba(255,255,255,0.06)' }}
                onMouseEnter={e => (e.currentTarget.style.color = '#e0e0e0')}
                onMouseLeave={e => (e.currentTarget.style.color = '#94a3b8')}>
                ← All Playgrounds
              </a>
            </div>
          </header>

          {/* Step indicator */}
          <div style={{
            padding: '1rem 1.5rem', borderBottom: '1px solid rgba(255,255,255,0.04)',
            background: 'rgba(22,19,30,0.3)',
          }}>
            <div style={{ maxWidth: '1400px', margin: '0 auto', display: 'flex', alignItems: 'center' }}>
              {STEPS.map((step, i) => {
                const isActive = currentStep === step.id;
                const isDone = stepComplete[step.id];
                const isReachable = step.id === 'stream'
                  || (step.id === 'dlo' && hasData)
                  || (step.id === 'dmo' && hasData)
                  || (step.id === 'chunk' && hasData)
                  || (step.id === 'embed' && hasChunks)
                  || (step.id === 'retrieve' && hasEmbeddings)
                  || (step.id === 'generate' && hasResults);
                return (
                  <div key={step.id} style={{ display: 'flex', alignItems: 'center', flex: i < STEPS.length - 1 ? 1 : undefined }}>
                    <button
                      onClick={() => isReachable && setCurrentStep(step.id)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'none', border: 'none',
                        cursor: isReachable ? 'pointer' : 'default', padding: 0, opacity: isReachable ? 1 : 0.6,
                      }}
                    >
                      <div style={{
                        width: '2rem', height: '2rem', borderRadius: '50%', flexShrink: 0,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '0.75rem', fontWeight: 700, fontFamily: "'JetBrains Mono', monospace",
                        background: isDone ? '#a855f7' : isActive ? 'rgba(168,85,247,0.15)' : 'rgba(255,255,255,0.04)',
                        border: `2px solid ${isDone ? '#a855f7' : isActive ? '#a855f7' : 'rgba(255,255,255,0.2)'}`,
                        color: isDone ? '#fff' : isActive ? '#b87dff' : '#9ca3af',
                        transition: 'all 0.2s',
                      }}>
                        {isDone ? <Check size={14} strokeWidth={3} /> : step.num}
                      </div>
                      <div style={{ textAlign: 'left' }}>
                        <div style={{
                          fontSize: '0.75rem', fontWeight: isActive ? 600 : 500,
                          color: isActive ? '#f0f0f0' : isDone ? '#b87dff' : '#c0c0c0',
                          whiteSpace: 'nowrap',
                        }}>{step.label}</div>
                        <div style={{
                          fontSize: '0.5625rem', color: isActive ? '#8b8b8b' : '#7a7a8a',
                          fontFamily: "'JetBrains Mono', monospace", whiteSpace: 'nowrap',
                        }}>{step.desc}</div>
                      </div>
                    </button>
                    {i < STEPS.length - 1 && (
                      <div style={{
                        flex: 1, height: '2px', margin: '0 0.75rem', borderRadius: '1px',
                        background: stepComplete[step.id] ? '#a855f7' : 'rgba(255,255,255,0.06)',
                        transition: 'background 0.3s',
                      }} />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Top nav buttons */}
          <StepNav canGoBack={canGoBack} canGoNext={canGoNext} goBack={goBack} goNext={goNext}
            currentIdx={currentIdx} nextLabel={nextLabel} prevLabel={prevLabel} />

          {/* Content */}
          <main style={{ padding: '1.5rem', maxWidth: '1400px', margin: '0 auto', minHeight: 'calc(100vh - 280px)', display: 'flex', gap: '1.5rem', alignItems: 'flex-start' }}>
            {/* Step content */}
            <div style={{ flex: 1, minWidth: 0 }}>
              {currentStep === 'stream' && <DataStreamStep />}
              {currentStep === 'dlo' && <DloPopulateStep />}
              {currentStep === 'dmo' && <DmoPopulateStep />}
              {currentStep === 'chunk' && <ChunkingStep />}
              {currentStep === 'embed' && <EmbeddingStep />}
              {currentStep === 'retrieve' && <RetrievalStep />}
              {currentStep === 'generate' && <GenerateStep />}
            </div>

            {/* Right sidebar — Operations Runbook */}
            <div style={{ width: '260px', flexShrink: 0, position: 'sticky', top: '1rem' }}>
              <DataCloudOperationsPanel status={{ hasData, hasChunks, hasEmbeddings, hasResults, hasAnswer }} currentStep={currentStep} />
            </div>
          </main>

          {/* Bottom nav buttons */}
          <StepNav canGoBack={canGoBack} canGoNext={canGoNext} goBack={goBack} goNext={goNext}
            currentIdx={currentIdx} nextLabel={nextLabel} prevLabel={prevLabel} />
        </div>
      </div>
    </PlaygroundContext.Provider>
  );
}

// ══════════════════════════════════════════════════
// STEP 1: Load Data
// ══════════════════════════════════════════════════

function useSourceDataModelValues() {
  const { state } = usePlayground();
  const dloValues = useMemo(() => {
    if (!state.rawText) return {} as Record<string, string>;
    const nowIso = state.sourceLoadedAt || new Date().toISOString();
    const sourceType = state.sourceType || 'TEXT';
    const extension = sourceType === 'PDF' ? 'pdf' : sourceType === 'WEB' ? 'html' : sourceType === 'CHAT' ? 'txt' : 'md';
    const externalId = toExternalId(state.sourceLabel || 'sample-record');
    const contentType = sourceType === 'PDF' ? 'application/pdf' : sourceType === 'WEB' ? 'text/html' : 'text/plain';
    const fileName = `${externalId}.${extension}`;
    const filePath = state.sourceUrl || '/samples/source';
    const resolvedPath = `https://learnrag.online${filePath}`;
    const sizeBytes = String(state.rawHtml ? state.rawHtml.length : state.rawText.length);

    // UDLO schema — fields match the Salesforce Data Cloud UDLO Schema Attributes exactly
    return {
      FilePath__c: filePath,                              // Primary Key
      ResolvedFilePath__c: resolvedPath,
      ContentType__c: contentType,
      ParentId__c: '',                                    // foreign key — empty until related object exists
      Size__c: sizeBytes,
      Col1__c: '',                                        // currently unused
      Col2__c: '',
      Col3__c: '',
      Col4__c: '',
      Col5__c: '',
      DataSource__c: 'LearnRAG Playground Data Stream',
      DataSourceObject__c: sourceType,
      InternalOrganization__c: 'learnrag',
      ETag__c: '',                                        // currently unused per UDLO schema
      KQ_FilePath__c: filePath,                           // Key Qualifier for FilePath__c
    };
  }, [state.rawText, state.rawHtml, state.sourceLoadedAt, state.sourceType, state.sourceLabel, state.sourceUrl, state.chunkStrategy, state.documentSubtitle]);

  // UDMO schema is identical to UDLO — auto-mapped from the UDLO.
  // Semantic fields (title, body, description) are configured at the Search Index layer, not here.
  const dmoValues = useMemo(() => {
    if (!state.rawText) return [] as DmoFieldValue[];
    return [
      { dmoField: 'FilePath__c',             sourceField: 'FilePath__c',             value: dloValues.FilePath__c || '-' },
      { dmoField: 'ResolvedFilePath__c',      sourceField: 'ResolvedFilePath__c',     value: dloValues.ResolvedFilePath__c || '-' },
      { dmoField: 'ContentType__c',           sourceField: 'ContentType__c',          value: dloValues.ContentType__c || '-' },
      { dmoField: 'ParentId__c',             sourceField: 'ParentId__c',             value: dloValues.ParentId__c || '' },
      { dmoField: 'Size__c',                 sourceField: 'Size__c',                 value: dloValues.Size__c || '-' },
      { dmoField: 'Col1__c',                 sourceField: 'Col1__c',                 value: '' },
      { dmoField: 'Col2__c',                 sourceField: 'Col2__c',                 value: '' },
      { dmoField: 'Col3__c',                 sourceField: 'Col3__c',                 value: '' },
      { dmoField: 'Col4__c',                 sourceField: 'Col4__c',                 value: '' },
      { dmoField: 'Col5__c',                 sourceField: 'Col5__c',                 value: '' },
      { dmoField: 'DataSource__c',           sourceField: 'DataSource__c',           value: dloValues.DataSource__c || '' },
      { dmoField: 'DataSourceObject__c',     sourceField: 'DataSourceObject__c',     value: dloValues.DataSourceObject__c || '' },
      { dmoField: 'InternalOrganization__c', sourceField: 'InternalOrganization__c', value: dloValues.InternalOrganization__c || '' },
      { dmoField: 'ETag__c',                 sourceField: 'ETag__c',                 value: '' },
      { dmoField: 'KQ_FilePath__c',          sourceField: 'KQ_FilePath__c',          value: dloValues.KQ_FilePath__c || '-' },
    ];
  }, [state.rawText, dloValues]);

  return { dloValues, dmoValues };
}

function DataStreamStep() {
  const { state } = usePlayground();
  return (
    <div>
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.25rem' }}>Data Stream Load</h2>
        <p style={{ fontSize: '0.8125rem', color: '#8b8b8b', lineHeight: 1.5 }}>
          Select a source and trigger the data stream load event. This creates the record that feeds DLO and DMO stages.
        </p>
      </div>
      <IngestionPanel />
      {state.rawText && (
        <div style={{ marginTop: '1.25rem', padding: '0.75rem 0.875rem', background: 'rgba(74,222,128,0.04)', border: '1px solid rgba(74,222,128,0.15)', borderRadius: '0.5rem', fontFamily: "'JetBrains Mono', monospace" }}>
          <div style={{ fontSize: '0.8125rem', color: '#4ade80', fontWeight: 600 }}>
            {state.sourceLabel || 'source record'}
          </div>
          {state.documentSubtitle && (
            <div style={{ fontSize: '0.6875rem', color: '#6b9e6b', marginTop: '0.125rem' }}>
              {state.documentSubtitle}
            </div>
          )}
          <div style={{ fontSize: '0.6875rem', color: '#4ade8088', marginTop: '0.375rem' }}>
            Data stream loaded — proceed to DLO Populate →
          </div>
        </div>
      )}
    </div>
  );
}

function DloPopulateStep() {
  const { state } = usePlayground();
  const { dloValues } = useSourceDataModelValues();
  const [fieldSearch, setFieldSearch] = useState('');
  const filteredFields = useMemo(() => {
    const q = fieldSearch.trim().toLowerCase();
    if (!q) return DLO_FIELDS;
    return DLO_FIELDS.filter(f =>
      f.label.toLowerCase().includes(q) ||
      f.apiName.toLowerCase().includes(q) ||
      f.dataType.toLowerCase().includes(q) ||
      (f.fieldUsedAs || '').toLowerCase().includes(q) ||
      (f.keyQualifier || '').toLowerCase().includes(q)
    );
  }, [fieldSearch]);

  if (!state.rawText) {
    return <div style={{ padding: '3rem', textAlign: 'center', color: '#636363', background: 'rgba(30,26,41,0.3)', borderRadius: '0.75rem', border: '1px dashed rgba(255,255,255,0.06)' }}>Load Data Stream first.</div>;
  }

  return (
    <div>
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.25rem' }}>DLO Populate</h2>
        <p style={{ fontSize: '0.8125rem', color: '#8b8b8b', lineHeight: 1.5 }}>
          Raw source metadata is populated into DLO fields with concrete values from the loaded stream event.
        </p>
      </div>
      <div style={{ marginBottom: '1.25rem', padding: '1rem', background: 'rgba(30,26,41,0.5)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '0.75rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
          <div>
            <div style={{ fontSize: '0.6875rem', fontFamily: "'JetBrains Mono', monospace", color: '#93c5fd', letterSpacing: '0.08em', textTransform: 'uppercase' as const, fontWeight: 600 }}>
              DLO Fields ({DLO_FIELDS.length})
            </div>
            <div style={{ fontSize: '0.75rem', color: '#8b8b8b', marginTop: '0.2rem' }}>
              Populated object-level values.
            </div>
          </div>
          <input
            type="text"
            placeholder="Search fields..."
            value={fieldSearch}
            onChange={e => setFieldSearch(e.target.value)}
            style={{ width: '260px', maxWidth: '100%', padding: '0.5rem 0.65rem', background: 'rgba(22,19,30,0.6)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '0.5rem', color: '#e0e0e0', fontSize: '0.75rem', fontFamily: "'JetBrains Mono', monospace" }}
          />
        </div>
        <div style={{ overflow: 'auto', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '0.5rem' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '1120px' }}>
            <thead>
              <tr style={{ background: 'rgba(10,8,16,0.45)' }}>
                {['Field Label', 'Field API Name', 'Data Type', 'Field Used As', 'Key Qualifier', 'Value'].map(head => (
                  <th key={head} style={{ textAlign: 'left', padding: '0.5rem 0.625rem', fontSize: '0.625rem', color: '#636363', letterSpacing: '0.06em', fontFamily: "'JetBrains Mono', monospace", textTransform: 'uppercase', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>{head}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredFields.map(f => (
                <tr key={f.apiName}>
                  <td style={tableCellStyle}>{f.label}</td>
                  <td style={tableCellStyle}><code style={tableCodeStyle}>{f.apiName}</code></td>
                  <td style={tableCellStyle}>{f.dataType}</td>
                  <td style={tableCellStyle}>{f.fieldUsedAs || '-'}</td>
                  <td style={tableCellStyle}>{f.keyQualifier || '-'}</td>
                  <td style={tableCellStyle}>{dloValues[f.apiName] || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function DmoPopulateStep() {
  const { state } = usePlayground();
  const { dmoValues } = useSourceDataModelValues();

  if (!state.rawText) {
    return <div style={{ padding: '3rem', textAlign: 'center', color: '#636363', background: 'rgba(30,26,41,0.3)', borderRadius: '0.75rem', border: '1px dashed rgba(255,255,255,0.06)' }}>Load Data Stream first.</div>;
  }

  return (
    <div>
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.25rem' }}>DMO Populate</h2>
        <p style={{ fontSize: '0.8125rem', color: '#8b8b8b', lineHeight: 1.5 }}>
          For unstructured data, the UDMO schema is identical to the UDLO — fields are auto-mapped 1:1 with no transformation.
          Semantic enrichment (title, body text, description parsing) is configured at the <strong style={{ color: '#b87dff' }}>Search Index layer</strong> in the next step, not here.
        </p>
      </div>
      <div style={{ marginBottom: '1.25rem', padding: '1rem', background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
          <div style={{ fontSize: '0.6875rem', fontFamily: "'JetBrains Mono', monospace", color: '#93c5fd', letterSpacing: '0.08em', textTransform: 'uppercase' as const, fontWeight: 700 }}>
            UDMO Fields (auto-mapped from UDLO)
          </div>
          <div style={{ fontSize: '0.6rem', fontFamily: "'JetBrains Mono', monospace", color: '#4ade80', background: 'rgba(74,222,128,0.08)', border: '1px solid rgba(74,222,128,0.2)', padding: '0.1rem 0.4rem', borderRadius: '9999px' }}>
            1:1 mapping
          </div>
        </div>
        <div style={{ overflow: 'auto', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '0.5rem' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '860px' }}>
            <thead>
              <tr style={{ background: 'rgba(10,8,16,0.45)' }}>
                {['DMO Field', 'Source Mapping', 'Value'].map(head => (
                  <th key={head} style={{ textAlign: 'left', padding: '0.5rem 0.625rem', fontSize: '0.625rem', color: '#636363', letterSpacing: '0.06em', fontFamily: "'JetBrains Mono', monospace", textTransform: 'uppercase', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>{head}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {dmoValues.map(row => (
                <tr key={row.dmoField}>
                  <td style={tableCellStyle}>{row.dmoField}</td>
                  <td style={tableCellStyle}><code style={tableCodeStyle}>{row.sourceField}</code></td>
                  <td style={tableCellStyle}>{row.value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <div style={{ marginTop: '1.25rem', padding: '0.75rem', background: 'rgba(74,222,128,0.04)', border: '1px solid rgba(74,222,128,0.15)', borderRadius: '0.5rem', fontSize: '0.75rem', color: '#4ade80', fontFamily: "'JetBrains Mono', monospace" }}>
        DMO fields mapped — proceed to Slicer {'->'}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════
// STEP 2: Chunking
// ══════════════════════════════════════════════════

function stripHtmlTags(html: string): string {
  const stripped = html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  // Decode HTML entities (&middot; &mdash; &uuml; etc.) using the browser's parser
  try {
    const ta = document.createElement('textarea');
    ta.innerHTML = stripped;
    return ta.value.replace(/\s+/g, ' ').trim();
  } catch {
    return stripped;
  }
}

function ChunkingStep() {
  const { state, dispatch } = usePlayground();
  const [prependEnabled, setPrependEnabled] = useState(false);
  const [prependText, setPrependText] = useState('');
  const [hoveredChunk, setHoveredChunk] = useState<number | null>(null);

  const handleChunk = useCallback(() => {
    if (!state.rawText.trim()) return;
    dispatch({ type: 'CLEAR_LOG' });

    // Decide what body text goes into the search index
    const rawSource = state.rawHtml || state.rawText;
    const bodyForChunking = state.stripHtml ? stripHtmlTags(rawSource) : rawSource;

    dispatch({ type: 'ADD_LOG', payload: `Step 4: Slicer started — Strip HTML: ${state.stripHtml ? 'ON' : 'OFF'} — creating Chunk DMO records.` });
    const prepend = prependEnabled ? prependText : undefined;
    const chunks = chunkText(bodyForChunking, state.chunkStrategy, state.chunkSize, state.chunkOverlap, prepend);
    dispatch({ type: 'SET_CHUNKS', payload: chunks });
    dispatch({ type: 'ADD_LOG', payload: `Step 4 complete — ${chunks.length} chunk records created with ${state.chunkOverlap} overlap.` });
    dispatch({ type: 'SET_EMBEDDED_CHUNKS', payload: [] });
    dispatch({ type: 'SET_RESULTS', payload: [] });
    dispatch({ type: 'SET_GENERATED_ANSWER', payload: '' });
  }, [state.rawText, state.rawHtml, state.stripHtml, state.chunkStrategy, state.chunkSize, state.chunkOverlap, prependEnabled, prependText, dispatch]);

  // Auto-chunk when params change, but only after user has chunked at least once
  const hasChunkedOnce = useRef(false);
  const prevParamsRef = useRef('');
  useEffect(() => {
    if (state.chunks.length > 0) hasChunkedOnce.current = true;
  }, [state.chunks.length]);
  useEffect(() => {
    const key = `${state.chunkStrategy}-${state.chunkSize}-${state.chunkOverlap}-${prependEnabled}-${prependText}-${state.stripHtml}`;
    if (state.rawText && hasChunkedOnce.current && prevParamsRef.current && prevParamsRef.current !== key) {
      handleChunk();
    }
    prevParamsRef.current = key;
  }, [state.chunkStrategy, state.chunkSize, state.chunkOverlap, prependEnabled, prependText, state.stripHtml]);

  const strategyInfo = STRATEGY_INFO[state.chunkStrategy];

  return (
    <div>
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.25rem' }}>Chunking</h2>
        <p style={{ fontSize: '0.8125rem', color: '#8b8b8b', lineHeight: 1.5 }}>
          We slice long documents into section-aware chunks, apply overlap as a safety buffer, and optionally prepend
          the title field so each chunk keeps document identity.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '1.5rem', alignItems: 'start' }}>
        {/* Left: Controls */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', position: 'sticky', top: '5rem' }}>
          <div style={{ fontSize: '0.6875rem', fontFamily: "'JetBrains Mono', monospace", color: '#b87dff', letterSpacing: '0.1em', textTransform: 'uppercase' as const, fontWeight: 600 }}>
            Configuration
          </div>

          <div>
            <label style={labelStyle}>Split Strategy</label>
            <select value={state.chunkStrategy} onChange={e => dispatch({ type: 'SET_CHUNK_STRATEGY', payload: e.target.value as ChunkStrategy })}
              style={selectStyle}>
              {(Object.keys(STRATEGY_INFO) as ChunkStrategy[]).map(key => (
                <option key={key} value={key}>{STRATEGY_INFO[key].label}</option>
              ))}
            </select>
            <p style={{ margin: '0.25rem 0 0', fontSize: '0.6875rem', color: '#636363', lineHeight: 1.4 }}>{strategyInfo?.description}</p>
          </div>

          <div>
            <label style={labelStyle}>Max Tokens (chunk size): {state.chunkSize}</label>
            <input type="range" min={50} max={1000} step={10} value={state.chunkSize}
              onChange={e => dispatch({ type: 'SET_CHUNK_SIZE', payload: Number(e.target.value) })}
              style={{ width: '100%', accentColor: '#a855f7' }} />
          </div>

          <div>
            <label style={labelStyle}>Overlap (safety buffer): {state.chunkOverlap}</label>
            <input type="range" min={0} max={200} step={5} value={state.chunkOverlap}
              onChange={e => dispatch({ type: 'SET_CHUNK_OVERLAP', payload: Number(e.target.value) })}
              style={{ width: '100%', accentColor: '#a855f7' }} />
          </div>

          {/* Strip HTML toggle */}
          <div style={{ padding: '0.625rem', background: state.stripHtml ? 'rgba(59,130,246,0.04)' : 'rgba(248,113,113,0.04)', border: `1px solid ${state.stripHtml ? 'rgba(59,130,246,0.2)' : 'rgba(248,113,113,0.2)'}`, borderRadius: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }} onClick={() => dispatch({ type: 'SET_STRIP_HTML', payload: !state.stripHtml })}>
              <div style={{ width: '28px', height: '16px', borderRadius: '8px', background: state.stripHtml ? '#3b82f6' : 'rgba(255,255,255,0.1)', position: 'relative', transition: 'background 0.2s', flexShrink: 0 }}>
                <div style={{ position: 'absolute', top: '2px', left: state.stripHtml ? '14px' : '2px', width: '12px', height: '12px', borderRadius: '50%', background: '#fff', transition: 'left 0.2s' }} />
              </div>
              <span style={{ fontSize: '0.75rem', fontWeight: 500, color: state.stripHtml ? '#93c5fd' : '#f87171' }}>Strip HTML Tags</span>
            </div>
            <p style={{ fontSize: '0.6875rem', color: '#636363', marginTop: '0.25rem', lineHeight: 1.4 }}>
              {state.stripHtml
                ? 'HTML tags removed before indexing. Chunks contain clean text.'
                : 'Raw HTML preserved in chunks. Tags like <p>, <h2> will appear in results.'}
            </p>
          </div>

          {/* Prepend title toggle */}
          <div style={{ padding: '0.625rem', background: prependEnabled ? 'rgba(251,191,36,0.04)' : 'transparent', border: `1px solid ${prependEnabled ? 'rgba(251,191,36,0.15)' : 'rgba(255,255,255,0.04)'}`, borderRadius: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }} onClick={() => setPrependEnabled(!prependEnabled)}>
              <div style={{ width: '28px', height: '16px', borderRadius: '8px', background: prependEnabled ? '#fbbf24' : 'rgba(255,255,255,0.1)', position: 'relative', transition: 'background 0.2s', flexShrink: 0 }}>
                <div style={{ position: 'absolute', top: '2px', left: prependEnabled ? '14px' : '2px', width: '12px', height: '12px', borderRadius: '50%', background: '#fff', transition: 'left 0.2s' }} />
              </div>
              <span style={{ fontSize: '0.75rem', fontWeight: 500, color: prependEnabled ? '#fbbf24' : '#636363' }}>Prepend Field (Title)</span>
            </div>
            {prependEnabled && (
              <input type="text" value={prependText} onChange={e => setPrependText(e.target.value)}
                placeholder="Article Title: Vector Indexing Guide"
                style={{ width: '100%', marginTop: '0.375rem', padding: '0.375rem 0.5rem', background: 'rgba(22,19,30,0.6)', border: '1px solid rgba(251,191,36,0.2)', borderRadius: '0.375rem', color: '#e0e0e0', fontSize: '0.75rem' }} />
            )}
          </div>

          {state.rawText && state.chunks.length === 0 && (
            <button onClick={handleChunk} style={{
              padding: '0.5rem 1.25rem', background: '#a855f7', color: '#f0f0f0',
              border: 'none', borderRadius: '0.5rem', cursor: 'pointer', fontWeight: 600, fontSize: '0.8125rem',
              boxShadow: '0 0 20px rgba(168,85,247,0.15)',
            }}>
              Split into Chunks
            </button>
          )}

          {state.chunks.length > 0 && (
            <div style={{ padding: '0.625rem', background: 'rgba(30,26,41,0.5)', border: '1px solid rgba(255,255,255,0.04)', borderRadius: '0.5rem' }}>
              <div style={{ fontSize: '0.6875rem', fontFamily: "'JetBrains Mono', monospace", color: '#636363', letterSpacing: '0.05em', textTransform: 'uppercase' as const, marginBottom: '0.375rem' }}>Stats</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.25rem', fontSize: '0.75rem' }}>
                <span style={{ color: '#8b8b8b' }}>Chunks:</span><span style={{ color: '#f0f0f0', fontFamily: "'JetBrains Mono', monospace" }}>{state.chunks.length}</span>
                <span style={{ color: '#8b8b8b' }}>Avg size:</span><span style={{ color: '#f0f0f0', fontFamily: "'JetBrains Mono', monospace" }}>{Math.round(state.chunks.reduce((s, c) => s + c.text.length, 0) / state.chunks.length)} chars</span>
                <span style={{ color: '#8b8b8b' }}>Avg tokens:</span><span style={{ color: '#f0f0f0', fontFamily: "'JetBrains Mono', monospace" }}>~{Math.round(state.chunks.reduce((s, c) => s + c.tokenEstimate, 0) / state.chunks.length)}</span>
                <span style={{ color: '#8b8b8b' }}>Overlap:</span><span style={{ color: '#f0f0f0', fontFamily: "'JetBrains Mono', monospace" }}>{state.chunkOverlap} chars</span>
              </div>
            </div>
          )}
        </div>

        {/* Right: Chunks display */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {!state.rawText && (
            <div style={{ padding: '3rem', textAlign: 'center', color: '#636363', background: 'rgba(30,26,41,0.3)', borderRadius: '0.75rem', border: '1px dashed rgba(255,255,255,0.06)' }}>
              Go back to Step 1 and load a document first.
            </div>
          )}

          {state.rawText && state.chunks.length > 0 && (
            <div>
              <div style={{ fontSize: '0.6875rem', fontFamily: "'JetBrains Mono', monospace", color: '#636363', letterSpacing: '0.05em', textTransform: 'uppercase' as const, marginBottom: '0.5rem' }}>
                Source Document
              </div>
              <div style={{
                padding: '0.875rem', background: 'rgba(30,26,41,0.5)', border: '1px solid rgba(255,255,255,0.04)',
                borderRadius: '0.75rem', fontSize: '0.75rem', color: '#8b8b8b', lineHeight: 1.6,
                maxHeight: '180px', overflow: 'auto', whiteSpace: 'pre-wrap', fontFamily: "'JetBrains Mono', monospace",
              }}>
                {state.rawText}
              </div>
            </div>
          )}

          {state.chunks.length > 0 && (
            <div>
              <div style={{ fontSize: '0.6875rem', fontFamily: "'JetBrains Mono', monospace", color: '#636363', letterSpacing: '0.05em', textTransform: 'uppercase' as const, marginBottom: '0.5rem' }}>
                Generated Chunks ({state.chunks.length})
              </div>
              <div style={{ display: 'grid', gap: '0.5rem', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
                {state.chunks.map((chunk, i) => {
                  const color = COLORS[i % COLORS.length];
                  return (
                    <div key={chunk.id}
                      onMouseEnter={() => setHoveredChunk(i)}
                      onMouseLeave={() => setHoveredChunk(null)}
                      style={{
                        padding: '0.75rem', background: hoveredChunk === i ? `${color}10` : `${color}05`,
                        border: `1px solid ${hoveredChunk === i ? `${color}40` : `${color}15`}`,
                        borderRadius: '0.75rem', fontSize: '0.75rem', transition: 'all 0.15s', cursor: 'default',
                      }}>
                      <div style={{ fontWeight: 600, color, marginBottom: '0.25rem', display: 'flex', justifyContent: 'space-between' }}>
                        <span>Chunk {i + 1}</span>
                        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.6875rem', opacity: 0.7 }}>~{chunk.tokenEstimate} tok · {chunk.text.length} chars</span>
                      </div>
                      <div style={{ color: '#b0b0b0', lineHeight: 1.5, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{chunk.text}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════
// STEP 3: Embedding (enhanced)
// ══════════════════════════════════════════════════

function EmbeddingStep() {
  const { state, dispatch } = usePlayground();
  const [selectedModel, setSelectedModel] = useState(0);
  const [inspectChunk, setInspectChunk] = useState<number | null>(null);
  const [compareA, setCompareA] = useState(0);
  const [compareB, setCompareB] = useState(1);
  const [hoveredCell, setHoveredCell] = useState<{ i: number; j: number } | null>(null);

  const MODELS = [
    { label: 'E5-Large-V2 (factory target)', dims: 384, desc: 'Meaning-to-vector translation' },
    { label: 'BGE Small (v1.5)', dims: 384, desc: 'Strong MTEB scores' },
    { label: 'GTE Small', dims: 384, desc: 'Good multilingual' },
  ];

  const handleEmbed = async () => {
    dispatch({ type: 'SET_IS_EMBEDDING', payload: true });
    dispatch({ type: 'SET_EMBEDDING_PROGRESS', payload: 0 });
    dispatch({ type: 'ADD_LOG', payload: 'Step 5: Translator started — generating IDMO vectors from Chunk DMO.' });
    try {
      const { embedText, BROWSER_MODELS, setModel } = await import('../../../lib/embeddings');
      setModel(BROWSER_MODELS[selectedModel].id);
      const embedded: EmbeddedChunk[] = [];
      for (let i = 0; i < state.chunks.length; i++) {
        const embedding = await embedText(state.chunks[i].text);
        embedded.push({ ...state.chunks[i], embedding });
        dispatch({ type: 'SET_EMBEDDING_PROGRESS', payload: Math.round(((i + 1) / state.chunks.length) * 100) });
      }
      dispatch({ type: 'SET_EMBEDDED_CHUNKS', payload: embedded });
      dispatch({ type: 'ADD_LOG', payload: `Step 5 complete — ${embedded.length} vectors indexed in IDMO.` });
    } catch (err) {
      console.error('Embedding failed:', err);
    } finally {
      dispatch({ type: 'SET_IS_EMBEDDING', payload: false });
    }
  };

  // Similarity matrix
  const simMatrix = useMemo(() => {
    if (state.embeddedChunks.length === 0) return [];
    return state.embeddedChunks.map((a) =>
      state.embeddedChunks.map((b) => cosineSimilarity(a.embedding, b.embedding))
    );
  }, [state.embeddedChunks]);

  // PCA 2D projection
  const points2D = useMemo(() => {
    if (state.embeddedChunks.length < 2) return [];
    const vecs = state.embeddedChunks.map(c => c.embedding);
    const dims = vecs[0].length;
    const n = vecs.length;
    const mean = new Array(dims).fill(0);
    for (const v of vecs) for (let d = 0; d < dims; d++) mean[d] += v[d] / n;
    const centered = vecs.map(v => v.map((val, d) => val - mean[d]));
    function powerIter(data: number[][], exclude?: number[]): number[] {
      let vec = data[0].map(() => Math.random() - 0.5);
      for (let iter = 0; iter < 30; iter++) {
        const r = new Array(dims).fill(0);
        for (const row of data) { let d2 = 0; for (let d = 0; d < dims; d++) d2 += row[d] * vec[d]; for (let d = 0; d < dims; d++) r[d] += d2 * row[d]; }
        if (exclude) { let d2 = 0; for (let d = 0; d < dims; d++) d2 += r[d] * exclude[d]; for (let d = 0; d < dims; d++) r[d] -= d2 * exclude[d]; }
        let norm = 0; for (let d = 0; d < dims; d++) norm += r[d] * r[d]; norm = Math.sqrt(norm) || 1;
        vec = r.map(v => v / norm);
      }
      return vec;
    }
    const pc1 = powerIter(centered);
    const pc2 = powerIter(centered, pc1);
    const raw = centered.map(row => ({ x: row.reduce((s, v, d) => s + v * pc1[d], 0), y: row.reduce((s, v, d) => s + v * pc2[d], 0) }));
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    for (const p of raw) { if (p.x < minX) minX = p.x; if (p.x > maxX) maxX = p.x; if (p.y < minY) minY = p.y; if (p.y > maxY) maxY = p.y; }
    const rx = maxX - minX || 1, ry = maxY - minY || 1;
    return raw.map(p => ({ x: (p.x - minX) / rx, y: (p.y - minY) / ry }));
  }, [state.embeddedChunks]);

  // Comparison score
  const comparisonScore = useMemo(() => {
    if (state.embeddedChunks.length < 2) return null;
    const a = state.embeddedChunks[compareA]?.embedding;
    const b = state.embeddedChunks[compareB]?.embedding;
    if (!a || !b) return null;
    return cosineSimilarity(a, b);
  }, [state.embeddedChunks, compareA, compareB]);

  const hasEmbeddings = state.embeddedChunks.length > 0;

  return (
    <div>
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.25rem' }}>Embedding</h2>
        <p style={{ fontSize: '0.8125rem', color: '#8b8b8b', lineHeight: 1.5, marginBottom: '0.625rem' }}>
          Each chunk is translated into vector math and stored in the{" "}
          <strong style={{ color: '#c0c0c0' }}>Index DMO (IDMO)</strong>. In production, this stage typically uses
          models like <strong style={{ color: '#c0c0c0' }}>E5-Large-V2</strong> for meaning-aware retrieval.
        </p>
        <p style={{ fontSize: '0.8125rem', color: '#8b8b8b', lineHeight: 1.5 }}>
          Computers can't search text by <em>meaning</em> — but they can do math on numbers. An embedding model converts each chunk into a list of numbers called a <strong style={{ color: '#c0c0c0' }}>vector</strong>. Similar chunks produce similar numbers. That's the foundation of semantic search.
        </p>
      </div>

      {/* Model selection + embed button */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem', flexWrap: 'wrap', alignItems: 'center' }}>
        {MODELS.map((model, i) => (
          <button key={i} onClick={() => { setSelectedModel(i); dispatch({ type: 'SET_EMBEDDED_CHUNKS', payload: [] }); }}
            style={{
              padding: '0.5rem 0.875rem', textAlign: 'left',
              background: selectedModel === i ? 'rgba(168,85,247,0.08)' : 'rgba(30,26,41,0.5)',
              border: `1px solid ${selectedModel === i ? 'rgba(168,85,247,0.3)' : 'rgba(255,255,255,0.06)'}`,
              borderRadius: '0.5rem', cursor: 'pointer', transition: 'all 0.15s',
            }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: selectedModel === i ? '#b87dff' : '#c0c0c0' }}>{model.label}</div>
            <div style={{ fontSize: '0.625rem', color: '#636363' }}>{model.desc} · {model.dims}d</div>
          </button>
        ))}
        <button onClick={handleEmbed} disabled={state.isEmbedding || state.chunks.length === 0}
          style={{
            padding: '0.625rem 1.5rem', background: state.isEmbedding ? 'rgba(168,85,247,0.2)' : '#a855f7',
            color: state.isEmbedding ? '#636363' : '#f0f0f0', border: 'none', borderRadius: '0.5rem',
            cursor: state.isEmbedding ? 'wait' : 'pointer', fontWeight: 600, fontSize: '0.875rem',
            boxShadow: state.isEmbedding ? 'none' : '0 0 20px rgba(168,85,247,0.15)',
          }}>
          {state.isEmbedding ? `Embedding... ${state.embeddingProgress}%` : hasEmbeddings ? 'Re-embed All' : 'Embed All Chunks'}
        </button>
      </div>

      {state.isEmbedding && (
        <div style={{ height: '4px', background: 'rgba(255,255,255,0.04)', borderRadius: '2px', overflow: 'hidden', marginBottom: '1.25rem' }}>
          <div style={{ width: `${state.embeddingProgress}%`, height: '100%', background: 'linear-gradient(90deg, #a855f799, #a855f7)', borderRadius: '2px', transition: 'width 0.3s ease' }} />
        </div>
      )}

      {/* Model note */}
      <div style={{ padding: '0.625rem 0.875rem', background: 'rgba(251,191,36,0.06)', border: '1px solid rgba(251,191,36,0.15)', borderRadius: '0.5rem', marginBottom: '1.25rem', fontSize: '0.75rem', color: '#a08050', lineHeight: 1.5 }}>
        <strong style={{ color: '#fbbf24' }}>⚠ Important:</strong> The model you embed with must be the same model you search with. Swap models between steps and every similarity score collapses to noise — the number spaces are incompatible.
      </div>

      {!hasEmbeddings && !state.isEmbedding && (
        <div style={{ padding: '3rem', textAlign: 'center', color: '#636363', background: 'rgba(30,26,41,0.3)', borderRadius: '0.75rem', border: '1px dashed rgba(255,255,255,0.06)' }}>
          Select a model above and click <strong style={{ color: '#8b8b8b' }}>"Embed All Chunks"</strong> to convert every chunk into a vector. Everything runs in your browser — no API key, no cost.
        </div>
      )}

      {hasEmbeddings && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

          {/* ── Section A: What does an embedding look like? ── */}
          <div style={{ padding: '1.25rem', background: 'rgba(30,26,41,0.5)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '0.75rem' }}>
            <div style={{ fontSize: '0.6875rem', fontFamily: "'JetBrains Mono', monospace", color: '#b87dff', letterSpacing: '0.1em', textTransform: 'uppercase' as const, fontWeight: 600, marginBottom: '0.75rem' }}>
              What does a vector look like?
            </div>
            <p style={{ fontSize: '0.8125rem', color: '#8b8b8b', marginBottom: '0.5rem', lineHeight: 1.5 }}>
              Each chunk becomes a list of <strong style={{ color: '#c0c0c0' }}>{state.embeddedChunks[0].embedding.length} numbers</strong>. These numbers don't mean anything individually — together they encode where this chunk sits in meaning-space. Click a chunk pill to inspect its raw vector and shape.
            </p>
            <p style={{ fontSize: '0.8125rem', color: '#8b8b8b', marginBottom: '1rem', lineHeight: 1.5 }}>
              Notice that every chunk has a completely different bar shape below. A chunk about HNSW indexing looks nothing like a chunk about pricing. That visual fingerprint <em>is</em> the embedding.
            </p>

            {/* Chunk selector pills */}
            <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
              {state.embeddedChunks.map((_, i) => (
                <button key={i} onClick={() => setInspectChunk(inspectChunk === i ? null : i)}
                  style={{
                    padding: '0.25rem 0.625rem', fontSize: '0.6875rem', fontFamily: "'JetBrains Mono', monospace",
                    background: inspectChunk === i ? `${COLORS[i % COLORS.length]}20` : 'rgba(255,255,255,0.04)',
                    border: `1px solid ${inspectChunk === i ? COLORS[i % COLORS.length] : 'rgba(255,255,255,0.08)'}`,
                    borderRadius: '9999px', color: inspectChunk === i ? COLORS[i % COLORS.length] : '#8b8b8b',
                    cursor: 'pointer', transition: 'all 0.15s',
                  }}>
                  C{i + 1}
                </button>
              ))}
            </div>

            {inspectChunk !== null && state.embeddedChunks[inspectChunk] && (
              <div>
                {/* Chunk text */}
                <div style={{ padding: '0.625rem', background: `${COLORS[inspectChunk % COLORS.length]}08`, border: `1px solid ${COLORS[inspectChunk % COLORS.length]}20`, borderRadius: '0.5rem', fontSize: '0.75rem', color: '#b0b0b0', marginBottom: '0.75rem', lineHeight: 1.5 }}>
                  <span style={{ color: COLORS[inspectChunk % COLORS.length], fontWeight: 600 }}>Chunk {inspectChunk + 1}:</span> {state.embeddedChunks[inspectChunk].text.slice(0, 150)}{state.embeddedChunks[inspectChunk].text.length > 150 ? '...' : ''}
                </div>

                {/* Raw vector numbers */}
                <div style={{ fontSize: '0.6875rem', fontFamily: "'JetBrains Mono', monospace", color: '#636363', marginBottom: '0.375rem' }}>
                  Raw vector ({state.embeddedChunks[inspectChunk].embedding.length} dimensions):
                </div>
                <div style={{
                  padding: '0.625rem', background: 'rgba(10,8,16,0.5)', borderRadius: '0.5rem',
                  fontSize: '0.625rem', fontFamily: "'JetBrains Mono', monospace", color: '#8b8b8b',
                  maxHeight: '80px', overflow: 'auto', lineHeight: 1.6, wordBreak: 'break-all',
                }}>
                  [{state.embeddedChunks[inspectChunk].embedding.slice(0, 30).map(v => v.toFixed(4)).join(', ')}
                  {state.embeddedChunks[inspectChunk].embedding.length > 30 ? `, ... +${state.embeddedChunks[inspectChunk].embedding.length - 30} more` : ''}]
                </div>

                {/* Mini bar chart of first 50 dimensions */}
                <div style={{ marginTop: '0.75rem' }}>
                  <div style={{ fontSize: '0.625rem', fontFamily: "'JetBrains Mono', monospace", color: '#636363', marginBottom: '0.375rem' }}>
                    First 50 dimensions visualized (positive = up, negative = down):
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', height: '60px', gap: '1px', background: 'rgba(10,8,16,0.3)', borderRadius: '0.375rem', padding: '0 2px', overflow: 'hidden' }}>
                    {state.embeddedChunks[inspectChunk].embedding.slice(0, 50).map((val, d) => {
                      const maxAbs = Math.max(...state.embeddedChunks[inspectChunk].embedding.slice(0, 50).map(Math.abs));
                      const norm = maxAbs ? val / maxAbs : 0;
                      const h = Math.abs(norm) * 28;
                      const isPos = val >= 0;
                      return (
                        <div key={d} style={{ flex: 1, height: '60px', display: 'flex', flexDirection: 'column', justifyContent: 'center', position: 'relative' }}
                          title={`d${d}: ${val.toFixed(4)}`}>
                          <div style={{ position: 'absolute', top: isPos ? `${30 - h}px` : '30px', width: '100%', height: `${h}px`, background: isPos ? '#a855f7' : '#f87171', opacity: 0.6, borderRadius: '1px' }} />
                        </div>
                      );
                    })}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.5625rem', fontFamily: "'JetBrains Mono', monospace", color: '#4a4a4a', marginTop: '0.125rem' }}>
                    <span>d0</span><span>d49</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ── Section B: Compare two chunks (cosine similarity explained) ── */}
          <div style={{ padding: '1.25rem', background: 'rgba(30,26,41,0.5)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '0.75rem' }}>
            <div style={{ fontSize: '0.6875rem', fontFamily: "'JetBrains Mono', monospace", color: '#4ade80', letterSpacing: '0.1em', textTransform: 'uppercase' as const, fontWeight: 600, marginBottom: '0.75rem' }}>
              How is similarity measured?
            </div>
            <p style={{ fontSize: '0.8125rem', color: '#8b8b8b', marginBottom: '0.5rem', lineHeight: 1.5 }}>
              <strong style={{ color: '#c0c0c0' }}>Cosine similarity</strong> asks: <em>"do these two vectors point in roughly the same direction?"</em> Identical direction = 1.0, completely opposite = 0.0. It doesn't matter how long the vectors are — only the angle counts.
            </p>
            <p style={{ fontSize: '0.8125rem', color: '#8b8b8b', marginBottom: '1rem', lineHeight: 1.5 }}>
              Try comparing two chunks on the same topic, then swap one for a chunk on a completely different topic. Watch the score and the bar chart change. When bars align, the score is high. When they diverge, it drops.
            </p>

            {/* Chunk A / B selectors */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
              <div>
                <label style={labelStyle}>Chunk A</label>
                <select value={compareA} onChange={e => setCompareA(Number(e.target.value))} style={selectStyle}>
                  {state.embeddedChunks.map((_, i) => <option key={i} value={i}>C{i + 1}: {state.embeddedChunks[i].text.slice(0, 40)}...</option>)}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Chunk B</label>
                <select value={compareB} onChange={e => setCompareB(Number(e.target.value))} style={selectStyle}>
                  {state.embeddedChunks.map((_, i) => <option key={i} value={i}>C{i + 1}: {state.embeddedChunks[i].text.slice(0, 40)}...</option>)}
                </select>
              </div>
            </div>

            {comparisonScore !== null && (
              <div>
                {/* Score display */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                  <div style={{
                    fontSize: '2rem', fontWeight: 800, fontFamily: "'JetBrains Mono', monospace",
                    color: scoreColor(comparisonScore),
                  }}>
                    {comparisonScore.toFixed(4)}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ height: '8px', background: 'rgba(255,255,255,0.04)', borderRadius: '4px', overflow: 'hidden' }}>
                      <div style={{
                        width: `${Math.max(comparisonScore * 100, 2)}%`, height: '100%',
                        background: `linear-gradient(90deg, ${scoreColor(comparisonScore)}66, ${scoreColor(comparisonScore)})`,
                        borderRadius: '4px', transition: 'width 0.3s',
                      }} />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.25rem', fontSize: '0.5625rem', fontFamily: "'JetBrains Mono', monospace", color: '#4a4a4a' }}>
                      <span>0.0 (unrelated)</span>
                      <span>0.5</span>
                      <span>1.0 (identical)</span>
                    </div>
                  </div>
                </div>

                {/* Formula explainer */}
                <div style={{ padding: '0.75rem', background: 'rgba(10,8,16,0.5)', borderRadius: '0.5rem', marginBottom: '1rem' }}>
                  <div style={{ fontSize: '0.6875rem', fontFamily: "'JetBrains Mono', monospace", color: '#636363', marginBottom: '0.5rem' }}>
                    COSINE SIMILARITY FORMULA:
                  </div>
                  <div style={{ fontSize: '0.875rem', fontFamily: "'JetBrains Mono', monospace", color: '#c0c0c0', textAlign: 'center', lineHeight: 2 }}>
                    sim(A, B) = <span style={{ color: '#a855f7' }}>A · B</span> / (<span style={{ color: '#4ade80' }}>||A||</span> × <span style={{ color: '#4ade80' }}>||B||</span>)
                  </div>
                  <div style={{ marginTop: '0.5rem', fontSize: '0.6875rem', color: '#636363', lineHeight: 1.5 }}>
                    <span style={{ color: '#a855f7' }}>A · B</span> = dot product (multiply each pair of values, sum them up)<br/>
                    <span style={{ color: '#4ade80' }}>||A||</span> = magnitude (length of vector A)
                  </div>
                </div>

                {/* Side-by-side dimension comparison */}
                {compareA !== compareB && (
                  <div>
                    <div style={{ fontSize: '0.625rem', fontFamily: "'JetBrains Mono', monospace", color: '#636363', marginBottom: '0.375rem' }}>
                      Dimension-by-dimension comparison (first 30):
                    </div>
                    <div style={{ display: 'flex', gap: '1px', height: '80px', background: 'rgba(10,8,16,0.3)', borderRadius: '0.375rem', padding: '2px', overflow: 'hidden' }}>
                      {state.embeddedChunks[compareA].embedding.slice(0, 30).map((valA, d) => {
                        const valB = state.embeddedChunks[compareB].embedding[d];
                        const allVals = [...state.embeddedChunks[compareA].embedding.slice(0, 30), ...state.embeddedChunks[compareB].embedding.slice(0, 30)];
                        const maxAbs = Math.max(...allVals.map(Math.abs));
                        const normA = maxAbs ? valA / maxAbs : 0;
                        const normB = maxAbs ? valB / maxAbs : 0;
                        const hA = Math.abs(normA) * 36;
                        const hB = Math.abs(normB) * 36;
                        return (
                          <div key={d} style={{ flex: 1, display: 'flex', gap: '1px', height: '80px' }}
                            title={`d${d}: A=${valA.toFixed(3)}, B=${valB.toFixed(3)}`}>
                            <div style={{ flex: 1, position: 'relative' }}>
                              <div style={{ position: 'absolute', bottom: '40px', left: 0, right: 0, top: valA >= 0 ? `${40 - hA}px` : undefined, height: `${hA}px`, background: COLORS[compareA % COLORS.length], opacity: 0.6, borderRadius: '1px', ...(valA < 0 ? { top: '40px' } : {}) }} />
                            </div>
                            <div style={{ flex: 1, position: 'relative' }}>
                              <div style={{ position: 'absolute', bottom: '40px', left: 0, right: 0, top: valB >= 0 ? `${40 - hB}px` : undefined, height: `${hB}px`, background: COLORS[compareB % COLORS.length], opacity: 0.6, borderRadius: '1px', ...(valB < 0 ? { top: '40px' } : {}) }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <div style={{ display: 'flex', gap: '1rem', marginTop: '0.375rem', fontSize: '0.625rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <span style={{ width: '8px', height: '8px', borderRadius: '2px', background: COLORS[compareA % COLORS.length], opacity: 0.6 }} />
                        <span style={{ color: '#8b8b8b' }}>C{compareA + 1}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <span style={{ width: '8px', height: '8px', borderRadius: '2px', background: COLORS[compareB % COLORS.length], opacity: 0.6 }} />
                        <span style={{ color: '#8b8b8b' }}>C{compareB + 1}</span>
                      </div>
                      <span style={{ color: '#4a4a4a', fontFamily: "'JetBrains Mono', monospace" }}>
                        {comparisonScore >= 0.7 ? 'Bars point same direction → high similarity' : comparisonScore >= 0.4 ? 'Some alignment → moderate similarity' : 'Different directions → low similarity'}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ── Section C: Full similarity matrix ── */}
          <div style={{ padding: '1.25rem', background: 'rgba(30,26,41,0.5)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '0.75rem' }}>
            <div style={{ fontSize: '0.6875rem', fontFamily: "'JetBrains Mono', monospace", color: '#fbbf24', letterSpacing: '0.1em', textTransform: 'uppercase' as const, fontWeight: 600, marginBottom: '0.75rem' }}>
              Similarity Matrix — All Chunks
            </div>
            <p style={{ fontSize: '0.8125rem', color: '#8b8b8b', marginBottom: '0.5rem', lineHeight: 1.5 }}>
              Every cell shows the cosine similarity between two chunks. <span style={{ color: '#4ade80' }}>Green = high</span>, <span style={{ color: '#fbbf24' }}>amber = medium</span>, <span style={{ color: '#f87171' }}>red = low</span>. The diagonal is always 1.0 — every chunk is identical to itself.
            </p>
            <p style={{ fontSize: '0.8125rem', color: '#8b8b8b', marginBottom: '1rem', lineHeight: 1.5 }}>
              This matrix tells you something important: lots of green off the diagonal means your chunks are <strong style={{ color: '#c0c0c0' }}>redundant</strong> — retrieval will return near-duplicates. A mostly red matrix means your document covers many distinct topics and retrieval will be precise. <strong style={{ color: '#c0c0c0' }}>Click any cell</strong> to load that pair into the comparison above. Hover to preview both chunk texts.
            </p>
            <div style={{ overflow: 'auto' }}>
              <div style={{ display: 'inline-block' }}>
                <div style={{ display: 'flex', paddingLeft: '2.5rem' }}>
                  {state.embeddedChunks.map((_, j) => (
                    <div key={j} style={{ width: '2.5rem', textAlign: 'center', fontSize: '0.625rem', fontFamily: "'JetBrains Mono', monospace", color: '#636363', paddingBottom: '0.25rem' }}>C{j + 1}</div>
                  ))}
                </div>
                {simMatrix.map((row, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center' }}>
                    <div style={{ width: '2.5rem', fontSize: '0.625rem', textAlign: 'right', paddingRight: '0.5rem', fontFamily: "'JetBrains Mono', monospace", color: '#636363' }}>C{i + 1}</div>
                    {row.map((score, j) => {
                      const isDiag = i === j;
                      const isHov = hoveredCell?.i === i && hoveredCell?.j === j;
                      return (
                        <div key={j}
                          onMouseEnter={() => setHoveredCell({ i, j })}
                          onMouseLeave={() => setHoveredCell(null)}
                          onClick={() => { if (i !== j) { setCompareA(i); setCompareB(j); } }}
                          style={{
                            width: '2.5rem', height: '2.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            background: isDiag ? 'rgba(168,85,247,0.1)' : `rgba(${Math.round((1 - score) * 100)}, ${Math.round(score * 200)}, 80, ${0.1 + score * 0.35})`,
                            border: isHov ? '1px solid rgba(168,85,247,0.5)' : '1px solid rgba(255,255,255,0.02)',
                            fontSize: '0.5625rem', fontFamily: "'JetBrains Mono', monospace",
                            color: score > 0.7 ? '#4ade80' : score > 0.4 ? '#fbbf24' : '#f87171',
                            cursor: isDiag ? 'default' : 'pointer',
                          }}
                          title={`C${i + 1} ↔ C${j + 1}: ${score.toFixed(4)}`}>
                          {isDiag ? '1.0' : score.toFixed(2)}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
            {hoveredCell && hoveredCell.i !== hoveredCell.j && (
              <div style={{ marginTop: '0.75rem', padding: '0.625rem', background: 'rgba(22,19,30,0.8)', border: '1px solid rgba(168,85,247,0.2)', borderRadius: '0.5rem', fontSize: '0.75rem' }}>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", color: '#b87dff', fontSize: '0.6875rem', marginBottom: '0.25rem' }}>
                  C{hoveredCell.i + 1} ↔ C{hoveredCell.j + 1}: {simMatrix[hoveredCell.i][hoveredCell.j].toFixed(4)}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', color: '#8b8b8b', fontSize: '0.6875rem' }}>
                  <div>{state.embeddedChunks[hoveredCell.i].text.slice(0, 80)}...</div>
                  <div>{state.embeddedChunks[hoveredCell.j].text.slice(0, 80)}...</div>
                </div>
              </div>
            )}
          </div>

          {/* ── Section D: 2D Map ── */}
          {points2D.length > 0 && (
            <div style={{ padding: '1.25rem', background: 'rgba(30,26,41,0.5)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '0.75rem' }}>
              <div style={{ fontSize: '0.6875rem', fontFamily: "'JetBrains Mono', monospace", color: '#3b82f6', letterSpacing: '0.1em', textTransform: 'uppercase' as const, fontWeight: 600, marginBottom: '0.75rem' }}>
                2D Map — Similar chunks cluster together
              </div>
              <p style={{ fontSize: '0.8125rem', color: '#8b8b8b', marginBottom: '0.5rem', lineHeight: 1.5 }}>
                Your vectors are <strong style={{ color: '#c0c0c0' }}>{state.embeddedChunks[0].embedding.length} dimensions</strong> — impossible to visualise directly. <strong style={{ color: '#c0c0c0' }}>PCA</strong> (Principal Component Analysis) compresses them to 2D while preserving as much structure as possible. Chunks about similar topics appear close together.
              </p>
              <p style={{ fontSize: '0.8125rem', color: '#8b8b8b', marginBottom: '1rem', lineHeight: 1.5 }}>
                This is how retrieval works: when you type a query in the next step, it gets embedded by the same model and lands as a point on this map. The closest chunks to that point are your top results. If similar concepts cluster here, your retrieval will be accurate.
              </p>
              <div style={{ position: 'relative', width: '100%', height: '350px', background: 'rgba(10,8,16,0.5)', borderRadius: '0.5rem', border: '1px solid rgba(255,255,255,0.04)', overflow: 'hidden' }}>
                {[0.25, 0.5, 0.75].map(pos => (
                  <div key={pos}>
                    <div style={{ position: 'absolute', left: 0, right: 0, top: `${pos * 100}%`, height: '1px', background: 'rgba(255,255,255,0.03)' }} />
                    <div style={{ position: 'absolute', top: 0, bottom: 0, left: `${pos * 100}%`, width: '1px', background: 'rgba(255,255,255,0.03)' }} />
                  </div>
                ))}
                {points2D.map((p, i) => (
                  <div key={i} style={{ position: 'absolute', left: `${10 + p.x * 80}%`, top: `${10 + p.y * 80}%`, transform: 'translate(-50%, -50%)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem' }}>
                    <div style={{ width: '14px', height: '14px', borderRadius: '50%', background: COLORS[i % COLORS.length], border: '2px solid rgba(22,19,30,0.8)', boxShadow: `0 0 8px ${COLORS[i % COLORS.length]}44` }}
                      title={`C${i + 1}: ${state.embeddedChunks[i].text.slice(0, 60)}...`} />
                    <span style={{ fontSize: '0.5625rem', fontFamily: "'JetBrains Mono', monospace", color: COLORS[i % COLORS.length], fontWeight: 700, textShadow: '0 1px 3px rgba(0,0,0,0.8)' }}>C{i + 1}</span>
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.75rem' }}>
                {state.embeddedChunks.map((c, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.625rem', color: '#8b8b8b', maxWidth: '240px' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: COLORS[i % COLORS.length], flexShrink: 0 }} />
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>C{i + 1}: {c.text.slice(0, 40)}...</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════
// STEP 4: Retrieval & Answer
// ══════════════════════════════════════════════════

function RetrievalStep() {
  const { state, dispatch } = usePlayground();

  const handleSearch = useCallback(async () => {
    if (!state.query.trim() || state.embeddedChunks.length === 0) return;
    dispatch({ type: 'SET_IS_SEARCHING', payload: true });
    dispatch({ type: 'ADD_LOG', payload: `Step 6: Retriever started — query "${state.query}"` });
    try {
      const { embedText } = await import('../../../lib/embeddings');
      const queryVector = await embedText(state.query);
      const items = state.embeddedChunks.map(chunk => ({ item: chunk, vector: chunk.embedding }));
      let results;
      if (state.searchType === 'hybrid') {
        const semRanked = rankBySimilarity(queryVector, items, state.embeddedChunks.length);
        results = semRanked.map(r => {
          const qTerms = state.query.toLowerCase().split(/\s+/).filter(t => t.length > 2);
          const textLower = r.item.text.toLowerCase();
          let kwScore = 0;
          for (const t of qTerms) { if (textLower.includes(t)) kwScore += 1 / qTerms.length; }
          return { chunk: r.item, score: r.score * 0.6 + kwScore * 0.4, matchType: 'both' as const };
        }).sort((a, b) => b.score - a.score).slice(0, state.topK);
      } else {
        const ranked = rankBySimilarity(queryVector, items, state.topK);
        results = ranked.map(r => ({ chunk: r.item, score: r.score, matchType: 'semantic' as const }));
      }
      dispatch({ type: 'SET_RESULTS', payload: results });
      dispatch({ type: 'ADD_LOG', payload: `Step 6 complete — ${results.length} ranked chunk candidates returned.` });
      const { incrementPlaygroundQueries } = await import('../../../lib/progress');
      incrementPlaygroundQueries();
    } catch (err) {
      console.error('Search failed:', err);
    } finally {
      dispatch({ type: 'SET_IS_SEARCHING', payload: false });
    }
  }, [state.query, state.embeddedChunks, state.searchType, state.topK, dispatch]);

  return (
    <div>
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.25rem' }}>Retriever</h2>
        <p style={{ fontSize: '0.8125rem', color: '#8b8b8b', lineHeight: 1.5 }}>
          Your question is converted to the same vector space, matched against IDMO vectors, and the best chunk text
          is pulled back from the Chunk DMO as answer context.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '1.5rem', alignItems: 'start' }}>
        {/* Left: Controls */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', position: 'sticky', top: '5rem' }}>
          <div style={{ fontSize: '0.6875rem', fontFamily: "'JetBrains Mono', monospace", color: '#b87dff', letterSpacing: '0.1em', textTransform: 'uppercase' as const, fontWeight: 600 }}>
            Search Configuration
          </div>

          <div>
            <label style={labelStyle}>Search Strategy</label>
            <div style={{ display: 'flex', gap: '0.25rem' }}>
              {(['semantic', 'hybrid'] as const).map(st => (
                <button key={st} onClick={() => dispatch({ type: 'SET_SEARCH_TYPE', payload: st })} style={{
                  flex: 1, padding: '0.375rem', fontSize: '0.75rem',
                  background: state.searchType === st ? 'rgba(168,85,247,0.1)' : 'transparent',
                  border: `1px solid ${state.searchType === st ? 'rgba(168,85,247,0.3)' : 'rgba(255,255,255,0.06)'}`,
                  borderRadius: '0.375rem', color: state.searchType === st ? '#b87dff' : '#636363', cursor: 'pointer',
                }}>
                  {st === 'semantic' ? 'Vector' : 'Hybrid'}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label style={labelStyle}>Top K: {state.topK}</label>
            <input type="range" min={1} max={10} value={state.topK}
              onChange={e => dispatch({ type: 'SET_TOP_K', payload: Number(e.target.value) })}
              style={{ width: '100%', accentColor: '#a855f7' }} />
          </div>

          <div>
            <label style={labelStyle}>Query</label>
            <textarea value={state.query} onChange={e => dispatch({ type: 'SET_QUERY', payload: e.target.value })}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSearch())}
              placeholder='Ask a question, e.g. "How do I fix my laptop?"'
              rows={3}
              style={{ width: '100%', padding: '0.5rem', background: 'rgba(22,19,30,0.6)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '0.5rem', color: '#e0e0e0', fontSize: '0.8125rem', resize: 'vertical' }} />
          </div>

          <button onClick={handleSearch} disabled={!state.query.trim() || state.isSearching}
            style={{
              padding: '0.625rem 1.25rem',
              background: !state.query.trim() ? 'rgba(168,85,247,0.2)' : '#a855f7',
              color: !state.query.trim() ? '#636363' : '#f0f0f0',
              border: 'none', borderRadius: '0.5rem', cursor: !state.query.trim() ? 'default' : 'pointer',
              fontWeight: 600, fontSize: '0.875rem',
              boxShadow: state.query.trim() ? '0 0 20px rgba(168,85,247,0.15)' : 'none',
            }}>
            {state.isSearching ? 'Searching...' : 'Search'}
          </button>
        </div>

        {/* Right: Results */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

          {state.results.length === 0 && !state.isSearching && (
            <div style={{ padding: '3rem', textAlign: 'center', color: '#636363', background: 'rgba(30,26,41,0.3)', borderRadius: '0.75rem', border: '1px dashed rgba(255,255,255,0.06)' }}>
              Enter a query and click Search to find relevant chunks.
            </div>
          )}

          {state.results.length > 0 && (
            <div>
              <div style={{ fontSize: '0.6875rem', fontFamily: "'JetBrains Mono', monospace", color: '#636363', letterSpacing: '0.05em', textTransform: 'uppercase' as const, marginBottom: '0.5rem' }}>
                Top {state.results.length} results — {state.searchType} search
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {state.results.map((r, i) => (
                  <div key={r.chunk.id} style={{
                    padding: '1rem', background: i === 0 ? 'rgba(74,222,128,0.04)' : 'rgba(30,26,41,0.5)',
                    border: `1px solid ${i === 0 ? 'rgba(74,222,128,0.15)' : 'rgba(255,255,255,0.06)'}`,
                    borderRadius: '0.75rem',
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.375rem' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, color: i === 0 ? '#4ade80' : '#b87dff' }}>#{i + 1}</span>
                      <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.6875rem', padding: '0.125rem 0.5rem', borderRadius: '9999px', background: `${scoreColor(r.score)}15`, color: scoreColor(r.score), border: `1px solid ${scoreColor(r.score)}30` }}>
                        {r.score.toFixed(4)}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.8125rem', lineHeight: 1.6, color: '#c0c0c0' }}>{r.chunk.text}</div>
                    <div style={{ marginTop: '0.5rem', height: '2px', background: 'rgba(255,255,255,0.04)', borderRadius: '1px', overflow: 'hidden' }}>
                      <div style={{ width: `${Math.min(r.score * 100, 100)}%`, height: '100%', background: `linear-gradient(90deg, ${scoreColor(r.score)}66, ${scoreColor(r.score)})`, borderRadius: '1px' }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════
// STEP 7: Generate
// ══════════════════════════════════════════════════

function GenerateStep() {
  const { state } = usePlayground();

  if (!state.results.length) {
    return (
      <div style={{ padding: '3rem', textAlign: 'center', color: '#636363', background: 'rgba(30,26,41,0.3)', borderRadius: '0.75rem', border: '1px dashed rgba(255,255,255,0.06)' }}>
        Go back to Retriever and run a search first.
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.25rem' }}>Generate Answer</h2>
        <p style={{ fontSize: '0.8125rem', color: '#8b8b8b', lineHeight: 1.5 }}>
          Assemble retrieved chunks into a prompt and generate a grounded answer using Groq. The assembled prompt shows exactly what the LLM sees — system instructions, retrieved context, and your question.
        </p>
      </div>
      <GenerationPanel />
    </div>
  );
}
