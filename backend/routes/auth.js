import express from 'express';
import User from '../models/User.js';
import { requireAuth, signToken } from '../middleware/auth.js';

const router = express.Router();

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { email, password, name, role } = req.body;
    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Email, password, and name are required' });
    }
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(400).json({ error: 'User already registered', message: 'User already registered with this email' });
    }
    const user = await User.create({
      email: email.toLowerCase(),
      password,
      name: name.trim(),
      role: role === 'hospital' ? 'hospital' : 'patient',
    });
    const token = signToken({ userId: user._id.toString() });
    const u = user.toJSON();
    res.status(201).json({
      user: { id: u.id, email: u.email, name: u.name, role: u.role },
      session: { access_token: token, expires_in: 604800 },
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Registration failed', message: err.message });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ error: 'Invalid credentials', message: 'Invalid email or password' });
    }
    const token = signToken({ userId: user._id.toString() });
    const u = user.toJSON();
    res.json({
      user: { id: u.id, email: u.email, name: u.name, role: u.role },
      session: { access_token: token, expires_in: 604800 },
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Login failed', message: err.message });
  }
});

// GET /api/auth/me — validate session and return current user + role
router.get('/me', requireAuth, async (req, res) => {
  res.json({
    user: {
      id: req.user.id,
      email: req.user.email,
      name: req.user.name,
      role: req.user.role,
    },
  });
});

// POST /api/auth/logout — client just discards token; no server state
router.post('/logout', (req, res) => {
  res.json({ ok: true });
});

export default router;
