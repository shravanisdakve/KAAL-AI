# KAAL AI — Mini Guidance Assistant

[![Live Application](https://img.shields.io/badge/Live%20Demo-kaal--ai.onrender.com-10b981?style=for-the-badge&logo=render&logoColor=white)](https://kaal-ai.onrender.com/)
[![GitHub Repository](https://img.shields.io/badge/GitHub-shravanisdakve%2FKAAL--AI-181717?style=for-the-badge&logo=github&logoColor=white)](https://github.com/shravanisdakve/KAAL-AI)
[![Tests Passing](https://img.shields.io/badge/Tests-98%2F98%20Passing-success?style=for-the-badge&logo=vitest&logoColor=white)](https://github.com/shravanisdakve/KAAL-AI)
[![TypeScript](https://img.shields.io/badge/TypeScript-Strict-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)

**KAAL AI** is a full-stack, emotionally intelligent personal guidance companion inspired by the philosophical wisdom of the Bhagavad Gita and modern reflective psychology.

Unlike standard chatbots that blindly quote scripture on every turn, KAAL AI features a **multi-layered, guardrailed guidance pipeline**. It prioritizes safety and domain triage first, uses a structured query classifier, and executes **conditional hybrid Retrieval-Augmented Generation (RAG)**—retrieving and presenting Gita teachings only when they are genuinely relevant and intellectually honest for the user's dilemma.

---

## 🔗 Quick Links

* **Live Deployed Application:** [https://kaal-ai.onrender.com/](https://kaal-ai.onrender.com/)
* **Live Health Endpoint:** [https://kaal-ai.onrender.com/api/health](https://kaal-ai.onrender.com/api/health)
* **GitHub Repository:** [https://github.com/shravanisdakve/KAAL-AI](https://github.com/shravanisdakve/KAAL-AI)
* **Concept Inspiration:** [KAAL AI Official Website](https://www.kaalai.in/)

---

## 🌟 Core System Architecture

```text
User Question / Voice Input
          │
          ▼
┌────────────────────────────────────────────────────────┐
│  Layer 0: Deterministic High-Risk Crisis Safety Gate   │
└────────────────────────────────────────────────────────┘
          │ (If self-harm/crisis detected → Immediate helpline protocol; 0 Gita, 0 visuals)
          ▼ (Safe)
┌────────────────────────────────────────────────────────┐
│  Layer 1: Deterministic Technical & Practical Filter   │
└────────────────────────────────────────────────────────┘
          │ (If hardware/IT/coding/trivia/greeting → Pragmatic triage; 0 spiritual metaphors)
          ▼ (Life Dilemma)
┌────────────────────────────────────────────────────────┐
│  Layer 2: Structured Intent & Dilemma Classifier       │
└────────────────────────────────────────────────────────┘
          │ (Classifies: career_confusion, self_worth, outcome_attachment, overwhelm, etc.)
          ▼
┌────────────────────────────────────────────────────────┐
│  Layer 3: Independent Hybrid Gita RAG Retrieval        │
│  - gemini-embedding-2 (768d)                           │
│  - PostgreSQL + pgvector Cosine Search (<=>)           │
│  - 5-Factor Weighted Composite Reranker                │
│  - Strict 0.70 Relevance Gate (Decouples if below)     │
└────────────────────────────────────────────────────────┘
          │
          ▼
┌────────────────────────────────────────────────────────┐
│  Layer 4: High-EQ Conversational Guidance Generator    │
│  (Gemini 2.5 Flash + Fallback Synthesizer)             │
│  - Empathetic active listening prose                   │
│  - Honest "Why this relates" connection (or decoupled) │
│  - Contemplative reflection prompt                     │
│  - 3 concrete, low-friction micro-actions              │
└────────────────────────────────────────────────────────┘
          │
          ▼
┌────────────────────────────────────────────────────────┐
│  Layer 5: Independent Visual Eligibility & Generation  │
│  (Gated SVG scene: Still Lake, Crossroads, River, etc.)│
└────────────────────────────────────────────────────────┘
          │
          ▼
┌────────────────────────────────────────────────────────┐
│  Layer 6: Session Persistence & Client Delivery        │
│  - Anonymous session scoping (zero-auth privacy)       │
│  - Concurrency & in-flight request ownership           │
│  - Streaming Web Speech API voice dictation            │
└────────────────────────────────────────────────────────┘
```

---

## 🛡️ Guardrails & Safety Protocols

1. **Deterministic High-Risk Crisis Safety Gate (Highest Priority):**
   - Pattern-matched with zero false-positives against crisis language, self-harm, or despair.
   - Completely bypasses LLM and RAG retrieval.
   - Delivers immediate crisis helpline resources (988 for US/Canada, 14416 / 1800-599-0019 for India, emergency links).
   - Sustains supportive follow-up context across multi-turn exchanges without jumping back to spiritual scripture.
2. **Deterministic Technical & Hardware Troubleshooting Shield:**
   - Filters hardware failures (overheating, unexpected shutdowns, Wi-Fi failure, charging port issues), coding syntax questions, factual trivia, and casual greetings.
   - Prevents *"spiritual gaslighting"*—even if a user says they are *"stressed about a broken laptop"*, the system delivers step-by-step IT triage without existential or meditative framing.
3. **Decoupled Guidance Architecture:**
   - When a user shares a real emotional dilemma that does not warrant scripture (or falls below the 0.70 RAG threshold), KAAL AI delivers situation-specific psychological coaching without forcing quotes.

---

## 🔍 Hybrid RAG Pipeline

The Bhagavad Gita wisdom retrieval uses a two-stage hybrid process:

### Stage 1 — Dense Semantic Retrieval (Recall)
* Dense 768-dimensional embeddings generated with Google `gemini-embedding-2`.
* Verses are stored as **enriched wisdom documents** containing Sanskrit, English translation, core wisdom, themes, situational applications, emotional resonance, and contextual cautions.
* Searched in PostgreSQL using `pgvector` with cosine distance (`<=>`), retrieving candidate verses.

### Stage 2 — Domain-Aware Composite Reranking (Precision)
Candidates are reranked using a 5-factor weighted formula:
```text
Score = 0.40(Semantic Similarity)
      + 0.25(Intent Alignment)
      + 0.15(Theme / Lexical Match)
      + 0.10(Emotional Resonance)
      + 0.10(Contextual Fit)
```

### The Strict 0.70 Relevance Gate
* If top candidate score $\ge 0.70$, the verse is attached with a thoughtful, non-dogmatic intellectual connection explaining why the verse applies to the situation.
* If below 0.70, scripture is decoupled (`shloka = null`).

---

## 🎙️ Resilient Web Speech API Integration

* **Native Streaming:** Uses `window.SpeechRecognition` / `window.webkitSpeechRecognition` with interim token streaming and continuous state management.
* **Non-Destructive Text Appending:** Preserves previously typed text, appending recognized speech cleanly with appropriate spacing.
* **Duplicate Prevention:** Differentiates finalized chunks from interim hypotheses to eliminate transcript duplication.
* **Privacy & Browser Protection:**
  - Robust capability detection checks if the constructor can actually instantiate.
  - In privacy-shielded browsers like Brave that block Google's speech backend (`service-not-allowed` / `network`), the system catches the block, displays an actionable message, and gracefully hides the button without leaving a broken control.
  - In unsupported browsers (e.g. Firefox), the microphone button is cleanly hidden on mount.
  - Text input remains 100% operational in all environments.

---

## ⚡ Concurrency & Ownership Protection

* **Request Ownership Gate:** Every in-flight query is bound to its originating conversation thread via unique request IDs.
* **AbortController Clean Cancellation:** Switching conversations or starting a new query immediately aborts stale in-flight HTTP requests.
* **Zero Race Conditions:** Out-of-order network responses cannot overwrite or corrupt newer conversation history.

---

## 🛠️ Tech Stack

### Frontend
* **React 19**
* **TypeScript** (Strict mode)
* **Vite 8**
* **Tailwind CSS 4**
* **Lucide React Icons**
* **Motion**

### Backend
* **Node.js & Express**
* **TypeScript**
* **PostgreSQL + pgvector** (with persistent local fallback when DB is offline)

### AI & Embeddings
* **Google GenAI SDK** (`@google/genai`)
* **Gemini 2.5 Flash** (Conversational synthesis and structured query classification)
* **gemini-embedding-2** (Dense 768-dimension vector search)

---

## 🧪 Automated Test Suite (98 Tests)

The test suite covers the complete application contract deterministically:

```bash
npm test
```

```text
📊 Test Results: 98 passed, 0 failed.
```

### Coverage Highlights:
* **Category Scoring & Signal Detection:** Verifies lexical weights and category identification.
* **Safety Protocols:** Verifies high-risk crisis bypass and false-positive shields.
* **Layered Guardrails:** Verifies hardware troubleshooting, coding questions, factual trivia, and casual greetings.
* **Structured Classifier:** Verifies exact intent classification (`career_confusion`, `self_worth`, `outcome_attachment`, `procrastination`, `grief`, `overwhelm`).
* **RAG Precision & 0.70 Gate:** Validates correct shloka retrieval (e.g., BG 2.47 for outcome attachment, BG 3.35 for life path, BG 3.8 for procrastination) and rejection of inappropriate verses.
* **Speech Recognition:** Unit tests for browser detection, transcript concatenation, interim/final chunk processing, error mappings, and unmount cleanup.
* **Concurrency & Race Conditions:** Validates request ownership, AbortController invalidation, and session isolation.

---

## 💻 Local Development

1. **Clone the Repository:**
   ```bash
   git clone https://github.com/shravanisdakve/KAAL-AI.git
   cd KAAL-AI
   npm install
   ```

2. **Environment Configuration:**
   Create a `.env` file in the root directory:
   ```env
   PORT=3000
   DATABASE_URL=postgresql://user:password@localhost:5432/kaal_ai
   GEMINI_API_KEY=your_gemini_api_key_here
   ```

3. **Start Development Server:**
   ```bash
   npm start
   ```
   Open `http://localhost:3000` in your browser.

4. **Run Verification Commands:**
   ```bash
   npm run lint   # TypeScript strict check (0 errors)
   npm test       # 98-test automated test suite
   npm run build  # Vite production build
   ```

---

## 🚀 Production Deployment on Render

* **Web Service:** `kaal-ai-guidance` (Node.js environment)
* **Build Command:** `npm install --legacy-peer-deps && npm run build`
* **Start Command:** `npm start`
* **Configuration:** Managed via [`render.yaml`](render.yaml) connected to GitHub `main`.
