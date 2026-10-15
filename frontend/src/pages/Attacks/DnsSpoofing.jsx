import { useRef, useState } from 'react';
import { motion as Motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, CheckCircle2, Globe, Lock, ShieldCheck, Terminal, RotateCcw } from 'lucide-react';

const DOMAIN = 'hackaware-bank.test';
const EXPECTED = '203.0.113.10';
const POISONED = '198.51.100.66';
const steps = ['Intel', 'DNS resolution', 'Spot the difference', 'Defense', 'Review'];
const button = 'inline-flex items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-sm font-bold hover:border-cyan-400 disabled:opacity-40 disabled:cursor-not-allowed';
const panel = 'min-w-0 rounded-3xl border border-slate-800 bg-slate-900/40 p-5 sm:p-7 space-y-4';
const clues = [
  { id: 'address', question: 'The returned IP differs from the expected mapping.', correct: true, explanation: 'Correct clue in this fixed scenario: 198.51.100.66 differs from the expected 203.0.113.10. Real sites can legitimately use multiple or changing IPs; an IP difference alone is not proof of an attack.' },
  { id: 'certificate', question: 'The simulated certificate identity mismatch is a warning.', correct: true, explanation: 'A certificate for lookalike-bank.test does not authenticate hackaware-bank.test. Stop on an unexpected browser certificate warning.' },
  { id: 'page', question: 'An unexpected “disable MFA” notice is suspicious.', correct: true, explanation: 'Inconsistent security instructions are a reason to stop and verify using a trusted channel, even when a page looks familiar.' },
  { id: 'url', question: 'The familiar address bar proves this destination is safe.', correct: false, explanation: 'The domain stays hackaware-bank.test while this resolver returns a different address. A familiar URL alone cannot validate the destination; HTTPS identity verification still matters.' },
];
const vulnCode = `# Display only: fictional resolver-cache snapshot
hackaware-bank.test A 198.51.100.66
validation: not checked
# An unchecked answer can direct a browser to a lookalike.`;
const fixCode = `# Display only: conceptual defensive policy, not commands
DNSSEC: validate signatures through a trusted chain
invalid signed response: reject (fail closed)
DoH: encrypt transport to a trustworthy chosen resolver
HTTPS: verify certificate identity before sharing data
local cache: discard suspicious entry, re-resolve safely
# DoH alone does not validate DNS answer correctness.
# DNSSEC does not encrypt queries or replace HTTPS.`;
const remedies = [
  'Use a trustworthy resolver and enable DNSSEC validation where supported, with a trusted validation chain.',
  'Use DoH when appropriate. It encrypts the path to your chosen resolver; you still trust that resolver.',
  'Verify HTTPS certificates and respect browser security warnings.',
  'Clear suspicious local cache entries when appropriate; fix the underlying cause to prevent recurrence.',
  'Update browsers, operating systems, and network equipment.',
  'Use MFA and remain alert to unexpected login or security prompts.',
];

