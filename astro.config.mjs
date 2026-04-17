// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';
import rehypeExternalLinks from 'rehype-external-links';

export default defineConfig({
  site: 'https://learnrag.online',
  integrations: [
    starlight({
      title: 'LearnRAG',
      customCss: ['./src/styles/global.css'],
      components: {
        Head: './src/components/StarLightHead.astro',
      },
      head: [
        { tag: 'meta', attrs: { property: 'og:image', content: 'https://learnrag.online/Thumbnail.png' } },
        { tag: 'meta', attrs: { property: 'og:image:width', content: '1200' } },
        { tag: 'meta', attrs: { property: 'og:image:height', content: '630' } },
        { tag: 'meta', attrs: { name: 'twitter:image', content: 'https://learnrag.online/Thumbnail.png' } },
        { tag: 'script', attrs: { type: 'application/ld+json' }, content: JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'Course',
          name: 'LearnRAG — Retrieval-Augmented Generation',
          description: 'Learn to build RAG systems from zero to production. 8 chapters, interactive playground, hands-on labs. Free forever.',
          url: 'https://learnrag.online',
          provider: { '@type': 'Organization', name: 'LearnRAG', url: 'https://learnrag.online' },
          educationalLevel: 'Beginner to Advanced',
          isAccessibleForFree: true,
          inLanguage: 'en',
          hasCourseInstance: { '@type': 'CourseInstance', courseMode: 'online', courseWorkload: 'PT2H30M' },
        }) },
      ],
      sidebar: [
        {
          label: 'The Academy',
          items: [
            { label: '1. Why RAG Exists', slug: 'learn/1-why-rag' },
            { label: '2. Data Ingestion & Chunking', slug: 'learn/2-chunking' },
            { label: '3. Embeddings & Vector Space', slug: 'learn/3-embeddings' },
            { label: '4. Vector Databases', slug: 'learn/4-vector-databases' },
            { label: '5. Retrieval Strategies', slug: 'learn/5-retrieval' },
            { label: '6. The Prompt Layer', slug: 'learn/6-prompting' },
            { label: '7. Evaluation', slug: 'learn/7-evaluation' },
            { label: '8. Advanced Patterns', slug: 'learn/8-advanced-patterns' },
          ],
        },
        {
          label: 'Labs',
          items: [
            { label: 'Lab 1: LangChain + ChromaDB', slug: 'labs/1-langchain-chromadb' },
            { label: 'Lab 2: LlamaIndex Comparison', slug: 'labs/2-llamaindex-comparison' },
            { label: 'Lab 3: Add a Re-ranker', slug: 'labs/3-add-a-reranker' },
            { label: 'Lab 4: Evaluate with RAGAS', slug: 'labs/4-evaluate-with-ragas' },
            { label: 'Lab 5: Deploy to HF Spaces', slug: 'labs/5-deploy-to-huggingface' },
          ],
        },
        {
          label: 'Library',
          items: [
            { label: 'Model Leaderboard', slug: 'library/model-leaderboard' },
            { label: 'Database Picker', slug: 'library/database-picker' },
          ],
        },
      ],
    }),
    react(),
  ],
  markdown: {
    rehypePlugins: [
      [rehypeExternalLinks, { target: '_blank', rel: ['noopener', 'noreferrer'] }],
    ],
  },
  vite: {
    plugins: [tailwindcss()],
    optimizeDeps: {
      exclude: ['@huggingface/transformers'],
    },
    ssr: {
      noExternal: ['@fontsource/inter', '@fontsource/jetbrains-mono'],
    },
  },
});
