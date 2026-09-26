import { BHAGAVAD_GITA_CORPUS } from '../data/gitaDataset.ts';
import { GitaShloka, NlpUnderstanding } from '../types/guidance.ts';
import { embeddingService } from './embeddingService.ts';
import { dbClient } from '../db/client.ts';

export const GITA_RELEVANCE_THRESHOLD = 0.70;

/**
 * Unified Multi-Signal Reranking Formula (Total = 100%):
 * - Semantic Vector Similarity (40%): Primary semantic recall from Gemini embedding / pgvector
 * - Intent Alignment (25%): Deterministic intent alignment (life direction, stress, purpose, etc.)
 * - Theme & Lexical Overlap (15%): Direct thematic and conceptual keyword resonance
 * - Inferred Emotional Resonance (10%): Linguistic emotional cues
 * - Contextual Specificity (10%): Match against specific life dilemmas and situations
 */
export const RAG_SCORING_WEIGHTS = {
  SEMANTIC_VECTOR: 0.40,
  INTENT_MATCH: 0.25,
  THEME_MATCH: 0.15,
  EMOTIONAL_MATCH: 0.10,
  CONTEXTUAL_MATCH: 0.10,
} as const;

const STOP_WORDS = new Set([
  'a', 'about', 'above', 'after', 'again', 'against', 'all', 'am', 'an', 'and', 'any', 'are',
  'aren', 'as', 'at', 'be', 'because', 'been', 'before', 'being', 'below', 'between', 'both',
  'but', 'by', 'can', 'cannot', 'could', 'did', 'do', 'does', 'doing', 'down', 'during', 'each',
  'few', 'for', 'from', 'further', 'had', 'has', 'have', 'having', 'he', 'her', 'here', 'hers',
  'herself', 'him', 'himself', 'his', 'how', 'i', 'if', 'in', 'into', 'is', 'it', 'its', 'itself',
  'just', 'me', 'more', 'most', 'my', 'myself', 'no', 'nor', 'not', 'now', 'of', 'off', 'on',
  'once', 'only', 'or', 'other', 'ought', 'our', 'ours', 'ourselves', 'out', 'over', 'own', 'same',
  'she', 'should', 'so', 'some', 'such', 'than', 'that', 'the', 'their', 'theirs', 'them',
  'themselves', 'then', 'there', 'these', 'they', 'this', 'those', 'through', 'to', 'too', 'under',
  'until', 'up', 'very', 'was', 'we', 'were', 'what', 'when', 'where', 'which', 'while', 'who',
  'whom', 'why', 'with', 'would', 'you', 'your', 'yours', 'yourself', 'yourselves',
]);

const CASUAL_GREETINGS = new Set([
  'hi', 'hello', 'hey', 'greetings', 'good morning', 'good evening', 'good afternoon',
  'namaste', 'sup', 'yo', 'how are you', 'what are you', 'who are you', 'test', 'help',
]);

// Non-philosophical triggers (household chores, factual trivia, code requests, technical hardware issues)
const OUT_OF_SCOPE_TRIGGERS = [
  'capital of', 'weather in', 'president of', 'prime minister', 'population of',
  'what is 2', 'calculate', 'code in python', 'write a function', 'who invented',
  'currency of', 'recipe for', 'temperature in', 'who won', 'tech stack',
  'dirty dishes', 'dishes in the sink', 'roommate keeps', 'trash out', 'clean the kitchen',
  'laptop', 'computer won', 'phone won', 'screen is black',
];

export interface RAGRetrievalResult {
  shloka: GitaShloka | null;
  isShlokaRelevant: boolean;
  detectedEmotion: string;
  relevanceScore: number;
  matchedThemes: string[];
  nlpUnderstanding: NlpUnderstanding;
  retrievalMethod: 'hybrid';
  semanticScore: number;
  keywordScore: number;
  contextScore: number;
  finalScore: number;
  candidateRankings: { id: string; finalScore: number }[];
}

/**
 * Normalizes input text into clean lowercase tokens
 */
export function tokenizeQuery(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 1 && !STOP_WORDS.has(w));
}

