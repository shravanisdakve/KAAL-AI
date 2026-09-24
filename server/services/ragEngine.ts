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
 * Analyzes the user's primary emotional state
 */
export function detectEmotionalTone(query: string): string {
  const lower = query.toLowerCase();

  if (
    lower.includes('overwhelm') ||
    lower.includes('stress') ||
    lower.includes('burnout') ||
    lower.includes('pressure') ||
    lower.includes('drowning') ||
    lower.includes('too much')
  ) {
    return 'Overwhelm & Burnout';
  }

  if (
    lower.includes('sad') ||
    lower.includes('grief') ||
    lower.includes('heartbroken') ||
    lower.includes('crying') ||
    lower.includes('loss') ||
    lower.includes('died') ||
    lower.includes('miss them')
  ) {
    return 'Grief & Sorrow';
  }

  if (
    lower.includes('fear') ||
    lower.includes('afraid') ||
    lower.includes('scared') ||
    lower.includes('anxious') ||
    lower.includes('panic') ||
    lower.includes('fail')
  ) {
    return 'Fear of Failure';
  }

  if (
    lower.includes('confused') ||
    lower.includes('path') ||
    lower.includes('direction') ||
    lower.includes('decision') ||
    lower.includes('torn') ||
    lower.includes('doubt')
  ) {
    return 'Confusion & Indecision';
  }

  if (
    lower.includes('purpose') ||
    lower.includes('meaning') ||
    lower.includes('why work') ||
    lower.includes('unhappy') ||
    lower.includes('empty') ||
    lower.includes('calling')
  ) {
    return 'Search for Purpose';
  }

  if (
    lower.includes('procrastinat') ||
    lower.includes('lazy') ||
    lower.includes('delay') ||
    lower.includes('routine') ||
    lower.includes('habit') ||
    lower.includes('focus')
  ) {
    return 'Discipline & Momentum';
  }

  if (
    lower.includes('angry') ||
    lower.includes('hate') ||
    lower.includes('argument') ||
    lower.includes('fight') ||
    lower.includes('conflict') ||
    lower.includes('betrayed')
  ) {
    return 'Anger & Conflict';
  }

  if (
    lower.includes('meditat') ||
    lower.includes('stillness') ||
    lower.includes('quiet') ||
    lower.includes('peace') ||
    lower.includes('breath')
  ) {
    return 'Inner Stillness';
  }

  return 'Contemplation';
}

/**
 * Determines whether a query is purely casual or meta (no shloka needed)
 */
export function isCasualOrMetaQuery(query: string): boolean {
  const trimmed = query.trim().toLowerCase().replace(/[?!.,]/g, '');
  if (CASUAL_GREETINGS.has(trimmed)) return true;
  if (trimmed.length < 5) return true;
  if (trimmed.startsWith('who are you') || trimmed.startsWith('what can you do')) return true;
  return false;
}

/**
 * Core RAG Retrieval Pipeline for Bhagavad Gita Shlokas
 * Implements semantic score calculation and strict conditional relevance filtering.
 */
export function retrieveGitaShlokaRAG(query: string): RAGRetrievalResult {
  const detectedEmotion = detectEmotionalTone(query);

  // 1. Strict Filter: Casual or non-philosophical queries must NOT have shlokas forced upon them.
  if (isCasualOrMetaQuery(query)) {
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

    // A. Match against Themes (Weight: 4.0)
    for (const theme of shloka.themes) {
      if (normalizedQuery.includes(theme.toLowerCase())) {
        score += 4.0;
        currentMatchedThemes.push(theme);
      } else {
        const themeTokens = theme.toLowerCase().split(/\s+/);
        for (const tToken of themeTokens) {
          if (queryTokens.includes(tToken)) {
            score += 2.0;
            currentMatchedThemes.push(theme);
            break;
          }
        }
      }
    }

    // B. Match against Emotions (Weight: 3.5)
    for (const emotion of shloka.emotions) {
      if (normalizedQuery.includes(emotion.toLowerCase())) {
        score += 3.5;
      }
    }

    // C. Match against Real-life Situations (Weight: 3.0)
    for (const situation of shloka.situations) {
      if (normalizedQuery.includes(situation.toLowerCase())) {
        score += 3.0;
      } else {
        const sitTokens = situation.toLowerCase().split(/\s+/);
        for (const sToken of sitTokens) {
          if (queryTokens.includes(sToken) && !STOP_WORDS.has(sToken)) {
            score += 1.5;
            break;
          }
        }
      }
    }

    // D. Match against Translation & Meaning Tokens (Weight: 1.0)
    const combinedContent = `${shloka.translation} ${shloka.meaning}`.toLowerCase();
    for (const token of queryTokens) {
      if (combinedContent.includes(token)) {
        score += 0.8;
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
  const normalizedScore = Math.min(1.0, Math.round((highestScore / 12) * 100) / 100);

  // RELEVANCE GATE:
  // Only attach a shloka if the score passes the strict threshold (>= 0.40)
  // AND there are actual matched dilemma signals.
  const isShlokaRelevant = normalizedScore >= 0.40 && bestShloka !== null;

  return {
    shloka: isShlokaRelevant ? bestShloka : null,
    isShlokaRelevant,
    detectedEmotion,
    relevanceScore: normalizedScore,
    matchedThemes: bestMatchedThemes,
  };
}
