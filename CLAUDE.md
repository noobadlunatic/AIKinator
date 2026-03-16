# AIkinator v2 — CLAUDE.md

> **Standing instruction:** After every code change session, always update this file to reflect new files, changed components, updated tech stack, or modified architecture. Do not wait to be asked.

## Project Overview
AI-UX intervention recommendation tool. Users answer 6 questions about their product context (industry, problem, risk, goals), and the app uses Google Gemini to generate a ranked journey map of AI-UX intervention types with confidence scores, UX pattern inspirations, and implementation guidance.

## Tech Stack
- **React 18** + **Vite 6** (dev server on `localhost:5173`)
- **Tailwind CSS 4** (via Vite plugin)
- **@xyflow/react** (React Flow v12) — interactive journey map graph rendering
- **@dagrejs/dagre** — automatic left-to-right DAG layout for journey map nodes
- **Google Gemini API** (`gemini-2.5-flash-lite`)
- **@vercel/analytics** for page/event tracking
- **@vercel/blob** for server-side session persistence
- **html2pdf.js** for comprehensive PDF export, **uuid** for IDs
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
| `src/services/blobStorage.js` | Fire-and-forget session save to Vercel Blob via `/api/save-session` |

### Hooks
| File | Role |
|------|------|
| `src/hooks/useAssessment.jsx` | App-wide state via `useReducer` (screen, answers, results, errors) |
| `src/hooks/useAIRecommendation.jsx` | AI request state machine (loading, progress, abort, retry) |

### Data (static domain knowledge)
| File | Role |
|------|------|
| `src/data/taxonomy.js` | 10 AI-UX intervention types with definitions, pros/cons, trust notes, colors |
| `src/data/questions.js` | 6-question assessment in 2 sections (Business Context + Task, Data & Goals) |
| `src/data/combinations.js` | Proven intervention combinations and anti-patterns |
| `src/data/examples.js` | Static fallback examples per intervention type |

### Key Components
| File | Role |
|------|------|
| `src/components/JourneyMap.jsx` | React Flow–based interactive journey graph; Dagre layout; per-node detail panel with AI-UX patterns, autonomy scale, pros/cons, trust, implementation |
| `src/components/JourneyMapNode.jsx` | Custom React Flow node with selection states, color dot, type label, micro-animations |
| `src/components/JourneyMapEdge.jsx` | Custom React Flow edge with smooth step paths and truncated labels with tooltips |
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
| `src/components/ExportPDF.jsx` | Comprehensive multi-section PDF report (cover, context, journey flow, full node details, why-not table) |
| `src/components/WhyNot.jsx` | Collapsible "Why Not These?" section |
| `src/components/AdminDashboard.jsx` | Session analytics table at `/admin` with CSV export |

### Layout Utilities
| File | Role |
|------|------|
| `src/utils/dagreLayout.js` | Dagre-based LR graph layout (`nodesep: 150`, `ranksep: 160`); auto-synthesizes edges if missing |
| `src/utils/journeyLayout.js` | Legacy custom topological sort layout (replaced by dagreLayout.js) |
| `src/utils/formatting.js` | Label formatters, confidence color/label helpers |

### API Routes (Vercel Serverless)
| File | Role |
|------|------|
| `api/save-session.js` | POST — saves completed assessment to Vercel Blob (`sessions/YYYY-MM-DD/{uuid}.json`) |
| `api/list-sessions.js` | GET — lists all session blobs from Vercel Blob storage |
| `api/sessions-data.js` | GET — fetches and returns full session data for admin dashboard |

### Config
| File | Role |
|------|------|
| `vercel.json` | Deployment config: API rewrites + SPA fallback to `index.html` |

## Journey Map Architecture
The journey map uses **React Flow** for rendering and **Dagre** for layout:
1. Nodes and edges come from Gemini API response
2. `dagreLayout.js` positions nodes using Dagre's LR (left-to-right) algorithm
3. `JourneyMapNode.jsx` renders each node as an interactive card with color dot, label, and type
4. `JourneyMapEdge.jsx` renders smooth step edges with truncated labels (tooltip on hover)
5. Clicking a node opens a detail panel with smooth scroll animation
6. Detail panel loads personalised AI-UX pattern examples via `getPersonalisedExamples()` (falls back to static examples)
7. Hint text ("Click any of the below steps...") is fixed at top with shimmer animation, unaffected by horizontal scroll

## PDF Export
The `ExportPDF.jsx` generates a comprehensive A4 report using `html2pdf.js`:
1. **Cover** — AIkinator branding, assessment context table (industry, risk, task type, data, goals), business problem
2. **Journey Overview** — title, description, text-based flow diagram with branching
3. **Per Node** — stage badge, type color dot, confidence score, summary, description, context fit, autonomy level (L1-L5 visual bar with human/AI roles), pros & cons (side-by-side with mitigations), trust considerations, implementation details (complexity, requirements, data/team/timeline), real-world inspirations
4. **Why Not** — table of rejected intervention types with reasons
5. **Footer** — generation date + disclaimer

## Vercel Blob Storage
Sessions are persisted server-side via Vercel Blob:
- On successful analysis, `blobStorage.js` fires a non-blocking POST to `/api/save-session`
- Sessions stored at `sessions/YYYY-MM-DD/{uuid}.json`
- Admin dashboard at `/admin` fetches all sessions via `/api/sessions-data`
- Dashboard shows: date, industry, problem, risk, task type, data availability, goals, journey steps, intervention types, node count
- CSV download available

## Gemini API Details
- **Model:** `gemini-2.5-flash-lite`
- **Rate limit:** 7 req/60s (client-side enforced)
- **Retry:** up to 3x with exponential backoff (2s → 4s → 8s + jitter)
- **Timeout:** 30s per request via `AbortController`
- **`getRecommendation()`** — returns full journey map with rich node data
- **`getPersonalisedExamples()`** — called on node click; returns AI-UX pattern inspirations for that specific node+context; falls back to static examples

## State Management Pattern
```
useAssessment (useReducer)
  └── screens: landing → questionnaire → loading → results
  └── stores: answers, results, errors, savedAssessments

useAIRecommendation
  └── wraps getRecommendation() from services/ai.js
  └── manages: isLoading, progress %, error, abort signal
```

## App Routing
```
App.jsx
  ├── /admin → AdminDashboard (session analytics table)
  └── /* → AppRouter (landing → questionnaire → loading → results)
        └── On analysis complete → saveSessionToBlob() (fire-and-forget)
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

## Taxonomy Colors Reference
| Type | Color |
|------|-------|
| Advisory AI | `#3b82f6` |
| Suggestive AI | `#8b5cf6` |
| Autonomous AI | `#ef4444` |
| Creative AI | `#ec4899` |
| Predictive AI | `#f97316` |
| Conversational AI | `#06b6d4` |
| Assistive / Augmentation AI | `#10b981` |
| Monitoring / Sentinel AI | `#6366f1` |
| Personalization AI | `#f59e0b` |
| Analytical AI | `#14b8a6` |
