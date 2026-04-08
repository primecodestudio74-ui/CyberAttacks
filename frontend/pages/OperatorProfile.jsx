import React, { useState, useEffect } from 'react';
import { 
  User, Shield, Terminal, Cpu, 
  Code, Globe, Mail, Activity,
  Clock, Signal
} from 'lucide-react';
import { motion } from 'framer-motion';

const OperatorProfile = () => {
  // 1. Dynamic State for Operator Data
  const [operator, setOperator] = useState({
    name: "Aniket", // Default fallback
    role: "Lead Developer",
    org: "Bit2Byte_Core",
    node: "Mumbai_Node_01",
    email: "aniket@ops.local",
    site: "bit2byte.dev"
  });

  // 2. Dynamic Systems State
  const [systemTime, setSystemTime] = useState(new Date().toLocaleTimeString());
  const [latency, setLatency] = useState(14);
  const [isOnline, setIsOnline] = useState(true);

  // 3. Logic to Fetch Logged-in User
  useEffect(() => {
    // Check localStorage for the name stored during login
    // Change 'operator_name' to whatever key you used in your Login.jsx
    const storedName = localStorage.getItem('operator_name');
    const storedEmail = localStorage.getItem('operator_email');

    if (storedName) {
      setOperator(prev => ({
        ...prev,
        name: storedName,
        // Optional: create a dynamic email based on name if not in storage
        email: storedEmail || `${storedName.toLowerCase().replace(/\s/g, '')}@ops.local`
      }));
    }

    // Interval for Clock and Latency
    const timer = setInterval(() => {
      setSystemTime(new Date().toLocaleTimeString());
      setLatency(Math.floor(Math.random() * (25 - 10 + 1)) + 10);
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto p-6 bg-[#020617] border border-slate-800 rounded-2xl shadow-2xl font-mono text-slate-300"
    >
      {/* TOP DYNAMIC HUD */}
      <div className="flex justify-between items-center mb-6 px-2 text-[10px] text-slate-500 uppercase tracking-[0.2em]">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-2">
            <Clock size={12} className="text-cyan-500" /> {systemTime}
          </span>
          <span className="flex items-center gap-2">
            <Signal size={12} className={latency > 20 ? "text-amber-500" : "text-emerald-500"} /> 
            {latency}ms
          </span>
        </div>
        <span className="text-cyan-900 hidden md:block italic">Encryption: AES-256-GCM</span>
      </div>

      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row items-center gap-8 border-b border-slate-800 pb-8 mb-8">
        <div className="relative cursor-pointer" onClick={() => setIsOnline(!isOnline)}>
          <div className="w-24 h-24 bg-slate-900 border-2 border-cyan-500 rounded-xl flex items-center justify-center text-4xl font-black text-cyan-500 italic shadow-[0_0_15px_rgba(6,182,212,0.3)]">
            {/* Dynamic Initial */}
            {operator.name.charAt(0).toUpperCase()}
          </div>
          <motion.div 
            animate={{ scale: isOnline ? [1, 1.2, 1] : 1 }}
            transition={{ repeat: Infinity, duration: 2 }}
            className={`absolute -bottom-1 -right-1 w-4 h-4 border-2 border-[#020617] rounded-full ${isOnline ? "bg-emerald-500" : "bg-red-500"}`}
          />
        </div>

        <div className="text-center md:text-left flex-1">
          <h1 className="text-3xl font-black text-white uppercase italic tracking-tighter">
            {/* Dynamic Name */}
            {operator.name} <span className="text-cyan-500 text-sm font-mono not-italic tracking-widest ml-2">[{operator.role}]</span>
          </h1>
          <p className="text-[10px] text-slate-500 uppercase tracking-[0.4em] mt-2">
            {operator.org} // {operator.node}
          </p>
        </div>

        <div className="hidden md:block bg-slate-900/50 p-4 border border-slate-800 rounded-lg min-w-[140px]">
           <Activity size={20} className={isOnline ? "text-cyan-500 mb-2 animate-pulse" : "text-slate-700 mb-2"} />
           <p className="text-[9px] text-slate-500 uppercase tracking-tighter">System Status</p>
           <p className={`text-[10px] font-bold uppercase tracking-widest ${isOnline ? "text-emerald-500" : "text-red-500"}`}>
             {isOnline ? "Optimal" : "Offline"}
           </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* BIO / TERMINAL SECTION */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-cyan-500 mb-2">
            <Terminal size={16} />
            <span className="text-xs font-black uppercase tracking-widest italic">Operator_Manifest</span>
          </div>
          <div className="bg-black/50 p-6 border border-slate-800 rounded-xl leading-relaxed text-xs h-full">
            <div className="flex items-center gap-2 mb-4">
               <span className="text-cyan-600 font-bold">root@hackaware:~$</span> 
               <motion.span
                 animate={{ opacity: [1, 0] }}
                 transition={{ repeat: Infinity, duration: 0.8 }}
                 className="w-2 h-4 bg-cyan-500 inline-block"
               />
            </div>
            
            <p className="text-slate-400 mb-6">
              Welcome, <span className="text-white font-bold">{operator.name}</span>. 
              Session established at <span className="text-cyan-500">Mumbai_Node_01</span>. 
              All defensive protocols for HackAware are currently active.
            </p>
            
            <div className="space-y-3 pt-4 border-t border-slate-900">
               <a href={`https://${operator.site}`} target="_blank" rel="noreferrer" className="flex items-center gap-3 text-slate-500 hover:text-cyan-400 transition-all group">
                  <Globe size={14} className="group-hover:rotate-12" /> 
                  <span className="text-[10px] font-bold">{operator.site}</span>
               </a>
               <a href={`mailto:${operator.email}`} className="flex items-center gap-3 text-slate-500 hover:text-cyan-400 transition-all group">
                  <Mail size={14} className="group-hover:translate-x-1" /> 
                  <span className="text-[10px] uppercase font-bold">{operator.email}</span>
               </a>
            </div>
          </div>
        </div>
      </div>

      {/* FOOTER STATUS */}
      <div className="mt-12 pt-4 border-t border-slate-900 flex justify-between items-center opacity-50">
         <div className="flex items-center gap-2">
            <Shield size={12} className="text-cyan-900" />
            <span className="text-[8px] uppercase tracking-widest">Secured by HackAware Protocol</span>
         </div>
         <div className="flex items-center gap-4">
            <span className="text-[8px] uppercase tracking-widest text-cyan-700">Node_ID: 77-41-AF</span>
            <span className="text-[8px] uppercase tracking-widest">v.2.0.4-Stable</span>
         </div>
      </div>
    </motion.div>
  );
};

export default OperatorProfile;