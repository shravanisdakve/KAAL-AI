import { ApiError, GuidanceSession } from '../types/guidance.ts';

export async function askGuidance(
  question: string,
  sessionId?: number | null
): Promise<GuidanceSession> {
  const trimmed = question.trim();
  if (!trimmed) {
    throw {
      status: 400,
      code: 'INVALID_QUESTION',
      message: 'Please enter a question before submitting.',
    } as ApiError;
  }

  try {
    const res = await fetch('/api/guidance', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        question: trimmed,
        ...(sessionId ? { sessionId } : {}),
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      throw {
        status: res.status,
        code: data.error || 'SERVER_ERROR',
        message: data.message || "We couldn't generate your guidance right now.",
      } as ApiError;
    }

    return data as GuidanceSession;
  } catch (err: unknown) {
    if ((err as ApiError).code) {
      throw err;
    }
    throw {
      status: 500,
      code: 'NETWORK_ERROR',
      message: 'Network error. Please check your connection and try again.',
    } as ApiError;
  }
}

export async function fetchHistory(): Promise<GuidanceSession[]> {
  try {
    const res = await fetch('/api/history');
    const data = await res.json();

    if (!res.ok) {
      throw {
        status: res.status,
        code: data.error || 'SERVER_ERROR',
        message: data.message || 'Failed to fetch conversation history.',
      } as ApiError;
    }

    return data as GuidanceSession[];
  } catch (err: unknown) {
    if ((err as ApiError).code) {
      throw err;
    }
    throw {
      status: 500,
      code: 'NETWORK_ERROR',
      message: 'Failed to communicate with history service.',
    } as ApiError;
  }
}

export async function fetchHistoryById(id: number): Promise<GuidanceSession> {
  try {
    const res = await fetch(`/api/history/${id}`);
    const data = await res.json();

    if (!res.ok) {
      throw {
        status: res.status,
        code: data.error || 'NOT_FOUND',
        message: data.message || 'Requested guidance conversation was not found.',
      } as ApiError;
    }

    return data as GuidanceSession;
  } catch (err: unknown) {
    if ((err as ApiError).code) {
      throw err;
    }
    throw {
      status: 500,
      code: 'NETWORK_ERROR',
      message: 'Failed to retrieve conversation details.',
    } as ApiError;
  }
}

export async function deleteHistoryById(id: number): Promise<void> {
  try {
    const res = await fetch(`/api/history/${id}`, {
      method: 'DELETE',
    });
    const data = await res.json();

    if (!res.ok) {
      throw {
        status: res.status,
        code: data.error || 'DELETE_FAILED',
        message: data.message || 'Failed to delete conversation.',
      } as ApiError;
    }
  } catch (err: unknown) {
    if ((err as ApiError).code) {
      throw err;
    }
    throw {
      status: 500,
      code: 'NETWORK_ERROR',
      message: 'Failed to communicate with history service.',
    } as ApiError;
  }
}

export async function clearAllHistory(): Promise<void> {
  try {
    const res = await fetch('/api/history', {
      method: 'DELETE',
    });
    const data = await res.json();

    if (!res.ok) {
      throw {
        status: res.status,
        code: data.error || 'DELETE_FAILED',
        message: data.message || 'Failed to clear history.',
      } as ApiError;
    }
  } catch (err: unknown) {
    if ((err as ApiError).code) {
      throw err;
    }
    throw {
      status: 500,
      code: 'NETWORK_ERROR',
      message: 'Failed to communicate with history service.',
    } as ApiError;
  }
}
