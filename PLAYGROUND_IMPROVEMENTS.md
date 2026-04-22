# Playground UX Improvements

## Priority 1: Persistent Contextual Help

### Add Inline Tooltips
Every technical term needs a tooltip on first appearance:
- DLO → "Data Lake Object - raw source data container"
- DMO → "Data Model Object - semantically mapped fields"  
- Cosine similarity → "Measures how similar two vectors are (0=unrelated, 1=identical)"

**Implementation:**
```tsx
<Tooltip content="Raw source data container">
  <span className="dotted-underline">DLO</span>
</Tooltip>
```

### Add Step-Level Help Cards
Each step needs a persistent help card (not dismissible) that shows:
1. **What this step does** (1 sentence, plain English)
2. **Why it matters** (the problem it solves)
3. **What to look for** (success criteria)
4. **Common mistakes** (what NOT to do)

Example for Embedding step:
```
💡 WHAT: Convert chunks into vectors (lists of numbers)
🎯 WHY: Computers can't search by "meaning" — vectors let us do math on meaning
✓ LOOK FOR: Each chunk should have ~384 numbers. Similar chunks = similar numbers.
⚠️ WATCH OUT: Don't change embedding models mid-pipeline — it breaks everything!
```

---

## Priority 2: Guided First-Run Experience

### Add a "First Time Here?" Modal
On first visit, show a 3-step interactive tutorial:

**Step 1:** "Here's what you'll build"
- Show the end result first (a working answer with sources)
- "In 5 steps, you'll turn a document into a searchable knowledge base"

