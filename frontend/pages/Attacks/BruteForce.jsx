import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  ChevronLeft, Lock, Unlock, ShieldCheck, Terminal, UserPlus, 
  Zap, ShieldIcon, Plus, Database, ArrowRight, Users,
  LayoutDashboard, Activity, ShieldAlert, CheckCircle2, XCircle, 
  RotateCcw, Fingerprint, Server, Trash2
} from 'lucide-react';

const BruteForce = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(0); 
  const [mockDB, setMockDB] = useState([]);
  const [newUser, setNewUser] = useState({ user: '', pass: '' });
  const [terminalLines, setTerminalLines] = useState([]);
  const [isSecured, setIsSecured] = useState(false);
  const [crackedProfiles, setCrackedProfiles] = useState([]);
  const [isAttacking, setIsAttacking] = useState(false);
  const terminalEndRef = useRef(null);

  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [terminalLines]);

  const attackVectors = [
    { 
      id: 'dict', 
      title: "Dictionary Attack", 
      payload: "rockyou.txt_subset", 
      intel: "Automated scripts test thousands of common passwords against a username until a '200 OK' response is received.",
      vulnCode: "const user = db.find(u => u.user === req.body.user);\nif (user.password === req.body.password) {\n  return res.status(200).send('Login Success');\n}",
      fixCode: "const match = await bcrypt.compare(pass, hash);\nif (!match) {\n  await rateLimiter.consume(req.ip); \n  throw new AuthError();\n}",
      remedy: ["Bcrypt Password Hashing", "IP Rate Limiting (429)", "Account Lockout Policy"]
    }
  ];

  const handleCommit = () => {
    if (newUser.user && newUser.pass) {
      setMockDB([{ ...newUser, id: Date.now() }, ...mockDB]);
      setNewUser({ user: '', pass: '' });
    }
  };

  const quickSeed = () => {
    setMockDB([
      { user: 'admin_root', pass: 'password123', id: 1 },
      { user: 'aniket_barai', pass: 'qwerty', id: 2 }
    ]);
  };

  const executeAttack = async (vector) => {
    if (mockDB.length === 0 || isAttacking) return;
    setIsAttacking(true);
    setCrackedProfiles([]);
    setTerminalLines([
      `[AUTH] Target Acquired: ${mockDB[0].user}`,
      `[LOAD] Loading Dictionary: ${vector.payload}`,
      `[POST] Handshake initiated with /api/v1/auth...`
    ]);

    const commonPasses = ["123456", "admin", "welcome", "111111", mockDB[0].pass];
    
    for (let i = 0; i < commonPasses.length; i++) {
      await new Promise(r => setTimeout(r, 600));
      const currentPass = commonPasses[i];
      const isMatch = currentPass === mockDB[0].pass;

      if (isSecured && i >= 3) {
        setTerminalLines(prev => [...prev, `[BLOCK] 429: Too Many Requests. IP 10.0.0.1 Banned for 15m.`]);
        setIsAttacking(false);
        return;
      }

      setTerminalLines(prev => [...prev, `[TRY] user:${mockDB[0].user} pass:${currentPass.padEnd(10)} -> ${isMatch ? '200_OK' : '401_UNAUTH'}`]);

      if (isMatch) {
        setTerminalLines(prev => [...prev, `\n[SUCCESS] Credentials Cracked: ${currentPass}`]);
        setCrackedProfiles([{ user: mockDB[0].user, pass: currentPass, role: 'Super_User' }]);
        break;
      }
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
              <p className="text-[9px] font-mono text-slate-500 uppercase tracking-[0.2em]">Brute Force Lab / Node_Mumbai</p>
            </div>
          </div>

          <div className="flex bg-slate-900/80 p-1 rounded-xl border border-slate-800 shadow-lg w-full sm:w-auto">
            <button onClick={() => navigate('/dashboard')} className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-[10px] font-black text-slate-600 hover:text-white uppercase transition-all">
              <LayoutDashboard size={14}/> <span>Dashboard</span>
            </button>
            <div className="w-[1px] h-4 bg-slate-800 my-auto mx-1" />
            <button className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-[10px] font-black bg-cyan-500 text-black uppercase shadow-[0_0_15px_rgba(6,182,212,0.3)]">
              <Fingerprint size={14}/> Auth_Lab
            </button>
          </div>
        </header>

        {/* STEP NAVIGATION */}
        <div className="mb-8 flex justify-center">
          <div className="flex bg-slate-900/40 p-1 rounded-xl border border-slate-800 backdrop-blur-md">
            {["1. Identity", "2. Exploit", "3. Defense"].map((label, i) => {
              const isLocked = i > 0 && mockDB.length === 0;
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
            <motion.div key="s1" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div className="bg-slate-900/40 border border-slate-800 p-6 rounded-3xl backdrop-blur-sm">
                  <h3 className="text-white text-xs font-black uppercase mb-6 flex items-center gap-2"><UserPlus size={16} className="text-cyan-500"/> Victim Registry</h3>
                  <div className="space-y-4">
                    <input value={newUser.user} onChange={e => setNewUser({...newUser, user: e.target.value})} placeholder="Set Target Username" className="w-full bg-black/50 border border-slate-800 p-4 rounded-xl text-xs outline-none focus:border-cyan-500 transition-all" />
                    <input value={newUser.pass} onChange={e => setNewUser({...newUser, pass: e.target.value})} placeholder="Set Target Password" className="w-full bg-black/50 border border-slate-800 p-4 rounded-xl text-xs outline-none focus:border-cyan-500 transition-all" />
                    <button onClick={handleCommit} className="w-full py-4 bg-cyan-600/10 border border-cyan-500/30 text-cyan-500 font-black text-[10px] uppercase rounded-xl hover:bg-cyan-500 hover:text-black transition-all">Inject Victim</button>
                    <button onClick={quickSeed} className="w-full py-4 bg-slate-800 text-slate-400 font-black text-[10px] uppercase rounded-xl border border-slate-700">Quick Seed</button>
                    {mockDB.length > 0 && (
                      <button onClick={() => setStep(1)} className="w-full py-4 bg-cyan-500 text-black font-black uppercase text-[10px] rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20">
                        Proceed to Attack Lab <ArrowRight size={14}/>
                      </button>
                    )}
                  </div>
                </div>
              </div>
              <div className="bg-black/40 border border-slate-800 p-8 rounded-3xl flex flex-col h-full min-h-[400px]">
                 <h3 className="text-slate-600 text-[10px] font-black uppercase mb-6 flex items-center gap-2 tracking-widest"><Database size={14}/> Live Target Table</h3>
                 <div className="space-y-3 flex-1 overflow-y-auto">
                    {mockDB.map(u => (
                      <div key={u.id} className="bg-slate-900/40 p-4 rounded-xl flex justify-between items-center border border-slate-800/50">
                        <div className="flex flex-col">
                            <span className="text-xs font-mono text-slate-300">{u.user}</span>
                            <span className="text-[9px] text-slate-600 uppercase font-black tracking-tighter">Status: Active_Session</span>
                        </div>
                        <span className="text-[10px] font-mono text-cyan-500/50 italic select-none">••••••••</span>
                      </div>
                    ))}
                    {mockDB.length === 0 && <div className="text-center py-20 text-[10px] text-slate-700 italic uppercase">Awaiting Registry Input...</div>}
                 </div>
              </div>
            </motion.div>
          )}

          {step === 1 && (
            <motion.div key="s2" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              <div className="lg:col-span-5 space-y-4">
                <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2"><Zap size={14}/> Select Vector</h3>
                {attackVectors.map(v => (
                  <button key={v.id} onClick={() => executeAttack(v)} disabled={isAttacking} className="w-full p-8 bg-slate-900/30 border border-slate-800 rounded-[2rem] text-left hover:border-red-500/50 transition-all group">
                    <div className="flex justify-between items-center mb-4 text-white uppercase italic text-xs font-black">
                       <span>{v.title}</span> <Activity size={14} className={isAttacking ? "text-red-500 animate-pulse" : "text-slate-600"} />
                    </div>
                    <code className="block bg-black p-3 text-[10px] text-red-400 font-mono mb-4 rounded-xl border border-red-900/20 truncate">{v.payload}</code>
                    <p className="text-[11px] text-slate-500 leading-relaxed">{v.intel}</p>
                  </button>
                ))}
                
                <div className="bg-slate-900/20 border border-slate-800 p-6 rounded-[2rem]">
                  <h4 className="text-[10px] font-black text-slate-500 uppercase mb-4 flex items-center gap-2"><Users size={14}/> Captured Sessions</h4>
                  <div className="space-y-2">
                    {crackedProfiles.map((d, i) => (
                      <div key={i} className="bg-red-500/10 p-3 rounded-lg border border-red-500/30 text-[9px] font-mono">
                         <span className="text-white">CRACKED: {d.user}</span> | <span className="text-red-500">PASS: {d.pass}</span>
                      </div>
                    ))}
                    {crackedProfiles.length === 0 && <p className="text-center py-4 text-[9px] text-slate-700 italic uppercase">Waiting for match...</p>}
                  </div>
                </div>
              </div>

              <div className="lg:col-span-7 bg-[#050505] border border-slate-800 rounded-[2.5rem] p-8 font-mono text-[11px] h-[550px] flex flex-col shadow-2xl">
                 <div className="flex justify-between items-center border-b border-slate-800 pb-4 mb-6">
                    <span className="text-[10px] text-slate-600 font-black tracking-widest uppercase flex items-center gap-2"><Terminal size={14}/> BF_ENGINE_V1.1</span>
                    <div className="flex gap-2"><div className={`w-2 h-2 rounded-full ${isAttacking ? 'bg-red-500 animate-pulse' : 'bg-slate-800'}`} /></div>
                 </div>
                 <div className="flex-1 overflow-y-auto custom-scrollbar">
                    {terminalLines.map((l, i) => (
                      <div key={i} className={`mb-1.5 ${l.includes('SUCCESS') ? 'text-emerald-400 font-black' : l.includes('BLOCK') ? 'text-red-500 font-bold' : 'text-cyan-400/80'}`}>{l}</div>
                    ))}
                    <div ref={terminalEndRef} />
                 </div>
                 <button onClick={() => setStep(2)} className="mt-4 w-full py-4 bg-white text-black font-black uppercase text-[10px] rounded-xl tracking-tighter">Analyze Prevention</button>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div key="s3" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="space-y-6">
              <div className="bg-slate-900/40 border border-slate-800 p-10 rounded-[3rem] relative overflow-hidden">
                <div className="flex flex-col lg:flex-row justify-between items-center gap-10 mb-10">
                  <div className="flex items-center gap-6">
                    <div className={`p-6 rounded-2xl transition-all duration-700 shadow-2xl ${isSecured ? 'bg-emerald-500 text-black' : 'bg-red-600 text-white'}`}>
                      {isSecured ? <Lock size={36}/> : <Unlock size={36}/>}
                    </div>
                    <div>
                      <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter">Auth Hardening</h3>
                      <p className={`text-[10px] font-mono mt-2 px-3 py-1 rounded inline-block ${isSecured ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/30' : 'bg-red-500/10 text-red-500 border border-red-500/30'}`}>
                        {isSecured ? "ENFORCED" : "OPEN_TO_ATTACK"}
                      </p>
                    </div>
                  </div>
                  <button onClick={() => setIsSecured(!isSecured)} className={`w-full lg:w-auto px-10 py-5 rounded-2xl font-black text-xs uppercase transition-all shadow-2xl ${isSecured ? 'bg-slate-800 text-slate-500 border border-slate-700' : 'bg-emerald-600 text-white hover:bg-emerald-500'}`}>
                    {isSecured ? "Rollback Security" : "Enforce Security"}
                  </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                  <div className="space-y-6">
                    <div className="bg-black/60 p-6 rounded-2xl border border-red-900/20">
                      <span className="text-[10px] text-red-500 font-bold uppercase mb-4 block tracking-widest">Plaintext_Auth</span>
                      <pre className="text-[10px] font-mono text-slate-500 italic leading-relaxed">{attackVectors[0].vulnCode}</pre>
                    </div>
                    <div className={`bg-black/60 p-6 rounded-2xl border transition-all duration-700 ${isSecured ? 'border-emerald-500/50' : 'border-slate-800'}`}>
                      <span className={`text-[10px] font-bold uppercase mb-4 block tracking-widest ${isSecured ? 'text-emerald-400' : 'text-slate-600'}`}>Hashed_Auth</span>
                      <pre className={`text-[10px] font-mono leading-relaxed ${isSecured ? 'text-emerald-400' : 'text-slate-700'}`}>{isSecured ? attackVectors[0].fixCode : "// Security Logic Disabled"}</pre>
                    </div>
                  </div>

                  <div className="bg-slate-800/10 p-8 rounded-3xl border border-slate-800 h-fit">
                    <h4 className="text-white text-xs font-black uppercase mb-8 border-b border-slate-800 pb-4 flex items-center gap-3"><ShieldIcon size={18} className="text-cyan-500"/> Remediation Matrix</h4>
                    <div className="space-y-5">
                      {attackVectors[0].remedy.map((r, i) => (
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

export default BruteForce;