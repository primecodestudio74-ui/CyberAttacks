/**
 * Unit tests for the Cyber News backend.
 *
 * Run with:  npm --prefix backend test
 * (Node's built-in test runner - no extra dependencies.)
 *
 * These tests exercise the parser, sanitiser, classifier and de-duplication
 * logic against realistic provider fixtures captured from the live feeds
 * (backend/tests/fixtures/*) plus a deliberately hostile edge-case feed.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { parseFeed } from '../services/news/feedParser.js';
import {
  buildExcerpt,
  canonicalUrl,
  cleanText,
  decodeEntities,
  htmlToPlainText,
  isPrivateHost,
  parseDate,
  safeHttpUrl,
  safeImageUrl,
  stableId,
  titleKey,
} from '../services/news/sanitize.js';
import { classifyArticle, extractCveIds, isCyberRelevant } from '../services/news/classify.js';
import { normalizeArticle } from '../services/news/normalize.js';
import { dedupeArticles, _internals } from '../services/news/newsCache.js';
import { filterArticles, parseNewsQuery, pickFeatured } from '../services/news/newsService.js';
import { providerInternals } from '../services/news/feedProviders.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const fixture = (name) => readFile(path.join(__dirname, 'fixtures', name), 'utf8');

const publisher = {
  id: 'test-publisher',
  name: 'Test Publisher',
  type: 'rss',
  group: 'publisher',
  topic: 'general',
  homepage: 'https://example.test/',
};
const advisory = {
  id: 'cisa-advisories',
  name: 'CISA Cybersecurity Advisories',
  type: 'rss',
  group: 'advisory',
  topic: 'government',
  homepage: 'https://www.cisa.gov/news-events/cybersecurity-advisories',
};

/* ------------------------------------------------------------------ *
 * Sanitisation
 * ------------------------------------------------------------------ */

test('decodeEntities handles named, decimal and hex entities without expanding unknown ones', () => {
  assert.equal(decodeEntities('Fish &amp; Chips'), 'Fish & Chips');
  assert.equal(decodeEntities('&#8217;quoted&#8217;'), '\u2019quoted\u2019');
  assert.equal(decodeEntities('&#x27;hex&#x27;'), "'hex'");
  // Unknown entity must survive untouched (no entity-expansion attack surface).
  assert.equal(decodeEntities('&evilEntity;'), '&evilEntity;');
});

test('htmlToPlainText strips scripts/styles/tags and decodes text', () => {
  const html = '<p>Malware &amp; ransomware</p><script>alert(1)</script><style>p{}</style><b>bold</b>';
  const text = htmlToPlainText(html);
  assert.equal(text.includes('<'), false);
  assert.equal(text.includes('alert(1)'), false);
  assert.equal(text.includes('p{}'), false);
  assert.ok(text.includes('Malware & ransomware'));
  assert.ok(text.includes('bold'));
});

test('cleanText collapses whitespace and truncates on word boundaries', () => {
  assert.equal(cleanText('  Multiple\n\n  spaces   here '), 'Multiple spaces here');
  const long = cleanText('word '.repeat(80), 40);
  assert.ok(long.length <= 41, `expected <=41 chars, got ${long.length}`);
  assert.ok(long.endsWith('\u2026'));
});

test('buildExcerpt removes publisher boilerplate and dupe titles', () => {
  const excerpt = buildExcerpt(
    '<p>The suspect is believed to be Edward Dubrovsky, a Canadian cybersecurity executive.</p><p>The post <a href="#">Ransomware Response Expert Arrested</a> appeared first on <a href="#">SecurityWeek</a>.</p>',
    { title: 'Ransomware Response Expert Arrested in ShinyHunters FBI Hack Probe', maxLength: 300 }
  );
  assert.ok(!/appeared first on/i.test(excerpt), `boilerplate leaked: ${excerpt}`);
  assert.ok(excerpt.startsWith('The suspect is believed'));

  const repeated = buildExcerpt('Critical SonicWall Vulnerability Exploited Days After Disclosure', {
    title: 'Critical SonicWall Vulnerability Exploited Days After Disclosure',
  });
  assert.equal(repeated, '');
});

