import { ApiError, GuidanceSession } from '../types/guidance.ts';

/**
 * Returns the unified client session identifier.
 * Connects the user into their dedicated personal guidance space.
 */
export function getOrCreateClientSessionId(): string {
  if (typeof window === 'undefined') return 'kaal_unified_user';
  const key = 'kaal_client_session_id';
  let id = localStorage.getItem(key);
  if (!id || id.startsWith('sess_')) {
    id = 'kaal_unified_user';
    try {
      localStorage.setItem(key, id);
    } catch (e) {}
  }
  return id;
}

export async function askGuidance(
  question: string,
  threadId?: number | null,
  signal?: AbortSignal
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
      signal,
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
    if ((err as any)?.name === 'AbortError' || signal?.aborted) {
      const abortError = new Error('Guidance request was aborted');
      abortError.name = 'AbortError';
      throw abortError;
    }
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

export async function fetchHistory(signal?: AbortSignal): Promise<GuidanceSession[]> {
  const clientSessionId = getOrCreateClientSessionId();
  try {
    const res = await fetch(`/api/history?sessionId=${encodeURIComponent(clientSessionId)}`, {
      headers: {
        'x-session-id': clientSessionId,
      },
      signal,
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
    if ((err as any)?.name === 'AbortError' || signal?.aborted) {
      const abortError = new Error('History request was aborted');
      abortError.name = 'AbortError';
      throw abortError;
    }
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

export async function fetchHistoryById(id: number, signal?: AbortSignal): Promise<GuidanceSession> {
  const clientSessionId = getOrCreateClientSessionId();
  try {
    const res = await fetch(`/api/history/${id}`, {
      headers: {
        'x-session-id': clientSessionId,
      },
      signal,
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
    if ((err as any)?.name === 'AbortError' || signal?.aborted) {
      const abortError = new Error('History item request was aborted');
      abortError.name = 'AbortError';
      throw abortError;
    }
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
