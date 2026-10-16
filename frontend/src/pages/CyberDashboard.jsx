import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Shield, LogOut, LayoutDashboard, Lock, Mail,
  Database, Menu, ChevronLeft,
  ExternalLink, User, Clock,
  BrainCircuit, Bot, BookOpen, Settings, Keyboard, Key, Newspaper,
  ServerCrash, Code2, Radar, SquareStack, ArrowLeftRight, Star, Search, Trophy, Flame, Lightbulb, Target,
  CheckCircle2, RotateCcw, Zap, ShieldCheck, X
} from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

// Component Imports
import OperatorProfile from './OperatorProfile';
import LearningHub from '../components/Learning/LearningHub';
import ChatbotPanel from '../components/Chatbot/ChatbotPanel';
import FloatingNewsTicker from '../components/News/FloatingNewsTicker.jsx';
import CyberNewsHero from '../components/News/CyberNewsHero.jsx';
import CyberNews from './News/CyberNews';
import useNews from '../hooks/useNews.js';
import { NEWS_CATEGORY_IDS } from '../utils/newsFormat.js';

// Tabs the dashboard can render. The sidebar, the URL (?tab=...) and the
// content area all stay in sync through this list.
const DASHBOARD_TABS = ['hub', 'prevention', 'news', 'learning', 'chatbot', 'profile', 'settings'];
const NEWS_FILTER_KEYS = ['category', 'q', 'source', 'sort'];
const DIFFICULTIES = ['All', 'Beginner', 'Intermediate', 'Advanced'];

// ---------------------------------------------------------------------------
// Content (kept in simple, everyday language)
// ---------------------------------------------------------------------------
const ATTACKS = [
    {
      id: "SQL_INJECTION",
      title: "SQL Injection",
      desc: "Exploit database vulnerabilities via malicious query manipulation.",
      icon: <Database className="text-purple-400" />,
      tag: "DATABASE_SEC",
      path: "/dashboard/sql-injection",
      difficulty: "Intermediate",
    },
    {
      id: "XSS",
      title: "Cross-Site Scripting (XSS)",
      desc: "Follow a fictional comment into a visitor’s browser, then see how safe text rendering changes the outcome.",
      icon: <Code2 className="text-violet-400" />,
      tag: "BROWSER_SECURITY",
      path: "/dashboard/xss",
      difficulty: "Beginner",
    },
    {
      id: "PHISHING",
      title: "Phishing Attack",
      desc: "Simulate deceptive communication to identify social engineering risks.",
      icon: <Mail className="text-blue-400" />,
      tag: "SOCIAL_ENG",
      path: "/dashboard/phishing",
      difficulty: "Beginner",
    },
    {
      id: "BRUTE_FORCE",
      title: "Brute-Force Attack",
      desc: "Systematic credential guessing to test password complexity and lockouts.",
      icon: <Lock className="text-cyan-400" />,
      tag: "AUTH_TEST",
      path: "/dashboard/brute-force",
      difficulty: "Beginner",
    },
    {
      id: "AI_POISONING",
      title: "AI Data Poisoning",
      desc: "Corrupt neural network training sets to create backdoors and model bias.",
      icon: <BrainCircuit className="text-fuchsia-500" />,
      tag: "ADVERSARIAL_ML",
      path: "/dashboard/ai-poisoning",
      difficulty: "Advanced",
    },
    {
      id: "KEYLOGGER",
      title: "Keylogger Attack",
      desc: "Intercept and record keystrokes to understand data exfiltration risks.",
      icon: <Keyboard className="text-red-400" />,
      tag: "DATA_EXFIL",
      path: "/dashboard/keylogger",
      difficulty: "Intermediate",
    },
    {
      id: "SESSION_HIJACKING",
      title: "Session Hijacking Attack",
      desc: "Intercept and exploit active session tokens to understand sidejacking and cookie vulnerability risks.",
      icon: <Key className="text-cyan-400" />,
      tag: "SESSION_MGMT",
      path: "/dashboard/sessionhijacking",
      difficulty: "Intermediate",
    },
    {
      id: "DOS_ATTACK",
      title: "DoS / DDoS Attack",
      desc: "Simulate HTTP, SYN and Slowloris floods against a mock server and learn how rate limiting, WAFs and timeouts keep services online.",
      icon: <ServerCrash className="text-cyan-400" />,
      tag: "AVAILABILITY",
      path: "/dashboard/DosAttack",
      difficulty: "Intermediate",
    },
    {
      id: "MITM_ATTACK",
      title: "Man-in-the-Middle Attack",
      desc: "Intercept traffic between a user and a server on open Wi-Fi, and learn how HTTPS, HSTS, VPNs and certificate pinning keep sessions private.",
      icon: <Radar className="text-cyan-400" />,
      tag: "NETWORK",
      path: "/dashboard/MitmAttack",
      difficulty: "Advanced",
    },
    {
      id: "CLICKJACKING",
      title: "Clickjacking Attack",
      desc: "Trick a logged-in user into clicking a hidden real button through an invisible overlay, and learn how framing headers stop it cold.",
      icon: <SquareStack className="text-cyan-400" />,
      tag: "UI_REDRESS",
      path: "/dashboard/ClickJacking",
      difficulty: "Intermediate",
    },
    {
      id: "CSRF",
      title: "Cross-Site Request Forgery (CSRF)",
      desc: "Trick a logged-in user's browser into sending a hidden money transfer, then block it with tokens, SameSite cookies and Origin checks.",
      icon: <ArrowLeftRight className="text-orange-400" />,
      tag: "WEB_SECURITY",
      path: "/dashboard/csrf",
      difficulty: "Intermediate",
    },
  ];

