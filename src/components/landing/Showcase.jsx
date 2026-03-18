import { useEffect, useRef } from 'react';
import { TAXONOMY } from '../../data/taxonomy';
import { useScrollReveal } from '../../hooks/useScrollReveal';

const TYPE_DESCRIPTORS = {
  advisory: 'Expert guidance',
  suggestive: 'Smart nudges',
  autonomous: 'Full autopilot',
  creative: 'Generative craft',
  predictive: 'Future sight',
  conversational: 'Natural dialogue',
  assistive: 'Human amplifier',
  monitoring: 'Silent sentinel',
  personalization: 'Tailored experience',
  analytical: 'Deep insight',
};

function TypePill({ type }) {
  return (
    <div className="glass-pill inline-flex items-center gap-2.5 px-3 sm:px-5 py-2 sm:py-2.5 rounded-full shrink-0 mx-1.5 sm:mx-2">
      <span
        className="w-2.5 h-2.5 rounded-full shrink-0"
        style={{ backgroundColor: type.color }}
      />
      <span className="text-sm font-medium text-primary whitespace-nowrap">{type.name}</span>
      <span className="text-xs text-text-muted whitespace-nowrap">{TYPE_DESCRIPTORS[type.id]}</span>
    </div>
  );
}

export default function Showcase() {
  const { ref, isVisible } = useScrollReveal(0.05);
  const sectionRef = useRef(null);

  // Parallax via scroll position → CSS variable
  useEffect(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) return;

    let ticking = false;
    function onScroll() {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        if (sectionRef.current) {
          const rect = sectionRef.current.getBoundingClientRect();
          const offset = (rect.top / window.innerHeight) * 30;
          sectionRef.current.style.setProperty('--parallax-y', `${offset}px`);
        }
        ticking = false;
      });
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Duplicate taxonomy for seamless loop
  const row1 = [...TAXONOMY, ...TAXONOMY];
  const row2 = [...TAXONOMY].reverse();
  const row2Doubled = [...row2, ...row2];

  return (
    <section
      ref={(el) => { sectionRef.current = el; ref.current = el; }}
      className="py-20 md:py-28 overflow-hidden"
      style={{ transform: 'translateY(var(--parallax-y, 0px))' }}
    >
      {/* Section header */}
      <div className={`text-center mb-12 px-6 scroll-reveal ${isVisible ? 'is-visible' : ''}`}>
        <p className="text-xs font-medium tracking-[0.2em] uppercase text-accent mb-3">The spectrum</p>
        <h2 className="font-heading text-3xl md:text-4xl text-primary mb-3">
          10 AI-UX Intervention Types
        </h2>
        <p className="text-sm text-text-muted max-w-md mx-auto">
          From advisory to autonomous — the full range of human-AI collaboration patterns
        </p>
      </div>

      {/* Marquee Row 1 — scrolling left */}
      <div className="marquee-mask mb-4">
        <div
          className="flex w-max animate-marquee-left"
          style={{ '--marquee-speed': '45s' }}
        >
          {row1.map((type, i) => (
            <TypePill key={`r1-${i}`} type={type} />
          ))}
        </div>
      </div>

      {/* Marquee Row 2 — scrolling right */}
      <div className="marquee-mask">
        <div
          className="flex w-max animate-marquee-right"
          style={{ '--marquee-speed': '50s' }}
        >
          {row2Doubled.map((type, i) => (
            <TypePill key={`r2-${i}`} type={type} />
          ))}
        </div>
      </div>
    </section>
  );
}
