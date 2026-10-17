import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  ChevronLeft, Lock, Unlock, ShieldCheck, ShieldAlert, Terminal, ArrowRight,
  LayoutDashboard, Activity, CheckCircle2, XCircle, RotateCcw, Trash2,
  Zap, Mail, HardDrive, Network, Bug, FileText, Server, Skull
} from 'lucide-react';

/* ------------------------------------------------------------------ */
/*  SIMULATION DATA (all mock - no real file is ever read or encrypted) */
/* ------------------------------------------------------------------ */

const INITIAL_FILES = [
  { name: 'Thesis_Final.docx', folder: 'local' },
  { name: 'Project_Report.pdf', folder: 'local' },
  { name: 'Photos_2026.zip', folder: 'local' },
  { name: 'Budget.xlsx', folder: 'local' },
  { name: 'Resume.docx', folder: 'local' },
  { name: 'Payroll_2026.xlsx', folder: 'share' },
  { name: 'Client_Database.db', folder: 'share' },
  { name: 'HR_Records.pdf', folder: 'share' },
  { name: 'Invoices.zip', folder: 'share' },
  { name: 'Online_Backup.zip', folder: 'share' },
].map((f) => ({ ...f, status: 'ok' }));

const defenseList = [
  { id: 'emailFilter', title: 'Email Filtering', icon: Mail, desc: 'Blocks the phishing email carrying the malware' },
  { id: 'edr', title: 'Endpoint Protection (EDR)', icon: Bug, desc: 'Detects mass file encryption and kills the process' },
  { id: 'segmentation', title: 'Network Segmentation', icon: Network, desc: 'Keeps the file server unreachable from the workstation' },
  { id: 'backups', title: 'Offline Backups', icon: HardDrive, desc: 'Lets you restore files without paying the ransom' },
];

const VULNERABLE_SETUP = `// Typical weak environment
- Users open attachments from unknown senders
- No antivirus / EDR monitoring file activity
- Workstation can reach every shared drive
- Only backup is on the same network share
- Result: one click encrypts everything`;

const SECURE_SETUP = `// Hardened environment
- Mail gateway scans and strips malicious attachments
- EDR flags rapid file renames and kills the process
- Network segmentation: workstation -> file server blocked
- 3-2-1 backups: 3 copies, 2 media, 1 offline/offsite
- Result: attack contained, data restored, no ransom`;

const noDefenses = { emailFilter: false, edr: false, segmentation: false, backups: false };

/* ------------------------------------------------------------------ */

