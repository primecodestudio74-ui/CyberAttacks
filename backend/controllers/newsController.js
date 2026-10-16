/**
 * HTTP layer for the Cyber News feature.
 *
 * Controllers stay thin: validate/translate, call the service, and always
 * return the same JSON envelope so the frontend has one shape to handle.
 * Provider errors, stack traces and credentials are never returned to clients.
 */

import {
  getNews,
  getSourceStatus,
  InvalidQueryError,
  categoryOptions,
} from '../services/news/newsService.js';
import { getCacheState, refresh } from '../services/news/newsCache.js';
import { NEWS_MIN_REFRESH_INTERVAL_SECONDS } from '../config/newsConfig.js';

const fail = (res, status, code, message, extra = {}) =>
  res.status(status).json({ success: false, error: { code, message, ...extra } });

const handleError = (res, error, context) => {
  if (error instanceof InvalidQueryError || error?.code === 'INVALID_PARAM') {
    return fail(res, 400, 'INVALID_PARAM', error.message);
  }
  // Log the real reason server-side only.
  console.error(`[news] ${context} failed:`, error?.message || error);
  return fail(
    res,
    502,
    'PROVIDER_UNAVAILABLE',
    'Unable to load the latest cybersecurity news right now. Please try again.'
  );
};

// GET /api/news
export const listNews = async (req, res) => {
  try {
    const payload = await getNews(req.query || {});
    res.set('Cache-Control', 'no-store');
    res.set('X-Content-Type-Options', 'nosniff');
    return res.json(payload);
  } catch (error) {
    return handleError(res, error, 'news list');
  }
};

// GET /api/news/sources
export const listSources = async (req, res) => {
  try {
    const payload = getSourceStatus();
    res.set('Cache-Control', 'no-store');
    res.set('X-Content-Type-Options', 'nosniff');
    return res.json(payload);
  } catch (error) {
    return handleError(res, error, 'source list');
  }
};

// GET /api/news/categories
export const listCategories = (req, res) => {
  try {
    res.set('Cache-Control', 'no-store');
    return res.json({ success: true, categories: categoryOptions() });
  } catch (error) {
    return handleError(res, error, 'category list');
  }
};

/**
 * POST /api/news/refresh - manual refresh.
 * Honours a minimum interval so the button cannot be used to hammer publishers;
 * a skipped refresh is reported as success (the client already has fresh data).
 */
export const manualRefresh = async (req, res) => {
  try {
    const result = await refresh({ force: true, reason: 'manual' });
    const cache = getCacheState();

    if (result?.error && !cache.hasData) {
      return fail(
        res,
        503,
        'PROVIDER_UNAVAILABLE',
        'Unable to refresh the news feed right now. Please try again in a few minutes.'
      );
    }

    res.set('Cache-Control', 'no-store');
    return res.json({
      success: true,
      lastUpdated: cache.lastUpdated,
      refreshed: !result?.skipped,
      partial: Boolean(cache.lastRefreshStats?.failed?.length),
      failedSources: cache.lastRefreshStats?.failed || [],
      minRefreshIntervalSeconds: NEWS_MIN_REFRESH_INTERVAL_SECONDS,
      articles: cache.articles.length,
    });
  } catch (error) {
    return handleError(res, error, 'manual refresh');
  }
};

// GET /api/news/health - diagnostics for operators (no user data, no secrets)
export const getHealth = (req, res) => {
  const cache = getCacheState();
  const stats = cache.lastRefreshStats || {};
  res.set('Cache-Control', 'no-store');
  return res.json({
    success: true,
    status: cache.hasData ? (cache.isExpired ? 'stale' : 'ok') : 'empty',
    articles: cache.articles.length,
    lastUpdated: cache.lastUpdated,
    lastAttemptAt: cache.lastAttemptAt,
    cacheAgeSeconds: cache.ageSeconds,
    lastError: cache.lastError,
    sources: {
      total: stats.sources ?? 0,
      fetched: stats.fetched ?? 0,
      reused: stats.reused ?? 0,
      failed: stats.failed || [],
    },
    lastRefreshDurationMs: stats.durationMs ?? null,
  });
};

export default { listNews, listSources, listCategories, manualRefresh, getHealth };
