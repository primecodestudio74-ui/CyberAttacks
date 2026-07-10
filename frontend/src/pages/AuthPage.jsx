import React, { useState, useEffect, useMemo } from 'react';
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
        return;
      }

      setText(currentFullText.substring(0, text.length + 1));
      setTypingSpeed(speed);
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

  const mottos = useMemo(
    () => [
      "HackAware Cyber Security Platform",
      "Simulate Attack | Learn Defense",
      "Stay Aware, Stay Secure",
      "Terminal Handshake Initialized",
      "Vulnerability Assessment Active",
    ],
    []
  );


  useEffect(() => {
    try {
      const savedToken = localStorage.getItem('operator_token');
      if (savedToken) navigate('/dashboard');
    } finally {
      setLoading(false);
    }
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
<source src="/videos/HA_BG.mp4" type="video/mp4" />
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
            >
              ACCESS_GATE
            </button>
            <button 
              onClick={() => setView('register')}
              className={`transition-all duration-300 ${view === 'register' ? 'text-cyan-400 border-b-2 border-cyan-400 pb-1' : 'text-gray-400'}`}
            >
              NEW_IDENTITY
            </button>
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

export default AuthPage;

