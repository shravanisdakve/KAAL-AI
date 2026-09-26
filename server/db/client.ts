import pg from 'pg';
import pgvector from 'pgvector/pg';
import fs from 'fs';
import path from 'path';
import {
  GuidanceCategory,
  GuidanceExchange,
  GuidanceSession,
  StructuredGuidanceResponse,
} from '../types/guidance.ts';
import {
  CREATE_GUIDANCE_SESSIONS_TABLE_SQL,
  CREATE_GITA_EMBEDDINGS_TABLE_SQL,
} from './schema.ts';
import { runGuidanceEngine, runGuidanceEngineSync } from '../services/guidanceEngine.ts';
import {
  embeddingService,
  buildEnrichedGitaDocument,
  computeContentHash,
} from '../services/embeddingService.ts';
import { BHAGAVAD_GITA_CORPUS } from '../data/gitaDataset.ts';

const { Pool } = pg;

// Seed data aligned with the UI design screenshot
const INITIAL_SEED_QUESTIONS = [
  {
    question: 'I feel confused about which path I should take in life.',
    category: 'Clarity' as GuidanceCategory,
    timeOffsetHours: 0.1, // Today
  },
  {
    question:
      'I feel overwhelmed by everything happening in my life. What should I do?',
    category: 'Stress' as GuidanceCategory,
    timeOffsetHours: 1.2, // Today
  },
  {
    question: 'My mind keeps overthinking things. How can I become calmer?',
    category: 'Stress' as GuidanceCategory,
    timeOffsetHours: 3.5, // Today
  },
  {
    question: 'I know what I need to do, but I keep procrastinating.',
    category: 'Discipline' as GuidanceCategory,
    timeOffsetHours: 25.0, // Yesterday
  },
  {
    question:
      "I feel like I am working hard but I don't know what my purpose is.",
    category: 'Purpose' as GuidanceCategory,
    timeOffsetHours: 28.5, // Yesterday
  },
  {
    question:
      'How can I build a meditation habit that I can actually maintain?',
    category: 'Meditation' as GuidanceCategory,
    timeOffsetHours: 52.0, // Earlier
  },
];

class DatabaseManager {
  private pool: pg.Pool | null = null;
  private isPostgresAvailable = false;
  private isPgVectorAvailable = false;
  private localStore: GuidanceSession[] = [];
  private currentId = 1;
  private initialized = false;
  private storeFilePath: string;

  constructor() {
    this.storeFilePath = path.resolve(process.cwd(), '.guidance_data.json');
    const databaseUrl = process.env.DATABASE_URL;

    if (databaseUrl) {
      try {
        this.pool = new Pool({
          connectionString: databaseUrl,
          ssl:
            process.env.NODE_ENV === 'production' && !databaseUrl.includes('localhost')
              ? { rejectUnauthorized: false }
              : false,
          max: 10,
          connectionTimeoutMillis: 5000,
        });

        this.pool.on('error', (err) => {
          console.error('PostgreSQL idle client error:', err.message);
        });
      } catch (err) {
        console.warn('Could not initialize PostgreSQL pool:', err);
        this.pool = null;
      }
    }
  }

  public async init(): Promise<void> {
    if (this.initialized) return;

    if (this.pool) {
      try {
        const client = await this.pool.connect();
        try {
          await client.query(CREATE_GUIDANCE_SESSIONS_TABLE_SQL);
          this.isPostgresAvailable = true;
          console.log('✓ PostgreSQL connected and session schema verified.');

          // Check if pgvector extension and gita_embeddings table are supported
          try {
            await client.query(CREATE_GITA_EMBEDDINGS_TABLE_SQL);
            await pgvector.registerTypes(client);
            this.isPgVectorAvailable = true;
            console.log('✓ PostgreSQL pgvector extension and gita_embeddings table verified.');
          } catch (vErr) {
            this.isPgVectorAvailable = false;
            console.warn(
              'pgvector extension not active in this PostgreSQL instance. Operating with graceful degradation to deterministic fallback:',
              (vErr as Error).message
            );
          }

          // Check if seed rows are needed in PostgreSQL
          const countRes = await client.query('SELECT COUNT(*) FROM guidance_sessions');
          if (parseInt(countRes.rows[0].count, 10) === 0) {
            console.log('Seeding initial PostgreSQL records...');
            await this.seedPostgres(client);
          }
        } finally {
          client.release();
        }

        // Idempotent background sync of Gita embeddings if pgvector and Gemini key are configured
        if (this.isPgVectorAvailable && embeddingService.isConfigured()) {
          this.syncGitaEmbeddings().catch((e) => {
            console.warn('Gita embeddings background sync warning:', (e as Error).message);
          });
        }
      } catch (err) {
        console.warn(
          'PostgreSQL connection failed. Falling back to persistent local storage:',
          (err as Error).message
        );
        this.isPostgresAvailable = false;
        this.isPgVectorAvailable = false;
        this.initLocalStore();
      }
    } else {
      console.log('DATABASE_URL not configured. Operating with persistent local storage.');
      this.initLocalStore();
    }

    this.initialized = true;
  }