**Step 2:** "Your first query"
- Pre-load a sample document (don't make them choose)
- Pre-fill a query: "What is HNSW indexing?"
- Auto-run through all steps
- Highlight what changed at each step

**Step 3:** "Now try your own"
- Reset to Step 1
- "Pick a different document and ask your own question"

**Implementation:**
- Store `hasCompletedTutorial` in localStorage
- Add "Replay Tutorial" button in header
- Tutorial should be **opt-out**, not opt-in

---

## Priority 3: Better Empty States

Current empty states just say "Load data first" — this is too generic.

### Improved Empty State Pattern:
```tsx
// Bad (current)
<div>Load Data Stream first.</div>

// Good (improved)
<div className="empty-state">
  <div className="icon">📄</div>
  <h3>No document loaded yet</h3>
  <p>Go back to <strong>Step 1: Data Stream</strong> and pick a sample card to continue.</p>
  <button onClick={() => setCurrentStep('stream')}>← Back to Step 1</button>
</div>
```

Add specific guidance:
- Step 2 (DLO): "You need to load a document in Step 1 first. Click the ← button above."
- Step 3 (DMO): "You need to populate DLO first. Go back to Step 1."
- Step 4 (Chunk): "Create chunks by clicking 'Split into Chunks' in the left panel."

---

## Priority 4: Reduce Cognitive Load

### Simplify Salesforce Playground
**Problem:** 7 steps with Salesforce-specific jargon is overwhelming.

**Solutions:**

1. **Add a "Skip to RAG" button** at the top
   - Collapses DLO/DMO steps into "Data Ingestion"
   - Shows 4 steps instead of 7: Ingest → Chunk → Embed → Retrieve

2. **Add a complexity toggle**
   ```
   [🎓 Learning Mode] [⚙️ Full Pipeline Mode]
   ```
   - Learning Mode: Hide DLO/DMO details, show simple explanations
   - Full Pipeline Mode: Show everything (current behavior)

3. **Move DLO/DMO field tables to expandable sections**
   - Default: collapsed with summary "✓ 15 fields populated"
   - Expandable: "Show field mapping details"

### Simplify Generic Playground
**Problem:** Embedding step has 4 dense sections — too much to absorb.

**Solution: Progressive Disclosure**
Show sections one at a time:
1. First render: "What does a vector look like?" (Section A)
2. After they inspect a chunk: reveal "How is similarity measured?" (Section B)  
3. After they compare two chunks: reveal "Similarity Matrix" (Section C)
4. After they click a matrix cell: reveal "2D Map" (Section D)

---

## Priority 5: Add Success Feedback

### Visual Celebration Moments
When users complete a step successfully, show immediate positive feedback:

```tsx
// After successful embedding
<div className="success-toast">
  ✓ All chunks embedded! You can now search by meaning, not just keywords.
  <button>→ Try Searching</button>
</div>

// After successful search
<div className="success-toast">
  ✓ Found {results.length} relevant chunks! Notice how #1 has the highest score.
  <button>→ Generate Answer</button>
</div>
```

### Progress Indicator Enhancement
The current "Pipeline Progress" sidebar is good but passive.

Add **micro-animations** when a step completes:
- Checkmark bounces in
- Progress bar fills with a satisfying "whoosh"
- Operation label turns green with glow effect

---

## Priority 6: Better Onboarding for Each Step

### Add "Try This" Suggestions
Each step should have 2-3 suggested actions:

**Chunking Step:**
```
🔍 TRY THIS:
1. Set chunk size to 100 and overlap to 0 → notice how chunks are tiny
2. Set chunk size to 1000 → notice how chunks lose focus  
3. Set to 300 / 50 → the sweet spot for most documents
```

**Embedding Step:**
```
🔍 TRY THIS:
1. Click C1 and C2 pills → see how their vector shapes differ
2. Compare two chunks on the same topic → score should be >0.7
3. Compare chunks on different topics → score drops below 0.4
4. Click any cell in the matrix → loads that pair for comparison
```

**Search Step:**
```
🔍 TRY THIS:
1. Query: "what is vector search" → see semantic matching in action  
2. Toggle to Hybrid search → notice how scores change
3. Adjust Top K to 1 → see only the best match
```

---

## Priority 7: Add Comparison/Demo Mode

### "Bad vs Good" Demos
Add a toggle to show intentionally broken examples:

**Chunking:**
- ❌ Bad: chunk_size=50, overlap=0 → "Chunks too small — loses context"
- ✅ Good: chunk_size=300, overlap=50 → "Goldilocks zone"

**Embedding:**
- ❌ Bad: Embed with Model A, search with Model B → "Scores collapse to noise!"
- ✅ Good: Use same model → "Scores are meaningful"

This teaches through contrast.

---

## Priority 8: Simplify Terminology

### Replace Jargon with Metaphors (First Mention)

Current Salesforce playground says:
> "Raw source metadata is populated into DLO fields..."

Improved with metaphor:
> "**DLO (Data Lake Object)** — think of this as the 'raw ingredients' stage. Your document arrives here first, with all its metadata (file type, size, URL) tagged like shipping labels. Nothing is analyzed yet — just unpacked and labeled."

Then subsequent mentions can use the short form "DLO."

### Create a Glossary Tooltip Panel
Add a "?" button in the header that opens a glossary sidebar:
- Searchable
- Categorized (Data Models, Vector Concepts, Search Strategies)
- Each term has: Plain English definition + visual + example

---

## Implementation Priority Order:

1. **Week 1:** Persistent help cards at each step (Priority 1)
2. **Week 1:** Better empty states with navigation (Priority 3)  
3. **Week 2:** First-run guided tutorial (Priority 2)
4. **Week 2:** "Try This" suggestions per step (Priority 6)
5. **Week 3:** Complexity toggle for Salesforce playground (Priority 4)
6. **Week 3:** Progressive disclosure for embedding section (Priority 4)
7. **Week 4:** Success feedback animations (Priority 5)
8. **Week 4:** Bad vs Good demo mode (Priority 7)

---

## Quick Wins (Can Do Today):

1. **Add "Tips" button that reopens the guide** (already implemented via `guideReopenSignal` ✓)
2. **Add placeholder text to query input** with a real example:
   ```
   placeholder="Try: 'How does vector indexing work?' or 'What is retrieval?'"
   ```
3. **Add progress percentage to step nav:**
   ```
   Step 3 of 5 · 60% complete
   ```
4. **Add "Stuck?" help text** to nav bar when user stays on same step for >60s:
   ```
   Been here a while? Click "Tips" in the header or try one of the sample documents.
   ```

---

## Metrics to Track:

Once you implement these changes, measure:
- **Completion rate** — % of users who reach Generate step
- **Drop-off points** — which step do most users abandon?
- **Time per step** — are they spending 10min on Embedding because they're confused?
- **Tutorial completion** — do users finish the guided first-run?
- **Guide reopens** — how often do users click "Tips"?

---

## The Core Problem:

Your playground is **feature-complete but not learning-complete.** It shows the mechanics perfectly but doesn't teach the **mental model** users need to understand what's happening and why.

**Solution:** Add **persistent scaffolding** (help cards, tooltips, suggestions) that users can ignore once they understand, but which is always there when they need it.

The guide banner is a start, but it's too easy to dismiss and forget. Users need **contextual, just-in-time help** at every step, not a 3-step summary at the top.
