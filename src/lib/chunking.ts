export interface Chunk {
  id: number;
  text: string;
  start: number;
  end: number;
  tokenEstimate: number;
}

/** Rough token estimate: ~4 chars per token */
function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

function makeChunk(id: number, text: string, start: number, end: number): Chunk {
  return { id, text, start, end, tokenEstimate: estimateTokens(text) };
}

/**
 * Improved sentence splitter.
 * Handles abbreviations (Dr., Mr., Mrs., e.g., i.e., etc., vs.),
 * decimal numbers (1.5, v2.0), ellipsis (...), and URLs.
 */
function splitSentences(text: string): string[] {
  // Temporarily protect known abbreviations and decimals from splitting
  let protected_ = text;
  const protections: [RegExp, string][] = [
    [/\b(Mr|Mrs|Ms|Dr|Prof|Sr|Jr|St|etc|vs|e\.g|i\.e|al)\./gi, '$1\x00'],
    [/(\d)\./g, '$1\x00'],                   // decimals: 1.5, v2.0
    [/\.\.\./g, '\x00\x00\x00'],             // ellipsis
  ];
  for (const [re, rep] of protections) {
    protected_ = protected_.replace(re, rep);
  }

  // Split at sentence-ending punctuation followed by whitespace or end
  const parts = protected_.match(/[^\x00]*?[^.!?]*[.!?]+[\s]*/g);
  if (!parts) return [text];

  // Restore protected characters
  return parts.map(s => s.replace(/\x00/g, '.'));
}

/**
 * Snap an overlap position to the nearest word boundary.
 * If overlap would slice mid-word, extend to include the full word.
 */
function snapOverlapToWord(text: string, overlap: number): string {
  if (overlap <= 0 || overlap >= text.length) return text.slice(-overlap);
  const sliceStart = text.length - overlap;
  // Find the nearest space after sliceStart
  const spaceIdx = text.indexOf(' ', sliceStart);
  if (spaceIdx === -1 || spaceIdx >= text.length - 1) return text.slice(sliceStart);
  return text.slice(spaceIdx + 1);
}

/** Apply overlap between raw chunks. The tail of previous chunk is prepended to next. */
function applyOverlap(
  rawChunks: { text: string; start: number; end: number }[],
  overlap: number
): Chunk[] {
  if (overlap <= 0 || rawChunks.length === 0) {
    return rawChunks.map((c, i) => makeChunk(i, c.text, c.start, c.end));
  }
  const chunks: Chunk[] = [];
  for (let i = 0; i < rawChunks.length; i++) {
    if (i === 0) {
      chunks.push(makeChunk(i, rawChunks[i].text, rawChunks[i].start, rawChunks[i].end));
    } else {
      const prevText = rawChunks[i - 1].text;
      const tail = snapOverlapToWord(prevText, overlap);
      if (tail.length === 0) {
        chunks.push(makeChunk(i, rawChunks[i].text, rawChunks[i].start, rawChunks[i].end));
      } else {
        const combined = tail + '\n\n' + rawChunks[i].text;
        const adjustedStart = Math.max(0, rawChunks[i].start - tail.length);
        chunks.push(makeChunk(i, combined, adjustedStart, rawChunks[i].end));
      }
    }
  }
  return chunks;
}

// ────────────────────────────────────────────────
// STRATEGIES
// ────────────────────────────────────────────────

/**
 * Fixed-size chunking.
 * Splits every N characters regardless of content.
 * Simple, predictable, fast. No awareness of semantics.
 */
export function chunkFixed(text: string, size: number, overlap: number): Chunk[] {
  const chunks: Chunk[] = [];
  let i = 0;
  let id = 0;
  // Prevent degenerate case where overlap >= size creates 1-char steps
  const step = Math.max(Math.floor(size / 4), size - overlap);
  while (i < text.length) {
    const end = Math.min(i + size, text.length);
    chunks.push(makeChunk(id++, text.slice(i, end), i, end));
    if (end >= text.length) break;
    i += step;
  }
  return chunks;
}

