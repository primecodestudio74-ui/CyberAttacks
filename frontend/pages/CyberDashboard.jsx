import React, { useState, useEffect } from 'react';
import { 
  Shield, LogOut, LayoutDashboard, Lock, Mail, 
  Database, Activity, Zap, Menu, ChevronLeft, X 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const CyberDashboard = () => {
  // --- 1. STATE & NAVIGATION ---
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [selectedAttack, setSelectedAttack] = useState(null);
  const [isHardened, setIsHardened] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const navigate = useNavigate();

  // --- 2. AUTH CHECK (The Fix) ---
  useEffect(() => {
    // We check for 'operator_token' OR 'token' to be safe
    const token = localStorage.getItem('operator_token') || localStorage.getItem('token');
    
    if (!token) {
      console.error("No authentication token found. Redirecting...");
      navigate('/'); 
    } else {
      setIsAuthorized(true);
    }
  }, [navigate]);

  const operatorName = localStorage.getItem('operator_name') || 'User';

  const handleLogout = () => {
    localStorage.clear(); // Clears everything to be safe
    navigate('/');
  };

  const attacks = [
    { id: 'BRUTE_FORCE', title: 'Password Security', desc: 'Learn how hackers guess passwords and how to stop them.', icon: <Lock className="text-blue-500" /> },
    { id: 'PHISHING', title: 'Email Safety', desc: 'Identify fake emails designed to steal your personal info.', icon: <Mail className="text-emerald-500" /> },
    { id: 'SQL_INJECTION', title: 'Database Protection', desc: 'See how websites protect your saved data from intruders.', icon: <Database className="text-purple-500" /> },
    { id: 'XSS', title: 'Safe Browsing', desc: 'Understand how malicious scripts can hide in web pages.', icon: <Activity className="text-orange-500" /> },
  ];

  // Don't show anything until we confirm the user is logged in
  if (!isAuthorized) return null;

  return (
    <div className="flex h-screen bg-[#f1f5f9] text-slate-800 font-sans overflow-hidden">
      
      {/* --- 3. ANIMATED SIDEBAR (Drawer) --- */}
      <aside 
        className={`bg-[#0f172a] text-white flex flex-col transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] shadow-2xl z-20 ${
          isSidebarOpen ? 'w-72' : 'w-20'
        }`}
      >
        {/* Sidebar Header */}
        <div className="p-6 flex items-center justify-between border-b border-slate-800">
          <div className={`flex items-center gap-3 transition-opacity duration-300 ${isSidebarOpen ? 'opacity-100' : 'opacity-0 w-0 overflow-hidden'}`}>
            <Shield className="text-cyan-400" size={24} />
            <h1 className="font-bold tracking-tight text-lg whitespace-nowrap">HackAware</h1>
          </div>
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 hover:bg-slate-800 rounded-xl transition-colors mx-auto text-slate-400 hover:text-white"
          >
            {isSidebarOpen ? <ChevronLeft size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* Sidebar Links */}
        <nav className="flex-1 p-4 space-y-2">
          <div className={`flex items-center gap-4 p-3 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/10`}>
            <LayoutDashboard size={22} />
            <span className={`font-medium transition-opacity duration-300 ${isSidebarOpen ? 'opacity-100' : 'opacity-0 w-0 overflow-hidden'}`}>
              Learning Hub
            </span>
          </div>
        </nav>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-slate-800">
          <button 
            onClick={handleLogout}
            className="flex items-center gap-4 w-full p-3 text-slate-400 hover:text-red-400 hover:bg-red-400/10 rounded-xl transition-all group"
          >
            <LogOut size={22} className="group-hover:-translate-x-1 transition-transform" />
            <span className={`font-medium text-xs tracking-wider transition-opacity duration-300 ${isSidebarOpen ? 'opacity-100' : 'opacity-0 w-0 overflow-hidden'}`}>
              TERMINATE SESSION
            </span>
          </button>
        </div>
      </aside>

      {/* --- 4. MAIN CONTENT AREA --- */}
      <main className="flex-1 flex flex-col overflow-y-auto">
        {/* Top Navbar */}
        <header className="h-20 bg-white border-b border-slate-200 px-8 flex items-center justify-between sticky top-0 z-10 shadow-sm">
          <div>
            <h2 className="text-lg font-bold text-slate-800">Hello, {operatorName}</h2>
            <p className="text-xs text-slate-500 font-medium uppercase tracking-widest">System Status: <span className="text-emerald-500">Online</span></p>
          </div>

          {/* Simplified Protection Toggle */}
          <div className="flex items-center gap-3 bg-slate-50 p-2 rounded-2xl border border-slate-200">
            <span className={`text-[10px] font-black px-2 ${isHardened ? 'text-emerald-600' : 'text-slate-400'}`}>
              {isHardened ? 'PROTECTION ON' : 'VULNERABLE'}
            </span>
            <button 
              onClick={() => setIsHardened(!isHardened)}
              className={`w-11 h-6 rounded-full transition-all relative ${isHardened ? 'bg-emerald-500' : 'bg-slate-300'}`}
            >
              <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-md transition-all ${isHardened ? 'left-6' : 'left-1'}`} />
            </button>
          </div>
        </header>

        {/* Dashboard Grid */}
        <div className="p-8 max-w-7xl mx-auto w-full">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {attacks.map((atk) => (
              <div 
                key={atk.id}
                onClick={() => setSelectedAttack(atk)}
                className="group bg-white p-8 rounded-3xl border border-slate-200 hover:border-cyan-500 hover:shadow-2xl hover:shadow-cyan-500/10 transition-all cursor-pointer flex gap-6 items-center"
              >
                <div className="p-5 bg-slate-50 rounded-2xl group-hover:bg-cyan-50 group-hover:scale-110 transition-all duration-300">
                  {React.cloneElement(atk.icon, { size: 32 })}
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-slate-800 mb-1">{atk.title}</h3>
                  <p className="text-sm text-slate-500 leading-relaxed mb-3">{atk.desc}</p>
                  <div className="flex items-center gap-2 text-cyan-600 font-bold text-xs uppercase tracking-widest">
                    Explore Module <Zap size={14} className="fill-current" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* --- 5. SIMPLE MODAL --- */}
      {selectedAttack && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-950/40 backdrop-blur-md transition-all">
          <div className="w-full max-w-xl bg-white rounded-[2rem] shadow-2xl overflow-hidden relative animate-in zoom-in-95 duration-300">
            <div className="p-8 flex justify-between items-center border-b border-slate-50">
              <h3 className="text-xl font-bold text-slate-800">{selectedAttack.title}</h3>
              <button onClick={() => setSelectedAttack(null)} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-8">
              <p className="text-slate-600 mb-8 leading-relaxed">
                You are about to enter a simulation for <strong>{selectedAttack.title}</strong>. 
                This will show you exactly how these threats look in real-time.
              </p>

              <button className="w-full py-4 bg-slate-900 text-white font-bold rounded-2xl hover:bg-cyan-600 transition-all shadow-lg active:scale-95">
                Launch Module
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CyberDashboard;