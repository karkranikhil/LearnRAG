import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, ChevronRight, ChevronLeft } from 'lucide-react';

interface TourStep {
  id: string;
  title: string;
  description: string;
  target?: string; // CSS selector for element to highlight
  position?: 'top' | 'bottom' | 'left' | 'right' | 'center';
}

const TOUR_STEPS: TourStep[] = [
  {
    id: 'welcome',
    title: '👋 Welcome to the RAG Playground!',
    description: "Let us take a quick 30-second tour. This interactive playground shows you how a RAG pipeline works — from source data to final answer — using Data Cloud terminology.",
    position: 'center',
  },
  {
    id: 'documents',
    title: 'Pick a sample document',
    description: 'Start here. Click any card below to load a document and trigger the pipeline. Each one demonstrates a different Data Cloud use case.',
    target: '[data-tour="document-cards"]',
    position: 'top',
  },
  {
    id: 'operations',
    title: 'Track your progress',
    description: 'Watch each operation light up as your data flows through the pipeline — from raw ingestion to indexed vectors.',
    target: '[data-tour="operations-panel"]',
    position: 'left',
  },
  {
    id: 'steps',
    title: '7 stages, end to end',
    description: 'The pipeline has 7 stages. Complete one to unlock the next. Each stage shows you exactly what is happening behind the scenes.',
    target: '[data-tour="step-indicator"]',
    position: 'bottom',
  },
  {
    id: 'help',
    title: 'Get help anytime',
    description: 'Click "Tips" for a 3-step guide at any stage. Click "Glossary" to decode Data Cloud terminology (DLO, DMO, IDMO, etc.).',
    target: '[data-tour="help-buttons"]',
    position: 'bottom',
  },
  {
    id: 'ready',
    title: 'You are all set! 🚀',
    description: 'Click any sample document below to start. The pipeline will walk you through each stage automatically.',
    position: 'center',
  },
];

