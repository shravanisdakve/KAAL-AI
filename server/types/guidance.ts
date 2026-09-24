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
}

export interface TacticalStep {
  id: number;
  title: string;
  description: string;
  status: 'Active Focus' | 'Pending' | 'Completed';
  checklist: string[];
}

export interface StructuredGuidanceResponse {
  title: string;
  summary: string;
  conversationalReply: string; // Natural, human-like empathetic dialogue
  steps: string[];
  frameworkSteps: TacticalStep[];
  shloka?: GitaShloka | null; // Attached ONLY when relevant
  isShlokaRelevant: boolean;
  detectedEmotion?: string;
  reflectionPrompt?: string;
  meta?: {
    category: GuidanceCategory;
    pattern: string;
    score: number;
    matchedKeywords: string[];
    relevanceScore?: number;
    retrievalEngine?: string;
    engine: string;
  };
}

export interface GuidanceSession {
  id: number;
  question: string;
  category: GuidanceCategory;
  response: StructuredGuidanceResponse;
  createdAt: string;
}

export interface GuidanceRequest {
  question: string;
}

export interface ApiErrorResponse {
  error: string;
  message: string;
  details?: Record<string, unknown>;
}
