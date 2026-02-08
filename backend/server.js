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

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

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

await connectDB();
await runSeedIfEmpty();

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
