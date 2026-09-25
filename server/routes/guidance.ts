import { Router, Request, Response, NextFunction } from 'express';
import { AppError } from '../middleware/errorHandler.ts';
import { runGuidanceEngine } from '../services/guidanceEngine.ts';
import { dbClient } from '../db/client.ts';

export const guidanceRouter = Router();

guidanceRouter.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { question, sessionId } = req.body;

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

    // 2. If continuing an existing conversation thread, append turn
    if (sessionId !== undefined && sessionId !== null) {
      const numericSessionId = Number(sessionId);
      if (!isNaN(numericSessionId) && numericSessionId > 0) {
        const existingSession = await dbClient.getSessionById(numericSessionId);
        if (existingSession) {
          const { response } = await runGuidanceEngine(trimmedQuestion, existingSession);
          const updatedSession = await dbClient.appendMessageToSession(
            numericSessionId,
            trimmedQuestion,
            response
          );
          if (updatedSession) {
            return res.status(200).json(updatedSession);
          }
        }
      }
    }

    // 3. Otherwise start a new conversation session
    const { category, response } = await runGuidanceEngine(trimmedQuestion);
    const savedSession = await dbClient.createSession(trimmedQuestion, category, response);

    return res.status(201).json(savedSession);
  } catch (err) {
    return next(err);
  }
});
