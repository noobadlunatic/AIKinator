import { useState, useRef } from 'react';
import { useAssessment } from '../hooks/useAssessment';
import { SECTIONS, ALL_QUESTIONS } from '../data/questions';
import { trackAssessmentSubmitted } from '../services/analytics';
import QuestionStep from './QuestionStep';

export default function Questionnaire() {
  const { state, setAnswer, startAnalysis, setScreen } = useAssessment();
  const { answers } = state;
  const [validationErrors, setValidationErrors] = useState({});
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);
  const mountedAt = useRef(Date.now());
  const questionFirstInteractionAt = useRef({});

  const answeredCount = ALL_QUESTIONS.filter(
    (q) => validateAnswer(q, answers[q.answerKey])
  ).length;

  function handleChange(answerKey, value) {
    // Record first interaction time for this question if not yet recorded
    if (!questionFirstInteractionAt.current[answerKey]) {
      questionFirstInteractionAt.current[answerKey] = Date.now();
    }
    setAnswer(answerKey, value);
    if (validationErrors[answerKey]) {
      setValidationErrors((prev) => {
        const next = { ...prev };
        delete next[answerKey];
        return next;
      });
    }
  }

  function handleSubmit() {
    setHasAttemptedSubmit(true);
    const errors = {};

    for (const question of ALL_QUESTIONS) {
      if (question.required && !validateAnswer(question, answers[question.answerKey])) {
        errors[question.answerKey] = true;
      }
    }

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      const firstErrorKey = ALL_QUESTIONS.find((q) => errors[q.answerKey])?.answerKey;
      if (firstErrorKey) {
        document.getElementById(`question-${firstErrorKey}`)?.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        });
      }
      return;
    }

    setValidationErrors({});

    // Track assessment submission with timing data
    const now = Date.now();
    const totalTime = now - mountedAt.current;
    const perQuestion = {};
    for (const q of ALL_QUESTIONS) {
      const firstInteraction = questionFirstInteractionAt.current[q.answerKey];
      perQuestion[q.answerKey] = firstInteraction ? now - firstInteraction : null;
    }
    trackAssessmentSubmitted(answers, { totalTime, perQuestion });

    startAnalysis();
  }

  return (
    <div className="min-h-screen bg-bg">
      <div className="max-w-2xl mx-auto px-4 py-8 md:py-14">
        {/* Back nav */}
        <button
          onClick={() => setScreen('landing')}
          className="flex items-center gap-1.5 text-sm text-text-muted hover:text-primary transition-colors mb-10 cursor-pointer"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          AIkinator
        </button>

        {/* Page header */}
        <div className="mb-12 animate-fade-in-up">
          <h1 className="font-heading text-3xl md:text-4xl text-primary mb-2">
            Assessment
          </h1>
          <p className="text-base text-text-muted leading-relaxed">
            Tell us about your product context so we can recommend the right AI interventions.
          </p>
          {/* Compact progress pill */}
          <div className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/5 border border-border-light">
            <div className="flex gap-1">
              {ALL_QUESTIONS.map((q) => (
                <div
                  key={q.id}
                  className={`w-2 h-2 rounded-full transition-colors duration-300 ${
                    validateAnswer(q, answers[q.answerKey])
                      ? 'bg-accent'
                      : 'bg-border'
                  }`}
                />
              ))}
            </div>
            <span className="text-xs text-text-muted font-medium">
              {answeredCount}/{ALL_QUESTIONS.length}
            </span>
          </div>
        </div>

        {/* Sections */}
        <div className="space-y-14">
          {SECTIONS.map((section, sectionIdx) => (
            <div
              key={section.id}
              className="animate-fade-in-up"
              style={{ animationDelay: `${sectionIdx * 120}ms` }}
            >
              {/* Section header */}
              <div className="flex items-center gap-3 mb-8">
                <span className="flex-shrink-0 inline-flex items-center justify-center w-7 h-7 rounded-lg bg-accent/10 text-accent text-xs font-bold">
                  {sectionIdx + 1}
                </span>
                <div>
                  <h2 className="text-xs uppercase tracking-wider text-accent font-medium">
                    {section.title}
                  </h2>
                  <p className="text-sm text-text-muted">{section.description}</p>
                </div>
              </div>

              {/* Questions in section */}
              <div className="space-y-10 pl-2 border-l-2 border-border-light ml-3.5">
                {section.questions.map((question, qIdx) => {
                  const isAnswered = validateAnswer(question, answers[question.answerKey]);
                  const hasError = validationErrors[question.answerKey];

                  return (
                    <div
                      key={question.id}
                      id={`question-${question.answerKey}`}
                      className="relative pl-6 animate-fade-in-up"
                      style={{ animationDelay: `${sectionIdx * 120 + (qIdx + 1) * 80}ms` }}
                    >
                      {/* Timeline dot */}
                      <div
                        className={`absolute -left-[7px] top-1 w-3 h-3 rounded-full border-2 transition-all duration-300 ${
                          hasError
                            ? 'border-confidence-low bg-confidence-low/20'
                            : isAnswered
                            ? 'border-accent bg-accent'
                            : 'border-border bg-bg'
                        }`}
                      />

                      {/* Question card */}
                      <div
                        className={`p-5 md:p-6 rounded-xl border-2 bg-bg-card transition-all duration-300 ${
                          hasError
                            ? 'border-confidence-low/30 shadow-sm shadow-confidence-low/5'
                            : isAnswered
                            ? 'border-accent/20'
                            : 'border-border-light'
                        }`}
                      >
                        <QuestionStep
                          question={question}
                          value={answers[question.answerKey]}
                          onChange={(val) => handleChange(question.answerKey, val)}
                        />

                        {/* Validation error */}
                        {hasError && (
                          <div className="mt-3 flex items-center gap-1.5 text-confidence-low animate-fade-in">
                            <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                            </svg>
                            <p className="text-xs font-medium">
                              {question.type === 'textarea'
                                ? `Please write at least ${question.minLength || 20} characters`
                                : question.type === 'multi-select'
                                ? 'Please select at least one option'
                                : 'Please select an option'}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Submit area */}
        <div className="mt-14 mb-8 animate-fade-in-up" style={{ animationDelay: '400ms' }}>
          {hasAttemptedSubmit && Object.keys(validationErrors).length > 0 && (
            <div className="mb-4 p-3 rounded-lg bg-confidence-low/5 border border-confidence-low/20 text-sm text-confidence-low flex items-center gap-2 animate-fade-in">
              <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126z" />
              </svg>
              Please fill in all required fields before continuing.
            </div>
          )}

          <div className="flex justify-between items-center">
            <button
              onClick={() => setScreen('landing')}
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-lg text-sm font-medium text-text-muted hover:text-primary hover:bg-primary/5 transition-all cursor-pointer"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
              Back
            </button>

            <button
              onClick={handleSubmit}
              className="inline-flex items-center gap-2 px-7 py-3 rounded-xl bg-accent text-white font-medium text-sm shadow-md hover:bg-accent-dark hover:shadow-lg hover:scale-[1.02] transition-all duration-200 cursor-pointer"
            >
              Get Recommendations
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function validateAnswer(question, value) {
  if (!question.required) return true;

  if (question.type === 'textarea') {
    const minLen = question.minLength || 0;
    return typeof value === 'string' && value.trim().length >= minLen;
  }

  if (question.type === 'multi-select') {
    return Array.isArray(value) && value.length >= 1;
  }

  // single-select
  if (!value) return false;
  if (typeof value === 'string' && value.startsWith('other:')) {
    return value.length > 6;
  }
  return true;
}
