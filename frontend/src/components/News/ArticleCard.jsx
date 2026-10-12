import React from 'react';
import { ExternalLink, Clock3, Radio } from 'lucide-react';
import SafeImage from './SafeImage';
import { categoryLabel, categoryTone, exactDate, initialsOf, timeAgo } from '../../utils/newsFormat';

/**
 * Publisher name + favicon. The favicon is fetched from a neutral icon service
 * (no tracking pixel, no API key) and falls back to initials.
 */
export const SourceLine = ({ article, className = '' }) => {
  const host = (() => {
    try {
      return new URL(article.url).hostname.replace(/^www\./, '');
    } catch {
      return null;
    }
  })();

  return (
    <span className={`inline-flex items-center gap-2 min-w-0 ${className}`}>
      <span className="flex h-5 w-5 shrink-0 items-center justify-center overflow-hidden rounded-full border border-slate-700 bg-slate-900 text-[8px] font-black uppercase text-cyan-400">
        {host ? (
          <img
            src={`https://www.google.com/s2/favicons?domain=${encodeURIComponent(host)}&sz=32`}
            alt=""
            width="20"
            height="20"
            loading="lazy"
            decoding="async"
            referrerPolicy="no-referrer"
            onError={(event) => {
              event.currentTarget.style.display = 'none';
            }}
            className="h-full w-full object-cover"
          />
        ) : (
          initialsOf(article.source)
        )}
      </span>
      <span className="truncate text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">{article.source}</span>
    </span>
  );
};

const Tag = ({ children, tone = 'slate' }) => {
  const tones = {
    slate: 'border-slate-700/60 text-slate-400 bg-slate-800/40',
    critical: 'border-rose-500/40 text-rose-300 bg-rose-500/10',
    exploited: 'border-amber-500/40 text-amber-300 bg-amber-500/10',
    advisory: 'border-sky-500/40 text-sky-300 bg-sky-500/10',
    sponsored: 'border-slate-600/40 text-slate-500 bg-slate-800/30',
  };
  return (
    <span className={`rounded border px-1.5 py-0.5 text-[8px] font-black uppercase tracking-[0.18em] ${tones[tone]}`}>
      {children}
    </span>
  );
};

export const ArticleTags = ({ article }) => {
  const tags = article.tags || [];
  if (!tags.length) return null;
  return (
    <span className="flex flex-wrap items-center gap-1">
      {tags.includes('Critical') && <Tag tone="critical">Critical</Tag>}
      {tags.includes('Exploited in the wild') && <Tag tone="exploited">Exploited</Tag>}
      {tags.includes('Advisory') && <Tag tone="advisory">Advisory</Tag>}
      {tags.includes('Sponsored') && <Tag tone="sponsored">Sponsored</Tag>}
    </span>
  );
};

const MetaRow = ({ article, compact = false }) => (
  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-slate-500">
    <span className="inline-flex items-center gap-1" title={exactDate(article.publishedAt)}>
      <Clock3 size={11} aria-hidden="true" />
      <time dateTime={article.publishedAt || undefined}>{timeAgo(article.publishedAt)}</time>
    </span>
    {article.dateLabel && <span className="text-slate-600">· {article.dateLabel}</span>}
    {!compact && article.author && <span className="truncate text-slate-600">· By {article.author}</span>}
    {!compact && (article.alsoCoveredBy || []).length > 0 && (
      <span className="inline-flex items-center gap-1 text-slate-600" title={`Also reported by ${article.alsoCoveredBy.join(', ')}`}>
        <Radio size={10} aria-hidden="true" />
        Also covered by {article.alsoCoveredBy.join(', ')}
      </span>
    )}
  </div>
);

/**
 * Standard editorial card used in the "Latest news" grid.
 * Clicking anywhere opens the publisher's own article in a new tab.
 */
function ArticleCard({ article, priority = false }) {
  const hasDescription = Boolean(article.description);

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-xl border border-slate-800/60 bg-[#070c17]/60 transition-all duration-300 hover:-translate-y-0.5 hover:border-cyan-500/40 hover:bg-[#0a111f]/80 focus-within:border-cyan-500/50 focus-within:ring-1 focus-within:ring-cyan-500/30">
      <a
        href={article.url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex h-full flex-col outline-none"
        aria-label={`${article.title} — read the full story on ${article.source} (opens in a new tab)`}
      >
        <SafeImage
          src={article.imageUrl}
          alt={`Illustration for: ${article.title}`}
          label={categoryLabel(article.category, article.categoryLabel)}
          priority={priority}
          className="w-full border-b border-slate-800/60"
        />

        <div className="flex flex-1 flex-col gap-3 p-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`rounded border px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.16em] ${categoryTone(article.category)}`}>
              {categoryLabel(article.category, article.categoryLabel)}
            </span>
            <ArticleTags article={article} />
          </div>

          <h3 className="font-serif text-[17px] leading-snug text-slate-100 transition-colors group-hover:text-cyan-300">
            {article.title}
          </h3>

          {hasDescription ? (
            <p className="text-[12px] leading-relaxed text-slate-400">{article.description}</p>
          ) : (
            <p className="text-[12px] leading-relaxed text-slate-600 italic">
              This publisher only provides a headline in its feed — open the story for the full report.
            </p>
          )}

          {article.cveIds?.length > 0 && (
            <p className="font-mono text-[10px] text-cyan-600/90">{article.cveIds.slice(0, 3).join(' · ')}</p>
          )}

          <div className="mt-auto space-y-3 pt-3">
            <div className="border-t border-slate-800/60 pt-3">
              <SourceLine article={article} />
            </div>
            <MetaRow article={article} />
            <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-cyan-500 transition-colors group-hover:text-cyan-300">
              Read full story
              <ExternalLink size={11} aria-hidden="true" />
            </span>
          </div>
        </div>
      </a>
    </article>
  );
}

/** Memoised: article objects live in the hook's state, so cards only re-render
 *  when their own article (or priority flag) changes - e.g. never while the user
 *  is typing in the search box. */
export default React.memo(ArticleCard);

/** Compact row used in the sidebar lists. */
export function CompactArticle({ article, showImage = true }) {
  return (
    <article className="group">
      <a
        href={article.url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex gap-3 rounded-lg p-2 transition-colors hover:bg-slate-800/30 focus-visible:bg-slate-800/30 focus-visible:outline focus-visible:outline-1 focus-visible:outline-cyan-500/60"
      >
        {showImage && (
          <SafeImage
            src={article.imageUrl}
            alt=""
            ratio="4 / 3"
            className="h-14 w-20 shrink-0 rounded-md border border-slate-800/60"
            label=""
          />
        )}
        <div className="min-w-0 flex-1 space-y-1">
          <h4 className="line-clamp-3 font-serif text-[13px] leading-snug text-slate-200 transition-colors group-hover:text-cyan-300">
            {article.title}
          </h4>
          <p className="truncate text-[9px] font-bold uppercase tracking-[0.16em] text-slate-500">
            {article.source} · {timeAgo(article.publishedAt)}
          </p>
        </div>
      </a>
    </article>
  );
}
