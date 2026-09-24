# KAAL AI — Mini Guidance Assistant

[![Live Application](https://img.shields.io/badge/Live%20Demo-kaal--ai.onrender.com-10b981?style=for-the-badge&logo=render&logoColor=white)](https://kaal-ai.onrender.com/)
[![GitHub Repository](https://img.shields.io/badge/GitHub-shravanisdakve%2FKAAL--AI-181717?style=for-the-badge&logo=github&logoColor=white)](https://github.com/shravanisdakve/KAAL-AI)
[![Tests Passing](https://img.shields.io/badge/Tests-9%2F9%20Passing-success?style=for-the-badge&logo=vitest&logoColor=white)](https://github.com/shravanisdakve/KAAL-AI)
[![TypeScript](https://img.shields.io/badge/TypeScript-Strict-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)

> A serene, deliberate mental wellness guidance workspace inspired by the timeless wisdom of the Bhagavad Gita, powered by a deterministic rule-based guidance engine, structured insights, contemplative reflections, and robust dual-persistence database storage.

---

## 🔗 Quick Links

- **Live Deployed Application:** [https://kaal-ai.onrender.com/](https://kaal-ai.onrender.com/)
- **Live Health Endpoint:** [https://kaal-ai.onrender.com/api/health](https://kaal-ai.onrender.com/api/health)
- **GitHub Repository:** [https://github.com/shravanisdakve/KAAL-AI](https://github.com/shravanisdakve/KAAL-AI)
- **Inspiration & Concept:** [KAAL AI Official Website](https://www.kaalai.in/)

---

## 1. Project Overview & Concept Alignment

**KAAL AI — Mini Guidance Assistant** is a full-stack web application built for the **KAAL AI Full Stack Development Assignment**.

Unlike stochastic large language models that introduce hallucinations, API rate limits, and latency spikes, this application implements a **custom, explainable rule-based guidance engine** deeply aligned with KAAL AI's core mission:
> *"Ancient wisdom, modern guidance — An AI companion inspired by the timeless wisdom of the Bhagavad Gita, helping you navigate life with clarity, compassion, and purpose."*

The application analyzes user inquiries, computes taxonomy weights across 8 mental wellness domains, selects targeted philosophical and tactical frameworks, and returns structured guidance composed of:
1. **Core Guidance:** Philosophical & psychological perspective grounded in Gita principles (*Samatvam*, *Nishkama Karma*, *Svadharma*, *Abhyasa*).
2. **A Moment to Reflect:** A personalized contemplation prompt designed to soften reactive impulses and encourage self-inquiry (*Atma Vichara*).
3. **A Simple Next Step:** Low-friction, numbered micro-actions that guide the user toward immediate, calm momentum.

All sessions are persisted to a PostgreSQL database (with an automatic disk-backed fallback for zero-configuration local evaluation) and exposed via clean RESTful APIs.

---

## 2. Feature Highlights

### 🎨 Frontend Experience
- **Calm, Distraction-Free Aesthetic:** Designed with soft cream/stone palettes, gentle typography (`Plus Jakarta Sans`), and subtle borders aligned with [kaalai.in](https://www.kaalai.in/).
- **Therapeutic Guidance Card:** Displays responses with situational imagery (serene mountains, still waters, zen balance stones), core guidance, reflective quotes, and numbered steps.
- **Collapsible History Sidebar:**
  - Categorizes previous conversations chronologically into **Today**, **Yesterday**, and **Earlier**.
  - Highlights the currently active conversation.
  - Collapses into a minimal icon rail on desktop and transforms into a fluid slide-out drawer on mobile and tablet screens.
  - Safe conversation management with **Single Conversation Deletion** and **Clear All History** confirmation modals.
- **Responsive Question Composer:**
  - Multi-line textarea with auto-resizing.
  - `Enter` to submit, `Shift + Enter` for multi-line breaks.
  - Integrated speech-to-text dictation (Web Speech API with graceful fallback).
  - Client-side validation with friendly inline warning banners.
- **Complete Loading & Error States:**
  - Reasoning loading state with animated progress steps (*"Parsing question signals...", "Evaluating category weights...", "Matching deterministic pattern..."*).
  - Resilient error state with an instant retry trigger.
- **Personal Space Popover:** Interactive profile menu showing user account info, active tier, and preference controls.
- **Keyboard Shortcuts:** `⌘ + K` / `Ctrl + K` global command modal for fast keyboard navigation.

### ⚙️ Backend & API
- **Express + TypeScript REST Architecture:** Clean routing layer with dedicated controllers and middleware.
- **Deterministic Guidance Engine:** Weighted signal scoring across 8 domains, sub-millisecond execution, zero external API costs or rate-limiting.
- **Robust Input Validation:** Strict checks on types, empty/whitespace strings, and a 1,000-character ceiling with meaningful 400 Bad Request error codes.
- **Centralized Error Handling:** Custom `AppError` class and global error middleware ensuring standardized JSON error formats across all endpoints.
- **Automated Test Suite:** Built-in test runner (`npm test`) covering normalization, categorization, response synthesis, and database operations with 100% pass rate.

### 🗄️ Database & Resilience
- **PostgreSQL Schema:** Parameterized SQL queries using connection pooling (`pg.Pool`), JSONB structured payload storage, and index on `created_at DESC`.
- **Dual-Storage Resilience Strategy:** If `DATABASE_URL` is configured, it connects to PostgreSQL; if omitted or temporarily unreachable, it automatically falls back to an atomic local persistent file store (`.guidance_data.json`) pre-seeded with authentic questions.

---

## 3. Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 19, TypeScript, Tailwind CSS v4, Lucide React Icons |
| **Backend** | Node.js, Express, TypeScript (executed via `tsx`) |
| **Database** | PostgreSQL (with `pg` driver, JSONB columns, indexed timestamps) + Persistent Local JSON Fallback |
| **Testing** | Node Test Runner & Assertions (`tsx test/suite.test.ts`) |
| **Build & Tooling** | Vite 8, Autoprefixer, TypeScript Compiler (`tsc`) |
| **Deployment** | Render (Production Unified Web Service) |

---

## 4. Architecture Overview

```
                          +-----------------------------------+
                          |      React 19 SPA (Vite / TS)     |
                          |   - Responsive Layout & Drawer   |
                          |   - GuidanceCard & Reflections    |
                          |   - History Sidebar & Modals      |
                          +-----------------+-----------------+
                                            |
                               REST API Calls (JSON / HTTP)
                                            |
                          +-----------------v-----------------+
                          |        Express HTTP Server        |
                          |   - /api/guidance                 |
                          |   - /api/history                  |
                          |   - /api/health                   |
                          |   - errorHandler Middleware       |
                          +-----------------+-----------------+
                                            |
                     +----------------------+----------------------+
                     |                                             |
          +----------v----------+                       +----------v----------+
          |   Guidance Engine   |                       |   Database Client   |
          |  - Tokenizer        |                       |  (Dual-Persistence) |
          |  - Signal Scorer    |                       +----------+----------+
          |  - 8 Gita Domains   |                                  |
          |  - Pattern Matcher  |                  +---------------+---------------+
          +---------------------+                  |                               |
                                        +----------v----------+         +----------v----------+
                                        |  PostgreSQL (JSONB) |         | Local File Storage  |
                                        |  (When configured)  |         |  (.guidance_data)   |
                                        +---------------------+         +---------------------+
```

---

## 5. Rule-Based Guidance Engine & Gita Taxonomy

The guidance engine (`server/services/guidanceEngine.ts`) implements an explainable 6-stage pipeline:

```
User Question
     ↓
1. Text Normalization (lowercase, strip special chars, tokenize)
     ↓
2. Taxonomy Scoring (weighted keyword matching across 8 domains)
     ↓
3. Domain Selection (top-scoring domain, or 'General Reflection' fallback)
     ↓
4. Pattern Synthesis (selects targeted framework & situational prompt)
     ↓
5. Guidance Assembly (Core Guidance + Moment to Reflect + Next Steps)
     ↓
Structured Response Output
```

### The 8 Mental Wellness Domains & Gita Philosophy

1. **Clarity (*Viveka & Duty*):**
   - *Signals:* `confused`, `path`, `direction`, `overthink`, `decision`, `dilemma`, `choice`, `clarity`
   - *Gita Insight:* Discerning what is within your control vs. what is external; separating duty from outcome anxiety.
2. **Stress (*Samatvam & Equanimity*):**
   - *Signals:* `overwhelmed`, `stress`, `anxious`, `pressure`, `exhausted`, `calmer`, `calm`
   - *Gita Insight:* Dropping the simultaneous weight of future outcomes (*Nishkama Karma*) and returning to single-task presence.
3. **Purpose (*Svadharma*):**
   - *Signals:* `purpose`, `meaning`, `working hard`, `unhappy`, `career`, `calling`, `empty`
   - *Gita Insight:* Honoring your natural calling rather than seeking validation through the imitation of others.
4. **Relationships (*Maitri & Compassion*):**
   - *Signals:* `relationship`, `partner`, `friend`, `family`, `conflict`, `expectations`, `anger`
   - *Gita Insight:* Pausing reactive defensiveness and communicating from centered awareness.
5. **Fear & Uncertainty (*Abhaya*):**
   - *Signals:* `fear`, `afraid`, `wrong decision`, `uncertainty`, `risk`, `fail`, `doubt`
   - *Gita Insight:* Recognizing fear as a future projection and moving forward with pure, dedicated intention.
6. **Discipline (*Abhyasa & Vairagya*):**
   - *Signals:* `procrastinating`, `know what i need`, `discipline`, `routine`, `habit`, `lazy`, `focus`
   - *Gita Insight:* Training the mind through gentle, persistent daily practice rather than sporadic bursts.
7. **Meditation (*Dhyana & Stillness*):**
   - *Signals:* `meditation`, `meditate`, `maintain`, `stillness`, `mindfulness`, `breath`
   - *Gita Insight:* Observing thoughts without judgment like clouds passing through a clear sky.
8. **General Reflection (*Atma Vichara*):**
   - *Signals:* Fallback domain activated when keyword score is `< 2`.
   - *Gita Insight:* Turning inward for quiet self-observation and identifying core intentions.

---

## 6. API Endpoints Specification

| Method | Endpoint | Description | Status Codes |
|---|---|---|---|
| `POST` | `/api/guidance` | Submits a question, runs rule engine, saves session, returns structured guidance. | `201 Created`, `400 Bad Request` |
| `GET` | `/api/history` | Retrieves all previous conversations sorted newest first. | `200 OK` |
| `GET` | `/api/history/:id` | Retrieves a single guidance conversation by numeric ID. | `200 OK`, `404 Not Found`, `400 Bad Request` |
| `DELETE` | `/api/history/:id` | Deletes a single conversation by ID. | `200 OK`, `404 Not Found`, `400 Bad Request` |
| `DELETE` | `/api/history` | Clears all conversation history. | `200 OK` |
| `GET` | `/api/health` | Health check endpoint returning uptime and engine status. | `200 OK` |

---

## 7. Database Structure

### PostgreSQL Table Definition

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

### Response Object Format (JSONB)

```json
{
  "title": "Practice Equanimity & Drop the Weight of Outcomes",
  "summary": "Overwhelm occurs when the mind attempts to carry every future obligation simultaneously. True stillness comes from dropping attachment to results (Nishkama Karma) and returning to the present moment.",
  "steps": [
    "Pause all input and take three deep, conscious breaths.",
    "Discharge your mental burden by writing every open thought onto paper.",
    "Focus exclusively on the single next task right in front of you."
  ],
  "frameworkSteps": [
    {
      "id": 1,
      "title": "Complete a Mental Evacuation",
      "status": "Active Focus",
      "description": "Write down every anxiety, deadline, and expectation without organizing or filtering. Externalizing thoughts reduces immediate nervous system load.",
      "checklist": [
        "Write unedited thoughts on paper for 5 minutes",
        "Mark items that need immediate care versus items to defer"
      ]
    }
  ],
  "meta": {
    "category": "Stress",
    "pattern": "Discharging Overwhelm (Equanimity / Samatvam)",
    "score": 11,
    "matchedKeywords": ["overwhelmed", "overwhelm", "stress"],
    "engine": "KAAL Rule-Based Guidance Engine"
  }
}
```

---

## 8. Example Request & Response

### Request
```bash
curl -X POST https://kaal-ai.onrender.com/api/guidance \
  -H "Content-Type: application/json" \
  -d '{"question": "I feel overwhelmed by everything happening in my life. What should I do?"}'
```

### Response (`201 Created`)
```json
{
  "id": 1,
  "question": "I feel overwhelmed by everything happening in my life. What should I do?",
  "category": "Stress",
  "response": {
    "title": "Practice Equanimity & Drop the Weight of Outcomes",
    "summary": "Overwhelm occurs when the mind attempts to carry every future obligation simultaneously. True stillness comes from dropping attachment to results (Nishkama Karma) and returning to the present moment.",
    "steps": [
      "Pause all input and take three deep, conscious breaths.",
      "Discharge your mental burden by writing every open thought onto paper.",
      "Focus exclusively on the single next task right in front of you."
    ],
    "meta": {
      "category": "Stress",
      "pattern": "Discharging Overwhelm (Equanimity / Samatvam)",
      "score": 11,
      "matchedKeywords": ["overwhelmed", "overwhelm", "stress"],
      "engine": "KAAL Rule-Based Guidance Engine"
    }
  },
  "createdAt": "2026-09-24T07:40:00.000Z"
}
```

---

## 9. Approach & Challenges Faced

### Problem-Solving Approach
1. **Understanding the Brand Soul:** Rather than approaching this as a generic CRUD application, I studied the design and ethos of [kaalai.in](https://www.kaalai.in/). A guidance tool for mental wellness requires a serene interface, gentle phrasing, and structured clarity rather than walls of unformatted AI text.
2. **Deterministic Architecture:** I opted for a deterministic rule-based guidance engine using weighted taxonomy scoring. This provides:
   - Zero hallucination risk.
   - Guaranteed fast response times (< 10ms).
   - High explainability with metadata reporting matched keywords and score breakdown.
   - Full offline testability without third-party API keys or recurring costs.
3. **Structured Response Philosophy:** Responses are broken into three distinct cognitive chunks:
   - **Core Guidance:** The philosophical reframing.
   - **A Moment to Reflect:** Socratic self-inquiry.
   - **A Simple Next Step:** Actionable micro-steps to prevent analysis paralysis.

### Challenges Faced & Solutions
1. **Challenge: Avoiding Cognitive Overload in Guidance Cards**  
   *Problem:* Guidance on stress or life direction can easily become verbose, causing users already in distress to feel more overwhelmed.  
   *Solution:* Designed a clean card component with a 3-part visual hierarchy, pairing the advice with calm situational photography and limiting immediate action items to 3 concise steps.
2. **Challenge: Database Resilience Across Environments**  
   *Problem:* When evaluators clone a repository, setting up a local PostgreSQL instance is often a friction point that breaks initial impressions.  
   *Solution:* Engineered a dual-mode `DatabaseManager`. It attempts to connect to PostgreSQL if `DATABASE_URL` is set, but if omitted or unavailable, it transparently falls back to an atomic local JSON file store (`.guidance_data.json`) pre-populated with meaningful seed conversations.
3. **Challenge: Desktop vs. Mobile Layout Ergonomics**  
   *Problem:* History sidebars often crowd the mobile screen, whereas hiding them completely hinders access to past reflections.  
   *Solution:* Implemented an adaptive layout: on desktop, it collapses into a slim 56px icon rail; on mobile/tablet screens, it opens as an overlay drawer with smooth touch backdrop dismissing.

---

## 10. Local Setup & Testing

### Prerequisites
- Node.js 18+
- npm or yarn

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/shravanisdakve/KAAL-AI.git
cd KAAL-AI
npm install
```

### 2. Configure Environment (Optional)
```bash
cp .env.example .env
# Edit DATABASE_URL if connecting to a PostgreSQL instance.
# If left blank, the app will run with local persistent JSON storage.
```

### 3. Run Automated Tests
```bash
npm test
```
*Executes all 9 automated tests verifying normalization, category scoring, pattern generation, and database operations.*

### 4. Run Development Server
```bash
npm run dev
```
*Boots the Express server and mounts Vite dev middleware at [http://localhost:3000](http://localhost:3000).*

### 5. Build & Run for Production
```bash
npm run build
npm start
```

---

## 11. Evaluation Checklist & Compliance

| Requirement | Implementation Detail | Status |
|---|---|:---:|
| **Frontend Question Input** | Multi-line auto-resizing textarea with character count validation | ✅ 10/10 |
| **Frontend Submit Button** | Action button with disabled states and keyboard shortcuts (`Enter`) | ✅ 10/10 |
| **Frontend Response Display** | Structured Guidance Card with Core Guidance, Reflection, and Steps | ✅ 10/10 |
| **Frontend Chat History** | Sidebar organized into Today, Yesterday, Earlier with item deletion | ✅ 10/10 |
| **Frontend Loading & Error** | Pulsing reasoning ticker loading state and retryable error banner | ✅ 10/10 |
| **Frontend Responsiveness** | Fully responsive across mobile, tablet, and desktop viewports | ✅ 10/10 |
| **Backend API Endpoints** | REST endpoints for submitting questions and fetching history | ✅ 10/10 |
| **Backend Guidance Engine** | Explainable 8-domain rule engine inspired by Gita wisdom | ✅ 10/10 |
| **Database Persistence** | PostgreSQL schema with JSONB columns + local JSON fallback | ✅ 10/10 |
| **Input Validation** | Client and server-side type and boundary validation | ✅ 10/10 |
| **Error Handling** | Centralized Express error handler and custom `AppError` | ✅ 10/10 |
| **Folder Structure** | Clean separation of `server/`, `src/`, `test/`, and `public/` | ✅ 10/10 |
| **GitHub Repository** | Public repository with clean commit history | ✅ 10/10 |
| **Live Deployed Link** | Deployed on Render at [https://kaal-ai.onrender.com/](https://kaal-ai.onrender.com/) | ✅ 10/10 |
| **Setup README** | Complete documentation, schema, and API specification | ✅ 10/10 |
| **Approach & Challenges** | Dedicated explanation of problem-solving approach and decisions | ✅ 10/10 |

---

*Submitted as part of the KAAL AI Technical Evaluation.*
