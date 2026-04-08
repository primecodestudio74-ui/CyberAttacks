import React, { useState, useEffect } from 'react';
import { 
  Shield, LogOut, LayoutDashboard, Lock, Mail, 
  Database, Activity, Menu, ChevronLeft, 
  ExternalLink, User, Terminal, Clock, FileSearch,
  BrainCircuit, ArrowDown, Target, BookOpen, Settings,
  DiffIcon
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

// Component Imports
import OperatorProfile from './OperatorProfile'; 

const CyberDashboard = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 1024);
  const [selectedAttack, setSelectedAttack] = useState(null);
  const [activeTab, setActiveTab] = useState('hub');
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    const handleResize = () => {
        if (window.innerWidth < 1024) setIsSidebarOpen(false);
        else setIsSidebarOpen(true);
    };
    window.addEventListener('resize', handleResize);
    return () => {
        clearInterval(timer);
        window.removeEventListener('resize', handleResize);
    };
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('operator_token') || localStorage.getItem('token');
    if (!token) navigate('/'); 
    else setIsAuthorized(true);
  }, [navigate]);

  const operatorName = localStorage.getItem('operator_name') || 'Aniket';

  const attacks = [
    { 
      id: 'SQL_INJECTION', 
      title: 'SQL Injection', 
      desc: 'Exploit database vulnerabilities via malicious query manipulation.', 
      icon: <Database className="text-purple-400" />,
      path: '/dashboard/sql-injection',
      path: '/dashboard/sql-injection',
      difficulty: 'Intermediate'
    },
    { 
      id: 'PHISHING', 
      title: 'Phishing Attack', 
      desc: 'Simulate deceptive communication to identify social engineering risks.', 
      icon: <Mail className="text-blue-400" />,
      path: '/dashboard/phishing',
      difficulty: 'Beginner'
    },
    { 
      id: 'BRUTE_FORCE', 
      title: 'Brute-Force Attack', 
      desc: 'Systematic credential guessing to test password complexity and lockouts.', 
      icon: <Lock className="text-cyan-400" />,
      path: '/dashboard/brute-force',
      difficulty: 'Intermediate'
    },
    { 
      id: 'AI_POISONING', 
      title: 'AI Data Poisoning', 
      desc: 'Corrupt neural network training sets to create backdoors and model bias.', 
      icon: <BrainCircuit className="text-fuchsia-500" />,
      path: '/dashboard/ai-poisoning',
      difficulty: 'Advanced'
    }
  ];

  const scrollToSection = (id) => {
    const element = document.getElementById(id);
    element?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if(window.innerWidth < 1024) setIsSidebarOpen(false);
  };

  if (!isAuthorized) return null;

  return (
    <div className="flex h-screen bg-[#020617] text-slate-400 font-sans overflow-hidden selection:bg-cyan-500/30 relative">
      
      {/* --- BACKGROUND VIDEO --- */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <video autoPlay loop muted playsInline className="w-full h-full object-cover opacity-20">
          <source src="/DashBoard_Video.mp4" type="video/mp4" />
        </video>
      </div>

      {/* CRT SCANLINE EFFECT */}
      <div className="absolute inset-0 pointer-events-none z-50 opacity-[0.03] bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%]"></div>

      <aside className={`fixed lg:relative bg-[#030712]/80 backdrop-blur-md border-r border-slate-800/40 flex flex-col transition-all duration-500 ease-in-out z-[100] h-full ${isSidebarOpen ? 'w-72 translate-x-0' : 'w-20 -translate-x-full lg:translate-x-0'}`}>
        <div className="h-20 flex items-center px-4 justify-between shrink-0 overflow-hidden">
          <AnimatePresence mode="wait">
            {isSidebarOpen && (
              <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="flex items-center gap-2 pl-2">
                <Shield className="text-cyan-500" size={16} />
                <h1 className="font-black text-[18px] tracking-[0.15em] text-white uppercase italic">HACK<span className="text-cyan-500">AWARE</span></h1>
              </motion.div>
            )}
          </AnimatePresence>
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className={`p-2.5 hover:bg-slate-800/60 rounded-xl transition-all text-slate-500 hover:text-cyan-400 flex items-center justify-center ${!isSidebarOpen && 'mx-auto'}`}>
            {isSidebarOpen ? <ChevronLeft size={18} /> : <Menu size={20} />}
          </button>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-8 overflow-y-auto overflow-y-hidden overflow-x-hidden">
          
          {/* OPERATIONS GROUP */}
          <div>
            <p className={`text-[9px] font-black text-slate-700 uppercase tracking-[0.3em] mb-4 px-4 ${!isSidebarOpen && 'hidden'}`}>Operations</p>
            <div className="space-y-1">
              <SidebarLink icon={<LayoutDashboard size={18}/>} label="Attack Hub" active={activeTab === 'hub'} onClick={() => handleTabChange('hub')} isOpen={isSidebarOpen} />
              <SidebarLink icon={<Shield size={18}/>} label="Prevention" active={activeTab === 'prevention'} onClick={() => handleTabChange('prevention')} isOpen={isSidebarOpen} />
            </div>
          </div>

          {/* ACADEMY GROUP */}
          <div>
            <p className={`text-[9px] font-black text-slate-700 uppercase tracking-[0.3em] mb-4 px-4 ${!isSidebarOpen && 'hidden'}`}>Academy</p>
            <div className="space-y-1">
              <SidebarLink icon={<BookOpen size={18}/>} label="Learning" active={activeTab === 'learning'} onClick={() => handleTabChange('learning')} isOpen={isSidebarOpen} />
              <SidebarLink icon={<Target size={18}/>} label="Quiz" active={activeTab === 'quiz'} onClick={() => handleTabChange('quiz')} isOpen={isSidebarOpen} />
            </div>
          </div>

          {/* IDENTITY & SYSTEM GROUP */}
          <div>
            <p className={`text-[9px] font-black text-slate-700 uppercase tracking-[0.3em] mb-4 px-4 ${!isSidebarOpen && 'hidden'}`}>System</p>
            <div className="space-y-1">
              <SidebarLink icon={<User size={18}/>} label="Profile" active={activeTab === 'profile'} onClick={() => handleTabChange('profile')} isOpen={isSidebarOpen} />
              <SidebarLink icon={<Settings size={18}/>} label="Settings" active={activeTab === 'settings'} onClick={() => handleTabChange('settings')} isOpen={isSidebarOpen} />
            </div>
          </div>
        </nav>

        <div className="p-3 border-t border-slate-800/40">
          <button onClick={() => { localStorage.clear(); navigate('/'); }} className={`flex items-center gap-3 w-full px-3 py-3 text-slate-500 hover:text-red-400 hover:bg-red-500/5 rounded-xl transition-all text-[10px] font-black tracking-widest uppercase ${!isSidebarOpen && 'justify-center'}`}>
            <LogOut size={18} />
            {isSidebarOpen && <span>Terminate</span>}
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col overflow-y-auto bg-transparent scroll-smooth relative z-10">
        <header className="h-18 flex items-center justify-between px-4 lg:px-8 border-b border-slate-800/30 bg-[#020617]/40 backdrop-blur-xl sticky top-0 z-20 shrink-0">
          <div className="flex items-center gap-4">
            {!isSidebarOpen && (
                <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden p-2 text-slate-400 hover:text-cyan-400">
                  <Menu size={20} />
                </button>
            )}
            <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-900/40 border border-slate-800 rounded-lg">
              <div className="w-1.5 h-1.5 bg-cyan-500 rounded-full animate-pulse shadow-[0_0_8px_#06b6d4]"></div>
              <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-tight">Secure_Connection</span>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="hidden sm:flex items-center gap-3 px-3 py-1.5 bg-slate-900/40 border border-slate-800/50 rounded-lg">
              <Clock className="text-cyan-500" size={12} />
              <span className="text-[10px] font-mono font-medium text-slate-300">{currentTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', second: '2-digit'})}</span>
            </div>
            <div className="flex items-center gap-3 pl-6 border-l border-slate-800/60">
              <div className="text-right hidden xs:block">
                <p className="text-[11px] font-black text-white uppercase tracking-tight">{operatorName}</p>
                <p className="text-[9px] font-bold text-cyan-600 tracking-tighter uppercase tracking-[0.1em]">Level 1 Admin</p>
              </div>
              <div className="w-9 h-9 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center font-black text-cyan-400 text-xs shadow-inner uppercase">
                {operatorName[0]}
              </div>
            </div>
          </div>
        </header>

        {/* --- DYNAMIC CONTENT AREA --- */}
        <AnimatePresence mode="wait">
          {activeTab === 'hub' ? (
            <motion.div key="hub" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col w-full">
              
              <section className="min-h-[calc(100vh-80px)] flex flex-col items-center justify-center text-center p-6 lg:p-12 relative">
                <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }} className="max-w-4xl z-10">
                  <h1 className="text-5xl lg:text-8xl font-black text-white tracking-tighter uppercase italic leading-none mb-6">
                    HACK<span className="text-cyan-500">AWARE</span>
                  </h1>
                  <p className="text-slate-400 text-base lg:text-lg font-medium leading-relaxed mb-8 max-w-2xl mx-auto uppercase tracking-wide">
                    The Ultimate Cybersecurity Demonstration & Prevention Environment.
                  </p>
                  
                  <div className="flex flex-wrap justify-center gap-4">
                    <button onClick={() => scrollToSection('about-hackaware')} className="px-8 py-4 bg-cyan-600 text-[#020617] font-black rounded-xl hover:bg-cyan-500 transition-all text-[11px] uppercase tracking-[0.2em]">
                      What is HackAware?
                    </button>
                    <button onClick={() => scrollToSection('attack-section')} className="px-8 py-4 border border-slate-700 text-slate-300 font-black rounded-xl hover:bg-slate-800 transition-all text-[11px] uppercase tracking-[0.2em]">
                      Explore Attacks
                    </button>
                  </div>
                </motion.div>

                <motion.div animate={{ y: [0, 10, 0] }} transition={{ repeat: Infinity, duration: 2 }} className="absolute bottom-10 left-1/2 -translate-x-1/2">
                   <ArrowDown size={24} className="text-slate-800" />
                </motion.div>
              </section>

              <section id="about-hackaware" className="py-24 px-6 lg:px-12 bg-slate-950/50 backdrop-blur-md border-y border-slate-800/40">
                <div className="max-w-6xl mx-auto">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                    <div>
                      <h2 className="text-2xl lg:text-3xl font-black text-white uppercase italic tracking-tight mb-6">Strategic Briefing</h2>
                      <p className="text-slate-400 text-sm leading-loose mb-8">
                        In an era of rising digital threats, <span className="text-cyan-500 font-bold">HackAware</span> helps make complex cyber attacks simple and easy to understand.
                        It breaks down how different attacks work in a clear and practical way.
                        By learning how hackers think and operate, users can better protect themselves and their systems.
                        We believe that the best defense is not just tools, but knowledge and awareness of real-world threats.
                      </p>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div className="p-4 bg-slate-900/50 border border-slate-800 rounded-2xl">
                          <Target className="text-cyan-500 mb-3" size={20} />
                          <h4 className="text-xs font-black text-white uppercase mb-2">Simulate</h4>
                          <p className="text-[10px] text-slate-500 leading-relaxed uppercase tracking-tight">Run live demonstrations of vectors.</p>
                        </div>
                        <div className="p-4 bg-slate-900/50 border border-slate-800 rounded-2xl">
                          <BookOpen className="text-cyan-500 mb-3" size={20} />
                          <h4 className="text-xs font-black text-white uppercase mb-2">Educate</h4>
                          <p className="text-[10px] text-slate-500 leading-relaxed uppercase tracking-tight">Guidance for beginners and pros.</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="relative">
                      <div className="absolute -inset-4 bg-cyan-500/10 blur-3xl rounded-full"></div>
                      <div className="relative bg-[#080c17] border border-slate-800 p-8 rounded-[2rem] shadow-2xl">
                        <Terminal size={32} className="text-cyan-500 mb-6" />
                        <div className="space-y-4 font-mono text-[10px] lg:text-xs">
                          <p className="text-emerald-500">$ system_init --mode=hackaware</p>
                          <p className="text-slate-500">{'>'} Loading modules...</p>
                          <p className="text-slate-300 italic">{'>'} "Awareness is the first layer of security."</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              <section id="attack-section" className="py-24 px-6 lg:px-12 max-w-6xl mx-auto w-full">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
                  <div>
                    <h2 className="text-2xl lg:text-3xl font-black text-white tracking-tighter uppercase italic">Operation Hub</h2>
                    <p className="text-[10px] text-cyan-600 font-bold uppercase tracking-[0.3em] mt-2">Active Simulation Attacks</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {attacks.map((atk, index) => (
                    <AttackCard key={atk.id} atk={atk} index={index} onClick={() => setSelectedAttack(atk)} />
                  ))}
                </div>
              </section>

            </motion.div>
          ) : activeTab === 'profile' ? (
            <motion.div key="profile" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="p-6 lg:p-12 max-w-6xl mx-auto w-full">
              <OperatorProfile />
            </motion.div>
          ) : (
            /* Placeholder for new sections */
            <motion.div key="other" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center justify-center h-[calc(100vh-80px)]">
               <h2 className="text-3xl font-black text-white uppercase italic">{activeTab} Section</h2>
               <p className="text-cyan-600 font-bold uppercase tracking-widest mt-4">Module Under Construction</p>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* --- MODAL --- */}
      <AnimatePresence>
        {selectedAttack && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-[#020617]/95 backdrop-blur-md">
            <motion.div initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }} className="w-full max-w-md bg-[#080c17] border border-slate-800 rounded-[2rem] overflow-hidden shadow-2xl">
              <div className="p-10 text-center relative">
                <div className="w-16 h-16 bg-slate-950 border border-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  {React.cloneElement(selectedAttack.icon, { size: 28 })}
                </div>
                <h3 className="text-lg font-black text-white mb-2 uppercase italic tracking-widest">{selectedAttack.title}</h3>
                <p className="text-slate-500 text-[10px] font-mono mb-8 uppercase tracking-tighter leading-relaxed">
                    Authorized Operator: {operatorName} <br/> 
                    Vector Status: <span className="text-emerald-500">Deployable</span>
                </p>

                <div className="flex flex-col gap-3">
                  <button onClick={() => navigate(selectedAttack.path)} className="w-full py-4 bg-cyan-600 text-[#020617] font-black rounded-xl hover:bg-cyan-500 transition-all text-[11px] uppercase tracking-[0.2em]">
                    Initialize Protocol
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

// --- HELPER COMPONENTS ---
const SidebarLink = ({ icon, label, active, onClick, isOpen }) => (
  <button onClick={onClick} className={`flex items-center gap-3 w-full px-3 py-3 rounded-xl transition-all relative group z-10 ${active ? 'text-cyan-400 bg-cyan-500/10' : 'text-slate-600 hover:text-slate-300 hover:bg-slate-800/30'} ${!isOpen && 'justify-center'}`}>
    {active && <motion.div layoutId="activeTab" className="absolute left-0 w-1 h-5 bg-cyan-500 rounded-r-full" />}
    <div className="shrink-0 group-hover:scale-110 transition-transform">{icon}</div>
    {isOpen && <span className="text-[11px] font-black tracking-widest uppercase">{label}</span>}
  </button>
);

const AttackCard = ({ atk, index, onClick }) => (
  <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.05 }} whileHover={{ y: -5, borderColor: 'rgba(34, 211, 238, 0.4)' }} onClick={onClick} className="group relative bg-[#030712]/40 backdrop-blur-sm border border-slate-800/50 p-8 rounded-[2rem] cursor-pointer overflow-hidden transition-all duration-300">
    <div className="relative z-10 flex flex-col gap-6">
      <div className="flex justify-between items-start">
        <div className="w-12 h-12 bg-slate-950 border border-slate-800 group-hover:border-cyan-500/30 rounded-xl flex items-center justify-center transition-colors">
          {React.cloneElement(atk.icon, { size: 24 })}
        </div>
        <div className="flex flex-col items-end gap-2">
           <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded ${
             atk.difficulty === 'Beginner' ? 'text-emerald-500 bg-emerald-500/5' : 
             atk.difficulty === 'Intermediate' ? 'text-orange-500 bg-orange-500/5' : 
             'text-fuchsia-500 bg-fuchsia-500/5'
           }`}>{atk.difficulty}</span>
        </div>
      </div>
      <div>
        <h3 className="text-base font-black text-white mb-2 uppercase italic tracking-wider group-hover:text-cyan-400 transition-colors">{atk.title}</h3>
        <p className="text-[11px] text-slate-500 font-medium leading-relaxed">{atk.desc}</p>
      </div>
      <div className="pt-6 border-t border-slate-800/30 flex items-center justify-between">
        <span className="text-[9px] font-black text-cyan-600 uppercase tracking-[0.25em] group-hover:text-cyan-400 transition-colors">Enter_Environment</span>
        <div className="w-6 h-6 rounded-full border border-slate-800 flex items-center justify-center group-hover:border-cyan-500 transition-colors">
           <ExternalLink size={10} className="text-slate-600 group-hover:text-cyan-500" />
        </div>
      </div>
    </div>
  </motion.div>
);

export default CyberDashboard;