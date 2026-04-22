import { useState } from 'react';
import { createPortal } from 'react-dom';
import { BookOpen, X } from 'lucide-react';

interface GlossaryEntry {
  term: string;
  sfAbbrev?: string;
  definition: string;
  ragEquivalent?: string;
  example: string;
}

const GLOSSARY: GlossaryEntry[] = [
  {
    term: 'Agentforce Data Library',
    sfAbbrev: 'ADL',
    definition: 'Quick-start setup for RAG. Creating an ADL automatically sets up all components: data streams, DMO mapping, vector data store, search index, retriever, prompt template, and agent action. Uses default settings optimized for Agentforce.',
    ragEquivalent: 'All-in-One RAG Setup',
    example: 'Create an ADL in Setup or Agent Builder → upload files or select knowledge articles → Salesforce auto-creates FileUDMO_SI search index with hybrid search, 512-token chunks, and E5 Large Multilingual embeddings.',
  },
  {
    term: 'Data Lake Object',
    sfAbbrev: 'DLO',
    definition: 'The raw container where source data first lands. Think of it as the "receiving dock" — documents arrive here with all their metadata (file path, content type, size) before any processing.',
    ragEquivalent: 'Source Document Metadata',
    example: 'When you upload a PDF to Data Cloud, it becomes a DLO record with fields like FilePath__c, Size__c, ContentType__c.',
  },
  {
    term: 'Data Model Object',
    sfAbbrev: 'DMO',
    definition: 'Semantically mapped version of the DLO. Fields are structured for downstream use. For unstructured data, UDMO (Unstructured DMO) mirrors the UDLO 1:1 — no transformation yet.',
    ragEquivalent: 'Structured Document Record',
    example: 'The UDMO inherits all DLO fields. Semantic enrichment (title, body parsing) happens later at the Search Index layer, not here.',
  },
  {
    term: 'Chunk DMO',
    sfAbbrev: 'Chunk DMO',
    definition: 'Individual text segments created by slicing the DMO body field. Each chunk becomes its own record with overlap for retrieval coverage.',
    ragEquivalent: 'Text Chunks',
    example: 'A 5000-word document → 15 Chunk DMO records, each ~300 tokens with 50-token overlap.',
  },
  {
    term: 'Index Data Model Object',
    sfAbbrev: 'IDMO',
    definition: 'Vector embeddings + metadata for each chunk. This is what the retriever searches. Each Chunk DMO gets embedded into an IDMO record with a ~384-768 dimension vector.',
    ragEquivalent: 'Vector Store / Embeddings',
    example: 'Chunk "What is HNSW?" → IDMO record with embedding [0.12, -0.05, 0.89, ...] indexed for cosine similarity search.',
  },
  {
    term: 'Chunk (Stage)',
    sfAbbrev: 'Chunk',
    definition: 'The chunking stage in offline preparation. Takes DMO body text and creates Chunk DMO records using a splitting strategy. ADL uses 512 tokens per chunk by default with hybrid search.',
    ragEquivalent: 'Text Splitter / Chunker',
    example: 'Chunking config in Search Index: max_tokens=512, overlap=TBD, strategy=sentence-aware → produces retrievable chunks.',
  },
  {
    term: 'Vectorize (Stage)',
    sfAbbrev: 'Vectorize',
    definition: 'The vectorization stage in offline preparation. Converts Chunk DMO text into vector representations. ADL uses E5 Large Multilingual embedding model by default.',
    ragEquivalent: 'Embedding Model',
    example: 'Vectorize takes "vector search" → outputs embedding vector → indexed for semantic similarity search.',
  },
  {
    term: 'Retriever',
    sfAbbrev: 'Retriever',
    definition: 'Semantic search engine. Embeds user query, ranks IDMO vectors by cosine similarity, returns top-K Chunk DMO text as context.',
    ragEquivalent: 'Vector Search / Similarity Ranker',
    example: 'Query: "How does indexing work?" → Retriever finds 3 most similar IDMO vectors → returns linked Chunk DMO text.',
  },
  {
    term: 'Unstructured DLO/DMO',
    sfAbbrev: 'UDLO / UDMO',
    definition: 'Specialized schemas for text-based content (PDFs, docs, web pages). UDLO captures raw metadata; UDMO auto-maps it 1:1. Semantic fields (title, body) are defined at the Search Index, not in the DMO itself.',
    ragEquivalent: 'Document Schema',
    example: 'PDF upload → UDLO with FilePath__c, ResolvedFilePath__c → UDMO mirrors those fields → Search Index defines which field is "body".',
  },
  {
    term: 'Search Index',
    sfAbbrev: 'Search Index',
    definition: 'Configuration layer that defines which DMO fields map to semantic roles (title, body, description) and chunking parameters. This is where you configure the Slicer and Translator behavior.',
    ragEquivalent: 'RAG Pipeline Config',
    example: 'Search Index config: "body" = DMO.Col1__c, chunk_size=300, model=e5-large-v2.',
  },
  {
    term: 'Data Stream',
    sfAbbrev: 'Data Stream',
    definition: 'The ingestion pipeline that monitors source connectors and triggers DLO creation when new documents arrive. Acts as the event source.',
    ragEquivalent: 'Data Ingestion Pipeline',
    example: 'SharePoint connector detects new file → Data Stream triggers → DLO record created → DMO populated → Slicer runs.',
  },
  {
    term: 'Cosine Similarity',
    sfAbbrev: 'Cosine Sim',
    definition: 'The distance metric used by the Retriever. Measures the angle between two vectors. 1.0 = identical direction (same meaning), 0.0 = orthogonal (unrelated).',
    ragEquivalent: 'Vector Similarity Score',
    example: 'Query vector vs IDMO vector → cosine score 0.87 → high relevance, ranked #1 in results.',
  },
  {
    term: 'Hybrid Search',
    sfAbbrev: 'Hybrid',
    definition: 'Combines semantic (vector) search with keyword (BM25) matching. Typically weighted 60% semantic + 40% keyword for better recall.',
    ragEquivalent: 'Hybrid Retrieval',
    example: 'Query "HNSW algorithm" → vector match finds "approximate nearest neighbor" + keyword match finds exact "HNSW" mention.',
  },
];