// 24 Canonical Semantic Dimensions for Dense Vector Representation
export const SEMANTIC_DIMENSIONS = [
  'svadharma_authentic_path',      // 0: choosing one's own path, duty, non-imitation
  'life_direction_clarity',        // 1: vocational direction, decision crossroads
  'purpose_meaning',               // 2: existential purpose, why work
  'comparison_envy',               // 3: comparing with others, feeling behind
  'action_effort_agency',          // 4: focus on immediate action and duty
  'outcome_detachment',            // 5: releasing attachment to fruits/results
  'anxiety_overwhelm_burnout',      // 6: cognitive overload, stress, drowning
  'equanimity_balance_samatvam',   // 7: inner poise across triumph and defeat
  'impermanence_transience',       // 8: seasonal nature of pain and pleasure
  'grief_bereavement_mourning',    // 9: death of loved ones, sorrow
  'eternal_soul_immortality',      // 10: indestructible conscious essence
  'anger_rage_loss_of_reason',     // 11: cognitive blindness of anger
  'relationship_harmony_forgiving',// 12: friendliness, maitri, dropping defensiveness
  'truthful_gentle_speech',        // 13: communication without malice
  'discipline_momentum',           // 14: micro-stepping, breaking inertia
  'procrastination_delay',         // 15: delay, waiting for mood
  'meditation_stillness',          // 16: abhyasa, steady mindfulness
  'restless_wandering_mind',       // 17: racing thoughts, distraction
  'deep_ocean_peace',              // 18: unshakeable depth amidst noise
  'courage_duty_abhaya',           // 19: fearlessness in the face of defeat
  'healthy_boundaries',            // 20: non-agitation, emotional maturity
  'delayed_gratification_sattva',  // 21: initial bitter friction to nectar
  'divine_protection_solace',      // 22: faith, universal care in loneliness
  'cynical_doubt_nihilism',        // 23: spiritual skepticism of sacred truth
] as const;

export type SemanticDimension = typeof SEMANTIC_DIMENSIONS[number];

// Pre-computed normalized semantic vectors for each verse in the knowledge base
const VERSE_SEMANTIC_VECTORS: Record<string, number[]> = {
  'BG2.47': createSparseVector({
    action_effort_agency: 1.0,
    outcome_detachment: 1.0,
    anxiety_overwhelm_burnout: 0.9,
    discipline_momentum: 0.6,
  }),
  'BG2.48': createSparseVector({
    equanimity_balance_samatvam: 1.0,
    outcome_detachment: 0.8,
    anxiety_overwhelm_burnout: 0.6,
    deep_ocean_peace: 0.7,
  }),
  'BG2.20': createSparseVector({
    grief_bereavement_mourning: 1.0,
    eternal_soul_immortality: 1.0,
    impermanence_transience: 0.7,
  }),
  'BG2.14': createSparseVector({
    impermanence_transience: 1.0,
    equanimity_balance_samatvam: 0.8,
    grief_bereavement_mourning: 0.6,
  }),
  'BG2.63': createSparseVector({
    anger_rage_loss_of_reason: 1.0,
    relationship_harmony_forgiving: 0.6,
    anxiety_overwhelm_burnout: 0.5,
  }),
  'BG3.35': createSparseVector({
    svadharma_authentic_path: 1.0,
    life_direction_clarity: 0.95,
    purpose_meaning: 0.85,
    comparison_envy: 0.9,
  }),
  'BG3.8': createSparseVector({
    discipline_momentum: 1.0,
    procrastination_delay: 0.95,
    action_effort_agency: 0.85,
  }),
  'BG4.40': createSparseVector({
    cynical_doubt_nihilism: 1.0,
    divine_protection_solace: 0.4,
  }),
  'BG6.5': createSparseVector({
    equanimity_balance_samatvam: 0.8,
    meditation_stillness: 0.7,
    discipline_momentum: 0.6,
  }),
  'BG6.35': createSparseVector({
    meditation_stillness: 1.0,
    restless_wandering_mind: 0.95,
    discipline_momentum: 0.7,
  }),
  'BG6.26': createSparseVector({
    meditation_stillness: 0.9,
    restless_wandering_mind: 1.0,
  }),
  'BG6.19': createSparseVector({
    meditation_stillness: 1.0,
    deep_ocean_peace: 0.9,
  }),
  'BG2.70': createSparseVector({
    deep_ocean_peace: 1.0,
    equanimity_balance_samatvam: 0.9,
    anxiety_overwhelm_burnout: 0.7,
  }),
  'BG2.38': createSparseVector({
    courage_duty_abhaya: 1.0,
    action_effort_agency: 0.8,
    outcome_detachment: 0.8,
  }),
  'BG12.13': createSparseVector({
    relationship_harmony_forgiving: 1.0,
    truthful_gentle_speech: 0.8,
    anger_rage_loss_of_reason: 0.6,
  }),
  'BG12.15': createSparseVector({
    healthy_boundaries: 1.0,
    deep_ocean_peace: 0.8,
    relationship_harmony_forgiving: 0.7,
  }),
  'BG18.37': createSparseVector({
    delayed_gratification_sattva: 1.0,
    discipline_momentum: 0.85,
    procrastination_delay: 0.7,
  }),
  'BG17.15': createSparseVector({
    truthful_gentle_speech: 1.0,
    relationship_harmony_forgiving: 0.8,
  }),
  'BG9.22': createSparseVector({
    divine_protection_solace: 1.0,
  }),
  'BG18.58': createSparseVector({
    divine_protection_solace: 0.9,
    courage_duty_abhaya: 0.8,
    action_effort_agency: 0.7,
  }),
  'BG18.66': createSparseVector({
    divine_protection_solace: 1.0,
    outcome_detachment: 0.9,
    grief_bereavement_mourning: 0.6,
  }),
};

