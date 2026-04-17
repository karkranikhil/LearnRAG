import { createContext, useContext } from 'react';
import type { Chunk, ChunkStrategy } from '../../../lib/chunking';

export type SearchType = 'semantic' | 'hybrid';
export type PipelineStep = 0 | 1 | 2 | 3 | 4;

export const STEPS = [
  { id: 0 as const, label: 'Load Data', icon: 'database' },
  { id: 1 as const, label: 'Chunk', icon: 'layers' },
  { id: 2 as const, label: 'Embed', icon: 'brain' },
  { id: 3 as const, label: 'Retrieve', icon: 'search' },
  { id: 4 as const, label: 'Generate', icon: 'sparkles' },
] as const;

export interface EmbeddedChunk extends Chunk {
  embedding: number[];
}

export interface SearchResult {
  chunk: EmbeddedChunk;
  score: number;
  matchType?: 'semantic' | 'keyword' | 'both';
}

export interface PlaygroundState {
  currentStep: PipelineStep;
  rawText: string;
  rawHtml: string;
  stripHtml: boolean;
  sourceLabel: string;
  documentSubtitle: string;
  sourceType: string;
  sourceUrl: string;
  sourceLoadedAt: string;
  chunks: Chunk[];
  chunkStrategy: ChunkStrategy;
  chunkSize: number;
  chunkOverlap: number;
  ingestionLog: string[];
  embeddedChunks: EmbeddedChunk[];
  isEmbedding: boolean;
  embeddingProgress: number;
  query: string;
  results: SearchResult[];
  isSearching: boolean;
  searchType: SearchType;
  topK: number;
  generatedAnswer: string;
  isGenerating: boolean;
}

export const defaultState: PlaygroundState = {
  currentStep: 0,
  rawText: '',
  rawHtml: '',
  stripHtml: true,
  sourceLabel: '',
  documentSubtitle: '',
  sourceType: '',
  sourceUrl: '',
  sourceLoadedAt: '',
  chunks: [],
  chunkStrategy: 'sliding-window',
  chunkSize: 300,
  chunkOverlap: 50,
  ingestionLog: [],
  embeddedChunks: [],
  isEmbedding: false,
  embeddingProgress: 0,
  query: '',
  results: [],
  isSearching: false,
  searchType: 'semantic',
  topK: 5,
  generatedAnswer: '',
  isGenerating: false,
};

export type PlaygroundAction =
  | { type: 'SET_STEP'; payload: PipelineStep }
  | { type: 'SET_RAW_TEXT'; payload: string }
  | { type: 'SET_RAW_HTML'; payload: string }
  | { type: 'SET_STRIP_HTML'; payload: boolean }
  | { type: 'SET_SOURCE_LABEL'; payload: string }
  | { type: 'SET_DOCUMENT_SUBTITLE'; payload: string }
  | { type: 'SET_SOURCE_TYPE'; payload: string }
  | { type: 'SET_SOURCE_URL'; payload: string }
  | { type: 'SET_SOURCE_LOADED_AT'; payload: string }
  | { type: 'SET_CHUNKS'; payload: Chunk[] }
  | { type: 'SET_CHUNK_STRATEGY'; payload: ChunkStrategy }
  | { type: 'SET_CHUNK_SIZE'; payload: number }
  | { type: 'SET_CHUNK_OVERLAP'; payload: number }
  | { type: 'ADD_LOG'; payload: string }
  | { type: 'CLEAR_LOG' }
  | { type: 'SET_EMBEDDED_CHUNKS'; payload: EmbeddedChunk[] }
  | { type: 'SET_IS_EMBEDDING'; payload: boolean }
  | { type: 'SET_EMBEDDING_PROGRESS'; payload: number }
  | { type: 'SET_QUERY'; payload: string }
  | { type: 'SET_RESULTS'; payload: SearchResult[] }
  | { type: 'SET_IS_SEARCHING'; payload: boolean }
  | { type: 'SET_SEARCH_TYPE'; payload: SearchType }
  | { type: 'SET_TOP_K'; payload: number }
  | { type: 'SET_GENERATED_ANSWER'; payload: string }
  | { type: 'SET_IS_GENERATING'; payload: boolean };

export function playgroundReducer(state: PlaygroundState, action: PlaygroundAction): PlaygroundState {
  switch (action.type) {
    case 'SET_STEP': return { ...state, currentStep: action.payload };
    case 'SET_RAW_TEXT': return { ...state, rawText: action.payload };
    case 'SET_RAW_HTML': return { ...state, rawHtml: action.payload };
    case 'SET_STRIP_HTML': return { ...state, stripHtml: action.payload };
    case 'SET_SOURCE_LABEL': return { ...state, sourceLabel: action.payload };
    case 'SET_DOCUMENT_SUBTITLE': return { ...state, documentSubtitle: action.payload };
    case 'SET_SOURCE_TYPE': return { ...state, sourceType: action.payload };
    case 'SET_SOURCE_URL': return { ...state, sourceUrl: action.payload };
    case 'SET_SOURCE_LOADED_AT': return { ...state, sourceLoadedAt: action.payload };
    case 'SET_CHUNKS': return { ...state, chunks: action.payload };
    case 'SET_CHUNK_STRATEGY': return { ...state, chunkStrategy: action.payload };
    case 'SET_CHUNK_SIZE': return { ...state, chunkSize: action.payload };
    case 'SET_CHUNK_OVERLAP': return { ...state, chunkOverlap: action.payload };
    case 'ADD_LOG': return { ...state, ingestionLog: [...state.ingestionLog, action.payload] };
    case 'CLEAR_LOG': return { ...state, ingestionLog: [] };
    case 'SET_EMBEDDED_CHUNKS': return { ...state, embeddedChunks: action.payload };
    case 'SET_IS_EMBEDDING': return { ...state, isEmbedding: action.payload };
    case 'SET_EMBEDDING_PROGRESS': return { ...state, embeddingProgress: action.payload };
    case 'SET_QUERY': return { ...state, query: action.payload };
    case 'SET_RESULTS': return { ...state, results: action.payload };
    case 'SET_IS_SEARCHING': return { ...state, isSearching: action.payload };
    case 'SET_SEARCH_TYPE': return { ...state, searchType: action.payload };
    case 'SET_TOP_K': return { ...state, topK: action.payload };
    case 'SET_GENERATED_ANSWER': return { ...state, generatedAnswer: action.payload };
    case 'SET_IS_GENERATING': return { ...state, isGenerating: action.payload };
    default: return state;
  }
}

export const PlaygroundContext = createContext<{
  state: PlaygroundState;
  dispatch: React.Dispatch<PlaygroundAction>;
}>({ state: defaultState, dispatch: () => { throw new Error('usePlayground must be used within PlaygroundContext.Provider'); } });

export function usePlayground() {
  return useContext(PlaygroundContext);
}
