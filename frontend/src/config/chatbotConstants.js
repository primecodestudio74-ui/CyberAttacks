// Shared constants for the Chatbot feature. Centralised so components,
// hooks, and the service layer never hardcode these values.

export const CHAT_HISTORY_STORAGE_KEY = 'hackaware_chatbot_history_v1';
export const CHAT_MAX_INPUT_LENGTH = 4000;

export const FALLBACK_SUGGESTED_PROMPTS = [
  'What is Phishing?',
  'Explain SQL Injection',
  'Password Security Tips',
  'Latest Cyber Threats',
  'Linux Security Basics',
  'Cloud Security',
  'Zero Trust Architecture',
  'Cyber Security Career Roadmap',
];

export const WELCOME_MESSAGE = {
  role: 'assistant',
  content:
    "Hey, I'm **Ask Me** — Your Cyber Security assistant.\n\nAsk me about ethical hacking, networking, malware, secure coding, cloud security, or anything else in the cyber security space. Try one of the prompts below to get started...",
};
