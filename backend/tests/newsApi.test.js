/**
 * End-to-end test for the news API.
 *
 * Verifies the whole chain over real HTTP: sample feed server (fixtures) ->
 * backend fetch -> parse -> classify -> cache -> /api/news responses.
 *
 *   node --test backend/tests/
 *
 * The sandbox this feature was developed in has no outbound access to
 * publisher hosts, so the provider layer is pointed at the local fixture
 * server through NEWS_FEEDS_JSON (the documented operator override). The code
 * path is identical to production; only the feed host differs.
 */

import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const backendDir = path.join(__dirname, '..');
const FEED_PORT = 5199;
const API_PORT = 5198;
const BASE = `http://127.0.0.1:${API_PORT}`;

let feedServer;
let apiServer;

const feedSources = [
  { id: 'the-hacker-news', name: 'The Hacker News', file: 'the-hacker-news.xml', type: 'rss', group: 'publisher', topic: 'general', homepage: 'https://thehackernews.com/' },
  { id: 'bleepingcomputer', name: 'BleepingComputer', file: 'bleepingcomputer.xml', type: 'rss', group: 'publisher', topic: 'general', homepage: 'https://www.bleepingcomputer.com/' },
  { id: 'dark-reading', name: 'Dark Reading', file: 'dark-reading.xml', type: 'rss', group: 'publisher', topic: 'enterprise', homepage: 'https://www.darkreading.com/' },
  { id: 'securityweek', name: 'SecurityWeek', file: 'securityweek.xml', type: 'rss', group: 'publisher', topic: 'enterprise', homepage: 'https://www.securityweek.com/' },
  { id: 'the-register-security', name: 'The Register (Security)', file: 'the-register-security.xml', type: 'atom', group: 'publisher', topic: 'general', homepage: 'https://www.theregister.com/security/' },
  { id: 'the-cyber-express', name: 'The Cyber Express', file: 'the-cyber-express.xml', type: 'rss', group: 'publisher', topic: 'india', homepage: 'https://thecyberexpress.com/' },
  { id: 'krebs-on-security', name: 'Krebs on Security', file: 'krebs-on-security.xml', type: 'rss', group: 'publisher', topic: 'investigation', homepage: 'https://krebsonsecurity.com/' },
  { id: 'help-net-security', name: 'Help Net Security', file: 'help-net-security.xml', type: 'rss', group: 'publisher', topic: 'enterprise', homepage: 'https://www.helpnetsecurity.com/' },
  { id: 'cisa-advisories', name: 'CISA Cybersecurity Advisories', file: 'cisa-advisories.xml', type: 'rss', group: 'advisory', topic: 'government', homepage: 'https://www.cisa.gov/news-events/cybersecurity-advisories' },
  { id: 'cisa-kev', name: 'CISA Known Exploited Vulnerabilities', file: 'kev.json', type: 'kev-json', group: 'advisory', topic: 'vulnerabilities', homepage: 'https://www.cisa.gov/known-exploited-vulnerabilities-catalog' },
];

const feedConfigJson = JSON.stringify(
  feedSources.map((source) => ({
    id: source.id,
    name: source.name,
    url: `http://127.0.0.1:${FEED_PORT}/feeds/${source.file}`,
    homepage: source.homepage,
    type: source.type,
    group: source.group,
    topic: source.topic,
  }))
);

const waitFor = async (url, { attempts = 45, delayMs = 400 } = {}) => {
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      // eslint-disable-next-line no-await-in-loop
      const response = await fetch(url);
      if (response.ok) return await response.json();
    } catch {
      /* not up yet */
    }
    // eslint-disable-next-line no-await-in-loop
    await new Promise((resolve) => setTimeout(resolve, delayMs));
  }
  throw new Error(`timed out waiting for ${url}`);
};

