import express from 'express';
import { requireAuth } from '../middleware/auth.js';
import SensorData from '../models/SensorData.js';

const router = express.Router();
router.use(requireAuth);

// POST — insert sensor reading (patient)
router.post('/', async (req, res) => {
  try {
    const { accelerometer_x, accelerometer_y, accelerometer_z, gyroscope_x, gyroscope_y, gyroscope_z } = req.body;
    const doc = await SensorData.create({
      user_id: req.user.userId,
      accelerometer_x: accelerometer_x ?? null,
      accelerometer_y: accelerometer_y ?? null,
      accelerometer_z: accelerometer_z ?? null,
      gyroscope_x: gyroscope_x ?? null,
      gyroscope_y: gyroscope_y ?? null,
      gyroscope_z: gyroscope_z ?? null,
    });
    res.status(201).json(doc.toJSON());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET — list (optional, for analytics)
router.get('/', async (req, res) => {
  try {
    const list = await SensorData.find({ user_id: req.user.userId }).sort({ timestamp: -1 }).limit(100).lean();
    const withIds = list.map((e) => ({ ...e, id: e._id.toString(), user_id: e.user_id?.toString() }));
    res.json(withIds);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
