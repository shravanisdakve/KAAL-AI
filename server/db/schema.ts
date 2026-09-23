/**
 * PostgreSQL Schema Definition for KAAL AI Guidance Sessions
 */

export const CREATE_GUIDANCE_SESSIONS_TABLE_SQL = `
CREATE TABLE IF NOT EXISTS guidance_sessions (
  id SERIAL PRIMARY KEY,
  question TEXT NOT NULL,
  category VARCHAR(64) NOT NULL,
  response JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_guidance_sessions_created_at 
ON guidance_sessions (created_at DESC);
`;

export interface DbGuidanceRow {
  id: number;
  question: string;
  category: string;
  response: unknown;
  created_at: Date | string;
}
