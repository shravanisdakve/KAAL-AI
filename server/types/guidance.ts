export type GuidanceCategory =
  | 'Clarity'
  | 'Stress'
  | 'Purpose'
  | 'Relationships'
  | 'Fear & Uncertainty'
  | 'Discipline'
  | 'Meditation'
  | 'General Reflection';

export interface GitaShloka {
  id: string; // e.g. "BG2.47"
  chapter: number;
  chapterName: string;
  verse: number;
  sanskrit: string;
  transliteration: string;
  translation: string;
  author: string;
  meaning: string;
  coreWisdom: string;
  themes: string[];
  emotions: string[];
  situations: string[];
  concepts?: string[];
  contexts?: string[];
  emotional_relevance?: string[];
  modern_application?: string[];
  caution?: string[];
}

export interface NlpUnderstanding {
  emotions: string[];
  intent: string;
  topics: string[];
  needs: string[];
}

export interface TacticalStep {
  id: number;
  title: string;
  description: string;
  status: 'Active Focus' | 'Pending' | 'Completed';
  checklist: string[];
}

export interface SituationVisual {
  id: string;
  theme: string;
  title: string;
  mood: string;
  prompt: string;
  seed: number;
  palette: {
    skyTop: string;
    skyBottom: string;
    mountainFar: string;
    mountainNear: string;
    ground: string;
    accentGlow: string;
    sunGlow: string;
    waterReflection?: string;
  };
  elements: {
    sunPosition: 'center' | 'left' | 'right' | 'rising' | 'dusk';
    hasSunRays: boolean;
    hasMountains: boolean;
    hasWater: boolean;
    hasPath: boolean;
    hasMist: boolean;
    hasStars: boolean;
    hasLanterns: boolean;
    hasLotus: boolean;
    hasStones: boolean;
  };
  altText: string;
}

export interface StructuredGuidanceResponse {
  title: string;
  summary: string;
  conversationalReply: string; // Natural, human-like empathetic dialogue
  steps: string[];
  frameworkSteps: TacticalStep[];
  shloka?: GitaShloka | null; // Attached ONLY when relevant
  isShlokaRelevant: boolean;
  whyThisRelates?: string; // Intellectual bridge explaining why the verse connects to user's situation
  detectedEmotion?: string;
  reflectionPrompt?: string;
  situationVisual?: SituationVisual; // Bespoke situational visual generated on the fly
  meta?: {
    category: GuidanceCategory;
    pattern: string;
    score: number;
    matchedKeywords: string[];
    relevanceScore?: number;
    retrievalEngine?: string;
    engine: string;
    retrievalMethod?: 'hybrid' | 'semantic' | 'lexical';
    semanticScore?: number;
    keywordScore?: number;
    contextScore?: number;
    finalScore?: number;
    nlpAnalysis?: NlpUnderstanding;
    candidateRankings?: { id: string; finalScore: number }[];
  };
}

export interface GuidanceExchange {
  id: string;
  question: string;
  response: StructuredGuidanceResponse;
  createdAt: string;
}

export interface GuidanceSession {
  id: number;
  question: string;
  category: GuidanceCategory;
  response: StructuredGuidanceResponse;
  messages?: GuidanceExchange[];
  createdAt: string;
  updatedAt?: string;
}

export interface GuidanceRequest {
  question: string;
  sessionId?: number;
}

export interface ApiErrorResponse {
  error: string;
  message: string;
  details?: Record<string, unknown>;
}
