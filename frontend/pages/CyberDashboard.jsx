import React, { useState, useEffect } from 'react';
import { 
  Shield, LogOut, LayoutDashboard, Lock, Mail, 
  Database, Terminal, Clock, ExternalLink, ChevronLeft, FileSearch 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

const CyberDashboard = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [selectedAttack, setSelectedAttack] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const navigate = useNavigate();

  // Set Identity to Shruti
  const operatorName = "Shruti"; 

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Terminate Session Working Logic
  const handleTerminateSession = () => {
    // 1. Wipe all security tokens and operator data
    localStorage.removeItem('operator_token');
    localStorage.removeItem('token');
    localStorage.removeItem('operator_name');
    
    // 2. Move to login page and replace history
    navigate('/', { replace: true });
  };

  const attacks = [
    { 
      id: 'SQL_I', 
      title: 'SQL Injection', 
      desc: 'Exploit database vulnerabilities via query manipulation.', 
      icon: <Database className="text-purple-400" />, 
      tag: 'DB_SEC', 
      path: '/dashboard/sql-injection' 
    },
    { 
      id: 'BRUTE', 
      title: 'Brute-Force', 
      desc: 'Automated credential guessing and auth bypass.', 
      icon: <Lock className="text-cyan-400" />, 
      tag: 'AUTH_SEC', 
      path: '/dashboard/brute-force' 
    },
    { 
      id: 'PHISH', 
      title: 'Phishing', 
      desc: 'Social engineering via deceptive communication.', 
      icon: <Mail className="text-blue-400" />, 
      tag: 'SOCIAL', 
      path: '/dashboard/phishing' 
    },
    { 
      id: 'DICT', 
      title: 'Dictionary', 
      desc: 'Wordlist-based cryptographic analysis.', 
      icon: <FileSearch className="text-emerald-400" />, 
      tag: 'CRYPTO', 
      path: '/dashboard/dictionary' 
    }
  ];

  return (
    <div className="flex h-screen bg-[#020617] text-slate-400 font-sans overflow-hidden">
      
      {/* SIDEBAR */}
      <aside className={`bg-[#030712] border-r border-slate-800/40 flex flex-col z-[100] h-full transition-all duration-300 ${isSidebarOpen ? 'w-72' : 'w-24'}`}>
        <div className="h-24 flex items-center px-6 justify-between">
          <div className="flex items-center gap-3 min-w-max">
            <div className="w-10 h-10 bg-cyan-600 rounded-xl flex items-center justify-center text-white font-black italic shadow-[0_0_20px_rgba(8,145,178,0.3)] shrink-0">S</div>
            {isSidebarOpen && (
              <h1 className="font-black text-xs tracking-widest text-white uppercase italic">
                HACK<span className="text-cyan-500">AWARE</span>
              </h1>
            )}
          </div>
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-1.5 hover:bg-slate-800 rounded-lg lg:hidden text-slate-500">
            <ChevronLeft size={18} className={!isSidebarOpen ? "rotate-180" : ""} />
          </button>
        </div>

        <nav className="flex-1 px-4 space-y-2">
          <button className="flex items-center gap-4 w-full p-4 bg-cyan-500/5 text-cyan-400 rounded-2xl border border-cyan-500/10 min-w-max">
            <LayoutDashboard size={20} className="shrink-0"/> 
            {isSidebarOpen && <span className="text-[10px] font-black uppercase tracking-[0.2em]">Operations</span>}
          </button>
          <button className="flex items-center gap-4 w-full p-4 text-slate-600 hover:text-slate-300 transition-all min-w-max">
            <Terminal size={20} className="shrink-0"/> 
            {isSidebarOpen && <span className="text-[10px] font-black uppercase tracking-[0.2em]">Console</span>}
          </button>
        </nav>

        <div className="p-8 border-t border-slate-800/40 mt-auto">
          <button 
            onClick={handleTerminateSession} 
            className="flex items-center gap-4 w-full px-4 py-3 text-slate-500 hover:text-red-500 hover:bg-red-500/5 border border-transparent hover:border-red-500/20 rounded-xl transition-all uppercase text-[10px] font-black tracking-tighter group min-w-max"
          >
            <LogOut size={18} className="shrink-0 group-hover:translate-x-1 transition-transform" /> 
            {isSidebarOpen && <span>Terminate Session</span>}
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 flex flex-col bg-[#020617] overflow-y-auto">
        <header className="h-20 flex items-center justify-between px-10 border-b border-slate-800/30 backdrop-blur-md sticky top-0 z-50">
          <div className="flex items-center gap-4">
             <div className="w-2 h-2 bg-cyan-500 rounded-full animate-pulse shadow-[0_0_10px_#06b6d4]" />
             <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">Active_Node: Shruti_S7</span>
          </div>
          <div className="flex items-center gap-6">
            <div className="hidden md:flex items-center gap-2 text-[10px] font-mono text-slate-500">
              <Clock size={14} className="text-cyan-500" /> {currentTime.toLocaleTimeString()}
            </div>
            <div className="flex items-center gap-4 pl-6 border-l border-slate-800">
              <div className="text-right">
                <p className="text-[11px] font-black text-white uppercase">{operatorName}</p>
                <p className="text-[8px] text-cyan-600 font-bold uppercase">Root_Level</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center font-black text-cyan-400">S</div>
            </div>
          </div>
        </header>

        <div className="p-12 max-w-6xl mx-auto w-full">
          <div className="mb-12">
            <h2 className="text-3xl font-black text-white uppercase italic tracking-tighter">Mission Protocols</h2>
            <p className="text-[10px] text-slate-600 font-mono mt-1 uppercase tracking-widest">Select Target Vector</p>
          </div>
          
          {/* 2 Attacks Per Row Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {attacks.map((atk) => (
              <div key={atk.id} onClick={() => setSelectedAttack(atk)} className="bg-slate-900/10 border border-slate-800 p-8 rounded-[2.5rem] hover:border-cyan-500/50 transition-all cursor-pointer group relative overflow-hidden">
                <div className="mb-8 flex justify-between">
                  <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 group-hover:text-cyan-400 transition-colors">
                    {atk.icon}
                  </div>
                  <span className="text-[9px] font-mono font-bold text-slate-600 bg-slate-900/50 border border-slate-800 px-3 py-1 rounded-full uppercase tracking-tighter">{atk.tag}</span>
                </div>
                <h3 className="text-white font-black uppercase text-base mb-3 italic tracking-widest">{atk.title}</h3>
                <p className="text-[11px] text-slate-500 leading-relaxed mb-10">{atk.desc}</p>
                
                {/* Permanent Deploy Protocol Footer */}
                <div className="pt-6 border-t border-slate-800/60 flex justify-between items-center">
                   <span className="text-[10px] font-black text-cyan-600 uppercase tracking-[0.2em]">Execute_Protocol</span>
                   <ExternalLink size={14} className="text-slate-700 group-hover:text-cyan-500" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* LAUNCH MODAL */}
      <AnimatePresence>
        {selectedAttack && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[200] bg-black/95 backdrop-blur-md flex items-center justify-center p-6">
            <div className="w-full max-w-sm bg-slate-950 border border-slate-800 p-10 rounded-[3rem] text-center shadow-2xl">
               <div className="w-20 h-20 bg-slate-900 border border-slate-800 rounded-[2rem] flex items-center justify-center mx-auto mb-8 text-cyan-500 shadow-inner">{selectedAttack.icon}</div>
               <h3 className="text-white font-black uppercase italic tracking-[0.2em] mb-2">{selectedAttack.title}</h3>
               <p className="text-[10px] text-slate-600 font-mono mb-10 uppercase tracking-tighter italic">Initializing Vector_{selectedAttack.id}</p>
               <button onClick={() => navigate(selectedAttack.path)} className="w-full py-5 bg-cyan-600 text-black font-black rounded-2xl uppercase text-[11px] tracking-widest shadow-[0_10px_30px_rgba(8,145,178,0.4)] hover:bg-cyan-500 transition-all">Launch Protocol</button>
               <button onClick={() => setSelectedAttack(null)} className="mt-6 text-[10px] text-slate-500 font-bold uppercase tracking-widest hover:text-white transition-colors">Abort</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CyberDashboard;