/**
 * Sentence-based chunking.
 * Groups sentences until maxSize is reached. Never splits mid-sentence.
 * Overlap is applied at word boundaries using snapOverlapToWord.
 */
export function chunkSentence(text: string, maxSize: number, overlap: number): Chunk[] {
  const sentences = splitSentences(text);
  const chunks: Chunk[] = [];
  let current = '';
  let start = 0;
  let pos = 0;
  let id = 0;

  for (const sentence of sentences) {
    if (current.length + sentence.length > maxSize && current.length > 0) {
      chunks.push(makeChunk(id++, current.trim(), start, pos));
      if (overlap > 0) {
        const overlapText = snapOverlapToWord(current, overlap);
        start = pos - overlapText.length;
        current = overlapText;
      } else {
        start = pos;
        current = '';
      }
    }
    current += sentence;
    pos += sentence.length;
  }
  if (current.trim()) {
    chunks.push(makeChunk(id++, current.trim(), start, pos));
  }
  return chunks;
}

/**
 * Sliding window chunking.
 * Fixed-size windows with configurable overlap.
 * Most common strategy in production RAG pipelines.
 */
export function chunkSlidingWindow(text: string, size: number, overlap: number): Chunk[] {
  return chunkFixed(text, size, overlap);
}

/**
 * Section-Aware Chunking.
 *
 * Behavior:
 * - Detects section boundaries at markdown headings (# ## ### etc.)
 * - Content before the first heading is treated as its own section
 * - Adjacent small sections are combined into one chunk up to maxSize
 * - When a section exceeds maxSize, it splits at paragraph → sentence boundaries
 * - Overlap applied between ALL chunks at word boundaries
 */
export function chunkSectionAware(text: string, maxSize: number, overlap: number): Chunk[] {
  // Split at headings. Content before first heading is section[0].
  const rawSections: string[] = [];
  const headingRegex = /^#{1,6}\s/gm;
  let lastIdx = 0;
  let match: RegExpExecArray | null;

  while ((match = headingRegex.exec(text)) !== null) {
    if (match.index > lastIdx) {
      rawSections.push(text.slice(lastIdx, match.index));
    }
    lastIdx = match.index;
  }
  if (lastIdx < text.length) {
    rawSections.push(text.slice(lastIdx));
  }

  // Group sections into chunks
  const rawChunks: { text: string; start: number; end: number }[] = [];
  let accumulated = '';
  let accStart = 0;
  let pos = 0;

  for (const section of rawSections) {
    if (!section.trim()) { pos += section.length; continue; }

    // Can we accumulate this section?
    if (accumulated.length + section.length <= maxSize) {
      if (!accumulated) accStart = pos;
      accumulated += section;
      pos += section.length;
      continue;
    }

    // Flush accumulated
    if (accumulated.trim()) {
      rawChunks.push({ text: accumulated.trim(), start: accStart, end: pos });
      accumulated = '';
    }
    accStart = pos;

    // Single section fits?
    if (section.length <= maxSize) {
      accumulated = section;
      pos += section.length;
      continue;
    }

    // Oversized section: split at paragraphs, then sentences
    const paragraphs = section.split(/\n\s*\n/).filter(p => p.trim());
    let secAcc = '';
    let secStart = pos;

    for (const para of paragraphs) {
      if (secAcc.length + para.length + 2 <= maxSize) {
        secAcc += (secAcc ? '\n\n' : '') + para;
      } else {
        if (secAcc.trim()) {
          rawChunks.push({ text: secAcc.trim(), start: secStart, end: secStart + secAcc.length });
          secStart += secAcc.length;
          secAcc = '';
        }
        if (para.length > maxSize) {
          // Even a single paragraph is oversized: split at sentences
          const sc = chunkSentence(para, maxSize, 0);
          for (const c of sc) {
            rawChunks.push({ text: c.text, start: secStart + c.start, end: secStart + c.end });
          }
          secStart += para.length;
        } else {
          secAcc = para;
        }
      }
    }
    if (secAcc.trim()) {
      rawChunks.push({ text: secAcc.trim(), start: secStart, end: secStart + secAcc.length });
    }

    pos += section.length;
    accumulated = '';
    accStart = pos;
  }

  if (accumulated.trim()) {
    rawChunks.push({ text: accumulated.trim(), start: accStart, end: pos });
  }

  return applyOverlap(rawChunks, overlap);
}

