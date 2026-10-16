import { getChatCompletion, getLocalFallbackResponse } from '../services/aiService.js';
import {
  CHATBOT_MAX_HISTORY_MESSAGES,
  CHATBOT_MAX_MESSAGE_LENGTH,
  SUGGESTED_PROMPTS,
  OFF_TOPIC_REPLY,
} from '../config/chatbotConfig.js';

// GET /api/chatbot/suggestions
export const getSuggestions = (req, res) => {
  res.json({ suggestions: SUGGESTED_PROMPTS });
};

// Simple off-topic detection to avoid wasting API calls
const isOffTopic = (message) => {
  const lower = message.toLowerCase();
  const cyberKeywords = [
    'security',
    'hack',
    'phish',
    'sql',
    'xss',
    'csrf',
    'ssrf',
    'password',
    'encrypt',
    'decrypt',
    'network',
    'firewall',
    'ids',
    'ips',
    'vpn',
    'malware',
    'virus',
    'ransomware',
    'trojan',
    'vulnerability',
    'cve',
    'owasp',
    'penetration',
    'pentest',
    'bug bounty',
    'ctf',
    'siem',
    'soc',
    'incident',
    'forensics',
    'cryptography',
    'hash',
    'jwt',
    'oauth',
    'authentication',
    'mfa',
    'linux',
    'windows',
    'cloud',
    'aws',
    'azure',
    'docker',
    'kubernetes',
    'devsecops',
    'secure coding',
    'api security',
    'zero trust',
    'career',
    'certification',
    'ceh',
    'cissp',
    'threat',
    'attack',
    'defense',
    'privacy',
    'compliance',
    'nist',
    'iso',
  ];

  // If contains any cyber keyword, it's in-scope
  if (cyberKeywords.some((k) => lower.includes(k))) return false;

  // Very short greetings are in-scope (let AI handle)
  if (/^(hi|hello|hey|help|thanks|thank you|good morning|good evening)/i.test(lower.trim()) && lower.trim().length < 20) {
    return false;
  }

  // List of clearly off-topic topics
  const offTopicPatterns = [
    'movie',
    'film',
    'actor',
    'actress',
    'politics',
    'election',
    'relationship',
    'dating',
    'cooking',
    'recipe',
    'sports score',
    'football match',
    'cricket',
    'weather',
    'joke',
    'astrology',
    'horoscope',
    'religion',
    'bible',
    'quran',
    'stock price',
    'crypto price',
    'medical advice',
    'diagnose',
  ];

  return offTopicPatterns.some((p) => lower.includes(p));
};

