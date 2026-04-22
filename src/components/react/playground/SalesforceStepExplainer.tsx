import { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface StepExplainerProps {
  step: 'stream' | 'dlo' | 'dmo' | 'chunk' | 'embed' | 'retrieve' | 'generate';
}

export default function SalesforceStepExplainer({ step }: StepExplainerProps) {
  const content = STEP_CONTENT[step];
  const [expanded, setExpanded] = useState(false);
  const storageKey = `learnrag-help-expanded-${step}`;

  // On first mount, show expanded for the first step only
  useEffect(() => {
    if (step === 'stream') {
      try {
        const hasSeenBefore = localStorage.getItem('learnrag-has-seen-playground');
        if (!hasSeenBefore) {
          setExpanded(true);
          localStorage.setItem('learnrag-has-seen-playground', 'true');
        }
      } catch {
        setExpanded(true);
      }
    }
  }, [step]);

  const toggleExpanded = () => {
    setExpanded(!expanded);
  };

  if (!content) return null;

  return (
    <div
      style={{
        background: 'rgba(168,85,247,0.06)',
        border: '1px solid rgba(168,85,247,0.2)',
        borderRadius: '0.75rem',
        marginBottom: '1rem',
        overflow: 'hidden',
      }}
    >
      {/* Collapsed Header (Always Visible) */}
      <button
        onClick={toggleExpanded}
        type="button"
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0.75rem 1rem',
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          textAlign: 'left',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', flex: 1 }}>
          <span style={{ fontSize: '1.125rem', lineHeight: 1 }}>{content.icon}</span>
          <div>
            <div
              style={{
                fontSize: '0.875rem',
                fontFamily: "'JetBrains Mono', monospace",
                color: '#e9d5ff',
                fontWeight: 600,
                letterSpacing: '0.02em',
              }}
            >
              {content.sfTerm}
            </div>
            <div
              style={{
                fontSize: '0.75rem',
                color: '#c4b5fd',
                marginTop: '0.125rem',
              }}
            >
              {content.ragEquivalent}
            </div>
          </div>
        </div>
        <div style={{ color: '#e9d5ff', flexShrink: 0 }}>
          {expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </div>
      </button>

      {/* Expanded Content */}
      {expanded && (
        <div style={{ padding: '0 1rem 1rem 1rem' }}>
          {/* What */}
          <div style={{ marginBottom: '0.625rem' }}>
            <span
              style={{
                fontSize: '0.75rem',
                fontWeight: 700,
                color: '#e9d5ff',
                marginRight: '0.375rem',
              }}
            >
              💡 What:
            </span>
            <span style={{ fontSize: '0.875rem', color: '#d8b4fe', lineHeight: 1.5 }}>
              {content.what}
            </span>
          </div>

          {/* Why */}
          <div style={{ marginBottom: '0.625rem' }}>
            <span
              style={{
                fontSize: '0.75rem',
                fontWeight: 700,
                color: '#e9d5ff',
                marginRight: '0.375rem',
              }}
            >
              🎯 Why:
            </span>
            <span style={{ fontSize: '0.875rem', color: '#d8b4fe', lineHeight: 1.5 }}>
              {content.why}
            </span>
          </div>

          {/* Success Criteria */}
          <div style={{ marginBottom: '0.625rem' }}>
            <span
              style={{
                fontSize: '0.75rem',
                fontWeight: 700,
                color: '#4ade80',
                marginRight: '0.375rem',
              }}
            >
              ✓ Success:
            </span>
            <span style={{ fontSize: '0.875rem', color: '#d8b4fe', lineHeight: 1.5 }}>
              {content.success}
            </span>
          </div>

          {/* Watch Out */}
          {content.watchOut && (
            <div
              style={{
                marginTop: '0.75rem',
                padding: '0.5rem 0.625rem',
                background: 'rgba(251,191,36,0.08)',
                border: '1px solid rgba(251,191,36,0.2)',
                borderRadius: '0.5rem',
              }}
            >
              <span
                style={{
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  color: '#fbbf24',
                  marginRight: '0.375rem',
                }}
              >
                ⚠️ Watch Out:
              </span>
              <span style={{ fontSize: '0.8125rem', color: '#fcd34d', lineHeight: 1.5 }}>
                {content.watchOut}
              </span>
            </div>
          )}

          {/* Data Cloud Mapping */}
          {content.dcMapping && (
            <div
              style={{
                marginTop: '0.75rem',
                padding: '0.5rem 0.625rem',
                background: 'rgba(59,130,246,0.06)',
                border: '1px solid rgba(59,130,246,0.15)',
                borderRadius: '0.5rem',
              }}
            >
              <div
                style={{
                  fontSize: '0.6875rem',
                  fontFamily: "'JetBrains Mono', monospace",
                  color: '#93c5fd',
                  letterSpacing: '0.05em',
                  textTransform: 'uppercase',
                  marginBottom: '0.25rem',
                }}
              >
                In Real Data Cloud
              </div>
              <div style={{ fontSize: '0.8125rem', color: '#bfdbfe', lineHeight: 1.5 }}>
                {content.dcMapping}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

interface StepContent {
  icon: string;
  sfTerm: string;
  ragEquivalent: string;
  what: string;
  why: string;
  success: string;
  watchOut?: string;
  dcMapping?: string;
}

const STEP_CONTENT: Record<string, StepContent> = {
  stream: {
    icon: '📡',
    sfTerm: 'Data Stream Load Event',
    ragEquivalent: 'Standard RAG: Document Ingestion',
    what: 'Your source document triggers a load event. This simulates a connector (SharePoint, S3, local file) detecting new content and pushing it into the pipeline.',
    why: 'Data Cloud needs a trigger to start processing. In production, Data Streams monitor source systems and fire events when new documents arrive.',
    success: 'You will see a source card populate with metadata (file path, content type, size). The record is now ready to flow into DLO.',
    watchOut: 'This is just the trigger — no text analysis happens here yet. The document is "unpacked" but not processed.',
    dcMapping: 'Real Data Cloud: Data Streams connect to sources like Salesforce CMS, SharePoint, or S3. When a file is added/updated, the stream fires and creates the initial load event.',
  },
  dlo: {
    icon: '📦',
    sfTerm: 'DLO (Data Lake Object) Populate',
    ragEquivalent: 'Standard RAG: Source Document Metadata Layer',
    what: 'Raw source metadata lands in DLO fields. Every field (FilePath__c, Size__c, ContentType__c) is populated exactly as it arrived from the source.',
    why: 'DLO is the "raw warehouse" — everything is stored unmodified for audit, lineage, and downstream processing. Think of it as the receiving dock before sorting.',
    success: 'All 15 UDLO fields are populated with concrete values. FilePath__c is the primary key. Nothing is transformed yet — just stored.',
    watchOut: 'DLO does not parse document content. It stores metadata about the file, not the text inside. That comes later.',
    dcMapping: 'Real Data Cloud: UDLO (Unstructured DLO) schema is predefined. You cannot add custom fields here — it is a fixed schema for unstructured content ingestion.',
  },
  dmo: {
    icon: '🗂️',
    sfTerm: 'DMO (Data Model Object) Populate',
    ragEquivalent: 'Standard RAG: Structured Document Record',
    what: 'For unstructured data, UDMO (Unstructured DMO) mirrors the UDLO 1:1 — no transformation happens at this layer. Semantic enrichment (title, body, description) is configured later at the Search Index.',
    why: 'DMO is the "semantic layer" — but for unstructured data, it auto-maps from DLO. The Search Index config (next step) defines which DMO field is the "body" for chunking.',
    success: 'All DMO fields are populated, mirroring DLO values. The record is now ready for the Slicer (chunking engine).',
    watchOut: 'Common misconception: DMO does not extract title/body from PDFs automatically. That parsing happens before DLO, or you configure it in the Search Index.',
    dcMapping: 'Real Data Cloud: UDMO schema is identical to UDLO for unstructured content. The Search Index configuration (chunk_field, title_field) maps DMO fields to semantic roles.',
  },
  chunk: {
    icon: '✂️',
    sfTerm: 'Chunk (Text Segmentation)',
    ragEquivalent: 'Standard RAG: Text Splitter / Chunking',
    what: 'Chunking takes the DMO body field and splits it into Chunk DMO records. Each chunk is a retrievable unit with overlap for context coverage.',
    why: 'LLMs have token limits. Chunking breaks long documents into paragraph-sized pieces that fit in retrieval results and generation prompts.',
    success: 'Document is split into multiple Chunk DMO records. ADL default: 512 tokens per chunk. Overlap ensures context is not lost at boundaries.',
    watchOut: 'Chunk size is a tradeoff: too small = loses context, too large = retrieval returns irrelevant content. Salesforce ADL uses 512 tokens by default.',
    dcMapping: 'Real Data Cloud: Chunking is configured in your Search Index settings (chunk_size, overlap, strategy). ADL auto-creates a search index with hybrid search and 512-token chunks. Enriched chunking (field prepending) is coming in ADL (roadmap Feb 2025).',
  },
  embed: {
    icon: '🧮',
    sfTerm: 'Vectorize (Embedding Model)',
    ragEquivalent: 'Standard RAG: Embedding Model / Vectorization',
    what: 'Vectorization converts each Chunk DMO into a vector (list of numbers) and indexes it for retrieval. This creates your searchable vector store.',
    why: 'Computers cannot search by "meaning" — but they can compare vectors using cosine similarity. Vectorization converts text semantics into math.',
    success: 'Each chunk gets a vector. The embedding step shows {chunk_count} vectors indexed. Similar chunks produce similar vectors (scores > 0.7).',
    watchOut: 'CRITICAL: The model you embed with MUST match the model you search with. Switching models = scores collapse to noise because vector spaces are incompatible.',
    dcMapping: 'Real Data Cloud: ADL (Agentforce Data Library) uses E5 Large Multilingual by default with 512 tokens per chunk. Search Index config specifies the model. Vectorization runs automatically after chunking.',
  },
  retrieve: {
    icon: '🔍',
    sfTerm: 'Retriever (Vector Search)',
    ragEquivalent: 'Standard RAG: Semantic Search / Vector Similarity',
    what: 'Your query is embedded by the same Translator, then compared to all IDMO vectors using cosine similarity. Top-K most similar Chunk DMO records are returned as context.',
    why: 'This is how RAG "finds relevant knowledge." The retriever bridges the user question to the document chunks that best answer it.',
    success: 'You see ranked results with similarity scores (0.0–1.0). Top result typically scores > 0.7 for a good match. Lower scores = less relevant.',
    watchOut: 'If all scores are < 0.5, your query might be off-topic, or your chunks do not contain relevant content. Try rephrasing or loading a different document.',
    dcMapping: 'Real Data Cloud: The Retriever service embeds your query, searches IDMO, and returns Chunk DMO IDs. You configure top_k, search_strategy (semantic/hybrid) in your prompt template.',
  },
  generate: {
    icon: '✨',
    sfTerm: 'Generate (LLM Prompt Assembly)',
    ragEquivalent: 'Standard RAG: Prompt Engineering + LLM Generation',
    what: 'Retrieved Chunk DMO text is assembled into a prompt: System instructions + Retrieved chunks + User query. The LLM generates an answer grounded in those chunks.',
    why: 'This is the "RAG magic" — the LLM answers using only the retrieved context, not its training data. Citations show which chunks were used.',
    success: 'You see a generated answer with source attributions ([Chunk 1], [Chunk 3]). The answer is factual and cites the exact chunks it referenced.',
    watchOut: 'If the answer hallucinates or ignores chunks, your prompt template may be weak. Emphasize "Answer ONLY using the provided context" in the system prompt.',
    dcMapping: 'Real Data Cloud: You call the Retriever API to get chunks, then pass them to your prompt template. The LLM (Einstein GPT, external API, or Groq) generates the final answer.',
  },
};