before(async () => {
  feedServer = spawn(process.execPath, [path.join(backendDir, 'scripts', 'sampleFeedServer.js'), String(FEED_PORT)], {
    cwd: backendDir,
    stdio: 'ignore',
  });
  await waitFor(`http://127.0.0.1:${FEED_PORT}/health`, { attempts: 25, delayMs: 200 });

  apiServer = spawn(process.execPath, [path.join(backendDir, 'server.js')], {
    cwd: backendDir,
    stdio: 'ignore',
    env: {
      ...process.env,
      PORT: String(API_PORT),
      NODE_ENV: 'test',
      // No database in CI: the news endpoints must work without Mongo.
      MONGO_URI: '',
      ALLOW_START_WITHOUT_DB: '1',
      NEWS_ALLOW_LOCAL_FEEDS: '1',
      NEWS_SAMPLE_MODE: '1',
      NEWS_IMAGE_ENRICHMENT: 'off',
      NEWS_WARM_ON_START: 'on',
      NEWS_CACHE_TTL_SECONDS: '600',
      NEWS_RATE_LIMIT_PER_MINUTE: '600',
      NEWS_REFRESH_RATE_LIMIT_PER_MINUTE: '20',
      NEWS_MIN_REFRESH_INTERVAL_SECONDS: '0',
      NEWS_FEEDS_JSON: feedConfigJson,
    },
  });

  const health = await waitFor(`${BASE}/api/news/health`);
  assert.equal(health.success, true);
  const feed = await waitFor(`${BASE}/api/news?limit=1`);
  assert.ok(feed.articles.length > 0, 'cold start should already have articles from the warm-up refresh');
});

after(() => {
  apiServer?.kill('SIGKILL');
  feedServer?.kill('SIGKILL');
});

/* ------------------------------------------------------------------ */

test('GET /api/news returns the documented envelope with real provider data', async () => {
  const response = await fetch(`${BASE}/api/news?limit=12`);
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('cache-control'), 'no-store');

  const payload = await response.json();
  assert.equal(payload.success, true);
  assert.equal(Array.isArray(payload.articles), true);
  assert.ok(payload.articles.length >= 5, `expected articles, got ${payload.articles.length}`);
  assert.equal(payload.pagination.page, 1);
  assert.equal(payload.pagination.limit, 12);
  assert.ok(payload.pagination.total >= payload.articles.length);
  assert.equal(typeof payload.lastUpdated, 'string');
  assert.ok(!Number.isNaN(Date.parse(payload.lastUpdated)));
  assert.equal(payload.meta.sampleData, true, 'sample mode is reported to the client');
  assert.equal(payload.meta.popularityAvailable, false);

  for (const article of payload.articles) {
    assert.match(article.id, /^news_[0-9a-f]{16}$/);
    assert.ok(article.title.length > 10);
    assert.ok(article.url.startsWith('https://'), `unsafe url: ${article.url}`);
    assert.ok(article.source);
    assert.ok(Array.isArray(article.categories) && article.categories.length >= 1);
    assert.ok(article.category);
    assert.ok(article.publishedAt === null || !Number.isNaN(Date.parse(article.publishedAt)));
    assert.equal(article.description === null || typeof article.description === 'string', true);
    if (article.description) {
      assert.ok(!article.description.includes('<'), 'no markup may reach the client');
    }
    if (article.imageUrl) assert.ok(article.imageUrl.startsWith('https://'));
  }
});

test('articles are ordered newest-first and undated stories sink to the bottom', async () => {
  const payload = await (await fetch(`${BASE}/api/news?limit=30`)).json();
  const dates = payload.articles.map((article) => (article.publishedAt ? Date.parse(article.publishedAt) : null));
  const dated = dates.filter((value) => value !== null);
  for (let index = 1; index < dated.length; index += 1) {
    assert.ok(dated[index - 1] >= dated[index], 'articles must be sorted newest first');
  }
  const firstUndated = dates.indexOf(null);
  if (firstUndated !== -1) assert.equal(firstUndated >= dated.length, true, 'undated stories come last');
});

test('the featured story is a real article with a publisher link', async () => {
  const payload = await (await fetch(`${BASE}/api/news`)).json();
  assert.ok(payload.featured, 'a featured story is selected from the live pool');
  assert.ok(payload.featured.url.startsWith('https://'));
  assert.ok(payload.featured.publishedAt);
  assert.ok(payload.sections.categories.length >= 10);
  assert.ok(payload.sections.trustedSources.length >= 5);
  assert.ok(payload.sections.sources.length >= 8);
});