// POST /api/chatbot/message
// body: { message: string, history?: {role: 'user'|'assistant', content: string}[] }
export const sendMessage = async (req, res) => {
  try {
    const { message, history = [] } = req.body;

    if (typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({ message: 'A non-empty message is required.' });
    }

    if (message.length > CHATBOT_MAX_MESSAGE_LENGTH) {
      return res.status(400).json({
        message: `Message is too long. Please keep it under ${CHATBOT_MAX_MESSAGE_LENGTH} characters.`,
      });
    }

    if (!Array.isArray(history)) {
      return res.status(400).json({ message: 'History must be an array.' });
    }

    // Quick off-topic check to save API quota
    if (isOffTopic(message)) {
      return res.json({
        reply: OFF_TOPIC_REPLY,
        timestamp: new Date().toISOString(),
        source: 'local-filter',
      });
    }

    // Keep only well-formed prior turns, cap the window sent to the model.
    const sanitizedHistory = history
      .filter(
        (turn) =>
          turn &&
          (turn.role === 'user' || turn.role === 'assistant') &&
          typeof turn.content === 'string' &&
          turn.content.trim()
      )
      .slice(-CHATBOT_MAX_HISTORY_MESSAGES)
      .map((turn) => ({ role: turn.role, content: turn.content }));

    const conversation = [...sanitizedHistory, { role: 'user', content: message }];

    try {
      const reply = await getChatCompletion(conversation);

      return res.json({
        reply: reply || "I wasn't able to generate a response. Please try rephrasing your question.",
        timestamp: new Date().toISOString(),
        source: 'ai',
      });
    } catch (aiError) {
      // Try local fallback before giving up
      const fallback = getLocalFallbackResponse(message);
      if (fallback) {
        console.warn(`[chatbot] AI failed (${aiError.code}), serving local fallback`);
        return res.json({
          reply: fallback,
          timestamp: new Date().toISOString(),
          source: 'local-fallback',
          notice: 'Served from offline knowledge base due to temporary AI unavailability.',
        });
      }
      // Re-throw to outer catch for proper error mapping
      throw aiError;
    }
  } catch (error) {
    // Map known error codes to user-friendly responses
    if (error.code === 'AI_NOT_CONFIGURED') {
      // Try local fallback even when not configured
      const fallback = getLocalFallbackResponse(req.body?.message);
      if (fallback) {
        return res.json({
          reply: fallback,
          timestamp: new Date().toISOString(),
          source: 'local-fallback',
          notice: 'AI not configured - serving offline knowledge base.',
        });
      }
      return res.status(503).json({
        message: 'The chatbot is running in offline mode. AI is not configured yet. You can still get answers to common cyber security topics from our local knowledge base.',
        code: 'AI_NOT_CONFIGURED',
      });
    }

    if (error.code === 'AI_AUTH_FAILED') {
      const fallback = getLocalFallbackResponse(req.body?.message);
      if (fallback) {
        console.warn('[chatbot] Auth failed, serving local fallback');
        return res.json({
          reply: fallback,
          timestamp: new Date().toISOString(),
          source: 'local-fallback',
          notice: 'AI authentication issue - served from offline knowledge base.',
        });
      }
      console.error('Chatbot auth error:', error?.message);
      return res.status(503).json({
        message: 'Chatbot is temporarily running in offline mode due to an authentication issue. Please try again shortly or contact support if this persists.',
        code: 'AI_AUTH_FAILED',
      });
    }

    if (error.code === 'AI_RATE_LIMITED') {
      const fallback = getLocalFallbackResponse(req.body?.message);
      if (fallback) {
        return res.json({
          reply: fallback,
          timestamp: new Date().toISOString(),
          source: 'local-fallback',
          notice: 'Rate limit reached - served from offline knowledge base.',
        });
      }
      return res.status(429).json({
        message: 'The chatbot is receiving too many requests right now. Please wait a minute and try again.',
        code: 'RATE_LIMITED',
        retryAfter: 60,
      });
    }

    if (error.code === 'AI_PAYMENT_REQUIRED') {
      const fallback = getLocalFallbackResponse(req.body?.message);
      if (fallback) {
        return res.json({
          reply: fallback,
          timestamp: new Date().toISOString(),
          source: 'local-fallback',
        });
      }
      return res.status(503).json({
        message: 'Chatbot quota exceeded. Running in offline mode with limited knowledge base.',
        code: 'AI_PAYMENT_REQUIRED',
      });
    }

    // For any other AI error, try fallback first
    if (error.code && error.code.startsWith('AI_')) {
      const fallback = getLocalFallbackResponse(req.body?.message);
      if (fallback) {
        console.warn(`[chatbot] ${error.code} - serving fallback: ${error.message}`);
        return res.json({
          reply: fallback,
          timestamp: new Date().toISOString(),
          source: 'local-fallback',
        });
      }
    }

    console.error('Chatbot error:', error?.message || error);
    // Never expose raw "User not found" or internal errors to client
    const safeMessage = error.message && error.message.includes('User not found')
      ? 'Chatbot service is temporarily unavailable. Please try again in a moment.'
      : `The assistant is temporarily unavailable. Please try again.`;

    return res.status(502).json({
      message: safeMessage,
      code: 'AI_UNAVAILABLE',
    });
  }
};

export default { getSuggestions, sendMessage };
