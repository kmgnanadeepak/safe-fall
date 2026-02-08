import express from 'express';
import { requireAuth } from '../middleware/auth.js';
import FallEvent from '../models/FallEvent.js';
import User from '../models/User.js';
import { sendEmergencySmsForFallEvent } from '../services/emergencySms.js';

const router = express.Router();

// GET /hospital-dashboard — hospital only: active emergencies with patient name, email, health profile
router.get('/hospital-dashboard', requireAuth, async (req, res) => {
  try {
    if (req.user.role !== 'hospital') {
      return res.status(403).json({ error: 'Hospital only' });
    }
    const User = (await import('../models/User.js')).default;
    const HealthProfile = (await import('../models/HealthProfile.js')).default;
    const events = await FallEvent.find({ is_emergency: true, resolved: false })
      .sort({ timestamp: -1 })
      .lean();
    const enriched = [];
    for (const e of events) {
      const profile = await User.findById(e.user_id).select('name email').lean();
      const healthProfile = await HealthProfile.findOne({ user_id: e.user_id }).select('age blood_group conditions allergies').lean();
      enriched.push({
        id: e._id.toString(),
        user_id: e.user_id?.toString(),
        timestamp: e.timestamp,
        latitude: e.latitude,
        longitude: e.longitude,
        patient_name: profile?.name || 'Unknown',
        patient_email: profile?.email || '',
        health_profile: healthProfile
          ? { age: healthProfile.age, blood_group: healthProfile.blood_group, conditions: healthProfile.conditions, allergies: healthProfile.allergies }
          : undefined,
      });
    }
    res.json(enriched);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// List: patient sees own; hospital sees all active emergencies
router.get('/', requireAuth, async (req, res) => {
  try {
    const { role, userId } = req.user;
    let query = {};

    if (role === 'hospital') {
      query = { is_emergency: true, resolved: false };
    } else {
      query = { user_id: userId };
    }

    const events = await FallEvent.find(query)
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

// Create — patient only; after success, send emergency SMS to contacts (async, non-blocking)
router.post('/', requireAuth, async (req, res) => {
  try {
    if (req.user.role !== 'patient') {
      return res.status(403).json({ error: 'Only patients can create fall events' });
    }
    const { latitude, longitude, is_emergency } = req.body;
    const event = await FallEvent.create({
      user_id: req.user.userId,
      latitude: latitude ?? null,
      longitude: longitude ?? null,
      is_emergency: is_emergency ?? false,
    });
    const out = event.toJSON();
    // Send emergency SMS asynchronously (do not await); logs success/failure
    sendEmergencySmsForFallEvent(event).catch((err) => {
      console.error('[fallevents] Emergency SMS error:', err.message);
    });
    res.status(201).json(out);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update — mark emergency, resolve, or update location
router.patch('/:id', requireAuth, async (req, res) => {
  try {
    const event = await FallEvent.findById(req.params.id);
    if (!event) return res.status(404).json({ error: 'Event not found' });

    const isOwner = event.user_id.toString() === req.user.id;
    const isHospital = req.user.role === 'hospital';

    if (!isOwner && !isHospital) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const wasEmergency = event.is_emergency;
    if (req.body.is_emergency !== undefined) event.is_emergency = req.body.is_emergency;
    if (req.body.resolved !== undefined) event.resolved = req.body.resolved;
    if (req.body.resolved_at !== undefined) event.resolved_at = req.body.resolved_at;
    if (req.body.resolved_by !== undefined) event.resolved_by = req.body.resolved_by;
    if (req.body.latitude !== undefined) event.latitude = req.body.latitude;
    if (req.body.longitude !== undefined) event.longitude = req.body.longitude;
    if (req.body.notes !== undefined) event.notes = req.body.notes;

    await event.save();
    // When event is first marked as emergency (e.g. countdown expired), send SMS
    if (event.is_emergency && !wasEmergency) {
      sendEmergencySmsForFallEvent(event).catch((err) => {
        console.error('[fallevents] Emergency SMS error (PATCH):', err.message);
      });
    }
    res.json(event.toJSON());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET single (for hospital: need patient name)
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const event = await FallEvent.findById(req.params.id).lean();
    if (!event) return res.status(404).json({ error: 'Event not found' });
    const out = {
      ...event,
      id: event._id.toString(),
      user_id: event.user_id?.toString(),
      resolved_by: event.resolved_by?.toString(),
    };
    res.json(out);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
