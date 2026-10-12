import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { prepareTickerArticles } from '../src/utils/newsTicker.js';

const fixturePath = path.join(path.dirname(fileURLToPath(import.meta.url)), 'fixtures', 'news-payload.json');
const payload = JSON.parse(await readFile(fixturePath, 'utf8'));

test('ticker articles are bounded and retain normalized publisher data', () => {
  const articles = prepareTickerArticles(payload.articles, 3);
  assert.equal(articles.length, 3);
  assert.equal(articles[0].title, payload.articles[0].title);
  assert.equal(articles[0].source, payload.articles[0].source);
  assert.equal(articles[0].url, payload.articles[0].url);
  assert.equal(articles[0].publishedAt, payload.articles[0].publishedAt);
});

test('ticker rejects malformed and unsafe destinations, and removes duplicate headlines', () => {
  const articles = prepareTickerArticles([
    {
      title: '  Unique security update  ',
      url: 'https://publisher.example/story?ref=feed#top',
      source: 'Example Publisher',
      publishedAt: '2026-10-12T09:00:00.000Z',
    },
    {
      title: 'unique security update!',
      url: 'https://another.example/repost',
      publishedAt: '2026-10-12T08:00:00.000Z',
    },
    { title: 'Unsafe scheme', url: 'javascript:alert(1)' },
    { title: 'Relative link', url: '/news/story' },
    { title: '  ', url: 'https://publisher.example/no-title' },
    { title: 'Credential URL', url: 'https://user:password@publisher.example/story' },
    null,
  ]);

  assert.equal(articles.length, 1);
  assert.equal(articles[0].title, 'Unique security update');
  assert.equal(articles[0].url, 'https://publisher.example/story?ref=feed#top');
  assert.equal(articles[0].source, 'Example Publisher');
});

test('ticker skips invalid publication dates and preserves usable headlines', () => {
  const [article] = prepareTickerArticles([
    { title: 'Undated security advisory', url: 'https://publisher.example/advisory', publishedAt: 'not-a-date' },
  ]);

  assert.equal(article.publishedAt, null);
  assert.equal(article.source, '');
});
