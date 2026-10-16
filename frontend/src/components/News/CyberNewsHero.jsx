import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react';
import SafeImage from './SafeImage';
import { selectHeroSlides, HERO_AUTOPLAY_INTERVAL_MS } from '../../utils/newsHero.js';
import { categoryLabel, categoryTone, timeAgo } from '../../utils/newsFormat.js';

/** A quieter dashboard take on the editorial hero used on the Cyber News page. */
export default function CyberNewsHero({ newsData, className = '' }) {
  const slides = useMemo(
    () => selectHeroSlides({ featured: newsData?.featured, articles: newsData?.articles }, { limit: 6 }),
    [newsData?.featured, newsData?.articles]
  );
  const [activeIndex, setActiveIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const touchStartX = useRef(null);

  useEffect(() => {
    setActiveIndex((index) => Math.min(index, Math.max(0, slides.length - 1)));
  }, [slides.length]);

  useEffect(() => {
    if (slides.length < 2 || paused) return undefined;
    const timer = window.setInterval(() => {
      setActiveIndex((index) => (index + 1) % slides.length);
    }, HERO_AUTOPLAY_INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, [slides.length, paused]);

  if (!slides.length) {
    if (!newsData?.loading) return null;
    return (
      <div className={`w-full ${className}`} role="status" aria-busy="true" aria-label="Loading the latest cybersecurity news">
        <div className="h-80 w-full animate-pulse bg-slate-900/70 sm:h-96 lg:h-[32rem]" />
      </div>
    );
  }

  const article = slides[activeIndex];
  const category = categoryLabel(article.category, article.categoryLabel);
  const showNavigation = slides.length > 1;
  const move = (step) => setActiveIndex((index) => (index + step + slides.length) % slides.length);

  return (
    <section
      className={`w-full ${className}`}
      aria-label="Latest cybersecurity stories"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setPaused(false);
      }}
    >
      <article
        className="group relative isolate w-full min-h-[380px] touch-pan-y overflow-hidden bg-[#020617] sm:min-h-[460px] lg:min-h-[520px]"
        onTouchStart={(event) => { touchStartX.current = event.changedTouches[0]?.clientX ?? null; }}
        onTouchEnd={(event) => {
          if (touchStartX.current === null) return;
          const delta = event.changedTouches[0].clientX - touchStartX.current;
          touchStartX.current = null;
          if (Math.abs(delta) >= 45 && showNavigation) move(delta < 0 ? 1 : -1);
        }}
        onTouchCancel={() => { touchStartX.current = null; }}
      >
        <a href={article.url} target="_blank" rel="noopener noreferrer" className="absolute inset-0 z-10 outline-none focus-visible:ring-2 focus-visible:ring-cyan-400" aria-label={`${article.title} — read the full story on ${article.source || 'the publisher'} (opens in a new tab)`}>
          <span className="sr-only">Read the full story</span>
        </a>
        <SafeImage
          key={article.key}
          src={article.imageUrl}
          alt=""
          label={category}
          ratio="16 / 9"
          priority
          sizes="100vw"
          className="absolute inset-0 h-full w-full object-cover"
          imgClassName="transition-transform duration-700 group-hover:scale-[1.03]"
        />

        {/* TOP LEFT CATEGORY BADGE */}
        <div className="absolute top-5 left-5 z-30 sm:top-8 sm:left-8">
          <span className={`rounded border px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.16em] backdrop-blur-md shadow-lg ${categoryTone(article.category)}`}>
            {category}
          </span>
        </div>

        {/* ENHANCED FULL COVERAGE VIGNETTE OVERLAYS */}
        {/* Bottom-to-Top Heavy Shadow */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-20 bg-gradient-to-t from-[#020617] via-[#020617]/65 to-transparent" />
        
        {/* Left Side Deep Fade */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-y-0 left-0 z-20 w-48 sm:w-80 lg:w-96 bg-gradient-to-r from-[#020617] via-[#020617]/90 via-[#020617]/40 to-transparent" />
        
        {/* Right Side Deep Fade */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-y-0 right-0 z-20 w-48 sm:w-80 lg:w-96 bg-gradient-to-l from-[#020617] via-[#020617]/90 via-[#020617]/40 to-transparent" />

        {/* BOTTOM CONTENT */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-30 flex max-w-5xl flex-col items-start gap-3.5 p-6 sm:p-10 lg:p-12">
          <h2 className="max-w-4xl font-serif text-2xl leading-tight text-white sm:text-4xl lg:text-5xl drop-shadow-md">{article.title}</h2>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-xs sm:text-sm text-slate-300">
            {article.source && <span className="font-semibold text-slate-200">{article.source}</span>}
            {article.publishedAt && <><span aria-hidden="true">·</span><time dateTime={article.publishedAt}>{timeAgo(article.publishedAt)}</time></>}
            <span className="inline-flex items-center gap-1.5 font-bold text-cyan-300">Read story <ExternalLink size={14} aria-hidden="true" /></span>
          </div>
        </div>

        {showNavigation && (
          <>
            <button type="button" onClick={() => move(-1)} aria-label="Previous story" className="absolute left-4 top-1/2 z-30 -translate-y-1/2 rounded-full border border-white/20 bg-slate-950/70 p-2.5 text-white backdrop-blur transition hover:border-cyan-400 hover:text-cyan-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 sm:left-6">
              <ChevronLeft size={22} aria-hidden="true" />
            </button>
            <button type="button" onClick={() => move(1)} aria-label="Next story" className="absolute right-4 top-1/2 z-30 -translate-y-1/2 rounded-full border border-white/20 bg-slate-950/70 p-2.5 text-white backdrop-blur transition hover:border-cyan-400 hover:text-cyan-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 sm:right-6">
              <ChevronRight size={22} aria-hidden="true" />
            </button>
            <div className="absolute bottom-5 right-6 z-30 flex items-center gap-1.5 rounded-full border border-white/10 bg-slate-950/70 px-3.5 py-1.5 backdrop-blur" role="group" aria-label="Choose a news story">
              {slides.map((slide, index) => (
                <button key={slide.key} type="button" onClick={() => setActiveIndex(index)} aria-label={`Show story ${index + 1} of ${slides.length}`} aria-current={index === activeIndex ? 'true' : undefined} className={`h-1.5 rounded-full transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 ${index === activeIndex ? 'w-5 bg-cyan-400' : 'w-1.5 bg-slate-400/70 hover:bg-white'}`} />
              ))}
              <span className="ml-1 font-mono text-[10px] text-slate-300" aria-hidden="true">{activeIndex + 1}/{slides.length}</span>
            </div>
          </>
        )}
      </article>
    </section>
  );
}