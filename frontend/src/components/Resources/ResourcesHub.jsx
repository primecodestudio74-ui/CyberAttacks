import React, { useMemo, useState } from 'react';
import {
  AlertTriangle, Building2, CheckCircle2, Eye, ExternalLink, FileWarning,
  Globe, HelpCircle, KeyRound, Library, Search, ShieldAlert, Terminal, X,
} from 'lucide-react';
import { motion } from 'framer-motion';

/**
 * Security Tools & Official Resources.
 *
 * A curated list of external, verified services. Every card is a plain link to
 * the official provider - HackAware never proxies, re-hosts or stores anything
 * that a user types into those sites, which is why each entry also carries a
 * short safety notice.
 *
 * `icon` is stored as a component reference (not a JSX element) so the card can
 * render it at the size it needs.
 */
const RESOURCE_CATEGORIES = [
  'All',
  'Account & Data Safety',
  'Scam & Phishing Awareness',
  'Practical Labs',
  'Official Indian Cyber Safety',
];

const RESOURCES = [
  // 1. Personal Data & Account Security
  {
    name: 'Have I Been Pwned',
    category: 'Account & Data Safety',
    desc: 'Check if your email or phone number has been exposed in public internet data breaches.',
    url: 'https://haveibeenpwned.com/',
    difficulty: 'Beginner',
    badge: 'Email Breach Checker',
    icon: Eye,
    iconColor: 'text-cyan-400',
    safetyNotice: 'A clean check does not guarantee complete security. Never enter confidential passwords.',
  },
  {
    name: 'VirusTotal',
    category: 'Account & Data Safety',
    desc: 'Analyse suspicious URLs, domains, IPs, and uploaded files across dozens of antivirus scanners.',
    url: 'https://www.virustotal.com/',
    difficulty: 'Beginner',
    badge: 'Link & File Scanner',
    icon: FileWarning,
    iconColor: 'text-violet-400',
    safetyNotice: 'Uploaded files are shared with the security community. Never submit private or personal files.',
  },
  {
    name: 'Google Password Manager',
    category: 'Account & Data Safety',
    desc: 'Audit stored credentials, identify weak passwords, and check for exposed logins.',
    url: 'https://passwords.google.com/',
    difficulty: 'Beginner',
    badge: 'Password Audit',
    icon: KeyRound,
    iconColor: 'text-emerald-400',
    safetyNotice: 'Keep two-factor authentication active on your primary Google recovery account.',
  },
  {
    name: 'Mozilla Monitor',
    category: 'Account & Data Safety',
    desc: 'Receive automated alerts when your personal identity or credentials leak into public dumps.',
    url: 'https://monitor.mozilla.org/',
    difficulty: 'Beginner',
    badge: 'Exposure Monitor',
    icon: Globe,
    iconColor: 'text-cyan-400',
    safetyNotice: 'Use legitimate account emails only.',
  },
  {
    name: 'Microsoft Security Guidance',
    category: 'Account & Data Safety',
    desc: 'Official guidance on managing account protection, Windows Defender, and cloud credential hygiene.',
    url: 'https://www.microsoft.com/security',
    difficulty: 'Beginner',
    badge: 'Security Guidance',
    icon: CheckCircle2,
    iconColor: 'text-blue-400',
    safetyNotice: 'Review device sync permissions regularly.',
  },

  // 2. Phishing & Online Scam Awareness
  {
    name: 'CISA Secure Our World',
    category: 'Scam & Phishing Awareness',
    desc: 'US Cybersecurity & Infrastructure Agency guide on spotting scams, setting MFA, and safe browsing.',
    url: 'https://www.cisa.gov/secure-our-world',
    difficulty: 'Beginner',
    badge: 'Cyber Safety Standard',
    icon: ShieldAlert,
    iconColor: 'text-cyan-400',
    safetyNotice: 'Always inspect unexpected urgency or payment requests carefully.',
  },
  {
    name: 'Google Safety Center',
    category: 'Scam & Phishing Awareness',
    desc: 'Interactive guides and safety rules for families, mobile devices, and scam avoidance.',
    url: 'https://safety.google/',
    difficulty: 'Beginner',
    badge: 'Safety Foundation',
    icon: Globe,
    iconColor: 'text-emerald-400',
    safetyNotice: 'Check the URL bar before trusting any account log-in page.',
  },
  {
    name: 'FTC Scam Alerts',
    category: 'Scam & Phishing Awareness',
    desc: 'Real-time database of emerging consumer scams, impersonations, and tech support fraud trends.',
    url: 'https://consumer.ftc.gov/scams',
    difficulty: 'Beginner',
    badge: 'Scam Alert Feed',
    icon: AlertTriangle,
    iconColor: 'text-amber-400',
    safetyNotice: 'Government agencies and banks will never demand gift cards or urgent crypto payments.',
  },
  {
    name: 'Microsoft Security Blog',
    category: 'Scam & Phishing Awareness',
    desc: 'In-depth writeups on newly uncovered social engineering tactics and nation-state threats.',
    url: 'https://www.microsoft.com/security/blog/',
    difficulty: 'Intermediate',
    badge: 'Threat Intel',
    icon: Globe,
    iconColor: 'text-blue-400',
    safetyNotice: 'Intended for research and understanding modern attack vectors.',
  },

  // 3. Practical Cybersecurity Labs
  {
    name: 'PortSwigger Web Security Academy',
    category: 'Practical Labs',
    desc: 'Free, guided training labs covering SQL injection, XSS, CSRF, authentication bypasses, and APIs.',
    url: 'https://portswigger.net/web-security',
    difficulty: 'Intermediate',
    badge: 'Guided Lab Environment',
    icon: Terminal,
    iconColor: 'text-purple-400',
    safetyNotice: 'Only practice vulnerability testing against authorised lab environments.',
  },
  {
    name: 'OWASP Juice Shop',
    category: 'Practical Labs',
    desc: 'Deliberately insecure modern web shop designed strictly for security demonstrations and CTFs.',
    url: 'https://owasp.org/www-project-juice-shop/',
    difficulty: 'Intermediate',
    badge: 'Vulnerable App Demo',
    icon: Terminal,
    iconColor: 'text-amber-400',
    safetyNotice: 'Run locally or inside sanctioned containers only.',
  },
  {
    name: 'OWASP WebGoat',
    category: 'Practical Labs',
    desc: 'Lesson-driven insecure teaching platform covering OWASP Top 10 vulnerabilities step-by-step.',
    url: 'https://owasp.org/www-project-webgoat/',
    difficulty: 'Intermediate',
    badge: 'Classroom Labs',
    icon: Terminal,
    iconColor: 'text-red-400',
    safetyNotice: 'Never expose learning lab ports directly to the public internet.',
  },
  {
    name: 'picoCTF',
    category: 'Practical Labs',
    desc: 'Carnegie Mellon university cybersecurity program offering beginner-oriented CTF puzzles and games.',
    url: 'https://picoctf.org/',
    difficulty: 'Beginner',
    badge: 'Gamified Learning',
    icon: Terminal,
    iconColor: 'text-emerald-400',
    safetyNotice: 'Great for high school and university beginners starting capture-the-flag competitions.',
  },
  {
    name: 'OverTheWire Wargames',
    category: 'Practical Labs',
    desc: 'Hands-on command-line terminal wargames teaching basic Linux, shell navigation, and security tools.',
    url: 'https://overthewire.org/wargames/',
    difficulty: 'Advanced',
    badge: 'CLI Terminal Lab',
    icon: Terminal,
    iconColor: 'text-fuchsia-400',
    safetyNotice: 'Connect using SSH clients with standard terminal hygiene.',
  },

  // 4. Indian Digital Safety & Reporting
  {
    name: 'Sanchar Saathi',
    category: 'Official Indian Cyber Safety',
    desc: 'Department of Telecommunications portal to track/block stolen smartphones and verify mobile SIM cards.',
    url: 'https://sancharsaathi.gov.in/',
    difficulty: 'Official Portal',
    badge: 'Mobile & SIM Safety',
    icon: Building2,
    iconColor: 'text-cyan-400',
    safetyNotice: 'Official Government of India portal for citizen telecom protections.',
  },
  {
    name: 'National Cyber Crime Reporting Portal',
    category: 'Official Indian Cyber Safety',
    desc: 'Central portal to file official complaints regarding financial cyber frauds and online offences.',
    url: 'https://cybercrime.gov.in/',
    difficulty: 'Reporting Tool',
    badge: 'Report Crime (1930)',
    icon: ShieldAlert,
    iconColor: 'text-rose-400',
    safetyNotice: 'Dial 1930 immediately in India if financial transactions were unauthorized.',
  },
  {
    name: 'CERT-In',
    category: 'Official Indian Cyber Safety',
    desc: 'Indian Computer Emergency Response Team security advisories, vulnerability alerts, and incident notes.',
    url: 'https://www.cert-in.org.in/',
    difficulty: 'Advisories',
    badge: 'Govt Incident Response',
    icon: Building2,
    iconColor: 'text-emerald-400',
    safetyNotice: 'Read advisories to keep personal operating systems patched.',
  },
  {
    name: 'Reserve Bank of India (RBI) Kehta Hai',
    category: 'Official Indian Cyber Safety',
    desc: 'Consumer financial education on avoiding OTP fraud, fake loan apps, and lottery phishing.',
    url: 'https://rbikehtahai.rbi.org.in/',
    difficulty: 'Consumer Guide',
    badge: 'Banking Fraud Defense',
    icon: Building2,
    iconColor: 'text-amber-400',
    safetyNotice: 'Banks never ask for OTP, UPI PIN, or CVV numbers over SMS or call.',
  },
  {
    name: 'Cyber Swachhta Kendra',
    category: 'Official Indian Cyber Safety',
    desc: 'Botnet cleaning center offering free security tools and instructions to detect bot malware.',
    url: 'https://www.csk.gov.in/',
    difficulty: 'Device Security',
    badge: 'Botnet Remediation',
    icon: Building2,
    iconColor: 'text-blue-400',
    safetyNotice: 'Use authentic cleanup utilities provided by recognized antivirus vendors.',
  },
];

