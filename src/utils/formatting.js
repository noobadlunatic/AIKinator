export function formatDate(isoString) {
  return new Date(isoString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function formatDateShort(isoString) {
  return new Date(isoString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function truncateText(text, maxLength = 100) {
  if (!text || text.length <= maxLength) return text;
  return text.slice(0, maxLength).trim() + '...';
}

export function getConfidenceColor(score) {
  if (score >= 80) return 'var(--color-confidence-high)';
  if (score >= 60) return 'var(--color-confidence-mid)';
  return 'var(--color-confidence-low)';
}

export function getConfidenceLabel(score) {
  if (score >= 80) return 'High';
  if (score >= 60) return 'Medium';
  return 'Low';
}

export function getConfidenceColorClass(score) {
  if (score >= 80) return 'text-confidence-high';
  if (score >= 60) return 'text-confidence-mid';
  return 'text-confidence-low';
}

const INDUSTRY_LABELS = {
  healthcare: 'Healthcare',
  finance: 'Finance & Banking',
  ecommerce: 'E-commerce & Retail',
  media: 'Media & Entertainment',
  education: 'Education',
  manufacturing: 'Manufacturing & Operations',
  saas: 'SaaS & Productivity',
  cybersecurity: 'Cybersecurity',
  transportation: 'Transportation & Logistics',
};

export function formatIndustryLabel(value) {
  return INDUSTRY_LABELS[value] || value;
}

const GOAL_LABELS = {
  'reduce-costs': 'Reduce costs / operational efficiency',
  'increase-engagement': 'Increase engagement / retention',
  'improve-decisions': 'Improve decision quality / accuracy',
  'accelerate-workflows': 'Accelerate workflows / save time',
  'scale-capacity': 'Scale beyond human capacity',
  'new-capabilities': 'Create new capabilities',
  'improve-ux': 'Improve user experience',
};

export function formatGoalLabel(value) {
  return GOAL_LABELS[value] || value;
}

const RISK_LABELS = {
  critical: 'Critical risk',
  high: 'High risk',
  medium: 'Medium risk',
  low: 'Low risk',
};

export function formatRiskLabel(value) {
  return RISK_LABELS[value] || value;
}
