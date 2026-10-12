import { useEffect, useMemo, useRef, useState } from 'react';
import { ExternalLink, Minimize2, Pause, Play, ShieldAlert, X } from 'lucide-react';
import { exactDate, timeAgo } from '../../utils/newsFormat.js';
import { prepareTickerArticles } from '../../utils/newsTicker.js';
import './FloatingNewsTicker.css';

const PRESENTATION_KEY = 'hackaware:news-ticker:presentation:v1';
const PRESENTATION_STATES = new Set(['expanded', 'minimized', 'dismissed']);
const HEADLINE_INTERVAL_MS = 7_000;
const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';

const readPresentation = () => {
  if (typeof window === 'undefined') return 'expanded';
  try {
    const saved = window.sessionStorage.getItem(PRESENTATION_KEY);
    return PRESENTATION_STATES.has(saved) ? saved : 'expanded';
  } catch {
    return 'expanded';
  }
};

const savePresentation = (presentation) => {
  if (typeof window === 'undefined') return;
  try {
    window.sessionStorage.setItem(PRESENTATION_KEY, presentation);
  } catch {
    // The in-memory state still works if session storage is unavailable.
  }
};

const readReducedMotion = () => {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false;
  return window.matchMedia(REDUCED_MOTION_QUERY).matches;
};

const readPageVisibility = () =>
  typeof document !== 'undefined' && document.visibilityState === 'hidden';

/**
 * Floating headlines are sourced from the dashboard's existing useNews query.
 * This component never fetches news itself; it only validates and presents the
 * already-normalized article data passed in by the dashboard shell.
 */