export default function SalesforceGlossaryPanel() {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const filtered = GLOSSARY.filter(
    (e) =>
      e.term.toLowerCase().includes(search.toLowerCase()) ||
      (e.sfAbbrev && e.sfAbbrev.toLowerCase().includes(search.toLowerCase())) ||
      e.definition.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        style={{
          fontSize: '0.75rem',
          color: '#94a3b8',
          fontFamily: "'JetBrains Mono', monospace",
          background: 'transparent',
          border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: '0.375rem',
          padding: '0.25rem 0.5rem',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '0.375rem',
        }}
        title="Salesforce Data Cloud Glossary"
      >
        <BookOpen size={14} />
        Glossary
      </button>

      {/* Sliding Panel */}
      {open && typeof document !== 'undefined' && createPortal(
        <>
          {/* Backdrop */}
          <div
            onClick={() => setOpen(false)}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.5)',
              zIndex: 9998,
              backdropFilter: 'blur(4px)',
            }}
          />

          {/* Panel */}
          <div
            style={{
              position: 'fixed',
              top: 0,
              right: 0,
              bottom: 0,
              width: '480px',
              maxWidth: '90vw',
              background: '#1a1d27',
              borderLeft: '1px solid rgba(255,255,255,0.1)',
              boxShadow: '-4px 0 24px rgba(0,0,0,0.3)',
              zIndex: 9999,
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
            }}
          >
            {/* Header */}
            <div
              style={{
                padding: '1rem 1.25rem',
                borderBottom: '1px solid rgba(255,255,255,0.08)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div>
                <h2
                  style={{
                    fontSize: '1rem',
                    fontWeight: 700,
                    color: '#f0f0f0',
                    marginBottom: '0.125rem',
                  }}
                >
                  Salesforce Data Cloud Glossary
                </h2>
                <p style={{ fontSize: '0.75rem', color: '#8b8b8b', margin: 0 }}>
                  RAG concepts mapped to Data Cloud terminology
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '0.375rem',
                  padding: '0.375rem',
                  cursor: 'pointer',
                  color: '#8b8b8b',
                  display: 'flex',
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Search */}
            <div style={{ padding: '0.875rem 1.25rem' }}>
              <input
                type="text"
                placeholder="Search terms... (e.g. DLO, vector, chunk)"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.5rem 0.75rem',
                  background: 'rgba(22,19,30,0.6)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '0.5rem',
                  color: '#e0e0e0',
                  fontSize: '0.875rem',
                }}
              />
            </div>

            {/* Entries */}
            <div
              style={{
                flex: 1,
                overflowY: 'auto',
                padding: '0 1.25rem 1.25rem',
              }}
            >
              {filtered.length === 0 && (
                <div
                  style={{
                    padding: '2rem',
                    textAlign: 'center',
                    color: '#636363',
                  }}
                >
                  No matches for "{search}"
                </div>
              )}
              {filtered.map((entry, i) => (
                <div
                  key={i}
                  style={{
                    padding: '1rem',
                    background: 'rgba(30,26,41,0.5)',
                    border: '1px solid rgba(255,255,255,0.06)',
                    borderRadius: '0.75rem',
                    marginBottom: '0.75rem',
                  }}
                >
                  {/* Term + Abbrev */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      marginBottom: '0.5rem',
                    }}
                  >
                    <h3
                      style={{
                        fontSize: '0.9375rem',
                        fontWeight: 700,
                        color: '#e0e0e0',
                        margin: 0,
                      }}
                    >
                      {entry.term}
                    </h3>
                    {entry.sfAbbrev && (
                      <span
                        style={{
                          fontSize: '0.75rem',
                          fontFamily: "'JetBrains Mono', monospace",
                          color: '#b87dff',
                          background: 'rgba(168,85,247,0.1)',
                          border: '1px solid rgba(168,85,247,0.2)',
                          padding: '0.125rem 0.5rem',
                          borderRadius: '9999px',
                        }}
                      >
                        {entry.sfAbbrev}
                      </span>
                    )}
                  </div>

                  {/* Definition */}
                  <p
                    style={{
                      fontSize: '0.875rem',
                      color: '#c0c0c0',
                      lineHeight: 1.6,
                      margin: '0 0 0.75rem',
                    }}
                  >
                    {entry.definition}
                  </p>

                  {/* RAG Equivalent */}
                  {entry.ragEquivalent && (
                    <div
                      style={{
                        padding: '0.5rem 0.625rem',
                        background: 'rgba(59,130,246,0.06)',
                        border: '1px solid rgba(59,130,246,0.15)',
                        borderRadius: '0.5rem',
                        marginBottom: '0.75rem',
                      }}
                    >
                      <div
                        style={{
                          fontSize: '0.6875rem',
                          fontFamily: "'JetBrains Mono', monospace",
                          color: '#93c5fd',
                          letterSpacing: '0.05em',
                          textTransform: 'uppercase',
                          marginBottom: '0.125rem',
                        }}
                      >
                        Standard RAG Term
                      </div>
                      <div
                        style={{
                          fontSize: '0.8125rem',
                          color: '#93c5fd',
                          fontWeight: 600,
                        }}
                      >
                        {entry.ragEquivalent}
                      </div>
                    </div>
                  )}

                  {/* Example */}
                  <div
                    style={{
                      padding: '0.5rem 0.625rem',
                      background: 'rgba(74,222,128,0.04)',
                      border: '1px solid rgba(74,222,128,0.12)',
                      borderRadius: '0.5rem',
                    }}
                  >
                    <div
                      style={{
                        fontSize: '0.6875rem',
                        fontFamily: "'JetBrains Mono', monospace",
                        color: '#4ade80',
                        letterSpacing: '0.05em',
                        textTransform: 'uppercase',
                        marginBottom: '0.25rem',
                      }}
                    >
                      Example
                    </div>
                    <div
                      style={{
                        fontSize: '0.8125rem',
                        color: '#8b8b8b',
                        lineHeight: 1.5,
                      }}
                    >
                      {entry.example}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>,
        document.body
      )}
    </>
  );
}
