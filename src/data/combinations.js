export const COMBINATION_PATTERNS = [
  {
    id: 'engagement-loop',
    name: 'Engagement Loop',
    types: ['personalization', 'suggestive', 'analytical'],
    description: 'Analytics informs personalization, personalization improves suggestions, suggestions generate data for analytics.',
    examples: ['Netflix', 'Spotify', 'Amazon'],
  },
  {
    id: 'human-ai-collaboration',
    name: 'Human-AI Collaboration',
    types: ['creative', 'assistive'],
    description: "AI's generative capacity combined with human quality control. The best of both worlds.",
    examples: ['Adobe Firefly', 'GitHub Copilot'],
  },
  {
    id: 'silent-guardian',
    name: 'Silent Guardian',
    types: ['monitoring', 'autonomous'],
    description: 'AI works silently until something valuable to surface, then acts or alerts.',
    examples: ['Smart home security', 'Spam filters', 'Fraud detection'],
  },
  {
    id: 'guided-exploration',
    name: 'Guided Exploration',
    types: ['predictive', 'conversational'],
    description: 'Narrows possibility space before engaging in dialogue.',
    examples: ['Google Search', 'ChatGPT with tools'],
  },
  {
    id: 'progressive-disclosure',
    name: 'Progressive Disclosure',
    types: ['assistive', 'suggestive'],
    description: 'Sidebar for complex tasks + inline suggestions for quick actions.',
    examples: ['Microsoft Copilot', 'Notion AI'],
  },
  {
    id: 'decision-support',
    name: 'Decision Support',
    types: ['advisory', 'analytical'],
    description: 'Data analysis feeds into structured recommendations.',
    examples: ['BI dashboards with recommendation engines'],
  },
  {
    id: 'proactive-operations',
    name: 'Proactive Operations',
    types: ['monitoring', 'predictive', 'autonomous'],
    description: 'Monitor state → predict issues → auto-remediate.',
    examples: ['Cloud infrastructure management', 'Predictive maintenance'],
  },
];

export const ANTI_PATTERNS = [
  {
    id: 'ai-everywhere',
    name: 'AI Everywhere',
    description: 'Adding AI buttons throughout without addressing user needs. Warn when user\'s problem is too vague or broad.',
    trigger: "User's problem is too vague or broad",
  },
  {
    id: 'full-autonomy-no-oversight',
    name: 'Full Autonomy Without Oversight',
    description: 'Deploying autonomous AI for high-stakes decisions without human checkpoints.',
    trigger: 'User selects high risk + autonomous',
  },
  {
    id: 'chat-only-transactional',
    name: 'Chat-Only for Transactional Tasks',
    description: 'Forcing conversational UI when a simple GUI would be faster.',
    trigger: 'Task is simple and repetitive',
  },
  {
    id: 'generative-precision',
    name: 'Generative AI Precision Anti-Pattern',
    description: 'Using probabilistic LLMs for tasks requiring 100% accuracy (calculations, compliance).',
    trigger: 'User needs deterministic output',
  },
  {
    id: 'personalization-no-transparency',
    name: 'Personalization Without Transparency',
    description: 'Invisible AI decisions with no user controls or explanation.',
    trigger: 'Personalization recommended without user agency considerations',
  },
];

export const INDUSTRY_COMBINATIONS = {
  healthcare: {
    primary: ['advisory', 'assistive'],
    reason: 'Errors can be fatal; regulation demands explainability',
  },
  finance: {
    primary: ['predictive', 'advisory'],
    reason: 'Time-critical decisions; requires audit trails and human oversight',
  },
  ecommerce: {
    primary: ['personalization', 'suggestive'],
    reason: 'Low risk per decision; massive catalogs; user has final say',
  },
  media: {
    primary: ['personalization', 'predictive', 'suggestive'],
    reason: 'Engagement-driven; enormous catalogs; feedback loops',
  },
  education: {
    primary: ['assistive', 'personalization', 'advisory'],
    reason: 'Adaptive learning paths + skill gap identification',
  },
  manufacturing: {
    primary: ['monitoring', 'predictive', 'autonomous'],
    reason: 'Real-time monitoring + forecasting + automated response',
  },
  saas: {
    primary: ['suggestive', 'assistive', 'analytical'],
    reason: 'Productivity acceleration + workflow enhancement + data insights',
  },
  cybersecurity: {
    primary: ['monitoring', 'autonomous'],
    reason: 'Volume exceeds human capacity; speed is critical',
  },
  transportation: {
    primary: ['predictive', 'monitoring', 'autonomous'],
    reason: 'Route optimization + real-time tracking + automated dispatch',
  },
};
