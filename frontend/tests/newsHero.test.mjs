/**
 * Selection + rotation logic for the dashboard's Cyber News hero carousel.
 *
 *   npm --prefix frontend run test:render
 *
 * These are the pure rules that decide which real articles become slides and
 * how the index moves - no React, no network. The component markup is covered
 * by newsRender.test.mjs, which renders the carousel against a real /api/news
 * payload.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  HERO_AUTOPLAY_INTERVAL_MS,
  HERO_SLIDE_LIMIT,
  isWithinImageWindow,
  nextSlideIndex,
  normalizeSlideIndex,
  previousSlideIndex,
  safeHeroImageUrl,
  safeHeroUrl,
  selectHeroSlides,
  shouldAutoRotate,
} from '../src/utils/newsHero.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const payload = JSON.parse(await readFile(path.join(__dirname, 'fixtures', 'news-payload.json'), 'utf8'));

const article = (overrides = {}) => ({
  id: 'news_test',
  title: 'Critical zero-day exploited in the wild against edge appliances',
  description: 'Researchers observed active exploitation of the flaw, which allows unauthenticated remote code execution.',
  imageUrl: 'https://cdn.example.com/a.jpg',
  source: 'Example Wire',
  sourceId: 'example-wire',
  publishedAt: new Date(Date.now() - 3600 * 1000).toISOString(),
  url: 'https://example.com/story',
  category: 'cyber-attacks',
  categoryLabel: 'Cyber Attacks',
  categories: ['cyber-attacks'],
  tags: [],
  cveIds: [],
  isAdvisory: false,
  ...overrides,
});

test('the auto-slide interval is 6 seconds and configured in one place', () => {
  assert.equal(HERO_AUTOPLAY_INTERVAL_MS, 6000);
  assert.equal(HERO_SLIDE_LIMIT, 5);
});

test('real API payload produces up to five usable, de-duplicated slides', () => {
  const slides = selectHeroSlides(payload);
  assert.ok(slides.length >= 3 && slides.length <= HERO_SLIDE_LIMIT, `unexpected slide count: ${slides.length}`);

  const keys = new Set(slides.map((slide) => slide.key));
  assert.equal(keys.size, slides.length, 'no canonical URL may be repeated');

  const titles = new Set(slides.map((slide) => slide.title.toLowerCase()));
  assert.equal(titles.size, slides.length, 'the same headline may not fill two slides');

  for (const slide of slides) {
    assert.ok(slide.title.length > 0, 'every slide has a headline');
    assert.match(slide.url, /^https:\/\//, 'every slide links to the publisher over https');
    assert.ok(payload.articles.some((item) => item.title === slide.title) || payload.featured?.title === slide.title,
      'every slide comes from the API response, never from local content');
  }

  // The featured story also appears in the article list; it must appear once.
  if (payload.featured) {
    const matches = slides.filter((slide) => slide.title === payload.featured.title);
    assert.ok(matches.length <= 1, 'the featured story is not duplicated');
  }
});

test('articles without a usable http(s) URL are never turned into slides', () => {
  const slides = selectHeroSlides({
    articles: [
      article({ url: 'javascript:alert(1)' }),
      article({ url: 'data:text/html,<script>alert(1)</script>', title: 'Second unusable destination here' }),
      article({ url: '/relative/path', title: 'Third unusable destination for the hero' }),
      article({ url: 'https://user:pass@example.com/story', title: 'Fourth destination with credentials' }),
      article({ url: undefined, title: 'Fifth slide with no destination at all' }),
      article({ url: 'https://example.com/only-valid', title: 'The only story with a valid destination' }),
    ],
  });
  assert.equal(slides.length, 1);
  assert.equal(slides[0].url, 'https://example.com/only-valid');
});

test('slides are ordered by editorial usefulness, then recency', () => {
  const slides = selectHeroSlides({
    articles: [
      article({ url: 'https://example.com/old', title: 'Stale illustrated story from two years ago', publishedAt: '2024-01-01T00:00:00.000Z' }),
      article({ url: 'https://example.com/no-image', title: 'Fresh story without any picture at all', imageUrl: null }),
      article({ url: 'https://example.com/fresh', title: 'Fresh illustrated story from today' }),
    ],
  });
  assert.equal(slides.length, 3);
  assert.equal(slides[0].url, 'https://example.com/fresh', 'a recent illustrated story leads');
  assert.equal(slides.at(-1).url, 'https://example.com/old', 'a stale story ranks last even when it has a picture');
});

test('a real thumbnail outranks an otherwise equivalent story without one', () => {
  const publishedAt = new Date().toISOString();
  const slides = selectHeroSlides({
    articles: [
      article({ url: 'https://example.com/plain', title: 'Same story published without a picture', imageUrl: null, publishedAt }),
      article({ url: 'https://example.com/photo', title: 'Same story published with a picture', publishedAt }),
    ],
  });
  assert.equal(slides[0].url, 'https://example.com/photo');
});

test('identical stories (same URL or same headline) collapse into one slide', () => {
  const slides = selectHeroSlides({
    articles: [
      article({ url: 'https://example.com/story#section', title: 'Ransomware crew breached the vendor network' }),
      article({ url: 'https://example.com/story/', title: 'Ransomware crew breached the vendor network' }),
      article({ url: 'https://other.example.com/report', title: 'Ransomware crew breached the vendor network' }),
      article({ url: 'https://example.com/second', title: 'A genuinely different second headline' }),
    ],
  });
  assert.equal(slides.length, 2);
});

test('sponsored posts only appear when nothing else is available', () => {
  const mixed = selectHeroSlides({
    articles: [
      article({ url: 'https://example.com/ad', title: 'Sponsored product announcement for the hero', tags: ['Sponsored'] }),
      article({ url: 'https://example.com/news', title: 'Independent reporting on a real incident' }),
    ],
  });
  assert.equal(mixed.length, 1);
  assert.equal(mixed[0].url, 'https://example.com/news');

  const sponsoredOnly = selectHeroSlides({
    articles: [article({ url: 'https://example.com/ad', title: 'Sponsored product announcement for the hero', tags: ['Sponsored'] })],
  });
  assert.equal(sponsoredOnly.length, 1, 'a sponsored story is still better than an empty hero');
});

test('one publisher cannot fill the carousel up front while others are covered', () => {
  // Identical timestamps keep every candidate on the same score, so the only
  // thing separating them is the per-publisher rule being tested here.
  const publishedAt = new Date().toISOString();
  const singleOutlet = Array.from({ length: 4 }, (_, index) =>
    article({ url: `https://one.example.com/${index}`, title: `Story number ${index} from the same outlet`, publishedAt })
  );
  const capped = selectHeroSlides({ articles: singleOutlet });
  assert.equal(capped.length, 4, 'the cap relaxes rather than returning fewer slides than the pool allows');

  const mixed = selectHeroSlides({
    articles: [
      ...singleOutlet.slice(0, 3),
      article({ url: 'https://two.example.com/1', title: 'Another outlet covers the same beat', source: 'Second Wire', publishedAt }),
    ],
  });
  assert.equal(mixed[0].source, 'Example Wire');
  assert.equal(mixed[1].source, 'Example Wire');
  assert.equal(mixed[2].source, 'Second Wire', 'a third story from the same publisher only comes after another outlet');
});

test('missing description, image, publisher and date degrade without breaking the slide', () => {
  const [slide] = selectHeroSlides({
    articles: [
      article({
        url: 'https://example.com/bare',
        title: 'Headline only story with no metadata at all',
        description: null,
        imageUrl: null,
        source: null,
        category: null,
        categoryLabel: null,
        publishedAt: null,
      }),
    ],
  });
  assert.equal(slide.excerpt, null);
  assert.equal(slide.imageUrl, null);
  assert.equal(slide.source, null);
  assert.equal(slide.publishedAt, null);
  assert.equal(slide.category, 'general-cyber', 'a missing category falls back to the internal badge');
  assert.ok(!JSON.stringify(slide).includes('undefined'), 'no undefined leaks into the slide');
});

test('empty, failed and malformed payloads produce no slides (never fake ones)', () => {
  assert.deepEqual(selectHeroSlides(null), []);
  assert.deepEqual(selectHeroSlides({}), []);
  assert.deepEqual(selectHeroSlides({ articles: [], featured: null }), []);
  assert.deepEqual(selectHeroSlides([null, undefined, 'nope', 42]), []);
  assert.deepEqual(selectHeroSlides({ articles: [article({ title: 'short', url: 'https://example.com/x' })] }), []);
});

test('slide helpers accept a bare article array and honour the limit', () => {
  const slides = selectHeroSlides([article({ url: 'https://example.com/1', title: 'First usable headline for the hero' })], { limit: 1 });
  assert.equal(slides.length, 1);
  assert.deepEqual(selectHeroSlides([article()], { limit: 0 }), []);
});

test('index helpers wrap in both directions and clamp out-of-range values', () => {
  assert.equal(nextSlideIndex(0, 5), 1);
  assert.equal(nextSlideIndex(4, 5), 0, 'the last slide wraps back to the first');
  assert.equal(previousSlideIndex(0, 5), 4, 'the first slide wraps back to the last');
  assert.equal(nextSlideIndex(7, 5), 3, 'an out-of-range index is normalised first');
  assert.equal(normalizeSlideIndex(-1, 5), 4);
  assert.equal(normalizeSlideIndex(12, 5), 2);
  assert.equal(nextSlideIndex(0, 0), 0);
  assert.equal(previousSlideIndex(0, 1), 0);
});

test('image window only mounts the active slide and its neighbours', () => {
  assert.equal(isWithinImageWindow(0, 0, 5), true);
  assert.equal(isWithinImageWindow(1, 0, 5), true);
  assert.equal(isWithinImageWindow(4, 0, 5), true, 'the wrapping neighbour counts');
  assert.equal(isWithinImageWindow(2, 0, 5), false);
  assert.equal(isWithinImageWindow(3, 0, 5), false);
  assert.equal(isWithinImageWindow(2, 2, 5), true);
  assert.equal(isWithinImageWindow(1, 0, 3), true, 'small carousels load every image');
  assert.equal(isWithinImageWindow(0, 0, 0), false);
});

test('URL validation only accepts safe absolute http(s) destinations', () => {
  assert.equal(safeHeroUrl('https://example.com/a').url, 'https://example.com/a');
  assert.equal(safeHeroUrl('http://example.com/a').key, 'http://example.com/a');
  assert.equal(safeHeroUrl('https://www.example.com/a/#frag').key, 'https://example.com/a', 'canonical key drops www, slash and fragment');
  assert.equal(safeHeroUrl('javascript:alert(1)'), null);
  assert.equal(safeHeroUrl('//example.com/a'), null);
  assert.equal(safeHeroUrl('ftp://example.com/a'), null);
  assert.equal(safeHeroUrl('   '), null);
  assert.equal(safeHeroImageUrl('https://cdn.example.com/a.jpg'), 'https://cdn.example.com/a.jpg');
  assert.equal(safeHeroImageUrl('javascript:alert(1)'), null);
  assert.equal(safeHeroImageUrl('data:image/png;base64,AAAA'), null);
});

test('rotation stops for hover, focus, hidden tabs, pause, reduced motion and single stories', () => {
  const base = { slideCount: 5 };
  assert.equal(shouldAutoRotate(base), true, 'a multi-story hero rotates by default');
  assert.equal(shouldAutoRotate({ ...base, hovered: true }), false, 'the pointer pauses rotation');
  assert.equal(shouldAutoRotate({ ...base, focused: true }), false, 'focus inside the widget pauses rotation');
  assert.equal(shouldAutoRotate({ ...base, pageHidden: true }), false, 'a hidden tab never advances slides');
  assert.equal(shouldAutoRotate({ ...base, pausedByUser: true }), false, 'the pause button stops rotation');
  assert.equal(shouldAutoRotate({ ...base, prefersReducedMotion: true }), false, 'reduced motion disables auto-advance');
  assert.equal(shouldAutoRotate({ slideCount: 1 }), false, 'a single story never cycles');
  assert.equal(shouldAutoRotate({ slideCount: 0 }), false);
  assert.equal(shouldAutoRotate({ slideCount: 2, hovered: true, focused: true }), false, 'any one reason is enough');
  assert.equal(shouldAutoRotate(), false, 'a missing article list cannot rotate');
});

test('the hero never fetches news itself (one query per dashboard, no polling)', async () => {
  const source = await readFile(path.join(__dirname, '..', 'src', 'components', 'News', 'CyberNewsHero.jsx'), 'utf8');
  assert.ok(!source.includes('newsService'), 'the hero must reuse the dashboard query, not the API client');
  assert.ok(!/\bfetch\s*\(/.test(source), 'the hero must not perform its own network requests');
  assert.ok(!/from '[^']*hooks\/useNews/.test(source), 'the hero receives articles as props; it starts no second query');
  assert.ok(source.includes('clearInterval'), 'the auto-advance timer is cleaned up');
  assert.ok(source.includes('removeEventListener'), 'listeners are removed on unmount');
});
