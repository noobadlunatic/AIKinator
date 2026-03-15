# AIkinator v2 — CLAUDE.md

## Project Overview
AI-UX intervention recommendation tool. Users answer 6 questions about their product context (industry, problem, risk, goals), and the app uses Google Gemini to generate a ranked journey map of AI-UX intervention types with confidence scores, UX pattern inspirations, and implementation guidance.

## Tech Stack
- **React 18** + **Vite 6** (dev server on `localhost:5173`)
- **Tailwind CSS 4** (via Vite plugin)
- **Google Gemini API** (`gemini-2.5-flash-lite`)
- **@vercel/analytics** for page/event tracking
- **html2pdf.js** for PDF export, **uuid** for IDs
- Fonts: DM Sans, DM Serif Display (Google Fonts)

## Commands
```bash
npm run dev      # Start dev server
npm run build    # Production build → dist/
npm run preview  # Preview production build
```

## Environment Variables
```env
VITE_GEMINI_API_KEY=<your-google-gemini-api-key>
```

## Key File Map

### Services
| File | Role |
|------|------|
| `src/services/ai.js` | Gemini API calls, retry logic, rate limiting, prompt building |
| `src/services/storage.js` | localStorage persistence (max 20 assessments, FIFO eviction) |
| `src/services/sharing.js` | Base64 URL encode/decode for shareable assessment links |
| `src/services/analytics.js` | Custom event tracking (screen exits, analysis start/complete/fail) |

### Hooks
| File | Role |
|------|------|
| `src/hooks/useAssessment.jsx` | App-wide state via `useReducer` (screen, answers, results, errors) |
| `src/hooks/useAIRecommendation.jsx` | AI request state machine (loading, progress, abort, retry) |

### Data (static domain knowledge)
| File | Role |
|------|------|
| `src/data/taxonomy.js` | 10 AI-UX intervention types with definitions, pros/cons, trust notes |
| `src/data/questions.js` | 6-question assessment in 2 sections (Business Context + Task, Data & Goals) |
| `src/data/combinations.js` | Proven intervention combinations and anti-patterns |
| `src/data/examples.js` | Static fallback examples per intervention type |

### Key Components
| File | Role |
|------|------|
| `src/components/JourneyMap.jsx` | Always-horizontal scrollable SVG journey graph; per-node AI-UX pattern detail panel |
| `src/components/Results.jsx` | Full-width single-column results: action bar + journey map + why-not |
| `src/components/Questionnaire.jsx` | Single-page question flow (all 6 questions visible at once) |
| `src/components/QuestionStep.jsx` | Individual question card (single/multi-select, textarea) |
| `src/components/AnalysisLoading.jsx` | Animated loading screen during AI analysis |
| `src/components/AutonomyScale.jsx` | Visual L1–L5 autonomy bar (used in node detail panel) |
| `src/components/ConfidenceScore.jsx` | Circular confidence % badge |
| `src/components/ProgressBar.jsx` | Questionnaire progress indicator |
| `src/components/SavedAssessments.jsx` | Saved assessments list/restore |
| `src/components/TaxonomyModal.jsx` | Full taxonomy reference overlay |
| `src/components/ChaiWidget.jsx` | Floating "Buy me a chai" button (landing + results screens) |
| `src/components/ExportPDF.jsx` | PDF download |
| `src/components/WhyNot.jsx` | Collapsible "Why Not These?" section |
| `src/utils/journeyLayout.js` | Journey map layout: topological sort → flat sequential layers → horizontal positions |

## Gemini API Details
- **Model:** `gemini-2.5-flash-lite`
- **Rate limit:** 7 req/60s (client-side enforced)
- **Retry:** up to 3x with exponential backoff (2s → 4s → 8s + jitter)
- **Timeout:** 30s per request via `AbortController`
- **`getRecommendation()`** — returns full journey map with rich node data
- **`getPersonalisedExamples()`** — called on node click; returns AI-UX pattern inspirations for that specific node+context; falls back to static examples in `JourneyMap.jsx`

## State Management Pattern
```
useAssessment (useReducer)
  └── screens: landing → questionnaire → loading → results
  └── stores: answers, results, errors, savedAssessments

useAIRecommendation
  └── wraps getRecommendation() from services/ai.js
  └── manages: isLoading, progress %, error, abort signal
```

## Data Model
**Assessment input:** `{ industry, problemDescription, riskLevel, taskType, dataAvailability, primaryGoals }`

**Results output:**
```
{
  journeyMap: {
    title, description,
    nodes: [{
      id, label, interventionType,
      confidenceScore, summary, description, contextFit,
      examples: [{ product, description, relevance }],
      autonomyLevel: { level, label, description, humanRole, aiRole },
      pros: [{ point, detail }],
      cons: [{ point, detail, mitigation }],
      trustConsiderations: [],
      implementation: { complexity, requirements[], dataNeeds, teamNeeds, timelineAlignment }
    }],
    edges: [{ from, to, label }]
  },
  whyNot: [{ type, reason }]
}
```

## Questions (6 total, 2 sections)
| # | Key | Type | Section |
|---|-----|------|---------|
| 1 | `industry` | single-select | Business Context |
| 2 | `problemDescription` | textarea | Business Context |
| 3 | `riskLevel` | single-select (scale) | Business Context |
| 4 | `taskType` | single-select | Task, Data & Goals |
| 5 | `dataAvailability` | single-select | Task, Data & Goals |
| 6 | `primaryGoals` | multi-select (max 2) | Task, Data & Goals |

## Autonomy Levels Reference
| Level | Label | Description |
|-------|-------|-------------|
| L1 | Operator | User drives, AI supports on demand |
| L2 | Collaborator | User and AI take turns |
| L3 | Consultant | AI drives, user gives input when asked |
| L4 | Approver | AI acts, user reviews/approves |
| L5 | Observer | AI acts autonomously, user monitors |
