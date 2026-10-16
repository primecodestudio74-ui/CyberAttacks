import React, { useMemo, useState } from 'react';
import {
  Mail, Edit3, Check, X, Lock, ShieldCheck, MailWarning, RefreshCw,
  KeyRound, Eye, EyeOff, CircleCheck, CircleX,
  Trophy, CheckCircle2, Star
} from 'lucide-react';
import { motion } from 'framer-motion';

const TOTAL_LABS = 8; // keep in sync with the number of labs on the dashboard

function readList(key) {
  try {
    const value = JSON.parse(localStorage.getItem(key) || '[]');
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

// Same levels as the dashboard
function getLevel(done) {
  if (done >= TOTAL_LABS) return 'Cyber Pro';
  if (done >= 5) return 'Defender';
  if (done >= 2) return 'Explorer';
  return 'Beginner';
}

const TIPS = [
  { icon: Lock, color: 'text-cyan-400', title: 'Use a different password for each account', text: 'One leak then can’t open all your accounts.' },
  { icon: ShieldCheck, color: 'text-emerald-400', title: 'Turn on two-step login', text: 'A code on your phone protects you even if your password leaks.' },
  { icon: MailWarning, color: 'text-amber-400', title: 'Be careful with unknown links', text: 'Check the sender before you click or download anything.' },
  { icon: RefreshCw, color: 'text-violet-400', title: 'Install updates', text: 'Updates fix security problems, so don’t keep delaying them.' },
];

const OperatorProfile = () => {
  // Profile basics
  const [name, setName] = useState(localStorage.getItem('operator_name') || 'Learner');
  const email = localStorage.getItem('operator_email') || '';
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState(name);

  // Progress (saved by the dashboard)
  const doneCount = useMemo(() => readList('hackaware_completed').length, []);
  const favCount = useMemo(() => readList('hackaware_favs').length, []);
  const progressPct = Math.min(100, Math.round((doneCount / TOTAL_LABS) * 100));
  const level = getLevel(doneCount);

  // Password checker (runs only in your browser, nothing is sent anywhere)
  const [pwd, setPwd] = useState('');
  const [showPwd, setShowPwd] = useState(false);

  const saveName = () => {
    const trimmed = nameDraft.trim();
    if (trimmed) {
      setName(trimmed);
      localStorage.setItem('operator_name', trimmed);
    }
    setIsEditingName(false);
  };

  const checks = [
    { label: 'At least 8 characters', pass: pwd.length >= 8 },
    { label: 'Both capital and small letters', pass: /[a-z]/.test(pwd) && /[A-Z]/.test(pwd) },
    { label: 'At least one number', pass: /[0-9]/.test(pwd) },
    { label: 'At least one symbol (like ! or @)', pass: /[^A-Za-z0-9]/.test(pwd) },
  ];
  const score = pwd ? checks.filter((c) => c.pass).length : 0;
  const meter = [
    { label: 'Type a password to test it', bar: 'bg-slate-700', text: 'text-slate-500' },
    { label: 'Very weak', bar: 'bg-red-500', text: 'text-red-400' },
    { label: 'Weak', bar: 'bg-orange-500', text: 'text-orange-400' },
    { label: 'Okay', bar: 'bg-amber-500', text: 'text-amber-400' },
    { label: 'Good', bar: 'bg-cyan-500', text: 'text-cyan-400' },
    { label: 'Strong', bar: 'bg-emerald-500', text: 'text-emerald-400' },
  ][pwd ? score + 1 : 0];

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-4xl mx-auto w-full space-y-5">

      {/* Profile header */}
      <div className="bg-slate-900/40 border border-slate-800/70 rounded-3xl p-6 md:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center gap-5">
          <div className="w-20 h-20 shrink-0 bg-slate-950 border border-slate-700 rounded-2xl flex items-center justify-center text-3xl font-black text-cyan-400 mx-auto sm:mx-0">
            {name.charAt(0).toUpperCase()}
          </div>

          <div className="flex-1 text-center sm:text-left min-w-0">
            {isEditingName ? (
              <div className="flex items-center justify-center sm:justify-start gap-2">
                <input
                  autoFocus
                  maxLength={30}
                  value={nameDraft}
                  onChange={(e) => setNameDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') saveName();
                    if (e.key === 'Escape') { setNameDraft(name); setIsEditingName(false); }
                  }}
                  className="bg-slate-950 border border-slate-700 focus:border-cyan-500 rounded-lg px-3 py-1.5 text-lg font-bold text-white outline-none min-w-0"
                />
                <button onClick={saveName} aria-label="Save name" className="text-emerald-500 hover:text-emerald-400"><Check size={20} /></button>
                <button onClick={() => { setNameDraft(name); setIsEditingName(false); }} aria-label="Cancel" className="text-slate-500 hover:text-red-400"><X size={20} /></button>
              </div>
            ) : (
              <h1 className="text-2xl md:text-3xl font-black text-white flex items-center justify-center sm:justify-start gap-2">
                <span className="truncate">{name}</span>
                <button onClick={() => { setNameDraft(name); setIsEditingName(true); }} className="text-slate-600 hover:text-cyan-400 transition-colors shrink-0" title="Change name">
                  <Edit3 size={15} />
                </button>
              </h1>
            )}
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 mt-2 text-sm">
              <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-[11px] font-bold">{level}</span>
              {email && (
                <a href={`mailto:${email}`} className="flex items-center gap-1.5 text-slate-500 hover:text-cyan-400 transition-colors text-[13px]">
                  <Mail size={13} /> {email}
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Progress */}
        <div className="mt-6">
          <div className="flex justify-between text-[11px] text-slate-500 mb-2">
            <span>Lab progress</span>
            <span className="text-slate-300 font-bold">{doneCount} of {TOTAL_LABS} done</span>
          </div>
          <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
            <div className="h-full bg-cyan-500 transition-all duration-700" style={{ width: `${progressPct}%` }} />
          </div>
        </div>
      </div>

      {/* Quick numbers */}
      <div className="grid grid-cols-2 gap-3 md:gap-4">
        <Stat icon={<CheckCircle2 size={16} className="text-emerald-400" />} label="Labs done" value={doneCount} />
        <Stat icon={<Star size={16} className="text-yellow-400" />} label="Favorites" value={favCount} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Password checker */}
        <div className="bg-slate-900/40 border border-slate-800/70 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-1">
            <KeyRound size={16} className="text-violet-400" />
            <h2 className="text-white font-bold text-sm">Password Checker</h2>
          </div>
          <p className="text-slate-500 text-[12px] mb-4">Test a password here. It never leaves your device.</p>

          <div className="relative mb-3">
            <input
              type={showPwd ? 'text' : 'password'}
              value={pwd}
              onChange={(e) => setPwd(e.target.value)}
              placeholder="Type a password…"
              autoComplete="off"
              className="w-full bg-slate-950/60 border border-slate-800 focus:border-violet-500 rounded-xl px-3 py-2.5 pr-10 text-sm text-white placeholder:text-slate-600 outline-none transition-colors"
            />
            <button type="button" onClick={() => setShowPwd((v) => !v)} aria-label={showPwd ? 'Hide password' : 'Show password'} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
              {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>

          <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden mb-1.5">
            <div className={`h-full ${meter.bar} transition-all duration-300`} style={{ width: `${(score / 4) * 100}%` }} />
          </div>
          <p className={`text-[12px] font-bold mb-3 ${meter.text}`}>{meter.label}</p>

          <div className="space-y-1.5">
            {checks.map((c) => (
              <div key={c.label} className="flex items-center gap-2">
                {c.pass ? <CircleCheck size={14} className="text-emerald-400 shrink-0" /> : <CircleX size={14} className="text-slate-700 shrink-0" />}
                <span className={`text-[12px] ${c.pass ? 'text-slate-300' : 'text-slate-600'}`}>{c.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Tips */}
        <div className="bg-slate-900/40 border border-slate-800/70 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Trophy size={16} className="text-amber-400" />
            <h2 className="text-white font-bold text-sm">4 Habits That Keep You Safe</h2>
          </div>
          <div className="space-y-4">
            {TIPS.map(({ icon: Icon, color, title, text }) => (
              <div key={title} className="flex gap-3">
                <Icon size={16} className={`${color} shrink-0 mt-0.5`} />
                <div>
                  <p className="text-white text-[13px] font-bold">{title}</p>
                  <p className="text-slate-500 text-[12px] leading-relaxed">{text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const Stat = ({ icon, label, value }) => (
  <div className="bg-slate-900/40 border border-slate-800/70 rounded-2xl p-4">
    <div className="flex items-center gap-2 mb-2">{icon}<span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">{label}</span></div>
    <p className="text-white font-black text-2xl">{value}</p>
  </div>
);

export default OperatorProfile;