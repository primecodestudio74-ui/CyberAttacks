/**
 * Sanitisation helpers for untrusted external feed data.
 *
 * Everything that arrives from a publisher feed is treated as hostile input:
 * it is stripped of markup before it reaches the API response, URLs are
 * validated to http(s) only, and dates are parsed defensively so the UI can
 * never receive `undefined`, `NaN` or `Invalid Date`.
 *
 * No HTML parsing library is used on purpose - tags are removed (not
 * interpreted), so there is no markup surface for stored XSS to hide in.
 */

import { createHash } from 'node:crypto';

/* ------------------------------------------------------------------ *
 * Text
 * ------------------------------------------------------------------ */

const NAMED_ENTITIES = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: ' ',
  ndash: '\u2013',
  mdash: '\u2014',
  hellip: '\u2026',
  lsquo: '\u2018',
  rsquo: '\u2019',
  ldquo: '\u201c',
  rdquo: '\u201d',
  laquo: '\u00ab',
  raquo: '\u00bb',
  middot: '\u00b7',
  bull: '\u2022',
  deg: '\u00b0',
  euro: '\u20ac',
  pound: '\u00a3',
  copy: '\u00a9',
  reg: '\u00ae',
  trade: '\u2122',
  times: '\u00d7',
  minus: '\u2212',
  prime: '\u2032',
  rarr: '\u2192',
  larr: '\u2190',
  check: '\u2713',
  warn: '\u26a0',
};

/**
 * Decode the standard XML/HTML entities only. Custom entities declared inside a
 * DOCTYPE are deliberately NOT expanded (that is how entity-expansion
 * ("billion laughs") payloads work).
 */
export const decodeEntities = (input) => {
  if (typeof input !== 'string' || !input) return '';
  return input.replace(/&(#x?[0-9a-fA-F]+|[a-zA-Z][a-zA-Z0-9]{1,31});/g, (match, entity) => {
    if (entity.startsWith('#x') || entity.startsWith('#X')) {
      const code = Number.parseInt(entity.slice(2), 16);
      return Number.isFinite(code) && code > 0 && code <= 0x10ffff ? safeFromCodePoint(code) : match;
    }
    if (entity.startsWith('#')) {
      const code = Number.parseInt(entity.slice(1), 10);
      return Number.isFinite(code) && code > 0 && code <= 0x10ffff ? safeFromCodePoint(code) : match;
    }
    const named = NAMED_ENTITIES[entity] ?? NAMED_ENTITIES[entity.toLowerCase()];
    return named ?? match;
  });
};

const safeFromCodePoint = (code) => {
  // Never allow C0/C1 control characters through - they can be used to break
  // log lines or terminal output downstream.
  if (code < 0x20 && code !== 0x09 && code !== 0x0a && code !== 0x0d) return ' ';
  try {
    return String.fromCodePoint(code);
  } catch {
    return '';
  }
};

/** Remove <script>/<style> blocks including their contents. */
const stripDangerousBlocks = (html) =>
  html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script\s*>/gi, ' ')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style\s*>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<!\[CDATA\[|\]\]>/g, ' ');

/**
 * Convert an HTML fragment from a feed into plain text. Tags are replaced with a
 * space (block-level tags with a blank line) so words never run together.
 */
