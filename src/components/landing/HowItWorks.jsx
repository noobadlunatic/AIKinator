import { useScrollReveal } from '../../hooks/useScrollReveal';

const STEPS = [
  {
    number: '01',
    title: 'Answer 6 Questions',
    desc: 'Tell us about your industry, problem space, risk tolerance, and goals.',
    icon: (
      <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
  },
  {
    number: '02',
    title: 'AI Analyzes Context',
    desc: 'Gemini evaluates your context against 10 intervention types and 5 autonomy levels.',
    icon: (
      <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
      </svg>
    ),
  },
  {
    number: '03',
    title: 'Get Your Journey Map',
    desc: 'Receive a ranked, interactive journey map with confidence scores and implementation guidance.',
    icon: (
      <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5m.75-9l3-3 2.148 2.148A12.061 12.061 0 0116.5 7.605" />
      </svg>
    ),
  },
];

export default function HowItWorks() {
  const { ref, isVisible } = useScrollReveal(0.1);

  return (
    <section ref={ref} className="py-24 md:py-32 px-6">
      <div className="max-w-4xl mx-auto">
        {/* Section header */}
        <div className={`text-center mb-16 scroll-reveal ${isVisible ? 'is-visible' : ''}`}>
          <p className="text-xs font-medium tracking-[0.2em] uppercase text-accent mb-3">How it works</p>
          <h2 className="font-heading text-3xl md:text-4xl text-primary">
            Three steps to clarity
          </h2>
        </div>

        {/* Steps */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
          {/* Connecting lines (desktop only) */}
          <svg
            className="hidden md:block absolute top-12 left-0 w-full h-4 pointer-events-none"
            viewBox="0 0 800 16"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <line
              x1="170" y1="8" x2="370" y2="8"
              stroke="var(--color-accent)"
              strokeWidth="1.5"
              strokeDasharray="6 4"
              className={isVisible ? 'animate-draw-line' : ''}
              style={{ '--draw-delay': '0.6s' }}
              strokeOpacity="0.4"
            />
            <line
              x1="430" y1="8" x2="630" y2="8"
              stroke="var(--color-accent)"
              strokeWidth="1.5"
              strokeDasharray="6 4"
              className={isVisible ? 'animate-draw-line' : ''}
              style={{ '--draw-delay': '0.9s' }}
              strokeOpacity="0.4"
            />
          </svg>

          {STEPS.map((step, i) => (
            <div
              key={step.number}
              className={`scroll-reveal ${isVisible ? 'is-visible' : ''} text-center relative`}
              style={{ '--reveal-stagger': `${0.15 + i * 0.15}s` }}
            >
              {/* Mobile connector line */}
              {i > 0 && (
                <div className="md:hidden w-px h-8 bg-border mx-auto mb-6" aria-hidden="true" />
              )}

              {/* Icon circle */}
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-bg-card border border-border-light shadow-sm mb-5">
                <span className="text-accent">{step.icon}</span>
              </div>

              {/* Step number */}
              <p className="text-[10px] font-semibold tracking-[0.25em] uppercase text-text-light mb-2">
                Step {step.number}
              </p>

              <h3 className="font-heading text-lg text-primary mb-2">
                {step.title}
              </h3>
              <p className="text-sm text-text-muted leading-relaxed max-w-xs mx-auto">
                {step.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
