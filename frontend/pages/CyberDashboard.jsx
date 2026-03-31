import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, ShieldAlert, Settings, 
  User, Terminal, Play, ShieldCheck, 
  ShieldOff, Database, Fingerprint, LogOut // Added LogOut icon
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const CyberDashboard = () => {
  const [activeAttack, setActiveAttack] = useState('Brute Force');
  const [isSimulating, setIsSimulating] = useState(false);
  const [isHardened, setIsHardened] = useState(false);
  const [progress, setProgress] = useState(0);
  const [logs, setLogs] = useState(["[SYSTEM]: HackAware v1.0 Ready."]);
  
  const navigate = useNavigate(); // Initialize navigation

  // Security Check: Redirect to login if no token exists
  useEffect(() => {
    const token = localStorage.getItem('operator_token');
    if (!token) {
      navigate('/');
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('operator_token');
    localStorage.removeItem('operator_name');
    navigate('/'); // Redirect back to Auth Gate
  };

  // Handle the simulation logic
  useEffect(() => {
    let interval;
    if (isSimulating && progress < 100) {
      interval = setInterval(() => {
        setProgress(prev => {
          const next = prev + Math.floor(Math.random() * 15);
          if (next >= 100) {
            finishSimulation();
            return 100;
          }
          return next;
        });
        
        const mockIPs = ["192.168.0.1", "10.0.0.42", "172.16.254.1"];
        const logEntries = [
          `[TRYING]: admin / password${Math.floor(Math.random() * 100)}`,
          `[PACKET]: Intercepted from ${mockIPs[Math.floor(Math.random() * 3)]}`,
          `[AUTH]: Handshake request sent...`
        ];
        setLogs(prev => [logEntries[Math.floor(Math.random() * 3)], ...prev.slice(0, 10)]);
      }, 600);
    }
    return () => clearInterval(interval);
  }, [isSimulating, progress]);

  const startSimulation = () => {
    setProgress(0);
    setIsSimulating(true);
    setLogs([`[INIT]: Launching ${activeAttack} attack...`, ...logs]);
  };

  const finishSimulation = () => {
    setIsSimulating(false);
    const result = isHardened 
      ? `[BLOCKED]: ${activeAttack} failed. Firewall dropped unauthorized packets.`
      : `[SUCCESS]: ${activeAttack} exploited vulnerability! Access Granted.`;
    setLogs([result, ...logs]);
  };

  return (
    <div className="flex h-screen bg-[#020817] text-slate-300 font-sans p-6 overflow-hidden">
      
      {/* --- Sidebar Navigation --- */}
      <nav className="w-64 flex flex-col border-r border-slate-800 pr-4">
        <div className="flex items-center gap-3 mb-10 px-2">
          <div className="p-2 bg-blue-600 rounded-lg shadow-[0_0_15px_rgba(37,99,235,0.5)]">
            <ShieldAlert className="text-white w-6 h-6" />
          </div>
          <h1 className="text-xl font-bold tracking-widest text-white uppercase tracking-tighter">HackAware</h1>
        </div>
        <div className="space-y-2 flex-1">
          <NavItem icon={<LayoutDashboard size={20} />} label="Dashboard" active />
          <NavItem icon={<ShieldAlert size={20} />} label="Vulnerability Lab" />
          <NavItem icon={<Database size={20} />} label="Data Leaks" />
          <NavItem icon={<Settings size={20} />} label="Settings" />
        </div>

        {/* Actionable Logout Button added to Sidebar */}
        <button 
          onClick={handleLogout}
          className="flex items-center gap-4 px-4 py-3 rounded cursor-pointer transition-all hover:bg-red-900/10 text-slate-400 hover:text-red-500 mt-auto mb-4"
        >
          <LogOut size={20} />
          <span className="text-sm font-medium uppercase tracking-tighter">Terminate Session</span>
        </button>
      </nav>

      {/* --- Main Dashboard Area --- */}
      <main className="flex-1 px-8 overflow-y-auto">
        <header className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-2xl font-bold text-white uppercase tracking-widest">Operation Center</h2>
            <p className="text-xs text-blue-500 font-mono">ENCRYPTION: AES-256 ACTIVE</p>
          </div>
          <div className="flex items-center gap-6 text-slate-400">
            <div className="flex items-center gap-2 px-3 py-1 bg-slate-900 rounded-full border border-slate-800">
              <div className={`w-2 h-2 rounded-full ${isSimulating ? 'bg-red-500 animate-pulse' : 'bg-green-500'}`}></div>
              <span className="text-[10px] font-bold uppercase">{isSimulating ? 'Active Simulation' : 'System Secure'}</span>
            </div>
            <div className="flex items-center gap-2">
              <User size={20} className="hover:text-blue-400 cursor-pointer" />
              <span className="text-xs font-mono">{localStorage.getItem('operator_name') || 'Operator'}</span>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-12 gap-6">
          
          {/* 1. Attack Controls */}
          <Card className="col-span-4 border-t-2 border-t-blue-500">
            <h3 className="text-xs font-black uppercase mb-4 text-blue-400">Select Vulnerability</h3>
            <div className="space-y-2">
              {['Brute Force', 'Phishing', 'SQL Injection', 'XSS Attack'].map(atk => (
                <button 
                  key={atk}
                  onClick={() => setActiveAttack(atk)}
                  className={`w-full text-left px-4 py-3 rounded text-sm transition-all flex justify-between items-center ${activeAttack === atk ? 'bg-blue-600 text-white font-bold' : 'bg-slate-900 hover:bg-slate-800'}`}
                >
                  {atk}
                  {activeAttack === atk && <Fingerprint size={16} />}
                </button>
              ))}
            </div>
            
            <div className="mt-6 pt-6 border-t border-slate-800">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold uppercase tracking-widest text-slate-500">System Hardening</span>
                <button 
                  onClick={() => setIsHardened(!isHardened)}
                  className={`relative w-10 h-5 rounded-full transition-colors ${isHardened ? 'bg-green-500' : 'bg-slate-700'}`}
                >
                  <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${isHardened ? 'left-6' : 'left-1'}`}></div>
                </button>
              </div>
              <p className="text-[10px] text-slate-500 italic">Toggle defense to see if the attack succeeds.</p>
            </div>
          </Card>

          {/* 2. Live Simulation Visualizer */}
          <Card className="col-span-8 bg-[#050b1a] border-slate-700 relative">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-sm font-bold uppercase tracking-widest text-white">{activeAttack} Simulator</h3>
                <p className="text-xs text-slate-500 font-mono mt-1">Target: victim_server_01</p>
              </div>
              <button 
                onClick={startSimulation}
                disabled={isSimulating}
                className="bg-red-600 hover:bg-red-500 disabled:bg-slate-800 text-white px-6 py-2 rounded font-black text-xs uppercase flex items-center gap-2 shadow-[0_0_20px_rgba(220,38,38,0.3)] transition-all"
              >
                {isSimulating ? 'Attacking...' : <><Play size={14} fill="white" /> Execute Attack</>}
              </button>
            </div>

            {/* Animation Area */}
            <div className="mt-8 flex justify-between items-center px-10">
              <div className="flex flex-col items-center">
                <div className="p-4 bg-red-600/10 border border-red-600/50 rounded-xl mb-2">
                  <Terminal className="text-red-500" size={32} />
                </div>
                <span className="text-[10px] font-bold">ATTACKER</span>
              </div>

              <div className="flex-1 px-4">
                <div className="w-full bg-slate-800 h-1 rounded-full relative overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-500 ${isHardened ? 'bg-cyan-500' : 'bg-red-500'}`} 
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
                <p className="text-center text-[10px] font-mono mt-2 text-blue-500">{progress}% Payload Delivered</p>
              </div>

              <div className="flex flex-col items-center">
                <div className={`p-4 border rounded-xl mb-2 transition-colors ${isHardened ? 'bg-green-600/10 border-green-500' : 'bg-slate-900 border-slate-800'}`}>
                  {isHardened ? <ShieldCheck className="text-green-500" size={32} /> : <ShieldOff className="text-slate-500" size={32} />}
                </div>
                <span className="text-[10px] font-bold">VICTIM</span>
              </div>
            </div>
          </Card>

          {/* 3. Real-time Log Console */}
          <Card className="col-span-7 h-60 bg-black/80 font-mono border-slate-800">
            <div className="flex items-center gap-2 mb-3 text-blue-400 border-b border-slate-800 pb-2">
              <Terminal size={14} />
              <span className="text-xs font-bold uppercase tracking-widest">Intercepted Data Logs</span>
            </div>
            <div className="space-y-1 overflow-y-auto h-40 custom-scrollbar">
              {logs.map((log, i) => (
                <div key={i} className={`text-[11px] ${log.includes('[SUCCESS]') ? 'text-green-400 font-bold' : log.includes('[BLOCKED]') ? 'text-cyan-400' : 'text-slate-400'}`}>
                  <span className="opacity-30 mr-2">[{new Date().toLocaleTimeString()}]</span>
                  {log}
                </div>
              ))}
            </div>
          </Card>

          {/* 4. Educational Defense Panel */}
          <Card className="col-span-5 h-60 border-l-4 border-l-green-500">
            <h3 className="text-xs font-black uppercase text-green-500 mb-4 flex items-center gap-2">
              <ShieldCheck size={14} /> Security Briefing
            </h3>
            <div className="p-3 bg-slate-950 rounded border border-slate-800">
              <h4 className="text-[10px] font-bold text-blue-400 uppercase mb-1">Vulnerability Info:</h4>
              <p className="text-xs leading-relaxed italic">
                {activeAttack === 'Brute Force' ? "The system lacks rate-limiting. Attackers can guess passwords infinitely." : activeAttack === 'Phishing' ? "Attackers craft fake portals to trick operators into giving up credentials." : "Injection of malicious parameters into backend calls to dump database tables."}
              </p>
            </div>
            <div className="mt-4">
              <h4 className="text-[10px] font-bold text-green-500 uppercase mb-2">Defense Implementation:</h4>
              <ul className="text-[11px] space-y-1 text-slate-400">
                <li className="flex items-center gap-2 font-mono">
                   <div className="w-1 h-1 bg-green-500 rounded-full"></div> 
                   {isHardened ? "✓ Multi-Factor Authentication: ACTIVE" : "× Multi-Factor Authentication: INACTIVE"}
                </li>
                <li className="flex items-center gap-2 font-mono">
                   <div className="w-1 h-1 bg-green-500 rounded-full"></div> 
                   {isHardened ? "✓ IP Rate Limiting: SECURE" : "× Rate Limiting: BYPASSED"}
                </li>
              </ul>
            </div>
          </Card>

        </div>
      </main>
    </div>
  );
};

// Sub-components
const NavItem = ({ icon, label, active = false }) => (
  <div className={`flex items-center gap-4 px-4 py-3 rounded cursor-pointer transition-all ${active ? 'bg-blue-600/10 text-blue-400 border-l-4 border-blue-600' : 'hover:bg-slate-800/50'}`}>
    {icon}
    <span className="text-sm font-medium uppercase tracking-tighter">{label}</span>
  </div>
);

const Card = ({ children, className }) => (
  <div className={`bg-[#0b1224] border border-slate-800 p-5 rounded-lg shadow-2xl ${className}`}>
    {children}
  </div>
);

export default CyberDashboard;