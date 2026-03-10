import { useState, useRef } from 'react';
import { useAssessment } from '../hooks/useAssessment';
import { ALL_QUESTIONS, TOTAL_QUESTIONS, getSectionForQuestion } from '../data/questions';
import ProgressBar from './ProgressBar';
import QuestionStep from './QuestionStep';

export default function Questionnaire() {
  const { state, setAnswer, nextQuestion, prevQuestion, startAnalysis, setScreen } = useAssessment();
  const { currentQuestionIndex, answers } = state;
  const [direction, setDirection] = useState('forward');
  const currentQuestion = ALL_QUESTIONS[currentQuestionIndex];
  const currentSection = getSectionForQuestion(currentQuestionIndex);
  const prevSectionRef = useRef(currentSection.id);

  const isLastQuestion = currentQuestionIndex === TOTAL_QUESTIONS - 1;
  const isFirstQuestion = currentQuestionIndex === 0;

  // Section transition detection
  const sectionChanged = prevSectionRef.current !== currentSection.id;
  if (sectionChanged) prevSectionRef.current = currentSection.id;

  // Validation
  const currentValue = answers[currentQuestion.answerKey];
  const isValid = validateAnswer(currentQuestion, currentValue);

  function handleNext() {
    if (!isValid && currentQuestion.required) return;
    setDirection('forward');

    if (isLastQuestion) {
      startAnalysis();
    } else {
      nextQuestion();
    }
  }

  function handleBack() {
    if (isFirstQuestion) {
      setScreen('landing');
    } else {
      setDirection('back');
      prevQuestion();
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && isValid) {
      handleNext();
    }
  }

  return (
    <div className="min-h-screen bg-bg" onKeyDown={handleKeyDown}>
      <div className="max-w-2xl mx-auto px-4 py-8 md:py-16">
        {/* Header */}
        <button
          onClick={() => setScreen('landing')}
          className="flex items-center gap-1.5 text-sm text-text-muted hover:text-primary transition-colors mb-8 cursor-pointer"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          AIkinator
        </button>

        <ProgressBar currentIndex={currentQuestionIndex} />

        {/* Section header */}
        <div className="mb-6">
          <p className="text-xs uppercase tracking-wider text-accent font-medium mb-1">
            {currentSection.title}
          </p>
          <p className="text-sm text-text-muted">{currentSection.description}</p>
        </div>

        {/* Question */}
        <QuestionStep
          question={currentQuestion}
          value={currentValue}
          onChange={(val) => setAnswer(currentQuestion.answerKey, val)}
          direction={direction}
        />

        {/* Navigation */}
        <div className="flex justify-between items-center mt-10">
          <button
            onClick={handleBack}
            className="flex items-center gap-1.5 px-5 py-2.5 rounded-lg text-sm font-medium text-text-muted hover:text-primary hover:bg-primary/5 transition-all cursor-pointer"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>

          <button
            onClick={handleNext}
            disabled={currentQuestion.required && !isValid}
            className={`flex items-center gap-1.5 px-6 py-2.5 rounded-lg text-sm font-medium transition-all cursor-pointer ${
              currentQuestion.required && !isValid
                ? 'bg-border text-text-muted cursor-not-allowed'
                : isLastQuestion
                ? 'bg-accent text-white hover:bg-accent-dark shadow-md hover:shadow-lg'
                : 'bg-primary text-white hover:bg-primary-light shadow-sm hover:shadow-md'
            }`}
          >
            {isLastQuestion ? 'Get Recommendations' : !currentQuestion.required && !currentValue ? 'Skip' : 'Next'}
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
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
  // If "other" with text field, need actual text
  if (typeof value === 'string' && value.startsWith('other:')) {
    return value.length > 6; // 'other:' is 6 chars
  }
  return true;
}
