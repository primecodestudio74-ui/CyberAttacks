import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ChevronDown, Loader2, RotateCcw, X } from 'lucide-react';

import NewsHeader from '../../components/News/NewsHeader';
import CategoryRail from '../../components/News/CategoryRail';
import FeaturedStory from '../../components/News/FeaturedStory';
import ArticleCard from '../../components/News/ArticleCard';
import NewsSidebar from '../../components/News/NewsSidebar';
import { 
  FeaturedSkeleton, 
  NewsGridSkeleton, 
  ErrorState, 
  EmptyState, 
  StaleNotice, 
  SampleDataNotice, 
  RateLimitNotice 
} from '../../components/News/NewsStates';
import useNews from '../../hooks/useNews';
import { categoryLabel, NEWS_CATEGORY_IDS } from '../../utils/newsFormat';

const PAGE_SIZE = 12;

/** The article grid is memoised so unrelated state (the search box draft,
 *  notices, filter chips) cannot re-render every card. */
const FeedGrid = React.memo(function FeedGrid({ articles }) {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {articles.map((article, index) => (
        <ArticleCard key={article.id} article={article} priority={index < 3} />
      ))}
    </div>
  );
});

/** Bento row under the hero: the first tile is wide, the rest are standard. */
const BentoGrid = React.memo(function BentoGrid({ articles }) {
  if (!articles.length) return null;
  return (
    <section aria-label="More top stories">
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        {articles.map((article, index) => (
          <ArticleCard
            key={article.id}
            article={article}
            priority={index < 2}
            variant={index === 0 ? 'large' : 'standard'}
            className={index === 0 ? 'md:col-span-2' : ''}
          />
        ))}
      </div>
    </section>
  );
});

