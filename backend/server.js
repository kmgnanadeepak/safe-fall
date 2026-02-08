import 'dotenv/config';
import express from 'express';
import cors from 'cors';

import { connectDB } from './config/db.js';
import authRoutes from './routes/auth.js';
import usersRoutes from './routes/users.js';
import falleventsRoutes from './routes/fallevents.js';
import sensordataRoutes from './routes/sensordata.js';
import notificationsRoutes from './routes/notifications.js';
import healthRoutes from './routes/health.js';
import emergencyContactsRoutes from './routes/emergencyContacts.js';
import historyRoutes from './routes/history.js';
import analyticsRoutes from './routes/analytics.js';
import { runSeedIfEmpty } from './scripts/seed.js';

const PORT = process.env.PORT || 3001;
const app = express();

/* ---------- CORS CONFIG (PRODUCTION READY) ---------- */
const allowedOrigins = [
  "https://safefall-kmgd.vercel.app",
  "http://localhost:5173"
];

app.use(cors({
  origin: function(origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) === -1) {
      return callback(new Error('CORS not allowed'), false);
    }
    return callback(null, true);
  },
  methods: ["GET","POST","PUT","PATCH","DELETE","OPTIONS"],
  allowedHeaders: ["Content-Type","Authorization"],
  credentials: true
}));

// Handle preflight requests
app.options('*', cors());

/* ---------- MIDDLEWARE ---------- */
app.use(express.json());

/* ---------- ROUTES ---------- */
app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/fallevents', falleventsRoutes);
app.use('/api/sensordata', sensordataRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/health', healthRoutes);
app.use('/api/emergency-contacts', emergencyContactsRoutes);
app.use('/api/history', historyRoutes);
app.use('/api/analytics', analyticsRoutes);

app.get('/api/health-check', (_, res) => res.json({ ok: true }));

/* ---------- DB ---------- */
await connectDB();
await runSeedIfEmpty();

/* ---------- START SERVER ---------- */
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
