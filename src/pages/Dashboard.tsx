import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { 
  Activity, 
  AlertTriangle, 
  Phone, 
  Heart, 
  History, 
  Map, 
  Smartphone,
  TrendingUp,
  MapPin
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { SensorGraph } from '@/components/dashboard/SensorGraph';
import { StatusCard } from '@/components/dashboard/StatusCard';
import { EmergencyOverlay } from '@/components/dashboard/EmergencyOverlay';
import { useSensorSimulation } from '@/hooks/useSensorSimulation';
import { useGeolocation } from '@/hooks/useGeolocation';
import { useAuth } from '@/contexts/AuthContext';
import { falleventsApi, sensordataApi } from '@/lib/api';
import { toast } from 'sonner';

const FALL_ACCEL_THRESHOLD = 50;     // m/s²
const FALL_ROTATION_THRESHOLD = 500; // deg/sec
const FALL_COOLDOWN_MS = 15000;      // 10 seconds

export default function Dashboard() {
  const { user } = useAuth();
  const { sensorData, simulateFall, isFalling } = useSensorSimulation();
  const { latitude, longitude, requestPermission, permissionDenied } = useGeolocation({ autoRequest: true });

  const [showEmergency, setShowEmergency] = useState(false);
  const [currentEventId, setCurrentEventId] = useState<string | null>(null);

  const lastFallTimeRef = useRef(0);

  const [stats, setStats] = useState({
    totalFalls: 0,
    emergencies: 0,
    falseAlarms: 0,
    lastActivity: null as Date | null,
  });

  /* ---------------- FETCH STATS ---------------- */
  useEffect(() => {
    if (!user) return;

    const fetchStats = async () => {
      const { data: events } = await falleventsApi.list();
      if (events && events.length > 0) {
        const list = events as Array<{ timestamp: string; is_emergency?: boolean; resolved?: boolean }>;
        setStats({
          totalFalls: list.length,
          emergencies: list.filter(e => e.is_emergency).length,
          falseAlarms: list.filter(e => !e.is_emergency && e.resolved).length,
          lastActivity: list.length ? new Date(list[list.length - 1].timestamp) : null,
        });
      }
    };

    fetchStats();
  }, [user, showEmergency]);

  /* ---------------- FALL HANDLER (USED BY BUTTON + AUTO) ---------------- */
  const handleSimulateFall = async () => {
    if (!user) return;

    simulateFall();

    // Use real browser location when available; otherwise fixed fallback (no random)
    const FALLBACK_LAT = 28.6139;
    const FALLBACK_LNG = 77.209;
    const eventLatitude = latitude ?? FALLBACK_LAT;
    const eventLongitude = longitude ?? FALLBACK_LNG;

    const { data, error } = await falleventsApi.create({
      latitude: eventLatitude,
      longitude: eventLongitude,
      is_emergency: false,
    });

    if (error || !data) {
      toast.error('Error creating fall event');
      return;
    }

    const eventId = (data as { id?: string }).id;
    setCurrentEventId(eventId ?? null);

    await sensordataApi.create({
      accelerometer_x: sensorData.accelerometer.x,
      accelerometer_y: sensorData.accelerometer.y,
      accelerometer_z: sensorData.accelerometer.z,
      gyroscope_x: sensorData.gyroscope.x,
      gyroscope_y: sensorData.gyroscope.y,
      gyroscope_z: sensorData.gyroscope.z,
    });

    setTimeout(() => setShowEmergency(true), 500);
  };

  /* ---------------- AUTOMATIC FALL DETECTION ---------------- */
  useEffect(() => {
    if (!user) return;

    const onMotion = (e: DeviceMotionEvent) => {
      const now = Date.now();
      if (now - lastFallTimeRef.current < FALL_COOLDOWN_MS) return;

      // Accelerometer spike
      if (e.accelerationIncludingGravity) {
        const { x = 0, y = 0, z = 0 } = e.accelerationIncludingGravity;
        const magnitude = Math.sqrt(x*x + y*y + z*z);

        if (magnitude > FALL_ACCEL_THRESHOLD) {
          lastFallTimeRef.current = now;
          handleSimulateFall();
          return;
        }
      }

      // Gyroscope spike
      if (e.rotationRate) {
        const { alpha = 0, beta = 0, gamma = 0 } = e.rotationRate;
        const rotation = Math.abs(alpha) + Math.abs(beta) + Math.abs(gamma);

        if (rotation > FALL_ROTATION_THRESHOLD) {
          lastFallTimeRef.current = now;
          handleSimulateFall();
        }
      }
    };

    if (
      typeof DeviceMotionEvent !== 'undefined' &&
      typeof (DeviceMotionEvent as any).requestPermission === 'function'
    ) {
      (DeviceMotionEvent as any).requestPermission().then((res: string) => {
        if (res === 'granted') {
          window.addEventListener('devicemotion', onMotion);
        }
      });
    } else {
      window.addEventListener('devicemotion', onMotion);
    }

    return () => window.removeEventListener('devicemotion', onMotion);
  }, [user]);

  /* ---------------- UI ---------------- */
  return (
    <AppLayout>
      <div className="space-y-8">

        {permissionDenied && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3 rounded-lg border border-warning/30 bg-warning/10 p-4"
          >
            <MapPin className="h-5 w-5 shrink-0 text-warning" />
            <p className="text-sm text-warning">
              Location access denied. Using last known or simulated coordinates.
            </p>
            <button onClick={requestPermission} className="btn-gradient shrink-0 text-sm">
              Enable Location
            </button>
          </motion.div>
        )}

        <StatusCard
          status={isFalling ? 'warning' : 'safe'}
          title={isFalling ? 'Fall Detected' : 'All Clear'}
          description={isFalling ? 'Processing fall detection...' : 'Your safety monitoring is active'}
        />

        <motion.button
          onClick={handleSimulateFall}
          disabled={isFalling}
          className="btn-danger w-full py-6 text-xl disabled:opacity-50"
        >
          <AlertTriangle className="mr-3 inline h-6 w-6" />
          Simulate Fall Detection
        </motion.button>

        <div className="grid gap-4 md:grid-cols-2">
          <SensorGraph icon={Activity} label="Accelerometer" sensor="accelerometer" />
          <SensorGraph icon={Smartphone} label="Gyroscope" sensor="gyroscope" />
        </div>
      </div>

      <EmergencyOverlay
        isOpen={showEmergency}
        onClose={() => setShowEmergency(false)}
        eventId={currentEventId || undefined}
      />
    </AppLayout>
  );
}
