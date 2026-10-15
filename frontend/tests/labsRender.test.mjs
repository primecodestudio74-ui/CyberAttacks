import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdir, rm, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import * as esbuild from 'esbuild';

// Same server-rendering approach as newsRender.test.mjs; no DOM dependency.
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outDir = path.join(root, 'node_modules/.cache/hackaware-lab-tests');
let render;
before(async () => {
  await mkdir(outDir, { recursive: true });
  const outfile = path.join(outDir, 'labs.mjs');
  await esbuild.build({ entryPoints: [path.join(root, 'tests/labsRenderEntry.jsx')], outfile, bundle: true, format: 'esm', platform: 'node', jsx: 'automatic', absWorkingDir: root, packages: 'external', logLevel: 'error' });
  render = (await import(pathToFileURL(outfile).href)).renderLabs;
});
after(async () => { await rm(outDir, { recursive: true, force: true }); });

for (const [key, title] of [['mitm', 'Man-in-the-Middle (MITM)'], ['dns', 'DNS Spoofing / Pharming']]) {
  test(`${title} renders with safety badge, steps, and accessible progress`, () => {
    const html = render()[key];
    assert.ok(html.includes(title));
    assert.ok(html.includes('Simulation only'));
    assert.ok(html.includes('hackaware-bank.test'));
    assert.ok(html.includes('aria-current="step"'));
    assert.ok(html.includes('role="progressbar"'));
    assert.ok(html.includes('aria-valuenow="0"'));
    assert.ok(html.includes('Reset lab'));
    assert.ok(!html.includes('undefined'));
    assert.ok(!/<(?:iframe|img|script)\b/.test(html), 'no remote assets or executable display code');
  });
}

test('both labs use existing protected routes and dashboard launch paths', async () => {
  const routes = await readFile(path.join(root, 'src/routes/AppRoutes.jsx'), 'utf8');
  const dashboard = await readFile(path.join(root, 'src/pages/CyberDashboard.jsx'), 'utf8');
  for (const [route, component] of [['mitm', 'MitmAttack'], ['dns-spoofing', 'DnsSpoofing']]) {
    assert.ok(routes.includes(`path="/dashboard/${route}"`));
    assert.ok(routes.includes(`<ProtectedRoute><${component} /></ProtectedRoute>`));
    assert.ok(dashboard.includes(`path: '/dashboard/${route}'`));
  }
});

test('lab source has no network or persistence APIs', async () => {
  for (const file of ['MitmAttack.jsx', 'DnsSpoofing.jsx']) {
    const source = await readFile(path.join(root, 'src/pages/Attacks', file), 'utf8');
    assert.ok(!/\b(?:fetch|XMLHttpRequest|WebSocket|localStorage|sessionStorage)\b/.test(source));
    assert.ok(source.includes('useReducedMotion'));
    assert.ok(!/from ['"].*(?:services|utils\/api)/.test(source));
  }
});
