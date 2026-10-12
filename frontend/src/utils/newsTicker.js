/**
 * Narrow the normalized Cyber News feed down to safe, display-ready ticker
 * stories. The API is already normalized and de-duplicated; these checks are a
 * small defensive boundary for the floating UI, not a second news pipeline.
 */
import { parseTimestamp } from './newsFormat.js';

const DEFAULT_TICKER_LIMIT = 5;

const cleanText = (value, maxLength = 120) => {
  if (typeof value !== 'string') return '';
  const withoutControlCharacters = Array.from(value, (character) => {
    const code = character.charCodeAt(0);
    return code <= 0x1f || code === 0x7f ? ' ' : character;
  }).join('');
  return withoutControlCharacters.replace(/\s+/g, ' ').trim().slice(0, maxLength);
};

const safeArticleDestination = (value) => {
  if (typeof value !== 'string' || !value.trim()) return null;

  const rawUrl = value.trim();
  try {
    const parsed = new URL(rawUrl);
    if (!['http:', 'https:'].includes(parsed.protocol) || !parsed.hostname) return null;
    if (parsed.username || parsed.password) return null;

    // Remove fragments and a trailing slash only for duplicate detection. Keep
    // the publisher's original URL as the actual link shown to the user.
    parsed.hash = '';
    const pathname = parsed.pathname.replace(/\/+$/, '') || '/';
    return {
      url: rawUrl,
      key: `${parsed.origin}${pathname}${parsed.search}`,
    };
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

/**
 * Return at most `limit` recent, unique stories with an absolute HTTP(S) URL.
 * Invalid titles/URLs are ignored and missing optional metadata stays empty.
 */
export const prepareTickerArticles = (articles, limit = DEFAULT_TICKER_LIMIT) => {
  if (!Array.isArray(articles)) return [];

  const safeLimit = Number.isFinite(limit) ? Math.max(0, Math.floor(limit)) : DEFAULT_TICKER_LIMIT;
  if (safeLimit === 0) return [];

  const candidates = articles
    .map((article, index) => {
      if (!article || typeof article !== 'object' || Array.isArray(article)) return null;

      const title = cleanText(article.title, 300);
      const destination = safeArticleDestination(article.url);
      const titleKeyValue = headlineKey(title);
      if (!title || !titleKeyValue || !destination) return null;

      const publishedAt = parseTimestamp(article.publishedAt) === null ? null : article.publishedAt;
      const source = cleanText(article.source, 100);
      const id = cleanText(article.id, 160);

      return {
        key: destination.key,
        id: id || destination.key,
        title,
        url: destination.url,
        source,
        publishedAt,
        timestamp: publishedAt ? parseTimestamp(publishedAt) : null,
        originalIndex: index,
      };
    })
    .filter(Boolean)
    // The normal API is newest-first. Sorting here also keeps the ticker recent
    // if the dashboard's News tab is currently filtered or sorted oldest-first.
    .sort((a, b) => {
      const aTime = a.timestamp ?? Number.NEGATIVE_INFINITY;
      const bTime = b.timestamp ?? Number.NEGATIVE_INFINITY;
      return bTime - aTime || a.originalIndex - b.originalIndex;
    });

  const seenTitles = new Set();
  const seenUrls = new Set();
  const unique = [];

  for (const article of candidates) {
    const titleKeyValue = headlineKey(article.title);
    if (seenTitles.has(titleKeyValue) || seenUrls.has(article.key)) continue;
    seenTitles.add(titleKeyValue);
    seenUrls.add(article.key);
    // Internal helper fields do not need to cross the component boundary.
    unique.push({
      key: article.key,
      id: article.id,
      title: article.title,
      url: article.url,
      source: article.source,
      publishedAt: article.publishedAt,
    });
    if (unique.length >= safeLimit) break;
  }

  return unique;
};

export default prepareTickerArticles;
