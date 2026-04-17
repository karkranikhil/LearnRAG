import { useState } from 'react';
import { FeedbackIcons } from './icons';

interface Props {
  chapterId: string;
}

export default function FeedbackWidget({ chapterId: _chapterId }: Props) {
  const [feedback, setFeedback] = useState<'positive' | 'negative' | null>(null);
  const [comment, setComment] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = () => {
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div style={{
        margin: '2rem 0', padding: '1rem 1.25rem',
        background: 'rgba(74,222,128,0.05)', border: '1px solid rgba(74,222,128,0.2)',
        borderRadius: '0.75rem', textAlign: 'center', fontSize: '0.875rem', color: '#4ade80',
      }}>
        Thank you for your feedback.
      </div>
    );
  }

  const ThumbUp = FeedbackIcons.positive;
  const ThumbDown = FeedbackIcons.negative;

  return (
    <div style={{
      margin: '2rem 0', padding: '1.25rem',
      background: 'rgba(30,26,41,0.5)', border: '1px solid rgba(255,255,255,0.06)',
      borderRadius: '0.75rem', backdropFilter: 'blur(4px)',
    }}>
      <p style={{ margin: '0 0 0.75rem', fontSize: '0.9375rem', fontWeight: 500, color: '#f0f0f0' }}>
        Was this chapter helpful?
      </p>
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: feedback === 'negative' ? '0.75rem' : 0 }}>
        <button onClick={() => { setFeedback('positive'); handleSubmit(); }} style={{
          padding: '0.5rem 1rem', background: 'transparent',
          border: '1px solid rgba(255,255,255,0.08)', borderRadius: '0.5rem',
          color: '#f0f0f0', cursor: 'pointer', fontSize: '0.875rem',
          display: 'flex', alignItems: 'center', gap: '0.375rem', transition: 'all 0.15s',
        }}>
          <ThumbUp size={14} strokeWidth={2} /> Yes
        </button>
        <button onClick={() => setFeedback('negative')} style={{
          padding: '0.5rem 1rem',
          background: feedback === 'negative' ? 'rgba(248,113,113,0.05)' : 'transparent',
          border: `1px solid ${feedback === 'negative' ? 'rgba(248,113,113,0.2)' : 'rgba(255,255,255,0.08)'}`,
          borderRadius: '0.5rem', color: '#f0f0f0', cursor: 'pointer', fontSize: '0.875rem',
          display: 'flex', alignItems: 'center', gap: '0.375rem', transition: 'all 0.15s',
        }}>
          <ThumbDown size={14} strokeWidth={2} /> Needs work
        </button>
      </div>
      {feedback === 'negative' && (
        <div>
          <textarea value={comment} onChange={e => setComment(e.target.value)} placeholder="What would make this clearer?" rows={3} style={{
            width: '100%', padding: '0.625rem', background: 'rgba(22,19,30,0.6)',
            border: '1px solid rgba(255,255,255,0.08)', borderRadius: '0.5rem', color: '#f0f0f0',
            fontSize: '0.8125rem', resize: 'vertical', marginBottom: '0.5rem',
          }} />
          <button onClick={handleSubmit} disabled={!comment.trim()} style={{
            padding: '0.375rem 1rem',
            background: comment.trim() ? '#a855f7' : 'rgba(168,85,247,0.3)',
            color: '#f0f0f0', border: 'none', borderRadius: '0.5rem',
            cursor: comment.trim() ? 'pointer' : 'not-allowed', fontSize: '0.8125rem', fontWeight: 600,
          }}>
            Submit
          </button>
        </div>
      )}
    </div>
  );
}