const ResourcesHub = () => {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Counts are over everything except the active category, so the pills answer
  // "how many would I see here?" for a given search rather than staying static.
  const { filteredResources, counts } = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    const matchesQuery = (res) =>
      !q ||
      `${res.name} ${res.desc} ${res.badge} ${res.category}`.toLowerCase().includes(q);

    const searchMatches = RESOURCES.filter(matchesQuery);
    return {
      filteredResources:
        selectedCategory === 'All'
          ? searchMatches
          : searchMatches.filter((res) => res.category === selectedCategory),
      counts: RESOURCE_CATEGORIES.reduce((acc, cat) => {
        acc[cat] = cat === 'All' ? searchMatches.length : searchMatches.filter((res) => res.category === cat).length;
        return acc;
      }, {}),
    };
  }, [selectedCategory, searchQuery]);

  const hasFilters = selectedCategory !== 'All' || searchQuery.trim() !== '';
  const clearFilters = () => {
    setSelectedCategory('All');
    setSearchQuery('');
  };

  return (
    <div id="resources-section" className="p-6 lg:p-12 max-w-7xl mx-auto w-full">
      {/* Header */}
      <div className="mb-8">
        <p className="text-[10px] text-cyan-500 font-bold uppercase tracking-[0.3em] mb-2">Verified Ecosystem</p>
        <h2 className="text-3xl lg:text-4xl font-black text-white tracking-tighter uppercase italic flex items-center gap-3">
          <Library size={26} className="text-cyan-500 shrink-0" aria-hidden="true" />
          <span>
            Security Tools &amp; <span className="text-cyan-500">Official Resources</span>
          </span>
        </h2>
        <p className="text-slate-400 text-sm mt-3 max-w-3xl leading-relaxed">
          Curated external databases, safe security practice environments, and authorized incident response helplines.
          Click any card to open the official provider directly.
        </p>
      </div>

      {/* Search & Category Filter Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div className="flex flex-wrap gap-2" role="group" aria-label="Filter resources by category">
          {RESOURCE_CATEGORIES.map((cat) => {
            const isActive = selectedCategory === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                aria-pressed={isActive}
                disabled={counts[cat] === 0 && !isActive}
                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-400 disabled:opacity-40 disabled:cursor-not-allowed ${
                  isActive
                    ? 'border border-cyan-500 text-cyan-400 bg-cyan-500/10'
                    : 'border border-slate-800 text-slate-500 hover:text-slate-300 hover:border-slate-700 bg-[#030712]/40'
                }`}
              >
                {cat}
                <span className={`ml-2 ${isActive ? 'text-cyan-500/70' : 'text-slate-700'}`}>{counts[cat]}</span>
              </button>
            );
          })}
        </div>

        <form role="search" onSubmit={(event) => event.preventDefault()} className="relative w-full md:w-72">
          <label htmlFor="resource-search" className="sr-only">Filter resources</label>
          <Search size={14} aria-hidden="true" className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            id="resource-search"
            type="search"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Filter resources..."
            autoComplete="off"
            className="w-full pl-9 pr-9 py-2 bg-slate-900/50 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/40"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              aria-label="Clear resource search"
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-500 transition-colors hover:text-slate-200"
            >
              <X size={13} aria-hidden="true" />
            </button>
          )}
        </form>
      </div>

      <div className="mb-8 flex items-center justify-between gap-4 text-[10px] font-black uppercase tracking-widest text-slate-600">
        <p aria-live="polite">
          Showing <span className="text-slate-300">{filteredResources.length}</span> of {RESOURCES.length} resources
        </p>
        {hasFilters && (
          <button
            type="button"
            onClick={clearFilters}
            className="flex items-center gap-1.5 text-cyan-600 hover:text-cyan-400 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-400"
          >
            <X size={11} aria-hidden="true" /> Clear filters
          </button>
        )}
      </div>

      {/* Grid of Resource Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredResources.map((res, idx) => {
          const Icon = res.icon;
          return (
            <motion.a
              key={res.name}
              href={res.url}
              target="_blank"
              rel="noopener noreferrer"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(idx, 8) * 0.03 }}
              className="group relative flex flex-col justify-between p-6 bg-[#030712]/50 backdrop-blur-sm border border-slate-800/60 rounded-[1.5rem] hover:border-cyan-500/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-400 transition-all duration-300 md:hover:-translate-y-1 shadow-lg"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="w-11 h-11 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-center shrink-0 group-hover:border-cyan-500/30 transition-colors">
                    <Icon className={res.iconColor} size={20} aria-hidden="true" />
                  </div>
                  <div className="flex flex-col items-end gap-1.5 text-right">
                    <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400 tracking-wider">
                      {res.badge}
                    </span>
                    <span className="text-[8px] font-bold text-cyan-600 uppercase tracking-widest">
                      {res.difficulty}
                    </span>
                  </div>
                </div>

                <h3 className="text-base font-black text-white group-hover:text-cyan-400 uppercase italic tracking-wide transition-colors flex items-center gap-2">
                  {res.name}
                </h3>
                <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                  {res.desc}
                </p>

                {/* Safety notice badge */}
                <div className="mt-4 p-3 rounded-xl bg-slate-950/60 border border-slate-900 flex items-start gap-2">
                  <AlertTriangle size={12} className="text-amber-500 shrink-0 mt-0.5" aria-hidden="true" />
                  <p className="text-[10px] text-slate-500 leading-snug">
                    {res.safetyNotice}
                  </p>
                </div>
              </div>

              {/* Footer with action */}
              <div className="pt-5 mt-6 border-t border-slate-800/40 flex items-center justify-between">
                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-500 group-hover:text-cyan-400 transition-colors">
                  Open Official Site
                </span>
                <div className="w-7 h-7 rounded-lg border border-slate-800 flex items-center justify-center group-hover:border-cyan-500/40 group-hover:bg-cyan-500/10 transition-colors">
                  <ExternalLink size={12} aria-hidden="true" className="text-slate-500 group-hover:text-cyan-400" />
                </div>
              </div>
            </motion.a>
          );
        })}
      </div>

      {filteredResources.length === 0 && (
        <div className="text-center py-20">
          <HelpCircle size={32} className="mx-auto text-slate-600 mb-3" aria-hidden="true" />
          <p className="text-slate-500 text-sm">No resources match your filter criteria.</p>
          {hasFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="mt-4 px-4 py-2 border border-slate-800 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-300 hover:bg-slate-800/50 transition-all"
            >
              Show all resources
            </button>
          )}
        </div>
      )}

      <p className="mt-10 text-[10px] leading-relaxed text-slate-600 max-w-3xl">
        External links open the provider's own website in a new tab. HackAware does not collect accounts, credentials or
        uploads for these services - read each provider's privacy notice before submitting personal data.
      </p>
    </div>
  );
};

export default ResourcesHub;
