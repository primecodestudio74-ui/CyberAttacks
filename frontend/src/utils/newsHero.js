/**
 * Selection + rotation helpers for the dashboard's cybersecurity news hero.
 *
 * The hero never fetches anything: it narrows the normalized articles already
 * returned by the shared `useNews` query (the same response that feeds the
 * floating ticker and the Cyber News page) down to a handful of display-ready
 * slides.
 *
 * Rules (all deterministic, nothing invented):
 *  - an article must have a usable headline and an absolute http(s) URL to be
 *    eligible at all - HackAware never fabricates links;
 *  - duplicates are removed by canonical URL and by headline, so the same story
 *    reported twice cannot occupy two slides;
 *  - sponsored posts are used only when nothing else is available;
 *  - ordering prefers what actually reads well in a hero (a real picture, a real
 *    excerpt, a recent publication timestamp that the publisher provided). No
 *    popularity, severity or "breaking news" score is invented anywhere;
 *  - at most two slides per publisher while other publishers are available.
 */

import { parseTimestamp } from './newsFormat.js';

/** Maximum number of hero slides. Fewer suitable stories simply means fewer slides. */
export const HERO_SLIDE_LIMIT = 5;

/** Automatic advance interval, in milliseconds. Change it here and nowhere else. */
export const HERO_AUTOPLAY_INTERVAL_MS = 6000;

/** Slide transition duration in milliseconds (shared with CyberNewsHero.css). */
export const HERO_TRANSITION_MS = 700;

/** Longest excerpt shown on a slide; the full description stays in the card feed. */
export const HERO_EXCERPT_LENGTH = 240;

/** How many slides one publisher may occupy while other publishers are available. */
const HERO_MAX_SLIDES_PER_SOURCE = 2;

/** How many slides either side of the active one mount their image element. */
const HERO_IMAGE_WINDOW = 1;

const MIN_TITLE_LENGTH = 12;

/** Replace control characters (including NUL) with spaces, like newsTicker does. */
const stripControlCharacters = (value) =>
  Array.from(value, (character) => {
    const code = character.charCodeAt(0);
    return code <= 0x1f || code === 0x7f ? ' ' : character;
  }).join('');

/**
 * Collapse control characters/whitespace and bound the length. Returns '' for
 * anything that is not usable text, so callers never render "undefined".
 */
export const cleanHeroText = (value, maxLength) => {
  if (typeof value !== 'string') return '';
  const collapsed = stripControlCharacters(value).replace(/\s+/g, ' ').trim();
  if (!collapsed) return '';
  if (collapsed.length <= maxLength) return collapsed;
  const clipped = collapsed.slice(0, maxLength);
  const lastSpace = clipped.lastIndexOf(' ');
  return `${(lastSpace > maxLength * 0.6 ? clipped.slice(0, lastSpace) : clipped).trimEnd()}…`;
};

/**
 * Validate an article destination. Only absolute http(s) URLs without embedded
 * credentials are accepted; the fragment and a trailing slash are dropped for
 * duplicate detection, while the publisher's original URL is what we link to.
 */
export const safeHeroUrl = (value) => {
  if (typeof value !== 'string' || !value.trim()) return null;
  const raw = value.trim();
  try {
    const parsed = new URL(raw);
    if (!['http:', 'https:'].includes(parsed.protocol) || !parsed.hostname) return null;
    if (parsed.username || parsed.password) return null;
    parsed.hash = '';
    const host = parsed.hostname.replace(/^www\./, '').toLowerCase();
    const pathname = parsed.pathname.replace(/\/+$/, '') || '/';
    // The key normalises www/trailing slash/fragment so the same story is not
    // featured twice; the link itself stays exactly as the publisher published it.
    return { url: raw, key: `${parsed.protocol}//${host}${parsed.port ? `:${parsed.port}` : ''}${pathname}${parsed.search}`, host };
  } catch {
    return null;
  }
};

/** Only http(s) image URLs are used; anything else falls back to the css art. */
export const safeHeroImageUrl = (value) => {
  if (typeof value !== 'string' || !value.trim()) return null;
  try {
    const parsed = new URL(value.trim());
    if (!['http:', 'https:'].includes(parsed.protocol) || !parsed.hostname) return null;
    if (parsed.username || parsed.password) return null;
    return value.trim();
  } catch {
    return null;
  }
};

const headlineKey = (title) =>
  title
    .normalize('NFKC')
    .toLocaleLowerCase()
    .replace(/[\p{P}\p{S}\s]+/gu, ' ')
    .trim();

/** Editorial usefulness of a story as a hero slide (ordering only, never shown). */
const heroScore = ({ hasImage, descriptionLength, ageHours, tags }) => {
  let score = 0;
  if (hasImage) score += 4;
  if (descriptionLength >= 80) score += 3;
  else if (descriptionLength > 0) score += 1;
  if (ageHours !== null) {
    if (ageHours <= 24) score += 4;
    else if (ageHours <= 72) score += 2;
  }
  if (tags.includes('Exploited in the wild')) score += 1;
  return score;
};