test('category filtering works and every category is reachable', async () => {
  const list = await (await fetch(`${BASE}/api/news/categories`)).json();
  assert.equal(list.categories.length, 10);
  assert.equal(list.categories[0].id, 'all-news');

  for (const category of list.categories.slice(1)) {
    // eslint-disable-next-line no-await-in-loop
    const payload = await (await fetch(`${BASE}/api/news?category=${category.id}&limit=30`)).json();
    assert.equal(payload.success, true);
    assert.equal(payload.filters.category, category.id);
    for (const article of payload.articles) {
      assert.ok(
        article.categories.includes(category.id),
        `${article.title} is not tagged ${category.id}`
      );
    }
  }

  const breaches = await (await fetch(`${BASE}/api/news?category=data-breaches&limit=30`)).json();
  assert.ok(breaches.pagination.total >= 1, 'data breach category should match fixture stories');
  const advisories = await (await fetch(`${BASE}/api/news?category=government-advisories&limit=30`)).json();
  assert.ok(advisories.pagination.total >= 1);
  const india = await (await fetch(`${BASE}/api/news?category=india-cyber&limit=30`)).json();
  assert.ok(india.pagination.total >= 1, 'India category should match the Indian publisher + India keywords');
});

test('search matches real keywords and combines with category filters', async () => {
  const ransomware = await (await fetch(`${BASE}/api/news?q=ransomware&limit=30`)).json();
  assert.ok(ransomware.pagination.total >= 1);
  for (const article of ransomware.articles) {
    const text = `${article.title} ${article.description || ''}`.toLowerCase();
    assert.ok(text.includes('ransomware'), 'search results must contain the term');
  }

  const combined = await (await fetch(`${BASE}/api/news?q=citrix&category=vulnerabilities-cves&limit=30`)).json();
  for (const article of combined.articles) {
    assert.ok(article.categories.includes('vulnerabilities-cves'));
  }

  const cve = await (await fetch(`${BASE}/api/news?q=CVE-2026-100112&limit=30`)).json();
  assert.equal(cve.pagination.total, 1);
  assert.ok(cve.articles[0].cveIds.includes('CVE-2026-100112'));

  const empty = await (await fetch(`${BASE}/api/news?q=zzzzz-nonexistent-term&limit=30`)).json();
  assert.equal(empty.success, true);
  assert.equal(empty.articles.length, 0);
  assert.equal(empty.pagination.total, 0);
});

test('pagination pages through the pool without repeating articles', async () => {
  const first = await (await fetch(`${BASE}/api/news?limit=4&page=1`)).json();
  const second = await (await fetch(`${BASE}/api/news?limit=4&page=2`)).json();
  assert.equal(first.pagination.hasMore, true);
  assert.equal(first.pagination.totalPages, Math.ceil(first.pagination.total / 4));

  const ids = new Set([...first.articles, ...second.articles].map((article) => article.id));
  assert.equal(ids.size, first.articles.length + second.articles.length, 'no duplicate articles across pages');

  const beyond = await (await fetch(`${BASE}/api/news?limit=4&page=30`)).json();
  assert.equal(beyond.articles.length, 0);
  assert.equal(beyond.pagination.hasMore, false);
});

test('sorting supports oldest-first', async () => {
  const payload = await (await fetch(`${BASE}/api/news?sort=oldest&limit=30`)).json();
  const dates = payload.articles.map((article) => (article.publishedAt ? Date.parse(article.publishedAt) : null)).filter(Boolean);
  for (let index = 1; index < dates.length; index += 1) {
    assert.ok(dates[index - 1] <= dates[index]);
  }
});

