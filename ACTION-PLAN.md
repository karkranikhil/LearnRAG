# LearnRAG — SEO Action Plan
**Date:** 2026-04-17 | **Priority Order:** Launch Blockers → Pre-Index → Content → Growth

---

## PHASE 1 — Fix Before Deploying (Launch Blockers)

### 1. Fix Domain and Rebuild
**Priority:** Critical | **Effort:** 5 min | **Impact:** All canonical + OG URLs

Decide on the canonical domain (`learnrag.online` or `learnrag.dev`), update `astro.config.mjs`, and rebuild:

```js
// astro.config.mjs
export default defineConfig({
  site: 'https://learnrag.online',  // confirm this is the real domain
  // ...
});
```

Then run `npm run build`. All canonical, og:url, and sitemap URLs will update automatically.

---

### 2. Add robots.txt
**Priority:** Critical | **Effort:** 10 min | **Impact:** Crawl control + AI crawler management

Create `/public/robots.txt`:

```
User-agent: *
Allow: /

# AI crawlers — allow indexing
User-agent: GPTBot
Allow: /

User-agent: ClaudeBot
Allow: /

User-agent: PerplexityBot
Allow: /

User-agent: Google-Extended
Allow: /

User-agent: Applebot-Extended
Allow: /

# Block bot access to pagefind assets (not content)
User-agent: *
Disallow: /pagefind/

Sitemap: https://learnrag.online/sitemap-index.xml
```

---

### 3. Add OG Image to All Pages
**Priority:** Critical | **Effort:** 30 min | **Impact:** Social click-through on every share

The `Thumbnail.png` already exists in `/public/`. Reference it in:

**Homepage** (`src/pages/index.astro`) — add to `<head>`:
```html
<meta property="og:image" content="https://learnrag.online/Thumbnail.png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:image" content="https://learnrag.online/Thumbnail.png">
```

**Chapter pages** — add to Starlight's head config in `astro.config.mjs`:
```js
starlight({
  head: [
    { tag: 'meta', attrs: { property: 'og:image', content: 'https://learnrag.online/Thumbnail.png' } },
    { tag: 'meta', attrs: { name: 'twitter:image', content: 'https://learnrag.online/Thumbnail.png' } },
  ],
})
```

Long term: generate per-chapter OG images via Vercel Edge Function as described in the PRD.

---

### 4. Add Canonical Tag to Homepage
**Priority:** Critical | **Effort:** 5 min | **Impact:** Homepage link equity consolidation

In `src/pages/index.astro`, add inside `<head>`:
```html
<link rel="canonical" href="https://learnrag.online/">
```

---

### 5. Add JSON-LD Structured Data
**Priority:** Critical | **Effort:** 45 min | **Impact:** Rich results eligibility, AI search understanding

**Homepage** — add `WebSite` + `Course` schema:
```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "WebSite",
  "name": "LearnRAG",
  "url": "https://learnrag.online",
  "description": "The hands-on, free course on Retrieval-Augmented Generation.",
  "potentialAction": {
    "@type": "SearchAction",
    "target": "https://learnrag.online/?q={search_term_string}",
    "query-input": "required name=search_term_string"
  }
}
</script>
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Course",
  "name": "LearnRAG — Retrieval-Augmented Generation",
  "description": "Learn to build RAG systems from zero to production. 8 chapters, interactive playground, hands-on labs. Free forever.",
  "provider": {
    "@type": "Organization",
    "name": "LearnRAG",
    "url": "https://learnrag.online"
  },
  "educationalLevel": "Beginner to Advanced",
  "isAccessibleForFree": true,
  "hasCourseInstance": {
    "@type": "CourseInstance",
    "courseMode": "online"
  }
}
</script>
```

**Each chapter page** — add `Article` schema via the MDX frontmatter or a layout component:
```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": "Why RAG Exists",
  "description": "Learn why Retrieval-Augmented Generation was invented...",
  "url": "https://learnrag.online/learn/1-why-rag/",
  "publisher": {
    "@type": "Organization",
    "name": "LearnRAG",
    "url": "https://learnrag.online"
  },
  "isPartOf": {
    "@type": "Course",
    "name": "LearnRAG — Retrieval-Augmented Generation"
  },
  "isAccessibleForFree": true
}
</script>
```

Best approach: create a `SchemaMarkup.astro` component, pass props from frontmatter, inject into layout.

---

## PHASE 2 — Do Before Google Indexes (Pre-Index Quality)

### 6. Add lastmod to Sitemap
**Effort:** 15 min | **Impact:** Recrawl efficiency

In `astro.config.mjs`, configure the sitemap integration to include `lastmod`:
```js
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  integrations: [
    sitemap({
      lastmod: new Date(),  // or per-page dates
    }),
    // ...
  ]
})
```

---

### 7. Create llms.txt
**Effort:** 20 min | **Impact:** AI search readiness (Perplexity, Claude, ChatGPT)