test('safeHttpUrl only allows absolute http(s) URLs', () => {
  assert.equal(safeHttpUrl('https://example.com/a'), 'https://example.com/a');
  assert.equal(safeHttpUrl('http://example.com/a'), 'http://example.com/a');
  assert.equal(safeHttpUrl('javascript:alert(1)'), null);
  assert.equal(safeHttpUrl('data:text/html;base64,PHN2Zz4='), null);
  assert.equal(safeHttpUrl('file:///etc/passwd'), null);
  assert.equal(safeHttpUrl('//example.com/protocol-relative'), null);
  assert.equal(safeHttpUrl('https://user:pass@example.com/'), null);
  assert.equal(safeHttpUrl('https://example.com/\u0000bad'), null);
  assert.equal(safeHttpUrl('https://169.254.169.254/latest/meta-data/'), null);
  assert.equal(safeHttpUrl('http://127.0.0.1:5099/feeds/x.xml'), null);
  assert.equal(safeHttpUrl('http://127.0.0.1:5099/feeds/x.xml', { allowLocal: true }), 'http://127.0.0.1:5099/feeds/x.xml');
});

test('safeImageUrl rejects svg, pixel endpoints and non-http schemes', () => {
  assert.equal(safeImageUrl('https://cdn.example.com/a/b.jpg'), 'https://cdn.example.com/a/b.jpg');
  assert.equal(safeImageUrl('https://cdn.example.com/logo.svg'), null);
  assert.equal(safeImageUrl('data:image/svg+xml;base64,PHN2Zy8+'), null);
  assert.equal(safeImageUrl('https://tracker.example.com/pixel.php?id=1'), null);
});

test('isPrivateHost recognises loopback, link-local and RFC1918 ranges', () => {
  for (const host of ['localhost', '127.0.0.1', '10.1.2.3', '172.16.5.4', '192.168.0.9', '169.254.169.254', '::1', 'fd00::1']) {
    assert.equal(isPrivateHost(host), true, `${host} should be private`);
  }
  for (const host of ['example.com', 'news.bbc.co.uk', '8.8.8.8']) {
    assert.equal(isPrivateHost(host), false, `${host} should be public`);
  }
});

test('canonicalUrl removes tracking parameters and normalises hosts', () => {
  assert.equal(
    canonicalUrl('https://www.Example.com/news/x/?utm_source=twitter&utm_medium=social&ref=home#frag'),
    'https://example.com/news/x'
  );
  assert.equal(canonicalUrl('https://example.com/news/x'), canonicalUrl('https://example.com/news/x/'));
  assert.equal(canonicalUrl('not a url'), null);
});

test('stableId is deterministic and prefixed', () => {
  assert.equal(stableId('https://example.com/a'), stableId('https://example.com/a'));
  assert.notEqual(stableId('https://example.com/a'), stableId('https://example.com/b'));
  assert.match(stableId('https://example.com/a'), /^news_[0-9a-f]{16}$/);
});

test('titleKey normalises headlines for de-duplication', () => {
  assert.equal(titleKey('  The Quick, Brown Fox!  '), 'quick brown fox');
  assert.equal(
    titleKey('Citrix warns admins to patch new NetScaler RCE flaw immediately'),
    titleKey('Citrix warns admins to patch new NetScaler RCE flaw immediately - SecurityWeek')
  );
});

test('parseDate accepts real formats and rejects nonsense', () => {
  assert.equal(parseDate('Mon, 12 Oct 2026 10:32:05 +0000'), '2026-10-12T10:32:05.000Z');
  assert.equal(parseDate('2026-10-12T10:32:05Z'), '2026-10-12T10:32:05.000Z');
  assert.equal(parseDate('2026-10-11'), '2026-10-11T00:00:00.000Z');
  assert.equal(parseDate('Not a real date'), null);
  assert.equal(parseDate(''), null);
  assert.equal(parseDate(undefined), null);
  // Absurd future dates must not reach the UI.
  assert.equal(parseDate('2030-10-01T01:00:00Z'), null);
});

