import { motion as Motion, useTransform } from 'framer-motion';
import {
  ArrowRight,
  Braces,
  Check,
  CircleCheck,
  Code2,
  CornerDownRight,
  Eye,
  Globe,
  LockKeyhole,
  MessageSquare,
  Pause,
  Play,
  RotateCcw,
  Send,
  ShieldAlert,
  ShieldCheck,
  SkipForward,
  Terminal,
  UserRound,
} from 'lucide-react';
import {
  getXSSOutcome,
  getXSSScenes,
  MAX_COMMENT_LENGTH,
  XSS_DEMOS,
  XSS_TYPES,
} from '../../utils/xssSimulation.js';

export function XSSBrowserChrome({ visitor = false }) {
  return (
    <div className="xss-browser-chrome">
      <span className="xss-window-dots" aria-hidden="true">
        <i />
        <i />
        <i />
      </span>
      <span className="xss-address">
        <Globe size={11} aria-hidden="true" />
        {visitor ? 'Visitor’s browser · fictional' : 'community.hackaware.test'}
      </span>
      <span className="xss-browser-menu" aria-hidden="true">
        ···
      </span>
    </div>
  );
}

export function XSSSecurityStatus({ state }) {
  const { secure, status } = getXSSOutcome(state);
  return (
    <span className={`xss-security-status ${secure ? 'is-secure' : 'is-unsafe'}`}>
      {secure ? <ShieldCheck size={13} aria-hidden="true" /> : <ShieldAlert size={13} aria-hidden="true" />}
      {status}
    </span>
  );
}

function CommentComposer({ state, dispatch }) {
  const submit = (event) => {
    event.preventDefault();
    if (state.step === 1) dispatch({ type: 'STEP', step: 2 });
    dispatch({ type: 'SUBMIT' });
  };
  return (
    <div className="xss-composer xss-depth-panel">
      <div className="xss-node-label">
        <span>01</span> THE INPUT <MessageSquare size={14} aria-hidden="true" />
      </div>
      <div className="xss-person">
        <span
          className={`xss-avatar ${state.demoId === 'custom' || state.demoId === 'friendly' ? 'is-cyan' : 'is-violet'}`}
        >
          <UserRound size={18} aria-hidden="true" />
        </span>
        <div>
          <strong>
            {state.demoId === 'custom' || state.demoId === 'friendly' ? 'Demo author' : 'Attacker role'}
          </strong>
          <small>Fictional participant</small>
        </div>
      </div>
      <form onSubmit={submit} aria-label="Simulated comment submission">
        <label htmlFor="xss-demo-input">Choose a demonstration</label>
        <select
          id="xss-demo-input"
          value={state.demoId}
          disabled={state.playing}
          onChange={(event) =>
            dispatch(
              event.target.value === 'custom'
                ? { type: 'INPUT', value: '' }
                : { type: 'SELECT_DEMO', id: event.target.value }
            )
          }
        >
          {XSS_DEMOS.map((demo) => (
            <option key={demo.id} value={demo.id}>
              {demo.title}
            </option>
          ))}
          <option value="custom">Your own text</option>
        </select>
        <div className="xss-input-label">
          <label htmlFor="xss-comment">Public comment</label>
          <span>
            {state.input.length}/{MAX_COMMENT_LENGTH}
          </span>
        </div>
        <textarea
          id="xss-comment"
          value={state.input}
          maxLength={MAX_COMMENT_LENGTH}
          rows={4}
          spellCheck={false}
          autoComplete="off"
          disabled={state.playing}
          aria-describedby="xss-input-note"
          placeholder="Write a harmless comment…"
          onChange={(event) => dispatch({ type: 'INPUT', value: event.target.value })}
        />
        <p id="xss-input-note" className="xss-input-note">
          {state.demoId === 'custom'
            ? 'Your text is never analyzed or executed. Only the built-in demos create visual effects.'
            : 'An inert demo marker, not executable code. Editing it switches to text-only preview.'}
        </p>
        <button
          type="submit"
          className="xss-button xss-button-submit"
          disabled={!state.input.trim() || state.playing}
        >
          <Send size={14} aria-hidden="true" />
          {state.step === 1 ? 'Run this scenario' : 'Submit input'}
        </button>
      </form>
    </div>
  );
}

