import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '../../.env') });

import User from '../models/User.js';
import FallEvent from '../models/FallEvent.js';
import SensorData from '../models/SensorData.js';
import Notification from '../models/Notification.js';
import HealthProfile from '../models/HealthProfile.js';
import EmergencyContact from '../models/EmergencyContact.js';
import { connectDB } from '../config/db.js';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/safefall';

export async function runSeedIfEmpty() {
  const count = await User.countDocuments();
  if (count > 0) {
    console.log('Database already has users, skipping seed.');
    return;
  }
  console.log('Seeding database...');
  await seed();
}

async function seed() {
  const demoPatient = await User.create({
    email: 'patient@demo.com',
    password: 'demo123',
    name: 'Demo Patient',
    role: 'patient',
  });

  const demoHospital = await User.create({
    email: 'hospital@demo.com',
    password: 'demo123',
    name: 'Demo Hospital',
    role: 'hospital',
  });

  await EmergencyContact.create([
    { user_id: demoPatient._id, name: 'Emergency Contact', relation: 'Spouse', phone: '+1234567890' },
  ]);

  await HealthProfile.create({
    user_id: demoPatient._id,
    age: 65,
    gender: 'Male',
    blood_group: 'O+',
    conditions: 'Hypertension',
    allergies: 'None',
    notes: 'Demo health profile',
  });

  const event1 = await FallEvent.create({
    user_id: demoPatient._id,
    timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    is_emergency: false,
    resolved: true,
    resolved_at: new Date(),
    latitude: 28.6139,
    longitude: 77.209,
  });

  await FallEvent.create({
    user_id: demoPatient._id,
    timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000),
    is_emergency: false,
    resolved: false,
    latitude: 28.614,
    longitude: 77.21,
  });

  await SensorData.create({
    user_id: demoPatient._id,
    accelerometer_x: 0.1,
    accelerometer_y: 0.2,
    accelerometer_z: 9.8,
    gyroscope_x: 0,
    gyroscope_y: 0,
    gyroscope_z: 0,
  });

  await Notification.create([
    { user_id: demoPatient._id, type: 'info', title: 'Welcome', message: 'Welcome to SafeFall Guardian.', read: false },
    { user_id: demoPatient._id, type: 'resolved', title: 'Fall Resolved', message: 'Your fall event was marked as false alarm.', read: true, related_event_id: event1._id },
  ]);

  console.log('Seed complete. Demo users: patient@demo.com / hospital@demo.com, password: demo123');
}

async function runStandalone() {
  await connectDB();
  await seed();
  process.exit(0);
}

if (process.argv[1]?.endsWith('seed.js')) {
  runStandalone().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
