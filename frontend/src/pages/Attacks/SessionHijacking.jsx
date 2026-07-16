import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  ChevronLeft, Lock, Unlock, ShieldCheck, Terminal, UserPlus,
  Zap, ShieldIcon, Plus, Database, ArrowRight, Users,
  LayoutDashboard, Activity, ShieldAlert, CheckCircle2, XCircle,
  RotateCcw, Fingerprint, Server, Trash2, Key, Eye, EyeOff
} from 'lucide-react';

const SessionHijacking = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [activeSessions, setActiveSessions] = useState([]);
  const [terminalLines, setTerminalLines] = useState([]);
  const [isSecured, setIsSecured] = useState(false);
  const [interceptedTokens, setInterceptedTokens] = useState([]);
  const [isAttacking, setIsAttacking] = useState(false);
  const terminalEndRef = useRef(null);

  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [terminalLines]);

  const attackVectors = [
    {
      id: 'sniffing',
      title: "Packet Sniffing (Sidejacking)",
      payload: "tcpdump -i eth0 -A | grep 'Cookie:'",
      intel: "Intercepting unencrypted session cookies over public Wi-Fi or compromised networks to impersonate the user.",
      vulnCode: `// Insecure Cookie Configuration
res.cookie('session_id', 'xyz123', {
  httpOnly: false,
  secure: false
});`,
      fixCode: `// Hardened Cookie Configuration
res.cookie('session_id', 'xyz123', {
  httpOnly: true, // Prevents XSS access
  secure: true,   // Only sent over HTTPS
  sameSite: 'Strict'
});`,
      remedy: ["Use Secure & HttpOnly Flags", "Enforce HSTS (HTTPS Only)", "Implement Session Timeout"]
    }
  ];

  const quickSeed = () => {
    setActiveSessions([
      { user: 'admin_root', token: 'sess_9921_axz', ip: '192.168.1.45', id: 1 },
      { user: 'aniket_barai', token: 'sess_4432_klo', ip: '172.16.0.12', id: 2 }
    ]);
  };

  const resetLab = () => {
    setActiveSessions([]);
    setTerminalLines([]);
    setInterceptedTokens([]);
    setIsSecured(false);
    setStep(0);
  };

  const executeAttack = async (vector) => {
    if (activeSessions.length === 0 || isAttacking) return;
    setIsAttacking(true);
    setInterceptedTokens([]);
    setTerminalLines([
      `[NET] Interface eth0 set to PROMISCUOUS mode`,
      `[LOAD] Filter applied: ${vector.payload}`,
      `[SCAN] Monitoring local traffic for session identifiers...`
    ]);

    await new Promise(r => setTimeout(r, 1500));

    if (isSecured) {
      setTerminalLines(prev => [
        ...prev,
        `[INFO] TLS Encryption detected on all streams.`,
        `[FAIL] Payload encrypted. No plaintext cookies found.`,
        `[BLOCK] Session Hijacking failed due to Secure/HttpOnly flags.`
      ]);
    } else {
      const target = activeSessions[0];
      setTerminalLines(prev => [
        ...prev,
        `[WARN] Unencrypted HTTP traffic detected from ${target.ip}`,
        `[HIT] Cookie found: session_id=${target.token}`,
        `[SUCCESS] Session Token Intercepted for user: ${target.user}`
      ]);
      setInterceptedTokens([{ user: target.user, token: target.token, status: 'EXPLOITED' }]);
    }
    setIsAttacking(false);
  };

  return (
    <div className="min-h-screen bg-[#020617] text-slate-300 font-sans p-4 sm:p-8 selection:bg-cyan-500/30">
      <div className="max-w-6xl mx-auto">

        {/* HEADER */}
        <header className="flex flex-col sm:flex-row justify-between items-center mb-10 gap-6">
          <div className="flex items-center gap-4 w-full sm:w-auto">
            <button onClick={() => navigate('/dashboard')} className="bg-cyan-500 p-2.5 rounded-xl hover:bg-cyan-400 transition-colors shrink-0">
              <ChevronLeft className="text-black" size={20} />
            </button>
            <div>
              <h1 className="text-xl md:text-2xl font-black text-white uppercase italic tracking-tighter">HackAware <span className="text-cyan-500 text-xs md:text-sm">PRO</span></h1>
              <p className="text-[9px] font-mono text-slate-500 uppercase tracking-[0.2em]">Session Hijacking Lab / Node_Mumbai</p>
            </div>
          </div>

          <div className="flex bg-slate-900/80 p-1 rounded-xl border border-slate-800 shadow-lg w-full sm:w-auto">
            <button onClick={() => navigate('/dashboard')} className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-[10px] font-black text-slate-600 hover:text-white uppercase transition-all">
              <LayoutDashboard size={14}/> <span>Dashboard</span>
            </button>
            <div className="w-[1px] h-4 bg-slate-800 my-auto mx-1" />
            <button className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-[10px] font-black bg-cyan-500 text-black uppercase shadow-[0_0_15px_rgba(6,182,212,0.3)]">
              <Key size={14}/> Session_Lab
            </button>
          </div>
        </header>

        {/* STEP NAVIGATION */}
        <div className="mb-8 flex justify-center">
          <div className="flex bg-slate-900/40 p-1 rounded-xl border border-slate-800 backdrop-blur-md">
            {["1. Traffic", "2. Intercept", "3. Defense"].map((label, i) => {
              const isLocked = i > 0 && activeSessions.length === 0;
              return (
                <button
                  key={i}
                  onClick={() => !isLocked && setStep(i)}
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
          {step === 0 && (
            <motion.div key="s1" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-1 lg:grid-cols-2 gap-8" exit={{ opacity: 0, y: -10 }}>
              <div className="space-y-6">
                <div className="bg-slate-900/40 border border-slate-800 p-6 rounded-3xl backdrop-blur-sm">
                  <h3 className="text-white text-xs font-black uppercase mb-6 flex items-center gap-2"><Users size={16} className="text-cyan-500"/> Network Traffic Simulator</h3>
                  <div className="space-y-4">
                    <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Generate Active User Sessions</p>
                    <button onClick={quickSeed} className="w-full py-4 bg-slate-800 text-slate-400 font-black text-[10px] uppercase rounded-xl border border-slate-700 hover:border-cyan-500/50 transition-all">Seed Network Traffic</button>
                    {activeSessions.length > 0 && (
                      <button onClick={() => setStep(1)} className="w-full py-4 bg-cyan-500 text-black font-black uppercase text-[10px] rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20"> 
                        Proceed to Intercept <ArrowRight size={14}/>
                      </button>
                    )}
                    <button onClick={resetLab} className="w-full py-4 bg-red-500/5 text-red-500/50 font-black text-[10px] uppercase rounded-xl border border-red-500/20 hover:bg-red-500 hover:text-white transition-all">Clear Lab State</button>
                  </div>
                </div>
              </div>
              <div className="bg-black/40 border border-slate-800 p-8 rounded-3xl flex flex-col h-full min-h-[400px]">
                 <h3 className="text-slate-600 text-[10px] font-black uppercase mb-6 flex items-center gap-2 tracking-widest"><Activity size={14}/> Active Connections</h3>
                 <div className="space-y-3 flex-1 overflow-y-auto">
                    {activeSessions.map(s => (
                      <div key={s.id} className="bg-slate-900/40 p-4 rounded-xl flex justify-between items-center border border-slate-800/50">
                        <div className="flex flex-col">
                          <span className="text-xs font-mono text-slate-300">{s.user}</span>
                          <span className="text-[9px] text-slate-600 uppercase font-black tracking-tighter">IP: {s.ip}</span>
                        </div>
                        <div className="flex items-center gap-2">
                           <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                           <span className="text-[10px] font-mono text-emerald-500/50 italic uppercase">Authenticated</span>
                        </div>
                      </div>
                    ))}
                    {activeSessions.length === 0 && <div className="text-center py-20 text-[10px] text-slate-700 italic uppercase">Awaiting Network Traffic...</div>}
                 </div>
              </div>
            </motion.div>
          )}

          {step === 1 && (
            <motion.div key="s2" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              <div className="lg:col-span-5 space-y-4">
                <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2"><Zap size={14}/> Interception Tool</h3>
                {attackVectors.map(v => (
                  <button key={v.id} onClick={() => executeAttack(v)} disabled={isAttacking} className="w-full p-8 bg-slate-900/30 border border-slate-800 rounded-[2rem] text-left hover:border-red-500/50 transition-all group disabled:opacity-50">
                    <div className="flex justify-between items-center mb-4 text-white uppercase italic text-xs font-black">
                      <span>{v.title}</span> <Activity size={14} className={isAttacking ? "text-red-500 animate-pulse" : "text-slate-600"} />
                    </div>
                    <code className="block bg-black p-3 text-[10px] text-red-400 font-mono mb-4 rounded-xl border border-red-900/20 truncate">{v.payload}</code>
                    <p className="text-[10px] text-slate-500 leading-relaxed">{v.intel}</p>
                  </button>
                ))}

                {interceptedTokens.length > 0 && (
                  <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="p-6 bg-red-500/10 border border-red-500/30 rounded-3xl">
                    <div className="flex items-center gap-2 mb-4 text-red-400 text-xs font-black uppercase">
                      <ShieldAlert size={16}/> Token Intercepted
                    </div>
                    {interceptedTokens.map((t, idx) => (
                      <div key={idx} className="flex justify-between items-center text-[10px] font-mono py-1">
                        <span className="text-slate-400">{t.user}</span>
                        <span className="text-red-400">{t.token}</span>
                        <span className="text-slate-600 uppercase">{t.status}</span>
                      </div>
                    ))}
                  </motion.div>
                )}

                <button onClick={() => setStep(2)} className="w-full py-4 bg-slate-800 text-slate-300 font-black uppercase text-[10px] rounded-xl flex items-center justify-center gap-2 border border-slate-700">
                  View Defense Playbook <ArrowRight size={14}/>
                </button>
              </div>

              <div className="lg:col-span-7 bg-black/60 border border-slate-800 rounded-3xl p-6 flex flex-col h-[480px]">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                    <Terminal size={14}/> Network Console
                  </h3>
                  <div className="flex items-center gap-4">
                    <button 
                      onClick={() => setIsSecured(!isSecured)}
                      className={`flex items-center gap-2 px-3 py-1 rounded-full text-[9px] font-black uppercase transition-all ${isSecured ? 'bg-emerald-500 text-black' : 'bg-slate-800 text-slate-500'}`}
                    >
                      {isSecured ? <ShieldCheck size={12}/> : <ShieldIcon size={12}/>}
                      {isSecured ? 'Hardened' : 'Vulnerable'}
                    </button>
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto font-mono text-[11px] space-y-1 pr-2">
                  {terminalLines.length === 0 && (
                    <div className="text-slate-700 italic">Initiate packet capture to see live traffic...</div>
                  )}
                  {terminalLines.map((line, i) => (
                    <div
                      key={i}
                      className={
                        line.includes('SUCCESS') || line.includes('HIT') ? 'text-red-400 font-bold' :
                        line.includes('BLOCK') || line.includes('FAIL') ? 'text-emerald-400 font-bold' :
                        line.includes('WARN') ? 'text-amber-400' :
                        'text-slate-500'
                      }
                    >
                      {line}
                    </div>
                  ))}
                  <div ref={terminalEndRef} />
                </div>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div key="s3" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-slate-900/40 border border-slate-800 p-6 rounded-3xl">
                <h3 className="text-red-400 text-[10px] font-black uppercase mb-4 flex items-center gap-2"><XCircle size={14}/> Vulnerable Code</h3>
                <pre className="bg-black p-4 rounded-xl text-[10px] text-red-300 font-mono overflow-x-auto whitespace-pre-wrap">
                  {attackVectors[0].vulnCode}
                </pre>
              </div>
              <div className="bg-slate-900/40 border border-slate-800 p-6 rounded-3xl">
                <h3 className="text-emerald-400 text-[10px] font-black uppercase mb-4 flex items-center gap-2"><CheckCircle2 size={14}/> Hardened Code</h3>
                <pre className="bg-black p-4 rounded-xl text-[10px] text-emerald-300 font-mono overflow-x-auto whitespace-pre-wrap">
                  {attackVectors[0].fixCode}
                </pre>
              </div>

              <div className="lg:col-span-2 bg-slate-900/40 border border-slate-800 p-6 rounded-3xl">
                <h3 className="text-white text-[10px] font-black uppercase mb-4 flex items-center gap-2"><ShieldCheck size={14} className="text-cyan-500"/> Remediation Checklist</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {attackVectors[0].remedy.map((r, i) => (
                    <div key={i} className="bg-black/40 p-4 rounded-xl border border-slate-800 flex items-center gap-3">
                      <div className="w-6 h-6 rounded-full bg-cyan-500/10 flex items-center justify-center text-cyan-500 text-[10px] font-bold">{i+1}</div>
                      <span className="text-[10px] text-slate-300 font-bold uppercase tracking-tight">{r}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="lg:col-span-2 flex justify-center pt-4">
                <button onClick={resetLab} className="flex items-center gap-2 px-8 py-4 bg-slate-800 hover:bg-slate-700 text-white rounded-2xl text-[10px] font-black uppercase transition-all">
                  <RotateCcw size={14}/> Reset Simulation Lab
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default SessionHijacking;