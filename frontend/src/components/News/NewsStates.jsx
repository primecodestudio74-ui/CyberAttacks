import React from 'react';
import { AlertTriangle, Info, RefreshCw, SearchX, WifiOff } from 'lucide-react';

/** Skeleton card that mirrors the real card's shape (no layout shift). */
export function ArticleSkeleton() {
  return (
    <div className="flex h-full flex-col overflow-hidden rounded-xl border border-slate-800/60 bg-[#070c17]/50 motion-safe:animate-pulse">
      <div className="w-full border-b border-slate-800/60 bg-slate-800/40" style={{ aspectRatio: '16 / 9' }} />
      <div className="space-y-3 p-4">
        <div className="h-3 w-24 rounded bg-slate-800/70" />
        <div className="h-4 w-full rounded bg-slate-800/60" />
        <div className="h-4 w-4/5 rounded bg-slate-800/60" />
        <div className="h-3 w-full rounded bg-slate-800/40" />
        <div className="h-3 w-2/3 rounded bg-slate-800/40" />
        <div className="mt-4 h-3 w-28 rounded bg-slate-800/50" />
      </div>
    </div>
  );
}

export function FeaturedSkeleton() {
  return (
    <div
      className="relative flex min-h-[380px] items-end overflow-hidden rounded-3xl border border-slate-800/70 bg-[#070c17]/50 motion-safe:animate-pulse sm:min-h-[420px] lg:min-h-[460px]"
      style={{ aspectRatio: '16 / 9' }}
    >
      <div className="w-full space-y-3 p-6 sm:p-8 lg:p-10">
        <div className="h-3 w-24 rounded bg-slate-800/70" />
        <div className="h-6 w-full max-w-xl rounded bg-slate-800/60" />
        <div className="h-6 w-5/6 max-w-lg rounded bg-slate-800/60" />
        <div className="h-3 w-full max-w-md rounded bg-slate-800/40" />
        <div className="h-3 w-4/5 max-w-sm rounded bg-slate-800/40" />
      </div>
    </div>
  );
}

export function NewsGridSkeleton({ count = 6 }) {
  return (
    <div
      className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3"
      role="status"
      aria-live="polite"
      aria-label="Loading the latest cybersecurity news"
    >
      {Array.from({ length: count }, (_, index) => (
        <ArticleSkeleton key={index} />
      ))}
    </div>
  );
}

const NoticeShell = ({ tone = 'slate', icon, title, children, action }) => {
  const tones = {
    amber: 'border-amber-500/30 bg-amber-500/[0.07] text-amber-200',
    rose: 'border-rose-500/30 bg-rose-500/[0.07] text-rose-200',
    cyan: 'border-cyan-500/30 bg-cyan-500/[0.06] text-cyan-200',
    slate: 'border-slate-700/60 bg-slate-800/30 text-slate-300',
  };
  return (
    <div role="status" className={`flex flex-wrap items-center gap-3 rounded-xl border px-4 py-3 text-[12px] ${tones[tone]}`}>
      <span className="shrink-0" aria-hidden="true">
        {icon}
      </span>
      <p className="min-w-[12rem] flex-1 leading-relaxed">
        {title && <span className="font-bold">{title} </span>}
        {children}
      </p>
      {action}
    </div>
  );
};

/** Shown when the provider could not be reached but cached stories are served. */
export function StaleNotice({ lastUpdated, degradedSources = [], onRefresh, refreshing }) {
  const when = lastUpdated ? new Date(lastUpdated).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' }) : 'earlier';
  return (
    <NoticeShell
      tone="amber"
      icon={<WifiOff size={15} />}
      title="Showing cached stories."
      action={
        onRefresh && (
          <button
            type="button"
            onClick={onRefresh}
            disabled={refreshing}
            className="inline-flex items-center gap-2 rounded-lg border border-amber-500/40 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.16em] text-amber-200 transition-colors hover:bg-amber-500/10 disabled:opacity-50"
          >
            <RefreshCw size={11} className={refreshing ? 'motion-safe:animate-spin' : ''} aria-hidden="true" />
            Retry
          </button>
        )
      }
    >
      The last successful update was {when}
      {degradedSources.length > 0 ? ` and ${degradedSources.length} source${degradedSources.length === 1 ? '' : 's'} could not be reached` : ''}.
      These articles may not be current.
    </NoticeShell>
  );
}

export function SampleDataNotice() {
  return (
    <NoticeShell tone="cyan" icon={<Info size={15} />} title="Sample data.">
      This instance is running against local sample feeds (offline demo mode), not the live publisher newswire.
    </NoticeShell>
  );
}

/** Rate-limited by our own API. */
export function RateLimitNotice({ onRetry }) {
  return (
    <NoticeShell tone="amber" icon={<AlertTriangle size={15} />} title="Too many requests.">
      You have hit the request limit for the news feed. Please wait a minute before trying again.
      {onRetry && (
        <button type="button" onClick={onRetry} className="ml-2 underline decoration-dotted hover:text-amber-100">
          Try again now
        </button>
      )}
    </NoticeShell>
  );
}

/** Friendly failure state - never a raw provider error. */
export function ErrorState({ message, onRetry, retrying }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-slate-800/60 bg-[#070c17]/50 px-6 py-14 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-300" aria-hidden="true">
        <WifiOff size={20} />
      </span>
      <h3 className="text-base font-bold text-slate-200">Unable to load the latest cybersecurity news right now.</h3>
      <p className="max-w-md text-[12px] leading-relaxed text-slate-500">
        {message || 'The news sources are temporarily unavailable.'} Our team can see the provider status; meanwhile you can try
        the official advisories listed in the sidebar or try again.
      </p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          disabled={retrying}
          className="inline-flex items-center gap-2 rounded-lg border border-cyan-500/40 bg-cyan-500/10 px-4 py-2.5 text-[11px] font-black uppercase tracking-[0.18em] text-cyan-200 transition-colors hover:bg-cyan-500/20 disabled:opacity-60"
        >
          <RefreshCw size={12} className={retrying ? 'motion-safe:animate-spin' : ''} aria-hidden="true" />
          Try again
        </button>
      )}
    </div>
  );
}

/** Empty result state (search / category with no matches). */
export function EmptyState({ query, categoryLabel: label, onReset }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-slate-800 bg-[#070c17]/40 px-6 py-14 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-xl border border-slate-700/60 bg-slate-800/40 text-slate-500" aria-hidden="true">
        <SearchX size={20} />
      </span>
      <h3 className="text-base font-bold text-slate-200">No cybersecurity stories found.</h3>
      <p className="max-w-md text-[12px] leading-relaxed text-slate-500">
        {query
          ? `Nothing matches “${query}”${label ? ` in ${label}` : ''} in the current newswire. `
          : `No stories are available${label ? ` in ${label}` : ''} right now. `}
        Try another keyword or category - new stories arrive as sources publish them.
      </p>
      {onReset && (
        <button
          type="button"
          onClick={onReset}
          className="rounded-lg border border-slate-700 px-4 py-2.5 text-[11px] font-black uppercase tracking-[0.18em] text-slate-300 transition-colors hover:border-cyan-500/40 hover:text-cyan-200"
        >
          Reset filters
        </button>
      )}
    </div>
  );
}
