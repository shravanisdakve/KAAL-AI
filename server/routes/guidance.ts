import { Router, Request, Response, NextFunction } from 'express';
import { AppError } from '../middleware/errorHandler.ts';
import { runGuidanceEngine } from '../services/guidanceEngine.ts';
import { dbClient } from '../db/client.ts';

export const guidanceRouter = Router();

guidanceRouter.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { question, sessionId, threadId } = req.body;
    const headerSessionId = req.headers['x-session-id'] as string | undefined;

    // 1. Validate request
    if (question === undefined || question === null) {
      throw new AppError(400, 'INVALID_QUESTION', 'Please enter a question before submitting.');
    }

    if (typeof question !== 'string') {
      throw new AppError(400, 'INVALID_QUESTION', 'Question must be a valid text string.');
    }

    const trimmedQuestion = question.trim();

    if (trimmedQuestion.length === 0) {
      throw new AppError(400, 'INVALID_QUESTION', 'Please enter a question before submitting.');
    }

    if (trimmedQuestion.length > 1000) {
      throw new AppError(
        400,
        'QUESTION_TOO_LONG',
        'Question exceeds the maximum allowed length of 1,000 characters.'
      );
    }

    // Determine thread ID (if continuing multi-turn dialogue in same session)
    let targetThreadId: number | null = null;
    if (threadId !== undefined && threadId !== null) {
      const num = Number(threadId);
      if (!isNaN(num) && num > 0) targetThreadId = num;
    } else if (sessionId !== undefined && sessionId !== null && typeof sessionId === 'number') {
      targetThreadId = sessionId;
    } else if (typeof sessionId === 'string' && /^\d+$/.test(sessionId)) {
      targetThreadId = parseInt(sessionId, 10);
    }

    // Determine anonymous client session ID for history isolation
    const clientSessionId: string | undefined =
      headerSessionId ||
      (typeof sessionId === 'string' && !/^\d+$/.test(sessionId) ? sessionId : undefined);

    // 2. If continuing an existing conversation thread, append turn
    if (targetThreadId !== null) {
      const existingSession = await dbClient.getSessionById(targetThreadId);
      if (existingSession) {
        const { response } = await runGuidanceEngine(trimmedQuestion, existingSession);
        const updatedSession = await dbClient.appendMessageToSession(
          targetThreadId,
          trimmedQuestion,
          response
        );
        if (updatedSession) {
          return res.status(200).json(updatedSession);
        }
      }
    }

    // 3. Otherwise start a new conversation session associated with clientSessionId
    const { category, response } = await runGuidanceEngine(trimmedQuestion);
    const savedSession = await dbClient.createSession(
      trimmedQuestion,
      category,
      response,
      clientSessionId
    );

    return res.status(201).json(savedSession);
  } catch (err) {
    return next(err);
  }
});
