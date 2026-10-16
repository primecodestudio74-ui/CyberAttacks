import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  ChevronLeft, Lock, Unlock, ShieldCheck, Terminal, Zap, Database,
  ArrowRight, LayoutDashboard, Activity, ShieldAlert, CheckCircle2,
  XCircle, RotateCcw, Server, Trash2, Wifi, Gauge, Rocket, Flame,
  Globe, Clock, Filter
} from 'lucide-react';

/* ------------------------------------------------------------------ */
/*  SIMULATION DATA (all values are mock — no real traffic is sent)    */
/* ------------------------------------------------------------------ */

const LEGIT_RPS = 80; // normal legitimate traffic (req/s)
const TICKS = 24;     // simulation length
const TICK_MS = 500;

const serverPresets = [
  { id: 'vps', label: 'Small VPS', capacity: 200, note: '1 vCPU / 1GB' },
  { id: 'mid', label: 'Mid Server', capacity: 500, note: '4 vCPU / 8GB' },
  { id: 'cluster', label: 'App Cluster', capacity: 1500, note: '3 nodes' },
];

const defenseList = [
  { id: 'rateLimit', title: 'Rate Limiting', icon: Gauge, desc: 'Cap requests per IP (HTTP 429)' },
  { id: 'waf', title: 'WAF Rules', icon: Filter, desc: 'Block bad signatures & bots' },
  { id: 'cdn', title: 'CDN / Load Balancer', icon: Globe, desc: 'Absorb & distribute traffic' },
  { id: 'timeout', title: 'Timeouts + SYN Cookies', icon: Clock, desc: 'Drop slow / half-open connections' },
];

const attackVectors = [
  {
    id: 'http',
    title: 'HTTP Flood',
    layer: 'Layer 7',
    payload: 'botnet_sim: 4000 req/s -> GET /api/search',
    rate: 4000,
    intel: 'A swarm of bots (DDoS) sends huge volumes of legitimate-looking HTTP requests until the app runs out of CPU, threads or DB connections.',
    mitigation: { rateLimit: 0.55, waf: 0.25, cdn: 0.15, timeout: 0 },
    logLine: (n) => `[FLOOD] ${n} GET /api/search?q=... from bot-pool -> 200_OK (queue growing)`,
    vulnCode: `app.get('/api/search', async (req, res) => {
  // no limits, no caching, no auth
  const rows = await db.query(
    'SELECT * FROM products WHERE name LIKE ?',
    ['%' + req.query.q + '%']
  );
  res.json(rows);
});`,
    fixCode: `app.use(rateLimit({ windowMs: 60_000, max: 100 }));
app.use(cache({ ttl: 30 }));          // CDN / edge cache
app.get('/api/search', validate(schema), async (req, res) => {
  const rows = await searchIndex.query(req.query.q);
  res.json(rows);
});`,
  },
  {
    id: 'syn',
    title: 'SYN Flood',
    layer: 'Layer 4',
    payload: 'spoofed_sim: 2500 SYN/s -> :443',
    rate: 2500,
    intel: 'Attackers start TCP handshakes but never finish them, filling the server connection table with half-open connections.',
    mitigation: { rateLimit: 0.1, waf: 0, cdn: 0.15, timeout: 0.7 },
    logLine: (n) => `[SYN] ${n} half-open connections -> backlog queue ${Math.min(100, Math.round(n / 40))}% full`,
    vulnCode: `# /etc/sysctl.conf (defaults)
net.ipv4.tcp_syncookies = 0
net.ipv4.tcp_max_syn_backlog = 128
net.ipv4.tcp_synack_retries = 5`,
    fixCode: `# /etc/sysctl.conf (hardened)
net.ipv4.tcp_syncookies = 1
net.ipv4.tcp_max_syn_backlog = 4096
net.ipv4.tcp_synack_retries = 2
# + upstream DDoS scrubbing / firewall limits`,
  },
  {
    id: 'slow',
    title: 'Slowloris',
    layer: 'Layer 7',
    payload: 'slow_sim: 900 open conns, 1 byte / 10s',
    rate: 900,
    intel: 'Low-bandwidth attack: connections are held open by sending partial headers very slowly, exhausting the web server worker pool.',
    mitigation: { rateLimit: 0.05, waf: 0.1, cdn: 0.05, timeout: 0.75 },
    logLine: (n) => `[SLOW] ${n} connections holding workers -> header sent: "X-a: b" (partial)`,
    vulnCode: `server {
  listen 80;
  # default / very long timeouts
  client_header_timeout 600s;
  client_body_timeout   600s;
  keepalive_timeout     600s;
}`,
    fixCode: `server {
  listen 80;
  client_header_timeout 10s;
  client_body_timeout   10s;
  keepalive_timeout     15s;
  limit_conn addr 20;       # per-IP connection cap
}`,
  },
];

