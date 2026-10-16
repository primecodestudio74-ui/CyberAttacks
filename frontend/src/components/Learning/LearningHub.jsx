import React, { useState, useEffect, useRef } from 'react';
import { gsap } from 'gsap';

const DATA = [
  { id: "m1", lvl: "green", emoji: "🟢", title: "Introduction to Cyber Security", desc: "The foundation: what cyber security actually protects, why it's everyone's responsibility, and the shape of the threats you'll meet.",
    topics: [
      { t: "What is Cyber Security?", body: "Cyber security means protecting your devices and personal information from people who want to steal or damage them. Think of it like locking your house - you lock doors and windows to keep thieves out. Cyber security does the same thing for your digital life. It protects your computer, phone, and all the data stored on them from hackers.",
       example: "Example: Your password is like a lock on your phone. It stops someone else from accessing your photos, messages, and apps.",
       list: ["Keeping information private and safe", "Making sure data doesn't get changed or deleted", "Keeping your devices working properly"] },
      { t: "Why Cyber Security Matters", body: "Every day you use the internet - for homework, social media, gaming, or shopping. Hackers want to steal your information to make money or cause trouble. If they get your passwords, they can pretend to be you online. If they get your parents' banking information, they can steal money. That's why it matters to you right now.",
       example: "Example: A hacker could steal your Instagram password and post mean things pretending to be you, or send messages to your friends asking for money.",
       callout: "Most attacks happen because people make small mistakes - like clicking a suspicious link or using the same password everywhere. You can stop most attacks just by being careful." },
      { t: "Types of Cyber Threats", body: "Hackers use different tricks to break into accounts and devices. Here are the main types you should know about:",
       example: "Example: You get an email that looks like it's from YouTube saying your account will be deleted. You click the link and enter your password. That's a phishing attack - the email was fake!",
       list: ["Phishing - Fake emails or messages tricking you to give up passwords", "Malware - Harmful programs that damage your computer", "Ransomware - Programs that lock your files until you pay money", "Social engineering - Someone tricking you into breaking security rules", "Denial-of-Service - Flooding a system to knock it offline"] }
    ]
  },
  { id: "m2", lvl: "green", emoji: "🟢", title: "Online Safety Basics", desc: "The everyday habits — passwords, 2FA, browsing, and Wi-Fi — that stop the majority of common attacks before they start.",
    topics: [
      { t: "Strong Passwords", body: "A strong password is like a complicated lock that's hard to break. The longer and more random it is, the harder it is for hackers to guess. Instead of using 'Password123', try using a phrase like 'BlueSky$Guitar#2024' - it's longer, has numbers and symbols, and is much safer.",
       example: "Example: Bad password = 'abc123'. Good password = 'ILove$Pizza&Movies2024'. The second one is much harder to crack!",
       list: ["Use at least 12 characters - longer is better", "Mix uppercase, lowercase, numbers, and symbols", "Never use your name, birthday, or pet's name", "Use a different password for each important account"] },
      { t: "Two-Factor Authentication (2FA)", body: "Two-factor authentication is like having two locks on your door instead of one. Even if someone steals your password, they still can't get in because they need a second code. This code usually comes to your phone or from an app, and only you have access to it.",
       example: "Example: You log into Instagram with your password. Then Instagram asks for a code from your phone. A hacker has your password but not your phone, so they're locked out!",
       list: ["Turn on 2FA for email, social media, and gaming accounts", "Use an authenticator app like Google Authenticator - it's safer than text messages", "Save backup codes in case you lose your phone"] },
      { t: "Safe Internet Browsing", body: "When you're online, not every website is what it claims to be. Some websites are designed to trick you into giving up information. Before you enter any personal details, check if the website is real and safe.",
       example: "Example: You see a website that looks exactly like Amazon, but the web address is 'amaz0n.com' (with a zero instead of the letter O). That's a fake website trying to steal your password!",
       list: ["Look for 'HTTPS' and a padlock icon before entering passwords", "Check the web address carefully - hackers use fake URLs that look similar", "Keep your browser updated - updates fix security problems", "Don't click on pop-ups or ads that say 'You've won a prize!'"] },
      { t: "Secure Wi-Fi Usage", body: "Your home Wi-Fi is the gateway to all your devices. If someone hacks your Wi-Fi password, they can see everything you do online. Protect it like you protect your bedroom door.",
       example: "Example: Your neighbor guesses your Wi-Fi password is 'password123'. Now they're on your network and can see what you're doing online.",
       list: ["Change your router's default password to something strong", "Use WPA3 or WPA2 encryption (check your router settings)", "Create a strong Wi-Fi password - not something easy like 'wifi123'", "Create a separate guest network for visitors"] }
    ]
  },
  { id: "m3", lvl: "yellow", emoji: "🟡", title: "Common Cyber Attacks", desc: "A close look at the attack types responsible for most breaches — how they work, and how to recognize them.",
    topics: [
      { t: "Phishing - The Fake Email Trick", body: "Phishing is when someone sends you a fake email or message pretending to be someone you trust - like your bank, school, or a popular website. They want you to click a link and enter your password. The fake website looks real, but it's actually stealing your information.",
       example: "Example: You get an email saying 'Your Netflix account will be deleted! Click here to confirm your password.' You click it and enter your password. Now the hacker has it!",
       list: ["Check who really sent the email - hover over the sender's name", "Look for spelling mistakes and awkward language", "Never click links in suspicious emails - go to the website directly instead", "If something seems urgent or scary, it's probably phishing"] },
      { t: "Malware and Viruses", body: "Malware is harmful software that damages your computer or steals your information. A virus is one type of malware that spreads from file to file, like a real virus spreads from person to person. You usually get malware by downloading something from an unsafe website or opening an infected email attachment.",
       example: "Example: You download a game from a sketchy website. It installs malware that slows down your computer and shows tons of ads. Now your computer is infected!",
       list: ["Only download apps from official stores like Google Play or Apple App Store", "Don't open email attachments from people you don't know", "Keep your antivirus software updated", "Be careful downloading files from the internet"] },
      { t: "Ransomware - The Lockout Attack", body: "Ransomware is a program that locks all your files and won't let you access them until you pay money. It's like someone breaking into your house and putting a chain on your bedroom door. The worst part? Even if you pay, you might not get your files back. Prevention is way better than trying to fix it.",
       example: "Example: You download what looks like a homework help program. It's actually ransomware. Suddenly your computer shows a message: 'Your files are locked! Pay $500 to unlock them.' Your homework is gone!",
       callout: "The best defense is to back up your important files regularly. If ransomware attacks, you can restore your files from the backup without paying anything." },
      { t: "Social Engineering - Tricking People", body: "Social engineering is when someone tricks you into breaking security rules by manipulating your emotions. They might pretend to be IT support, a friend, or someone in authority. They use psychology to make you trust them, then ask you to do something unsafe.",
       example: "Example: Someone calls your house pretending to be from your internet company. They say there's a problem and ask for your Wi-Fi password. You give it to them, not knowing they're a hacker!",
       list: ["Never give passwords to anyone, even if they claim to be from IT support", "Verify requests through another method - call the company directly", "Be suspicious of people asking for sensitive information", "Your school IT department will never ask for your password via email"] },
      { t: "Identity Theft", body: "Identity theft happens when someone uses your personal information to pretend to be you. They might open credit cards in your name, apply for loans, or make purchases. It can take years to fix the damage.",
       example: "Example: A hacker gets your name, address, and social security number from a data breach. They apply for a credit card in your name and go shopping. Your parents get the bill!",
       list: ["Check your credit report once a year for suspicious activity", "Shred documents with personal information before throwing them away", "Don't share your social security number online", "Monitor your bank and credit card statements regularly"] }
    ]
  },
  { id: "m4", lvl: "yellow", emoji: "🟡", title: "Email & Social Media Security", desc: "Where most social engineering plays out — learn to read the warning signs in your inbox and your feed.",
    topics: [
      { t: "Spotting Fake Emails", body: "Fake emails look almost real, but they have small mistakes or clues that give them away. Scammers are trying to trick you into clicking a link or downloading something harmful. Learn to spot the red flags.",
       example: "Example: An email from 'PayPal' has bad grammar and asks you to 'urgently verify your acount' (spelled wrong). Real PayPal emails are professional and spell-checked.",
       list: ["Check the sender's email address carefully - scammers use similar-looking addresses", "Look for poor grammar and spelling mistakes", "Be suspicious of urgent messages or threats", "Never download attachments from unknown senders"] },
      { t: "Smart Social Media Habits", body: "What you post on social media can be used against you. Hackers can piece together information from your posts to guess your passwords or steal your identity. Think before you share - would you want a stranger to know this?",
       example: "Example: You post 'Just landed in Hawaii!' with your location. You also posted 'My dog Buddy is the best!' and 'Born on June 15'. A hacker now knows your location, pet's name, and birthday - they can guess your passwords!",
       list: ["Don't share your location in real-time - wait until you're home", "Avoid posting your birthday, school name, or phone number", "Be careful with 'fun' quizzes that ask for personal information", "Think twice before accepting friend requests from strangers"] },
      { t: "Privacy Settings Matter", body: "Most social media apps share more information than you realize by default. Your profile might be visible to everyone on the internet. Take 10 minutes to change your privacy settings so only your real friends can see your posts.",
       example: "Example: You post a photo on Instagram thinking only your friends see it. Actually, because your privacy settings are public, 1000 strangers can see it too!",
       list: ["Set your profile to private so only approved followers see your posts", "Limit who can see your friends list and contact information", "Turn off location tracking in your app settings", "Delete old apps you don't use anymore - they might still have access to your data"] },
      { t: "Fake Profiles and Scams", body: "Scammers create fake profiles pretending to be celebrities, attractive people, or businesses. They build trust with you, then ask for money, gift cards, or personal information. It's called catfishing, and it happens to thousands of teenagers every day.",
       example: "Example: A 'cute girl' starts chatting with you online. After a few weeks, she says she's in trouble and needs $50 for a bus ticket. You send the money. The profile disappears and you never hear from her again. It was a scammer!",
       list: ["Reverse image search a profile photo - scammers steal pictures from the internet", "Be suspicious if someone you just met asks for money", "Never send money or gift cards to online friends you haven't met in person", "If something feels wrong, it probably is - trust your gut"] }
    ]
  },
  { id: "m5", lvl: "orange", emoji: "🟠", title: "Mobile & Device Security", desc: "Your phone carries more sensitive data than most laptops — here's how to keep it locked down.",
    topics: [
      { t: "Smartphone Security Basics", body: "Your phone is basically a mini-computer that holds your most private information - messages, photos, banking apps, and passwords. Protect it like you protect your diary. Use a strong lock and don't leave it lying around.",
       example: "Example: You leave your phone on the table at school. Someone picks it up and can access all your messages, photos, and apps because you didn't set a lock code.",
       list: ["Use a strong PIN, password, or fingerprint lock - never leave it disabled", "Turn on 'Find My Phone' so you can locate it if it's lost or stolen", "Only install apps from official app stores", "Lock your phone whenever you step away from it"] },
      { t: "Downloading Apps Safely", body: "Apps ask for permission to access your camera, microphone, location, and contacts. Some apps ask for way more access than they need. A flashlight app shouldn't need access to your contacts, for example. Check permissions before installing.",
       example: "Example: A game asks for permission to access your camera, microphone, contacts, and location. That's suspicious! A game doesn't need any of that. It might be spyware.",
       list: ["Read the permissions an app is asking for before installing", "Check app reviews - look for complaints about security or privacy", "Uninstall apps you don't use anymore", "Use only official app stores - not random websites"] },
      { t: "Keep Your Software Updated", body: "Software updates aren't just new features - they fix security holes that hackers can exploit. When your phone or app asks to update, do it! Ignoring updates is like leaving your front door unlocked.",
       example: "Example: Your phone offers an update, but you ignore it because you're busy. A hacker finds the security hole that the update would have fixed and hacks your phone.",
       list: ["Turn on automatic updates for your operating system", "Update important apps like email and banking apps immediately", "Don't ignore update notifications for extended periods", "Replace old devices that no longer receive security updates"] },
      { t: "Backing Up Your Data", body: "Backing up means making copies of your important files in a safe place. If your phone gets lost, stolen, or infected with malware, you still have your photos and files. Use cloud backup like Google Drive or iCloud.",
       example: "Example: Your phone gets ransomware and all your photos are locked. But you backed them up to Google Drive, so you can restore them without paying anything!",
       list: ["Back up your phone automatically to cloud storage", "Test your backups occasionally to make sure they work", "Keep one backup offline (not connected to the internet)", "Back up important files regularly, not just once"] }
    ]
  },
  { id: "m6", lvl: "orange", emoji: "🟠", title: "Digital Privacy", desc: "What you leave behind online, and how to keep control over your personal footprint.",
    topics: [
      { t: "Protecting Your Personal Information", body: "Your personal information - like your name, address, phone number, and ID numbers - is valuable to hackers. They can use it to steal your identity or target you with scams. Only share this information when absolutely necessary, and only with websites you trust.",
       example: "Example: A website asks for your full name, address, phone number, AND social security number just to sign up for a free account. That's too much information! Don't give it to them.",
       list: ["Question why a website needs the information it's asking for", "Use fake information for non-important accounts (like gaming accounts)", "Be cautious with 'free' services - if it's free, you're probably the product", "Never give personal information over email or phone"] },
      { t: "Safe Online Shopping", body: "Online shopping is convenient, but it has risks. Fake websites steal your credit card information. Real websites might get hacked. Check for security signs before entering your payment information.",
       example: "Example: You find a website selling expensive shoes for 90% off. It looks real, but it's a fake store. You enter your credit card and they steal your information.",
       list: ["Only shop on HTTPS websites with a padlock icon", "Use a credit card instead of a debit card when possible", "Check the website's return policy and contact information", "Be suspicious of deals that seem too good to be true"] },
      { t: "Your Digital Footprint", body: "Your digital footprint is everything you leave behind online - posts, photos, comments, search history, and purchases. It's much bigger than you think, and it's permanent. Companies use this information to profile you and sell ads.",
       example: "Example: You search for 'acne treatment' on Google. Suddenly you see acne product ads everywhere. Google is tracking your searches and using them to show you targeted ads.",
       list: ["Search your own name on Google to see what's publicly visible", "Delete or deactivate old social media accounts you don't use", "Keep your personal and school/work online identities separate", "Use privacy settings to limit what information is visible"] },
      { t: "Public Wi-Fi Dangers", body: "Public Wi-Fi at coffee shops, airports, and libraries is convenient but dangerous. Anyone on the same network can see your internet traffic. If you log into your email or bank account on public Wi-Fi, a hacker might be able to steal your password.",
       example: "Example: You're at a coffee shop using their Wi-Fi. A hacker on the same network intercepts your traffic and sees your Gmail password as you log in.",
       list: ["Avoid logging into banking or important accounts on public Wi-Fi", "Use a VPN (Virtual Private Network) to encrypt your traffic", "Turn off auto-connect to open Wi-Fi networks", "Use your phone's hotspot instead of public Wi-Fi when possible"] }
    ]
  },
  { id: "m7", lvl: "red", emoji: "🔴", title: "What to Do If You're Hacked", desc: "When prevention fails: how to spot a compromise fast, recover safely, and report it properly.",
    topics: [
      { t: "Recognizing You've Been Hacked", body: "A hack doesn't always mean your computer explodes. Sometimes it's subtle - you might notice small changes that seem weird. The sooner you catch it, the less damage happens. Here are warning signs to watch for.",
       example: "Example: You get an email saying 'Someone logged into your account from a different location.' You didn't do that - you've been hacked!",
       list: ["You get login alerts from places you've never been", "Your friends say they got weird messages from you", "Your password doesn't work anymore (someone changed it)", "You see new apps or settings you didn't create", "Your device is running slowly or draining battery fast"] },
      { t: "Recovering Your Accounts", body: "If you think you've been hacked, act fast. The longer you wait, the more damage a hacker can do. Follow these steps in order to regain control of your account.",
       example: "Example: You realize your Instagram was hacked. You immediately change your password from a different device, turn on 2FA, and check what the hacker did.",
       list: ["Change your password immediately from a different device", "Log out of all active sessions in your account settings", "Turn on 2FA if you haven't already", "Check your account recovery email and phone number - change them if they're wrong", "Review connected apps and remove any you don't recognize"] },
      { t: "Reporting the Hack", body: "Reporting helps you get support and helps others by warning them about the attack. It also creates a record in case you need it for legal reasons. Report to both the platform and the authorities.",
       example: "Example: Your Instagram account was hacked. You report it to Instagram, and they help you recover it. You also report it to the FBI's Internet Crime Complaint Center.",
       list: ["Report to the platform (Instagram, Gmail, etc.) immediately", "File a report with your local police or cybercrime unit", "Report to national cybercrime centers if available in your country", "Keep records of everything that happened"] },
      { t: "Preventing Future Attacks", body: "A hack is a lesson. It shows you exactly where your security was weak. Use this information to fix the problem so it doesn't happen again. This is called learning from your mistakes.",
       example: "Example: You got hacked because you used the same password on multiple websites. Now you use a different strong password for each account.",
       list: ["Figure out how you got hacked - was it a phishing email? A weak password?", "Change passwords on any accounts that used the same password", "Enable 2FA on all important accounts", "Write down what happened so you remember to stay careful"] }
    ]
  },
  { id: "m8", lvl: "gold", emoji: "🏆", title: "Cyber Safety Best Practices", desc: "Bringing it all together — daily habits, quick do's and don'ts, and lessons from real incidents.",
    topics: [
      { t: "Daily Cyber Safety Checklist", body: "Good security doesn't require complicated steps. It's just a few simple habits you do every day. If you do these things consistently, you'll stop most attacks before they even start.",
       example: "Example: Every morning you lock your phone, check for suspicious emails, and update any pending app updates. These simple habits protect you all day.",
       list: ["Lock your screen whenever you step away", "Think before clicking any link or downloading anything", "Verify unusual requests by calling or texting the person directly", "Keep all software and apps updated", "Use unique passwords with 2FA enabled on important accounts"] },
      { t: "Do's and Don'ts", body: "Here's a quick reference guide for the choices that matter most. When you're in doubt about something online, check this list.",
       list: ["DO use a password manager - DON'T write passwords on sticky notes", "DO verify links before clicking - DON'T trust urgent messages alone", "DO back up your files regularly - DON'T assume 'it won't happen to me'", "DO enable 2FA everywhere - DON'T reuse the same password", "DO check privacy settings - DON'T share personal information carelessly", "DO use HTTPS websites - DON'T enter passwords on unencrypted sites"] },
      { t: "Real-Life Case Studies", body: "Real hacks happen to real people every day. By studying what went wrong, you can avoid the same mistakes. Most breaches happen because of simple mistakes - not advanced hacking.",
       example: "Example: In 2023, millions of people got hacked because they reused passwords. One company's database was stolen, and hackers tried that password on Gmail, Instagram, and other sites. It worked!",
       callout: "Most breaches aren't the result of exotic, cutting-edge hacking — they exploit the same basic gaps this course teaches you to close." }
    ]
  }
];

