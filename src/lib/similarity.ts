/** Compute cosine similarity between two vectors */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0;
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  return denom === 0 ? 0 : dot / denom;
}

export interface ScoredItem<T> {
  item: T;
  score: number;
}

/** Rank items by cosine similarity to a query vector */
export function rankBySimilarity<T>(
  queryVector: number[],
  items: { item: T; vector: number[] }[],
  topK: number = 5
): ScoredItem<T>[] {
  return items
    .map(({ item, vector }) => ({
      item,
      score: cosineSimilarity(queryVector, vector),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);
}