function createSparseVector(weights: Partial<Record<SemanticDimension, number>>): number[] {
  const vec = new Array(SEMANTIC_DIMENSIONS.length).fill(0);
  for (let i = 0; i < SEMANTIC_DIMENSIONS.length; i++) {
    const dim = SEMANTIC_DIMENSIONS[i];
    if (weights[dim]) {
      vec[i] = weights[dim]!;
    }
  }
  // Normalize vector to unit length
  const norm = Math.sqrt(vec.reduce((sum, v) => sum + v * v, 0));
  return norm > 0 ? vec.map((v) => v / norm) : vec;
}

/**
 * LAYER 1: NLP Understanding & Linguistic Signal Inference
 * Infers emotional context, intent, topics, and psychological needs from linguistic cues.
 * Note: Emotions are inferred linguistic signals to guide conversational warmth,
 * not clinical assertions of certainty about the user's emotional state.
 */
export function extractNlpUnderstanding(query: string): NlpUnderstanding {
  const lower = query.toLowerCase();

  const emotions: string[] = [];
  let intent = 'personal_reflection';
  const topics: string[] = [];
  const needs: string[] = [];

  // A. Emotion Extraction
  if (lower.includes('confused') || lower.includes('uncertain') || lower.includes('not sure') || lower.includes('lost') || lower.includes('torn')) {
    emotions.push('confusion', 'uncertainty');
  }
  if (lower.includes('overwhelm') || lower.includes('exhausted') || lower.includes('burnout') || lower.includes('too much') || lower.includes('drowning') || lower.includes('heavy') || lower.includes('suffocat')) {
    emotions.push('overwhelm', 'exhaustion');
  }
  if (lower.includes('grief') || lower.includes('passed away') || lower.includes('death') || lower.includes('died') || lower.includes('crying') || lower.includes('heartbroken') || lower.includes('bereav')) {
    emotions.push('grief', 'bereavement');
  }
  if (lower.includes('fight') || lower.includes('argument') || lower.includes('angry') || lower.includes('rage') || lower.includes('furious') || lower.includes('resentful') || lower.includes('hate') || lower.includes('regret')) {
    emotions.push('anger', 'resentment');
  }
  if (lower.includes('procrastinat') || lower.includes('lazy') || lower.includes('delay') || lower.includes('cannot start') || lower.includes("can't start") || lower.includes('sluggish') || lower.includes('unmotivated')) {
    emotions.push('procrastination', 'inertia');
  }
  if (lower.includes('compar') || lower.includes('behind') || lower.includes('jealous') || lower.includes('envious') || lower.includes('imposter') || lower.includes('inadequat')) {
    emotions.push('comparison', 'insecurity');
  }
  if (lower.includes('lonely') || lower.includes('alone') || lower.includes('isolated') || lower.includes('hopeless') || lower.includes('no one cares')) {
    emotions.push('loneliness', 'isolation');
  }
  if (lower.includes('overthink') || lower.includes('racing') || lower.includes('restless') || lower.includes('scattered') || lower.includes('distracted')) {
    emotions.push('restlessness', 'overthinking');
  }
  if (emotions.length === 0) {
    emotions.push('reflective');
  }

  // B. Intent & Topic Extraction
  const isLifeDirection =
    lower.includes('which path') ||
    lower.includes('path in life') ||
    lower.includes('path i should') ||
    lower.includes('confused about which') ||
    lower.includes('direction in life') ||
    lower.includes('what should i do with my life') ||
    lower.includes('career') ||
    lower.includes('career crossroads') ||
    lower.includes('choose between') ||
    lower.includes('choice between') ||
    lower.includes('choosing between') ||
    (lower.includes('parents want') && (lower.includes('become') || lower.includes('career') || lower.includes('path') || lower.includes('pursue') || lower.includes('doctor') || lower.includes('engineer'))) ||
    (lower.includes('family want') && (lower.includes('become') || lower.includes('career') || lower.includes('path') || lower.includes('pursue'))) ||
    (lower.includes('doctor') && lower.includes('design')) ||
    (lower.includes('medicine') && lower.includes('design')) ||
    lower.includes('vocation') ||
    lower.includes('profession');

  const isComparisonOrExpectations =
    lower.includes('compar') ||
    lower.includes('cousin') ||
    lower.includes('wasting my potential') ||
    lower.includes('not good enough') ||
    lower.includes('carrying their expectations') ||
    lower.includes('stop carrying') ||
    lower.includes('measuring up') ||
    lower.includes('measure up') ||
    lower.includes('self-worth') ||
    lower.includes('self worth') ||
    lower.includes('parental expectation') ||
    lower.includes('external expectation') ||
    (lower.includes('parent') && (lower.includes('expect') || lower.includes('disappoint') || lower.includes('compar') || lower.includes('potential'))) ||
    (lower.includes('family') && (lower.includes('expect') || lower.includes('disappoint') || lower.includes('compar')));

  const isRelationshipGeneral =
    lower.includes('fight') ||
    lower.includes('argument') ||
    lower.includes('spouse') ||
    lower.includes('partner') ||
    lower.includes('relationship') ||
    lower.includes('in-law');

  if (isLifeDirection) {
    intent = 'life_direction';
    topics.push('career', 'personal_path', 'choice', 'life_direction', 'svadharma', 'family_expectations');
    needs.push('clarity', 'authentic_direction', 'decision_support', 'boundary_setting');
  } else if (isComparisonOrExpectations) {
    intent = 'relationship_conflict';
    topics.push(
      'relationship_conflict',
      'external_expectations',
      'comparison',
      'self_worth',
      'boundaries',
      'parental_expectations'
    );
    needs.push(
      'self_worth',
      'healthy_boundaries',
      'emotional_separation',
      'internal_validation'
    );
  } else if (isRelationshipGeneral) {
    intent = 'relationship_harmony';
    topics.push('relationships', 'forgiveness', 'compassion', 'communication');
    needs.push('softening_defensiveness', 'reconciliation', 'peace');
  } else if (
    lower.includes('purpose') ||
    lower.includes('working hard but') ||
    lower.includes('meaning') ||
    lower.includes('calling') ||
    lower.includes('empty')
  ) {
    intent = 'purpose_discovery';
    topics.push('purpose', 'svadharma', 'calling', 'authenticity');
    needs.push('meaning', 'direction', 'non_comparison');
  } else if (
    lower.includes('overwhelm') ||
    lower.includes('stress') ||
    lower.includes('pressure') ||
    lower.includes('burnout')
  ) {
    intent = 'stress_relief';
    topics.push('outcomes', 'workload', 'effort', 'detachment');
    needs.push('calm', 'release_of_outcomes', 'breathing_room');
  } else if (
    lower.includes('passed away') ||
    lower.includes('death') ||
    lower.includes('grief') ||
    lower.includes('loss')
  ) {
    intent = 'grief_processing';
    topics.push('bereavement', 'eternal_soul', 'impermanence');
    needs.push('gentle_comfort', 'reverence', 'acceptance');
  } else if (
    lower.includes('procrastinat') ||
    lower.includes('routine') ||
    lower.includes('habit') ||
    lower.includes('lazy')
  ) {
    intent = 'habit_discipline';
    topics.push('discipline', 'action', 'momentum', 'habits');
    needs.push('micro_step', 'breaking_inertia', 'focus');
  } else if (
    lower.includes('meditat') ||
    lower.includes('stillness') ||
    lower.includes('calm my mind') ||
    lower.includes('overthinking')
  ) {
    intent = 'mindfulness_stillness';
    topics.push('meditation', 'abhyasa', 'inner_peace', 'stillness');
    needs.push('breath', 'patience_with_mind', 'quietness');
  } else {
    topics.push('general_reflection');
    needs.push('perspective', 'clarity');
  }

  return { emotions, intent, topics, needs };
}

