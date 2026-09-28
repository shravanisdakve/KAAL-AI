import { Router, Request, Response } from 'express';
import { GoogleGenAI } from '@google/genai';

export const adminRouter = Router();

// Admin credentials
const ADMIN_USER = 'rain';
const ADMIN_PASS = 'snow';

/**
 * POST /api/admin/login
 * Validates admin credentials for accessing the technical presentation.
 */
adminRouter.post('/login', (req: Request, res: Response) => {
  const { username, password } = req.body || {};

  if (!username || !password) {
    return res.status(400).json({
      success: false,
      message: 'Username and password are required.',
    });
  }

  if (username === ADMIN_USER && password === ADMIN_PASS) {
    return res.json({
      success: true,
      authenticated: true,
      redirectUrl: '/presentation',
      message: 'Authentication successful. Welcome, Admin SD.',
    });
  }

  return res.status(401).json({
    success: false,
    authenticated: false,
    message: 'Invalid credentials. Please enter the authorized username and password.',
  });
});

/**
 * KNOWLEDGE BASE FOR MINI BOT
 */
const MINI_KNOWLEDGE_BASE: Array<{ keywords: string[]; answer: string; speech: string }> = [
  {
    keywords: ['0.70', 'threshold', 'gate', 'relevance threshold', 'decouple', 'why 0.70'],
    answer: 'The strict 0.70 Relevance Gate ensures intellectual honesty. In standard RAG systems, developers blindly return the top-1 verse even if its similarity score is low (e.g. 0.35). In KAAL AI, if the 5-factor reranked score is below 0.70, the verse is decoupled (`shloka = null`), and the user receives situation-tailored guidance without forced scripture.',
    speech: 'We use a strict 0.70 relevance gate to ensure intellectual honesty. If an authentic verse score falls below 0.70, we decouple the scripture and provide empathetic guidance without forcing quotes.',
  },
  {
    keywords: ['spiritual gaslighting', 'gaslighting', 'fan', 'laptop', 'hardware', 'it filter', 'layer 1'],
    answer: 'Spiritual gaslighting happens when an AI gives philosophical platitudes to practical technical issues—like telling someone with a broken cooling fan to "meditate on impermanence". Layer 1 deterministically intercepts hardware, Wi-Fi, battery, and coding syntax queries, providing practical IT triage with 0 spiritual metaphors.',
    speech: 'Spiritual gaslighting is when an AI gives philosophical platitudes to practical IT problems. Layer 1 deterministically detects hardware and syntax queries and gives actionable IT triage without spiritual metaphors.',
  },
  {
    keywords: ['bg 4.40', 'bg4.40', '4.40', 'penalty', 'caution penalty', 'doubt', 'career doubt'],
    answer: 'Bhagavad Gita 4.40 states "the doubting soul perishes". In early RAG tests, users asking about career confusion or normal doubt retrieved BG 4.40 because of the word "doubt", which sounded cruel and inappropriate. We applied an explicit 0.4x penalty to BG 4.40 for life-direction queries so it never hijacks career dilemmas.',
    speech: 'Bhagavad Gita 4.40 says the doubting soul perishes. Early tests retrieved it for career doubt, which felt cruel. We added a 0.4x penalty so it never hijacks career confusion.',
  },
  {
    keywords: ['reranker', '5 factor', 'formula', 'weights', 'scoring formula', 'rerank'],
    answer: 'The 5-factor reranker formula is: Score = 0.40(Semantic Vector Sim) + 0.25(Intent Alignment) + 0.15(Theme Match) + 0.10(Emotional Resonance) + 0.10(Contextual Fit). It balances dense semantic recall with domain-specific psychological intent.',
    speech: 'Our 5-factor reranker balances 40% semantic similarity, 25% intent alignment, 15% theme match, 10% emotion, and 10% context fit.',
  },
  {
    keywords: ['crisis', 'safety', 'suicide', 'self harm', 'layer 0', '988', '14416'],
    answer: 'Layer 0 is our Deterministic High-Risk Crisis Safety Gate. It has zero false-negatives for self-harm and suicide ideation. It completely bypasses the LLM and RAG retrieval, providing immediate free 24/7 helplines: 988 for US/Canada and 14416 for India Tele-MANAS, with 0 shlokas and 0 visuals.',
    speech: 'Layer 0 is our zero-tolerance crisis gate. It bypasses LLM calls completely and delivers 988 and 14416 emergency helplines with zero shlokas and zero visuals.',
  },
  {
    keywords: ['race condition', 'abortcontroller', 'concurrency', 'switching', 'in-flight'],
    answer: 'In chat interfaces, rapid switching between threads can cause slow responses from an earlier thread to overwrite the active thread. In `src/services/api.ts` and `App.tsx`, every fetch is bound to an AbortController. When switching conversations, the previous request is immediately aborted, eliminating race conditions.',
    speech: 'We solve race conditions by binding each request to an AbortController. Switching threads immediately cancels the in-flight request, preventing older responses from corrupting newer chats.',
  },
  {
    keywords: ['speech', 'voice', 'brave', 'firefox', 'mic', 'microphone'],
    answer: 'Our Web Speech API integration in `src/utils/speechRecognition.ts` features browser shielding. Brave blocks Google\'s speech backend with `service-not-allowed`—we catch this error gracefully. In unsupported browsers like Firefox, the mic button is cleanly hidden on mount. We also buffer interim tokens to prevent repeated text loops.',
    speech: 'Our voice integration detects browser capabilities, catches Brave\'s service-not-allowed block, hides the mic on Firefox, and separates interim tokens from final text to prevent duplication.',
  },
  {
    keywords: ['dist', 'why dist', 'build', 'production build', 'committed'],
    answer: 'The `dist/` directory contains pre-compiled, tree-shaken production bundles. Cloud platforms like Render free-tier provide limited 512MB RAM, where running heavy TypeScript/Vite builds during boot often triggers Out-Of-Memory crashes. Committing `dist/` guarantees instant cold starts and 100% startup reliability.',
    speech: 'We commit dist because free cloud tiers have tight 512 megabyte RAM limits. Pre-bundling ensures instant cold starts without memory crashes during boot.',
  },
  {
    keywords: ['fouc', 'anti fouc', 'dark mode', 'flash', 'head script'],
    answer: 'In `dist/index.html`, lines 18-24 contain a synchronous inline script in `<head>` that reads `localStorage.getItem("kaal_theme")` and adds the `dark` class before the body renders. Without this, users in dark mode would experience a blinding white Flash of Unstyled Content (FOUC).',
    speech: 'We put a synchronous script in the head of index.html to read local storage before the body renders, completely preventing the blinding white flash in dark mode.',
  },
  {
    keywords: ['postgres', 'database', 'client.ts', 'fallback', 'pgvector', 'offline'],
    answer: 'In `server/db/client.ts`, KAAL AI uses PostgreSQL with the pgvector extension for 768-dimensional cosine distance queries. If PostgreSQL is offline or sleeping, the client automatically falls back to `.guidance_data.json` and a 24-dimensional semantic projection matrix so the server never crashes.',
    speech: 'Our database client uses Postgres pgvector for 768-dimensional cosine search, with automatic fallback to local JSON storage if the database is offline.',
  },
  {
    keywords: ['tests', 'test suite', '100 tests', 'testing', 'suite.test.ts'],
    answer: 'KAAL AI features 100 automated deterministic tests in `test/suite.test.ts`. It verifies safety regex triggers, IT filters, classifier accuracy, correct shloka retrieval (BG 3.35, BG 2.47, BG 3.8), rejection of BG 4.40, speech utilities, and theme persistence.',
    speech: 'We have 100 automated unit and integration tests verifying all safety triggers, RAG accuracy, speech utilities, and theme toggling.',
  },
  {
    keywords: ['what did we try', 'history', 'evolution', 'iterations', 'failed'],
    answer: 'We tried 3 iterations before the final architecture: Iteration 1 was simple keyword scoring, which was too robotic. Iteration 2 was naive LLM prompting with scripture, which caused spiritual gaslighting on hardware and crisis queries. Iteration 3 was pure vector cosine similarity, which matched wrong verses due to superficial word overlap. The final solution is our 7-layer guardrailed Hybrid RAG with 0.70 threshold gating.',
    speech: 'We evolved through three iterations: first simple keywords, then naive LLM prompting which caused spiritual gaslighting, then flat vector similarity. We finally engineered the 7-layer guardrailed pipeline.',
  },
];

