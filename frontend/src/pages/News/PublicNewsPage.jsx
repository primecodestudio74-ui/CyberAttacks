import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, LayoutDashboard } from 'lucide-react';
import CyberNews from './CyberNews';

/**
 * Public Cyber News page (/news).
 *
 * The news API is intentionally unauthenticated (it serves public publisher
 * metadata), so the section is readable by visitors who are not signed in -
 * with a slim HackAware chrome instead of the full operator dashboard. The
 * authenticated in-dashboard entry point ("Cyber News" in the sidebar) renders
 * the very same component inside the dashboard shell.
 */
export default function PublicNewsPage() {
  const token = typeof window !== 'undefined' ? localStorage.getItem('operator_token') || localStorage.getItem('token') : null;

  return (
    <div className="min-h-screen bg-[#020617] text-slate-400">
      <header className="sticky top-0 z-30 border-b border-slate-800/60 bg-[#020617]/90 backdrop-blur-xl">
        <div className="mx-auto flex h-16 w-full max-w-[1440px] items-center justify-between px-4 lg:px-8">
          <Link
            to={token ? '/dashboard' : '/'}
            className="flex items-center gap-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-400"
          >
            <Shield className="text-cyan-500" size={16} aria-hidden="true" />
            <span className="text-[16px] font-black uppercase italic tracking-[0.15em] text-white">
              HACK<span className="text-cyan-500">AWARE</span>
            </span>
          </Link>

          <nav className="flex items-center gap-4" aria-label="Site">
            <Link
              to="/news"
              className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-400"
              aria-current="page"
            >
              Cyber News
            </Link>
            <Link
              to={token ? '/dashboard' : '/signin'}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-800 px-3 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-slate-300 transition-colors hover:border-cyan-500/40 hover:text-cyan-200"
            >
              <LayoutDashboard size={12} aria-hidden="true" />
              {token ? 'Dashboard' : 'Sign in'}
            </Link>
          </nav>
        </div>
      </header>

      <main>
        <CyberNews />
      </main>

      <footer className="mt-10 border-t border-slate-800/60 px-4 py-6 lg:px-8">
        <p className="mx-auto max-w-[1440px] text-[11px] leading-relaxed text-slate-600">
          Headlines, excerpts and links are supplied by each publisher's public feed and remain the property of the
          respective publisher. HackAware aggregates and links; it does not republish full articles.
        </p>
      </footer>
    </div>
  );
}
