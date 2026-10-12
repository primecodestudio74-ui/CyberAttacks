/**
 * Provider layer: turns the curated source registry into raw feed items.
 *
 * This is the only place in the feature that performs outbound network calls.
 * It is written defensively because it deals with third-party infrastructure:
 *
 *   - URLs are validated (http/https, public host) and come only from the
 *     operator-controlled registry - no user input ever reaches the fetcher.
 *   - Every request has a hard timeout and a response size cap.
 *   - Fetches are concurrency limited and identified with a descriptive
 *     User-Agent so publishers can see who is reading their feed.
 *   - A failing source degrades that source only; it never fails the request.
 */

import {
  NEWS_ALLOW_LOCAL_FEEDS,
  NEWS_FETCH_CONCURRENCY,
  NEWS_FETCH_TIMEOUT_MS,
  NEWS_IMAGE_ENRICH_LIMIT,
  NEWS_IMAGE_ENRICH_TIMEOUT_MS,
  NEWS_IMAGE_ENRICHMENT,
  NEWS_MAX_FEED_BYTES,
  NEWS_SAMPLE_MODE,
  getSources,
} from '../../config/newsConfig.js';
import { parseFeed } from './feedParser.js';
import { cleanText, htmlToPlainText, isPrivateHost, safeHttpUrl, safeImageUrl } from './sanitize.js';

const USER_AGENT =
  'HackAwareNewsBot/1.0 (+https://github.com/primecodestudio74-ui/CyberAttacks; cybersecurity news reader)';

/* ------------------------------------------------------------------ *
 * HTTP helpers
 * ------------------------------------------------------------------ */

const fetchWithTimeout = async (url, { timeoutMs, headers = {}, signal } = {}) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(new Error('timeout')), timeoutMs);
  const onAbort = () => controller.abort(signal?.reason);
  if (signal) {
    if (signal.aborted) onAbort();
    else signal.addEventListener('abort', onAbort, { once: true });
  }
  try {
    return await fetch(url, {
      headers: { 'User-Agent': USER_AGENT, Accept: '*/*', ...headers },
      redirect: 'follow',
      cache: 'no-store',
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timer);
    if (signal) signal.removeEventListener('abort', onAbort);
  }
};

/** Read a response body as text, refusing anything above the size cap. */
const readBodyCapped = async (response, maxBytes) => {
  const declared = Number.parseInt(response.headers.get('content-length') || '', 10);
  if (Number.isFinite(declared) && declared > maxBytes) {
    throw new Error(`response too large (${declared} bytes)`);
  }
  const buffer = Buffer.from(await response.arrayBuffer());
  if (buffer.byteLength > maxBytes) {
    throw new Error(`response too large (${buffer.byteLength} bytes)`);
  }
  return buffer.toString('utf8');
};

/**
 * The local-feed opt-in is read at call time (not at import time) so it can be
 * flipped by operators and tests without reloading the module.
 */
const allowLocalFeeds = () => process.env.NEWS_ALLOW_LOCAL_FEEDS === '1' || NEWS_ALLOW_LOCAL_FEEDS;

const validateSourceUrl = (source, { allowLocal = allowLocalFeeds() } = {}) => {
  const url = safeHttpUrl(source.url, { allowLocal });
  if (!url) return null;
  if (!allowLocal) {
    try {
      const parsed = new URL(url);
      if (isPrivateHost(parsed.hostname)) return null;
    } catch {
      return null;
    }
  }
  return url;
};

/* ------------------------------------------------------------------ *
 * KEV (CISA Known Exploited Vulnerabilities catalog, JSON)
 * ------------------------------------------------------------------ */

const KEV_WINDOW_DAYS = 180;
const KEV_MAX_ITEMS = 40;

/**
 * The KEV catalog is a database, not a news feed: it is mapped to the same
 * article shape so advisories and news share one experience. `dateAdded` is
 * what the card shows as the timestamp and is labelled as such.
 * CISA publishes no per-CVE permalink in this feed, so each entry links to the
 * official CVE record at cve.org (the canonical location for a CVE id).
 */
