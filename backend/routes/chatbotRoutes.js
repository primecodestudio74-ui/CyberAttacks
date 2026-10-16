import express from 'express';
import authRequired from '../middleware/authRequired.js';
import { createRateLimiter } from '../middleware/rateLimit.js';
import { getSuggestions, sendMessage } from '../controllers/chatbotController.js';

const router = express.Router();

// Rate limit chatbot to prevent abuse and protect OpenRouter quota
// 30 messages per minute per IP/user is generous for normal chat
const chatbotRateLimiter = createRateLimiter({
  windowMs: 60_000,
  max: 30,
  message: 'Too many chatbot requests. Please wait a moment and try again.',
});

const suggestionsRateLimiter = createRateLimiter({
  windowMs: 60_000,
  max: 60,
  message: 'Too many requests. Please slow down.',
});

router.get('/suggestions', authRequired, suggestionsRateLimiter, getSuggestions);
router.post('/message', authRequired, chatbotRateLimiter, sendMessage);

export default router;
