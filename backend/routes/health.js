import express from 'express';
import { requireAuth } from '../middleware/auth.js';
import HealthProfile from '../models/HealthProfile.js';

const router = express.Router();

// GET — current user's health profile (or patient if hospital with access)
router.get('/', requireAuth, async (req, res) => {
  try {
    const userId = req.query.user_id || req.user.userId;
    const profile = await HealthProfile.findOne({ user_id: userId }).lean();
    if (!profile) return res.json(null);
    res.json({
      ...profile,
      id: profile._id.toString(),
      user_id: profile.user_id?.toString(),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT — upsert health profile (patient only for own)
router.put('/', requireAuth, async (req, res) => {
  try {
    const { age, gender, blood_group, conditions, allergies, notes } = req.body;
    const profile = await HealthProfile.findOneAndUpdate(
      { user_id: req.user.userId },
      { age: age ?? null, gender: gender ?? null, blood_group: blood_group ?? null, conditions: conditions ?? null, allergies: allergies ?? null, notes: notes ?? null },
      { new: true, upsert: true }
    );
    res.json(profile.toJSON());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
