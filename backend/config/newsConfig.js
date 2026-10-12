/**
 * Central configuration for the HackAware Cyber News feature.
 *
 * Everything that tunes the news experience lives here (sources, categories,
 * limits, cache policy) so the feature can be extended without touching the
 * request-handling code. Category keyword lists are data, not logic - adding a
 * new topic is a matter of appending one object to NEWS_CATEGORIES.
 *
 * All values can be overridden through environment variables (see
 * backend/.env.example) so nothing has to be hardcoded per deployment.
 */

const int = (value, fallback) => {
  const parsed = Number.parseInt(value ?? '', 10);
  return Number.isFinite(parsed) ? parsed : fallback;
};

/* ------------------------------------------------------------------ *
 * Limits & cache policy
 * ------------------------------------------------------------------ */

export const NEWS_CACHE_TTL_SECONDS = int(process.env.NEWS_CACHE_TTL_SECONDS, 600); // 10 min
export const NEWS_STALE_GRACE_SECONDS = int(process.env.NEWS_STALE_GRACE_SECONDS, 6 * 3600); // serve stale up to 6h
export const NEWS_MIN_REFRESH_INTERVAL_SECONDS = int(process.env.NEWS_MIN_REFRESH_INTERVAL_SECONDS, 60);
export const NEWS_BACKGROUND_REFRESH_MINUTES = int(process.env.NEWS_BACKGROUND_REFRESH_MINUTES, 0); // 0 = off

export const NEWS_DEFAULT_PAGE_SIZE = int(process.env.NEWS_DEFAULT_PAGE_SIZE, 12);
export const NEWS_MAX_PAGE_SIZE = int(process.env.NEWS_MAX_PAGE_SIZE, 30);
export const NEWS_MAX_PAGE = 60;
export const NEWS_MAX_QUERY_LENGTH = 80;
export const NEWS_MAX_SOURCE_FILTER_LENGTH = 60;

export const NEWS_FETCH_TIMEOUT_MS = int(process.env.NEWS_FETCH_TIMEOUT_MS, 9000);
export const NEWS_FETCH_CONCURRENCY = int(process.env.NEWS_FETCH_CONCURRENCY, 5);
export const NEWS_MAX_FEED_BYTES = int(process.env.NEWS_MAX_FEED_BYTES, 3_500_000);
export const NEWS_EXCERPT_LENGTH = int(process.env.NEWS_EXCERPT_LENGTH, 260);

// Bounded, background-only image lookup for stories whose feed does not carry a
// thumbnail. Never triggered by a user request and never accepts a user URL.
export const NEWS_IMAGE_ENRICHMENT = process.env.NEWS_IMAGE_ENRICHMENT !== 'off';
export const NEWS_IMAGE_ENRICH_LIMIT = int(process.env.NEWS_IMAGE_ENRICH_LIMIT, 10);
export const NEWS_IMAGE_ENRICH_TIMEOUT_MS = int(process.env.NEWS_IMAGE_ENRICH_TIMEOUT_MS, 4000);

// Operator opt-in for local/demo feeds (http://127.0.0.1/...) used by the
// offline sample server and the test-suite. Public deployments keep this off so
// the fetcher can never be pointed at an internal address.
export const NEWS_ALLOW_LOCAL_FEEDS = process.env.NEWS_ALLOW_LOCAL_FEEDS === '1';
export const NEWS_SAMPLE_MODE = process.env.NEWS_SAMPLE_MODE === '1';

/* ------------------------------------------------------------------ *
 * Source registry
 * ------------------------------------------------------------------ *
 * Primary provider: the curated cyber newswire below - the official
 * RSS/Atom/JSON feeds that trusted cybersecurity publishers and government
 * cybersecurity bodies publish for syndication. See
 * docs/CYBER_NEWS.md for the provider evaluation and licensing notes.
 *
 * group:  'publisher' -> editorial cybersecurity publishers
 *         'advisory'  -> official government / CERT advisories
 * topic:  hint used for category boosting only ('india' boosts India Cyber News)
 */

