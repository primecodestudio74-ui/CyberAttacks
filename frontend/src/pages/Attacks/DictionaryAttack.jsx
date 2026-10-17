import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  ChevronLeft, Lock, ShieldCheck, ShieldAlert, Terminal, ArrowRight,
  LayoutDashboard, Activity, CheckCircle2, XCircle, RotateCcw, Trash2,
  Users, Zap, KeyRound, Smartphone, Ban, BookOpen
} from 'lucide-react';

/* ------------------------------------------------------------------ */
/*  SIMULATION DATA (all mock - nothing here touches a real login)     */
/* ------------------------------------------------------------------ */

const WORDLIST = [
  '123456', 'password', 'qwerty', 'admin123', 'welcome1',
  'letmein', 'iloveyou', 'football', 'Sunshine99',
];

const BREACHED_PASSWORDS = new Set([
  '123456', 'password', 'qwerty', 'admin123',
  'welcome1', 'letmein', 'iloveyou', 'football',
]);

const defenseList = [
  { id: 'rateLimit', title: 'Rate Limiting', icon: Ban, desc: 'Block the IP after a few failed attempts' },
  { id: 'breachCheck', title: 'Breached-Password Check', icon: ShieldAlert, desc: 'Reject passwords found in public leak lists' },
  { id: 'mfa', title: 'MFA (OTP)', icon: Smartphone, desc: 'A correct password still needs a one-time code' },
];

const VULNERABLE_CODE = `app.post("/login", (req, res) => {
  const user = db.find(u => u.username === req.body.user);
  // Plain compare, no limit on attempts, no breach check
  if (user && user.password === req.body.password) {
    return res.status(200).send("Login OK");
  }
  res.status(401).send("Invalid credentials");
});`;

const SECURE_CODE = `app.post("/login", rateLimiter, async (req, res) => {
  if (await isBreached(req.body.password))
    return res.status(400).send("Choose a stronger password");

  const user = db.find(u => u.username === req.body.user);
  const ok = user && await bcrypt.compare(req.body.password, user.hash);
  if (!ok) return res.status(401).send("Invalid credentials");

  if (user.mfaEnabled) return res.status(200).send("MFA code required");
  res.status(200).send("Login OK");
});`;

const noDefenses = { rateLimit: false, breachCheck: false, mfa: false };

/* ------------------------------------------------------------------ */

