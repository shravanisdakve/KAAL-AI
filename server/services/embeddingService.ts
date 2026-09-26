import crypto from 'crypto';
import { GoogleGenAI } from '@google/genai';
import { GitaShloka } from '../types/guidance.ts';

export const EMBEDDING_MODEL_NAME = 'gemini-embedding-2';
export const EMBEDDING_DIMENSION = 768;

/**
 * Validates that an embedding array is non-empty and has exactly the target dimensionality.
 */
export function validateEmbedding(values: unknown): values is number[] {
  if (!Array.isArray(values)) return false;
  if (values.length !== EMBEDDING_DIMENSION) return false;
  return values.every((v) => typeof v === 'number' && !isNaN(v));
}

/**
 * Computes a deterministic SHA-256 content hash for idempotent corpus embedding.
 */
export function computeContentHash(content: string): string {
  return crypto.createHash('sha256').update(content.trim()).digest('hex');
}

/**
 * Builds an enriched document representation for a Bhagavad Gita verse.
 * Incorporates philosophical concepts, emotional context, modern applications,
 * translation, and commentary cautions so that semantic retrieval works
 * on real-world queries even when exact keywords are absent.
 */
export function buildEnrichedGitaDocument(shloka: GitaShloka): string {
  const parts: string[] = [
    `Verse ID: ${shloka.id}`,
    `Chapter: Chapter ${shloka.chapter} (${shloka.chapterName}), Verse ${shloka.verse}`,
    `Translation: "${shloka.translation}"`,
    `Core Wisdom: ${shloka.coreWisdom}`,
    `Meaning & Commentary: ${shloka.meaning}`,
    `Themes: ${shloka.themes.join(', ')}`,
    shloka.concepts && shloka.concepts.length > 0
      ? `Concepts: ${shloka.concepts.join(', ')}`
      : '',
    shloka.contexts && shloka.contexts.length > 0
      ? `Context: ${shloka.contexts.join(', ')}`
      : '',
    shloka.emotional_relevance && shloka.emotional_relevance.length > 0
      ? `Emotional Resonance: ${shloka.emotional_relevance.join(', ')}`
      : '',
    `Life Situations: ${shloka.situations.join(', ')}`,
    shloka.modern_application && shloka.modern_application.length > 0
      ? `Modern Psychological Application: ${shloka.modern_application.join(', ')}`
      : '',
    shloka.caution && shloka.caution.length > 0
      ? `Scope & Caution: ${shloka.caution.join(', ')}`
      : '',
  ];

  return parts.filter(Boolean).join('\n');
}

/**
 * Gemini Embedding Service
 * Manages text embedding generation via Google GenAI with strict 768-dimension validation.
 */
class EmbeddingService {
  private aiClient: GoogleGenAI | null = null;
  private apiKey: string | null = null;

  constructor() {
    this.initClient();
  }

  private initClient(): void {
    const key = process.env.GEMINI_API_KEY || process.env.API_KEY || null;
    if (key && key !== this.apiKey) {
      this.apiKey = key;
      try {
        this.aiClient = new GoogleGenAI({ apiKey: key });
      } catch (err) {
        console.warn('Could not initialize GoogleGenAI embedding client:', err);
        this.aiClient = null;
      }
    }
  }

  public isConfigured(): boolean {
    this.initClient();
    return Boolean(this.aiClient && this.apiKey);
  }

  /**
   * Generates a 768-dimensional embedding for a single text string.
   */
  public async embedText(text: string, title?: string): Promise<number[]> {
    this.initClient();

    if (!this.aiClient || !this.apiKey) {
      throw new Error('GEMINI_API_KEY is not configured for embedding generation.');
    }

    const trimmed = text.trim();
    if (!trimmed) {
      throw new Error('Cannot embed empty text content.');
    }

    try {
      const response = await this.aiClient.models.embedContent({
        model: EMBEDDING_MODEL_NAME,
        contents: trimmed,
        config: {
          outputDimensionality: EMBEDDING_DIMENSION,
          title: title || undefined,
        },
      });

      const values = response.embeddings?.[0]?.values;

      if (!validateEmbedding(values)) {
        const len = Array.isArray(values) ? (values as any[]).length : typeof values;
        throw new Error(
          `Embedding output failed validation. Expected ${EMBEDDING_DIMENSION} dimensions, received ${len}.`
        );
      }

      return values;
    } catch (err: unknown) {
      const msg = (err as Error).message || String(err);
      // If the model ID is not available on this API key tier, throw clear error
      throw new Error(`Embedding API call failed for model "${EMBEDDING_MODEL_NAME}": ${msg}`);
    }
  }

  /**
   * Embeds a user query.
   */
  public async embedQuery(query: string): Promise<number[]> {
    return this.embedText(query);
  }

  /**
   * Embeds a Gita verse document with its citation title.
   */
  public async embedDocument(documentText: string, title?: string): Promise<number[]> {
    return this.embedText(documentText, title);
  }
}

export const embeddingService = new EmbeddingService();
