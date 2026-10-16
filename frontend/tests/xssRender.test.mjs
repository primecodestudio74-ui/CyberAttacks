/**
 * Follows newsRender.test.mjs: Node's runner + the existing esbuild dependency
 * + react-dom/server. The real reducer supplies render states; no test-only
 * implementation of the simulator and no new DOM/testing dependencies.
 *
 * These assertions cover rendering and transitions, not browser event wiring.
 * See docs/xss-lab.md for the complementary browser checks.
 */
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdir, rm, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import * as esbuild from 'esbuild';
import * as espree from 'espree'; // already installed by the project's ESLint
import {
  createXSSState,
  getXSSOutcome,
  getXSSScenes,
  MAX_COMMENT_LENGTH,
  XSS_DEMOS,
  XSS_STEPS,
  XSS_TYPES,
  xssReducer,
} from '../src/utils/xssSimulation.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outDir = path.join(root, 'node_modules/.cache/hackaware-xss-tests');
let renderInitial;
let renderState;
const reduce = (state, ...actions) => actions.reduce(xssReducer, state);
const atStep = (step) => xssReducer(createXSSState(), { type: 'STEP', step });
const advance = (state) => xssReducer(state, { type: 'ADVANCE', scene: state.scene, runId: state.runId });
const finished = (state = atStep(2)) => {
  let result = xssReducer(state, { type: 'SUBMIT' });
  for (let i = 0; i < 3; i += 1) result = advance(result);
  return result;
};
const escaped = (text) =>
  text.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');

