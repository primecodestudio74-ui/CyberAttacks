/**
 * Cyber News API client.
 *
 * Thin wrapper around the backend's /api/news endpoints. It never calls a news
 * provider directly: every request goes to our own server, which holds the
 * source list, caching and rate limiting. No API key exists in the browser.
 */

import { apiUrl } from '../utils/api';

export class NewsApiError extends Error {
  constructor(message, { status = 0, code = 'UNKNOWN' } = {}) {
    super(message);
    this.name = 'NewsApiError';
    this.status = status;
    this.code = code;
  }
}

const parseJson = async (response) => {
  try {
    return await response.json();
  } catch {
    return null;
  }
};

const friendlyMessage = (status, code) => {
  if (code === 'RATE_LIMITED' || status === 429) {
    return 'Too many requests right now. Please wait a moment and try again.';
  }
  if (code === 'INVALID_PARAM' || status === 400) {
    return 'That search or filter is not valid. Please adjust it and try again.';
  }
  if (status >= 500 || status === 0) {
    return 'Unable to load the latest cybersecurity news right now. Please try again.';
  }
  return 'Something went wrong while loading the news. Please try again.';
};

/**
 * Fetch news articles.
 * @param {{category?: string, q?: string, source?: string, sort?: string, page?: number, limit?: number, signal?: AbortSignal}} params
 */
export const fetchNews = async (params = {}) => {
  const { signal, ...query } = params;
  const search = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') search.set(key, String(value));
  });

  let response;
  try {
    response = await fetch(apiUrl(`/api/news?${search.toString()}`), {
      headers: { Accept: 'application/json' },
      signal,
    });
  } catch (error) {
    if (error?.name === 'AbortError') throw error;
    throw new NewsApiError(friendlyMessage(0, 'NETWORK'), { status: 0, code: 'NETWORK' });
  }

  const body = await parseJson(response);
  if (!response.ok || !body?.success) {
    const code = body?.error?.code || 'UNKNOWN';
    throw new NewsApiError(body?.error?.message ? friendlyMessage(response.status, code) : friendlyMessage(response.status, code), {
      status: response.status,
      code,
    });
  }
  return body;
};

/** Source registry + per-source health, for the "trusted sources" panel. */
export const fetchNewsSources = async ({ signal } = {}) => {
  const response = await fetch(apiUrl('/api/news/sources'), {
    headers: { Accept: 'application/json' },
    signal,
  });
  const body = await parseJson(response);
  if (!response.ok || !body?.success) {
    throw new NewsApiError(friendlyMessage(response.status, body?.error?.code), {
      status: response.status,
      code: body?.error?.code || 'UNKNOWN',
    });
  }
  return body;
};

/** Ask the server to re-fetch the newswire from the publishers. */
export const refreshNews = async () => {
  const response = await fetch(apiUrl('/api/news/refresh'), {
    method: 'POST',
    headers: { Accept: 'application/json' },
  });
  const body = await parseJson(response);
  if (!response.ok || !body?.success) {
    throw new NewsApiError(friendlyMessage(response.status, body?.error?.code), {
      status: response.status,
      code: body?.error?.code || 'UNKNOWN',
    });
  }
  return body;
};

export default { fetchNews, fetchNewsSources, refreshNews };
