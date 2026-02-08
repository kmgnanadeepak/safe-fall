import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-production';

export function signToken(payload, options = {}) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d', ...options });
}

export function verifyToken(token) {
  return jwt.verify(token, JWT_SECRET);
}

/** Require valid JWT. Sets req.user = { id, email, role }. */
export async function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: 'Unauthorized', message: 'Token required' });
  }

  try {
    const decoded = verifyToken(token);
    const user = await User.findById(decoded.userId).select('_id email name role');
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized', message: 'User not found' });
    }
    req.user = {
      id: user._id.toString(),
      userId: user._id,
      email: user.email,
      name: user.name,
      role: user.role,
    };
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Unauthorized', message: 'Invalid or expired token' });
  }
}

/** Optional: allow unauthenticated but attach user if token present */
export async function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token) {
    req.user = null;
    return next();
  }
  try {
    const decoded = verifyToken(token);
    const user = await User.findById(decoded.userId).select('_id email name role');
    req.user = user ? { id: user._id.toString(), userId: user._id, email: user.email, name: user.name, role: user.role } : null;
  } catch {
    req.user = null;
  }
  next();
}
