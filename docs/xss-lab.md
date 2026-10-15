# HackAware XSS Simulation Lab

Entry point: **Attack Hub → Cross-Site Scripting (XSS)**, or **`/dashboard/xss`** after signing in through HackAware's existing authentication flow. The route uses the existing `ProtectedRoute` unchanged. There is one new card and one new route.

## Four-step experience

1. **Intel** — the public-noticeboard analogy, a layered owner/comment/website/visitor scene, a replayable visual flow, and expandable Stored, Reflected, and DOM-based XSS explanations. Selecting a type also selects the subsequent simulation's learning path. These are simplified paths; real cases can overlap.
2. **Setup** — a fictional **HackAware Community Board**, native Vulnerable Website / Protected Website radio controls, display-only code previews, a path selector, and an editable comment composer. Presets are an unexpected banner, a changed headline, and a friendly comment.
3. **Attack Simulation** — one persistent browser stage shows A: input submitted, B: rendering, C: the visitor's result, and D: the cause. Play/Pause, Replay, Reset, Next scene, direct scene selection, and an optional event log all use the same reducer. The visual browser is the centerpiece, not the log.
4. **Secure It** — an accessible Vulnerable Mode ↔ Secure Mode switch re-renders the same input in the same stage, immediately removes any simulated impact, and shows literal text. The connection line redraws as the safe path. Before/after cards, syntax-styled code, and optional rich-HTML guidance explain this particular defense without claiming a universal fix.

Back, Next, and the four primary step buttons retain the input, mode, type, and submitted result. Leaving a step pauses playback. **Reset** clears the current run but keeps its configuration; **Reset lab** returns to the initial Intel state. Progress is in memory only and resets on page reload or leaving the route.

## Safety boundary

- The lab is entirely client-side. It makes no API requests and uses no real websites, accounts, tokens, credential fields, external scripts, or remotely loaded assets.
- `community.hackaware.test` is a fictional, non-clickable display label, not a network destination.
- All supplied text is rendered through ordinary React text children or a controlled textarea. Nothing is parsed as HTML or JavaScript, evaluated, converted into a URL, or used as an event handler.
- Only explicitly selected built-in presets carry an effect ID. Editing any preset immediately selects text-only preview, even when the typed text is identical to a preset. No payload detection or filtering is attempted.
- The banner/headline changes are fixed React components selected by state. They are labeled **Simulated browser effect**. A visible **Simulation only** badge remains fixed in the header.
- Vulnerable mode models an unsafe rendering location but never actually uses one. The unsafe code examples are strings and tokens for display, not live code.
- Secure mode demonstrates React's ordinary plain-text interpolation. There is no existing frontend HTML sanitizer in this repository, and none is added. The rich-HTML detail explains maintained allowlist sanitization, context-aware encoding, URL validation, safe DOM APIs, and CSP as defense in depth.
- An ordinary/custom comment without an illustrated effect is **not** a verdict that the hypothetical vulnerable pattern is safe.

## Implementation map

| File | Purpose |
| --- | --- |
| `frontend/src/pages/Attacks/XSSAttack.jsx` | Route page, four-step shell, Intel scene/type cards, setup controls, live security toggle, before/after, navigation and focus handling. |
| `frontend/src/pages/Attacks/XSSAttack.css` | Lab-scoped dark styling, perspective/depth, layered browser surfaces, connection paths, fixed safety header, responsive layouts and focus/reduced-motion styles. |
| `frontend/src/components/Attacks/XSSSimulationStage.jsx` | Shared composer, website and visitor previews, traveling comment, fixed visual effects, scene navigation, player, cause comparison and event log. |
| `frontend/src/components/Attacks/XSSCodeComparison.jsx` | Syntax-styled, display-only vulnerable and defensive examples, plus context-specific defense guidance. |
| `frontend/src/utils/xssSimulation.js` | Pure deterministic state machine, predefined effects, type metadata, input limits, outcome and scene explanations. |
| `frontend/src/hooks/useXSSPlayback.js` | One cancellable Framer Motion clock, hidden-tab pause, and a live reduced-motion preference subscription. |
| `frontend/src/pages/CyberDashboard.jsx` | Existing attack-card pattern extended with a single XSS card and `Code2` icon. |
| `frontend/src/routes/AppRoutes.jsx` | Imports the page and adds `/dashboard/xss` inside the unchanged `ProtectedRoute`. |
| `frontend/tests/xssRenderEntry.jsx` | Server-render entry for the actual page and reducer-driven view. |
| `frontend/tests/xssRender.test.mjs` | 21 rendering, state-transition, escaping, executable-sink, navigation, accessibility-markup and integration checks. |
| `docs/xss-lab.md` | Architecture, safety boundaries, validation results and manual checks. |