Create `/public/llms.txt`:
```
# LearnRAG

LearnRAG is a free, interactive course for learning Retrieval-Augmented Generation (RAG).
No signup required. No paywall. Designed for developers.

## What is RAG?
RAG (Retrieval-Augmented Generation) combines search with LLMs to produce grounded,
cited answers from your own documents — without hallucinations.

## Curriculum
- Chapter 1: Why RAG Exists — /learn/1-why-rag/
- Chapter 2: Data Ingestion & Chunking — /learn/2-chunking/
- Chapter 3: Embeddings & The Vector Space — /learn/3-embeddings/
- Chapter 4: Vector Databases — /learn/4-vector-databases/
- Chapter 5: Retrieval Strategies — /learn/5-retrieval/
- Chapter 6: The Prompt Layer — /learn/6-prompting/
- Chapter 7: Evaluation — /learn/7-evaluation/
- Chapter 8: Advanced Patterns — /learn/8-advanced-patterns/

## Interactive Tools
- Playground (in-browser RAG pipeline): /playground/
- Vector Database Picker: /library/database-picker/
- Embedding Model Leaderboard: /library/model-leaderboard/

## Labs
- Lab 1: LangChain + ChromaDB
- Lab 2: LlamaIndex Comparison
- Lab 3: Add a Re-ranker
- Lab 4: Evaluate with RAGAS
- Lab 5: Deploy to Hugging Face Spaces
```

---

### 8. Fix Title Tags for High-Traffic Chapters
**Effort:** 20 min | **Impact:** CTR from organic search

Update frontmatter titles in these three MDX files:

| File | Current Title | Recommended Title |
|---|---|---|
| `learn/3-embeddings.mdx` | `Embeddings & The Vector Space` | `What Are Embeddings? A Plain-English Guide for RAG` |
| `learn/5-retrieval.mdx` | `Retrieval Strategies` | `Hybrid Search vs Semantic Search: RAG Retrieval Strategies` |
| `learn/7-evaluation.mdx` | `Evaluation: How Do You Know It's Good?` | `How to Evaluate a RAG Pipeline with RAGAS` |

---

## PHASE 3 — Content Depth (Within 2 Weeks of Launch)

### 9. Expand Thin Chapters
**Effort:** 2–4 hrs per chapter | **Impact:** Ranking competitiveness on primary queries

Chapters 1, 2, and 3 need to reach 1,500–2,500 words of indexable text. Each element below adds ~200–400 words and improves content quality:

**For each thin chapter, add:**
- [ ] A "Common misconceptions" section (3–5 misconceptions, each with a correction)
- [ ] A "Comparison table" (e.g., RAG vs Fine-tuning side by side in Ch1)
- [ ] An FAQ section at the bottom (5 questions the target audience actually asks)
- [ ] The "Plain English summary" callout (defined in the PRD, currently partially implemented)
- [ ] Sources section with 2–3 cited papers explained in one sentence each

Note: React island interactive components do not contribute to Google's text index. Written prose is what counts.

---

## PHASE 4 — Growth SEO (Post-Launch, Month 1–2)

### 10. Self-Host Google Fonts
**Effort:** 30 min | **Impact:** LCP improvement ~150–200ms

Replace:
```html
<link href="https://fonts.googleapis.com/css2?family=Inter...">
```
With locally hosted fonts. Use `@fontsource/inter` and `@fontsource/jetbrains-mono` (already in `ssr.noExternal` config). This eliminates third-party font fetch on first paint.

### 11. Submit Sitemap to Google Search Console
**Effort:** 10 min | **Impact:** Indexing speed

After deploy: go to Google Search Console → Sitemaps → submit `https://learnrag.online/sitemap-index.xml`. Request indexing on homepage and Chapter 1 manually.

### 12. Set Up Breadcrumb Schema
**Effort:** 20 min | **Impact:** Rich result breadcrumbs in SERPs

Add `BreadcrumbList` JSON-LD to chapter and lab pages:
```json
{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    { "@type": "ListItem", "position": 1, "name": "Learn", "item": "https://learnrag.online/learn/1-why-rag/" },
    { "@type": "ListItem", "position": 2, "name": "Why RAG Exists", "item": "https://learnrag.online/learn/1-why-rag/" }
  ]
}
```

---

## Priority Summary

| # | Task | Priority | Effort | Phase |
|---|---|---|---|---|
| 1 | Fix domain + rebuild | 🔴 Critical | 5 min | Launch |
| 2 | Add robots.txt | 🔴 Critical | 10 min | Launch |
| 3 | Add OG image to all pages | 🔴 Critical | 30 min | Launch |
| 4 | Add canonical to homepage | 🔴 Critical | 5 min | Launch |
| 5 | Add JSON-LD structured data | 🔴 Critical | 45 min | Launch |
| 6 | Sitemap lastmod | ⚠️ Warning | 15 min | Pre-index |
| 7 | Create llms.txt | ⚠️ Warning | 20 min | Pre-index |
| 8 | Fix 3 chapter title tags | ⚠️ Warning | 20 min | Pre-index |
| 9 | Expand thin chapters 1–3 | ⚠️ Warning | 6–12 hrs | Content |
| 10 | Self-host fonts | ℹ️ Info | 30 min | Growth |
| 11 | Submit to Search Console | ℹ️ Info | 10 min | Growth |
| 12 | Breadcrumb schema | ℹ️ Info | 20 min | Growth |

**Minimum viable SEO for launch: tasks 1–5. Total time: ~95 minutes.**

---
*Generated by the LearnRAG SEO Skill — 2026-04-17*
