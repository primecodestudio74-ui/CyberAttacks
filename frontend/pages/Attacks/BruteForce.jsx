import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  ChevronLeft, Lock, Unlock, ShieldCheck, Terminal, UserPlus, 
  Fingerprint, Activity, Zap, ShieldIcon, Plus, Database, ArrowRight, Trash2
} from 'lucide-react';

const BruteForce = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(0); 
  const [mockDB, setMockDB] = useState([]);
  const [newUser, setNewUser] = useState({ user: '', pass: '' });
  const [selectedAttack, setSelectedAttack] = useState(null);
  const [terminalLines, setTerminalLines] = useState([]);
  const [isSecured, setIsSecured] = useState(false);
  const [isExploited, setIsExploited] = useState(false);
  const terminalEndRef = useRef(null);

  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [terminalLines]);

  const vectors = [
    { 
      id: 'dict', title: "Dictionary Attack", payload: "rockyou.txt", 
      intel: "Automated brute-force using high-probability wordlists to bypass authentication.",
      vulnCode: "if (db.password === userInput.password) { \n  return grantAccess(); \n}",
      fixCode: "const isMatch = await bcrypt.compare(pass, hash);\nif (!isMatch) return reject();",
      remedy: ["Implement Bcrypt Hashing", "Account Lockout Policy", "Multi-Factor Auth"]
    }
  ];

  const quickSeed = () => {
    const seed = [
      { id: 1, user: 'admin', pass: 'p@ssword123' },
      { id: 2, user: 'shruti_op', pass: 'alpha_secure_99' },
      { id: 3, user: 'root', pass: 'root_access_prod' }
    ];
    setMockDB(seed);
  };

  const handleCommit = () => {
    if (newUser.user && newUser.pass) {
      setMockDB([{ ...newUser, id: Date.now() }, ...mockDB]);
      setNewUser({ user: '', pass: '' });
    }
  };

  const executeAttack = async (vector) => {
    if (mockDB.length === 0) return;
    setSelectedAttack(vector);
    setTerminalLines([
      `[AUTH] Initializing handshake with /api/v1/login`,
      `[INFO] Target Identity: ${mockDB[0].user}`,
      `[LOAD] Injecting wordlist: ${vector.payload}`
    ]);

    for (let i = 1; i <= 6; i++) {
      await new Promise(r => setTimeout(r, 400));
      setTerminalLines(prev => [...prev, `[TRY] Attempting variant_00${i}... FAILED (401)`]);
      if (i === 6) {
        if (!isSecured) {
          setTerminalLines(prev => [...prev, `[MATCH] CREDENTIALS FOUND: ${mockDB[0].user}:${mockDB[0].pass}`, "[SUCCESS] Generating Session JWT."]);
          setIsExploited(true);
        } else {
          setTerminalLines(prev => [...prev, "[BLOCK] 429 Error: Too Many Requests.", "[DEFENSE] WAF Rate Limiter active. IP dropped."]);
        }
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#020617] text-slate-300 font-sans p-8 selection:bg-cyan-500/30">
      <div className="max-w-6xl mx-auto">
        
        {/* HEADER */}
        <header className="flex flex-col sm:flex-row justify-between items-center mb-10 gap-6">
          <div className="flex items-center gap-4 w-full sm:w-auto">
            <button onClick={() => navigate('/dashboard')} className="bg-cyan-500 p-2.5 rounded-xl text-black shrink-0 hover:bg-cyan-400 transition-colors">
              <ChevronLeft size={20} />
            </button>
            <div>
              <h1 className="text-xl font-black text-white uppercase italic tracking-tighter">Auth_Lab <span className="text-cyan-500 text-xs">PRO</span></h1>
              <p className="text-[9px] font-mono text-slate-500 uppercase tracking-widest tracking-[0.2em]">Operator_Shruti // Brute_Force_Node</p>
            </div>
          </div>
          <div className="flex bg-slate-900/50 p-1 rounded-xl border border-slate-800 backdrop-blur-md">
            {["1. Schema", "2. Attack", "3. Defense"].map((l, i) => (
              <button key={i} onClick={() => setStep(i)} className={`px-6 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${step === i ? 'bg-cyan-500/10 text-cyan-400' : 'text-slate-600 hover:text-slate-300'}`}>{l}</button>
            ))}
          </div>
        </header>

        <AnimatePresence mode="wait">
          {step === 0 && (
            <motion.div key="s0" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div className="bg-slate-900/30 border border-slate-800 p-8 rounded-[2.5rem] backdrop-blur-sm">
                  <h3 className="text-white text-xs font-black uppercase mb-6 flex items-center gap-2"><UserPlus size={16} className="text-cyan-500"/> Define Account</h3>
                  <div className="space-y-4">
                    <input value={newUser.user} onChange={e => setNewUser({...newUser, user: e.target.value})} placeholder="Username (e.g. admin)" className="w-full bg-black/50 border border-slate-800 p-4 rounded-xl text-xs outline-none focus:border-cyan-500 transition-all" />
                    <input value={newUser.pass} onChange={e => setNewUser({...newUser, pass: e.target.value})} placeholder="Password" className="w-full bg-black/50 border border-slate-800 p-4 rounded-xl text-xs outline-none focus:border-cyan-500 transition-all" />
                    <button onClick={handleCommit} className="w-full py-4 bg-cyan-600/10 border border-cyan-500/30 text-cyan-500 font-black text-[10px] uppercase rounded-xl hover:bg-cyan-500 hover:text-black transition-all flex items-center justify-center gap-2">
                      <Plus size={14}/> Commit Identity
                    </button>
                  </div>
                  {mockDB.length > 0 && (
                    <button onClick={() => setStep(1)} className="w-full mt-4 py-4 bg-cyan-600 text-black font-black uppercase text-[10px] rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20">
                      Initialize Attack Module <ArrowRight size={14}/>
                    </button>
                  )}
                </div>
              </div>
              
              <div className="bg-black/40 border border-slate-800 p-8 rounded-[2.5rem] flex flex-col h-full min-h-[400px]">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-slate-600 text-[10px] font-black uppercase tracking-widest flex items-center gap-2"><Database size={14}/> Credential Registry</h3>
                  <div className="flex gap-4">
                    <button onClick={quickSeed} className="text-[10px] text-cyan-500 font-black uppercase hover:underline tracking-tighter">Initialize Core</button>
                    <button onClick={() => setMockDB([])} className="text-slate-700 hover:text-red-500 transition-colors"><Trash2 size={14}/></button>
                  </div>
                </div>
                <div className="space-y-3 flex-1 overflow-y-auto custom-scrollbar pr-2">
                  {mockDB.map(u => (
                    <div key={u.id} className="bg-slate-900/40 p-4 rounded-xl flex justify-between items-center border border-slate-800/50 hover:bg-slate-800/40 transition-colors">
                      <div className="flex items-center gap-3">
                        <Fingerprint size={16} className="text-slate-700" />
                        <span className="text-xs font-mono text-slate-300">{u.user}</span>
                      </div>
                      <span className="text-[10px] font-mono text-slate-600 uppercase tracking-widest">PWD: ••••••••</span>
                    </div>
                  ))}
                  {mockDB.length === 0 && (
                    <div className="text-center py-20">
                      <p className="text-slate-700 text-[10px] italic uppercase tracking-[0.2em]">Awaiting Identity Injection</p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {step === 1 && (
            <motion.div key="s1" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="space-y-4">
                {vectors.map(v => (
                  <button key={v.id} onClick={() => executeAttack(v)} className="w-full p-8 bg-slate-900/30 border border-slate-800 rounded-[2rem] text-left hover:border-cyan-500/50 transition-all group">
                    <div className="flex justify-between items-center mb-4 text-white uppercase italic text-xs font-black">
                       <span>{v.title}</span> <Zap size={14} className="text-cyan-500 group-hover:animate-pulse" />
                    </div>
                    <code className="block bg-black p-3 text-[10px] text-cyan-400 font-mono mb-4 rounded-xl border border-cyan-900/20 tracking-tighter">{v.payload}</code>
                    <p className="text-[11px] text-slate-500 leading-relaxed">{v.intel}</p>
                  </button>
                ))}
              </div>
              <div className="bg-[#050505] border border-slate-800 rounded-[2.5rem] p-8 font-mono text-[11px] h-[500px] flex flex-col shadow-2xl relative">
                 <div className="flex justify-between items-center border-b border-slate-800 pb-4 mb-6">
                    <span className="text-[10px] text-slate-600 font-black tracking-widest uppercase flex items-center gap-2"><Terminal size={14}/> Auth_Shell_v4.2</span>
                    <div className="flex gap-2"><div className="w-2 h-2 rounded-full bg-slate-800" /><div className="w-2 h-2 rounded-full bg-slate-800" /></div>
                 </div>
                 <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
                    {terminalLines.map((l, i) => (
                      <div key={i} className={`mb-1.5 ${l.includes('SUCCESS') ? 'text-emerald-400 font-black' : l.includes('BLOCK') ? 'text-red-500 font-bold' : 'text-cyan-500/80'}`}>{l}</div>
                    ))}
                    <div ref={terminalEndRef} />
                 </div>
              </div>
            </motion.div>
          )}

          {step === 2 && (
             <motion.div key="s2" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="space-y-8">
                <div className="bg-slate-900/40 border border-slate-800 p-10 rounded-[3rem]">
                   <div className="flex flex-col lg:flex-row justify-between items-center gap-10 mb-10">
                      <div className="flex items-center gap-6">
                         <div className={`p-6 rounded-2xl transition-all duration-700 shadow-2xl ${isSecured ? 'bg-emerald-500 text-black shadow-emerald-500/20' : 'bg-cyan-600 text-white shadow-cyan-600/20'}`}>
                            {isSecured ? <ShieldCheck size={36}/> : <Unlock size={36}/>}
                         </div>
                         <div>
                            <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter">Hardening Layer</h3>
                            <p className={`text-[10px] font-mono mt-2 px-3 py-1 rounded inline-block ${isSecured ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/30' : 'bg-cyan-500/10 text-cyan-500 border border-cyan-500/30'}`}>
                               {isSecured ? "MITIGATION_ENFORCED" : "AUTH_VULNERABLE"}
                            </p>
                         </div>
                      </div>
                      <button onClick={() => setIsSecured(!isSecured)} className={`w-full lg:w-auto px-10 py-5 rounded-2xl font-black text-xs uppercase transition-all shadow-2xl ${isSecured ? 'bg-slate-800 text-slate-500 border border-slate-700' : 'bg-emerald-600 text-white hover:bg-emerald-500'}`}>
                         {isSecured ? "Rollback Security Patch" : "Enforce Rate Limiting"}
                      </button>
                   </div>
                   <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                      <div className="space-y-6">
                         <div className="bg-black/60 p-6 rounded-2xl border border-red-900/20">
                            <span className="text-[10px] text-red-500 font-bold uppercase mb-4 block tracking-widest">Weak_Logic</span>
                            <pre className="text-[11px] font-mono text-slate-500 italic leading-relaxed">{vectors[0].vulnCode}</pre>
                         </div>
                         <div className={`bg-black/60 p-6 rounded-2xl border transition-all duration-700 ${isSecured ? 'border-emerald-500/50' : 'border-slate-800'}`}>
                            <span className={`text-[10px] font-bold uppercase mb-4 block tracking-widest ${isSecured ? 'text-emerald-400' : 'text-slate-600'}`}>Hardened_Logic</span>
                            <pre className={`text-[11px] font-mono leading-relaxed ${isSecured ? 'text-emerald-400' : 'text-slate-700'}`}>{isSecured ? vectors[0].fixCode : "// Defense offline"}</pre>
                         </div>
                      </div>
                      <div className="bg-slate-800/10 p-8 rounded-2xl border border-slate-800 h-fit">
                         <h4 className="text-white text-xs font-black uppercase mb-8 border-b border-slate-800 pb-4 flex items-center gap-3"><ShieldIcon size={18} className="text-cyan-500"/> Remediation</h4>
                         <div className="space-y-5">
                            {vectors[0].remedy.map((r, i) => (
                              <div key={i} className="bg-black/40 p-5 rounded-2xl flex items-center gap-4 border border-slate-800/50 hover:border-cyan-500/20 transition-all">
                                 <div className={`w-2 h-2 rounded-full ${isSecured ? 'bg-emerald-500 animate-pulse' : 'bg-cyan-500'}`} />
                                 <span className="text-[11px] font-mono text-slate-300 uppercase tracking-tighter leading-none">{r}</span>
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

export default BruteForce;