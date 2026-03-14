import { track } from '@vercel/analytics';

/**
 * Track when a user exits a screen.
 * @param {string} screen - Screen name (landing, questionnaire, loading, results)
 * @param {number} durationMs - Time spent on screen in milliseconds
 */
export function trackScreenExit(screen, durationMs) {
  track('screen_exit', {
    screen,
    duration_ms: durationMs,
  });
}

/**
 * Track assessment form submission with answers and timings.
 * @param {Object} answers - All 6 answers from the questionnaire
 * @param {Object} timings - { totalTime, perQuestion: { answerKey: ms } }
 */
export function trackAssessmentSubmitted(answers, timings) {
  track('assessment_submitted', {
    industry: answers.industry || '',
    problem_description: answers.problemDescription || '',
    risk_level: answers.riskLevel || '',
    task_type: answers.taskType || '',
    data_availability: answers.dataAvailability || '',
    primary_goals: (answers.primaryGoals || []).join(', '),
    total_time_ms: timings.totalTime,
    // Store per-question timings as JSON string to avoid deep nesting
    per_question_timings_json: JSON.stringify(timings.perQuestion || {}),
  });
}

/**
 * Track when analysis begins (AI request initiated).
 */
export function trackAnalysisStarted() {
  track('analysis_started');
}

/**
 * Track when analysis completes successfully.
 * @param {number} durationMs - Time spent waiting for AI response
 */
export function trackAnalysisCompleted(durationMs) {
  track('analysis_completed', {
    duration_ms: durationMs,
  });
}

/**
 * Track when analysis fails.
 * @param {string} error - Error message
 */
export function trackAnalysisFailed(error) {
  track('analysis_failed', {
    error: error || 'Unknown error',
  });
}
