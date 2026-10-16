import { useReducer, useRef, useState } from 'react';
import { AnimatePresence, motion as Motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  Braces,
  Check,
  ChevronDown,
  Clock3,
  Code2,
  Database,
  FlaskConical,
  Globe,
  Layers3,
  LockKeyhole,
  MessageSquare,
  MousePointer2,
  Play,
  RotateCcw,
  Settings2,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  UserRound,
} from 'lucide-react';
import XSSSimulationStage, { XSSBrowserChrome } from '../../components/Attacks/XSSSimulationStage.jsx';
import XSSCodeComparison from '../../components/Attacks/XSSCodeComparison.jsx';
import useXSSPlayback, { useReducedMotionPreference } from '../../hooks/useXSSPlayback.js';
import {
  createXSSState,
  getXSSOutcome,
  getXSSScenes,
  XSS_STEPS,
  XSS_TYPES,
  xssReducer,
} from '../../utils/xssSimulation.js';
import './XSSAttack.css';

const STEP_ICONS = [BookOpen, Settings2, Play, ShieldCheck];
const TYPE_ICONS = [Database, ArrowUpRight, Braces];
const STEP_COPY = [
  ['A message. Or an instruction?', 'First, see the idea. No coding experience needed.'],
  [
    'Meet your little corner of the web.',
    'Choose a website mode and a demo comment. Everything here is fictional.',
  ],
  ['Watch trust cross the line.', 'Follow the comment from the input box to someone else’s browser.'],
  ['Keep the message. Remove the risk.', 'Same input. Same browser. A safer way to render it.'],
];

