import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Map, AlertTriangle, Loader2, MapPin, Clock, Navigation, AlertCircle } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useGeolocation } from '@/hooks/useGeolocation';
import { supabase } from '@/integrations/supabase/client';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet marker icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Emergency marker icon
const emergencyIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

interface EmergencyLocation {
  id: string;
  user_id: string;
  latitude: number;
  longitude: number;
  timestamp: string;
  is_emergency: boolean;
  patient_name?: string;
}

function MapUpdater({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, 14);
  }, [center, map]);
  return null;
}

export default function LiveMap() {
  const { user, role } = useAuth();
  const { 
    latitude: geoLat, 
    longitude: geoLng, 
    loading: geoLoading, 
    error: geoError,
    permissionDenied,
    requestPermission 
  } = useGeolocation();
  
  const [loading, setLoading] = useState(true);
  const [emergencyLocations, setEmergencyLocations] = useState<EmergencyLocation[]>([]);
  const [hasActiveEmergency, setHasActiveEmergency] = useState(false);

  useEffect(() => {
    if (!user?.id) return;
    fetchLocations();

    // Subscribe to real-time updates
    const channel = supabase
      .channel('fall_events_location')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'fall_events',
        },
        () => fetchLocations()
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [user?.id, role]);

  const fetchLocations = async () => {
    if (!user?.id) return;

    if (role === 'hospital') {
      // Hospital: Fetch all active emergencies
      const { data: events } = await supabase
        .from('fall_events')
        .select('*')
        .eq('is_emergency', true)
        .eq('resolved', false)
        .not('latitude', 'is', null);

      if (events) {
        const enriched: EmergencyLocation[] = [];
        for (const event of events) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('name')
            .eq('user_id', event.user_id)
            .maybeSingle();

          if (event.latitude && event.longitude) {
            enriched.push({
              id: event.id,
              user_id: event.user_id,
              latitude: event.latitude,
              longitude: event.longitude,
              timestamp: event.timestamp,
              is_emergency: true,
              patient_name: profile?.name || 'Unknown Patient',
            });
          }
        }
        setEmergencyLocations(enriched);
        setHasActiveEmergency(enriched.length > 0);
      }
    } else {
      // Patient: Check for own active emergency
      const { data: activeEmergency } = await supabase
        .from('fall_events')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_emergency', true)
        .eq('resolved', false)
        .order('timestamp', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (activeEmergency && activeEmergency.latitude && activeEmergency.longitude) {
        setEmergencyLocations([{
          id: activeEmergency.id,
          user_id: activeEmergency.user_id,
          latitude: activeEmergency.latitude,
          longitude: activeEmergency.longitude,
          timestamp: activeEmergency.timestamp,
          is_emergency: true,
        }]);
        setHasActiveEmergency(true);
      } else {
        setEmergencyLocations([]);
        setHasActiveEmergency(false);
      }
    }

    setLoading(false);
  };

  // Update fall event with real location when available
  useEffect(() => {
    if (role === 'patient' && hasActiveEmergency && geoLat && geoLng && emergencyLocations[0]) {
      const updateLocation = async () => {
        await supabase
          .from('fall_events')
          .update({ latitude: geoLat, longitude: geoLng })
          .eq('id', emergencyLocations[0].id);
      };
      updateLocation();
    }
  }, [geoLat, geoLng, hasActiveEmergency, role, emergencyLocations]);

  if (loading) {
    return (
      <AppLayout>
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  // Determine map center
  const getMapCenter = (): [number, number] => {
    if (emergencyLocations.length > 0) {
      return [emergencyLocations[0].latitude, emergencyLocations[0].longitude];
    }
    if (geoLat && geoLng) {
      return [geoLat, geoLng];
    }
    return [28.6139, 77.2090]; // Default to Delhi
  };

  const mapCenter = getMapCenter();

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="page-header">
          <h1 className="page-title">Live Map</h1>
          <p className="page-subtitle">
            {role === 'hospital' 
              ? 'Track patient locations during active emergencies'
              : 'Your location tracking during emergencies'}
          </p>
        </div>

        {/* Location Permission Request */}
        {permissionDenied && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3 rounded-lg border border-warning/30 bg-warning/10 p-4"
          >
            <AlertCircle className="h-5 w-5 text-warning" />
            <div className="flex-1">
              <p className="font-medium text-warning">Location Permission Required</p>
              <p className="text-sm text-muted-foreground">
                {geoError || 'Please enable location access in your browser settings for accurate tracking.'}
              </p>
            </div>
            <button
              onClick={() => requestPermission()}
              className="rounded-lg bg-warning/20 px-4 py-2 text-sm font-medium text-warning hover:bg-warning/30"
            >
              Request Access
            </button>
          </motion.div>
        )}

        {/* Emergency Status */}
        {hasActiveEmergency && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3 rounded-lg border border-danger/30 bg-danger/10 p-4"
          >
            <AlertTriangle className="h-5 w-5 animate-pulse text-danger" />
            <div>
              <p className="font-medium text-danger">
                {role === 'hospital' 
                  ? `${emergencyLocations.length} Active ${emergencyLocations.length === 1 ? 'Emergency' : 'Emergencies'}`
                  : 'Active Emergency'}
              </p>
              <p className="text-sm text-muted-foreground">
                {role === 'hospital'
                  ? 'Patient locations are being tracked in real-time'
                  : 'Live location is being shared with emergency contacts and hospital'}
              </p>
            </div>
          </motion.div>
        )}

        {/* Map */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="map-container"
          style={{ height: '450px' }}
        >
          <MapContainer
            center={mapCenter}
            zoom={14}
            style={{ height: '100%', width: '100%' }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            
            {/* User's current location marker */}
            {geoLat && geoLng && !hasActiveEmergency && (
              <Marker position={[geoLat, geoLng]}>
                <Popup>
                  <div className="p-2">
                    <div className="mb-2 flex items-center gap-2">
                      <Navigation className="h-4 w-4 text-blue-500" />
                      <span className="font-semibold">Your Current Location</span>
                    </div>
                    <div className="text-sm text-gray-600">
                      {geoLat.toFixed(6)}, {geoLng.toFixed(6)}
                    </div>
                  </div>
                </Popup>
              </Marker>
            )}

            {/* Emergency location markers */}
            {emergencyLocations.map((location) => (
              <Marker 
                key={location.id} 
                position={[location.latitude, location.longitude]}
                icon={emergencyIcon}
              >
                <Popup>
                  <div className="p-2">
                    <div className="mb-2 flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-red-500" />
                      <span className="font-semibold">
                        {role === 'hospital' 
                          ? `Emergency: ${location.patient_name}`
                          : 'Your Emergency Location'}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-sm text-gray-600">
                      <Clock className="h-3 w-3" />
                      {new Date(location.timestamp).toLocaleString()}
                    </div>
                    <div className="mt-1 text-xs text-gray-500">
                      {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
                    </div>
                  </div>
                </Popup>
              </Marker>
            ))}
            
            <MapUpdater center={mapCenter} />
          </MapContainer>
        </motion.div>

        {/* Location Info Cards */}
        <div className="grid gap-4 md:grid-cols-2">
          {/* Current Location */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="glass-card p-6"
          >
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-info/10">
                <Navigation className="h-6 w-6 text-info" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Current Location</h3>
                {geoLat && geoLng ? (
                  <>
                    <p className="text-sm text-muted-foreground">
                      Lat: {geoLat.toFixed(6)}, Lng: {geoLng.toFixed(6)}
                    </p>
                    <p className="text-xs text-success">● Live tracking active</p>
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    {geoLoading ? 'Fetching location...' : 'Location unavailable'}
                  </p>
                )}
              </div>
            </div>
          </motion.div>

          {/* Emergency Location */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="glass-card p-6"
          >
            <div className="flex items-center gap-4">
              <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${
                hasActiveEmergency ? 'bg-danger/10' : 'bg-muted'
              }`}>
                <MapPin className={`h-6 w-6 ${hasActiveEmergency ? 'text-danger' : 'text-muted-foreground'}`} />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">
                  {role === 'hospital' ? 'Emergency Patients' : 'Emergency Location'}
                </h3>
                {hasActiveEmergency ? (
                  <>
                    <p className="text-sm text-muted-foreground">
                      {role === 'hospital' 
                        ? `${emergencyLocations.length} patient(s) need assistance`
                        : `Lat: ${emergencyLocations[0]?.latitude.toFixed(6)}, Lng: ${emergencyLocations[0]?.longitude.toFixed(6)}`}
                    </p>
                    <p className="text-xs text-danger">● Emergency active</p>
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">No active emergency</p>
                )}
              </div>
            </div>
          </motion.div>
        </div>

        {!hasActiveEmergency && !geoLat && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card flex flex-col items-center justify-center py-12"
          >
            <Map className="mb-4 h-12 w-12 text-muted-foreground" />
            <h3 className="mb-2 text-lg font-medium text-foreground">Enable Location Access</h3>
            <p className="mb-4 text-center text-muted-foreground">
              Allow location access to see your position on the map and enable emergency tracking
            </p>
            <button
              onClick={() => requestPermission()}
              className="btn-gradient"
            >
              Enable Location
            </button>
          </motion.div>
        )}
      </div>
    </AppLayout>
  );
}