const Ransomware = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [machine, setMachine] = useState('');
  const [deployed, setDeployed] = useState(null);
  const [defenses, setDefenses] = useState(noDefenses);
  const [files, setFiles] = useState(INITIAL_FILES);
  const [terminalLines, setTerminalLines] = useState([]);
  const [isAttacking, setIsAttacking] = useState(false);
  const [report, setReport] = useState(null);
  const [ransom, setRansom] = useState(false);

  const terminalEndRef = useRef(null);
  const defensesRef = useRef(defenses);
  const cancelRef = useRef(false);

  useEffect(() => { defensesRef.current = defenses; }, [defenses]);
  useEffect(() => { terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [terminalLines]);
  useEffect(() => () => { cancelRef.current = true; }, []);

  const activeDefenseCount = Object.values(defenses).filter(Boolean).length;
  const lockedCount = files.filter((f) => f.status === 'locked').length;
  const canDeploy = machine.trim().length > 0;

  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const log = (line) => setTerminalLines((prev) => [...prev, line]);

  const quickSeed = () => {
    setMachine('WORKSTATION-07');
    setDeployed('WORKSTATION-07');
    setStep(1);
  };

  const handleDeploy = () => {
    if (!canDeploy) return;
    setDeployed(machine.trim());
    setStep(1);
  };

  const resetLab = () => {
    cancelRef.current = true;
    setDeployed(null);
    setMachine('');
    setDefenses(noDefenses);
    setFiles(INITIAL_FILES);
    setTerminalLines([]);
    setReport(null);
    setRansom(false);
    setIsAttacking(false);
    setStep(0);
  };

  const toggleDefense = (id) => setDefenses((d) => ({ ...d, [id]: !d[id] }));
  const enableAll = () => setDefenses({ emailFilter: true, edr: true, segmentation: true, backups: true });

  const runAttack = async () => {
    if (!deployed || isAttacking) return;
    cancelRef.current = false;
    setIsAttacking(true);
    setReport(null);
    setRansom(false);
    setFiles(INITIAL_FILES);

    const active = defenseList.filter((d) => defensesRef.current[d.id]).map((d) => d.title);
    setTerminalLines([
      `[TARGET] machine=${deployed}`,
      `[DEF] Active defenses: ${active.length ? active.join(', ') : 'NONE'}`,
    ]);

    const finish = (r) => { setReport(r); setIsAttacking(false); };
    const d = defensesRef.current;

    await sleep(600);
    if (cancelRef.current) return;
    log('[PHISH] Email "Invoice_Q3.docm" delivered to user inbox...');

    await sleep(700);
    if (cancelRef.current) return;
    if (d.emailFilter) {
      log('[BLOCK] Mail gateway flagged macro attachment - email quarantined.');
      finish({ ok: false, reason: 'Email filter stopped the malware before it reached the user' });
      return;
    }

    log('[EXEC] User opened attachment - payload running in background.');
    await sleep(700);
    if (cancelRef.current) return;
    log('[C2] Beacon sent to attacker server, encryption key received.');
    await sleep(600);
    if (cancelRef.current) return;
    log('[SCAN] Searching drives for documents, databases and archives...');

    let locked = 0;
    const current = INITIAL_FILES.map((f) => ({ ...f }));

    for (let i = 0; i < current.length; i++) {
      if (cancelRef.current) return;
      await sleep(450);
      if (cancelRef.current) return;
      const f = current[i];

      if (d.segmentation && f.folder === 'share') {
        log(`[SEG] \\\\fileserver\\${f.name} - unreachable, network segmented`);
        continue;
      }

      if (d.edr && locked >= 2) {
        log('[EDR] ALERT: mass file renames detected - process killed, host isolated.');
        finish({
          ok: false,
          reason: `EDR stopped the attack after only ${locked} file(s) were encrypted`,
        });
        return;
      }

      f.status = 'locked';
      locked++;
      setFiles(current.map((x) => ({ ...x })));
      log(`[LOCK] ${f.name} -> ${f.name}.locked`);
    }

    if (cancelRef.current) return;
    setRansom(true);
    log('[NOTE] README_DECRYPT.txt dropped: "Pay 0.5 BTC in 72 hours or lose your files."');
    await sleep(800);
    if (cancelRef.current) return;

    if (d.backups) {
      log('[RESTORE] Offline backup verified - restoring all files...');
      await sleep(700);
      if (cancelRef.current) return;
      setFiles(INITIAL_FILES);
      setRansom(false);
      log('[OK] All files restored. Ransom ignored.');
      finish({ ok: false, reason: 'Files were encrypted, but offline backups restored everything - no ransom paid' });
      return;
    }

    finish({
      ok: true,
      reason: `${locked} of ${INITIAL_FILES.length} files encrypted - victim must pay the ransom or lose the data`,
    });
  };

  const rerunWithDefenses = () => {
    setStep(1);
    runAttack();
  };

  const lineColor = (line) => {
    if (line.startsWith('[LOCK]') || line.startsWith('[NOTE]') || line.startsWith('[EXEC]') || line.startsWith('[C2]')) return 'text-red-400';
    if (line.startsWith('[BLOCK]') || line.startsWith('[EDR]') || line.startsWith('[SEG]') || line.startsWith('[RESTORE]') || line.startsWith('[OK]')) return 'text-emerald-400';
    if (line.startsWith('[DEF]')) return 'text-cyan-400';
    return 'text-slate-500';
  };

  const FileCard = ({ f }) => (
    <div className={`flex items-center gap-2 p-2 rounded-lg border text-[10px] font-mono transition-all
      ${f.status === 'locked' ? 'border-red-500/40 bg-red-500/10 text-red-300' : 'border-slate-800 bg-black/40 text-slate-400'}`}>
      {f.status === 'locked' ? <Lock size={12} /> : <FileText size={12} />}
      <span className="truncate">{f.name}{f.status === 'locked' ? '.locked' : ''}</span>
    </div>
  );

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
              <p className="text-[9px] font-mono text-slate-500 uppercase tracking-[0.2em]">Ransomware Simulation Lab / Node_Mumbai</p>
            </div>
          </div>

          <div className="flex bg-slate-900/80 p-1 rounded-xl border border-slate-800 shadow-lg w-full sm:w-auto">
            <button type="button" onClick={() => navigate('/dashboard')} className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-[10px] font-black text-slate-600 hover:text-white uppercase transition-all">
              <LayoutDashboard size={14} /> <span>Dashboard</span>
            </button>
            <div className="w-[1px] h-4 bg-slate-800 my-auto mx-1" />
            <button type="button" className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-[10px] font-black bg-cyan-500 text-black uppercase shadow-[0_0_15px_rgba(6,182,212,0.3)]">
              <Skull size={14} /> Ransomware_Lab
            </button>
          </div>
        </header>

        <p className="text-center text-[9px] font-mono text-slate-600 uppercase tracking-widest mb-6">
          Educational simulation only - no real file is ever touched or encrypted
        </p>

        {/* STEP NAVIGATION */}
        <div className="mb-8 flex justify-center">
          <div className="flex bg-slate-900/40 p-1 rounded-xl border border-slate-800 backdrop-blur-md">
            {['1. Setup', '2. Attack', '3. Defense'].map((label, i) => {
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
              <div className="bg-slate-900/40 border border-slate-800 p-6 rounded-3xl backdrop-blur-sm">
                <h3 className="text-white text-xs font-black uppercase mb-6 flex items-center gap-2"><Server size={16} className="text-cyan-500" /> Victim Machine</h3>
                <div className="space-y-4">
                  <input
                    value={machine}
                    onChange={(e) => setMachine(e.target.value)}
                    placeholder="Machine name (e.g. WORKSTATION-07)"
                    className="w-full bg-black/50 border border-slate-800 p-4 rounded-xl text-xs outline-none focus:border-cyan-500 transition-all"
                  />
                  <button type="button"
                    onClick={handleDeploy}
                    disabled={!canDeploy}
                    className={`w-full py-4 font-black text-[10px] uppercase rounded-xl flex items-center justify-center gap-2 transition-all
                      ${canDeploy
                        ? 'bg-cyan-600/10 border border-cyan-500/30 text-cyan-500 hover:bg-cyan-500 hover:text-black cursor-pointer'
                        : 'bg-slate-900/40 border border-slate-800 text-slate-700 cursor-not-allowed'}`}
                  >
                    <Zap size={14} /> Create Victim Machine
                  </button>
                  {!canDeploy && (
                    <p className="text-[9px] text-slate-600 text-center -mt-2">Enter a machine name to continue, or use Quick Seed.</p>
                  )}
                  <button type="button" onClick={quickSeed} className="w-full py-4 bg-slate-800 text-slate-400 font-black text-[10px] uppercase rounded-xl border border-slate-700">Quick Seed</button>
                </div>
              </div>

              <div className="bg-black/40 border border-slate-800 p-8 rounded-3xl flex flex-col min-h-[400px]">
                <h3 className="text-slate-600 text-[10px] font-black uppercase mb-6 flex items-center gap-2 tracking-widest"><HardDrive size={14} /> Files at risk</h3>
                <div className="flex-1 flex flex-col justify-center gap-4">
                  <div className="bg-slate-900/40 p-4 rounded-xl border border-slate-800/50">
                    <p className="text-[9px] font-black uppercase text-slate-600 mb-3">Local drive</p>
                    <div className="grid grid-cols-2 gap-2">
                      {files.filter((f) => f.folder === 'local').map((f) => <FileCard key={f.name} f={f} />)}
                    </div>
                  </div>
                  <div className="bg-slate-900/40 p-4 rounded-xl border border-slate-800/50">
                    <p className="text-[9px] font-black uppercase text-slate-600 mb-3">Network file server</p>
                    <div className="grid grid-cols-2 gap-2">
                      {files.filter((f) => f.folder === 'share').map((f) => <FileCard key={f.name} f={f} />)}
                    </div>
                  </div>
                  {deployed && (
                    <div className="bg-slate-900/40 p-4 rounded-xl border border-slate-800/50">
                      <div className="flex justify-between text-[9px] font-black uppercase text-slate-600">
                        <span>Machine ready</span><span className="text-cyan-400">{deployed}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* ------------------------- STEP 2: ATTACK ------------------------- */}
          {step === 1 && (
            <motion.div key="s2" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              <div className="lg:col-span-4 space-y-4">
                <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2"><Activity size={14} /> Select Vector</h3>
                <div className="p-5 bg-slate-900/30 border border-slate-800 rounded-[2rem]">
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="text-sm font-black text-white uppercase italic">Ransomware</h4>
                    <Skull size={16} className="text-slate-600" />
                  </div>
                  <div className="bg-black p-3 rounded-xl mb-3 text-[10px] font-mono text-red-400">Invoice_Q3.docm (simulated)</div>
                  <p className="text-[11px] text-slate-500 mb-4">
                    Phishing email delivers malware to <span className="text-white font-mono">{deployed}</span>, which encrypts files and demands a ransom.
                  </p>
                  <button type="button"
                    onClick={runAttack}
                    disabled={isAttacking}
                    className="w-full bg-red-500 hover:bg-red-400 disabled:opacity-50 text-white font-black text-[10px] uppercase tracking-widest py-3 rounded-xl transition-colors"
                  >
                    {isAttacking ? 'Attacking...' : 'Run Ransomware Attack'}
                  </button>
                  <p className="text-[10px] text-slate-600 mt-3">
                    Files encrypted: <span className="text-white font-mono">{lockedCount}/{files.length}</span>
                    {' '}| Defenses on: <span className="text-white font-mono">{activeDefenseCount}</span>
                  </p>
                </div>

                <button type="button"
                  onClick={() => !isAttacking && setStep(2)}
                  className="w-full py-5 bg-slate-800 text-white font-black text-[10px] uppercase rounded-2xl border border-slate-700 hover:bg-slate-700 transition-all flex items-center justify-center gap-2"
                >
                  View Defense Playbook <ArrowRight size={14} />
                </button>
              </div>

              <div className="lg:col-span-8 space-y-4">
                <div className="bg-black border border-slate-800 p-6 rounded-3xl min-h-[300px]">
                  <h3 className="text-[10px] font-black text-white uppercase tracking-widest flex items-center gap-2 mb-4"><Terminal size={14} className="text-cyan-500" /> Live Console</h3>
                  <div className="font-mono text-[11px] space-y-1 max-h-[260px] overflow-y-auto">
                    {terminalLines.length === 0 && (
                      <p className="text-slate-600 italic">Run the attack to begin simulation...</p>
                    )}
                    {terminalLines.map((line, i) => (
                      <p key={i} className={lineColor(line)}>{line}</p>
                    ))}
                    <div ref={terminalEndRef} />
                  </div>
                </div>

                <div className="bg-slate-900/40 border border-slate-800 p-5 rounded-3xl">
                  <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Victim file system</h3>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                    {files.map((f) => <FileCard key={f.name} f={f} />)}
                  </div>
                </div>

                {ransom && (
                  <div className="p-5 rounded-2xl border border-red-500/50 bg-red-950/40 text-red-300">
                    <p className="text-xs font-black uppercase flex items-center gap-2 mb-2"><Skull size={16} /> Your files have been encrypted</p>
                    <p className="text-[11px]">Pay 0.5 BTC within 72 hours to receive the decryption key. (Simulated ransom note - nothing real.)</p>
                  </div>
                )}

                {report && (
                  <div className={`p-4 rounded-2xl border text-xs font-bold flex items-center gap-2
                    ${report.ok ? 'border-red-500/40 bg-red-500/10 text-red-300' : 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300'}`}>
                    {report.ok ? <XCircle size={16} /> : <CheckCircle2 size={16} />}
                    {report.ok ? 'Attack succeeded: ' : 'Attack failed: '}{report.reason}
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* ------------------------- STEP 3: DEFENSE ------------------------- */}
          {step === 2 && (
            <motion.div key="s3" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-slate-900/40 border border-slate-800 p-6 rounded-3xl">
                  <h3 className="text-red-400 text-xs font-black uppercase mb-4 flex items-center gap-2"><XCircle size={16} /> Vulnerable Environment</h3>
                  <pre className="bg-black p-4 rounded-xl text-[11px] font-mono text-slate-400 overflow-x-auto">{VULNERABLE_SETUP}</pre>
                </div>
                <div className="bg-slate-900/40 border border-slate-800 p-6 rounded-3xl">
                  <h3 className="text-emerald-400 text-xs font-black uppercase mb-4 flex items-center gap-2"><CheckCircle2 size={16} /> Hardened Environment</h3>
                  <pre className="bg-black p-4 rounded-xl text-[11px] font-mono text-slate-400 overflow-x-auto">{SECURE_SETUP}</pre>
                </div>
              </div>

              <div className="bg-slate-900/40 border border-slate-800 p-6 rounded-3xl">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-white text-xs font-black uppercase flex items-center gap-2">
                    {activeDefenseCount > 0
                      ? <ShieldCheck size={16} className="text-emerald-400" />
                      : <ShieldAlert size={16} className="text-red-400" />}
                    Remediation Checklist
                  </h3>
                  <button type="button" onClick={enableAll} className="text-[10px] font-black uppercase tracking-widest text-cyan-400 hover:text-cyan-300">Enable all</button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  {defenseList.map((d) => {
                    const Icon = d.icon;
                    const on = defenses[d.id];
                    return (
                      <button type="button"
                        key={d.id}
                        onClick={() => toggleDefense(d.id)}
                        className={`text-left p-4 rounded-xl border transition-all
                          ${on ? 'border-emerald-500/50 bg-emerald-500/10' : 'border-slate-800 bg-black/30 hover:border-slate-600'}`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="flex items-center gap-2 text-xs font-bold text-white"><Icon size={14} className={on ? 'text-emerald-400' : 'text-slate-500'} /> {d.title}</span>
                          <span className={`text-[10px] font-mono ${on ? 'text-emerald-400' : 'text-red-400'}`}>{on ? 'ON' : 'OFF'}</span>
                        </div>
                        <p className="text-[11px] text-slate-500">{d.desc}</p>
                      </button>
                    );
                  })}
                </div>

                <button type="button"
                  onClick={rerunWithDefenses}
                  className="w-full py-4 bg-slate-800 text-white font-black text-[10px] uppercase rounded-xl border border-slate-700 hover:bg-slate-700 transition-all flex items-center justify-center gap-2"
                >
                  Re-run attack with defenses <RotateCcw size={14} />
                </button>
              </div>

              <div className="bg-slate-900/40 border border-slate-800 p-6 rounded-3xl">
                <h3 className="text-white text-xs font-black uppercase mb-3 flex items-center gap-2"><Unlock size={16} className="text-cyan-500" /> How to prevent ransomware</h3>
                <ul className="text-sm text-slate-400 space-y-1 list-disc pl-5">
                  <li>Filter email and train users not to open unknown attachments or enable macros.</li>
                  <li>Run endpoint protection that watches for mass file encryption.</li>
                  <li>Segment the network so one infected PC cannot reach every server.</li>
                  <li>Keep 3-2-1 backups with at least one copy offline and test restores.</li>
                  <li>Patch systems promptly and use least-privilege accounts.</li>
                </ul>
              </div>
            </motion.div>
          )}

        </AnimatePresence>

        {/* RESET */}
        <div className="mt-12 flex justify-center">
          <button type="button" onClick={resetLab} className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-600 hover:text-cyan-400 transition-colors">
            <Trash2 size={14} /> Reset Lab Environment
          </button>
        </div>

      </div>
    </div>
  );
};

export default Ransomware;
