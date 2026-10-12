import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, ExternalLink, Newspaper, Pause, Play } from 'lucide-react';

import SafeImage from './SafeImage';
import { ArticleTags, SourceLine } from './ArticleCard';
import { categoryLabel, categoryTone, exactDate, timeAgo } from '../../utils/newsFormat.js';
import {
  HERO_AUTOPLAY_INTERVAL_MS,
  HERO_TRANSITION_MS,
  isWithinImageWindow,
  nextSlideIndex,
  normalizeSlideIndex,
  previousSlideIndex,
  selectHeroSlides,
  shouldAutoRotate,
} from '../../utils/newsHero.js';
import './CyberNewsHero.css';

const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';

/** The existing in-dashboard Cyber News section (dashboard tab, not a new route). */
const NEWS_SECTION_HREF = '/dashboard?tab=news';

const pad = (value) => String(value).padStart(2, '0');

const readReducedMotion = () => {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false;
  return window.matchMedia(REDUCED_MOTION_QUERY).matches;
};

const readPageHidden = () => typeof document !== 'undefined' && document.visibilityState === 'hidden';

/**
 * One hero slide. Memoised because the dashboard shell re-renders every second
 * (its clock) while the article data and the callbacks stay referentially
 * stable - so the slide markup is reconciled only when something really changes.
 */
const HeroSlide = React.memo(function HeroSlide({ slide, index, total, active, imageReady }) {
  const label = categoryLabel(slide.category, slide.categoryLabel);
  const publicationTime = slide.publishedAt ? timeAgo(slide.publishedAt) : null;
  const publicationDate = slide.publishedAt ? exactDate(slide.publishedAt) : null;
  const tabIndex = active ? undefined : -1;

  return (
    <li
      className={`cyber-news-hero__slide${active ? ' is-active' : ''}`}
      role="group"
      aria-roledescription="slide"
      aria-label={`Story ${index + 1} of ${total}`}
      aria-hidden={active ? undefined : true}
      data-slide-index={index}
    >
      <div className="cyber-news-hero__media">
        <div className="cyber-news-hero__media-base" aria-hidden="true" />
        {/* The picture is a background visual: it is described by the headline
            beside it, so it is exposed as decorative (empty alt). When a
            publisher supplies no usable thumbnail, SafeImage draws the branded
            HackAware placeholder instead - never a stand-in photo. */}
        <SafeImage
          src={slide.imageUrl}
          alt=""
          label={slide.source || label}
          ratio="auto"
          priority={active}
          deferred={!imageReady}
          sizes="(max-width: 768px) 100vw, 72rem"
          className="cyber-news-hero__image"
        />
      </div>
      <div className="cyber-news-hero__scene" aria-hidden="true" />

      <div className="cyber-news-hero__content">
        <div className="cyber-news-hero__badges">
          <span className={`cyber-news-hero__badge ${categoryTone(slide.category)}`}>{label}</span>
          <ArticleTags article={slide} />
        </div>

        <p className="cyber-news-hero__eyebrow">
          <span className="cyber-news-hero__eyebrow-dot" aria-hidden="true" />
          Latest cybersecurity news
        </p>

        <h2 className="cyber-news-hero__headline">
          <a
            className="cyber-news-hero__headline-link"
            href={slide.url}
            target="_blank"
            rel="noopener noreferrer"
            tabIndex={tabIndex}
            aria-label={`${slide.title} — open the original story${slide.source ? ` on ${slide.source}` : ''} in a new tab`}
          >
            {slide.title}
          </a>
        </h2>

        {slide.excerpt ? (
          <p className="cyber-news-hero__excerpt">{slide.excerpt}</p>
        ) : (
          <p className="cyber-news-hero__excerpt cyber-news-hero__excerpt--none">
            This publisher only supplies a headline in its feed — open the story for the full report.
          </p>
        )}

        <div className="cyber-news-hero__meta">
          <SourceLine article={slide} />
          {publicationTime && (
            <>
              <span className="cyber-news-hero__separator" aria-hidden="true">
                ·
              </span>
              <time dateTime={slide.publishedAt || undefined} title={publicationDate || undefined}>
                {publicationTime}
              </time>
            </>
          )}
        </div>

        <div className="cyber-news-hero__actions">
          <a
            className="cyber-news-hero__cta cyber-news-hero__cta--primary"
            href={slide.url}
            target="_blank"
            rel="noopener noreferrer"
            tabIndex={tabIndex}
            aria-label={`Read the full story: ${slide.title}${slide.source ? ` (${slide.source})` : ''} — opens in a new tab`}
          >
            Read Full Story
            <ExternalLink size={14} aria-hidden="true" />
          </a>
          <Link className="cyber-news-hero__cta cyber-news-hero__cta--ghost" to={NEWS_SECTION_HREF} tabIndex={tabIndex}>
            Explore Cyber News
            <Newspaper size={14} aria-hidden="true" />
          </Link>
        </div>
      </div>
    </li>
  );
});

