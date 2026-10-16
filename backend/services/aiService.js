// Uses OpenRouter (https://openrouter.ai) which exposes an OpenAI-compatible
// /chat/completions endpoint and hosts several free-tier models. We call it
// with the built-in fetch (Node 18+) so no extra SDK dependency is needed.
import {
  CHATBOT_MODEL,
  CHATBOT_FALLBACK_MODELS,
  CHATBOT_MAX_TOKENS,
  CHATBOT_SYSTEM_PROMPT,
  CHATBOT_ENABLE_LOCAL_FALLBACK,
  LOCAL_KNOWLEDGE_BASE,
  OFF_TOPIC_REPLY,
} from '../config/chatbotConfig.js';

const OPENROUTER_ENDPOINT = 'https://openrouter.ai/api/v1/chat/completions';

const assertConfigured = () => {
  if (!process.env.OPENROUTER_API_KEY) {
    const err = new Error('AI_NOT_CONFIGURED');
    err.code = 'AI_NOT_CONFIGURED';
    throw err;
  }
  // Basic format check - OpenRouter keys start with sk-or-v1-
  const key = process.env.OPENROUTER_API_KEY.trim();
  if (key.length < 20 || !key.startsWith('sk-or-')) {
    const err = new Error('Invalid OpenRouter API key format');
    err.code = 'AI_AUTH_FAILED';
    err.status = 401;
    throw err;
  }
};

/**
 * Simple keyword-based local fallback for when AI is unavailable.
 * This ensures chatbot never returns "User not found" or 502.
 */
export const getLocalFallbackResponse = (userMessage) => {
  if (!CHATBOT_ENABLE_LOCAL_FALLBACK) return null;
  if (!userMessage || typeof userMessage !== 'string') return null;

  const lower = userMessage.toLowerCase();

  // Off-topic detection - quick local check
  const offTopicKeywords = [
    'movie',
    'politics',
    'relationship',
    'cooking',
    'recipe',
    'sports score',
    'weather',
    'joke',
    'astrology',
  ];
  // Only trigger off-topic if message is very short and clearly off-topic
  // and doesn't contain any cyber keywords
  const cyberKeywords = [
    'security',
    'hack',
    'phish',
    'sql',
    'xss',
    'csrf',
    'password',
    'encrypt',
    'network',
    'cloud',
    'linux',
    'malware',
    'vulnerability',
    'owasp',
    'firewall',
    'ids',
    'ips',
    'zero trust',
    'career',
    'threat',
  ];
  const hasCyber = cyberKeywords.some((k) => lower.includes(k));
  const isClearlyOffTopic = offTopicKeywords.some((k) => lower.includes(k)) && !hasCyber && lower.split(' ').length < 8;
  if (isClearlyOffTopic) {
    return OFF_TOPIC_REPLY;
  }

  // Find best matching local knowledge
  let bestMatch = null;
  let bestScore = 0;
  for (const entry of LOCAL_KNOWLEDGE_BASE) {
    let score = 0;
    for (const kw of entry.keywords) {
      if (lower.includes(kw.toLowerCase())) {
        // Longer keyword = more specific = higher score
        score += kw.length;
      }
    }
    if (score > bestScore) {
      bestScore = score;
      bestMatch = entry;
    }
  }

  if (bestMatch && bestScore > 2) {
    return bestMatch.response;
  }

  // Generic fallback if no specific match
  if (hasCyber || lower.length > 5) {
    return `## Offline Mode - Basic Guidance

I'm currently running in **offline mode** (AI service temporarily unavailable), but I can still help with basics!

**Your question**: "${userMessage.slice(0, 200)}"

### General Cyber Security Principles
- **Think like an attacker, defend like a pro**: Understand how attacks work to build better defenses
- **Layered security**: No single control is enough - use defense in depth
- **Least privilege**: Give minimum access needed
- **Keep learning**: Check HackAware's **Learning Hub** and **Cyber News** for hands-on labs and real threat intel

### Try these topics I can answer offline:
- What is Phishing? / SQL Injection / XSS / OWASP Top 10
- Difference between IDS & IPS
- Password Security Tips
- Zero Trust Architecture
- Cloud / Linux Security Basics
- Cyber Security Career Roadmap

If you need detailed AI-powered answers, please try again in a moment or contact support if the issue persists.

> 💡 **Tip**: The AI service requires a valid OpenRouter API key. If you're the admin, check \`OPENROUTER_API_KEY\` in backend environment.`;
  }

  return null;
};