/* ------------------------------------------------------------------ */

const DosAttack = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [server, setServer] = useState({ name: '', capacity: 500 });
  const [deployed, setDeployed] = useState(null);
  const [defenses, setDefenses] = useState({ rateLimit: false, waf: false, cdn: false, timeout: false });
  const [selectedVector, setSelectedVector] = useState(attackVectors[0]);
  const [terminalLines, setTerminalLines] = useState([]);
  const [isAttacking, setIsAttacking] = useState(false);
  const [history, setHistory] = useState([]);
  const [metrics, setMetrics] = useState({ load: 0, attackRps: 0, served: 100, dropped: 0, status: 'ONLINE' });
  const [report, setReport] = useState(null);

  const terminalEndRef = useRef(null);
  const intervalRef = useRef(null);
  const defensesRef = useRef(defenses);

  useEffect(() => { defensesRef.current = defenses; }, [defenses]);

  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [terminalLines]);

  useEffect(() => () => clearInterval(intervalRef.current), []);

  const activeDefenseCount = Object.values(defenses).filter(Boolean).length;

  const handleDeploy = () => {
    const name = server.name.trim() || 'api-prod-01';
    setDeployed({ name, capacity: server.capacity });
  };

  const quickSeed = () => {
    setServer({ name: 'api-prod-01', capacity: 500 });
    setDeployed({ name: 'api-prod-01', capacity: 500 });
  };

  const stopSim = () => {
    clearInterval(intervalRef.current);
    intervalRef.current = null;
  };

  const resetLab = () => {
    stopSim();
    setDeployed(null);
    setServer({ name: '', capacity: 500 });
    setDefenses({ rateLimit: false, waf: false, cdn: false, timeout: false });
    setTerminalLines([]);
    setHistory([]);
    setReport(null);
    setIsAttacking(false);
    setMetrics({ load: 0, attackRps: 0, served: 100, dropped: 0, status: 'ONLINE' });
    setStep(0);
  };

  const mitigationFor = (vector) => {
    const total = Object.entries(vector.mitigation).reduce(
      (acc, [k, v]) => acc + (defensesRef.current[k] ? v : 0), 0
    );
    return Math.min(0.95, total);
  };

  const executeAttack = (vector) => {
    if (!deployed || isAttacking) return;
    setSelectedVector(vector);
    setIsAttacking(true);
    setHistory([]);
    setReport(null);
    setMetrics({ load: 0, attackRps: 0, served: 100, dropped: 0, status: 'ONLINE' });

    const activeNames = defenseList.filter(d => defensesRef.current[d.id]).map(d => d.title);
    setTerminalLines([
      `[TARGET] ${deployed.name} (capacity ${deployed.capacity} req/s)`,
      `[LOAD] Vector: ${vector.title} (${vector.layer}) — SIMULATED`,
      `[DEF] Active defenses: ${activeNames.length ? activeNames.join(', ') : 'NONE'}`,
      `[BASE] Legitimate traffic: ${LEGIT_RPS} req/s`,
    ]);

    let tick = 0;
    let downTicks = 0;
    let servedSum = 0;
    let peakLoad = 0;

    stopSim();
    intervalRef.current = setInterval(() => {
      tick += 1;
      const ramp = Math.min(1, tick / 4);
      const mitigation = mitigationFor(vector);
      const rawAttack = Math.round(vector.rate * ramp);
      const effective = Math.round(rawAttack * (1 - mitigation));
      const blocked = rawAttack - effective;
      const load = (effective + LEGIT_RPS) / deployed.capacity;
      const servedPct = load <= 1 ? 100 : Math.round(100 / load);
      const status = load < 0.7 ? 'ONLINE' : load < 1 ? 'DEGRADED' : 'DOWN';

      peakLoad = Math.max(peakLoad, load);
      servedSum += servedPct;
      if (status === 'DOWN') downTicks += 1;

      setHistory(prev => [...prev, { load, status }].slice(-TICKS));
      setMetrics({ load, attackRps: rawAttack, served: servedPct, dropped: blocked, status });

      const lines = [vector.logLine(rawAttack)];
      if (mitigation > 0 && blocked > 0) {
        lines.push(`[BLOCK] Defenses dropped ${blocked} req/s (${Math.round(mitigation * 100)}% mitigated)`);
      }
      if (status === 'DEGRADED') lines.push(`[WARN] Latency rising — load ${Math.round(load * 100)}%`);
      if (status === 'DOWN') lines.push(`[CRIT] 503 Service Unavailable — legit users served: ${servedPct}%`);
      setTerminalLines(prev => [...prev, ...lines]);

      if (tick >= TICKS) {
        stopSim();
        const avgServed = Math.round(servedSum / TICKS);
        const survived = downTicks === 0;
        setTerminalLines(prev => [
          ...prev,
          survived
            ? `[RESULT] Server SURVIVED. Avg legit users served: ${avgServed}%`
            : `[RESULT] Server DOWN for ${downTicks}/${TICKS} ticks. Avg legit users served: ${avgServed}%`,
        ]);
        setReport({ survived, avgServed, downTicks, peak: Math.round(peakLoad * 100), vector: vector.title });
        setIsAttacking(false);
      }
    }, TICK_MS);
  };

  const statusColor = {
    ONLINE: 'text-emerald-400',
    DEGRADED: 'text-amber-400',
    DOWN: 'text-red-400',
  }[metrics.status];

  const barColor = (s) => (s === 'ONLINE' ? 'bg-emerald-500' : s === 'DEGRADED' ? 'bg-amber-400' : 'bg-red-500');

  return (
    <div className="min-h-screen bg-[#020617] text-slate-300 font-sans p-4 sm:p-8 selection:bg-cyan-500/30">
      <div className="max-w-6xl mx-auto">

        {/* HEADER */}
        <header className="flex flex-col sm:flex-row justify-between items-center mb-10 gap-6">
          <div className="flex items-center gap-4 w-full sm:w-auto">
            <button onClick={() => navigate('/dashboard')} className="bg-cyan-500 p-2.5 rounded-xl hover:bg-cyan-400 transition-colors shrink-0">
              <ChevronLeft className="text-black" size={20} />
            </button>
            <div>
              <h1 className="text-xl md:text-2xl font-black text-white uppercase italic tracking-tighter">HackAware <span className="text-cyan-500 text-xs md:text-sm">PRO</span></h1>
              <p className="text-[9px] font-mono text-slate-500 uppercase tracking-[0.2em]">DoS / DDoS Lab / Node_Mumbai</p>
            </div>
          </div>

          <div className="flex bg-slate-900/80 p-1 rounded-xl border border-slate-800 shadow-lg w-full sm:w-auto">
            <button onClick={() => navigate('/dashboard')} className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-[10px] font-black text-slate-600 hover:text-white uppercase transition-all">
              <LayoutDashboard size={14} /> <span>Dashboard</span>
            </button>
            <div className="w-[1px] h-4 bg-slate-800 my-auto mx-1" />
            <button className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-[10px] font-black bg-cyan-500 text-black uppercase shadow-[0_0_15px_rgba(6,182,212,0.3)]">
              <Wifi size={14} /> DoS_Lab
            </button>
          </div>
        </header>

        {/* SIMULATION NOTICE */}
        <p className="text-center text-[9px] font-mono text-slate-600 uppercase tracking-widest mb-6">
          Educational simulation only — no real network traffic is generated
        </p>

        {/* STEP NAVIGATION */}
        <div className="mb-8 flex justify-center">
          <div className="flex bg-slate-900/40 p-1 rounded-xl border border-slate-800 backdrop-blur-md max-w-full overflow-x-auto scrollbar-none">
            {['1. Target', '2. Flood', '3. Defense'].map((label, i) => {
              const isLocked = i > 0 && !deployed;
              return (
                <button
                  key={i}
                  onClick={() => !isLocked && !isAttacking && setStep(i)}
                  disabled={isLocked}
                  className={`px-3.5 shrink-0 sm:px-6 py-2 rounded-lg text-[10px] font-black uppercase transition-all
                    ${step === i ? 'text-cyan-400 bg-cyan-500/10' : 'text-slate-600'}
                    ${isLocked ? 'opacity-30 cursor-not-allowed' : 'hover:text-slate-300'}`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        <AnimatePresence mode="wait">

          {/* ------------------------- STEP 1: TARGET ------------------------- */}
          {step === 0 && (
            <motion.div key="s1" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div className="bg-slate-900/40 border border-slate-800 p-6 rounded-3xl backdrop-blur-sm">
                  <h3 className="text-white text-xs font-black uppercase mb-6 flex items-center gap-2"><Server size={16} className="text-cyan-500" /> Target Server</h3>
                  <div className="space-y-4">
                    <input
                      value={server.name}
                      onChange={e => setServer({ ...server, name: e.target.value })}
                      placeholder="Set Server Name (e.g. api-prod-01)"
                      className="w-full bg-black/50 border border-slate-800 p-4 rounded-xl text-xs outline-none focus:border-cyan-500 transition-all"
                    />

                    <div className="grid grid-cols-1 min-[420px]:grid-cols-3 gap-2">
                      {serverPresets.map(p => (
                        <button
                          key={p.id}
                          onClick={() => setServer({ ...server, capacity: p.capacity })}
                          className={`p-3 rounded-xl border text-left transition-all
                            ${server.capacity === p.capacity ? 'border-cyan-500 bg-cyan-500/10' : 'border-slate-800 bg-black/30 hover:border-slate-600'}`}
                        >
                          <div className="text-[10px] font-black text-white uppercase">{p.label}</div>
                          <div className="text-[9px] font-mono text-cyan-500">{p.capacity} req/s</div>
                          <div className="text-[8px] text-slate-600">{p.note}</div>
                        </button>
                      ))}
                    </div>

                    <button onClick={handleDeploy} className="w-full py-4 bg-cyan-600/10 border border-cyan-500/30 text-cyan-500 font-black text-[10px] uppercase rounded-xl hover:bg-cyan-500 hover:text-black transition-all flex items-center justify-center gap-2">
                      <Rocket size={14} /> Deploy Server
                    </button>
                    <button onClick={quickSeed} className="w-full py-4 bg-slate-800 text-slate-400 font-black text-[10px] uppercase rounded-xl border border-slate-700">Quick Seed</button>
                    {deployed && (
                      <button onClick={() => setStep(1)} className="w-full py-4 bg-cyan-500 text-black font-black uppercase text-[10px] rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20">
                        Proceed to Flood Lab <ArrowRight size={14} />
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="bg-black/40 border border-slate-800 p-8 rounded-3xl flex flex-col h-full min-h-[400px]">
                <h3 className="text-slate-600 text-[10px] font-black uppercase mb-6 flex items-center gap-2 tracking-widest"><Database size={14} /> Live Server Status</h3>
                <div className="space-y-3 flex-1">
                  {deployed ? (
                    <>
                      <div className="bg-slate-900/40 p-4 rounded-xl flex justify-between items-center border border-slate-800/50">
                        <div className="flex flex-col">
                          <span className="text-xs font-mono text-slate-300">{deployed.name}</span>
                          <span className="text-[9px] text-emerald-500 uppercase font-black tracking-tighter">Status: Online</span>
                        </div>
                        <span className="text-[10px] font-mono text-cyan-500/70">{deployed.capacity} req/s max</span>
                      </div>
                      <div className="bg-slate-900/40 p-4 rounded-xl border border-slate-800/50">
                        <div className="flex justify-between text-[9px] font-black uppercase text-slate-600 mb-2">
                          <span>Normal Load</span><span>{Math.round((LEGIT_RPS / deployed.capacity) * 100)}%</span>
                        </div>
                        <div className="h-2 bg-black rounded-full overflow-hidden">
                          <div className="h-full bg-emerald-500" style={{ width: `${Math.min(100, (LEGIT_RPS / deployed.capacity) * 100)}%` }} />
                        </div>
                        <p className="text-[9px] text-slate-600 mt-3">{LEGIT_RPS} legitimate req/s hitting this server right now.</p>
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-20 text-[10px] text-slate-700 italic uppercase">Awaiting Server Deployment...</div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* ------------------------- STEP 2: FLOOD ------------------------- */}
          {step === 1 && (
            <motion.div key="s2" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              <div className="lg:col-span-5 space-y-4">
                <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2"><Zap size={14} /> Select Vector</h3>
                {attackVectors.map(v => (
                  <button
                    key={v.id}
                    onClick={() => executeAttack(v)}
                    disabled={isAttacking}
                    className="w-full p-6 bg-slate-900/30 border border-slate-800 rounded-[2rem] text-left hover:border-red-500/50 transition-all group disabled:opacity-50"
                  >
                    <div className="flex justify-between items-center mb-3 text-white uppercase italic text-xs font-black">
                      <span>{v.title} <span className="text-[9px] text-slate-600 not-italic ml-1">{v.layer}</span></span>
                      <Activity size={14} className={isAttacking && selectedVector.id === v.id ? 'text-red-500 animate-pulse' : 'text-slate-600'} />
                    </div>
                    <code className="block bg-black p-3 text-[10px] text-red-400 font-mono mb-3 rounded-xl border border-red-900/20 truncate">{v.payload}</code>
                    <p className="text-[10px] text-slate-500 leading-relaxed">{v.intel}</p>
                  </button>
                ))}

                {report && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className={`p-6 rounded-3xl border ${report.survived ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-red-500/10 border-red-500/30'}`}
                  >
                    <div className={`flex items-center gap-2 mb-4 text-xs font-black uppercase ${report.survived ? 'text-emerald-400' : 'text-red-400'}`}>
                      {report.survived ? <ShieldCheck size={16} /> : <ShieldAlert size={16} />}
                      {report.survived ? 'Server Survived' : 'Service Knocked Offline'}
                    </div>
                    <div className="space-y-1 text-[10px] font-mono">
                      <div className="flex justify-between"><span className="text-slate-500">Vector</span><span className="text-slate-300">{report.vector}</span></div>
                      <div className="flex justify-between"><span className="text-slate-500">Peak load</span><span className="text-slate-300">{report.peak}%</span></div>
                      <div className="flex justify-between"><span className="text-slate-500">Downtime ticks</span><span className="text-slate-300">{report.downTicks}/{TICKS}</span></div>
                      <div className="flex justify-between"><span className="text-slate-500">Legit users served</span><span className="text-slate-300">{report.avgServed}%</span></div>
                    </div>
                  </motion.div>
                )}

                <button onClick={() => setStep(2)} disabled={isAttacking} className="w-full py-4 bg-slate-800 text-slate-300 font-black uppercase text-[10px] rounded-xl flex items-center justify-center gap-2 border border-slate-700 disabled:opacity-50">
                  View Defense Playbook <ArrowRight size={14} />
                </button>
              </div>

              <div className="lg:col-span-7 space-y-4">
                {/* METRICS */}
                <div className="bg-black/60 border border-slate-800 rounded-3xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                      <Flame size={14} /> Server Load
                    </h3>
                    <div className="flex items-center gap-3">
                      {activeDefenseCount > 0 && (
                        <span className="text-[9px] font-black text-emerald-500 uppercase flex items-center gap-1">
                          <ShieldCheck size={12} /> {activeDefenseCount} Defense{activeDefenseCount > 1 ? 's' : ''} Active
                        </span>
                      )}
                      <span className={`text-[10px] font-black uppercase ${statusColor}`}>{metrics.status}</span>
                    </div>
                  </div>

                  <div className="h-3 bg-slate-900 rounded-full overflow-hidden mb-4">
                    <motion.div
                      className={`h-full ${barColor(metrics.status)}`}
                      animate={{ width: `${Math.min(100, metrics.load * 100)}%` }}
                      transition={{ duration: 0.4 }}
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-3 text-center mb-5">
                    <div className="bg-slate-900/50 rounded-xl p-3 border border-slate-800">
                      <div className="text-sm font-black text-white font-mono">{metrics.attackRps}</div>
                      <div className="text-[8px] uppercase text-slate-600 font-black">Attack req/s</div>
                    </div>
                    <div className="bg-slate-900/50 rounded-xl p-3 border border-slate-800">
                      <div className="text-sm font-black text-emerald-400 font-mono">{metrics.dropped}</div>
                      <div className="text-[8px] uppercase text-slate-600 font-black">Blocked req/s</div>
                    </div>
                    <div className="bg-slate-900/50 rounded-xl p-3 border border-slate-800">
                      <div className={`text-sm font-black font-mono ${metrics.served < 100 ? 'text-red-400' : 'text-cyan-400'}`}>{metrics.served}%</div>
                      <div className="text-[8px] uppercase text-slate-600 font-black">Users Served</div>
                    </div>
                  </div>

                  {/* MINI CHART */}
                  <div className="flex items-end gap-[3px] h-16 border-b border-slate-800 pb-1">
                    {history.length === 0 && <div className="text-[10px] text-slate-700 italic w-full text-center self-center">Load history appears here...</div>}
                    {history.map((h, i) => (
                      <div key={i} className={`flex-1 rounded-t-sm ${barColor(h.status)}`} style={{ height: `${Math.max(4, Math.min(100, h.load * 100))}%` }} />
                    ))}
                  </div>
                </div>

                {/* CONSOLE */}
                <div className="bg-black/60 border border-slate-800 rounded-3xl p-6 flex flex-col h-[300px]">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                      <Terminal size={14} /> Live Console
                    </h3>
                  </div>
                  <div className="flex-1 overflow-y-auto font-mono text-[11px] space-y-1 pr-2">
                    {terminalLines.length === 0 && (
                      <div className="text-slate-700 italic">Select an attack vector to begin simulation...</div>
                    )}
                    {terminalLines.map((line, i) => (
                      <div
                        key={i}
                        className={
                          line.includes('CRIT') || line.includes('DOWN') ? 'text-red-400 font-bold' :
                          line.includes('BLOCK') || line.includes('SURVIVED') ? 'text-emerald-400 font-bold' :
                          line.includes('WARN') ? 'text-amber-400' :
                          line.includes('FLOOD') || line.includes('SYN]') || line.includes('SLOW') ? 'text-red-400/80' :
                          'text-slate-500'
                        }
                      >
                        {line}
                      </div>
                    ))}
                    <div ref={terminalEndRef} />
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* ------------------------- STEP 3: DEFENSE ------------------------- */}
          {step === 2 && (
            <motion.div key="s3" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="grid grid-cols-1 lg:grid-cols-2 gap-8">

              <div className="lg:col-span-2 flex flex-wrap gap-2 justify-center">
                {attackVectors.map(v => (
                  <button
                    key={v.id}
                    onClick={() => setSelectedVector(v)}
                    className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase border transition-all
                      ${selectedVector.id === v.id ? 'border-cyan-500 text-cyan-400 bg-cyan-500/10' : 'border-slate-800 text-slate-600 hover:text-slate-300'}`}
                  >
                    {v.title}
                  </button>
                ))}
              </div>

              <div className="bg-slate-900/40 border border-slate-800 p-6 rounded-3xl">
                <h3 className="text-red-400 text-[10px] font-black uppercase mb-4 flex items-center gap-2"><XCircle size={14} /> Vulnerable Config</h3>
                <pre className="bg-black p-4 rounded-xl text-[10px] text-red-300 font-mono overflow-x-auto whitespace-pre-wrap">
                  {selectedVector.vulnCode}
                </pre>
              </div>
              <div className="bg-slate-900/40 border border-slate-800 p-6 rounded-3xl">
                <h3 className="text-emerald-400 text-[10px] font-black uppercase mb-4 flex items-center gap-2"><CheckCircle2 size={14} /> Hardened Config</h3>
                <pre className="bg-black p-4 rounded-xl text-[10px] text-emerald-300 font-mono overflow-x-auto whitespace-pre-wrap">
                  {selectedVector.fixCode}
                </pre>
              </div>

              <div className="lg:col-span-2 bg-slate-900/40 border border-slate-800 p-6 rounded-3xl">
                <h3 className="text-white text-[10px] font-black uppercase mb-4 flex items-center gap-2"><ShieldCheck size={14} className="text-cyan-500" /> Remediation Checklist</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                  {defenseList.map(d => {
                    const Icon = d.icon;
                    const on = defenses[d.id];
                    const effect = Math.round((selectedVector.mitigation[d.id] || 0) * 100);
                    return (
                      <button
                        key={d.id}
                        onClick={() => setDefenses(prev => ({ ...prev, [d.id]: !prev[d.id] }))}
                        className={`flex items-center gap-3 text-left p-4 rounded-xl border transition-all
                          ${on ? 'bg-emerald-500/10 border-emerald-500/40' : 'bg-black/40 border-slate-800 hover:border-slate-600'}`}
                      >
                        <Icon size={16} className={on ? 'text-emerald-400 shrink-0' : 'text-slate-600 shrink-0'} />
                        <div className="flex-1">
                          <div className="text-[10px] font-black uppercase text-slate-200">{d.title}</div>
                          <div className="text-[9px] text-slate-500">{d.desc}</div>
                        </div>
                        <div className="text-right">
                          <div className={`text-[10px] font-mono ${on ? 'text-emerald-400' : 'text-slate-600'}`}>-{effect}%</div>
                          {on ? <Lock size={12} className="text-emerald-400 ml-auto" /> : <Unlock size={12} className="text-slate-600 ml-auto" />}
                        </div>
                      </button>
                    );
                  })}
                </div>

                <button
                  onClick={() => setDefenses({ rateLimit: true, waf: true, cdn: true, timeout: true })}
                  className="w-full py-4 font-black text-[10px] uppercase rounded-xl flex items-center justify-center gap-2 transition-all bg-cyan-600/10 border border-cyan-500/30 text-cyan-500 hover:bg-cyan-500 hover:text-black"
                >
                  <ShieldCheck size={14} /> Enable All Defenses
                </button>

                <button
                  onClick={() => setStep(1)}
                  className="w-full mt-3 py-4 bg-slate-800 text-slate-300 font-black text-[10px] uppercase rounded-xl border border-slate-700 flex items-center justify-center gap-2"
                >
                  Re-run Attack With Defenses <RotateCcw size={14} />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* FOOTER RESET */}
        <div className="mt-10 flex justify-center">
          <button onClick={resetLab} className="flex items-center gap-2 text-[10px] font-black text-slate-600 hover:text-red-400 uppercase transition-colors">
            <Trash2 size={12} /> Reset Lab Environment
          </button>
        </div>

      </div>
    </div>
  );
};

export default DosAttack;