/**
 * LAYER 2: Query Enrichment
 * Enriches the raw query into a semantic representation for vector embedding.
 */
export function enrichQuery(raw: string, nlp: NlpUnderstanding): string {
  return `${raw.trim()}. Context: intent=${nlp.intent}, emotions=${nlp.emotions.join(',')}, topics=${nlp.topics.join(',')}, needs=${nlp.needs.join(',')}`;
}

/**
 * Projects an enriched query into the 24-dimensional semantic space.
 */
function embedQueryVector(query: string, nlp: NlpUnderstanding): number[] {
  const lower = query.toLowerCase();
  const weights: Partial<Record<SemanticDimension, number>> = {};

  // Intent Mapping
  if (nlp.intent === 'life_direction') {
    weights.svadharma_authentic_path = 1.0;
    weights.life_direction_clarity = 1.0;
    weights.purpose_meaning = 0.8;
    weights.comparison_envy = 0.7;
  } else if (nlp.intent === 'purpose_discovery') {
    weights.svadharma_authentic_path = 0.9;
    weights.purpose_meaning = 1.0;
    weights.comparison_envy = 0.8;
  } else if (nlp.intent === 'stress_relief') {
    weights.anxiety_overwhelm_burnout = 1.0;
    weights.outcome_detachment = 0.9;
    weights.action_effort_agency = 0.8;
  } else if (nlp.intent === 'grief_processing') {
    weights.grief_bereavement_mourning = 1.0;
    weights.eternal_soul_immortality = 0.9;
    weights.impermanence_transience = 0.7;
  } else if (nlp.intent === 'relationship_harmony' || nlp.intent === 'relationship_conflict') {
    weights.relationship_harmony_forgiving = 1.0;
    weights.truthful_gentle_speech = 0.8;
    weights.anger_rage_loss_of_reason = 0.6;
    weights.healthy_boundaries = 1.0;
    weights.comparison_envy = 0.9;
    weights.svadharma_authentic_path = 0.7;
  } else if (nlp.intent === 'habit_discipline') {
    weights.discipline_momentum = 1.0;
    weights.procrastination_delay = 0.9;
    weights.action_effort_agency = 0.8;
  } else if (nlp.intent === 'mindfulness_stillness') {
    weights.meditation_stillness = 1.0;
    weights.restless_wandering_mind = 0.9;
    weights.deep_ocean_peace = 0.7;
  }

  // Token Reinforcement
  if (
    lower.includes('which path') ||
    lower.includes('path in life') ||
    lower.includes('confused about which path') ||
    lower.includes('career') ||
    lower.includes('doctor') ||
    lower.includes('design') ||
    lower.includes('medicine') ||
    lower.includes('choose between') ||
    lower.includes('parents want')
  ) {
    weights.svadharma_authentic_path = Math.max(weights.svadharma_authentic_path || 0, 1.0);
    weights.life_direction_clarity = Math.max(weights.life_direction_clarity || 0, 1.0);
    weights.purpose_meaning = Math.max(weights.purpose_meaning || 0, 0.85);
    weights.comparison_envy = Math.max(weights.comparison_envy || 0, 0.8);
  }
  if (lower.includes('compar') || lower.includes('behind') || lower.includes('cousin') || lower.includes('not good enough')) {
    weights.comparison_envy = Math.max(weights.comparison_envy || 0, 1.0);
    weights.healthy_boundaries = Math.max(weights.healthy_boundaries || 0, 0.9);
  }
  if (lower.includes('cynical') || lower.includes('nihilist') || lower.includes('faithless')) {
    weights.cynical_doubt_nihilism = 1.0;
  }

  return createSparseVector(weights);
}

