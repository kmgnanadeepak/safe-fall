import express from 'express';
import { requireAuth } from '../middleware/auth.js';
import EmergencyContact from '../models/EmergencyContact.js';

const router = express.Router();
router.use(requireAuth);

// GET — list for current user
router.get('/', async (req, res) => {
  try {
    const list = await EmergencyContact.find({ user_id: req.user.userId })
      .sort({ created_at: -1 })
      .lean();
    const withIds = list.map((c) => ({ ...c, id: c._id.toString(), user_id: c.user_id?.toString() }));
    res.json(withIds);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST — add
router.post('/', async (req, res) => {
  try {
    const { name, relation, phone } = req.body;
    if (!name || !relation || !phone) {
      return res.status(400).json({ error: 'Name, relation, and phone are required' });
    }
    const doc = await EmergencyContact.create({
      user_id: req.user.userId,
      name,
      relation,
      phone,
    });
    res.status(201).json(doc.toJSON());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /:id — update
router.put('/:id', async (req, res) => {
  try {
    const { name, relation, phone } = req.body;
    const doc = await EmergencyContact.findOneAndUpdate(
      { _id: req.params.id, user_id: req.user.userId },
      { ...(name !== undefined && { name }), ...(relation !== undefined && { relation }), ...(phone !== undefined && { phone }) },
      { new: true }
    );
    if (!doc) return res.status(404).json({ error: 'Not found' });
    res.json(doc.toJSON());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /:id
router.delete('/:id', async (req, res) => {
  try {
    const result = await EmergencyContact.findOneAndDelete({ _id: req.params.id, user_id: req.user.userId });
    if (!result) return res.status(404).json({ error: 'Not found' });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
