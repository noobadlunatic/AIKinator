import { useState } from 'react';
import { useAssessment } from '../hooks/useAssessment';
import SavedAssessments from './SavedAssessments';
import TaxonomyModal from './TaxonomyModal';

export default function Landing() {
  const { setScreen } = useAssessment();
  const [showTaxonomy, setShowTaxonomy] = useState(false);

  return (
    <div className="min-h-screen bg-bg">
      <div className="max-w-3xl mx-auto px-4 py-16 md:py-24">
        {/* Hero */}
        <div className="text-center animate-fade-in-up">
          {/* Logo / Icon */}
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary mb-6">
            <svg className="w-8 h-8 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
            </svg>
          </div>

          <h1 className="font-heading text-4xl md:text-5xl lg:text-6xl text-primary mb-4">
            AIkinator
          </h1>
          <p className="text-lg md:text-xl text-accent font-medium mb-3">
            Find the right AI intervention for your product
          </p>
          <p className="text-base text-text-muted max-w-xl mx-auto mb-10 leading-relaxed">
            Answer a few questions about your business context and get ranked, personalized recommendations
            for which AI-UX intervention types will work best — with detailed rationale, real-world examples,
            and implementation guidance.
          </p>

          {/* CTA */}
          <button
            onClick={() => setScreen('questionnaire')}
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-accent text-white font-medium text-base shadow-lg hover:bg-accent-dark hover:shadow-xl hover:scale-[1.02] transition-all duration-200 cursor-pointer"
          >
            Start Assessment
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </button>

          {/* Taxonomy link */}
          <div className="mt-6">
            <button
              onClick={() => setShowTaxonomy(true)}
              className="text-sm text-text-muted hover:text-accent transition-colors underline underline-offset-2 cursor-pointer"
            >
              What are AI-UX Interventions?
            </button>
          </div>
        </div>

        {/* Features brief */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-16 animate-fade-in-up" style={{ animationDelay: '200ms' }}>
          {[
            { title: 'Guided Assessment', desc: '12 targeted questions about your business context, users, and constraints' },
            { title: 'AI-Powered Analysis', desc: 'Get ranked combinations of intervention types with confidence scores' },
            { title: 'Actionable Results', desc: 'Real-world examples, pros/cons, trust considerations, and a user journey map' },
          ].map((feature) => (
            <div key={feature.title} className="text-center p-4">
              <h3 className="font-heading text-sm text-primary mb-1">{feature.title}</h3>
              <p className="text-xs text-text-muted leading-relaxed">{feature.desc}</p>
            </div>
          ))}
        </div>

        {/* Saved assessments */}
        <SavedAssessments />

        <TaxonomyModal isOpen={showTaxonomy} onClose={() => setShowTaxonomy(false)} />
      </div>
    </div>
  );
}