/**
 * Computes Cosine Similarity between two normalized vectors.
 */
function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (vecA.length !== vecB.length) return 0;
  let dotProduct = 0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
  }
  return Math.max(0, Math.min(1.0, dotProduct));
}

/**
 * LAYER 3 & 4: Hybrid Search (Semantic Vector Search + Lexical Keyword Matching)
 */
function computeLexicalScore(queryTokens: string[], shloka: GitaShloka): number {
  let score = 0;
  const searchableTokens = new Set([
    ...shloka.themes.flatMap((t) => t.toLowerCase().split(/\s+/)),
    ...(shloka.concepts?.flatMap((c) => c.toLowerCase().split(/[-_\s]+/)) || []),
    ...(shloka.contexts?.flatMap((c) => c.toLowerCase().split(/\s+/)) || []),
    ...(shloka.situations?.flatMap((s) => s.toLowerCase().split(/\s+/)) || []),
    ...(shloka.modern_application?.flatMap((m) => m.toLowerCase().split(/\s+/)) || []),
    ...shloka.emotions.flatMap((e) => e.toLowerCase().split(/\s+/)),
  ]);

  for (const token of queryTokens) {
    if (searchableTokens.has(token)) {
      score += 1.0;
    }
  }

  return Math.min(1.0, score / Math.max(3, queryTokens.length));
}

