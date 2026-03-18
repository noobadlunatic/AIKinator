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
- Include specific real-world examples, preferring the user's industry. IMPORTANT: Vary your examples widely — do NOT repeat the same products across nodes. Draw from diverse companies, startups, and lesser-known products, not just Google/Apple/Amazon. Each node's examples must reference different products.
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
- Each node should have a confidence score (0-100%), detailed context fit, 2-3 real-world examples from DIFFERENT companies (avoid repeating Google, Apple, Amazon across nodes — use diverse, industry-specific products), full autonomy level with human/AI roles, and detailed pros/cons with mitigations
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

  // Validate edges: keep only those referencing valid node IDs
  const nodeIds = new Set(data.journeyMap.nodes.map(n => n.id));
  data.journeyMap.edges = data.journeyMap.edges.filter(
    e => nodeIds.has(e.from) && nodeIds.has(e.to)
  );

  // If no valid edges remain, generate a sequential chain
  if (data.journeyMap.edges.length === 0 && data.journeyMap.nodes.length > 1) {
    for (let i = 0; i < data.journeyMap.nodes.length - 1; i++) {
      data.journeyMap.edges.push({
        from: data.journeyMap.nodes[i].id,
        to: data.journeyMap.nodes[i + 1].id,
      });
    }
  }

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
    const timeout = setTimeout(() => controller.abort('TIMEOUT'), 60000);

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
        // If the external caller aborted (e.g., user navigated away), propagate silently
        if (signal?.aborted) {
          throw err;
        }
        // Internal timeout — throw a user-friendly error instead of cryptic abort message
        throw new Error('Request timed out. The AI service is taking longer than expected — please try again.');
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

  const industry = answers?.industry || 'general';
  const problem = answers?.problemDescription || 'not specified';
  const goals = Array.isArray(answers?.primaryGoals) ? answers.primaryGoals.join(', ') : 'not specified';
  const risk = answers?.riskLevel || 'medium';
  const taskType = answers?.taskType || 'not specified';
  const dataAvail = answers?.dataAvailability || 'not specified';

  const prompt = `You are a senior AI-UX designer specialising in the ${industry} industry. Generate 3-4 interaction-pattern inspirations for the following AI-UX intervention.

FULL CONTEXT:
- Industry: ${industry}
- Business Problem: ${problem}
- Task Type: ${taskType}
- Data Availability: ${dataAvail}
- Primary Goals: ${goals}
- Risk Level: ${risk}

INTERVENTION TYPE: ${interventionType}
STAGE: ${nodeDescription}

Rules:
- Each pattern MUST be specific to the "${industry}" industry and directly address this problem: "${problem}"
- Pattern names must describe a concrete, INDUSTRY-SPECIFIC UI interaction — NOT generic patterns.
  BAD example: "Inline tooltip" (too generic, applies to anything)
  GOOD example for healthcare: "Drug interaction severity badge" (specific to the domain)
  GOOD example for fintech: "Transaction anomaly confidence ribbon" (specific to the domain)
- "howItWorks" must describe how THIS specific pattern helps solve the user's stated problem. Max 2 sentences. Must mention a specific UI element.
- "designTip" must account for the ${risk} risk level and the user's goals (${goals}). One actionable sentence.
- Reference real products used in ${industry} or adjacent industries. Prefer niche/specialist tools over household names. Each inspiration must reference a DIFFERENT product.
- Focus on UX and interaction design. No business strategy, ROI, or marketing language.

Return a JSON array (3-4 items):
[
  {
    "pattern": "Industry-specific UI/interaction pattern (max 6 words)",
    "reference": "Real product name (prefer niche ${industry} tools)",
    "howItWorks": "How this pattern solves the user's specific problem. Max 2 sentences.",
    "designTip": "One actionable design heuristic considering ${risk} risk. Max 1 sentence."
  }
]`;

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
      maxOutputTokens: 1024,
    },
  });

  const MAX_RETRIES = 2;
  
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    if (signal?.aborted) {
      throw new DOMException('Aborted', 'AbortError');
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

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
        if (response.status === 429 && attempt < MAX_RETRIES) {
          const delay = 1000 * Math.pow(2, attempt) + Math.random() * 500;
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
        throw new Error(`API Error (${response.status}): ${errorBody}`);
      }

      const data = await response.json();
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!text) {
        throw new Error('Empty response from AI service.');
      }

      const examples = JSON.parse(text);
      return Array.isArray(examples) ? examples : [];
    } catch (err) {
      clearTimeout(timeout);
      if (err.name === 'AbortError') {
        throw err;
      }
      if (attempt === MAX_RETRIES) {
        throw err;
      }
    }
  }
}

