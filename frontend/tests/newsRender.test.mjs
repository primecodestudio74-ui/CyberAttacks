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

import { HERO_AUTOPLAY_INTERVAL_MS, selectHeroSlides } from '../src/utils/newsHero.js';

const escapeHtml = (value) =>
  String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

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

/* -------------------------------------------------------------------------- *
 * Cyber News hero carousel (profile: dashboard hub, above the main content)
 * -------------------------------------------------------------------------- */

test('hero carousel renders the API articles, in the selector order, with real links', () => {
  const html = render(payload).hero;
  const slides = selectHeroSlides(payload);

  assert.ok(slides.length >= 3, 'the real payload yields a rotatable carousel');

  for (const slide of slides) {
    assert.ok(html.includes(escapeHtml(slide.title)), `missing headline: ${slide.title}`);
  }

  // The first slide is the one rendered as active, and it is a real article.
  assert.ok(html.includes(`href="${escapeHtml(slides[0].url)}"`), 'the lead slide links to the publisher');
  assert.ok(html.includes(escapeHtml(slides[0].source)), 'the lead slide names its publisher');
  assert.ok(html.includes('Latest cybersecurity news'), 'the editorial label is present');
  assert.ok(html.includes('Read Full Story'), 'the primary action is present');
  assert.ok(/ago|Just now/.test(html), 'the publication time is human readable');
  assert.ok(html.includes('target="_blank"'), 'external stories open in a new tab');
  assert.ok(html.includes('rel="noopener noreferrer"'), 'external links are safe');
  assert.ok(!html.includes('undefined'), 'no undefined values reach the DOM');
  assert.ok(!html.includes('Invalid Date'), 'no invalid dates reach the DOM');
});

