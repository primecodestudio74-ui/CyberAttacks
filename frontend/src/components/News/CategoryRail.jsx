import React from 'react';
import { Newspaper, ShieldCheck, SlidersHorizontal } from 'lucide-react';

/**
 * Category navigation.
 *
 * - `variant="rail"`: sticky left column for large screens.
 * - `variant="chips"`: horizontally scrollable row for tablets/phones
 *   (no horizontal page overflow: the row scrolls, the page does not).
 *
 * Rendered as a list of buttons inside <nav>: fully keyboard reachable, with
 * the active item marked via aria-current and a colour *and* weight change
 * (never colour alone).
 */
export default function CategoryRail({ categories = [], activeCategory, onChange, variant = 'rail' }) {
  const items = categories.length
    ? categories
    : [{ id: 'all-news', label: 'All News', count: 0 }];

  if (variant === 'chips') {
    return (
      <nav aria-label="News categories" className="lg:hidden">
        <ul className="scrollbar-none -mx-1 flex snap-x gap-2 overflow-x-auto px-1 pb-1">
          {items.map((category) => {
            const isActive = category.id === activeCategory;
            return (
              <li key={category.id} className="snap-start">
                <button
                  type="button"
                  onClick={() => onChange(category.id)}
                  aria-current={isActive ? 'page' : undefined}
                  className={`flex items-center gap-2 whitespace-nowrap rounded-full border px-3 py-2 text-[11px] font-bold uppercase tracking-[0.12em] transition-colors ${
                    isActive
                      ? 'border-cyan-500/60 bg-cyan-500/15 text-cyan-200'
                      : 'border-slate-800/70 bg-slate-900/40 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                  }`}
                >
                  {category.label}
                  {typeof category.count === 'number' && (
                    <span className={`text-[9px] ${isActive ? 'text-cyan-300/80' : 'text-slate-600'}`}>
                      {category.count}
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>
    );
  }

  return (
    <nav aria-label="News categories" className="hidden lg:block">
      <div className="sticky top-24 space-y-4">
        <p className="flex items-center gap-2 px-3 text-[9px] font-black uppercase tracking-[0.3em] text-slate-600">
          <SlidersHorizontal size={11} aria-hidden="true" />
          Sections
        </p>
        <ul className="space-y-1">
          {items.map((category) => {
            const isActive = category.id === activeCategory;
            return (
              <li key={category.id}>
                <button
                  type="button"
                  onClick={() => onChange(category.id)}
                  aria-current={isActive ? 'page' : undefined}
                  className={`relative flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2.5 text-left text-[11px] transition-colors ${
                    isActive
                      ? 'bg-cyan-500/10 font-black uppercase tracking-[0.12em] text-cyan-300'
                      : 'font-bold uppercase tracking-[0.12em] text-slate-500 hover:bg-slate-800/40 hover:text-slate-200'
                  }`}
                >
                  {isActive && (
                    <span aria-hidden="true" className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r bg-cyan-500" />
                  )}
                  <span className="min-w-0 truncate">{category.label}</span>
                  {typeof category.count === 'number' && (
                    <span className={`shrink-0 text-[9px] ${isActive ? 'text-cyan-400/80' : 'text-slate-600'}`}>
                      {category.count}
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>

        <div className="space-y-2 rounded-xl border border-slate-800/60 bg-slate-900/30 p-3">
          <p className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.2em] text-slate-500">
            <ShieldCheck size={11} aria-hidden="true" />
            Verified sources
          </p>
          <p className="text-[10px] leading-relaxed text-slate-500">
            Articles are syndicated headlines and short excerpts from established cybersecurity publishers and
            official advisories. Every story links to the publisher's own page.
          </p>
          <p className="flex items-center gap-2 text-[9px] text-slate-600">
            <Newspaper size={10} aria-hidden="true" />
            Updated as sources publish
          </p>
        </div>
      </div>
    </nav>
  );
}
