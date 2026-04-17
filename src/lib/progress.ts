const STORAGE_KEY = 'learnrag-progress';

export interface Progress {
  completedChapters: string[];
  playgroundQueries: number;
  completedLabs: string[];
}

function getDefault(): Progress {
  return {
    completedChapters: [],
    playgroundQueries: 0,
    completedLabs: [],
  };
}

export function getProgress(): Progress {
  if (typeof window === 'undefined') return getDefault();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return getDefault();
    return { ...getDefault(), ...JSON.parse(raw) };
  } catch {
    return getDefault();
  }
}

function save(progress: Progress) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  window.dispatchEvent(new CustomEvent('learnrag-progress'));
}

export function markChapterComplete(chapterId: string) {
  const p = getProgress();
  if (!p.completedChapters.includes(chapterId)) {
    p.completedChapters.push(chapterId);
    save(p);
  }
}

export function incrementPlaygroundQueries() {
  const p = getProgress();
  p.playgroundQueries++;
  save(p);
}

export function markLabComplete(labId: string) {
  const p = getProgress();
  if (!p.completedLabs.includes(labId)) {
    p.completedLabs.push(labId);
    save(p);
  }
}

export type BadgeId = 'none' | 'explorer' | 'builder' | 'engineer' | 'architect';

export function getEarnedBadges(): BadgeId[] {
  const p = getProgress();
  const ch = p.completedChapters;
  const earned: BadgeId[] = [];

  // Explorer
  if (
    ch.includes('1-why-rag') &&
    ch.includes('2-chunking') &&
    p.playgroundQueries >= 1
  ) earned.push('explorer');

  // Builder
  if (
    ch.includes('3-embeddings') &&
    ch.includes('4-vector-databases') &&
    ch.includes('5-retrieval') &&
    p.completedLabs.includes('1-langchain-chromadb')
  ) earned.push('builder');

  // Engineer
  if (
    ch.includes('6-prompting') &&
    ch.includes('7-evaluation') &&
    p.completedLabs.includes('3-add-a-reranker')
  ) earned.push('engineer');

  // Architect
  if (
    ch.includes('8-advanced-patterns') &&
    p.completedLabs.includes('5-deploy-to-huggingface')
  ) earned.push('architect');

  return earned;
}

export function getHighestBadge(): BadgeId {
  const earned = getEarnedBadges();
  if (earned.includes('architect')) return 'architect';
  if (earned.includes('engineer')) return 'engineer';
  if (earned.includes('builder')) return 'builder';
  if (earned.includes('explorer')) return 'explorer';
  return 'none';
}

export function resetProgress() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEY);
  window.dispatchEvent(new CustomEvent('learnrag-progress'));
}