function CommunityWebsite({ state, reduced }) {
  const { secure } = getXSSOutcome(state);
  const type = XSS_TYPES.find(({ id }) => id === state.type);
  const processing = state.scene >= 1;
  return (
    <div
      className={`xss-site-browser xss-depth-panel ${processing ? (secure ? 'is-safe-path' : 'is-unsafe-path') : ''}`}
      role="region"
      aria-label="HackAware Community Board"
    >
      <XSSBrowserChrome />
      <div className="xss-community-brand">
        <span className="xss-board-logo">
          <Braces size={18} aria-hidden="true" />
        </span>
        <div>
          <strong>HackAware</strong>
          <small>Community Board</small>
        </div>
        <span className="xss-local-label">LOCAL</span>
      </div>
      <div className="xss-community-content">
        <div className="xss-board-topic">
          <span>THE COMMUNITY SPACE</span>
          <span>✦</span>
        </div>
        <h3>
          Good conversations.
          <br />
          Better ideas.
        </h3>
        <p className="xss-board-description">A little corner of the web, built for everyone.</p>
        <div className="xss-owner-post">
          <span className="xss-avatar is-cyan">M</span>
          <div>
            <strong>
              Maya <span>· Website owner</span>
            </strong>
            <p>What are you building this week?</p>
          </div>
        </div>
        <div className={`xss-render-location ${processing ? 'is-highlighted' : ''}`}>
          <div className="xss-render-label">
            <MessageSquare size={12} aria-hidden="true" />
            <span>{type.process}</span>
            <small>{state.submission ? '01 comment' : '00 comments'}</small>
          </div>
          <Motion.div
            key={state.submission ? `${state.runId}-comment` : 'empty'}
            initial={reduced ? false : { opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: reduced ? 0 : 0.2 }}
            className="xss-posted-comment"
          >
            {state.submission ? (
              <>
                <span className="xss-comment-author">
                  Demo author <span>· just now</span>
                </span>
                <code tabIndex={0}>{state.submission.text}</code>
              </>
            ) : (
              <p>Your submitted comment will appear here.</p>
            )}
          </Motion.div>
          <div className="xss-render-code">
            <Code2 size={13} aria-hidden="true" />
            <code>{secure ? '<p>{comment}</p>' : 'commentBox.innerHTML = input'}</code>
          </div>
        </div>
        <div className="xss-render-caption">
          {secure ? (
            <ShieldCheck size={13} aria-hidden="true" />
          ) : (
            <CornerDownRight size={13} aria-hidden="true" />
          )}
          <span>
            {type.location} · {secure ? 'text only' : 'unsafe pattern'}
          </span>
        </div>
      </div>
      <div className="xss-site-status">
        <XSSSecurityStatus state={state} />
        <span>Simulated status</span>
      </div>
    </div>
  );
}

function VisitorBrowser({ state, reduced }) {
  const { secure, impact, effect } = getXSSOutcome(state);
  const type = XSS_TYPES.find(({ id }) => id === state.type);
  const delivered = state.scene >= 2 && state.submission;
  return (
    <div
      className={`xss-visitor-browser xss-depth-panel ${impact ? 'has-impact' : secure ? 'is-protected' : ''}`}
      role="region"
      aria-label="Simulated visitor’s browser"
    >
      <XSSBrowserChrome visitor />
      <div className="xss-visitor-content">
        <div className="xss-node-label">
          <span>03</span> THE VISITOR <Eye size={14} aria-hidden="true" />
        </div>
        <div className="xss-person">
          <span className="xss-avatar is-violet">S</span>
          <div>
            <strong>{type.visitor}</strong>
            <small>Same page. A different browser.</small>
          </div>
        </div>
        <div className="xss-visitor-page">
          <span className="xss-mini-brand">
            <Braces size={13} aria-hidden="true" /> Community Board
          </span>
          <h4 className={effect === 'headline' ? 'xss-changed-heading' : ''}>
            {effect === 'headline' ? 'Someone changed this headline.' : 'Welcome to the community.'}
          </h4>
          <div className="xss-page-rule" />
          {impact ? (
            // This fixed React component is the entire "attack." Never turn
            // input into markup, event handlers, URLs, or script source.
            <Motion.div
              className="xss-simulated-impact"
              data-simulated-impact={effect}
              initial={reduced ? false : { opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: reduced ? 0 : 0.25 }}
            >
              <ShieldAlert size={24} aria-hidden="true" />
              <strong>
                {effect === 'banner'
                  ? 'This banner wasn’t part of the page.'
                  : 'That isn’t the original headline.'}
              </strong>
              <span>SIMULATED BROWSER EFFECT</span>
              <p>A built-in illustration. No code ran.</p>
            </Motion.div>
          ) : delivered ? (
            <div className={`xss-literal-comment ${secure ? 'is-secure' : ''}`} data-literal-comment="true">
              <span>
                {secure ? (
                  <LockKeyhole size={12} aria-hidden="true" />
                ) : (
                  <MessageSquare size={12} aria-hidden="true" />
                )}
                {secure ? 'Rendered as plain text' : 'Text-only preview'}
              </span>
              <code tabIndex={0}>{state.submission.text}</code>
            </div>
          ) : (
            <div className="xss-awaiting-visitor">
              <MessageSquare size={22} aria-hidden="true" />
              <p>
                The visitor hasn’t seen
                <br />
                the new comment yet.
              </p>
              <span />
              <span />
            </div>
          )}
        </div>
        <div className={`xss-visitor-outcome ${impact ? 'is-unsafe' : secure ? 'is-secure' : ''}`}>
          {impact ? (
            <ShieldAlert size={15} aria-hidden="true" />
          ) : secure ? (
            <CircleCheck size={15} aria-hidden="true" />
          ) : (
            <Eye size={15} aria-hidden="true" />
          )}
          <span>
            {impact
              ? 'The page changed unexpectedly'
              : secure
                ? 'Page intact · input stays text'
                : delivered
                  ? 'No predefined effect applied'
                  : 'Waiting for the comment'}
          </span>
        </div>
      </div>
    </div>
  );
}