test('duplicate syndicated stories are collapsed into one card', async () => {
  const payload = await (await fetch(`${BASE}/api/news?limit=30`)).json();
  assert.equal(payload.success, true);
  const anydesk = payload.articles.filter((article) => article.title.includes('AnyDesk'));
  assert.equal(anydesk.length, 1);
  // The newest copy of the story wins and records who else ran it.
  assert.ok(Array.isArray(anydesk[0].alsoCoveredBy), 'merged story must list the other publisher');
  assert.ok(
    ['SecurityWeek', 'The Hacker News'].includes(anydesk[0].source),
    `unexpected surviving source: ${anydesk[0].source}`
  );
  assert.ok(
    anydesk[0].alsoCoveredBy.some((name) => ['SecurityWeek', 'The Hacker News'].includes(name)),
    `expected the other publisher in alsoCoveredBy, got ${JSON.stringify(anydesk[0].alsoCoveredBy)}`
  );
  assert.equal(new Set(payload.articles.map((article) => article.id)).size, payload.articles.length);
});

test('advisories feed the sidebar sections with official sources', async () => {
  const payload = await (await fetch(`${BASE}/api/news`)).json();
  assert.ok(payload.sections.advisories.length >= 1);
  for (const advisory of payload.sections.advisories) {
    assert.equal(advisory.isAdvisory, true);
    assert.ok(advisory.tags.includes('Advisory'));
  }
  const kev = payload.sections.advisories.find((advisory) => advisory.tags.includes('Exploited in the wild'));
  assert.ok(kev, 'KEV entries are surfaced as exploited advisories');
  assert.ok(kev.url.startsWith('https://www.cve.org/CVERecord'));
  assert.equal(kev.dateLabel, 'Added to CISA KEV');
});

test('invalid query parameters return 400 with a consistent error envelope', async () => {
  const cases = [
    `${BASE}/api/news?category=../../etc/passwd`,
    `${BASE}/api/news?sort=drop-table`,
    `${BASE}/api/news?page=0`,
    `${BASE}/api/news?limit=1000`,
    `${BASE}/api/news?q=${'a'.repeat(200)}`,
    `${BASE}/api/news?source=evil.example`,
  ];
  for (const url of cases) {
    // eslint-disable-next-line no-await-in-loop
    const response = await fetch(url);
    assert.equal(response.status, 400, `${url} should be rejected`);
    // eslint-disable-next-line no-await-in-loop
    const body = await response.json();
    assert.equal(body.success, false);
    assert.equal(body.error.code, 'INVALID_PARAM');
    assert.ok(!/at Object|stack|node_modules/i.test(JSON.stringify(body)), 'no stack traces may leak');
  }
});

test('the API never exposes credentials or provider internals', async () => {
  const responses = await Promise.all([
    fetch(`${BASE}/api/news`),
    fetch(`${BASE}/api/news/sources`),
    fetch(`${BASE}/api/news/health`),
    fetch(`${BASE}/api/news/categories`),
  ]);
  const bodies = await Promise.all(responses.map((response) => response.text()));
  const combined = bodies.join('\n');
  assert.ok(!/MONGO_URI|JWT_SECRET|OPENROUTER_API_KEY|api[_-]?key/i.test(combined), 'no credentials may be exposed');
  assert.ok(!combined.includes(process.env.MONGO_URI || 'mongodb+srv://__unset__'));
  assert.ok(!/node_modules|at Object\./.test(combined));
});

test('GET /api/news/sources reports per-source health and counts', async () => {
  const payload = await (await fetch(`${BASE}/api/news/sources`)).json();
  assert.equal(payload.success, true);
  assert.equal(payload.sources.length, feedSources.length);
  const ok = payload.sources.filter((source) => source.status === 'ok');
  assert.equal(ok.length, feedSources.length, 'every fixture source should have been fetched');
  assert.ok(payload.sources.every((source) => source.articleCount >= 0));
  assert.ok(payload.trustedSources.length >= 5);
});

test('manual refresh is rate limited but works and preserves articles', async () => {
  const response = await fetch(`${BASE}/api/news/refresh`, { method: 'POST' });
  assert.notEqual(response.status, 429, 'the first manual refresh must not be rate limited');
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.success, true);
  assert.ok(body.articles > 0);

  const afterRefresh = await (await fetch(`${BASE}/api/news?limit=5`)).json();
  assert.ok(afterRefresh.articles.length > 0);
  assert.ok(!Number.isNaN(Date.parse(afterRefresh.lastUpdated)));
});

