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
  completed?: boolean;
}

export interface StructuredGuidanceResponse {
  title: string;
  summary: string;
  conversationalReply: string; // Natural, human-like empathetic dialogue
  steps: string[];
  frameworkSteps: TacticalStep[];
  shloka?: GitaShloka | null; // Attached ONLY when genuinely relevant
  isShlokaRelevant: boolean;
  whyThisRelates?: string; // Intellectual bridge explaining why the verse connects to user's situation
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

export interface ApiError {
  status: number;
  code: string;
  message: string;
}