function IntelScene({ type, reduced }) {
  const [trace, setTrace] = useState(0);
  return (
    <div className="xss-intel-scene" aria-label={`Visual analogy for ${type.title}`}>
      <div className="xss-intel-scene-top">
        <span>
          <Layers3 size={13} aria-hidden="true" /> INSIDE THE STORY
        </span>
        <span>Fictional browsers</span>
      </div>
      <div className="xss-intel-floor" aria-hidden="true" />
      <svg className="xss-intel-connections" viewBox="0 0 780 430" fill="none" aria-hidden="true">
        <path
          d="M 132 285 C 265 285 213 182 370 182 S 610 182 644 307"
          stroke="#314158"
          strokeWidth="2"
          strokeDasharray="5 6"
        />
        {trace > 0 && (
          <Motion.path
            key={`line-${trace}`}
            d="M 132 285 C 265 285 213 182 370 182 S 610 182 644 307"
            stroke="#9c8aff"
            strokeWidth="2"
            initial={reduced ? false : { pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: reduced ? 0 : 1.8 }}
          />
        )}
        {trace > 0 && (
          <Motion.circle
            key={`packet-${trace}`}
            r="6"
            fill="#b3a2ff"
            initial={false}
            animate={
              reduced
                ? { cx: 644, cy: 307 }
                : { cx: [132, 245, 370, 540, 644], cy: [285, 234, 182, 192, 307] }
            }
            transition={{ duration: reduced ? 0 : 1.8, ease: 'easeInOut' }}
          />
        )}
      </svg>
      <div className="xss-intel-owner">
        <span className="xss-avatar is-cyan">M</span>
        <div>
          <strong>The website owner</strong>
          <span>“Everyone can leave a comment.”</span>
        </div>
        <Shield size={16} aria-hidden="true" />
      </div>
      <div className="xss-intel-browser">
        <XSSBrowserChrome />
        <div className="xss-intel-board">
          <div className="xss-intel-board-title">
            <span className="xss-board-logo">
              <Braces size={19} aria-hidden="true" />
            </span>
            <div>
              <strong>The public noticeboard</strong>
              <small>A space for everyone</small>
            </div>
          </div>
          <div className="xss-intel-note">
            <span className="xss-avatar">A</span>
            <div>
              <strong>Alex</strong>
              <p>Love what you’re building here!</p>
            </div>
          </div>
          <div className={`xss-intel-new-note ${trace > 0 ? 'is-posted' : ''}`}>
            <MessageSquare size={15} aria-hidden="true" />
            <span>{trace > 0 ? type.process : 'A new comment is on its way…'}</span>
            <span className="xss-note-pill">{trace > 0 ? 'UNTRUSTED' : 'INPUT'}</span>
          </div>
        </div>
      </div>
      <div className="xss-intel-attacker">
        <span className="xss-intel-float-tag">01 / THE SUSPICIOUS COMMENT</span>
        <div className="xss-person">
          <span className="xss-avatar is-violet">
            <UserRound size={17} aria-hidden="true" />
          </span>
          <div>
            <strong>An attacker posts</strong>
            <small>A message with a hidden intention</small>
          </div>
        </div>
        <code>{'<demo-banner>Page changed!</demo-banner>'}</code>
        <span className="xss-inert-marker">
          <Code2 size={11} aria-hidden="true" /> Harmless illustration, not a script
        </span>
      </div>
      <div className="xss-intel-visitor">
        <div className="xss-intel-visitor-title">
          <span className="xss-avatar is-cyan">S</span>
          <div>
            <strong>A visitor opens the page</strong>
            <small>The browser trusts the website</small>
          </div>
          <Globe size={15} aria-hidden="true" />
        </div>
        <Motion.div
          key={trace}
          className={`xss-intel-result ${trace > 0 ? 'is-affected' : ''}`}
          initial={reduced || trace === 0 ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: reduced ? 0 : 1.5, duration: reduced ? 0 : 0.25 }}
        >
          {trace > 0 ? (
            <>
              <ShieldAlert size={20} aria-hidden="true" />
              <div>
                <strong>The page changed unexpectedly.</strong>
                <span>Simulated effect · no code ran</span>
              </div>
            </>
          ) : (
            <>
              <MessageSquare size={20} aria-hidden="true" />
              <div>
                <strong>Looks like an ordinary website.</strong>
                <span>Follow the comment to see the risk.</span>
              </div>
            </>
          )}
        </Motion.div>
      </div>
      <div className="xss-intel-scene-bottom">
        <button className="xss-button xss-button-secondary" onClick={() => setTrace((value) => value + 1)}>
          <Play size={13} aria-hidden="true" />
          {trace > 0 ? 'Replay the flow' : 'Watch the flow'}
        </button>
        <span role="status">
          {trace > 0
            ? 'Input → unsafe rendering → simulated effect'
            : 'One comment. Two very different intentions.'}
        </span>
      </div>
    </div>
  );
}

