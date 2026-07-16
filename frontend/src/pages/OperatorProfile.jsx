import React, { useEffect, useMemo, useState } from 'react';
import {
  Shield, Mail, Globe, Edit3, Check, X,
  Lock, ShieldCheck, RefreshCw, WifiOff, HardDrive, KeyRound,
  MailWarning, Eye, EyeOff, LogIn, CircleCheck, CircleX
} from 'lucide-react';
import { motion } from 'framer-motion';
import { apiBaseUrl } from '../utils/api';

function getAuthToken() {
  return localStorage.getItem('operator_token') || localStorage.getItem('token');
}

function timeAgo(dateInput) {
  const date = new Date(dateInput);
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

// Turns a raw user-agent string into something readable, e.g. "Chrome on Windows"
function parseDevice(ua) {
  if (!ua) return 'Unknown device';
  let os = 'Unknown OS';
  if (/Windows/i.test(ua)) os = 'Windows';
  else if (/Mac OS X/i.test(ua)) os = 'macOS';
  else if (/Android/i.test(ua)) os = 'Android';
  else if (/iPhone|iPad|iOS/i.test(ua)) os = 'iOS';
  else if (/Linux/i.test(ua)) os = 'Linux';

  let browser = 'Unknown browser';
  if (/Edg\//i.test(ua)) browser = 'Edge';
  else if (/Chrome\//i.test(ua) && !/Edg\//i.test(ua)) browser = 'Chrome';
  else if (/Firefox\//i.test(ua)) browser = 'Firefox';
  else if (/Safari\//i.test(ua) && !/Chrome/i.test(ua)) browser = 'Safari';

  return `${browser} on ${os}`;
}

// Full class strings (not built dynamically) so Tailwind's scanner picks them up
const TIP_COLOR_CLASSES = {
  cyan: { box: 'bg-cyan-500/10 border-cyan-500/25', icon: 'text-cyan-400' },
  emerald: { box: 'bg-emerald-500/10 border-emerald-500/25', icon: 'text-emerald-400' },
  amber: { box: 'bg-amber-500/10 border-amber-500/25', icon: 'text-amber-400' },
  violet: { box: 'bg-violet-500/10 border-violet-500/25', icon: 'text-violet-400' },
  fuchsia: { box: 'bg-fuchsia-500/10 border-fuchsia-500/25', icon: 'text-fuchsia-400' },
  sky: { box: 'bg-sky-500/10 border-sky-500/25', icon: 'text-sky-400' },
};

const SECURITY_TIPS = [
  {
    icon: Lock,
    color: 'cyan',
    title: 'Use strong, unique passwords',
    text: 'Make a different password for every account so one leak can\u2019t open all your doors.',
  },
  {
    icon: ShieldCheck,
    color: 'emerald',
    title: 'Turn on two-factor login',
    text: 'A second step, like a code on your phone, keeps your account safe even if your password leaks.',
  },
  {
    icon: MailWarning,
    color: 'amber',
    title: 'Watch out for phishing',
    text: 'Be careful with links or attachments from people or emails you don\u2019t know.',
  },
  {
    icon: RefreshCw,
    color: 'violet',
    title: 'Keep everything updated',
    text: 'Updates often fix security holes, so don\u2019t put them off for too long.',
  },
  {
    icon: WifiOff,
    color: 'fuchsia',
    title: 'Be careful on public Wi-Fi',
    text: 'Avoid logging into banking or email apps on open, public networks.',
  },
  {
    icon: HardDrive,
    color: 'sky',
    title: 'Back up your files',
    text: 'Keep a copy of important files somewhere else, so you never lose them for good.',
  },
];

const OperatorProfile = () => {
  const token = useMemo(() => getAuthToken(), []);

  // Basic profile info (from login)
  const [name, setName] = useState(localStorage.getItem('operator_name') || 'Learner');
  const [email] = useState(
    localStorage.getItem('operator_email') ||
      `${(localStorage.getItem('operator_name') || 'learner').toLowerCase().replace(/\s/g, '')}@hackaware.dev`
  );

  // Name editing
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState(name);

  // Live data from the backend: recent login activity
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [logins, setLogins] = useState([]);

  const [isOnline, setIsOnline] = useState(true);

  // Password strength checker (all client-side, nothing is ever sent anywhere)
  const [pwdInput, setPwdInput] = useState('');
  const [showPwd, setShowPwd] = useState(false);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        setLoading(true);
        setError('');
        const headers = { Authorization: `Bearer ${token}` };
        const res = await fetch(`${apiBaseUrl}/api/auth/me/logins`, { headers });
        if (!alive) return;
        if (res.ok) {
          const data = await res.json();
          setLogins(data.logins || []);
        }
      } catch (e) {
        if (alive) setError('Could not load your recent login activity right now.');
      } finally {
        if (alive) setLoading(false);
      }
    };
    if (token) load();
    else setLoading(false);
    return () => {
      alive = false;
    };
  }, [token]);

  const sortedLogins = useMemo(
    () => [...logins].sort((a, b) => new Date(b.at) - new Date(a.at)),
    [logins]
  );

  // "Last active" pill: the session before this one, if we have it
  const lastActiveEntry = sortedLogins.length > 1 ? sortedLogins[1] : sortedLogins[0] || null;

  const saveName = () => {
    const trimmed = nameDraft.trim();
    if (trimmed) {
      setName(trimmed);
      localStorage.setItem('operator_name', trimmed);
    }
    setIsEditingName(false);
  };

  const pwdChecks = [
    { label: 'At least 8 characters', pass: pwdInput.length >= 8 },
    { label: 'Upper & lower case letters', pass: /[a-z]/.test(pwdInput) && /[A-Z]/.test(pwdInput) },
    { label: 'At least one number', pass: /[0-9]/.test(pwdInput) },
    { label: 'At least one symbol', pass: /[^A-Za-z0-9]/.test(pwdInput) },
  ];
  const pwdScore = pwdInput ? pwdChecks.filter((c) => c.pass).length : 0;
  const pwdMeta = [
    { label: 'Type a password to check it', barColor: 'bg-slate-700', textColor: 'text-slate-500' },
    { label: 'Very weak', barColor: 'bg-red-500', textColor: 'text-red-400' },
    { label: 'Weak', barColor: 'bg-orange-500', textColor: 'text-orange-400' },
    { label: 'Fair', barColor: 'bg-amber-500', textColor: 'text-amber-400' },
    { label: 'Good', barColor: 'bg-cyan-500', textColor: 'text-cyan-400' },
    { label: 'Strong', barColor: 'bg-emerald-500', textColor: 'text-emerald-400' },
  ][pwdInput ? pwdScore + 1 : 0];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto rounded-[28px] shadow-2xl overflow-hidden border border-slate-800/80 relative"
      style={{ background: 'radial-gradient(1200px 400px at 90% -10%, rgba(34,211,238,0.08), transparent), #020617' }}
    >
      {/* faint grid texture */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(148,163,184,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,0.6) 1px, transparent 1px)',
          backgroundSize: '28px 28px',
        }}
      />

      {error && (
        <div className="relative mx-6 mt-6 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-sm">
          {error}
        </div>
      )}

      {/* Banner */}
      <div className="relative h-28 md:h-32">
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(120deg, rgba(34,211,238,0.25), rgba(168,85,247,0.18) 45%, rgba(2,6,23,0.9))',
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#020617] via-transparent to-transparent" />

        <button
          onClick={() => setIsOnline(!isOnline)}
          className="absolute top-4 right-5 flex items-center gap-2 text-[11px] text-slate-300 hover:text-white transition-colors bg-black/20 backdrop-blur-sm px-3 py-1.5 rounded-full border border-white/10"
        >
          <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]' : 'bg-slate-500'}`} />
          {isOnline ? 'Online' : 'Away'}
        </button>
      </div>

      <div className="relative px-6 md:px-8">
        {/* Header: avatar overlaps banner */}
        <div className="flex flex-col md:flex-row md:items-end gap-6 -mt-14 md:-mt-12 pb-8">
          <div className="relative shrink-0 mx-auto md:mx-0">
            <div className="absolute -inset-1 rounded-2xl bg-gradient-to-br from-cyan-500/50 to-fuchsia-500/40 blur-md opacity-70" />
            <div className="relative w-24 h-24 bg-slate-900 border-4 border-[#020617] rounded-2xl flex items-center justify-center text-4xl font-black text-cyan-400">
              {name.charAt(0).toUpperCase()}
            </div>
          </div>

          <div className="flex-1 text-center md:text-left pb-1">
            {isEditingName ? (
              <div className="flex items-center justify-center md:justify-start gap-2">
                <input
                  autoFocus
                  value={nameDraft}
                  onChange={(e) => setNameDraft(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && saveName()}
                  className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-1 text-xl font-bold text-white outline-none focus:border-cyan-500"
                />
                <button onClick={saveName} className="text-emerald-500 hover:text-emerald-400">
                  <Check size={20} />
                </button>
                <button
                  onClick={() => {
                    setNameDraft(name);
                    setIsEditingName(false);
                  }}
                  className="text-slate-500 hover:text-red-400"
                >
                  <X size={20} />
                </button>
              </div>
            ) : (
              <h1 className="text-2xl md:text-3xl font-black text-white flex items-center justify-center md:justify-start gap-2">
                {name}
                <button
                  onClick={() => setIsEditingName(true)}
                  className="text-slate-600 hover:text-cyan-400 transition-colors"
                  title="Edit name"
                >
                  <Edit3 size={15} />
                </button>
              </h1>
            )}
            <p className="text-slate-500 text-sm mt-2">Building safer habits, one lesson at a time.</p>
          </div>

          {/* Last active pill, driven by real login history */}
          <div className="flex items-center justify-center md:justify-end pb-1">
            <div className="flex items-center gap-3 bg-slate-900/50 border border-slate-800 rounded-2xl px-5 py-3">
              <div className="w-11 h-11 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center">
                <LogIn size={20} className="text-cyan-400" />
              </div>
              <div>
                <p className="text-white font-black text-sm leading-none">
                  {loading ? '—' : lastActiveEntry ? timeAgo(lastActiveEntry.at) : 'New here'}
                </p>
                <p className="text-[10px] text-slate-500 uppercase tracking-wide mt-1">Last active</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-5">
          {/* Security tips — main content, keeps the page full */}
          <div className="md:col-span-3 bg-slate-900/30 border border-slate-800/70 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <Shield size={16} className="text-cyan-400" />
              <h2 className="text-white font-bold text-sm">Security Tips</h2>
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              {SECURITY_TIPS.map((tip, i) => {
                const Icon = tip.icon;
                const colors = TIP_COLOR_CLASSES[tip.color];
                return (
                  <div
                    key={i}
                    className="p-3.5 rounded-xl bg-slate-950/50 border border-slate-800 hover:border-slate-700 transition-colors"
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-2.5 border ${colors.box}`}>
                      <Icon size={15} className={colors.icon} />
                    </div>
                    <p className="text-white text-xs font-bold mb-1">{tip.title}</p>
                    <p className="text-slate-500 text-[11px] leading-relaxed">{tip.text}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right column: password strength tool + recent logins */}
          <div className="md:col-span-2 flex flex-col gap-5">
            {/* Interactive password strength checker */}
            <div className="bg-slate-900/30 border border-slate-800/70 rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-1">
                <KeyRound size={16} className="text-violet-400" />
                <h2 className="text-white font-bold text-sm">Test Your Password Strength</h2>
              </div>
              <p className="text-slate-500 text-[11px] mb-3">
                Type a password below to see how strong it is. It stays on your device only.
              </p>

              <div className="relative mb-3">
                <input
                  type={showPwd ? 'text' : 'password'}
                  value={pwdInput}
                  onChange={(e) => setPwdInput(e.target.value)}
                  placeholder="Try a password..."
                  className="w-full bg-slate-950/60 border border-slate-800 focus:border-violet-500 rounded-xl px-3 py-2.5 pr-10 text-sm text-white placeholder:text-slate-600 outline-none transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPwd((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                  aria-label={showPwd ? 'Hide password' : 'Show password'}
                >
                  {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>

              <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden mb-1.5">
                <div
                  className={`h-full ${pwdMeta.barColor} transition-all duration-300`}
                  style={{ width: `${(pwdScore / 4) * 100}%` }}
                />
              </div>
              <p className={`text-[11px] font-bold mb-3 ${pwdMeta.textColor}`}>{pwdMeta.label}</p>

              <div className="space-y-1.5">
                {pwdChecks.map((c, i) => (
                  <div key={i} className="flex items-center gap-2">
                    {c.pass ? (
                      <CircleCheck size={14} className="text-emerald-400 shrink-0" />
                    ) : (
                      <CircleX size={14} className="text-slate-700 shrink-0" />
                    )}
                    <span className={`text-[11px] ${c.pass ? 'text-slate-300' : 'text-slate-600'}`}>
                      {c.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent login activity — real data from the backend */}
            <div className="bg-slate-900/30 border border-slate-800/70 rounded-2xl p-5 flex-1">
              <div className="flex items-center gap-2 mb-4">
                <LogIn size={16} className="text-cyan-400" />
                <h2 className="text-white font-bold text-sm">Recent Login Activity</h2>
              </div>
              {loading ? (
                <p className="text-slate-500 text-sm">Loading...</p>
              ) : sortedLogins.length ? (
                <div className="space-y-1">
                  {sortedLogins.map((entry, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between py-2 border-b border-slate-800/50 last:border-b-0"
                    >
                      <div>
                        <p className="text-slate-300 text-[13px] font-medium">{parseDevice(entry.userAgent)}</p>
                        <p className="text-slate-600 text-[11px]">{timeAgo(entry.at)}</p>
                      </div>
                      {i === 0 && (
                        <span className="text-[10px] font-bold px-2.5 py-1 rounded-full border text-emerald-400 bg-emerald-500/10 border-emerald-500/30">
                          Current
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-slate-500 text-sm">No login activity yet.</p>
              )}
            </div>
          </div>
        </div>

        {/* Footer: contact + status */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mt-6 pt-5 border-t border-slate-800/70 pb-6 text-slate-500 text-[12px]">
          <div className="flex flex-wrap items-center gap-4">
            <a href={`mailto:${email}`} className="flex items-center gap-2 hover:text-cyan-400 transition-colors">
              <Mail size={13} /> {email}
            </a>
            <a
              href="https://hackaware.dev"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 hover:text-cyan-400 transition-colors"
            >
              <Globe size={13} /> hackaware.dev
            </a>
          </div>
          <div className="flex items-center gap-2 text-slate-600">
            <Shield size={13} /> Protected by HackAware
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default OperatorProfile;