const DEFENSES = {
  SQL_INJECTION: ['Never put user input straight into database commands', 'Give the database account only the access it needs', 'Check every form input on the server', 'Don’t show detailed error messages to visitors'],
  XSS: ['Show user text as plain text, never as code', 'Add browser rules that block unknown scripts', 'Keep login cookies hidden from page scripts', 'Clean any formatted text before showing it'],
  PHISHING: ['Turn on two-step login everywhere', 'Check the sender and hover over links before clicking', 'Practice with fake phishing tests', 'Set up email checks that block spoofed senders'],
  BRUTE_FORCE: ['Lock or slow down accounts after many wrong tries', 'Use long passphrases that are hard to guess', 'Add two-step login', 'Store passwords in a scrambled (hashed) form'],
  AI_POISONING: ['Only train on data from trusted sources', 'Look for odd or suspicious training examples', 'Watch the AI’s behavior for sudden changes', 'Keep a record of where the data came from'],
  KEYLOGGER: ['Keep your device and antivirus up to date', 'Use a password manager so you type less', 'Use a security key or app for two-step login', 'Review which apps start with your computer'],
  SESSION_HIJACKING: ['Always use secure (HTTPS) websites', 'Use safe cookie settings', 'Create a new session every time someone logs in', 'Log people out automatically after a while'],
  DOS_ATTACK: ['Limit how many requests one visitor can make', 'Use a service that filters bad traffic', 'Cut off slow or stuck connections', 'Have backup servers ready to take over'],
  MITM_ATTACK: ['Use HTTPS and never ignore certificate warnings', 'Avoid sensitive activity on untrusted public Wi-Fi', 'Use a trusted VPN when appropriate', 'Enable HSTS and secure certificate validation'],
  CLICKJACKING: ['Set Content-Security-Policy frame-ancestors', 'Use X-Frame-Options where appropriate', 'Require confirmation for sensitive actions', 'Keep important buttons clearly visible and contextual'],
  CSRF: ['Use unpredictable CSRF tokens for state-changing requests', 'Set session cookies to an appropriate SameSite mode', 'Validate Origin or Referer on sensitive requests', 'Never change account state through GET requests'],
};

const TIPS = [
  'Use a different password for every account, and keep them in a password manager.',
  'Hover over a link before you click it. What you see may not be where it goes.',
  'Turn on two-step login. It stops most account takeovers.',
  'Never trust what users type into a form. Always check it on the server.',
  'Install updates quickly. Most attacks use problems that already have a fix.',
  'Public Wi-Fi is risky. Stick to secure websites and avoid logging in to important accounts.',
  'Back up your files in more than one place, so one failure never wipes everything out.',
];

const QUICK_ACTIONS = [
  { label: 'Start Learning', tab: 'learning', icon: BookOpen, color: 'text-emerald-400' },
  { label: 'Ask the ChatBot', tab: 'chatbot', icon: Bot, color: 'text-cyan-400' },
  { label: 'Read News', tab: 'news', icon: Newspaper, color: 'text-orange-400' },
  { label: 'Stay Safe Guide', tab: 'prevention', icon: ShieldCheck, color: 'text-fuchsia-400' },
];

// ---------------------------------------------------------------------------
// Small hook that remembers values in the browser
// ---------------------------------------------------------------------------
const usePersistentState = (key, initial) => {
  const [value, setValue] = useState(() => {
    try {
      const raw = localStorage.getItem(key);
      return raw === null ? initial : JSON.parse(raw);
    } catch {
      return initial;
    }
  });
  useEffect(() => {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* ignore */ }
  }, [key, value]);
  return [value, setValue];
};

