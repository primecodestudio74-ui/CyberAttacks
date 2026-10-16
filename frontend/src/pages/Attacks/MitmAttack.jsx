import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  ChevronLeft, Lock, Unlock, ShieldCheck, ShieldAlert, Terminal,
  ArrowRight, LayoutDashboard, Activity, CheckCircle2, XCircle,
  RotateCcw, Trash2, Wifi, WifiOff, Eye, EyeOff, Router, Smartphone,
  Server, Radio, KeyRound, Users, Zap, Lock as LockIcon
} from 'lucide-react';

/* ------------------------------------------------------------------ */
/*  SIMULATION DATA (all values are mock — nothing here touches a real */
/*  network; it is a pure client-side animation)                       */
/* ------------------------------------------------------------------ */

const networkPresets = [
  { id: 'public', label: 'Public Wi-Fi', risk: 'HIGH', note: '"Free_Airport_WiFi" — open, unauthenticated' },
  { id: 'home', label: 'Home Wi-Fi', risk: 'MEDIUM', note: 'WPA2, shared network' },
  { id: 'vpn', label: 'VPN Tunnel', risk: 'LOW', note: 'Traffic tunneled & encrypted end-to-end' },
];

const defenseList = [
  { id: 'https', title: 'Force HTTPS', icon: Lock, desc: 'Encrypt every request with TLS' },
  { id: 'hsts', title: 'HSTS', icon: ShieldCheck, desc: 'Browser refuses silent HTTP downgrade' },
  { id: 'vpn', title: 'VPN Tunnel', icon: Wifi, desc: 'Encrypt traffic before it hits the local network' },
  { id: 'certPin', title: 'Certificate Pinning', icon: KeyRound, desc: 'Reject forged / substituted TLS certs' },
];

const packetTemplates = [
  { path: 'GET /dashboard', body: null },
  { path: 'POST /login', body: (u) => `username=${u.user}&password=${u.pass}` },
  { path: 'GET /account/balance', body: () => 'session=sid_8f21ac' },
  { path: 'POST /transfer', body: () => 'to=acct_9931&amount=50000' },
];

const attackVectors = [
  {
    id: 'sniff',
    title: 'Packet Sniffing',
    layer: 'Passive',
    intel: 'On an open Wi-Fi network, the attacker just listens. Any request sent over plain HTTP is readable the moment it leaves your device.',
    mitigation: { https: 0.9, hsts: 0.1, vpn: 0.85, certPin: 0 },
    vulnCode: `// server.js
app.listen(80); // plain HTTP, no TLS at all
app.post('/login', (req, res) => {
  checkPassword(req.body.username, req.body.password);
});`,
    fixCode: `// server.js
const https = require('https');
https.createServer(tlsOptions, app).listen(443);
app.use(helmet.hsts({ maxAge: 31536000 }));
app.use(forceSSL()); // redirect any :80 request to :443`,
  },
  {
    id: 'sslstrip',
    title: 'SSL Stripping',
    layer: 'Active',
    intel: 'The attacker sits between you and the real site, quietly rewriting "https://" links to "http://" — your browser never sees the padlock disappear until it\'s too late.',
    mitigation: { https: 0.2, hsts: 0.9, vpn: 0.6, certPin: 0.3 },
    vulnCode: `// No HSTS header -> browser will happily
// follow a http:// link the attacker injected
res.redirect('http://bank.example.com/login');`,
    fixCode: `// Strict-Transport-Security forces HTTPS
// for every future request, even typed ones
res.setHeader(
  'Strict-Transport-Security',
  'max-age=63072000; includeSubDomains; preload'
);`,
  },
  {
    id: 'arp',
    title: 'ARP Spoofing',
    layer: 'Local Network',
    intel: 'On a shared LAN, the attacker broadcasts forged ARP replies claiming to be the router. Every device on the network starts routing traffic through them.',
    mitigation: { https: 0.5, hsts: 0.2, vpn: 0.9, certPin: 0.4 },
    vulnCode: `# switch config (defaults)
no arp inspection
no port-security
no dhcp-snooping`,
    fixCode: `# switch config (hardened)
ip arp inspection vlan 10
ip dhcp snooping
switchport port-security maximum 1`,
  },
];

