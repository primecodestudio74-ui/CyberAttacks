// Uses OpenRouter (https://openrouter.ai) which exposes an OpenAI-compatible
// /chat/completions endpoint and hosts several free-tier models. We call it
// with the built-in fetch (Node 18+) so no extra SDK dependency is needed.
import {
  CHATBOT_MODEL,
  CHATBOT_MAX_TOKENS,
  CHATBOT_SYSTEM_PROMPT,
} from '../config/chatbotConfig.js';

const OPENROUTER_ENDPOINT = 'https://openrouter.ai/api/v1/chat/completions';

const assertConfigured = () => {
  if (!process.env.OPENROUTER_API_KEY) {
    const err = new Error('AI_NOT_CONFIGURED');
    err.code = 'AI_NOT_CONFIGURED';
    throw err;
  }
};

/**
 * Send the running conversation to the model and get back the assistant's
 * reply text.
 * @param {{role: 'user'|'assistant', content: string}[]} history
 * @returns {Promise<string>}
 */
export const getChatCompletion = async (history) => {
  assertConfigured();

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
        model: CHATBOT_MODEL,
        max_tokens: CHATBOT_MAX_TOKENS,
        messages: [{ role: 'system', content: CHATBOT_SYSTEM_PROMPT }, ...history],
      }),
    });
  } catch (networkErr) {
    const err = new Error(`Could not reach OpenRouter: ${networkErr.message}`);
    err.status = 502;
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
    const message =
      parsedBody?.error?.message ||
      (parsedBody ? JSON.stringify(parsedBody) : null) ||
      `OpenRouter request failed (${response.status}): ${rawBody.slice(0, 200)}`;
    const err = new Error(message);
    err.status = response.status;
    throw err;
  }

  if (!parsedBody) {
    const err = new Error(
      `OpenRouter returned a non-JSON response (status ${response.status}): ${rawBody.slice(0, 200)}`
    );
    err.status = 502;
    throw err;
  }

  return parsedBody?.choices?.[0]?.message?.content?.trim() || '';
};

export default { getChatCompletion };
