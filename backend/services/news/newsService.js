/**
 * News service: query parsing, filtering, sorting, pagination and the
 * "editorial sections" that power the Cyber News page.
 *
 * This module is the only thing controllers talk to. It never touches the
 * network directly (the provider + cache layers do) and never returns raw
 * provider data - only normalised, validated articles.
 */

import {
  NEWS_CACHE_TTL_SECONDS,
  NEWS_CATEGORIES,
  NEWS_DEFAULT_PAGE_SIZE,
  NEWS_MAX_PAGE,
  NEWS_MAX_PAGE_SIZE,
  NEWS_MAX_QUERY_LENGTH,
  NEWS_MAX_SOURCE_FILTER_LENGTH,
  NEWS_MIN_REFRESH_INTERVAL_SECONDS,
  NEWS_SAMPLE_MODE,
  NEWS_TRUSTED_SOURCES,
  getSources,
} from '../../config/newsConfig.js';
import { ensureFresh, getCacheState, refresh } from './newsCache.js';

export const DEFAULT_CATEGORY = 'all-news';
const FEATURED_CANDIDATE_POOL = 40;
const FEATURED_MAX_AGE_HOURS = 96;

/* ------------------------------------------------------------------ *
 * Query parsing / validation
 * ------------------------------------------------------------------ */

class InvalidQueryError extends Error {
  constructor(message) {
    super(message);
    this.name = 'InvalidQueryError';
    this.code = 'INVALID_PARAM';
    this.status = 400;
  }
}

const clampInt = (value, { min, max, fallback }) => {
  if (value === undefined || value === null || value === '') return fallback;
  const parsed = Number.parseInt(String(value), 10);
  if (!Number.isFinite(parsed)) throw new InvalidQueryError(`"${value}" is not a valid number.`);
  if (parsed < min || parsed > max) throw new InvalidQueryError(`Value must be between ${min} and ${max}.`);
  return parsed;
};

const cleanString = (value, maxLength) => {
  if (value === undefined || value === null) return '';
  if (Array.isArray(value)) throw new InvalidQueryError('Repeated query parameters are not supported.');
  if (typeof value !== 'string') throw new InvalidQueryError('Query parameters must be strings.');
  const cleaned = value.replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim();
  if (cleaned.length > maxLength) throw new InvalidQueryError(`Search term is too long (max ${maxLength} characters).`);
  return cleaned;
};

export const selectableCategories = () =>
  NEWS_CATEGORIES.filter((category) => category.id !== 'all-news' && category.selectable !== false);

export const categoryOptions = () => [
  { id: DEFAULT_CATEGORY, label: 'All News', description: 'Every story in the current newswire.' },
  ...selectableCategories().map((category) => ({
    id: category.id,
    label: category.label,
    description: category.description,
  })),
];

/**
 * Validate and normalise the request query.
 * @throws {InvalidQueryError}
 */
export const parseNewsQuery = (raw = {}) => {
  const sources = getSources();

  const category = cleanString(raw.category, 40) || DEFAULT_CATEGORY;
  const validCategoryIds = new Set([DEFAULT_CATEGORY, ...selectableCategories().map((item) => item.id)]);
  if (!validCategoryIds.has(category)) {
    throw new InvalidQueryError(`Unknown category "${category}".`);
  }

  const q = cleanString(raw.q ?? raw.query ?? raw.search, NEWS_MAX_QUERY_LENGTH);

  const sourceParam = cleanString(raw.source, NEWS_MAX_SOURCE_FILTER_LENGTH);
  let source = '';
  if (sourceParam) {
    const match = sources.find(
      (item) =>
        item.id === sourceParam.toLowerCase() ||
        item.name.toLowerCase() === sourceParam.toLowerCase()
    );
    if (!match) throw new InvalidQueryError(`Unknown source "${sourceParam}".`);
    source = match.id;
  }

  const sortParam = cleanString(raw.sort, 10).toLowerCase() || 'newest';
  if (!['newest', 'oldest'].includes(sortParam)) {
    throw new InvalidQueryError('Sort must be either "newest" or "oldest".');
  }

  const page = clampInt(raw.page, { min: 1, max: NEWS_MAX_PAGE, fallback: 1 });
  const limit = clampInt(raw.limit, { min: 1, max: NEWS_MAX_PAGE_SIZE, fallback: NEWS_DEFAULT_PAGE_SIZE });
  const includeSections = page === 1;
  const forceRefresh = raw.refresh === '1' || raw.refresh === 'true';
  const wantsSectionsOnly = raw.sections === '1' || raw.sections === 'true';

  return { category, q, source, sort: sortParam, page, limit, includeSections, forceRefresh, wantsSectionsOnly };
};

/* ------------------------------------------------------------------ *
 * Filtering
 * ------------------------------------------------------------------ */