export const NEWS_SOURCES = [
  {
    id: 'the-hacker-news',
    name: 'The Hacker News',
    url: 'https://feeds.feedburner.com/TheHackersNews',
    homepage: 'https://thehackernews.com/',
    type: 'rss',
    group: 'publisher',
    topic: 'general',
    enabled: true,
  },
  {
    id: 'bleepingcomputer',
    name: 'BleepingComputer',
    url: 'https://www.bleepingcomputer.com/feed/',
    homepage: 'https://www.bleepingcomputer.com/',
    type: 'rss',
    group: 'publisher',
    topic: 'general',
    enabled: true,
  },
  {
    id: 'dark-reading',
    name: 'Dark Reading',
    url: 'https://www.darkreading.com/rss.xml',
    homepage: 'https://www.darkreading.com/',
    type: 'rss',
    group: 'publisher',
    topic: 'enterprise',
    enabled: true,
  },
  {
    id: 'securityweek',
    name: 'SecurityWeek',
    url: 'https://www.securityweek.com/feed/',
    homepage: 'https://www.securityweek.com/',
    type: 'rss',
    group: 'publisher',
    topic: 'enterprise',
    enabled: true,
  },
  {
    id: 'krebs-on-security',
    name: 'Krebs on Security',
    url: 'https://krebsonsecurity.com/feed/',
    homepage: 'https://krebsonsecurity.com/',
    type: 'rss',
    group: 'publisher',
    topic: 'investigation',
    enabled: true,
  },
  {
    id: 'help-net-security',
    name: 'Help Net Security',
    url: 'https://www.helpnetsecurity.com/feed/',
    homepage: 'https://www.helpnetsecurity.com/',
    type: 'rss',
    group: 'publisher',
    topic: 'enterprise',
    enabled: true,
  },
  {
    id: 'the-register-security',
    name: 'The Register (Security)',
    url: 'https://www.theregister.com/security/headlines.atom',
    homepage: 'https://www.theregister.com/security/',
    type: 'atom',
    group: 'publisher',
    topic: 'general',
    enabled: true,
  },
  {
    id: 'the-cyber-express',
    name: 'The Cyber Express',
    url: 'https://thecyberexpress.com/feed/',
    homepage: 'https://thecyberexpress.com/',
    type: 'rss',
    group: 'publisher',
    topic: 'india',
    enabled: true,
  },
  {
    id: 'cisa-advisories',
    name: 'CISA Cybersecurity Advisories',
    url: 'https://www.cisa.gov/cybersecurity-advisories/all.xml',
    homepage: 'https://www.cisa.gov/news-events/cybersecurity-advisories',
    type: 'rss',
    group: 'advisory',
    topic: 'government',
    enabled: true,
  },
  {
    id: 'cisa-kev',
    name: 'CISA Known Exploited Vulnerabilities',
    url: 'https://www.cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json',
    homepage: 'https://www.cisa.gov/known-exploited-vulnerabilities-catalog',
    type: 'kev-json',
    group: 'advisory',
    topic: 'vulnerabilities',
    // The catalog is ~1 MB and changes a few times a week: refreshed less often
    // than the news feeds to keep requests modest.
    ttlSeconds: int(process.env.NEWS_KEV_TTL_SECONDS, 6 * 3600),
    enabled: true,
  },
];

/** Feed types the provider layer knows how to turn into raw items. */
export const SUPPORTED_SOURCE_TYPES = ['rss', 'atom', 'kev-json'];

const parseSourcesOverride = () => {
  const raw = process.env.NEWS_FEEDS_JSON;
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || !parsed.length) {
      console.warn('[news] NEWS_FEEDS_JSON must be a non-empty JSON array - ignoring.');
      return null;
    }
    return parsed;
  } catch (error) {
    console.warn(`[news] NEWS_FEEDS_JSON is not valid JSON - ignoring (${error.message}).`);
    return null;
  }
};

const disabledFromEnv = () =>
  (process.env.NEWS_DISABLED_SOURCES || '')
    .split(',')
    .map((id) => id.trim().toLowerCase())
    .filter(Boolean);

/** The effective source list: defaults, an optional env override, minus disabled ids. */
export const getSources = () => {
  const override = parseSourcesOverride();
  const base = override || NEWS_SOURCES;
  const disabled = new Set(disabledFromEnv());
  return base
    .filter((source) => source && source.url && source.name)
    .filter((source) => !disabled.has(String(source.id || '').toLowerCase()))
    .map((source, index) => ({
      id: String(source.id || `source-${index}`).toLowerCase(),
      name: String(source.name),
      url: String(source.url),
      homepage: source.homepage ? String(source.homepage) : null,
      type: SUPPORTED_SOURCE_TYPES.includes(source.type) ? source.type : 'rss',
      group: source.group === 'advisory' ? 'advisory' : 'publisher',
      topic: source.topic ? String(source.topic) : 'general',
      ttlSeconds: int(source.ttlSeconds, 0) || null,
      enabled: source.enabled !== false,
    }))
    .filter((source) => source.enabled);
};

