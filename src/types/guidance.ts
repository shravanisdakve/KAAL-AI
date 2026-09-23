export type GuidanceCategory =
  | 'Clarity'
  | 'Stress'
  | 'Purpose'
  | 'Relationships'
  | 'Fear & Uncertainty'
  | 'Discipline'
  | 'Meditation'
  | 'General Reflection';

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
  steps: string[];
  frameworkSteps: TacticalStep[];
  meta?: {
    category: GuidanceCategory;
    pattern: string;
    score: number;
    matchedKeywords: string[];
    engine: 'KAAL Rule-Based Guidance Engine';
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
