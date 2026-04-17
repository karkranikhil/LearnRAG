import { useState } from 'react';
import { markChapterComplete } from '../../lib/progress';

interface Question {
  question: string;
  options: string[];
  correct: number;
  explanation: string;
}

interface Props {
  chapterId: string;
  questions: Question[];
}

export default function QuickCheck({ chapterId, questions }: Props) {
  const [answers, setAnswers] = useState<(number | null)[]>(questions.map(() => null));
  const [submitted, setSubmitted] = useState(false);

  const allCorrect = submitted && answers.every((a, i) => a === questions[i].correct);

  const handleSelect = (qIdx: number, optIdx: number) => {
    if (submitted) return;
    setAnswers(prev => { const next = [...prev]; next[qIdx] = optIdx; return next; });
  };

  const handleSubmit = () => {
    if (answers.some(a => a === null)) return;
    setSubmitted(true);
    if (answers.every((a, i) => a === questions[i].correct)) {
      markChapterComplete(chapterId);
    }
  };

  const handleRetry = () => { setAnswers(questions.map(() => null)); setSubmitted(false); };

  return (
    <div style={{
      background: 'rgba(30,26,41,0.5)',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: '1rem',
      padding: '1.5rem',
      margin: '1.5rem 0',
      backdropFilter: 'blur(8px)',
    }}>
      {questions.map((q, qIdx) => (
        <div key={qIdx} style={{
          marginBottom: qIdx < questions.length - 1 ? '0' : '0',
        }}>
          {/* Question header with number */}
          <div style={{
            display: 'flex',
            alignItems: 'baseline',
            gap: '0.75rem',
            marginBottom: '0.75rem',
            paddingTop: qIdx > 0 ? '1.25rem' : 0,
            borderTop: qIdx > 0 ? '1px solid rgba(255,255,255,0.06)' : 'none',
            marginTop: qIdx > 0 ? '1.25rem' : 0,
          }}>
            <span style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '0.6875rem',
              fontWeight: 700,
              color: '#a855f7',
              letterSpacing: '0.05em',
              flexShrink: 0,
            }}>
              Q{qIdx + 1}
            </span>
            <p style={{
              fontWeight: 600,
              margin: 0,
              color: '#f0f0f0',
              fontSize: '0.9375rem',
              lineHeight: 1.5,
            }}>
              {q.question}
            </p>
          </div>

          {/* Options */}
          <div role="radiogroup" style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem', paddingLeft: '2rem' }}>
            {q.options.map((opt, optIdx) => {
              const selected = answers[qIdx] === optIdx;
              const isCorrect = optIdx === q.correct;
              let bg = 'transparent';
              let border = 'rgba(255,255,255,0.06)';
              let indicator = 'rgba(255,255,255,0.15)';
              let indicatorInner = 'transparent';

              if (submitted) {
                if (selected && isCorrect) {
                  bg = 'rgba(74,222,128,0.08)';
                  border = 'rgba(74,222,128,0.3)';
                  indicator = '#4ade80';
                  indicatorInner = '#4ade80';
                } else if (selected && !isCorrect) {
                  bg = 'rgba(248,113,113,0.08)';
                  border = 'rgba(248,113,113,0.3)';
                  indicator = '#f87171';
                  indicatorInner = '#f87171';
                } else if (isCorrect) {
                  bg = 'rgba(74,222,128,0.04)';
                  border = 'rgba(74,222,128,0.15)';
                  indicator = 'rgba(74,222,128,0.4)';
                }
              } else if (selected) {
                bg = 'rgba(168,85,247,0.08)';
                border = 'rgba(168,85,247,0.3)';
                indicator = '#a855f7';
                indicatorInner = '#a855f7';
              }

              return (
                <button
                  key={optIdx}
                  role="radio"
                  aria-checked={selected}
                  onClick={() => handleSelect(qIdx, optIdx)}
                  style={{
                    padding: '0.625rem 0.875rem',
                    background: bg,
                    border: `1px solid ${border}`,
                    borderRadius: '0.5rem',
                    cursor: submitted ? 'default' : 'pointer',
                    textAlign: 'left',
                    color: '#e0e0e0',
                    fontSize: '0.8125rem',
                    transition: 'all 0.15s',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.625rem',
                  }}
                >
                  {/* Radio indicator */}
                  <span style={{
                    width: '16px',
                    height: '16px',
                    borderRadius: '50%',
                    border: `2px solid ${indicator}`,
                    flexShrink: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.15s',
                  }}>
                    <span style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      background: indicatorInner,
                      transition: 'all 0.15s',
                    }} />
                  </span>
                  {opt}
                </button>
              );
            })}
          </div>

          {/* Explanation on wrong answer */}
          {submitted && answers[qIdx] !== questions[qIdx].correct && (
            <p style={{
              fontSize: '0.8125rem',
              color: '#fbbf24',
              marginTop: '0.5rem',
              paddingLeft: '2rem',
              lineHeight: 1.5,
            }}>
              {q.explanation}
            </p>
          )}
        </div>
      ))}

      {/* Action row */}
      <div style={{
        display: 'flex',
        gap: '0.75rem',
        marginTop: '1.25rem',
        paddingTop: '1.25rem',
        borderTop: '1px solid rgba(255,255,255,0.06)',
      }}>
        {!submitted ? (
          <button onClick={handleSubmit} disabled={answers.some(a => a === null)} style={{
            padding: '0.625rem 1.5rem',
            background: answers.some(a => a === null) ? 'rgba(168,85,247,0.2)' : '#a855f7',
            color: answers.some(a => a === null) ? 'rgba(240,240,240,0.5)' : '#f0f0f0',
            border: 'none', borderRadius: '0.5rem',
            cursor: answers.some(a => a === null) ? 'not-allowed' : 'pointer', fontWeight: 600,
            boxShadow: answers.some(a => a === null) ? 'none' : '0 0 30px rgba(168,85,247,0.15)',
            transition: 'all 0.15s',
            fontSize: '0.875rem',
          }}>
            Check Answers
          </button>
        ) : allCorrect ? (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            color: '#4ade80',
            fontWeight: 600,
            fontSize: '0.875rem',
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
            All correct — chapter complete.
          </div>
        ) : (
          <button onClick={handleRetry} style={{
            padding: '0.625rem 1.5rem', background: 'rgba(251,191,36,0.1)',
            color: '#fbbf24', border: '1px solid rgba(251,191,36,0.2)', borderRadius: '0.5rem',
            cursor: 'pointer', fontWeight: 600, transition: 'all 0.15s', fontSize: '0.875rem',
          }}>
            Try Again
          </button>
        )}
      </div>
    </div>
  );
}