  private async seedPostgres(client: pg.PoolClient): Promise<void> {
    const now = Date.now();
    for (const item of INITIAL_SEED_QUESTIONS) {
      const { category, response } = await runGuidanceEngine(item.question);
      const createdAt = new Date(now - item.timeOffsetHours * 3600 * 1000).toISOString();
      await client.query(
        'INSERT INTO guidance_sessions (question, category, response, created_at) VALUES ($1, $2, $3, $4)',
        [item.question, category, JSON.stringify(response), createdAt]
      );
    }
  }

  private initLocalStore(): void {
    if (fs.existsSync(this.storeFilePath)) {
      try {
        const raw = fs.readFileSync(this.storeFilePath, 'utf-8');
        const data = JSON.parse(raw);
        if (Array.isArray(data) && data.length > 0) {
          this.localStore = data;
          this.currentId = Math.max(...data.map((d: GuidanceSession) => d.id || 0)) + 1;
          return;
        }
      } catch (e) {
        console.warn('Failed reading existing store file, reseeding:', e);
      }
    }

    // Seed default items
    const now = Date.now();
    this.localStore = INITIAL_SEED_QUESTIONS.map((seed, idx) => {
      const { category, response } = runGuidanceEngineSync(seed.question);
      return {
        id: idx + 1,
        question: seed.question,
        category,
        response,
        createdAt: new Date(now - seed.timeOffsetHours * 3600 * 1000).toISOString(),
      };
    });
    this.currentId = this.localStore.length + 1;
    this.persistLocalStore();
  }

  private persistLocalStore(): void {
    try {
      fs.writeFileSync(this.storeFilePath, JSON.stringify(this.localStore, null, 2), 'utf-8');
    } catch (e) {
      console.error('Failed writing local store:', e);
    }
  }

  public async createSession(
    question: string,
    category: GuidanceCategory,
    response: StructuredGuidanceResponse,
    sessionId?: string
  ): Promise<GuidanceSession> {
    await this.init();

    const initialExchange: GuidanceExchange = {
      id: `msg-${Date.now()}-1`,
      question,
      response,
      createdAt: new Date().toISOString(),
    };

    const payload = {
      ...response,
      messages: [initialExchange],
    };

    if (this.isPostgresAvailable && this.pool) {
      const res = await this.pool.query(
        `INSERT INTO guidance_sessions (session_id, question, category, response, created_at)
         VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
         RETURNING id, session_id, question, category, response, created_at`,
        [sessionId || null, question, category, JSON.stringify(payload)]
      );
      const row = res.rows[0];
      const parsed = typeof row.response === 'string' ? JSON.parse(row.response) : row.response;
      return {
        id: row.id,
        sessionId: row.session_id || undefined,
        question: row.question,
        category: row.category as GuidanceCategory,
        response: parsed,
        messages: parsed.messages || [initialExchange],
        createdAt: new Date(row.created_at).toISOString(),
      };
    }

    // Explicit degraded local fallback (when PostgreSQL is not configured / offline)
    const newSession: GuidanceSession = {
      id: this.currentId++,
      sessionId: sessionId || undefined,
      question,
      category,
      response,
      messages: [initialExchange],
      createdAt: new Date().toISOString(),
    };

    this.localStore.unshift(newSession);
    this.persistLocalStore();
    return newSession;
  }

  public async appendMessageToSession(
    id: number,
    question: string,
    response: StructuredGuidanceResponse
  ): Promise<GuidanceSession | null> {
    await this.init();

    const newExchange: GuidanceExchange = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      question,
      response,
      createdAt: new Date().toISOString(),
    };

    if (this.isPostgresAvailable && this.pool) {
      const existing = await this.getSessionById(id);
      if (!existing) return null;

      const messages = existing.messages || [
        {
          id: `msg-${existing.id}-1`,
          question: existing.question,
          response: existing.response,
          createdAt: existing.createdAt,
        },
      ];
      messages.push(newExchange);
      const payload = { ...response, messages };

      await this.pool.query(
        `UPDATE guidance_sessions SET response = $1, created_at = CURRENT_TIMESTAMP WHERE id = $2`,
        [JSON.stringify(payload), id]
      );

      return {
        ...existing,
        response,
        messages,
        updatedAt: new Date().toISOString(),
      };
    }

