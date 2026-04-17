# Content Quality & Sourcing Policy

This policy governs all educational content on LearnRAG. It lives publicly in this repo as a trust contract with our users.

## Source Tiers

### Tier 1 — Ground Truth (always use when available)
- Original research papers (Lewis et al. 2020 RAG paper, RAGAS paper, HNSW paper, HyDE, Self-RAG, CRAG)
- Official documentation: LangChain, LlamaIndex, ChromaDB, Qdrant, Weaviate, Hugging Face, Transformers.js
- MTEB Leaderboard for embedding model benchmarks

### Tier 2 — Verified Secondary
- Jay Alammar's blog (visual ML explanations)
- Eugene Yan's writing on RAG evaluation
- Pinecone Learning Center articles (technically reviewed)
- Hugging Face blog posts (written by model authors)

### Tier 3 — Never Use as Source
- AI-generated blog posts or summaries
- Medium articles without cited primary sources
- Reddit, Hacker News, Stack Overflow (for concept definitions)
- Any source that doesn't cite where its numbers came from

## Claim Tagging System

Every factual claim in every chapter is tagged in the source markdown file:

```
Cosine similarity measures the angle between two vectors. [src: lewis2020, §3]
HNSW lookup runs in approximately O(log n) time. [src: malkov2018hnsw]
```

A `references.json` file in the repo maps every short code to the full citation. No untagged claims ship.

## Pre-Publish Checklist (Every Chapter)

- [ ] Every factual claim has a Tier 1 or Tier 2 source tag
- [ ] All numbers and benchmarks verified against the primary source directly
- [ ] "Could this have changed?" check — date-sensitive claims flagged for review
- [ ] One human who works with RAG in production has read the draft
- [ ] Every technical term is defined on first use
- [ ] The "explain it to a smart 16-year-old" test — does it still make sense?
- [ ] Sources section added to the bottom of the page
