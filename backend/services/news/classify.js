/**
 * Keyword based classification for cyber news articles.
 *
 * The rules are deliberately transparent: every category is a list of keywords
 * with a weight, matched against the publisher's own title and description.
 * Nothing is inferred from outside the article, so a story is never labelled
 * with a topic the source does not actually support.
 *
 *   - title matches count 3x, description matches count 1x
 *   - an article gets ONE primary category (used for its badge) plus every
 *     other topic it genuinely matches (used for filtering)
 *   - topical hints from the source registry (advisory feeds, India desk) only
 *     boost categories; they never invent one
 */

import { NEWS_CATEGORIES, NEWS_PATTERNS, NEWS_SOURCES } from '../../config/newsConfig.js';

const INTERNAL_GENERAL = NEWS_CATEGORIES.find((category) => category.id === 'general-cyber') || {
  id: 'general-cyber',
  label: 'Cybersecurity',
  selectable: false,
};

/** Broad lexicon used to reject anything that is not actually cyber news. */
const RELEVANCE_TERMS = [
  'cyber', 'cybersecurity', 'security', 'infosec', 'hack*',
  'malware', 'ransomware', 'ransom*', 'phishing', 'breach*', 'leak*', 'vulnerab*', 'exploit*',
  'zero-day', 'cve-', 'patch*', 'ddos', 'spyware', 'trojan', 'botnet', 'credential*', 'password*',
  'encryption', 'firewall', 'threat*', 'attack*', 'data theft', 'identity theft', 'scam*',
  'fraud*', 'privacy', 'advisory', 'authentication', 'dark web', 'cybercrime', 'spy*',
];

const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * Build a boundary-aware matcher for a keyword list.
 *
 *  - a boundary is applied per side, only when that side of the keyword is
 *    alphanumeric: "cve-" still matches "CVE-2026-1234", and "ai" does not
 *    match inside "said"
 *  - a keyword ending in "*" is treated as a stem, so "exfiltrat*" matches
 *    "exfiltrated", "exfiltration", ...
 */
const buildMatcher = (keywords) => {
  const parts = keywords
    .filter((keyword) => typeof keyword === 'string' && keyword.trim())
    .map((keyword) => {
      const trimmed = keyword.trim().toLowerCase();
      const isStem = trimmed.endsWith('*');
      const body = isStem ? trimmed.slice(0, -1) : trimmed;
      const left = /^[a-z0-9]/.test(body) ? '(?<![a-z0-9])' : '';
      const right = !isStem && /[a-z0-9]$/.test(body) ? '(?![a-z0-9])' : '';
      return `${left}${escapeRegExp(body)}${right}`;
    });
  if (!parts.length) return null;
  return new RegExp(parts.join('|'), 'gi');
};

const CATEGORY_RULES = NEWS_CATEGORIES.filter((category) => category.id !== 'all-news').map((category) => ({
  ...category,
  matcher: buildMatcher(category.keywords || []),
}));

const RELEVANCE_MATCHER = buildMatcher(RELEVANCE_TERMS);

/**
 * Co-occurrence rules: patterns that are only meaningful together, where a
 * single keyword would be too noisy on its own. Example: "records/customers"
 * plus "exposed/leaked/stolen" is a data breach, while either half alone is not.
 */
const PATTERN_RULES = [
  {
    category: 'data-breaches',
    boost: 6,
    // e.g. "exposes 8.6 million customer records", "leaked patient data"
    left: /\b(expos\w*|leak\w*|stolen|breach\w*|dump\w*|spill\w*|stole|theft|compromis\w*)\b/,
    right: /\b(records?|data|customers?|patients?|users?|accounts?|credentials?|emails?|passwords?|database|information|subscribers?|employees?)\b/,
  },
  {
    category: 'cyber-attacks',
    boost: 4,
    // "gang/crew claims attack", "hackers deployed wiper"
    left: /\b(gang|crew|group|actors?|hackers?|attackers?|operators?)\b/,
    right: /\b(attack\w*|campaign\w*|deploy\w*|breach\w*|intrusion|extort\w*|target\w*)\b/,
  },
];

