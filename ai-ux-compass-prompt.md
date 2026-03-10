# AI-UX Compass — Claude Code Build Prompt

## What You Are Building

Build **AI-UX Compass** — a web application that helps product managers, UX designers, product creators and business leaders determine which type(s) of AI-UX intervention are best suited for their specific business problem. The tool takes structured input about the user's business context and produces a **ranked comparison of the top 2-3 intervention type combinations**, each with personalized detailed rationale, real-world examples, pros/cons, trust considerations, and implementation guidance.

This is NOT a chatbot or conversational interface. It is a guided questionnaire → AI-powered analysis → rich recommendation report tool.

---

## Table of Contents

1. [Product Vision & Goals](#1-product-vision--goals)
2. [Target Users](#2-target-users)
3. [Complete AI-UX Intervention Taxonomy](#3-complete-ai-ux-intervention-taxonomy)
4. [The Autonomy Spectrum](#4-the-autonomy-spectrum)
5. [Business Context → Intervention Mapping Logic](#5-business-context--intervention-mapping-logic)
6. [Combination Patterns & Anti-Patterns](#6-combination-patterns--anti-patterns)
7. [User Flow & Screens](#7-user-flow--screens)
8. [Recommendation Output Specification](#8-recommendation-output-specification)
9. [Technical Architecture](#9-technical-architecture)
10. [Data Models](#10-data-models)
11. [AI Prompt Engineering](#11-ai-prompt-engineering)
12. [Save / Export / Share](#12-save--export--share)
13. [Design System & UI Guidelines](#13-design-system--ui-guidelines)
14. [Edge Cases & Error Handling](#14-edge-cases--error-handling)
15. [Future Scope (Phase 2 — NOT in this build)](#15-future-scope-phase-2--not-in-this-build)

---

## 1. Product Vision & Goals

**Vision:** Be the go-to decision-making tool for teams integrating AI into their products — helping them avoid the common mistake of picking the wrong AI intervention pattern (e.g., building a chatbot when a suggestive AI would work better).

**Goals for MVP:**
- Help users articulate their business problem through a guided questionnaire
- Recommend 2-3 ranked AI-UX intervention combinations (not just single types) with personalized detailed reasoning
- Each recommendation includes: intervention types used, how they work together, confidence score, real-world examples, pros/cons, trust & risk considerations, and implementation complexity
- Allow users to save results locally, export as PDF, and share via URL
- Educate users about the AI-UX intervention taxonomy through the recommendation experience

**Non-goals for MVP:**
- No consumption layer recommendations (chat vs. popup vs. embedded — that's Phase 2)
- No user accounts or authentication
- No team collaboration features
- No integration with project management tools

---

## 2. Target Users

**Primary:** Product Managers, product creators evaluating AI features for their roadmap
**Secondary:** UX Designers/Researchers exploring AI interaction patterns, Business Leaders/Founders making strategic AI decisions, Consultants/Agencies advising clients on AI strategy

**User characteristics:**
- Familiar with product development but may not have deep AI/ML knowledge
- Need actionable recommendations, not academic theory
- Value real-world examples and concrete comparisons
- Making decisions with real budget and timeline implications

---

## 3. Complete AI-UX Intervention Taxonomy

This is the core knowledge base of the product. Every recommendation the tool makes draws from this taxonomy. Store this as structured data that the AI prompt can reference.

### Type 1: Advisory AI
- **Definition:** Provides recommendations, analysis, or guidance while preserving the user's full decision-making authority. Acts as a knowledgeable consultant — presenting options, highlighting risks, and suggesting courses of action — but the human always makes the final call.
- **Key differentiator vs Suggestive AI:** Operates in high-stakes contexts where human judgment is non-negotiable. Recommendations are more elaborate, include confidence scores or risk assessments, and feature explainability ("recommended because...").
- **Real-world examples:** Vanguard Digital Advisor (portfolio recommendations, $206B+ AUM), Viz.ai (FDA-cleared stroke detection on CT scans — alerts specialists but radiologists diagnose), Google Maps (multiple route options with time/traffic — driver chooses)
- **Best business scenarios:** High-stakes decisions (finance, medicine, law), regulated industries requiring human accountability, expert augmentation ("second opinion" systems)
- **Pros:** Full user agency and accountability; satisfies regulatory requirements; reduces cognitive load while preserving expertise
- **Cons:** Alert fatigue risk; automation bias (users stop critically evaluating); slower than autonomous; trust calibration is hard — users trust too much or too little
- **Trust considerations:** Experienced users are "trust-driven" (need to believe AI is competent); newer users are "value-driven" (focus on practical benefit). Explainability is essential.
- **Autonomy level:** Low (L1-L2). Human decides, AI informs.
- **Data requirements:** Medium-High. Needs enough data for quality recommendations but can work with smaller datasets than Predictive or Personalization AI.
- **Implementation complexity:** Medium. Recommendation engine + explainability layer + confidence scoring.

### Type 2: Suggestive AI
- **Definition:** Proactively suggests actions, content, or completions as users work — reducing effort and accelerating workflows. Suggestions appear inline, in real time, and can be accepted with a single keystroke or dismissed by continuing.
- **Key differentiator vs Advisory AI:** Suggestions are ephemeral, lightweight, and low-commitment. Near-zero interaction cost. Quick disposable nudges vs. elaborate recommendations.
- **Real-world examples:** Gmail Smart Compose (predictive text, accepted with Tab), Grammarly (real-time grammar/tone suggestions across 1M+ apps), Spotify Discover Weekly (personalized 30-song playlist, 5B+ streams annually, 40M weekly users), GitHub Copilot (ghost-text code suggestions, developers ~55% more productive)
- **Best business scenarios:** Productivity acceleration for repetitive tasks, content discovery in large catalogs, text entry optimization, engagement/retention in subscription services
- **Pros:** Dramatically reduces friction; personalizes over time; increases engagement
- **Cons:** Filter bubble risk; cold start problem for new users; distracting when suggestions miss
- **Trust considerations:** Low barrier — suggestions are easily ignored. But persistent bad suggestions erode trust quickly.
- **Autonomy level:** Low (L1). User drives, AI offers options.
- **Data requirements:** Medium. Improves dramatically with usage data but can start with heuristics.
- **Implementation complexity:** Low-Medium. Real-time inference + personalization loop.

### Type 3: Autonomous AI
- **Definition:** Makes decisions and executes actions to achieve user-defined goals with minimal or no real-time input. User delegates intent rather than issuing commands; the system determines necessary steps.
- **Key differentiator:** User is NOT continually in control. Trust, transparency, and override mechanisms become paramount design concerns.
- **Real-world examples:** Tesla Autopilot (neural networks for highway driving, SAE Level 2), email spam filters (classify billions of messages without user intervention), GitHub Copilot Coding Agent (accepts task, implements feature, opens draft PR for review)
- **Best business scenarios:** Repetitive well-defined tasks, time-critical operations (human reaction speed insufficient), background maintenance, scale problems exceeding human capacity
- **Pros:** Frees humans from mundane/dangerous tasks; 24/7 operation; handles impossible scale
- **Cons:** Trust deficit from loss of control; errors can be catastrophic; "black box" decisions; liability questions
- **Trust considerations:** Critical. "Autonomy without feedback is not intelligence — it is abandonment." Must provide: ongoing status communication, audit trails, emergency override, adjustable autonomy settings, preview for high-risk actions.
- **Autonomy level:** High (L3-L5). AI drives, user monitors/approves.
- **Data requirements:** High. Needs extensive training data and real-time feedback loops.
- **Implementation complexity:** High. Action execution + monitoring + rollback + audit trails + override mechanisms.

### Type 4: Creative AI
- **Definition:** Produces original content — text, images, code, music, video, design — based on user prompts. User provides direction; AI produces novel output for refinement or direct use.
- **Key differentiator:** Output is non-deterministic (same prompt → different results). Prompt quality dramatically affects output quality. Inherently iterative. Raises authorship/IP questions.
- **Real-world examples:** ChatGPT (100M users in 2 months), Midjourney (artistic images from text), Adobe Firefly (generative AI in Photoshop, trained on licensed content), Canva Magic Studio (democratizes design for non-designers)
- **Best business scenarios:** Content creation at scale, creative ideation/exploration, democratizing creative tools for non-experts, code generation, rapid prototyping (reduces time by 40-60%)
- **Pros:** Accelerates creative production; enables rapid variation exploration; democratizes capabilities
- **Cons:** Hallucination risk; IP/copyright concerns; output can be homogeneous; "blank canvas" problem (users don't know how to prompt)
- **Trust considerations:** Users must understand output is probabilistic. Fact-checking mechanisms needed. Clear IP ownership policies required.
- **Autonomy level:** Medium (L2-L3). Collaborative — user directs, AI generates, user refines.
- **Data requirements:** Very High for training, but low for usage (prompt-based).
- **Implementation complexity:** High if building from scratch, Medium if using existing APIs (OpenAI, Anthropic, Stability AI).

### Type 5: Predictive AI
- **Definition:** Analyzes historical and real-time data to forecast future outcomes, trends, or behaviors. Deals in probabilities rather than certainties, enabling proactive rather than reactive decision-making.
- **Key differentiator:** Outputs are probabilities and forecasts, not actions or content. Value lies in enabling preparation/intervention before events occur. Visualizing uncertainty is a core design challenge.
- **Real-world examples:** Salesforce Einstein (lead conversion probability with explanations), Netflix (saves ~$1B/year in retention through predictive recommendations; predicts which thumbnails trigger clicks per user), GE Digital predictive maintenance (reduces unplanned downtime 70%+)
- **Best business scenarios:** Demand forecasting, risk assessment, churn prevention, preventive maintenance, financial planning. Companies using predictive AI see avg 21% increase in organic yearly revenue vs 12% without.
- **Pros:** Enables proactive decisions; identifies patterns too complex for humans; improves resource allocation
- **Cons:** Probabilistic outputs misinterpreted as certainties; heavily data-dependent; training data bias → discriminatory outcomes
- **Trust considerations:** Must clearly communicate confidence intervals and uncertainty. Users need to understand probabilities, not just point predictions. Bias auditing is essential.
- **Autonomy level:** Low-Medium (L1-L2). AI forecasts, human decides.
- **Data requirements:** Very High. Needs extensive historical data for model training.
- **Implementation complexity:** High. ML pipeline + data infrastructure + visualization of uncertainty + bias monitoring.

### Type 6: Conversational AI
- **Definition:** Interacts through natural language (text or voice) replacing menus, buttons, and forms with dialogue. The goal is helping users complete tasks efficiently through conversation.
- **Key differentiator:** Natural language IS the primary interface. Eliminates learning curve but introduces discoverability challenges — users don't know what the system can do.
- **Real-world examples:** Bank of America's Erica (3B+ interactions, 50M+ users, 98% answers within 44 seconds — redesigned from chat bubble to search-style after older customers found chatbot paradigms uncomfortable), Amazon Alexa/Google Assistant/Siri, MakeMyTrip's Myra (full travel bookings within chat)
- **Best business scenarios:** Customer support at scale, task completion with clear goals, information retrieval from large knowledge bases, onboarding/guided experiences
- **Pros:** Natural interaction; low learning curve; 24/7 scalable support; reduces navigation complexity
- **Cons:** Expectation mismatch (looks advanced but handles only basics); conversation dead-ends; verbose for simple tasks; misunderstandings compound in multi-turn conversations
- **Trust considerations:** Transparency that user is talking to AI. Capability boundaries stated upfront. Graceful escalation to humans. Hidden automation breeds distrust.
- **Autonomy level:** Medium (L2-L3). Collaborative dialogue.
- **Data requirements:** Medium-High. Needs training data for NLU + domain-specific knowledge base.
- **Implementation complexity:** Medium-High. NLU/NLG + dialogue management + escalation routing + context persistence.

### Type 7: Assistive / Augmentation AI
- **Definition:** Enhances human capabilities rather than replacing them. Human remains primary decision-maker and creative force while AI amplifies abilities across perceptual, physical, and cognitive dimensions.
- **Key differentiator:** Human stays in the loop BY DESIGN. Bidirectional learning between human and AI. "You won't lose your job to AI, but to someone who uses AI better than you do."
- **Real-world examples:** Adobe Photoshop (Generative Fill, Generative Expand, AI Assistant for automating repetitive tasks), Notion AI (/summarize, /action items directly in workspace context, $8-10/month), AI-powered hearing aids (Starkey/Oticon — continuous sound environment analysis + user preference learning)
- **Best business scenarios:** Creative workflows requiring human judgment, knowledge work (writing/research/analysis), accessibility, bridging skill gaps for non-experts
- **Pros:** Preserves human agency; 33% faster output and 40% higher quality in professional use; lowers skill barriers
- **Cons:** Over-reliance risk (users stop developing skills); quality control burden on humans; homogenization if everyone uses same AI
- **Trust considerations:** Clear delineation of AI-assisted vs. human-created output. Users need to understand and verify AI contributions.
- **Autonomy level:** Low (L1-L2). Human drives, AI amplifies.
- **Data requirements:** Medium. Works with user's own content/context.
- **Implementation complexity:** Medium. Integration into existing workflow + real-time processing + seamless UX.

### Type 8: Monitoring / Sentinel AI
- **Definition:** Operates continuously in the background, distinguishing normal activity from genuine anomalies and alerting users only when attention is needed.
- **Key differentiator:** Fundamentally passive until triggered. Core design challenge is unique: balancing sensitivity (catching real issues) vs. specificity (avoiding false alarms / alert fatigue).
- **Real-world examples:** Apple Watch Fall Detection (accelerometer + gyroscope → auto-calls emergency if immobile ~1 min), Ring's "Single Event Alert" (consolidates multiple motion events into one notification), Microsoft Sentinel (security logs across networks/endpoints/cloud, behavior analytics, organizations receive 5,000+ alerts daily — AI reduces false positives)
- **Best business scenarios:** Safety-critical environments, cybersecurity, infrastructure monitoring, fraud detection, quality assurance
- **Pros:** 24/7 vigilance at scale; processes millions of data points; proactive threat detection
- **Cons:** Alert fatigue (SOC analysts spend ~2 hours/day chasing false positives); privacy concerns; sensitivity tuning is ongoing; enterprise costs significant
- **Trust considerations:** Users need confidence in both detection AND dismissal. False negative fear must be addressed through transparency about what IS being monitored.
- **Autonomy level:** Medium-High (L3-L4). AI monitors and alerts; may auto-act in critical situations.
- **Data requirements:** High. Needs baseline behavioral data to distinguish normal from anomalous.
- **Implementation complexity:** High. Real-time data processing + anomaly detection + alert prioritization + dashboarding.

### Type 9: Personalization AI
- **Definition:** Tailors content, interfaces, and recommendations to individual users based on behavior, preferences, and context. System-driven (unlike customization which is user-driven).
- **Key differentiator:** Often operates invisibly. Users may not realize the experience is personalized because they have nothing to compare against.
- **Real-world examples:** Netflix (personalizes content ranking AND thumbnail images — powering 80%+ of content viewed; personalized thumbnails increase CTR by 30%), TikTok's For You Page (adjusts based on scroll speed, linger time, rewatches, shares — highly personalized within minutes), Spotify's Daylist (changes dynamically throughout the day)
- **Best business scenarios:** Content discovery at scale, engagement/retention, conversion optimization, managing information overload in large catalogs
- **Pros:** Dramatic engagement increases; reduces decision fatigue; scales infinitely; continuous improvement via feedback loops
- **Cons:** Filter bubble effect; extensive data collection → privacy concerns; algorithmic bias excluding underrepresented groups; fine line between helpful personalization and exploitative dark patterns
- **Trust considerations:** Pair personalization with customization (user controls). Transparency about what's being personalized and why. Data privacy compliance (GDPR, CCPA).
- **Autonomy level:** Medium (L2-L3). AI curates, user consumes and signals preferences implicitly.
- **Data requirements:** Very High. Needs behavioral data at scale for meaningful personalization.
- **Implementation complexity:** Medium-High. Recommendation engine + A/B testing + real-time behavioral tracking + data pipeline.

### Type 10: Analytical AI
- **Definition:** Processes complex datasets to surface patterns, detect anomalies, and present findings in accessible formats. Democratizes data access by letting non-technical users ask questions and receive visualized answers.
- **Key differentiator:** Human remains interpreter and decision-maker. Unlike Predictive AI (forecasts future), Analytical AI focuses on understanding what HAS happened and why.
- **Real-world examples:** Power BI Copilot (natural language queries → auto-generated reports + visualizations + NL explanations), Google Analytics 4 Intelligence (surfaces notable changes automatically), ThoughtSpot (Google-like search bar for data queries)
- **Best business scenarios:** Business intelligence, marketing analytics, financial analysis, operations optimization, cross-departmental data democratization
- **Pros:** Non-technical users extract insights without SQL/Python; hours of analysis → seconds; AI surfaces insights humans might never look for
- **Cons:** Data quality dependency; hallucination risk with convincing but wrong analyses; expensive enterprise licensing; oversimplification missing nuances
- **Trust considerations:** Clear data provenance. Users must be able to verify underlying data. Confidence indicators on generated insights.
- **Autonomy level:** Low (L1). AI presents, human interprets and decides.
- **Data requirements:** High. Needs structured, clean data to produce accurate analysis.
- **Implementation complexity:** Medium-High. Data connectors + NLQ engine + visualization generation + caching.

---

## 4. The Autonomy Spectrum

Reference framework for the recommendation engine. When recommending intervention types, the tool should also indicate where the recommendation falls on this spectrum.

**Sheridan & Verplank's 10 Levels (1978):**
Level 1: Human does everything → Level 10: Computer acts entirely autonomously

**SAE J3016 Driving Automation Levels (widely used as analogy):**
L0 No Automation → L5 Full Automation

**Knight First Amendment Institute Framework (2025) — Most product-relevant:**
- **L1 – Operator:** User drives, AI supports on demand (e.g., Microsoft Copilot)
- **L2 – Collaborator:** User and AI take turns driving (e.g., coding agents)
- **L3 – Consultant:** AI drives, user provides input when asked (e.g., Google Deep Research)
- **L4 – Approver:** AI acts, user reviews and approves (e.g., Cognition's Devin)
- **L5 – Observer:** AI acts autonomously, user monitors (e.g., fully autonomous background agents)

**Key insight:** Autonomy is a DESIGN DECISION, not an inevitable consequence of capability. A highly capable AI can be designed at low autonomy by requiring human feedback at intervals.

**Trust escalation:** Low autonomy = minimal trust needed. Mid levels = explainability + override + confidence levels essential. High autonomy = comprehensive transparency mandatory (audit logs, action histories, intent summaries, escalation rules, boundary definitions).

---

## 5. Business Context → Intervention Mapping Logic

This is the core decision logic. The questionnaire collects these signals and the AI uses them to map to intervention types.

### Primary Decision Factors(These are just factors on which a decision can be taken, these are just guidelines for the AI to think in. The final decision and recommendations have to be based on the user's inputs and the context of the problem.)

**1. Risk Level (Primary Filter)**
- High-stakes (healthcare, finance, law, safety) → Advisory, Assistive, Monitoring (human-in-the-loop)
- Medium-stakes (business operations, productivity) → Any combination with appropriate guardrails
- Low-stakes (content, engagement, convenience) → Autonomous, Personalization, Suggestive

**2. User Expertise**
- Expert users → Augmentation/Assistive tools that surface info efficiently without deciding
- Mixed expertise → Progressive disclosure; defaults for novices, power features for experts
- Novice users → Suggestive, Conversational, or more autonomous patterns with guardrails

**3. Data Availability**
- Rich data (billions of data points, years of history) → Personalization, Predictive, Analytical
- Moderate data → Advisory, Suggestive, Conversational
- Scarce data (new product, niche market, startup) → Rule-based automation, Advisory with human oversight, Creative AI

**4. Task Predictability**
- One correct answer + fixed rules → Deterministic automation (not AI)
- Multiple valid answers + evolving rules + interpretation needed → Probabilistic AI
- No single right answer + creative/strategic → Creative AI, Advisory AI

**5. Decision Frequency & Speed**
- High frequency, fast (millions/sec) → Autonomous, Monitoring, Personalization
- Moderate frequency → Suggestive, Conversational
- Low frequency, deliberate → Advisory, Analytical

**6. Regulatory & Compliance Requirements**
- Heavy regulation → Advisory (explainability mandatory), human-in-the-loop required
- Moderate regulation → Assistive with audit trails
- Light regulation → More flexibility in autonomy level

**7. Scale Requirements**
- Massive scale (millions of users/decisions) → Autonomous, Personalization, Monitoring
- Moderate scale → Any pattern
- Small scale (internal tools, niche) → Assistive, Advisory, Analytical

### Business Context → Recommended Combinations Quick Reference

| Business Context | Primary Types | Why |
|---|---|---|
| Healthcare diagnosis | Advisory + Assistive | Errors fatal; regulation demands explainability |
| E-commerce product discovery | Personalization + Suggestive | Low risk per decision; massive catalogs; user has final say |
| Creative production (design, content) | Creative + Assistive | No single right answer; human vision essential |
| Cybersecurity | Monitoring + Autonomous | Volume exceeds human capacity; speed critical |
| Financial trading | Predictive + Autonomous (+ guardrails) | Time-critical; requires scale; demands audit trails |
| Customer support | Conversational + Advisory | High volume repetitive queries; escalation for complex |
| Strategic planning/BI | Analytical + Advisory | Reflection time valuable; stakes justify deliberation |
| Content streaming/media | Personalization + Predictive + Suggestive | Engagement-driven; enormous catalogs; feedback loops |
| Manufacturing/Operations | Monitoring + Predictive + Autonomous | Real-time monitoring + forecasting + automated response |
| Education/Learning | Assistive + Personalization + Advisory | Adaptive learning paths + skill gap identification |
| Sales/CRM | Predictive + Suggestive + Analytical | Lead scoring + next-best-action + pipeline analysis |
| Code development | Creative + Suggestive + Assistive | Code generation + inline completion + refactoring |

---

## 6. Combination Patterns & Anti-Patterns

### Proven Combination Patterns

**Pattern 1: Personalization + Suggestive + Analytical (Engagement Loop)**
Analytics informs personalization, personalization improves suggestions, suggestions generate data for analytics. Example: Netflix, Spotify, Amazon.

**Pattern 2: Creative + Assistive (Human-AI Collaboration)**
AI's generative capacity + human quality control. Example: Adobe Firefly, GitHub Copilot.

**Pattern 3: Monitoring + Autonomous (Silent Guardian)**
AI works silently until something valuable to surface, then acts or alerts. Example: Smart home security, spam filters, fraud detection.

**Pattern 4: Predictive + Conversational (Guided Exploration)**
Narrows possibility space before engaging in dialogue. Example: Google Search, ChatGPT with tools.

**Pattern 5: Assistive + Suggestive (Progressive Disclosure)**
Sidebar for complex tasks + inline suggestions for quick actions. Example: Microsoft Copilot, Notion AI.

**Pattern 6: Advisory + Analytical (Decision Support)**
Data analysis feeds into structured recommendations. Example: BI dashboards with recommendation engines.

**Pattern 7: Monitoring + Predictive + Autonomous (Proactive Operations)**
Monitor state → predict issues → auto-remediate. Example: Cloud infrastructure management, predictive maintenance.

### Anti-Patterns to Warn Against

**"AI Everywhere":** Adding AI buttons throughout without addressing user needs. Warn when user's problem is too vague or broad.

**Full Autonomy Without Oversight:** Deploying autonomous AI for high-stakes decisions without human checkpoints. Flag when user selects high risk + autonomous.

**Chat-Only for Transactional Tasks:** Forcing conversational UI when a simple GUI would be faster. Warn when the task is simple and repetitive.

**Generative AI Precision Anti-Pattern:** Using probabilistic LLMs for tasks requiring 100% accuracy (calculations, compliance). Warn when user needs deterministic output.

**Personalization Without Transparency:** Invisible AI decisions with no user controls or explanation. Warn when personalization is recommended without user agency considerations.

---

## 7. User Flow & Screens

### Screen 1: Landing / Welcome
- Product name, tagline: "Find the right AI intervention for your product"
- Brief explanation of what the tool does (2-3 sentences)
- "Start Assessment" CTA button
- Optional: "What are AI-UX Interventions?" educational link that opens a modal/panel with the taxonomy overview
- Show recent saved assessments (from localStorage) if any exist

### Screen 2: Guided Questionnaire (Multi-step wizard)
Progressive disclosure — show one section at a time with a progress indicator.

**Section A: Business Context (3-4 questions)**

Q1: "What industry or domain is your product in?"
- Options: Healthcare / Finance & Banking / E-commerce & Retail / Media & Entertainment / Education / Manufacturing & Operations / SaaS & Productivity / Cybersecurity / Transportation & Logistics / Other (free text)
- Type: Single select with "Other" free-text fallback

Q2: "What is the primary business problem you're trying to solve with AI?"
- Free-text textarea (required, min 20 characters)
- Helper text: "Describe the specific problem, not the solution. For example: 'Our support team can't handle ticket volume during peak hours' rather than 'We need a chatbot'"
- Character count indicator

Q3: "Who are your end users?"
- Options: Domain experts (doctors, engineers, analysts) / Business professionals (managers, salespeople) / General consumers / Mixed audience with varying expertise / Internal team members
- Type: Single select

Q4: "What is the risk level if AI makes a wrong decision in your context?"
- Options displayed as a visual scale:
  - Critical (safety, health, legal liability at stake)
  - High (significant financial or operational impact)
  - Medium (measurable business impact but recoverable)
  - Low (minor inconvenience, easily correctable)
- Type: Single select with descriptions

**Section B: Task & Data Characteristics (3-4 questions)**

Q5: "How would you describe the decisions or tasks AI would handle?"
- Options: Repetitive with clear rules (same input → same output) / Pattern-based with some variation / Creative or open-ended (multiple valid outcomes) / A mix of the above
- Type: Single select

Q6: "How much relevant data do you currently have?"
- Options: Rich (years of history, millions of data points) / Moderate (some historical data, growing) / Limited (new product or category, small dataset) / I'm not sure
- Type: Single select

Q7: "How frequently will users interact with the AI feature?"
- Options: Continuously / real-time (background or always-on) / Multiple times per day / A few times per week / Occasionally (monthly or less)
- Type: Single select

Q8: "Are there regulatory or compliance requirements in your domain?"
- Options: Heavy regulation (FDA, FINRA, HIPAA, etc.) / Moderate regulation (GDPR, SOC2, industry standards) / Light or no regulation / I'm not sure
- Type: Single select

**Section C: Goals & Constraints (3-4 questions)**

Q9: "What is your primary goal for the AI feature?" (Select up to 2)
- Options: Reduce costs / operational efficiency / Increase user engagement / retention / Improve decision quality / accuracy / Accelerate workflows / save time / Scale beyond human capacity / Create new capabilities that didn't exist before / Improve user experience / satisfaction
- Type: Multi-select (max 2)

Q10: "How important is it that users understand WHY the AI made a decision?"
- Options displayed as visual scale:
  - Essential (regulated, high-stakes, or trust-sensitive)
  - Important (users want to know but don't always need to)
  - Nice to have (users care about results, not reasoning)
  - Not important (background feature, users don't interact directly)
- Type: Single select

Q11: "What is your implementation timeline and team capability?"
- Options: Need something quickly (weeks), small team / Moderate timeline (1-3 months), competent team / Long-term investment (3-6+ months), dedicated AI/ML team
- Type: Single select

Q12 (Optional): "Anything else about your business context that might help us make a better recommendation?"
- Free-text textarea (optional)
- Helper text: "For example: existing tech stack, specific constraints, previous AI attempts, competitive considerations"

### Screen 3: Loading / Analysis State
- Show a brief animated state while the AI processes (2-4 seconds)
- Display the factors being analyzed (e.g., "Analyzing risk profile...", "Matching intervention patterns...", "Evaluating combinations...")
- This can be lightly animated — NOT a generic spinner

### Screen 4: Recommendation Results
This is the most important screen. See Section 8 for full specification.

**Layout:**
- Summary bar at top: "Based on your [industry] context with [risk level] risk and [goal], we recommend..."
- 2-3 ranked recommendation cards, each expandable
- Each card shows the overall AI-UX approach for the product : Rank badge (#1, #2, #3), Combination name (e.g., "Advisory + Assistive AI"), Confidence score (percentage), One-line summary
- Sidebar or tab: "Why not these?" section explaining intervention types that were considered but rejected, with reasons
- A high level user journey map of the product which solves the user's problem. This user journey map may not be linear(can have multiple branches). It should be interactive and should show the different AI-UX intervention types in each node of the user journey map. the user should be able to click on each node and see the details of the AI-UX intervention type in that node. The details should include contextual and personalised AI-UX implmentation approaches for that node, Pros & cons specific to your context, Trust & risk considerations, Autonomy level indicator (visual)

**Actions on results page:**
- "Save Assessment" → saves to localStorage + generates shareable URL
- "Export as PDF" → generates downloadable PDF report
- "Start New Assessment" → resets questionnaire
- "Adjust Answers" → go back to questionnaire with answers preserved

### Screen 5: Saved Assessments (accessible from landing page)
- List of saved assessments with: Date, Industry, Brief problem summary, Top recommendation
- Click to view full results
- Delete individual assessments

---

## 9. Technical Architecture

### Stack
- **Framework:** React 18+ with Vite
- **Styling:** Tailwind CSS 3+ (via CDN) + custom CSS for distinctive design elements
- **State Management:** React Context + useReducer (no external state library needed for this scope)
- **AI Backend:** Anthropic Claude API (claude-sonnet-4-5-20250929) called directly from the client using the Anthropic API
- **PDF Export:** html2pdf.js or jsPDF (client-side)
- **Persistence:** localStorage for saved assessments
- **Sharing:** URL-based sharing with encoded state in URL parameters (base64 encoded JSON)
- **No server required** — this is a fully client-side application. The only external call is to the Anthropic API.

### Project Structure
```
ai-ux-compass/
├── index.html
├── package.json
├── vite.config.js
├── src/
│   ├── main.jsx
│   ├── App.jsx
│   ├── styles/
│   │   └── globals.css
│   ├── components/
│   │   ├── Landing.jsx          # Welcome screen + saved assessments
│   │   ├── Questionnaire.jsx    # Multi-step wizard container
│   │   ├── QuestionStep.jsx     # Individual question step component
│   │   ├── ProgressBar.jsx      # Wizard progress indicator
│   │   ├── AnalysisLoading.jsx  # Analysis animation screen
│   │   ├── Results.jsx          # Results page container
│   │   ├── RecommendationCard.jsx  # Individual recommendation card
│   │   ├── AutonomyScale.jsx    # Visual autonomy level indicator
│   │   ├── ConfidenceScore.jsx  # Visual confidence display
│   │   ├── WhyNot.jsx           # "Why not these?" section
│   │   ├── TaxonomyModal.jsx    # Educational taxonomy explainer
│   │   ├── SavedAssessments.jsx # List of past assessments
│   │   └── ExportPDF.jsx        # PDF generation logic
│   ├── data/
│   │   ├── taxonomy.js          # Full taxonomy data (all 10 types)
│   │   ├── questions.js         # Questionnaire questions config
│   │   ├── combinations.js      # Combination patterns + anti-patterns
│   │   └── examples.js          # Real-world examples database
│   ├── services/
│   │   ├── ai.js                # Anthropic API integration
│   │   ├── storage.js           # localStorage operations
│   │   └── sharing.js           # URL encoding/decoding for sharing
│   ├── hooks/
│   │   ├── useAssessment.js     # Assessment state management
│   │   └── useAIRecommendation.js  # AI call + response parsing
│   └── utils/
│       ├── scoring.js           # Pre-AI scoring heuristics
│       └── formatting.js        # Text/date formatting helpers
```

### API Integration

The app calls the Anthropic Claude API directly from the client. The API key will need to be provided by the user or configured as an environment variable during build.

```javascript
// services/ai.js
const getRecommendation = async (answers) => {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": import.meta.env.VITE_ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-access": "true"
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-5-20250929",
      max_tokens: 4096,
      system: SYSTEM_PROMPT, // See Section 11
      messages: [
        { role: "user", content: buildUserPrompt(answers) }
      ]
    })
  });
  const data = await response.json();
  return parseRecommendation(data.content[0].text);
};
```

**Important:** The API key should be configured via `.env` file (`VITE_ANTHROPIC_API_KEY`). Add instructions in the README for users to set this up.

---

## 10. Data Models

### Assessment (saved to localStorage)

```typescript
interface Assessment {
  id: string;                    // UUID
  createdAt: string;             // ISO datetime
  answers: {
    industry: string;
    problemDescription: string;
    endUsers: string;
    riskLevel: string;
    taskType: string;
    dataAvailability: string;
    interactionFrequency: string;
    regulatoryRequirements: string;
    primaryGoals: string[];      // max 2
    explainabilityImportance: string;
    implementationTimeline: string;
    additionalContext?: string;
  };
  recommendations: Recommendation[];
  whyNot: WhyNotItem[];
}
```

### Recommendation

```typescript
interface Recommendation {
  rank: 1 | 2 | 3;
  combinationName: string;       // e.g., "Advisory + Assistive AI"
  interventionTypes: string[];   // e.g., ["advisory", "assistive"]
  confidenceScore: number;       // 0-100
  summary: string;               // One-line summary
  explanation: string;           // 2-3 paragraphs on what and how they combine
  synergy: string;               // Why combination > sum of parts
  contextFit: string;            // Mapping to user's specific answers
  examples: Example[];           // 2-3 real-world examples
  autonomyLevel: {
    level: string;               // L1-L5
    label: string;               // "Operator" / "Collaborator" / etc.
    description: string;
    humanRole: string;
    aiRole: string;
  };
  pros: ProCon[];
  cons: ProCon[];
  trustConsiderations: string[];
  implementation: {
    complexity: "Low" | "Medium" | "High";
    requirements: string[];
    dataNeeds: string;
    teamNeeds: string;
    timelineAlignment: string;   // How it maps to their stated timeline
  };
}

interface Example {
  product: string;
  description: string;
  relevance: string;            // Why relevant to user's context
}

interface ProCon {
  point: string;
  detail: string;
  mitigation?: string;          // Only for cons
}

interface WhyNotItem {
  interventionType: string;
  reason: string;
}
```

---

## 11. AI Prompt Engineering

### System Prompt

```
You are an AI-UX intervention expert. Your job is to analyze a user's business context and recommend the optimal combination of AI-UX intervention types for their product.

You have deep knowledge of the following 10 AI-UX intervention types:
1. Advisory AI — Provides recommendations while preserving human decision authority
2. Suggestive AI — Proactively offers lightweight, inline suggestions
3. Autonomous AI — Acts independently to achieve user-defined goals
4. Creative AI — Generates original content from user prompts
5. Predictive AI — Forecasts future outcomes from data patterns
6. Conversational AI — Uses natural language dialogue as the interface
7. Assistive/Augmentation AI — Enhances human capabilities without replacing them
8. Monitoring/Sentinel AI — Continuously watches and alerts on anomalies
9. Personalization AI — Tailors experiences to individual users
10. Analytical AI — Surfaces patterns and insights from complex data

KEY PRINCIPLES:
- Recommendations should be COMBINATIONS of 1-4 types, not just single types
- Rank the top 2-3 combinations by fit score (0-100%)
- Risk level is the PRIMARY filter: high-stakes domains MUST include human-in-the-loop patterns
- Match user expertise level to intervention autonomy
- Consider data availability as a hard constraint
- Always explain WHY this combination works as a system
- Include specific real-world examples, preferring the user's industry
- Flag relevant anti-patterns to avoid
- Be opinionated — don't hedge everything. Give clear, actionable recommendations.

RESPONSE FORMAT:
You MUST respond in valid JSON matching this exact structure (no markdown, no backticks, no preamble):

{
  "recommendations": [
    {
      "rank": 1,
      "combinationName": "Advisory + Assistive AI",
      "interventionTypes": ["advisory", "assistive"],
      "confidenceScore": 87,
      "summary": "One-line summary of why this combination fits",
      "explanation": "2-3 paragraphs explaining what these types are and how they combine",
      "synergy": "Why this combination is greater than the sum of its parts",
      "contextFit": "Direct mapping to the user's specific answers",
      "examples": [
        {
          "product": "Product Name",
          "description": "How it uses this combination",
          "relevance": "Why this is relevant to the user's specific context"
        }
      ],
      "autonomyLevel": {
        "level": "L2",
        "label": "Collaborator",
        "description": "User and AI take turns driving",
        "humanRole": "What the human does",
        "aiRole": "What the AI does"
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
        "timelineAlignment": "How this aligns with their stated timeline"
      }
    }
  ],
  "whyNot": [
    {
      "interventionType": "Autonomous AI",
      "reason": "Reason this type was not recommended"
    }
  ]
}
```

### User Prompt Builder

```
Based on the following business context, recommend the top 2-3 AI-UX intervention type combinations:

BUSINESS CONTEXT:
- Industry: {industry}
- Problem: {problemDescription}
- End Users: {endUsers}
- Risk Level: {riskLevel}
- Task Type: {taskType}
- Data Availability: {dataAvailability}
- Interaction Frequency: {interactionFrequency}
- Regulatory Requirements: {regulatoryRequirements}
- Primary Goals: {primaryGoals}
- Explainability Importance: {explainabilityImportance}
- Implementation Timeline: {implementationTimeline}
{additionalContext ? "- Additional Context: " + additionalContext : ""}

Remember:
- Recommend COMBINATIONS of types, not single types
- Rank by confidence score (0-100%)
- Include 2-3 industry-relevant examples per recommendation
- Be specific about WHY this fits their stated problem and context
- Flag any anti-patterns they should avoid
- Respond in valid JSON only
```

---

## 12. Save / Export / Share

### Save to localStorage
- On "Save Assessment," serialize the full Assessment object (answers + recommendations) and store with UUID key
- Show in Saved Assessments list on landing page
- Allow deletion
- Cap at 20 saved assessments (FIFO if exceeded, with warning)

### Export as PDF
- Use html2pdf.js to render the results page as a clean PDF
- Include: header with product name + date, all recommendation cards fully expanded, the "Why Not" section, a brief appendix explaining the taxonomy types referenced
- Filename: `ai-ux-compass-{industry}-{date}.pdf`

### Share via URL
- Encode the answers object as base64 in URL hash: `https://app.com/#/results?data={base64}`
- When loading a shared URL: decode answers, re-run the AI analysis, show results
- Note: results may vary slightly since AI is non-deterministic — add a small disclaimer on shared results

---

## 13. Design System & UI Guidelines

### Design Direction
This is a professional tool for product decision-makers. The design should feel:
- **Confident and authoritative** — like consulting a strategy firm's framework tool
- **Clean but not sterile** — warm enough to be inviting, structured enough to be credible
- **Information-dense without being overwhelming** — progressive disclosure is key

### Typography
- Use a distinctive, professional serif or geometric sans-serif for headings (e.g., DM Serif Display, Fraunces, Instrument Serif, or a unique Google Font)
- Pair with a clean, readable body font (e.g., DM Sans, Plus Jakarta Sans, Outfit)
- Avoid: Inter, Roboto, Arial, system fonts

### Color Palette
- Primary: Deep navy or charcoal (#1a1a2e or similar)
- Accent: A distinctive warm color (amber, coral, or deep teal)
- Confidence score colors: Red (low) → Amber (medium) → Green (high) gradient
- Each intervention type should have a subtle, distinct color code for visual identification across the UI
- Background: Warm off-white or very light warm gray (not pure white)

### Key UI Components

**Questionnaire steps:** One question per screen (mobile-friendly). Large, tappable option cards. Smooth transitions between steps. Back/forward navigation. Progress bar showing completion.

**Recommendation cards:** Collapsed state shows rank, name, confidence, summary. Expanded state reveals all sections with clear visual hierarchy. Autonomy level shown as a visual gauge/scale, not just text. Pros/cons shown in a visually distinct format (not just bullet lists).

**Confidence Score:** Show as a circular progress indicator or bar with percentage. Color-coded (green ≥ 80%, amber 60-79%, red < 60%).

**Autonomy Scale:** Horizontal visual scale from L1 to L5 with a marker showing where this recommendation falls. Icons or illustrations for each level.

### Responsive Design
- Mobile-first approach
- Questionnaire must work perfectly on mobile
- Results page should be readable on mobile but optimized for desktop/tablet
- PDF export can be desktop-optimized

### Micro-interactions
- Smooth transitions between questionnaire steps (slide or fade)
- Card expand/collapse animations
- Progress bar animation
- Loading analysis state with staged messages
- Confidence score counter animation (counts up from 0 to final value)

---

## 14. Edge Cases & Error Handling

### Questionnaire
- User tries to proceed without answering required question → Inline validation, highlight missing field, don't allow proceeding
- User enters very short problem description (< 20 chars) → Show helper text encouraging more detail
- User enters extremely long problem description (> 2000 chars) → Soft cap with character counter, truncate at 2000 for API call

### AI API
- API call fails (network error, rate limit, invalid key) → Show friendly error with "Try Again" button. Offer to check API key configuration.
- API returns malformed JSON → Attempt to parse with fallback regex extraction. If that fails, show "Analysis failed — please try again" with retry.
- API response doesn't match expected schema → Validate each field, use defaults for missing non-critical fields, fail gracefully for missing critical fields.
- Slow API response (> 15 seconds) → Show extended loading message ("Still analyzing..."). Timeout at 30 seconds with retry option.

### Sharing
- Shared URL with invalid/corrupted data → Show "This assessment link appears to be invalid" with option to start new
- Shared URL for an extremely old assessment → Still works (just re-runs analysis with current AI)

### Storage
- localStorage full → Warning when approaching limit (20 assessments). Offer to delete old ones.
- localStorage unavailable (private browsing) → Warn user that save/history won't work, but tool still functions

---

## 15. Future Scope (Phase 2 — NOT in this build)

These are explicitly OUT OF SCOPE for the current build. Do not build any of these, but be aware they are planned:

- **Consumption Layer Recommendations:** After recommending WHAT type of AI intervention, Phase 2 will recommend HOW to surface it (chat interface, inline suggestions, notification-based, embedded panels, voice, etc.)
- **User Accounts & History:** Cloud-based persistence, team accounts
- **Comparison Mode:** Side-by-side comparison of two assessments
- **Industry Templates:** Pre-filled questionnaires for common industry patterns
- **Implementation Roadmap Generator:** After choosing an intervention type, generate a technical implementation plan
- **Integration with Project Tools:** Export recommendations to Jira, Linear, Notion
- **API Access:** Let other tools query AI-UX Compass programmatically

---

## Implementation Notes for Claude Code

1. **Start with the data layer** — implement `taxonomy.js`, `questions.js`, `combinations.js`, and `examples.js` first. These are the knowledge base everything else depends on.

2. **Build the questionnaire flow second** — this is the most interactive part and defines the user experience. Get the multi-step wizard working with state management before connecting to AI.

3. **Implement the AI integration third** — the system prompt is provided above. Focus on getting clean JSON responses and parsing them reliably.

4. **Build the results display fourth** — this is the most information-dense screen. Use progressive disclosure (collapsed cards that expand).

5. **Add save/export/share last** — these are important but not needed for core functionality testing.

6. **Design matters** — this tool is for product decision-makers. If it looks generic or sloppy, they won't trust the recommendations. Follow the design guidelines in Section 13 closely. Make it feel like a premium tool.

7. **The AI prompt is critical** — the quality of recommendations depends almost entirely on the system prompt. The taxonomy data (Section 3), mapping logic (Section 5), and combination patterns (Section 6) must all be included in or referenced by the system prompt.

8. **Error handling is non-negotiable** — the API can fail, return weird responses, or be slow. Handle all cases gracefully. The user should never see a blank screen or raw error.

9. **Test with diverse scenarios** — try the questionnaire with healthcare, e-commerce, cybersecurity, creative production, and SaaS contexts. The recommendations should feel meaningfully different for each.

10. **The app needs an `.env` file for the API key** — include clear setup instructions in a README.md.
