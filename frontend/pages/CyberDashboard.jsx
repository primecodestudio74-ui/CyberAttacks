import React, { useState, useEffect } from 'react';
import { 
  Shield, LogOut, LayoutDashboard, Lock, Mail, 
  Database, Activity, Zap, Menu, ChevronLeft, X, 
  ExternalLink, User, Settings, Terminal, Globe, 
  Bell, Search, Cpu, ShieldCheck, Clock, Wifi,
  KeyRound, Hash, AlertTriangle, FileSearch
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

const CyberDashboard = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [selectedAttack, setSelectedAttack] = useState(null);
  const [activeTab, setActiveTab] = useState('hub');
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const navigate = useNavigate();

  // Update clock every second
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Auth check
  useEffect(() => {
    const token = localStorage.getItem('operator_token') || localStorage.getItem('token');
    if (!token) navigate('/'); 
    else setIsAuthorized(true);
  }, [navigate]);

  const operatorName = localStorage.getItem('operator_name') || 'Aniket';

  // --- MODULE LIST ---
  const attacks = [
    { 
      id: 'SQL_INJECTION', 
      title: 'SQL Injection', 
      desc: 'Exploit database vulnerabilities via malicious query manipulation.', 
      icon: <Database className="text-purple-400" />,
      tag: 'DATABASE_SEC',
      path: '/dashboard/sql-injection'
    },
    { 
      id: 'PHISHING', 
      title: 'Phishing Attack', 
      desc: 'Simulate deceptive communication to identify social engineering risks.', 
      icon: <Mail className="text-blue-400" />,
      tag: 'SOCIAL_ENG',
      path: '/dashboard/phishing'
    },
    { 
      id: 'BRUTE_FORCE', 
      title: 'Brute-Force Attack', 
      desc: 'Systematic credential guessing to test password complexity and lockouts.', 
      icon: <Lock className="text-cyan-400" />,
      tag: 'AUTH_TEST',
      path: '/dashboard/brute-force'
    },
    { 
      id: 'DICTIONARY', 
      title: 'Dictionary Attack', 
      desc: 'Automated login attempts using high-probability wordlists and common leaks.', 
      icon: <FileSearch className="text-emerald-400" />,
      tag: 'CRYPTO_ANALYSIS',
      path: '/dashboard/dictionary'
    }
  ];

  const handleLaunchProtocol = () => {
    if (selectedAttack) {
      // Navigates to the specific module route defined in the object
      navigate(selectedAttack.path);
    }
  };

  if (!isAuthorized) return null;

  return (
    <div className="flex h-screen bg-[#020617] text-slate-400 font-sans overflow-hidden selection:bg-cyan-500/30 relative">
      
      {/* SCANLINE EFFECT */}
      <div className="absolute inset-0 pointer-events-none z-50 opacity-[0.03] bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%]"></div>

      {/* --- SIDEBAR --- */}
      <aside className={`bg-[#030712] border-r border-slate-800/40 flex flex-col transition-all duration-500 ease-in-out z-30 ${isSidebarOpen ? 'w-72' : 'w-20'}`}>
        
        <div className="h-20 flex items-center px-4 justify-between shrink-0 overflow-hidden">
          <AnimatePresence mode="wait">
            {isSidebarOpen && (
              <motion.div 
                initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}
                className="flex items-center gap-2 pl-2"
              >
                <Shield className="text-cyan-500" size={16} />
                <h1 className="font-black text-[10px] tracking-[0.25em] text-white uppercase italic">HACK<span className="text-cyan-500">AWARE</span></h1>
              </motion.div>
            )}
          </AnimatePresence>

          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)} 
            className={`p-2.5 hover:bg-slate-800/60 rounded-xl transition-all text-slate-500 hover:text-cyan-400 flex items-center justify-center ${!isSidebarOpen && 'mx-auto'}`}
          >
            {isSidebarOpen ? <ChevronLeft size={18} /> : <Menu size={20} />}
          </button>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-8 overflow-y-auto custom-scrollbar overflow-x-hidden">
          <div>
            <p className={`text-[9px] font-black text-slate-700 uppercase tracking-[0.3em] mb-4 px-4 ${!isSidebarOpen && 'hidden'}`}>Operations</p>
            <div className="space-y-1">
              <SidebarLink icon={<LayoutDashboard size={18}/>} label="Attack Hub" active={activeTab === 'hub'} onClick={() => setActiveTab('hub')} isOpen={isSidebarOpen} />
              <SidebarLink icon={<Terminal size={18}/>} label="System Logs" active={activeTab === 'logs'} onClick={() => setActiveTab('logs')} isOpen={isSidebarOpen} />
            </div>
          </div>

          <div>
            <p className={`text-[9px] font-black text-slate-700 uppercase tracking-[0.3em] mb-4 px-4 ${!isSidebarOpen && 'hidden'}`}>Identity</p>
            <div className="space-y-1">
              <SidebarLink icon={<User size={18}/>} label="Operator Profile" active={activeTab === 'profile'} onClick={() => setActiveTab('profile')} isOpen={isSidebarOpen} />
              <SidebarLink icon={<Settings size={18}/>} label="Config" active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} isOpen={isSidebarOpen} />
            </div>
          </div>
        </nav>

        <div className="p-3 border-t border-slate-800/40">
          <button onClick={() => { localStorage.clear(); navigate('/'); }} className={`flex items-center gap-3 w-full px-3 py-3 text-slate-500 hover:text-red-400 hover:bg-red-500/5 rounded-xl transition-all text-[10px] font-black tracking-widest uppercase ${!isSidebarOpen && 'justify-center'}`}>
            <LogOut size={18} />
            {isSidebarOpen && <span>Terminate Session</span>}
          </button>
        </div>
      </aside>

      {/* --- MAIN CONTENT --- */}
      <main className="flex-1 flex flex-col overflow-y-auto bg-[#020617] scroll-smooth relative">
        
        <header className="h-20 flex items-center justify-between px-8 border-b border-slate-800/30 bg-[#020617]/80 backdrop-blur-xl sticky top-0 z-20 shrink-0">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-900/40 border border-slate-800 rounded-lg">
              <div className="w-1.5 h-1.5 bg-cyan-500 rounded-full animate-pulse shadow-[0_0_8px_#06b6d4]"></div>
              <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-tighter">Virtual_Env_Live</span>
            </div>
            <span className="text-slate-800 hidden md:block">/</span>
            <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest hidden md:block">Main_Hub</span>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3 px-3 py-1.5 bg-slate-900/40 border border-slate-800/50 rounded-lg">
              <Clock className="text-cyan-500" size={12} />
              <span className="text-[10px] font-mono font-medium text-slate-300">{currentTime.toLocaleTimeString()}</span>
            </div>
            <div className="flex items-center gap-3 pl-6 border-l border-slate-800/60">
              <div className="text-right hidden sm:block">
                <p className="text-[11px] font-black text-white uppercase tracking-tight">{operatorName}</p>
                <p className="text-[9px] font-bold text-cyan-600 tracking-tighter uppercase">Root_Access</p>
              </div>
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 flex items-center justify-center font-black text-cyan-400 text-xs shadow-inner">
                {operatorName[0]}
              </div>
            </div>
          </div>
        </header>

        {/* --- DYNAMIC GRID --- */}
        <div className="p-8 lg:p-12 max-w-6xl mx-auto w-full">
          <AnimatePresence mode="wait">
            {activeTab === 'hub' ? (
              <motion.div 
                key="hub" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.4 }}
              >
                <div className="mb-10">
                  <h2 className="text-2xl font-black text-white tracking-tighter uppercase italic">Cyber Attack Hub</h2>
                  <p className="text-[11px] text-slate-600 font-bold uppercase tracking-[0.2em] mt-1">Initialize simulation protocols</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {attacks.map((atk, index) => (
                    <AttackCard key={atk.id} atk={atk} index={index} onClick={() => setSelectedAttack(atk)} />
                  ))}
                </div>
              </motion.div>
            ) : (
              <motion.div 
                key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="py-40 flex flex-col items-center justify-center border border-slate-800/40 rounded-[2.5rem] bg-slate-900/5"
              >
                 <Cpu size={32} className="text-slate-800 mb-4 animate-pulse" />
                 <p className="text-slate-700 font-mono text-[10px] uppercase tracking-[0.4em]">Restricted_Module</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* --- PROTOCOL LAUNCH MODAL --- */}
      <AnimatePresence>
        {selectedAttack && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-[#020617]/95 backdrop-blur-md"
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="w-full max-w-md bg-[#080c17] border border-slate-800 rounded-[2rem] overflow-hidden shadow-2xl"
            >
              <div className="p-10 text-center relative">
                <div className="w-16 h-16 bg-slate-950 border border-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  {React.cloneElement(selectedAttack.icon, { size: 32 })}
                </div>
                <h3 className="text-lg font-black text-white mb-2 uppercase italic tracking-widest">{selectedAttack.title}</h3>
                <p className="text-slate-500 text-[10px] font-mono mb-10 px-6 uppercase tracking-tighter leading-relaxed">
                  Configuring module parameters... <br/> 
                  <span className="text-cyan-600">ID://{selectedAttack.id}_{Math.floor(Math.random()*999)}</span>
                </p>

                <div className="flex flex-col gap-3">
                  <button 
                    onClick={handleLaunchProtocol}
                    className="w-full py-4 bg-cyan-600 text-[#020617] font-black rounded-xl hover:bg-cyan-500 transition-all text-[11px] uppercase tracking-[0.2em] shadow-[0_0_20px_rgba(34,211,238,0.2)]"
                  >
                    Launch Protocol
                  </button>
                  <button onClick={() => setSelectedAttack(null)} className="w-full py-2 text-slate-600 font-bold hover:text-white transition-all text-[10px] uppercase tracking-widest">
                    Abort Session
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// --- SUB-COMPONENTS ---

const SidebarLink = ({ icon, label, active, onClick, isOpen }) => (
  <button 
    onClick={onClick} 
    className={`flex items-center gap-3 w-full px-3 py-3 rounded-xl transition-all relative group ${
      active ? 'text-cyan-400 bg-cyan-500/5' : 'text-slate-600 hover:text-slate-300 hover:bg-slate-800/30'
    } ${!isOpen && 'justify-center'}`}
  >
    {active && (
      <motion.div layoutId="activeTab" className="absolute left-0 w-1 h-5 bg-cyan-500 rounded-r-full" />
    )}
    <div className="shrink-0 group-hover:scale-110 transition-transform">{icon}</div>
    {isOpen && <span className="text-[11px] font-black tracking-widest uppercase">{label}</span>}
    
    {!isOpen && (
      <div className="absolute left-full ml-4 px-2 py-1 bg-slate-800 text-white text-[9px] font-bold rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity uppercase tracking-widest z-50 whitespace-nowrap">
        {label}
      </div>
    )}
  </button>
);

const AttackCard = ({ atk, index, onClick }) => (
  <motion.div 
    initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.05 }}
    whileHover={{ y: -5, borderColor: 'rgba(34, 211, 238, 0.3)' }}
    onClick={onClick} 
    className="group relative bg-slate-900/10 border border-slate-800/40 p-8 rounded-[2rem] cursor-pointer overflow-hidden transition-all duration-300"
  >
    <div className="relative z-10 flex flex-col gap-6">
      <div className="flex justify-between items-start">
        <div className="w-10 h-10 bg-slate-950 border border-slate-800 group-hover:border-cyan-500/30 rounded-xl flex items-center justify-center transition-colors">
          {React.cloneElement(atk.icon, { size: 20 })}
        </div>
        <span className="text-[8px] font-mono font-bold text-slate-700 bg-slate-900/50 border border-slate-800 px-2 py-1 rounded tracking-tighter">
          {atk.tag}
        </span>
      </div>
      <div>
        <h3 className="text-sm font-black text-white mb-2 uppercase italic tracking-wider group-hover:text-cyan-400 transition-colors">{atk.title}</h3>
        <p className="text-[11px] text-slate-500 font-medium leading-relaxed">{atk.desc}</p>
      </div>
      <div className="pt-4 border-t border-slate-800/30 flex items-center justify-between">
        <span className="text-[9px] font-black text-cyan-600 uppercase tracking-widest group-hover:text-cyan-400 transition-colors tracking-[0.2em]">Deploy_Vector</span>
        <ExternalLink size={12} className="text-slate-700 group-hover:text-cyan-500" />
      </div>
    </div>
  </motion.div>
);

export default CyberDashboard;