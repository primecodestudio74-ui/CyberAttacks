// This model never parses input. Only an explicitly selected, built-in demo
// carries an effect ID; editing its text turns it into a text-only scenario.
export const XSS_STEPS = ['Intel', 'Setup', 'Attack Simulation', 'Secure It'];
export const MAX_COMMENT_LENGTH = 280;
// A reading interval for the opt-in player, not a simulated network delay.
export const SCENE_SECONDS = 3.6;

export const XSS_TYPES = [
  {
    id: 'stored',
    title: 'Stored XSS',
    short: 'Saved for later',
    description: 'The unsafe content is saved and shown to later visitors.',
    flow: ['Post a comment', 'Website saves it', 'A visitor opens it'],
    detail: 'Like leaving a dangerous note on a public noticeboard. Each new visitor could encounter it.',
    process: 'Saved comment',
    processDetail: 'The website saves the comment, then places it on the page for a later visitor.',
    visitor: 'Sam opens the board',
    location: 'Comment renderer',
  },
  {
    id: 'reflected',
    title: 'Reflected XSS',
    short: 'Sent straight back',
    description: 'The unsafe input is reflected in a response.',
    flow: ['Submit input', 'Website echoes it', 'Response opens'],
    detail:
      'Like a website repeating a search or preview request without safely handling the words. It does not need to save them.',
    process: 'Preview response',
    processDetail:
      'The website echoes the submitted input in a comment-preview response. Nothing needs to be saved.',
    visitor: 'Sam views the response',
    location: 'Response renderer',
  },
  {
    id: 'dom',
    title: 'DOM-based XSS',
    short: 'Changed in the browser',
    description: 'Unsafe client-side JavaScript logic processes input in a dangerous way.',
    flow: ['Read local input', 'Page code uses it', 'Preview changes'],
    detail:
      'The page’s own JavaScript changes the visible page unsafely. This path can happen entirely in a browser, without a server response.',
    process: 'Browser-side preview',
    processDetail:
      'The page’s own JavaScript reads local input and updates the preview. No server response is involved in this illustrated path.',
    visitor: 'Sam sees the page update',
    location: 'Client-side renderer',
  },
];

export const XSS_DEMOS = [
  {
    id: 'banner',
    title: 'Unexpected banner',
    input: '<demo-banner>Page changed!</demo-banner>',
    effect: 'banner',
    description: 'A fictional warning appears on the visitor’s page.',
  },
  {
    id: 'headline',
    title: 'Changed headline',
    input: '<demo-title>A different headline</demo-title>',
    effect: 'headline',
    description: 'A page heading changes in the illustration.',
  },
  {
    id: 'friendly',
    title: 'Friendly comment',
    input: 'A safer web, one small change at a time. Happy to be here!',
    effect: null,
    description: 'An ordinary comment with no simulated impact.',
  },
];

export function createXSSState() {
  return {
    step: 0,
    completed: [],
    type: 'stored',
    mode: 'vulnerable',
    demoId: 'banner',
    input: XSS_DEMOS[0].input,
    submission: null,
    scene: -1,
    playing: false,
    runId: 0,
  };
}

function clearRun(state, changes = {}) {
  return { ...state, ...changes, submission: null, scene: -1, playing: false, runId: state.runId + 1 };
}

function snapshot(state) {
  const demo = XSS_DEMOS.find(({ id }) => id === state.demoId);
  return {
    text: state.input,
    type: state.type,
    // Equality is a consistency check, not payload detection. Arbitrary text,
    // including an exact copy typed by a learner, never receives an effect ID.
    effect: demo && demo.input === state.input ? demo.effect : null,
    custom: state.demoId === 'custom',
  };
}

function startRun(state) {
  if (!state.input.trim()) return state;
  return { ...state, submission: snapshot(state), scene: 0, playing: true, runId: state.runId + 1 };
}

