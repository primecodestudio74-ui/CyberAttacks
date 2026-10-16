import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  ChevronLeft,
  Lock,
  Unlock,
  ShieldCheck,
  ShieldAlert,
  Terminal,
  ArrowRight,
  LayoutDashboard,
  Activity,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Trash2,
  Layers,
  Eye,
  EyeOff,
  MousePointer2,
  Gift,
  Building2,
  AlertTriangle,
  Zap,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  SIMULATION DATA — this is a CSS/animation mock only. No real site  */
/*  is ever framed, loaded, or embedded; nothing here can click        */
/*  anything outside this component.                                   */
/* ------------------------------------------------------------------ */

const siteProfiles = [
  {
    id: "bank",
    label: "SecureBank Portal",
    action: "Confirm Transfer: $5,000 → acct_9931",
    note: "Authenticated banking session",
  },
  {
    id: "social",
    label: "SocialHub Settings",
    action: "Confirm: Make profile & posts public",
    note: "Authenticated social session",
  },
  {
    id: "admin",
    label: "CMS Admin Panel",
    action: "Confirm: Delete all draft posts",
    note: "Authenticated admin session",
  },
];

const defenseList = [
  {
    id: "xfo",
    title: "X-Frame-Options",
    icon: Layers,
    desc: "DENY / SAMEORIGIN — refuse to render inside any frame",
  },
  {
    id: "csp",
    title: "CSP frame-ancestors",
    icon: ShieldCheck,
    desc: "Modern allow-list for which origins may frame this page",
  },
  {
    id: "frameBust",
    title: "Frame-Busting Script",
    icon: Zap,
    desc: "Legacy JS that redirects if the page detects it’s framed",
  },
  {
    id: "sameSite",
    title: "SameSite Cookies",
    icon: Lock,
    desc: "Session cookie withheld on cross-site framed requests",
  },
];

const attackVectors = [
  {
    id: "overlay",
    title: "Invisible iFrame Overlay",
    intel:
      'The attacker frames the real, logged-in site at opacity: 0 and positions its real button exactly under a fake "Claim Prize" button. The victim thinks they’re clicking the decoy — they’re actually clicking the hidden page underneath.',
    mitigation: { xfo: 0.95, csp: 0.95, frameBust: 0.5, sameSite: 0.1 },
    vulnCode: `// server.js — no framing protection at all
app.use((req, res, next) => {
  // X-Frame-Options / CSP headers never set
  next();
});`,
    fixCode: `// server.js — block framing outright
app.use((req, res, next) => {
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader(
    'Content-Security-Policy',
    "frame-ancestors 'none'"
  );
  next();
});`,
  },
  {
    id: "cursorjack",
    title: "Cursor-Jacking",
    intel:
      'A custom CSS cursor is drawn a few pixels away from the real pointer position, so the victim’s visual "click target" and the browser’s actual click coordinates no longer match — letting the attacker line up a hidden button under the illusion.',
    mitigation: { xfo: 0.9, csp: 0.9, frameBust: 0.4, sameSite: 0.1 },
    vulnCode: `/* attacker.css */
body { cursor: none; }
.fake-cursor {
  position: absolute;
  transform: translate(-14px, -14px); /* offset from real pointer */
}`,
    fixCode: `// The fix lives on the victim site, not the attacker's CSS —
// it must refuse to be framed at all, same as any clickjacking
// variant:
res.setHeader('X-Frame-Options', 'DENY');`,
  },
  {
    id: "doubleclick",
    title: "Double-Click Jacking",
    intel:
      'Some UIs only arm a sensitive action after a first click (e.g. "Hold to confirm" dialogs). The attacker chains two decoy clicks — the first dismisses an innocent popup, the second lands on the now-armed real confirm button underneath.',
    mitigation: { xfo: 0.9, csp: 0.9, frameBust: 0.45, sameSite: 0.15 },
    vulnCode: `// confirm-dialog.js
// No same-origin / framing check before arming the action
showConfirmDialog(() => executeTransfer(amount));`,
    fixCode: `// confirm-dialog.js
if (window.top !== window.self) {
  throw new Error('Refusing to arm action inside a frame');
}
showConfirmDialog(() => executeTransfer(amount));`,
  },
];

/* ------------------------------------------------------------------ */