/**
 * Passage Extraction.
 *
 * Behavior:
 * - Identifies coherent passages using semantic boundaries:
 *   headings, horizontal rules (---), bold lines, and paragraph breaks
 * - Each passage kept as a single chunk if it fits within maxSize
 * - Oversized passages fall back to sentence-level splitting
 * - Overlap applied between all chunks at word boundaries
 */
export function chunkPassageExtraction(text: string, maxSize: number, overlap: number): Chunk[] {
  // Split at semantic boundaries
  const boundaries = /(?=^#{1,6}\s|^---+\s*$|^\*\*[^*]+\*\*\s*$)/gm;
  const rawPassages: string[] = [];
  let lastIdx = 0;
  let match: RegExpExecArray | null;

  while ((match = boundaries.exec(text)) !== null) {
    if (match.index > lastIdx) {
      rawPassages.push(text.slice(lastIdx, match.index));
    }
    lastIdx = match.index;
  }
  if (lastIdx < text.length) {
    rawPassages.push(text.slice(lastIdx));
  }

  // Further split at double newlines within each passage
  const passages: { text: string; offset: number }[] = [];
  let offset = 0;
  for (const passage of rawPassages) {
    const paraSplits = passage.split(/\n\s*\n/);
    let innerOffset = offset;
    for (const p of paraSplits) {
      if (p.trim()) {
        passages.push({ text: p.trim(), offset: innerOffset });
      }
      innerOffset += p.length + 2; // +2 for the \n\n
    }
    offset += passage.length;
  }

  const rawChunks: { text: string; start: number; end: number }[] = [];

  for (const passage of passages) {
    if (passage.text.length <= maxSize) {
      rawChunks.push({
        text: passage.text,
        start: passage.offset,
        end: passage.offset + passage.text.length,
      });
    } else {
      const sc = chunkSentence(passage.text, maxSize, 0);
      for (const c of sc) {
        rawChunks.push({
          text: c.text,
          start: passage.offset + c.start,
          end: passage.offset + c.end,
        });
      }
    }
  }

  return applyOverlap(rawChunks, overlap);
}

/**
 * Conversation-based Chunking.
 *
 * Behavior:
 * - Detects speaker turns using strict patterns:
 *   "Speaker:" at start of line where Speaker is a known role keyword
 * - Each turn is its own chunk
 * - Multi-line turns (continuation without a new speaker) are grouped together
 * - Oversized turns fall back to sentence-level splitting
 * - Overlap applied between turns at word boundaries
 *
 * Accepted speaker patterns:
 *   User:, Agent:, Customer:, Support:, Human:, Assistant:,
 *   Q:, A:, SPEAKER_1:, etc.
 */
export function chunkConversation(text: string, maxSize: number, overlap: number): Chunk[] {
  // Strict turn pattern: only known role keywords, not arbitrary capitalized words
  const turnPattern = /^(?:User|Agent|Customer|Support|Human|Assistant|Bot|Moderator|Speaker|Interviewer|Interviewee|Q|A|SPEAKER_\d+)\s*:/;
  const lines = text.split('\n');
  const rawChunks: { text: string; start: number; end: number }[] = [];
  let currentTurn = '';
  let start = 0;
  let pos = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const isTurnStart = turnPattern.test(line.trim());

    if (isTurnStart && currentTurn.trim()) {
      // Flush previous turn
      if (currentTurn.length <= maxSize) {
        rawChunks.push({ text: currentTurn.trim(), start, end: pos });
      } else {
        const sc = chunkSentence(currentTurn.trim(), maxSize, 0);
        for (const c of sc) {
          rawChunks.push({ text: c.text, start: start + c.start, end: start + c.end });
        }
      }
      start = pos;
      currentTurn = '';
    }

    currentTurn += (currentTurn ? '\n' : '') + line;
    pos += line.length + 1;
  }

  // Flush last turn
  if (currentTurn.trim()) {
    if (currentTurn.length <= maxSize) {
      rawChunks.push({ text: currentTurn.trim(), start, end: pos });
    } else {
      const sc = chunkSentence(currentTurn.trim(), maxSize, 0);
      for (const c of sc) {
        rawChunks.push({ text: c.text, start: start + c.start, end: start + c.end });
      }
    }
  }

  return applyOverlap(rawChunks, overlap);
}

