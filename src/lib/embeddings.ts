import { pipeline, type FeatureExtractionPipeline } from '@huggingface/transformers';

export interface EmbeddingModelInfo {
  id: string;
  label: string;
  dimensions: number;
  description: string;
  browserCompatible: boolean;
}

/** Models available in-browser via Transformers.js */
export const BROWSER_MODELS: EmbeddingModelInfo[] = [
  {
    id: 'Xenova/all-MiniLM-L6-v2',
    label: 'all-MiniLM-L6-v2',
    dimensions: 384,
    description: 'Fast, lightweight, good quality. Best for learning and prototyping.',
    browserCompatible: true,
  },
  {
    id: 'Xenova/bge-small-en-v1.5',
    label: 'BGE Small (v1.5)',
    dimensions: 384,
    description: 'BAAI general embedding model. Strong MTEB scores for its size.',
    browserCompatible: true,
  },
  {
    id: 'Xenova/gte-small',
    label: 'GTE Small',
    dimensions: 384,
    description: 'Alibaba general text embedding. Good multilingual support.',
    browserCompatible: true,
  },
];

/** All models for comparison (including enterprise/server-only) */
export const ALL_MODELS: EmbeddingModelInfo[] = [
  ...BROWSER_MODELS,
  {
    id: 'intfloat/e5-large-v2',
    label: 'E5 Large V2',
    dimensions: 1024,
    description: 'High-quality general-purpose embeddings. Requires "query:" and "passage:" prefixes.',
    browserCompatible: false,
  },
  {
    id: 'intfloat/multilingual-e5-large',
    label: 'Multilingual E5 Large',
    dimensions: 1024,
    description: 'Supports 100+ languages with strong cross-lingual retrieval.',
    browserCompatible: false,
  },
  {
    id: 'openai/clip-vit-base-patch32',
    label: 'CLIP (OpenAI)',
    dimensions: 512,
    description: 'Multi-modal model. Embeds both text and images into the same vector space.',
    browserCompatible: false,
  },
  {
    id: 'salesforce/sfr-embedding-2-small',
    label: 'Salesforce SFR V2 Small',
    dimensions: 256,
    description: 'Compact, high-quality embeddings optimised for RAG in Salesforce Data Cloud.',
    browserCompatible: false,
  },
  {
    id: 'text-embedding-3-small',
    label: 'OpenAI Ada 3 Small',
    dimensions: 1536,
    description: 'OpenAI API model. High quality, $0.02/1M tokens.',
    browserCompatible: false,
  },
  {
    id: 'text-embedding-3-large',
    label: 'OpenAI Ada 3 Large',
    dimensions: 3072,
    description: 'OpenAI highest quality. $0.13/1M tokens. Best for production.',
    browserCompatible: false,
  },
];

// ── Runtime model management ──

let currentModelId: string = BROWSER_MODELS[0].id;
let embedder: FeatureExtractionPipeline | null = null;
let loadingPromise: Promise<FeatureExtractionPipeline> | null = null;

export function getCurrentModelId(): string {
  return currentModelId;
}

export function getCurrentModelInfo(): EmbeddingModelInfo {
  return BROWSER_MODELS.find(m => m.id === currentModelId) || BROWSER_MODELS[0];
}

/** Switch embedding model. Clears the cached pipeline. */
export function setModel(modelId: string): void {
  const model = BROWSER_MODELS.find(m => m.id === modelId);
  if (!model) return;
  if (modelId === currentModelId && embedder) return;
  currentModelId = modelId;
  embedder = null;
  loadingPromise = null;
}

/** Load the embedding model lazily */
export async function getEmbedder(): Promise<FeatureExtractionPipeline> {
  if (embedder) return embedder;
  if (loadingPromise) return loadingPromise;

  loadingPromise = pipeline('feature-extraction', currentModelId, {
    dtype: 'fp32',
  }).then((pipe) => {
    embedder = pipe;
    loadingPromise = null;
    return pipe;
  });

  return loadingPromise;
}

/** Embed a single text string */
export async function embedText(text: string): Promise<number[]> {
  const pipe = await getEmbedder();
  const output = await pipe(text, { pooling: 'mean', normalize: true });
  return Array.from(output.data as Float32Array);
}

/** Embed multiple texts */
export async function embedTexts(texts: string[]): Promise<number[][]> {
  const results: number[][] = [];
  for (const text of texts) {
    results.push(await embedText(text));
  }
  return results;
}
