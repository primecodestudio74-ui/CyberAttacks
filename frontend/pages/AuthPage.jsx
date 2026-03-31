import React, { useState, useEffect } from 'react';
import { Shield, Lock, Mail, User, Activity, ShieldAlert, Globe, LogOut, Terminal, Cpu, Zap } from 'lucide-react';

// --- 1. TYPEWRITER ENGINE (Cycling Mottos) ---
const Typewriter = ({ sequences, speed = 80, delay = 2500 }) => {
  const [text, setText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [loopIndex, setLoopIndex] = useState(0);
  const [typingSpeed, setTypingSpeed] = useState(speed);

  useEffect(() => {
    const handleTyping = () => {
      const currentFullText = sequences[loopIndex % sequences.length];
      
      if (isDeleting) {
        setText(currentFullText.substring(0, text.length - 1));
        setTypingSpeed(speed / 2);
      } else {
        setText(currentFullText.substring(0, text.length + 1));
        setTypingSpeed(speed);
      }

      if (!isDeleting && text === currentFullText) {
        setTimeout(() => setIsDeleting(true), delay);
      } else if (isDeleting && text === '') {
        setIsDeleting(false);
        setLoopIndex(loopIndex + 1);
      }
    };

    const timer = setTimeout(handleTyping, typingSpeed);
    return () => clearTimeout(timer);
  }, [text, isDeleting, loopIndex, sequences, speed, delay, typingSpeed]);

  return (
    <div className="font-mono text-cyan-500 tracking-[0.15em] text-[10px] md:text-[11px] uppercase flex items-center justify-center gap-2">
      <span className="opacity-40 text-white">[STATUS]:</span>
      <span className="text-cyan-400 drop-shadow-[0_0_5px_rgba(6,182,212,0.5)]">
        {text}
      </span>
      <span className="w-1.5 h-3.5 bg-cyan-500 animate-pulse"></span>
    </div>
  );
};

// --- 2. MAIN PAGE COMPONENT ---
const AuthPage = () => {
  const [view, setView] = useState('login'); 
  const [operator, setOperator] = useState(null);
  const [loading, setLoading] = useState(true);

  const mottos = [
    "HackAware Cyber Security Platform",
    "Simulate Attack | Learn Defense",
    "Stay Aware, Stay Secure",
    "Terminal Handshake Initialized",
    "Vulnerability Assessment Active"
  ];

  // Persistence Logic
  useEffect(() => {
    const savedToken = localStorage.getItem('operator_token');
    const savedName = localStorage.getItem('operator_name');
    if (savedToken && savedName) {
      setOperator({ fullName: savedName, token: savedToken });
      setView('dashboard');
    }
    setLoading(false);
  }, []);

  const handleAuthSuccess = (data) => {
    localStorage.setItem('operator_token', data.token);
    localStorage.setItem('operator_name', data.fullName);
    setOperator(data);
    setView('dashboard');
  };

  const handleLogout = () => {
    localStorage.removeItem('operator_token');
    localStorage.removeItem('operator_name');
    setOperator(null);
    setView('login');
  };

  if (loading) return (
    <div className="min-h-screen bg-[#0a0f1a] flex items-center justify-center font-mono text-cyan-500 animate-pulse">
      LOADING_CORE_SYSTEMS...
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0a0f1a] text-gray-100 font-sans selection:bg-cyan-500/30 overflow-x-hidden">
      {view === 'dashboard' ? (
        <CyberDashboard operator={operator} onLogout={handleLogout} />
      ) : (
        <div className="min-h-screen flex flex-col items-center justify-center p-4 relative">
          
          {/* Background Grid Decoration */}
          <div className="absolute inset-0 opacity-10 pointer-events-none">
            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,#1e293b_0%,transparent_50%)]" />
            <div className="grid-bg w-full h-full" />
          </div>

          <div className="w-full max-w-md z-10">
            {/* Branding Header */}
            <div className="text-center mb-8">
              <div className="flex justify-center mb-4">
                <div className="p-3 bg-cyan-500/10 border border-cyan-500/30 rounded-xl">
                  <Shield className="text-cyan-500 w-10 h-10 drop-shadow-[0_0_10px_rgba(6,182,212,0.4)]" />
                </div>
              </div>
              <h1 className="text-4xl font-black italic tracking-tighter uppercase mb-4">
                HACK<span className="text-cyan-500">AWARE</span>
              </h1>
              
              {/* Motto Typewriter Section */}
              <div className="h-10 flex items-center justify-center border-y border-white/5 bg-white/[0.01] mb-8">
                <Typewriter sequences={mottos} />
              </div>
            </div>

            {/* View Toggle */}
            <div className="flex justify-center gap-12 mb-8 text-xs font-bold tracking-[0.2em] uppercase">
              <button 
                onClick={() => setView('login')}
                className={`transition-all duration-300 ${view === 'login' ? 'text-cyan-400 border-b-2 border-cyan-400 pb-1' : 'text-gray-500 hover:text-gray-300'}`}
              >ACCESS_GATE</button>
              <button 
                onClick={() => setView('register')}
                className={`transition-all duration-300 ${view === 'register' ? 'text-cyan-400 border-b-2 border-cyan-400 pb-1' : 'text-gray-500 hover:text-gray-300'}`}
              >NEW_IDENTITY</button>
            </div>

            {/* Forms */}
            {view === 'login' ? (
              <LoginForm onLogin={handleAuthSuccess} />
            ) : (
              <RegisterForm onRegister={handleAuthSuccess} />
            )}

            {/* Metadata Footer */}
            <div className="mt-4 flex justify-between items-center px-2 font-mono text-[8px] text-gray-600 uppercase tracking-widest">
              <span>DB_STABLE_V2</span>
              <span>NODE: MUMBAI_EDGE_01</span>
              <span>AES_256_ACTIVE</span>
            </div>
          </div>
        </div>
      )}

      <style>{`
  .grid-bg {
    background-image: linear-gradient(to right, #1e293b 1px, transparent 1px),
                      linear-gradient(to bottom, #1e293b 1px, transparent 1px);
    background-size: 40px 40px;
  }
`}</style> ✅
    </div>
  );
};