/** Loading placeholder with the exact footprint of the finished banner. */
function HeroSkeleton() {
  return (
    <div
      className="cyber-news-hero"
      role="status"
      aria-busy="true"
      aria-label="Loading the latest cybersecurity news"
    >
      <div className="cyber-news-hero__frame">
        <div className="cyber-news-hero__skeleton" aria-hidden="true">
          <div className="cyber-news-hero__skeleton-badge" />
          <div className="cyber-news-hero__skeleton-eyebrow" />
          <div className="cyber-news-hero__skeleton-title" />
          <div className="cyber-news-hero__skeleton-title-sm" />
          <div className="cyber-news-hero__skeleton-line" />
          <div className="cyber-news-hero__skeleton-line-sm" />
          <div className="cyber-news-hero__skeleton-cta" />
        </div>
      </div>
    </div>
  );
}

/**
 * CyberNewsHero - the dashboard's premium auto-sliding news banner.
 *
 * Data: it does **not** fetch anything. It receives the dashboard's shared
 * `useNews` result (the same response the floating ticker and the Cyber News
 * page already use) and narrows it with `selectHeroSlides`, so there is exactly
 * one article request per dashboard query, no polling and no duplicate
 * integration.
 *
 * Behaviour: advances every `HERO_AUTOPLAY_INTERVAL_MS` (6 s) with a horizontal
 * CSS transition. Rotation pauses on hover, on keyboard focus inside the
 * widget, while the tab is hidden, and via the pause button; reduced-motion
 * users get manual navigation with no automatic animation.
 */