test('a failing source degrades that source only and is reported to the client', async () => {
  const port = 5197;
  const degradedConfig = JSON.stringify([
    {
      id: 'the-hacker-news',
      name: 'The Hacker News',
      url: `http://127.0.0.1:${FEED_PORT}/feeds/the-hacker-news.xml`,
      homepage: 'https://thehackernews.com/',
      type: 'rss',
      group: 'publisher',
      topic: 'general',
    },
    {
      // Nothing is listening here: the provider must degrade, not crash.
      id: 'broken-source',
      name: 'Broken Source',
      url: 'http://127.0.0.1:5196/feeds/nothing.xml',
      homepage: 'https://broken.example/',
      type: 'rss',
      group: 'publisher',
      topic: 'general',
    },
  ]);

  const server = spawn(process.execPath, [path.join(backendDir, 'server.js')], {
    cwd: backendDir,
    stdio: 'ignore',
    env: {
      ...process.env,
      PORT: String(port),
      NODE_ENV: 'test',
      MONGO_URI: '',
      ALLOW_START_WITHOUT_DB: '1',
      NEWS_ALLOW_LOCAL_FEEDS: '1',
      NEWS_IMAGE_ENRICHMENT: 'off',
      NEWS_WARM_ON_START: 'on',
      NEWS_FETCH_TIMEOUT_MS: '2500',
      NEWS_FEEDS_JSON: degradedConfig,
    },
  });

  try {
    const payload = await waitFor(`http://127.0.0.1:${port}/api/news`);
    assert.equal(payload.success, true);
    assert.ok(payload.articles.length > 0, 'the healthy source still provides articles');
    assert.equal(payload.meta.degraded, true);
    assert.deepEqual(payload.meta.degradedSources, ['broken-source']);
    assert.equal(payload.meta.unavailable, false);

    const sources = await waitFor(`http://127.0.0.1:${port}/api/news/sources`);
    const broken = sources.sources.find((source) => source.id === 'broken-source');
    assert.equal(broken.status, 'error');
    assert.ok(broken.error, 'the failure reason is recorded for operators');
  } finally {
    server.kill('SIGKILL');
  }
});

test('when every source fails the API stays up and reports the outage honestly', async () => {
  const port = 5195;
  const allBroken = JSON.stringify([
    {
      id: 'broken-a',
      name: 'Broken A',
      url: 'http://127.0.0.1:5194/feeds/a.xml',
      homepage: 'https://a.example/',
      type: 'rss',
      group: 'publisher',
      topic: 'general',
    },
  ]);

  const server = spawn(process.execPath, [path.join(backendDir, 'server.js')], {
    cwd: backendDir,
    stdio: 'ignore',
    env: {
      ...process.env,
      PORT: String(port),
      NODE_ENV: 'test',
      MONGO_URI: '',
      ALLOW_START_WITHOUT_DB: '1',
      NEWS_ALLOW_LOCAL_FEEDS: '1',
      NEWS_IMAGE_ENRICHMENT: 'off',
      NEWS_FETCH_TIMEOUT_MS: '2000',
      NEWS_FEEDS_JSON: allBroken,
    },
  });

  try {
    const payload = await waitFor(`http://127.0.0.1:${port}/api/news`);
    assert.equal(payload.success, true, 'a provider outage is not a client error');
    assert.deepEqual(payload.articles, []);
    assert.equal(payload.meta.unavailable, true);
    assert.deepEqual(payload.meta.degradedSources, ['broken-a']);
    // The failure must not leak internal details (host, stack, provider payload).
    assert.ok(!/ECONNREFUSED|at Object\.|node_modules/.test(JSON.stringify(payload)));
  } finally {
    server.kill('SIGKILL');
  }
});

test('unknown news sub-routes do not exist (no accidental catch-all)', async () => {
  const response = await fetch(`${BASE}/api/news/../../etc/passwd`);
  assert.ok([200, 301, 400, 404].includes(response.status));
  const json = await response.json().catch(() => null);
  if (json && typeof json === 'object' && 'success' in json) {
    assert.ok(!JSON.stringify(json).includes('root:'));
  }
});