/**
 * Determines whether a query is purely casual, meta, or factual trivia (no shloka needed)
 */
export function isCasualOrNonSpiritualQuery(query: string): boolean {
  const trimmed = query.trim().toLowerCase().replace(/[?!.,]/g, '');

  if (CASUAL_GREETINGS.has(trimmed)) return true;
  if (trimmed.length < 5) return true;

  if (
    trimmed.startsWith('who are you') ||
    trimmed.startsWith('what can you do') ||
    trimmed.startsWith('what is kaal')
  ) {
    return true;
  }

  for (const trigger of OUT_OF_SCOPE_TRIGGERS) {
    if (trimmed.includes(trigger)) {
      return true;
    }
  }

  return false;
}

/**
 * FULL HYBRID RAG + RELEVANCE PIPELINE
 * 1. NLP Understanding (Intent, Inferred Emotion, Topic, Needs)
 * 2. Exclusion Gate (Casual, meta, household chores, or factual trivia)
 * 3. Primary Semantic Vector Search (Gemini 768-dim Embeddings via PostgreSQL pgvector)
 * 4. Graceful Degradation (Deterministic 24-dim dense projection when DB is offline)
 * 5. Lexical & Thematic Matching (Keyword & Concept Overlap)
 * 6. Multi-Factor Contextual Reranking (40% Semantic, 25% Intent, 15% Theme, 10% Emotion, 10% Context)
 * 7. Relevance Threshold Gating (GITA_RELEVANCE_THRESHOLD = 0.70)
 */
/**
 * Multi-factor contextual reranker.
 * Balances primary semantic vector similarity with intent alignment,
 * theme overlap, emotional resonance, and contextual specificity.
 */
