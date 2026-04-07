import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
// fixed all missing icon imports
import { 
  Mail, ChevronLeft, Terminal, ShieldAlert, Send, 
  ShieldIcon, ShieldCheck, ArrowRight, MousePointer2, 
  AlertTriangle, LayoutDashboard, Globe, Lock, Unlock,
  Activity, Search, Zap, CheckCircle2, XCircle
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

  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [terminalLines]);

  // --- HEURISTIC DETECTION LOGIC ---
  const BrandRegistry = {
    "google": "google.com",
    "microsoft": "microsoft.com",
    "facebook": "facebook.com",
    "paypal": "paypal.com"
  };

  const performDeepAudit = (inputUrl) => {
    const alerts = [];
    let suggestedUrl = null;

    try {
      const cleanUrl = inputUrl.toLowerCase().replace('https://', '').replace('http://', '');
      const hostname = cleanUrl.split('/')[0];

      // 1. Homoglyph Detection (o -> 0, l -> 1, etc)
      const replacements = { '0': 'o', '1': 'l', 'vv': 'w', 'rn': 'm' };
      let normalized = hostname;
      Object.entries(replacements).forEach(([bad, good]) => {
        normalized = normalized.replaceAll(bad, good);
      });

      // 2. Brand Cross-Check
      Object.keys(BrandRegistry).forEach(brand => {
        const officialDomain = BrandRegistry[brand];
        const isImpersonating = (hostname.includes(brand) || normalized.includes(brand)) && hostname !== officialDomain;

        if (isImpersonating) {
          alerts.push(`CRITICAL: Impersonation of ${brand.toUpperCase()} detected.`);
          suggestedUrl = `https://www.${officialDomain}`;
        }
      });

      // 3. Structural Flags
      if (!inputUrl.startsWith('https')) alerts.push("DANGER: Insecure HTTP Protocol.");
      if (hostname.endsWith('.xyz') || hostname.endsWith('.top')) alerts.push("SUSPICIOUS: High-risk TLD detected.");

      return { isSafe: alerts.length === 0, alerts, suggestedUrl };
    } catch (e) {
      return { isSafe: false, alerts: ["INVALID URL STRUCTURE"], suggestedUrl: null };
    }
  };

  const executeDetection = async () => {
    if (!targetUrl || isAttacking) return;
    setIsAttacking(true);
    setAuditResult(null);
    
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
        audit.suggestedUrl ? `[INFO] Verified Destination: ${audit.suggestedUrl}` : `[INFO] No safe alternative found.`
      ]);
      setAuditResult({ safe: true, ...audit });
    } else {
      setTerminalLines(prev => [
        ...prev, 
        `[WARN] Protection Logic Disabled.`,
        `[HTTP] Connection to ${targetUrl} established.`,
        `[CRIT] PHISHING SUCCESSFUL: User session token exfiltrated.`
      ]);
      setAuditResult({ safe: false, ...audit });
    }
    setIsAttacking(false);
  };

  return (
    <div className="min-h-screen bg-[#020617] text-slate-300 font-sans p-4 sm:p-8 selection:bg-cyan-500/30">
      <div className="max-w-6xl mx-auto">
        
        {/* HEADER */}
        <header className="flex flex-col sm:flex-row justify-between items-center mb-10 gap-6">
          <div className="flex items-center gap-4 w-full sm:w-auto">
            <button onClick={() => navigate('/dashboard')} className="bg-cyan-500 p-2.5 rounded-xl hover:bg-cyan-400 transition-colors shrink-0 text-black">
              <ChevronLeft size={20} />
            </button>
            <div>
              <h1 className="text-xl md:text-2xl font-black text-white uppercase italic tracking-tighter">HackAware <span className="text-cyan-500 text-xs md:text-sm">PRO</span></h1>
              <p className="text-[9px] font-mono text-slate-500 uppercase tracking-[0.2em]">Domain Audit Lab / Node_Mumbai</p>
            </div>
          </div>

          <div className="flex bg-slate-900/80 p-1 rounded-xl border border-slate-800 shadow-lg w-full sm:w-auto">
            <button onClick={() => navigate('/dashboard')} className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-[10px] font-black text-slate-600 hover:text-white uppercase transition-all">
              <LayoutDashboard size={14}/> <span>Dashboard</span>
            </button>
            <div className="w-[1px] h-4 bg-slate-800 my-auto mx-1" />
            <button className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-[10px] font-black bg-cyan-500 text-black uppercase">
              <Zap size={14}/> Domain_Scan
            </button>
          </div>
        </header>

        {/* STEP NAVIGATION */}
        <div className="mb-8 flex justify-center">
          <div className="flex bg-slate-900/40 p-1 rounded-xl border border-slate-800 backdrop-blur-md">
            {["1. Target", "2. Exploit", "3. Defense"].map((label, i) => (
              <button key={i} onClick={() => setStep(i)} className={`px-6 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${step === i ? 'text-cyan-400 bg-cyan-500/10' : 'text-slate-600 hover:text-slate-300'}`}>{label}</button>
            ))}
          </div>
        </div>

        <AnimatePresence mode="wait">
          {step === 0 && (
            <motion.div key="s0" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-slate-900/40 border border-slate-800 p-6 rounded-3xl backdrop-blur-sm">
                <h3 className="text-white text-xs font-black uppercase mb-6 flex items-center gap-2"><Globe size={16} className="text-cyan-500"/> Website Input</h3>
                <div className="space-y-4">
                  <input 
                    value={targetUrl} 
                    onChange={e => setTargetUrl(e.target.value)} 
                    placeholder="Enter Suspicious URL (e.g. go0gle.com)" 
                    className="w-full bg-black/50 border border-slate-800 p-4 rounded-xl text-xs outline-none focus:border-cyan-500 transition-all text-white font-mono" 
                  />
                  <button onClick={() => setStep(1)} disabled={!targetUrl} className="w-full py-4 bg-cyan-600 text-black font-black uppercase text-[10px] rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20 disabled:opacity-30">
                    Initialize Exploit Module <ArrowRight size={14}/>
                  </button>
                </div>
              </div>
              <div className="bg-black/40 border border-slate-800 p-8 rounded-3xl flex flex-col justify-center items-center text-center">
                <Search size={32} className="text-cyan-500 mb-4" />
                <h3 className="text-white text-sm font-black uppercase mb-2">Detection Strategy</h3>
                <p className="text-xs text-slate-500 leading-relaxed uppercase tracking-tighter">Enter a fake website URL to test the Heuristic Detection Engine's ability to catch brand impersonation.</p>
              </div>
            </motion.div>
          )}

          {step === 1 && (
            <motion.div key="s1" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              <div className="lg:col-span-5 space-y-4">
                <div className="p-8 bg-slate-900/30 border border-slate-800 rounded-[2rem] text-left">
                  <div className="flex justify-between items-center mb-4 text-white font-black uppercase text-xs italic">
                     <span>Analyze Path</span> <Activity size={14} className={isAttacking ? "text-red-500 animate-pulse" : "text-slate-600"} />
                  </div>
                  <code className="block bg-black p-3 text-[10px] text-red-400 font-mono mb-4 rounded-xl border border-red-900/20 truncate">{targetUrl}</code>
                  <button onClick={executeDetection} disabled={isAttacking} className="w-full py-3 bg-red-600 text-white text-[10px] font-black rounded-lg uppercase shadow-lg hover:bg-red-500 transition-all">Launch Deep Audit</button>
                </div>
                
                {auditResult && auditResult.alerts.length > 0 && (
                   <div className={`border p-6 rounded-[2rem] ${isSecured ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-red-500/10 border-red-500/30'}`}>
                      <h4 className={`text-[10px] font-black uppercase mb-2 flex items-center gap-2 ${isSecured ? 'text-emerald-500' : 'text-red-500'}`}>
                        {isSecured ? <ShieldCheck size={14}/> : <ShieldAlert size={14}/>} 
                        {isSecured ? "Threat Mitigated" : "Impersonation Warning"}
                      </h4>
                      {auditResult.suggestedUrl && (
                        <div className="mt-4 p-3 bg-black/40 rounded-xl border border-slate-800">
                          <p className="text-[8px] text-emerald-500 font-bold uppercase mb-1">Official Correct Path:</p>
                          <p className="text-[10px] text-cyan-400 font-mono truncate">{auditResult.suggestedUrl}</p>
                        </div>
                      )}
                   </div>
                )}
              </div>

              <div className="lg:col-span-7 bg-[#050505] border border-slate-800 rounded-[2.5rem] p-8 font-mono text-[11px] h-[550px] flex flex-col shadow-2xl">
                 <div className="flex justify-between items-center border-b border-slate-800 pb-4 mb-6">
                    <span className="text-[10px] text-slate-600 font-black tracking-widest uppercase flex items-center gap-2"><Terminal size={14}/> AUDIT_CON_V5</span>
                    <div className="flex gap-2"><div className={`w-2 h-2 rounded-full ${isAttacking ? 'bg-red-500 animate-pulse' : 'bg-slate-800'}`} /></div>
                 </div>
                 <div className="flex-1 overflow-y-auto custom-scrollbar">
                    {terminalLines.map((l, i) => (
                      <div key={i} className={`mb-1.5 ${l.includes('SAFE') || l.includes('INFO') ? 'text-emerald-400 font-black' : l.includes('CRIT') || l.includes('!') ? 'text-red-400 font-bold' : 'text-cyan-400/80'}`}>{l}</div>
                    ))}
                    <div ref={terminalEndRef} />
                 </div>
                 <button onClick={() => setStep(2)} className="mt-4 w-full py-4 bg-white text-black font-black uppercase text-[10px] rounded-xl tracking-tighter">View Security Protocol</button>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div key="s2" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="space-y-6">
              <div className="bg-slate-900/40 border border-slate-800 p-10 rounded-[3rem]">
                 <div className="flex flex-col lg:flex-row justify-between items-center gap-10 mb-10">
                    <div className="flex items-center gap-6">
                       <div className={`p-6 rounded-2xl transition-all duration-700 shadow-2xl ${isSecured ? 'bg-emerald-500 text-black' : 'bg-red-600 text-white'}`}>
                          {isSecured ? <ShieldCheck size={36}/> : <Unlock size={36}/>}
                       </div>
                       <div>
                          <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter">Heuristic Defense</h3>
                          <p className={`text-[10px] font-mono mt-2 px-3 py-1 rounded inline-block ${isSecured ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/30' : 'bg-red-500/10 text-red-500 border border-red-500/30'}`}>
                             {isSecured ? "PROTECTION_ACTIVE" : "VULNERABLE_MODE"}
                          </p>
                       </div>
                    </div>
                    <button onClick={() => setIsSecured(!isSecured)} className={`px-10 py-5 rounded-2xl font-black text-xs uppercase transition-all shadow-2xl ${isSecured ? 'bg-slate-800 text-slate-500 border border-slate-700' : 'bg-emerald-600 text-white hover:bg-emerald-500'}`}>
                       {isSecured ? "Rollback Protection" : "Enable Heuristic Audit"}
                    </button>
                 </div>
                 <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                    <div className="space-y-6">
                       <div className="bg-black/60 p-6 rounded-2xl border border-red-900/20">
                          <span className="text-[10px] text-red-500 font-bold uppercase mb-4 block tracking-widest">Weak_Logic</span>
                          <pre className="text-[10px] font-mono text-slate-500 italic whitespace-pre-wrap">window.location.href = input_url;</pre>
                       </div>
                       <div className={`bg-black/60 p-6 rounded-2xl border transition-all duration-700 ${isSecured ? 'border-emerald-500/50' : 'border-slate-800'}`}>
                          <span className={`text-[10px] font-bold uppercase mb-4 block tracking-widest ${isSecured ? 'text-emerald-400' : 'text-slate-600'}`}>Hardened_Logic</span>
                          <pre className={`text-[10px] font-mono leading-relaxed ${isSecured ? 'text-emerald-400' : 'text-slate-700'} whitespace-pre-wrap`}>
                            {isSecured ? `const audit = performDeepAudit(url);\nif (!audit.isSafe) {\n  suggest(audit.official);\n  blockConnection();\n}` : "// Protection Offline"}
                          </pre>
                       </div>
                    </div>
                    <div className="bg-slate-800/10 p-8 rounded-3xl border border-slate-800 h-fit">
                       <h4 className="text-white text-xs font-black uppercase mb-8 border-b border-slate-800 pb-4 flex items-center gap-3"><ShieldIcon size={18} className="text-cyan-500"/> Protection Layers</h4>
                       <div className="space-y-5">
                          {["Visual Homoglyph Analysis", "Authorized Brand Registry", "TLD Reputation Audit"].map((r, i) => (
                            <div key={i} className="bg-black/40 p-5 rounded-2xl flex items-center gap-4 border border-slate-800/50">
                               <div className={`w-2 h-2 rounded-full ${isSecured ? 'bg-emerald-500 animate-pulse' : 'bg-slate-700'}`} />
                               <span className="text-[11px] font-mono text-slate-300 uppercase tracking-tighter">{r}</span>
                            </div>
                          ))}
                       </div>
                    </div>
                 </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Phishing;