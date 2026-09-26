import { GoogleGenAI } from '@google/genai';
import { GuidanceCategory, NlpUnderstanding } from '../types/guidance.ts';
import {
  extractNlpUnderstanding,
  isTechnicalTroubleshootingQuery,
  isCodingTechnicalQuery,
  isFactualTriviaQuery,
} from './ragEngine.ts';
import { detectHighRiskSafetySignal } from './safetyEngine.ts';
import { isCasualGreeting } from './conversationalEngine.ts';

export type GuidanceDomain = 'emotional_guidance' | 'casual';

export type PrimaryIntent =
  | 'career_confusion'
  | 'self_worth'
  | 'relationship_conflict'
  | 'grief'
  | 'overwhelm'
  | 'procrastination'
  | 'purpose'
  | 'meditation'
  | 'decision_support'
  | 'general_reflection';

export interface StructuredClassificationResult {
  domain: GuidanceDomain;
  primaryIntent: PrimaryIntent;
  detectedEmotions: string[];
  topics: string[];
  underlyingNeeds: string[];
  confidence: number;
  source: 'gemini' | 'deterministic_fallback';
  latencyMs?: number;
}

// In-memory cache for classifier results to prevent redundant calls for identical queries
const CLASSIFICATION_CACHE = new Map<string, { result: StructuredClassificationResult; timestamp: number }>();
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour TTL
const MAX_CACHE_SIZE = 500;

export function clearClassifierCache(): void {
  CLASSIFICATION_CACHE.clear();
}

export function getClassifierCacheStats(): { size: number } {
  return { size: CLASSIFICATION_CACHE.size };
}

/**
 * Gate check: Verifies if a query is eligible for structured emotional/life classification.
 * High-risk crisis signals, technical hardware/network troubleshooting, coding syntax,
 * factual trivia, and casual greetings are deterministically handled by their own gates
 * and MUST NOT be processed by the structured guidance classifier.
 */
export function isEligibleForClassifier(query: string): {
  eligible: boolean;
  reason?: 'high_risk_safety' | 'technical_troubleshooting' | 'coding_technical' | 'factual_inquiry' | 'casual_greeting';
} {
  // 1. Safety check (Highest priority: Zero-tolerance crisis protocol)
  if (detectHighRiskSafetySignal(query).isHighRisk) {
    return { eligible: false, reason: 'high_risk_safety' };
  }

  // 2. Technical troubleshooting (Hardware, OS, network, browser crashes)
  if (isTechnicalTroubleshootingQuery(query)) {
    return { eligible: false, reason: 'technical_troubleshooting' };
  }

  // 3. Coding and software syntax
  if (isCodingTechnicalQuery(query)) {
    return { eligible: false, reason: 'coding_technical' };
  }

  // 4. Factual trivia and direct encyclopedic lookups
  if (isFactualTriviaQuery(query)) {
    return { eligible: false, reason: 'factual_inquiry' };
  }

  // 5. Casual greetings and shallow chit-chat
  if (isCasualGreeting(query)) {
    return { eligible: false, reason: 'casual_greeting' };
  }

  return { eligible: true };
}

/**
 * Maps deterministic NLP extraction to the structured classification schema.
 * Serves as the zero-latency, high-reliability fallback when Gemini API is unavailable or times out.
 */
export function deterministicClassificationFallback(
  query: string
): StructuredClassificationResult {
  const nlp = extractNlpUnderstanding(query);
  const qLower = query.toLowerCase();

  let primaryIntent: PrimaryIntent = 'general_reflection';

  if (nlp.intent === 'life_direction') {
    primaryIntent = 'career_confusion';
  } else if (nlp.intent === 'self_worth_criticism') {
    primaryIntent = 'self_worth';
  } else if (nlp.intent === 'relationship_conflict' || nlp.intent === 'relationship_harmony') {
    primaryIntent = 'relationship_conflict';
  } else if (
    nlp.intent === 'grief_processing' ||
    qLower.includes('passed away') ||
    qLower.includes('death') ||
    qLower.includes('grief') ||
    qLower.includes('loss') ||
    qLower.includes('lost someone') ||
    qLower.includes('lost my') ||
    qLower.includes('mourning')
  ) {
    primaryIntent = 'grief';
  } else if (nlp.intent === 'stress_relief') {
    primaryIntent = 'overwhelm';
  } else if (nlp.intent === 'habit_discipline') {
    primaryIntent = 'procrastination';
  } else if (nlp.intent === 'purpose_discovery') {
    primaryIntent = 'purpose';
  } else if (nlp.intent === 'mindfulness_stillness') {
    primaryIntent = 'meditation';
  } else if (
    qLower.includes('decision') ||
    qLower.includes('decide') ||
    qLower.includes('choice') ||
    qLower.includes('choose')
  ) {
    primaryIntent = 'decision_support';
  }

  return {
    domain: 'emotional_guidance',
    primaryIntent,
    detectedEmotions: nlp.emotions.length > 0 ? nlp.emotions : ['reflective'],
    topics: nlp.topics.length > 0 ? nlp.topics : ['life_reflection'],
    underlyingNeeds: nlp.needs.length > 0 ? nlp.needs : ['clarity'],
    confidence: 0.85,
    source: 'deterministic_fallback',
  };
}