function TransferLane({ state, progress, reduced }) {
  const { secure } = getXSSOutcome(state);
  const movingFirst = state.scene <= 0;
  const left = useTransform(progress, [0, 1], movingFirst ? ['13%', '48%'] : ['48%', '85%']);
  const type = XSS_TYPES.find(({ id }) => id === state.type);
  return (
    <div
      className={`xss-transfer-lane ${secure ? 'is-secure' : ''}`}
      aria-label={`Simulated flow: ${type.flow.join(' → ')}`}
    >
      <Motion.div
        key={state.mode}
        className="xss-transfer-line"
        aria-hidden="true"
        initial={reduced ? false : { scaleX: 0.35, opacity: 0 }}
        animate={{ scaleX: 1, opacity: 0.7 }}
        transition={{ duration: reduced ? 0 : 0.4, ease: 'easeOut' }}
        style={{ transformOrigin: 'left' }}
      />
      {state.scene >= 0 && (
        <Motion.span
          className="xss-traveling-comment"
          aria-hidden="true"
          style={{ left: reduced || state.scene >= 2 ? (state.scene === 0 ? '48%' : '85%') : left }}
        >
          <Code2 size={12} />
          {secure ? 'text' : 'comment'}
          <ArrowRight size={11} />
        </Motion.span>
      )}
      {type.flow.map((label, index) => (
        <div className={`xss-transfer-stop ${state.scene >= index ? 'is-reached' : ''}`} key={label}>
          <span aria-hidden="true">{state.scene > index ? <Check size={11} /> : index + 1}</span>
          <p>{label}</p>
        </div>
      ))}
    </div>
  );
}

function CauseComparison({ state }) {
  const { secure, impact } = getXSSOutcome(state);
  return (
    <div className="xss-cause-comparison" aria-label="Input, handling, and outcome comparison">
      <div>
        <span>WHAT WENT IN</span>
        <code tabIndex={0}>{state.submission?.text}</code>
      </div>
      <ArrowRight size={17} aria-hidden="true" />
      <div>
        <span>HOW IT WAS HANDLED</span>
        <p>{secure ? 'Kept as ordinary text' : 'Sent to an unsafe HTML location (illustrated)'}</p>
      </div>
      <ArrowRight size={17} aria-hidden="true" />
      <div>
        <span>WHAT THE VISITOR SAW</span>
        <p>
          {secure
            ? 'The literal comment. No page change.'
            : impact
              ? 'An unexpected, simulated page change.'
              : 'Text only. No preset visual effect selected.'}
        </p>
      </div>
    </div>
  );
}

