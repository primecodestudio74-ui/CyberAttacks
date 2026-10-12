#!/usr/bin/env node
/**
 * Live source health check for the Cyber News provider layer.
 *
 * Fetches every source in the registry (real publisher feeds + CISA) and prints
 * a health report: HTTP status, item count, how many items survive
 * normalisation, latency and any error. Use it:
 *
 *   npm --prefix backend run news:health          # all sources
 *   npm --prefix backend run news:health -- --json
 *
 * Requires outbound internet access. It only performs GET requests against the
 * URLs in backend/config/newsConfig.js and does not touch the database.
 */

import { fetchSource } from '../services/news/feedProviders.js';
import { normalizeArticle } from '../services/news/normalize.js';
import { getSources } from '../config/newsConfig.js';

const asJson = process.argv.includes('--json');

const pad = (value, width) => String(value ?? '').padEnd(width).slice(0, width);
const padStart = (value, width) => String(value ?? '').padStart(width).slice(0, width);

const sources = getSources();
const results = [];

for (const source of sources) {
  process.stdout.write(`checking ${source.id} ... `);
  // eslint-disable-next-line no-await-in-loop
  const { items, health } = await fetchSource(source);
  const normalized = items
    .map((item) => normalizeArticle(item, source, { recordStatus: item.recordStatus, dateLabel: item.dateLabel }))
    .filter(Boolean);
  const withDates = normalized.filter((article) => article.publishedAt).length;
  const withImages = normalized.filter((article) => article.imageUrl).length;
  results.push({ ...health, normalized: normalized.length, withDates, withImages });
  process.stdout.write(health.ok ? 'ok\n' : `FAILED (${health.error})\n`);
}

if (asJson) {
  console.log(JSON.stringify(results, null, 2));
} else {
  console.log('\nSource health report');
  console.log('='.repeat(104));
  console.log(
    `${pad('source', 28)}${pad('group', 10)}${padStart('http', 5)}${padStart('items', 7)}${padStart('kept', 6)}${padStart('dated', 7)}${padStart('img', 5)}${padStart('ms', 7)}  status`
  );
  console.log('-'.repeat(104));
  for (const result of results) {
    console.log(
      `${pad(result.id, 28)}${pad(result.group, 10)}${padStart(result.httpStatus ?? '-', 5)}${padStart(result.itemCount, 7)}${padStart(result.normalized, 6)}${padStart(result.withDates, 7)}${padStart(result.withImages, 5)}${padStart(result.durationMs, 7)}  ${result.ok ? 'ok' : result.error}`
    );
  }
  const ok = results.filter((result) => result.ok).length;
  const items = results.reduce((sum, result) => sum + result.normalized, 0);
  console.log('-'.repeat(104));
  console.log(`${ok}/${results.length} sources reachable, ${items} usable articles in total`);
  process.exit(ok === 0 ? 1 : 0);
}