function rerankCandidates(
  candidates: Array<{ shloka: GitaShloka; semanticSim: number; lexicalScore: number }>,
  nlpUnderstanding: NlpUnderstanding,
  query: string,
  detectedEmotion: string
): RAGRetrievalResult {
  const reranked = candidates.map((candidate) => {
    const { shloka, semanticSim, lexicalScore } = candidate;

    // 1. Intent Match
    let intentMatch = 0.2;
    if (nlpUnderstanding.intent === 'life_direction') {
      if (shloka.id === 'BG3.35') intentMatch = 1.0;
      else if (shloka.id === 'BG2.47') intentMatch = 0.45;
      else if (shloka.id === 'BG4.40') intentMatch = 0.15; // Caution: 4.40 is NOT for life-path dilemmas
    } else if (nlpUnderstanding.intent === 'purpose_discovery') {
      if (shloka.id === 'BG3.35') intentMatch = 1.0;
      else if (shloka.id === 'BG2.47') intentMatch = 0.5;
    } else if (nlpUnderstanding.intent === 'stress_relief') {
      if (shloka.id === 'BG2.47' || shloka.id === 'BG2.48' || shloka.id === 'BG2.70') intentMatch = 1.0;
    } else if (nlpUnderstanding.intent === 'grief_processing') {
      if (shloka.id === 'BG2.20' || shloka.id === 'BG2.14') intentMatch = 1.0;
    } else if (nlpUnderstanding.intent === 'relationship_harmony' || nlpUnderstanding.intent === 'relationship_conflict') {
      if (shloka.id === 'BG12.13' || shloka.id === 'BG17.15') intentMatch = 1.0;
      else if (shloka.id === 'BG12.15') intentMatch = 0.9;
      else if (shloka.id === 'BG6.5') intentMatch = 0.8;
      else if (shloka.id === 'BG3.35') intentMatch = 0.7;
    } else if (nlpUnderstanding.intent === 'habit_discipline') {
      if (shloka.id === 'BG3.8' || shloka.id === 'BG18.37') intentMatch = 1.0;
    } else if (nlpUnderstanding.intent === 'mindfulness_stillness') {
      if (shloka.id === 'BG6.35' || shloka.id === 'BG6.26' || shloka.id === 'BG6.19') intentMatch = 1.0;
    }

    // 2. Theme Match
    const shlokaThematicWords = new Set([
      ...shloka.themes.flatMap((t) => t.toLowerCase().split(/\s+/)),
      ...(shloka.concepts?.flatMap((c) => c.toLowerCase().split(/[-_\s]+/)) || []),
    ]);
    const themeOverlap = nlpUnderstanding.topics.filter(
      (topic) =>
        shlokaThematicWords.has(topic.toLowerCase()) ||
        shloka.themes.some((t) => t.toLowerCase().includes(topic.toLowerCase()))
    ).length;
    const themeMatch = Math.min(1.0, themeOverlap > 0 ? 0.8 + 0.1 * themeOverlap : lexicalScore);

    // 3. Emotional Match
    const emoOverlap = shloka.emotions.filter((e) => nlpUnderstanding.emotions.includes(e.toLowerCase())).length;
    const emotionalMatch = Math.min(1.0, emoOverlap > 0 ? 0.9 : 0.3);

    // 4. Contextual Match
    let contextualMatch = 0.3;
    const normalizedQ = query.toLowerCase();
    const candidateContexts = [
      ...(shloka.contexts || []),
      ...(shloka.situations || []),
    ];

    for (const ctx of candidateContexts) {
      const ctxLower = ctx.toLowerCase();
      if (normalizedQ.includes(ctxLower)) {
        contextualMatch = 1.0;
        break;
      }
      // Token overlap for natural-phrased queries matching key context phrases
      const ctxTokens = ctxLower.split(/\s+/).filter((w) => w.length > 2 && !STOP_WORDS.has(w));
      if (ctxTokens.length > 0) {
        const matches = ctxTokens.filter((token) => normalizedQ.includes(token)).length;
        const ratio = matches / ctxTokens.length;
        if (ratio >= 0.5 || (ctxTokens.length >= 3 && matches >= 2)) {
          contextualMatch = Math.max(contextualMatch, Math.min(1.0, 0.75 + 0.25 * ratio));
        }
      }
    }

    // 5. Multi-factor formula with configurable weights
    let finalScore =
      semanticSim * RAG_SCORING_WEIGHTS.SEMANTIC_VECTOR +
      intentMatch * RAG_SCORING_WEIGHTS.INTENT_MATCH +
      themeMatch * RAG_SCORING_WEIGHTS.THEME_MATCH +
      emotionalMatch * RAG_SCORING_WEIGHTS.EMOTIONAL_MATCH +
      contextualMatch * RAG_SCORING_WEIGHTS.CONTEXTUAL_MATCH;

    // Apply explicit caution penalty if verse warns against this context
    if (shloka.id === 'BG4.40' && nlpUnderstanding.intent === 'life_direction') {
      finalScore *= 0.4; // Harsh penalty: BG4.40 must never hijack life direction queries
    }

    const roundedFinal = Math.min(1.0, Math.round(finalScore * 100) / 100);

    return {
      shloka,
      semanticSim: Math.round(semanticSim * 100) / 100,
      keywordScore: Math.round(lexicalScore * 100) / 100,
      contextScore: Math.round(contextualMatch * 100) / 100,
      finalScore: roundedFinal,
    };
  });

  reranked.sort((a, b) => b.finalScore - a.finalScore);

  const bestCandidate = reranked[0];
  const candidateRankings = reranked.map((c) => ({ id: c.shloka.id, finalScore: c.finalScore }));

  const isShlokaRelevant = bestCandidate && bestCandidate.finalScore >= GITA_RELEVANCE_THRESHOLD;

  console.log(
    `[RAG Reranking] Query: "${query.slice(0, 50)}..." -> Top: ${bestCandidate?.shloka.id} (finalScore: ${bestCandidate?.finalScore}, threshold: ${GITA_RELEVANCE_THRESHOLD}, passedGate: ${isShlokaRelevant})`
  );

  return {
    shloka: isShlokaRelevant ? bestCandidate.shloka : null,
    isShlokaRelevant,
    detectedEmotion,
    relevanceScore: bestCandidate ? bestCandidate.finalScore : 0,
    matchedThemes: bestCandidate ? bestCandidate.shloka.themes : [],
    nlpUnderstanding,
    retrievalMethod: 'hybrid',
    semanticScore: bestCandidate ? bestCandidate.semanticSim : 0,
    keywordScore: bestCandidate ? bestCandidate.keywordScore : 0,
    contextScore: bestCandidate ? bestCandidate.contextScore : 0,
    finalScore: bestCandidate ? bestCandidate.finalScore : 0,
    candidateRankings,
  };
}

