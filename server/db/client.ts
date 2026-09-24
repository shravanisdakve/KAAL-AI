import pg from 'pg';
import fs from 'fs';
import path from 'path';
import {
  GuidanceCategory,
  GuidanceSession,
  StructuredGuidanceResponse,
} from '../types/guidance.ts';
import { CREATE_GUIDANCE_SESSIONS_TABLE_SQL } from './schema.ts';
import { runGuidanceEngine, runGuidanceEngineSync } from '../services/guidanceEngine.ts';

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
          console.log('✓ PostgreSQL connected and schema verified.');

          // Check if seed rows are needed in PostgreSQL
          const countRes = await client.query('SELECT COUNT(*) FROM guidance_sessions');
          if (parseInt(countRes.rows[0].count, 10) === 0) {
            console.log('Seeding initial PostgreSQL records...');
            await this.seedPostgres(client);
          }
        } finally {
          client.release();
        }
      } catch (err) {
        console.warn(
          'PostgreSQL connection failed. Falling back to persistent local storage:',
          (err as Error).message
        );
        this.isPostgresAvailable = false;
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
    response: StructuredGuidanceResponse
  ): Promise<GuidanceSession> {
    await this.init();

    if (this.isPostgresAvailable && this.pool) {
      try {
        const res = await this.pool.query(
          `INSERT INTO guidance_sessions (question, category, response, created_at)
           VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
           RETURNING id, question, category, response, created_at`,
          [question, category, JSON.stringify(response)]
        );
        const row = res.rows[0];
        return {
          id: row.id,
          question: row.question,
          category: row.category as GuidanceCategory,
          response: typeof row.response === 'string' ? JSON.parse(row.response) : row.response,
          createdAt: new Date(row.created_at).toISOString(),
        };
      } catch (err) {
        console.error('PostgreSQL insert error, falling back to local store:', err);
      }
    }

    // Local fallback
    const newSession: GuidanceSession = {
      id: this.currentId++,
      question,
      category,
      response,
      createdAt: new Date().toISOString(),
    };

    this.localStore.unshift(newSession);
    this.persistLocalStore();
    return newSession;
  }

  public async getAllSessions(): Promise<GuidanceSession[]> {
    await this.init();

    if (this.isPostgresAvailable && this.pool) {
      try {
        const res = await this.pool.query(
          'SELECT id, question, category, response, created_at FROM guidance_sessions ORDER BY created_at DESC'
        );
        return res.rows.map((row) => ({
          id: row.id,
          question: row.question,
          category: row.category as GuidanceCategory,
          response: typeof row.response === 'string' ? JSON.parse(row.response) : row.response,
          createdAt: new Date(row.created_at).toISOString(),
        }));
      } catch (err) {
        console.error('PostgreSQL select error, using local store:', err);
      }
    }

    return [...this.localStore].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  public async getSessionById(id: number): Promise<GuidanceSession | null> {
    await this.init();

    if (this.isPostgresAvailable && this.pool) {
      try {
        const res = await this.pool.query(
          'SELECT id, question, category, response, created_at FROM guidance_sessions WHERE id = $1',
          [id]
        );
        if (res.rows.length === 0) return null;
        const row = res.rows[0];
        return {
          id: row.id,
          question: row.question,
          category: row.category as GuidanceCategory,
          response: typeof row.response === 'string' ? JSON.parse(row.response) : row.response,
          createdAt: new Date(row.created_at).toISOString(),
        };
      } catch (err) {
        console.error('PostgreSQL selectById error, checking local store:', err);
      }
    }

    const found = this.localStore.find((item) => item.id === id);
    return found || null;
  }

  public async deleteSessionById(id: number): Promise<boolean> {
    await this.init();

    let deletedInPg = false;
    if (this.isPostgresAvailable && this.pool) {
      try {
        const res = await this.pool.query('DELETE FROM guidance_sessions WHERE id = $1', [id]);
        deletedInPg = (res.rowCount ?? 0) > 0;
      } catch (err) {
        console.error('PostgreSQL deleteById error:', err);
      }
    }

    const initialLen = this.localStore.length;
    this.localStore = this.localStore.filter((item) => item.id !== id);
    const deletedInLocal = this.localStore.length < initialLen;
    if (deletedInLocal) {
      this.persistLocalStore();
    }

    return deletedInPg || deletedInLocal;
  }

  public async clearAllSessions(): Promise<boolean> {
    await this.init();

    if (this.isPostgresAvailable && this.pool) {
      try {
        await this.pool.query('DELETE FROM guidance_sessions');
      } catch (err) {
        console.error('PostgreSQL clearAll error:', err);
      }
    }

    this.localStore = [];
    this.persistLocalStore();
    return true;
  }
}

export const dbClient = new DatabaseManager();