export default function OnboardingTour() {
  const [active, setActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [targetElement, setTargetElement] = useState<HTMLElement | null>(null);
  const [originalStyles, setOriginalStyles] = useState<{zIndex: string; position: string} | null>(null);

  // Check if user has seen the tour
  useEffect(() => {
    try {
      const hasSeenTour = localStorage.getItem('learnrag-seen-tour');
      if (!hasSeenTour) {
        // Delay by 500ms so DOM elements are rendered
        setTimeout(() => setActive(true), 500);
      }
    } catch {
      setTimeout(() => setActive(true), 500);
    }
  }, []);

  // Update target element when step changes
  useEffect(() => {
    // Restore previous element's styles
    if (targetElement && originalStyles) {
      targetElement.style.zIndex = originalStyles.zIndex;
      targetElement.style.position = originalStyles.position;
    }

    if (active && TOUR_STEPS[currentStep].target) {
      const target = document.querySelector(TOUR_STEPS[currentStep].target!) as HTMLElement;
      setTargetElement(target);

      if (target) {
        // Store original styles
        const original = {
          zIndex: target.style.zIndex || getComputedStyle(target).zIndex,
          position: target.style.position || getComputedStyle(target).position,
        };
        setOriginalStyles(original);

        // Boost z-index to appear above backdrop
        target.style.position = original.position === 'static' ? 'relative' : original.position;
        target.style.zIndex = '9997';

        // Scroll target into view
        setTimeout(() => {
          target.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
        }, 100);
      }
    } else {
      setTargetElement(null);
      setOriginalStyles(null);
    }
  }, [active, currentStep]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (targetElement && originalStyles) {
        targetElement.style.zIndex = originalStyles.zIndex;
        targetElement.style.position = originalStyles.position;
      }
    };
  }, [targetElement, originalStyles]);

  const skipTour = () => {
    // Restore element styles before closing
    if (targetElement && originalStyles) {
      targetElement.style.zIndex = originalStyles.zIndex;
      targetElement.style.position = originalStyles.position;
    }

    try {
      localStorage.setItem('learnrag-seen-tour', 'true');
    } catch {
      // ignore
    }
    setActive(false);
  };

  const nextStep = () => {
    if (currentStep < TOUR_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      skipTour(); // Finish tour
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  if (!active || typeof document === 'undefined') return null;

  const step = TOUR_STEPS[currentStep];
  const isFirst = currentStep === 0;
  const isLast = currentStep === TOUR_STEPS.length - 1;
  const isCenter = !step.target || step.position === 'center';

  // Calculate tooltip position with viewport boundary detection
  const getTooltipStyle = (): React.CSSProperties => {
    if (isCenter || !targetElement) {
      return {
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        maxWidth: '480px',
        width: '90vw',
      };
    }

    const rect = targetElement.getBoundingClientRect();
    const tooltipWidth = 360;
    const tooltipHeight = 300; // estimated
    const gap = 16;
    const padding = 20;

    let style: React.CSSProperties = {
      position: 'fixed',
      maxWidth: `${tooltipWidth}px`,
      width: '90vw',
    };

    // Scroll element into view if needed
    if (rect.top < 0 || rect.bottom > window.innerHeight) {
      targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    switch (step.position) {
      case 'top':
        // Check if there is room below, otherwise place above
        if (rect.bottom + gap + tooltipHeight > window.innerHeight) {
          // Place above
          style.bottom = `${window.innerHeight - rect.top + gap}px`;
        } else {
          // Place below
          style.top = `${rect.bottom + gap}px`;
        }
        style.left = `${Math.max(padding, Math.min(window.innerWidth - tooltipWidth - padding, rect.left + rect.width / 2))}px`;
        style.transform = 'translateX(-50%)';
        break;
      case 'bottom':
        // Check if there is room above, otherwise place below
        if (rect.top - gap - tooltipHeight < 0) {
          // Place below
          style.top = `${rect.bottom + gap}px`;
        } else {
          // Place above
          style.bottom = `${window.innerHeight - rect.top + gap}px`;
        }
        style.left = `${Math.max(padding, Math.min(window.innerWidth - tooltipWidth - padding, rect.left + rect.width / 2))}px`;
        style.transform = 'translateX(-50%)';
        break;
      case 'left':
        // Check if there is room on left, otherwise place on right
        if (rect.left - gap - tooltipWidth < 0) {
          // Place on right
          style.left = `${rect.right + gap}px`;
        } else {
          // Place on left
          style.right = `${window.innerWidth - rect.left + gap}px`;
        }
        style.top = `${Math.max(padding, Math.min(window.innerHeight - tooltipHeight - padding, rect.top + rect.height / 2))}px`;
        style.transform = 'translateY(-50%)';
        break;
      case 'right':
        // Check if there is room on right, otherwise place on left
        if (rect.right + gap + tooltipWidth > window.innerWidth) {
          // Place on left
          style.right = `${window.innerWidth - rect.left + gap}px`;
        } else {
          // Place on right
          style.left = `${rect.right + gap}px`;
        }
        style.top = `${Math.max(padding, Math.min(window.innerHeight - tooltipHeight - padding, rect.top + rect.height / 2))}px`;
        style.transform = 'translateY(-50%)';
        break;
    }

    return style;
  };

  // Calculate spotlight position
  const getSpotlightStyle = (): React.CSSProperties | null => {
    if (!targetElement) return null;

    const rect = targetElement.getBoundingClientRect();
    const padding = 8;

    return {
      position: 'fixed',
      top: `${rect.top - padding}px`,
      left: `${rect.left - padding}px`,
      width: `${rect.width + padding * 2}px`,
      height: `${rect.height + padding * 2}px`,
      borderRadius: '12px',
      border: '3px solid #a855f7',
      boxShadow: '0 0 0 6px rgba(168,85,247,0.3), 0 0 60px rgba(168,85,247,0.5), inset 0 0 0 2000px rgba(168,85,247,0.05)',
      pointerEvents: 'none',
      zIndex: 9997,
      animation: 'pulse 2s ease-in-out infinite',
      background: 'rgba(168,85,247,0.02)',
    };
  };

  const tooltipStyle = getTooltipStyle();
  const spotlightStyle = getSpotlightStyle();

  return createPortal(
    <>
      {/* Backdrop */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.65)',
          zIndex: 9996,
        }}
        onClick={skipTour}
      />

      {/* Spotlight on target element */}
      {spotlightStyle && (
        <div style={spotlightStyle}>
          <style>
            {`
              @keyframes pulse {
                0%, 100% { box-shadow: 0 0 0 4px rgba(168,85,247,0.2), 0 0 40px rgba(168,85,247,0.3); }
                50% { box-shadow: 0 0 0 8px rgba(168,85,247,0.3), 0 0 60px rgba(168,85,247,0.4); }
              }
            `}
          </style>
        </div>
      )}

      {/* Tooltip card */}
      <div
        style={{
          ...tooltipStyle,
          background: '#1a1d27',
          border: '1px solid rgba(168,85,247,0.3)',
          borderRadius: '1rem',
          padding: '1.5rem',
          boxShadow: '0 8px 32px rgba(0,0,0,0.4), 0 0 0 1px rgba(168,85,247,0.2)',
          zIndex: 9998,
        }}
      >
        {/* Header */}
        <div style={{ marginBottom: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
            <h3
              style={{
                fontSize: '1.125rem',
                fontWeight: 700,
                color: '#f0f0f0',
                margin: 0,
                lineHeight: 1.3,
              }}
            >
              {step.title}
            </h3>
            <button
              onClick={skipTour}
              type="button"
              style={{
                background: 'transparent',
                border: 'none',
                color: '#8b8b8b',
                cursor: 'pointer',
                padding: '0.25rem',
                marginLeft: '0.5rem',
                flexShrink: 0,
              }}
              title="Skip tour"
            >
              <X size={18} />
            </button>
          </div>
          <p
            style={{
              fontSize: '0.9375rem',
              color: '#c0c0c0',
              lineHeight: 1.6,
              margin: 0,
            }}
          >
            {step.description}
          </p>
        </div>

        {/* Progress dots */}
        {!isCenter && (
          <div style={{ display: 'flex', gap: '0.375rem', marginBottom: '1rem' }}>
            {TOUR_STEPS.filter((s) => s.target).map((s, i) => {
              const stepIndex = TOUR_STEPS.indexOf(s);
              const isCurrent = stepIndex === currentStep;
              const isPast = stepIndex < currentStep;
              return (
                <div
                  key={s.id}
                  style={{
                    width: isCurrent ? '24px' : '8px',
                    height: '8px',
                    borderRadius: '4px',
                    background: isCurrent || isPast ? '#a855f7' : 'rgba(255,255,255,0.15)',
                    transition: 'all 0.3s',
                  }}
                />
              );
            })}
          </div>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'space-between' }}>
          {/* Left: Back button (if not first) */}
          <div>
            {!isFirst && (
              <button
                onClick={prevStep}
                type="button"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.375rem',
                  padding: '0.625rem 1rem',
                  background: 'transparent',
                  border: '1px solid rgba(255,255,255,0.15)',
                  borderRadius: '0.5rem',
                  color: '#c0c0c0',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  cursor: 'pointer',
                }}
              >
                <ChevronLeft size={16} />
                Back
              </button>
            )}
          </div>

          {/* Right: Skip + Next/Finish */}
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            {!isLast && (
              <button
                onClick={skipTour}
                type="button"
                style={{
                  padding: '0.625rem 1rem',
                  background: 'transparent',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '0.5rem',
                  color: '#8b8b8b',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  cursor: 'pointer',
                }}
              >
                Skip Tour
              </button>
            )}
            <button
              onClick={nextStep}
              type="button"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.375rem',
                padding: '0.625rem 1rem',
                background: '#a855f7',
                border: 'none',
                borderRadius: '0.5rem',
                color: '#fff',
                fontSize: '0.875rem',
                fontWeight: 600,
                cursor: 'pointer',
                boxShadow: '0 0 20px rgba(168,85,247,0.3)',
              }}
            >
              {isFirst ? 'Start Tour' : isLast ? 'Got it!' : 'Next'}
              {!isLast && <ChevronRight size={16} />}
            </button>
          </div>
        </div>
      </div>
    </>,
    document.body
  );
}
