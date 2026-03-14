import { useEffect, useRef } from 'react';
import { AssessmentProvider, useAssessment } from './hooks/useAssessment';
import { useAIRecommendation } from './hooks/useAIRecommendation';
import { getSharedDataFromUrl } from './services/sharing';
import { trackScreenExit, trackAnalysisStarted, trackAnalysisCompleted, trackAnalysisFailed } from './services/analytics';
import ErrorBoundary from './components/ErrorBoundary';
import Landing from './components/Landing';
import Questionnaire from './components/Questionnaire';
import AnalysisLoading from './components/AnalysisLoading';
import Results from './components/Results';
import ChaiWidget from './components/ChaiWidget';
import { Analytics } from '@vercel/analytics/react';

export default function App() {
  return (
    <ErrorBoundary>
      <AssessmentProvider>
        <AppRouter />
      </AssessmentProvider>
      <Analytics />
    </ErrorBoundary>
  );
}

function AppRouter() {
  const { state, setAnswer, setResults, setError, startAnalysis } = useAssessment();
  const { status, progress, error, result, analyze, retry } = useAIRecommendation();
  const sharedHandled = useRef(false);
  const screenEnteredAt = useRef(Date.now());
  const analysisStartedAt = useRef(null);
  const prevScreenRef = useRef(state.currentScreen);

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

  // Track screen transitions and time spent on each screen
  useEffect(() => {
    if (prevScreenRef.current && prevScreenRef.current !== state.currentScreen) {
      const elapsed = Date.now() - screenEnteredAt.current;
      trackScreenExit(prevScreenRef.current, elapsed);
    }
    prevScreenRef.current = state.currentScreen;
    screenEnteredAt.current = Date.now();
  }, [state.currentScreen]);

  // When the screen transitions to 'loading', kick off the AI call
  useEffect(() => {
    if (state.currentScreen === 'loading' && status === 'idle') {
      analysisStartedAt.current = Date.now();
      trackAnalysisStarted();
      analyze(state.answers);
    }
  }, [state.currentScreen, status, analyze, state.answers]);

  // When AI call succeeds, update state
  useEffect(() => {
    if (status === 'success' && result) {
      if (analysisStartedAt.current) {
        const elapsed = Date.now() - analysisStartedAt.current;
        trackAnalysisCompleted(elapsed);
        analysisStartedAt.current = null;
      }
      setResults(result);
    }
  }, [status, result, setResults]);

  // When AI call fails, update state
  useEffect(() => {
    if (status === 'error' && error) {
      trackAnalysisFailed(error);
      analysisStartedAt.current = null;
      setError(error);
    }
  }, [status, error, setError]);

  function handleRetry() {
    setError(null);
    retry(state.answers);
  }

  const showChaiWidget = state.currentScreen === 'landing' || state.currentScreen === 'results';

  let screen;
  switch (state.currentScreen) {
    case 'landing':
      screen = <Landing />;
      break;
    case 'questionnaire':
      screen = <Questionnaire />;
      break;
    case 'loading':
      screen = (
        <AnalysisLoading
          progress={progress}
          error={state.error || error}
          onRetry={handleRetry}
        />
      );
      break;
    case 'results':
      screen = <Results />;
      break;
    default:
      screen = <Landing />;
  }

  return (
    <>
      {screen}
      {showChaiWidget && <ChaiWidget />}
    </>
  );
}
