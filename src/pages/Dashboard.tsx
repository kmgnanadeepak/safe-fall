import { useState, useEffect } from 'react';
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
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export default function Dashboard() {
  const { user } = useAuth();
  const { sensorData, simulateFall, isFalling } = useSensorSimulation();
  const { latitude, longitude, requestPermission, permissionDenied, error: geoError } = useGeolocation();
  const [showEmergency, setShowEmergency] = useState(false);
  const [currentEventId, setCurrentEventId] = useState<string | null>(null);
  const [stats, setStats] = useState({
    totalFalls: 0,
    emergencies: 0,
    falseAlarms: 0,
    lastActivity: null as Date | null,
  });
  const [locationRequested, setLocationRequested] = useState(false);

  // Request location on mount
  useEffect(() => {
    if (!locationRequested) {
      requestPermission();
      setLocationRequested(true);
    }
  }, [requestPermission, locationRequested]);

  // Fetch stats
  useEffect(() => {
    if (!user) return;

    const fetchStats = async () => {
      const { data: events } = await supabase
        .from('fall_events')
        .select('*')
        .eq('user_id', user.id);

      if (events) {
        setStats({
          totalFalls: events.length,
          emergencies: events.filter(e => e.is_emergency).length,
          falseAlarms: events.filter(e => !e.is_emergency && e.resolved).length,
          lastActivity: events.length > 0 ? new Date(events[events.length - 1].timestamp) : null,
        });
      }
    };

    fetchStats();
  }, [user, showEmergency]);

  const handleSimulateFall = async () => {
    if (!user) return;

    simulateFall();

    // Use real location if available, otherwise simulate
    const eventLatitude = latitude ?? 28.6139 + (Math.random() - 0.5) * 0.1;
    const eventLongitude = longitude ?? 77.2090 + (Math.random() - 0.5) * 0.1;

    // Create fall event
    const { data, error } = await supabase
      .from('fall_events')
      .insert({
        user_id: user.id,
        latitude: eventLatitude,
        longitude: eventLongitude,
        is_emergency: false,
        resolved: false,
      })
      .select()
      .single();

    if (error) {
      toast.error('Error creating fall event');
      return;
    }

    setCurrentEventId(data.id);

    // Store sensor data
    await supabase.from('sensor_data').insert({
      user_id: user.id,
      accelerometer_x: sensorData.accelerometer.x,
      accelerometer_y: sensorData.accelerometer.y,
      accelerometer_z: sensorData.accelerometer.z,
      gyroscope_x: sensorData.gyroscope.x,
      gyroscope_y: sensorData.gyroscope.y,
      gyroscope_z: sensorData.gyroscope.z,
    });

    // Show emergency overlay after brief delay
    setTimeout(() => {
      setShowEmergency(true);
    }, 500);
  };

  const quickLinks = [
    { icon: Phone, label: 'Emergency Contacts', path: '/emergency-contacts', color: 'text-danger' },
    { icon: Heart, label: 'Health Profile', path: '/health-profile', color: 'text-success' },
    { icon: History, label: 'Fall History', path: '/fall-history', color: 'text-info' },
    { icon: Map, label: 'Live Map', path: '/live-map', color: 'text-warning' },
  ];

  return (
    <AppLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="page-header">
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Monitor your safety status in real-time</p>
        </div>

        {/* Location Warning */}
        {permissionDenied && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3 rounded-lg border border-warning/30 bg-warning/10 p-4"
          >
            <MapPin className="h-5 w-5 text-warning" />
            <div className="flex-1">
              <p className="font-medium text-warning">Location Access Denied</p>
              <p className="text-sm text-muted-foreground">
                Enable location access in your browser settings for accurate emergency tracking.
              </p>
            </div>
            <button
              onClick={() => requestPermission()}
              className="rounded-lg bg-warning/20 px-3 py-1 text-sm font-medium text-warning hover:bg-warning/30"
            >
              Retry
            </button>
          </motion.div>
        )}

        {/* Status */}
        <StatusCard
          status={isFalling ? 'warning' : 'safe'}
          title={isFalling ? 'Fall Detected' : 'All Clear'}
          description={isFalling ? 'Processing fall detection...' : 'Your safety monitoring is active'}
        />

        {/* Stats Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="glass-card p-6"
          >
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                <TrendingUp className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stats.totalFalls}</p>
                <p className="text-sm text-muted-foreground">Total Falls</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="glass-card p-6"
          >
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-danger/10">
                <AlertTriangle className="h-6 w-6 text-danger" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stats.emergencies}</p>
                <p className="text-sm text-muted-foreground">Emergencies</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="glass-card p-6"
          >
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-success/10">
                <Activity className="h-6 w-6 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stats.falseAlarms}</p>
                <p className="text-sm text-muted-foreground">False Alarms</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="glass-card p-6"
          >
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-info/10">
                <MapPin className="h-6 w-6 text-info" />
              </div>
              <div>
                <p className="text-xs font-medium text-foreground">
                  {latitude && longitude 
                    ? `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`
                    : 'Location unavailable'}
                </p>
                <p className="text-sm text-muted-foreground">Live Location</p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Simulate Fall Button */}
        <motion.button
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5 }}
          onClick={handleSimulateFall}
          disabled={isFalling}
          className="btn-danger w-full py-6 text-xl disabled:opacity-50"
        >
          <AlertTriangle className="mr-3 inline h-6 w-6" />
          Simulate Fall Detection
        </motion.button>

        {/* Real-time Sensor Graphs */}
        <div className="grid gap-4 md:grid-cols-2">
          <SensorGraph
            icon={Activity}
            label="Accelerometer"
            currentValues={sensorData.accelerometer}
            delay={0.6}
          />
          <SensorGraph
            icon={Smartphone}
            label="Gyroscope"
            currentValues={sensorData.gyroscope}
            delay={0.7}
          />
        </div>

        {/* Quick Links */}
        <div>
          <h2 className="mb-4 text-lg font-semibold text-foreground">Quick Access</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {quickLinks.map((link, index) => (
              <motion.div
                key={link.path}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 + index * 0.1 }}
              >
                <Link
                  to={link.path}
                  className="glass-card flex items-center gap-4 p-4 transition-all hover:border-primary/50"
                >
                  <div className={`flex h-10 w-10 items-center justify-center rounded-lg bg-card ${link.color}`}>
                    <link.icon className="h-5 w-5" />
                  </div>
                  <span className="font-medium text-foreground">{link.label}</span>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Emergency Overlay */}
      <EmergencyOverlay
        isOpen={showEmergency}
        onClose={() => setShowEmergency(false)}
        eventId={currentEventId || undefined}
      />
    </AppLayout>
  );
}
