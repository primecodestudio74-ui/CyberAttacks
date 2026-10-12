/**
 * Render tests for the Cyber News UI.
 *
 *   npm --prefix frontend run test:render
 *
 * The components are rendered with react-dom/server against a payload captured
 * from the real backend (tests/fixtures/news-payload.json, produced by
 * `npm run news:regenerate-fixture` while the API runs against the sample
 * feeds). This verifies that real article data renders correctly - including
 * the awkward cases (no thumbnail, no description, no date) - and that the
 * empty / error / rate-limit states say what they should.
 *
 * esbuild (already a Vite dependency) compiles the JSX entry; no extra test
 * tooling is added to the project.
 */

import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { readFile, mkdir, rm } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import * as esbuild from 'esbuild';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const outDir = path.join(root, 'node_modules', '.cache', 'hackaware-news-tests');
const bundlePath = path.join(outDir, 'renderEntry.mjs');

let render = null;
let payload = null;

before(async () => {
  payload = JSON.parse(await readFile(path.join(__dirname, 'fixtures', 'news-payload.json'), 'utf8'));
  await mkdir(outDir, { recursive: true });
  await esbuild.build({
    entryPoints: [path.join(__dirname, 'renderEntry.jsx')],
    outfile: bundlePath,
    bundle: true,
    format: 'esm',
    platform: 'node',
    jsx: 'automatic',
    absWorkingDir: root,
    // Keep the project's own node_modules out of the bundle so the React
    // instance is the same one the test process imports.
    packages: 'external',
    logLevel: 'error',
  });
  const module = await import(pathToFileURL(bundlePath).href);
  render = module.renderAll;
});

after(async () => {
  await rm(outDir, { recursive: true, force: true });
});

test('article card renders real provider data with a safe external link', () => {
  const html = render(payload).card;
  const article = payload.articles[0];
  assert.ok(html.includes(article.title) || html.includes(article.title.replace(/&/g, '&amp;')), 'headline must render');
  assert.ok(html.includes(article.source), 'publisher name must render');
  assert.ok(html.includes(`href="${article.url}"`), 'link must point at the publisher');
  assert.ok(html.includes('target="_blank"'), 'external links open in a new tab');
  assert.ok(html.includes('rel="noopener noreferrer"'), 'external links carry rel="noopener noreferrer"');
  assert.ok(/Read full story/i.test(html));
  assert.ok(/ago|Just now|Date not provided/.test(html), 'publication time must be human readable');
  assert.ok(!html.includes('undefined'), 'no undefined values may reach the DOM');
  assert.ok(!html.includes('Invalid Date'), 'no invalid dates may reach the DOM');
  assert.ok(!/<script/i.test(html), 'no script tags may be produced');
});

test('every article in the payload renders without crashing', () => {
  const html = render(payload).feed;
  for (const article of payload.articles) {
    assert.ok(html.includes(article.url), `missing link for ${article.title}`);
  }
  assert.equal((html.match(/<article/g) || []).length, payload.articles.length);
});

test('floating ticker uses a real article link and accessible, non-live controls', () => {
  const html = render(payload).ticker;
  const article = payload.articles[0];
  assert.ok(html.includes(article.title), 'the API headline is displayed');
  assert.ok(html.includes(article.source), 'the publisher is displayed');
  assert.ok(html.includes(`href="${article.url}"`), 'the headline links to its original article');
  assert.ok(html.includes('target="_blank"'));
  assert.ok(html.includes('rel="noopener noreferrer"'));
  assert.ok(html.includes('aria-live="off"'), 'changing headlines are not repeatedly announced');
  assert.ok(html.includes('Pause headline rotation'));
  assert.ok(html.includes('Minimize cybersecurity news ticker'));
  assert.ok(html.includes('Dismiss cybersecurity news ticker for this session'));
  assert.ok(!html.includes('undefined'));
});

test('floating ticker stays hidden for empty API results', () => {
  assert.equal(render(payload).emptyTicker, '');
});

test('cards degrade gracefully when image, description and date are missing', () => {
  const html = render(payload).cardWithoutImage;
  assert.ok(html.includes('Headline without an image or a summary'));
  assert.ok(html.includes('no image available'), 'a labelled placeholder replaces the image');
  assert.ok(!/src="(null|undefined|)"/.test(html), 'no empty image src is rendered');
  // The only <img> left is the publisher favicon; no thumbnail element is emitted.
  const images = html.match(/<img[^>]*>/g) || [];
  for (const tag of images) {
    assert.ok(tag.includes('s2/favicons'), `unexpected image element: ${tag}`);
  }
  assert.ok(html.includes('Time not provided'), 'missing dates are described, not printed as NaN');
  assert.ok(html.includes('only provides a headline'), 'missing description gets an explanation');
});

test('featured story renders the publisher link and category badge', () => {
  const html = render(payload).featured;
  const featured = payload.featured;
  assert.ok(featured, 'payload contains a featured story');
  assert.ok(html.includes(featured.url));
  assert.ok(html.includes('Top Story'));
  assert.ok(html.includes('Read full story'));
  assert.ok(html.includes(featured.source));
});

test('sidebar renders advisories, recent stories and trusted sources', () => {
  const html = render(payload).sidebar;
  assert.ok(html.includes('Latest Advisories'));
  assert.ok(html.includes('Recent Security Stories'));
  assert.ok(html.includes('Trusted Sources'));
  assert.ok(html.includes('no view counts'), 'the absence of popularity metrics is stated');
  for (const advisory of payload.sections.advisories) {
    assert.ok(html.includes(advisory.url), 'advisories link to the official source');
  }
});

test('category navigation is keyboard accessible and marks the active item', () => {
  const rail = render(payload).categoryRail;
  const chips = render(payload).categoryChips;
  for (const html of [rail, chips]) {
    assert.ok(html.includes('<nav aria-label="News categories"'), 'navigation landmark with a label');
    assert.ok(html.includes('<button'), 'categories are buttons (keyboard reachable)');
    assert.ok(html.includes('aria-current="page"'), 'the active category is announced');
  }
  assert.ok(rail.includes('AI Security'));
  assert.ok(render(payload).header.includes('aria-live="polite"'), 'result counts are announced to screen readers');
});

test('empty, error, rate-limit and stale states render the required copy', () => {
  const html = render(payload);
  assert.ok(html.empty.includes('No cybersecurity stories found'), 'empty state copy');
  assert.ok(html.empty.includes('zzz'), 'the empty state echoes the search term');
  assert.ok(html.error.includes('Unable to load the latest cybersecurity news right now'));
  assert.ok(html.error.includes('Try again'));
  assert.ok(html.rateLimit.includes('Too many requests'));
  assert.ok(html.stale.includes('Showing cached stories'));
  assert.ok(html.stale.includes('may not be current'));
  assert.ok(html.sample.includes('Sample data'));
});

test('loading state renders skeletons that match the layout', () => {
  const html = render(payload).grids;
  // One pulsing wrapper per skeleton: 1 featured + 2 article cards.
  assert.ok((html.match(/animate-pulse/g) || []).length >= 3, 'skeleton blocks are present');
  assert.equal((html.match(/aria-live="polite"/g) || []).length, 1, 'the loading grid is announced once');
});