before(async () => {
  await mkdir(outDir, { recursive: true });
  const outfile = path.join(outDir, 'xss.mjs');
  await esbuild.build({
    entryPoints: [path.join(root, 'tests/xssRenderEntry.jsx')],
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
  renderInitial = module.renderInitialXSS;
  renderState = module.renderXSSState;
});

after(async () => {
  await rm(outDir, { recursive: true, force: true });
});

test('XSS lab renders with the safety badge and exactly four primary steps', () => {
  const html = renderInitial();
  assert.match(html, /Cross-site scripting/);
  assert.match(html, /Simulation only/);
  assert.deepEqual(XSS_STEPS, ['Intel', 'Setup', 'Attack Simulation', 'Secure It']);
  const nav = html.match(/<nav aria-label="XSS lab steps"[\s\S]*?<\/nav>/)?.[0];
  assert.ok(nav);
  assert.equal((nav.match(/<button\b/g) || []).length, 4);
  for (const step of XSS_STEPS) assert.ok(nav.includes(step));
  assert.match(nav, /aria-current="step"/);
  assert.match(html, /role="progressbar"[^>]*aria-label="Learning step"/);
  assert.match(html, /aria-valuenow="1"/);
  assert.match(html, /Reset lab/);
  assert.ok(!html.includes('undefined'));
});

test('Intel renders the analogy, owner, attacker, visitor, and three expandable paths', () => {
  const html = renderInitial();
  assert.ok(html.includes('Imagine a website has a public noticeboard.'));
  for (const text of ['The website owner', 'An attacker posts', 'A visitor opens the page', 'Watch the flow'])
    assert.ok(html.includes(text));
  for (const type of XSS_TYPES) {
    const selected = xssReducer(createXSSState(), { type: 'SELECT_TYPE', id: type.id });
    const markup = renderState(selected);
    assert.ok(markup.includes(type.title));
    assert.ok(markup.includes(`aria-label="${type.title} simplified flow"`));
    for (const label of type.flow) assert.ok(markup.includes(label));
    assert.ok(markup.includes('aria-expanded="true"'));
  }
});

test('Setup offers native radio controls for Vulnerable Website and Protected Website', () => {
  const vulnerable = renderState(atStep(1));
  const protectedState = xssReducer(atStep(1), { type: 'MODE', mode: 'secure' });
  const protectedHtml = renderState(protectedState);
  for (const [html, selectedLabel] of [
    [vulnerable, 'Vulnerable Website'],
    [protectedHtml, 'Protected Website'],
  ]) {
    const inputs = html.match(/<input\b[^>]*>/g) || [];
    assert.equal(inputs.filter((tag) => tag.includes('type="radio"')).length, 2);
    assert.ok(inputs.find((tag) => tag.includes(`aria-label="${selectedLabel}"`))?.includes('checked=""'));
    assert.ok(html.includes('for="xss-comment"'));
    assert.ok(html.includes('for="xss-demo-input"'));
    assert.ok(html.includes('for="xss-flow-type"'));
    assert.ok(html.includes('Display-only code'));
    assert.ok(html.includes('community.hackaware.test'));
  }
});

test('the four scenes advance deterministically and stop at the cause', () => {
  let state = xssReducer(atStep(2), { type: 'PLAY' });
  assert.equal(state.scene, 0);
  assert.equal(getXSSOutcome(state).impact, false);
  state = advance(state);
  assert.equal(state.scene, 1);
  assert.equal(getXSSOutcome(state).impact, false);
  assert.equal(getXSSScenes(state)[1].text, 'Untrusted input reached an unsafe rendering location.');
  state = advance(state);
  assert.equal(state.scene, 2);
  assert.equal(getXSSOutcome(state).impact, true);
  state = advance(state);
  assert.equal(state.scene, 3);
  assert.equal(state.playing, false);
  assert.deepEqual(advance(state), state);
});

test('the vulnerable preset shows a clearly labeled, fixed React browser effect', () => {
  const state = finished();
  const html = renderState(state);
  assert.equal(state.submission.effect, 'banner');
  assert.ok(html.includes('data-simulated-impact="banner"'));
  assert.ok(html.includes('SIMULATED BROWSER EFFECT'));
  assert.ok(html.includes('Unsafe rendering detected'));
  assert.ok(
    html.includes('The website treated untrusted input as something to interpret instead of ordinary text.')
  );
  assert.ok(html.includes(escaped(XSS_DEMOS[0].input)));
  for (const label of ['WHAT WENT IN', 'HOW IT WAS HANDLED', 'WHAT THE VISITOR SAW'])
    assert.ok(html.includes(label));
  assert.ok(!/<(?:script|iframe|img|object|embed)\b/i.test(html));
});

test('switching to secure mode removes the unsafe impact and displays the identical input literally', () => {
  const unsafe = xssReducer(finished(), { type: 'STEP', step: 3 });
  const safe = xssReducer(unsafe, { type: 'MODE', mode: 'secure' });
  const html = renderState(safe);
  assert.equal(safe.submission, unsafe.submission, 'mode changes reuse the exact submission snapshot');
  assert.equal(getXSSOutcome(safe).impact, false);
  assert.equal(safe.playing, false);
  assert.ok(!html.includes('data-simulated-impact'));
  assert.ok(!html.includes('This banner wasn’t part of the page.'));
  assert.ok(html.includes('data-literal-comment="true"'));
  assert.ok(html.includes(escaped(unsafe.submission.text)));
  assert.ok(html.includes('Safe rendering enabled'));
  assert.match(html, /role="switch" aria-label="Secure Mode" aria-checked="true"/);
  assert.ok(html.includes('Vulnerable Mode') && html.includes('Secure Mode'));
  assert.ok(html.includes('One pattern, not a universal patch.'));
});

test('a mode change invalidates old animation completions, including mid-playback', () => {
  const playing = xssReducer(atStep(2), { type: 'PLAY' });
  const safe = xssReducer(playing, { type: 'MODE', mode: 'secure' });
  const stale = xssReducer(safe, { type: 'ADVANCE', scene: playing.scene, runId: playing.runId });
  assert.deepEqual(stale, safe);
  assert.equal(getXSSOutcome(stale).impact, false);
  const replay = xssReducer(safe, { type: 'REPLAY' });
  assert.equal(replay.mode, 'secure');
  assert.equal(finished(replay).submission.text, playing.input);
  assert.equal(getXSSOutcome(finished(replay)).impact, false);
});

test('Secure It works even when reached directly, and supports switching back for comparison', () => {
  const safe = xssReducer(atStep(3), { type: 'MODE', mode: 'secure' });
  assert.equal(safe.scene, 3);
  assert.equal(safe.submission.text, XSS_DEMOS[0].input);
  assert.equal(getXSSOutcome(safe).impact, false);
  const unsafe = xssReducer(safe, { type: 'MODE', mode: 'vulnerable' });
  assert.equal(getXSSOutcome(unsafe).impact, true);
  assert.equal(unsafe.step, 3);
  assert.equal(unsafe.submission, safe.submission);
});

test('pause freezes scene advancement; resume and replay work without resetting the input', () => {
  const playing = xssReducer(atStep(2), { type: 'PLAY' });
  const paused = xssReducer(playing, { type: 'PAUSE' });
  assert.deepEqual(advance(paused), paused);
  const resumed = xssReducer(paused, { type: 'PLAY' });
  assert.equal(resumed.runId, playing.runId, 'resume preserves the in-scene playback clock');
  assert.equal(advance(resumed).scene, 1);
  const replayed = xssReducer(finished(resumed), { type: 'REPLAY' });
  assert.equal(replayed.scene, 0);
  assert.equal(replayed.input, playing.input);
  assert.equal(getXSSOutcome(replayed).impact, false);
});

test('manual controls can reach every scene without relying on time or animation', () => {
  let state = atStep(2);
  for (let index = 0; index < 4; index += 1) {
    state = xssReducer(state, { type: 'NEXT_SCENE' });
    assert.equal(state.scene, index);
    assert.equal(state.playing, false);
  }
  assert.equal(xssReducer(state, { type: 'NEXT_SCENE' }).scene, 3);
  const rewound = xssReducer(state, { type: 'SEEK', scene: 0 });
  assert.equal(getXSSOutcome(rewound).impact, false);
  assert.equal(rewound.submission, state.submission);
  const html = renderState(rewound);
  for (const text of ['Play simulation', 'Replay', 'Reset', 'Next scene', 'Event log'])
    assert.ok(html.includes(text));
});

test('Back/Next preserve input, type, mode and result, and pause an active run', () => {
  let state = reduce(
    atStep(2),
    { type: 'SELECT_TYPE', id: 'dom' },
    { type: 'MODE', mode: 'secure' },
    { type: 'INPUT', value: 'Hello, board!' },
    { type: 'PLAY' }
  );
  const snapshot = state.submission;
  state = xssReducer(state, { type: 'STEP', step: 1 });
  assert.equal(state.playing, false);
  assert.equal(state.type, 'dom');
  assert.equal(state.mode, 'secure');
  assert.equal(state.input, 'Hello, board!');
  assert.equal(state.submission, snapshot);
  state = xssReducer(state, { type: 'STEP', step: 2 });
  assert.equal(state.submission, snapshot);
  assert.ok(state.completed.includes(1));
  assert.equal(state.scene, 0);
});

test('Reset clears only the run, while Reset lab restores the four-step starting state', () => {
  const safe = xssReducer(finished(), { type: 'MODE', mode: 'secure' });
  const reset = xssReducer(safe, { type: 'RESET_SCENARIO' });
  assert.equal(reset.scene, -1);
  assert.equal(reset.submission, null);
  assert.equal(reset.mode, 'secure');
  assert.equal(reset.input, safe.input);
  assert.equal(reset.step, 2);
  assert.ok(!renderState(reset).includes('data-simulated-impact'));
  const fullReset = xssReducer(reset, { type: 'RESET_LAB' });
  assert.deepEqual({ ...fullReset, runId: 0 }, createXSSState());
});

test('both effect presets are fixed effects; the friendly comment has no impact', () => {
  for (const demo of XSS_DEMOS) {
    const state = finished(xssReducer(atStep(2), { type: 'SELECT_DEMO', id: demo.id }));
    assert.equal(state.submission.effect, demo.effect);
    assert.equal(getXSSOutcome(state).impact, Boolean(demo.effect));
    const html = renderState(state);
    assert.equal(html.includes('data-simulated-impact'), Boolean(demo.effect));
    if (demo.effect === 'headline') assert.ok(html.includes('Someone changed this headline.'));
  }
});

test('all typed markup is escaped as text in both modes, never used as a demo trigger', () => {
  const inputs = [
    '<script>window.__xss_test = true</script>',
    '<img src=x onerror="window.__xss_test=true">',
    '<iframe srcdoc="<script>alert(1)</script>"></iframe>',
    '<svg onload="alert(1)"> & "quoted" </svg>',
    XSS_DEMOS[0].input, // an exact typed copy must still be text-only
  ];
  for (const input of inputs) {
    for (const mode of ['vulnerable', 'secure']) {
      const state = finished(reduce(atStep(2), { type: 'MODE', mode }, { type: 'INPUT', value: input }));
      const html = renderState(state);
      assert.equal(state.submission.effect, null);
      assert.equal(state.demoId, 'custom');
      assert.equal(getXSSOutcome(state).impact, false);
      assert.ok(html.includes(escaped(input)));
      assert.ok(!html.includes('data-simulated-impact'));
      assert.ok(!/<(?:script|img|iframe|object|embed)\b/i.test(html));
      assert.ok(!/<svg[^>]*onload=/i.test(html));
    }
  }
});

test('empty input cannot play or seek and comments are length bounded', () => {
  for (const value of ['', '  \n  ']) {
    const state = xssReducer(atStep(2), { type: 'INPUT', value });
    for (const action of [
      { type: 'PLAY' },
      { type: 'SUBMIT' },
      { type: 'NEXT_SCENE' },
      { type: 'SEEK', scene: 2 },
    ])
      assert.deepEqual(xssReducer(state, action), state);
  }
  const bounded = xssReducer(atStep(1), { type: 'INPUT', value: 'x'.repeat(2000) });
  assert.equal(bounded.input.length, MAX_COMMENT_LENGTH);
});

test('editing or choosing a different flow clears stale effects and rejects unknown actions', () => {
  const state = finished();
  for (const action of [
    { type: 'INPUT', value: 'new comment' },
    { type: 'SELECT_DEMO', id: 'headline' },
    { type: 'SELECT_TYPE', id: 'reflected' },
  ]) {
    const changed = xssReducer(state, action);
    assert.equal(changed.scene, -1);
    assert.equal(changed.submission, null);
    assert.equal(getXSSOutcome(changed).impact, false);
  }
  for (const action of [
    { type: 'MODE', mode: 'fake' },
    { type: 'SELECT_TYPE', id: 'fake' },
    { type: 'SELECT_DEMO', id: 'fake' },
    { type: 'STEP', step: 4 },
    { type: 'SEEK', scene: -1 },
  ])
    assert.deepEqual(xssReducer(state, action), state);
});

test('all primary steps retain the safety badge, focus target, navigation, and text status', () => {
  for (let step = 0; step < 4; step += 1) {
    const html = renderState(atStep(step));
    assert.ok(html.includes('Simulation only'));
    assert.ok(html.includes('id="xss-step-heading" tabindex="-1"'));
    assert.ok(html.includes('role="status" aria-live="polite" aria-atomic="true"'));
    assert.ok(html.includes('Back'));
    assert.ok(html.includes(`aria-valuenow="${step + 1}"`));
    assert.ok(!html.includes('undefined'));
  }
});

test('secure examples remain display-only and explain the limits of plain text rendering', () => {
  const html = renderState(xssReducer(atStep(3), { type: 'MODE', mode: 'secure' }));
  for (const text of [
    'Vulnerable example',
    'Secure example',
    'Display-only examples',
    'innerHTML',
    '&lt;p&gt;',
    'What if my application needs rich HTML?',
    'Content Security Policy',
    'URL-scheme validation',
  ])
    assert.ok(html.includes(text));
  assert.ok(!/<script\b/i.test(html));
});

test('one XSS card and route use the existing ProtectedRoute without changing its gate', async () => {
  const routes = await readFile(path.join(root, 'src/routes/AppRoutes.jsx'), 'utf8');
  const dashboard = await readFile(path.join(root, 'src/pages/CyberDashboard.jsx'), 'utf8');
  assert.equal((routes.match(/path="\/dashboard\/xss"/g) || []).length, 1);
  assert.ok(routes.includes('<ProtectedRoute><XSSAttack /></ProtectedRoute>'));
  assert.equal((dashboard.match(/path: '\/dashboard\/xss'/g) || []).length, 1);
  assert.ok(routes.includes("localStorage.getItem('operator_token') || localStorage.getItem('token')"));
  assert.ok(routes.includes('if (!token) return <Navigate to="/" replace />;'));
});

test('lab code has no executable sinks, network calls, credential access or persistence', async () => {
  const files = [
    'src/pages/Attacks/XSSAttack.jsx',
    'src/components/Attacks/XSSSimulationStage.jsx',
    'src/components/Attacks/XSSCodeComparison.jsx',
    'src/hooks/useXSSPlayback.js',
    'src/utils/xssSimulation.js',
  ];
  const forbiddenGlobals = new Set([
    'eval',
    'Function',
    'fetch',
    'XMLHttpRequest',
    'WebSocket',
    'EventSource',
    'localStorage',
    'sessionStorage',
  ]);
  const forbiddenMembers = new Set([
    'innerHTML',
    'outerHTML',
    'insertAdjacentHTML',
    'setHTML',
    'setHTMLUnsafe',
    'write',
    'writeln',
    'cookie',
    'sendBeacon',
    'createContextualFragment',
  ]);
  function inspect(node) {
    if (!node || typeof node !== 'object') return;
    if (node.type === 'Identifier')
      assert.ok(!forbiddenGlobals.has(node.name), `forbidden runtime identifier: ${node.name}`);
    if (node.type === 'MemberExpression') {
      const name = node.computed ? node.property.value : node.property.name;
      assert.ok(!forbiddenMembers.has(name), `forbidden runtime member: ${name}`);
    }
    if (node.type === 'JSXAttribute')
      assert.ok(!['dangerouslySetInnerHTML', 'srcDoc'].includes(node.name.name));
    // Display-only strings are Literal nodes, so innerHTML in a code example
    // is correctly distinguished from assigning to the real DOM property.
    for (const value of Object.values(node)) {
      if (Array.isArray(value)) value.forEach(inspect);
      else if (value && typeof value === 'object') inspect(value);
    }
  }
  for (const file of files) {
    const source = await readFile(path.join(root, file), 'utf8');
    inspect(
      espree.parse(source, { ecmaVersion: 'latest', sourceType: 'module', ecmaFeatures: { jsx: true } })
    );
    assert.ok(!/from ['"].*(?:services|utils\/api)/.test(source));
  }
});

test('motion is opt-in, cancellable, and reduced-motion has nonanimated alternatives', async () => {
  assert.equal(createXSSState().playing, false);
  const view = await readFile(path.join(root, 'src/pages/Attacks/XSSAttack.jsx'), 'utf8');
  const clock = await readFile(path.join(root, 'src/hooks/useXSSPlayback.js'), 'utf8');
  const css = await readFile(path.join(root, 'src/pages/Attacks/XSSAttack.css'), 'utf8');
  assert.ok(view.includes('useReducedMotion'));
  assert.ok(css.includes('@media (prefers-reduced-motion: reduce)'));
  assert.ok(css.includes(':focus-visible'));
  assert.ok(clock.includes('playback.stop()'));
  assert.ok(clock.includes('visibilitychange'));
  assert.ok(!/set(?:Timeout|Interval)/.test(clock));
});