No package manifests or lockfiles changed; no npm dependencies were added.

### Depth and timing

CSS perspective, slight X/Y rotations, offset panel edges, layered shadows, a quiet grid floor, and ambient gradients create the 3D-inspired effect without a 3D library. Framer Motion animates step transitions, the connection line, and a comment marker shared with the player's progress value.

Playback is opt-in. Each animated scene has a **3.6-second reading interval**, not a pretend network delay. The cause scene stops automatically. Pausing stops the shared motion value and preserves its fraction; replay, input changes, mode changes, and reset invalidate stale completions with a run ID. Manual controls never require waiting for the clock. Visibility changes pause the run, and all subscriptions/animations clean up on unmount.

On narrow screens, perspective is removed and the three panels stack. Numbered flow labels and scene explanations retain the meaning without animation. Reduced-motion preferences disable traveling/perspective effects and transition movement, including when the preference changes while the lab is open. Keyboard users have native controls, visible focus, an appropriately updated polite status region, and focusable scrollable code/log regions.

## Validation performed — 2026-10-15

Commands were run **from `frontend`** before implementation to establish the baseline, and again after implementation:

| Check | Actual result |
| --- | --- |
| `npm run test:render` | **63 passed, 0 failed**: the original 42 tests plus 21 XSS tests. |
| `npm run build` | **Passed.** Vite's existing >500 kB chunk-size warning remains. |
| `npm run lint` | **Fails with the same 31 pre-existing errors.** Final output was compared byte-for-byte with the baseline and was identical; no added errors. |
| Targeted ESLint on all new JS/JSX, the render entry, and `AppRoutes.jsx` | **Passed.** |
| `git diff --check` | **Passed.** |

Existing lint errors concern unused variables, synchronous state updates in effects, and unsafe `finally` returns in existing Auth, Chatbot, attack, dashboard, Learning, and profile files. They were not suppressed or refactored as part of this feature.

Additional checks ran in an isolated Chromium 153 browser using test-only authentication state; no app authentication code was bypassed or changed:

- Unauthenticated route redirects to the existing sign-in/signup gate.
- Type cards and Intel replay work; mode radios and the Secure Mode switch work by keyboard.
- Pause freezes both the scene and comment position; resume, replay, manual scenes and reset work.
- Secure mode removes the effect immediately and retains the **same DOM stage** and input snapshot.
- Both built-in effects work. Friendly and custom text never trigger an effect.
- Script/image-looking typed input remains literal text in both modes: no inserted script/image/iframe elements, no executed marker, and no alert dialogs.
- Back/Next retain configuration; DOM-based flow explicitly describes the browser-only path.
- All four steps fit **320, 375, 768 and 1440 px** without document-level horizontal overflow. The safety badge remains in the viewport on scroll.
- Live reduced-motion changes remove packet movement and perspective.
- No console errors, lab fetch/XHR requests, or external requests were observed.
- **axe-core WCAG 2 A/AA and 2.1 AA scans: no detected violations** on all four steps at 1440 and 320 px, and on a long multiline comment with the event log expanded. This is automated coverage, not a claim of complete accessibility certification.

The browser and accessibility tools were temporary verification tools outside the repository, not application or test-suite dependencies. The checked-in test command remains the repository's existing Node/esbuild/server-render setup.

## Quick manual review

1. Sign in normally, open the XSS card, and select **Watch the flow** in Intel. Explore all three type cards.
2. Go to Setup. Compare the two website modes, then choose **Vulnerable Website** and **Unexpected banner**.
3. Select **Run this scenario**. Pause the moving comment, resume, or use **Next scene**. Observe the labeled warning and simulated visitor banner.
4. Go to Secure It and enable **Secure Mode**. The same marker should be visible literally, the banner should disappear, and the status should read **Safe rendering enabled**. Replay to trace the safe path.
5. Try **Changed headline**, **Friendly comment**, and your own text. Editing a demo must disable its predefined effect. Clear the input; play/submit/seek should be disabled.
6. Test Back/Next, Reset, Reset lab, native keyboard controls, a narrow viewport, and reduced motion.

## Deliberate limitations

This is a teaching model, not an exploit executor, security scanner, general sanitizer, or proof that an application is XSS-free. Type flows are simplified; no database, request/response server, DOM injection or script execution is performed. All effects are predefined and input is limited to 280 characters. State is not saved across reloads. Automated browser checks were Chromium-based; Safari/Firefox and a manual screen-reader audit were not performed. Existing authentication and backend behavior are outside this lab's scope and remain unchanged.
