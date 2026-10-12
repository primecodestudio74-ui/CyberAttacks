import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ChevronDown, Loader2, RotateCcw } from 'lucide-react';

import NewsHeader from '../../components/News/NewsHeader';
import CategoryRail from '../../components/News/CategoryRail';
import FeaturedStory from '../../components/News/FeaturedStory';
import ArticleCard from '../../components/News/ArticleCard';
import NewsSidebar from '../../components/News/NewsSidebar';
import { FeaturedSkeleton, NewsGridSkeleton, ErrorState, EmptyState, StaleNotice, SampleDataNotice, RateLimitNotice } from '../../components/News/NewsStates';
import useNews from '../../hooks/useNews';
import { categoryLabel, NEWS_CATEGORY_IDS } from '../../utils/newsFormat';

const PAGE_SIZE = 12;

/** The article grid is memoised so unrelated state (the search box draft,
 *  notices, filter chips) cannot re-render every card. */
const FeedGrid = React.memo(function FeedGrid({ articles }) {
  return (
    <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
      {articles.map((article, index) => (
        <ArticleCard key={article.id} article={article} priority={index < 3} />
      ))}
    </div>
  );
});

/**
 * Cyber News - the editorial news page inside the HackAware dashboard.
 *
 * Filters live in the URL query string (`?tab=news&category=…&q=…`), so a
 * filtered view can be bookmarked, shared or reloaded. All article data comes
 * from /api/news, which aggregates real publisher feeds - the UI contains no
 * articles of its own.
 */
