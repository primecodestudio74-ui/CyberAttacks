import { useRef, useState } from 'react';
import { motion as Motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, CheckCircle2, Lock, Unlock, ShieldCheck, Terminal, Wifi, RotateCcw } from 'lucide-react';

const steps = ['Intel', 'Network flow', 'HTTP exposure', 'TLS defense', 'Review'];
const button = 'inline-flex items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-sm font-bold hover:border-cyan-400 disabled:opacity-40 disabled:cursor-not-allowed';
const panel = 'min-w-0 rounded-3xl border border-slate-800 bg-slate-900/40 p-5 sm:p-7 space-y-4';
const vulnCode = `<!-- Display only: deliberately insecure transport -->
<form action="http://hackaware-bank.test/login" method="post">
  <!-- Fictional demo fields only; never deploy this. -->
</form>`;
const fixCode = `# Display only: partial deployment sketch
# Provision a valid certificate and private key first.
server {
  listen 443 ssl;
  server_name hackaware-bank.test;
  ssl_certificate /example/fullchain.pem;
  ssl_certificate_key /example/private-key.pem;
  add_header Strict-Transport-Security "max-age=31536000" always;
}
# Also redirect HTTP to HTTPS, configure modern TLS,
# validate certificates, and test renewal.
# HSTS is learned over valid HTTPS; the header alone
# does not set up TLS. Consider subdomains carefully.`;
const remedies = [
  'Prefer HTTPS. Deploy HSTS over valid HTTPS after testing your TLS configuration.',
  'Use a trusted VPN when appropriate on untrusted networks; it shifts trust to the VPN provider and does not replace HTTPS.',
  'Avoid unknown or suspicious Wi-Fi hotspots; confirm the official network with staff.',
  'Never ignore unexpected certificate warnings. Go back and investigate safely.',
  'Enable multifactor authentication; it reduces account takeover risk but does not encrypt traffic.',
  'Keep devices, browsers, and applications updated.',
];

