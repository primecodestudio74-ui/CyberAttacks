import React, { useId } from 'react';
import { Loader2, RefreshCw, Search, X } from 'lucide-react';
import { exactDate, timeAgo } from '../../utils/newsFormat';

/**
 * Masthead for the news section: title, subtitle, last-updated stamp, search
 * box and manual refresh. Every control has a programmatic label and a visible
 * focus ring; search and refresh stay reachable at all viewport sizes.
 */
export default function NewsHeader({
  searchValue,
  onSearchChange,
  onSearchSubmit,
  onClearSearch,
  onRefresh,
  refreshing = false,
  lastUpdated,
  stale = false,
  isSearchPending = false,
  resultSummary,
}) {
  const inputId = useId();

  return (
    <header className="space-y-5 border-b border-slate-800/60 pb-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          <p className="text-[10px] font-black uppercase tracking-[0.35em] text-cyan-500">HackAware Intelligence Desk</p>
          <h1 className="mt-2 font-serif text-3xl leading-tight text-white lg:text-[42px]">Cybersecurity News</h1>
          <p className="mt-2 max-w-2xl text-[13px] leading-relaxed text-slate-400">
            Stay informed about the latest cyber threats, security breaches, vulnerabilities, and digital security
            developments.
          </p>
        </div>

        <div className="flex shrink-0 flex-col items-start gap-2 lg:items-end">
          <span
            className="inline-flex items-center gap-2 rounded-lg border border-slate-800/70 bg-slate-900/40 px-3 py-1.5 text-[10px] font-medium text-slate-400"
            title={lastUpdated ? exactDate(lastUpdated) : undefined}
          >
            <span
              aria-hidden="true"
              className={`h-1.5 w-1.5 rounded-full ${stale ? 'bg-amber-400' : 'bg-emerald-400 motion-safe:animate-pulse'}`}
            />
            {lastUpdated ? `Last updated ${timeAgo(lastUpdated)}` : 'Waiting for first update'}
          </span>
          <p className="text-[10px] leading-relaxed text-slate-600">
            New stories appear here as our sources publish them.
          </p>
        </div>
      </div>

      <form
        role="search"
        onSubmit={(event) => {
          event.preventDefault();
          onSearchSubmit?.();
        }}
        className="flex flex-col gap-3 sm:flex-row sm:items-center"
      >
        <label htmlFor={inputId} className="sr-only">
          Search cybersecurity news
        </label>
        <div className="relative flex-1">
          <Search
            size={15}
            aria-hidden="true"
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
          />
          <input
            id={inputId}
            type="search"
            value={searchValue}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search ransomware, zero-day, CVE, data breach, India…"
            autoComplete="off"
            className="w-full rounded-xl border border-slate-800/80 bg-[#070c17] py-3 pl-9 pr-10 text-[13px] text-slate-200 placeholder:text-slate-600 transition-colors focus:border-cyan-500/60 focus:outline-none focus:ring-1 focus:ring-cyan-500/40"
          />
          {searchValue && (
            <button
              type="button"
              onClick={onClearSearch}
              aria-label="Clear search"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-500 transition-colors hover:text-slate-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-500/60"
            >
              <X size={14} aria-hidden="true" />
            </button>
          )}
        </div>

        <button
          type="submit"
          className="rounded-xl border border-cyan-500/40 bg-cyan-500/10 px-4 py-3 text-[11px] font-black uppercase tracking-[0.18em] text-cyan-200 transition-colors hover:bg-cyan-500/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-400 sm:w-auto"
        >
          Search
        </button>

        <button
          type="button"
          onClick={onRefresh}
          disabled={refreshing}
          aria-busy={refreshing}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-800/80 px-4 py-3 text-[11px] font-black uppercase tracking-[0.18em] text-slate-300 transition-colors hover:border-cyan-500/40 hover:text-cyan-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-400 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {refreshing ? (
            <Loader2 size={13} className="motion-safe:animate-spin" aria-hidden="true" />
          ) : (
            <RefreshCw size={13} aria-hidden="true" />
          )}
          {refreshing ? 'Refreshing' : 'Refresh'}
        </button>
      </form>

      <p aria-live="polite" className="min-h-[1rem] text-[11px] text-slate-500">
        {isSearchPending ? 'Searching…' : resultSummary}
      </p>
    </header>
  );
}