export default function LearningHub() {
  const [theme, setTheme] = useState(() => localStorage.getItem('cyberlearn-theme') || 'dark');
  const [search, setSearch] = useState('');
  const [openGroups, setOpenGroups] = useState({ m1: true });
  const [activeAnchor, setActiveAnchor] = useState('');
  const [scrollProgress, setScrollProgress] = useState(0);
  const [showScrollTop, setShowScrollTop] = useState(false);

  const topicRefs = useRef({});
  const welcomeSectionRef = useRef(null);
  const cardsContainerRef = useRef(null);

  // Synchronize dynamic background styles & configurations directly into document root
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('cyberlearn-theme', theme);
  }, [theme]);

  // Robust, window-relative scroll height calculator
  useEffect(() => {
    const calculateScroll = () => {
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      const scrollHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      const progress = scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0;
      
      setScrollProgress(progress);
      setShowScrollTop(scrollTop > 450);
    };

    calculateScroll(); // initial trigger
    window.addEventListener('scroll', calculateScroll, { passive: true });
    return () => window.removeEventListener('scroll', calculateScroll);
  }, []);

  // GSAP Entrance Animations
  useEffect(() => {
    gsap.fromTo(welcomeSectionRef.current, 
      { opacity: 0, y: 35 },
      { opacity: 1, y: 0, duration: 1.1, ease: 'power4.out', delay: 0.15 }
    );

    const articles = document.querySelectorAll('.topic-article-card');
    if (articles.length > 0) {
      gsap.fromTo(articles,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out', stagger: 0.08 }
      );
    }
  }, []);

  // Intersection Observers setup for smooth scroll-spy tracking
  useEffect(() => {
    const elements = Object.values(topicRefs.current).filter(Boolean);

    const spyObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const targetId = entry.target.id;
          setActiveAnchor(targetId);
          const parentId = targetId.split('-')[0];
          setOpenGroups(prev => ({ ...prev, [parentId]: true }));
        }
      });
    }, { rootMargin: '-20% 0px -55% 0px' });

    elements.forEach(el => spyObserver.observe(el));
    return () => spyObserver.disconnect();
  }, [search]);

  const toggleGroup = (id) => {
    setOpenGroups(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleSidebarAnchorClick = (e, targetId) => {
    e.preventDefault();
    const element = document.getElementById(targetId);
    if (element) {
      const offset = 90;
      const elementPosition = element.getBoundingClientRect().top + window.scrollY;
      window.scrollTo({
        top: elementPosition - offset,
        behavior: 'smooth'
      });
    }
  };

  const levelColors = {
    green: 'bg-[#10b981]',
    yellow: 'bg-[#f59e0b]',
    orange: 'bg-[#f97316]',
    red: 'bg-[#ef4444]',
    gold: 'bg-[#fbbf24]'
  };

  return (
    <div className={`min-h-screen text-[color:var(--text)] transition-colors duration-300 ${
      theme === 'dark' ? 'bg-[#0b0f19]' : 'bg-[#fafafa]'
    }`}>
      
      {/* Ribbon-style Top Border Scroll Tracker */}
      <div className="fixed top-0 left-0 w-full h-[5px] z-[9999] pointer-events-none">
        <div 
          className={`h-full bg-gradient-to-r ${theme === 'dark' ? 'from-cyan-500' : 'from-cyan-700'} via-blue-500 to-indigo-600 shadow-[0_2px_15px_rgba(6,182,212,0.6)] transition-all duration-150 ease-out`}
          style={{ width: `${scrollProgress}%` }}
        />
        {/* Animated ribbon tip effect */}
        <div 
          className="absolute top-0 h-full w-4 bg-white/40 blur-[2px] animate-pulse"
          style={{ left: `calc(${scrollProgress}% - 8px)` }}
        />
      </div>

      <header className={`sticky top-0 z-[100] h-16 flex items-center justify-between px-6 border-b transition-colors duration-300 ${
        theme === 'dark' 
          ? 'bg-[#0e1424] border-[#1e293b]' 
          : 'bg-white border-[#e2e8f0] shadow-sm'
      }`}>
        <div className="brand flex items-center gap-3 font-extrabold text-lg sm:text-xl tracking-tight">
          <span className={`w-3 h-3 rounded-[3px] ${theme === 'dark' ? 'bg-cyan-500 shadow-[0_0_12px_#22d3ee]' : 'bg-cyan-700 shadow-[0_0_12px_rgba(14,116,144,0.4)]'} rotate-45 animate-pulse`} />
          <span className={theme === 'dark' ? 'text-white' : 'text-slate-900'}>HackAware Learning</span>
          <span className="text-xs text-slate-500 font-medium uppercase tracking-[2px] ml-2 border-l pl-3 border-slate-700 hidden sm:inline-block">
            Cyber Security Fundamentals
          </span>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative">
            <input 
              type="text" 
              placeholder="Search concepts..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={`w-48 sm:w-60 text-sm py-2 px-3 pl-4 rounded-lg outline-none border transition-all ${
                theme === 'dark'
                  ? 'bg-[#161f33] border-[#223049] text-slate-200 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500'
                  : 'bg-[#f1f5f9] border-[#cbd5e1] text-slate-800 focus:border-cyan-600 focus:ring-1 focus:ring-cyan-600'
              }`}
            />
          </div>

          <button 
            onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
            className={`w-9 h-9 rounded-lg border flex items-center justify-center cursor-pointer transition-all duration-200 active:scale-95 text-lg ${
              theme === 'dark'
                ? 'bg-[#161f33] border-[#223049] hover:text-cyan-400'
                : 'bg-white border-[#cbd5e1] hover:text-cyan-600 hover:shadow-sm'
            }`}
          >
            {theme === 'light' ? '🌙' : '☀️'}
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] max-w-[1400px] mx-auto px-4 md:px-6 gap-6">
        
        {/* Navigation Sidebar Drawer with hidden scrollbar */}
        <aside 
          className="sticky top-16 h-[calc(100vh-64px)] overflow-y-auto pt-6 pb-16 hidden md:block select-none"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          <style>{`
            aside::-webkit-scrollbar { display: none; }
          `}</style>
          
          <nav className="space-y-1">
            {DATA.map((mod, mi) => (
              <div key={mod.id} className="mb-2">
                <div 
                  onClick={() => toggleGroup(mod.id)}
                  className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer text-sm font-bold transition-all ${
                    theme === 'dark' ? 'hover:bg-[#161f33]' : 'hover:bg-slate-100'
                  }`}
                >
                  <span className="text-xs text-slate-500 font-mono">{String(mi+1).padStart(2,'0')}</span>
                  <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${levelColors[mod.lvl]}`} />
                  <span className="truncate flex-1 pr-1">{mod.title}</span>
                  <svg 
                    className={`w-3 h-3 text-slate-500 transition-transform duration-200 ${openGroups[mod.id] ? 'rotate-90' : ''}`} 
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" />
                  </svg>
                </div>

                <ul className={`pl-6 space-y-1 overflow-hidden transition-all duration-300 ${
                  openGroups[mod.id] ? 'max-h-[300px] mt-1 opacity-100' : 'max-h-0 opacity-0 pointer-events-none'
                }`}>
                  {mod.topics.map((topic, ti) => {
                    const targetId = `${mod.id}-t${ti}`;
                    const isActive = activeAnchor === targetId;
                    return (
                      <li key={ti}>
                        <a 
                          href={`#${targetId}`}
                          onClick={(e) => handleSidebarAnchorClick(e, targetId)}
                          className={`block py-1.5 px-3 text-xs rounded transition-all duration-150 relative ${
                            isActive 
                              ? `${theme === 'dark' ? 'text-cyan-400 bg-cyan-950/40 border-cyan-400' : 'text-cyan-700 bg-cyan-50 border-cyan-700'} font-semibold border-l-2` 
                              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                          }`}
                        >
                          {topic.t}
                        </a>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </nav>
        </aside>

        <main className="py-6 md:py-10 pb-32">
          
          <section 
            ref={welcomeSectionRef}
            className={`p-6 sm:p-10 rounded-2xl mb-12 border relative overflow-hidden transition-all duration-300 ${
              theme === 'dark' 
                ? 'bg-gradient-to-br from-[#111c30] to-[#0b0f19] border-[#223049]' 
                : 'bg-white border-[#cbd5e1] shadow-sm'
            }`}
          >
            <div className={`text-xs font-mono tracking-widest ${theme === 'dark' ? 'text-cyan-400' : 'text-cyan-700'} uppercase mb-3`}>// 8 Modules · 30 Topics · Comprehensive Roadmap</div>
            <h1 className={`text-3xl sm:text-5xl font-extrabold leading-snug mb-3.5 tracking-tight ${
              theme === 'dark' ? 'text-white' : 'text-slate-900'
            }`}>Cyber Security Hub</h1>
            <p className="text-slate-400 text-base leading-relaxed max-w-2xl mb-6">
              A structured, interactive roadmap designed to guide you from foundational principles up to production-ready defensive security patterns. 
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8 pt-6 border-t border-slate-800/60">
              <div>
                <b className={`text-3xl ${theme === 'dark' ? 'text-cyan-400' : 'text-cyan-700'} block font-black`}>8</b>
                <span className="text-xs text-slate-500 uppercase tracking-wider font-bold">Modules</span>
              </div>
              <div>
                <b className={`text-3xl ${theme === 'dark' ? 'text-cyan-400' : 'text-cyan-700'} block font-black`}>30</b>
                <span className="text-xs text-slate-500 uppercase tracking-wider font-bold">Concepts</span>
              </div>
              <div>
                <b className={`text-lg ${theme === 'dark' ? 'text-cyan-400' : 'text-cyan-700'} block font-black`}>Beginner</b>
                <span className="text-xs text-slate-500 uppercase tracking-wider font-bold">Complexity</span>
              </div>
              <div>
                <b className={`text-lg ${theme === 'dark' ? 'text-cyan-400' : 'text-cyan-700'} block font-black`}>100%</b>
                <span className="text-xs text-slate-500 uppercase tracking-wider font-bold">Hands-On</span>
              </div>
            </div>
          </section>

          <div ref={cardsContainerRef} className="space-y-16">
            {DATA.map((mod, mi) => {
              const filteredTopics = mod.topics.filter(t => 
                t.t.toLowerCase().includes(search.toLowerCase()) || 
                t.body.toLowerCase().includes(search.toLowerCase())
              );

              if (filteredTopics.length === 0) return null;

              return (
                <section key={mod.id} id={mod.id} className="scroll-mt-24">
                  <div className="flex items-center gap-3.5 mb-2">
                    <span className={`text-xs font-mono border py-1 px-3.5 rounded-full uppercase tracking-wider font-semibold ${
                      theme === 'dark' ? 'bg-[#111827] border-slate-800 text-slate-300' : 'bg-slate-100 border-slate-300 text-slate-600'
                    }`}>
                      Module {mi+1}
                    </span>
                  </div>
                  <h2 className={`text-3xl font-black mb-2 tracking-tight ${theme === 'dark' ? 'text-white' : 'text-slate-950'}`}>{mod.title}</h2>
                  <p className="text-slate-400 text-base sm:text-lg mb-6 max-w-2xl leading-relaxed">{mod.desc}</p>

                  <div className="grid gap-5">
                    {filteredTopics.map((topic, ti) => {
                      const topicId = `${mod.id}-t${ti}`;
                      const isActive = activeAnchor === topicId;
                      return (
                        <article 
                          key={ti} 
                          id={topicId}
                          ref={el => topicRefs.current[topicId] = el}
                          className={`topic-article-card border rounded-2xl p-6 sm:p-7 scroll-mt-24 transition-all duration-300 relative overflow-hidden group ${
                            isActive
                              ? `ring-1 ${theme === 'dark' ? 'ring-cyan-500 border-cyan-500/30' : 'ring-cyan-600 border-cyan-600/30'}`
                              : theme === 'dark' ? 'bg-[#0f172a] border-slate-800 hover:border-slate-700' : 'bg-white border-[#cbd5e1] hover:border-slate-400 hover:shadow-sm'
                          }`}
                        >
                          <h3 className={`text-lg font-extrabold flex items-center gap-2.5 mb-3.5 ${
                            theme === 'dark' ? 'text-white' : 'text-slate-900'
                          }`}>
                            <span className={`text-xs font-mono ${theme === 'dark' ? 'bg-slate-800 text-cyan-400' : 'bg-slate-100 text-cyan-700'} px-2 py-0.5 rounded`}>
                              {String(mi+1).padStart(2,'0')}.{ti+1}
                            </span>
                            {topic.t}
                          </h3>
                          <p className="text-slate-400 text-base sm:text-lg leading-relaxed mb-4">{topic.body}</p>

                          {topic.example && (
                            <div className={`my-4 p-4 rounded-xl border-l-[4px] ${
                              theme === 'dark' 
                                ? 'border-blue-400 bg-blue-950/20 text-blue-300' 
                                : 'border-blue-500 bg-blue-50 text-blue-900'
                            }`}>
                              <b className={`uppercase tracking-wide mr-1 text-xs ${theme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`}>Example:</b>
                              <span className="text-sm leading-relaxed">{topic.example}</span>
                            </div>
                          )}

                          {topic.list && (
                            <ul className="space-y-3 mt-4 pl-1">
                              {topic.list.map((li, idx) => (
                                <li key={idx} className="relative pl-5 text-sm text-slate-400 leading-relaxed">
                                  <span className={`absolute left-0 ${theme === 'dark' ? 'text-cyan-400' : 'text-cyan-700'} font-bold`}>▶</span>
                                  {li}
                                </li>
                              ))}
                            </ul>
                          )}

                          {topic.callout && (
                            <div className={`mt-5 p-4 rounded-xl border-l-[4px] text-sm leading-relaxed ${
                              theme === 'dark'
                                ? 'border-cyan-400 bg-cyan-950/20 text-cyan-300'
                                : 'border-cyan-500 bg-cyan-50 text-cyan-900'
                            }`}>
                              <b className={`uppercase tracking-wide mr-1 text-xs ${theme === 'dark' ? 'text-cyan-400' : 'text-cyan-600'}`}>Pro-Tip:</b>
                              {topic.callout}
                            </div>
                          )}
                        </article>
                      );
                    })}
                  </div>
                </section>
              );
            })}
          </div>

          <footer className="text-center mt-20 text-sm text-slate-500 tracking-wide border-t border-slate-800/30 pt-8">
            Built with extreme care · Stay Secure & Watch out for anomalous vectors · CyberLearn © 2026
          </footer>
        </main>
      </div>

      <button 
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        className={`fixed bottom-8 right-8 w-14 h-14 rounded-full ${theme === 'dark' ? 'bg-cyan-400 hover:bg-cyan-500 shadow-[0_0_15px_rgba(34,211,238,0.4)]' : 'bg-cyan-600 hover:bg-cyan-700 shadow-[0_0_15px_rgba(8,145,178,0.3)]'} text-slate-950 flex items-center justify-center font-black text-2xl hover:-translate-y-1 cursor-pointer transition-all duration-300 z-[99] ${
          showScrollTop ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-6 scale-90 pointer-events-none'
        }`}
      >
        ↑
      </button>
    </div>
  );
}