export function xssReducer(state, action) {
  switch (action.type) {
    case 'STEP': {
      if (!Number.isInteger(action.step) || action.step < 0 || action.step >= XSS_STEPS.length) return state;
      const completed =
        action.step > state.step ? [...new Set([...state.completed, state.step])] : state.completed;
      return { ...state, step: action.step, completed, playing: false };
    }
    case 'SELECT_TYPE':
      return XSS_TYPES.some(({ id }) => id === action.id) ? clearRun(state, { type: action.id }) : state;
    case 'SELECT_DEMO': {
      const demo = XSS_DEMOS.find(({ id }) => id === action.id);
      return demo ? clearRun(state, { demoId: demo.id, input: demo.input }) : state;
    }
    case 'INPUT':
      return clearRun(state, { input: String(action.value).slice(0, MAX_COMMENT_LENGTH), demoId: 'custom' });
    case 'MODE': {
      if (!['secure', 'vulnerable'].includes(action.mode) || state.mode === action.mode) return state;
      // Live comparison re-renders the very same snapshot. No old callback can
      // restore an impact after the mode changes (runId invalidates that run).
      const submission =
        state.submission || (state.step === 3 && state.input.trim() ? snapshot(state) : null);
      return {
        ...state,
        mode: action.mode,
        submission,
        scene: submission ? 3 : -1,
        playing: false,
        runId: state.runId + 1,
        completed:
          state.step === 3 && action.mode === 'secure'
            ? [...new Set([...state.completed, 3])]
            : state.completed,
      };
    }
    case 'PLAY':
      return state.submission && state.scene >= 0 && state.scene < 3
        ? { ...state, playing: true }
        : startRun(state);
    case 'PAUSE':
      return state.playing ? { ...state, playing: false } : state;
    case 'REPLAY':
    case 'SUBMIT':
      return startRun(state);
    case 'ADVANCE':
      // Animation completions from a reset, paused, or superseded run are inert.
      if (!state.playing || action.runId !== state.runId || action.scene !== state.scene || state.scene >= 3)
        return state;
      return { ...state, scene: state.scene + 1, playing: state.scene + 1 < 3 };
    case 'NEXT_SCENE':
    case 'SEEK': {
      if (!state.input.trim()) return state;
      const scene = action.type === 'SEEK' ? action.scene : Math.min(3, state.scene + 1);
      if (!Number.isInteger(scene) || scene < 0 || scene > 3) return state;
      return {
        ...state,
        submission: state.submission || snapshot(state),
        scene,
        playing: false,
        runId: state.runId + 1,
      };
    }
    case 'RESET_SCENARIO':
      return clearRun(state);
    case 'RESET_LAB':
      return { ...createXSSState(), runId: state.runId + 1 };
    default:
      return state;
  }
}

export function getXSSOutcome(state) {
  const secure = state.mode === 'secure';
  const impact = !secure && state.scene >= 2 && Boolean(state.submission?.effect);
  return {
    secure,
    impact,
    effect: impact ? state.submission.effect : null,
    status: secure
      ? 'Safe rendering enabled'
      : impact
        ? 'Unsafe rendering detected'
        : 'Unsafe rendering pattern',
  };
}

export function getXSSScenes(state) {
  const { secure, impact } = getXSSOutcome(state);
  const type = XSS_TYPES.find(({ id }) => id === state.type) || XSS_TYPES[0];
  return [
    {
      title: 'Input submitted',
      short: 'Submit input',
      text: `${type.flow[0]}. The text moves into the fictional website’s processing path. Nothing leaves this lab.`,
    },
    {
      title: secure ? 'Safe text rendering' : 'Unsafe processing',
      short: secure ? 'Render as text' : 'Process input',
      text: secure
        ? 'Untrusted input stays ordinary text. The rendering location does not interpret it as instructions.'
        : 'Untrusted input reached an unsafe rendering location.',
    },
    {
      title: secure ? 'The page stays intact' : impact ? 'Simulated browser effect' : 'Text-only preview',
      short: 'See the result',
      text: secure
        ? 'The same input appears literally. No simulated banner or headline change is applied.'
        : impact
          ? 'A built-in visual effect changes the fictional visitor’s page. Your input did not execute any code.'
          : 'No built-in effect is selected for this text. This is not a safety verdict: the hypothetical rendering pattern is still unsafe.',
    },
    {
      title: secure ? 'Text, not instructions' : 'Why did this happen?',
      short: 'Understand why',
      text: secure
        ? 'React’s normal text interpolation keeps this comment as data, so this particular unsafe-rendering demonstration cannot change the page.'
        : 'The website treated untrusted input as something to interpret instead of ordinary text.',
    },
  ];
}