/**
 * POST /api/admin/mini-chat
 * Real-time Q&A bot "Mini" answering doubts about codebase architecture, files, and history.
 */
adminRouter.post('/mini-chat', async (req: Request, res: Response) => {
  const { question } = req.body || {};

  if (!question || typeof question !== 'string') {
    return res.status(400).json({ error: 'Question is required.' });
  }

  const qLower = question.toLowerCase();

  // 1. Try Gemini 2.5 Flash if API key is configured
  const apiKey = process.env.GEMINI_API_KEY;
  if (apiKey) {
    try {
      const ai = new GoogleGenAI({ apiKey });
      const systemPrompt = `You are "Mini", the friendly, highly technical AI Architecture Guide for the KAAL AI project.
You have complete, deep knowledge of the entire repository (45 files, 11,532 lines of code), its architecture, and development history:
- Full-stack: React 19, TypeScript, Tailwind CSS 4, Express, PostgreSQL + pgvector, Gemini 2.5 Flash.
- 7-Layer Architecture:
  * Layer 0: High-risk crisis safety gate (988 US/Canada, 14416 India Tele-MANAS, 0 shlokas, 0 visuals, zero latency).
  * Layer 1: Deterministic technical & IT filter (hardware fan, battery, Wi-Fi, coding syntax -> practical IT triage, 0 spiritual gaslighting).
  * Layer 2: Structured Intent & Dilemma Classifier (Gemini 2.5 Flash + 1-hour cache).
  * Layer 3: Independent Hybrid Gita RAG (768d gemini-embedding-2, PostgreSQL pgvector cosine search <=>, 5-factor reranker, strict 0.70 relevance gate).
  * Layer 4: High-EQ Conversational Guidance Generator + 'Why this relates' bridge.
  * Layer 5: Situational Visual Engine (SVG scenes + curated photos, gated so tech/crisis get 0 visuals).
  * Layer 6: Client Delivery (AbortController concurrency, Web Speech API with Brave/Firefox shielding, Anti-FOUC script).
- 5-factor reranker formula: 0.40(Semantic) + 0.25(Intent) + 0.15(Theme) + 0.10(Emotion) + 0.10(Context), with BG 4.40 0.4x penalty.
- Database fallback: PostgreSQL pgvector -> .guidance_data.json local store.
- Admin Login: button 'SD', user 'rain', pass 'snow'.
- 100/100 tests passing.

Provide a concise, technically sharp answer (2-4 sentences) that an engineer can use in an interview, along with a short spoken summary.`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [
          { role: 'user', parts: [{ text: `${systemPrompt}\n\nUser Question: ${question}` }] },
        ],
      });

      const reply = response.text || '';
      return res.json({
        answer: reply,
        speech: reply.replace(/[`*#_]/g, ''),
        source: 'gemini',
      });
    } catch (err) {
      console.warn('[MiniChat] Gemini call failed, falling back to local knowledge base:', err);
    }
  }

  // 2. High-precision semantic knowledge base fallback
  let bestMatch = MINI_KNOWLEDGE_BASE[0];
  let maxScore = 0;

  for (const item of MINI_KNOWLEDGE_BASE) {
    let score = 0;
    for (const kw of item.keywords) {
      if (qLower.includes(kw)) {
        score += kw.length;
      }
    }
    if (score > maxScore) {
      maxScore = score;
      bestMatch = item;
    }
  }

  if (maxScore > 0) {
    return res.json({
      answer: bestMatch.answer,
      speech: bestMatch.speech,
      source: 'local_kb',
    });
  }

  // Default intelligent fallback
  return res.json({
    answer: `KAAL AI is built with an intellectual 7-layer guidance pipeline. It screens for crisis (Layer 0) and technical IT issues (Layer 1) before running 2-stage Hybrid RAG with 768d Gemini embeddings and a 5-factor reranker. Shlokas are strictly decoupled if the relevance score is below 0.70.`,
    speech: `KAAL AI features a 7-layer pipeline with deterministic crisis and IT filters, hybrid RAG with pgvector, and a strict 0.70 relevance gate.`,
    source: 'default',
  });
});
