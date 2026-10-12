/**
 * In-memory news cache and refresh orchestrator.
 *
 * Responsibilities
 *  - hold the current normalised article pool for the whole app
 *  - refresh it from the provider layer at most once per TTL / per minimum
 *    interval, de-duplicating concurrent refreshes
 *  - de-duplicate stories (same URL, or the same incident reported by two
 *    publishers with near-identical headlines)
 *  - remember per-source health so the UI can be honest about degraded sources
 *  - keep serving the last good pool when a refresh fails (stale), instead of
 *    leaving users with an empty page
 *
 * No database is involved: news is ephemeral by nature and HackAware's existing
 * persistence (MongoDB) is used for accounts and learning progress only.
 */

import {
  NEWS_CACHE_TTL_SECONDS,
  NEWS_MIN_REFRESH_INTERVAL_SECONDS,
  NEWS_STALE_GRACE_SECONDS,
  getSources,
} from '../../config/newsConfig.js';
import { enrichMissingImages, fetchAllSources } from './feedProviders.js';
import { normalizeArticle } from './normalize.js';
import { titleKey } from './sanitize.js';

const MAX_POOL_SIZE = 400;
const RETENTION_DAYS = 10;
const DEDUPE_WINDOW_MS = 72 * 60 * 60 * 1000;
const FUZZY_TITLE_THRESHOLD = 0.8;

const state = {
  articles: [],
  rawBySource: new Map(), // sourceId -> { items: raw[], fetchedAt: number }
  health: new Map(), // sourceId -> health object
  lastUpdated: null,
  lastAttemptAt: null,
  lastError: null,
  lastRefreshStats: null,
  refreshing: null,
};

const log = (event, details = {}) => {
  const parts = Object.entries(details)
    .filter(([, value]) => value !== undefined && value !== null)
    .map(([key, value]) => `${key}=${Array.isArray(value) ? value.join(',') : value}`);
  console.log(`[news] ${event}${parts.length ? ` ${parts.join(' ')}` : ''}`);
};

/* ------------------------------------------------------------------ *
 * De-duplication
 * ------------------------------------------------------------------ */

const significantTokens = (title) =>
  titleKey(title)
    .split(' ')
    .filter((token) => token.length > 3);

const jaccard = (a, b) => {
  if (!a.size || !b.size) return 0;
  let intersection = 0;
  for (const token of a) if (b.has(token)) intersection += 1;
  return intersection / (a.size + b.size - intersection);
};

/** Prefer the richer record when the same story appears twice. */
const mergeArticles = (primary, secondary) => {
  const keepAdvisory =
    secondary.isAdvisory && !primary.isAdvisory ? secondary : primary;
  const other = keepAdvisory === primary ? secondary : primary;
  const merged = {
    ...keepAdvisory,
    imageUrl: keepAdvisory.imageUrl || other.imageUrl,
    description: keepAdvisory.description || other.description,
    author: keepAdvisory.author || other.author,
    publishedAt: keepAdvisory.publishedAt || other.publishedAt,
    url: keepAdvisory.isAdvisory ? keepAdvisory.url : keepAdvisory.url || other.url,
    categories: [...new Set([...(keepAdvisory.categories || []), ...(other.categories || [])])],
    cveIds: [...new Set([...(keepAdvisory.cveIds || []), ...(other.cveIds || [])])],
    tags: [...new Set([...(keepAdvisory.tags || []), ...(other.tags || [])])],
    alsoCoveredBy: [
      ...new Set([
        ...(keepAdvisory.alsoCoveredBy || []),
        ...(other.alsoCoveredBy || []),
        ...(other.source && other.source !== keepAdvisory.source ? [other.source] : []),
      ]),
    ],
    sponsored: keepAdvisory.sponsored && other.sponsored,
  };
  return merged;
};

/**
 * Remove duplicate stories. Expects newest-first input; the first occurrence of
 * a story wins unless a duplicate carries richer information (an image, an
 * official advisory, a description).
 */
