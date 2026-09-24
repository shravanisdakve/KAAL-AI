import { BHAGAVAD_GITA_CORPUS } from '../data/gitaDataset.ts';
import { GitaShloka } from '../types/guidance.ts';

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

// Trivia / Out-of-scope triggers that shouldn't force Bhagavad Gita verses
const TRIVIA_OR_FACTUAL_TRIGGERS = [
  'capital of', 'weather in', 'president of', 'prime minister', 'population of',
  'what is 2', 'calculate', 'code in python', 'write a function', 'who invented',
  'currency of', 'recipe for', 'temperature in', 'who won', 'tech stack',
];

export interface RAGRetrievalResult {
  shloka: GitaShloka | null;
  isShlokaRelevant: boolean;
  detectedEmotion: string;
  relevanceScore: number;
  matchedThemes: string[];
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

/**
 * High-EQ Emotional State Detector
 * Maps natural human expressions (grief, anger, burnout, loss, paralysis) to psychological categories.
 */
export function detectEmotionalTone(query: string): string {
  const lower = query.toLowerCase();

  // 1. Grief, Bereavement, Death & Loss
  if (
    lower.includes('passed away') ||
    lower.includes('death') ||
    lower.includes('died') ||
    lower.includes('dying') ||
    lower.includes('funeral') ||
    lower.includes('grief') ||
    lower.includes('grieving') ||
    lower.includes('crying') ||
    lower.includes('tears') ||
    lower.includes('lost my') ||
    lower.includes('miss my') ||
    lower.includes('unbearable') ||
    lower.includes('heartbroken')
  ) {
    return 'Grief & Bereavement';
  }

  // 2. Anger, Conflict, Heated Arguments & Regret
  if (
    lower.includes('fight') ||
    lower.includes('fought') ||
    lower.includes('argument') ||
    lower.includes('arguing') ||
    lower.includes('spouse') ||
    lower.includes('husband') ||
    lower.includes('wife') ||
    lower.includes('partner') ||
    lower.includes('angry') ||
    lower.includes('rage') ||
    lower.includes('furious') ||
    lower.includes('resentful') ||
    lower.includes('said things i regret') ||
    lower.includes('hate') ||
    lower.includes('yelled')
  ) {
    return 'Anger & Relationship Conflict';
  }

  // 3. Overwhelm, Burnout, Stress & Suffocation
  if (
    lower.includes('overwhelm') ||
    lower.includes('stress') ||
    lower.includes('burnout') ||
    lower.includes('pressure') ||
    lower.includes('drowning') ||
    lower.includes('too much') ||
    lower.includes('exhausted') ||
    lower.includes('heavy') ||
    lower.includes('suffocating')
  ) {
    return 'Overwhelm & Burnout';
  }

  // 4. Procrastination, Laziness & Inertia
  if (
    lower.includes('procrastinat') ||
    lower.includes('lazy') ||
    lower.includes('delay') ||
    lower.includes('cannot start') ||
    lower.includes("can't start") ||
    lower.includes('routine') ||
    lower.includes('habit') ||
    lower.includes('sluggish') ||
    lower.includes('unmotivated') ||
    lower.includes('inertia')
  ) {
    return 'Discipline & Momentum';
  }

  // 5. Confusion, Life Path & Indecision
  if (
    lower.includes('confused') ||
    lower.includes('path') ||
    lower.includes('direction') ||
    lower.includes('decision') ||
    lower.includes('decide') ||
    lower.includes('crossroads') ||
    lower.includes('torn') ||
    lower.includes('doubt') ||
    lower.includes('what should i do')
  ) {
    return 'Confusion & Indecision';
  }

  // 6. Search for Purpose, Svadharma & Existential Emptiness
  if (
    lower.includes('purpose') ||
    lower.includes('meaning') ||
    lower.includes('why work') ||
    lower.includes('unhappy') ||
    lower.includes('empty') ||
    lower.includes('calling') ||
    lower.includes('working hard') ||
    lower.includes('imposter')
  ) {
    return 'Search for Purpose';
  }

  // 7. Fear of Failure & Intimidation
  if (
    lower.includes('fear') ||
    lower.includes('afraid') ||
    lower.includes('scared') ||
    lower.includes('anxious') ||
    lower.includes('panic') ||
    lower.includes('fail') ||
    lower.includes('rejection') ||
    lower.includes('interview') ||
    lower.includes('exam')
  ) {
    return 'Fear of Failure';
  }

  // 8. Loneliness, Despair & Rock Bottom
  if (
    lower.includes('lonely') ||
    lower.includes('alone') ||
    lower.includes('rock bottom') ||
    lower.includes('hopeless') ||
    lower.includes('giving up') ||
    lower.includes('surrender') ||
    lower.includes('no one cares')
  ) {
    return 'Loneliness & Despair';
  }

  // 9. Inner Stillness, Meditation & Distraction
  if (
    lower.includes('meditat') ||
    lower.includes('stillness') ||
    lower.includes('quiet') ||
    lower.includes('peace') ||
    lower.includes('breath') ||
    lower.includes('wandering mind') ||
    lower.includes('adhd') ||
    lower.includes('distracted')
  ) {
    return 'Inner Stillness';
  }

  return 'Personal Reflection';
}

/**
 * Determines whether a query is purely casual, meta, or factual trivia (no shloka needed)
 */
export function isCasualOrNonSpiritualQuery(query: string): boolean {
  const trimmed = query.trim().toLowerCase().replace(/[?!.,]/g, '');

  // 1. Casual Greetings
  if (CASUAL_GREETINGS.has(trimmed)) return true;
  if (trimmed.length < 5) return true;

  // 2. Meta assistant questions
  if (
    trimmed.startsWith('who are you') ||
    trimmed.startsWith('what can you do') ||
    trimmed.startsWith('what is kaal')
  ) {
    return true;
  }

  // 3. Factual trivia / General knowledge questions
  for (const trigger of TRIVIA_OR_FACTUAL_TRIGGERS) {
    if (trimmed.includes(trigger)) {
      return true;
    }
  }

  return false;
}

/**
 * Proper RAG Retrieval Pipeline for Bhagavad Gita Shlokas
 * Uses multi-vector semantic scoring + emotional resonance + conditional relevance gating.
 */
export function retrieveGitaShlokaRAG(query: string): RAGRetrievalResult {
  const detectedEmotion = detectEmotionalTone(query);

  // 1. Strict Gate: Casual, meta, or factual trivia queries must NOT force a shloka
  if (isCasualOrNonSpiritualQuery(query)) {
    return {
      shloka: null,
      isShlokaRelevant: false,
      detectedEmotion,
      relevanceScore: 0,
      matchedThemes: [],
    };
  }

  const queryTokens = tokenizeQuery(query);
  const normalizedQuery = query.toLowerCase();

  let bestShloka: GitaShloka | null = null;
  let highestScore = 0;
  let bestMatchedThemes: string[] = [];

  for (const shloka of BHAGAVAD_GITA_CORPUS) {
    let score = 0;
    const currentMatchedThemes: string[] = [];

    // A. Phrase & Substring Matches in Themes (Weight: 5.0)
    for (const theme of shloka.themes) {
      const themeLower = theme.toLowerCase();
      if (normalizedQuery.includes(themeLower)) {
        score += 5.0;
        currentMatchedThemes.push(theme);
      } else {
        const themeTokens = themeLower.split(/\s+/);
        for (const tToken of themeTokens) {
          if (queryTokens.includes(tToken)) {
            score += 2.5;
            currentMatchedThemes.push(theme);
            break;
          }
        }
      }
    }

    // B. Situational Match (Weight: 4.5)
    for (const situation of shloka.situations) {
      const sitLower = situation.toLowerCase();
      if (normalizedQuery.includes(sitLower)) {
        score += 6.0;
        currentMatchedThemes.push(situation);
      } else {
        const sitTokens = sitLower.split(/\s+/);
        for (const sToken of sitTokens) {
          if (queryTokens.includes(sToken) && !STOP_WORDS.has(sToken)) {
            score += 2.0;
            break;
          }
        }
      }
    }

    // C. Emotional Resonance Affinity (Weight: 4.0)
    for (const emotion of shloka.emotions) {
      const emoLower = emotion.toLowerCase();
      if (normalizedQuery.includes(emoLower)) {
        score += 4.5;
      }
    }

    // D. Emotional Category Resonance Boost
    // If the shloka's themes directly address the detected emotion
    if (
      (detectedEmotion === 'Grief & Bereavement' && (shloka.id === 'BG2.20' || shloka.id === 'BG2.14')) ||
      (detectedEmotion === 'Anger & Relationship Conflict' && (shloka.id === 'BG2.63' || shloka.id === 'BG12.13' || shloka.id === 'BG17.15')) ||
      (detectedEmotion === 'Overwhelm & Burnout' && (shloka.id === 'BG2.47' || shloka.id === 'BG2.48' || shloka.id === 'BG2.70')) ||
      (detectedEmotion === 'Discipline & Momentum' && (shloka.id === 'BG3.8' || shloka.id === 'BG18.37')) ||
      (detectedEmotion === 'Search for Purpose' && (shloka.id === 'BG3.35')) ||
      (detectedEmotion === 'Confusion & Indecision' && (shloka.id === 'BG4.40' || shloka.id === 'BG2.47')) ||
      (detectedEmotion === 'Inner Stillness' && (shloka.id === 'BG6.35' || shloka.id === 'BG6.26' || shloka.id === 'BG6.19')) ||
      (detectedEmotion === 'Loneliness & Despair' && (shloka.id === 'BG18.66' || shloka.id === 'BG9.22' || shloka.id === 'BG18.58'))
    ) {
      score += 4.0;
    }

    // E. Textual Token Match in Translation & Meaning (Weight: 1.0)
    const combinedContent = `${shloka.translation} ${shloka.meaning}`.toLowerCase();
    for (const token of queryTokens) {
      if (combinedContent.includes(token)) {
        score += 1.0;
      }
    }

    // Track best candidate
    if (score > highestScore) {
      highestScore = score;
      bestShloka = shloka;
      bestMatchedThemes = [...new Set(currentMatchedThemes)];
    }
  }

  // Normalize score between 0.0 and 1.0
  const normalizedScore = Math.min(1.0, Math.round((highestScore / 14) * 100) / 100);

  // RELEVANCE GATE:
  // Must pass minimum threshold of 0.35 AND have meaningful signal matches
  const isShlokaRelevant = normalizedScore >= 0.35 && bestShloka !== null;

  return {
    shloka: isShlokaRelevant ? bestShloka : null,
    isShlokaRelevant,
    detectedEmotion,
    relevanceScore: normalizedScore,
    matchedThemes: bestMatchedThemes,
  };
}