const callOpenRouter = async (model, messages) => {
  let response;
  try {
    response = await fetch(OPENROUTER_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        // Optional but recommended by OpenRouter for attribution/rate-limit tiers.
        'HTTP-Referer': process.env.OPENROUTER_SITE_URL || 'http://localhost:5173',
        'X-Title': 'HackAware Cyber Security Chatbot',
      },
      body: JSON.stringify({
        model,
        max_tokens: CHATBOT_MAX_TOKENS,
        messages,
      }),
    });
  } catch (networkErr) {
    const err = new Error(`Could not reach OpenRouter: ${networkErr.message}`);
    err.status = 502;
    err.code = 'AI_NETWORK_ERROR';
    throw err;
  }

  // Read as text first - OpenRouter (or an intermediary proxy/Cloudflare
  // page) can return HTML on auth failures, rate limits, or outages, and
  // calling response.json() directly on that throws an opaque
  // "Unexpected token '<'" instead of a useful message.
  const rawBody = await response.text();
  let parsedBody = null;
  try {
    parsedBody = rawBody ? JSON.parse(rawBody) : null;
  } catch {
    parsedBody = null;
  }

  if (!response.ok) {
    const rawMessage =
      parsedBody?.error?.message ||
      (parsedBody ? JSON.stringify(parsedBody) : null) ||
      `OpenRouter request failed (${response.status}): ${rawBody.slice(0, 300)}`;

    // Map common OpenRouter errors to specific codes
    const lowerMsg = rawMessage.toLowerCase();
    let code = 'AI_ERROR';
    if (response.status === 401 || lowerMsg.includes('user not found') || lowerMsg.includes('invalid api key') || lowerMsg.includes('unauthorized') || lowerMsg.includes('no auth')) {
      code = 'AI_AUTH_FAILED';
    } else if (response.status === 429 || lowerMsg.includes('rate limit') || lowerMsg.includes('too many requests')) {
      code = 'AI_RATE_LIMITED';
    } else if (response.status === 402 || lowerMsg.includes('payment required') || lowerMsg.includes('insufficient credits') || lowerMsg.includes('quota')) {
      code = 'AI_PAYMENT_REQUIRED';
    } else if (response.status === 404 || lowerMsg.includes('no endpoints') || lowerMsg.includes('model not found') || lowerMsg.includes('not a valid model')) {
      code = 'AI_MODEL_NOT_FOUND';
    }

    const err = new Error(rawMessage);
    err.status = response.status;
    err.code = code;
    err.rawBody = rawBody.slice(0, 500);
    throw err;
  }

  if (!parsedBody) {
    const err = new Error(
      `OpenRouter returned a non-JSON response (status ${response.status}): ${rawBody.slice(0, 200)}`
    );
    err.status = 502;
    err.code = 'AI_BAD_RESPONSE';
    throw err;
  }

  const content = parsedBody?.choices?.[0]?.message?.content?.trim() || '';
  return content;
};

/**
 * Send the running conversation to the model and get back the assistant's
 * reply text. Tries primary model then fallbacks.
 * @param {{role: 'user'|'assistant', content: string}[]} history
 * @returns {Promise<string>}
 */
export const getChatCompletion = async (history) => {
  assertConfigured();

  const messages = [{ role: 'system', content: CHATBOT_SYSTEM_PROMPT }, ...history];

  // Build list of models to try: primary + fallbacks, deduped
  const modelsToTry = [CHATBOT_MODEL, ...CHATBOT_FALLBACK_MODELS].filter(
    (v, i, a) => v && a.indexOf(v) === i
  );

  let lastError = null;

  for (let i = 0; i < modelsToTry.length; i++) {
    const model = modelsToTry[i];
    try {
      const result = await callOpenRouter(model, messages);
      if (result) return result;
      // If empty result but no error, continue to next model
      lastError = new Error('Empty response from model');
      lastError.code = 'AI_EMPTY_RESPONSE';
    } catch (err) {
      lastError = err;
      // Don't retry on auth failures - key is invalid for all models
      if (err.code === 'AI_AUTH_FAILED' || err.code === 'AI_NOT_CONFIGURED') {
        throw err;
      }
      // For model not found, rate limit, etc., try next model
      if (i < modelsToTry.length - 1) {
        console.warn(`[chatbot] Model ${model} failed (${err.code}): ${err.message}. Trying fallback...`);
        continue;
      }
      // Last model failed, throw
      throw err;
    }
  }

  // If all models failed and we have last error, throw it
  if (lastError) throw lastError;

  return '';
};

export default { getChatCompletion, getLocalFallbackResponse };
