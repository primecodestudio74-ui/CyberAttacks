/**
 * Minimal, dependency-free RSS 2.0 / RDF / Atom parser.
 *
 * Why hand-rolled instead of pulling in an XML library:
 *  - The only XML we ever parse comes from the curated source registry (never
 *    from user input), and we need just a handful of fields.
 *  - A full DOM/SAX parser brings entity-expansion and external-entity (XXE)
 *    attack surface that this parser simply does not have: DOCTYPE declarations
 *    are dropped before parsing and custom entities are never resolved.
 *  - It keeps HackAware's backend dependency list unchanged.
 *
 * Output shape (all fields optional, sanitised later):
 *   { feedTitle, feedLink, items: [{ title, link, description, content, pubDate,
 *     updated, author, categories, imageUrl, guid, originalLink }] }
 */

import { decodeEntities } from './sanitize.js';

const MAX_ITEMS_PER_FEED = 60;

/** Attribute values arrive XML-encoded ("&amp;"), so decode before use. */
const decodeUrl = (value) => decodeEntities(String(value ?? '')).trim();

/** Drop prologs, DOCTYPEs (incl. internal entity declarations) and comments. */
const preClean = (xml) =>
  String(xml)
    .replace(/^\uFEFF/, '')
    .replace(/<\?xml[\s\S]*?\?>/gi, ' ')
    .replace(/<!DOCTYPE[^>[]*(\[[\s\S]*?\])?[^>]*>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ');

const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Inner content of the first `<tag ...>...</tag>` (tag name may be namespaced). */
const tagContent = (block, tag) => {
  if (!block) return '';
  const pattern = new RegExp(`<${escapeRegExp(tag)}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${escapeRegExp(tag)}\\s*>`, 'i');
  const match = block.match(pattern);
  return match ? match[1] : '';
};

/** Attribute value of every occurrence of `<tag ... attr="...">`. */
const tagAttrs = (block, tag, attr) => {
  if (!block) return [];
  const results = [];
  const tagPattern = new RegExp(`<${escapeRegExp(tag)}\\b[^>]*>`, 'gi');
  const attrPattern = new RegExp(`\\b${escapeRegExp(attr)}\\s*=\\s*("([^"]*)"|'([^']*)'|([^\\s"'>]+))`, 'i');
  for (const match of block.matchAll(tagPattern)) {
    const attrMatch = match[0].match(attrPattern);
    if (attrMatch) results.push(attrMatch[2] ?? attrMatch[3] ?? attrMatch[4] ?? '');
  }
  return results;
};

const firstAttr = (block, tag, attr) => tagAttrs(block, tag, attr)[0] || '';

const unwrapCdata = (value) =>
  String(value || '')
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .trim();

const hasImageType = (attrs) => {
  const medium = (attrs.medium || '').toLowerCase();
  const type = (attrs.type || '').toLowerCase();
  const url = (attrs.url || '').toLowerCase();
  if (medium === 'image') return true;
  if (type.startsWith('image/')) return true;
  return /\.(jpe?g|png|webp|avif|gif)(\?|#|$)/.test(url);
};

/** Every attribute set for `<tag ...>` occurrences. */
const tagAttrObjects = (block, tag) => {
  if (!block) return [];
  const results = [];
  const tagPattern = new RegExp(`<${escapeRegExp(tag)}\\b([^>]*)>`, 'gi');
  for (const match of block.matchAll(tagPattern)) {
    const attrs = {};
    const attrPattern = /([a-zA-Z_:][\w:.-]*)\s*=\s*("([^"]*)"|'([^']*)'|([^\s"'>]+))/g;
    for (const attrMatch of match[1].matchAll(attrPattern)) {
      attrs[attrMatch[1].toLowerCase()] = attrMatch[3] ?? attrMatch[4] ?? attrMatch[5] ?? '';
    }
    results.push(attrs);
  }
  return results;
};

/**
 * Find the best article image, in order of publisher intent:
 * enclosure -> media:content -> media:thumbnail -> item <image> ->
 * itunes:image -> first <img> inside the article body.
 */
const extractImageUrlRaw = (item) => {
  const enclosures = tagAttrObjects(item, 'enclosure').filter((attrs) => attrs.url && hasImageType(attrs));
  if (enclosures[0]) return enclosures[0].url;

  const mediaContent = tagAttrObjects(item, 'media:content');
  const imageContent = mediaContent.filter(
    (attrs) => attrs.url && (hasImageType(attrs) || attrs.medium === 'image')
  );
  if (imageContent[0]) return imageContent[0].url;
  if (mediaContent[0]?.url && hasImageType(mediaContent[0])) return mediaContent[0].url;

  const thumbnails = tagAttrObjects(item, 'media:thumbnail').concat(tagAttrObjects(item, 'thumbnail'));
  if (thumbnails[0]?.url) return thumbnails[0].url;

  const rssImage = tagContent(item, 'image');
  const rssImageUrl = unwrapCdata(tagContent(rssImage, 'url')) || firstAttr(rssImage, 'image', 'href');
  if (rssImageUrl) return rssImageUrl;

  const itunesImage = firstAttr(item, 'itunes:image', 'href');
  if (itunesImage) return itunesImage;

  const body = [tagContent(item, 'content:encoded'), tagContent(item, 'content'), tagContent(item, 'description'), tagContent(item, 'summary')]
    .filter(Boolean)
    .join(' ');
  const imgTags = tagAttrObjects(body, 'img');
  for (const attrs of imgTags) {
    const candidate = attrs.src || attrs['data-src'] || attrs['data-original'] || attrs.srcset?.split(',')[0]?.trim().split(/\s+/)[0];
    if (candidate) return candidate;
  }
  return '';
};

const extractImageUrl = (item) => decodeUrl(extractImageUrlRaw(item));

const FEEDBURNER_HOSTS = /(^|\.)feedburner\.com$|(^|\.)fbcdn\.net$/i;

const stripFeedburnerTracking = (value) => {
  try {
    const url = new URL(value);
    // FeedBurner click-tracking links look like /~r/Site/~3/<id>/real-path
    const m = url.pathname.match(/^\/~[^/]+\/~[0-9]+\/(.*)$/);
    if (m) url.pathname = `/${m[1]}`;
    return url.toString();
  } catch {
    return value;
  }
};

/** Article URL: RSS <link>, Atom <link rel="alternate">, or a permalink guid. */
const extractLinkRaw = (item, { originalLink } = {}) => {
  if (originalLink) return originalLink;

  const rssLink = unwrapCdata(tagContent(item, 'link'));
  if (rssLink) return stripFeedburnerTracking(rssLink);

  const linkAttrs = tagAttrObjects(item, 'link');
  const alternate = linkAttrs.find((attrs) => attrs.href && (!attrs.rel || attrs.rel === 'alternate'));
  if (alternate?.href) return stripFeedburnerTracking(alternate.href);
  if (linkAttrs[0]?.href) return stripFeedburnerTracking(linkAttrs[0].href);

  const guidText = unwrapCdata(tagContent(item, 'guid'));
  const guidAttrs = tagAttrObjects(item, 'guid');
  const isPermalink = guidAttrs[0]?.ispermalink !== 'false';
  if (guidText && isPermalink && /^https?:\/\//i.test(guidText)) return stripFeedburnerTracking(guidText);

  const atomId = unwrapCdata(tagContent(item, 'id'));
  if (atomId && /^https?:\/\//i.test(atomId)) return atomId;
  return '';
};

const extractLink = (item, options) => decodeUrl(extractLinkRaw(item, options));

/**
 * Author name: dc:creator, Atom <author><name>, or a bare email address.
 * Feeds express this in several ways, e.g. "admin@site (The Hacker News)" -
 * the human name is preferred over the mailbox.
 */
const humaniseAuthor = (raw) => {
  const value = unwrapCdata(raw).replace(/<[^>]*>/g, ' ').trim();
  if (!value) return '';
  const named = value.match(/^\s*[^()<]+?\s*\(([^)]+)\)\s*$/);
  if (named) return named[1].trim();
  return value.replace(/\b[\w.+-]+@[\w.-]+\.\w{2,}\b/g, '').replace(/\s{2,}/g, ' ').trim();
};

const extractAuthor = (item) => {
  const creator = humaniseAuthor(tagContent(item, 'dc:creator') || tagContent(item, 'creator'));
  if (creator) return creator;

  const authorBlock = tagContent(item, 'author');
  if (authorBlock) {
    const name = unwrapCdata(tagContent(authorBlock, 'name')).trim();
    if (name) return name;
    const raw = humaniseAuthor(authorBlock);
    if (raw) return raw;
  }
  return humaniseAuthor(tagContent(item, 'byline'));
};

const extractCategories = (item) => {
  const values = [];
  const pattern = /<category\b([^>]*)>([\s\S]*?)<\/category>|<category\b([^>]*)\/>/gi;
  for (const match of item.matchAll(pattern)) {
    const attrs = match[1] ?? match[3] ?? '';
    const termMatch = attrs.match(/\bterm\s*=\s*("([^"]*)"|'([^']*)')/i);
    const label = termMatch ? termMatch[2] ?? termMatch[3] : unwrapCdata(match[2] ?? '');
    const cleaned = label.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    if (cleaned && cleaned.length <= 60 && !values.includes(cleaned)) values.push(cleaned);
  }
  return values.slice(0, 8);
};

/**
 * Parse a feed document.
 * @param {string} xml raw feed body
 * @param {{ type?: 'rss'|'atom' }} [options]
 */
export const parseFeed = (xml, { type = 'rss' } = {}) => {
  const body = preClean(xml);
  const isAtom = type === 'atom' || /<entry[\s>]/i.test(body);

  // Channel/feed level metadata (used as a fallback source name).
  const head = body.split(/<(?:item|entry)\b/i)[0] || body;
  const feedTitle = unwrapCdata(tagContent(head, 'title')).replace(/<[^>]*>/g, ' ').trim();
  const feedLink =
    unwrapCdata(tagContent(head, 'link')) ||
    firstAttr(tagContent(head, 'link') ? head : head, 'link', 'href') ||
    '';

  const itemTag = isAtom ? 'entry' : 'item';
  const itemPattern = new RegExp(`<${itemTag}\\b[\\s\\S]*?<\\/${itemTag}\\s*>`, 'gi');
  const rawItems = body.match(itemPattern) || [];
  // Some feeds (rare) use self-closing entries - fall back to the other element.
  const fallbackItems = rawItems.length ? [] : body.match(/<item\b[\s\S]*?<\/item\s*>/gi) || [];
  const blocks = (rawItems.length ? rawItems : fallbackItems).slice(0, MAX_ITEMS_PER_FEED);

  const items = blocks
    .map((block) => {
      const originalLinkRaw = unwrapCdata(tagContent(block, 'feedburner:origlink')) || unwrapCdata(tagContent(block, 'origlink'));
      const link = extractLink(block, { originalLink: originalLinkRaw });
      const content = unwrapCdata(tagContent(block, 'content:encoded'));
      const description = unwrapCdata(tagContent(block, 'description')) || unwrapCdata(tagContent(block, 'summary'));
      const atomContent = unwrapCdata(tagContent(block, 'content'));
      return {
        title: unwrapCdata(tagContent(block, 'title')),
        link,
        description,
        content: content || atomContent,
        // Atom uses <published>/<updated>; RSS uses <pubDate> (sometimes <dc:date>).
        pubDate: unwrapCdata(tagContent(block, 'pubdate')) || unwrapCdata(tagContent(block, 'dc:date')) || unwrapCdata(tagContent(block, 'published')),
        updated: unwrapCdata(tagContent(block, 'updated')),
        author: extractAuthor(block),
        categories: extractCategories(block),
        imageUrl: extractImageUrl(block),
        guid: unwrapCdata(tagContent(block, 'guid')) || unwrapCdata(tagContent(block, 'id')),
      };
    })
    .filter((item) => item.title || item.link);

  return { feedTitle, feedLink: feedLink ? unwrapCdata(feedLink) : '', items };
};

export default parseFeed;