/* ------------------------------------------------------------------ *
 * Parser
 * ------------------------------------------------------------------ */

test('RSS parser reads FeedBurner-style items (origLink, author, CDATA)', async () => {
  const xml = await fixture('the-hacker-news.xml');
  const { feedTitle, items } = parseFeed(xml);
  assert.equal(feedTitle, 'The Hacker News');
  assert.equal(items.length, 4);
  const first = items[0];
  assert.equal(first.link, 'https://thehackernews.com/2026/10/attackers-exploit-cvss-100-bricksforge.html');
  assert.equal(first.author, 'The Hacker News');
  assert.ok(first.description.includes('Bricksforge'));
  assert.ok(first.imageUrl.startsWith('https://blogger.googleusercontent.com/'));
  assert.equal(first.categories[0], 'Vulnerability');
});

test('RSS parser reads enclosure and media thumbnails', async () => {
  const xml = await fixture('bleepingcomputer.xml');
  const { items } = parseFeed(xml);
  assert.equal(items.length, 4);
  assert.equal(items[0].imageUrl, 'https://www.bleepingcomputer.com/wp-content/uploads/2026/10/nippon-columbia.jpg');
  assert.equal(items[1].imageUrl, 'https://www.bleepingcomputer.com/wp-content/uploads/2026/10/sonicwall.jpg');
  assert.equal(items[0].author, 'Bill Toulas');
  assert.equal(items[3].author, 'Sponsored by Token Security');
});

test('RSS parser reads media:content images and unquoted namespaced markup', async () => {
  const xml = await fixture('dark-reading.xml');
  const { items } = parseFeed(xml);
  assert.equal(items.length, 3);
  assert.equal(items[0].title, 'ASOS Breach Reveals the Risks in Customer-Facing SaaS');
  assert.equal(items[0].imageUrl, 'https://img.deusm.com/darkreading/2026/10/clothes-triocean-Getty.jpg');
  assert.equal(items[0].author, 'Nate Nelson');
});

test('Atom parser reads entries with alternate links and no summary', async () => {
  const xml = await fixture('the-register-security.xml');
  const { items } = parseFeed(xml, { type: 'atom' });
  assert.equal(items.length, 3);
  assert.equal(
    items[0].link,
    'https://www.theregister.com/security/2026/10/12/imagine-theres-no-shiny-hunters-ai-could-make-human-hacking-crews-obsolete/5302430'
  );
  assert.equal(items[0].pubDate, '2026-10-12T10:27:00Z');
  assert.equal(items[0].description, '');
});

test('parser survives malformed and hostile markup without throwing', async () => {
  const xml = await fixture('edge-cases.xml');
  const { items } = parseFeed(xml);
  assert.ok(items.length >= 10);
  // Nested/duplicate CDATA and a stray "]>" must not break the item list.
  const titles = items.map((item) => item.title).filter(Boolean);
  assert.ok(titles.some((title) => title.includes('Cloud misconfiguration')));
});

/* ------------------------------------------------------------------ *
 * Classification
 * ------------------------------------------------------------------ */

test('classification picks the dominant topic and adds India as a secondary topic', () => {
  const ransomwareInIndia = classifyArticle({
    title: 'Ransomware attack hits Indian hospital chain, patient data leaked',
    description: 'The gang claims to have stolen records from hospitals in Mumbai and Delhi.',
  });
  assert.equal(ransomwareInIndia.category, 'cyber-attacks');
  assert.ok(ransomwareInIndia.categories.includes('india-cyber'));
  assert.ok(ransomwareInIndia.categories.includes('data-breaches'));
});