/**
 * Converts StructuredClassificationResult into legacy NlpUnderstanding format
 * so all downstream RAG and visual components integrate seamlessly without regressions.
 */
export function classificationToNlpUnderstanding(
  classification: StructuredClassificationResult
): NlpUnderstanding {
  const intentMap: Record<PrimaryIntent, string> = {
    career_confusion: 'life_direction',
    decision_support: 'life_direction',
    self_worth: 'self_worth_criticism',
    relationship_conflict: 'relationship_conflict',
    grief: 'grief_processing',
    overwhelm: 'stress_relief',
    procrastination: 'habit_discipline',
    purpose: 'purpose_discovery',
    meditation: 'mindfulness_stillness',
    general_reflection: 'personal_reflection',
  };

  return {
    intent: intentMap[classification.primaryIntent] || 'personal_reflection',
    emotions: classification.detectedEmotions,
    topics: classification.topics,
    needs: classification.underlyingNeeds,
  };
}

/**
 * Resolves a GuidanceCategory from a classification result.
 */
export function classificationToCategory(
  classification: StructuredClassificationResult
): GuidanceCategory {
  switch (classification.primaryIntent) {
    case 'career_confusion':
    case 'decision_support':
      return 'Clarity';
    case 'overwhelm':
      return 'Stress';
    case 'purpose':
      return 'Purpose';
    case 'relationship_conflict':
    case 'self_worth':
      return 'Relationships';
    case 'procrastination':
      return 'Discipline';
    case 'meditation':
      return 'Meditation';
    case 'grief':
      return 'Relationships';
    case 'general_reflection':
    default:
      return 'General Reflection';
  }
}

/**
 * Primary Structured Query Understanding Classifier
 *
 * Responsibilities:
 * 1. Checks in-memory cache for identical queries.
 * 2. If Gemini API key is configured, invokes gemini-2.5-flash with a strict JSON schema.
 * 3. Does NOT generate guidance or advice in this pass.
 * 4. Does NOT decide Gita relevance or visual eligibility (downstream modules retain this).
 * 5. Falls back immediately to deterministicClassificationFallback if Gemini errors, is unconfigured, or times out.
 */
