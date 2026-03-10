export const SECTIONS = [
  {
    id: 'business-context',
    title: 'Business Context',
    description: 'Tell us about your product and domain',
    questions: [
      {
        id: 'industry',
        number: 1,
        text: 'What industry or domain is your product in?',
        type: 'single-select',
        required: true,
        answerKey: 'industry',
        options: [
          { value: 'healthcare', label: 'Healthcare' },
          { value: 'finance', label: 'Finance & Banking' },
          { value: 'ecommerce', label: 'E-commerce & Retail' },
          { value: 'media', label: 'Media & Entertainment' },
          { value: 'education', label: 'Education' },
          { value: 'manufacturing', label: 'Manufacturing & Operations' },
          { value: 'saas', label: 'SaaS & Productivity' },
          { value: 'cybersecurity', label: 'Cybersecurity' },
          { value: 'transportation', label: 'Transportation & Logistics' },
          { value: 'other', label: 'Other', hasTextField: true },
        ],
      },
      {
        id: 'problemDescription',
        number: 2,
        text: 'What is the primary business problem you\'re trying to solve with AI?',
        type: 'textarea',
        required: true,
        answerKey: 'problemDescription',
        placeholder: 'Describe the specific problem, not the solution...',
        helperText: 'For example: "Our support team can\'t handle ticket volume during peak hours" rather than "We need a chatbot"',
        minLength: 20,
        maxLength: 2000,
      },
      {
        id: 'riskLevel',
        number: 3,
        text: 'What is the risk level if AI makes a wrong decision in your context?',
        type: 'single-select',
        required: true,
        answerKey: 'riskLevel',
        displayAs: 'scale',
        options: [
          { value: 'critical', label: 'Critical', description: 'Safety, health, legal liability at stake' },
          { value: 'high', label: 'High', description: 'Significant financial or operational impact' },
          { value: 'medium', label: 'Medium', description: 'Measurable business impact but recoverable' },
          { value: 'low', label: 'Low', description: 'Minor inconvenience, easily correctable' },
        ],
      },
    ],
  },
  {
    id: 'task-data-goals',
    title: 'Task, Data & Goals',
    description: 'Help us understand the work and what you\'re optimizing for',
    questions: [
      {
        id: 'taskType',
        number: 4,
        text: 'How would you describe the decisions or tasks AI would handle?',
        type: 'single-select',
        required: true,
        answerKey: 'taskType',
        options: [
          { value: 'repetitive-rules', label: 'Repetitive with clear rules', description: 'Same input → same output' },
          { value: 'pattern-based', label: 'Pattern-based with some variation' },
          { value: 'creative-open', label: 'Creative or open-ended', description: 'Multiple valid outcomes' },
          { value: 'mixed', label: 'A mix of the above' },
        ],
      },
      {
        id: 'dataAvailability',
        number: 5,
        text: 'How much relevant data do you currently have?',
        type: 'single-select',
        required: true,
        answerKey: 'dataAvailability',
        options: [
          { value: 'rich', label: 'Rich', description: 'Years of history, millions of data points' },
          { value: 'moderate', label: 'Moderate', description: 'Some historical data, growing' },
          { value: 'limited', label: 'Limited', description: 'New product or category, small dataset' },
          { value: 'unsure', label: 'I\'m not sure' },
        ],
      },
      {
        id: 'primaryGoals',
        number: 6,
        text: 'What is your primary goal for the AI feature?',
        subtitle: 'Select up to 2',
        type: 'multi-select',
        required: true,
        answerKey: 'primaryGoals',
        maxSelections: 2,
        options: [
          { value: 'reduce-costs', label: 'Reduce costs / operational efficiency' },
          { value: 'increase-engagement', label: 'Increase user engagement / retention' },
          { value: 'improve-decisions', label: 'Improve decision quality / accuracy' },
          { value: 'accelerate-workflows', label: 'Accelerate workflows / save time' },
          { value: 'scale-capacity', label: 'Scale beyond human capacity' },
          { value: 'new-capabilities', label: 'Create new capabilities that didn\'t exist before' },
          { value: 'improve-ux', label: 'Improve user experience / satisfaction' },
        ],
      },
    ],
  },
];

export const ALL_QUESTIONS = SECTIONS.flatMap(s => s.questions);
export const TOTAL_QUESTIONS = ALL_QUESTIONS.length;

export const getQuestionByIndex = (index) => ALL_QUESTIONS[index];

export const getSectionForQuestion = (index) => {
  let count = 0;
  for (const section of SECTIONS) {
    if (index < count + section.questions.length) {
      return section;
    }
    count += section.questions.length;
  }
  return SECTIONS[SECTIONS.length - 1];
};

export const getSectionProgress = (index) => {
  let count = 0;
  for (let i = 0; i < SECTIONS.length; i++) {
    const sectionEnd = count + SECTIONS[i].questions.length;
    if (index < sectionEnd) {
      return {
        sectionIndex: i,
        questionInSection: index - count,
        totalInSection: SECTIONS[i].questions.length,
      };
    }
    count = sectionEnd;
  }
  return { sectionIndex: SECTIONS.length - 1, questionInSection: 0, totalInSection: 1 };
};