/* ------------------------------------------------------------------ *
 * Categories
 * ------------------------------------------------------------------ *
 * Classification is keyword based over the article title + description: no
 * invented metadata and no external AI calls. `weight` breaks ties when an
 * article matches several topics, so an article always gets one primary
 * category for its badge while remaining findable under every topic it really
 * matches (for example ransomware in India: Cyber Attacks + India Cyber News).
 */

export const NEWS_CATEGORIES = [
  {
    id: 'all-news',
    label: 'All News',
    description: 'Every cybersecurity story in the current newswire.',
    weight: 0,
    keywords: [],
    // The "All" chip is rendered from the filter list, not from this entry.
    selectable: false,
  },
  {
    id: 'cyber-attacks',
    label: 'Cyber Attacks',
    description: 'Ransomware, malware campaigns, DDoS attacks and attack incidents.',
    weight: 70,
    keywords: [
      'ransomware', 'ransom', 'malware', 'spyware', 'trojan', 'worm', 'botnet',
      'ddos', 'denial of service', 'attack', 'attacks', 'attacker', 'attackers',
      'cyberattack', 'cyber attack', 'hacktivist', 'wiper', 'infostealer',
      'info stealer', 'stealer', 'rootkit', 'backdoor', 'command and control',
      'loader', 'dropper', 'extortion', 'encrypted files', 'supply chain attack',
    ],
  },
  {
    id: 'data-breaches',
    label: 'Data Breaches',
    description: 'Data leaks, exposed databases, account exposure and organisational breaches.',
    weight: 75,
    keywords: [
      'data breach', 'breach*', 'data leak', 'leak*', 'exfiltrat*', 'stolen data',
      'customer data', 'personal data', 'records exposed', 'credential leak',
      'compromised accounts', 'account takeover', 'records of', 'spilled',
    ],
  },
  {
    id: 'hacking-exploits',
    label: 'Hacking & Exploits',
    description: 'Vulnerability exploitation, zero-days and security research.',
    weight: 68,
    keywords: [
      'zero-day', 'zero day', '0-day', 'exploit', 'exploited', 'exploitation',
      'poc', 'proof-of-concept', 'remote code execution', 'rce', 'privilege escalation',
      'bypass', 'authentication bypass', 'hacking', 'hacker', 'hackers', 'penetration test',
      'pentest', 'pwn2own', 'bug bounty', 'security research', 'researchers found',
      'weaponized', 'weaponised', 'attack chain', 'kill chain', 'apt', 'espionage',
    ],
  },
  {
    id: 'ai-security',
    label: 'AI Security',
    description: 'AI vulnerabilities, AI-powered attacks and AI security developments.',
    weight: 80,
    keywords: [
      'ai', 'artificial intelligence', 'machine learning', 'llm', 'large language model',
      'genai', 'gen ai', 'generative ai', 'chatgpt', 'claude', 'gemini', 'copilot',
      'prompt injection', 'model poisoning', 'data poisoning', 'ai agent', 'ai agents',
      'ai-powered', 'ai powered', 'deepfake', 'ai model', 'neural', 'ml model',
      'jailbreak', 'guardrail*',
    ],
  },
  {
    id: 'cybercrime-scams',
    label: 'Cybercrime & Scams',
    description: 'Phishing, online fraud, identity theft and digital scams.',
    weight: 65,
    keywords: [
      'phishing', 'smishing', 'vishing', 'scam', 'scams', 'fraud', 'fraudster',
      'identity theft', 'social engineering', 'spoof*', 'credential harvesting',
      'impersonat*', 'money mule', 'romance scam', 'investment scam',
      'cybercrime', 'cyber criminal', 'cybercriminal', 'extortion', 'arrest*',
      'charg*', 'sentenc*', 'convict*', 'pleaded guilty', 'law enforcement',
    ],
  },
  {
    id: 'vulnerabilities-cves',
    label: 'Vulnerabilities & CVEs',
    description: 'Newly disclosed vulnerabilities, advisories and security patches.',
    weight: 85,
    keywords: [
      'cve-', 'vulnerab*', 'flaw*', 'bug', 'patch*', 'security update', 'cvss',
      'severity', 'advisory', 'advisories', 'fixed in', 'upgrade', 'critical', 'high severity',
      'disclos*',
    ],
  },
  {
    id: 'india-cyber',
    label: 'India Cyber News',
    description: 'Indian cybersecurity incidents, advisories and government developments.',
    weight: 90,
    // Only used to *add* this topic to an article - the primary badge stays the
    // dominant security topic of the story.
    additive: true,
    keywords: [
      'india', 'indian', 'cert-in', 'cert in', 'aadhaar', 'upi', 'rbi', 'sebi',
      'meity', 'dpdp', 'bharat', 'delhi', 'mumbai', 'bengaluru', 'bangalore',
      'hyderabad', 'chennai', 'kolkata', 'pune', 'ahmedabad', 'gurugram', 'noida',
      'kerala', 'maharashtra', 'karnataka', 'tamil nadu', 'telangana', 'gujarat',
      'rajasthan', 'punjab', 'haryana', 'cbi', 'national informatics centre', 'digilocker', 'irctc',
      'hdfc', 'icici', 'sbi', 'paytm', 'jio', 'airtel', 'wipro', 'infosys', 'tata consultancy',
    ],
  },
  {
    id: 'government-advisories',
    label: 'Government & Security Advisories',
    description: 'Official cybersecurity alerts, recommendations and policy developments.',
    weight: 88,
    keywords: [
      'cisa', 'ncsc', 'nist', 'enisa', 'europol', 'interpol', 'cert-', 'cert in',
      'government', 'ministry', 'regulator*', 'parliament', 'lawmaker*', 'senate',
      'white house', 'federal', 'policy', 'regulation', 'directive', 'bulletin',
      'alert*', 'official advisory', 'agency warned', 'warns users', 'mandat*',
      'sanction*', 'eu cyber', 'state attorney', 'doj', 'department of justice',
    ],
  },
  {
    id: 'cloud-enterprise-security',
    label: 'Cloud & Enterprise Security',
    description: 'Cloud security, enterprise vulnerabilities and infrastructure incidents.',
    weight: 60,
    keywords: [
      'cloud', 'aws', 'amazon web services', 'azure', 'google cloud', 'gcp',
      'kubernetes', 'docker', 'contain*', 'saas', 's3 bucket', 'eks', 'iam',
      'enterprise', 'ciso', 'zero trust', 'identity and access', 'devops', 'ci/cd',
      'supply chain', 'data center', 'infrastructure', 'on-prem*', 'tenant*',
    ],
  },
  {
    // Internal fallback used only as a badge for stories that genuinely match no
    // topic above (for example a certificate-lifetime change). Not a filter.
    id: 'general-cyber',
    label: 'Cybersecurity',
    description: 'General cybersecurity developments.',
    weight: 0,
    keywords: [],
    selectable: false,
  },
];