const parseKevCatalog = (json, source) => {
  const records = Array.isArray(json?.vulnerabilities) ? json.vulnerabilities : [];
  const cutoff = Date.now() - KEV_WINDOW_DAYS * 24 * 60 * 60 * 1000;

  return records
    .map((record) => {
      const cveId = cleanText(record?.cveID, 24);
      const addedAt = record?.dateAdded || null;
      const addedTime = addedAt ? Date.parse(`${addedAt}T00:00:00Z`) : Number.NaN;
      if (!cveId || !/^CVE-\d{4}-\d{4,7}$/i.test(cveId)) return null;
      if (!Number.isFinite(addedTime) || addedTime < cutoff) return null;

      const vendor = cleanText(record?.vendorProject, 60);
      const product = cleanText(record?.product, 80);
      const ransomware = String(record?.knownRansomwareCampaignUse || '').toLowerCase() === 'known';
      const descriptionParts = [
        cleanText(record?.shortDescription, 220),
        vendor || product ? `Affected: ${[vendor, product].filter(Boolean).join(' ')}.` : '',
        ransomware ? 'CISA reports known use in ransomware campaigns.' : '',
      ].filter(Boolean);

      return {
        title: `${cleanText(record?.vulnerabilityName, 140) || cveId} (${cveId.toUpperCase()})`,
        link: `https://www.cve.org/CVERecord?id=${encodeURIComponent(cveId.toUpperCase())}`,
        description: descriptionParts.join(' '),
        pubDate: addedAt,
        author: 'CISA Known Exploited Vulnerabilities',
        imageUrl: null,
        categories: ['Advisory', 'Vulnerabilities'],
        cveId: cveId.toUpperCase(),
        recordStatus: 'exploited',
        dateLabel: 'Added to CISA KEV',
      };
    })
    .filter(Boolean)
    .sort((a, b) => Date.parse(b.pubDate) - Date.parse(a.pubDate))
    .slice(0, KEV_MAX_ITEMS);
};

/* ------------------------------------------------------------------ *
 * Single source fetch
 * ------------------------------------------------------------------ */

/**
 * Fetch and parse one registry source.
 * @returns {Promise<{source: object, items: object[], health: object}>}
 */
export const fetchSource = async (source, { signal } = {}) => {
  const startedAt = Date.now();
  const health = {
    id: source.id,
    name: source.name,
    group: source.group,
    url: source.url,
    ok: false,
    itemCount: 0,
    httpStatus: null,
    error: null,
    durationMs: 0,
    checkedAt: new Date().toISOString(),
  };

  const url = validateSourceUrl(source);
  if (!url) {
    health.error = 'source url rejected by validation';
    health.durationMs = Date.now() - startedAt;
    return { source, items: [], health };
  }

  try {
    const response = await fetchWithTimeout(url, {
      timeoutMs: NEWS_FETCH_TIMEOUT_MS,
      signal,
      headers: { Accept: 'application/rss+xml, application/atom+xml, application/xml, application/json, text/xml;q=0.9, */*;q=0.8' },
    });
    health.httpStatus = response.status;

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const body = await readBodyCapped(response, NEWS_MAX_FEED_BYTES);

    let items;
    if (source.type === 'kev-json') {
      let parsed;
      try {
        parsed = JSON.parse(body);
      } catch {
        throw new Error('invalid JSON payload');
      }
      items = parseKevCatalog(parsed, source);
    } else {
      const trimmed = body.trimStart();
      if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
        throw new Error('unexpected JSON payload for a feed source');
      }
      if (trimmed && !/^<(\?xml|rss|feed|rdf|channel|item|atom)/i.test(trimmed)) {
        throw new Error('unexpected content type for a feed source');
      }
      const parsed = parseFeed(body, { type: source.type });
      items = parsed.items;
    }

    health.ok = true;
    health.itemCount = items.length;
    return { source, items, health };
  } catch (error) {
    health.error = error?.name === 'AbortError' ? 'request timed out' : cleanText(error?.message, 160) || 'unknown error';
    return { source, items: [], health };
  } finally {
    health.durationMs = Date.now() - startedAt;
  }
};

/** Fetch every enabled source with bounded concurrency. */
export const fetchAllSources = async ({ sources = getSources(), signal } = {}) => {
  const results = [];
  let cursor = 0;

  const worker = async () => {
    while (cursor < sources.length) {
      const index = cursor;
      cursor += 1;
      const source = sources[index];
      // eslint-disable-next-line no-await-in-loop
      results[index] = await fetchSource(source, { signal });
    }
  };

  const workers = Array.from({ length: Math.min(NEWS_FETCH_CONCURRENCY, sources.length) }, worker);
  await Promise.all(workers);
  return results.filter(Boolean);
};

