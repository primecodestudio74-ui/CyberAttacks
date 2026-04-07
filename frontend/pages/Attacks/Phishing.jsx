import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  ChevronLeft, Terminal, ShieldAlert, 
  ShieldIcon, ShieldCheck, ArrowRight, 
  LayoutDashboard, Globe, Unlock, Lock,
  Activity, Zap, CheckCircle2, XCircle, Database, Play, Eye, EyeOff, Server
} from 'lucide-react';

const Phishing = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(0); 
  const [targetUrl, setTargetUrl] = useState('');
  const [isSecured, setIsSecured] = useState(false);
  const [terminalLines, setTerminalLines] = useState([]);
  const [isAttacking, setIsAttacking] = useState(false);
  const [auditResult, setAuditResult] = useState(null);
  const terminalEndRef = useRef(null);

  const attackPresets = [
    { label: "Google Homoglyph", url: "https://www.go0gle.com" },
    { label: "PayPal Insecure", url: "http://paypa1-security.top" },
    { label: "Faceb0ok Login", url: "https://faceb0ok.xyz/login" },
  ];

  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [terminalLines]);

  const BrandRegistry = {
    "google": "google.com",
    "microsoft": "microsoft.com",
    "facebook": "facebook.com",
    "paypal": "paypal.com"
  };

  const performDeepAudit = (inputUrl) => {
    const alerts = [];
    try {
      const cleanUrl = inputUrl.toLowerCase().replace('https://', '').replace('http://', '');
      const hostname = cleanUrl.split('/')[0];
      const replacements = { '0': 'o', '1': 'l', 'vv': 'w', 'rn': 'm' };
      let normalized = hostname;
      Object.entries(replacements).forEach(([bad, good]) => {
        normalized = normalized.replaceAll(bad, good);
      });

      Object.keys(BrandRegistry).forEach(brand => {
        const officialDomain = BrandRegistry[brand];
        const isImpersonating = (hostname.includes(brand) || normalized.includes(brand)) && hostname !== officialDomain;
        if (isImpersonating) alerts.push(`CRITICAL: Impersonation of ${brand.toUpperCase()} detected.`);
      });

      if (!inputUrl.startsWith('https')) alerts.push("DANGER: Insecure HTTP Protocol.");
      if (hostname.endsWith('.xyz') || hostname.endsWith('.top')) alerts.push("SUSPICIOUS: High-risk TLD detected.");

      return { isSafe: alerts.length === 0, alerts };
    } catch (e) {
      return { isSafe: false, alerts: ["INVALID URL STRUCTURE"] };
    }
  };

  const executeDetection = async () => {
    if (!targetUrl || isAttacking) return;
    setIsAttacking(true);
    setTerminalLines([
      `[SOC] Analyzing Target Domain: ${targetUrl}`,
      `[LOAD] Loading Heuristic Intelligence Patterns...`,
      `[SCAN] Parsing string entropy and TLD reputation...`
    ]);

    await new Promise(r => setTimeout(r, 1500));
    const audit = performDeepAudit(targetUrl);

    if (isSecured && !audit.isSafe) {
      setTerminalLines(prev => [
        ...prev, 
        `[AUDIT] Findings for ${targetUrl}:`,
        ...audit.alerts.map(a => `[!] ${a}`),
        `\n[SAFE] PROTECTION ACTIVE: Link blocked by Audit Engine.`,
      ]);
      setAuditResult({ status: 'blocked', ...audit });
    } else {
      setTerminalLines(prev => [
        ...prev, 
        `[WARN] Protection Logic Disabled.`,
        `[HTTP] Connection to ${targetUrl} established.`,
        `[CRIT] PHISHING SUCCESSFUL: User session token exfiltrated.`
      ]);
      setAuditResult({ status: 'success', ...audit });
    }
    setIsAttacking(false);
  };

  return (
    <div className="min-h-screen bg-[#020617] text-slate-300 font-sans p-4 md:p-8 selection:bg-cyan-500/30">
      <div className="max-w-7xl mx-auto">
        
        {/* TOP NAVIGATION BAR (Matching SQL Module Style) */}
        <header className="flex flex-col md:flex-row justify-between items-center mb-10 gap-4 bg-slate-900/50 p-4 rounded-2xl border border-slate-800 backdrop-blur-xl">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate('/dashboard')} 
              className="group flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-cyan-500 rounded-xl transition-all duration-300"
            >
              <ChevronLeft className="text-cyan-400 group-hover:text-black transition-colors" size={18} />
              <span className="text-[10px] font-black text-slate-300 group-hover:text-black uppercase">Dashboard</span>
            </button>
            <div className="h-8 w-[1px] bg-slate-700 mx-2 hidden md:block" />
            <div>
              <h1 className="text-lg font-black text-white uppercase italic tracking-tighter flex items-center gap-2">
                <Zap size={16} className="text-cyan-500" />
                Vector Lab <span className="text-cyan-500/50 ml-1">/ Phishing</span>
              </h1>
            </div>
          </div>

          {/* PROCESS STEPPER */}
          <div className="flex items-center gap-2 bg-black/40 p-1.5 rounded-xl border border-slate-800">
            {["Configuration", "Simulation", "Hardening"].map((label, i) => (
              <div key={i} className="flex items-center">
                <button 
                  disabled={i > step && !auditResult}
                  onClick={() => setStep(i)}
                  className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${
                    step === i ? 'bg-cyan-500 text-black shadow-lg shadow-cyan-500/20' : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  {label}
                </button>
                {i < 2 && <ArrowRight size={12} className="mx-1 text-slate-700" />}
              </div>
            ))}
          </div>
        </header>

        <main>
          <AnimatePresence mode="wait">
            {/* STEP 0: CONFIGURATION */}
            {step === 0 && (
              <motion.div key="s0" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                <div className="lg:col-span-7 space-y-6">
                  <div className="bg-slate-900/40 border border-slate-800 p-8 rounded-[2.5rem] backdrop-blur-sm relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 opacity-5">
                      <Globe size={120} />
                    </div>
                    <h3 className="text-white text-xs font-black uppercase mb-8 flex items-center gap-3">
                      <Server size={18} className="text-cyan-500"/> Domain Targeting
                    </h3>
                    
                    <div className="space-y-8">
                      <div>
                        <p className="text-[10px] text-slate-500 uppercase font-bold mb-4 tracking-widest">Select Attack Template</p>
                        <div className="flex flex-wrap gap-3">
                          {attackPresets.map((preset, idx) => (
                            <button key={idx} onClick={() => setTargetUrl(preset.url)} className="px-4 py-2.5 bg-slate-800/50 hover:bg-cyan-500/10 border border-slate-700 hover:border-cyan-500/50 rounded-xl text-[10px] font-bold text-slate-300 hover:text-cyan-400 transition-all">
                              {preset.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="relative group">
                        <input 
                          value={targetUrl} 
                          onChange={e => setTargetUrl(e.target.value)} 
                          placeholder="Enter malicious URL (e.g., https://paypa1-secure.com)" 
                          className="w-full bg-black/60 border border-slate-800 p-5 rounded-2xl text-xs outline-none focus:border-cyan-500 transition-all text-white font-mono placeholder:text-slate-700" 
                        />
                        {targetUrl && <XCircle size={18} className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-600 hover:text-red-500 cursor-pointer transition-colors" onClick={() => setTargetUrl('')} />}
                      </div>

                      <button 
                        onClick={() => setStep(1)} 
                        disabled={targetUrl.length < 5} 
                        className="w-full py-5 bg-cyan-600 hover:bg-cyan-500 text-black font-black uppercase text-xs rounded-2xl flex items-center justify-center gap-3 shadow-xl shadow-cyan-500/10 disabled:opacity-20 disabled:grayscale transition-all active:scale-[0.98]"
                      >
                        Deploy Attack Vector <ArrowRight size={18}/>
                      </button>
                    </div>
                  </div>
                </div>

                <div className="lg:col-span-5 flex flex-col gap-6">
                  <div className="bg-cyan-500/5 border border-cyan-500/20 p-8 rounded-[2.5rem]">
                    <Database size={24} className="text-cyan-500 mb-4" />
                    <h3 className="text-white text-sm font-black uppercase mb-2 italic">Intelligence Brief</h3>
                    <p className="text-[11px] text-slate-400 leading-relaxed uppercase tracking-tight">
                      Phishing relies on "Visual Deception." Attackers use homoglyphs (looks-alike characters) or high-risk Top Level Domains (.xyz, .top) to trick human perception while technical protocols remain valid.
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* STEP 1: SIMULATION */}
            {step === 1 && (
              <motion.div key="s1" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                <div className="lg:col-span-4 space-y-6">
                  <div className="p-8 bg-slate-900/40 border border-slate-800 rounded-[2.5rem] backdrop-blur-md">
                    <div className="flex justify-between items-center mb-8">
                      <span className="text-white font-black uppercase text-[10px] italic tracking-widest flex items-center gap-2">
                        <Activity size={14} className={isAttacking ? "text-red-500 animate-pulse" : "text-cyan-500"} />
                        Execution Core
                      </span>
                    </div>
                    
                    <div className="bg-black/80 rounded-2xl border border-slate-800 p-4 mb-8 overflow-hidden">
                      <p className="text-[9px] text-slate-600 uppercase font-black mb-2 tracking-tighter">Target Buffer</p>
                      <code className="block text-[11px] text-cyan-400 font-mono truncate">{targetUrl}</code>
                    </div>

                    <button 
                      onClick={executeDetection} 
                      disabled={isAttacking} 
                      className="w-full py-5 bg-red-600 hover:bg-red-500 text-white text-[11px] font-black rounded-2xl uppercase shadow-lg shadow-red-900/20 flex items-center justify-center gap-3 transition-all active:scale-95"
                    >
                      <Play size={16} fill="currentColor"/> Launch Live Audit
                    </button>
                  </div>
                  
                  {auditResult && (
                    <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className={`p-8 rounded-[2.5rem] border ${auditResult.status === 'blocked' ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-red-500/10 border-red-500/30'}`}>
                      <h4 className={`text-xs font-black uppercase mb-2 flex items-center gap-3 ${auditResult.status === 'blocked' ? 'text-emerald-500' : 'text-red-500'}`}>
                        {auditResult.status === 'blocked' ? <ShieldCheck size={20}/> : <ShieldAlert size={20}/>} 
                        {auditResult.status === 'blocked' ? "Threat Neutralized" : "System Compromised"}
                      </h4>
                      <p className="text-[10px] text-slate-500 uppercase font-bold tracking-tighter">
                        {auditResult.status === 'blocked' ? "Security filters successfully identified the visual deception." : "Attack bypassed basic checks. User credentials exposed."}
                      </p>
                    </motion.div>
                  )}
                </div>

                <div className="lg:col-span-8 bg-black/60 border border-slate-800 rounded-[2.5rem] p-8 font-mono text-[11px] h-[550px] flex flex-col shadow-2xl relative overflow-hidden">
                   <div className="flex justify-between items-center border-b border-slate-800/50 pb-4 mb-6">
                      <span className="text-[10px] text-slate-500 font-black tracking-widest uppercase flex items-center gap-2">
                        <Terminal size={14} className="text-cyan-500"/> Forensic_Log
                      </span>
                      <div className="flex gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-full bg-slate-800" />
                        <div className="w-2.5 h-2.5 rounded-full bg-slate-800" />
                      </div>
                   </div>
                   <div className="flex-1 overflow-y-auto custom-scrollbar pr-4">
                      {terminalLines.map((l, i) => (
                        <motion.div 
                          initial={{ opacity: 0, x: -5 }} 
                          animate={{ opacity: 1, x: 0 }} 
                          key={i} 
                          className={`mb-2 leading-relaxed ${l.includes('SAFE') ? 'text-emerald-400 font-black' : l.includes('CRIT') || l.includes('!') ? 'text-red-400 font-bold' : 'text-slate-400'}`}
                        >
                          <span className="text-slate-700 mr-2">[{new Date().toLocaleTimeString().split(' ')[0]}]</span>
                          {l}
                        </motion.div>
                      ))}
                      <div ref={terminalEndRef} />
                   </div>
                   <button 
                    disabled={!auditResult} 
                    onClick={() => setStep(2)} 
                    className="mt-6 w-full py-4 bg-white hover:bg-cyan-400 text-black font-black uppercase text-[10px] rounded-xl tracking-tighter disabled:opacity-20 transition-all"
                   >
                     Analyze Prevention Code <ArrowRight className="inline ml-2" size={14}/>
                   </button>
                </div>
              </motion.div>
            )}

            {/* STEP 2: HARDENING */}
            {step === 2 && (
              <motion.div key="s2" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-8 pb-12">
                <div className="bg-slate-900/40 border border-slate-800 p-10 rounded-[3rem] shadow-2xl relative overflow-hidden">
                   <div className={`absolute top-0 right-0 w-96 h-96 blur-[150px] rounded-full transition-colors duration-1000 ${isSecured ? 'bg-emerald-500/10' : 'bg-red-500/10'}`} />
                   
                   <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-12 gap-8 relative z-10">
                      <div className="flex items-center gap-8">
                         <div className={`p-8 rounded-[2rem] shadow-2xl transition-all duration-700 ${isSecured ? 'bg-emerald-500 text-black rotate-[360deg]' : 'bg-red-600 text-white'}`}>
                            {isSecured ? <Lock size={32}/> : <Unlock size={32}/>}
                         </div>
                         <div>
                            <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter">Security Hardening</h3>
                            <p className={`text-[11px] font-mono mt-3 px-4 py-1.5 rounded-lg inline-block border ${isSecured ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30' : 'bg-red-500/10 text-red-500 border-red-500/30'}`}>
                               {isSecured ? "PROTOCOL: HEURISTIC_FILTERING_ENABLED" : "PROTOCOL: BYPASS_ALLOWED"}
                            </p>
                         </div>
                      </div>
                      
                      <button onClick={() => setIsSecured(!isSecured)} className={`group relative flex items-center gap-3 px-12 py-6 rounded-2xl font-black text-xs uppercase transition-all shadow-2xl overflow-hidden ${isSecured ? 'bg-slate-800 text-slate-500 border border-slate-700' : 'bg-emerald-600 text-white hover:bg-emerald-500 active:scale-95'}`}>
                          <span className="relative z-10">{isSecured ? "Rollback Security Patch" : "Apply Heuristic Patch"}</span>
                          {!isSecured && <Zap size={16} className="relative z-10 animate-pulse" />}
                      </button>
                   </div>

                   <div className="grid grid-cols-1 xl:grid-cols-2 gap-10 relative z-10">
                      <div className="space-y-8">
                         <div className="bg-black/60 rounded-[2rem] border border-red-900/30 overflow-hidden shadow-2xl">
                            <div className="bg-red-950/20 px-6 py-4 text-[10px] font-black text-red-400 flex items-center justify-between uppercase tracking-[0.2em]">
                              <div className="flex items-center gap-3"><EyeOff size={16}/> Vulnerable Navigation</div>
                            </div>
                            <pre className="p-8 text-[12px] text-slate-500 font-mono italic overflow-x-auto">
                              {`// Danger: Blindly trusting URL strings\nconst navigate = (url) => {\n  window.location.assign(url);\n}`}
                            </pre>
                         </div>
                         <div className={`bg-black/60 rounded-[2rem] border overflow-hidden transition-all duration-700 shadow-2xl ${isSecured ? 'border-emerald-500/50' : 'border-slate-800'}`}>
                            <div className={`px-6 py-4 text-[10px] font-black flex items-center justify-between uppercase tracking-[0.2em] ${isSecured ? 'bg-emerald-950/30 text-emerald-400' : 'bg-slate-900/50 text-slate-600'}`}>
                              <div className="flex items-center gap-3"><Eye size={16}/> Secure Audit Logic</div>
                            </div>
                            <pre className={`p-8 text-[12px] font-mono overflow-x-auto ${isSecured ? 'text-emerald-400' : 'text-slate-800'}`}>
                              {isSecured ? `const navigate = (url) => {\n  if (performAudit(url).isMalicious) {\n    alert("Block: Visual Deception!");\n    return;\n  }\n  safeNavigate(url);\n}` : "// [PROTECTION_LOGIC_LOCKED]"}
                            </pre>
                         </div>
                      </div>

                      <div className="bg-slate-800/20 p-10 rounded-[2.5rem] border border-slate-700/50 backdrop-blur-sm">
                         <h4 className="text-white text-xs font-black uppercase mb-8 flex items-center gap-4 border-b border-slate-700 pb-6 tracking-widest">
                            <ShieldIcon size={20} className="text-cyan-400"/> Active Defenses
                         </h4>
                         <div className="space-y-4">
                            {[
                              { label: "Homoglyph Filtering", desc: "Detects '0' used for 'o' or 'vv' for 'w'" },
                              { label: "TLD Reputation Check", desc: "Blocks high-risk .xyz and .top domains" },
                              { label: "SSL Enforcement", desc: "Ensures connection is exclusively HTTPS" }
                            ].map((item, i) => (
                              <div key={i} className={`flex items-start gap-4 p-5 rounded-2xl border transition-all duration-500 ${isSecured ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-black/20 border-slate-800/50'}`}>
                                 <CheckCircle2 size={18} className={isSecured ? "text-emerald-500" : "text-slate-800"} />
                                 <div>
                                   <p className={`text-[11px] font-black uppercase ${isSecured ? 'text-slate-200' : 'text-slate-600'}`}>{item.label}</p>
                                   <p className="text-[9px] text-slate-500 font-mono mt-1">{item.desc}</p>
                                 </div>
                              </div>
                            ))}
                         </div>
                      </div>
                   </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
};

export default Phishing;