export const NEWS_CATEGORY_IDS = NEWS_CATEGORIES.map((category) => category.id);

/** Categories that can be used as a sidebar section. */
export const NEWS_FEATURED_CATEGORY = 'cyber-attacks';

/** Patterns that are matched against the raw title/description. */
export const NEWS_PATTERNS = {
  cve: /\bCVE-\d{4}-\d{4,7}\b/gi,
  // Words that signal an explicitly critical item *in the publisher's own
  // words* - used only for advisory-sourced labels, never to invent severity.
  critical: /\bcritical\b/i,
  sponsored: /\b(sponsored|partner content|paid post|advertorial|webinar)\b/i,
};

/**
 * Trusted sources shown in the sidebar. Editorial metadata about the outlets we
 * syndicate (name + homepage), not news content.
 */
export const NEWS_TRUSTED_SOURCES = [
  { name: 'CISA', url: 'https://www.cisa.gov/news-events/cybersecurity-advisories', note: 'US official advisories' },
  { name: 'The Hacker News', url: 'https://thehackernews.com/', note: 'Threat & attack coverage' },
  { name: 'BleepingComputer', url: 'https://www.bleepingcomputer.com/', note: 'Security news & analysis' },
  { name: 'Krebs on Security', url: 'https://krebsonsecurity.com/', note: 'Investigative reporting' },
  { name: 'Dark Reading', url: 'https://www.darkreading.com/', note: 'Enterprise security' },
  { name: 'SecurityWeek', url: 'https://www.securityweek.com/', note: 'Industry news' },
  { name: 'Help Net Security', url: 'https://www.helpnetsecurity.com/', note: 'Enterprise & research' },
  { name: 'The Register', url: 'https://www.theregister.com/security/', note: 'Security desk' },
  { name: 'The Cyber Express', url: 'https://thecyberexpress.com/', note: 'India & global cyber news' },
];