const ClickjackingAttack = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [site, setSite] = useState(siteProfiles[0]);
  const [deployed, setDeployed] = useState(null);
  const [defenses, setDefenses] = useState({
    xfo: false,
    csp: false,
    frameBust: false,
    sameSite: false,
  });
  const [selectedVector, setSelectedVector] = useState(attackVectors[0]);
  const [terminalLines, setTerminalLines] = useState([]);
  const [isAttacking, setIsAttacking] = useState(false);
  const [revealOverlay, setRevealOverlay] = useState(false);
  const [cursorPos, setCursorPos] = useState({ x: 20, y: 20 });
  const [clickState, setClickState] = useState("idle"); // idle | moving | clicking | hijacked | blocked
  const [report, setReport] = useState(null);

  const terminalEndRef = useRef(null);
  const defensesRef = useRef(defenses);
  const cancelRef = useRef(false);

  useEffect(() => {
    defensesRef.current = defenses;
  }, [defenses]);
  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [terminalLines]);
  useEffect(
    () => () => {
      cancelRef.current = true;
    },
    [],
  );

  const activeDefenseCount = Object.values(defenses).filter(Boolean).length;

  const quickSeed = () => {
    setSite(siteProfiles[0]);
    setDeployed(siteProfiles[0]);
    setStep(1);
  };

  const handleDeploy = () => {
    setDeployed(site);
    setStep(1);
  };

  const resetLab = () => {
    cancelRef.current = true;
    setDeployed(null);
    setSite(siteProfiles[0]);
    setDefenses({ xfo: false, csp: false, frameBust: false, sameSite: false });
    setTerminalLines([]);
    setReport(null);
    setIsAttacking(false);
    setRevealOverlay(false);
    setClickState("idle");
    setCursorPos({ x: 20, y: 20 });
    setStep(0);
  };

  const mitigationFor = (vector) => {
    const total = Object.entries(vector.mitigation).reduce(
      (acc, [k, v]) => acc + (defensesRef.current[k] ? v : 0),
      0,
    );
    return Math.min(0.95, total);
  };

  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  const executeAttack = async (vector) => {
    if (!deployed || isAttacking) return;
    cancelRef.current = false;
    setSelectedVector(vector);
    setIsAttacking(true);
    setReport(null);
    setClickState("idle");
    setCursorPos({ x: 20, y: 20 });

    const activeNames = defenseList
      .filter((d) => defensesRef.current[d.id])
      .map((d) => d.title);
    const framingBlocked = defensesRef.current.xfo || defensesRef.current.csp;

    setTerminalLines([
      `[TARGET] ${deployed.label} — real action: "${deployed.action}"`,
      `[ATTACK] Vector: ${vector.title} — SIMULATED, no real page is framed`,
      `[DEF] Active defenses: ${activeNames.length ? activeNames.join(", ") : "NONE"}`,
    ]);

    await sleep(400);
    if (cancelRef.current) return;

    if (framingBlocked) {
      setTerminalLines((prev) => [
        ...prev,
        `[BLOCK] Browser refused to render the framed page (X-Frame-Options / CSP)`,
      ]);
      setClickState("blocked");
      await sleep(600);
      setTerminalLines((prev) => [
        ...prev,
        `[RESULT] Decoy button is just a decoy — nothing underneath it to click.`,
      ]);
      setReport({
        hijacked: false,
        vector: vector.title,
        reason: "Framing blocked by headers",
      });
      setIsAttacking(false);
      return;
    }

    setTerminalLines((prev) => [
      ...prev,
      `[LOAD] Attacker page framed the real site at opacity: 0`,
    ]);
    setClickState("moving");
    setCursorPos({ x: 50, y: 50 });
    await sleep(700);
    if (cancelRef.current) return;

    setTerminalLines((prev) => [
      ...prev,
      `[MOVE] Victim's cursor approaches the decoy button "Claim Your Prize!"`,
    ]);
    setCursorPos({ x: 50, y: 62 });
    await sleep(500);
    if (cancelRef.current) return;

    const mitigation = mitigationFor(vector);
    const hijacked = 1 - mitigation > 0.4;

    setClickState("clicking");
    setTerminalLines((prev) => [
      ...prev,
      `[CLICK] Victim clicks — coordinates land on the hidden iframe's real button`,
    ]);
    await sleep(600);
    if (cancelRef.current) return;

    if (hijacked) {
      setClickState("hijacked");
      setTerminalLines((prev) => [
        ...prev,
        `[CRIT] Click registered on hidden page: "${deployed.action}"`,
        `[RESULT] Action executed without victim's knowledge.`,
      ]);
      setReport({ hijacked: true, vector: vector.title, reason: null });
    } else {
      setClickState("blocked");
      setTerminalLines((prev) => [
        ...prev,
        `[BLOCK] Frame-busting / session check interrupted the hidden action`,
        `[RESULT] Click landed, but the sensitive action did not complete.`,
      ]);
      setReport({
        hijacked: false,
        vector: vector.title,
        reason: "Secondary defense caught it",
      });
    }
    setIsAttacking(false);
  };

  return (
    <div className="min-h-screen bg-[#020617] text-slate-300 font-sans p-4 sm:p-8 selection:bg-cyan-500/30">
      <div className="max-w-6xl mx-auto">
        {/* HEADER */}
        <header className="flex flex-col sm:flex-row justify-between items-center mb-10 gap-6">
          <div className="flex items-center gap-4 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => navigate("/dashboard")}
              className="bg-cyan-500 p-2.5 rounded-xl hover:bg-cyan-400 transition-colors shrink-0"
            >
              <ChevronLeft className="text-black" size={20} />
            </button>
            <div>
              <h1 className="text-xl md:text-2xl font-black text-white uppercase italic tracking-tighter">
                HackAware{" "}
                <span className="text-cyan-500 text-xs md:text-sm">PRO</span>
              </h1>
              <p className="text-[9px] font-mono text-slate-500 uppercase tracking-[0.2em]">
                Clickjacking Lab / Node_Mumbai
              </p>
            </div>
          </div>

          <div className="flex bg-slate-900/80 p-1 rounded-xl border border-slate-800 shadow-lg w-full sm:w-auto">
            <button
              type="button"
              onClick={() => navigate("/dashboard")}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-[10px] font-black text-slate-600 hover:text-white uppercase transition-all"
            >
              <LayoutDashboard size={14} /> <span>Dashboard</span>
            </button>
            <div className="w-[1px] h-4 bg-slate-800 my-auto mx-1" />
            <button
              type="button"
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-[10px] font-black bg-cyan-500 text-black uppercase shadow-[0_0_15px_rgba(6,182,212,0.3)]"
            >
              <Layers size={14} /> Clickjack_Lab
            </button>
          </div>
        </header>

        <p className="text-center text-[9px] font-mono text-slate-600 uppercase tracking-widest mb-6">
          Educational simulation only — no real page is ever framed or clicked
        </p>

        {/* STEP NAVIGATION */}
        <div className="mb-8 flex justify-center">
          <div className="flex bg-slate-900/40 p-1 rounded-xl border border-slate-800 backdrop-blur-md max-w-full overflow-x-auto scrollbar-none">
            {["1. Target", "2. Exploit", "3. Defense"].map((label, i) => {
              const isLocked = i > 0 && !deployed;
              return (
                <button
                  type="button"
                  key={i}
                  onClick={() => !isLocked && !isAttacking && setStep(i)}
                  disabled={isLocked}
                  className={`px-3.5 shrink-0 sm:px-6 py-2 rounded-lg text-[10px] font-black uppercase transition-all
                    ${step === i ? "text-cyan-400 bg-cyan-500/10" : "text-slate-600"}
                    ${isLocked ? "opacity-30 cursor-not-allowed" : "hover:text-slate-300"}`}
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
            <motion.div
              key="s1"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="grid grid-cols-1 lg:grid-cols-2 gap-8"
            >
              <div className="space-y-6">
                <div className="bg-slate-900/40 border border-slate-800 p-6 rounded-3xl backdrop-blur-sm">
                  <h3 className="text-white text-xs font-black uppercase mb-6 flex items-center gap-2">
                    <Building2 size={16} className="text-cyan-500" /> Victim
                    Site
                  </h3>
                  <div className="space-y-3">
                    {siteProfiles.map((s) => (
                      <button
                        type="button"
                        key={s.id}
                        onClick={() => setSite(s)}
                        className={`w-full p-4 rounded-xl border text-left transition-all
                          ${site.id === s.id ? "border-cyan-500 bg-cyan-500/10" : "border-slate-800 bg-black/30 hover:border-slate-600"}`}
                      >
                        <div className="text-[11px] font-black text-white uppercase">
                          {s.label}
                        </div>
                        <div className="text-[9px] font-mono text-cyan-500 mt-1">
                          {s.action}
                        </div>
                        <div className="text-[8px] text-slate-600 mt-1">
                          {s.note}
                        </div>
                      </button>
                    ))}

                    <button
                      type="button"
                      onClick={handleDeploy}
                      className="w-full py-4 bg-cyan-600/10 border border-cyan-500/30 text-cyan-500 font-black text-[10px] uppercase rounded-xl hover:bg-cyan-500 hover:text-black transition-all flex items-center justify-center gap-2"
                    >
                      <Zap size={14} /> Start Victim Session
                    </button>
                    <button
                      type="button"
                      onClick={quickSeed}
                      className="w-full py-4 bg-slate-800 text-slate-400 font-black text-[10px] uppercase rounded-xl border border-slate-700"
                    >
                      Quick Seed
                    </button>
                  </div>
                </div>
              </div>

              <div className="bg-black/40 border border-slate-800 p-8 rounded-3xl flex flex-col h-full min-h-[360px]">
                <h3 className="text-slate-600 text-[10px] font-black uppercase mb-6 flex items-center gap-2 tracking-widest">
                  <Eye size={14} /> What Clickjacking Looks Like
                </h3>
                <div className="flex-1 flex flex-col justify-center items-center gap-4 text-center">
                  <div className="relative w-full max-w-xs h-40 bg-slate-900/50 rounded-2xl border border-slate-800 flex items-center justify-center overflow-hidden">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="px-6 py-3 bg-gradient-to-r from-fuchsia-500 to-cyan-500 rounded-xl text-[10px] font-black text-white uppercase flex items-center gap-2">
                        <Gift size={14} /> Claim Your Prize!
                      </div>
                    </div>
                    <div className="absolute inset-0 border-2 border-dashed border-red-500/40 m-6 rounded-xl flex items-end justify-center pb-1">
                      <span className="text-[7px] font-mono text-red-400/70 uppercase">
                        Hidden real button is here too
                      </span>
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-500 leading-relaxed max-w-xs">
                    What the victim sees is a harmless-looking button. What they
                    actually click is a transparent, perfectly-aligned real
                    button from a site they're already logged into.
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {/* ------------------------- STEP 2: EXPLOIT ------------------------- */}
          {step === 1 && (
            <motion.div
              key="s2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-8"
            >
              <div className="lg:col-span-4 space-y-4">
                <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                  <Activity size={14} /> Select Vector
                </h3>
                {attackVectors.map((v) => (
                  <button
                    type="button"
                    key={v.id}
                    onClick={() => executeAttack(v)}
                    disabled={isAttacking}
                    className="w-full p-5 bg-slate-900/30 border border-slate-800 rounded-[2rem] text-left hover:border-red-500/50 transition-all group disabled:opacity-50"
                  >
                    <div className="flex justify-between items-center mb-3 text-white uppercase italic text-xs font-black">
                      <span>{v.title}</span>
                      <MousePointer2
                        size={14}
                        className={
                          isAttacking && selectedVector.id === v.id
                            ? "text-red-500 animate-pulse"
                            : "text-slate-600"
                        }
                      />
                    </div>
                    <p className="text-[10px] text-slate-500 leading-relaxed">
                      {v.intel}
                    </p>
                  </button>
                ))}

                <button
                  type="button"
                  onClick={() => setRevealOverlay((r) => !r)}
                  className={`w-full py-3 font-black text-[10px] uppercase rounded-xl flex items-center justify-center gap-2 border transition-all
                    ${revealOverlay ? "bg-amber-500/10 border-amber-500/40 text-amber-400" : "bg-black/40 border-slate-800 text-slate-500"}`}
                >
                  {revealOverlay ? <EyeOff size={14} /> : <Eye size={14} />}{" "}
                  {revealOverlay ? "Hide Hidden Frame" : "Reveal Hidden Frame"}
                </button>

                {report && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className={`p-6 rounded-3xl border ${!report.hijacked ? "bg-emerald-500/10 border-emerald-500/30" : "bg-red-500/10 border-red-500/30"}`}
                  >
                    <div
                      className={`flex items-center gap-2 mb-3 text-xs font-black uppercase ${!report.hijacked ? "text-emerald-400" : "text-red-400"}`}
                    >
                      {!report.hijacked ? (
                        <ShieldCheck size={16} />
                      ) : (
                        <ShieldAlert size={16} />
                      )}
                      {!report.hijacked
                        ? "Click Stayed Safe"
                        : "Click Hijacked"}
                    </div>
                    <div className="space-y-1 text-[10px] font-mono">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Vector</span>
                        <span className="text-slate-300">{report.vector}</span>
                      </div>
                      {report.reason && (
                        <div className="flex justify-between">
                          <span className="text-slate-500">Why</span>
                          <span className="text-slate-300">
                            {report.reason}
                          </span>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}

                <button
                  type="button"
                  onClick={() => setStep(2)}
                  disabled={isAttacking}
                  className="w-full py-4 bg-slate-800 text-slate-300 font-black uppercase text-[10px] rounded-xl flex items-center justify-center gap-2 border border-slate-700 disabled:opacity-50"
                >
                  View Defense Playbook <ArrowRight size={14} />
                </button>
              </div>

              <div className="lg:col-span-8 space-y-4">
                {/* DECOY / OVERLAY VISUAL */}
                <div className="bg-black/60 border border-slate-800 rounded-3xl p-6">
                  <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2 mb-6">
                    <Layers size={14} /> Attacker Page (Simulated)
                  </h3>

                  <div className="relative w-full h-64 bg-gradient-to-br from-slate-900 to-slate-950 rounded-2xl border border-slate-800 overflow-hidden">
                    {/* decoy content */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-6 text-center">
                      <Gift size={32} className="text-fuchsia-400" />
                      <p className="text-[11px] font-black text-white uppercase">
                        You've Won a Free Prize!
                      </p>
                      <div className="px-8 py-4 bg-gradient-to-r from-fuchsia-500 to-cyan-500 rounded-xl text-[11px] font-black text-white uppercase">
                        Claim Your Prize!
                      </div>
                    </div>

                    {/* hidden real iframe overlay */}
                    <motion.div
                      className={`absolute inset-6 rounded-xl border-2 flex flex-col items-center justify-end pb-6 ${
                        revealOverlay
                          ? "border-red-500/60 bg-red-500/5"
                          : "border-transparent"
                      }`}
                      animate={{
                        opacity:
                          clickState === "blocked" &&
                          !defenses.xfo &&
                          !defenses.csp
                            ? 1
                            : revealOverlay
                              ? 1
                              : clickState === "hijacked"
                                ? 0.9
                                : 0.15,
                      }}
                    >
                      {(defenses.xfo || defenses.csp) &&
                      isAttacking === false &&
                      clickState === "blocked" ? (
                        <div className="text-center px-4">
                          <AlertTriangle
                            size={20}
                            className="text-amber-400 mx-auto mb-2"
                          />
                          <p className="text-[9px] font-mono text-amber-400">
                            Refused to connect — framing blocked by
                            X-Frame-Options
                          </p>
                        </div>
                      ) : (
                        <div
                          className={`px-6 py-3 rounded-lg text-[9px] font-mono uppercase ${revealOverlay ? "bg-slate-900 border border-red-500/40 text-red-300" : "text-transparent"}`}
                        >
                          {deployed
                            ? deployed.action
                            : "Confirm Sensitive Action"}
                        </div>
                      )}
                    </motion.div>

                    {/* animated cursor */}
                    {isAttacking && clickState !== "blocked" && (
                      <motion.div
                        className="absolute z-20 pointer-events-none"
                        animate={{
                          left: `${cursorPos.x}%`,
                          top: `${cursorPos.y}%`,
                        }}
                        transition={{ duration: 0.5, ease: "easeInOut" }}
                      >
                        <MousePointer2
                          size={22}
                          className={
                            clickState === "hijacked"
                              ? "text-red-400"
                              : "text-cyan-300"
                          }
                          fill="currentColor"
                        />
                      </motion.div>
                    )}

                    {clickState === "hijacked" && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: [0, 1, 0] }}
                        transition={{ duration: 0.6, repeat: 2 }}
                        className="absolute inset-0 bg-red-500/20"
                      />
                    )}
                  </div>
                </div>

                {/* CONSOLE */}
                <div className="bg-black/60 border border-slate-800 rounded-3xl p-6 flex flex-col h-[260px]">
                  <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2 mb-4">
                    <Terminal size={14} /> Live Console
                  </h3>
                  <div className="flex-1 overflow-y-auto font-mono text-[11px] space-y-1 pr-2">
                    {terminalLines.length === 0 && (
                      <div className="text-slate-700 italic">
                        Select an attack vector to begin simulation...
                      </div>
                    )}
                    {terminalLines.map((line, i) => (
                      <div
                        key={i}
                        className={
                          line.includes("CRIT")
                            ? "text-red-400 font-bold"
                            : line.includes("BLOCK")
                              ? "text-emerald-400 font-bold"
                              : line.includes("WARN")
                                ? "text-amber-400"
                                : "text-slate-500"
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
            <motion.div
              key="s3"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="grid grid-cols-1 lg:grid-cols-2 gap-8"
            >
              <div className="lg:col-span-2 flex flex-wrap gap-2 justify-center">
                {attackVectors.map((v) => (
                  <button
                    type="button"
                    key={v.id}
                    onClick={() => setSelectedVector(v)}
                    className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase border transition-all
                      ${selectedVector.id === v.id ? "border-cyan-500 text-cyan-400 bg-cyan-500/10" : "border-slate-800 text-slate-600 hover:text-slate-300"}`}
                  >
                    {v.title}
                  </button>
                ))}
              </div>

              <div className="bg-slate-900/40 border border-slate-800 p-6 rounded-3xl">
                <h3 className="text-red-400 text-[10px] font-black uppercase mb-4 flex items-center gap-2">
                  <XCircle size={14} /> Vulnerable Config
                </h3>
                <pre className="bg-black p-4 rounded-xl text-[10px] text-red-300 font-mono overflow-x-auto whitespace-pre-wrap">
                  {selectedVector.vulnCode}
                </pre>
              </div>
              <div className="bg-slate-900/40 border border-slate-800 p-6 rounded-3xl">
                <h3 className="text-emerald-400 text-[10px] font-black uppercase mb-4 flex items-center gap-2">
                  <CheckCircle2 size={14} /> Hardened Config
                </h3>
                <pre className="bg-black p-4 rounded-xl text-[10px] text-emerald-300 font-mono overflow-x-auto whitespace-pre-wrap">
                  {selectedVector.fixCode}
                </pre>
              </div>

              <div className="lg:col-span-2 bg-slate-900/40 border border-slate-800 p-6 rounded-3xl">
                <h3 className="text-white text-[10px] font-black uppercase mb-4 flex items-center gap-2">
                  <ShieldCheck size={14} className="text-cyan-500" />{" "}
                  Remediation Checklist
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                  {defenseList.map((d) => {
                    const Icon = d.icon;
                    const on = defenses[d.id];
                    const effect = Math.round(
                      (selectedVector.mitigation[d.id] || 0) * 100,
                    );
                    return (
                      <button
                        type="button"
                        key={d.id}
                        onClick={() =>
                          setDefenses((prev) => ({
                            ...prev,
                            [d.id]: !prev[d.id],
                          }))
                        }
                        className={`flex items-center gap-3 text-left p-4 rounded-xl border transition-all
                          ${on ? "bg-emerald-500/10 border-emerald-500/40" : "bg-black/40 border-slate-800 hover:border-slate-600"}`}
                      >
                        <Icon
                          size={16}
                          className={
                            on
                              ? "text-emerald-400 shrink-0"
                              : "text-slate-600 shrink-0"
                          }
                        />
                        <div className="flex-1">
                          <div className="text-[10px] font-black uppercase text-slate-200">
                            {d.title}
                          </div>
                          <div className="text-[9px] text-slate-500">
                            {d.desc}
                          </div>
                        </div>
                        <div className="text-right">
                          <div
                            className={`text-[10px] font-mono ${on ? "text-emerald-400" : "text-slate-600"}`}
                          >
                            -{effect}%
                          </div>
                          {on ? (
                            <Lock
                              size={12}
                              className="text-emerald-400 ml-auto"
                            />
                          ) : (
                            <Unlock
                              size={12}
                              className="text-slate-600 ml-auto"
                            />
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setDefenses({
                      xfo: true,
                      csp: true,
                      frameBust: true,
                      sameSite: true,
                    })
                  }
                  className="w-full py-4 font-black text-[10px] uppercase rounded-xl flex items-center justify-center gap-2 transition-all bg-cyan-600/10 border border-cyan-500/30 text-cyan-500 hover:bg-cyan-500 hover:text-black"
                >
                  <ShieldCheck size={14} /> Enable All Defenses
                </button>

                <button
                  type="button"
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
          <button
            type="button"
            onClick={resetLab}
            className="flex items-center gap-2 text-[10px] font-black text-slate-600 hover:text-red-400 uppercase transition-colors"
          >
            <Trash2 size={12} /> Reset Lab Environment
          </button>
        </div>
      </div>
    </div>
  );
};

export default ClickjackingAttack;
