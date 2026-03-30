import React, { useState, useEffect } from 'react';
import { Shield, Lock, Mail, User, Layout, Activity, ShieldAlert, Globe, LogOut, Terminal, Cpu } from 'lucide-react';

// --- MAIN COMPONENT ---
const AuthPage = () => {
  const [view, setView] = useState('login'); // 'login', 'register', or 'dashboard'

  // Helper to switch views
  const navigateTo = (newView) => setView(newView);

  return (
    <div className="min-h-screen bg-[#0a0f1a] text-gray-100 font-sans selection:bg-cyan-500/30">
      {view === 'dashboard' ? (
        <CyberDashboard onLogout={() => navigateTo('login')} />
      ) : (
        <div className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden">
          {/* Background Decorative Elements */}
          <div className="absolute inset-0 opacity-20 pointer-events-none">
            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,#1e293b_0%,transparent_50%)]" />
            <div className="grid-bg w-full h-full opacity-10" />
          </div>

          <div className="w-full max-w-md z-10">
            {/* Header Toggle */}
            <div className="flex justify-center gap-12 mb-8 text-sm font-bold tracking-widest uppercase">
              <button 
                onClick={() => setView('login')}
                className={`transition-all duration-300 ${view === 'login' ? 'text-cyan-400 border-b-2 border-cyan-400' : 'text-gray-500 hover:text-gray-300'}`}
              >
                Login
              </button>
              <button 
                onClick={() => setView('register')}
                className={`transition-all duration-300 ${view === 'register' ? 'text-cyan-400 border-b-2 border-cyan-400' : 'text-gray-500 hover:text-gray-300'}`}
              >
                Register
              </button>
            </div>

            {view === 'login' ? (
              <LoginForm onLogin={() => navigateTo('dashboard')} onSwitch={() => setView('register')} />
            ) : (
              <RegisterForm onRegister={() => navigateTo('dashboard')} onSwitch={() => setView('login')} />
            )}
          </div>
        </div>
      )}

      <style jsx>{`
        .grid-bg {
          background-image: linear-gradient(to right, #1e293b 1px, transparent 1px),
                            linear-gradient(to bottom, #1e293b 1px, transparent 1px);
          background-size: 40px 40px;
        }
      `}</style>
    </div>
  );
};