test('hero carousel wires its controls and never announces automatic changes', () => {
  const html = render(payload).hero;
  const slides = selectHeroSlides(payload);

  assert.ok(html.includes('role="region"'));
  assert.ok(html.includes('aria-roledescription="carousel"'), 'the widget identifies itself as a carousel');
  assert.ok(html.includes('aria-label="Latest cybersecurity news"'));
  assert.ok(html.includes('aria-live="off"'), 'auto-rotation must not spam a live region');

  // Arrows
  assert.ok(/aria-label="Show the previous story/.test(html));
  assert.ok(/aria-label="Show the next story/.test(html));
  assert.ok(html.includes('title="Previous story"') && html.includes('title="Next story"'));

  // Dots + slide count
  assert.equal((html.match(/cyber-news-hero__dot"/g) || []).length, slides.length, 'one dot per slide');
  assert.equal((html.match(/aria-current="true"/g) || []).length, 1, 'exactly one dot is current');
  assert.ok(html.includes(`${String(1).padStart(2, '0')} / ${String(slides.length).padStart(2, '0')}`), 'the slide counter is rendered');
  assert.ok(html.includes('aria-label="Choose a story"'));

  // Pause control for the 6 s auto-advance (WCAG 2.2.2) and the timer read-out.
  assert.equal(HERO_AUTOPLAY_INTERVAL_MS, 6000);
  assert.ok(html.includes('Pause the automatic story rotation'));
  assert.ok(html.includes('--hero-interval-ms:6000ms'), 'the css progress bar uses the same interval');
});

test('hero carousel hides every off-screen slide from tab order and assistive tech', () => {
  const html = render(payload).hero;
  const slides = selectHeroSlides(payload);

  assert.equal((html.match(/aria-hidden="true"/g) || []).length >= 2, true);
  const hiddenSlides = (html.match(/role="group"[^>]*aria-hidden="true"/g) || []).length;
  assert.equal(hiddenSlides, slides.length - 1, 'only the active slide is exposed');
  assert.ok(html.includes('aria-label="Story 1 of '), 'the active slide is labelled');

  // Links inside hidden slides must not be reachable by keyboard.
  const inactive = html.split('role="group"').slice(1).filter((chunk) => chunk.startsWith(' aria-hidden="true"'));
  for (const chunk of inactive) {
    const anchors = chunk.match(/<a [^>]*>/g) || [];
    assert.ok(anchors.length > 0, 'inactive slides still render their content');
    for (const anchor of anchors) {
      assert.ok(anchor.includes('tabindex="-1"'), `inactive slide link is still tabbable: ${anchor}`);
    }
  }
});

test('hero carousel defers the images of far slides and prioritises the visible one', () => {
  const html = render(payload).hero;
  const slides = selectHeroSlides(payload);

  const visible = slides[0].imageUrl ? html.includes(`src="${escapeHtml(slides[0].imageUrl)}"`) : true;
  assert.ok(visible, 'the visible slide mounts its publisher thumbnail');
  assert.ok(/fetchpriority="high"/i.test(html), 'the visible hero image is the priority download');
  assert.ok(html.includes('loading="eager"'));
  assert.ok(!/fetchpriority="high"[^>]*fetchpriority="high"/i.test(html), 'only one image is high priority');

  // A slide more than one step away must not start a download.
  const htmlWithoutFavicons = html.replace(/<img[^>]*s2\/favicons[^>]*>/g, '');
  const renderedSources = htmlWithoutFavicons.match(/src="https:\/\/[^"]+"/g) || [];
  assert.ok(
    renderedSources.length <= 3,
    `expected at most the active slide plus its two neighbours to mount an image, got ${renderedSources.length}`
  );
  assert.ok(renderedSources.length >= 1, 'at least the active slide mounts an image');
});

test('hero carousel points its secondary action at the existing Cyber News section', () => {
  const html = render(payload).hero;
  assert.ok(html.includes('href="/dashboard?tab=news"'), 'Explore Cyber News reuses the dashboard news tab');
  assert.ok(html.includes('Explore Cyber News'));
});

test('hero carousel shows a layout-matched skeleton while the first request is pending', () => {
  const html = render(payload).heroLoading;
  assert.ok(html.includes('role="status"'));
  assert.ok(html.includes('aria-busy="true"'));
  assert.ok(html.includes('Loading the latest cybersecurity news'));
  assert.ok(html.includes('cyber-news-hero__skeleton-title'));
  assert.ok(!/<h2/.test(html), 'no headline is invented while loading');
  assert.ok(!/<img/.test(html), 'no image is requested while loading');
});

test('hero carousel hides itself on failure or empty news instead of inventing stories', () => {
  assert.equal(render(payload).heroError, '', 'an API failure with nothing cached renders nothing');
  assert.equal(render(payload).heroEmpty, '', 'an empty newswire renders nothing');
});

test('hero carousel drops the controls when only one story is available', () => {
  const html = render(payload).heroSingle;
  assert.ok(html.includes('cyber-news-hero__slide is-active'), 'the single story still gets a hero');
  assert.ok(html.includes('Read Full Story'));
  assert.ok(!html.includes('cyber-news-hero__nav'), 'no arrows for a single story');
  assert.ok(!html.includes('cyber-news-hero__dot"'), 'no dots for a single story');
  assert.ok(!html.includes('automatic story rotation'), 'nothing rotates when there is one story');
  assert.ok(!html.includes('cyber-news-hero__progress'), 'no auto-advance bar');
});

test('hero carousel falls back to the branded placeholder when no thumbnail exists', () => {
  const html = render(payload).heroWithoutImages;
  assert.ok(html.includes('no image available'), 'a labelled placeholder replaces the picture');
  assert.ok(!/src="(null|undefined|)"/.test(html), 'no empty image src is rendered');
  assert.ok(html.includes('cyber-news-hero__media-base'), 'the CSS artwork stays behind every slide');
  assert.ok(html.includes('Read Full Story'), 'the slide still works without a picture');

  const images = html.match(/<img[^>]*>/g) || [];
  for (const tag of images) {
    assert.ok(tag.includes('s2/favicons'), `unexpected image element in a picture-less hero: ${tag}`);
  }
});
