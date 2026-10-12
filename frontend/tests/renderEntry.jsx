import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';

// Real components, rendered outside the browser so the test suite can assert on
// the actual markup they produce from a real /api/news payload.
import ArticleCard, { CompactArticle } from '../src/components/News/ArticleCard';
import CyberNewsHero from '../src/components/News/CyberNewsHero';
import FeaturedStory from '../src/components/News/FeaturedStory';
import NewsSidebar from '../src/components/News/NewsSidebar';
import FloatingNewsTicker from '../src/components/News/FloatingNewsTicker';
import NewsHeader from '../src/components/News/NewsHeader';
import CategoryRail from '../src/components/News/CategoryRail';
import {
  EmptyState,
  ErrorState,
  FeaturedSkeleton,
  NewsGridSkeleton,
  RateLimitNotice,
  SampleDataNotice,
  StaleNotice,
} from '../src/components/News/NewsStates';

/** The hero renders router links, so it needs the app's router context. */
const renderHero = (newsData) =>
  renderToStaticMarkup(
    <MemoryRouter>
      <CyberNewsHero newsData={newsData} />
    </MemoryRouter>
  );

/** Render every news component against the supplied API payload. */
export const renderAll = (payload) => {
  const articles = payload.articles || [];
  const html = {
    hero: renderHero(payload),
    heroLoading: renderHero({ loading: true, articles: [], featured: null, error: null }),
    heroError: renderHero({ loading: false, articles: [], featured: null, error: { message: 'news unavailable' } }),
    heroEmpty: renderHero({ loading: false, articles: [], featured: null, error: null }),
    heroSingle: renderHero({
      loading: false,
      featured: null,
      articles: articles.slice(0, 1),
    }),
    heroWithoutImages: renderHero({
      loading: false,
      featured: null,
      articles: articles.filter((article) => !article.imageUrl).slice(0, 3),
    }),
    card: articles[0] ? renderToStaticMarkup(<ArticleCard article={articles[0]} />) : '',
    ticker: renderToStaticMarkup(<FloatingNewsTicker articles={articles} />),
    emptyTicker: renderToStaticMarkup(<FloatingNewsTicker articles={[]} />),
    cardWithoutImage: renderToStaticMarkup(
      <ArticleCard
        article={{
          id: 'news_test',
          title: 'Headline without an image or a summary',
          description: null,
          imageUrl: null,
          source: 'Example Wire',
          url: 'https://example.com/story',
          category: 'general-cyber',
          categoryLabel: 'Cybersecurity',
          categories: ['general-cyber'],
          tags: [],
          cveIds: [],
          publishedAt: null,
          author: null,
          isAdvisory: false,
        }}
      />
    ),
    compact: articles[1] ? renderToStaticMarkup(<CompactArticle article={articles[1]} />) : '',
    featured: renderToStaticMarkup(<FeaturedStory article={payload.featured} />),
    sidebar: renderToStaticMarkup(
      <NewsSidebar
        advisories={payload.sections?.advisories || []}
        recent={payload.sections?.recent || []}
        widelyCovered={payload.sections?.widelyCovered || []}
        sources={payload.sections?.sources || []}
        trustedSources={payload.sections?.trustedSources || []}
      />
    ),
    categoryRail: renderToStaticMarkup(
      <CategoryRail categories={payload.sections?.categories || []} activeCategory="ai-security" onChange={() => {}} variant="rail" />
    ),
    categoryChips: renderToStaticMarkup(
      <CategoryRail categories={payload.sections?.categories || []} activeCategory="ai-security" onChange={() => {}} variant="chips" />
    ),
    header: renderToStaticMarkup(
      <NewsHeader
        searchValue="ransomware"
        onSearchChange={() => {}}
        onRefresh={() => {}}
        lastUpdated={payload.lastUpdated}
        stale={false}
        resultSummary="24 stories"
      />
    ),
    grids: renderToStaticMarkup(
      <>
        <FeaturedSkeleton />
        <NewsGridSkeleton count={2} />
      </>
    ),
    empty: renderToStaticMarkup(<EmptyState query="zzz" categoryLabel="AI Security" onReset={() => {}} />),
    error: renderToStaticMarkup(<ErrorState message="Unable to load the latest cybersecurity news right now. Please try again." onRetry={() => {}} />),
    rateLimit: renderToStaticMarkup(<RateLimitNotice onRetry={() => {}} />),
    sample: renderToStaticMarkup(<SampleDataNotice />),
    stale: renderToStaticMarkup(<StaleNotice lastUpdated={payload.lastUpdated} degradedSources={['cisa-kev']} onRefresh={() => {}} />),
    feed: renderToStaticMarkup(
      <div>
        {articles.map((article) => (
          <ArticleCard key={article.id} article={article} />
        ))}
      </div>
    ),
  };
  return html;
};

export default renderAll;
