import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import connectDB from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import chatbotRoutes from './routes/chatbotRoutes.js';
import learningRoutes from './routes/learningRoutes.js';
import newsRoutes from './routes/newsRoutes.js';
import { warmUp } from './services/news/newsCache.js';

dotenv.config();
connectDB();

const app = express();

// CORS: unchanged default (open, as before). Set CORS_ORIGINS to a
// comma-separated allow-list in production to restrict browser origins.
const allowedOrigins = (process.env.CORS_ORIGINS || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);
app.use(cors(allowedOrigins.length ? { origin: allowedOrigins } : {}));

// Needed for correct client IPs in rate limiting when running behind a proxy
// (Render/Railway/Nginx). Express only trusts the first hop.
app.set('trust proxy', Number.parseInt(process.env.TRUST_PROXY_HOPS || '1', 10));

app.use(express.json({ limit: '256kb' }));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/chatbot', chatbotRoutes);
app.use('/api/learning', learningRoutes);
app.use('/api/news', newsRoutes);

// Health check
app.get('/api/health', (req, res) => {
  const hasOpenRouterKey = Boolean(process.env.OPENROUTER_API_KEY);
  const keyValidFormat = hasOpenRouterKey && process.env.OPENROUTER_API_KEY.startsWith('sk-or-');
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    services: {
      database: 'check /api/news for indirect status',
      chatbot: {
        configured: hasOpenRouterKey,
        keyFormatValid: keyValidFormat,
        model: process.env.CHATBOT_MODEL || 'openrouter/free',
        fallbackEnabled: process.env.CHATBOT_ENABLE_LOCAL_FALLBACK !== 'off',
      },
      news: { enabled: true },
    },
  });
});

const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📊 Health: http://localhost:${PORT}/api/health`);

  // Log chatbot configuration status
  if (!process.env.OPENROUTER_API_KEY) {
    console.warn('⚠️  OPENROUTER_API_KEY not set - chatbot will run in offline fallback mode');
  } else if (!process.env.OPENROUTER_API_KEY.startsWith('sk-or-')) {
    console.warn('⚠️  OPENROUTER_API_KEY format looks invalid (should start with sk-or-) - chatbot may fail with "User not found"');
  } else {
    console.log(`🤖 Chatbot model: ${process.env.CHATBOT_MODEL || 'openrouter/free'} (fallbacks enabled)`);
  }

  // Warm the news cache in the background so the first visitor sees articles
  // instead of a skeleton. Set NEWS_WARM_ON_START=off to disable.
  if (process.env.NEWS_WARM_ON_START !== 'off' && process.env.NODE_ENV !== 'test') {
    warmUp().catch((error) => console.warn(`[news] warm-up skipped: ${error?.message || error}`));
  }
});

export default server;