test('classification routes advisories, AI stories, CVEs and cloud stories correctly', () => {
  const advisoryStory = classifyArticle({
    title: 'CISA Releases Security Updates for Critical Vulnerabilities',
    description: 'CISA encourages administrators to review the advisory.',
    sourceId: 'cisa-advisories',
  });
  assert.ok(advisoryStory.categories.includes('government-advisories'));

  const aiStory = classifyArticle({
    title: 'Prompt injection flaw in an AI agent leaks enterprise data',
    description: 'Researchers showed how an LLM agent could be abused to exfiltrate secrets from an Azure tenant.',
  });
  assert.ok(aiStory.categories.includes('ai-security'));

  const cveStory = classifyArticle({
    title: 'Critical NetScaler flaw CVE-2026-100112 exploited in the wild',
    description: 'Admins are urged to patch immediately.',
  });
  assert.ok(cveStory.categories.includes('vulnerabilities-cves'));

  const cloudStory = classifyArticle({
    title: 'Misconfigured Kubernetes clusters expose enterprise dashboards',
    description: 'Cloud security teams found over-permissive IAM roles.',
  });
  assert.ok(cloudStory.categories.includes('cloud-enterprise-security'));
});

test('an unrelated story gets no invented topic', () => {
  const story = classifyArticle({ title: 'Holiday photos from the office party', description: 'Nobody was hacked.' });
  assert.equal(story.category, 'general-cyber');
  assert.deepEqual(story.categories, ['general-cyber']);
});

test('relevance gate rejects non-security content and accepts security content', () => {
  assert.equal(isCyberRelevant({ title: 'Local sports team wins final' }), false);
  assert.equal(isCyberRelevant({ title: 'CISO appointed at fintech' }), false);
  assert.equal(isCyberRelevant({ title: 'Ransomware gang leaks hospital records' }), true);
  assert.equal(isCyberRelevant({ title: 'New patch closes a vulnerability' }), true);
});

test('extractCveIds only returns real CVE identifiers', () => {
  assert.deepEqual(extractCveIds('Fixed CVE-2026-100112 and cve-2026-100113 today'), ['CVE-2026-100112', 'CVE-2026-100113']);
  assert.deepEqual(extractCveIds('no identifiers here'), []);
  assert.deepEqual(extractCveIds('CVE-26-1 is not valid'), []);
});

/* ------------------------------------------------------------------ *
 * Normalisation
 * ------------------------------------------------------------------ */

test('normalizeArticle produces the documented schema for a real item', async () => {
  const { items } = parseFeed(await fixture('bleepingcomputer.xml'));
  const article = normalizeArticle(items[0], publisher);
  assert.ok(article);
  assert.deepEqual(Object.keys(article).sort(), [
    'id', 'title', 'description', 'imageUrl', 'source', 'sourceId', 'sourceHomepage',
    'sourceGroup', 'author', 'publishedAt', 'url', 'canonicalUrl', 'category',
    'categoryLabel', 'categories', 'cveIds', 'tags', 'isAdvisory', 'sponsored',
    'dateLabel', 'fetchedAt',
  ].sort());
  assert.equal(article.source, 'Test Publisher');
  assert.equal(article.sourceId, 'test-publisher');
  assert.equal(article.author, 'Bill Toulas');
  assert.equal(article.publishedAt, '2026-10-11T14:23:46.000Z');
  assert.equal(article.category, 'data-breaches');
  assert.match(article.id, /^news_/);
  assert.equal(article.isAdvisory, false);
  assert.equal(article.description.includes('<'), false);
});