    // Degraded local store
    const session = this.localStore.find((s) => s.id === id);
    if (session) {
      if (!session.messages) {
        session.messages = [
          {
            id: `msg-${session.id}-1`,
            question: session.question,
            response: session.response,
            createdAt: session.createdAt,
          },
        ];
      }
      session.messages.push(newExchange);
      session.response = response;
      session.updatedAt = new Date().toISOString();
      this.persistLocalStore();
      return session;
    }

    return null;
  }

  public async getAllSessions(sessionId?: string): Promise<GuidanceSession[]> {
    await this.init();

    if (this.isPostgresAvailable && this.pool) {
      const query = sessionId
        ? 'SELECT id, session_id, question, category, response, created_at FROM guidance_sessions WHERE session_id = $1 ORDER BY created_at DESC'
        : 'SELECT id, session_id, question, category, response, created_at FROM guidance_sessions ORDER BY created_at DESC';
      const params = sessionId ? [sessionId] : [];
      const res = await this.pool.query(query, params);

      return res.rows.map((row) => {
        const parsed = typeof row.response === 'string' ? JSON.parse(row.response) : row.response;
        const messages =
          parsed && Array.isArray(parsed.messages)
            ? parsed.messages
            : [
                {
                  id: `msg-${row.id}-1`,
                  question: row.question,
                  response: parsed,
                  createdAt: new Date(row.created_at).toISOString(),
                },
              ];
        return {
          id: row.id,
          sessionId: row.session_id || undefined,
          question: row.question,
          category: row.category as GuidanceCategory,
          response: parsed,
          messages,
          createdAt: new Date(row.created_at).toISOString(),
        };
      });
    }

    // Degraded local store
    return [...this.localStore]
      .filter((item) => {
        if (!sessionId) return true;
        return item.sessionId === sessionId || !item.sessionId;
      })
      .map((item) => {
        if (!item.messages || item.messages.length === 0) {
          item.messages = [
            {
              id: `msg-${item.id}-1`,
              question: item.question,
              response: item.response,
              createdAt: item.createdAt,
            },
          ];
        }
        return item;
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public async getSessionById(id: number): Promise<GuidanceSession | null> {
    await this.init();

    if (this.isPostgresAvailable && this.pool) {
      const res = await this.pool.query(
        'SELECT id, session_id, question, category, response, created_at FROM guidance_sessions WHERE id = $1',
        [id]
      );
      if (res.rows.length === 0) return null;
      const row = res.rows[0];
      const parsed = typeof row.response === 'string' ? JSON.parse(row.response) : row.response;
      const messages =
        parsed && Array.isArray(parsed.messages)
          ? parsed.messages
          : [
              {
                id: `msg-${row.id}-1`,
                question: row.question,
                response: parsed,
                createdAt: new Date(row.created_at).toISOString(),
              },
            ];
      return {
        id: row.id,
        sessionId: row.session_id || undefined,
        question: row.question,
        category: row.category as GuidanceCategory,
        response: parsed,
        messages,
        createdAt: new Date(row.created_at).toISOString(),
      };
    }

    const found = this.localStore.find((item) => item.id === id);
    if (found) {
      if (!found.messages || found.messages.length === 0) {
        found.messages = [
          {
            id: `msg-${found.id}-1`,
            question: found.question,
            response: found.response,
            createdAt: found.createdAt,
          },
        ];
      }
      return found;
    }
    return null;
  }

  public async deleteSessionById(id: number, sessionId?: string): Promise<boolean> {
    await this.init();

    if (this.isPostgresAvailable && this.pool) {
      const query = sessionId
        ? 'DELETE FROM guidance_sessions WHERE id = $1 AND (session_id = $2 OR session_id IS NULL)'
        : 'DELETE FROM guidance_sessions WHERE id = $1';
      const params = sessionId ? [id, sessionId] : [id];
      const res = await this.pool.query(query, params);
      return (res.rowCount ?? 0) > 0;
    }

    const initialLen = this.localStore.length;
    this.localStore = this.localStore.filter((item) => {
      if (item.id !== id) return true;
      if (sessionId && item.sessionId && item.sessionId !== sessionId) return true;
      return false;
    });
    const deletedInLocal = this.localStore.length < initialLen;
    if (deletedInLocal) {
      this.persistLocalStore();
    }

    return deletedInLocal;
  }

  public async clearAllSessions(sessionId?: string): Promise<boolean> {
    await this.init();

    if (this.isPostgresAvailable && this.pool) {
      if (sessionId) {
        await this.pool.query('DELETE FROM guidance_sessions WHERE session_id = $1', [sessionId]);
      } else {
        await this.pool.query('DELETE FROM guidance_sessions');
      }
      return true;
    }

    if (sessionId) {
      this.localStore = this.localStore.filter((item) => item.sessionId !== sessionId);
    } else {
      this.localStore = [];
    }
    this.persistLocalStore();
    return true;
  }

  /**
   * Idempotent synchronization of Bhagavad Gita verse embeddings into PostgreSQL pgvector.
   * Compares content hash of each enriched document to avoid unnecessary embedding API calls.
   */
  public async syncGitaEmbeddings(): Promise<{ synced: number; skipped: number }> {
    await this.init();

    if (!this.isPgVectorAvailable || !this.pool || !embeddingService.isConfigured()) {
      return { synced: 0, skipped: 0 };
    }

    const client = await this.pool.connect();
    let synced = 0;
    let skipped = 0;

    try {
      await pgvector.registerTypes(client);

      const existingRes = await client.query(
        'SELECT verse_id, content_hash FROM gita_embeddings'
      );
      const existingMap = new Map<string, string>();
      for (const row of existingRes.rows) {
        existingMap.set(row.verse_id, row.content_hash);
      }

      for (const shloka of BHAGAVAD_GITA_CORPUS) {
        const enrichedContent = buildEnrichedGitaDocument(shloka);
        const currentHash = computeContentHash(enrichedContent);

        // Idempotent: skip API call if identical content is already indexed
        if (existingMap.get(shloka.id) === currentHash) {
          skipped++;
          continue;
        }

        try {
          const vector = await embeddingService.embedDocument(
            enrichedContent,
            `${shloka.id}: ${shloka.chapterName}`
          );

          const metadata = {
            id: shloka.id,
            chapter: shloka.chapter,
            chapterName: shloka.chapterName,
            verse: shloka.verse,
            translation: shloka.translation,
            themes: shloka.themes,
            emotions: shloka.emotions,
          };

          await client.query(
            `INSERT INTO gita_embeddings (verse_id, content, embedding, metadata, content_hash)
             VALUES ($1, $2, $3, $4, $5)
             ON CONFLICT (verse_id) DO UPDATE SET
               content = EXCLUDED.content,
               embedding = EXCLUDED.embedding,
               metadata = EXCLUDED.metadata,
               content_hash = EXCLUDED.content_hash,
               created_at = CURRENT_TIMESTAMP`,
            [
              shloka.id,
              enrichedContent,
              pgvector.toSql(vector),
              JSON.stringify(metadata),
              currentHash,
            ]
          );

          synced++;
        } catch (embErr) {
          console.warn(`Failed embedding verse ${shloka.id}:`, (embErr as Error).message);
        }
      }

      if (synced > 0) {
        console.log(`✓ Synchronized ${synced} Gita verse embeddings with PostgreSQL pgvector.`);
      }
    } finally {
      client.release();
    }

    return { synced, skipped };
  }

  /**
   * Performs cosine distance vector similarity search on gita_embeddings table using pgvector (<=> operator).
   */
  public async searchSimilarGitaVerses(
    queryVector: number[],
    limit: number = 5
  ): Promise<Array<{ verse_id: string; similarity: number; metadata: any }>> {
    await this.init();

    if (!this.isPgVectorAvailable || !this.pool) {
      return [];
    }

    const client = await this.pool.connect();
    try {
      await pgvector.registerTypes(client);
      const res = await client.query(
        `SELECT verse_id, 1 - (embedding <=> $1) AS similarity, metadata
         FROM gita_embeddings
         WHERE embedding IS NOT NULL
         ORDER BY embedding <=> $1
         LIMIT $2`,
        [pgvector.toSql(queryVector), limit]
      );

      return res.rows.map((row) => ({
        verse_id: row.verse_id,
        similarity: Math.max(0, Math.min(1.0, parseFloat(row.similarity))),
        metadata: typeof row.metadata === 'string' ? JSON.parse(row.metadata) : row.metadata,
      }));
    } catch (err) {
      console.warn('pgvector search error, falling back to deterministic search:', (err as Error).message);
      return [];
    } finally {
      client.release();
    }
  }

  public getIsPgVectorAvailable(): boolean {
    return this.isPgVectorAvailable;
  }
}

export const dbClient = new DatabaseManager();