const countMatches = (matcher, text) => {
  if (!matcher || !text) return 0;
  matcher.lastIndex = 0;
  let count = 0;
  while (matcher.exec(text) !== null) {
    count += 1;
    if (count > 40) break; // guard against pathological input
  }
  return count;
};

const normalise = (value) => ` ${String(value || '').toLowerCase().replace(/\s+/g, ' ')} `;

/** True when the text contains at least one cybersecurity signal. */
export const isCyberRelevant = ({ title = '', description = '' } = {}) => {
  const text = `${normalise(title)}${normalise(description)}`;
  return countMatches(RELEVANCE_MATCHER, text) > 0;
};

/** Extract the CVE identifiers mentioned by a story (real identifiers only). */
export const extractCveIds = (text) => {
  if (!text) return [];
  const matches = String(text).toUpperCase().match(NEWS_PATTERNS.cve) || [];
  return [...new Set(matches.map((id) => id.toUpperCase()))].slice(0, 12);
};

/**
 * Classify an article.
 * @param {{title?: string, description?: string, sourceId?: string, sourceGroup?: string, sourceTopic?: string}} input
 * @returns {{category: string, categoryLabel: string, categories: string[], scores: Record<string, number>}}
 */
export const classifyArticle = ({ title = '', description = '', sourceId = '', sourceGroup = 'publisher', sourceTopic = 'general' } = {}) => {
  const source = NEWS_SOURCES.find((item) => item.id === sourceId);
  const group = source?.group || sourceGroup;
  const topic = source?.topic || sourceTopic;

  const titleText = normalise(title);
  const bodyText = normalise(description);
  const combined = `${titleText}${bodyText}`;

  const scores = {};
  for (const rule of CATEGORY_RULES) {
    const score = countMatches(rule.matcher, titleText) * 3 + countMatches(rule.matcher, bodyText) * 1;
    let total = score;

    // Source-level hints (never sufficient on their own to invent a topic).
    if (rule.id === 'government-advisories') {
      // A story that comes from an official advisory feed IS an advisory: this
      // boost decides the badge, while every other topic it matches stays in
      // `categories` so it is still found by those filters.
      if (group === 'advisory') total += 8;
      if (topic === 'government' && score > 0) total += 2;
    }
    if (rule.id === 'india-cyber' && topic === 'india' && score > 0) total += 3;
    if (rule.id === 'vulnerabilities-cves' && topic === 'vulnerabilities' && score > 0) total += 3;

    if (total > 0) scores[rule.id] = total;
  }

  for (const rule of PATTERN_RULES) {
    if (rule.left.test(combined) && rule.right.test(combined)) {
      scores[rule.category] = (scores[rule.category] || 0) + rule.boost;
    }
  }

  const matched = CATEGORY_RULES.filter((rule) => (scores[rule.id] || 0) > 0);
  const additive = matched.filter((rule) => rule.additive);
  const topical = matched.filter((rule) => !rule.additive);

  const byRank = (a, b) =>
    (scores[b.id] - scores[a.id]) || ((b.weight || 0) - (a.weight || 0));

  topical.sort(byRank);
  additive.sort(byRank);

  let primary = topical[0];
  if (!primary) primary = additive[0];
  if (!primary) {
    const fallbackId = group === 'advisory' ? 'government-advisories' : INTERNAL_GENERAL.id;
    primary = CATEGORY_RULES.find((rule) => rule.id === fallbackId) || INTERNAL_GENERAL;
  }

  const categories = [primary.id, ...topical.slice(1).map((rule) => rule.id), ...additive.map((rule) => rule.id)];
  const unique = [...new Set(categories)];

  return {
    category: primary.id,
    categoryLabel: primary.label,
    categories: unique,
    scores,
  };
};

export const getCategoryDefinition = (id) =>
  NEWS_CATEGORIES.find((category) => category.id === id) ||
  (id === INTERNAL_GENERAL.id ? INTERNAL_GENERAL : null);

export default { classifyArticle, isCyberRelevant, extractCveIds, getCategoryDefinition };
