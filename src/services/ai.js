import { TAXONOMY } from '../data/taxonomy';
import { COMBINATION_PATTERNS, ANTI_PATTERNS } from '../data/combinations';

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const MODEL = 'gemini-2.5-flash-lite';
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`;

// Client-side rate limiter: max 7 requests per 60 seconds
const MAX_REQUESTS_PER_MINUTE = 7;
const RATE_WINDOW_MS = 60000;
const requestTimestamps = [];

function waitForRateLimit(signal) {
  // Remove timestamps older than the window
  const now = Date.now();
  while (requestTimestamps.length > 0 && requestTimestamps[0] <= now - RATE_WINDOW_MS) {
    requestTimestamps.shift();
  }

  if (requestTimestamps.length < MAX_REQUESTS_PER_MINUTE) {
    requestTimestamps.push(now);
    return Promise.resolve();
  }

  // Wait until the oldest request falls outside the window
  const waitMs = requestTimestamps[0] + RATE_WINDOW_MS - now + 100; // +100ms buffer
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      requestTimestamps.shift();
      requestTimestamps.push(Date.now());
      resolve();
    }, waitMs);
    if (signal) {
      signal.addEventListener('abort', () => {
        clearTimeout(timer);
        reject(new DOMException('Aborted', 'AbortError'));
      }, { once: true });
    }
  });
}

function buildSystemPrompt() {
  const taxonomySummary = TAXONOMY.map(t =>
    `${t.typeNumber}. ${t.name} (id: "${t.id}") — ${t.definition.slice(0, 150)}... Autonomy: ${t.autonomyLevel.label}. Data needs: ${t.dataRequirements}. Complexity: ${t.implementationComplexity}.`
  ).join('\n');

  const combinationsSummary = COMBINATION_PATTERNS.map(p =>
    `- ${p.name}: ${p.types.join(' + ')} — ${p.description}`
  ).join('\n');

  const antiPatternsSummary = ANTI_PATTERNS.map(a =>
    `- ${a.name}: ${a.description}`
  ).join('\n');

  return `You are an AI-UX intervention expert. Your job is to analyze a user's business context and design an optimal AI user journey — a sequence of stages where different AI-UX intervention types are applied across the user's product workflow.

You have deep knowledge of the following 10 AI-UX intervention types:
${taxonomySummary}

PROVEN COMBINATION PATTERNS:
${combinationsSummary}

ANTI-PATTERNS TO WARN AGAINST:
${antiPatternsSummary}

THE AUTONOMY SPECTRUM (Knight First Amendment Institute Framework 2025):
- L1 – Operator: User drives, AI supports on demand
- L2 – Collaborator: User and AI take turns driving
- L3 – Consultant: AI drives, user provides input when asked
- L4 – Approver: AI acts, user reviews and approves
- L5 – Observer: AI acts autonomously, user monitors

KEY PRINCIPLES:
- Design a user journey map with 4-7 nodes showing how AI interventions map to stages of the user's product workflow
- Each node represents a stage where a specific AI intervention type applies — nodes can use different types or repeat types at different stages
- Each node should have comprehensive data: confidence score, detailed description, context fit, real-world examples, autonomy level with human/AI roles, detailed pros/cons with mitigations, trust considerations, and implementation details
- Risk level is the PRIMARY filter: high-stakes domains MUST include human-in-the-loop patterns
- Consider data availability as a hard constraint
- Include specific real-world examples, preferring the user's industry
- Flag relevant anti-patterns to avoid
- Be opinionated — don't hedge everything. Give clear, actionable recommendations.

RESPONSE FORMAT:
You MUST respond in valid JSON matching this exact structure:

{
  "journeyMap": {
    "title": "Recommended AI Journey",
    "description": "High-level journey description explaining the overall AI strategy",
    "nodes": [
      {
        "id": "node-1",
        "label": "Stage Name",
        "interventionType": "advisory",
        "confidenceScore": 87,
        "summary": "One-line summary of how AI helps at this stage",
        "description": "2-3 paragraphs explaining what this intervention does at this stage, how it works, and why it matters",
        "contextFit": "Why this intervention fits the user's specific context at this stage",
        "examples": [
          {
            "product": "Product Name",
            "description": "How it uses this intervention",
            "relevance": "Why this is relevant to the user's context"
          }
        ],
        "autonomyLevel": {
          "level": "L2",
          "label": "Collaborator",
          "description": "User and AI take turns driving",
          "humanRole": "What the human does at this stage",
          "aiRole": "What the AI does at this stage"
        },
        "pros": [
          {
            "point": "Short pro statement",
            "detail": "Expanded explanation specific to user's context"
          }
        ],
        "cons": [
          {
            "point": "Short con statement",
            "detail": "Expanded explanation",
            "mitigation": "How to mitigate this risk"
          }
        ],
        "trustConsiderations": ["Trust point 1", "Trust point 2"],
        "implementation": {
          "complexity": "Medium",
          "requirements": ["Requirement 1", "Requirement 2"],
          "dataNeeds": "What data is needed",
          "teamNeeds": "What team capabilities are required",
          "timelineAlignment": "General timeline and phasing recommendation"
        }
      }
    ],
    "edges": [
      { "from": "node-1", "to": "node-2", "label": "optional edge label" }
    ]
  },
  "whyNot": [
    {
      "interventionType": "Autonomous AI",
      "reason": "Reason this type was not recommended"
    }
  ]
}`;
}

function buildUserPrompt(answers) {
  const goals = Array.isArray(answers.primaryGoals)
    ? answers.primaryGoals.join(', ')
    : answers.primaryGoals || 'Not specified';

  return `Based on the following business context, design an AI user journey map with 4-7 stages:

BUSINESS CONTEXT:
- Industry: ${answers.industry || 'Not specified'}
- Problem: ${answers.problemDescription || 'Not specified'}
- Risk Level: ${answers.riskLevel || 'Not specified'}
- Task Type: ${answers.taskType || 'Not specified'}
- Data Availability: ${answers.dataAvailability || 'Not specified'}
- Primary Goals: ${goals}

Remember:
- Design a user journey map with 4-7 nodes showing how AI interventions map to stages of the user's workflow
- Each node should have a confidence score (0-100%), detailed context fit, 1-2 real-world examples, full autonomy level with human/AI roles, and detailed pros/cons with mitigations
- Include trust considerations and implementation details per node
- Be specific about WHY each intervention fits at each stage for their stated problem and context
- Flag any anti-patterns they should avoid in the whyNot section
- Respond in valid JSON only — no markdown, no backticks, no preamble`;
}

function parseRecommendation(text) {
  // Try 1: Direct JSON parse
  try {
    return JSON.parse(text);
  } catch {
    // continue
  }

  // Try 2: Extract from markdown code block
  const codeBlockMatch = text.match(/```(?:json)?\s*\n?([\s\S]*?)\n?\s*```/);
  if (codeBlockMatch) {
    try {
      return JSON.parse(codeBlockMatch[1]);
    } catch {
      // continue
    }
  }

  // Try 3: Find first { to last }
  const firstBrace = text.indexOf('{');
  const lastBrace = text.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    try {
      return JSON.parse(text.slice(firstBrace, lastBrace + 1));
    } catch {
      // continue
    }
  }

  throw new Error('Failed to parse AI response as JSON');
}

function validateResponse(data) {
  if (!data.journeyMap || !data.journeyMap.nodes || !Array.isArray(data.journeyMap.nodes) || data.journeyMap.nodes.length === 0) {
    throw new Error('No journey map found in AI response');
  }

  // Validate and provide defaults for each node
  data.journeyMap.nodes = data.journeyMap.nodes.map((node) => ({
    id: node.id || `node-${Math.random().toString(36).slice(2, 8)}`,
    label: node.label || 'AI Stage',
    interventionType: node.interventionType || 'advisory',
    confidenceScore: Math.min(100, Math.max(0, node.confidenceScore || 50)),
    summary: node.summary || '',
    description: node.description || '',
    contextFit: node.contextFit || '',
    examples: Array.isArray(node.examples) ? node.examples : [],
    autonomyLevel: typeof node.autonomyLevel === 'object'
      ? node.autonomyLevel
      : { level: node.autonomyLevel || 'L2', label: 'Collaborator', description: '', humanRole: '', aiRole: '' },
    pros: Array.isArray(node.pros) ? node.pros : [],
    cons: Array.isArray(node.cons) ? node.cons : [],
    trustConsiderations: Array.isArray(node.trustConsiderations) ? node.trustConsiderations : [],
    implementation: typeof node.implementation === 'object'
      ? node.implementation
      : { complexity: 'Medium', requirements: [], dataNeeds: '', teamNeeds: '', timelineAlignment: node.implementation || '' },
  }));

  if (!data.journeyMap.title) data.journeyMap.title = 'Recommended AI Journey';
  if (!data.journeyMap.description) data.journeyMap.description = '';
  if (!data.journeyMap.edges) data.journeyMap.edges = [];
  if (!data.whyNot) data.whyNot = [];

  return data;
}

export async function getRecommendation(answers, { signal } = {}) {
  if (!API_KEY) {
    throw new Error('API key not configured. Please add VITE_GEMINI_API_KEY to your .env file.');
  }

  const MAX_RETRIES = 3;
  const body = JSON.stringify({
    contents: [
      {
        role: 'user',
        parts: [{ text: buildUserPrompt(answers) }],
      },
    ],
    systemInstruction: {
      parts: [{ text: buildSystemPrompt() }],
    },
    generationConfig: {
      responseMimeType: 'application/json',
      temperature: 0.7,
      maxOutputTokens: 12288,
    },
  });

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    if (signal?.aborted) {
      throw new DOMException('Aborted', 'AbortError');
    }

    // Wait for rate limit slot before each attempt
    await waitForRateLimit(signal);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);

    // Forward external abort to this attempt's controller
    if (signal) {
      signal.addEventListener('abort', () => controller.abort(), { once: true });
    }

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body,
      });

      clearTimeout(timeout);

      if (!response.ok) {
        const errorBody = await response.text().catch(() => '');

        if (response.status === 429) {
          if (attempt < MAX_RETRIES) {
            // Exponential backoff: 2s, 4s, 8s + jitter
            const delay = 2000 * Math.pow(2, attempt) + Math.random() * 500;
            await new Promise((resolve, reject) => {
              const timer = setTimeout(resolve, delay);
              if (signal) {
                signal.addEventListener('abort', () => {
                  clearTimeout(timer);
                  reject(new DOMException('Aborted', 'AbortError'));
                }, { once: true });
              }
            });
            continue;
          }
          throw new Error('Rate limit exceeded. Please wait a moment and try again.');
        }

        if (response.status === 400) {
          throw new Error(`Invalid request. Please check your API key configuration. ${errorBody}`);
        }
        if (response.status === 403) {
          throw new Error('API key invalid or unauthorized. Please check your VITE_GEMINI_API_KEY.');
        }
        throw new Error(`AI service error (${response.status}). Please try again.`);
      }

      const data = await response.json();

      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) {
        throw new Error('Empty response from AI service.');
      }

      const parsed = parseRecommendation(text);
      return validateResponse(parsed);
    } catch (err) {
      clearTimeout(timeout);
      if (err.name === 'AbortError') {
        throw err;
      }
      // For non-429 errors, don't retry
      throw err;
    }
  }
}

export async function getPersonalisedExamples(interventionType, nodeDescription, answers, { signal } = {}) {
  if (!API_KEY) {
    throw new Error('API key not configured.');
  }

  const prompt = `You are an expert in AI-UX design and product strategy. Generate 3-5 specific, actionable, and directly implementable real-world examples for the following AI-UX intervention.