export default function DnsSpoofing() {
  const navigate = useNavigate();
  const reduced = useReducedMotion();
  const heading = useRef(null);
  const [step, setStep] = useState(0);
  const [complete, setComplete] = useState(false);
  const [lookup, setLookup] = useState(0);
  const [poisoned, setPoisoned] = useState(false);
  const [poisonSeen, setPoisonSeen] = useState(false);
  const [answers, setAnswers] = useState({});
  const [controls, setControls] = useState({ dnssec: false, doh: false, https: false });
  const [tested, setTested] = useState({ dnssec: false, doh: false, https: false });
  const [cleared, setCleared] = useState(false);
  const [defenseLog, setDefenseLog] = useState('Run a local defensive check to compare the controls.');
  // Poisoning is retained as a scenario input. DNSSEC rejects it rather than
  // silently trusting it; a fresh, validated answer is supplied by this model.
  const rejected = poisoned && controls.dnssec;
  const returned = poisoned && !controls.dnssec ? POISONED : EXPECTED;
  const blocked = poisoned && !controls.dnssec && controls.https;
  const secure = Object.values(controls).every(Boolean);
  const correctCount = clues.filter(clue => answers[clue.id] === clue.correct).length;
  const rubric = [
    ['Traced normal DNS resolution', lookup > 0, 10],
    ['Compared a simulated poisoned entry', poisonSeen, 10],
    ['Identified destination and certificate clues', correctCount === 4, 40],
    ['Tested DNSSEC rejection', tested.dnssec, 15],
    ['Tested DoH and its limitations', tested.doh, 5],
    ['Tested HTTPS identity verification', tested.https, 10],
    ['Cleared a poisoned local simulated cache', cleared, 10],
  ];
  // Each clue is worth ten points even when the full comparison is incomplete.
  const score = rubric.reduce((sum, [, earned, points], index) => sum + (index === 2 ? correctCount * 10 : earned ? points : 0), 0);
  const changeStep = (next) => { setStep(next); setComplete(false); heading.current?.focus(); };
  const reset = () => {
    setStep(0); setComplete(false); setLookup(0); setPoisoned(false); setPoisonSeen(false); setAnswers({});
    setControls({ dnssec: false, doh: false, https: false }); setTested({ dnssec: false, doh: false, https: false });
    setCleared(false); setDefenseLog('Run a local defensive check to compare the controls.'); heading.current?.focus();
  };
  const poison = () => { setPoisoned(true); setPoisonSeen(true); setDefenseLog('Simulated altered cache entry staged. Run the defensive check with your selected controls.'); };
  const toggle = (id) => { setControls(previous => ({ ...previous, [id]: !previous[id] })); setDefenseLog('Controls changed. The mapping below reflects the current policy; run the check to record your observation.'); };
  const checkDefenses = () => {
    setTested(previous => ({ dnssec: previous.dnssec || (poisoned && controls.dnssec), doh: previous.doh || (poisoned && controls.doh), https: previous.https || (poisoned && controls.https) }));
    setDefenseLog([
      '[SIMULATED] Defensive check — no DNS query sent.',
      poisoned ? '[CACHE] Altered entry offered: 198.51.100.66 (invalid signature in this scenario).' : '[CACHE] Expected mapping available. Stage an altered entry to test rejection.',
      controls.dnssec ? poisoned ? '[DNSSEC] INVALID response REJECTED. Fresh valid answer from the fictional trusted chain: 203.0.113.10.' : '[DNSSEC] Expected response validated in this scenario.' : '[DNSSEC] Validation disabled. Altered entries are not rejected by this control.',
      controls.doh ? '[DoH] Query transit protected to chosen resolver; an incorrect answer can still arrive from that resolver. DoH alone does not repair poisoning.' : '[DoH] Query transit protection not enabled in this model.',
      controls.https ? poisoned && !controls.dnssec ? '[HTTPS] Certificate identity mismatch. Navigation BLOCKED; no login page accepted.' : '[HTTPS] Certificate identity matches the intended domain in this scenario. A mismatch would block navigation.' : '[HTTPS] Identity checking disabled for this deliberately unsafe illustration.',
    ].join('\n'));
  };

  return (
    <main className="min-h-screen bg-[#020617] p-4 text-slate-300 sm:p-8 [&_button:focus-visible]:outline-2 [&_button:focus-visible]:outline-offset-4 [&_button:focus-visible]:outline-cyan-300 [&_input:focus-visible]:outline-2 [&_input:focus-visible]:outline-cyan-300">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div><p className="font-black uppercase italic text-cyan-400">HackAware PRO / Name resolution</p><h1 className="mt-2 text-2xl font-black text-white sm:text-3xl">DNS Spoofing / Pharming</h1></div>
          <span className="rounded-full border border-amber-400/40 bg-amber-500/10 px-4 py-2 font-bold text-amber-200">Simulation only</span>
          <button className={button} onClick={() => navigate('/dashboard')}><ArrowLeft size={16} /> Dashboard</button>
        </header>
        <p className="text-sm text-slate-400">All DNS records, certificates, and browser panels are fictional local illustrations. No real DNS query, cache change, or resolver configuration occurs. Progress is session-local.</p>
        <nav aria-label="DNS lab steps" className="grid grid-cols-2 gap-2 sm:grid-cols-5">{steps.map((label, index) => <button key={label} aria-current={!complete && step === index ? 'step' : undefined} className={`${button} ${!complete && step === index ? 'border-cyan-400 text-cyan-300' : ''}`} onClick={() => changeStep(index)}>{index + 1}. {label}</button>)}</nav>
        <div role="progressbar" aria-label="Lab progress" aria-valuemin={0} aria-valuemax={5} aria-valuenow={complete ? 5 : step} className="h-1 rounded bg-slate-800"><div className="h-full rounded bg-cyan-400" style={{ width: `${(complete ? 5 : step) * 20}%` }} /></div>
        <h2 ref={heading} tabIndex={-1} className="text-xl font-black text-white focus:outline-none">{complete ? 'Simulation complete' : `${step + 1}. ${steps[step]}`}</h2>
        <AnimatePresence mode="wait" initial={false}>
          <Motion.section key={complete ? 'complete' : step} initial={reduced ? false : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={reduced ? undefined : { opacity: 0 }} transition={{ duration: reduced ? 0 : 0.18 }} className="space-y-6">
            {complete ? <div className={panel}>
              <ShieldCheck size={36} className="text-cyan-400" /><h3 className="text-2xl font-black text-white">Learning score: {score}/100</h3>
              <p>You correctly identified {correctCount}/4 clues. DNSSEC rejects the invalid response in this model, DoH protects transit only, HTTPS checks identity, and clearing the local cache removes an entry without fixing its cause.</p>
              <ul className="space-y-2">{clues.map(clue => <li key={clue.id}>{answers[clue.id] === undefined ? '○ Not answered' : answers[clue.id] === clue.correct ? '✓ Identified correctly' : '× Needs review'} — {clue.question}</li>)}</ul>
              <ul className="space-y-2">{rubric.map(([label, earned, points], index) => <li key={label}>{earned ? '✓ Demonstrated' : '○ Incomplete'} — {label} ({index === 2 ? correctCount * 10 : earned ? points : 0}/{points})</li>)}</ul>
              <p className="text-sm text-slate-400">First answers to each clue are scored; feedback is available immediately. Each defensive interaction earns points once. Restart for a fresh attempt.</p>
              <div className="flex flex-wrap gap-3"><button className={button} onClick={() => changeStep(0)}>Review lab</button><button className={button} onClick={reset}><RotateCcw size={16} /> Restart</button></div>
            </div> : <>
              {step === 0 && <div className="grid gap-6 md:grid-cols-2"><article className={panel}><Globe className="text-cyan-400" /><h3 className="text-lg font-bold text-white">The internet’s address book</h3><p>DNS translates domain names into IP addresses. Your browser asks a recursive resolver for an answer. The resolver may use its cache or ask DNS servers, ultimately reaching an authoritative server responsible for that domain’s records.</p><p>In this fictional world, hackaware-bank.test maps to 203.0.113.10. An attacker supplies a false cached answer, 198.51.100.66, so the same typed name leads elsewhere. This is DNS cache poisoning.</p></article><article className={panel}><h3 className="text-lg font-bold text-white">Pharming is not just phishing</h3><p>Pharming redirects people to a false destination by subverting name resolution or local settings, even when they enter the correct domain. Phishing commonly persuades people to follow a deceptive message or link. Both may present lookalike pages.</p><p>A familiar-looking URL alone does not prove trust. HTTPS certificate validation can prevent an impersonating destination from being accepted, even after a wrong DNS answer. All warnings here are generated examples, not your actual browser’s security status.</p></article></div>}
              {step === 1 && <div className={panel}>
                <h3 className="text-lg font-bold text-white">Normal simulated resolution</h3>
                <div role="img" aria-label="Simulated DNS lookup: Browser asks Recursive Resolver, which asks Authoritative DNS. The answer returns through the resolver to the browser." className="grid gap-3 sm:grid-cols-3">{['Browser', 'Recursive Resolver', 'Authoritative DNS'].map((node, i) => <Motion.div key={`${lookup}-${node}`} animate={lookup && !reduced ? { opacity: [0.4, 1], y: [6, 0] } : { opacity: 1 }} transition={{ delay: reduced ? 0 : i * 0.2 }} className="relative rounded-2xl border border-cyan-500/30 bg-black/50 p-6 text-center font-bold">{node}{lookup > 0 && <Motion.span aria-hidden="true" initial={false} animate={reduced ? {} : { x: [-18, 18, -18], opacity: [0, 1, 0] }} transition={{ duration: 1, delay: i * 0.2 }} className="absolute bottom-1 left-1/2 text-cyan-300">◆</Motion.span>}</Motion.div>)}</div>
                <button className={button} onClick={() => setLookup(n => n + 1)}>Resolve fictional domain</button>
                <p role="status">{lookup ? 'Simulated request: Browser → Recursive Resolver → Authoritative DNS. Response: Authoritative DNS → Resolver → Browser, 203.0.113.10. No query was sent.' : 'Select Resolve to illustrate a cache miss and the returning answer.'}</p>
                <table className="w-full table-fixed text-left text-sm"><caption className="mb-3 text-left text-cyan-300">Expected fictional DNS mapping</caption><thead><tr><th scope="col" className="p-2">Domain</th><th scope="col" className="p-2">A record</th></tr></thead><tbody><tr className="border-t border-slate-700"><td className="break-all p-2 font-mono">{DOMAIN}</td><td className="break-all p-2 font-mono">{EXPECTED}</td></tr></tbody></table>
              </div>}
              {step === 2 && <>
                <div className={panel}><h3 className="text-lg font-bold text-white">Alter a fictional resolver cache</h3><button className={button} onClick={poison}>Simulate poisoned cache entry</button><p role="status">{poisoned ? `SIMULATED ATTACK: cached A record changed from ${EXPECTED} to ${POISONED}. No actual DNS record was modified.` : `Normal local scenario: ${DOMAIN} → ${EXPECTED}. Stage the altered entry to compare clues.`}</p><p className="text-sm text-slate-400">This attack drill intentionally shows an unvalidated response. Defense controls in step 4 apply only to the defensive comparison, not this historical example.</p></div>
                {poisoned && <>
                  <div className="grid gap-6 md:grid-cols-2"><div className={panel}><h3 className="text-lg font-bold text-emerald-300">Expected destination — simulated</h3><p className="break-all font-mono">{DOMAIN} → {EXPECTED}</p><p>Certificate identity: hackaware-bank.test</p><p>Validation: valid in this fictional scenario</p><p>Page: HackAware Demo Bank · MFA remains enabled</p></div><div className={`${panel} border-amber-500/40`}><h3 className="text-lg font-bold text-amber-200">Lookalike page — simulated</h3><div className="rounded-xl border border-slate-700 bg-black/60 p-3 font-mono break-all" aria-label="Fictional browser address bar">https://{DOMAIN}</div><h4 className="text-xl font-black text-white">HackAware Demo Bank</h4><p>Returned IP: {POISONED}</p><p>Certificate identity: lookalike-bank.test · Validation: FAILED (identity mismatch)</p><p className="rounded-xl border border-amber-500/40 p-3">Simulated warning: connection identity cannot be verified.</p><p>Suspicious page notice: “Disable MFA to continue.”</p><p className="text-xs text-slate-400">Deliberately unsafe preview. A validating browser would normally block this connection. This preview has no login inputs and collects nothing.</p></div></div>
                  <div className={panel}><h3 className="text-lg font-bold text-white">Spot the Difference</h3><p>Judge each statement. First answers are scored; explanations appear after each choice.</p><div className="grid gap-4 md:grid-cols-2">{clues.map(clue => <fieldset key={clue.id} className="rounded-xl border border-slate-700 p-4"><legend className="px-1 font-bold">{clue.question}</legend><div className="flex flex-wrap gap-3">{[true, false].map(value => <button key={String(value)} className={button} disabled={answers[clue.id] !== undefined} onClick={() => setAnswers(previous => previous[clue.id] === undefined ? { ...previous, [clue.id]: value } : previous)}>{value ? 'True' : 'False'}</button>)}</div>{answers[clue.id] !== undefined && <p role="status" className="mt-3">{answers[clue.id] === clue.correct ? '✓ Correct.' : '× Not quite.'} {clue.explanation}</p>}</fieldset>)}</div></div>
                </>}
              </>}
              {step === 3 && <>
                <div className={panel}><div className="flex flex-wrap items-center justify-between gap-4"><h3 className="flex items-center gap-2 text-lg font-bold text-white"><Lock size={20} /> Defensive DNS and browser validation</h3><button role="switch" aria-checked={secure} className={button} onClick={() => { const enabled = !secure; setControls({ dnssec: enabled, doh: enabled, https: enabled }); setDefenseLog('Secure-mode controls changed. Run the check to record this comparison.'); }}>{secure ? 'Hardened: secure mode on' : 'Enable secure mode'}</button></div>
                  <p>Enable controls separately to compare their roles, or turn on secure mode for all three.</p><div className="grid gap-3 sm:grid-cols-3">{[['dnssec', 'DNSSEC validation'], ['doh', 'DNS-over-HTTPS (DoH)'], ['https', 'HTTPS certificate verification']].map(([id, label]) => <label key={id} className="flex gap-3 rounded-xl border border-slate-700 p-4"><input type="checkbox" checked={controls[id]} onChange={() => toggle(id)} /><span>{label}</span></label>)}</div>
                  <div className="flex flex-wrap gap-3"><button className={button} onClick={poison}>Stage altered response</button><button className={button} onClick={checkDefenses}>Run defensive check</button><button className={button} onClick={() => { if (poisoned) setCleared(true); setPoisoned(false); setDefenseLog('[SIMULATED] Local cache cleared. Fresh expected mapping restored: 203.0.113.10. This does not fix a compromised upstream resolver or prevent recurrence. No system cache was touched.'); }}>Clear local simulated DNS cache</button></div>
                  <div role="status" className="space-y-2 rounded-xl border border-cyan-500/30 bg-black/40 p-4"><p className="break-all font-mono">Current defensive mapping: {DOMAIN} → {returned}</p><p>{rejected ? 'DNSSEC: altered answer rejected as invalid; fresh validated mapping restored in this model.' : poisoned ? 'Altered answer still present. DoH alone does not correct it.' : 'Expected mapping restored in this model.'}</p><p>{blocked ? 'HTTPS: navigation blocked due to simulated certificate mismatch.' : returned === EXPECTED ? 'Destination: expected fictional server.' : 'Warning: the fictional browser could accept the lookalike without identity checking.'}</p></div>
                </div>
                <div className="grid gap-6 md:grid-cols-2"><article className={panel}><h3 className="font-bold text-white">What each control guarantees</h3><p>DNSSEC authenticates signed DNS data only with a correctly configured, trusted validation chain. Here the domain is assumed signed and the altered answer has an invalid signature. Validation rejects it; a real resolver might return an error rather than recover automatically.</p><p>DoH encrypts queries in transit to the chosen resolver. It does not independently prove every answer is correct, repair poisoned caches, or remove the need to trust the resolver.</p><p>HTTPS certificate verification checks the destination identity. Clearing a local cache removes stored entries but does not prevent re-poisoning or fix an upstream compromise.</p></article><div className={`${panel} bg-black/60`}><h3 className="flex items-center gap-2 font-bold text-cyan-400"><Terminal size={18} /> Simulated validation console</h3><pre role="status" className="whitespace-pre-wrap break-all text-sm leading-relaxed">{defenseLog}</pre></div></div>
                <div className="grid gap-6 md:grid-cols-2">{[['Vulnerable code — display only', vulnCode], ['Secure policy — display only', fixCode]].map(([title, code]) => <div key={title} className={panel}><h3 className="font-bold text-cyan-300">{title}</h3><pre className="whitespace-pre-wrap break-all text-sm">{code}</pre></div>)}</div>
              </>}
              {step === 4 && <div className={panel}><h3 className="text-lg font-bold text-white">Remediation checklist</h3><ol className="grid gap-3 md:grid-cols-2">{remedies.map((remedy, i) => <li key={remedy} className="flex gap-3 rounded-xl border border-slate-800 bg-black/40 p-4"><CheckCircle2 className="shrink-0 text-cyan-400" size={18} /><span>{i + 1}. {remedy}</span></li>)}</ol><p>Current learning score: {score}/100. Correct clue answers: {correctCount}/4. Visit the defense step to stage an altered response, compare controls, and clear the simulated cache.</p></div>}
            </>}
          </Motion.section>
        </AnimatePresence>
        {!complete && <footer className="flex flex-wrap justify-between gap-3 pb-8"><button className={button} disabled={step === 0} onClick={() => changeStep(step - 1)}><ArrowLeft size={16} /> Back</button><button className={button} onClick={reset}><RotateCcw size={16} /> Reset lab</button><button className={`${button} text-cyan-300`} onClick={() => { if (step < 4) changeStep(step + 1); else { setComplete(true); heading.current?.focus(); } }}>{step === 4 ? 'Complete review' : 'Next'}<ArrowRight size={16} /></button></footer>}
      </div>
    </main>
  );
}
