import { useState } from 'react';

interface Question {
  id: string;
  text: string;
  options: { label: string; value: string }[];
}

const questions: Question[] = [
  {
    id: 'purpose',
    text: 'What is this project for?',
    options: [
      { label: 'Learning / prototyping', value: 'learning' },
      { label: 'Production application', value: 'production' },
    ],
  },
  {
    id: 'hosting',
    text: 'Do you need cloud hosting?',
    options: [
      { label: 'No — local only is fine', value: 'local' },
      { label: 'Yes — I need a hosted service', value: 'cloud' },
    ],
  },
  {
    id: 'hybrid',
    text: 'Do you need hybrid search (keyword + semantic)?',
    options: [
      { label: 'No — semantic search only', value: 'no' },
      { label: 'Yes — I need both', value: 'yes' },
    ],
  },
  {
    id: 'scale',
    text: 'How many documents?',
    options: [
      { label: 'Under 10,000', value: 'small' },
      { label: '10,000 – 1 million', value: 'medium' },
      { label: 'Over 1 million', value: 'large' },
    ],
  },
];

interface Recommendation {
  name: string;
  tagline: string;
  color: string;
  pros: string[];
  cons: string[];
  link: string;
}

function getRecommendation(answers: Record<string, string>): Recommendation {
  const { purpose, hosting, hybrid, scale } = answers;

  if (purpose === 'learning') {
    return {
      name: 'ChromaDB',
      tagline: 'The easiest way to get started',
      color: '#F59E0B',
      pros: ['Runs locally with pip install', 'Zero configuration', 'Great Python API', 'Perfect for learning and prototyping'],
      cons: ['Not designed for massive scale', 'Limited production features'],
      link: 'https://docs.trychroma.com/',
    };
  }

  if (hosting === 'cloud' && hybrid === 'yes') {
    return {
      name: 'Qdrant',
      tagline: 'Production-grade with hybrid search',
      color: '#EF4444',
      pros: ['Generous free cloud tier (1GB)', 'Built-in hybrid search', 'Excellent filtering', 'Production-ready with high availability'],
      cons: ['Slightly steeper learning curve', 'Self-hosting requires more setup'],
      link: 'https://qdrant.tech/documentation/',
    };
  }

  if (hosting === 'cloud') {
    return {
      name: 'Weaviate',
      tagline: 'Strong cloud ecosystem',
      color: '#22C55E',
      pros: ['Free cloud sandbox tier', 'Built-in vectorisation modules', 'GraphQL API', 'Good for multi-modal data'],
      cons: ['Can be complex to configure', 'Heavier than alternatives'],
      link: 'https://weaviate.io/developers/weaviate',
    };
  }

  if (scale === 'large' && hosting === 'local') {
    return {
      name: 'FAISS',
      tagline: 'Maximum speed for local vector search',
      color: '#a855f7',
      pros: ["Facebook's battle-tested library", 'Fastest pure-local option', 'No server needed', 'Handles billions of vectors'],
      cons: ['Library, not a database — no built-in persistence', 'No built-in filtering or hybrid search', 'Requires more code to use'],
      link: 'https://faiss.ai/',
    };
  }

  if (hybrid === 'yes') {
    return {
      name: 'Qdrant',
      tagline: 'Best hybrid search support',
      color: '#EF4444',
      pros: ['Built-in sparse + dense vector support', 'Runs locally or in cloud', 'Excellent filtering and payload support', 'Active development'],
      cons: ['Requires running a server process', 'More setup than ChromaDB'],
      link: 'https://qdrant.tech/documentation/',
    };
  }

  return {
    name: 'ChromaDB',
    tagline: 'Simple, local, and effective',
    color: '#F59E0B',
    pros: ['Minimal setup', 'Good for small-to-medium datasets', 'Persistent storage built-in', 'Active community'],
    cons: ['Limited hybrid search', 'Not ideal for very large scale'],
    link: 'https://docs.trychroma.com/',
  };
}