export default function XSSSimulationStage({ state, dispatch, progress, reduced }) {
  const { secure } = getXSSOutcome(state);
  const scenes = getXSSScenes(state);
  const current = scenes[state.scene];
  const type = XSS_TYPES.find(({ id }) => id === state.type);
  const canPlay = Boolean(state.input.trim());
  return (
    <section
      className={`xss-stage ${secure ? 'is-secure' : ''} ${state.playing ? 'is-playing' : 'is-paused'}`}
      aria-label="Interactive browser simulation"
      data-scene={state.scene}
      data-mode={state.mode}
    >
      <header className="xss-stage-heading">
        <div>
          <span className="xss-status-dot" />
          <strong>THE BROWSER LAB</strong>
          <span className="xss-stage-divider" />
          <span>{type.title}</span>
        </div>
        <span className="xss-local-session">
          <LockKeyhole size={12} aria-hidden="true" /> Local simulation · no network requests
        </span>
      </header>
      <div className="xss-stage-world">
        <div className="xss-stage-grid" aria-hidden="true" />
        <div className="xss-stage-panels">
          <CommentComposer state={state} dispatch={dispatch} />
          <div className="xss-website-wrap">
            <span className="xss-website-node">
              <span>02</span> {state.type === 'dom' ? 'THE PAGE’S OWN CODE' : 'THE WEBSITE'}
            </span>
            <CommunityWebsite state={state} reduced={reduced} />
          </div>
          <VisitorBrowser state={state} reduced={reduced} />
        </div>
        <TransferLane state={state} progress={progress} reduced={reduced} />
      </div>
      <div className="xss-stage-explanation">
        <span className={`xss-explanation-icon ${secure ? 'is-secure' : ''}`}>
          {secure ? <ShieldCheck size={20} aria-hidden="true" /> : <Braces size={20} aria-hidden="true" />}
        </span>
        <div>
          <span className="xss-eyebrow">
            {current
              ? `SCENE ${'ABCD'[state.scene]} / ${state.playing ? 'PLAYING' : 'PAUSED AT YOUR PACE'}`
              : 'YOUR EXPERIMENT IS READY'}
          </span>
          <h3>{current?.title || 'Follow one comment. See the whole story.'}</h3>
          <p>
            {current?.text ||
              'Press Play for a guided walkthrough, or use Next scene to move at your own pace. All three windows are fictional.'}
          </p>
          {state.scene === 1 && <p className="xss-type-explanation">{type.processDetail}</p>}
        </div>
      </div>
      {state.scene === 3 && <CauseComparison state={state} />}
      <div className="xss-scene-navigation" role="group" aria-label="Simulation scenes">
        {scenes.map((scene, index) => (
          <button
            key={index}
            onClick={() => dispatch({ type: 'SEEK', scene: index })}
            aria-current={state.scene === index ? 'true' : undefined}
            disabled={!canPlay}
            className={`${state.scene === index ? 'is-active' : ''} ${state.scene > index ? 'is-complete' : ''}`}
          >
            <span>{state.scene > index ? <Check size={12} aria-hidden="true" /> : 'ABCD'[index]}</span>
            <strong>{scene.short}</strong>
            {state.scene === index && (
              <span className="xss-scene-timer" aria-hidden="true">
                <Motion.i style={{ scaleX: reduced || state.scene === 3 ? 1 : progress }} />
              </span>
            )}
          </button>
        ))}
      </div>
      <footer className="xss-player-controls">
        <div>
          <button
            className="xss-button xss-button-primary"
            disabled={!canPlay}
            aria-label={state.playing ? 'Pause simulation' : 'Play simulation'}
            onClick={() => dispatch({ type: state.playing ? 'PAUSE' : 'PLAY' })}
          >
            {state.playing ? (
              <Pause size={15} aria-hidden="true" />
            ) : (
              <Play size={15} aria-hidden="true" fill="currentColor" />
            )}
            {state.playing ? 'Pause' : state.scene > -1 && state.scene < 3 ? 'Resume' : 'Play'}
          </button>
          <button
            className="xss-button xss-button-quiet"
            disabled={!canPlay}
            onClick={() => dispatch({ type: 'REPLAY' })}
          >
            <RotateCcw size={14} aria-hidden="true" />
            Replay
          </button>
          <button
            className="xss-button xss-button-quiet"
            onClick={() => dispatch({ type: 'RESET_SCENARIO' })}
          >
            Reset
          </button>
        </div>
        <button
          className="xss-button xss-button-secondary"
          disabled={!canPlay || state.scene === 3}
          onClick={() => dispatch({ type: 'NEXT_SCENE' })}
        >
          Next scene
          <SkipForward size={15} aria-hidden="true" />
        </button>
      </footer>
      <details className="xss-event-log xss-details">
        <summary>
          <Terminal size={14} aria-hidden="true" />
          Event log<span>OPTIONAL · READ-ONLY</span>
        </summary>
        <ol tabIndex={0} aria-label="Local simulation events">
          {state.scene < 0 ? (
            <li>
              <span>[READY]</span> Waiting for a local simulation. No requests will be sent.
            </li>
          ) : (
            scenes.slice(0, state.scene + 1).map((scene, index) => (
              <li key={index}>
                <span>
                  [{'ABCD'[index]} / {secure ? 'TEXT' : 'DEMO'}]
                </span>{' '}
                {scene.title} — {scene.text}
              </li>
            ))
          )}
        </ol>
      </details>
    </section>
  );
}
