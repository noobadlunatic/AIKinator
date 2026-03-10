import { createContext, useContext, useReducer, useCallback } from 'react';

const AssessmentContext = createContext(null);

const initialState = {
  currentScreen: 'landing', // 'landing' | 'questionnaire' | 'loading' | 'results'
  currentQuestionIndex: 0,
  answers: {},
  journeyMap: null,
  whyNot: null,
  error: null,
  isLoading: false,
  assessmentId: null,
};

const actions = {
  SET_ANSWER: 'SET_ANSWER',
  NEXT_QUESTION: 'NEXT_QUESTION',
  PREV_QUESTION: 'PREV_QUESTION',
  GO_TO_QUESTION: 'GO_TO_QUESTION',
  SET_SCREEN: 'SET_SCREEN',
  START_ANALYSIS: 'START_ANALYSIS',
  SET_RESULTS: 'SET_RESULTS',
  SET_ERROR: 'SET_ERROR',
  RESET: 'RESET',
  LOAD_ASSESSMENT: 'LOAD_ASSESSMENT',
  SET_ASSESSMENT_ID: 'SET_ASSESSMENT_ID',
};

function assessmentReducer(state, action) {
  switch (action.type) {
    case actions.SET_ANSWER:
      return {
        ...state,
        answers: { ...state.answers, [action.key]: action.value },
      };

    case actions.NEXT_QUESTION:
      return {
        ...state,
        currentQuestionIndex: state.currentQuestionIndex + 1,
      };

    case actions.PREV_QUESTION:
      return {
        ...state,
        currentQuestionIndex: Math.max(0, state.currentQuestionIndex - 1),
      };

    case actions.GO_TO_QUESTION:
      return {
        ...state,
        currentQuestionIndex: action.index,
        currentScreen: 'questionnaire',
      };

    case actions.SET_SCREEN:
      return {
        ...state,
        currentScreen: action.screen,
      };

    case actions.START_ANALYSIS:
      return {
        ...state,
        currentScreen: 'loading',
        isLoading: true,
        error: null,
        journeyMap: null,
        whyNot: null,
      };

    case actions.SET_RESULTS:
      return {
        ...state,
        currentScreen: 'results',
        isLoading: false,
        journeyMap: action.journeyMap,
        whyNot: action.whyNot,
      };

    case actions.SET_ERROR:
      return {
        ...state,
        isLoading: false,
        error: action.error,
      };

    case actions.RESET:
      return { ...initialState };

    case actions.LOAD_ASSESSMENT:
      return {
        ...state,
        answers: action.assessment.answers,
        journeyMap: action.assessment.journeyMap,
        whyNot: action.assessment.whyNot,
        assessmentId: action.assessment.id,
        currentScreen: 'results',
      };

    case actions.SET_ASSESSMENT_ID:
      return {
        ...state,
        assessmentId: action.id,
      };

    default:
      return state;
  }
}

export function AssessmentProvider({ children }) {
  const [state, dispatch] = useReducer(assessmentReducer, initialState);

  const setAnswer = useCallback((key, value) => {
    dispatch({ type: actions.SET_ANSWER, key, value });
  }, []);

  const nextQuestion = useCallback(() => {
    dispatch({ type: actions.NEXT_QUESTION });
  }, []);

  const prevQuestion = useCallback(() => {
    dispatch({ type: actions.PREV_QUESTION });
  }, []);

  const goToQuestion = useCallback((index) => {
    dispatch({ type: actions.GO_TO_QUESTION, index });
  }, []);

  const setScreen = useCallback((screen) => {
    dispatch({ type: actions.SET_SCREEN, screen });
  }, []);

  const startAnalysis = useCallback(() => {
    dispatch({ type: actions.START_ANALYSIS });
  }, []);

  const setResults = useCallback((results) => {
    dispatch({
      type: actions.SET_RESULTS,
      journeyMap: results.journeyMap,
      whyNot: results.whyNot,
    });
  }, []);

  const setError = useCallback((error) => {
    dispatch({ type: actions.SET_ERROR, error });
  }, []);

  const reset = useCallback(() => {
    dispatch({ type: actions.RESET });
  }, []);

  const loadAssessment = useCallback((assessment) => {
    dispatch({ type: actions.LOAD_ASSESSMENT, assessment });
  }, []);

  const setAssessmentId = useCallback((id) => {
    dispatch({ type: actions.SET_ASSESSMENT_ID, id });
  }, []);

  const value = {
    state,
    setAnswer,
    nextQuestion,
    prevQuestion,
    goToQuestion,
    setScreen,
    startAnalysis,
    setResults,
    setError,
    reset,
    loadAssessment,
    setAssessmentId,
  };

  return (
    <AssessmentContext.Provider value={value}>
      {children}
    </AssessmentContext.Provider>
  );
}

export function useAssessment() {
  const context = useContext(AssessmentContext);
  if (!context) {
    throw new Error('useAssessment must be used within an AssessmentProvider');
  }
  return context;
}
