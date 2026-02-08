import express from 'express';
import { requireAuth } from '../middleware/auth.js';
import Notification from '../models/Notification.js';

const router = express.Router();
router.use(requireAuth);

// GET — list for current user
router.get('/', async (req, res) => {
  try {
    const list = await Notification.find({ user_id: req.user.userId })
      .sort({ created_at: -1 })
      .lean();
    const withIds = list.map((n) => ({
      ...n,
      id: n._id.toString(),
      user_id: n.user_id?.toString(),
      related_event_id: n.related_event_id?.toString(),
      created_at: n.createdAt || n.created_at,
    }));
    res.json(withIds);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /:id — mark as read
router.patch('/:id', async (req, res) => {
  try {
    const n = await Notification.findOneAndUpdate(
      { _id: req.params.id, user_id: req.user.userId },
      { read: true },
      { new: true }
    );
    if (!n) return res.status(404).json({ error: 'Not found' });
    res.json(n.toJSON());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH mark-all-read
router.patch('/mark-all-read', async (req, res) => {
  try {
    await Notification.updateMany({ user_id: req.user.userId, read: false }, { read: true });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST — create (used by backend when resolving emergency, etc.)
router.post('/', async (req, res) => {
  try {
    const { user_id, type, title, message, related_event_id } = req.body;
    const targetUserId = user_id || req.user.id;
    const doc = await Notification.create({
      user_id: targetUserId,
      type: type || 'info',
      title: title || 'Notification',
      message: message || '',
      related_event_id: related_event_id || null,
    });
    res.status(201).json(doc.toJSON());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET unread count (for bell in layout)
router.get('/unread-count', async (req, res) => {
  try {
    const count = await Notification.countDocuments({ user_id: req.user.userId, read: false });
    res.json({ count });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
