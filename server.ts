import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { guidanceRouter } from './server/routes/guidance.ts';
import { historyRouter } from './server/routes/history.ts';
import { errorHandler } from './server/middleware/errorHandler.ts';
import { dbClient } from './server/db/client.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

// Body parser
app.use(express.json());

// API health endpoint
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'KAAL AI — Mini Guidance Assistant',
    engine: 'KAAL Rule-Based Guidance Engine',
    timestamp: new Date().toISOString(),
  });
});

// Mount application REST endpoints
app.use('/api/guidance', guidanceRouter);
app.use('/api/history', historyRouter);

// Global Error Handler for API routes
app.use(errorHandler);

// Start server function with Vite dev middleware or static serving
async function startServer() {
  // Initialize Database (PostgreSQL if DATABASE_URL configured, or local persistent store)
  await dbClient.init();

  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`✓ KAAL AI Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Fatal startup error in KAAL AI server:', err);
  process.exit(1);
});