test('normalizeArticle drops javascript links, empty titles and off-topic items', async () => {
  const { items } = parseFeed(await fixture('edge-cases.xml'));
  const articles = items.map((item) => normalizeArticle(item, publisher)).filter(Boolean);
  const titles = articles.map((article) => article.title);

  assert.ok(!titles.some((title) => title.includes('javascript:')), 'javascript: item must be dropped');
  assert.ok(!titles.some((title) => title.includes('Local sports team')), 'off-topic item must be dropped');
  assert.ok(!titles.some((title) => title.includes('CISO appointed')), 'non-cyber item must be dropped');
  assert.ok(!titles.some((title) => title.includes('calendar invites')), 'link-less item must be dropped');
  assert.ok(!articles.some((article) => !article.url.startsWith('http')));

  for (const article of articles) {
    if (article.imageUrl) {
      assert.ok(article.imageUrl.startsWith('https://'), `unsafe image: ${article.imageUrl}`);
      assert.ok(!article.imageUrl.includes('169.254.169.254'), 'metadata endpoint image must be rejected');
      assert.ok(!article.imageUrl.includes('svg'), 'svg image must be rejected');
    }
    assert.ok(!article.title.includes('<'));
    assert.ok(!article.description || !article.description.includes('<'));
  }
});

test('normalizeArticle strips scripts, keeps text and truncates long descriptions', async () => {
  const { items } = parseFeed(await fixture('edge-cases.xml'));
  const articles = items.map((item) => normalizeArticle(item, publisher)).filter(Boolean);

  const zeroDay = articles.find((article) => article.title.includes('Zero-day'));
  assert.ok(zeroDay);
  assert.ok(zeroDay.description.includes('emergency patch'));
  assert.equal(zeroDay.description.includes('<script'), false);
  assert.equal(zeroDay.description.includes('window.location'), false);
  assert.deepEqual(zeroDay.cveIds, ['CVE-2026-999001']);
  assert.equal(zeroDay.imageUrl, null);

  const longDescription = articles.find((article) => article.title.includes('file transfer'));
  assert.ok(longDescription.description.length <= 261, 'excerpt must be truncated');
  assert.equal(longDescription.publishedAt, null, 'absurd future date must be dropped');
});

test('normalizeArticle labels advisories with source-backed tags only', async () => {
  const { items } = parseFeed(await fixture('cisa-advisories.xml'));
  const articles = items.map((item) => normalizeArticle(item, advisory)).filter(Boolean);
  assert.equal(articles.length, 3);

  const satel = articles.find((article) => article.title.includes('Satel'));
  assert.ok(satel.tags.includes('Advisory'));
  assert.ok(!satel.tags.includes('Critical'), 'severity must come from the source, not be guessed');
  assert.ok(satel.description.includes('Successful exploitation'), `summary section not used: ${satel.description}`);
  assert.ok(!satel.description.includes('View CSAF'));
  assert.equal(satel.imageUrl, null);

  const atlassian = articles.find((article) => article.title.includes('Atlassian'));
  assert.ok(atlassian.tags.includes('Critical'), 'advisory title says "Critical", so the label is supported');
  assert.deepEqual(atlassian.cveIds, ['CVE-2026-100112']);
});

test('KEV adapter maps the CISA catalog and filters out stale entries', async () => {
  const catalog = JSON.parse(await fixture('kev.json'));
  const items = providerInternals.parseKevCatalog(catalog, { id: 'cisa-kev', name: 'CISA KEV' });
  assert.equal(items.length, 2, 'the 2019 record is outside the recency window');
  assert.equal(items[0].link, 'https://www.cve.org/CVERecord?id=CVE-2026-102255');
  assert.match(items[0].title, /SonicWall SMA1000/);
  assert.equal(items[0].recordStatus, 'exploited');
  assert.equal(items[0].dateLabel, 'Added to CISA KEV');

  const articles = items.map((item) => normalizeArticle(item, {
    id: 'cisa-kev',
    name: 'CISA Known Exploited Vulnerabilities',
    group: 'advisory',
    topic: 'vulnerabilities',
    homepage: 'https://www.cisa.gov/known-exploited-vulnerabilities-catalog',
  })).filter(Boolean);
  assert.equal(articles.length, 2);
  assert.ok(articles[0].tags.includes('Exploited in the wild'));
  assert.ok(articles[0].tags.includes('Advisory'));
  assert.equal(articles[0].publishedAt, '2026-10-11T00:00:00.000Z');
  assert.ok(articles[0].categories.includes('vulnerabilities-cves'));
});