export default function DatabasePicker() {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [showResult, setShowResult] = useState(false);

  const handleAnswer = (questionId: string, value: string) => {
    const newAnswers = { ...answers, [questionId]: value };
    setAnswers(newAnswers);
    if (step < questions.length - 1) {
      setStep(step + 1);
    } else {
      setShowResult(true);
    }
  };

  const handleReset = () => {
    setStep(0);
    setAnswers({});
    setShowResult(false);
  };

  const result = showResult ? getRecommendation(answers) : null;

  return (
    <div style={{
      background: 'var(--sl-color-bg-nav)',
      border: '1px solid var(--sl-color-hairline)',
      borderRadius: '0.75rem',
      padding: '1.5rem',
      margin: '1.5rem 0',
    }}>
      <h3 style={{ margin: '0 0 1rem', fontSize: '1rem' }}>Pick Your Database</h3>

      {!showResult ? (
        <div>
          {/* Progress */}
          <div style={{ display: 'flex', gap: '0.25rem', marginBottom: '1.25rem' }}>
            {questions.map((_, i) => (
              <div key={i} style={{
                flex: 1, height: '3px', borderRadius: '2px',
                background: i <= step ? '#a855f7' : 'var(--sl-color-hairline)',
                transition: 'background 0.2s',
              }} />
            ))}
          </div>

          <p style={{ fontSize: '0.9375rem', fontWeight: 500, marginBottom: '0.75rem' }}>
            {questions[step].text}
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {questions[step].options.map(opt => (
              <button
                key={opt.value}
                onClick={() => handleAnswer(questions[step].id, opt.value)}
                style={{
                  padding: '0.625rem 1rem',
                  background: 'var(--sl-color-bg)',
                  border: '1px solid var(--sl-color-hairline)',
                  borderRadius: '0.375rem',
                  color: 'var(--sl-color-text)',
                  fontSize: '0.875rem',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'border-color 0.15s',
                }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = '#a855f7')}
                onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--sl-color-hairline)')}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      ) : result && (
        <div>
          <div style={{
            padding: '1.25rem',
            background: `${result.color}11`,
            border: `1px solid ${result.color}44`,
            borderRadius: '0.5rem',
            marginBottom: '1rem',
          }}>
            <div style={{ fontSize: '1.25rem', fontWeight: 700, color: result.color, marginBottom: '0.25rem' }}>
              {result.name}
            </div>
            <div style={{ fontSize: '0.875rem', opacity: 0.8, marginBottom: '0.75rem' }}>
              {result.tagline}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', fontSize: '0.8125rem' }}>
              <div>
                <div style={{ fontWeight: 600, color: '#22C55E', marginBottom: '0.375rem' }}>Pros</div>
                {result.pros.map((p, i) => (
                  <div key={i} style={{ marginBottom: '0.25rem' }}>+ {p}</div>
                ))}
              </div>
              <div>
                <div style={{ fontWeight: 600, color: '#F59E0B', marginBottom: '0.375rem' }}>Cons</div>
                {result.cons.map((c, i) => (
                  <div key={i} style={{ marginBottom: '0.25rem' }}>- {c}</div>
                ))}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <a
              href={result.link}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                padding: '0.5rem 1.25rem',
                background: result.color,
                color: '#fff',
                textDecoration: 'none',
                borderRadius: '0.375rem',
                fontWeight: 600,
                fontSize: '0.875rem',
              }}
            >
              Get Started with {result.name}
            </a>
            <button
              onClick={handleReset}
              style={{
                padding: '0.5rem 1.25rem',
                background: 'transparent',
                color: 'var(--sl-color-text)',
                border: '1px solid var(--sl-color-hairline)',
                borderRadius: '0.375rem',
                cursor: 'pointer',
                fontSize: '0.875rem',
              }}
            >
              Start Over
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
