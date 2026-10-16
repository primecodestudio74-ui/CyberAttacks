/**
 * Render tests for the Resources hub (dashboard ?tab=resources).
 *
 *   npm --prefix frontend run test:render
 *
 * Follows newsRender.test.mjs / xssRender.test.mjs: Node's runner + the
 * existing esbuild dependency + react-dom/server - no new tooling. The curated
 * list lives in the component, so the expectations are read back out of the
 * source instead of being duplicated here.
 */

import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdir, rm, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import * as esbuild from 'esbuild';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outDir = path.join(root, 'node_modules/.cache/hackaware-resources-tests');
const componentPath = path.join(root, 'src/components/Resources/ResourcesHub.jsx');
const dashboardPath = path.join(root, 'src/pages/CyberDashboard.jsx');

let renderHub;
let source;

before(async () => {
  source = await readFile(componentPath, 'utf8');
  await mkdir(outDir, { recursive: true });
  const outfile = path.join(outDir, 'resources.mjs');
  await esbuild.build({
    entryPoints: [path.join(root, 'tests/resourcesRenderEntry.jsx')],
    outfile,
    bundle: true,
    format: 'esm',
    platform: 'node',
    jsx: 'automatic',
    absWorkingDir: root,
    packages: 'external',
    loader: { '.css': 'empty' },
    logLevel: 'error',
  });
  const module = await import(pathToFileURL(outfile).href);
  renderHub = module.renderResourcesHub;
});

after(async () => {
  await rm(outDir, { recursive: true, force: true });
});

/** Official links and names straight out of the curated list. */
const curatedUrlPairs = (text) => {
  const urls = [...text.matchAll(/url: '([^']+)'/g)].map((match) => match[1]);
  const names = [...text.matchAll(/name: '([^']+)'/g)].map((match) => match[1]);
  return urls.map((url, index) => ({ url, name: names[index] }));
};

test('every curated resource renders once with a safe external link', () => {
  const html = renderHub();
  const pairs = curatedUrlPairs(source);
  assert.ok(pairs.length >= 19, `expected the curated list, found ${pairs.length} entries`);
  for (const { url, name } of pairs) {
    assert.ok(html.includes(`href="${url}"`), `missing link for ${name}`);
    assert.ok(html.includes(name), `missing card title for ${name}`);
    assert.ok(html.startsWith('<div'), 'the hub renders inside the dashboard shell');
  }
  assert.equal((html.match(/href="/g) || []).length, pairs.length, 'one link per resource, no extras');
  assert.equal((html.match(/target="_blank"/g) || []).length, pairs.length, 'every card opens in a new tab');
  assert.equal(
    (html.match(/rel="noopener noreferrer"/g) || []).length,
    pairs.length,
    'every external link carries rel="noopener noreferrer"'
  );
});

test('external destinations are https and belong to their official hosts', () => {
  for (const { url, name } of curatedUrlPairs(source)) {
    assert.ok(url.startsWith('https://'), `${name} must link over https`);
  }
  const html = renderHub();
  assert.ok(html.includes('https://cybercrime.gov.in/'), 'the national reporting portal is reachable');
  assert.ok(html.includes('https://www.cert-in.org.in/'), 'CERT-In is reachable');
});

test('each card carries a non-empty safety notice and a category badge', () => {
  const html = renderHub();
  const badges = [...source.matchAll(/badge: '([^']+)'/g)].map((match) => match[1]);
  const notices = [...source.matchAll(/safetyNotice: '([^']+)'/g)].map((match) => match[1]);
  assert.equal(badges.length, curatedUrlPairs(source).length, 'every resource has a badge');
  assert.equal(notices.length, curatedUrlPairs(source).length, 'every resource has a safety notice');
  for (const notice of notices) {
    assert.ok(notice.trim().length > 20, `safety notice is too short: ${notice}`);
    assert.ok(html.includes(notice.replace(/&/g, '&amp;')), `safety notice missing from the DOM: ${notice}`);
  }
  assert.ok(html.includes('Banks never ask for OTP, UPI PIN, or CVV numbers'), 'the OTP warning is shown');
});

test('filters, counts and icons render without placeholders leaking', () => {
  const html = renderHub();
  for (const category of [
    'All',
    'Account &amp; Data Safety',
    'Scam &amp; Phishing Awareness',
    'Practical Labs',
    'Official Indian Cyber Safety',
  ]) {
    assert.ok(html.includes(`>${category}</button>`), `missing category filter: ${category}`);
  }
  assert.ok(html.includes('aria-pressed="true"'), 'the active filter is announced to assistive tech');
  assert.ok(html.includes('aria-label="Filter resources"'), 'the search box is labelled');
  assert.ok(
    html.includes(`Showing <span class="text-cyan-500">${curatedUrlPairs(source).length}</span> of ${curatedUrlPairs(source).length} resources`),
    'the result count reflects the full list'
  );
  assert.ok((html.match(/<svg/g) || []).length >= curatedUrlPairs(source).length, 'every card shows an icon');
  assert.ok(!html.includes('undefined'), 'no undefined values may reach the DOM');
  assert.ok(!html.includes('NaN'), 'no NaN values may reach the DOM');
  assert.ok(!/<script/i.test(html), 'no script tags may be produced');
});

test('the hub is self-contained: no fetching, no localhost, no secrets', () => {
  assert.ok(!/\bfetch\s*\(/.test(source), 'the hub never fetches anything itself');
  assert.ok(!/from '\.\.\/\.\.\/services/.test(source), 'the hub has no service dependency');
  assert.ok(!/localhost|127\.0\.0\.1/.test(source), 'no hardcoded localhost URLs');
  assert.ok(!/apiKey|API_KEY|token/i.test(source), 'no credentials are involved');
});

test('the dashboard exposes the hub as a real sidebar tab', async () => {
  const dashboard = await readFile(dashboardPath, 'utf8');
  assert.ok(/DASHBOARD_TABS = \[[^\]]*'resources'/.test(dashboard), "'resources' is a known dashboard tab");
  assert.equal((dashboard.match(/label="Resources"/g) || []).length, 1, 'exactly one sidebar link is added');
  assert.ok(dashboard.includes("onClick={() => handleTabChange('resources')}"), 'the link switches the tab');
  assert.ok(dashboard.includes("active={activeTab === 'resources'}"), 'the link shows the active state');
  assert.equal((dashboard.match(/<ResourcesHub \/>/g) || []).length, 1, 'the hub renders exactly once');
  assert.ok(dashboard.includes("import ResourcesHub from '../components/Resources/ResourcesHub'"), 'the hub is imported');
  assert.ok(/tab: 'resources'/.test(dashboard), 'the hub is reachable from the home quick actions');
});