export const dedupeArticles = (articles) => {
  const out = [];
  const byUrl = new Map();
  const byTitle = new Map();
  const tokenIndex = new Map(); // token -> indices into `out`

  const remember = (article, index) => {
    byUrl.set(article.canonicalUrl, index);
    byTitle.set(titleKey(article.title), index);
    for (const token of significantTokens(article.title)) {
      const key = token.slice(0, 12);
      const bucket = tokenIndex.get(key);
      if (bucket) bucket.push(index);
      else tokenIndex.set(key, [index]);
    }
  };

  for (const article of articles) {
    const urlIndex = byUrl.get(article.canonicalUrl);
    if (urlIndex !== undefined) {
      out[urlIndex] = mergeArticles(out[urlIndex], article);
      continue;
    }

    const titleIdx = byTitle.get(titleKey(article.title));
    if (titleIdx !== undefined) {
      out[titleIdx] = mergeArticles(out[titleIdx], article);
      continue;
    }

    // Near-identical headlines across publishers (wire copy republished verbatim).
    const tokens = new Set(significantTokens(article.title));
    const candidates = new Set();
    for (const token of tokens) {
      for (const index of tokenIndex.get(token.slice(0, 12)) || []) candidates.add(index);
    }
    let mergedInto = null;
    for (const index of candidates) {
      const existing = out[index];
      const withinWindow =
        existing.publishedAt && article.publishedAt
          ? Math.abs(Date.parse(existing.publishedAt) - Date.parse(article.publishedAt)) <= DEDUPE_WINDOW_MS
          : true;
      if (!withinWindow) continue;
      if (jaccard(new Set(significantTokens(existing.title)), tokens) >= FUZZY_TITLE_THRESHOLD) {
        out[index] = mergeArticles(existing, article);
        mergedInto = index;
        break;
      }
    }
    if (mergedInto !== null) continue;

    out.push(article);
    remember(article, out.length - 1);
  }

  return out;
};

const sortByPublishedDesc = (articles) =>
  [...articles].sort((a, b) => {
    const aTime = a.publishedAt ? Date.parse(a.publishedAt) : Number.NaN;
    const bTime = b.publishedAt ? Date.parse(b.publishedAt) : Number.NaN;
    if (Number.isNaN(aTime) && Number.isNaN(bTime)) return a.title.localeCompare(b.title);
    if (Number.isNaN(aTime)) return 1; // undated stories sink to the bottom
    if (Number.isNaN(bTime)) return -1;
    return bTime - aTime;
  });

/** Rebuild the pool from every source's most recent successful fetch. */
const rebuildPool = () => {
  const now = Date.now();
  const fresh = [];
  for (const [sourceId, entry] of state.rawBySource) {
    const source = getSources().find((item) => item.id === sourceId);
    if (!source) continue;
    for (const raw of entry.items) {
      const article = normalizeArticle(raw, source, {
        fetchedAt: new Date(entry.fetchedAt).toISOString(),
        recordStatus: raw.recordStatus,
        dateLabel: raw.dateLabel,
      });
      if (article) fresh.push(article);
    }
  }

  const retentionCutoff = now - RETENTION_DAYS * 24 * 60 * 60 * 1000;
  const freshUrls = new Set(fresh.map((article) => article.canonicalUrl));
  const carriedOver = state.articles.filter(
    (article) =>
      !freshUrls.has(article.canonicalUrl) &&
      (!article.publishedAt || Date.parse(article.publishedAt) >= retentionCutoff)
  );

  const combined = dedupeArticles(sortByPublishedDesc([...fresh, ...carriedOver]));
  state.articles = combined.slice(0, MAX_POOL_SIZE);
  state.lastUpdated = new Date().toISOString();
  return state.articles.length;
};

/* ------------------------------------------------------------------ *
 * Refresh
 * ------------------------------------------------------------------ */

const shouldFetchSource = (source, now) => {
  if (!source.ttlSeconds) return true;
  const entry = state.rawBySource.get(source.id);
  if (!entry) return true;
  return now - entry.fetchedAt >= source.ttlSeconds * 1000;
};

