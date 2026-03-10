import { useEffect, useRef } from 'react';
import { TAXONOMY } from '../data/taxonomy';

export default function TaxonomyModal({ isOpen, onClose, highlightType }) {
  const modalRef = useRef(null);
  const highlightRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      // Scroll to highlighted type
      if (highlightType && highlightRef.current) {
        setTimeout(() => highlightRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 100);
      }
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen, highlightType]);

  useEffect(() => {
    function handleKey(e) {
      if (e.key === 'Escape') onClose();
    }
    if (isOpen) window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-primary/40 backdrop-blur-sm animate-fade-in" onClick={onClose} />

      {/* Panel */}
      <div
        ref={modalRef}
        className="relative w-full max-w-lg bg-bg overflow-y-auto animate-slide-in-right"
        style={{ animationDuration: '0.3s' }}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 bg-bg border-b border-border-light px-6 py-4 flex items-center justify-between">
          <h2 className="font-heading text-xl text-primary">AI-UX Intervention Types</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-text-muted hover:text-primary hover:bg-primary/5 transition-colors cursor-pointer"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="px-6 py-4">
          <p className="text-sm text-text-muted mb-6">
            Understanding the 10 types of AI-UX interventions helps you make better decisions about how to integrate AI into your product.
          </p>

          <div className="space-y-4">
            {TAXONOMY.map((type) => (
              <div
                key={type.id}
                ref={highlightType === type.id ? highlightRef : null}
                className={`p-4 rounded-xl border-2 transition-all ${
                  highlightType === type.id
                    ? 'border-accent/40 bg-accent/5'
                    : 'border-border-light bg-bg-card'
                }`}
              >
                <div className="flex items-center gap-2.5 mb-2">
                  <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: type.color }} />
                  <h3 className="font-heading text-base text-primary">
                    {type.typeNumber}. {type.name}
                  </h3>
                </div>

                <p className="text-sm text-text-muted mb-3 leading-relaxed">{type.definition}</p>

                <div className="flex flex-wrap gap-2 mb-2">
                  <span className="text-xs px-2 py-0.5 rounded-full bg-primary/5 text-primary font-medium">
                    {type.autonomyLevel.label}
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-primary/5 text-primary font-medium">
                    Data: {type.dataRequirements}
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-primary/5 text-primary font-medium">
                    Complexity: {type.implementationComplexity}
                  </span>
                </div>

                <p className="text-xs text-text-light italic">{type.keyDifferentiator}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
