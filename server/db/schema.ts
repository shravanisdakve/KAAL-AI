/**
 * PostgreSQL Schema Definition for KAAL AI Guidance Sessions
 */

export const CREATE_GUIDANCE_SESSIONS_TABLE_SQL = `
CREATE TABLE IF NOT EXISTS guidance_sessions (
  id SERIAL PRIMARY KEY,
  session_id VARCHAR(64),
  question TEXT NOT NULL,
  category VARCHAR(64) NOT NULL,
  response JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_guidance_sessions_session_id 
ON guidance_sessions (session_id);

CREATE INDEX IF NOT EXISTS idx_guidance_sessions_created_at 
ON guidance_sessions (created_at DESC);
`;

export interface DbGuidanceRow {
  id: number;
  session_id?: string | null;
  question: string;
  category: string;
  response: unknown;
  created_at: Date | string;
}

/**
 * PostgreSQL Schema Definition for Bhagavad Gita pgvector Embeddings
 */
export const CREATE_GITA_EMBEDDINGS_TABLE_SQL = `
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS gita_embeddings (
  id SERIAL PRIMARY KEY,
  verse_id VARCHAR(32) UNIQUE NOT NULL,
  content TEXT NOT NULL,
  embedding vector(768),
  metadata JSONB NOT NULL,
  content_hash VARCHAR(64) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_gita_embeddings_verse_id 
ON gita_embeddings (verse_id);
`;

export interface DbGitaEmbeddingRow {
  id: number;
  verse_id: string;
  content: string;
  embedding: number[] | null;
  metadata: Record<string, unknown>;
  content_hash: string;
  created_at: Date | string;
}