// ────────────────────────────────────────────────
// POST-PROCESSOR: Prepend Field
// ────────────────────────────────────────────────

/**
 * Prepend Field — a post-processing feature, NOT a chunking strategy.
 *
 * Prepends metadata (title, category, URL) to every chunk produced by any strategy.
 * This enriches each chunk with context that helps the embedding model and LLM
 * understand where the chunk came from.
 *
 * - Reduces effective chunk size by the prepend length
 * - Skips prepending if prepend text alone exceeds 512 tokens
 */
export function applyPrependField(chunks: Chunk[], prependText: string): Chunk[] {
  if (!prependText) return chunks;

  const prependTokens = estimateTokens(prependText);
  if (prependTokens > 512) return chunks; // Skip if too long

  return chunks.map(chunk => ({
    ...chunk,
    text: `${prependText}\n${chunk.text}`,
    tokenEstimate: estimateTokens(`${prependText}\n${chunk.text}`),
  }));
}

// ────────────────────────────────────────────────
// STRATEGY REGISTRY
// ────────────────────────────────────────────────

export type ChunkStrategy =
  | 'fixed'
  | 'sentence'
  | 'sliding-window'
  | 'section-aware'
  | 'passage-extraction'
  | 'conversation';

export const STRATEGY_INFO: Record<ChunkStrategy, { label: string; description: string }> = {
  'fixed': {
    label: 'Fixed-size',
    description: 'Splits every N characters regardless of content. Simple and predictable.',
  },
  'sentence': {
    label: 'Sentence-based',
    description: 'Splits at sentence boundaries. Never cuts a sentence in half.',
  },
  'sliding-window': {
    label: 'Sliding Window',
    description: 'Fixed-size with overlap so no idea gets cut at the boundary. Most common in production.',
  },
  'section-aware': {
    label: 'Section-Aware',
    description: 'Splits at headings and paragraph breaks. Combines small adjacent sections. Never splits mid-sentence.',
  },
  'passage-extraction': {
    label: 'Passage Extraction',
    description: 'Extracts coherent passages using semantic boundaries (headings, paragraphs). Falls back to sentence-level for oversized passages.',
  },
  'conversation': {
    label: 'Conversation-based',
    description: 'Each speaker turn becomes its own chunk. Ideal for chat logs, transcripts, and support tickets.',
  },
};

/**
 * Main entry point for chunking.
 * Applies the chosen strategy, then optionally prepends metadata.
 */
export function chunkText(
  text: string,
  strategy: ChunkStrategy,
  size: number,
  overlap: number,
  prependText?: string
): Chunk[] {
  // Reduce effective size if prepending
  const effectiveSize = prependText ? Math.max(50, size - prependText.length) : size;

  let chunks: Chunk[];
  switch (strategy) {
    case 'fixed':
      chunks = chunkFixed(text, effectiveSize, overlap);
      break;
    case 'sentence':
      chunks = chunkSentence(text, effectiveSize, overlap);
      break;
    case 'sliding-window':
      chunks = chunkSlidingWindow(text, effectiveSize, overlap);
      break;
    case 'section-aware':
      chunks = chunkSectionAware(text, effectiveSize, overlap);
      break;
    case 'passage-extraction':
      chunks = chunkPassageExtraction(text, effectiveSize, overlap);
      break;
    case 'conversation':
      chunks = chunkConversation(text, effectiveSize, overlap);
      break;
    default:
      chunks = chunkFixed(text, effectiveSize, overlap);
  }

  // Apply prepend as post-processing
  if (prependText) {
    chunks = applyPrependField(chunks, prependText);
  }

  return chunks;
}