const searchTokens = (q) =>
  String(q || '')
    .toLowerCase()
    .split(/\s+/)
    .map((token) => token.replace(/^[^\w]+|[^\w-]+$/g, ''))
    .filter((token) => token.length >= 2)
    .slice(0, 8);

const haystack = (article) =>
  `${article.title} ${article.description || ''} ${article.source} ${(article.cveIds || []).join(' ')} ${(article.categories || []).join(' ')}`.toLowerCase();

/**
 * Apply category / search / source filters. Search uses AND semantics over
 * tokens (every token must appear) which keeps results relevant without an
 * external search service.
 */
export const filterArticles = (articles, { category, q, source }) => {
  let result = articles;

  if (category && category !== DEFAULT_CATEGORY) {
    result = result.filter((article) => (article.categories || []).includes(category));
  }
  if (source) {
    result = result.filter((article) => article.sourceId === source);
  }
  const tokens = searchTokens(q);
  if (tokens.length) {
    result = result.filter((article) => {
      const text = haystack(article);
      return tokens.every((token) => text.includes(token));
    });
  }
  return result;
};

const sortArticles = (articles, sort) => {
  const sorted = [...articles].sort((a, b) => {
    const aTime = a.publishedAt ? Date.parse(a.publishedAt) : Number.NaN;
    const bTime = b.publishedAt ? Date.parse(b.publishedAt) : Number.NaN;
    if (Number.isNaN(aTime) && Number.isNaN(bTime)) return a.title.localeCompare(b.title);
    if (Number.isNaN(aTime)) return 1; // undated stories always last
    if (Number.isNaN(bTime)) return -1;
    return sort === 'oldest' ? aTime - bTime : bTime - aTime;
  });
  return sorted;
};

/* ------------------------------------------------------------------ *
 * Editorial sections
 * ------------------------------------------------------------------ */

/**
 * Choose the featured story from real fetched articles: recent, illustrated and
 * not sponsored content. Scoring is deterministic and documented so nothing
 * about the choice is arbitrary.
 */
export const pickFeatured = (articles) => {
  const now = Date.now();
  const recent = articles
    .filter((article) => article.publishedAt)
    .slice(0, FEATURED_CANDIDATE_POOL)
    .filter((article) => {
      const ageHours = (now - Date.parse(article.publishedAt)) / 3_600_000;
      return ageHours <= FEATURED_MAX_AGE_HOURS;
    });

  // Sponsored/partner posts are never the lead story while a real story exists.
  const editorial = recent.filter((article) => !article.sponsored);
  const candidates = editorial.length ? editorial : recent;

  let best = null;
  let bestScore = -Infinity;
  for (const article of candidates) {
    const ageHours = (now - Date.parse(article.publishedAt)) / 3_600_000;
    let score = 0;
    if (article.imageUrl) score += 3;
    if (ageHours <= 24) score += 3;
    else if (ageHours <= 72) score += 2;
    if (!article.sponsored) score += 2;

    if (article.description && article.description.length >= 80) score += 1;
    if (article.isAdvisory) score += 1;
    if (article.tags?.includes('Exploited in the wild')) score += 1;
    if (score > bestScore) {
      bestScore = score;
      best = article;
    }
  }
  return best || articles[0] || null;
};

const countByCategory = (articles) => {
  const counts = new Map();
  for (const article of articles) {
    for (const id of article.categories || []) {
      counts.set(id, (counts.get(id) || 0) + 1);
    }
  }
  return counts;
};

const buildSections = (pool, { featured }) => {
  const counts = countByCategory(pool);
  const healthById = new Map(getCacheState().health.map((item) => [item.id, item]));
  const sources = getSources();

  return {
    featured,
    // Renamed from "trending" on purpose: no source we consume publishes view
    // counts or engagement data, so popularity cannot be measured honestly.
    recent: pool.filter((article) => article.id !== featured?.id).slice(0, 5),
    advisories: pool.filter((article) => article.isAdvisory).slice(0, 6),
    // The one "many people are covering this" signal we can actually observe:
    // the same story independently published by more than one outlet.
    widelyCovered: pool.filter((article) => (article.alsoCoveredBy || []).length > 0).slice(0, 4),
    categories: categoryOptions().map((category) => ({
      ...category,
      count: category.id === DEFAULT_CATEGORY ? pool.length : counts.get(category.id) || 0,
    })),
    sources: sources
      .map((source) => {
        const health = healthById.get(source.id);
        return {
          id: source.id,
          name: source.name,
          group: source.group,
          homepage: source.homepage,
          articleCount: counts.get(source.id) || 0,
          status: health ? (health.ok ? 'ok' : 'error') : 'unknown',
          lastCheckedAt: health?.checkedAt || null,
        };
      })
      .sort((a, b) => b.articleCount - a.articleCount),
    trustedSources: NEWS_TRUSTED_SOURCES,
  };
};