/* ------------------------------------------------------------------ */

const MitmAttack = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [victim, setVictim] = useState({ user: '', pass: '' });
  const [network, setNetwork] = useState(networkPresets[0]);
  const [deployed, setDeployed] = useState(null);
  const [defenses, setDefenses] = useState({ https: false, hsts: false, vpn: false, certPin: false });
  const [selectedVector, setSelectedVector] = useState(attackVectors[0]);
  const [terminalLines, setTerminalLines] = useState([]);
  const [isAttacking, setIsAttacking] = useState(false);
  const [packetPos, setPacketPos] = useState(0); // 0 = at user, 1 = at attacker, 2 = at server
  const [packetState, setPacketState] = useState('idle'); // idle | traveling | captured | encrypted
  const [inspector, setInspector] = useState(null);
  const [captured, setCaptured] = useState([]);
  const [report, setReport] = useState(null);

  const terminalEndRef = useRef(null);
  const defensesRef = useRef(defenses);
  const cancelRef = useRef(false);

  useEffect(() => { defensesRef.current = defenses; }, [defenses]);
  useEffect(() => { terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [terminalLines]);
  useEffect(() => () => { cancelRef.current = true; }, []);

  const activeDefenseCount = Object.values(defenses).filter(Boolean).length;

  const quickSeed = () => {
    setVictim({ user: 'aniket_barai', pass: 'Summer@2026' });
    setDeployed({ user: 'aniket_barai', pass: 'Summer@2026' });
    setStep(1); // jump straight to the attack screen
  };

  const canDeploy = victim.user.trim().length > 0 && victim.pass.trim().length > 0;

  const handleDeploy = () => {
    if (!canDeploy) return;
    setDeployed({ user: victim.user.trim(), pass: victim.pass.trim() });
    setStep(1); // jump straight to the attack screen
  };

  const resetLab = () => {
    cancelRef.current = true;
    setDeployed(null);
    setVictim({ user: '', pass: '' });
    setNetwork(networkPresets[0]);
    setDefenses({ https: false, hsts: false, vpn: false, certPin: false });
    setTerminalLines([]);
    setCaptured([]);
    setReport(null);
    setIsAttacking(false);
    setPacketPos(0);
    setPacketState('idle');
    setInspector(null);
    setStep(0);
  };

  const mitigationFor = (vector) => {
    const total = Object.entries(vector.mitigation).reduce(
      (acc, [k, v]) => acc + (defensesRef.current[k] ? v : 0), 0
    );
    return Math.min(0.95, total);
  };

  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  const executeAttack = async (vector) => {
    if (!deployed || isAttacking) return;
    cancelRef.current = false;
    setSelectedVector(vector);
    setIsAttacking(true);
    setCaptured([]);
    setReport(null);
    setPacketState('idle');
    setPacketPos(0);
    setInspector(null);

    const activeNames = defenseList.filter((d) => defensesRef.current[d.id]).map((d) => d.title);
    setTerminalLines([
      `[NET] Joined network: ${network.label} (risk: ${network.risk})`,
      `[ATTACK] Vector: ${vector.title} (${vector.layer}) — SIMULATED, no real packets sent`,
      `[DEF] Active defenses: ${activeNames.length ? activeNames.join(', ') : 'NONE'}`,
    ]);

    const mitigation = mitigationFor(vector);
    let stolenCount = 0;
    let blockedCount = 0;

    for (let i = 0; i < packetTemplates.length; i++) {
      if (cancelRef.current) return;
      const pkt = packetTemplates[i];
      const bodyText = pkt.body ? pkt.body(deployed) : null;
      const willBeCaptured = (1 - mitigation) > 0.45; // deterministic threshold on effective mitigation

      // travel to attacker
      setPacketState('traveling');
      setPacketPos(0.5);
      setTerminalLines((prev) => [...prev, `[SEND] ${pkt.path}${bodyText ? ' ' + bodyText.slice(0, 18) + (willBeCaptured ? '' : ' (encrypted)') : ''}`]);
      await sleep(550);
      if (cancelRef.current) return;

      setPacketPos(1);
      await sleep(250);

      if (willBeCaptured) {
        stolenCount += 1;
        setPacketState('captured');
        setInspector({ path: pkt.path, body: bodyText || '(no body)', readable: true });
        setTerminalLines((prev) => [...prev, `[INTERCEPT] Attacker captured plaintext -> ${bodyText || pkt.path}`]);
        if (bodyText && pkt.path === 'POST /login') {
          setCaptured((prev) => [...prev, { user: deployed.user, pass: deployed.pass }]);
          setTerminalLines((prev) => [...prev, `[CRIT] Credentials stolen: ${deployed.user} / ${deployed.pass}`]);
        }
      } else {
        blockedCount += 1;
        setPacketState('encrypted');
        const hex = Array.from({ length: 8 }, () => Math.floor(Math.random() * 255).toString(16).padStart(2, '0')).join('');
        setInspector({ path: pkt.path, body: `${hex}...${hex.slice(0, 6)} (TLS encrypted)`, readable: false });
        setTerminalLines((prev) => [...prev, `[BLOCK] Payload encrypted — attacker sees ciphertext only`]);
      }
      await sleep(500);
      if (cancelRef.current) return;

      // travel to server
      setPacketState('traveling');
      setPacketPos(1.5);
      await sleep(450);
      if (cancelRef.current) return;
      setPacketPos(2);
      setTerminalLines((prev) => [...prev, `[RECV] Server processed ${pkt.path} -> 200 OK`]);
      await sleep(400);
      if (cancelRef.current) return;

      setPacketPos(0);
      setPacketState('idle');
      await sleep(300);
    }

    const survived = stolenCount === 0;
    setTerminalLines((prev) => [
      ...prev,
      survived
        ? `[RESULT] All ${packetTemplates.length} packets stayed encrypted. Attacker learned nothing.`
        : `[RESULT] ${stolenCount}/${packetTemplates.length} packets intercepted in plaintext. ${blockedCount} blocked.`,
    ]);
    setReport({ survived, stolenCount, blockedCount, total: packetTemplates.length, vector: vector.title });
    setIsAttacking(false);
  };

  const nodeActive = (idx) => {
    // idx 0 = user, 1 = attacker, 2 = server
    if (!isAttacking) return false;
    if (idx === 0) return packetPos <= 0.5;
    if (idx === 1) return packetPos > 0.5 && packetPos < 1.5;
    return packetPos >= 1.5;
  };

  return (
    <div className="min-h-screen bg-[#020617] text-slate-300 font-sans p-4 sm:p-8 selection:bg-cyan-500/30">
      <div className="max-w-6xl mx-auto">

        {/* HEADER */}
        <header className="flex flex-col sm:flex-row justify-between items-center mb-10 gap-6">
          <div className="flex items-center gap-4 w-full sm:w-auto">
            <button type="button" onClick={() => navigate('/dashboard')} className="bg-cyan-500 p-2.5 rounded-xl hover:bg-cyan-400 transition-colors shrink-0">
              <ChevronLeft className="text-black" size={20} />
            </button>
            <div>
              <h1 className="text-xl md:text-2xl font-black text-white uppercase italic tracking-tighter">HackAware <span className="text-cyan-500 text-xs md:text-sm">PRO</span></h1>
              <p className="text-[9px] font-mono text-slate-500 uppercase tracking-[0.2em]">Man-in-the-Middle Lab / Node_Mumbai</p>
            </div>
          </div>

          <div className="flex bg-slate-900/80 p-1 rounded-xl border border-slate-800 shadow-lg w-full sm:w-auto">
            <button type="button" onClick={() => navigate('/dashboard')} className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-[10px] font-black text-slate-600 hover:text-white uppercase transition-all">
              <LayoutDashboard size={14} /> <span>Dashboard</span>
            </button>
            <div className="w-[1px] h-4 bg-slate-800 my-auto mx-1" />
            <button type="button" className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-[10px] font-black bg-cyan-500 text-black uppercase shadow-[0_0_15px_rgba(6,182,212,0.3)]">
              <Radio size={14} /> MITM_Lab
            </button>
          </div>
        </header>

        <p className="text-center text-[9px] font-mono text-slate-600 uppercase tracking-widest mb-6">
          Educational simulation only — no real packets are sent or intercepted
        </p>

        {/* STEP NAVIGATION */}
        <div className="mb-8 flex justify-center">
          <div className="flex bg-slate-900/40 p-1 rounded-xl border border-slate-800 backdrop-blur-md">
            {['1. Setup', '2. Intercept', '3. Defense'].map((label, i) => {
              const isLocked = i > 0 && !deployed;
              return (
                <button type="button"
                  key={i}
                  onClick={() => !isLocked && !isAttacking && setStep(i)}
                  disabled={isLocked}
                  className={`px-6 py-2 rounded-lg text-[10px] font-black uppercase transition-all
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

          {/* ------------------------- STEP 1: SETUP ------------------------- */}
          {step === 0 && (
            <motion.div key="s1" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div className="bg-slate-900/40 border border-slate-800 p-6 rounded-3xl backdrop-blur-sm">
                  <h3 className="text-white text-xs font-black uppercase mb-6 flex items-center gap-2"><Users size={16} className="text-cyan-500" /> Victim Session</h3>
                  <div className="space-y-4">
                    <input
                      value={victim.user}
                      onChange={(e) => setVictim({ ...victim, user: e.target.value })}
                      placeholder="Victim Username"
                      className="w-full bg-black/50 border border-slate-800 p-4 rounded-xl text-xs outline-none focus:border-cyan-500 transition-all"
                    />
                    <input
                      value={victim.pass}
                      onChange={(e) => setVictim({ ...victim, pass: e.target.value })}
                      placeholder="Victim Password"
                      className="w-full bg-black/50 border border-slate-800 p-4 rounded-xl text-xs outline-none focus:border-cyan-500 transition-all"
                    />

                    <div className="grid grid-cols-3 gap-2">
                      {networkPresets.map((n) => (
                        <button type="button"
                          key={n.id}
                          onClick={() => setNetwork(n)}
                          className={`p-3 rounded-xl border text-left transition-all
                            ${network.id === n.id ? 'border-cyan-500 bg-cyan-500/10' : 'border-slate-800 bg-black/30 hover:border-slate-600'}`}
                        >
                          <div className="text-[10px] font-black text-white uppercase">{n.label}</div>
                          <div className={`text-[9px] font-mono ${n.risk === 'HIGH' ? 'text-red-400' : n.risk === 'MEDIUM' ? 'text-amber-400' : 'text-emerald-400'}`}>{n.risk} risk</div>
                          <div className="text-[8px] text-slate-600">{n.note}</div>
                        </button>
                      ))}
                    </div>

                    <button type="button"
                      onClick={handleDeploy}
                      disabled={!canDeploy}
                      className={`w-full py-4 font-black text-[10px] uppercase rounded-xl flex items-center justify-center gap-2 transition-all
                        ${canDeploy
                          ? 'bg-cyan-600/10 border border-cyan-500/30 text-cyan-500 hover:bg-cyan-500 hover:text-black cursor-pointer'
                          : 'bg-slate-900/40 border border-slate-800 text-slate-700 cursor-not-allowed'}`}
                    >
                      <Zap size={14} /> Start Victim Session
                    </button>
                    {!canDeploy && (
                      <p className="text-[9px] text-slate-600 text-center -mt-2">Enter both a username and password to continue, or use Quick Seed.</p>
                    )}
                    <button type="button" onClick={quickSeed} className="w-full py-4 bg-slate-800 text-slate-400 font-black text-[10px] uppercase rounded-xl border border-slate-700">Quick Seed</button>
                  </div>
                </div>
              </div>

              <div className="bg-black/40 border border-slate-800 p-8 rounded-3xl flex flex-col h-full min-h-[400px]">
                <h3 className="text-slate-600 text-[10px] font-black uppercase mb-6 flex items-center gap-2 tracking-widest"><Router size={14} /> Network Preview</h3>
                {deployed ? (
                  <div className="flex-1 flex flex-col justify-center items-center gap-6">
                    <div className="flex items-center gap-4 w-full justify-between px-4">
                      <div className="flex flex-col items-center gap-2">
                        <div className="p-4 bg-slate-900/60 rounded-2xl border border-slate-700"><Smartphone size={28} className="text-cyan-400" /></div>
                        <span className="text-[9px] font-mono text-slate-500">You</span>
                      </div>
                      <div className="flex-1 border-t border-dashed border-slate-700 mx-2" />
                      <div className="flex flex-col items-center gap-2">
                        {network.id === 'vpn'
                          ? <div className="p-4 bg-emerald-900/20 rounded-2xl border border-emerald-700"><ShieldCheck size={28} className="text-emerald-400" /></div>
                          : <div className="p-4 bg-red-900/20 rounded-2xl border border-red-800 animate-pulse"><Eye size={28} className="text-red-400" /></div>
                        }
                        <span className="text-[9px] font-mono text-slate-500">{network.id === 'vpn' ? 'VPN Server' : 'Attacker'}</span>
                      </div>
                      <div className="flex-1 border-t border-dashed border-slate-700 mx-2" />
                      <div className="flex flex-col items-center gap-2">
                        <div className="p-4 bg-slate-900/60 rounded-2xl border border-slate-700"><Server size={28} className="text-slate-400" /></div>
                        <span className="text-[9px] font-mono text-slate-500">Server</span>
                      </div>
                    </div>
                    <div className="bg-slate-900/40 p-4 rounded-xl border border-slate-800/50 w-full">
                      <div className="flex justify-between text-[9px] font-black uppercase text-slate-600 mb-2">
                        <span>Session</span><span>{deployed.user}</span>
                      </div>
                      <p className="text-[9px] text-slate-600">Connected via <span className="text-cyan-400">{network.label}</span>. Every request this session sends will route past this diagram in Step 2.</p>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-20 text-[10px] text-slate-700 italic uppercase flex-1 flex items-center justify-center">Awaiting Victim Session...</div>
                )}
              </div>
            </motion.div>
          )}

          {/* ------------------------- STEP 2: INTERCEPT ------------------------- */}
          {step === 1 && (
            <motion.div key="s2" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              <div className="lg:col-span-4 space-y-4">
                <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2"><Activity size={14} /> Select Vector</h3>
                {attackVectors.map((v) => (
                  <button type="button"
                    key={v.id}
                    onClick={() => executeAttack(v)}
                    disabled={isAttacking}
                    className="w-full p-5 bg-slate-900/30 border border-slate-800 rounded-[2rem] text-left hover:border-red-500/50 transition-all group disabled:opacity-50"
                  >
                    <div className="flex justify-between items-center mb-3 text-white uppercase italic text-xs font-black">
                      <span>{v.title} <span className="text-[9px] text-slate-600 not-italic ml-1">{v.layer}</span></span>
                      <Eye size={14} className={isAttacking && selectedVector.id === v.id ? 'text-red-500 animate-pulse' : 'text-slate-600'} />
                    </div>
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
                      {report.survived ? 'Traffic Stayed Private' : 'Session Compromised'}
                    </div>
                    <div className="space-y-1 text-[10px] font-mono">
                      <div className="flex justify-between"><span className="text-slate-500">Vector</span><span className="text-slate-300">{report.vector}</span></div>
                      <div className="flex justify-between"><span className="text-slate-500">Packets intercepted</span><span className="text-slate-300">{report.stolenCount}/{report.total}</span></div>
                      <div className="flex justify-between"><span className="text-slate-500">Packets encrypted/blocked</span><span className="text-slate-300">{report.blockedCount}/{report.total}</span></div>
                    </div>
                  </motion.div>
                )}

                <button type="button" onClick={() => setStep(2)} disabled={isAttacking} className="w-full py-4 bg-slate-800 text-slate-300 font-black uppercase text-[10px] rounded-xl flex items-center justify-center gap-2 border border-slate-700 disabled:opacity-50">
                  View Defense Playbook <ArrowRight size={14} />
                </button>
              </div>

              <div className="lg:col-span-8 space-y-4">
                {/* NETWORK PATH VISUAL */}
                <div className="bg-black/60 border border-slate-800 rounded-3xl p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                      <Radio size={14} /> Live Interception
                    </h3>
                    {activeDefenseCount > 0 && (
                      <span className="text-[9px] font-black text-emerald-500 uppercase flex items-center gap-1">
                        <ShieldCheck size={12} /> {activeDefenseCount} Defense{activeDefenseCount > 1 ? 's' : ''} Active
                      </span>
                    )}
                  </div>

                  <div className="relative flex items-center justify-between px-6 py-8">
                    <div className="absolute left-16 right-16 top-1/2 -translate-y-1/2 h-[2px] bg-slate-800" />

                    {/* traveling packet dot */}
                    {isAttacking && (
                      <motion.div
                        className={`absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full shadow-lg z-10 ${
                          packetState === 'captured' ? 'bg-red-500 shadow-red-500/50' :
                          packetState === 'encrypted' ? 'bg-emerald-400 shadow-emerald-500/50' :
                          'bg-cyan-400 shadow-cyan-500/50'
                        }`}
                        animate={{ left: `${(packetPos / 2) * 100}%` }}
                        transition={{ duration: 0.4, ease: 'linear' }}
                        style={{ marginLeft: '-8px' }}
                      />
                    )}

                    <div className="flex flex-col items-center gap-2 z-0">
                      <div className={`p-5 rounded-2xl border transition-all ${nodeActive(0) ? 'bg-cyan-500/20 border-cyan-500' : 'bg-slate-900/60 border-slate-700'}`}>
                        <Smartphone size={26} className={nodeActive(0) ? 'text-cyan-400' : 'text-slate-500'} />
                      </div>
                      <span className="text-[9px] font-mono text-slate-500">User</span>
                    </div>

                    <div className="flex flex-col items-center gap-2 z-0">
                      <div className={`p-5 rounded-2xl border transition-all ${nodeActive(1) ? (packetState === 'captured' ? 'bg-red-500/20 border-red-500' : 'bg-amber-500/20 border-amber-500') : 'bg-slate-900/60 border-slate-700'}`}>
                        {packetState === 'captured' && nodeActive(1) ? <EyeOff size={26} className="text-red-400" /> : <Eye size={26} className={nodeActive(1) ? 'text-amber-400' : 'text-slate-500'} />}
                      </div>
                      <span className="text-[9px] font-mono text-slate-500">Attacker</span>
                    </div>

                    <div className="flex flex-col items-center gap-2 z-0">
                      <div className={`p-5 rounded-2xl border transition-all ${nodeActive(2) ? 'bg-cyan-500/20 border-cyan-500' : 'bg-slate-900/60 border-slate-700'}`}>
                        <Server size={26} className={nodeActive(2) ? 'text-cyan-400' : 'text-slate-500'} />
                      </div>
                      <span className="text-[9px] font-mono text-slate-500">Server</span>
                    </div>
                  </div>

                  {/* PACKET INSPECTOR */}
                  <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-800 mt-2">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[9px] font-black uppercase text-slate-600">Packet Inspector</span>
                      {inspector && (
                        <span className={`text-[9px] font-black uppercase flex items-center gap-1 ${inspector.readable ? 'text-red-400' : 'text-emerald-400'}`}>
                          {inspector.readable ? <><Unlock size={10} /> Readable</> : <><LockIcon size={10} /> Encrypted</>}
                        </span>
                      )}
                    </div>
                    {inspector ? (
                      <div>
                        <div className="text-[10px] font-mono text-slate-400 mb-1">{inspector.path}</div>
                        <div className={`text-[11px] font-mono break-all ${inspector.readable ? 'text-red-300' : 'text-emerald-300'}`}>{inspector.body}</div>
                      </div>
                    ) : (
                      <div className="text-[10px] text-slate-700 italic">Select an attack vector to start capturing traffic...</div>
                    )}
                  </div>
                </div>

                {/* CAPTURED CREDENTIALS FEED */}
                {captured.length > 0 && (
                  <div className="bg-red-500/5 border border-red-500/20 rounded-3xl p-5">
                    <h3 className="text-[10px] font-black text-red-400 uppercase tracking-widest flex items-center gap-2 mb-3"><KeyRound size={14} /> Captured Credentials</h3>
                    {captured.map((c, i) => (
                      <div key={i} className="flex justify-between text-[11px] font-mono py-1 border-b border-red-500/10 last:border-0">
                        <span className="text-slate-400">{c.user}</span>
                        <span className="text-red-400">{c.pass}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* CONSOLE */}
                <div className="bg-black/60 border border-slate-800 rounded-3xl p-6 flex flex-col h-[260px]">
                  <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2 mb-4">
                    <Terminal size={14} /> Live Console
                  </h3>
                  <div className="flex-1 overflow-y-auto font-mono text-[11px] space-y-1 pr-2">
                    {terminalLines.length === 0 && (
                      <div className="text-slate-700 italic">Select an attack vector to begin simulation...</div>
                    )}
                    {terminalLines.map((line, i) => (
                      <div
                        key={i}
                        className={
                          line.includes('CRIT') || line.includes('INTERCEPT') ? 'text-red-400 font-bold' :
                          line.includes('BLOCK') || line.includes('RESULT') && line.includes('stayed') ? 'text-emerald-400 font-bold' :
                          line.includes('WARN') ? 'text-amber-400' :
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
                {attackVectors.map((v) => (
                  <button type="button"
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
                  {defenseList.map((d) => {
                    const Icon = d.icon;
                    const on = defenses[d.id];
                    const effect = Math.round((selectedVector.mitigation[d.id] || 0) * 100);
                    return (
                      <button type="button"
                        key={d.id}
                        onClick={() => setDefenses((prev) => ({ ...prev, [d.id]: !prev[d.id] }))}
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

                <button type="button"
                  onClick={() => setDefenses({ https: true, hsts: true, vpn: true, certPin: true })}
                  className="w-full py-4 font-black text-[10px] uppercase rounded-xl flex items-center justify-center gap-2 transition-all bg-cyan-600/10 border border-cyan-500/30 text-cyan-500 hover:bg-cyan-500 hover:text-black"
                >
                  <ShieldCheck size={14} /> Enable All Defenses
                </button>

                <button type="button"
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
          <button type="button" onClick={resetLab} className="flex items-center gap-2 text-[10px] font-black text-slate-600 hover:text-red-400 uppercase transition-colors">
            <Trash2 size={12} /> Reset Lab Environment
          </button>
        </div>

      </div>
    </div>
  );
};

export default MitmAttack;