import express from 'express';
import { requireAuth } from '../middleware/auth.js';
import User from '../models/User.js';

const router = express.Router();
router.use(requireAuth);

// GET /api/users/profile — get current user profile (name, email, role)
router.get('/profile', async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('name email role avatar_url');
    if (!user) return res.status(404).json({ error: 'User not found' });
    const u = user.toJSON();
    res.json({ id: u.id, name: u.name, email: u.email, role: u.role, avatar_url: u.avatar_url });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/users/:userId/name — for hospital dashboard patient names
router.get('/:userId/name', async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).select('name email');
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ name: user.name, email: user.email });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
