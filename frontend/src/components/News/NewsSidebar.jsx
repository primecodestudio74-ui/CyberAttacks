import React from 'react';
import { AlertOctagon, ExternalLink, Newspaper, ShieldCheck, TrendingUp } from 'lucide-react';
import { CompactArticle } from './ArticleCard';
import { shortDate } from '../../utils/newsFormat';

const Section = ({ title, icon, note, children, action }) => (
  <section className="rounded-xl border border-slate-800/60 bg-[#070c17]/50 p-4">
    <div className="mb-3 flex items-start justify-between gap-3 border-b border-slate-800/50 pb-2">
      <h2 className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.24em] text-cyan-500">
        <span aria-hidden="true">{icon}</span>
        {title}
      </h2>
      {action}
    </div>
    {note && <p className="mb-3 text-[10px] leading-relaxed text-slate-600">{note}</p>}
    {children}
  </section>
);

/**
 * Right-hand editorial sidebar.
 *
 * Sections are populated from the same fetched pool as the main feed. There is
 * no "trending" ranking: none of the sources we consume publish view or
 * engagement data, so instead we show (a) official advisories, (b) recency, and
 * (c) stories independently covered by more than one outlet - signals we can
 * actually observe.
 */
export default function NewsSidebar({ advisories = [], recent = [], widelyCovered = [], sources = [], trustedSources = [] }) {
  const healthySources = sources.filter((source) => source.status !== 'error');
  const failedSources = sources.filter((source) => source.status === 'error');

  return (
    <div className="space-y-4">
      <Section
        title="Latest Advisories"
        icon={<ShieldCheck size={12} />}
        note="Official alerts and advisories, straight from the issuing organisation."
      >
        {advisories.length === 0 ? (
          <p className="text-[11px] text-slate-500">No advisories in the current feed.</p>
        ) : (
          <ul className="space-y-3">
            {advisories.map((advisory) => (
              <li key={advisory.id} className="border-b border-slate-800/40 pb-3 last:border-0 last:pb-0">
                <a
                  href={advisory.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group block space-y-1 focus-visible:outline focus-visible:outline-1 focus-visible:outline-cyan-500/60"
                >
                  <p className="flex flex-wrap items-center gap-2 text-[9px] font-bold uppercase tracking-[0.14em] text-sky-400/90">
                    <AlertOctagon size={10} aria-hidden="true" />
                    {advisory.source}
                  </p>
                  <h3 className="font-serif text-[13px] leading-snug text-slate-200 group-hover:text-cyan-300">
                    {advisory.title}
                  </h3>
                  <p className="text-[10px] text-slate-500">
                    {advisory.dateLabel ? `${advisory.dateLabel}: ` : ''}
                    {shortDate(advisory.publishedAt)}
                  </p>
                </a>
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section
        title="Recent Security Stories"
        icon={<Newspaper size={12} />}
        note="Ordered by publication time. Our sources publish no view counts, so no popularity ranking is shown."
      >
        {recent.length === 0 ? (
          <p className="text-[11px] text-slate-500">No additional stories right now.</p>
        ) : (
          <ul className="space-y-1">
            {recent.map((article) => (
              <li key={article.id}>
                <CompactArticle article={article} />
              </li>
            ))}
          </ul>
        )}
      </Section>

      {widelyCovered.length > 0 && (
        <Section
          title="Covered by Multiple Outlets"
          icon={<TrendingUp size={12} />}
          note="Independently reported by more than one publisher in this newswire. This is the only coverage signal our sources expose - it is not a popularity score."
        >
          <ul className="space-y-3">
            {widelyCovered.map((article) => (
              <li key={article.id}>
                <a
                  href={article.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group block space-y-1 focus-visible:outline focus-visible:outline-1 focus-visible:outline-cyan-500/60"
                >
                  <h3 className="font-serif text-[13px] leading-snug text-slate-200 group-hover:text-cyan-300">
                    {article.title}
                  </h3>
                  <p className="text-[10px] text-slate-500">
                    {article.source} · also covered by {article.alsoCoveredBy.join(', ')}
                  </p>
                </a>
              </li>
            ))}
          </ul>
        </Section>
      )}

      <Section
        title="Trusted Sources"
        icon={<ShieldCheck size={12} />}
        note={
          healthySources.length
            ? `${healthySources.length} of ${sources.length} sources responded in the last update.`
            : undefined
        }
      >
        <ul className="flex flex-wrap gap-2">
          {trustedSources.map((source) => (
            <li key={source.url}>
              <a
                href={source.url}
                target="_blank"
                rel="noopener noreferrer"
                title={source.note}
                className="inline-flex items-center gap-1.5 rounded-full border border-slate-800/70 bg-slate-900/40 px-2.5 py-1 text-[10px] font-semibold text-slate-400 transition-colors hover:border-cyan-500/40 hover:text-cyan-200"
              >
                {source.name}
                <ExternalLink size={9} aria-hidden="true" />
              </a>
            </li>
          ))}
        </ul>
        {failedSources.length > 0 && (
          <p className="mt-3 text-[10px] leading-relaxed text-amber-300/80">
            Currently unreachable: {failedSources.map((source) => source.name).join(', ')}.
          </p>
        )}
      </Section>

      <p className="px-1 text-[10px] leading-relaxed text-slate-600">
        HackAware displays only headlines, short excerpts and links supplied by each publisher's public feed. Full articles
        remain on the publisher's site - we never copy or re-host their content.
      </p>
    </div>
  );
}