/**
 * Synchronous / Deterministic RAG Retrieval fallback.
 * Uses dense semantic concept projections + lexical matching for instant offline execution.
 */
export function retrieveGitaShlokaRAGSync(query: string): RAGRetrievalResult {
  const nlpUnderstanding = extractNlpUnderstanding(query);
  const detectedEmotion = nlpUnderstanding.emotions.join(' & ') || 'Reflective';

  if (isCasualOrNonSpiritualQuery(query)) {
    return {
      shloka: null,
      isShlokaRelevant: false,
      detectedEmotion,
      relevanceScore: 0,
      matchedThemes: [],
      nlpUnderstanding,
      retrievalMethod: 'hybrid',
      semanticScore: 0,
      keywordScore: 0,
      contextScore: 0,
      finalScore: 0,
      candidateRankings: [],
    };
  }

  const queryTokens = tokenizeQuery(query);
  const queryVector = embedQueryVector(query, nlpUnderstanding);

  const scoredCandidates = BHAGAVAD_GITA_CORPUS.map((shloka) => {
    const verseVector = VERSE_SEMANTIC_VECTORS[shloka.id] || createSparseVector({});
    const semanticSim = cosineSimilarity(queryVector, verseVector);
    const lexicalScore = computeLexicalScore(queryTokens, shloka);
    const hybridCandidateScore = 0.60 * semanticSim + 0.40 * lexicalScore;

    return {
      shloka,
      semanticSim,
      lexicalScore,
      hybridCandidateScore,
    };
  });

  scoredCandidates.sort((a, b) => b.hybridCandidateScore - a.hybridCandidateScore);
  const top5 = scoredCandidates.slice(0, 5);

  return rerankCandidates(top5, nlpUnderstanding, query, detectedEmotion);
}

/**
 * PRIMARY HYBRID RAG RETRIEVAL PIPELINE
 * 1. NLP Understanding (Intent, Emotion, Topics, Needs)
 * 2. Exclusion Gate (Casual, meta, household chores, or factual trivia)
 * 3. Primary Semantic Vector Search via PostgreSQL/pgvector + Gemini 768-dim Embeddings
 * 4. Multi-Factor Reranker (Semantic Vector + Intent + Theme + Emotion + Context)
 * 5. Strict Relevance Threshold Gating (GITA_RELEVANCE_THRESHOLD = 0.70)
 * 6. Graceful Deterministic Fallback if pgvector or embeddings API is unavailable
 */
export async function retrieveGitaShlokaRAG(query: string): Promise<RAGRetrievalResult> {
  const nlpUnderstanding = extractNlpUnderstanding(query);
  const detectedEmotion = nlpUnderstanding.emotions.join(' & ') || 'Reflective';

  if (isCasualOrNonSpiritualQuery(query)) {
    return {
      shloka: null,
      isShlokaRelevant: false,
      detectedEmotion,
      relevanceScore: 0,
      matchedThemes: [],
      nlpUnderstanding,
      retrievalMethod: 'hybrid',
      semanticScore: 0,
      keywordScore: 0,
      contextScore: 0,
      finalScore: 0,
      candidateRankings: [],
    };
  }

  // Check if pgvector and Gemini embedding service are active
  if (embeddingService.isConfigured() && dbClient.getIsPgVectorAvailable()) {
    try {
      const queryEmbedding = await embeddingService.embedQuery(query);
      const vectorMatches = await dbClient.searchSimilarGitaVerses(queryEmbedding, 5);

      if (vectorMatches && vectorMatches.length > 0) {
        const queryTokens = tokenizeQuery(query);
        const corpusMap = new Map(BHAGAVAD_GITA_CORPUS.map((s) => [s.id, s]));

        const candidates = vectorMatches
          .map((vm) => {
            const shloka = corpusMap.get(vm.verse_id);
            if (!shloka) return null;
            const lexicalScore = computeLexicalScore(queryTokens, shloka);
            return {
              shloka,
              semanticSim: vm.similarity,
              lexicalScore,
            };
          })
          .filter((c): c is { shloka: GitaShloka; semanticSim: number; lexicalScore: number } => c !== null);

        if (candidates.length > 0) {
          return rerankCandidates(candidates, nlpUnderstanding, query, detectedEmotion);
        }
      }
    } catch (vErr) {
      console.warn('pgvector retrieval encountered an issue, seamlessly using deterministic fallback:', (vErr as Error).message);
    }
  }

  // Deterministic Fallback
  return retrieveGitaShlokaRAGSync(query);
}
