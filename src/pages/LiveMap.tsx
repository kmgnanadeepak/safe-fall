import { useState, useEffect, useMemo } from "react";
import { useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { AlertTriangle, Loader2, MapPin, Navigation, AlertCircle } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useAuth } from "@/contexts/AuthContext";
import { useGeolocation } from "@/hooks/useGeolocation";
import { falleventsApi } from "@/lib/api";
import { LeafletMap, type MapMarker } from "@/components/map/LeafletMap";

interface EmergencyLocation {
  id: string;
  user_id: string;
  latitude: number;
  longitude: number;
  timestamp: string;
  is_emergency: boolean;
  patient_name?: string;
}

/** State passed when navigating from Hospital Dashboard "View Live Location on Map" */
interface LiveMapLocationState {
  focusLat?: number;
  focusLng?: number;
  focusPatientId?: string;
  focusPatientName?: string;
}

export default function LiveMap() {
  const { user, role } = useAuth();
  const location = useLocation();
  const focusFromState = (location.state as LiveMapLocationState | null) ?? {};
  const {
    latitude: geoLat,
    longitude: geoLng,
    loading: geoLoading,
    error: geoError,
    permissionDenied,
    requestPermission,
  } = useGeolocation({ autoRequest: true });

  const [loading, setLoading] = useState(true);
  const [emergencyLocations, setEmergencyLocations] = useState<EmergencyLocation[]>([]);
  const [hasActiveEmergency, setHasActiveEmergency] = useState(false);

  /* ---------------- FETCH LOCATIONS ---------------- */

  useEffect(() => {
    if (!user?.id) return;
    fetchLocations();
    const interval = setInterval(fetchLocations, 10000);
    return () => clearInterval(interval);
  }, [user?.id, role]);

  const fetchLocations = async () => {
    if (!user?.id) return;

    if (role === "hospital") {
      const { data } = await falleventsApi.listHospitalDashboard();
      if (data && data.length > 0) {
        const enriched: EmergencyLocation[] = (data as Array<Record<string, unknown>>).map(
          (e: Record<string, unknown>) => ({
            id: String(e.id),
            user_id: String(e.user_id),
            latitude: Number(e.latitude),
            longitude: Number(e.longitude),
            timestamp: String(e.timestamp),
            is_emergency: true,
            patient_name: String((e as { patient_name?: string }).patient_name || "Unknown Patient"),
          })
        );
        setEmergencyLocations(enriched);
        setHasActiveEmergency(true);
      } else {
        setEmergencyLocations([]);
        setHasActiveEmergency(false);
      }
    } else {
      const { data } = await falleventsApi.list();
      const list = (data || []) as Array<{
        id: string;
        user_id: string;
        latitude?: number;
        longitude?: number;
        timestamp: string;
        is_emergency?: boolean;
        resolved?: boolean;
      }>;
      const unresolved = list.filter((e) => e.is_emergency && !e.resolved);
      const latest = unresolved[0];
      if (latest && latest.latitude != null && latest.longitude != null) {
        setEmergencyLocations([
          {
            id: latest.id,
            user_id: latest.user_id,
            latitude: latest.latitude,
            longitude: latest.longitude,
            timestamp: latest.timestamp,
            is_emergency: true,
          },
        ]);
        setHasActiveEmergency(true);
      } else {
        setEmergencyLocations([]);
        setHasActiveEmergency(false);
      }
    }

    setLoading(false);
  };

  /* -------- UPDATE PATIENT LOCATION DURING EMERGENCY -------- */

  useEffect(() => {
    if (
      role === "patient" &&
      hasActiveEmergency &&
      geoLat &&
      geoLng &&
      emergencyLocations[0]
    ) {
      falleventsApi.update(emergencyLocations[0].id, { latitude: geoLat, longitude: geoLng });
    }
  }, [geoLat, geoLng, hasActiveEmergency, role, emergencyLocations]);

  // When opened from a patient card ("View Live Location on Map"), center on that patient's coords
  const mapCenter: [number, number] = useMemo(() => {
    const focusLat = focusFromState.focusLat;
    const focusLng = focusFromState.focusLng;
    if (focusLat != null && focusLng != null && !Number.isNaN(focusLat) && !Number.isNaN(focusLng)) {
      return [focusLat, focusLng];
    }
    const lat = emergencyLocations[0]?.latitude ?? geoLat ?? 28.6139;
    const lng = emergencyLocations[0]?.longitude ?? geoLng ?? 77.209;
    return [lat, lng];
  }, [
    focusFromState.focusLat,
    focusFromState.focusLng,
    emergencyLocations[0]?.latitude,
    emergencyLocations[0]?.longitude,
    geoLat,
    geoLng,
  ]);

  const markers: MapMarker[] = useMemo(() => {
    const list: MapMarker[] = [];
    const focusLat = focusFromState.focusLat;
    const focusLng = focusFromState.focusLng;
    const hasFocus = focusLat != null && focusLng != null && !Number.isNaN(focusLat) && !Number.isNaN(focusLng);
    // When opened from "View Live Location" on a patient card, ensure that patient's marker is shown
    if (hasFocus) {
      list.push({
        id: focusFromState.focusPatientId ?? "focus",
        lat: focusLat,
        lng: focusLng,
        label: focusFromState.focusPatientName ?? "Selected patient",
        isEmergency: true,
      });
    }
    if (geoLat != null && geoLng != null && !hasActiveEmergency) {
      list.push({
        id: "current",
        lat: geoLat,
        lng: geoLng,
        label: "Your location",
        isEmergency: false,
      });
    }
    emergencyLocations.forEach((loc) => {
      if (hasFocus && focusFromState.focusPatientId === loc.id) return; // already added as focus
      list.push({
        id: loc.id,
        lat: loc.latitude,
        lng: loc.longitude,
        label: loc.patient_name || "Emergency",
        isEmergency: true,
      });
    });
    return list;
  }, [geoLat, geoLng, hasActiveEmergency, emergencyLocations, focusFromState.focusLat, focusFromState.focusLng, focusFromState.focusPatientId, focusFromState.focusPatientName]);

  if (loading) {
    return (
      <AppLayout>
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="page-header">
          <h1 className="page-title">Live Map</h1>
          <p className="page-subtitle">
            {role === "hospital"
              ? "Track patient locations during active emergencies"
              : "Your location tracking during emergencies"}
          </p>
        </div>

        {/* Permission denied: show exact message and retry option */}
        {permissionDenied && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3 rounded-lg border border-warning/30 bg-warning/10 p-4"
          >
            <AlertCircle className="text-warning shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="font-medium text-warning">Location access denied.</p>
              <p className="text-sm text-muted-foreground">
                Using last known or simulated coordinates.
              </p>
            </div>
            <button onClick={requestPermission} className="btn-gradient shrink-0">
              Enable Location
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
            <AlertTriangle className="animate-pulse text-danger" />
            <div>
              <p className="font-medium text-danger">
                {role === "hospital"
                  ? `${emergencyLocations.length} Active Emergencies`
                  : "Active Emergency"}
              </p>
              <p className="text-sm text-muted-foreground">Live location sharing enabled</p>
            </div>
          </motion.div>
        )}

        {/* OpenStreetMap + Leaflet Map */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-2">
          <LeafletMap
            center={mapCenter}
            markers={markers}
            height={450}
            zoom={15}
            className="w-full"
          />
          {/* Real-time latitude and longitude below the map */}
          <div className="rounded-lg border border-border/50 bg-muted/30 px-4 py-2 text-center text-sm text-muted-foreground">
            {geoLat != null && geoLng != null ? (
              <>
                <span className="font-medium text-foreground">Current coordinates: </span>
                Latitude {geoLat.toFixed(6)}, Longitude {geoLng.toFixed(6)}
                <span className="ml-2 text-xs text-success">● Live</span>
              </>
            ) : permissionDenied ? (
              <>
                <span className="font-medium text-foreground">Display coordinates: </span>
                Latitude {mapCenter[0].toFixed(6)}, Longitude {mapCenter[1].toFixed(6)}
                <span className="ml-2 text-xs text-warning">● Fallback</span>
              </>
            ) : (
              <>
                <span className="font-medium text-foreground">Coordinates: </span>
                {geoLoading ? "Requesting location..." : "—"}
              </>
            )}
          </div>
        </motion.div>

        {/* Location Info Cards */}
        <div className="grid gap-4 md:grid-cols-2">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card p-6"
          >
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-info/10">
                <Navigation className="text-info" />
              </div>
              <div>
                <h3 className="font-semibold">Current Location</h3>
                {geoLat != null && geoLng != null ? (
                  <>
                    <p className="text-sm">
                      Lat: {geoLat.toFixed(6)}, Lng: {geoLng.toFixed(6)}
                    </p>
                    <p className="text-xs text-success">● Live tracking active</p>
                  </>
                ) : (
                  <p className="text-sm">
                    {geoLoading ? "Fetching location..." : "Location unavailable"}
                  </p>
                )}
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card p-6"
          >
            <div className="flex items-center gap-4">
              <div
                className={`flex h-12 w-12 items-center justify-center rounded-xl ${
                  hasActiveEmergency ? "bg-danger/10" : "bg-muted"
                }`}
              >
                <MapPin
                  className={hasActiveEmergency ? "text-danger" : "text-muted-foreground"}
                />
              </div>
              <div>
                <h3 className="font-semibold">
                  {role === "hospital" ? "Emergency Patients" : "Emergency Location"}
                </h3>
                {hasActiveEmergency ? (
                  <>
                    <p className="text-sm">
                      {role === "hospital"
                        ? `${emergencyLocations.length} patient(s) need assistance`
                        : `Lat: ${emergencyLocations[0].latitude.toFixed(6)}, Lng: ${emergencyLocations[0].longitude.toFixed(6)}`}
                    </p>
                    <p className="text-xs text-danger">● Emergency active</p>
                  </>
                ) : (
                  <p className="text-sm">No active emergency</p>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </AppLayout>
  );
}