function Intel({ state, dispatch, reduced }) {
  const [expanded, setExpanded] = useState(true);
  const type = XSS_TYPES.find(({ id }) => id === state.type);
  return (
    <div className="xss-intel-content">
      <div className="xss-intel-layout">
        <article className="xss-analogy">
          <span className="xss-eyebrow">
            <span className="xss-small-line" /> THE NOTICEBOARD ANALOGY
          </span>
          <h3>
            What if a message
            <br />
            could change
            <br />
            <span>the whole page?</span>
          </h3>
          <p>
            Imagine a website has a public noticeboard. Anyone can post a message. If the website mistakes a
            dangerous instruction for an ordinary message, a visitor&apos;s browser may interpret it as
            something the website intended to run.
          </p>
          <div className="xss-takeaway">
            <span>
              <Sparkles size={17} aria-hidden="true" />
            </span>
            <p>
              That’s <strong>Cross-Site Scripting (XSS).</strong>
              <br />
              Untrusted input crosses the line from <em>content</em> to <em>instructions</em>.
            </p>
          </div>
          <span className="xss-analogy-footnote">
            In this lab, the “instruction” is only an inert marker.
          </span>
        </article>
        <IntelScene key={state.type} type={type} reduced={reduced} />
      </div>
      <section className="xss-types" aria-labelledby="xss-types-title">
        <div className="xss-section-label">
          <h3 id="xss-types-title">Three paths. The same trust problem.</h3>
          <span>
            Select a type to explore its flow <ArrowRight size={13} aria-hidden="true" />
          </span>
        </div>
        <div className="xss-type-grid">
          {XSS_TYPES.map((item, index) => {
            const Icon = TYPE_ICONS[index];
            const selected = item.id === state.type;
            return (
              <button
                className={`xss-type-card ${selected ? 'is-selected' : ''}`}
                key={item.id}
                aria-expanded={selected && expanded}
                aria-controls="xss-type-detail"
                onClick={() => {
                  if (selected) setExpanded(!expanded);
                  else {
                    dispatch({ type: 'SELECT_TYPE', id: item.id });
                    setExpanded(true);
                  }
                }}
              >
                <span className="xss-type-icon">
                  <Icon size={20} aria-hidden="true" />
                </span>
                <div>
                  <span className="xss-type-short">{item.short}</span>
                  <h4>{item.title}</h4>
                  <p>{item.description}</p>
                </div>
                <ChevronDown size={15} aria-hidden="true" className={selected && expanded ? 'is-open' : ''} />
              </button>
            );
          })}
        </div>
        <div id="xss-type-detail" hidden={!expanded} className="xss-type-detail">
          <div className="xss-type-flow" aria-label={`${type.title} simplified flow`}>
            {type.flow.map((label, index) => (
              <span key={label}>
                {index > 0 && <ArrowRight size={14} aria-hidden="true" />}
                <b>{index + 1}</b>
                {label}
              </span>
            ))}
          </div>
          <p>{type.detail}</p>
          <span className="xss-type-nuance">Simplified learning paths; real XSS cases can overlap.</span>
        </div>
      </section>
    </div>
  );
}

function WebsiteModes({ state, dispatch }) {
  return (
    <div className="xss-setup-config">
      <fieldset className="xss-mode-options">
        <legend>01 / Choose how the website handles input</legend>
        {['vulnerable', 'secure'].map((mode) => {
          const secure = mode === 'secure';
          return (
            <label
              key={mode}
              className={`xss-mode-option ${state.mode === mode ? 'is-selected' : ''} ${secure ? 'is-secure' : ''}`}
            >
              <input
                type="radio"
                name="xss-website-mode"
                value={mode}
                checked={state.mode === mode}
                aria-label={secure ? 'Protected Website' : 'Vulnerable Website'}
                onChange={() => dispatch({ type: 'MODE', mode })}
              />
              <span className="xss-mode-option-icon">
                {secure ? (
                  <ShieldCheck size={21} aria-hidden="true" />
                ) : (
                  <ShieldAlert size={21} aria-hidden="true" />
                )}
              </span>
              <div>
                <strong>{secure ? 'Protected Website' : 'Vulnerable Website'}</strong>
                <p>
                  {secure
                    ? 'Keeps untrusted comments as ordinary text.'
                    : 'Treats untrusted comments as HTML to interpret.'}
                </p>
                <code>{secure ? '<p>{comment}</p>' : 'commentBox.innerHTML = input'}</code>
                <small>Display-only code</small>
              </div>
              <span className="xss-radio-indicator" aria-hidden="true">
                {state.mode === mode && <Check size={11} />}
              </span>
            </label>
          );
        })}
      </fieldset>
      <div className="xss-setup-flow">
        <label htmlFor="xss-flow-type">02 / Choose a learning path</label>
        <select
          id="xss-flow-type"
          value={state.type}
          onChange={(event) => dispatch({ type: 'SELECT_TYPE', id: event.target.value })}
        >
          {XSS_TYPES.map((type) => (
            <option value={type.id} key={type.id}>
              {type.title}
            </option>
          ))}
        </select>
        <p>
          Next, choose a demo or write a harmless comment in the board below. Please don’t enter personal
          information.
        </p>
      </div>
    </div>
  );
}

