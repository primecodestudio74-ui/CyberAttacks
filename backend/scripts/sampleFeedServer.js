#!/usr/bin/env node
/**
 * DEVELOPMENT ONLY - offline sample feed server.
 *
 * Serves the fixtures in backend/tests/fixtures over http://127.0.0.1:<port>
 * so the Cyber News feature can be developed, demoed and tested on a machine
 * with no outbound internet access (for example the HackAware sandbox).
 *
 * It is NOT part of the application runtime and is never started by the API
 * server. Production always reads the real publisher feeds listed in
 * backend/config/newsConfig.js.
 *
 * Usage:
 *   node backend/scripts/sampleFeedServer.js [port]
 *   # then start the backend with the printed NEWS_FEEDS_JSON value, e.g.
 *   NEWS_ALLOW_LOCAL_FEEDS=1 NEWS_SAMPLE_MODE=1 NEWS_FEEDS_JSON="$(node backend/scripts/sampleFeedServer.js --print-config)" npm run backend
 *
 * `--print-config` prints the NEWS_FEEDS_JSON override for the default port and
 * exits, so it can be used in shell scripts without starting a server.
 */

import http from 'node:http';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FIXTURE_DIR = path.join(__dirname, '..', 'tests', 'fixtures');
const DEFAULT_PORT = Number.parseInt(process.env.SAMPLE_FEED_PORT || '5099', 10);

// Fixture -> source registry entry. Ids/names match backend/config/newsConfig.js
// so category hints (India desk, advisory feeds) behave exactly as in production.
const SAMPLE_SOURCES = [
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

const buildConfig = (port) =>
  SAMPLE_SOURCES.map((source) => ({
    id: source.id,
    name: source.name,
    url: `http://127.0.0.1:${port}/feeds/${source.file}`,
    homepage: source.homepage,
    type: source.type,
    group: source.group,
    topic: source.topic,
  }));

const args = process.argv.slice(2);
if (args.includes('--print-config')) {
  process.stdout.write(JSON.stringify(buildConfig(DEFAULT_PORT)));
  process.exit(0);
}

const port = Number.parseInt(args[0] || String(DEFAULT_PORT), 10);

const contentTypeFor = (file) =>
  file.endsWith('.json') ? 'application/json; charset=utf-8' : 'application/rss+xml; charset=utf-8';

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://127.0.0.1:${port}`);
  const name = url.pathname.replace(/^\/feeds\//, '');

  // Bind to loopback only: this server must never be reachable off-host.
  if (url.pathname === '/health') {
    res.writeHead(200, { 'content-type': 'application/json' });
    res.end(JSON.stringify({ ok: true, fixtures: SAMPLE_SOURCES.length }));
    return;
  }

  if (url.pathname === '/config') {
    res.writeHead(200, { 'content-type': 'application/json' });
    res.end(JSON.stringify(buildConfig(port)));
    return;
  }

  if (!SAMPLE_SOURCES.some((source) => source.file === name) || name.includes('..') || name.includes('/')) {
    res.writeHead(404, { 'content-type': 'text/plain' });
    res.end('not found');
    return;
  }

  try {
    const body = await readFile(path.join(FIXTURE_DIR, name), 'utf8');
    res.writeHead(200, {
      'content-type': contentTypeFor(name),
      'cache-control': 'no-store',
    });
    res.end(body);
  } catch (error) {
    res.writeHead(500, { 'content-type': 'text/plain' });
    res.end(`fixture error: ${error.message}`);
  }
});

server.listen(port, '127.0.0.1', () => {
  console.log(`[sample-feed-server] serving ${SAMPLE_SOURCES.length} fixtures on http://127.0.0.1:${port}/feeds/`);
  console.log('[sample-feed-server] NEWS_FEEDS_JSON=' + JSON.stringify(buildConfig(port)));
  console.log('[sample-feed-server] start the API with: NEWS_ALLOW_LOCAL_FEEDS=1 NEWS_SAMPLE_MODE=1 \\');
  console.log(`[sample-feed-server]   NEWS_FEEDS_JSON='${JSON.stringify(buildConfig(port))}' npm run backend`);
  console.log('[sample-feed-server] development only - not used by the production API');
});
