import { Router, Request, Response, NextFunction } from 'express';
import { AppError } from '../middleware/errorHandler.ts';
import { dbClient } from '../db/client.ts';

export const historyRouter = Router();

// GET /api/history - Return conversations newest first (filtered by anonymous sessionId if provided)
historyRouter.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const sessionId = (req.query.sessionId as string) || (req.headers['x-session-id'] as string) || undefined;
    const sessions = await dbClient.getAllSessions(sessionId);
    return res.json(sessions);
  } catch (err) {
    return next(err);
  }
});

// GET /api/history/:id - Return a single conversation by ID
historyRouter.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const rawId = req.params.id;
    const id = parseInt(rawId, 10);

    if (isNaN(id) || id <= 0) {
      throw new AppError(400, 'INVALID_ID', 'Session ID must be a positive integer.');
    }

    const session = await dbClient.getSessionById(id);

    if (!session) {
      throw new AppError(404, 'NOT_FOUND', 'Requested guidance conversation was not found.');
    }

    return res.json(session);
  } catch (err) {
    return next(err);
  }
});

// DELETE /api/history/:id - Delete a single conversation by ID
historyRouter.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const rawId = req.params.id;
    const id = parseInt(rawId, 10);
    const sessionId = (req.query.sessionId as string) || (req.headers['x-session-id'] as string) || undefined;

    if (isNaN(id) || id <= 0) {
      throw new AppError(400, 'INVALID_ID', 'Session ID must be a positive integer.');
    }

    const deleted = await dbClient.deleteSessionById(id, sessionId);

    if (!deleted) {
      throw new AppError(404, 'NOT_FOUND', 'Requested guidance conversation was not found.');
    }

    return res.json({ success: true, message: `Session ${id} deleted successfully.` });
  } catch (err) {
    return next(err);
  }
});

// DELETE /api/history - Clear conversation history for this session (or all if unspecified)
historyRouter.delete('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const sessionId = (req.query.sessionId as string) || (req.headers['x-session-id'] as string) || undefined;
    await dbClient.clearAllSessions(sessionId);
    return res.json({ success: true, message: 'Guidance history cleared successfully.' });
  } catch (err) {
    return next(err);
  }
});