export default function MitmAttack() {
  const navigate = useNavigate();
  const reduced = useReducedMotion();
  const heading = useRef(null);
  const [step, setStep] = useState(0);
  const [complete, setComplete] = useState(false);
  const [network, setNetwork] = useState('Cafe_Free_WiFi');
  const [networkChosen, setNetworkChosen] = useState(false);
  const [flow, setFlow] = useState(0);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [httpSeen, setHttpSeen] = useState(false);
  const [secure, setSecure] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [tlsSeen, setTlsSeen] = useState(false);
  const [decision, setDecision] = useState(null);
  const [firstDecision, setFirstDecision] = useState(null);

  const rubric = [
    ['Selected the official Wi-Fi after considering trust', networkChosen && network === 'Cafe_Official', 20],
    ['Traced the simulated network flow', flow > 0, 10],
    ['Observed HTTP plaintext exposure with fake credentials', httpSeen, 20],
    ['Tested the encrypted TLS scenario', tlsSeen, 25],
    ['Chose Go back on the first certificate-warning decision', firstDecision === 'back', 25],
  ];
  const score = rubric.reduce((sum, [, earned, points]) => sum + (earned ? points : 0), 0);
  const changeStep = (next) => {
    setStep(next);
    setComplete(false);
    heading.current?.focus();
  };
  const reset = () => {
    setStep(0); setComplete(false); setNetwork('Cafe_Free_WiFi'); setNetworkChosen(false);
    setFlow(0); setUsername(''); setPassword(''); setError(''); setHttpSeen(false);
    setSecure(false); setSubmitted(false); setTlsSeen(false); setDecision(null); setFirstDecision(null);
    heading.current?.focus();
  };
  const submit = (event) => {
    event.preventDefault();
    if (username !== 'demo_learner' || password !== 'FAKE-pass-123') {
      setError('Select both provided fictional values. No real credentials are accepted.');
      return;
    }
    setError(''); setSubmitted(true);
    if (step === 3 && secure) setTlsSeen(true);
    else setHttpSeen(true);
  };
  const choose = (value) => {
    setDecision(value);
    if (firstDecision === null) setFirstDecision(value);
  };
  const loginForm = (
    <form onSubmit={submit} className="space-y-4" aria-label="Fictional banking login" autoComplete="off">
      <p className="font-mono text-cyan-300 break-all">{step === 3 && secure ? 'https' : 'http'}://hackaware-bank.test</p>
      <p className="text-amber-200">Educational warning: fake account only. Select the supplied values; never enter real account details.</p>
      <label className="block">Fictional username
        <select className="mt-2 w-full rounded-xl border border-slate-600 bg-slate-950 p-3" value={username} onChange={e => setUsername(e.target.value)} required>
          <option value="">Choose demo username</option><option value="demo_learner">demo_learner (fake)</option>
        </select>
      </label>
      <label className="block">Fictional password (shown for learning)
        <select className="mt-2 w-full rounded-xl border border-slate-600 bg-slate-950 p-3" value={password} onChange={e => setPassword(e.target.value)} required>
          <option value="">Choose demo password</option><option value="FAKE-pass-123">FAKE-pass-123 (fake)</option>
        </select>
      </label>
      {error && <p role="alert">{error}</p>}
      <button className={button} type="submit">Simulate {step === 3 && secure ? 'HTTPS' : 'HTTP'} login</button>
      <p className="text-xs text-slate-400">Local illustration only. Nothing is submitted to the fictional domain.</p>
    </form>
  );

  return (
    <main className="min-h-screen bg-[#020617] p-4 text-slate-300 sm:p-8 [&_button:focus-visible]:outline-2 [&_button:focus-visible]:outline-offset-4 [&_button:focus-visible]:outline-cyan-300 [&_input:focus-visible]:outline-2 [&_input:focus-visible]:outline-cyan-300 [&_select:focus-visible]:outline-2 [&_select:focus-visible]:outline-cyan-300">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div><p className="font-black uppercase italic text-cyan-400">HackAware PRO / Transport security</p><h1 className="mt-2 text-2xl font-black text-white sm:text-3xl">Man-in-the-Middle (MITM)</h1></div>
          <span className="rounded-full border border-amber-400/40 bg-amber-500/10 px-4 py-2 font-bold text-amber-200">Simulation only</span>
          <button className={button} onClick={() => navigate('/dashboard')}><ArrowLeft size={16} /> Dashboard</button>
        </header>
        <p className="text-sm text-slate-400">All packets, certificates, and events below are fictional illustrations generated in your browser, not observations of a real connection. Progress is session-local.</p>
        <nav aria-label="MITM lab steps" className="grid grid-cols-2 gap-2 sm:grid-cols-5">
          {steps.map((label, index) => <button key={label} aria-current={!complete && step === index ? 'step' : undefined} onClick={() => changeStep(index)} className={`${button} ${!complete && step === index ? 'border-cyan-400 text-cyan-300' : ''}`}>{index + 1}. {label}</button>)}
        </nav>
        <div role="progressbar" aria-label="Lab progress" aria-valuemin={0} aria-valuemax={5} aria-valuenow={complete ? 5 : step} className="h-1 rounded bg-slate-800"><div className="h-full rounded bg-cyan-400" style={{ width: `${(complete ? 5 : step) * 20}%` }} /></div>
        <h2 ref={heading} tabIndex={-1} className="text-xl font-black text-white focus:outline-none">{complete ? 'Simulation complete' : `${step + 1}. ${steps[step]}`}</h2>
        <AnimatePresence mode="wait" initial={false}>
          <Motion.section key={complete ? 'complete' : step} initial={reduced ? false : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={reduced ? undefined : { opacity: 0 }} transition={{ duration: reduced ? 0 : 0.18 }} className="space-y-6">
            {complete ? <div className={panel}>
              <ShieldCheck className="text-cyan-400" size={36} /><h3 className="text-2xl font-black text-white">Learning score: {score}/100</h3>
              <p>You explored intermediary risk, HTTP exposure, encrypted transport, and certificate decisions. Completion records a review, not a security qualification.</p>
              <ul className="space-y-3">{rubric.map(([label, earned, points]) => <li key={label}>{earned ? '✓ Demonstrated' : '○ Not demonstrated'} — {label} ({earned ? points : 0}/{points})</li>)}</ul>
              <p className="text-sm text-slate-400">Each interaction earns points once. The first certificate decision is scored; exploring the other outcome does not overwrite it. Restart for a fresh attempt.</p>
              <div className="flex flex-wrap gap-3"><button className={button} onClick={() => changeStep(0)}>Review lab</button><button className={button} onClick={reset}><RotateCcw size={16} /> Restart</button></div>
            </div> : <>
              {step === 0 && <div className="grid gap-6 md:grid-cols-2">
                <article className={panel}><h3 className="text-lg font-bold text-white">An unwanted intermediary</h3><p>A Man-in-the-Middle attack puts an intermediary between two parties. Without adequate protection, that intermediary may read or modify their communications.</p><p>Imagine visiting hackaware-bank.test on café Wi-Fi. In this fictional scenario an attacker operates Cafe_Free_WiFi, routing your traffic through their equipment.</p><p>A rogue hotspot tricks you into joining an attacker-controlled network. ARP spoofing instead abuses local address discovery on an existing network to redirect traffic. These are different ways to gain an intermediary position; neither is executed here.</p></article>
                <article className={panel}><Lock className="text-cyan-400" /><h3 className="text-lg font-bold text-white">Transport trust matters</h3><p>HTTP does not encrypt your request. Properly validated HTTPS/TLS protects data in transit against reading and undetected alteration, and authenticates the server identity named in the certificate.</p><p>A familiar Wi-Fi name does not prove ownership. Even an official network is not a substitute for TLS. A padlock does not prove a business is honest or protect an infected device.</p><p>Mission: compare HTTP with TLS, then decide what to do with an unexpected certificate warning.</p></article>
              </div>}
              {step === 1 && <div className={panel}>
                <h3 className="flex items-center gap-2 text-lg font-bold text-white"><Wifi size={20} /> Choose a fictional café network</h3>
                <fieldset className="flex flex-wrap gap-4"><legend className="mb-2">Wi-Fi options (local simulation)</legend>{['Cafe_Free_WiFi', 'Cafe_Official'].map(name => <label key={name} className="flex gap-2 rounded-xl border border-slate-700 p-4"><input type="radio" name="wifi" value={name} checked={network === name} onChange={() => { setNetwork(name); setNetworkChosen(true); setFlow(0); }} />{name}</label>)}</fieldset>
                <p role="status">{network === 'Cafe_Free_WiFi' ? 'Scenario: rogue hotspot. The attacker is on the traffic path.' : 'Scenario: staff-confirmed official network. The attacker below is a hypothetical intermediary, not a detected intruder. TLS is still needed.'}</p>
                <div role="img" aria-label={`Simulated path: User → Attacker → Website. ${network === 'Cafe_Free_WiFi' ? 'Attacker is on-path.' : 'Attacker position is hypothetical.'}`} className="grid grid-cols-1 items-center gap-3 sm:grid-cols-3">
                  {['User / 192.0.2.10', 'Attacker / 198.51.100.66', 'Website / 203.0.113.10'].map((node, i) => <Motion.div key={`${flow}-${node}`} animate={flow && !reduced ? { opacity: [0.4, 1], y: [6, 0] } : { opacity: 1 }} transition={{ delay: reduced ? 0 : i * 0.2 }} className="relative rounded-2xl border border-cyan-500/30 bg-black/50 p-6 text-center font-mono text-sm">{node}{flow > 0 && <Motion.span aria-hidden="true" initial={false} animate={reduced ? {} : { x: [-18, 18], opacity: [0, 1, 0] }} transition={{ duration: 0.8, delay: i * 0.25 }} className="absolute bottom-1 left-1/2 text-cyan-300">◆</Motion.span>}</Motion.div>)}
                </div>
                <button className={button} onClick={() => setFlow(n => n + 1)}>Trace simulated packet</button><p role="status">{flow > 0 ? 'Simulated packet moved: User → intermediary → Website. No network traffic was sent.' : 'Select Trace to illustrate the path. The diagram is not a network scan.'}</p>
              </div>}
              {(step === 2 || step === 3) && <>
                {step === 3 && <div className={panel}>
                  <div className="flex flex-wrap items-center justify-between gap-4"><h3 className="flex items-center gap-2 font-bold text-white">{secure ? <Lock /> : <Unlock />} Security hardening</h3><button role="switch" aria-checked={secure} className={button} onClick={() => { setSecure(!secure); setSubmitted(false); }}>{secure ? 'Hardened: HTTPS/TLS on' : 'Vulnerable: enable HTTPS/TLS'}</button></div>
                  <p>TLS protects data between validated endpoints, not malware on your device, every traffic metadata field, or the honesty of the website. The ciphertext below is a placeholder, not actual encryption.</p>
                  {secure && <div className="rounded-xl border border-emerald-500/40 p-4"><h4 className="flex items-center gap-2 font-bold text-emerald-300"><Lock size={16} /> Simulated certificate details</h4><p>Identity: hackaware-bank.test · Issuer: HackAware Fictional CA · Scenario status: valid for the intended host. No real certificate was retrieved.</p></div>}
                </div>}
                <div className="grid gap-6 md:grid-cols-2"><div className={panel}>{loginForm}</div><div className={`${panel} bg-black/60`}><h3 className="flex items-center gap-2 font-bold text-cyan-400"><Terminal size={18} /> Simulated attacker panel</h3><pre role="status" className="whitespace-pre-wrap break-all font-mono text-sm leading-relaxed">{!submitted ? '[SIMULATED] Awaiting a local demo submission.' : step === 3 && secure ? '[SIMULATED TLS] Application data: <encrypted-record-placeholder>\nPlaintext credentials unavailable to this fictional intermediary.\nServer identity validated in this scenario.' : '[SIMULATED HTTP] POST /login HTTP/1.1\nHost: hackaware-bank.test\nusername=demo_learner&password=FAKE-pass-123\n[LESSON] HTTP exposes plaintext to an on-path observer.'}</pre></div></div>
                {step === 2 && <div className={panel}><h3 className="font-bold text-red-300">Vulnerable code — display only</h3><pre className="whitespace-pre-wrap break-all text-sm">{vulnCode}</pre></div>}
                {step === 3 && <>
                  <div className={panel}><h3 className="font-bold text-amber-200">Separate decision drill: unexpected certificate warning</h3><p>A different fictional connection reports a certificate identity mismatch. This is independent of the valid-certificate example above. What do you do?</p><div className="flex flex-wrap gap-3"><button className={button} onClick={() => choose('proceed')}>Proceed anyway</button><button className={button} onClick={() => choose('back')}>Go back</button></div><p role="status">{decision === 'proceed' ? 'Unsafe decision: in this fictional branch you accepted an unverified identity. Encryption to an impersonator does not authenticate the intended bank. No real browser control was bypassed.' : decision === 'back' ? 'Safe decision: the fictional connection is stopped before sharing data. Investigate using a trusted channel; do not ignore unexpected certificate warnings.' : 'Choose an outcome. Only your first decision is scored; you may explore both.'}</p></div>
                  <div className="grid gap-6 md:grid-cols-2">{[['Vulnerable code — display only', vulnCode], ['Secure code — display only', fixCode]].map(([title, code]) => <div key={title} className={panel}><h3 className="font-bold text-cyan-300">{title}</h3><pre className="whitespace-pre-wrap break-all text-sm">{code}</pre></div>)}</div>
                </>}
              </>}
              {step === 4 && <div className={panel}><h3 className="text-lg font-bold text-white">Remediation checklist</h3><ol className="grid gap-3 md:grid-cols-2">{remedies.map((remedy, i) => <li key={remedy} className="flex gap-3 rounded-xl border border-slate-800 bg-black/40 p-4"><CheckCircle2 className="shrink-0 text-cyan-400" size={18} /><span>{i + 1}. {remedy}</span></li>)}</ol><p>Current learning score: {score}/100. Skipped interactions receive no points; use Back to revisit them.</p></div>}
            </>}
          </Motion.section>
        </AnimatePresence>
        {!complete && <footer className="flex flex-wrap justify-between gap-3 pb-8"><button className={button} disabled={step === 0} onClick={() => changeStep(step - 1)}><ArrowLeft size={16} /> Back</button><button className={button} onClick={reset}><RotateCcw size={16} /> Reset lab</button><button className={`${button} text-cyan-300`} onClick={() => { if (step < 4) changeStep(step + 1); else { setComplete(true); heading.current?.focus(); } }}>{step === 4 ? 'Complete review' : 'Next'}<ArrowRight size={16} /></button></footer>}
      </div>
    </main>
  );
}