export const htmlToPlainText = (html) => {
  if (typeof html !== 'string' || !html) return '';
  const withoutBlocks = stripDangerousBlocks(html);
  const withBreaks = withoutBlocks
    .replace(/<\s*br\s*\/?\s*>/gi, '\n')
    .replace(/<\s*\/\s*(p|div|li|ul|ol|h[1-6]|blockquote|tr|table|section)\s*>/gi, '\n')
    .replace(/<[^>]*>/g, ' ');
  return decodeEntities(withBreaks)
    // Entities such as &lt;script&gt; become text only *after* decoding, so run a
    // second sweep: markup-looking "<...>" is removed, a bare "<" is left alone
    // so comparisons in prose survive.
    .replace(/<(?=[a-zA-Z/!?])[^>]*>/g, ' ')
    .replace(/\u00a0/g, ' ')
    .replace(/[ \t\f\v]+/g, ' ')
    .replace(/\s*\n\s*/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
};

/**
 * Single-line plain text (used for titles, authors and excerpts).
 * As a final defence-in-depth step every remaining angle bracket is removed, so
 * the API can never emit anything that looks like markup - even if a publisher
 * double-encoded it.
 */
export const cleanText = (value, maxLength = 0) => {
  const text = htmlToPlainText(value)
    .replace(/[<>]/g, ' ')
    .replace(/\s*\n+\s*/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim();
  return maxLength > 0 ? truncate(text, maxLength) : text;
};

/** Truncate on a word boundary, never mid-word, and never mid-entity. */
export const truncate = (text, maxLength) => {
  if (typeof text !== 'string') return '';
  if (!maxLength || text.length <= maxLength) return text;
  const slice = text.slice(0, maxLength);
  const lastSpace = slice.lastIndexOf(' ');
  const clipped = lastSpace > maxLength * 0.6 ? slice.slice(0, lastSpace) : slice;
  return `${clipped.replace(/[\s,;:.!?\-–—]+$/, '')}\u2026`;
};

/**
 * Build a short excerpt from a feed description. Publishers often repeat the
 * title inside the description and/or append "The post ... appeared first on
 * ..." boilerplate - both are removed so the card shows real, useful text.
 */
export const buildExcerpt = (description, { title = '', maxLength = 260 } = {}) => {
  let text = cleanText(description);
  if (!text) return '';
  text = text
    .replace(/The post .*? appeared first on .*?\.?$/i, '')
    .replace(/Continue reading.*$/i, '')
    .replace(/Read more.*$/i, '')
    .replace(/\[?\s*(More|Read more|Continue)\s*(\u2192|->)?\s*\]?\.?$/i, '')
    .replace(/\s*\|\s*[A-Z][\w&.-]*(?:News|Security|Times|Post|Wire)?\s*$/, '')
    .trim();
  if (!text) return '';

  const normalizedTitle = title.toLowerCase().replace(/[^a-z0-9 ]+/g, ' ').replace(/\s+/g, ' ').trim();
  const normalizedText = text.toLowerCase().replace(/[^a-z0-9 ]+/g, ' ').replace(/\s+/g, ' ').trim();
  if (normalizedTitle && normalizedText.startsWith(normalizedTitle)) {
    text = text.slice(Math.min(text.length, title.length)).replace(/^[\s:.\-\u2013\u2014|]+/, '').trim();
  }
  if (!text) return '';
  return truncate(text, maxLength);
};

/* ------------------------------------------------------------------ *
 * URLs
 * ------------------------------------------------------------------ */

const CONTROL_CHARS = /[\u0000-\u001f\u007f]/;

/**
 * Validate a link coming from a feed. Returns a normalised absolute http(s) URL
 * or null. `javascript:`, `data:`, `vbscript:`, `file:` and every other scheme
 * are rejected, as are URLs that embed credentials.
 */
export const safeHttpUrl = (value, { allowLocal = false } = {}) => {
  if (typeof value !== 'string') return null;
  const raw = value.trim();
  if (!raw || raw.length > 2048 || CONTROL_CHARS.test(raw)) return null;

  let parsed;
  try {
    parsed = new URL(raw);
  } catch {
    return null;
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return null;
  if (parsed.username || parsed.password) return null;
  if (!parsed.hostname.includes('.') && parsed.hostname !== 'localhost') return null;
  if (!allowLocal && isPrivateHost(parsed.hostname)) return null;

  return parsed.toString();
};

/** Reject loopback / link-local / private-range hosts (SSRF guard). */
export const isPrivateHost = (hostname) => {
  if (typeof hostname !== 'string') return true;
  const host = hostname.toLowerCase().replace(/^\[|\]$/g, '');
  if (host === 'localhost' || host.endsWith('.localhost') || host.endsWith('.local')) return true;
  if (host === '::1' || host === '::' || host.startsWith('fc') || host.startsWith('fd') || host.startsWith('fe80')) return true;

  const ipv4 = host.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (ipv4) {
    const [a, b] = ipv4.slice(1).map((part) => Number.parseInt(part, 10));
    if ([a, b].some((part) => Number.isNaN(part))) return true;
    if (a === 10 || a === 127 || a === 0) return true;
    if (a === 169 && b === 254) return true;
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 192 && b === 168) return true;
    if (a === 100 && b >= 64 && b <= 127) return true;
    return false;
  }
  // Any other host must be a DNS name with a dot (validated by safeHttpUrl).
  return !/^[a-z0-9.-]+$/.test(host);
};

/** Image URLs are held to the same rules, plus a couple of image-specific ones. */
export const safeImageUrl = (value, options) => {
  const url = safeHttpUrl(value, options);
  if (!url) return null;
  const lower = url.toLowerCase();
  if (lower.startsWith('data:') || lower.startsWith('blob:')) return null;
  if (/\.svg(\?|#|$)/.test(lower)) return null; // never render publisher SVG
  if (/\.(php|aspx?|cgi|jsp)(\?|$)/.test(lower)) return null; // tracking pixels
  return url;
};

const TRACKING_PARAMS = [
  'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'utm_id',
  'fbclid', 'gclid', 'mc_cid', 'mc_eid', 'igshid', 'ref', 'referrer', 'source',
  'at_medium', 'at_campaign', 's_kwcid', 'cmpid', 'cid', 'spm', 'sr_share',
];

/**
 * Canonical form of an article URL: used as the article's stable id and for
 * de-duplication, so the same story from the same publisher never appears
 * twice because of tracking parameters or a fragment.
 */
export const canonicalUrl = (value) => {
  const url = safeHttpUrl(value, { allowLocal: true });
  if (!url) return null;
  try {
    const parsed = new URL(url);
    parsed.hash = '';
    parsed.protocol = 'https:';
    parsed.hostname = parsed.hostname.replace(/^www\./, '').toLowerCase();
    for (const param of TRACKING_PARAMS) parsed.searchParams.delete(param);
    let pathname = parsed.pathname.replace(/\/index\.html?$/i, '/').replace(/\/{2,}/g, '/');
    if (pathname.length > 1) pathname = pathname.replace(/\/$/, '');
    parsed.pathname = pathname;
    parsed.search = parsed.searchParams.toString() ? `?${parsed.searchParams.toString()}` : '';
    return parsed.toString();
  } catch {
    return null;
  }
};

/** Stable, non-reversible identifier for an article (sha1 of the canonical URL). */
export const stableId = (input) => {
  const digest = createHash('sha1').update(String(input ?? '')).digest('hex').slice(0, 16);
  return `news_${digest}`;
};

/** Normalised title used for cross-publisher de-duplication. */
export const titleKey = (title) =>
  String(title || '')
    .toLowerCase()
    .replace(/\s+[-|–—]\s+[a-z0-9 .&']{2,30}$/i, '') // trailing "- Publisher" suffixes
    .replace(/[^a-z0-9 ]+/g, ' ')
    .replace(/\b(the|a|an|of|to|in|on|for|and|with|its|is|are|at|by|from|new)\b/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

/* ------------------------------------------------------------------ *
 * Dates
 * ------------------------------------------------------------------ */

const MAX_FUTURE_MS = 2 * 60 * 60 * 1000; // tolerate small clock skew, reject nonsense

/**
 * Parse a publication date from a feed. Returns an ISO string or null.
 * Invalid values are dropped rather than passed to the UI.
 */
export const parseDate = (value) => {
  if (value == null) return null;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value.toISOString();
  if (typeof value !== 'string' && typeof value !== 'number') return null;

  let input = String(value).trim();
  if (!input || input.length > 60) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(input)) input = `${input}T00:00:00.000Z`;

  const parsed = new Date(input);
  if (Number.isNaN(parsed.getTime())) return null;
  if (parsed.getTime() > Date.now() + MAX_FUTURE_MS) return null;
  return parsed.toISOString();
};

export const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
