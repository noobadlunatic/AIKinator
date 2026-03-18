import { useEffect, useState, useCallback } from 'react';
import { useScrollReveal } from '../../hooks/useScrollReveal';
import SavedAssessments from '../SavedAssessments';

function AnimatedCounter({ target, isVisible }) {
  const [count, setCount] = useState(0);

  const animate = useCallback(() => {
    if (!isVisible) return;
    const duration = 1200;
    const start = performance.now();

    function tick(now) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - (1 - progress) * (1 - progress);
      setCount(Math.round(eased * target));
      if (progress < 1) requestAnimationFrame(tick);
    }

    requestAnimationFrame(tick);
  }, [isVisible, target]);

  useEffect(() => { animate(); }, [animate]);

  return <span>{count}</span>;
}

export default function ClosingSection({ onStart, onShowTaxonomy }) {
  const { ref, isVisible } = useScrollReveal(0.15);

  return (
    <section
      ref={ref}
      className="bg-bg py-20 md:py-28 px-6 relative overflow-hidden"
    >
      {/* Subtle radial accent glow */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] md:w-[600px] md:h-[600px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(212,118,78,0.06) 0%, transparent 70%)' }}
        aria-hidden="true"
      />

      <div className="relative z-10 max-w-2xl mx-auto text-center">
        {/* Heading */}
        <div className={`scroll-reveal ${isVisible ? 'is-visible' : ''}`}>
          <h2 className="font-heading text-3xl md:text-4xl text-primary mb-4">
            Ready to find your AI&#8209;UX strategy?
          </h2>
        </div>

        {/* Inline stats */}
        <div
          className={`flex items-center justify-center gap-4 sm:gap-6 md:gap-8 mb-10 scroll-reveal ${isVisible ? 'is-visible' : ''}`}
          style={{ '--reveal-stagger': '0.1s' }}
        >
          {[
            { target: 10, label: 'Types' },
            { target: 5, label: 'Autonomy Levels' },
            { target: 6, label: 'Questions' },
          ].map((stat) => (
            <div key={stat.label} className="flex items-baseline gap-1.5">
              <span className="font-heading text-2xl md:text-3xl text-accent">
                <AnimatedCounter target={stat.target} isVisible={isVisible} />
              </span>
              <span className="text-xs text-text-muted font-medium">{stat.label}</span>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div
          className={`scroll-reveal ${isVisible ? 'is-visible' : ''}`}
          style={{ '--reveal-stagger': '0.2s' }}
        >
          <button
            onClick={onStart}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-7 sm:px-9 py-4 rounded-xl bg-accent text-white font-medium text-base
                       animate-glow-pulse hover:bg-accent-dark hover:scale-[1.03] transition-all duration-200 cursor-pointer"
          >
            Start Assessment
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </button>
        </div>

        {/* Taxonomy link */}
        <div
          className={`mt-5 scroll-reveal ${isVisible ? 'is-visible' : ''}`}
          style={{ '--reveal-stagger': '0.3s' }}
        >
          <button
            onClick={onShowTaxonomy}
            className="text-sm text-text-muted hover:text-accent transition-colors underline underline-offset-4 decoration-text-light/40 hover:decoration-accent/60 cursor-pointer"
          >
            Explore the full taxonomy
          </button>
        </div>

        {/* Gemini badge */}
        <div
          className={`mt-10 scroll-reveal ${isVisible ? 'is-visible' : ''}`}
          style={{ '--reveal-stagger': '0.4s' }}
        >
          <div className="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full border border-border-light bg-bg-card">
            <svg className="w-4 h-4 text-accent" viewBox="0 0 24 24" fill="currentColor">
              <path d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
            </svg>
            <span className="text-xs font-medium text-text-muted">Powered by Google Gemini</span>
          </div>
        </div>

        {/* Saved assessments */}
        <div className="mt-16">
          <SavedAssessments />
        </div>
      </div>
    </section>
  );
}
