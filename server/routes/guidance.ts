import { Router, Request, Response, NextFunction } from 'express';
import { AppError } from '../middleware/errorHandler.ts';
import { runGuidanceEngine } from '../services/guidanceEngine.ts';
import { dbClient } from '../db/client.ts';

export const guidanceRouter = Router();

guidanceRouter.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { question } = req.body;

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

    // 2. Run deterministic rule-based guidance engine
    const { category, response } = runGuidanceEngine(trimmedQuestion);

    // 3. Save to database (PostgreSQL / resilient persistent store)
    const savedSession = await dbClient.createSession(trimmedQuestion, category, response);

    // 4. Return complete saved session
    return res.status(201).json(savedSession);
  } catch (err) {
    return next(err);
  }
});
