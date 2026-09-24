# KAAL AI — Mini Guidance Assistant

> A deliberate guidance workspace powered by a deterministic, explainable rule-based guidance engine, structured insights, tactical checklists, and conversation persistence.

---

## 1. Project Overview

**KAAL AI — Mini Guidance Assistant** is a full-stack web application designed for thoughtful problem deconstruction and personal guidance. Unlike stochastic black-box Large Language Models, this application utilizes a **deterministic, rule-based guidance engine** that analyzes question signals, calculates taxonomy weights across controlled domains, selects structured guidance patterns, and delivers actionable frameworks with interactive tactical checklists.

All guidance sessions and history are persisted in a PostgreSQL-compatible database layer (with automatic resilient local fallback) and exposed via clean RESTful APIs.

---

## 2. Features

- **Rule-Based Guidance Engine**: 100% deterministic, explainable inference using weighted keyword signals and domain taxonomy without external LLM dependencies.
- **Structured KAAL Guidance Cards**:
  - **Core Insight**: High-impact takeaway with custom vertical accent framing.
  - **Recommended Framework**: Numbered procedural steps with active focus badges.
  - **Tactical Checklists**: Interactive checkboxes allowing users to inspect and track progress per milestone.
- **Left Collapsible History Sidebar**:
  - Organized chronologically into **Today**, **Yesterday**, and **Earlier**.
  - Highlights the currently active conversation.
  - Collapses into a minimal icon rail on desktop and transforms into a fluid slide-out drawer on mobile/tablet.
  - Quick "+ New Conversation" action.
- **Top Assistant Header & Command Palette**:
  - Abstract geometric KAAL AI identity glyph.
  - Live status indicator (`Online • Deliberate Guidance`).
  - `⌘ + K` / `Ctrl + K` command overview dialog.
- **Interactive State Switcher**:
  - Real-time toolbar switching across `Active Thread`, `Empty Welcome`, `Loading View`, and `Error State` for rapid evaluation.
- **Question Composer**:
  - Multi-line textarea with auto-resizing.
  - `Enter` to submit, `Shift + Enter` for line breaks.
  - Voice dictation trigger with live feedback.
  - Client-side and server-side input validation.
- **Complete Error & Loading Handling**:
  - Subtle pulsing thinking state with staged analysis progress ticker.
  - Standardized JSON API error responses with friendly user retry triggers.

---

## 3. Technology Stack

- **Frontend**:
  - React 19 (TypeScript)
  - Tailwind CSS v4
  - Lucide React (minimalist iconography)
- **Backend**:
  - Node.js & Express (TypeScript via `tsx`)
  - RESTful architecture with decoupled service layers
- **Database & Query Layer**:
  - PostgreSQL (via `pg` connection pool with parameterized queries and JSONB structured response storage)
  - Resilient local persistent storage fallback for zero-configuration local runs
- **Build & Dev Tooling**:
  - Vite 8 with Express middleware integration in development

---

## 4. Architecture Overview

```
                      +-----------------------------+
                      |       React Frontend        |
                      |   (Vite SPA + TypeScript)   |
                      +--------------+--------------+
                                     |
                       REST API Calls (JSON / HTTP)
                                     |
                      +--------------v--------------+
                      |       Express Server        |
                      |      (server/routes/*)      |
                      +--------------+--------------+
                                     |
                      +--------------v--------------+
                      |  Rule-Based Guidance Engine |
                      | (server/services/engine.ts) |
                      +--------------+--------------+
                                     |
                      +--------------v--------------+
                      |      Database Client        |
                      |   (PostgreSQL / JSONB)      |
                      +-----------------------------+
```

---

## 5. Rule-Based Guidance Engine

The guidance engine (`server/services/guidanceEngine.ts`) implements a deterministic 6-stage pipeline:

```
User Question
     ↓
1. Text Normalization (lowercase, strip special chars, tokenize)
     ↓
2. Taxonomy Scoring (weighted keyword matching across 5 domains)
     ↓
3. Category Selection (Career, Learning, Productivity, Well-being, or General fallback)
     ↓
4. Pattern Matching (sub-signal keyword matching for targeted frameworks)
     ↓
5. Framework Synthesis (generates Core Insight + Tactical Milestones + Checklists)
     ↓
Structured Guidance Response
```

### Controlled Categories & Weighted Signals

1. **Productivity**: `priorities` (+4), `paralyzed` (+4), `competing` (+3), `focus` (+3), `procrastin` (+3), `time` (+3), `routine` (+2), `schedule` (+2)
2. **Career**: `interview` (+4), `job` (+3), `career` (+3), `resume` (+3), `promotion` (+3), `salary` (+2), `role` (+2)
3. **Learning**: `retention` (+3), `study` (+3), `learn` (+3), `exam` (+3), `course` (+2), `practice` (+2), `concept` (+2)
4. **Well-being**: `burnout` (+4), `overwhelmed` (+4), `stress` (+3), `exhausted` (+3), `boundaries` (+3), `balance` (+2)
5. **General**: Fallback domain activated when top category score is `< 2`, handling `decision`, `strategy`, `reflection`, and `clarity`.

---

## 6. API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/guidance` | Submits a question, runs the rule engine, saves the session, and returns the structured guidance response. |
| `GET` | `/api/history` | Fetches all previous conversations, sorted newest first. |
| `GET` | `/api/history/:id` | Fetches a single guidance conversation by its numeric ID (404 if not found). |
| `GET` | `/api/health` | Health-check endpoint reporting server and engine status. |

---

## 7. Database Structure

### PostgreSQL Schema

