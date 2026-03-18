import { useEffect, useState } from 'react';
import StereogramCanvas from './landing/StereogramCanvas';

const STAGES = [
  { threshold: 0, message: 'Analyzing your business context...' },
  { threshold: 15, message: 'Evaluating risk profile and constraints...' },
  { threshold: 30, message: 'Matching intervention patterns...' },
  { threshold: 50, message: 'Evaluating combination synergies...' },
  { threshold: 70, message: 'Generating personalized recommendations...' },
  { threshold: 90, message: 'Almost there...' },
];

export default function AnalysisLoading({ progress, error, onRetry }) {
  const [currentStage, setCurrentStage] = useState(0);
  const [showExtended, setShowExtended] = useState(false);

  useEffect(() => {
    for (let i = STAGES.length - 1; i >= 0; i--) {
      if (progress >= STAGES[i].threshold) {
        setCurrentStage(i);
        break;
      }
    }
  }, [progress]);

  useEffect(() => {
    const timer = setTimeout(() => setShowExtended(true), 15000);
    return () => clearTimeout(timer);
  }, []);

  if (error) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center animate-scale-in">
          <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-confidence-low/10 flex items-center justify-center">
            <svg className="w-8 h-8 text-confidence-low" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
          </div>
          <h2 className="font-heading text-2xl text-primary mb-2">Analysis Failed</h2>
          <p className="text-sm text-text-muted mb-6 leading-relaxed">{error}</p>
          <button
            onClick={onRetry}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-accent text-white font-medium text-sm hover:bg-accent-dark transition-colors cursor-pointer"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg flex flex-col items-center justify-center">
      {/* Full-width aurora gradient animation */}
      <div className="relative w-full h-44 mb-8">
        <StereogramCanvas hideCircle />
      </div>

      <div className="max-w-md w-full text-center px-4">

        {/* Stage message */}
        <p className="font-heading text-lg text-primary mb-2 animate-pulse-soft" key={currentStage}>
          {STAGES[currentStage].message}
        </p>

        {/* Progress bar */}
        <div className="w-full max-w-xs mx-auto h-1 bg-border-light rounded-full overflow-hidden mt-4 mb-3">
          <div
            className="h-full bg-accent rounded-full transition-all duration-500 ease-out"
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
        </div>

        {/* Extended message */}
        {showExtended && progress < 90 && (
          <p className="text-xs text-text-light mt-4 animate-fade-in">
            Still analyzing... This is taking longer than usual.
          </p>
        )}

        {/* Stage indicators */}
        <div className="flex justify-center gap-1.5 mt-6">
          {STAGES.map((_, i) => (
            <div
              key={i}
              className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                i <= currentStage ? 'bg-accent' : 'bg-border'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
