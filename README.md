# SafeFall

Fall detection and emergency response app with patient and hospital dashboards, live map, analytics, and notifications.

## Stack

- **Frontend**: Vite, React, TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Node.js, Express, MongoDB (Mongoose), JWT auth
- **No Supabase or Lovable Cloud** — fully self-hosted MERN backend

## Environment

### Root (frontend)

Create or update `.env` in the project root:

```env
VITE_API_BASE_URL=http://localhost:3001
```

Maps use OpenStreetMap + Leaflet (no API key required).

### Backend

Create `backend/.env`:

```env
MONGODB_URI=mongodb://localhost:27017/safefall
JWT_SECRET=your-super-secret-jwt-key-change-in-production
PORT=3001
```

For MongoDB Atlas, set `MONGODB_URI` to your Atlas connection string.

**Emergency SMS (Twilio):** To send fall-alert SMS with a clickable live location link, add to `backend/.env`:

```env
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=+1234567890
TWILIO_EMERGENCY_HOSPITAL_NUMBERS=+19876543210,+15551234567
```

SMS is sent to the patient’s emergency contacts and any numbers in `TWILIO_EMERGENCY_HOSPITAL_NUMBERS` (comma-separated) when a fall event is created or marked as emergency. The message includes a clickable OpenStreetMap live location link.

## Run with `npm run dev`

From the **project root**:

```bash
# Install root + backend dependencies (first time only)
npm install
cd backend && npm install && cd ..

# Start backend (Express on port 3001) and frontend (Vite on port 8080)
npm run dev
```

- **Backend**: http://localhost:3001  
- **Frontend**: http://localhost:8080  

If the database is empty, the backend seeds demo users on startup:

- **Patient**: `patient@demo.com` / `demo123`
- **Hospital**: `hospital@demo.com` / `demo123`

### Run backend and frontend separately

```bash
# Terminal 1 — backend
cd backend && npm run dev

# Terminal 2 — frontend (from root)
npm run dev:frontend
```

## Backend structure

```
backend/
├── config/
│   └── db.js              # MongoDB connection
├── middleware/
│   └── auth.js            # JWT sign/verify, requireAuth
├── models/
│   ├── User.js
│   ├── FallEvent.js
│   ├── SensorData.js
│   ├── Notification.js
│   ├── HealthProfile.js
│   └── EmergencyContact.js
├── lib/
│   └── locationLink.js    # Google Maps link helper
├── services/
│   ├── twilioService.js   # Twilio SMS send
│   └── emergencySms.js    # Fall-event SMS orchestration
├── routes/
│   ├── auth.js            # POST /login, /register, GET /me, POST /logout
│   ├── users.js           # GET /profile, /:userId/name
│   ├── fallevents.js      # CRUD + GET /hospital-dashboard (sends emergency SMS)
│   ├── sensordata.js
│   ├── notifications.js
│   ├── health.js
│   ├── emergencyContacts.js
│   ├── history.js
│   └── analytics.js
├── scripts/
│   └── seed.js            # Seed demo data (run if DB empty)
├── server.js
└── package.json
```

## API routes

| Path | Description |
|------|-------------|
| `POST /api/auth/register` | Register (email, password, name, role) |
| `POST /api/auth/login` | Login |
| `GET /api/auth/me` | Current user (JWT required) |
| `POST /api/auth/logout` | Logout (client discards token) |
| `GET/POST/PATCH /api/fallevents` | Fall events |
| `GET /api/fallevents/hospital-dashboard` | Hospital: active emergencies with patient info |
| `GET/POST /api/sensordata` | Sensor data |
| `GET/PATCH/POST /api/notifications` | Notifications |
| `GET/PUT /api/health` | Health profile |
| `GET/POST/PUT/DELETE /api/emergency-contacts` | Emergency contacts |
| `GET /api/history` | Fall history (current user) |
| `GET /api/analytics` | Analytics (current user) |

All protected routes expect header: `Authorization: Bearer <token>`.

## Maps

All maps use **OpenStreetMap** and **Leaflet** (no API key):

- Reusable component: `src/components/map/LeafletMap.tsx`
- Tile URL: `https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png`
- Used on: Live Map (patient and hospital dashboard tracking, emergency locations)
- Center and markers update when coordinates change (live location simulation)

## Technologies

- Vite, TypeScript, React, React Router
- Tailwind CSS, shadcn/ui, Framer Motion
- Leaflet, react-leaflet, OpenStreetMap
- Node.js, Express, Mongoose, JWT (jsonwebtoken), bcryptjs
- MongoDB / MongoDB Atlas
