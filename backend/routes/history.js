import express from 'express';
import { requireAuth } from '../middleware/auth.js';
import FallEvent from '../models/FallEvent.js';

const router = express.Router();
router.use(requireAuth);

// GET — fall history for current user (patient); same as fallevents list for patient
router.get('/', async (req, res) => {
  try {
    const events = await FallEvent.find({ user_id: req.user.userId })
      .sort({ timestamp: -1 })
      .lean();
    const withIds = events.map((e) => ({
      ...e,
      id: e._id.toString(),
      user_id: e.user_id?.toString(),
      resolved_by: e.resolved_by?.toString(),
    }));
    res.json(withIds);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