/** Active filter badge with dismiss action */
function ActiveFilterBadge({ label, onRemove }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-xs font-medium text-cyan-200">
      {label}
      <button
        type="button"
        onClick={onRemove}
        className="rounded-full p-0.5 text-cyan-400 hover:bg-cyan-500/20 hover:text-cyan-100 focus:outline-none focus:ring-1 focus:ring-cyan-400"
        aria-label={`Remove filter: ${label}`}
      >
        <X size={12} aria-hidden="true" />
      </button>
    </span>
  );
}

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

  const resultSummary = useMemo(() => {
    if (loading) return 'Loading the latest cybersecurity news…';
    if (error && articles.length === 0) return '';
    const count = pagination?.total ?? articles.length;
    const parts = [`${count} ${count === 1 ? 'story' : 'stories'}`];
    if (category !== 'all-news') parts.push(`in ${activeCategoryLabel}`);
    if (urlQuery) parts.push(`matching “${urlQuery}”`);
    if (sort === 'oldest') parts.push('oldest first');
    return parts.join(' ');
  }, [loading, error, articles.length, pagination?.total, category, activeCategoryLabel, urlQuery, sort]);

  // Distinguish "no results for this filter" from "the providers are down"
  const providersDown = Boolean(meta?.unavailable) && articles.length === 0;
  const showError = (Boolean(error) && articles.length === 0) || providersDown;
  const showRateLimit = showError && error?.code === 'RATE_LIMITED';

  // Magazine layout (Layout C): hero -> bento -> grid. The featured story is
  // part of the paged article list, so it (and the bento picks) are removed
  // from the grid below — no story appears twice on the page.
  const showFeatured = Boolean(featured) && !urlQuery;
  const bentoArticles = useMemo(() => {
    if (!showFeatured) return [];
    return articles.filter((article) => article.id !== featured.id).slice(0, 3);
  }, [articles, featured, showFeatured]);
  const bentoIds = useMemo(() => new Set(bentoArticles.map((article) => article.id)), [bentoArticles]);
  const gridArticles = useMemo(() => {
    if (!showFeatured) return articles;
    return articles.filter((article) => article.id !== featured.id && !bentoIds.has(article.id));
  }, [articles, featured, showFeatured, bentoIds]);
  const hasNotices = Boolean(
    meta?.sampleData ||
      ((meta?.stale || meta?.degraded || meta?.unavailable) && articles.length > 0) ||
      (error && articles.length > 0 && !meta?.stale)
  );

  return (
    <div className="mx-auto w-full max-w-[1280px] px-4 py-8 sm:px-6 lg:px-8">
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

      {hasNotices && (
        <div className="mt-6 space-y-3">
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
      )}

      <div className="mt-6">
        <CategoryRail categories={categories} activeCategory={category} onChange={(id) => updateParams({ category: id })} variant="chips" />
      </div>

      <div ref={feedRef} className="mt-8 min-w-0 scroll-mt-24">
          {hasActiveFilters && (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-800/60 bg-slate-900/30 px-4 py-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="mr-1 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Active filters:</span>
                {category !== 'all-news' && (
                  <ActiveFilterBadge label={activeCategoryLabel} onRemove={() => updateParams({ category: 'all-news' })} />
                )}
                {urlQuery && (
                  <ActiveFilterBadge
                    label={`“${urlQuery}”`}
                    onRemove={() => {
                      setDraftQuery(null);
                      updateParams({ q: '' });
                    }}
                  />
                )}
                {source && <ActiveFilterBadge label={source} onRemove={() => updateParams({ source: '' })} />}
                {sort !== 'newest' && <ActiveFilterBadge label="Oldest first" onRemove={() => updateParams({ sort: 'newest' })} />}
              </div>

              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
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
                </div>
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
            <div className="space-y-6">
              <FeaturedSkeleton />
              <NewsGridSkeleton count={6} />
            </div>
          ) : isEmpty ? (
            <EmptyState query={urlQuery} categoryLabel={category !== 'all-news' ? activeCategoryLabel : ''} onReset={resetFilters} />
          ) : (
            <>
              {showFeatured && <FeaturedStory article={featured} />}

              {bentoArticles.length > 0 && (
                <div className="mt-6">
                  <BentoGrid articles={bentoArticles} />
                </div>
              )}

              <section aria-labelledby="latest-heading" className="mt-10 space-y-6">
                <div className="flex flex-wrap items-end justify-between gap-3 border-b border-slate-800/70 pb-4">
                  <div>
                    <h2 id="latest-heading" className="font-serif text-[22px] text-white">
                      Latest News
                    </h2>
                    <p className="mt-1.5 text-[10px] font-bold uppercase tracking-[0.22em] text-slate-500">
                      {category !== 'all-news' ? activeCategoryLabel : 'All sections'} · {sort === 'oldest' ? 'oldest first' : 'newest first'}
                    </p>
                  </div>
                  <span className="text-[11px] text-slate-500">
                    {pagination?.total ?? articles.length} stories in the current newswire
                  </span>
                </div>

                <FeedGrid articles={gridArticles} />

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

      {/* Magazine layout: advisories / recent / sources are a full-width
          strip below the feed, never a squeezed third column. Hidden while
          the first load is pending or when there is nothing to show. */}
      {!loading && !isEmpty && !showError && (
        <section aria-labelledby="desk-heading" className="mt-12 min-w-0">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-3 border-b border-slate-800/70 pb-4">
            <div>
              <h2 id="desk-heading" className="font-serif text-[22px] text-white">
                More from the desk
              </h2>
              <p className="mt-1.5 text-[10px] font-bold uppercase tracking-[0.22em] text-slate-500">
                Advisories · Recent stories · Trusted sources
              </p>
            </div>
          </div>
          <NewsSidebar
            layout="strip"
            advisories={sections?.advisories || []}
            recent={sections?.recent || []}
            widelyCovered={sections?.widelyCovered || []}
            sources={sections?.sources || []}
            trustedSources={sections?.trustedSources || []}
          />
        </section>
      )}
    </div>
  );
}