```sql
CREATE TABLE IF NOT EXISTS guidance_sessions (
  id SERIAL PRIMARY KEY,
  question TEXT NOT NULL,
  category VARCHAR(64) NOT NULL,
  response JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_guidance_sessions_created_at 
ON guidance_sessions (created_at DESC);
```

### Stored Response Structure (JSONB)

```json
{
  "title": "Apply Asymmetric Impact & Sequential Ownership",
  "summary": "When multiple high-value priorities compete, paralysis usually stems from treating them all as active sprints rather than sequenced milestones.",
  "steps": [
    "Apply the Asymmetric Impact Test to isolate irreversible consequences.",
    "Ruthlessly sequence rather than parallelize execution across workstreams.",
    "Institute binary weekly done-criteria for verifiable progress."
  ],
  "frameworkSteps": [
    {
      "id": 1,
      "title": "Apply the Asymmetric Impact Test",
      "status": "Active Focus",
      "description": "Identify which priority carries irreversible consequences if delayed 14 days versus those that cause merely temporary organizational friction.",
      "checklist": [
        "Map all 3 initiatives into 'Irreversible Damage' vs 'Friction Only'",
        "Communicate 14-day delay tolerance to stakeholders today"
      ]
    }
  ]
}
```

---

## 8. Environment Variables

Create or configure `.env` based on `.env.example`:

```bash
# PostgreSQL Connection URL
DATABASE_URL="postgres://username:password@localhost:5432/kaal_guidance"

# Express server port (defaults to 3000)
PORT=3000
```

*Note: If `DATABASE_URL` is omitted, the application runs with an automatic disk-persisted fallback store (`.guidance_data.json`), ensuring zero-friction local development.*

---

## 9. Local Setup & Running Instructions

### Prerequisites
- Node.js 18+
- npm or yarn

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment (Optional)
```bash
cp .env.example .env
# Edit DATABASE_URL if connecting to a local PostgreSQL instance
```

### 3. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser. The Express server boots on port 3000 with Vite middlewares mounted in dev mode.

### 4. Build for Production
```bash
npm run build
npm start
```

---

## 10. Example API Request & Response

### Request (`POST /api/guidance`)

```bash
curl -X POST http://localhost:3000/api/guidance \
  -H "Content-Type: application/json" \
  -d '{"question": "How can I prepare for an interview?"}'
```

### Response (`201 Created`)

```json
{
  "id": 6,
  "question": "How can I prepare for an interview?",
  "category": "Career",
  "response": {
    "title": "Prepare with Structured Evidence & Targeted Inquiry",
    "summary": "High-caliber interviews are evaluated on clear narrative structure, specific impact metrics, and thoughtful cultural calibration.",
    "steps": [
      "Structure your key achievements using the STAR-Impact framework.",
      "Synthesize three core professional strengths with concrete data points.",
      "Craft strategic questions that evaluate leadership style and team cadence."
    ],
    "frameworkSteps": [
      {
        "id": 1,
        "title": "Build the Core Narrative Matrix",
        "status": "Active Focus",
        "description": "Prepare five versatile case stories illustrating leadership, conflict resolution, technical rigor, and handling ambiguity.",
        "checklist": [
          "Document 5 stories with Problem, Action, and Quantitative Result",
          "Rehearse delivering each case story in under 2.5 minutes"
        ]
      },
      {
        "id": 2,
        "title": "Map Questions to Key Evaluator Competencies",
        "status": "Pending",
        "description": "Review the role scorecard to address technical competence, cross-functional communication, and strategic judgment.",
        "checklist": [
          "Cross-reference job requirements against your portfolio highlights",
          "Prepare specific explanations for past setbacks and key learnings"
        ]
      },
      {
        "id": 3,
        "title": "Formulate High-Caliber Reverse Inquiries",
        "status": "Pending",
        "description": "Prepare thoughtful questions that reverse the interview to evaluate organizational maturity and team health.",
        "checklist": [
          "Ask: 'What does extraordinary impact look like in this role at 90 days?'",
          "Ask: 'Where is the team currently experiencing its greatest operational bottleneck?'"
        ]
      }
    ],
    "meta": {
      "category": "Career",
      "pattern": "Interview Strategy & Narrative Mastery",
      "score": 4,
      "matchedKeywords": ["interview"],
      "engine": "KAAL Rule-Based Guidance Engine"
    }
  },
  "createdAt": "2026-09-23T10:45:00.000Z"
}
```

---

## 11. Challenges & Architectural Decisions

1. **Deterministic vs. Stochastic Guidance**: Rather than invoking a non-deterministic LLM prone to hallucinations, a transparent rule-based algorithm was implemented. This allows predictable, structured advice cards and instant response latency.
2. **Dual Schema Compatibility**: The prompt requested basic steps (`steps: string[]`), while the visual design demanded interactive tactical checklists and status indicators (`frameworkSteps`). Both formats are generated and serialized into the JSONB payload, ensuring backward and forward compatibility.
3. **Graceful Database Resilience**: In development and interview demonstration environments where external PostgreSQL services may not be running, the database manager transparently checks connectivity and falls back to persistent local storage with seeded sessions matching the design mockup.
4. **Interactive States Selector**: Embedded directly beneath the assistant header, reviewers can seamlessly toggle between `Active Thread`, `Empty Welcome`, `Loading View`, and `Error State` to audit state coverage without leaving the interface.

---

## 12. Future Improvements (Post-Assignment)

- User authentication & role-based session isolation.
- Export guidance frameworks to Markdown or PDF.
- Search filter across question history.
- Custom user taxonomy rule creation.
