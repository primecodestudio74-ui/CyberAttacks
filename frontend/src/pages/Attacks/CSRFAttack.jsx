import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ChevronLeft,
  ShieldCheck,
  ShieldAlert,
  Banknote,
  Skull,
  RotateCcw,
  Terminal,
} from "lucide-react";

const BANK_ORIGIN = "https://securebank.example";
const EVIL_ORIGIN = "https://free-iphone-win.example";
const SESSION_ID = "sess_8f3a91c2";
const CSRF_TOKEN = "tok_7d21c9e4b5a0";
const START_BALANCE = 10000;

const Toggle = ({ label, hint, checked, onChange }) => (
  <button
    onClick={onChange}
    className={`w-full text-left p-3 rounded-xl border transition-all ${
      checked
        ? "border-emerald-500/50 bg-emerald-500/10"
        : "border-slate-800 bg-slate-900/50"
    }`}
  >
    <div className="flex items-center justify-between">
      <span className="text-xs font-bold text-white uppercase tracking-wider">
        {label}
      </span>
      <span
        className={`text-[10px] font-mono ${
          checked ? "text-emerald-400" : "text-red-400"
        }`}
      >
        {checked ? "ON" : "OFF"}
      </span>
    </div>
    <p className="text-[11px] text-slate-500 mt-1">{hint}</p>
  </button>
);

const EVIL_HTML = `<form action="${BANK_ORIGIN}/transfer" method="POST" id="f">
  <input type="hidden" name="to" value="attacker_9921">
  <input type="hidden" name="amount" value="2500">
</form>
<script>document.getElementById("f").submit();</script>`;

const VULNERABLE_CODE = `app.post("/transfer", (req, res) => {
  // Only checks the cookie. The browser adds it
  // automatically, even for requests from other sites.
  if (!req.session.userId) return res.sendStatus(401);
  transfer(req.body.to, req.body.amount);
  res.send("Done");
});`;

const SECURE_CODE = `app.use(session({ cookie: { sameSite: "strict", httpOnly: true, secure: true } }));

app.post("/transfer", (req, res) => {
  if (req.headers.origin !== "https://securebank.example")
    return res.sendStatus(403);               // Origin check
  if (req.headers["x-csrf-token"] !== req.session.csrfToken)
    return res.sendStatus(403);               // Anti-CSRF token
  transfer(req.body.to, req.body.amount);
  res.send("Done");
});`;