export default function CyberNewsHero({ newsData, className = '' }) {
  const articles = newsData?.articles;
  const featured = newsData?.featured;
  const loading = Boolean(newsData?.loading);
  const sampleData = Boolean(newsData?.meta?.sampleData);

  // Keyed on the article references (not the payload object, which is rebuilt on
  // every dashboard render) so the slide list stays referentially stable.
  const slides = useMemo(() => selectHeroSlides({ featured, articles }), [featured, articles]);
  const slideCount = slides.length;

  // The active index is clamped during render when the article list changes, so
  // a refresh or a filter change can never point the carousel at a missing slide.
  const [indexState, setIndexState] = useState({ count: 0, index: 0 });
  if (indexState.count !== slideCount) {
    setIndexState({
      count: slideCount,
      index: slideCount ? Math.min(indexState.index, slideCount - 1) : 0,
    });
  }
  const activeIndex = slideCount ? normalizeSlideIndex(indexState.index, slideCount) : 0;

  const [restartToken, setRestartToken] = useState(0);
  const [pausedByUser, setPausedByUser] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [pageHidden, setPageHidden] = useState(readPageHidden);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(readReducedMotion);

  /* ---------------- environment listeners (cleaned up on unmount) ------- */
  useEffect(() => {
    if (typeof document === 'undefined') return undefined;
    const onVisibilityChange = () => setPageHidden(document.visibilityState === 'hidden');
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => document.removeEventListener('visibilitychange', onVisibilityChange);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return undefined;
    const mediaQuery = window.matchMedia(REDUCED_MOTION_QUERY);
    const onChange = (event) => setPrefersReducedMotion(event.matches);
    if (typeof mediaQuery.addEventListener === 'function') {
      mediaQuery.addEventListener('change', onChange);
      return () => mediaQuery.removeEventListener('change', onChange);
    }
    mediaQuery.addListener(onChange);
    return () => mediaQuery.removeListener(onChange);
  }, []);

  /* ---------------- auto-advance ---------------- */
  const canRotate = slideCount > 1 && !prefersReducedMotion;
  const shouldRotate = shouldAutoRotate({ slideCount, prefersReducedMotion, pausedByUser, hovered, focused, pageHidden });

  useEffect(() => {
    if (!shouldRotate) return undefined;
    // A fresh interval starts whenever rotation (re)starts or the viewer
    // navigates manually, so nobody has to race a half-elapsed timer.
    const timer = window.setInterval(() => {
      setIndexState((previous) =>
        previous.count > 1
          ? { count: previous.count, index: nextSlideIndex(previous.index, previous.count) }
          : previous
      );
    }, HERO_AUTOPLAY_INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, [shouldRotate, slideCount, restartToken]);

  /* ---------------- manual navigation ---------------- */
  const restartRotation = useCallback(() => setRestartToken((token) => token + 1), []);

  const goToSlide = useCallback(
    (target) => {
      setIndexState((previous) =>
        previous.count
          ? { count: previous.count, index: normalizeSlideIndex(target, previous.count) }
          : previous
      );
      restartRotation();
    },
    [restartRotation]
  );

  // Functional updates mean rapid repeated clicks always step exactly one slide
  // from the latest index - no overlapping transitions, no drifting counter.
  const stepSlide = useCallback(
    (direction) => {
      setIndexState((previous) => {
        if (previous.count < 2) return previous;
        return {
          count: previous.count,
          index: direction < 0 ? previousSlideIndex(previous.index, previous.count) : nextSlideIndex(previous.index, previous.count),
        };
      });
      restartRotation();
    },
    [restartRotation]
  );

  const onKeyDown = useCallback(
    (event) => {
      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        stepSlide(-1);
      } else if (event.key === 'ArrowRight') {
        event.preventDefault();
        stepSlide(1);
      }
    },
    [stepSlide]
  );

  /* ---------------- rendering ---------------- */
  if (!slideCount) {
    // An API failure with nothing cached stays silent (the ticker and the Cyber
    // News page already report the outage); an empty newswire renders nothing.
    if (loading) return <HeroSkeleton />;
    return null;
  }

  const rotationPaused = !shouldRotate;
  const toggleLabel = pausedByUser
    ? `Resume the automatic story rotation (currently paused; ${slideCount} stories available)`
    : 'Pause the automatic story rotation';
  // Restarting the progress animation is tied to the same events that restart
  // the interval, so the bar and the 6 s timer never drift apart.
  const progressKey = `${activeIndex}-${restartToken}-${shouldRotate ? 'run' : 'idle'}`;

  return (
    <section
      className={`cyber-news-hero${className ? ` ${className}` : ''}`}
      role="region"
      aria-roledescription="carousel"
      aria-label="Latest cybersecurity news"
      onPointerEnter={(event) => {
        if (event.pointerType === 'mouse') setHovered(true);
      }}
      onPointerLeave={(event) => {
        if (event.pointerType === 'mouse') setHovered(false);
      }}
      onFocusCapture={() => setFocused(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false);
      }}
      onKeyDown={onKeyDown}
      style={{
        '--hero-interval-ms': `${HERO_AUTOPLAY_INTERVAL_MS}ms`,
        '--hero-transition-ms': `${HERO_TRANSITION_MS}ms`,
      }}
    >
      <div className="cyber-news-hero__frame">
        <div className="cyber-news-hero__viewport">
          <ul
            className="cyber-news-hero__track"
            style={{ transform: `translate3d(-${activeIndex * 100}%, 0, 0)` }}
            aria-live="off"
          >
            {slides.map((slide, index) => (
              <HeroSlide
                key={slide.key}
                slide={slide}
                index={index}
                total={slideCount}
                active={index === activeIndex}
                imageReady={isWithinImageWindow(index, activeIndex, slideCount)}
              />
            ))}
          </ul>
        </div>

        {slideCount > 1 && (
          <>
            <button
              type="button"
              className="cyber-news-hero__nav cyber-news-hero__nav--prev"
              onClick={() => stepSlide(-1)}
              aria-label={`Show the previous story (${pad(previousSlideIndex(activeIndex, slideCount) + 1)} of ${pad(slideCount)})`}
              title="Previous story"
            >
              <ChevronLeft size={18} aria-hidden="true" />
            </button>
            <button
              type="button"
              className="cyber-news-hero__nav cyber-news-hero__nav--next"
              onClick={() => stepSlide(1)}
              aria-label={`Show the next story (${pad(nextSlideIndex(activeIndex, slideCount) + 1)} of ${pad(slideCount)})`}
              title="Next story"
            >
              <ChevronRight size={18} aria-hidden="true" />
            </button>

            <div className="cyber-news-hero__chrome">
              <div className="cyber-news-hero__pagination">
                <div className="cyber-news-hero__dots" role="group" aria-label="Choose a story">
                  {slides.map((slide, index) => (
                    <button
                      key={slide.key}
                      type="button"
                      className="cyber-news-hero__dot"
                      onClick={() => goToSlide(index)}
                      aria-label={`Show story ${pad(index + 1)} of ${pad(slideCount)}`}
                      aria-current={index === activeIndex ? 'true' : undefined}
                      title={slide.title}
                    />
                  ))}
                </div>
                <span className="cyber-news-hero__counter" aria-hidden="true">
                  {pad(activeIndex + 1)} / {pad(slideCount)}
                </span>
                {sampleData && <span className="cyber-news-hero__sample">Sample data</span>}
              </div>

              {canRotate && (
                <button
                  type="button"
                  className="cyber-news-hero__toggle"
                  onClick={() => setPausedByUser((paused) => !paused)}
                  aria-label={toggleLabel}
                  aria-pressed={pausedByUser}
                  title={pausedByUser ? 'Resume auto-rotation' : 'Pause auto-rotation'}
                >
                  {pausedByUser ? <Play size={12} aria-hidden="true" /> : <Pause size={12} aria-hidden="true" />}
                </button>
              )}
            </div>

            {/* Screen readers already have the slide labels and dots; this
                element is decoration that mirrors the auto-advance timer. */}
            <span key={progressKey} className={`cyber-news-hero__progress${rotationPaused ? ' is-paused' : ''}`} aria-hidden="true" />
          </>
        )}
      </div>
    </section>
  );
}
