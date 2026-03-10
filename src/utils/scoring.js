// Pre-AI heuristic scoring based on PRD Section 5 mapping logic.
// Used for loading screen messages and as a fallback if AI fails.

export function computePreScores(answers) {
  const scores = {
    advisory: 0,
    suggestive: 0,
    autonomous: 0,
    creative: 0,
    predictive: 0,
    conversational: 0,
    assistive: 0,
    monitoring: 0,
    personalization: 0,
    analytical: 0,
  };

  // 1. Risk Level (Primary Filter)
  if (answers.riskLevel === 'critical' || answers.riskLevel === 'high') {
    scores.advisory += 3;
    scores.assistive += 3;
    scores.monitoring += 2;
    scores.autonomous -= 2;
  } else if (answers.riskLevel === 'medium') {
    scores.advisory += 1;
    scores.suggestive += 1;
    scores.assistive += 1;
  } else if (answers.riskLevel === 'low') {
    scores.autonomous += 2;
    scores.personalization += 2;
    scores.suggestive += 2;
  }

  // 2. User Expertise
  if (answers.endUsers === 'domain-experts') {
    scores.assistive += 2;
    scores.analytical += 2;
    scores.advisory += 1;
  } else if (answers.endUsers === 'general-consumers') {
    scores.suggestive += 2;
    scores.conversational += 2;
    scores.personalization += 2;
  } else if (answers.endUsers === 'mixed-audience') {
    scores.suggestive += 1;
    scores.assistive += 1;
    scores.conversational += 1;
  }

  // 3. Data Availability
  if (answers.dataAvailability === 'rich') {
    scores.personalization += 3;
    scores.predictive += 3;
    scores.analytical += 2;
  } else if (answers.dataAvailability === 'moderate') {
    scores.advisory += 1;
    scores.suggestive += 1;
    scores.conversational += 1;
  } else if (answers.dataAvailability === 'limited') {
    scores.advisory += 2;
    scores.creative += 2;
    scores.assistive += 1;
  }

  // 4. Task Predictability
  if (answers.taskType === 'repetitive-rules') {
    scores.autonomous += 3;
    scores.monitoring += 2;
  } else if (answers.taskType === 'pattern-based') {
    scores.suggestive += 2;
    scores.predictive += 2;
    scores.personalization += 1;
  } else if (answers.taskType === 'creative-open') {
    scores.creative += 3;
    scores.advisory += 2;
    scores.assistive += 2;
  }

  // 5. Decision Frequency & Speed
  if (answers.interactionFrequency === 'continuous') {
    scores.autonomous += 2;
    scores.monitoring += 3;
    scores.personalization += 2;
  } else if (answers.interactionFrequency === 'multiple-daily') {
    scores.suggestive += 2;
    scores.conversational += 1;
  } else if (answers.interactionFrequency === 'occasionally') {
    scores.advisory += 2;
    scores.analytical += 2;
  }

  // 6. Regulatory Requirements
  if (answers.regulatoryRequirements === 'heavy') {
    scores.advisory += 3;
    scores.assistive += 2;
    scores.autonomous -= 2;
  } else if (answers.regulatoryRequirements === 'moderate') {
    scores.assistive += 1;
  }

  // 7. Explainability
  if (answers.explainabilityImportance === 'essential') {
    scores.advisory += 2;
    scores.analytical += 1;
    scores.autonomous -= 1;
  } else if (answers.explainabilityImportance === 'not-important') {
    scores.autonomous += 1;
    scores.personalization += 1;
    scores.monitoring += 1;
  }

  // 8. Goals
  const goals = answers.primaryGoals || [];
  if (goals.includes('reduce-costs')) {
    scores.autonomous += 2;
    scores.monitoring += 1;
  }
  if (goals.includes('increase-engagement')) {
    scores.personalization += 2;
    scores.suggestive += 2;
  }
  if (goals.includes('improve-decisions')) {
    scores.advisory += 2;
    scores.analytical += 2;
    scores.predictive += 1;
  }
  if (goals.includes('accelerate-workflows')) {
    scores.suggestive += 2;
    scores.assistive += 2;
  }
  if (goals.includes('scale-capacity')) {
    scores.autonomous += 2;
    scores.monitoring += 1;
  }
  if (goals.includes('new-capabilities')) {
    scores.creative += 2;
    scores.conversational += 1;
  }
  if (goals.includes('improve-ux')) {
    scores.suggestive += 1;
    scores.personalization += 1;
    scores.conversational += 1;
  }

  return scores;
}

export function getTopTypes(scores, count = 4) {
  return Object.entries(scores)
    .sort(([, a], [, b]) => b - a)
    .slice(0, count)
    .map(([type, score]) => ({ type, score }));
}