test('advisory source URLs are refused unless local feeds are explicitly allowed', () => {
  const localSource = { name: 'Local', url: 'http://127.0.0.1:5099/feeds/x.xml', type: 'rss' };
  // Default configuration: private hosts rejected.
  assert.equal(providerInternals.validateSourceUrl(localSource), null);
  // With the operator opt-in (sample server / tests) the URL passes validation.
  process.env.NEWS_ALLOW_LOCAL_FEEDS = '1';
  const validated = providerInternals.validateSourceUrl(localSource);
  delete process.env.NEWS_ALLOW_LOCAL_FEEDS;
  assert.equal(validated, 'http://127.0.0.1:5099/feeds/x.xml');
  // ...but non-http schemes never do.
  process.env.NEWS_ALLOW_LOCAL_FEEDS = '1';
  const bad = providerInternals.validateSourceUrl({ url: 'file:///etc/passwd' });
  delete process.env.NEWS_ALLOW_LOCAL_FEEDS;
  assert.equal(bad, null);
});

/* ------------------------------------------------------------------ *
 * De-duplication
 * ------------------------------------------------------------------ */

test('dedupeArticles merges the same URL and near-identical headlines', async () => {
  const collect = async (file, source) => {
    const { items } = parseFeed(await fixture(file));
    return items.map((item) => normalizeArticle(item, source)).filter(Boolean);
  };
  const thn = await collect('the-hacker-news.xml', publisher);
  const sw = await collect('securityweek.xml', { ...publisher, id: 'securityweek', name: 'SecurityWeek' });
  const edge = await collect('edge-cases.xml', publisher);

  const merged = dedupeArticles([...thn, ...sw, ...edge]);
  const anydesk = merged.filter((article) => article.title.includes('AnyDesk'));
  assert.equal(anydesk.length, 1, 'syndicated headline must appear once');
  assert.ok(anydesk[0].alsoCoveredBy.includes('SecurityWeek'));

  const vpn = merged.filter((article) => article.title.includes('VPN appliance flaw'));
  assert.equal(vpn.length, 1, 'tracking-parameter duplicates must collapse');
  assert.ok(vpn[0].imageUrl, 'merged record keeps the image from the duplicate');
});

test('jaccard similarity only merges near-identical headlines', () => {
  const tokenise = (title) => new Set(_internals.significantTokens(title));
  const a = tokenise('Citrix warns admins to patch new NetScaler RCE flaw immediately');
  const sameStory = tokenise('Citrix warns admins to patch new NetScaler RCE flaw immediately');
  const otherStory = tokenise('Citrix patches critical NetScaler flaw that could enable RCE in SAML deployments');
  assert.equal(_internals.jaccard(a, sameStory), 1);
  assert.ok(_internals.jaccard(a, otherStory) < 0.8, 'different reporting on the same product must not merge');
});

/* ------------------------------------------------------------------ *
 * Query handling, filtering, sorting, featured selection
 * ------------------------------------------------------------------ */

test('parseNewsQuery validates every parameter and applies safe defaults', () => {
  const defaults = parseNewsQuery({});
  assert.deepEqual(defaults, {
    category: 'all-news',
    q: '',
    source: '',
    sort: 'newest',
    page: 1,
    limit: 12,
    includeSections: true,
    forceRefresh: false,
    wantsSectionsOnly: false,
  });

  assert.throws(() => parseNewsQuery({ category: 'not-a-category' }), /Unknown category/);
  assert.throws(() => parseNewsQuery({ source: 'not-a-source' }), /Unknown source/);
  assert.throws(() => parseNewsQuery({ sort: 'sideways' }), /newest/);
  assert.throws(() => parseNewsQuery({ page: '0' }), /between 1 and/);
  assert.throws(() => parseNewsQuery({ limit: '999' }), /between 1 and/);
  assert.throws(() => parseNewsQuery({ page: 'abc' }), /not a valid number/);
  assert.throws(() => parseNewsQuery({ q: 'x'.repeat(200) }), /too long/);
  assert.throws(() => parseNewsQuery({ q: ['a', 'b'] }), /Repeated query parameters/);

  const parsed = parseNewsQuery({ category: 'data-breaches', q: '  ransomware   India ', source: 'bleepingcomputer', page: '2', limit: '8', sort: 'oldest' });
  assert.deepEqual(
    { category: parsed.category, q: parsed.q, source: parsed.source, page: parsed.page, limit: parsed.limit, sort: parsed.sort },
    { category: 'data-breaches', q: 'ransomware India', source: 'bleepingcomputer', page: 2, limit: 8, sort: 'oldest' }
  );
});