/* ------------------------------------------------------------------ *
 * Bounded thumbnail enrichment (optional, background only)
 * ------------------------------------------------------------------ */

const readPartialHtml = async (response, maxBytes = 200_000) => {
  const reader = response.body?.getReader();
  if (!reader) return '';
  const decoder = new TextDecoder('utf-8', { fatal: false });
  let text = '';
  let received = 0;
  try {
    while (received < maxBytes) {
      // eslint-disable-next-line no-await-in-loop
      const { value, done } = await reader.read();
      if (done) break;
      received += value?.byteLength || 0;
      text += decoder.decode(value, { stream: true });
      if (/<meta[^>]+(og:image|twitter:image)/i.test(text)) break;
      if (/<\/head>/i.test(text)) break;
    }
  } finally {
    try {
      await reader.cancel();
    } catch {
      /* already closed */
    }
  }
  return text;
};

const extractSocialImage = (html, baseUrl) => {
  const patterns = [
    /<meta[^>]+property=["']og:image(?::secure_url)?["'][^>]+content=["']([^"']+)["']/i,
    /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image(?::secure_url)?["']/i,
    /<meta[^>]+name=["']twitter:image(?::src)?["'][^>]+content=["']([^"']+)["']/i,
    /<meta[^>]+content=["']([^"']+)["'][^>]+name=["']twitter:image(?::src)?["']/i,
  ];
  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match?.[1]) {
      try {
        return safeImageUrl(new URL(match[1], baseUrl).toString());
      } catch {
        /* ignore malformed */
      }
    }
  }
  return null;
};

/**
 * Fill in missing thumbnails for a bounded number of stories by reading the
 * publisher's own article page (<meta og:image>).
 *
 * Safety: only articles from a *publisher* source whose host matches the source
 * homepage host are eligible, so the fetch target always belongs to the feed we
 * already trust - this cannot be used as an open proxy/SSRF primitive.
 * Runs in the background refresh path only, never during a user request.
 */
export const enrichMissingImages = async (articles, { limit = NEWS_IMAGE_ENRICH_LIMIT } = {}) => {
  if (!NEWS_IMAGE_ENRICHMENT || limit <= 0) return { articles, enriched: 0 };

  const sourceHosts = new Map();
  for (const source of getSources()) {
    if (!source.homepage || source.group !== 'publisher') continue;
    try {
      sourceHosts.set(source.id, new URL(source.homepage).hostname.replace(/^www\./, ''));
    } catch {
      /* ignore */
    }
  }

  const candidates = [];
  for (const article of articles) {
    if (candidates.length >= limit) break;
    if (article.imageUrl || article.isAdvisory || !article.url) continue;
    const allowedHost = sourceHosts.get(article.sourceId);
    if (!allowedHost) continue;
    try {
      const host = new URL(article.url).hostname.replace(/^www\./, '');
      if (host !== allowedHost && !host.endsWith(`.${allowedHost}`)) continue;
    } catch {
      continue;
    }
    candidates.push(article);
  }
  if (!candidates.length) return { articles, enriched: 0 };

  let enriched = 0;
  await Promise.all(
    candidates.map(async (article) => {
      try {
        const response = await fetchWithTimeout(article.url, {
          timeoutMs: NEWS_IMAGE_ENRICH_TIMEOUT_MS,
          headers: { Accept: 'text/html' },
        });
        if (!response.ok) return;
        if (!(response.headers.get('content-type') || '').includes('text/html')) return;
        const html = await readPartialHtml(response);
        const image = extractSocialImage(html, article.url);
        if (image) {
          article.imageUrl = image;
          article.imageSource = 'article-metadata';
          enriched += 1;
        }
      } catch {
        /* enrichment is best effort */
      }
    })
  );

  return { articles, enriched };
};

export const providerInternals = { parseKevCatalog, extractSocialImage, validateSourceUrl, NEWS_SAMPLE_MODE };
export default { fetchSource, fetchAllSources, enrichMissingImages };
