import { useState, useCallback, useRef } from 'react';
import { getRecommendation } from '../services/ai';

export function useAIRecommendation() {
  const [status, setStatus] = useState('idle'); // 'idle' | 'loading' | 'success' | 'error'
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const intervalRef = useRef(null);
  const abortControllerRef = useRef(null);

  const analyze = useCallback(async (answers) => {
    // Abort any previous in-flight request
    abortControllerRef.current?.abort();

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    setStatus('loading');
    setError(null);
    setResult(null);
    setProgress(0);

    // Simulate staged progress for loading animation
    intervalRef.current = setInterval(() => {
      setProgress(prev => {
        if (prev >= 90) {
          clearInterval(intervalRef.current);
          return 90;
        }
        return prev + Math.random() * 8 + 2;
      });
    }, 300);

    try {
      const data = await getRecommendation(answers, { signal: abortController.signal });
      if (abortController.signal.aborted) return null;
      clearInterval(intervalRef.current);
      setProgress(100);
      setResult(data);
      setStatus('success');
      return data;
    } catch (err) {
      clearInterval(intervalRef.current);
      if (abortController.signal.aborted) return null;
      setProgress(0);
      setError(err.message || 'An unexpected error occurred.');
      setStatus('error');
      return null;
    }
  }, []);

  const retry = useCallback((answers) => {
    return analyze(answers);
  }, [analyze]);

  return { status, progress, error, result, analyze, retry };
}
