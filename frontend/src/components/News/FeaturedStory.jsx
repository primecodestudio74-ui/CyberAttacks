import React from 'react';
import { ExternalLink, Flame } from 'lucide-react';
import SafeImage from './SafeImage';
import { ArticleTags, SourceLine } from './ArticleCard';
import { categoryLabel, categoryTone, exactDate, timeAgo } from '../../utils/newsFormat';

/**
 * The lead story. Selected server-side from the current pool (recent,
 * illustrated, not sponsored) - never hardcoded, never a mock article.
 */
export default function FeaturedStory({ article }) {
  if (!article) return null;

  return (
    <section aria-labelledby="featured-heading" className="group">
      <div className="mb-3 flex items-center justify-between gap-4 border-b border-slate-800/60 pb-2">
        <h2
          id="featured-heading"
          className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-cyan-500"
        >
          <Flame size={13} aria-hidden="true" />
          Top Story
        </h2>
        <span className="text-[10px] font-medium text-slate-600" title={exactDate(article.publishedAt)}>
          {timeAgo(article.publishedAt)}
        </span>
      </div>

      <article className="grid gap-0 overflow-hidden rounded-2xl border border-slate-800/60 bg-[#070c17]/70 transition-colors duration-300 hover:border-cyan-500/40 lg:grid-cols-5">
        <a
          href={article.url}
          target="_blank"
          rel="noopener noreferrer"
          className="lg:col-span-3 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-500/60"
          aria-label={`${article.title} — read the full story on ${article.source} (opens in a new tab)`}
        >
          <SafeImage
            src={article.imageUrl}
            alt={`Illustration for: ${article.title}`}
            label={categoryLabel(article.category, article.categoryLabel)}
            ratio="16 / 9"
            priority
            sizes="(max-width: 1024px) 100vw, 60vw"
            className="h-full min-h-[220px] w-full border-b border-slate-800/60 lg:border-b-0 lg:border-r"
          />
        </a>

        <div className="flex flex-col gap-4 p-5 lg:col-span-2 lg:p-7">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`rounded border px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.16em] ${categoryTone(article.category)}`}>
              {categoryLabel(article.category, article.categoryLabel)}
            </span>
            <ArticleTags article={article} />
          </div>

          <h3 className="font-serif text-2xl leading-tight text-white lg:text-[30px]">{article.title}</h3>

          {article.description && (
            <p className="text-[13px] leading-relaxed text-slate-400">{article.description}</p>
          )}

          {article.cveIds?.length > 0 && (
            <p className="font-mono text-[11px] text-cyan-600">{article.cveIds.join(' · ')}</p>
          )}

          <div className="mt-auto space-y-3 pt-4">
            <div className="flex flex-wrap items-center gap-3 border-t border-slate-800/60 pt-4">
              <SourceLine article={article} />
              {article.author && <span className="text-[10px] text-slate-600">By {article.author}</span>}
            </div>
            <time
              dateTime={article.publishedAt || undefined}
              className="block text-[11px] text-slate-500"
              title={exactDate(article.publishedAt)}
            >
              Published {exactDate(article.publishedAt)}
              {article.dateLabel ? ` · ${article.dateLabel}` : ''}
            </time>
            <a
              href={article.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-lg bg-cyan-600 px-4 py-2.5 text-[11px] font-black uppercase tracking-[0.18em] text-[#020617] transition-colors hover:bg-cyan-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-400"
            >
              Read full story
              <ExternalLink size={13} aria-hidden="true" />
            </a>
          </div>
        </div>
      </article>
    </section>
  );
}
