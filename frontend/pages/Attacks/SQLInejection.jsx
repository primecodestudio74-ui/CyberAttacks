import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  Database, ShieldCheck, Zap, Code2, 
  Plus, Trash2, ChevronLeft, LayoutDashboard,
  Unlock, Lock, Search, 
  Activity, AlertTriangle, Globe, Info, 
  Server, Fingerprint, Bug, ShieldAlert,
  UserPlus, ShieldIcon, Eye, EyeOff, Terminal,
  CheckCircle2, XCircle, ArrowRight, Home,
  RotateCcw, BarChart3
} from 'lucide-react';

const SQLInejection = () => {
  const navigate = useNavigate();
  const [view, setView] = useState('lab'); 
  const [step, setStep] = useState(0); 
  const [dbColumns, setDbColumns] = useState([
    { name: "id", type: "INT" },
    { name: "username", type: "STRING" },
    { name: "password", type: "SECRET" }
  ]);
  const [newCol, setNewCol] = useState({ name: "", type: "STRING" });
  const [mockData, setMockData] = useState([]);
  const [tempRow, setTempRow] = useState({});
  const [isExploited, setIsExploited] = useState(false);
  const [selectedAttack, setSelectedAttack] = useState(null);
  const [terminalLines, setTerminalLines] = useState([]);
  const [isSecured, setIsSecured] = useState(false);
  const terminalEndRef = useRef(null);

  const dataTypes = ["STRING", "INT", "SECRET", "BOOL", "UUID"];

  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [terminalLines]);

  const attackPayloads = [
    { 
      id: 'tautology',
      title: "Authentication Bypass", 
      vector: "Tautology (' OR 1=1)",
      payload: "' OR '1'='1", 
      intel: "Bypasses logic by injecting a condition that is always true. The SQL engine executes: WHERE user = '' OR '1'='1', which returns the first record in the table.",
      vulnerableCode: "const sql = `SELECT * FROM users WHERE user = '${userInput}'`;",
      secureCode: "const sql = 'SELECT * FROM users WHERE user = ?';\nawait db.execute(sql, [userInput]);",
      remediation: ["Use Parameterized Queries", "Implement Account Lockouts", "Disable Detailed DB Errors"]
    },
    { 
      id: 'union',
      title: "Data Exfiltration", 
      vector: "UNION-Based",
      payload: "' UNION SELECT NULL, table_name, NULL FROM information_schema.tables--", 
      intel: "Forces the database to combine results from a hidden system table with the current query. This is how attackers 'dump' your entire database structure.",
      vulnerableCode: "db.query('SELECT name, price FROM products WHERE id = ' + id);",
      secureCode: "const id = parseInt(req.params.id);\nif(isNaN(id)) return res.error();",
      remediation: ["Strict Type Casting", "Least Privilege DB User", "Database Firewall (WAF)"]
    }
  ];

  const quickSeed = () => {
    const seedData = [
      { id: 1, username: 'admin', password: 'hash_admin_99' },
      { id: 2, username: 'aniket_dev', password: 'clear_text_pwd' },
      { id: 3, username: 'guest_user', password: 'guest_access_token' }
    ];
    setMockData(seedData);
  };

  const clearData = () => {
    setMockData([]);
    setIsExploited(false);
    setTerminalLines([]);
    setSelectedAttack(null);
    setStep(0);
  };

  const handleAddRow = () => {
    if (Object.keys(tempRow).length === 0) return;
    const newEntry = { ...tempRow, id: mockData.length + 1 };
    setMockData([...mockData, newEntry]);
    setTempRow({});
  };

  const startAttack = (attack) => {
    if (mockData.length === 0) return;
    setSelectedAttack(attack);
    setIsExploited(false);
    setTerminalLines([
      `[RUN] npx hack-tool --vector="${attack.id}"`,
      `[SQL] Executing: SELECT * FROM users WHERE creds = '${isSecured ? '?' : attack.payload}';`,
    ]);
    
    setTimeout(() => {
      if (!isSecured) {
        setTerminalLines(prev => [...prev, "[!!!] LOGIC HIJACKED", `[RES] Leaked ${mockData.length} records.`]);
        setIsExploited(true);
      } else {
        setTerminalLines(prev => [...prev, "[SAFE] Input Escaped via Prepared Statement.", "[RES] 0 Results Found (Sanitized)."]);
      }
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-[#020617] text-slate-300 font-sans p-4 sm:p-6 md:p-8 selection:bg-cyan-500/30">
      <div className="max-w-6xl mx-auto">
        
        {/* HEADER */}
        <header className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-6">
          <div className="flex items-center gap-4 w-full sm:w-auto">
            <button onClick={() => navigate('/dashboard')} className="bg-cyan-500 p-2.5 rounded-xl hover:bg-cyan-400 transition-colors shrink-0">
              <ChevronLeft className="text-black" size={20} />
            </button>
            <div>
              <h1 className="text-xl md:text-2xl font-black text-white uppercase italic tracking-tighter">HackAware <span className="text-cyan-500 text-xs md:text-sm">PRO</span></h1>
              <p className="text-[9px] font-mono text-slate-500 uppercase tracking-[0.2em]">Injection Lab / Node_Mumbai</p>
            </div>
          </div>

          <div className="flex bg-slate-900/80 p-1 rounded-xl border border-slate-800 shadow-lg w-full sm:w-auto">
            <button 
              onClick={() => navigate('/dashboard')}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-[10px] font-black text-slate-500 hover:text-white uppercase transition-all"
            >
              <LayoutDashboard size={14}/> <span className="hidden xs:inline">Dashboard</span>
            </button>
            <div className="w-[1px] h-4 bg-slate-800 my-auto mx-1" />
            <button 
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-[10px] font-black bg-cyan-500 text-black uppercase shadow-[0_0_15px_rgba(6,182,212,0.3)]"
            >
              <Terminal size={14}/> SQL_Lab
            </button>
          </div>
        </header>

        {/* LAB NAVIGATION STEPS - Horizontal scroll on very small screens */}
        <div className="mb-8 flex justify-center overflow-x-auto pb-2">
          <div className="flex bg-slate-900/40 p-1 rounded-xl border border-slate-800 backdrop-blur-md min-w-max">
            {["1. Schema", "2. Attack", "3. Defense"].map((label, i) => {
              const isLocked = i > 0 && mockData.length === 0;
              return (
                <button 
                  key={i} 
                  onClick={() => !isLocked && setStep(i)} 
                  disabled={isLocked}
                  className={`px-4 md:px-6 py-2 rounded-lg text-[10px] font-black uppercase transition-all 
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
            <motion.div key="s1" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-6">
                <div className="bg-slate-900/40 border border-slate-800 p-5 rounded-3xl backdrop-blur-sm">
                  <h2 className="text-white font-bold text-xs uppercase flex items-center gap-2 mb-4"><Server size={16} className="text-cyan-400"/> Define Schema</h2>
                  <div className="flex flex-col gap-2 mb-4">
                    <input value={newCol.name} onChange={e => setNewCol({...newCol, name: e.target.value.replace(/\s/g, '_')})} placeholder="Column Name (e.g. user_email)" className="bg-black/50 border border-slate-700 rounded-lg px-3 py-3 text-xs outline-none focus:border-cyan-500 w-full" />
                    <div className="flex gap-2">
                      <select value={newCol.type} onChange={e => setNewCol({...newCol, type: e.target.value})} className="flex-1 bg-black/50 border border-slate-700 rounded-lg px-3 py-2 text-xs text-cyan-400 outline-none">
                        {dataTypes.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                      <button onClick={() => {if(newCol.name){setDbColumns([...dbColumns, newCol]); setNewCol({name:"", type:"STRING"})}}} className="bg-slate-800 px-4 rounded-lg text-cyan-400 hover:bg-slate-700 shrink-0"><Plus size={18}/></button>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {dbColumns.map((c, i) => <span key={i} className="bg-slate-800/50 border border-slate-700 px-3 py-1 rounded-full text-[10px] font-mono">{c.name} <span className="text-slate-500">({c.type})</span></span>)}
                  </div>
                </div>

                <div className="bg-slate-900/40 border border-slate-800 p-5 rounded-3xl">
                  <div className="flex flex-col xs:flex-row justify-between items-start xs:items-center mb-4 gap-2">
                    <h2 className="text-white font-bold text-xs uppercase flex items-center gap-2"><UserPlus size={16} className="text-emerald-400"/> Seed Database</h2>
                    <button onClick={quickSeed} className="text-[10px] text-cyan-500 hover:underline font-mono uppercase tracking-tighter">Auto-populate</button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                    {dbColumns.map(col => (
                      <input key={col.name} placeholder={`Value for ${col.name}`} onChange={e => setTempRow({...tempRow, [col.name]: e.target.value})} value={tempRow[col.name] || ''} className="bg-black/50 border border-slate-700 rounded-lg px-3 py-3 text-xs outline-none focus:border-emerald-500" />
                    ))}
                  </div>
                  <div className="flex flex-col gap-3">
                    <button onClick={handleAddRow} className="w-full bg-emerald-600/20 border border-emerald-500/30 text-emerald-400 py-4 rounded-xl font-black text-[10px] uppercase">Commit Record</button>
                    {mockData.length > 0 && (
                      <button onClick={() => setStep(1)} className="w-full bg-cyan-600 text-black py-4 rounded-xl font-black text-[10px] uppercase flex justify-center items-center gap-2 shadow-lg shadow-cyan-500/20">
                        Enter Attack Lab <ArrowRight size={14}/>
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="bg-black/40 border border-slate-800 rounded-3xl p-5 flex flex-col min-h-[350px]">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-slate-600 font-bold text-[10px] uppercase tracking-widest">Instance_Active</h2>
                    {mockData.length > 0 && <span className="text-[9px] text-emerald-500 font-mono animate-pulse">● SYNC_LIVE</span>}
                </div>
                <div className="overflow-x-auto flex-1 custom-scrollbar">
                  <table className="w-full text-[10px] font-mono min-w-[450px]">
                    <thead className="text-slate-600 border-b border-slate-800 text-left">
                      <tr>{dbColumns.map(c => <th key={c.name} className="pb-2 px-2 uppercase">{c.name}</th>)}</tr>
                    </thead>
                    <tbody className="text-cyan-200/70">
                      {mockData.map((row, i) => (
                        <tr key={i} className="border-b border-slate-800/50 hover:bg-slate-800/20 transition-colors">
                          {dbColumns.map(c => <td key={c.name} className="py-4 px-2">{c.type === 'SECRET' ? '••••••••' : row[c.name]}</td>)}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {mockData.length === 0 && (
                    <div className="text-center py-16">
                      <p className="text-slate-600 italic text-[10px] mb-4 uppercase">Awaiting data injection...</p>
                      <button onClick={quickSeed} className="text-[10px] text-cyan-400 font-black border border-cyan-400/20 px-6 py-2 rounded-lg uppercase">Initialize Core</button>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {step === 1 && (
            <motion.div key="s2" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
               <div className="space-y-4">
                  <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2"><Zap size={14}/> Select Vector</h3>
                  {attackPayloads.map(atk => (
                    <button key={atk.id} onClick={() => startAttack(atk)} className={`w-full text-left p-5 rounded-2xl border transition-all duration-300 ${selectedAttack?.id === atk.id ? 'bg-red-500/10 border-red-500' : 'bg-slate-900/40 border-slate-800 hover:border-slate-700'}`}>
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-xs font-black text-white uppercase italic">{atk.title}</span>
                        <Activity className={selectedAttack?.id === atk.id ? "text-red-500" : "text-slate-700"} size={14}/>
                      </div>
                      <code className="text-[10px] text-red-400 block bg-black/80 p-3 rounded-lg mb-3 font-mono border border-red-900/20 break-all">
                        {atk.payload}
                      </code>
                      <p className="text-[10px] text-slate-500 leading-relaxed font-medium">{atk.intel}</p>
                    </button>
                  ))}
               </div>
               
               <div className="bg-[#050505] rounded-3xl border border-slate-800 p-5 font-mono text-[11px] h-[450px] lg:h-[550px] flex flex-col shadow-2xl relative">
                  <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
                    <div className="flex items-center gap-2">
                      <Terminal size={14} className="text-cyan-500" />
                      <span className="text-[9px] text-slate-500 uppercase tracking-widest font-black">HackAware_Shell v2.4</span>
                    </div>
                    <div className="flex gap-1.5">
                      <div className="w-2 h-2 rounded-full bg-slate-800" />
                      <div className="w-2 h-2 rounded-full bg-slate-800" />
                    </div>
                  </div>
                  <div className="flex-1 overflow-y-auto custom-scrollbar">
                    {terminalLines.map((l, i) => <div key={i} className={`mb-1 break-words ${l.includes('!!!') ? 'text-red-500 font-bold animate-pulse' : 'text-cyan-500'}`}>{l}</div>)}
                    {isExploited && (
                      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="mt-6 p-4 bg-red-950/20 border border-red-900/30 rounded-xl">
                        <div className="flex items-center gap-2 text-red-500 font-black mb-3 uppercase text-[10px] tracking-widest"><ShieldAlert size={16}/> LEAKED_DATA_DUMP</div>
                        <div className="grid gap-2 text-[9px] font-mono text-emerald-500/80 italic">
                          {mockData.map((r, i) => <div key={i} className="border-l border-emerald-900/50 pl-2 break-all">Row_{i+1} : {JSON.stringify(r)}</div>)}
                        </div>
                      </motion.div>
                    )}
                    <div ref={terminalEndRef} />
                  </div>
               </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div key="s3" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="space-y-6 pb-12">
              <div className="bg-slate-900/40 border border-slate-800 p-5 md:p-8 rounded-3xl shadow-2xl relative overflow-hidden">
                <div className={`absolute top-0 right-0 w-64 h-64 blur-[120px] rounded-full transition-colors duration-1000 ${isSecured ? 'bg-emerald-500/10' : 'bg-red-500/10'}`} />
                
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-10 gap-6 relative z-10">
                  <div className="flex items-center gap-4 md:gap-6">
                    <div className={`p-4 rounded-2xl transition-all duration-700 shadow-xl shrink-0 ${isSecured ? 'bg-emerald-500 text-black scale-105' : 'bg-red-600 text-white'}`}>
                      {isSecured ? <Lock size={28}/> : <Unlock size={28}/>}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-xl font-black text-white uppercase italic tracking-tighter">Security Hardening</h3>
                        {isSecured ? <CheckCircle2 size={16} className="text-emerald-500" /> : <XCircle size={16} className="text-red-500" />}
                      </div>
                      <p className={`text-[10px] font-mono uppercase tracking-[0.2em] px-2 py-1 rounded bg-black/40 border inline-block ${isSecured ? 'text-emerald-400 border-emerald-500/30' : 'text-red-400 border-red-500/30'}`}>
                        {isSecured ? "ENFORCED" : "OPEN_TO_INJECTION"}
                      </p>
                    </div>
                  </div>

                  <button 
                    onClick={() => setIsSecured(!isSecured)} 
                    className={`w-full lg:w-auto px-8 py-4 rounded-xl font-black text-xs uppercase transition-all shadow-xl ${isSecured ? 'bg-slate-800 text-slate-400 border border-slate-700' : 'bg-emerald-600 text-white hover:bg-emerald-500'}`}
                  >
                    {isSecured ? "Rollback Security Patch" : "Apply Prepared Statement"}
                  </button>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 relative z-10">
                  <div className="space-y-6">
                    <div className="bg-black/60 rounded-2xl border border-red-900/30 overflow-hidden shadow-lg">
                      <div className="bg-red-950/30 px-5 py-3 text-[10px] font-black text-red-400 flex items-center justify-between uppercase tracking-widest">
                        <div className="flex items-center gap-2"><EyeOff size={14}/> Vulnerable_Block</div>
                      </div>
                      <pre className="p-5 text-[11px] text-slate-400 font-mono italic overflow-x-auto whitespace-pre-wrap">
                        {selectedAttack?.vulnerableCode || "// Select a vector in Attack Lab"}
                      </pre>
                    </div>
                    
                    <div className={`bg-black/60 rounded-2xl border overflow-hidden transition-all duration-700 shadow-lg ${isSecured ? 'border-emerald-500/50' : 'border-slate-800'}`}>
                      <div className={`px-5 py-3 text-[10px] font-black flex items-center justify-between transition-colors uppercase tracking-widest ${isSecured ? 'bg-emerald-950/40 text-emerald-400' : 'bg-slate-900/50 text-slate-500'}`}>
                        <div className="flex items-center gap-2"><Eye size={14}/> Secure_Block</div>
                      </div>
                      <pre className={`p-5 text-[11px] font-mono overflow-x-auto whitespace-pre-wrap ${isSecured ? 'text-emerald-400' : 'text-slate-600'}`}>
                        {selectedAttack?.secureCode || "// Security logic locked"}
                      </pre>
                    </div>
                  </div>

                  <div className="bg-slate-800/20 p-6 rounded-2xl border border-slate-700/50 backdrop-blur-sm h-full">
                    <h4 className="text-white text-sm font-black uppercase mb-6 flex items-center gap-3 border-b border-slate-700 pb-4 tracking-wider">
                      <ShieldIcon size={18} className="text-cyan-400"/> Remediation_Steps
                    </h4>
                    <div className="space-y-4">
                      {(selectedAttack?.remediation || ["Awaiting simulation output..."]).map((step, i) => (
                        <div key={i} className={`flex items-start gap-4 bg-black/40 p-4 rounded-xl border transition-all ${isSecured ? 'border-emerald-500/20' : 'border-slate-800/50'}`}>
                          <div className={`mt-1.5 w-1.5 h-1.5 rounded-full shrink-0 ${isSecured ? 'bg-emerald-500 animate-pulse' : 'bg-cyan-500'}`}/>
                          <span className="text-[10px] md:text-[11px] font-mono text-slate-300 leading-relaxed uppercase tracking-tighter">{step}</span>
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

export default SQLInejection;   