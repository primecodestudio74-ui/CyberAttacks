/**
 * useNews - data hook for the Cyber News page.
 *
 * Responsibilities
 *  - fetch the first page whenever the filters change (debounced search,
 *    immediate category/source/sort changes)
 *  - cancel/ignore stale requests so a slow response can never overwrite a
 *    newer one
 *  - append pages for "Load more" without duplicating articles
 *  - expose a manual refresh and a quiet background refresh that only runs when
 *    the page becomes visible again and the cached data has expired
 *
 * No polling: nothing is fetched while the tab is hidden, and nothing is
 * fetched on ordinary re-renders (the effect is keyed on the serialised
 * filters).
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { fetchNews, refreshNews } from '../services/newsService';

const SEARCH_DEBOUNCE_MS = 400;
const FOCUS_REFRESH_MIN_GAP_MS = 120_000; // never revalidate on focus more often than this

const mergeArticles = (existing, incoming) => {
  const seen = new Set(existing.map((article) => article.id));
  const merged = [...existing];
  for (const article of incoming) {
    if (!article?.id || seen.has(article.id)) continue;
    seen.add(article.id);
    merged.push(article);
  }
  return merged;
};

export default function useNews({ category = 'all-news', q = '', source = '', sort = 'newest', limit = 12 } = {}) {
  const [debouncedQuery, setDebouncedQuery] = useState(q);
  const [reloadToken, setReloadToken] = useState(0);

  const [state, setState] = useState({
    articles: [],
    featured: null,
    sections: null,
    pagination: { page: 1, limit, total: 0, totalPages: 0, hasMore: false },
    lastUpdated: null,
    meta: null,
    loading: true,
    loadingMore: false,
    refreshing: false,
    error: null,
  });

  const firstLoadRef = useRef(true);
  const inFlightRef = useRef(null);
  const requestIdRef = useRef(0);
  const lastFocusRefreshRef = useRef(0);
  const stateRef = useRef(state);
  stateRef.current = state;

  const filterKey = useMemo(
    () => [category, debouncedQuery.trim(), source, sort, limit].join('\u0000'),
    [category, debouncedQuery, source, sort, limit]
  );

  /* ---------------- debounce the search box ---------------- */
  useEffect(() => {
    if (q === debouncedQuery) return undefined;
    const timer = setTimeout(() => setDebouncedQuery(q), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [q, debouncedQuery]);

  /* ---------------- first page ---------------- */
  const load = useCallback(
    async ({ quiet = false } = {}) => {
      inFlightRef.current?.abort();
      const controller = new AbortController();
      inFlightRef.current = controller;
      const requestId = requestIdRef.current + 1;
      requestIdRef.current = requestId;

      if (!quiet) {
        setState((previous) => ({
          ...previous,
          loading: true,
          error: null,
        }));
      }

      try {
        const payload = await fetchNews({
          category,
          q: debouncedQuery.trim(),
          source,
          sort,
          page: 1,
          limit,
          signal: controller.signal,
        });
        if (requestId !== requestIdRef.current) return; // a newer request won
        setState((previous) => ({
          ...previous,
          articles: payload.articles || [],
          featured: payload.featured ?? null,
          sections: payload.sections || previous.sections,
          pagination: payload.pagination || previous.pagination,
          lastUpdated: payload.lastUpdated ?? null,
          meta: payload.meta || null,
          loading: false,
          loadingMore: false,
          error: null,
        }));
      } catch (error) {
        if (error?.name === 'AbortError' || requestId !== requestIdRef.current) return;
        setState((previous) => ({
          ...previous,
          loading: false,
          loadingMore: false,
          error: {
            message: error.message,
            code: error.code || 'UNKNOWN',
            status: error.status || 0,
          },
          // Keep whatever is already on screen (stale data beats a blank page).
          articles: quiet ? previous.articles : previous.articles,
        }));
      } finally {
        if (inFlightRef.current === controller) inFlightRef.current = null;
      }
    },
    [category, debouncedQuery, source, sort, limit]
  );

  useEffect(() => {
    firstLoadRef.current = false;
    load();
    return () => inFlightRef.current?.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterKey, reloadToken]);

  /* ---------------- quiet revalidation when the tab returns ---------------- */
  useEffect(() => {
    const onVisibilityChange = () => {
      if (document.visibilityState !== 'visible') return;
      const now = Date.now();
      if (now - lastFocusRefreshRef.current < FOCUS_REFRESH_MIN_GAP_MS) return;
      const ttlSeconds = stateRef.current.meta?.cacheTtlSeconds ?? 600;
      const lastUpdated = stateRef.current.lastUpdated ? Date.parse(stateRef.current.lastUpdated) : 0;
      if (!Number.isNaN(lastUpdated) && now - lastUpdated < ttlSeconds * 1000) return;
      lastFocusRefreshRef.current = now;
      load({ quiet: true });
    };
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => document.removeEventListener('visibilitychange', onVisibilityChange);
  }, [load]);

  /* ---------------- load more ---------------- */
  const loadMore = useCallback(async () => {
    const { pagination, loading, loadingMore } = stateRef.current;
    if (loading || loadingMore || !pagination?.hasMore) return;

    setState((previous) => ({ ...previous, loadingMore: true }));
    try {
      const payload = await fetchNews({
        category,
        q: debouncedQuery.trim(),
        source,
        sort,
        page: (pagination.page || 1) + 1,
        limit,
      });
      setState((previous) => ({
        ...previous,
        articles: mergeArticles(previous.articles, payload.articles || []),
        pagination: payload.pagination || previous.pagination,
        lastUpdated: payload.lastUpdated ?? previous.lastUpdated,
        meta: payload.meta || previous.meta,
        loadingMore: false,
      }));
    } catch (error) {
      setState((previous) => ({
        ...previous,
        loadingMore: false,
        error: { message: error.message, code: error.code || 'UNKNOWN', status: error.status || 0 },
      }));
    }
  }, [category, debouncedQuery, source, sort, limit]);

  /* ---------------- manual refresh ---------------- */
  const refresh = useCallback(async () => {
    setState((previous) => ({ ...previous, refreshing: true, error: null }));
    try {
      await refreshNews();
      setReloadToken((token) => token + 1);
    } catch (error) {
      setState((previous) => ({
        ...previous,
        refreshing: false,
        error: { message: error.message, code: error.code || 'UNKNOWN', status: error.status || 0 },
      }));
      return { ok: false };
    }
    setState((previous) => ({ ...previous, refreshing: false }));
    return { ok: true };
  }, []);

  const retry = useCallback(() => {
    setReloadToken((token) => token + 1);
  }, []);

  return {
    ...state,
    searchTerm: debouncedQuery,
    isSearchPending: q !== debouncedQuery,
    loadMore,
    refresh,
    retry,
    hasMore: Boolean(state.pagination?.hasMore),
    isEmpty: !state.loading && !state.error && state.articles.length === 0,
  };
}
