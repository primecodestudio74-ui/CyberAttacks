import React from 'react';
import { ExternalLink, Flame } from 'lucide-react';
import SafeImage from './SafeImage';
import { ArticleTags, SourceLine } from './ArticleCard';
import { categoryLabel, categoryTone, exactDate, timeAgo } from '../../utils/newsFormat';

/**
 * The lead story — Magazine layout (Layout C).
 *
 * A single full-width hero: the article image fills the card, a dark gradient
 * guarantees text contrast over any publisher image (and over the branded
 * SafeImage fallback when there is no image), and the headline, excerpt and
 * source sit over the bottom of the image. The whole hero is one link, so
 * there are no nested interactive elements.
 *
 * Selected server-side from the current pool (recent, illustrated, not
 * sponsored) — never hardcoded, never a mock article.
 */
export default function FeaturedStory({ article }) {
  if (!article) return null;

  return (
    <section aria-labelledby="featured-heading">
      <h2 id="featured-heading" className="sr-only">
        Top Story
      </h2>

      <article className="group relative overflow-hidden rounded-3xl border border-slate-800/70 bg-[#070c17] transition-colors duration-300 hover:border-cyan-500/40 focus-within:border-cyan-500/50 focus-within:ring-1 focus-within:ring-cyan-500/30">
        <a
          href={article.url}
          target="_blank"
          rel="noopener noreferrer"
          className="block outline-none"
          aria-label={`${article.title} — read the full story on ${article.source} (opens in a new tab)`}
        >
          <SafeImage
            src={article.imageUrl}
            alt={`Illustration for: ${article.title}`}
            label={categoryLabel(article.category, article.categoryLabel)}
            ratio="16 / 9"
            priority
            sizes="(max-width: 1280px) 100vw, 1280px"
            className="min-h-[380px] w-full sm:min-h-[420px] lg:min-h-[460px]"
            imgClassName="transition-transform duration-500 group-hover:scale-[1.02]"
          />

          {/* Contrast + readability over any image (or image fallback). */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#020617] via-[#020617]/55 to-transparent"
          />

          <div className="absolute inset-x-0 bottom-0 flex max-w-3xl flex-col gap-4 p-6 sm:p-8 lg:p-10">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded border border-cyan-500/40 bg-cyan-500/15 px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.16em] text-cyan-200">
                <Flame size={11} aria-hidden="true" />
                Top Story
              </span>
              <span className={`rounded border px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.16em] ${categoryTone(article.category)}`}>
                {categoryLabel(article.category, article.categoryLabel)}
              </span>
              <ArticleTags article={article} />
            </div>

            <h3 className="font-serif text-[26px] leading-tight text-white sm:text-3xl lg:text-4xl">{article.title}</h3>

            {article.description && (
              <p className="hidden max-w-2xl text-[13px] leading-relaxed text-slate-300 [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:2] overflow-hidden sm:block">
                {article.description}
              </p>
            )}

            {article.cveIds?.length > 0 && (
              <p className="break-all font-mono text-[11px] text-cyan-300/80">{article.cveIds.slice(0, 4).join(' · ')}</p>
            )}

            <div className="flex flex-wrap items-center gap-x-4 gap-y-3 pt-1">
              <span className="inline-flex items-center gap-2 rounded-lg bg-cyan-600 px-4 py-2.5 text-[11px] font-black uppercase tracking-[0.18em] text-[#020617] transition-colors group-hover:bg-cyan-500">
                Read full story
                <ExternalLink size={13} aria-hidden="true" />
              </span>
              <SourceLine article={article} className="[&>span:last-child]:text-slate-200" />
              <span className="text-[11px] text-slate-400" title={exactDate(article.publishedAt)}>
                <time dateTime={article.publishedAt || undefined}>{timeAgo(article.publishedAt)}</time>
                {article.author ? ` · By ${article.author}` : ''}
              </span>
            </div>
          </div>
        </a>
      </article>
    </section>
  );
}
