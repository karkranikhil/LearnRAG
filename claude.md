# LearnRAG — Full Production PRD v2.0

**Document Status:** Final Draft  
**Version:** 2.0 — Badge system + Netlify-inspired design language  
**Audience:** Builder, Contributors, Reviewers  
**Philosophy:** Learn by doing. Written for engineers, not academics. Zero jargon without explanation.

---

## Table of Contents

1. [Mission & Philosophy](#1-mission--philosophy)
2. [Target Audience & User Personas](#2-target-audience--user-personas)
3. [The Learning Journey](#3-the-learning-journey)
4. [Full Curriculum — What We Cover](#4-full-curriculum--what-we-cover)
5. [The Interactive Playground](#5-the-interactive-playground)
6. [Website Structure & Information Architecture](#6-website-structure--information-architecture)
7. [Design System & UX Principles](#7-design-system--ux-principles)
8. [Content Quality & Sourcing Policy](#8-content-quality--sourcing-policy)
9. [Technical Stack](#9-technical-stack)
10. [Content Authoring Workflow](#10-content-authoring-workflow)
11. [Community & Growth Strategy](#11-community--growth-strategy)
12. [SEO & Discoverability](#12-seo--discoverability)
13. [Monetisation Path](#13-monetisation-path)
14. [Success Metrics](#14-success-metrics)
15. [Build Phases & Milestones](#15-build-phases--milestones)

---

## 1. Mission & Philosophy

### Mission Statement
LearnRAG is the internet's most beginner-friendly, hands-on platform for learning Retrieval-Augmented Generation — completely free, no login required, no PhD needed.

### The Three Laws of This Platform

**Law 1 — Plain English First.**  
Every concept is explained the way a smart friend would explain it to you over coffee. If a sentence sounds like a research paper, it gets rewritten. We define every acronym the first time it appears. We use real-world analogies before math.

**Law 2 — Show, Don't Just Tell.**  
Every concept has an interactive demo, a visual, or a live experiment attached to it. Reading about chunking is fine. Seeing your own text get chunked in real-time and understanding *why* it matters — that's learning.

**Law 3 — Build One Real Thing.**  
The entire course is structured around building a single project: a RAG chatbot over your own notes. Every chapter advances that one thing. By the time you finish, you have something working — not just knowledge in your head.

---

## 2. Target Audience & User Personas

### Persona A — "The Curious Student" (Alex)
- CS student or recent grad
- Understands Python basics, has heard of ChatGPT
- Frustrated that every tutorial assumes they already know what a vector is
- **Goal:** Understand what RAG is and build something they can show in a portfolio
- **Entry point:** Chapter 1

### Persona B — "The Working Engineer" (Priya)
- 2–5 years experience, builds APIs and backend systems
- Has been asked to "add AI" to their company's product
- Knows what an API is, comfortable with JSON, vague on embeddings
- **Goal:** Build a production RAG system without wasting two weeks on research
- **Entry point:** The Playground + Lab 1

### Persona C — "The Architect" (Marcus)
- Senior engineer or tech lead, evaluates tools and makes decisions
- Already knows the basics, needs to understand tradeoffs
- Wants evaluation frameworks, advanced patterns, real benchmark data
- **Goal:** Make the right architectural decisions and justify them
- **Entry point:** Chapter 7 (Evaluation) + Chapter 8 (Advanced Patterns)

---

## 3. The Learning Journey

### The Badge System
Progress is tracked through four badges. Each badge is earned by completing real actions — not just reading pages. Badges are stored in `localStorage` (no account needed). They display persistently in the sidebar next to the user's progress.

| Badge | Icon | Title | What You Can Do | Earned By |
|---|---|---|---|---|
| Explorer | 🔍 | Explorer | Explain what RAG is and why it matters | Complete Ch 1–2 + run 1 query in Playground |
| Builder | 🔨 | Builder | Ingest a document and retrieve relevant chunks | Complete Ch 3–5 + finish Lab 1 |
| Engineer | ⚡ | Engineer | Build and evaluate a working RAG pipeline | Complete Ch 6–7 + finish Lab 3 |
| Architect | 🏛️ | Architect | Design production RAG systems with confidence | Complete Ch 8 + finish Lab 5 |

### Badge Design Language
Each badge has a distinct visual identity shown in the sidebar, on chapter completion screens, and on the user's sharable "badge card":

| Badge | Background | Icon Color | Border |
|---|---|---|---|
| 🔍 Explorer | `#1A1D27` | `#94A3B8` (slate) | Slate dashed |
| 🔨 Builder | `#1A1D27` | `#3B82F6` (electric blue) | Blue solid |
| ⚡ Engineer | `#1A1D27` | `#22C55E` (neon green) | Green glowing |
| 🏛️ Architect | `#1A1D27` | `#F59E0B` (amber) | Amber with shine |

### Badge Earning Mechanics
- **Action-gated, not time-gated.** A user who finishes 2 chapters in one sitting earns the Explorer badge immediately.
- **No regression.** Once earned, badges cannot be lost. Progress only moves forward.
- **Shareable badge cards.** Each badge generates a shareable PNG card (OG-image style) that users can post to LinkedIn or Twitter. Contains: Badge icon, title, "I earned this on LearnRAG", date.
- **Sidebar display.** All four badge slots are always visible in the left sidebar. Unearned badges shown as greyed-out locks. Earned badges shown in full colour.

### The Project Thread
Every chapter advances the same project. The project is: **"Build a RAG chatbot over your own notes using only free tools."**

- **Ch 1** — Understand *why* you're building it and what problem it solves
- **Ch 2** — Ingest your first `.txt` file and see it get chunked
- **Ch 3** — See your first embedding vector, understand what it represents
- **Ch 4** — Store those vectors in a free local database
- **Ch 5** — Run your first query, see ranked results
- **Ch 6** — Write the prompt that turns those results into an answer
- **Ch 7** — Measure whether your chatbot is actually good
- **Ch 8** — Learn the patterns that make it production-ready

---

## 4. Full Curriculum — What We Cover

### CHAPTER 1 — Why RAG Exists
**Badge:** Explorer | **Reading time:** ~12 min | **Interaction:** Hallucination Toggle

**Plain-English Hook:**  
*"Your AI is trained on yesterday's news. RAG is how you plug it into today."*

**What We Cover:**
- The memory problem: why LLMs don't know about things that happened after training
- The hallucination problem: why LLMs confidently make things up
- Fine-tuning vs. RAG — a visual side-by-side comparison with real trade-offs (cost, time, update frequency, accuracy)
- What RAG actually does in one sentence: *"Find the right notes, then ask the AI to answer using only those notes."*
- A real-world analogy: RAG is like an open-book exam. Fine-tuning is like memorising a textbook.

**Interactivity — "The Hallucination Toggle":**  
A split screen. Left side: ask an LLM about a 2026 news event without RAG — it makes something up. Right side: same question with RAG enabled, pulling from a real document — it answers correctly and cites the source. One toggle. Instant visual proof of why RAG exists.

**Diagram:** Side-by-side architecture of Fine-tuning vs. RAG pipeline. Mermaid.js. Simple, labelled.

**Sources:** Lewis et al. (2020) original RAG paper, Anthropic documentation on context windows.

---

### CHAPTER 2 — Data Ingestion & Chunking
**Badge:** Explorer → Builder | **Reading time:** ~15 min | **Interaction:** Live Text Splitter

**Plain-English Hook:**  
*"You can't feed a library into an AI all at once. Chunking is how you cut it into pieces the AI can actually use."*

**What We Cover:**
- Why you can't just paste an entire PDF into an LLM (context window limits, explained simply)
- What a "chunk" is — a paragraph-sized piece of text with enough context to stand alone
- The four chunking strategies, explained visually: Fixed-size, Sentence-based, Sliding window, Semantic
- What "chunk overlap" is and why it matters
- How metadata (page number, filename, section title) gets attached to chunks

**Interactivity — "The Live Text Splitter":**  
User pastes any paragraph. Sliders control chunk size and overlap. The UI highlights each chunk in a different colour, live, as sliders move.

**Sources:** LangChain chunking documentation, LlamaIndex node parsers documentation.

---

### CHAPTER 3 — Embeddings & The Vector Space
**Badge:** Builder | **Reading time:** ~18 min | **Interaction:** Nearest Neighbour Explorer

**Plain-English Hook:**  
*"An embedding is just a list of numbers that captures the meaning of a sentence. Similar sentences have similar numbers."*

**What We Cover:**
- What an embedding model is — a machine that turns words into coordinates
- The map analogy: "King" and "Queen" are close. "King" and "Potato" are far apart.
- What a vector actually is (demystified: `[0.12, -0.05, 0.89...]`)
- Why cosine similarity measures the *angle*, not the distance — with a simple diagram
- Free embedding models available in-browser via Transformers.js

**Interactivity — "Find the Nearest Neighbour":**  
A 2D scatter plot with 20 pre-embedded sentences. User clicks any point and instantly sees the top 3 most similar sentences highlighted with scores. User can type their own sentence and see it appear on the plot.

**Sources:** Jay Alammar's "The Illustrated Word2Vec", Hugging Face MTEB leaderboard.

---

### CHAPTER 4 — Vector Databases
**Badge:** Builder | **Reading time:** ~14 min | **Interaction:** "Pick Your DB" Decision Tool

**Plain-English Hook:**  
*"A vector database is just a database that's really fast at the question: 'What's most similar to this?' Regular databases can't do that."*

**What We Cover:**
- Why regular SQL databases fail at similarity search
- HNSW explained simply: a multi-level highway system — start on the highway (fast, approximate), exit to local roads (precise)
- The free vector database landscape: ChromaDB, Qdrant, FAISS, Weaviate — comparison table
- Persistent vs. in-memory storage

**Interactivity — "Pick Your Database" Flowchart:**  
4 questions → recommended database with one-click setup link.

**Sources:** ChromaDB docs, Qdrant docs, Malkov & Yashunin HNSW paper (2018) — plain-English summary.

---

### CHAPTER 5 — Retrieval Strategies
**Badge:** Builder → Engineer | **Reading time:** ~16 min | **Interaction:** Strategy Comparator

**Plain-English Hook:**  
*"Searching by meaning is just the beginning. The difference between a toy demo and a real product is how smart your search is."*

**What We Cover:**
- Naive similarity search and the top-K problem
- Hybrid search — combining semantic (vectors) + keyword (BM25)
- MMR (Maximum Marginal Relevance) — avoiding 5 chunks that say the same thing
- Re-ranking — 20 rough candidates → 3 best via a smarter model
- Metadata filtering — "Only search finance documents"

**Interactivity — "Strategy Comparator":**  
Same query run through three strategies simultaneously. Results shown side-by-side. User sees concretely why strategy matters.

**Sources:** LangChain retrieval documentation, Pinecone Learning Center on hybrid search.

---

### CHAPTER 6 — The Prompt Layer
**Badge:** Engineer | **Reading time:** ~13 min | **Interaction:** Prompt Builder

**Plain-English Hook:**  
*"Retrieved chunks are just raw ingredients. The prompt is the recipe that tells the AI what to cook."*

**What We Cover:**
- Anatomy of a RAG prompt: System prompt + Retrieved context + User query
- The "lost in the middle" problem — put your best chunks first and last
- Context window math: tokens per section, how many chunks fit, why 3–5 is the sweet spot
- Citation formatting — how to prompt the AI to cite its sources
- Prompt templates for: Q&A, summarisation with sources, conversational chatbot

**Interactivity — "The Prompt Builder":**  
A live editor showing the assembled final prompt with token counts per section colour-coded.

**Sources:** Anthropic prompt engineering documentation, Liu et al. (2023) "Lost in the Middle".

---

### CHAPTER 7 — Evaluation: How Do You Know It's Good?
**Badge:** Engineer → Architect | **Reading time:** ~20 min | **Interaction:** RAGAS Score Calculator

**Plain-English Hook:**  
*"Building a RAG system is easy. Knowing if it actually works is the hard part — and the part most tutorials skip entirely."*

**What We Cover:**
- Why "it seems to work" isn't good enough for production
- The four metrics: Faithfulness, Answer Relevancy, Context Precision, Context Recall — each explained simply
- The RAGAS framework — how it works, how to run it, what the scores mean
- Building a test set of 20–50 question/answer pairs
- The improvement loop — when your score is low, how to diagnose which component is failing
- What "good enough" looks like for different use cases

**Interactivity — "Your RAG Score":**  
User pastes a question, a generated answer, and the retrieved chunks. The tool evaluates faithfulness and relevancy using an in-browser model and shows a score with explanation.

**Sources:** RAGAS paper (Shahul Es et al., 2023), RAGAS GitHub documentation.

---

### CHAPTER 8 — Advanced RAG Patterns
**Badge:** Architect | **Reading time:** ~25 min | **Interaction:** Pattern Selector

**Plain-English Hook:**  
*"Standard RAG is a knife. These patterns are the rest of the kitchen. You don't always need them — but when you do, you'll know."*

**What We Cover:**
- HyDE — generate a hypothetical answer, then search for chunks similar to *that*
- Query Decomposition — split complex questions into sub-questions
- Self-RAG — the model decides *whether* to retrieve at all
- Corrective RAG (CRAG) — fall back to web search when retrieval scores low
- Multi-Vector Retrieval — multiple representations of the same document
- Agentic RAG — RAG as a tool in an agent loop
- When to use each pattern — an honest "you probably don't need this" decision framework

**Interactivity — "Which Pattern Do I Need?":**  
A decision flowchart based on the user's specific problem → recommendation with link to the relevant Lab.

**Sources:** HyDE paper (Gao et al., 2022), Self-RAG paper (Asai et al., 2023), CRAG paper (Yan et al., 2024).

---

## 5. The Interactive Playground

The Playground is the heart of the platform. A single-page, "glass box" RAG pipeline where users see every step. No black box. Every intermediate result is shown.

It is not a separate feature — it *is* the project thread. Every chapter deposits something into it.

### Panel 1 — Ingestion
- Drag-and-drop file uploader (`.txt`, `.md`)
- Real-time processing log in a terminal-style display
- Chunking settings: chunk size slider, overlap slider, strategy dropdown
- Output: chunk cards colour-coded with token count and preview

### Panel 2 — Embedding
- "Embed Chunks" triggers in-browser embedding via Transformers.js (no API key)
- Each chunk card shows its truncated vector: `[0.12, -0.05, 0.89 ... +764 more]`
- Model selector: 2–3 free embedding models
- "Compare Vectors" mode: same chunk embedded with two models side-by-side

### Panel 3 — Retrieval
- Query input field
- Animated "ping" — the query vector flies toward stored chunks, most similar ones light up
- Results as ranked cards with similarity scores and highlighted matching text
- Strategy toggle: naive / hybrid / re-ranked

### Panel 4 — Generation
- Full assembled prompt shown: System Prompt (editable) + Retrieved Chunks + User Query
- Token counter per section
- "Generate Answer" button — free fallback always available, optional API key for better model
- Response with source attribution: "Based on: [chunk 3], [chunk 7]"

### Failure Mode Features
- **"Bad Chunking Demo"** — deliberately sets chunk size to 50 chars. User sees retrieval collapse.
- **"Wrong Model Demo"** — ingest with one embedding model, search with another. Scores collapse.
- **"No Context Demo"** — LLM answers without any retrieved chunks. Compare to the RAG answer.

---

## 6. Website Structure & Information Architecture

```
LearnRAG/
│
├── / (Home)
│   ├── Hero: "Learn RAG. Build something real. For free."
│   ├── Badge progress tracker (visual badge wall)
│   └── Three entry points: Start / Playground / Labs
│
├── /learn/ (The Academy)
│   ├── /learn/1-why-rag/
│   ├── /learn/2-chunking/
│   ├── /learn/3-embeddings/
│   ├── /learn/4-vector-databases/
│   ├── /learn/5-retrieval/
│   ├── /learn/6-prompting/
│   ├── /learn/7-evaluation/
│   └── /learn/8-advanced-patterns/
│
├── /playground/
│   ├── Panel 1: Ingestion
│   ├── Panel 2: Embedding
│   ├── Panel 3: Retrieval
│   └── Panel 4: Generation
│
├── /labs/
│   ├── /labs/1-langchain-chromadb/
│   ├── /labs/2-llamaindex-comparison/
│   ├── /labs/3-add-a-reranker/
│   ├── /labs/4-evaluate-with-ragas/
│   └── /labs/5-deploy-to-huggingface/
│
├── /library/
│   ├── /library/model-leaderboard/
│   ├── /library/database-picker/
│   ├── /library/paper-summaries/
│   └── /library/stack-decision-tree/
│
└── /about/
    ├── Content policy & sourcing rules
    ├── Contributor credits
    └── Link to GitHub repo
```

---

## 7. Design System & UX Principles

### Design Inspiration: Netlify Docs
The visual design takes direct inspiration from the Netlify documentation site (`docs.netlify.com`). It is among the best developer documentation designs available — clean, fast, information-dense without feeling cluttered, and equally readable at every level of technical depth. We adopt its layout system and interaction patterns as our foundation.

---

### Layout Architecture — Three-Column Docs Layout

This is the signature layout of the Netlify docs and our primary template for every chapter page:

```
┌─────────────────────────────────────────────────────────┐
│  [Logo]  Learn │ Playground │ Labs │ Library        [🔍] │  ← Top nav bar
├──────────────┬──────────────────────────┬────────────────┤
│              │                          │                │
│  LEFT        │   MAIN CONTENT           │  RIGHT         │
│  SIDEBAR     │                          │  SIDEBAR       │
│              │   # Chapter Title        │                │
│  Chapter 1   │                          │  On this page  │
│  Chapter 2   │   Hook sentence          │  ─────────     │
│  Chapter 3 ← │                          │  • Concept     │
│  Chapter 4   │   Explanation...         │  • Diagram     │
│  Chapter 5   │                          │  • Try it      │
│  Chapter 6   │   [Diagram]              │  • Project     │
│  Chapter 7   │                          │  • Sources     │
│  Chapter 8   │   [Interactive Widget]   │                │
│              │                          │  ─────────     │
│  ─────────   │   [Project Step]         │  🔍 Explorer   │
│  🔍 Explorer │                          │  🔨 Builder    │
│  🔨 Builder  │   [Sources]              │  ⚡ Engineer   │
│  ⚡ Engineer │                          │  🏛️ Architect  │
│  🏛️ Architect│   ← Prev │ Next →        │                │
│              │                          │                │
└──────────────┴──────────────────────────┴────────────────┘
```

**Left Sidebar — Section Navigation**
- Fixed, scrollable, always visible on desktop
- Lists all chapters under the current section (Learn / Labs / Library)
- Current page highlighted with a left border accent in Electric Blue `#3B82F6`
- Badge status indicators next to each section group: greyed lock if not earned, full colour if earned
- Collapsible on mobile (hamburger menu)

**Main Content Area**
- Max width `760px` for readability (Netlify uses ~740px)
- Clear heading hierarchy: `H1` for chapter title, `H2` for sections, `H3` for subsections
- Each `H2` has a `#anchor-link` icon that appears on hover — copy-linkable
- Breadcrumb trail at the very top: `Learn / Chapter 3 — Embeddings`
- Chapter meta row below title: `[🔨 Builder Badge]  [~18 min read]  [📋 Copy page]`

**Right Sidebar — "On This Page"**
- Sticky position, tracks scroll
- Lists all `H2` and `H3` headings as anchor links
- Active heading highlighted as user scrolls (scroll-spy)
- Below the TOC: the user's four badge slots, always visible
- At the very bottom: "Found an error? Open a GitHub issue" link

---

### Top Navigation Bar
Inspired directly by Netlify's top nav — compact, clean, section-based:

```
[LearnRAG logo]   Learn   Playground   Labs   Library   [Search 🔍]
```

- Sticky on scroll
- Dark background `#0F1117`
- Active section underlined with Electric Blue
- Search opens a command-palette style modal (keyboard shortcut: `Cmd+K`)

---

### Callout Boxes
Netlify uses Tip / Warning / Note callouts heavily. We adopt the same pattern with our colour system:

```
💡 TIP
[Electric Blue left border — #3B82F6]
Used for: shortcuts, best practices, helpful hints

⚠️ WATCH OUT  
[Amber left border — #F59E0B]
Used for: common mistakes, things that confuse beginners

🔴 IMPORTANT
[Soft Red left border — #EF4444]
Used for: things that will break your project if ignored

✅ PLAIN ENGLISH
[Neon Green left border — #22C55E]
Used for: the one-sentence plain-English version of a complex concept
          Appears after every technical explanation.
```

The `✅ PLAIN ENGLISH` callout is our invention — not in Netlify. It appears after every concept explanation and gives the "if you only remember one thing" summary. Example:

```
✅ PLAIN ENGLISH
Cosine similarity just asks: "Do these two vectors point in roughly 
the same direction?" If yes, the sentences are similar in meaning.
```

---

### Code Blocks
Styled identically to Netlify's terminal blocks:

- Dark background `#0D1117`
- Monospace font: `JetBrains Mono`
- Language label in top-right corner (`python`, `bash`, `json`)
- One-click "Copy" button top-right
- Line numbers optional (off by default)
- For bash/terminal commands: a subtle `$` prefix on command lines, no `$` on output lines

```python
# Example: embedding a sentence with Transformers.js
from transformers import pipeline
embedder = pipeline("feature-extraction", model="BAAI/bge-small-en")
vector = embedder("What is RAG?")
print(f"Vector length: {len(vector[0][0])}")  # → 384
```

---

### Chapter Page — Bottom Navigation
Exactly like Netlify docs — Previous / Next navigation at the bottom of every page:

```
─────────────────────────────────────────────────────────
← Previous                                      Next →
  Chapter 2: Chunking              Chapter 4: Vector DBs
─────────────────────────────────────────────────────────
```

---

### Feedback Widget
Bottom of every page, identical to Netlify's pattern:

```
Was this chapter helpful?
[👍 Yes]  [👎 Needs work]

→ If 👎: a small textarea appears: "What would make this clearer?"
  Submissions go to a GitHub Discussion thread for that chapter.
```

---

### "Copy Page" Button
Every chapter page has a "Copy page" button in the chapter meta row (top, next to the title). Copies the full chapter as clean Markdown. Mirrors Netlify's "Copy Markdown / View as plain text" feature. Useful for engineers who want to paste a chapter into their own notes or an AI tool.

---

### Colour Palette

| Name | Hex | Used For |
|---|---|---|
| Electric Blue | `#3B82F6` | Sidebar active state, links, vectors, data flow, Builder badge |
| Neon Green | `#22C55E` | Success, retrieval, correct answers, Engineer badge |
| Amber | `#F59E0B` | Warnings, hallucinations, low confidence, Architect badge |
| Soft Red | `#EF4444` | Errors, failed retrieval |
| Slate | `#94A3B8` | Explorer badge, muted text, unearned badge icons |
| Background | `#0F1117` | Main dark background |
| Surface | `#1A1D27` | Cards, panels, sidebar background |
| Surface Hover | `#232637` | Card hover state |
| Border | `#2D3148` | Subtle dividers |
| Text Primary | `#F1F5F9` | Main body text |
| Text Muted | `#64748B` | Secondary text, captions, timestamps |

---

### Typography

| Element | Font | Size | Weight |
|---|---|---|---|
| Body text | Inter | 16px | 400 |
| Chapter title (H1) | Inter | 32px | 700 |
| Section heading (H2) | Inter | 22px | 600 |
| Sub-heading (H3) | Inter | 18px | 600 |
| Code / terminal | JetBrains Mono | 14px | 400 |
| Badge labels | Inter | 12px | 600 |
| Callout text | Inter | 15px | 400 |

---

### UX Micro-Decisions (All Borrowed From Netlify + Our Own)

**Scroll spy on "On This Page"** — the current section is always highlighted in the right sidebar as the user scrolls. User always knows where they are in a long chapter.

**Anchor links on every heading** — hover any `H2` or `H3` and a `#` link icon appears. Click to copy the deep link. Engineers love this for sharing specific sections.

**Breadcrumb navigation** — `Learn / Chapter 3 — Embeddings & Vectors` always visible at the top. One click back to the section index.

**Keyboard navigation** — `→` / `←` arrow keys navigate between chapters. `Cmd+K` opens the search palette. Tab through interactive elements without a mouse.

**Glossary tooltips** — every technical term is underlined with a subtle dotted line on first use. Hover to get a one-sentence definition inline. Never leave the page.

**Progress bar** — a thin Electric Blue line across the top of the main content area, filling as the user scrolls through a chapter. Gives a sense of progress within a long chapter.

**Chapter completion animation** — when a user reaches the bottom of a chapter, a small badge unlock animation plays if they've earned a badge. Simple, satisfying, not intrusive.

**Mobile** — left sidebar collapses to a hamburger. Right sidebar collapses into a dropdown "On this page" button at the top of content. All interactives are touch-friendly.

---

### What We Explicitly Avoid

- No walls of text. Max 3 paragraphs before a visual, callout, or code block.
- No formulas without a plain-English explanation first.
- No undefined acronyms — ever.
- No "as mentioned above" without a hyperlink back.
- No chapter without at least one interactive element.
- No external links that open without `target="_blank" rel="noopener noreferrer"`.
- No popups, no email gates, no "subscribe to continue" interruptions.
- No animations that play on load (only on user action).

---

## 8. Content Quality & Sourcing Policy

*This policy lives publicly in the GitHub repo as `CONTENT_POLICY.md`.*

### Source Tiers

**Tier 1 — Ground Truth (always preferred)**
- Original research papers: Lewis et al. (2020), RAGAS paper, HNSW paper, HyDE, Self-RAG, CRAG
- Official documentation: LangChain, LlamaIndex, ChromaDB, Qdrant, Weaviate, Hugging Face, Transformers.js
- MTEB Leaderboard for embedding model benchmarks

**Tier 2 — Verified Secondary**
- Jay Alammar's blog
- Eugene Yan's writing on RAG evaluation
- Pinecone Learning Center articles
- Hugging Face blog posts (written by model authors)

**Tier 3 — Never Use as Source**
- AI-generated blog posts or summaries
- Medium articles without cited primary sources
- Reddit, Hacker News (for concept definitions)

### Claim Tagging System
Every factual claim in source markdown is tagged:
```
Cosine similarity measures the angle between two vectors. [src: lewis2020, §3]
HNSW runs in approximately O(log n) time. [src: malkov2018hnsw]
```
A `references.json` file maps every short code to the full citation.

### Pre-Publish Checklist
- [ ] Every factual claim has a Tier 1 or Tier 2 source tag
- [ ] All numbers and benchmarks verified against the primary source directly
- [ ] Date-sensitive claims flagged in `content-review.md`
- [ ] One human who works with RAG in production has read the draft
- [ ] Every technical term is defined on first use
- [ ] The "explain it to a smart 16-year-old" test passes
- [ ] Sources section added to the bottom of the page

---

## 9. Technical Stack

### Platform (Vibe Code Freely)
| Component | Tool | Why |
|---|---|---|
| Site framework | Astro + Starlight | Zero-JS by default, Markdown-native, built-in docs layout |
| Hosting | Vercel Free Tier | $0, global CDN, instant deploys |
| Diagrams | Mermaid.js | In-Markdown, version-controlled |
| In-browser AI | Transformers.js | Embedding models run in browser — $0 server cost |
| Styling | Tailwind CSS | Fast, consistent, dark mode built-in |
| Analytics | Umami (self-hosted) | Privacy-first, $0 |
| Progress + Badges | localStorage | No auth needed, zero backend |
| Interactive components | React islands inside Astro | Isolated, loads only where needed |
| Search | Pagefind (Astro built-in) | Static full-text search, $0 |
| Badge card generation | `html2canvas` or OG image via Vercel Edge Function | Shareable PNG cards |

### Content (Human-Verified)
| Component | Approach |
|---|---|
| Chapter text | Written by human, AI-assisted drafting only |
| Diagrams | Mermaid.js source written by human, verified against source |
| Code snippets | Tested against documented library versions |
| Benchmark data | Pulled directly from MTEB and official docs |

### The Two-Track Rule
**The platform is vibe coded. The curriculum is not.**

---

## 10. Content Authoring Workflow

```
1. SOURCE → 2. EXTRACT → 3. DRAFT → 4. VERIFY → 5. REVIEW → 6. PUBLISH
```

1. **Source First** — Read the primary source before writing anything.
2. **Extract Claims** — Write 5–10 specific, verifiable facts as bullet points.
3. **AI-Assisted Draft** — Use AI to write prose around your anchors. Never let AI generate the facts.
4. **Verify Every Number** — Every percentage, benchmark, and date checked against the source. ~20 min per chapter.
5. **Expert Read** — One person who works with RAG in production reads it.
6. **Publish with Sources** — Sources section added. `references.json` updated. Date-sensitive claims flagged.

---

## 11. Community & Growth Strategy

### GitHub — Open Curriculum
- All chapter content in a public GitHub repo as Markdown
- `CONTRIBUTING.md` with clear steps for corrections
- Issue template pre-filled with chapter name
- **"Content Bounty"** — anyone who catches a factual error and submits a sourced PR gets credited as a contributor in the repo and on the site

### Discord
- Free server linked from every page
- Channels: `#general`, `#chapter-help`, `#show-your-project`, `#content-corrections`, `#lab-showcase`
- Weekly async office hours

### Newsletter
- Monthly, via Buttondown (free to 1000 subscribers)
- Format: 3 new RAG papers summarised in plain English + one community project showcase

### Badge Cards as Distribution
- Every earned badge generates a shareable PNG card
- Users share on LinkedIn/Twitter
- Card includes: badge icon, title, "I earned this on LearnRAG", date
- This is a zero-cost, high-intent distribution channel

### Content Distribution
- Each chapter diagram available as standalone shareable PNG
- Playground is iframe-embeddable (drives backlinks from other blogs)
- Post chapter summaries as threads on X/LinkedIn with diagram images

---

## 12. SEO & Discoverability

| Chapter | Target Search Query |
|---|---|
| Ch 1 | "what is rag in ai explained simply" |
| Ch 2 | "how does chunking work in rag" |
| Ch 3 | "what is an embedding vector explained" |
| Ch 4 | "best free vector database for rag" |
| Ch 5 | "hybrid search vs semantic search rag" |
| Ch 6 | "how to write a rag prompt template" |
| Ch 7 | "how to evaluate a rag pipeline ragas" |
| Ch 8 | "advanced rag patterns production" |

**Technical SEO:**
- Unique `<title>` and `<meta description>` per page matching the target query
- Mermaid.js diagrams also exported as PNG with descriptive `alt` text
- Schema markup: `Course`, `Article`
- Sitemap auto-generated by Astro
- Page load target: < 1.5 seconds

**The "Worth Linking To" Assets (no promotion needed):**
1. The interactive Playground (embeddable)
2. The "Pick Your Vector Database" decision tool
3. The embedding model comparison table
4. The RAGAS score calculator

---

## 13. Monetisation Path

The platform stays free forever. This is the sustainability plan.

**Phase 1 — $0 (Launch):** Everything free, no monetisation.

**Phase 2 — Sponsorships (~1k MAU):** Vector DB companies (Qdrant, Weaviate, Pinecone) sponsor developer education content. A tasteful "Sponsored by" in the Library only — never in the curriculum.

**Phase 3 — Pro Tier (Never Paywalls Learning):**
- Saved Playground sessions
- Team progress tracking
- Verifiable "Architect Badge" certificate (PDF, LinkedIn-shareable)
- Cohort-based workshops

**Phase 4 — Consulting Funnel:** "I help teams implement RAG in production" CTA on the Architect badge completion page.

---

## 14. Success Metrics

| Metric | Definition | Target (3 months post-launch) |
|---|---|---|
| Chapter Completion Rate | % of users who reach the end of a chapter they started | > 60% |
| Badge Progression | % of Explorer badge holders who progress to Builder | > 40% |
| Architect Badge Earners | Users who complete all 8 chapters + 3 labs | 50+ users |
| Badge Cards Shared | Shareable badge cards posted to social media | Track, celebrate |
| Playground Queries | Unique queries run per week | 200+ |
| GitHub Stars | Stars on the open curriculum repo | 200+ |
| Return Visits | % of users who come back within 7 days | > 30% |

---

## 15. Build Phases & Milestones

### Phase 0 — Foundation (Week 1–2)
- [ ] Read the original RAG paper (abstract + intro + conclusion)
- [ ] Create `CONTENT_POLICY.md` and commit to the repo
- [ ] Set up `references.json` and citation system
- [ ] Define badge system — exactly what actions earn each badge
- [ ] Write chapter outlines (5-bullet summary, not full chapters)
- [ ] Get one RAG practitioner to agree to be a content reviewer
- [ ] Set up Astro + Starlight with the three-column layout scaffolded

### Phase 1 — MVP (Week 3–6)
- [ ] Chapter 1 — written, verified, Hallucination Toggle interactive live
- [ ] Chapter 2 — written, verified, Live Text Splitter live
- [ ] Chapter 3 — written, verified, Nearest Neighbour Explorer live
- [ ] Playground — Ingestion Panel + Retrieval Panel working end-to-end
- [ ] Badge system with localStorage tracking
- [ ] Explorer + Builder badges earnable
- [ ] Netlify-inspired three-column layout applied to all chapter pages
- [ ] All callout box variants implemented (Tip, Watch Out, Important, Plain English)
- [ ] GitHub repo public with `CONTRIBUTING.md`

### Phase 2 — Core Complete (Week 7–12)
- [ ] Chapters 4–7 written and verified
- [ ] Playground — Embedding + Generation Panels complete
- [ ] Playground failure mode features live
- [ ] Labs 1–3 published
- [ ] Library: Model Leaderboard + Database Decision Tool
- [ ] Engineer badge earnable
- [ ] Badge card PNG generator live (shareable)
- [ ] Discord server launched
- [ ] Feedback widget live on all chapter pages
- [ ] "Copy page" button live
- [ ] Cmd+K search palette live

### Phase 3 — Full Platform (Week 13–20)
- [ ] Chapter 8 written and verified
- [ ] Labs 4–5 published
- [ ] Full Library section live
- [ ] Architect badge earnable
- [ ] Newsletter launched
- [ ] SEO meta + schema markup on all pages
- [ ] Playground embeddable via iframe
- [ ] Community content bounty program announced

### Phase 4 — Iterate & Grow (Ongoing)
- [ ] Monthly content review — update date-sensitive claims
- [ ] Respond to every GitHub issue within 1 week
- [ ] One new Lab per month based on community requests
- [ ] Rewrite any chapter with < 50% completion rate

---

## Appendix A — Scope Guard (What We Do NOT Build)

- User accounts or authentication
- A hosted RAG pipeline backend
- Mobile apps
- Video content
- Forum or Q&A system (Discord covers this)
- Paid certificates at launch

---

## Appendix B — The Plain English Test

> Read the explanation out loud. If you sound like you're reading a research paper, rewrite it. If your 17-year-old sibling would understand it after one read, it ships.

Every analogy: real life. Every technical term: defined on first use. Every diagram: plain-English caption. Every chapter: ends with the user knowing exactly what they just built.

---

## Appendix C — Changelog

| Version | Date | Change |
|---|---|---|
| v1.0 | Initial | Full production PRD |
| v2.0 | Update | Belt system → Badge system. Netlify-inspired design system documented in full. Badge sharing mechanics added. Three-column layout specified. Callout box system defined. |

---

*This document is version-controlled. All changes logged with date and reason.*