// --- 3. SUB-COMPONENTS (Forms & Dash) ---

const InputField = ({ label, type = "text", icon: Icon, onChange }) => (
  <div className="mb-4">
    <label className="block text-[10px] font-bold mb-1 text-gray-500 uppercase tracking-widest">{label}</label>
    <div className="relative">
      {Icon && <Icon className="absolute left-3 top-1/2 -translate-y-1/2 text-cyan-500/50 w-4 h-4" />}
      <input 
        type={type} 
        onChange={onChange}
        required
        className="w-full bg-black/60 border border-gray-800 rounded-sm py-2.5 pl-10 pr-3 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20 transition-all text-sm font-mono text-cyan-50"
      />
    </div>
  </div>
);

const LoginForm = ({ onLogin }) => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [status, setStatus] = useState({ type: '', msg: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus({ type: 'info', msg: 'AUTHENTICATING...' });
    try {
      const res = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (res.ok) onLogin(data);
      else setStatus({ type: 'error', msg: data.message || 'DENIED' });
    } catch (err) {
      setStatus({ type: 'error', msg: 'GATEWAY_TIMEOUT' });
    }
  };

  return (
    <div className="bg-[#0d1525]/90 border border-gray-800 p-8 rounded-lg shadow-2xl backdrop-blur-md animate-in fade-in zoom-in duration-500">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Operator Login</h2>
        <span className="text-[9px] text-red-500 font-bold border border-red-500/20 px-2 py-0.5 rounded bg-red-500/5 animate-pulse">LOCKED</span>
      </div>

      {status.msg && (
        <div className={`mb-4 p-2 text-[10px] border font-mono ${status.type === 'error' ? 'border-red-500/40 text-red-400 bg-red-900/10' : 'border-cyan-500/40 text-cyan-400 bg-cyan-900/10'}`}>
          {status.msg}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <InputField label="Identity_Email" type="email" icon={Mail} onChange={(e) => setFormData({...formData, email: e.target.value})} />
        <InputField label="Secure_Passphrase" type="password" icon={Lock} onChange={(e) => setFormData({...formData, password: e.target.value})} />
        <button type="submit" className="w-full bg-gradient-to-r from-cyan-700 to-cyan-500 hover:from-cyan-600 hover:to-cyan-400 text-white font-bold py-3 rounded shadow-[0_0_20px_rgba(6,182,212,0.3)] transition-all uppercase tracking-widest text-[10px]">
          Grant_Access
        </button>
      </form>
    </div>
  );
};

const RegisterForm = ({ onRegister }) => {
  const [formData, setFormData] = useState({ fullName: '', email: '', password: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('http://localhost:5000/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (res.ok) onRegister(data);
      else alert(data.message);
    } catch (err) { alert("CONNECTION_FAILURE"); }
  };

  return (
    <div className="bg-[#0d1525]/90 border border-gray-800 p-8 rounded-lg shadow-2xl backdrop-blur-md animate-in fade-in zoom-in duration-500">
      <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-6 text-center">New Operator Registration</h2>
      <form onSubmit={handleSubmit}>
        <InputField label="Full_Legal_Name" icon={User} onChange={(e) => setFormData({...formData, fullName: e.target.value})} />
        <InputField label="Designated_Email" type="email" icon={Mail} onChange={(e) => setFormData({...formData, email: e.target.value})} />
        <InputField label="New_Passphrase" type="password" icon={Lock} onChange={(e) => setFormData({...formData, password: e.target.value})} />
        <button type="submit" className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-3 rounded mt-2 uppercase tracking-widest text-[10px]">
          Initialize_Identity
        </button>
      </form>
    </div>
  );
};

const CyberDashboard = ({ operator, onLogout }) => {
  const [time, setTime] = useState(new Date().toLocaleTimeString());
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date().toLocaleTimeString()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen flex flex-col p-6 animate-in fade-in duration-700">
      <header className="flex justify-between items-center mb-8 border-b border-gray-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-cyan-500/10 rounded border border-cyan-500/20 shadow-[0_0_15px_rgba(6,182,212,0.1)]">
            <Shield className="text-cyan-500 w-6 h-6" />
          </div>
          <div>
            <h1 className="font-black text-xl tracking-tighter uppercase italic">Cyber_Dash</h1>
            <p className="text-[10px] text-green-500 font-mono tracking-widest flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" /> 
              OP: {operator?.fullName?.toUpperCase()} | {time}
            </p>
          </div>
        </div>
        <button onClick={onLogout} className="text-[9px] font-black border border-red-500/30 text-red-400 px-4 py-2 rounded hover:bg-red-500/10 flex items-center gap-2 tracking-[0.2em] transition-all">
          <LogOut size={12} /> TERMINATE_SESSION
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <StatTile icon={<Activity />} label="Uplink Traffic" value="4.2 GB/s" color="text-cyan-400" />
        <StatTile icon={<ShieldAlert />} label="Threats_Blocked" value="1,242" color="text-red-400" />
        <StatTile icon={<Cpu />} label="Kernel_Load" value="14%" color="text-purple-400" />
        <StatTile icon={<Globe />} label="Relay_Nodes" value="12" color="text-green-400" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-grow">
        <div className="lg:col-span-2 bg-[#0d1525] border border-gray-800 rounded-lg p-6 relative">
          <h3 className="text-[10px] font-black uppercase tracking-[0.3em] flex items-center gap-2 mb-6 text-cyan-500">
            <Terminal size={14} /> LIVE_THREAT_INTEL
          </h3>
          <div className="font-mono text-[11px] space-y-3 text-gray-400">
            <div className="border-l-2 border-green-500 pl-3 py-1 bg-green-500/5">[{time}] Secure connection established. Welcome back, Operator.</div>
            <div className="border-l-2 border-gray-800 pl-3 py-1">[{time}] Node 12 reports stable packet flow.</div>
            <div className="border-l-2 border-red-500 pl-3 py-1 bg-red-500/5 text-red-400">[{time}] ALERT: Brute force attempt detected from IP 192.x.x.42</div>
            <div className="animate-pulse text-cyan-500 mt-4">_</div>
          </div>
        </div>
        
        <div className="bg-[#0d1525] border border-gray-800 rounded-lg p-6">
          <h3 className="text-[10px] font-black uppercase tracking-[0.3em] mb-6 text-gray-500">System_Protocols</h3>
          <div className="space-y-3">
             <ProtocolItem label="Firewall_Active" active />
             <ProtocolItem label="Quantum_Encryption" active />
             <ProtocolItem label="Neural_Filter" active />
             <ProtocolItem label="Auto_Countermeasure" active={false} />
          </div>
        </div>
      </div>
    </div>
  );
};

const StatTile = ({ icon, label, value, color }) => (
  <div className="bg-[#0d1525] border border-gray-800 p-5 rounded-lg flex items-center gap-4 hover:border-cyan-500/30 transition-all group cursor-default">
    <div className={`p-3 bg-gray-900 rounded-lg ${color} group-hover:shadow-[0_0_15px_rgba(0,0,0,0.5)] transition-all`}>{icon}</div>
    <div>
      <p className="text-[9px] text-gray-500 uppercase font-bold tracking-widest">{label}</p>
      <p className={`text-xl font-black tracking-tight ${color}`}>{value}</p>
    </div>
  </div>
);

const ProtocolItem = ({ label, active }) => (
  <div className="flex justify-between items-center p-3 bg-black/40 border border-gray-800 rounded">
    <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">{label}</span>
    <div className={`h-2 w-2 rounded-full ${active ? 'bg-green-500 shadow-[0_0_10px_#22c55e]' : 'bg-red-900 opacity-30'}`} />
  </div>
);

export default AuthPage;