CONTEXT:
- Industry: ${answers?.industry || 'general'}
- Business Problem: ${answers?.businessProblem || 'not specified'}
- Primary Goals: ${Array.isArray(answers?.primaryGoals) ? answers.primaryGoals.join(', ') : 'not specified'}
- Risk Level: ${answers?.riskLevel || 'medium'}
- Current State: ${answers?.currentState || 'not specified'}
- Data Availability: ${answers?.dataAvailability || 'moderate'}

AI-UX INTERVENTION TYPE: ${interventionType}
INTERVENTION DESCRIPTION: ${nodeDescription}

INSTRUCTIONS:
Generate specific, real-world examples that:
1. Are directly relevant to the user's industry and business problem
2. Show concrete implementation details, not just theoretical use cases
3. Include specific metrics or outcomes when possible
4. Are actionable and implementable for the user's context
5. Can be similar projects/problems if exact matches don't exist

Format your response as a JSON array with exactly this structure (3-5 items):
[
  {
    "product": "Specific product/company name or project example",
    "description": "Detailed description of how this example applies the intervention, including specific implementation details and outcomes",
    "relevance": "Why this is relevant and directly implementable for the user's ${answers?.industry || 'general'} use case"
  }
]

Return ONLY the JSON array, no other text.`;

  const body = JSON.stringify({
    contents: [
      {
        role: 'user',
        parts: [{ text: prompt }],
      },
    ],
    generationConfig: {
      responseMimeType: 'application/json',
      temperature: 0.7,
      maxOutputTokens: 2048,
    },
  });

  try {
    if (signal?.aborted) {
      throw new DOMException('Aborted', 'AbortError');
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    if (signal) {
      signal.addEventListener('abort', () => controller.abort(), { once: true });
    }

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      body,
    });

    clearTimeout(timeout);

    if (!response.ok) {
      throw new Error(`Failed to generate examples: ${response.status}`);
    }

    const data = await response.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
      throw new Error('Empty response from AI service.');
    }

    const examples = JSON.parse(text);
    return Array.isArray(examples) ? examples : [];
  } catch (err) {
    console.error('Error generating personalised examples:', err);
    throw err;
  }
}

