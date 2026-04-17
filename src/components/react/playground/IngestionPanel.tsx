import { useCallback, useState } from 'react';
import { usePlayground } from './usePlaygroundStore';
import type { ChunkStrategy } from '../../../lib/chunking';

interface SampleDataset {
  id: string;
  label: string;
  documentSubtitle?: string;
  type: string;
  typeColor: string;
  description: string;
  wordCount: number;
  suggestedStrategy: ChunkStrategy;
  sourceUrl: string;
  sourceLabel: string;
  text: string;
  sampleQuery: string;
}

const SAMPLE_DATASETS: SampleDataset[] = [
  {
    id: 'technical-docs',
    label: 'Technical Documentation',
    type: 'WEB',
    typeColor: '#a855f7',
    description: 'A structured docs site with sidebar navigation, headings, and code references.',
    wordCount: 312,
    suggestedStrategy: 'section-aware',
    sourceUrl: '/samples/technical-docs.html',
    sourceLabel: 'View documentation page',
    sampleQuery: 'What is the best indexing algorithm for most RAG applications?',
    text: `# How to Configure Vector Database Indexing

## Overview

Vector database indexing is critical for achieving fast similarity search at scale. This article covers the main indexing strategies and when to use each one. Choosing the right index can mean the difference between sub-millisecond queries and queries that take several seconds.

## HNSW (Hierarchical Navigable Small World)

HNSW is the most popular indexing algorithm for vector databases. It works by building a multi-layer graph where each layer acts as a "highway" for navigation. The top layers have fewer nodes and allow fast, approximate navigation. The bottom layers have all nodes and allow precise search.

Key parameters:
- M: The number of bi-directional connections per node. Higher M means better recall but more memory. Default: 16.
- efConstruction: Controls index build quality. Higher values create a more accurate index but take longer to build. Default: 200.
- efSearch: Controls query-time accuracy. Higher values return better results but are slower. Default: 100.

When M is too low, the graph becomes disconnected and recall drops sharply. When M is too high, memory usage grows linearly and insertion slows.

## IVF (Inverted File Index)

IVF first clusters the vectors into groups using k-means, then only searches within the most relevant clusters at query time. This is faster than brute-force but requires a training step to build the cluster centroids.

The key parameter is nlist (number of clusters). More clusters means faster search but requires more data to train accurately. A common heuristic is nlist = sqrt(N) where N is the total number of vectors.

## Flat Index (Brute Force)

The simplest approach: compare the query vector against every stored vector. Guarantees perfect recall but scales linearly with dataset size. Only practical for fewer than 50,000 vectors.

## When to Use What

For most RAG applications with fewer than 10 million vectors, HNSW is the best choice. It offers excellent recall with low latency and no training step. IVF is better for very large datasets (100M+ vectors) where memory is a constraint. Flat index works for prototyping and small datasets.

## Common Mistakes

The most common mistake is using default parameters without tuning. Increasing efSearch improves recall but adds latency. Always benchmark with your actual data and queries before deploying to production.`,
  },
  {
    id: 'research-paper',
    label: 'Research Paper (PDF)',
    type: 'PDF',
    typeColor: '#f87171',
    description: 'An academic paper excerpt about RAG with abstract, sections, and citations.',
    wordCount: 287,
    suggestedStrategy: 'passage-extraction',
    sourceUrl: '/samples/research-paper.html',
    sourceLabel: 'View paper',
    sampleQuery: 'What problem does retrieval-augmented generation solve?',
    text: `Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks

Abstract

Large pre-trained language models have been shown to store factual knowledge in their parameters, and achieve state-of-the-art results when fine-tuned on downstream NLP tasks. However, their ability to access and precisely manipulate knowledge is still limited, and hence on knowledge-intensive tasks, their performance lags behind task-specific architectures.

Additionally, providing provenance for their decisions and updating their world knowledge remain open research problems. Pre-trained models with a differentiable access mechanism to explicit non-parametric memory can overcome this issue, but have so far been only investigated for extractive downstream tasks.

We explore a general-purpose fine-tuning recipe for retrieval-augmented generation (RAG) — models which combine pre-trained parametric and non-parametric memory for language generation. We introduce RAG models where the parametric memory is a pre-trained seq2seq model and the non-parametric memory is a dense vector index of Wikipedia, accessed with a pre-trained neural retriever.

We compare two RAG formulations, one which conditions on the same retrieved passages across the whole generated sequence, the other can use different passages per token. We find that RAG models generate more specific, diverse and factual language than a state-of-the-art parametric-only seq2seq baseline.

For knowledge-intensive NLP tasks, we compare against three other approaches: extractive, abstractive and closed-book generation. On four NLP benchmarks, RAG achieves state-of-the-art results, demonstrating the power of combining parametric and non-parametric memory for language generation.

The key contribution of this work is showing that retrieval-augmented generation can be applied as a general-purpose architecture for knowledge-intensive tasks, rather than requiring task-specific modifications.`,
  },
  {
    id: 'support-transcript',
    label: 'Support Chat Transcript',
    type: 'CHAT',
    typeColor: '#4ade80',
    description: 'A customer support conversation with speaker turns and resolution.',
    wordCount: 198,
    suggestedStrategy: 'conversation',
    sourceUrl: '/samples/support-transcript.html',
    sourceLabel: 'View ticket',
    sampleQuery: 'Why was the customer account locked?',
    text: `Customer: Hi, I'm having trouble with my account. I can't log in since yesterday.
Agent: I'm sorry to hear that. Let me help you with your login issue. Can you tell me what error message you're seeing?
Customer: It says "Invalid credentials" every time I try, but I'm 100% sure my password is correct. I even checked caps lock.
Agent: I understand how frustrating that can be. Let me check your account status. Could you provide me with the email address associated with your account?
Customer: Sure, it's john.doe@example.com
Agent: Thank you, John. I can see your account was automatically locked at 3:42 PM yesterday due to five failed login attempts from an unrecognized IP address. This is a security measure to protect your account.
Customer: Oh wow, that wasn't me trying those times. Should I be worried?
Agent: The attempts came from a different country than your usual login location, so our system flagged it as suspicious. I'd recommend changing your password after I unlock your account. I'll also enable two-factor authentication for you.
Customer: Yes, please do that. Security is important.
Agent: Done. Your account is now unlocked, and I've sent a 2FA setup link to your email. Your new temporary password is also in that email. Please change it immediately after logging in.
Customer: Got it. Thank you so much for the quick help!
Agent: You're welcome! Is there anything else I can help you with today?`,
  },
  {
    id: 'product-faq',
    label: 'Product FAQ Page',
    type: 'WEB',
    typeColor: '#3b82f6',
    description: 'A SaaS website FAQ page with pricing, security, and getting started sections.',
    wordCount: 341,
    suggestedStrategy: 'section-aware',
    sourceUrl: '/samples/product-faq.html',
    sourceLabel: 'View website',
    sampleQuery: 'How does CloudSync pricing work and is there a free tier?',
    text: `# Frequently Asked Questions

## Getting Started

### What is CloudSync and how does it work?
CloudSync is a real-time data synchronization platform that keeps your databases, APIs, and file systems in sync across multiple cloud providers. It uses change data capture (CDC) to detect modifications and propagates them within seconds.

### Do I need to install anything?
No installation required. CloudSync runs entirely in the cloud. You connect your data sources through our web dashboard using OAuth or API keys. The entire setup takes under 5 minutes.

### Is there a free tier?
Yes. The free tier includes up to 3 data sources, 10,000 sync operations per month, and 1 GB of data transfer. No credit card required to start.

## Pricing & Plans

### How does pricing work?
We charge based on the number of sync operations and data volume. A sync operation is one row or document that gets synchronized. Plans start at $29/month for 100,000 operations.

### Can I change plans at any time?
Yes. You can upgrade or downgrade at any time. Changes take effect at the start of your next billing cycle. If you upgrade mid-cycle, you'll be charged a prorated amount.

### Do you offer annual billing?
Yes, annual billing saves you 20% compared to monthly billing. All plans are available with annual pricing.

## Security & Compliance

### Is my data encrypted?
All data is encrypted in transit using TLS 1.3 and at rest using AES-256. We never store your actual data — we only process sync metadata and change events.

### Are you SOC 2 compliant?
Yes. CloudSync is SOC 2 Type II certified. We complete annual audits and can provide our latest report upon request to enterprise customers.

### Where is my data processed?
You choose your processing region during setup. We currently support US-East, US-West, EU-West, and AP-Southeast. Data never leaves your chosen region.`,
  },
  {
    id: 'company-handbook',
    label: 'Employee Handbook',
    documentSubtitle: 'Acme Corporation · Effective January 2025 · Version 4.2',
    type: 'DOC',
    typeColor: '#fbbf24',
    description: 'An internal company document with HR policies, time off rules, and review process.',
    wordCount: 276,
    suggestedStrategy: 'sentence',
    sourceUrl: '/samples/employee-handbook.html',
    sourceLabel: 'View document',
    sampleQuery: 'How many days of PTO do employees receive per year?',
    text: `Remote Work Policy

All full-time employees are eligible for remote work after completing their 90-day onboarding period. Remote work arrangements must be approved by your direct manager and HR. Employees working remotely are expected to maintain core hours of 10 AM to 3 PM in their local time zone for meetings and collaboration.

Equipment and Expenses

The company provides a one-time home office stipend of $1,500 for remote employees. This covers a desk, chair, monitor, or any other equipment needed. Employees must submit receipts within 30 days of purchase. Internet expenses up to $75/month are reimbursable with a monthly expense report.

Time Off Policy

Full-time employees receive 20 days of paid time off (PTO) per year, accruing at 1.67 days per month. PTO requests must be submitted at least 2 weeks in advance for periods longer than 3 days. Unused PTO carries over up to a maximum of 5 days into the next calendar year.

In addition to PTO, employees receive 10 paid company holidays, 5 sick days, and 3 personal days per year. Sick days do not carry over. Parental leave is 16 weeks fully paid for all new parents regardless of gender.

Performance Reviews

Performance reviews are conducted twice per year in January and July. Each review includes a self-assessment, peer feedback from at least two colleagues, and a manager evaluation. Compensation adjustments are determined during the January cycle based on performance rating, market data, and company budget.

Employees who receive a "needs improvement" rating are placed on a 60-day performance improvement plan with clear, measurable goals and weekly check-ins with their manager.`,
  },
];

