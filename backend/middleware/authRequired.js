import jwt from 'jsonwebtoken';
import User from '../models/User.js';

// Auth middleware for learning and chatbot endpoints.
// Verifies JWT using existing token generation in authController.js.
// Token sources:
// - Authorization: Bearer <token>
// - req.body.token
// - req.query.token
export default async function authRequired(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    const bearerToken =
      authHeader && authHeader.startsWith('Bearer ')
        ? authHeader.slice('Bearer '.length)
        : null;

    const token =
      bearerToken ||
      req.body?.token ||
      req.query?.token ||
      null;

    if (!token) {
      return res.status(401).json({
        message: 'Authentication required. Please login again.',
        code: 'MISSING_TOKEN',
      });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (jwtErr) {
      return res.status(401).json({
        message: 'Session expired or invalid. Please login again.',
        code: 'INVALID_TOKEN',
      });
    }

    // Our generateToken stores payload: { id }
    if (!decoded.id) {
      return res.status(401).json({
        message: 'Invalid session. Please login again.',
        code: 'INVALID_TOKEN_PAYLOAD',
      });
    }

    // Optional DB check: if user no longer exists, treat as expired session
    // rather than leaking "User not found" which confuses chatbot error handling
    try {
      if (User && typeof User.findById === 'function') {
        const userExists = await User.findById(decoded.id).select('_id').lean();
        if (!userExists) {
          return res.status(401).json({
            message: 'Session expired, account not found. Please login again.',
            code: 'USER_NOT_FOUND',
          });
        }
      }
    } catch (dbErr) {
      // If DB check fails (e.g., no connection), don't block auth - just log
      // and continue with token-based auth. This prevents DB issues from
      // breaking chatbot when Mongo is down.
      console.warn('[auth] DB user check failed, falling back to token-only auth:', dbErr.message);
    }

    req.user = { id: decoded.id };

    return next();
  } catch (err) {
    console.error('[auth] Unexpected auth error:', err.message);
    return res.status(401).json({
      message: 'Authentication failed. Please login again.',
      code: 'AUTH_FAILED',
    });
  }
}