// --- SHARED COMPONENTS ---
const InputField = ({ label, type = "text", placeholder, icon: Icon }) => (
  <div className="mb-4">
    <label className="block text-xs font-semibold mb-1 text-gray-400 uppercase tracking-wider">{label}</label>
    <div className="relative">
      {Icon && <Icon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4" />}
      <input 
        type={type} 
        className={`w-full bg-black/40 border border-gray-700 rounded-sm py-2 ${Icon ? 'pl-10' : 'px-3'} pr-3 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all text-sm`}
        placeholder={placeholder}
      />
    </div>
  </div>
);

// --- LOGIN FORM ---
const LoginForm = ({ onLogin, onSwitch }) => {
  const handleSubmit = (e) => {
    e.preventDefault();
    onLogin();
  };

  return (
    <div className="bg-[#0d1525]/80 border border-gray-800 p-8 rounded-lg shadow-2xl backdrop-blur-md animate-in fade-in zoom-in duration-300">
      <div className="flex flex-col items-center mb-6">
        <div className="flex items-center gap-2 mb-2">
          <Shield className="text-cyan-500 w-8 h-8" />
          <h2 className="text-2xl font-black tracking-tighter text-white uppercase italic">Cyberattacks</h2>
        </div>
        <p className="text-gray-400 text-sm">SECURE ACCESS GATEWAY</p>
      </div>

      <form onSubmit={handleSubmit}>
        <InputField label="Identity (Email)" type="email" icon={Mail} />
        <InputField label="Access Key" type="password" icon={Lock} />
        
        <div className="flex justify-between items-center text-xs mb-6 text-gray-400">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" className="accent-cyan-500" /> Keep Session Active
          </label>
          <a href="#" className="hover:text-cyan-400 transition-colors">Recover Key?</a>
        </div>

        <button type="submit" className="w-full bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 text-white font-bold py-2 rounded shadow-[0_0_15px_rgba(6,182,212,0.4)] transition-all transform active:scale-95 mb-4 uppercase tracking-widest">
          Initialize Login
        </button>
      </form>
      
      <p className="text-center text-xs text-gray-500">
        New operator? <span onClick={onSwitch} className="text-cyan-400 cursor-pointer hover:underline">Apply for Access</span>
      </p>
    </div>
  );
};

// --- REGISTER FORM ---
const RegisterForm = ({ onRegister, onSwitch }) => {
  const handleSubmit = (e) => {
    e.preventDefault();
    onRegister();
  };

  return (
    <div className="bg-[#0d1525]/80 border border-gray-800 p-8 rounded-lg shadow-2xl backdrop-blur-md animate-in fade-in zoom-in duration-300">
      <h2 className="text-xl font-bold text-center mb-6 text-white uppercase tracking-widest">Operator Registration</h2>
      
      <form onSubmit={handleSubmit}>
        <InputField label="Full Name" icon={User} />
        <InputField label="Email Address" type="email" icon={Mail} />
        <InputField label="Password" type="password" icon={Lock} />
        <InputField label="Confirm Password" type="password" icon={Shield} />

        <button type="submit" className="w-full bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 text-white font-bold py-2 rounded shadow-[0_0_15px_rgba(6,182,212,0.4)] transition-all transform active:scale-95 mt-4 mb-4 uppercase tracking-widest">
          Create Identity
        </button>
      </form>

      <p className="text-center text-xs text-gray-500">
        Existing identity? <span onClick={onSwitch} className="text-cyan-400 cursor-pointer hover:underline">Return to Login</span>
      </p>
    </div>
  );
};

// --- DASHBOARD PAGE ---
const CyberDashboard = ({ onLogout }) => {
  const [logs, setLogs] = useState([
    "[10:42:01] System handshake initialized...",
    "[10:42:05] Kernel verification: SUCCESS",
    "[10:43:12] Warning: Detected brute force attempt from IP: 142.250.190.46",
  ]);

  return (
    <div className="min-h-screen flex flex-col p-6 animate-in fade-in duration-500">
      {/* Top Navigation */}
      <header className="flex justify-between items-center mb-8 border-b border-gray-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-cyan-500/10 rounded">
            <Shield className="text-cyan-500 w-6 h-6" />
          </div>
          <div>
            <h1 className="font-black text-xl tracking-tighter uppercase italic">Cyber_Dash</h1>
            <p className="text-[10px] text-cyan-500 font-mono tracking-widest">SYSTEM STATUS: OPTIMAL</p>
          </div>
        </div>
        
        <button 
          onClick={onLogout}
          className="flex items-center gap-2 text-xs font-bold border border-red-500/30 text-red-400 px-4 py-2 rounded hover:bg-red-500/10 transition-all group"
        >
          <LogOut size={14} className="group-hover:-translate-x-1 transition-transform" />
          TERMINATE SESSION
        </button>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <StatTile icon={<Activity />} label="Network Traffic" value="4.2 GB/s" color="text-cyan-400" />
        <StatTile icon={<ShieldAlert />} label="Threats Neutered" value="142" color="text-red-400" />
        <StatTile icon={<Cpu />} label="Processor Load" value="32%" color="text-purple-400" />
        <StatTile icon={<Globe />} label="Active Nodes" value="8" color="text-green-400" />
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-grow">
        <div className="lg:col-span-2 bg-[#0d1525] border border-gray-800 rounded-lg p-6 relative overflow-hidden">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-sm font-bold uppercase tracking-widest flex items-center gap-2">
              <Terminal size={16} className="text-cyan-500" /> 
              Live Threat Intelligence
            </h3>
            <span className="text-[10px] bg-cyan-500/20 text-cyan-400 px-2 py-0.5 rounded animate-pulse">LIVE FEED</span>
          </div>
          
          <div className="font-mono text-sm space-y-2 text-gray-400">
            {logs.map((log, i) => (
              <div key={i} className="border-l-2 border-gray-800 pl-3 py-1 hover:border-cyan-500 transition-colors">
                {log}
              </div>
            ))}
            <div className="animate-pulse text-cyan-500">_</div>
          </div>
        </div>

        <div className="bg-[#0d1525] border border-gray-800 rounded-lg p-6">
          <h3 className="text-sm font-bold uppercase tracking-widest mb-6">Security Protocols</h3>
          <ul className="space-y-4">
            <ProtocolItem label="Firewall Status" active />
            <ProtocolItem label="End-to-End Encryption" active />
            <ProtocolItem label="Intrusion Detection" active />
            <ProtocolItem label="Quantum Shield" active={false} />
          </ul>
        </div>
      </div>
    </div>
  );
};

const StatTile = ({ icon, label, value, color }) => (
  <div className="bg-[#0d1525] border border-gray-800 p-5 rounded-lg flex items-center gap-4 hover:border-gray-600 transition-colors">
    <div className={`p-3 bg-gray-900 rounded-lg ${color}`}>{icon}</div>
    <div>
      <p className="text-[10px] text-gray-500 uppercase font-bold tracking-tighter">{label}</p>
      <p className={`text-xl font-black ${color}`}>{value}</p>
    </div>
  </div>
);

const ProtocolItem = ({ label, active }) => (
  <div className="flex justify-between items-center p-3 bg-black/20 border border-gray-800 rounded">
    <span className="text-xs text-gray-300 font-medium">{label}</span>
    <div className={`h-2 w-2 rounded-full ${active ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 'bg-red-500 opacity-30'}`} />
  </div>
);

export default AuthPage;