const DictionaryAttack = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [victim, setVictim] = useState({ user: '', pass: '' });
  const [deployed, setDeployed] = useState(null);
  const [defenses, setDefenses] = useState(noDefenses);
  const [terminalLines, setTerminalLines] = useState([]);
  const [attempts, setAttempts] = useState(0);
  const [isAttacking, setIsAttacking] = useState(false);
  const [report, setReport] = useState(null);

  const terminalEndRef = useRef(null);
  const defensesRef = useRef(defenses);
  const cancelRef = useRef(false);

  useEffect(() => { defensesRef.current = defenses; }, [defenses]);
  useEffect(() => { terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [terminalLines]);
  useEffect(() => () => { cancelRef.current = true; }, []);

  const activeDefenseCount = Object.values(defenses).filter(Boolean).length;
  const canDeploy = victim.user.trim().length > 0 && victim.pass.trim().length > 0;

  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  const quickSeed = () => {
    setVictim({ user: 'aniket_barai', pass: 'Sunshine99' });
    setDeployed({ user: 'aniket_barai', pass: 'Sunshine99' });
    setStep(1);
  };

  const handleDeploy = () => {
    if (!canDeploy) return;
    setDeployed({ user: victim.user.trim(), pass: victim.pass.trim() });
    setStep(1);
  };

  const resetLab = () => {
    cancelRef.current = true;
    setDeployed(null);
    setVictim({ user: '', pass: '' });
    setDefenses(noDefenses);
    setTerminalLines([]);
    setAttempts(0);
    setReport(null);
    setIsAttacking(false);
    setStep(0);
  };

  const toggleDefense = (id) => setDefenses((d) => ({ ...d, [id]: !d[id] }));
  const enableAll = () => setDefenses({ rateLimit: true, breachCheck: true, mfa: true });

  const runAttack = async () => {
    if (!deployed || isAttacking) return;
    cancelRef.current = false;
    setIsAttacking(true);
    setAttempts(0);
    setReport(null);

    const active = defenseList.filter((d) => defensesRef.current[d.id]).map((d) => d.title);
    setTerminalLines([
      `[LOAD] Wordlist: common_passwords.txt (${WORDLIST.length} entries)`,
      `[TARGET] username=${deployed.user}`,
      `[DEF] Active defenses: ${active.length ? active.join(', ') : 'NONE'}`,
    ]);

    const finish = (r) => {
      setReport(r);
      setIsAttacking(false);
    };

    for (let i = 0; i < WORDLIST.length; i++) {
      if (cancelRef.current) return;
      const guess = WORDLIST[i];
      await sleep(450);
      if (cancelRef.current) return;
      setAttempts((a) => a + 1);

      const d = defensesRef.current;

      if (d.rateLimit && i >= 3) {
        setTerminalLines((prev) => [
          ...prev,
          `[BLOCK] 429 Too Many Requests - IP banned for 15 min after ${i} attempts`,
        ]);
        finish({ ok: false, reason: 'Rate limiter blocked the attack before it finished the wordlist' });
        return;
      }

      if (d.breachCheck && BREACHED_PASSWORDS.has(guess)) {
        setTerminalLines((prev) => [
          ...prev,
          `[TRY] pass:${guess.padEnd(12)} -> 400 (on breach list, rejected)`,
        ]);
        continue;
      }

      const isMatch = guess === deployed.pass;
      setTerminalLines((prev) => [
        ...prev,
        `[TRY] pass:${guess.padEnd(12)} -> ${isMatch ? '200_OK' : '401_UNAUTH'}`,
      ]);

      if (isMatch) {
        if (d.mfa) {
          setTerminalLines((prev) => [
            ...prev,
            `[MFA] Password correct, but a 6-digit code was sent to the real user's phone.`,
            `[FAIL] Attacker has no access to the phone - login halted.`,
          ]);
          finish({ ok: false, reason: 'Password cracked, but MFA stopped the login' });
        } else {
          setTerminalLines((prev) => [
            ...prev,
            `[SUCCESS] Credentials cracked: ${deployed.user}:${guess}`,
          ]);
          finish({ ok: true, reason: `Password cracked: "${guess}"` });
        }
        return;
      }
    }

    setTerminalLines((prev) => [...prev, `[DONE] Wordlist exhausted. No match found.`]);
    finish({ ok: false, reason: 'Wordlist exhausted without a match - the password was not in the list' });
  };

  const rerunWithDefenses = () => {
    setStep(1);
    runAttack();
  };

  const lineColor = (line) => {
    if (line.startsWith('[SUCCESS]') || line.includes('200_OK')) return 'text-red-400';
    if (line.startsWith('[BLOCK]') || line.startsWith('[FAIL]') || line.startsWith('[MFA]')) return 'text-emerald-400';
    if (line.startsWith('[DEF]')) return 'text-cyan-400';
    return 'text-slate-500';
  };

  return (
    <div className="min-h-screen bg-[#020617] text-slate-300 font-sans p-4 sm:p-8 selection:bg-cyan-500/30">
      <div className="max-w-6xl mx-auto">

        {/* HEADER */}
        <header className="flex flex-col sm:flex-row justify-between items-center mb-10 gap-6">
          <div className="flex items-center gap-4 w-full sm:w-auto">
            <button type="button" onClick={() => navigate('/dashboard')} className="bg-cyan-500 p-2.5 rounded-xl hover:bg-cyan-400 transition-colors shrink-0">
              <ChevronLeft className="text-black" size={20} />
            </button>
            <div>
              <h1 className="text-xl md:text-2xl font-black text-white uppercase italic tracking-tighter">HackAware <span className="text-cyan-500 text-xs md:text-sm">PRO</span></h1>
              <p className="text-[9px] font-mono text-slate-500 uppercase tracking-[0.2em]">Dictionary Attack Lab / Node_Mumbai</p>
            </div>
          </div>

          <div className="flex bg-slate-900/80 p-1 rounded-xl border border-slate-800 shadow-lg w-full sm:w-auto">
            <button type="button" onClick={() => navigate('/dashboard')} className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-[10px] font-black text-slate-600 hover:text-white uppercase transition-all">
              <LayoutDashboard size={14} /> <span>Dashboard</span>
            </button>
            <div className="w-[1px] h-4 bg-slate-800 my-auto mx-1" />
            <button type="button" className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-[10px] font-black bg-cyan-500 text-black uppercase shadow-[0_0_15px_rgba(6,182,212,0.3)]">
              <KeyRound size={14} /> Dictionary_Lab
            </button>
          </div>
        </header>

        <p className="text-center text-[9px] font-mono text-slate-600 uppercase tracking-widest mb-6">
          Educational simulation only - no real login is ever attacked
        </p>

        {/* STEP NAVIGATION */}
        <div className="mb-8 flex justify-center">
          <div className="flex bg-slate-900/40 p-1 rounded-xl border border-slate-800 backdrop-blur-md">
            {['1. Setup', '2. Attack', '3. Defense'].map((label, i) => {
              const isLocked = i > 0 && !deployed;
              return (
                <button type="button"
                  key={i}
                  onClick={() => !isLocked && !isAttacking && setStep(i)}
                  disabled={isLocked}
                  className={`px-6 py-2 rounded-lg text-[10px] font-black uppercase transition-all
                    ${step === i ? 'text-cyan-400 bg-cyan-500/10' : 'text-slate-600'}
                    ${isLocked ? 'opacity-30 cursor-not-allowed' : 'hover:text-slate-300'}`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        <AnimatePresence mode="wait">

          {/* ------------------------- STEP 1: SETUP ------------------------- */}
          {step === 0 && (
            <motion.div key="s1" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div className="bg-slate-900/40 border border-slate-800 p-6 rounded-3xl backdrop-blur-sm">
                  <h3 className="text-white text-xs font-black uppercase mb-6 flex items-center gap-2"><Users size={16} className="text-cyan-500" /> Target Account</h3>
                  <div className="space-y-4">
                    <input
                      value={victim.user}
                      onChange={(e) => setVictim({ ...victim, user: e.target.value })}
                      placeholder="Target Username"
                      className="w-full bg-black/50 border border-slate-800 p-4 rounded-xl text-xs outline-none focus:border-cyan-500 transition-all"
                    />
                    <input
                      value={victim.pass}
                      onChange={(e) => setVictim({ ...victim, pass: e.target.value })}
                      placeholder="Target Password"
                      className="w-full bg-black/50 border border-slate-800 p-4 rounded-xl text-xs outline-none focus:border-cyan-500 transition-all"
                    />

                    <button type="button"
                      onClick={handleDeploy}
                      disabled={!canDeploy}
                      className={`w-full py-4 font-black text-[10px] uppercase rounded-xl flex items-center justify-center gap-2 transition-all
                        ${canDeploy
                          ? 'bg-cyan-600/10 border border-cyan-500/30 text-cyan-500 hover:bg-cyan-500 hover:text-black cursor-pointer'
                          : 'bg-slate-900/40 border border-slate-800 text-slate-700 cursor-not-allowed'}`}
                    >
                      <Zap size={14} /> Create Target Account
                    </button>
                    {!canDeploy && (
                      <p className="text-[9px] text-slate-600 text-center -mt-2">Enter both a username and password to continue, or use Quick Seed.</p>
                    )}
                    <button type="button" onClick={quickSeed} className="w-full py-4 bg-slate-800 text-slate-400 font-black text-[10px] uppercase rounded-xl border border-slate-700">Quick Seed</button>
                  </div>
                </div>
              </div>

              <div className="bg-black/40 border border-slate-800 p-8 rounded-3xl flex flex-col h-full min-h-[400px]">
                <h3 className="text-slate-600 text-[10px] font-black uppercase mb-6 flex items-center gap-2 tracking-widest"><BookOpen size={14} /> Wordlist Preview</h3>
                <div className="flex-1 flex flex-col justify-center gap-4">
                  <div className="bg-slate-900/40 p-4 rounded-xl border border-slate-800/50">
                    <p className="text-[9px] font-black uppercase text-slate-600 mb-3">common_passwords.txt ({WORDLIST.length} entries)</p>
                    <div className="flex flex-wrap gap-2">
                      {WORDLIST.map((w) => (
                        <span key={w} className="px-2 py-1 bg-black/60 border border-slate-800 rounded-md text-[10px] font-mono text-slate-400">{w}</span>
                      ))}
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-600">
                    Tip: a password from this list gets cracked. A long, unique password survives. Try both and compare.
                  </p>
                  {deployed && (
                    <div className="bg-slate-900/40 p-4 rounded-xl border border-slate-800/50">
                      <div className="flex justify-between text-[9px] font-black uppercase text-slate-600">
                        <span>Account ready</span><span className="text-cyan-400">{deployed.user}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* ------------------------- STEP 2: ATTACK ------------------------- */}
          {step === 1 && (
            <motion.div key="s2" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              <div className="lg:col-span-4 space-y-4">
                <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2"><Activity size={14} /> Select Vector</h3>
                <div className="p-5 bg-slate-900/30 border border-slate-800 rounded-[2rem]">
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="text-sm font-black text-white uppercase italic">Dictionary Attack</h4>
                    <Activity size={16} className="text-slate-600" />
                  </div>
                  <div className="bg-black p-3 rounded-xl mb-3 text-[10px] font-mono text-red-400">common_passwords.txt</div>
                  <p className="text-[11px] text-slate-500 mb-4">
                    Tries a list of common and leaked passwords against <span className="text-white font-mono">{deployed?.user}</span> until a 200 OK comes back.
                  </p>
                  <button type="button"
                    onClick={runAttack}
                    disabled={isAttacking}
                    className="w-full bg-red-500 hover:bg-red-400 disabled:opacity-50 text-white font-black text-[10px] uppercase tracking-widest py-3 rounded-xl transition-colors"
                  >
                    {isAttacking ? 'Attacking...' : 'Run Dictionary Attack'}
                  </button>
                  <p className="text-[10px] text-slate-600 mt-3">
                    Attempts made: <span className="text-white font-mono">{attempts}</span>
                    {' '}| Defenses on: <span className="text-white font-mono">{activeDefenseCount}</span>
                  </p>
                </div>

                <button type="button"
                  onClick={() => !isAttacking && setStep(2)}
                  className="w-full py-5 bg-slate-800 text-white font-black text-[10px] uppercase rounded-2xl border border-slate-700 hover:bg-slate-700 transition-all flex items-center justify-center gap-2"
                >
                  View Defense Playbook <ArrowRight size={14} />
                </button>
              </div>

              <div className="lg:col-span-8 space-y-4">
                <div className="bg-black border border-slate-800 p-6 rounded-3xl min-h-[420px]">
                  <h3 className="text-[10px] font-black text-white uppercase tracking-widest flex items-center gap-2 mb-4"><Terminal size={14} className="text-cyan-500" /> Live Console</h3>
                  <div className="font-mono text-[11px] space-y-1 max-h-[340px] overflow-y-auto">
                    {terminalLines.length === 0 && (
                      <p className="text-slate-600 italic">Run the attack to begin simulation...</p>
                    )}
                    {terminalLines.map((line, i) => (
                      <p key={i} className={lineColor(line)}>{line}</p>
                    ))}
                    <div ref={terminalEndRef} />
                  </div>
                </div>

                {report && (
                  <div className={`p-4 rounded-2xl border text-xs font-bold flex items-center gap-2
                    ${report.ok ? 'border-red-500/40 bg-red-500/10 text-red-300' : 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300'}`}>
                    {report.ok ? <XCircle size={16} /> : <CheckCircle2 size={16} />}
                    {report.ok ? 'Attack succeeded: ' : 'Attack failed: '}{report.reason}
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* ------------------------- STEP 3: DEFENSE ------------------------- */}
          {step === 2 && (
            <motion.div key="s3" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-slate-900/40 border border-slate-800 p-6 rounded-3xl">
                  <h3 className="text-red-400 text-xs font-black uppercase mb-4 flex items-center gap-2"><XCircle size={16} /> Vulnerable Code</h3>
                  <pre className="bg-black p-4 rounded-xl text-[11px] font-mono text-slate-400 overflow-x-auto">{VULNERABLE_CODE}</pre>
                </div>
                <div className="bg-slate-900/40 border border-slate-800 p-6 rounded-3xl">
                  <h3 className="text-emerald-400 text-xs font-black uppercase mb-4 flex items-center gap-2"><CheckCircle2 size={16} /> Hardened Code</h3>
                  <pre className="bg-black p-4 rounded-xl text-[11px] font-mono text-slate-400 overflow-x-auto">{SECURE_CODE}</pre>
                </div>
              </div>

              <div className="bg-slate-900/40 border border-slate-800 p-6 rounded-3xl">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-white text-xs font-black uppercase flex items-center gap-2">
                    {activeDefenseCount > 0
                      ? <ShieldCheck size={16} className="text-emerald-400" />
                      : <ShieldAlert size={16} className="text-red-400" />}
                    Remediation Checklist
                  </h3>
                  <button type="button" onClick={enableAll} className="text-[10px] font-black uppercase tracking-widest text-cyan-400 hover:text-cyan-300">Enable all</button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  {defenseList.map((d) => {
                    const Icon = d.icon;
                    const on = defenses[d.id];
                    return (
                      <button type="button"
                        key={d.id}
                        onClick={() => toggleDefense(d.id)}
                        className={`text-left p-4 rounded-xl border transition-all
                          ${on ? 'border-emerald-500/50 bg-emerald-500/10' : 'border-slate-800 bg-black/30 hover:border-slate-600'}`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="flex items-center gap-2 text-xs font-bold text-white"><Icon size={14} className={on ? 'text-emerald-400' : 'text-slate-500'} /> {d.title}</span>
                          <span className={`text-[10px] font-mono ${on ? 'text-emerald-400' : 'text-red-400'}`}>{on ? 'ON' : 'OFF'}</span>
                        </div>
                        <p className="text-[11px] text-slate-500">{d.desc}</p>
                      </button>
                    );
                  })}
                </div>

                <button type="button"
                  onClick={rerunWithDefenses}
                  className="w-full py-4 bg-slate-800 text-white font-black text-[10px] uppercase rounded-xl border border-slate-700 hover:bg-slate-700 transition-all flex items-center justify-center gap-2"
                >
                  Re-run attack with defenses <RotateCcw size={14} />
                </button>
              </div>

              <div className="bg-slate-900/40 border border-slate-800 p-6 rounded-3xl">
                <h3 className="text-white text-xs font-black uppercase mb-3 flex items-center gap-2"><Lock size={16} className="text-cyan-500" /> How to prevent dictionary attacks</h3>
                <ul className="text-sm text-slate-400 space-y-1 list-disc pl-5">
                  <li>Rate-limit and lock out accounts after repeated failed attempts.</li>
                  <li>Check new passwords against known breached-password lists.</li>
                  <li>Require multi-factor authentication (MFA/OTP) for login.</li>
                  <li>Hash passwords with a slow algorithm like bcrypt or Argon2.</li>
                  <li>Enforce a minimum password length and complexity policy.</li>
                </ul>
              </div>
            </motion.div>
          )}

        </AnimatePresence>

        {/* RESET */}
        <div className="mt-12 flex justify-center">
          <button type="button" onClick={resetLab} className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-600 hover:text-cyan-400 transition-colors">
            <Trash2 size={14} /> Reset Lab Environment
          </button>
        </div>

      </div>
    </div>
  );
};

export default DictionaryAttack;
