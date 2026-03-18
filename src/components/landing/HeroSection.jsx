import { TAXONOMY } from '../../data/taxonomy';
import StereogramCanvas from './StereogramCanvas';

const TAGLINE_WORDS = 'What AI should your product use?'.split(' ');

function JourneyPreview() {
  const nodes = [
    { label: 'Advisory', color: TAXONOMY[0].color },
    { label: 'Creative', color: TAXONOMY[3].color },
    { label: 'Predictive', color: TAXONOMY[4].color },
    { label: 'Assistive', color: TAXONOMY[6].color },
  ];

  return (
    <div
      className="mt-14 animate-fade-in animate-float-slow hidden md:block"
      style={{ animationDelay: '2s', opacity: 0 }}
    >
      <div className="flex items-center justify-center gap-3">
        {nodes.map((node, i) => (
          <div key={node.label} className="flex items-center gap-3">
            <div
              className="animate-node-pop flex items-center gap-2 px-4 py-2.5 rounded-lg bg-bg-card border border-border-light shadow-sm"
              style={{ '--node-delay': `${2.2 + i * 0.15}s` }}
            >
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{ backgroundColor: node.color }}
              />
              <span className="text-xs font-medium text-primary">{node.label}</span>
            </div>
            {i < nodes.length - 1 && (
              <svg
                className="w-6 h-6 text-text-light animate-fade-in shrink-0"
                style={{ animationDelay: `${2.6 + i * 0.1}s`, opacity: 0 }}
                fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5" />
              </svg>
            )}
          </div>
        ))}
      </div>
      <p className="text-[11px] text-text-light text-center mt-4 tracking-wider uppercase">
        Your personalized journey map
      </p>
    </div>
  );
}

export default function HeroSection({ onStart, onShowTaxonomy }) {
  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden bg-bg">
      {/* Interactive aurora canvas (desktop only — no cursor on mobile) */}
      <div className="hidden md:block absolute inset-0">
        <StereogramCanvas />
      </div>

      {/* Grain overlay */}
      <div className="absolute inset-0 grain-overlay pointer-events-none" aria-hidden="true" />

      {/* Content */}
      <div className="relative z-10 text-center px-5 sm:px-6 max-w-4xl mx-auto pointer-events-none">
        {/* Heading */}
        <div className="overflow-hidden mb-5">
          <h1
            className="font-heading text-4xl sm:text-5xl md:text-7xl lg:text-8xl hero-heading-gradient animate-text-reveal"
            style={{ '--reveal-delay': '0.2s' }}
          >
            AIkinator
          </h1>
        </div>

        {/* Tagline — word-by-word fade with blur */}
        <p className="text-base sm:text-lg md:text-xl font-medium mb-4 sm:mb-5 leading-relaxed">
          {TAGLINE_WORDS.map((word, i) => (
            <span
              key={i}
              className="inline-block animate-word-fade mr-[0.3em] text-accent"
              style={{ '--word-delay': `${0.8 + i * 0.06}s` }}
            >
              {word}
            </span>
          ))}
        </p>

        {/* Description */}
        <p
          className="text-sm sm:text-base text-text-muted max-w-md mx-auto mb-8 sm:mb-10 leading-relaxed animate-fade-in"
          style={{ animationDelay: '1.4s', opacity: 0 }}
        >
          Answer 6 quick questions about your product. Get a personalized roadmap
          of which AI features to build and how to implement them.
        </p>

        {/* CTA Button */}
        <div className="animate-fade-in pointer-events-auto" style={{ animationDelay: '1.6s', opacity: 0 }}>
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
        <div className="mt-5 animate-fade-in pointer-events-auto" style={{ animationDelay: '1.8s', opacity: 0 }}>
          <button
            onClick={onShowTaxonomy}
            className="text-sm text-text-muted hover:text-accent transition-colors underline underline-offset-4 decoration-text-light/40 hover:decoration-accent/60 cursor-pointer"
          >
            What are AI-UX Interventions?
          </button>
        </div>

        {/* Journey map preview */}
        <div className="pointer-events-auto">
          <JourneyPreview />
        </div>

        {/* Mobile: compact preview */}
        <div className="md:hidden mt-6 animate-fade-in" style={{ animationDelay: '2s', opacity: 0 }}>
          <div className="flex items-center justify-center gap-2">
            {[TAXONOMY[0], TAXONOMY[3], TAXONOMY[6]].map((t) => (
              <div
                key={t.id}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-bg-card border border-border-light shadow-sm"
              >
                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: t.color }} />
                <span className="text-[10px] font-medium text-primary">{t.name.split(' ')[0]}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Scroll hint */}
      <div
        className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-fade-in animate-pulse-soft"
        style={{ animationDelay: '2.8s', opacity: 0 }}
      >
        <svg className="w-5 h-5 text-text-light" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 14l-7 7m0 0l-7-7" />
        </svg>
      </div>
    </section>
  );
}
