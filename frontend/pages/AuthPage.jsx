import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Lock, Mail, User } from 'lucide-react';

// --- 1. TYPEWRITER ENGINE ---
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
      <span className="text-cyan-400 drop-shadow-[0_0_5px_rgba(6,182,212,0.5)]">{text}</span>
      <span className="w-1.5 h-3.5 bg-cyan-500 animate-pulse"></span>
    </div>
  );
};

// --- 2. MAIN AUTH PAGE ---
const AuthPage = () => {
  const [view, setView] = useState('login'); 
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const mottos = [
    "HackAware Cyber Security Platform",
    "Simulate Attack | Learn Defense",
    "Stay Aware, Stay Secure",
    "Terminal Handshake Initialized",
    "Vulnerability Assessment Active"
  ];

  useEffect(() => {
    const savedToken = localStorage.getItem('operator_token');
    if (savedToken) {
      navigate('/dashboard');
    }
    setLoading(false);
  }, [navigate]);

  const handleAuthSuccess = (data) => {
    localStorage.setItem('operator_token', data.token);
    localStorage.setItem('operator_name', data.fullName);
    navigate('/dashboard');
  };

  if (loading) return (
    <div className="min-h-screen bg-[#0a0f1a] flex items-center justify-center font-mono text-cyan-500 animate-pulse">
      LOADING_CORE_SYSTEMS...
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0a0f1a] text-gray-100 font-sans selection:bg-cyan-500/30 overflow-x-hidden relative">
      
      {/* Video Background Layer */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <video autoPlay muted loop playsInline className="w-full h-full object-cover opacity-40">
          <source src="/HA_BG.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-gradient-to-b from-[#0a0f1a]/80 via-transparent to-[#0a0f1a]/80" />
        <div className="absolute inset-0 bg-[#0a0f1a]/20 backdrop-blur-[2px]" />
      </div>

      <div className="min-h-screen flex flex-col items-center justify-center p-4 relative z-10">
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <div className="grid-bg w-full h-full" />
        </div>

        <div className="w-full max-w-md z-10">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-cyan-500/10 border border-cyan-500/30 rounded-xl backdrop-blur-md">
                <Shield className="text-cyan-500 w-10 h-10 drop-shadow-[0_0_10px_rgba(6,182,212,0.4)]" />
              </div>
            </div>
            <h1 className="text-4xl font-black italic tracking-tighter uppercase mb-4 drop-shadow-[0_0_15px_rgba(0,0,0,1)]">
              HACK<span className="text-cyan-500 text-shadow-glow">AWARE</span>
            </h1>
            <div className="h-10 flex items-center justify-center border-y border-white/5 bg-black/40 backdrop-blur-sm mb-8">
              <Typewriter sequences={mottos} />
            </div>
          </div>

          <div className="flex justify-center gap-12 mb-8 text-xs font-bold tracking-[0.2em] uppercase">
            <button 
              onClick={() => setView('login')}
              className={`transition-all duration-300 ${view === 'login' ? 'text-cyan-400 border-b-2 border-cyan-400 pb-1' : 'text-gray-400'}`}
            >ACCESS_GATE</button>
            <button 
              onClick={() => setView('register')}
              className={`transition-all duration-300 ${view === 'register' ? 'text-cyan-400 border-b-2 border-cyan-400 pb-1' : 'text-gray-400'}`}
            >NEW_IDENTITY</button>
          </div>

          {view === 'login' ? (
            <LoginForm onLogin={handleAuthSuccess} />
          ) : (
            <RegisterForm onRegister={handleAuthSuccess} />
          )}

          <div className="mt-4 flex justify-between items-center px-2 font-mono text-[8px] text-gray-400 uppercase tracking-widest opacity-60">
            <span>DB_STABLE_V2</span>
            <span>NODE: MUMBAI_EDGE_01</span>
            <span>AES_256_ACTIVE</span>
          </div>
        </div>
      </div>

      <style>{`
        .grid-bg {
          background-image: linear-gradient(to right, #1e293b 1px, transparent 1px),
                            linear-gradient(to bottom, #1e293b 1px, transparent 1px);
          background-size: 40px 40px;
        }
        .text-shadow-glow { text-shadow: 0 0 10px rgba(6, 182, 212, 0.8); }
      `}</style>
    </div>
  );
};

// --- 3. SUB-COMPONENTS ---
const InputField = ({ label, type = "text", icon: Icon, onChange }) => (
  <div className="mb-4">
    <label className="block text-[10px] font-bold mb-1 text-gray-400 uppercase tracking-widest">{label}</label>
    <div className="relative">
      {Icon && <Icon className="absolute left-3 top-1/2 -translate-y-1/2 text-cyan-500/50 w-4 h-4" />}
      <input 
        type={type} 
        onChange={onChange}
        required
        className="w-full bg-black/70 border border-gray-700 rounded-sm py-2.5 pl-10 pr-3 focus:outline-none focus:border-cyan-500/50 text-sm font-mono text-cyan-50 transition-all"
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
      else setStatus({ type: 'error', msg: data.message || 'ACCESS_DENIED' });
    } catch (err) { 
      setStatus({ type: 'error', msg: 'GATEWAY_TIMEOUT' }); 
    }
  };

  return (
    <div className="bg-[#0d1525]/80 border border-gray-700 p-8 rounded-lg shadow-2xl backdrop-blur-lg animate-in fade-in zoom-in duration-500">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xs font-bold text-gray-300 uppercase tracking-widest">Operator Login</h2>
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
  const [status, setStatus] = useState({ type: '', msg: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus({ type: 'info', msg: 'INITIALIZING_ID...' });
    try {
      const res = await fetch('http://localhost:5000/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (res.ok) onRegister(data);
      else setStatus({ type: 'error', msg: data.message || 'REGISTRATION_FAILED' });
    } catch (err) { 
      setStatus({ type: 'error', msg: 'CONNECTION_FAILURE' }); 
    }
  };

  return (
    <div className="bg-[#0d1525]/80 border border-gray-700 p-8 rounded-lg shadow-2xl backdrop-blur-lg animate-in fade-in zoom-in duration-500">
      <h2 className="text-xs font-bold text-gray-300 uppercase tracking-widest mb-6 text-center">New Operator Registration</h2>
      
      {status.msg && (
        <div className={`mb-4 p-2 text-[10px] border font-mono ${status.type === 'error' ? 'border-red-500/40 text-red-400 bg-red-900/10' : 'border-cyan-500/40 text-cyan-400 bg-cyan-900/10'}`}>
          {status.msg}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <InputField label="Full_Legal_Name" icon={User} onChange={(e) => setFormData({...formData, fullName: e.target.value})} />
        <InputField label="Designated_Email" type="email" icon={Mail} onChange={(e) => setFormData({...formData, email: e.target.value})} />
        <InputField label="New_Passphrase" type="password" icon={Lock} onChange={(e) => setFormData({...formData, password: e.target.value})} />
        <button type="submit" className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-3 rounded mt-2 uppercase tracking-widest text-[10px] transition-all">
          Initialize_Identity
        </button>
      </form>
    </div>
  );
};

export default AuthPage;