function SecureToggle({ state, dispatch, reduced }) {
  const secure = state.mode === 'secure';
  return (
    <div className={`xss-secure-control ${secure ? 'is-secure' : ''}`}>
      <span className="xss-secure-control-icon">
        {secure ? <ShieldCheck size={27} aria-hidden="true" /> : <ShieldAlert size={27} aria-hidden="true" />}
      </span>
      <div className="xss-secure-copy">
        <h3>{secure ? 'A safer rendering path is live.' : 'Change the rule. Watch the difference.'}</h3>
        <p>
          {secure
            ? 'The same comment is now shown literally. The simulated impact is removed.'
            : 'Enable safe text rendering for the same input, right here in the same browser.'}
        </p>
      </div>
      <div className="xss-switch-group">
        <span className={!secure ? 'is-active' : ''}>Vulnerable Mode</span>
        <button
          type="button"
          role="switch"
          aria-label="Secure Mode"
          aria-checked={secure}
          aria-describedby="xss-mode-scope"
          className="xss-mode-switch"
          onClick={() => dispatch({ type: 'MODE', mode: secure ? 'vulnerable' : 'secure' })}
        >
          <Motion.span animate={{ x: secure ? 24 : 0 }} transition={{ duration: reduced ? 0 : 0.2 }}>
            <LockKeyhole size={12} aria-hidden="true" />
          </Motion.span>
        </button>
        <span className={secure ? 'is-active' : ''}>Secure Mode</span>
      </div>
    </div>
  );
}

function BeforeAfter({ state }) {
  const text = state.submission?.text || state.input;
  return (
    <div className="xss-before-after" aria-label="Before and after safe text rendering">
      <article>
        <span>
          <ShieldAlert size={15} aria-hidden="true" /> BEFORE / UNSAFE PATTERN
        </span>
        <h3>Content is treated as instructions.</h3>
        <p>
          An unsafe HTML location may let untrusted content change the page. The lab illustrates that risk
          with a built-in effect.
        </p>
      </article>
      <div className="xss-before-after-arrow" aria-hidden="true">
        <ArrowRight size={21} />
      </div>
      <article>
        <span>
          <ShieldCheck size={15} aria-hidden="true" /> AFTER / TEXT RENDERING
        </span>
        <h3>The message is just a message.</h3>
        <code tabIndex={0}>{text || 'Your comment is rendered here as plain text.'}</code>
        <p>Same characters. No instructions. No unexpected page change.</p>
      </article>
    </div>
  );
}