const CyberDashboard = () => {
  // Sidebar starts closed on every screen size.
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedAttack, setSelectedAttack] = useState(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedTab = searchParams.get('tab');
  const activeTab = DASHBOARD_TABS.includes(requestedTab) ? requestedTab : 'hub';
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const navigate = useNavigate();

  const [query, setQuery] = useState('');
  const [difficulty, setDifficulty] = useState('All');
  const [favorites, setFavorites] = usePersistentState('hackaware_favs', []);
  const [completed, setCompleted] = usePersistentState('hackaware_completed', []);
  const [showVideo, setShowVideo] = usePersistentState('hackaware_pref_video', true);
  const [showScanlines, setShowScanlines] = usePersistentState('hackaware_pref_scanlines', true);

  // One news request shared by the ticker, the banner and the news tab.
  const isNewsTab = activeTab === 'news';
  const requestedCategory = searchParams.get('category') || 'all-news';
  const dashboardNews = useNews({
    category: isNewsTab && NEWS_CATEGORY_IDS.has(requestedCategory) ? requestedCategory : 'all-news',
    q: isNewsTab ? searchParams.get('q') || '' : '',
    source: isNewsTab ? searchParams.get('source') || '' : '',
    sort: isNewsTab && searchParams.get('sort') === 'oldest' ? 'oldest' : 'newest',
    limit: 12,
  });

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    const handleResize = () => { if (window.innerWidth < 1024) setIsSidebarOpen(false); };
    window.addEventListener('resize', handleResize);
    return () => {
      clearInterval(timer);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('operator_token') || localStorage.getItem('token');
    if (!token) navigate('/');
    else setIsAuthorized(true);
  }, [navigate]);

  // Shortcuts: "[" opens/closes the sidebar, "/" jumps to search, Esc closes the popup.
  useEffect(() => {
    const onKey = (e) => {
      const tag = (e.target?.tagName || '').toLowerCase();
      if (tag === 'input' || tag === 'textarea') return;
      if (e.key === '[') setIsSidebarOpen((o) => !o);
      if (e.key === '/' && activeTab === 'hub') {
        e.preventDefault();
        document.getElementById('attack-search')?.focus();
      }
      if (e.key === 'Escape') setSelectedAttack(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [activeTab]);

  const operatorName = localStorage.getItem('operator_name') || 'Aniket';

  const scrollToSection = (id) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });

  const handleTabChange = (tab) => {
    setSearchParams(
      (previous) => {
        const next = new URLSearchParams(previous);
        if (tab === 'hub') next.delete('tab');
        else next.set('tab', tab);
        if (tab !== 'news') NEWS_FILTER_KEYS.forEach((key) => next.delete(key));
        return next;
      },
      { replace: false }
    );
    if (window.innerWidth < 1024) setIsSidebarOpen(false);
  };

  const toggleFavorite = useCallback((id) => {
    setFavorites((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }, [setFavorites]);

  const launchAttack = (atk) => {
    setCompleted((prev) => (prev.includes(atk.id) ? prev : [...prev, atk.id]));
    navigate(atk.path);
  };

  const logout = () => {
    ['operator_token', 'token', 'operator_name'].forEach((k) => localStorage.removeItem(k));
    navigate('/');
  };

  const filteredAttacks = useMemo(() => {
    const q = query.trim().toLowerCase();
    return ATTACKS
      .filter((a) => difficulty === 'All' || a.difficulty === difficulty)
      .filter((a) => !q || `${a.title} ${a.desc} ${a.tag}`.toLowerCase().includes(q))
      .sort((a, b) => Number(favorites.includes(b.id)) - Number(favorites.includes(a.id)));
  }, [query, difficulty, favorites]);

  const progressPct = Math.round((completed.length / ATTACKS.length) * 100);
  const tipOfTheDay = TIPS[Math.floor(Date.now() / 86400000) % TIPS.length];
  const hour = currentTime.getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  const level = completed.length >= ATTACKS.length ? 'Cyber Pro' : completed.length >= 5 ? 'Defender' : completed.length >= 2 ? 'Explorer' : 'Beginner';
  const nextAttack = ATTACKS.find((a) => !completed.includes(a.id));

  if (!isAuthorized) return null;

  return (
    <div className="flex h-screen bg-[#020617] text-slate-400 font-sans overflow-hidden selection:bg-cyan-500/30 relative">

      {showVideo && (
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
          <video autoPlay loop muted playsInline className="w-full h-full object-cover opacity-20">
            <source src="/videos/DashBoard_Video.mp4" type="video/mp4" />
          </video>
        </div>
      )}

      {showScanlines && (
        <div className="absolute inset-0 pointer-events-none z-50 opacity-[0.03] bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%]"></div>
      )}

      {isSidebarOpen && (
        <div onClick={() => setIsSidebarOpen(false)} className="lg:hidden fixed inset-0 bg-black/60 z-[90]" />
      )}

      <aside className={`fixed lg:relative bg-[#030712]/80 backdrop-blur-md border-r border-slate-800/40 flex flex-col transition-all duration-500 ease-in-out z-[100] h-full ${isSidebarOpen ? 'w-72 translate-x-0' : 'w-20 -translate-x-full lg:translate-x-0'}`}>
        <div className="h-20 flex items-center px-4 justify-between shrink-0 overflow-hidden">
          <AnimatePresence mode="wait">
            {isSidebarOpen && (
              <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="flex items-center gap-2 pl-2">
                <Shield className="text-cyan-500" size={16} />
                <h1 className="font-black text-[18px] tracking-[0.15em] text-white uppercase italic">HACK<span className="text-cyan-500">AWARE</span></h1>
              </motion.div>
            )}
          </AnimatePresence>
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} title="Open or close menu  ( [ )" className={`p-2.5 hover:bg-slate-800/60 rounded-xl transition-all text-slate-500 hover:text-cyan-400 flex items-center justify-center ${!isSidebarOpen && 'mx-auto'}`}>
            {isSidebarOpen ? <ChevronLeft size={18} /> : <Menu size={20} />}
          </button>
        </div>

        <nav className="custom-scrollbar flex-1 px-3 py-4 space-y-8 overflow-y-auto overflow-x-hidden">
          <NavGroup label="Main" isOpen={isSidebarOpen}>
            <SidebarLink icon={<LayoutDashboard size={18} />} label="Home" active={activeTab === 'hub'} onClick={() => handleTabChange('hub')} isOpen={isSidebarOpen} />
            <SidebarLink icon={<Shield size={18} />} label="Stay Safe" active={activeTab === 'prevention'} onClick={() => handleTabChange('prevention')} isOpen={isSidebarOpen} />
          </NavGroup>
          <NavGroup label="News" isOpen={isSidebarOpen}>
            <SidebarLink icon={<Newspaper size={18} />} label="Cyber News" active={activeTab === 'news'} onClick={() => handleTabChange('news')} isOpen={isSidebarOpen} />
          </NavGroup>
          <NavGroup label="Learn" isOpen={isSidebarOpen}>
            <SidebarLink icon={<BookOpen size={18} />} label="Learning" active={activeTab === 'learning'} onClick={() => handleTabChange('learning')} isOpen={isSidebarOpen} />
            <SidebarLink icon={<Bot size={18} />} label="ChatBot" active={activeTab === 'chatbot'} onClick={() => handleTabChange('chatbot')} isOpen={isSidebarOpen} />
          </NavGroup>
          <NavGroup label="Account" isOpen={isSidebarOpen}>
            <SidebarLink icon={<User size={18} />} label="Profile" active={activeTab === 'profile'} onClick={() => handleTabChange('profile')} isOpen={isSidebarOpen} />
            <SidebarLink icon={<Settings size={18} />} label="Settings" active={activeTab === 'settings'} onClick={() => handleTabChange('settings')} isOpen={isSidebarOpen} />
          </NavGroup>
        </nav>

        {isSidebarOpen && (
          <div className="px-5 pb-3">
            <div className="flex justify-between text-[9px] font-black uppercase tracking-widest text-slate-600 mb-2">
              <span>Your progress</span><span className="text-cyan-500">{progressPct}%</span>
            </div>
            <div className="h-1.5 bg-slate-900 rounded-full overflow-hidden">
              <div className="h-full bg-cyan-500 transition-all duration-700" style={{ width: `${progressPct}%` }} />
            </div>
          </div>
        )}

        <div className="p-3 border-t border-slate-800/40">
          <button onClick={logout} className={`flex items-center gap-3 w-full px-3 py-3 text-slate-500 hover:text-red-400 hover:bg-red-500/5 rounded-xl transition-all text-[10px] font-black tracking-widest uppercase ${!isSidebarOpen && 'justify-center'}`}>
            <LogOut size={18} />
            {isSidebarOpen && <span>Log out</span>}
          </button>
        </div>
      </aside>

      <main className="custom-scrollbar flex-1 flex flex-col overflow-y-auto bg-transparent scroll-smooth relative z-10">
        <header className="h-18 py-3 flex items-center justify-between px-4 lg:px-8 border-b border-slate-800/30 bg-[#020617]/40 backdrop-blur-xl sticky top-0 z-20 shrink-0">
          <div className="flex items-center gap-4">
            {!isSidebarOpen && (
              <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden p-2 text-slate-400 hover:text-cyan-400">
                <Menu size={20} />
              </button>
            )}
            <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-900/40 border border-slate-800 rounded-lg">
              <div className="w-1.5 h-1.5 bg-cyan-500 rounded-full animate-pulse shadow-[0_0_8px_#06b6d4]"></div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Secure</span>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="hidden sm:flex items-center gap-3 px-3 py-1.5 bg-slate-900/40 border border-slate-800/50 rounded-lg">
              <Clock className="text-cyan-500" size={12} />
              <span className="text-[10px] font-mono font-medium text-slate-300">{currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
            </div>
            <div className="flex items-center gap-3 pl-6 border-l border-slate-800/60">
              <div className="text-right hidden xs:block">
                <p className="text-[11px] font-black text-white uppercase tracking-tight">{operatorName}</p>
                <p className="text-[9px] font-bold text-cyan-600 uppercase tracking-[0.1em]">{level}</p>
              </div>
              <div className="w-9 h-9 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center font-black text-cyan-400 text-xs shadow-inner uppercase">
                {operatorName[0]}
              </div>
            </div>
          </div>
        </header>

        <AnimatePresence mode="wait">
          {activeTab === 'hub' ? (
            <motion.div key="hub" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col w-full">

              {/* 1. News banner */}
              <CyberNewsHero newsData={dashboardNews} />

              {/* 2. What is HackAware? (right below the news banner) */}
              <section id="about-hackaware" className="px-6 lg:px-12 pt-12 max-w-6xl mx-auto w-full">
                <p className="text-[10px] text-cyan-600 font-bold uppercase tracking-[0.3em] mb-2">{greeting}, {operatorName}</p>
                <h2 className="text-3xl lg:text-5xl font-black text-white tracking-tighter uppercase italic leading-none">
                  What is HACK<span className="text-cyan-500">AWARE</span>?
                </h2>
                <p className="text-slate-400 text-sm lg:text-base leading-relaxed mt-5 max-w-3xl">
                  HackAware is a safe place to learn how cyber attacks really work, and how to protect yourself from them.
                  You try short hands-on labs using pretend websites and fake data, so nothing real is ever at risk.
                  After each lab, you learn the simple steps that would have stopped the attack.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
                  {[
                    { icon: <Zap size={18} className="text-cyan-400" />, t: 'Try it safely', d: 'Every lab uses pretend targets, so you can experiment and make mistakes freely.' },
                    { icon: <ShieldCheck size={18} className="text-emerald-400" />, t: 'Learn how to stay safe', d: 'Each attack comes with easy tips to defend against it in real life.' },
                    { icon: <Bot size={18} className="text-fuchsia-400" />, t: 'Get help anytime', d: 'Stuck on something? Ask the ChatBot or browse the Learning section.' },
                  ].map((c) => (
                    <div key={c.t} className="p-6 bg-[#030712]/50 backdrop-blur-sm border border-slate-800/50 rounded-[1.5rem]">
                      <div className="w-10 h-10 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center mb-4">{c.icon}</div>
                      <h3 className="text-xs font-black text-white uppercase tracking-widest mb-2">{c.t}</h3>
                      <p className="text-[12px] text-slate-500 leading-relaxed">{c.d}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-8">
                  <button onClick={() => scrollToSection('attack-section')} className="px-6 py-3 bg-cyan-600 text-[#020617] font-black rounded-xl hover:bg-cyan-500 transition-all text-[10px] uppercase tracking-[0.2em]">Start a Lab</button>
                </div>
              </section>

              {/* 3. Quick links */}
              <section className="px-6 lg:px-12 mt-10 max-w-6xl mx-auto w-full">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {QUICK_ACTIONS.map(({ label, tab, icon: Icon, color }) => (
                    <button key={tab} onClick={() => handleTabChange(tab)} className="group flex items-center gap-3 p-4 bg-[#030712]/50 backdrop-blur-sm border border-slate-800/50 hover:border-cyan-500/40 rounded-2xl transition-all text-left">
                      <div className="w-10 h-10 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center shrink-0"><Icon size={18} className={color} /></div>
                      <span className="text-[10px] font-black text-slate-300 group-hover:text-white uppercase tracking-widest">{label}</span>
                    </button>
                  ))}
                </div>
              </section>

              {/* 4. Your numbers */}
              <section className="px-6 lg:px-12 mt-6 max-w-6xl mx-auto w-full">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <StatCard icon={<Target size={16} className="text-cyan-400" />} label="Labs" value={ATTACKS.length} sub="to explore" />
                  <StatCard icon={<CheckCircle2 size={16} className="text-emerald-400" />} label="Done" value={`${completed.length}/${ATTACKS.length}`} sub={`${progressPct}% complete`} />
                  <StatCard icon={<Star size={16} className="text-yellow-400" />} label="Favorites" value={favorites.length} sub="saved by you" />
                  <StatCard icon={<Trophy size={16} className="text-fuchsia-400" />} label="Level" value={level} sub="finish labs to level up" />
                </div>
              </section>

              {/* 5. Up next + tip */}
              <section className="px-6 lg:px-12 mt-6 max-w-6xl mx-auto w-full grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="lg:col-span-2 p-6 bg-[#030712]/50 backdrop-blur-sm border border-slate-800/50 rounded-[1.5rem]">
                  <div className="flex items-center gap-2 mb-3"><Flame size={14} className="text-orange-400" /><p className="text-[10px] font-black text-white uppercase tracking-[0.25em]">Up Next</p></div>
                  {nextAttack ? (
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <h3 className="text-base font-black text-white uppercase italic tracking-wider">{nextAttack.title}</h3>
                        <p className="text-[12px] text-slate-500 mt-1 leading-relaxed">{nextAttack.desc}</p>
                      </div>
                      <button onClick={() => setSelectedAttack(nextAttack)} className="shrink-0 px-5 py-3 bg-cyan-600 text-[#020617] font-black rounded-xl hover:bg-cyan-500 transition-all text-[10px] uppercase tracking-[0.2em]">Start</button>
                    </div>
                  ) : (
                    <p className="text-sm text-emerald-400 font-bold">You finished every lab. Great work!</p>
                  )}
                </div>
                <div className="p-6 bg-[#030712]/50 backdrop-blur-sm border border-slate-800/50 rounded-[1.5rem]">
                  <div className="flex items-center gap-2 mb-3"><Lightbulb size={14} className="text-yellow-400" /><p className="text-[10px] font-black text-white uppercase tracking-[0.25em]">Tip of the Day</p></div>
                  <p className="text-[12px] text-slate-400 leading-relaxed">{tipOfTheDay}</p>
                </div>
              </section>

              {/* 6. Labs */}
              <section id="attack-section" className="pt-16 pb-10 px-6 lg:px-12 max-w-6xl mx-auto w-full">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
                  <div>
                    <h2 className="text-2xl lg:text-3xl font-black text-white tracking-tighter uppercase italic">Try a Lab</h2>
                    <p className="text-[10px] text-cyan-600 font-bold uppercase tracking-[0.3em] mt-2">Pick one and learn by doing</p>
                  </div>
                  <div className="relative w-full md:w-72">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" />
                    <input id="attack-search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search labs  ( / )" className="w-full pl-9 pr-8 py-2.5 bg-slate-900/50 border border-slate-800 focus:border-cyan-500/50 outline-none rounded-xl text-[12px] text-slate-200 placeholder:text-slate-600" />
                    {query && <button onClick={() => setQuery('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-600 hover:text-white"><X size={14} /></button>}
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 mb-6">
                  {DIFFICULTIES.map((d) => (
                    <button key={d} onClick={() => setDifficulty(d)} className={`px-4 py-1.5 rounded-full border text-[9px] font-black uppercase tracking-widest transition-all ${difficulty === d ? 'border-cyan-500 text-cyan-400 bg-cyan-500/10' : 'border-slate-800 text-slate-600 hover:text-slate-300'}`}>{d}</button>
                  ))}
                </div>

                {filteredAttacks.length ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {filteredAttacks.map((atk, index) => (
                      <AttackCard key={atk.id} atk={atk} index={index} done={completed.includes(atk.id)} fav={favorites.includes(atk.id)} onFav={() => toggleFavorite(atk.id)} onClick={() => setSelectedAttack(atk)} />
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-[12px] text-slate-600 py-16">No labs match your search.</p>
                )}
              </section>

            </motion.div>

          ) : activeTab === 'prevention' ? (
            <motion.div key="prevention" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="p-6 lg:p-12 max-w-6xl mx-auto w-full">
              <h2 className="text-2xl lg:text-3xl font-black text-white tracking-tighter uppercase italic">Stay Safe Guide</h2>
              <p className="text-[10px] text-cyan-600 font-bold uppercase tracking-[0.3em] mt-2 mb-8">Simple ways to protect yourself from each attack</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {ATTACKS.map((atk) => (
                  <div key={atk.id} className="p-6 bg-[#030712]/50 backdrop-blur-sm border border-slate-800/50 rounded-[1.5rem]">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-center">{React.cloneElement(atk.icon, { size: 18 })}</div>
                      <h3 className="text-sm font-black text-white uppercase italic tracking-wider">{atk.title}</h3>
                    </div>
                    <ul className="space-y-2">
                      {DEFENSES[atk.id].map((d) => (
                        <li key={d} className="flex gap-2 text-[12px] text-slate-400 leading-relaxed"><ShieldCheck size={13} className="text-emerald-500 shrink-0 mt-0.5" />{d}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </motion.div>

          ) : activeTab === 'profile' ? (
            <motion.div key="profile" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="p-6 lg:p-12 max-w-6xl mx-auto w-full">
              <OperatorProfile />
            </motion.div>

          ) : activeTab === 'learning' ? (
            <motion.div key="learning" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="w-full">
              <LearningHub onLaunchLab={(path) => navigate(path)} />
            </motion.div>

          ) : activeTab === 'chatbot' ? (
            <ChatbotPanel key="chatbot" />

          ) : activeTab === 'news' ? (
            <motion.div key="news" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="w-full">
              <CyberNews newsData={dashboardNews} />
            </motion.div>

          ) : (
            <motion.div key="settings" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="p-6 lg:p-12 max-w-3xl mx-auto w-full">
              <h2 className="text-2xl lg:text-3xl font-black text-white tracking-tighter uppercase italic">Settings</h2>
              <p className="text-[10px] text-cyan-600 font-bold uppercase tracking-[0.3em] mt-2 mb-8">Make HackAware yours</p>
              <div className="space-y-3">
                <ToggleRow label="Background video" desc="Show a moving video behind the dashboard." value={showVideo} onChange={setShowVideo} />
                <ToggleRow label="Retro screen effect" desc="Adds faint screen lines for a retro look." value={showScanlines} onChange={setShowScanlines} />
                <div className="flex items-center justify-between gap-4 p-5 bg-[#030712]/50 border border-slate-800/50 rounded-2xl">
                  <div>
                    <p className="text-[11px] font-black text-white uppercase tracking-widest">Start over</p>
                    <p className="text-[12px] text-slate-500 mt-1">Clears your finished labs and favorites.</p>
                  </div>
                  <button onClick={() => { setCompleted([]); setFavorites([]); }} className="flex items-center gap-2 px-4 py-2 border border-red-500/30 text-red-400 hover:bg-red-500/10 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shrink-0">
                    <RotateCcw size={12} /> Reset
                  </button>
                </div>
                <div className="p-5 bg-[#030712]/50 border border-slate-800/50 rounded-2xl">
                  <p className="text-[11px] font-black text-white uppercase tracking-widest mb-2">Handy keys</p>
                  <p className="text-[12px] text-slate-500 leading-relaxed"><kbd className="px-1.5 py-0.5 bg-slate-900 border border-slate-700 rounded text-slate-300">[</kbd> open or close menu &nbsp; <kbd className="px-1.5 py-0.5 bg-slate-900 border border-slate-700 rounded text-slate-300">/</kbd> search labs &nbsp; <kbd className="px-1.5 py-0.5 bg-slate-900 border border-slate-700 rounded text-slate-300">Esc</kbd> close popup</p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* --- POPUP --- */}
      <AnimatePresence>
        {selectedAttack && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedAttack(null)} className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-[#020617]/95 backdrop-blur-md">
            <motion.div onClick={(e) => e.stopPropagation()} initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }} className="w-full max-w-md bg-[#080c17] border border-slate-800 rounded-[2rem] overflow-hidden shadow-2xl">
              <div className="p-10 text-center relative">
                <div className="w-16 h-16 bg-slate-950 border border-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  {React.cloneElement(selectedAttack.icon, { size: 28 })}
                </div>
                <h3 className="text-lg font-black text-white mb-2 uppercase italic tracking-widest">{selectedAttack.title}</h3>
                <p className="text-slate-500 text-[12px] leading-relaxed mb-4">{selectedAttack.desc}</p>
                <p className="text-slate-500 text-[11px] mb-8">
                  Level: <span className="text-slate-300 font-bold">{selectedAttack.difficulty}</span> &nbsp;•&nbsp; Safe to try: <span className="text-emerald-500 font-bold">Yes</span>
                </p>
                <div className="flex flex-col gap-3">
                  <button onClick={() => launchAttack(selectedAttack)} className="w-full py-4 bg-cyan-600 text-[#020617] font-black rounded-xl hover:bg-cyan-500 transition-all text-[11px] uppercase tracking-[0.2em]">Start Lab</button>
                  <button onClick={() => { setSelectedAttack(null); handleTabChange('prevention'); }} className="w-full py-3 border border-slate-800 text-slate-300 font-bold hover:bg-slate-800/50 rounded-xl transition-all text-[10px] uppercase tracking-widest">How to Stay Safe</button>
                  <button onClick={() => setSelectedAttack(null)} className="w-full py-2 text-slate-600 font-bold hover:text-white transition-all text-[10px] uppercase tracking-widest">Close</button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <FloatingNewsTicker
        articles={dashboardNews.articles}
        avoidBottomWidget={activeTab === 'learning'}
      />
    </div>
  );
};

// --- HELPER COMPONENTS ---
const NavGroup = ({ label, isOpen, children }) => (
  <div>
    <p className={`text-[9px] font-black text-slate-700 uppercase tracking-[0.3em] mb-4 px-4 ${!isOpen && 'hidden'}`}>{label}</p>
    <div className="space-y-1">{children}</div>
  </div>
);

const SidebarLink = ({ icon, label, active, onClick, isOpen }) => (
  <button onClick={onClick} title={label} className={`flex items-center gap-3 w-full px-3 py-3 rounded-xl transition-all relative group z-10 ${active ? 'text-cyan-400 bg-cyan-500/10' : 'text-slate-600 hover:text-slate-300 hover:bg-slate-800/30'} ${!isOpen && 'justify-center'}`}>
    {active && <motion.div layoutId="activeTab" className="absolute left-0 w-1 h-5 bg-cyan-500 rounded-r-full" />}
    <div className="shrink-0 group-hover:scale-110 transition-transform">{icon}</div>
    {isOpen && <span className="text-[11px] font-black tracking-widest uppercase">{label}</span>}
  </button>
);

const StatCard = ({ icon, label, value, sub }) => (
  <div className="p-5 bg-[#030712]/50 backdrop-blur-sm border border-slate-800/50 rounded-2xl">
    <div className="flex items-center gap-2 mb-3">{icon}<span className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em]">{label}</span></div>
    <p className="text-2xl font-black text-white tracking-tight">{value}</p>
    <p className="text-[11px] text-slate-600 mt-1">{sub}</p>
  </div>
);

const ToggleRow = ({ label, desc, value, onChange }) => (
  <div className="flex items-center justify-between gap-4 p-5 bg-[#030712]/50 border border-slate-800/50 rounded-2xl">
    <div>
      <p className="text-[11px] font-black text-white uppercase tracking-widest">{label}</p>
      <p className="text-[12px] text-slate-500 mt-1">{desc}</p>
    </div>
    <button role="switch" aria-checked={value} onClick={() => onChange(!value)} className={`w-11 h-6 rounded-full p-0.5 transition-colors shrink-0 ${value ? 'bg-cyan-600' : 'bg-slate-800'}`}>
      <span className={`block w-5 h-5 rounded-full bg-white transition-transform ${value ? 'translate-x-5' : 'translate-x-0'}`} />
    </button>
  </div>
);

const AttackCard = ({ atk, index, onClick, fav, onFav, done }) => (
  <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.05 }} whileHover={{ y: -5, borderColor: 'rgba(34, 211, 238, 0.4)' }} onClick={onClick} role="button" tabIndex={0} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); onClick(); } }} className="focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-cyan-300 group relative bg-[#030712]/40 backdrop-blur-sm border border-slate-800/50 p-8 rounded-[2rem] cursor-pointer overflow-hidden transition-all duration-300">
    <div className="relative z-10 flex flex-col gap-6">
      <div className="flex justify-between items-start">
        <div className="w-12 h-12 bg-slate-950 border border-slate-800 group-hover:border-cyan-500/30 rounded-xl flex items-center justify-center transition-colors">
          {React.cloneElement(atk.icon, { size: 24 })}
        </div>
        <div className="flex flex-col items-end gap-2">
          <div className="flex items-center gap-2">
            {done && <CheckCircle2 size={14} className="text-emerald-500" aria-label="Done" />}
            <button onClick={(e) => { e.stopPropagation(); onFav(); }} aria-label={fav ? 'Remove from favorites' : 'Add to favorites'} className="p-1 -m-1">
              <Star size={14} className={fav ? 'text-yellow-400 fill-yellow-400' : 'text-slate-700 hover:text-yellow-400'} />
            </button>
          </div>
          <span className="text-[8px] font-black text-slate-600 bg-slate-900 border border-slate-800 px-2 py-1 rounded tracking-[0.2em] uppercase">{atk.tag}</span>
          <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded ${atk.difficulty === 'Beginner' ? 'text-emerald-500 bg-emerald-500/5' : atk.difficulty === 'Intermediate' ? 'text-orange-500 bg-orange-500/5' : 'text-fuchsia-500 bg-fuchsia-500/5'}`}>{atk.difficulty}</span>
        </div>
      </div>
      <div>
        <h3 className="text-base font-black text-white mb-2 uppercase italic tracking-wider group-hover:text-cyan-400 transition-colors">{atk.title}</h3>
        <p className="text-[12px] text-slate-500 font-medium leading-relaxed">{atk.desc}</p>
      </div>
      <div className="pt-6 border-t border-slate-800/30 flex items-center justify-between">
        <span className="text-[9px] font-black text-cyan-600 uppercase tracking-[0.25em] group-hover:text-cyan-400 transition-colors">Open lab</span>
        <div className="w-6 h-6 rounded-full border border-slate-800 flex items-center justify-center group-hover:border-cyan-500 transition-colors">
          <ExternalLink size={10} className="text-slate-600 group-hover:text-cyan-500" />
        </div>
      </div>
    </div>
  </motion.div>
);

export default CyberDashboard;