const sampleArticles = [
  {
    id: 'a', title: 'Ransomware attack hits Indian hospital', description: 'patient records stolen in Mumbai',
    categories: ['cyber-attacks', 'data-breaches', 'india-cyber'], category: 'cyber-attacks', source: 'The Hacker News',
    sourceId: 'the-hacker-news', cveIds: [], publishedAt: '2026-10-12T10:00:00.000Z', imageUrl: 'https://cdn.test/a.jpg', sponsored: false,
  },
  {
    id: 'b', title: 'Critical NetScaler CVE-2026-100112 patched', description: 'admins urged to update',
    categories: ['vulnerabilities-cves'], category: 'vulnerabilities-cves', source: 'BleepingComputer',
    sourceId: 'bleepingcomputer', cveIds: ['CVE-2026-100112'], publishedAt: '2026-10-11T10:00:00.000Z', imageUrl: null, sponsored: false,
  },
  {
    id: 'c', title: 'AI agent prompt injection leaks secrets', description: 'LLM guardrails bypassed',
    categories: ['ai-security'], category: 'ai-security', source: 'SecurityWeek',
    sourceId: 'securityweek', cveIds: [], publishedAt: null, imageUrl: null, sponsored: false,
  },
];

test('filterArticles filters by category, source and multi-word search', () => {
  assert.equal(filterArticles(sampleArticles, { category: 'all-news' }).length, 3);
  assert.deepEqual(filterArticles(sampleArticles, { category: 'data-breaches' }).map((a) => a.id), ['a']);
  assert.deepEqual(filterArticles(sampleArticles, { category: 'india-cyber' }).map((a) => a.id), ['a']);
  assert.deepEqual(filterArticles(sampleArticles, { category: 'all-news', source: 'securityweek' }).map((a) => a.id), ['c']);
  assert.deepEqual(filterArticles(sampleArticles, { category: 'all-news', q: 'ransomware' }).map((a) => a.id), ['a']);
  assert.deepEqual(filterArticles(sampleArticles, { category: 'all-news', q: 'CVE-2026-100112' }).map((a) => a.id), ['b']);
  assert.deepEqual(filterArticles(sampleArticles, { category: 'all-news', q: 'ai agent' }).map((a) => a.id), ['c']);
  assert.deepEqual(filterArticles(sampleArticles, { category: 'all-news', q: 'ransomware zeroday' }).map((a) => a.id), []);
});

test('pickFeatured only selects recent, illustrated, non-sponsored stories', () => {
  const featured = pickFeatured(sampleArticles);
  assert.equal(featured.id, 'a');
  // A sponsored story is never chosen as the hero when a real story exists,
  // even when it is the newest item with a thumbnail.
  const sponsoredFirst = [
    { ...sampleArticles[0], id: 'sponsored', sponsored: true, imageUrl: 'https://cdn.test/s.jpg' },
    ...sampleArticles,
  ];
  assert.notEqual(pickFeatured(sponsoredFirst).id, 'sponsored');
  // ...but it is still used if it is the only story available.
  assert.equal(pickFeatured([{ ...sampleArticles[0], id: 'sponsored', sponsored: true }]).id, 'sponsored');
});
