import { useEffect, useRef } from 'react';
import { AssessmentProvider, useAssessment } from './hooks/useAssessment';
import { useAIRecommendation } from './hooks/useAIRecommendation';
import { getSharedDataFromUrl } from './services/sharing';
import ErrorBoundary from './components/ErrorBoundary';
import Landing from './components/Landing';
import Questionnaire from './components/Questionnaire';
import AnalysisLoading from './components/AnalysisLoading';
import Results from './components/Results';

export default function App() {
  return (
    <ErrorBoundary>
      <AssessmentProvider>
        <AppRouter />
      </AssessmentProvider>
    </ErrorBoundary>
  );
}

function AppRouter() {
  const { state, setAnswer, setResults, setError, startAnalysis } = useAssessment();
  const { status, progress, error, result, analyze, retry } = useAIRecommendation();
  const sharedHandled = useRef(false);

  // Handle shared URL on mount
  useEffect(() => {
    if (sharedHandled.current) return;
    const sharedAnswers = getSharedDataFromUrl();
    if (sharedAnswers) {
      sharedHandled.current = true;
      // Load all answers into state
      Object.entries(sharedAnswers).forEach(([key, value]) => {
        setAnswer(key, value);
      });
      startAnalysis();
      analyze(sharedAnswers);
    }
  }, [setAnswer, startAnalysis, analyze]);

  // When the screen transitions to 'loading', kick off the AI call
  useEffect(() => {
    if (state.currentScreen === 'loading' && status === 'idle') {
      analyze(state.answers);
    }
  }, [state.currentScreen, status, analyze, state.answers]);

  // When AI call succeeds, update state
  useEffect(() => {
    if (status === 'success' && result) {
      setResults(result);
    }
  }, [status, result, setResults]);

  // When AI call fails, update state
  useEffect(() => {
    if (status === 'error' && error) {
      setError(error);
    }
  }, [status, error, setError]);

  function handleRetry() {
    setError(null);
    retry(state.answers);
  }

  switch (state.currentScreen) {
    case 'landing':
      return <Landing />;
    case 'questionnaire':
      return <Questionnaire />;
    case 'loading':
      return (
        <AnalysisLoading
          progress={progress}
          error={state.error || error}
          onRetry={handleRetry}
        />
      );
    case 'results':
      return <Results />;
    default:
      return <Landing />;
  }
}