const CSRFAttack = () => {
  const navigate = useNavigate();
  const [balance, setBalance] = useState(START_BALANCE);
  const [transfers, setTransfers] = useState([]);
  const [log, setLog] = useState([]);
  const [lastResult, setLastResult] = useState(null);
  const [defenses, setDefenses] = useState({
    sameSite: false,
    origin: false,
    token: false,
  });

  const toggle = (key) => setDefenses((d) => ({ ...d, [key]: !d[key] }));
  const enableAll = () =>
    setDefenses({ sameSite: true, origin: true, token: true });

  const sendTransfer = ({ to, amount, origin, token, crossSite, label }) => {
    const cookieAttached = !(crossSite && defenses.sameSite);
    let verdict = { ok: true, code: 200, reason: "Transfer completed" };

    if (!cookieAttached)
      verdict = {
        ok: false,
        code: 401,
        reason: "No session cookie sent (SameSite blocked it)",
      };
    else if (defenses.origin && origin !== BANK_ORIGIN)
      verdict = {
        ok: false,
        code: 403,
        reason: "Origin header does not match the bank",
      };
    else if (defenses.token && token !== CSRF_TOKEN)
      verdict = { ok: false, code: 403, reason: "CSRF token missing or invalid" };
    else if (balance < amount)
      verdict = { ok: false, code: 400, reason: "Insufficient balance" };

    setLog((prev) => [
      ...prev,
      `--- ${label} ---`,
      `POST /transfer  to=${to}  amount=${amount}`,
      `Origin: ${origin}`,
      `Cookie: ${cookieAttached ? `sessionid=${SESSION_ID}` : "(not sent)"}`,
      `X-CSRF-Token: ${token || "(missing)"}`,
      `=> ${verdict.code} ${verdict.reason}`,
    ]);

    if (verdict.ok) {
      setBalance((b) => b - amount);
      setTransfers((t) => [...t, { to, amount }]);
    }
    setLastResult({ ...verdict, label });
  };

  const legitTransfer = () =>
    sendTransfer({
      to: "Rahul (friend)",
      amount: 500,
      origin: BANK_ORIGIN,
      token: CSRF_TOKEN,
      crossSite: false,
      label: "LEGIT: user clicks Transfer in the bank app",
    });

  const runAttack = () =>
    sendTransfer({
      to: "attacker_9921",
      amount: 2500,
      origin: EVIL_ORIGIN,
      token: "",
      crossSite: true,
      label: "ATTACK: hidden form on the evil page",
    });

  const reset = () => {
    setBalance(START_BALANCE);
    setTransfers([]);
    setLog([]);
    setLastResult(null);
    setDefenses({ sameSite: false, origin: false, token: false });
  };

  const anyDefense = defenses.sameSite || defenses.origin || defenses.token;

  return (
    <div className="min-h-screen bg-[#020617] text-slate-300 font-sans p-4 sm:p-6 md:p-8 selection:bg-cyan-500/30">
      <div className="max-w-6xl mx-auto">
        {/* HEADER */}
        <header className="flex items-center justify-between mb-8 gap-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate("/dashboard")}
              className="bg-cyan-500 p-2.5 rounded-xl hover:bg-cyan-400 transition-colors shrink-0"
            >
              <ChevronLeft className="text-black" size={20} />
            </button>
            <div>
              <h1 className="text-xl md:text-2xl font-black text-white uppercase italic tracking-tighter">
                CSRF <span className="text-cyan-500 text-xs md:text-sm">LAB</span>
              </h1>
              <p className="text-[9px] font-mono text-slate-500 uppercase tracking-[0.2em]">
                Cross-Site Request Forgery / Simulation
              </p>
            </div>
          </div>
          <button
            onClick={reset}
            className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-cyan-400 border border-slate-800 px-3 py-2 rounded-xl"
          >
            <RotateCcw size={14} /> Reset
          </button>
        </header>

        {/* WHAT IS CSRF */}
        <p className="text-sm text-slate-400 mb-8 max-w-3xl">
          CSRF tricks a logged-in user&apos;s browser into sending a request they
          never intended. The browser attaches the session cookie automatically,
          so the bank cannot tell the difference. Run the attack with all
          defenses OFF, then turn them ON and run it again.
        </p>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* VICTIM BANK */}
          <section className="bg-[#030712] border border-slate-800/60 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <Banknote className="text-emerald-400" size={18} />
              <h2 className="text-xs font-black text-white uppercase tracking-widest">
                SecureBank (victim, logged in)
              </h2>
            </div>
            <p className="text-[10px] font-mono text-slate-600 mb-1">
              {BANK_ORIGIN}
            </p>
            <p className="text-3xl font-black text-white mb-4">
              ₹{balance.toLocaleString("en-IN")}
            </p>
            <button
              onClick={legitTransfer}
              className="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-black text-xs uppercase tracking-widest py-3 rounded-xl transition-colors"
            >
              Send ₹500 to Rahul
            </button>
            <div className="mt-4 space-y-2 max-h-40 overflow-y-auto">
              {transfers.length === 0 && (
                <p className="text-[11px] text-slate-600">No transfers yet.</p>
              )}
              {transfers.map((t, i) => (
                <div
                  key={i}
                  className={`text-[11px] font-mono flex justify-between p-2 rounded-lg ${
                    t.to === "attacker_9921"
                      ? "bg-red-500/10 text-red-400"
                      : "bg-slate-900 text-slate-400"
                  }`}
                >
                  <span>{t.to}</span>
                  <span>-₹{t.amount}</span>
                </div>
              ))}
            </div>
          </section>

          {/* ATTACKER PAGE */}
          <section className="bg-[#030712] border border-red-500/20 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <Skull className="text-red-400" size={18} />
              <h2 className="text-xs font-black text-white uppercase tracking-widest">
                Evil Page (attacker)
              </h2>
            </div>
            <p className="text-[10px] font-mono text-slate-600 mb-3">
              {EVIL_ORIGIN}
            </p>
            <div className="bg-gradient-to-br from-yellow-500/20 to-red-500/20 border border-yellow-500/30 rounded-xl p-4 text-center mb-4">
              <p className="text-white font-black">🎉 You won a free iPhone!</p>
              <p className="text-[11px] text-slate-400">Click to claim your prize</p>
            </div>
            <button
              onClick={runAttack}
              className="w-full bg-red-500 hover:bg-red-400 text-white font-black text-xs uppercase tracking-widest py-3 rounded-xl transition-colors"
            >
              Claim Prize (victim clicks)
            </button>
            <p className="text-[10px] text-slate-600 mt-4 mb-1 uppercase tracking-widest">
              Hidden code on this page
            </p>
            <pre className="text-[10px] font-mono text-red-300/80 bg-black/40 p-3 rounded-lg overflow-x-auto">
              {EVIL_HTML}
            </pre>
          </section>

          {/* DEFENSES */}
          <section className="bg-[#030712] border border-slate-800/60 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                {anyDefense ? (
                  <ShieldCheck className="text-emerald-400" size={18} />
                ) : (
                  <ShieldAlert className="text-red-400" size={18} />
                )}
                <h2 className="text-xs font-black text-white uppercase tracking-widest">
                  Defenses
                </h2>
              </div>
              <button
                onClick={enableAll}
                className="text-[10px] font-black uppercase tracking-widest text-cyan-400 hover:text-cyan-300"
              >
                Enable all
              </button>
            </div>
            <div className="space-y-3">
              <Toggle
                label="SameSite cookie"
                hint="Browser does not send the session cookie on cross-site requests."
                checked={defenses.sameSite}
                onChange={() => toggle("sameSite")}
              />
              <Toggle
                label="Origin check"
                hint="Server rejects requests whose Origin is not the bank itself."
                checked={defenses.origin}
                onChange={() => toggle("origin")}
              />
              <Toggle
                label="Anti-CSRF token"
                hint="Every sensitive request must carry a secret token the attacker cannot read."
                checked={defenses.token}
                onChange={() => toggle("token")}
              />
            </div>
          </section>
        </div>

        {/* RESULT BANNER */}
        {lastResult && (
          <div
            className={`mt-6 p-4 rounded-xl border text-sm font-bold ${
              lastResult.ok && lastResult.label.startsWith("ATTACK")
                ? "border-red-500/40 bg-red-500/10 text-red-300"
                : lastResult.ok
                ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300"
                : "border-cyan-500/40 bg-cyan-500/10 text-cyan-300"
            }`}
          >
            {lastResult.ok && lastResult.label.startsWith("ATTACK")
              ? "💥 Attack succeeded: money was sent to the attacker without the user knowing."
              : lastResult.ok
              ? "✅ Legitimate transfer worked normally."
              : `🛡️ Request blocked: ${lastResult.reason}`}
          </div>
        )}

        {/* SERVER LOG */}
        <section className="mt-6 bg-black border border-slate-800/60 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <Terminal className="text-cyan-500" size={16} />
            <h2 className="text-[10px] font-black text-white uppercase tracking-widest">
              Bank Server Log
            </h2>
          </div>
          <div className="font-mono text-[11px] space-y-0.5 max-h-60 overflow-y-auto">
            {log.length === 0 && (
              <p className="text-slate-600">Waiting for requests...</p>
            )}
            {log.map((line, i) => (
              <p
                key={i}
                className={
                  line.startsWith("---")
                    ? "text-cyan-400 mt-2"
                    : line.startsWith("=> 200")
                    ? "text-red-400"
                    : line.startsWith("=>")
                    ? "text-emerald-400"
                    : "text-slate-500"
                }
              >
                {line}
              </p>
            ))}
          </div>
        </section>

        {/* CODE COMPARISON */}
        <div className="grid md:grid-cols-2 gap-6 mt-6">
          <div className="bg-[#030712] border border-red-500/20 rounded-2xl p-5">
            <h3 className="text-[10px] font-black text-red-400 uppercase tracking-widest mb-3">
              Vulnerable code
            </h3>
            <pre className="text-[11px] font-mono text-slate-400 overflow-x-auto">
              {VULNERABLE_CODE}
            </pre>
          </div>
          <div className="bg-[#030712] border border-emerald-500/20 rounded-2xl p-5">
            <h3 className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-3">
              Secure code
            </h3>
            <pre className="text-[11px] font-mono text-slate-400 overflow-x-auto">
              {SECURE_CODE}
            </pre>
          </div>
        </div>

        {/* PREVENTION */}
        <section className="mt-6 bg-[#030712] border border-slate-800/60 rounded-2xl p-5">
          <h3 className="text-[10px] font-black text-white uppercase tracking-widest mb-3">
            How to prevent CSRF
          </h3>
          <ul className="text-sm text-slate-400 space-y-1 list-disc pl-5">
            <li>Use anti-CSRF tokens on every state-changing request.</li>
            <li>Set session cookies with SameSite=Strict or Lax, plus HttpOnly and Secure.</li>
            <li>Validate the Origin and Referer headers on the server.</li>
            <li>Ask for the password or an OTP again for sensitive actions.</li>
            <li>Never use GET requests to change data.</li>
          </ul>
        </section>
      </div>
    </div>
  );
};

export default CSRFAttack;