/* ------------------------------------------------------------------ *
 * Public API
 * ------------------------------------------------------------------ */

const toPublicArticle = (article) => ({
  id: article.id,
  title: article.title,
  description: article.description,
  imageUrl: article.imageUrl,
  source: article.source,
  sourceId: article.sourceId,
  sourceHomepage: article.sourceHomepage,
  author: article.author,
  publishedAt: article.publishedAt,
  url: article.url,
  category: article.category,
  categoryLabel: article.categoryLabel,
  categories: article.categories,
  cveIds: article.cveIds,
  tags: article.tags,
  isAdvisory: article.isAdvisory,
  dateLabel: article.dateLabel,
  ...(article.alsoCoveredBy?.length ? { alsoCoveredBy: article.alsoCoveredBy } : {}),
});

const buildMeta = (cache) => {
  const stats = cache.lastRefreshStats;
  const failed = stats?.failed || [];
  const sourceIds = getSources().map((source) => source.id);
  const failedSet = new Set(failed);
  return {
    cacheAgeSeconds: cache.ageSeconds,
    cacheTtlSeconds: NEWS_CACHE_TTL_SECONDS,
    stale: Boolean(cache.lastUpdated) && cache.isExpired,
    degraded: failed.length > 0 && failed.length < sourceIds.length,
    unavailable: failed.length > 0 && failed.length === sourceIds.length,
    degradedSources: failed,
    sourceCount: sourceIds.length,
    lastError: cache.lastError || null,
    sampleData: NEWS_SAMPLE_MODE,
    popularityAvailable: false,
    refreshIntervalSeconds: Math.round(Math.max(NEWS_CACHE_TTL_SECONDS, NEWS_MIN_REFRESH_INTERVAL_SECONDS)),
  };
};

/**
 * Build the news payload for a request.
 * @param {object} rawQuery express req.query
 */
export const getNews = async (rawQuery = {}) => {
  const params = parseNewsQuery(rawQuery);

  if (params.forceRefresh) {
    await refresh({ force: true, reason: 'manual' });
  } else {
    await ensureFresh();
  }

  const cache = getCacheState();
  const pool = cache.articles;

  if (!pool.length) {
    return {
      success: true,
      articles: [],
      featured: null,
      sections: params.includeSections ? buildSections([], { featured: null }) : null,
      pagination: { page: params.page, limit: params.limit, total: 0, totalPages: 0, hasMore: false },
      filters: { category: params.category, q: params.q, source: params.source, sort: params.sort },
      lastUpdated: cache.lastUpdated,
      meta: { ...buildMeta(cache), empty: true },
    };
  }

  const ordered = sortArticles(pool, params.sort);
  const filtered = filterArticles(ordered, params);
  const featured =
    params.includeSections && params.page === 1 && !params.q
      ? pickFeatured(filtered)
      : null;

  const total = filtered.length;
  const start = (params.page - 1) * params.limit;
  const pageItems = filtered.slice(start, start + params.limit);

  return {
    success: true,
    articles: pageItems.map(toPublicArticle),
    featured: featured ? toPublicArticle(featured) : null,
    sections: params.includeSections ? buildSections(filtered, { featured }) : null,
    pagination: {
      page: params.page,
      limit: params.limit,
      total,
      totalPages: Math.ceil(total / params.limit),
      hasMore: start + params.limit < total,
    },
    filters: { category: params.category, q: params.q, source: params.source, sort: params.sort },
    lastUpdated: cache.lastUpdated,
    meta: buildMeta(cache),
  };
};

/** Sidebar / diagnostics view of the source registry and its health. */
export const getSourceStatus = () => {
  const cache = getCacheState();
  const healthById = new Map(cache.health.map((item) => [item.id, item]));
  const counts = new Map();
  for (const article of cache.articles) {
    counts.set(article.sourceId, (counts.get(article.sourceId) || 0) + 1);
  }

  return {
    success: true,
    lastUpdated: cache.lastUpdated,
    sources: getSources().map((source) => {
      const health = healthById.get(source.id);
      return {
        id: source.id,
        name: source.name,
        group: source.group,
        topic: source.topic,
        homepage: source.homepage,
        feedUrl: source.url,
        articleCount: counts.get(source.id) || 0,
        status: health ? (health.ok ? 'ok' : 'error') : 'unknown',
        httpStatus: health?.httpStatus ?? null,
        itemCount: health?.itemCount ?? 0,
        durationMs: health?.durationMs ?? null,
        error: health?.error ?? null,
        lastCheckedAt: health?.checkedAt ?? null,
      };
    }),
    categories: categoryOptions(),
    trustedSources: NEWS_TRUSTED_SOURCES,
    meta: buildMeta(cache),
  };
};

export { InvalidQueryError };
export default { getNews, getSourceStatus, parseNewsQuery, pickFeatured, filterArticles };
