import React from 'react';

import { 
  LayoutDashboard, 
  ShieldAlert, 
  Search, 
  Settings, 
  Bell, 
  User, 
  Globe, 
  AlertTriangle 
} from 'lucide-react';

const CyberDashboard = () => {
  return (
    <div className="flex h-screen bg-[#020817] text-slate-300 font-sans p-6 overflow-hidden">
      
      {/* --- Sidebar Navigation --- */}
      <nav className="w-64 flex flex-col border-r border-slate-800 pr-4">
        <div className="flex items-center gap-3 mb-10 px-2">
          <div className="p-2 bg-blue-600 rounded-lg shadow-[0_0_15px_rgba(37,99,235,0.5)]">
            <ShieldAlert className="text-white w-6 h-6" />
          </div>
          <h1 className="text-xl font-bold tracking-widest text-white uppercase">Cyberattacks</h1>
        </div>

        <div className="space-y-2">
          <NavItem icon={<LayoutDashboard size={20} />} label="Dashboard" active />
          <NavItem icon={<ShieldAlert size={20} />} label="Incidents" />
          <NavItem icon={<Search size={20} />} label="Thread Intel" />
          <NavItem icon={<Settings size={20} />} label="Settings" />
        </div>
      </nav>

      {/* --- Main Content Area --- */}
      <main className="flex-1 px-8 overflow-y-auto">
        
        {/* Header Bar */}
        <header className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-semibold text-white">Home Dashboard</h2>
          <div className="flex items-center gap-6 text-slate-400">
            <Bell size={20} className="hover:text-blue-400 cursor-pointer" />
            <User size={20} className="hover:text-blue-400 cursor-pointer" />
            <Settings size={20} className="hover:text-blue-400 cursor-pointer" />
          </div>
        </header>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-12 gap-6">
          
          {/* Active Threats Card */}
          <Card className="col-span-4 h-48">
            <h3 className="text-xs font-bold uppercase tracking-wider mb-4 flex items-center gap-2">
              <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span> Active Threats
            </h3>
            <div className="flex items-center justify-center h-24">
              <div className="relative flex items-center justify-center">
                <div className="w-24 h-24 rounded-full border-4 border-slate-800 border-t-red-500 animate-spin-slow"></div>
                <span className="absolute text-xl font-mono text-white">83.59%</span>
              </div>
            </div>
          </Card>

          {/* Recent Incidents Card */}
          <Card className="col-span-8 h-48">
            <div className="flex justify-between mb-4">
              <h3 className="text-xs font-bold uppercase tracking-wider">Recent Incidents</h3>
              <span className="text-[10px] text-blue-400 cursor-pointer">DETAILS</span>
            </div>
            <div className="flex gap-12 mt-4">
              <div className="text-center">
                <div className="w-16 h-16 rounded-full border-4 border-slate-800 border-l-blue-400 flex items-center justify-center mb-2">
                  <span className="text-sm font-mono text-white">38.10%</span>
                </div>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 rounded-full border-4 border-slate-800 border-r-orange-500 flex items-center justify-center mb-2">
                  <span className="text-sm font-mono text-white">56.30%</span>
                </div>
              </div>
            </div>
          </Card>

          {/* World Map Section */}
          <Card className="col-span-7 h-64">
             <h3 className="text-xs font-bold uppercase tracking-wider mb-4 flex items-center gap-2">
              <Globe size={14} className="text-blue-400" /> System Status
            </h3>
            <div className="w-full h-40 bg-slate-900/50 rounded-lg flex items-center justify-center border border-slate-800 relative overflow-hidden">
               {/* Replace with an actual SVG map or Map library like react-simple-maps */}
               <div className="opacity-20 text-blue-500 text-6xl">WORLD MAP</div>
               <div className="absolute top-10 left-20 w-2 h-2 bg-red-500 rounded-full shadow-[0_0_8px_red]"></div>
               <div className="absolute bottom-12 right-32 w-2 h-2 bg-blue-400 rounded-full shadow-[0_0_8px_cyan]"></div>
            </div>
          </Card>

          {/* Alerts Overview */}
          <Card className="col-span-5 h-64">
            <h3 className="text-xs font-bold uppercase tracking-wider mb-4">Alerts Overview</h3>
            <div className="space-y-4">
              <ProgressBar label="Level 10 CRITICAL" value="90%" color="bg-blue-500" />
              <ProgressBar label="Level 05 WARNING" value="45%" color="bg-cyan-500" />
              <ProgressBar label="Level 02 MINOR" value="30%" color="bg-blue-800" />
            </div>
          </Card>

          {/* Threat Map / Bottom Activity */}
          <Card className="col-span-12 h-40">
            <h3 className="text-xs font-bold uppercase tracking-wider mb-4">Threat Map Activity</h3>
            <div className="space-y-2 font-mono text-[10px]">
              <div className="flex justify-between items-center text-orange-400">
                <span>DETECTED: UNKNOWN PACKET FROM 192.168.1.1</span>
                <span className="px-2 py-0.5 border border-orange-400 rounded">RESOLVING</span>
              </div>
              <div className="flex justify-between items-center text-blue-400">
                <span>ENCRYPTING CONNECTION FROM TOKYO NODES</span>
                <span className="px-2 py-0.5 border border-blue-400 rounded">ACTIVE</span>
              </div>
            </div>
          </Card>

        </div>
      </main>
    </div>
  );
};

// --- Helper Components ---

const NavItem = ({ icon, label, active = false }) => (
  <div className={`flex items-center gap-4 px-4 py-3 rounded-lg cursor-pointer transition-all ${
    active ? 'bg-blue-600/10 text-blue-400 border-l-4 border-blue-600' : 'hover:bg-slate-800/50'
  }`}>
    {icon}
    <span className="text-sm font-medium">{label}</span>
  </div>
);

const Card = ({ children, className }) => (
  <div className={`bg-[#0b1224] border border-slate-800 p-5 rounded-xl shadow-2xl ${className}`}>
    {children}
  </div>
);

const ProgressBar = ({ label, value, color }) => (
  <div className="space-y-1">
    <div className="flex justify-between text-[10px] font-bold">
      <span>{label}</span>
      <span>{value}</span>
    </div>
    <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
      <div className={`${color} h-full`} style={{ width: value }}></div>
    </div>
  </div>
);

export default CyberDashboard;