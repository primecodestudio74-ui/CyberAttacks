import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Terminal, ShieldCheck, AlertTriangle, 
  Activity, Database, Globe, Lock, 
  Cpu, Wifi, Search, Trash2, Download
} from 'lucide-react';

const SystemLogs = () => {
  const [logs, setLogs] = useState([]);
  const [filter, setFilter] = useState('ALL');
  const scrollRef = useRef(null);

  // --- LOG GENERATOR LOGIC ---
  const logTemplates = [
    { type: 'INFO', msg: 'System integrity check complete. All nodes green.', icon: <ShieldCheck size={14}/>, color: 'text-emerald-400' },
    { type: 'WARN', msg: 'Multiple failed login attempts detected on Port 8080.', icon: <AlertTriangle size={14}/>, color: 'text-orange-400' },
    { type: 'ERROR', msg: 'Unauthorized SQL query intercepted. Source: 192.168.1.42', icon: <Lock size={14}/>, color: 'text-red-500' },
    { type: 'INFO', msg: 'Database replication synchronized across clusters.', icon: <Database size={14}/>, color: 'text-cyan-400' },
    { type: 'TRACE', msg: 'Incoming packet header analysis initiated...', icon: <Globe size={14}/>, color: 'text-slate-400' },
    { type: 'INFO', msg: 'HackAware Kernel updated to v2.4.0-stable.', icon: <Cpu size={14}/>, color: 'text-purple-400' },
  ];

  useEffect(() => {
    // Initial logs
    const initialLogs = Array.from({ length: 8 }).map(() => ({
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toLocaleTimeString(),
      ...logTemplates[Math.floor(Math.random() * logTemplates.length)]
    }));
    setLogs(initialLogs);

    // Live log simulation
    const interval = setInterval(() => {
      const newLog = {
        id: Math.random().toString(36).substr(2, 9),
        timestamp: new Date().toLocaleTimeString(),
        ...logTemplates[Math.floor(Math.random() * logTemplates.length)]
      };
      setLogs(prev => [...prev.slice(-49), newLog]); // Keep last 50
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  const filteredLogs = filter === 'ALL' ? logs : logs.filter(l => l.type === filter);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }} 
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col h-[calc(100vh-160px)] w-full max-w-6xl mx-auto"
    >
      {/* --- HEADER CONTROLS --- */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-6 p-4 bg-slate-900/40 border border-slate-800 rounded-2xl backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-cyan-500/10 rounded-lg">
            <Terminal className="text-cyan-500" size={20} />
          </div>
          <div>
            <h2 className="text-sm font-black text-white uppercase tracking-widest italic">Live_System_Logs</h2>
            <p className="text-[9px] text-slate-500 font-bold uppercase tracking-[0.2em]">Monitoring HackAware Kernel Output</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {['ALL', 'INFO', 'WARN', 'ERROR'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-1.5 rounded-md text-[9px] font-black uppercase tracking-widest transition-all ${
                filter === f ? 'bg-cyan-600 text-[#020617]' : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {f}
            </button>
          ))}
          <div className="h-6 w-[1px] bg-slate-800 mx-2" />
          <button onClick={() => setLogs([])} className="p-2 text-slate-500 hover:text-red-400 transition-colors">
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      {/* --- TERMINAL WINDOW --- */}
      <div className="flex-1 bg-[#030712]/80 border border-slate-800/60 rounded-[2rem] overflow-hidden flex flex-col shadow-2xl relative">
        {/* Decorative Top Bar */}
        <div className="h-8 bg-slate-900/80 border-b border-slate-800 flex items-center px-6 justify-between">
          <div className="flex gap-1.5">
            <div className="w-2 h-2 rounded-full bg-red-500/50" />
            <div className="w-2 h-2 rounded-full bg-orange-500/50" />
            <div className="w-2 h-2 rounded-full bg-emerald-500/50" />
          </div>
          <span className="text-[9px] font-mono text-slate-600 uppercase tracking-[0.3em]">Runtime_Environment_Console</span>
          <div className="w-10" />
        </div>

        {/* Logs Stream */}
        <div 
          ref={scrollRef}
          className="flex-1 p-6 overflow-y-auto font-mono text-xs custom-scrollbar space-y-2 selection:bg-cyan-500/30"
        >
          <AnimatePresence mode="popLayout">
            {filteredLogs.map((log) => (
              <motion.div
                key={log.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="flex items-start gap-4 p-2 rounded-lg hover:bg-white/[0.02] transition-colors group"
              >
                <span className="text-slate-600 shrink-0 text-[10px] tabular-nums">[{log.timestamp}]</span>
                <span className={`font-bold shrink-0 min-w-[50px] ${log.color}`}>
                  {log.type}
                </span>
                <div className={`shrink-0 mt-0.5 ${log.color}`}>
                  {log.icon}
                </div>
                <span className="text-slate-300 tracking-tight leading-relaxed">
                  {log.msg}
                </span>
              </motion.div>
            ))}
          </AnimatePresence>
          {filteredLogs.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-slate-700 uppercase tracking-widest text-[10px]">
              <Search size={32} className="mb-4 opacity-20" />
              No logs found for filter: {filter}
            </div>
          )}
        </div>

        {/* Bottom Status Bar */}
        <div className="h-10 bg-slate-900/40 border-t border-slate-800 px-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Live_Feed_Active</span>
            </div>
            <span className="text-[9px] font-bold text-slate-700 uppercase">Buffer: {logs.length}/50</span>
          </div>
          <button className="flex items-center gap-2 text-[9px] font-black text-cyan-600 hover:text-cyan-400 transition-colors uppercase tracking-[0.2em]">
            <Download size={12} />
            Export_Dumps
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default SystemLogs;