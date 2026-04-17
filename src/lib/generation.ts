import { pipeline } from '@huggingface/transformers';

// ── distilbert fallback (no API key) ──────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let qaModel: any = null;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let loadingPromise: Promise<any> | null = null;
const DISTILBERT_ID = 'Xenova/distilbert-base-uncased-distilled-squad';

export async function getGenerator() {
  if (qaModel) return qaModel;
  if (loadingPromise) return loadingPromise;
  loadingPromise = pipeline('question-answering', DISTILBERT_ID, { dtype: 'q8' }).then((pipe) => {
    qaModel = pipe;
    loadingPromise = null;
    console.log('[generation] distilbert loaded');
    return pipe;
  });
  return loadingPromise;
}

// ── errors ────────────────────────────────────────────────────────────────────
export class GroqRateLimitError extends Error {
  constructor() { super('Groq daily limit reached'); this.name = 'GroqRateLimitError'; }
}

// ── localStorage key ──────────────────────────────────────────────────────────
export const GROQ_KEY_STORAGE = 'learnrag_groq_key';

export function getStoredGroqKey(): string {
  try { return localStorage.getItem(GROQ_KEY_STORAGE) ?? ''; } catch { return ''; }
}

export function saveGroqKey(key: string): void {
  try { localStorage.setItem(GROQ_KEY_STORAGE, key); } catch { /* noop */ }
}

// ── shared helpers ────────────────────────────────────────────────────────────
function decodeEntities(text: string): string {
  try {
    const ta = document.createElement('textarea');
    ta.innerHTML = text;
    return ta.value;
  } catch {
    return text
      .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&nbsp;/g, ' ')
      .replace(/&middot;/g, '·').replace(/&mdash;/g, '—').replace(/&ndash;/g, '–')
      .replace(/&#(\d+);/g, (_, c) => String.fromCharCode(parseInt(c, 10)))
      .replace(/&#x([0-9a-fA-F]+);/g, (_, c) => String.fromCharCode(parseInt(c, 16)));
  }
}

export interface GenerationResult {
  answer: string;
  confidence: number;   // 0–1; Groq always returns 1.0
  model: 'groq' | 'distilbert';
}

// ── Groq path ─────────────────────────────────────────────────────────────────
async function generateWithGroq(
  query: string,
  chunks: { text: string; score: number }[],
  apiKey: string,
): Promise<GenerationResult> {
  const contextBlock = chunks
    .map((c, i) => `[Source ${i + 1}]:\n${decodeEntities(c.text).trim()}`)
    .join('\n\n');

  const resp = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'llama-3.1-8b-instant',
      temperature: 0.1,
      max_tokens: 250,
      messages: [
        {
          role: 'system',
          content:
            'You are a helpful assistant. Answer the question using ONLY the provided context. ' +
            'Be concise (2–3 sentences max). Always cite which source(s) your answer uses, e.g. [Source 1].',
        },
        {
          role: 'user',
          content: `Context:\n${contextBlock}\n\nQuestion: ${query}`,
        },
      ],
    }),
  });

  if (!resp.ok) {
    if (resp.status === 429) throw new GroqRateLimitError();
    const err = await resp.json().catch(() => ({}));
    throw new Error((err as { error?: { message?: string } }).error?.message ?? `Groq error ${resp.status}`);
  }

  const data = await resp.json() as { choices: { message: { content: string } }[] };
  return {
    answer: data.choices[0].message.content.trim(),
    confidence: 1,
    model: 'groq',
  };
}

// ── distilbert path ───────────────────────────────────────────────────────────
function wrapAnswer(answer: string, question: string): string {
  const q = question.trim().toLowerCase().replace(/\?$/, '');
  const a = answer.trim();
  const A = a.charAt(0).toUpperCase() + a.slice(1);
  const dot = A.match(/[.!?]$/) ? '' : '.';
  if (q.startsWith('why')) return `This occurred because of ${a.charAt(0).toLowerCase() + a.slice(1)}${dot}`;
  return `${A}${dot}`;
}

async function generateWithDistilbert(
  query: string,
  chunks: { text: string; score: number }[],
): Promise<GenerationResult> {
  const pipe = await getGenerator();

  const perChunk = await Promise.all(
    chunks.map(async (c, i) => {
      const context = decodeEntities(c.text).trim();
      const output = await pipe(query, context) as { answer: string; score: number };
      console.log(`[generation] chunk ${i + 1} → "${output.answer}" (${output.score.toFixed(4)})`);
      return output;
    })
  );

  const best = perChunk.reduce((a, b) => (b.score > a.score ? b : a));

  if (!best.answer.trim() || best.score < 0.01) {
    return {
      answer: "I don't have enough information to answer that based on the provided documents.",
      confidence: 0,
      model: 'distilbert',
    };
  }

  return {
    answer: wrapAnswer(best.answer, query),
    confidence: best.score,
    model: 'distilbert',
  };
}

// ── main export ───────────────────────────────────────────────────────────────
export async function generateAnswer(
  query: string,
  chunks: { text: string; score: number }[],
  groqKey?: string,
): Promise<GenerationResult> {
  const key = groqKey ?? getStoredGroqKey();
  if (key) {
    return generateWithGroq(query, chunks, key);
  }
  return generateWithDistilbert(query, chunks);
}
