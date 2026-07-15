import jwt from 'jsonwebtoken';

// Auth middleware for learning endpoints.
// Verifies JWT using existing token generation in authController.js.
// Token sources:
// - Authorization: Bearer <token>
// - req.body.token
// - req.query.token
export default function authRequired(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    const bearerToken = authHeader && authHeader.startsWith('Bearer ')
      ? authHeader.slice('Bearer '.length)
      : null;

    const token =
      bearerToken ||
      req.body?.token ||
      req.query?.token ||
      null;

    if (!token) return res.status(401).json({ message: 'Missing token' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Our generateToken stores payload: { id }
    req.user = { id: decoded.id };

    return next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
}

