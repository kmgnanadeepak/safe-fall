import express from 'express';
import { requireAuth } from '../middleware/auth.js';
import FallEvent from '../models/FallEvent.js';

const router = express.Router();
router.use(requireAuth);

// GET — analytics derived from fall_events for current user
router.get('/', async (req, res) => {
  try {
    const events = await FallEvent.find({ user_id: req.user.userId })
      .sort({ timestamp: -1 })
      .lean();

    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const lastWeekFalls = events.filter((e) => new Date(e.timestamp) >= oneWeekAgo).length;
    const totalWeeks = events.length > 0
      ? Math.max(1, Math.ceil((now - new Date(events[events.length - 1].timestamp)) / (7 * 24 * 60 * 60 * 1000)))
      : 1;

    res.json({
      totalFalls: events.length,
      emergencies: events.filter((e) => e.is_emergency).length,
      falseAlarms: events.filter((e) => !e.is_emergency && e.resolved).length,
      lastWeekFalls,
      avgFallsPerWeek: parseFloat((events.length / totalWeeks).toFixed(1)),
      mostRecentFall: events.length > 0 ? events[0].timestamp : null,
      events,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