/** Shared view also lets the existing SSR tests render actual reducer states. */
export function XSSLabView({ state, dispatch }) {
  const navigate = useNavigate();
  const reduced = useReducedMotionPreference();
  const progress = useXSSPlayback(state, dispatch);
  const heading = useRef(null);
  const { secure, status } = getXSSOutcome(state);
  const scenes = getXSSScenes(state);
  const changeStep = (step) => {
    dispatch({ type: 'STEP', step });
    heading.current?.focus();
  };
  const reset = () => {
    dispatch({ type: 'RESET_LAB' });
    heading.current?.focus();
  };
  return (
    <div className="xss-lab">
      <a className="xss-skip-link" href="#xss-step-heading">
        Skip to the lab
      </a>
      <header className="xss-header">
        <div className="xss-header-inner">
          <div className="xss-header-brand">
            <button
              className="xss-back-icon"
              onClick={() => navigate('/dashboard')}
              aria-label="Back to dashboard"
            >
              <ArrowLeft size={18} aria-hidden="true" />
            </button>
            <span className="xss-brand-shield">
              <Shield size={22} aria-hidden="true" />
            </span>
            <span className="xss-wordmark">
              HACK<span>AWARE</span>
              <sup>PRO</sup>
            </span>
            <span className="xss-header-separator" />
            <span className="xss-header-label">INTERACTIVE LABS</span>
          </div>
          <div className="xss-header-actions">
            <span className="xss-simulation-badge">
              <FlaskConical size={13} aria-hidden="true" />
              Simulation only
            </span>
            <button className="xss-reset-lab" onClick={reset} aria-label="Reset lab" title="Reset lab">
              <RotateCcw size={13} aria-hidden="true" />
              <span>Reset lab</span>
            </button>
          </div>
        </div>
      </header>
      <main className="xss-main">
        <div className="xss-breadcrumb">
          <button onClick={() => navigate('/dashboard')}>Attack hub</button>
          <span>/</span>
          <span>Web security</span>
          <span>/</span>
          <strong>Cross-site scripting</strong>
        </div>
        <section className="xss-hero" aria-labelledby="xss-title">
          <div>
            <p className="xss-eyebrow">
              <span className="xss-small-line" /> LEARN IT. SEE IT. SECURE IT.
            </p>
            <h1 id="xss-title">
              Cross-site scripting<span className="xss-xss-tag">XSS</span>
            </h1>
            <p className="xss-hero-description">
              One innocent-looking comment. An unexpected browser.
              <br className="xss-mobile-break" /> See where trust breaks—and how to fix it.
            </p>
            <div className="xss-meta">
              <span>
                <Globe size={13} aria-hidden="true" />
                Browser security
              </span>
              <span>
                <span className="xss-level-bars" aria-hidden="true">
                  <i />
                  <i />
                  <i />
                </span>
                Beginner friendly
              </span>
              <span>
                <Clock3 size={13} aria-hidden="true" />
                ~6 min
              </span>
            </div>
          </div>
          <div className="xss-hero-emblem" aria-hidden="true">
            <div className="xss-emblem-orbit" />
            <span className="xss-emblem-corner">&lt;</span>
            <div className="xss-emblem-core">
              <Braces size={38} strokeWidth={1.4} />
            </div>
            <span className="xss-emblem-corner">/&gt;</span>
            <span className="xss-emblem-caption">DON’T JUST READ ABOUT IT.</span>
          </div>
        </section>
        <div className="xss-stepper-wrap">
          <nav aria-label="XSS lab steps" className="xss-stepper">
            <ol>
              {XSS_STEPS.map((label, index) => {
                const Icon = STEP_ICONS[index];
                const complete = state.completed.includes(index) && state.step !== index;
                return (
                  <li key={label}>
                    <button
                      onClick={() => changeStep(index)}
                      aria-current={state.step === index ? 'step' : undefined}
                      className={`${state.step === index ? 'is-active' : ''} ${complete ? 'is-complete' : ''}`}
                    >
                      <span className="xss-step-number">
                        {complete ? (
                          <Check size={15} aria-hidden="true" />
                        ) : (
                          String(index + 1).padStart(2, '0')
                        )}
                      </span>
                      <span>
                        <small>
                          {state.step === index
                            ? 'YOU ARE HERE'
                            : complete
                              ? 'EXPLORED'
                              : `STEP ${String(index + 1).padStart(2, '0')}`}
                        </small>
                        <strong>{label}</strong>
                      </span>
                      <Icon className="xss-step-icon" size={17} aria-hidden="true" />
                      {complete && <span className="xss-sr-only">Explored</span>}
                    </button>
                  </li>
                );
              })}
            </ol>
          </nav>
          <div
            className="xss-step-progress"
            role="progressbar"
            aria-label="Learning step"
            aria-valuemin={1}
            aria-valuemax={4}
            aria-valuenow={state.step + 1}
            aria-valuetext={`Step ${state.step + 1} of 4: ${XSS_STEPS[state.step]}`}
          >
            <Motion.div
              initial={false}
              animate={{ width: `${((state.step + 1) / 4) * 100}%` }}
              transition={{ duration: reduced ? 0 : 0.35 }}
            />
          </div>
        </div>
        <div className="xss-step-intro">
          <div>
            <p className="xss-eyebrow">
              {String(state.step + 1).padStart(2, '0')} / {XSS_STEPS[state.step].toUpperCase()}
            </p>
            <h2 ref={heading} id="xss-step-heading" tabIndex={-1}>
              {STEP_COPY[state.step][0]}
            </h2>
            <p>{STEP_COPY[state.step][1]}</p>
          </div>
          <span className="xss-step-counter">
            <strong>{String(state.step + 1).padStart(2, '0')}</strong>
            <span>/ 04</span>
          </span>
        </div>
        <p className="xss-sr-only" role="status" aria-live="polite" aria-atomic="true">
          {XSS_STEPS[state.step]}. {status}.{' '}
          {state.scene >= 0
            ? `${scenes[state.scene].title}. ${state.playing ? 'Playing.' : 'Paused.'}`
            : 'Ready to simulate.'}
        </p>
        <AnimatePresence mode="wait" initial={false}>
          {state.step === 0 && (
            <Motion.section
              key="intel"
              initial={reduced ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: reduced ? 0 : 0.16 }}
            >
              <Intel state={state} dispatch={dispatch} reduced={reduced} />
            </Motion.section>
          )}
        </AnimatePresence>
        {state.step > 0 && (
          <div className="xss-workspace">
            <AnimatePresence mode="wait" initial={false}>
              <Motion.div
                key={state.step}
                initial={reduced ? false : { opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: reduced ? 0 : 0.16 }}
              >
                {state.step === 1 && <WebsiteModes state={state} dispatch={dispatch} />}
                {state.step === 2 && (
                  <div className="xss-run-note">
                    <span>
                      <MousePointer2 size={15} aria-hidden="true" /> Play the story, pause to explore, or
                      advance one scene at a time.
                    </span>
                    <button onClick={() => changeStep(1)}>
                      {secure ? (
                        <ShieldCheck size={14} aria-hidden="true" />
                      ) : (
                        <ShieldAlert size={14} aria-hidden="true" />
                      )}
                      {secure ? 'Protected Website' : 'Vulnerable Website'}
                      <Settings2 size={13} aria-hidden="true" />
                    </button>
                  </div>
                )}
                {state.step === 3 && <SecureToggle state={state} dispatch={dispatch} reduced={reduced} />}
              </Motion.div>
            </AnimatePresence>
            {/* Intentionally unkeyed: Attack Simulation and Secure It share this
              exact stage and the same submission, not separate demos. */}
            <XSSSimulationStage state={state} dispatch={dispatch} progress={progress} reduced={reduced} />
            {state.step === 3 && (
              <div className="xss-defense-content">
                <p id="xss-mode-scope" className="xss-scope-note">
                  <ShieldCheck size={16} aria-hidden="true" />
                  <span>
                    <strong>One pattern, not a universal patch.</strong> This switch illustrates safe
                    plain-text rendering. Real XSS defenses depend on where and how input is used. Use Replay
                    to trace the new path.
                  </span>
                </p>
                <BeforeAfter state={state} />
                <XSSCodeComparison />
              </div>
            )}
          </div>
        )}
        <footer className="xss-step-footer">
          <button
            className="xss-button xss-button-secondary"
            onClick={() => changeStep(state.step - 1)}
            disabled={state.step === 0}
          >
            <ArrowLeft size={15} aria-hidden="true" />
            Back
          </button>
          <span>
            <LockKeyhole size={12} aria-hidden="true" />
            {state.step === 0
              ? 'A safe place to understand unsafe code.'
              : 'Local state only. Nothing is sent or saved.'}
          </span>
          <button
            className="xss-button xss-button-primary"
            onClick={() => (state.step < 3 ? changeStep(state.step + 1) : navigate('/dashboard'))}
          >
            {state.step < 3 ? `Next: ${XSS_STEPS[state.step + 1]}` : 'Back to dashboard'}
            <ArrowRight size={15} aria-hidden="true" />
          </button>
        </footer>
        <div className="xss-bottom-line">
          <span>
            HACKAWARE <span>/</span> WEB SECURITY SERIES
          </span>
          <span>Built to learn. Never to harm.</span>
        </div>
      </main>
    </div>
  );
}

export default function XSSAttack() {
  const [state, dispatch] = useReducer(xssReducer, undefined, createXSSState);
  return <XSSLabView state={state} dispatch={dispatch} />;
}