export default function CyberNews({ newsData } = {}) {
  const [searchParams, setSearchParams] = useSearchParams();

  const category = useMemo(() => {
    const value = searchParams.get('category') || 'all-news';
    return NEWS_CATEGORY_IDS.has(value) ? value : 'all-news';
  }, [searchParams]);
  const urlQuery = searchParams.get('q') || '';
  const source = searchParams.get('source') || '';
  const sort = searchParams.get('sort') === 'oldest' ? 'oldest' : 'newest';

  // The search box is "uncontrolled with respect to the URL": while the user is
  // typing we keep a local draft, then push it to the URL after a short pause.
  // When the draft is empty the URL is the single source of truth, which keeps
  // browser back/forward and shared links working without mirroring state in an
  // effect.
  const [draftQuery, setDraftQuery] = useState(null);
  const searchInput = draftQuery ?? urlQuery;
  const feedRef = useRef(null);
  const isFirstRender = useRef(true);

  const updateParams = useCallback(
    (patch) => {
      setSearchParams(
        (previous) => {
          const next = new URLSearchParams(previous);
          Object.entries(patch).forEach(([key, value]) => {
            const isDefault =
              value === '' || value === null || value === undefined || (key === 'category' && value === 'all-news') || (key === 'sort' && value === 'newest');
            if (isDefault) next.delete(key);
            else next.set(key, String(value));
          });
          return next;
        },
        { replace: true }
      );
    },
    [setSearchParams]
  );

  // draft -> URL, debounced so typing neither spams the API nor the history.
  // Both state updates happen inside the timer callback (never synchronously in
  // the effect body), so React does not cascade renders.
  useEffect(() => {
    if (draftQuery === null || draftQuery === urlQuery) return undefined;
    const timer = setTimeout(() => {
      updateParams({ q: draftQuery });
      setDraftQuery(null);
    }, 450);
    return () => clearTimeout(timer);
  }, [draftQuery, urlQuery, updateParams]);

  // The authenticated dashboard passes its shared query here so the ticker and
  // editorial page use the same response. The standalone public news page keeps
  // using this component's own query hook.
  const localNews = useNews({ category, q: searchInput, source, sort, limit: PAGE_SIZE, enabled: !newsData });
  const news = newsData || localNews;
  const {
    articles,
    featured,
    sections,
    pagination,
    meta,
    loading,
    loadingMore,
    refreshing,
    error,
    lastUpdated,
    hasMore,
    isEmpty,
    isSearchPending,
    loadMore,
    refresh,
    retry,
  } = news;

  // Move focus back to the feed when the filters change (not on first paint).
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    feedRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [category, urlQuery, source, sort]);

  const categories = sections?.categories || [];
  const activeCategoryLabel = categoryLabel(category);
  const hasActiveFilters = category !== 'all-news' || Boolean(urlQuery) || Boolean(source) || sort !== 'newest';

  const resetFilters = useCallback(() => {
    setDraftQuery(null);
    updateParams({ category: 'all-news', q: '', source: '', sort: 'newest' });
  }, [updateParams]);

  const resultSummary = (() => {
    if (loading) return 'Loading the latest cybersecurity news…';
    if (error && articles.length === 0) return '';
    const count = pagination?.total ?? articles.length;
    const parts = [`${count} ${count === 1 ? 'story' : 'stories'}`];
    if (category !== 'all-news') parts.push(`in ${activeCategoryLabel}`);
    if (urlQuery) parts.push(`matching “${urlQuery}”`);
    if (sort === 'oldest') parts.push('oldest first');
    return parts.join(' ');
  })();

  // Distinguish "no results for this filter" from "the providers are down":
  // the first is an empty state, the second deserves a retry affordance.
  const providersDown = Boolean(meta?.unavailable) && articles.length === 0;
  const showError = (Boolean(error) && articles.length === 0) || providersDown;
  const showRateLimit = showError && error?.code === 'RATE_LIMITED';

  return (
    <div className="mx-auto w-full max-w-[1440px] px-4 py-6 lg:px-8">
      <NewsHeader
        searchValue={searchInput}
        onSearchChange={(value) => setDraftQuery(value)}
        onSearchSubmit={() => {
          updateParams({ q: searchInput });
          setDraftQuery(null);
        }}
        onClearSearch={() => {
          setDraftQuery(null);
          updateParams({ q: '' });
        }}
        onRefresh={refresh}
        refreshing={refreshing}
        lastUpdated={lastUpdated}
        stale={Boolean(meta?.stale)}
        isSearchPending={isSearchPending}
        resultSummary={resultSummary}
      />

      <div className="mt-5 space-y-3">
        {meta?.sampleData && <SampleDataNotice />}
        {(meta?.stale || meta?.degraded || meta?.unavailable) && articles.length > 0 && (
          <StaleNotice
            lastUpdated={lastUpdated}
            degradedSources={meta?.degradedSources || []}
            onRefresh={refresh}
            refreshing={refreshing}
          />
        )}
        {error && articles.length > 0 && !meta?.stale && (
          <div role="status" className="rounded-xl border border-amber-500/30 bg-amber-500/[0.07] px-4 py-3 text-[12px] text-amber-200">
            {error.message} Showing the stories already loaded.
          </div>
        )}
      </div>

      <div className="mt-5">
        <CategoryRail categories={categories} activeCategory={category} onChange={(id) => updateParams({ category: id })} variant="chips" />
      </div>

      <div className="mt-6 grid gap-8 lg:grid-cols-[220px_minmax(0,1fr)] xl:grid-cols-[220px_minmax(0,1fr)_330px]">
        <CategoryRail categories={categories} activeCategory={category} onChange={(id) => updateParams({ category: id })} variant="rail" />

        <div ref={feedRef} className="min-w-0 scroll-mt-24 space-y-8">
          {hasActiveFilters && (
            <div className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-800/60 bg-slate-900/30 px-4 py-3">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Active filters</span>
              <div className="flex flex-wrap items-center gap-2">
                {category !== 'all-news' && (
                  <FilterChip label={activeCategoryLabel} onRemove={() => updateParams({ category: 'all-news' })} />
                )}
                {urlQuery && (
                  <FilterChip
                    label={`“${urlQuery}”`}
                    onRemove={() => {
                      setDraftQuery(null);
                      updateParams({ q: '' });
                    }}
                  />
                )}
                {source && <FilterChip label={source} onRemove={() => updateParams({ source: '' })} />}
                {sort !== 'newest' && <FilterChip label="Oldest first" onRemove={() => updateParams({ sort: 'newest' })} />}
              </div>
              <div className="ml-auto flex items-center gap-2">
                <label htmlFor="news-sort" className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">
                  Sort
                </label>
                <select
                  id="news-sort"
                  value={sort}
                  onChange={(event) => updateParams({ sort: event.target.value })}
                  className="rounded-lg border border-slate-800/80 bg-[#070c17] px-2 py-1.5 text-[11px] text-slate-300 focus:border-cyan-500/60 focus:outline-none focus:ring-1 focus:ring-cyan-500/40"
                >
                  <option value="newest">Newest first</option>
                  <option value="oldest">Oldest first</option>
                </select>
                <button
                  type="button"
                  onClick={resetFilters}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-800/80 px-2.5 py-1.5 text-[10px] font-black uppercase tracking-[0.16em] text-slate-400 transition-colors hover:border-cyan-500/40 hover:text-cyan-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-500/60"
                >
                  <RotateCcw size={11} aria-hidden="true" />
                  Reset
                </button>
              </div>
            </div>
          )}

          {showRateLimit ? (
            <RateLimitNotice onRetry={retry} />
          ) : showError ? (
            <ErrorState message={error?.message} onRetry={retry} retrying={loading} />
          ) : loading && articles.length === 0 ? (
            <>
              <FeaturedSkeleton />
              <NewsGridSkeleton count={6} />
            </>
          ) : isEmpty ? (
            <EmptyState query={urlQuery} categoryLabel={category !== 'all-news' ? activeCategoryLabel : ''} onReset={resetFilters} />
          ) : (
            <>
              {featured && !urlQuery && <FeaturedStory article={featured} />}

              <section aria-labelledby="latest-heading" className="space-y-5">
                <div className="flex flex-wrap items-end justify-between gap-3 border-b border-slate-800/60 pb-3">
                  <div>
                    <h2 id="latest-heading" className="font-serif text-xl text-white">
                      Latest News
                    </h2>
                    <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.22em] text-slate-600">
                      {category !== 'all-news' ? activeCategoryLabel : 'All sections'} · newest first
                    </p>
                  </div>
                  <span className="text-[10px] text-slate-600">
                    {pagination?.total ?? articles.length} stories in the current newswire
                  </span>
                </div>

                <FeedGrid articles={articles} />

                <div className="flex flex-col items-center gap-3 pt-2">
                  {hasMore ? (
                    <button
                      type="button"
                      onClick={loadMore}
                      disabled={loadingMore}
                      aria-busy={loadingMore}
                      className="inline-flex items-center gap-2 rounded-xl border border-slate-800/80 px-6 py-3 text-[11px] font-black uppercase tracking-[0.2em] text-slate-300 transition-colors hover:border-cyan-500/40 hover:text-cyan-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-400 disabled:opacity-60"
                    >
                      {loadingMore ? (
                        <Loader2 size={13} className="motion-safe:animate-spin" aria-hidden="true" />
                      ) : (
                        <ChevronDown size={13} aria-hidden="true" />
                      )}
                      {loadingMore ? 'Loading' : 'Load more stories'}
                    </button>
                  ) : (
                    <p className="text-[11px] text-slate-600">
                      You have reached the end of the current newswire. New stories appear as sources publish them.
                    </p>
                  )}
                  {loadingMore && (
                    <div className="w-full">
                      <NewsGridSkeleton count={3} />
                    </div>
                  )}
                </div>
              </section>
            </>
          )}
        </div>

        <aside aria-label="News sidebar" className="min-w-0 lg:col-span-2 xl:col-span-1">
          <NewsSidebar
            advisories={sections?.advisories || []}
            recent={sections?.recent || []}
            widelyCovered={sections?.widelyCovered || []}
            sources={sections?.sources || []}
            trustedSources={sections?.trustedSources || []}
          />
        </aside>
      </div>
    </div>
  );
}