export default function IngestionPanel() {
  const { state, dispatch } = usePlayground();
  const [selectedSample, setSelectedSample] = useState<string | null>(null);

  const handleLoadSample = useCallback(async (sample: SampleDataset) => {
    dispatch({ type: 'SET_RAW_TEXT', payload: sample.text });
    dispatch({ type: 'SET_RAW_HTML', payload: '' });  // clear while fetching
    dispatch({ type: 'SET_SOURCE_LABEL', payload: sample.label });
    dispatch({ type: 'SET_DOCUMENT_SUBTITLE', payload: sample.documentSubtitle ?? '' });
    dispatch({ type: 'SET_SOURCE_TYPE', payload: sample.type });
    dispatch({ type: 'SET_SOURCE_URL', payload: sample.sourceUrl });
    dispatch({ type: 'SET_SOURCE_LOADED_AT', payload: new Date().toISOString() });
    dispatch({ type: 'SET_CHUNK_STRATEGY', payload: sample.suggestedStrategy });
    dispatch({ type: 'SET_QUERY', payload: sample.sampleQuery });
    dispatch({ type: 'CLEAR_LOG' });
    dispatch({ type: 'ADD_LOG', payload: `Step 1: Data Stream load started — "${sample.label}" (${sample.wordCount} words).` });
    dispatch({ type: 'SET_CHUNKS', payload: [] });
    dispatch({ type: 'SET_EMBEDDED_CHUNKS', payload: [] });
    dispatch({ type: 'SET_RESULTS', payload: [] });
    dispatch({ type: 'SET_GENERATED_ANSWER', payload: '' });
    setSelectedSample(sample.id);

    // Fetch raw HTML from the source file — this is what lands in the DLO body
    try {
      const resp = await fetch(sample.sourceUrl);
      const html = await resp.text();
      dispatch({ type: 'SET_RAW_HTML', payload: html });
      dispatch({ type: 'ADD_LOG', payload: `Raw HTML fetched (${html.length} bytes) — DLO body populated.` });
    } catch {
      dispatch({ type: 'SET_RAW_HTML', payload: sample.text });
      dispatch({ type: 'ADD_LOG', payload: 'HTML fetch failed — falling back to plain text body.' });
    }
    dispatch({ type: 'ADD_LOG', payload: 'Step 2 event ready: DLO values available from stream payload.' });
    dispatch({ type: 'ADD_LOG', payload: 'Step 3 event ready: DMO mappings available for semantic fields.' });
  }, [dispatch]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.5rem' }}>
        {SAMPLE_DATASETS.map(sample => {
          const isSelected = selectedSample === sample.id;
          return (
            <button
              key={sample.id}
              onClick={() => handleLoadSample(sample)}
              style={{
                padding: '0.875rem 1rem', textAlign: 'left',
                background: isSelected ? 'rgba(168,85,247,0.08)' : 'rgba(30,26,41,0.5)',
                border: `1px solid ${isSelected ? 'rgba(168,85,247,0.3)' : 'rgba(255,255,255,0.06)'}`,
                borderRadius: '0.75rem', cursor: 'pointer',
                transition: 'all 0.2s', backdropFilter: 'blur(4px)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.375rem' }}>
                <span style={{
                  fontFamily: "'JetBrains Mono', monospace", fontSize: '0.75rem', fontWeight: 700,
                  letterSpacing: '0.1em', textTransform: 'uppercase' as const,
                  color: sample.typeColor, background: `${sample.typeColor}15`,
                  padding: '1px 6px', borderRadius: '9999px', border: `1px solid ${sample.typeColor}30`,
                }}>
                  {sample.type}
                </span>
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.75rem', color: '#636363' }}>
                  {sample.wordCount} words
                </span>
              </div>
              <div style={{ fontSize: '0.9375rem', fontWeight: 600, color: isSelected ? '#e0e0e0' : '#c0c0c0', marginBottom: '0.25rem' }}>
                {sample.label}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#636363', lineHeight: 1.4, marginBottom: '0.375rem' }}>
                {sample.description}
              </div>
              <a
                href={sample.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={e => e.stopPropagation()}
                style={{
                  fontSize: '0.75rem', color: sample.typeColor, textDecoration: 'none',
                  fontFamily: "'JetBrains Mono', monospace", letterSpacing: '0.03em',
                  display: 'inline-flex', alignItems: 'center', gap: '0.25rem', opacity: 0.8,
                }}
              >
                {sample.sourceLabel} ↗
              </a>
            </button>
          );
        })}
      </div>

      {/* Preview — show raw HTML source when available, else plain text */}
      {(state.rawHtml || state.rawText) && (
        <div>
          <div style={{
            fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.375rem',
            color: state.rawHtml ? '#93c5fd' : '#4ade80',
            fontFamily: "'JetBrains Mono', monospace", letterSpacing: '0.08em',
            textTransform: 'uppercase' as const,
          }}>
            {state.rawHtml ? 'Raw HTML Source' : 'Plain Text Source'}
          </div>
          <div style={{
            padding: '0.75rem', maxHeight: '200px', overflow: 'auto',
            background: 'rgba(13,17,23,0.8)', border: `1px solid ${state.rawHtml ? 'rgba(147,197,253,0.15)' : 'rgba(74,222,128,0.1)'}`,
            borderRadius: '0.75rem', fontSize: '0.8125rem', color: '#8b8b8b',
            fontFamily: "'JetBrains Mono', monospace", lineHeight: 1.5, whiteSpace: 'pre-wrap',
          }}>
            {state.rawHtml || state.rawText}
          </div>
        </div>
      )}
    </div>
  );
}