export default function FloatingNewsTicker({ articles = [], avoidBottomWidget = false }) {
  const tickerArticles = useMemo(() => prepareTickerArticles(articles), [articles]);
  const sequenceKey = useMemo(() => tickerArticles.map((article) => article.key).join('\u0000'), [tickerArticles]);
  const tickerArticlesRef = useRef(tickerArticles);
  const storyCount = tickerArticles.length;

  const [presentation, setPresentation] = useState(readPresentation);
  const [activeArticleKey, setActiveArticleKey] = useState(null);
  const [manuallyPaused, setManuallyPaused] = useState(false);
  const [reducedMotionOverride, setReducedMotionOverride] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [isPageHidden, setIsPageHidden] = useState(readPageVisibility);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(readReducedMotion);

  useEffect(() => {
    tickerArticlesRef.current = tickerArticles;
  }, [tickerArticles]);

  useEffect(() => {
    if (typeof document === 'undefined') return undefined;
    const updateVisibility = () => setIsPageHidden(document.visibilityState === 'hidden');
    document.addEventListener('visibilitychange', updateVisibility);
    return () => document.removeEventListener('visibilitychange', updateVisibility);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return undefined;
    const mediaQuery = window.matchMedia(REDUCED_MOTION_QUERY);
    const updatePreference = (event) => {
      setPrefersReducedMotion(event.matches);
      // If the OS preference changes during this visit, default back to the
      // reduced-motion behavior. The user can still explicitly resume rotation.
      if (event.matches) setReducedMotionOverride(false);
    };

    if (typeof mediaQuery.addEventListener === 'function') {
      mediaQuery.addEventListener('change', updatePreference);
      return () => mediaQuery.removeEventListener('change', updatePreference);
    }

    mediaQuery.addListener(updatePreference);
    return () => mediaQuery.removeListener(updatePreference);
  }, []);

  const foundArticleIndex = tickerArticles.findIndex((candidate) => candidate.key === activeArticleKey);
  const activeIndex = foundArticleIndex < 0 ? 0 : foundArticleIndex;

  const reducedMotionBlocksRotation = prefersReducedMotion && !reducedMotionOverride;
  const shouldRotate =
    presentation === 'expanded' &&
    tickerArticles.length > 1 &&
    !manuallyPaused &&
    !reducedMotionBlocksRotation &&
    !isHovered &&
    !isFocused &&
    !isPageHidden;

  useEffect(() => {
    if (!shouldRotate) return undefined;
    const interval = window.setInterval(() => {
      setActiveArticleKey((currentKey) => {
        const currentArticles = tickerArticlesRef.current;
        if (currentArticles.length < 2) return currentKey;
        const currentIndex = currentArticles.findIndex((candidate) => candidate.key === currentKey);
        const nextIndex = ((currentIndex < 0 ? 0 : currentIndex) + 1) % currentArticles.length;
        return currentArticles[nextIndex].key;
      });
    }, HEADLINE_INTERVAL_MS);
    return () => window.clearInterval(interval);
  }, [shouldRotate, sequenceKey, storyCount]);

  const updatePresentation = (nextPresentation) => {
    setPresentation(nextPresentation);
    savePresentation(nextPresentation);
  };

  const toggleRotation = () => {
    if (tickerArticles.length < 2) return;

    if (prefersReducedMotion) {
      const isCurrentlyPaused = manuallyPaused || !reducedMotionOverride;
      if (isCurrentlyPaused) {
        // This is an explicit user opt-in. The CSS still removes the slide
        // transition while the OS reduced-motion preference is active.
        setReducedMotionOverride(true);
        setManuallyPaused(false);
      } else {
        setReducedMotionOverride(false);
        setManuallyPaused(true);
      }
      return;
    }

    setManuallyPaused((paused) => !paused);
  };

  if (!tickerArticles.length || presentation === 'dismissed') return null;

  const article = tickerArticles[activeIndex % tickerArticles.length];
  const isMinimized = presentation === 'minimized';
  const rotationPaused = manuallyPaused || reducedMotionBlocksRotation;
  const rotationLabel = tickerArticles.length < 2
    ? 'Headline rotation is unavailable because only one story is available'
    : prefersReducedMotion && rotationPaused
      ? 'Enable headline rotation with reduced-motion transitions disabled'
      : rotationPaused
        ? 'Resume headline rotation'
        : 'Pause headline rotation';
  const publicationTime = article.publishedAt ? timeAgo(article.publishedAt) : null;
  const publicationDate = article.publishedAt ? exactDate(article.publishedAt) : null;

  return (
    <aside
      className={`floating-news-ticker${avoidBottomWidget ? ' floating-news-ticker--avoid-widget' : ''}`}
      aria-label="Latest cybersecurity news"
      onPointerEnter={(event) => {
        if (event.pointerType === 'mouse') setIsHovered(true);
      }}
      onPointerLeave={(event) => {
        if (event.pointerType === 'mouse') setIsHovered(false);
      }}
      onFocusCapture={() => setIsFocused(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setIsFocused(false);
      }}
    >
      {isMinimized ? (
        <button
          type="button"
          className="floating-news-ticker__launcher"
          onClick={() => updatePresentation('expanded')}
          aria-label="Reopen the latest cybersecurity news ticker"
          title="Reopen cyber news"
        >
          <ShieldAlert size={19} aria-hidden="true" />
          <span className="floating-news-ticker__launcher-dot" aria-hidden="true" />
        </button>
      ) : (
        <section className="floating-news-ticker__card">
          <div className="floating-news-ticker__header">
            <div className="floating-news-ticker__identity">
              <span className="floating-news-ticker__icon" aria-hidden="true">
                <ShieldAlert size={15} />
              </span>
              <div className="floating-news-ticker__brand">
                <span className="floating-news-ticker__label">Cyber news</span>
                <span className="floating-news-ticker__signal">
                  <span className="floating-news-ticker__signal-dot" aria-hidden="true" />
                  Latest updates
                </span>
              </div>
            </div>

            <div className="floating-news-ticker__controls" role="group" aria-label="Ticker controls">
              <button
                type="button"
                className="floating-news-ticker__control"
                onClick={toggleRotation}
                disabled={tickerArticles.length < 2}
                aria-label={rotationLabel}
                aria-pressed={rotationPaused}
                title={rotationLabel}
              >
                {rotationPaused ? <Play size={13} aria-hidden="true" /> : <Pause size={13} aria-hidden="true" />}
              </button>
              <button
                type="button"
                className="floating-news-ticker__control"
                onClick={() => updatePresentation('minimized')}
                aria-label="Minimize cybersecurity news ticker"
                title="Minimize ticker"
              >
                <Minimize2 size={13} aria-hidden="true" />
              </button>
              <button
                type="button"
                className="floating-news-ticker__control"
                onClick={() => updatePresentation('dismissed')}
                aria-label="Dismiss cybersecurity news ticker for this session"
                title="Dismiss ticker for this session"
              >
                <X size={14} aria-hidden="true" />
              </button>
            </div>
          </div>

          <div className="floating-news-ticker__headline-window" aria-live="off">
            <a
              key={article.key}
              className="floating-news-ticker__headline"
              href={article.url}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Read “${article.title}”${article.source ? ` from ${article.source}` : ''} in a new tab`}
              title={`${article.title} — open original article`}
            >
              <span className="floating-news-ticker__headline-text">{article.title}</span>
              <ExternalLink size={13} aria-hidden="true" />
            </a>
          </div>

          {(article.source || publicationTime) && (
            <div className="floating-news-ticker__meta">
              {article.source && (
                <span className="floating-news-ticker__source" title={article.source}>
                  {article.source}
                </span>
              )}
              {article.source && publicationTime && (
                <span className="floating-news-ticker__separator" aria-hidden="true">·</span>
              )}
              {publicationTime && (
                <time
                  className="floating-news-ticker__time"
                  dateTime={article.publishedAt}
                  title={publicationDate || undefined}
                >
                  {publicationTime}
                </time>
              )}
            </div>
          )}
        </section>
      )}
    </aside>
  );
}
