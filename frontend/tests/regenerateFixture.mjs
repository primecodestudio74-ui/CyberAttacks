#!/usr/bin/env node
/**
 * Refresh tests/fixtures/news-payload.json from a running backend.
 *
 *   # terminal 1 (backend, sample feeds - see backend/scripts/sampleFeedServer.js)
 *   # terminal 2
 *   npm --prefix frontend run news:regenerate-fixture
 *
 * The fixture is a real /api/news response; the render tests (tests/*.test.mjs)
 * use it to verify the UI with genuine provider data.
 */

import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const target = path.join(__dirname, 'fixtures', 'news-payload.json');
const base = process.env.NEWS_API_BASE || 'http://127.0.0.1:5000';

const response = await fetch(`${base}/api/news?limit=14`);
if (!response.ok) {
  console.error(`Could not fetch ${base}/api/news (HTTP ${response.status}). Is the backend running?`);
  process.exit(1);
}
const payload = await response.json();
if (!payload?.success || !payload.articles?.length) {
  console.error('The API returned no articles - start the backend with the sample feeds first.');
  process.exit(1);
}
await writeFile(target, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
console.log(`Wrote ${payload.articles.length} articles from ${base} to ${path.relative(process.cwd(), target)}`);