const toCandidate = (article, order) => {
  if (!article || typeof article !== 'object' || Array.isArray(article)) return null;

  const title = cleanHeroText(article.title, 220);
  if (title.length < MIN_TITLE_LENGTH) return null;

  const destination = safeHeroUrl(article.url);
  if (!destination) return null;

  const description = cleanHeroText(article.description, HERO_EXCERPT_LENGTH);
  const imageUrl = safeHeroImageUrl(article.imageUrl);
  const publishedTime = parseTimestamp(article.publishedAt);
  const publishedAt = publishedTime === null ? null : article.publishedAt;
  const ageHours = publishedTime === null ? null : (Date.now() - publishedTime) / 3_600_000;
  const tags = Array.isArray(article.tags) ? article.tags.filter((tag) => typeof tag === 'string') : [];

  return {
    order,
    key: destination.key,
    titleKey: headlineKey(title),
    publishedTime,
    score: heroScore({ hasImage: Boolean(imageUrl), descriptionLength: description.length, ageHours, tags }),
    sponsored: tags.includes('Sponsored'),
    slide: {
      key: destination.key,
      id: cleanHeroText(article.id, 160) || destination.key,
      title,
      excerpt: description || null,
      imageUrl,
      imageAlt: '',
      source: cleanHeroText(article.source, 100) || null,
      publishedAt,
      category: cleanHeroText(article.category, 60) || 'general-cyber',
      categoryLabel: cleanHeroText(article.categoryLabel, 80) || null,
      tags,
      isAdvisory: Boolean(article.isAdvisory),
      url: destination.url,
    },
  };
};

/**
 * Pick up to `limit` hero slides from a news payload.
 *
 * @param {{featured?: object|null, articles?: object[]}|object[]} newsData shared
 *   `useNews` result (a bare article array also works)
 * @param {{limit?: number}} [options]
 * @returns {object[]} slides, best first, each with a stable `key`
 */
export const selectHeroSlides = (newsData, { limit = HERO_SLIDE_LIMIT } = {}) => {
  const safeLimit = Number.isFinite(limit) ? Math.max(0, Math.floor(limit)) : HERO_SLIDE_LIMIT;
  if (safeLimit === 0) return [];

  const source = Array.isArray(newsData) ? newsData : newsData?.articles;
  const candidates = [];
  if (!Array.isArray(newsData) && newsData?.featured) candidates.push(newsData.featured);
  if (Array.isArray(source)) candidates.push(...source);
  if (!candidates.length) return [];

  const seenUrls = new Set();
  const seenTitles = new Set();
  const entries = [];

  candidates.forEach((article, order) => {
    const entry = toCandidate(article, order);
    if (!entry) return;
    if (seenUrls.has(entry.key) || seenTitles.has(entry.titleKey)) return;
    seenUrls.add(entry.key);
    seenTitles.add(entry.titleKey);
    entries.push(entry);
  });

  // Editorial usefulness first, then the freshest publisher timestamp, then the
  // order the API returned (newest-first). No popularity or severity is invented.
  entries.sort(
    (a, b) =>
      b.score - a.score ||
      (b.publishedTime ?? Number.NEGATIVE_INFINITY) - (a.publishedTime ?? Number.NEGATIVE_INFINITY) ||
      a.order - b.order
  );

  // Promotional posts only appear when the newswire genuinely has nothing else.
  const editorial = entries.filter((entry) => !entry.sponsored);
  const pool = editorial.length ? editorial : entries;

  const picked = [];
  const used = new Set();
  const perSource = new Map();

  const take = (entry) => {
    picked.push(entry.slide);
    used.add(entry.order);
    const sourceKey = entry.slide.source || `__source_${entry.order}`;
    perSource.set(sourceKey, (perSource.get(sourceKey) || 0) + 1);
  };

  // Pass 1 respects the per-publisher cap so the hero mixes outlets...
  for (const entry of pool) {
    if (picked.length >= safeLimit) break;
    const sourceKey = entry.slide.source || `__source_${entry.order}`;
    if ((perSource.get(sourceKey) || 0) >= HERO_MAX_SLIDES_PER_SOURCE) continue;
    take(entry);
  }

  // ...pass 2 fills any remaining slots when only one publisher has coverage.
  for (const entry of pool) {
    if (picked.length >= safeLimit) break;
    if (used.has(entry.order)) continue;
    take(entry);
  }

  return picked;
};

/**
 * Decide whether the carousel may advance on its own right now.
 *
 * Rotation stops for: a single story, the user's reduced-motion preference
 * (manual navigation then carries the interaction), the explicit pause button,
 * a hovered pointer, keyboard focus inside the widget, and a hidden tab. Every
 * one of those is a reason to leave the headline on screen.
 */
export const shouldAutoRotate = ({
  slideCount = 0,
  prefersReducedMotion = false,
  pausedByUser = false,
  hovered = false,
  focused = false,
  pageHidden = false,
} = {}) =>
  slideCount > 1 && !prefersReducedMotion && !pausedByUser && !hovered && !focused && !pageHidden;

/** Clamp any index into `[0, total)`. */
export const normalizeSlideIndex = (index, total) => {
  if (!Number.isFinite(total) || total <= 0) return 0;
  const current = Number.isFinite(index) ? Math.trunc(index) : 0;
  return ((current % total) + total) % total;
};

/** Next slide, wrapping from the last back to the first. */
export const nextSlideIndex = (index, total) =>
  total > 0 ? (normalizeSlideIndex(index, total) + 1) % Math.trunc(total) : 0;

/** Previous slide, wrapping from the first back to the last. */
export const previousSlideIndex = (index, total) =>
  total > 0 ? (normalizeSlideIndex(index, total) - 1 + Math.trunc(total)) % Math.trunc(total) : 0;

/**
 * Whether a slide is close enough to the active one to mount its <img>.
 * The active slide and its two neighbours load; distant slides wait until the
 * viewer moves near them, so the hero never pulls every banner image at once.
 */
export const isWithinImageWindow = (index, activeIndex, total, radius = HERO_IMAGE_WINDOW) => {
  if (!Number.isFinite(total) || total <= 0) return false;
  if (total <= radius * 2 + 1) return true;
  const distance = Math.abs(normalizeSlideIndex(index, total) - normalizeSlideIndex(activeIndex, total));
  return Math.min(distance, total - distance) <= radius;
};

export default selectHeroSlides;
