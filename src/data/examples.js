export const EXAMPLES_BY_TYPE = {
  advisory: [
    { product: 'Vanguard Digital Advisor', description: 'Portfolio recommendations with explainability', stats: '$206B+ AUM' },
    { product: 'Viz.ai', description: 'FDA-cleared stroke detection that alerts specialists', stats: 'FDA-cleared' },
    { product: 'Google Maps', description: 'Multiple route options with time/traffic data' },
  ],
  suggestive: [
    { product: 'Gmail Smart Compose', description: 'Predictive text accepted with Tab' },
    { product: 'Grammarly', description: 'Real-time grammar/tone suggestions', stats: '1M+ apps' },
    { product: 'GitHub Copilot', description: 'Ghost-text code suggestions', stats: '~55% productivity increase' },
    { product: 'Spotify Discover Weekly', description: 'Personalized playlist suggestions', stats: '5B+ streams annually' },
  ],
  autonomous: [
    { product: 'Tesla Autopilot', description: 'Neural networks for highway driving', stats: 'SAE Level 2' },
    { product: 'Email Spam Filters', description: 'Classify billions of messages automatically' },
    { product: 'GitHub Copilot Coding Agent', description: 'Implements features and opens PRs' },
  ],
  creative: [
    { product: 'ChatGPT', description: 'General-purpose text generation', stats: '100M users in 2 months' },
    { product: 'Midjourney', description: 'Artistic images from text prompts' },
    { product: 'Adobe Firefly', description: 'Generative AI in Photoshop', stats: 'Trained on licensed content' },
    { product: 'Canva Magic Studio', description: 'Design democratization for non-designers' },
  ],
  predictive: [
    { product: 'Salesforce Einstein', description: 'Lead conversion probability with explanations' },
    { product: 'Netflix', description: 'Retention & thumbnail click predictions', stats: 'Saves ~$1B/year' },
    { product: 'GE Digital', description: 'Industrial predictive maintenance', stats: '70%+ downtime reduction' },
  ],
  conversational: [
    { product: 'Bank of America Erica', description: 'Banking assistant', stats: '3B+ interactions, 50M+ users' },
    { product: 'Amazon Alexa', description: 'Voice-based task completion' },
    { product: 'MakeMyTrip Myra', description: 'Full travel bookings within chat' },
  ],
  assistive: [
    { product: 'Adobe Photoshop', description: 'Generative Fill, Generative Expand, AI Assistant' },
    { product: 'Notion AI', description: 'Summarize, action items in workspace context', stats: '$8-10/month' },
    { product: 'AI-powered Hearing Aids', description: 'Sound environment analysis + preference learning', stats: 'Starkey/Oticon' },
  ],
  monitoring: [
    { product: 'Apple Watch Fall Detection', description: 'Auto-calls emergency if immobile after fall' },
    { product: 'Ring Single Event Alert', description: 'Consolidates motion events into one alert' },
    { product: 'Microsoft Sentinel', description: 'Security behavior analytics', stats: '5,000+ alerts/day reduced' },
  ],
  personalization: [
    { product: 'Netflix', description: 'Personalizes content ranking AND thumbnails', stats: '80%+ content via personalization' },
    { product: 'TikTok For You Page', description: 'Adjusts based on scroll, linger, rewatch, shares' },
    { product: 'Spotify Daylist', description: 'Changes dynamically throughout the day' },
  ],
  analytical: [
    { product: 'Power BI Copilot', description: 'Natural language queries → auto-generated reports' },
    { product: 'Google Analytics 4 Intelligence', description: 'Surfaces notable changes automatically' },
    { product: 'ThoughtSpot', description: 'Google-like search bar for data queries' },
  ],
};

export const INDUSTRY_EXAMPLES = {
  healthcare: {
    primaryTypes: ['advisory', 'assistive'],
    context: 'Healthcare diagnosis',
    reason: 'Errors fatal; regulation demands explainability',
  },
  finance: {
    primaryTypes: ['predictive', 'autonomous'],
    context: 'Financial trading',
    reason: 'Time-critical; requires scale; demands audit trails',
  },
  ecommerce: {
    primaryTypes: ['personalization', 'suggestive'],
    context: 'E-commerce product discovery',
    reason: 'Low risk per decision; massive catalogs; user has final say',
  },
  media: {
    primaryTypes: ['personalization', 'predictive', 'suggestive'],
    context: 'Content streaming/media',
    reason: 'Engagement-driven; enormous catalogs; feedback loops',
  },
  education: {
    primaryTypes: ['assistive', 'personalization', 'advisory'],
    context: 'Education/Learning',
    reason: 'Adaptive learning paths + skill gap identification',
  },
  manufacturing: {
    primaryTypes: ['monitoring', 'predictive', 'autonomous'],
    context: 'Manufacturing/Operations',
    reason: 'Real-time monitoring + forecasting + automated response',
  },
  saas: {
    primaryTypes: ['assistive', 'suggestive', 'analytical'],
    context: 'SaaS & Productivity',
    reason: 'Workflow acceleration + inline assistance + data insights',
  },
  cybersecurity: {
    primaryTypes: ['monitoring', 'autonomous'],
    context: 'Cybersecurity',
    reason: 'Volume exceeds human capacity; speed critical',
  },
  transportation: {
    primaryTypes: ['predictive', 'monitoring', 'autonomous'],
    context: 'Transportation & Logistics',
    reason: 'Route optimization + real-time tracking + automated dispatch',
  },
};
