import { ApiError, GuidanceSession } from '../types/guidance.ts';

/**
 * Generates and stores a unique anonymous client session identifier in localStorage.
 * Ensures that private user guidance history is isolated to this client browser
 * without requiring high-friction login/authentication.
 */
export function getOrCreateClientSessionId(): string {
  if (typeof window === 'undefined') return 'default-session';
  const key = 'kaal_client_session_id';
  let id = localStorage.getItem(key);
  if (!id) {
    id = 'sess_' + Math.random().toString(36).substring(2, 10) + '_' + Date.now();
    localStorage.setItem(key, id);
  }
  return id;
}

export async function askGuidance(
  question: string,
  threadId?: number | null
): Promise<GuidanceSession> {
  const trimmed = question.trim();
  if (!trimmed) {
    throw {
      status: 400,
      code: 'INVALID_QUESTION',
      message: 'Please enter a question before submitting.',
    } as ApiError;
  }

  const clientSessionId = getOrCreateClientSessionId();

  try {
    const res = await fetch('/api/guidance', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-session-id': clientSessionId,
      },
      body: JSON.stringify({
        question: trimmed,
        sessionId: clientSessionId,
        ...(threadId ? { threadId } : {}),
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
  const clientSessionId = getOrCreateClientSessionId();
  try {
    const res = await fetch(`/api/history?sessionId=${encodeURIComponent(clientSessionId)}`, {
      headers: {
        'x-session-id': clientSessionId,
      },
    });
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
  const clientSessionId = getOrCreateClientSessionId();
  try {
    const res = await fetch(`/api/history/${id}`, {
      headers: {
        'x-session-id': clientSessionId,
      },
    });
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
  const clientSessionId = getOrCreateClientSessionId();
  try {
    const res = await fetch(`/api/history/${id}?sessionId=${encodeURIComponent(clientSessionId)}`, {
      method: 'DELETE',
      headers: {
        'x-session-id': clientSessionId,
      },
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
  const clientSessionId = getOrCreateClientSessionId();
  try {
    const res = await fetch(`/api/history?sessionId=${encodeURIComponent(clientSessionId)}`, {
      method: 'DELETE',
      headers: {
        'x-session-id': clientSessionId,
      },
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