export async function classifyQuery(
  query: string,
  options?: { forceFallback?: boolean; timeoutMs?: number }
): Promise<StructuredClassificationResult> {
  const startTime = Date.now();
  const cacheKey = query.trim().toLowerCase();

  // 1. Check cache
  const cached = CLASSIFICATION_CACHE.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return {
      ...cached.result,
      latencyMs: Date.now() - startTime,
    };
  }

  // 2. Check eligibility (safety and technical/practical guardrails bypass the classifier)
  const eligibility = isEligibleForClassifier(query);
  if (!eligibility.eligible) {
    const fallback = deterministicClassificationFallback(query);
    return {
      ...fallback,
      latencyMs: Date.now() - startTime,
    };
  }

  const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;

  // 3. Fallback path if no API key or forced fallback
  if (!apiKey || options?.forceFallback) {
    const fallback = deterministicClassificationFallback(query);
    CLASSIFICATION_CACHE.set(cacheKey, { result: fallback, timestamp: Date.now() });
    return {
      ...fallback,
      latencyMs: Date.now() - startTime,
    };
  }

  // 4. Live Gemini 2.5 Flash Structured Classification Pass
  try {
    const ai = new GoogleGenAI({ apiKey });
    const timeoutMs = options?.timeoutMs || 2500;

    const classificationPromise = ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Classify the following user message: "${query.replace(/"/g, '\\"')}"`,
      config: {
        systemInstruction: `You are the query understanding and classification engine for KAAL AI.
Analyze the user's message and return structured JSON ONLY.
Classify the user's primary emotional and life situation into one of the allowed primaryIntents.
Do NOT generate guidance, advice, or philosophical prose.
Do NOT decide Gita relevance or visual eligibility.

Allowed domains:
- "emotional_guidance": personal, emotional, or philosophical life situations
- "casual": simple greetings or shallow chit-chat

Allowed primaryIntents:
- "career_confusion": vocational crossroads, parental career expectations, choosing between career paths
- "self_worth": feeling worthless, "good for nothing", enduring taunts/criticism, put-downs, imposter syndrome
- "relationship_conflict": arguments, fights, marital/partner friction, interpersonal tension, parental comparison
- "grief": death of a loved one, bereavement, mourning, profound heartbreak
- "overwhelm": acute stress, burnout, cognitive overload, anxiety over outcomes
- "procrastination": delay, inertia, struggling with habits or discipline
- "purpose": existential questions, working hard without feeling meaning, calling
- "meditation": restlessness, wandering mind, desire for stillness or mindfulness practice
- "decision_support": non-career decision dilemmas or crossroads
- "general_reflection": open-ended contemplation or ambiguous reflection`,
        responseMimeType: 'application/json',
      },
    });

    // Timeout guard: if Gemini takes longer than timeoutMs, fall back gracefully
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error(`Classification timed out after ${timeoutMs}ms`)), timeoutMs);
    });

    const response = await Promise.race([classificationPromise, timeoutPromise]);
    const text = response.text;

    if (text) {
      const parsed = JSON.parse(text);
      const validIntents: PrimaryIntent[] = [
        'career_confusion',
        'self_worth',
        'relationship_conflict',
        'grief',
        'overwhelm',
        'procrastination',
        'purpose',
        'meditation',
        'decision_support',
        'general_reflection',
      ];

      const primaryIntent: PrimaryIntent = validIntents.includes(parsed.primaryIntent)
        ? parsed.primaryIntent
        : 'general_reflection';

      const domain: GuidanceDomain = parsed.domain === 'casual' ? 'casual' : 'emotional_guidance';
      const detectedEmotions: string[] = Array.isArray(parsed.detectedEmotions) && parsed.detectedEmotions.length > 0
        ? parsed.detectedEmotions.map((e: any) => String(e).toLowerCase().trim())
        : ['reflective'];
      const topics: string[] = Array.isArray(parsed.topics) && parsed.topics.length > 0
        ? parsed.topics.map((t: any) => String(t).toLowerCase().trim())
        : ['guidance'];
      const underlyingNeeds: string[] = Array.isArray(parsed.underlyingNeeds) && parsed.underlyingNeeds.length > 0
        ? parsed.underlyingNeeds.map((n: any) => String(n).toLowerCase().trim())
        : ['clarity'];
      const confidence = typeof parsed.confidence === 'number' && parsed.confidence >= 0 && parsed.confidence <= 1
        ? parsed.confidence
        : 0.9;

      const result: StructuredClassificationResult = {
        domain,
        primaryIntent,
        detectedEmotions,
        topics,
        underlyingNeeds,
        confidence,
        source: 'gemini',
        latencyMs: Date.now() - startTime,
      };

      // Manage cache size
      if (CLASSIFICATION_CACHE.size >= MAX_CACHE_SIZE) {
        const oldestKey = CLASSIFICATION_CACHE.keys().next().value;
        if (oldestKey) CLASSIFICATION_CACHE.delete(oldestKey);
      }
      CLASSIFICATION_CACHE.set(cacheKey, { result, timestamp: Date.now() });

      return result;
    }

    throw new Error('Empty response from Gemini classification');
  } catch (err: any) {
    console.warn(
      `[Classifier] Gemini classification unavailable (${err.message}). Using deterministic fallback.`
    );
    const fallback = deterministicClassificationFallback(query);
    return {
      ...fallback,
      latencyMs: Date.now() - startTime,
    };
  }
}

/**
 * Synchronous variant for zero-latency seeding, tests, and offline execution.
 */
export function classifyQuerySync(query: string): StructuredClassificationResult {
  const startTime = Date.now();
  const cacheKey = query.trim().toLowerCase();

  const cached = CLASSIFICATION_CACHE.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return {
      ...cached.result,
      latencyMs: Date.now() - startTime,
    };
  }

  const result = deterministicClassificationFallback(query);
  CLASSIFICATION_CACHE.set(cacheKey, { result, timestamp: Date.now() });
  return {
    ...result,
    latencyMs: Date.now() - startTime,
  };
}
