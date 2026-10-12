/**
 * Public news routes.
 *
 *   GET  /api/news                 latest cyber news (filters, search, paging)
 *   GET  /api/news/sources         source registry + per-source health
 *   GET  /api/news/categories      category registry
 *   GET  /api/news/health          cache/provider diagnostics
 *   POST /api/news/refresh         manual refresh (strictly rate limited)
 *
 * These endpoints are deliberately unauthenticated: they serve public news
 * metadata and the rest of HackAware's authenticated surface is untouched.
 */

import express from 'express';
import { createRateLimiter } from '../middleware/rateLimit.js';
import {
  getHealth,
  listCategories,
  listNews,
  listSources,
  manualRefresh,
} from '../controllers/newsController.js';

const router = express.Router();

// Read endpoints: generous but bounded (60 requests / minute / IP).
const readLimiter = createRateLimiter({
  windowMs: 60_000,
  max: Number.parseInt(process.env.NEWS_RATE_LIMIT_PER_MINUTE || '60', 10),
  message: 'Too many news requests. Please wait a moment before trying again.',
});

// Refresh talks to publishers, so it is limited much more tightly.
const refreshLimiter = createRateLimiter({
  windowMs: 60_000,
  max: Number.parseInt(process.env.NEWS_REFRESH_RATE_LIMIT_PER_MINUTE || '6', 10),
  message: 'Refresh is rate limited to protect our news sources. Please try again in a minute.',
});

router.get('/', readLimiter, listNews);
router.get('/sources', readLimiter, listSources);
router.get('/categories', readLimiter, listCategories);
router.get('/health', readLimiter, getHealth);
router.post('/refresh', refreshLimiter, manualRefresh);

export default router;
