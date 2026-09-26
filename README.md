# KAAL AI — Mini Guidance Assistant

[![Live Application](https://img.shields.io/badge/Live%20Demo-kaal--ai.onrender.com-10b981?style=for-the-badge&logo=render&logoColor=white)](https://kaal-ai.onrender.com/)
[![GitHub Repository](https://img.shields.io/badge/GitHub-shravanisdakve%2FKAAL--AI-181717?style=for-the-badge&logo=github&logoColor=white)](https://github.com/shravanisdakve/KAAL-AI)
[![Tests Passing](https://img.shields.io/badge/Tests-29%2F29%20Passing-success?style=for-the-badge&logo=vitest&logoColor=white)](https://github.com/shravanisdakve/KAAL-AI)
[![TypeScript](https://img.shields.io/badge/TypeScript-Strict-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)

**KAAL AI** is a personal guidance companion that helps users navigate confusion, stress, self-doubt, burnout, fear of failure, relationship challenges, and life decisions.

Its core differentiator is a **hybrid Retrieval-Augmented Generation (RAG) pipeline for Bhagavad Gita wisdom**. Instead of attaching a verse to every response, KAAL AI retrieves and presents Gita teachings only when they are genuinely relevant to the user's situation.

---

## 🔗 Quick Links

* **Live Deployed Application:** [https://kaal-ai.onrender.com/](https://kaal-ai.onrender.com/)
* **Live Health Endpoint:** [https://kaal-ai.onrender.com/api/health](https://kaal-ai.onrender.com/api/health)
* **GitHub Repository:** [https://github.com/shravanisdakve/KAAL-AI](https://github.com/shravanisdakve/KAAL-AI)
* **Inspiration & Concept:** [KAAL AI Official Website](https://www.kaalai.in/)

---

## Features

* **Conversational AI Guidance:** Empathetic, grounded prose that validates feelings and offers calm clarity.
* **Conditional Bhagavad Gita Retrieval:** Relevant verses are surfaced only when the situation genuinely calls for spiritual/philosophical context.
* **Hybrid Semantic + Domain-Aware RAG:** Gemini embeddings + PostgreSQL pgvector vector search paired with a 5-factor reranker.
* **0.70 Relevance Gate:** Rejects verses below threshold to prevent forced scriptural matching for casual or non-philosophical queries.
* **PostgreSQL Persistence:** Complete session and history storage with JSONB responses.
* **Anonymous Session Isolation:** Lightweight client-side session ID scoping history per device without requiring login.
* **Multi-Turn Conversational Context:** Continuous dialogue threads preserving conversational context across exchanges.
* **Reflection Prompts & Micro-Actions:** Every guidance response includes a perspective-shifting reflection question and three practical next steps.
* **Situational Visual Guidance:** Procedural dynamic SVG landscape visuals reflecting the mood of the seeker.
* **Responsive Desktop & Mobile Interface:** Fluid layout tested on mobile viewports (390×844) with zero horizontal overflow.
* **Graceful Degradation:** Deterministic fallback when embedding/vector infrastructure is offline.

---

## Tech Stack

### Frontend
* React 19
* TypeScript
* Vite
* Tailwind CSS
* Lucide React
* Motion

### Backend
* Node.js
* Express
* TypeScript
* `pg` PostgreSQL client + `pgvector`

### AI & Embeddings
* Google GenAI SDK (`@google/genai`)
* Gemini 2.5 Flash for conversational guidance generation
* `gemini-embedding-2` with 768 output dimensions for dense query and document embeddings

### Database
* PostgreSQL
* `pgvector` extension for cosine distance vector search (`vector(768)`)
* JSONB columns for structured guidance payloads

### Deployment
* Render unified web service

---

## Architecture

```text
User
  ↓
React Frontend (Vite)
  ↓
Express API
  ↓
Request Validation & Session Scoping
  ↓
Deterministic NLP Understanding
  ↓
Hybrid RAG Engine
  ↓
Gemini Query Embedding (768d)
  ↓
PostgreSQL + pgvector (<=> cosine distance)
  ↓
Top 5 Candidate Verses
  ↓
Domain-Aware Composite Reranking
  ↓
0.70 Relevance Gate
  ↓
Relevant Gita Context (or null)
  │
  └───────────────┐
                  ↓
             Gemini 2.5 Flash
                  ↓
          Structured Guidance JSON
                  ↓
             PostgreSQL Persistence
                  ↓
             React Guidance Card UI
```

---

## RAG Pipeline

The RAG system uses a two-stage retrieval process:

### Stage 1 — Semantic Candidate Retrieval (Recall)
* The user's query is converted into a 768-dimensional dense vector using `gemini-embedding-2`.
* Gita verses are stored as **enriched wisdom documents** containing:
  * Chapter and verse citation
  * Sanskrit text & transliteration
  * English translation
  * Core wisdom & philosophical meaning
  * Themes and concepts
  * Real-world contexts and situations
  * Emotional relevance
  * Modern applications and cautions
* These enriched documents are embedded and stored in PostgreSQL using `pgvector`.
* The query embedding is compared against the stored vectors using cosine distance (`<=>`), retrieving the top 5 candidates.

### Stage 2 — Domain-Aware Reranking (Precision)
Semantic similarity alone does not guarantee situational appropriateness. The candidate verses are reranked using a 5-factor weighted formula:

```text
Score = 0.40(Semantic Similarity)
      + 0.25(Intent Alignment)
      + 0.15(Theme / Lexical Match)
      + 0.10(Emotional Resonance)
      + 0.10(Contextual Fit)
```

### The 0.70 Relevance Gate
The highest-ranked candidate must cross a **0.70 relevance threshold**. 
* If the score is $\ge 0.70$, the shloka is attached to the guidance response.
* If below 0.70 (e.g. casual greetings or trivial questions), `shloka` is set to `null`.
* This prevents the system from forcing spiritual content into unrelated queries.

---

## Graceful Degradation

The application does not depend solely on external vector infrastructure:
* When Gemini embeddings or PostgreSQL `pgvector` are unreachable, the RAG engine seamlessly falls back to a deterministic 24-dimensional semantic-lexical retrieval path.
* This ensures the application maintains continuous guidance availability rather than crashing when third-party services experience downtime.

---

## Data Model

### `guidance_sessions`
Stores all user guidance exchanges:
* `id`: Serial primary key
* `session_id`: Client-generated UUID for anonymous session scoping
* `question`: User query string
* `category`: Classified guidance category (`Stress`, `Clarity`, `Discipline`, `Purpose`, `Meditation`, `General Reflection`)
* `response`: JSONB object holding full structured guidance payload
* `created_at`: Timestamp

### `gita_embeddings`
Stores the enriched Bhagavad Gita corpus with precomputed embeddings:
* `id`: Verse identifier (e.g. `BG3.35`, `BG2.47`)
* `content_hash`: SHA-256 hash of the enriched document for idempotent synchronization
* `embedding`: `vector(768)`
* `metadata`: JSONB containing verse translation, wisdom, themes, and applications

---

## Anonymous Session Isolation

KAAL AI provides privacy-respecting session isolation without requiring account creation:
* The client generates a unique anonymous `sessionId` and stores it in `localStorage`.
* The session ID is passed in the request header/body and used by backend queries to scope session history.
* This provides clean multi-device isolation while keeping friction zero for a guidance experience.

---

## Automated Testing

The project includes an automated test suite containing **29 passing tests**:
* Category scoring and signal detection
* Deterministic NLP understanding
* Accurate Gita verse retrieval for specific dilemmas (e.g. BG 3.35 for life path confusion, BG 2.47 for outcome anxiety, BG 3.8 for procrastination)
* Rejection of punitive/inappropriate matches (e.g. rejecting BG 4.40 for career uncertainty)
* Relevance threshold gating (omits shloka for household complaints, greetings, and trivia)
* Complete `StructuredGuidanceResponse` contract compliance
* Database CRUD operations and anonymous session isolation
* Multi-turn conversation thread management
* Embedding dimension validation (strict 768d)
* Enriched document construction & idempotent sync

```bash
npm test
```

---

## Local Development

1. **Clone and Install:**
   ```bash
   git clone https://github.com/shravanisdakve/KAAL-AI.git
   cd KAAL-AI
   npm install
   ```

2. **Environment Configuration:**
   Create a `.env` file:
   ```text
   PORT=3000
   DATABASE_URL=postgresql://user:password@localhost:5432/kaal_ai
   GEMINI_API_KEY=your_gemini_api_key_here
   ```

3. **Start Development Server:**
   ```bash
   npm run dev
   ```

4. **Run Verification Commands:**
   ```bash
   npm run lint   # TypeScript strict check (zero errors)
   npm test       # 29-test automated suite
   npm run build  # Vite production build
   ```

---

## Production Deployment on Render

The application runs as a unified web service on Render:
* **Service:** `kaal-ai` (Node.js web service)
* **Build Command:** `npm install && npm run build`
* **Start Command:** `npm start`
* **Environment Variables:**
  * `DATABASE_URL`: Render PostgreSQL connection string
  * `GEMINI_API_KEY`: Google Gemini API key
  * `NODE_ENV`: `production`

---

## Engineering Decisions

1. **Why PostgreSQL + pgvector?**
   The application already requires reliable relational persistence for conversation history. By using `pgvector`, we keep both relational data and vector storage in a single database, eliminating the operational overhead of a separate vector database.
2. **Why Hybrid Retrieval?**
   Vector similarity optimizes semantic recall, but cannot evaluate psychological appropriateness. Composite reranking with intent, emotion, and theme signals ensures precision.
3. **Why 0.70 Relevance Threshold?**
   A guidance tool must know when *not* to speak scripture. The 0.70 gate preserves intellectual honesty and prevents forced religious references.
4. **Why Anonymous Session Isolation?**
   Eliminating login walls encourages immediate reflection while preserving private conversation histories per device.
5. **Why Deterministic Fallback?**
   External AI APIs can experience rate limits or network latency. A deterministic fallback ensures the seeker always receives structured, compassionate guidance.
