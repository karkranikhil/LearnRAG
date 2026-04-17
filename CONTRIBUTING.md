# Contributing to LearnRAG

Thank you for helping make RAG education better for everyone.

## Reporting Errors

Found a factual mistake? Please [open an issue](../../issues/new) with:

1. **Chapter name** — which chapter contains the error
2. **The incorrect claim** — quote the exact sentence
3. **The correction** — what it should say instead
4. **Source** — a Tier 1 or Tier 2 source (see `CONTENT_POLICY.md`) backing the correction

## Submitting Corrections (Content Bounty)

Anyone who catches a factual error and submits a corrected, sourced PR gets credited as a contributor in the repo and on the site.

### Steps:
1. Fork the repo
2. Find the chapter file in `src/content/docs/learn/`
3. Fix the claim and add/update the source tag: `[src: your_source_key]`
4. Add the full citation to `references.json` if it's a new source
5. Open a PR with the title: `fix(content): [chapter name] — brief description`

## Code Contributions

For UI bugs, interactive component improvements, or new features:

1. Open an issue first describing what you want to change
2. Fork and create a feature branch
3. Run `npm run dev` to test locally
4. Submit a PR

## Content Standards

All contributions must follow `CONTENT_POLICY.md`:
- Every factual claim needs a Tier 1 or Tier 2 source
- Plain English — no jargon without definition
- Define every technical term on first use
