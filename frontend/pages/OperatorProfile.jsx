import React, { useState } from 'react';
import { 
  User, Shield, Cpu, Zap, Code, 
  Terminal, Globe, Mail, Fingerprint,
  Award, Activity, Database, Server,Wifi,Hash,
} from 'lucide-react';
import { motion } from 'framer-motion';

const OperatorProfile = () => {
  const operatorName = localStorage.getItem('operator_name') || 'Aniket';
  
  // Example stats - can be linked to your backend later
  const stats = [
    { label: 'Clearance', value: 'Level 5 / Root', icon: <Shield size={14} className="text-cyan-500" /> },
    { label: 'Uptime', value: '99.9%', icon: <Activity size={14} className="text-emerald-500" /> },
    { label: 'Node Status', value: 'Active', icon: <Wifi size={14} className="text-blue-500" /> },
    { label: 'Protocol ID', value: 'HA-0407-X', icon: <Hash size={14} className="text-purple-500" /> },
  ];

  const techStack = [
    { name: 'Java', level: 90 },
    { name: 'Node.js', level: 85 },
    { name: 'React', level: 88 },
    { name: 'MongoDB', level: 82 },
    { name: 'CyberSec', level: 75 }
  ];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }} 
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 lg:space-y-8"
    >
      {/* --- HEADER --- */}
      <div className="flex flex-col md:flex-row gap-6 items-start md:items-center justify-between bg-slate-900/10 border border-slate-800/40 p-6 lg:p-10 rounded-[2rem]">
        <div className="flex items-center gap-6">
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>
            <div className="relative w-20 h-20 lg:w-24 lg:h-24 bg-[#080c17] border border-slate-700 rounded-2xl flex items-center justify-center text-3xl font-black text-cyan-400 italic shadow-2xl">
              {operatorName[0]}
            </div>
            <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-cyan-500 border-4 border-[#020617] rounded-full animate-pulse"></div>
          </div>
          
          <div>
            <h2 className="text-2xl lg:text-3xl font-black text-white tracking-tighter uppercase italic">{operatorName}</h2>
            <div className="flex items-center gap-3 mt-2">
              <span className="text-[10px] font-bold text-cyan-600 px-2 py-0.5 border border-cyan-900/50 bg-cyan-500/5 rounded uppercase tracking-widest">Lead Developer</span>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">Bit2Byte_Core</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 w-full md:w-auto">
          {stats.map((stat, i) => (
            <div key={i} className="px-4 py-3 bg-slate-900/20 border border-slate-800/50 rounded-xl min-w-[140px]">
              <div className="flex items-center gap-2 mb-1">
                {stat.icon}
                <span className="text-[9px] font-black text-slate-600 uppercase tracking-tighter">{stat.label}</span>
              </div>
              <p className="text-[11px] font-mono text-slate-300 font-bold">{stat.value}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* --- BIO / TERMINAL --- */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-[#080c17] border border-slate-800 rounded-[2rem] overflow-hidden flex flex-col h-full">
            <div className="bg-slate-900/40 px-6 py-3 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Terminal size={14} className="text-cyan-500" />
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Operator_Manifest.exe</span>
              </div>
              <div className="flex gap-1.5">
                <div className="w-2 h-2 rounded-full bg-slate-800"></div>
                <div className="w-2 h-2 rounded-full bg-slate-800"></div>
                <div className="w-2 h-2 rounded-full bg-slate-800"></div>
              </div>
            </div>
            <div className="p-6 lg:p-8 font-mono text-[12px] leading-relaxed text-slate-400">
              <p className="mb-4"><span className="text-cyan-600">root@hackaware:~$</span> cat identity_brief.txt</p>
              <p className="text-slate-300">
                Specializing in full-stack architecture and cybersecurity research. 
                Currently focused on the <span className="text-cyan-500">HackAware</span> framework, 
                demonstrating vulnerability vectors and defensive mitigation strategies.
              </p>
              <p className="mt-4 text-slate-500 italic">
                // System proficiency: Java, Node.js, React, TailwindCSS. <br/>
                // Research focus: SQLi, Phishing simulation, Brute-force resilience.
              </p>
              <div className="mt-6 flex items-center gap-4">
                 <div className="flex items-center gap-2 text-cyan-700">
                    <Globe size={14} />
                    <span className="hover:text-cyan-400 cursor-pointer transition-colors">bit2byte.dev</span>
                 </div>
                 <div className="flex items-center gap-2 text-cyan-700">
                    <Mail size={14} />
                    <span className="hover:text-cyan-400 cursor-pointer transition-colors">aniket@op.local</span>
                 </div>
              </div>
            </div>
          </div>
        </div>

        {/* --- TECH SKILLS GRID --- */}
        <div className="bg-slate-900/10 border border-slate-800/40 p-6 rounded-[2rem]">
          <h3 className="text-[11px] font-black text-white uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
            <Cpu size={14} className="text-cyan-500" /> System Proficiency
          </h3>
          <div className="space-y-5">
            {techStack.map((tech, i) => (
              <div key={i}>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{tech.name}</span>
                  <span className="text-[9px] font-mono text-cyan-600">{tech.level}%</span>
                </div>
                <div className="h-1 bg-slate-900 rounded-full overflow-hidden border border-slate-800/50">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${tech.level}%` }}
                    transition={{ duration: 1, delay: i * 0.1 }}
                    className="h-full bg-gradient-to-r from-cyan-600 to-blue-500 shadow-[0_0_8px_rgba(6,182,212,0.4)]"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default OperatorProfile;