const performRefresh = async ({ reason }) => {
  const startedAt = Date.now();
  const sources = getSources();
  const now = Date.now();
  const due = sources.filter((source) => shouldFetchSource(source, now));
  const reused = sources.filter((source) => !due.includes(source));

  const results = await fetchAllSources({ sources: due });

  let fetched = 0;
  let failed = [];
  for (const { source, items, health } of results) {
    state.health.set(source.id, { ...health, lastCheckedAt: health.checkedAt });
    if (health.ok) {
      state.rawBySource.set(source.id, { items, fetchedAt: Date.now() });
      fetched += 1;
    } else {
      failed.push(source.id);
      log('source failed', { source: source.id, status: health.httpStatus, error: health.error });
    }
  }

  for (const source of reused) {
    const health = state.health.get(source.id);
    if (health) state.health.set(source.id, { ...health, reused: true, checkedAt: new Date().toISOString() });
  }

  const total = rebuildPool();
  const stats = {
    reason,
    sources: sources.length,
    fetched,
    reused: reused.length,
    failed,
    articles: total,
    durationMs: Date.now() - startedAt,
  };
  state.lastRefreshStats = stats;

  if (failed.length === sources.length) {
    state.lastError = 'All sources failed';
    log('refresh degraded', { ...stats, failed: failed.join('|') });
  } else {
    state.lastError = failed.length ? `Some sources failed: ${failed.join(', ')}` : null;
    log('refresh complete', stats);
  }

  // Best-effort thumbnails for stories whose feed had none (background only).
  try {
    const { enriched } = await enrichMissingImages(state.articles);
    if (enriched) log('images enriched', { enriched });
  } catch (error) {
    log('image enrichment skipped', { error: error?.message });
  }

  return stats;
};

/**
 * Refresh the pool. Concurrent callers share one in-flight refresh, and a
 * non-forced refresh is skipped when the previous attempt is younger than the
 * configured minimum interval (so the manual refresh button cannot drain a
 * publisher's bandwidth).
 */
export const refresh = async ({ force = false, reason = 'request' } = {}) => {
  if (state.refreshing) return state.refreshing;

  const age = state.lastAttemptAt ? Date.now() - state.lastAttemptAt : Infinity;
  if (!force && age < NEWS_MIN_REFRESH_INTERVAL_SECONDS * 1000) {
    return { skipped: true, reason: 'min-interval', sinceLastAttemptMs: age };
  }

  state.lastAttemptAt = Date.now();
  state.refreshing = performRefresh({ reason })
    .catch((error) => {
      state.lastError = error?.message || 'refresh failed';
      log('refresh error', { error: state.lastError });
      return { error: state.lastError };
    })
    .finally(() => {
      state.refreshing = null;
    });

  return state.refreshing;
};

/* ------------------------------------------------------------------ *
 * Reads
 * ------------------------------------------------------------------ */

export const getCacheState = () => {
  const ageSeconds = state.lastUpdated
    ? Math.round((Date.now() - Date.parse(state.lastUpdated)) / 1000)
    : null;
  return {
    articles: state.articles,
    lastUpdated: state.lastUpdated,
    lastAttemptAt: state.lastAttemptAt ? new Date(state.lastAttemptAt).toISOString() : null,
    lastError: state.lastError,
    lastRefreshStats: state.lastRefreshStats,
    ageSeconds,
    isExpired: ageSeconds === null || ageSeconds > NEWS_CACHE_TTL_SECONDS,
    isBeyondStaleGrace: ageSeconds !== null && ageSeconds > NEWS_STALE_GRACE_SECONDS,
    hasData: state.articles.length > 0,
    health: [...state.health.values()],
  };
};

/**
 * Ensure there is data to serve: await a refresh when the cache is empty,
 * otherwise revalidate in the background (stale-while-revalidate).
 */
export const ensureFresh = async ({ force = false, waitForData = true } = {}) => {
  const snapshot = getCacheState();
  if (force) return refresh({ force: true, reason: 'manual' });
  if (!snapshot.hasData) {
    return waitForData ? refresh({ reason: 'cold-start' }) : refresh({ reason: 'warm-up' });
  }
  if (snapshot.isExpired) {
    refresh({ reason: 'revalidate' }).catch(() => {});
  }
  return { skipped: true, revalidating: snapshot.isExpired };
};

export const warmUp = async () => {
  const started = Date.now();
  const result = await refresh({ reason: 'startup' });
  log('warm-up finished', { ms: Date.now() - started, articles: state.articles.length, result: result?.skipped ? 'skipped' : 'ok' });
  return result;
};

export const _internals = { state, jaccard, significantTokens, sortByPublishedDesc, rebuildPool };
export default { refresh, ensureFresh, getCacheState, warmUp, dedupeArticles };
