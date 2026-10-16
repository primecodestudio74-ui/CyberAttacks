/**
 * Normalises raw provider items into HackAware's internal article schema.
 *
 * Every field is validated here, exactly once, so controllers and the frontend
 * never have to defend against malformed feed data:
 *
 *   {
 *     id, title, description, imageUrl, source, sourceId, sourceHomepage,
 *     author, publishedAt, url, category, categoryLabel, categories, tags,
 *     isAdvisory, sponsored, cveIds, dateLabel
 *   }
 *
 * Anything that cannot be made safe (missing/invalid link, unusable title,
 * non-cyber content) is dropped instead of being patched up with placeholder
 * values.
 */

import { NEWS_EXCERPT_LENGTH, NEWS_PATTERNS } from '../../config/newsConfig.js';
import { classifyArticle, extractCveIds, isCyberRelevant } from './classify.js';
import {
  buildExcerpt,
  canonicalUrl,
  cleanText,
  htmlToPlainText,
  parseDate,
  safeHttpUrl,
  safeImageUrl,
  stableId,
  truncate,
} from './sanitize.js';

const MIN_TITLE_LENGTH = 12;

/**
 * Vendor/CERT advisories open with boilerplate ("View CSAF", "Summary",
 * "Background"). When the body contains a Summary section, start the excerpt
 * there so the card shows the actual risk statement.
 */
const preferSummarySection = (html) => {
  if (typeof html !== 'string' || !html) return html;
  const summaryMatch = html.match(/<h[1-3][^>]*>\s*summary\s*<\/h[1-3]>([\s\S]*?)(<h[1-3][^>]*>|$)/i);
  if (summaryMatch && summaryMatch[1] && htmlToPlainText(summaryMatch[1]).length > 40) {
    return summaryMatch[1];
  }
  return html;
};

const describe = (raw) => {
  // Advisory feeds keep the useful risk statement inside their body, behind
  // boilerplate ("View CSAF", "Summary"); prefer that section wherever the
  // publisher put it.
  const candidate = raw.description ? preferSummarySection(raw.description) : preferSummarySection(raw.content || '');
  return buildExcerpt(candidate, { title: raw.title, maxLength: NEWS_EXCERPT_LENGTH });
};

/**
 * Labels are only added when the publisher's own data supports them:
 *  - "Advisory"             official advisory feed (CISA / CERT)
 *  - "Exploited in the wild" CISA KEV catalog entry
 *  - "Critical"             the advisory's own title says critical
 *  - "Sponsored"            the publisher marked it as sponsored content
 */
const buildTags = ({ source, title, author, sponsored, recordStatus }) => {
  const tags = [];
  if (source.group === 'advisory') tags.push('Advisory');
  if (recordStatus === 'exploited') tags.push('Exploited in the wild');
  if (source.group === 'advisory' && NEWS_PATTERNS.critical.test(title || '')) tags.push('Critical');
  if (sponsored) tags.push('Sponsored');
  return tags;
};

const isSponsored = (raw) => {
  const author = String(raw.author || '');
  return NEWS_PATTERNS.sponsored.test(author) || NEWS_PATTERNS.sponsored.test(String(raw.title || ''));
};

/**
 * @param {object} raw item produced by a provider adapter
 * @param {object} source source registry entry
 * @param {object} [context] extra provider data (e.g. KEV record status)
 * @returns {object|null} normalised article or null when unusable
 */
export const normalizeArticle = (raw, source, context = {}) => {
  if (!raw || typeof raw !== 'object') return null;

  const title = cleanText(raw.title, 220);
  if (!title || title.length < MIN_TITLE_LENGTH) return null;

  const url = safeHttpUrl(raw.link);
  if (!url) return null;

  const description = describe({ ...raw, title });
  const publishedAt = parseDate(raw.pubDate) || parseDate(raw.updated) || null;
  const author = cleanText(raw.author, 80) || null;
  const sponsored = isSponsored({ ...raw, author });
  const cveIds = extractCveIds(`${title} ${description} ${raw.cveId || ''}`);

  const { category, categoryLabel, categories } = classifyArticle({
    title,
    description,
    sourceId: source.id,
    sourceGroup: source.group,
    sourceTopic: source.topic,
  });

  // Keep the feed focused: dedicated cyber sources pass, but anything from them
  // that carries no cyber signal at all is dropped rather than labelled.
  if (source.group !== 'advisory' && !isCyberRelevant({ title, description }) && !cveIds.length) {
    return null;
  }

  const imageUrl = safeImageUrl(raw.imageUrl);
  const canonical = canonicalUrl(url) || url;
  // Adapters that know more than the raw feed (CISA KEV -> "exploited") pass it
  // through the item itself so callers cannot forget the context argument.
  const recordStatus = context.recordStatus || raw.recordStatus || null;

  return {
    id: stableId(canonical),
    title,
    description: description || null,
    imageUrl: imageUrl || null,
    source: source.name,
    sourceId: source.id,
    sourceHomepage: source.homepage ? safeHttpUrl(source.homepage) : null,
    sourceGroup: source.group,
    author,
    publishedAt,
    url,
    canonicalUrl: canonical,
    category,
    categoryLabel,
    categories,
    cveIds,
    tags: buildTags({ source, title, author, sponsored, recordStatus }),
    isAdvisory: source.group === 'advisory',
    sponsored,
    dateLabel: context.dateLabel || raw.dateLabel || null,
    fetchedAt: context.fetchedAt || new Date().toISOString(),
  };
};

/** Trim a long description for JSON payloads without touching stored data. */
export const excerptOf = (article, maxLength = NEWS_EXCERPT_LENGTH) => ({
  ...article,
  description: article.description ? truncate(article.description, maxLength) : null,
});

export default { normalizeArticle, excerptOf };
