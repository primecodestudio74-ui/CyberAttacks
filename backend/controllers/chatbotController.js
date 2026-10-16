import { getChatCompletion } from '../services/aiService.js';
import {
  CHATBOT_MAX_HISTORY_MESSAGES,
  CHATBOT_MAX_MESSAGE_LENGTH,
  SUGGESTED_PROMPTS,
} from '../config/chatbotConfig.js';

// GET /api/chatbot/suggestions
export const getSuggestions = (req, res) => {
  res.json({ suggestions: SUGGESTED_PROMPTS });
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

    const reply = await getChatCompletion(conversation);

    return res.json({
      reply: reply || "I wasn't able to generate a response. Please try rephrasing your question.",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    if (error.code === 'AI_NOT_CONFIGURED') {
      return res.status(503).json({
        message:
          'The chatbot is not configured yet. Add an OPENROUTER_API_KEY to the backend environment to enable it.',
      });
    }

    console.error('Chatbot error:', error?.message || error);
    return res.status(502).json({
      message: `The assistant is temporarily unavailable. (${error?.message || 'Unknown error'})`,
    });
  }
};

export default { getSuggestions, sendMessage };
