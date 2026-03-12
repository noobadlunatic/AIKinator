# AIkinator v2 — CLAUDE.md

## Project Overview
AI-UX intervention recommendation tool. Users answer questions about their product context (industry, problem, risk, goals), and the app uses Google Gemini to generate a ranked journey map of AI-UX intervention types with confidence scores and implementation guidance.

## Tech Stack
- **React 18** + **Vite 6** (dev server on `localhost:5173`)
- **Tailwind CSS 4** (via Vite plugin)
- **Google Gemini API** (`gemini-2.5-flash-lite`)
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

### Hooks
| File | Role |
|------|------|
| `src/hooks/useAssessment.jsx` | App-wide state via `useReducer` (screen, answers, results, errors) |
| `src/hooks/useAIRecommendation.jsx` | AI request state machine (loading, progress, abort, retry) |

### Data (static domain knowledge)
| File | Role |
|------|------|
| `src/data/taxonomy.js` | 10 AI-UX intervention types with definitions, pros/cons, trust notes |
| `src/data/questions.js` | 9-question assessment structure |
| `src/data/combinations.js` | Proven intervention combinations and anti-patterns |
| `src/data/examples.js` | Contextual real-world examples per intervention type |

### Key Components
| File | Role |
|------|------|
| `src/components/JourneyMap.jsx` | Interactive SVG journey graph |
| `src/components/Results.jsx` | Full recommendation display |
| `src/components/Questionnaire.jsx` | Question flow |
| `src/components/ExportPDF.jsx` | PDF download |
| `src/utils/journeyLayout.js` | Journey map layout/positioning logic |

## Gemini API Details
- **Model:** `gemini-2.5-flash-lite`
- **Rate limit:** 7 req/60s (client-side enforced)
- **Retry:** up to 3x with exponential backoff (2s → 4s → 8s + jitter)
- **Timeout:** 30s per request via `AbortController`
- Two endpoints: `getRecommendation` (journey map) and `getPersonalisedExamples` (per-node examples)
- Response format is enforced JSON defined by system prompts in `ai.js`

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
  journeyMap: { nodes: [...], edges: [...] },
  recommendations: [{ type, confidence, autonomyLevel, pros, cons, trustConsiderations, implementation }],
  whyNot: [{ type, reason }]
}
```

## Autonomy Levels Reference
| Level | Label | Description |
|-------|-------|-------------|
| L1 | Operator | User drives, AI supports on demand |
| L2 | Collaborator | User and AI take turns |
| L3 | Consultant | AI drives, user gives input when asked |
| L4 | Approver | AI acts, user reviews/approves |
| L5 | Observer | AI acts autonomously, user monitors |
