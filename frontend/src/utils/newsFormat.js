/**
 * Formatting helpers for the Cyber News UI.
 *
 * Every helper is defensive: article timestamps come from third-party feeds and
 * may be missing or invalid, and the UI must never render "undefined",
 * "Invalid Date" or "NaN".
 */

const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

/** Parse an ISO timestamp, returning null for anything unusable. */
export const parseTimestamp = (value) => {
  if (!value || typeof value !== 'string') return null;
  const time = Date.parse(value);
  return Number.isNaN(time) ? null : time;
};

/**
 * Relative publication time ("20 minutes ago").
 * `dateLabel` lets a source describe what the timestamp means (for example a
 * CISA KEV entry says "Added to CISA KEV" rather than "published").
 */
export const timeAgo = (value, now = Date.now()) => {
  const time = parseTimestamp(value);
  if (time === null) return 'Time not provided';
  const diff = now - time;
  if (diff < 45 * 1000) return 'Just now';
  if (diff < HOUR) {
    const minutes = Math.max(1, Math.round(diff / MINUTE));
    return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;
  }
  if (diff < DAY) {
    const hours = Math.round(diff / HOUR);
    return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  }
  if (diff < 7 * DAY) {
    const days = Math.round(diff / DAY);
    return `${days} day${days === 1 ? '' : 's'} ago`;
  }
  return exactDate(value, { withTime: false });
};

/** Accessible absolute date, e.g. "12 October 2026" or "12 Oct 2026, 10:32 UTC". */
export const exactDate = (value, { withTime = true } = {}) => {
  const time = parseTimestamp(value);
  if (time === null) return 'Date not provided';
  const date = new Date(time);
  const datePart = date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  if (!withTime) return datePart;
  const timePart = date.toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'UTC',
    hour12: false,
  });
  return `${datePart}, ${timePart} UTC`;
};

/** Short date used in the sidebar, e.g. "12 Oct 2026". */
export const shortDate = (value) => {
  const time = parseTimestamp(value);
  if (time === null) return '—';
  return new Date(time).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
};

/** hostname of an article URL, used for the source favicon. */
export const hostOf = (url) => {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return null;
  }
};

/**
 * Privacy-friendly favicon for a publisher (no tracking, no API key).
 * Returns null when the URL is unusable so callers can fall back to initials.
 */
export const faviconFor = (url, size = 64) => {
  const host = hostOf(url);
  if (!host) return null;
  return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(host)}&sz=${size}`;
};

const CATEGORY_LABELS = {
  'all-news': 'All News',
  'cyber-attacks': 'Cyber Attacks',
  'data-breaches': 'Data Breaches',
  'hacking-exploits': 'Hacking & Exploits',
  'ai-security': 'AI Security',
  'cybercrime-scams': 'Cybercrime & Scams',
  'vulnerabilities-cves': 'Vulnerabilities & CVEs',
  'india-cyber': 'India Cyber News',
  'government-advisories': 'Government & Advisories',
  'cloud-enterprise-security': 'Cloud & Enterprise',
  'general-cyber': 'Cybersecurity',
};

export const categoryLabel = (id, fallback) => CATEGORY_LABELS[id] || fallback || 'Cybersecurity';

/** Tone for a category badge - never the only signal (text is always shown). */
export const categoryTone = (id) => {
  switch (id) {
    case 'cyber-attacks':
      return 'text-rose-300 bg-rose-500/10 border-rose-500/25';
    case 'data-breaches':
      return 'text-amber-300 bg-amber-500/10 border-amber-500/25';
    case 'hacking-exploits':
      return 'text-orange-300 bg-orange-500/10 border-orange-500/25';
    case 'ai-security':
      return 'text-fuchsia-300 bg-fuchsia-500/10 border-fuchsia-500/25';
    case 'cybercrime-scams':
      return 'text-yellow-300 bg-yellow-500/10 border-yellow-500/25';
    case 'vulnerabilities-cves':
      return 'text-cyan-300 bg-cyan-500/10 border-cyan-500/25';
    case 'india-cyber':
      return 'text-emerald-300 bg-emerald-500/10 border-emerald-500/25';
    case 'government-advisories':
      return 'text-sky-300 bg-sky-500/10 border-sky-500/25';
    case 'cloud-enterprise-security':
      return 'text-indigo-300 bg-indigo-500/10 border-indigo-500/25';
    default:
      return 'text-slate-300 bg-slate-500/10 border-slate-500/25';
  }
};

/** Initials fallback for a thumbnail/source mark. */
export const initialsOf = (name) =>
  String(name || '?')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0].toUpperCase())
    .join('');
