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
      <div className={`px-6 pt-6 lg:px-12 ${className}`} role="status" aria-busy="true" aria-label="Loading the latest cybersecurity news">
        <div className="h-64 animate-pulse rounded-3xl border border-slate-800 bg-slate-900/70 sm:h-80 lg:h-[26rem]" />
      </div>
    );
  }

  const article = slides[activeIndex];
  const category = categoryLabel(article.category, article.categoryLabel);
  const showNavigation = slides.length > 1;
  const move = (step) => setActiveIndex((index) => (index + step + slides.length) % slides.length);

  return (
    <section
      className={`px-6 pt-6 lg:px-12 ${className}`}
      aria-label="Latest cybersecurity stories"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setPaused(false);
      }}
    >
      <article
        className="group relative isolate min-h-[280px] touch-pan-y overflow-hidden rounded-3xl border border-slate-800/70 bg-[#070c17] sm:min-h-[340px] lg:min-h-[380px]"
        onTouchStart={(event) => { touchStartX.current = event.changedTouches[0]?.clientX ?? null; }}
        onTouchEnd={(event) => {
          if (touchStartX.current === null) return;
          const delta = event.changedTouches[0].clientX - touchStartX.current;
          touchStartX.current = null;
          if (Math.abs(delta) >= 45 && showNavigation) move(delta < 0 ? 1 : -1);
        }}
        onTouchCancel={() => { touchStartX.current = null; }}
      >
        <a href={article.url} target="_blank" rel="noopener noreferrer" className="absolute inset-0 z-10 rounded-3xl outline-none focus-visible:ring-2 focus-visible:ring-cyan-400" aria-label={`${article.title} — read the full story on ${article.source || 'the publisher'} (opens in a new tab)`}>
          <span className="sr-only">Read the full story</span>
        </a>
        <SafeImage
          key={article.key}
          src={article.imageUrl}
          alt=""
          label={category}
          ratio="16 / 9"
          priority
          sizes="(max-width: 1280px) 100vw, 1280px"
          className="absolute inset-0 h-full w-full"
          imgClassName="transition-transform duration-500 group-hover:scale-[1.02]"
        />
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#020617] via-[#020617]/45 to-transparent" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 flex max-w-4xl flex-col items-start gap-3 p-5 sm:p-8 lg:p-10">
          <span className={`rounded border px-2 py-1 text-[9px] font-black uppercase tracking-[0.16em] ${categoryTone(article.category)}`}>{category}</span>
          <h2 className="max-w-3xl font-serif text-2xl leading-tight text-white sm:text-3xl lg:text-4xl">{article.title}</h2>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-xs text-slate-300">
            {article.source && <span className="font-semibold text-slate-200">{article.source}</span>}
            {article.publishedAt && <><span aria-hidden="true">·</span><time dateTime={article.publishedAt}>{timeAgo(article.publishedAt)}</time></>}
            <span className="inline-flex items-center gap-1.5 font-bold text-cyan-300">Read story <ExternalLink size={12} aria-hidden="true" /></span>
          </div>
        </div>

        {showNavigation && (
          <>
            <button type="button" onClick={() => move(-1)} aria-label="Previous story" className="absolute left-3 top-1/2 z-20 -translate-y-1/2 rounded-full border border-white/20 bg-slate-950/65 p-2 text-white backdrop-blur transition hover:border-cyan-400 hover:text-cyan-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 sm:left-5">
              <ChevronLeft size={18} aria-hidden="true" />
            </button>
            <button type="button" onClick={() => move(1)} aria-label="Next story" className="absolute right-3 top-1/2 z-20 -translate-y-1/2 rounded-full border border-white/20 bg-slate-950/65 p-2 text-white backdrop-blur transition hover:border-cyan-400 hover:text-cyan-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 sm:right-5">
              <ChevronRight size={18} aria-hidden="true" />
            </button>
            <div className="absolute bottom-3 right-4 z-20 flex items-center gap-1.5 rounded-full border border-white/10 bg-slate-950/65 px-2.5 py-1.5 backdrop-blur" role="group" aria-label="Choose a news story">
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
