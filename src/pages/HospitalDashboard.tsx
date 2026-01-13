import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  User, 
  MapPin, 
  Heart, 
  Loader2,
  Phone,
  Activity,
  Navigation
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface ActiveEmergency {
  id: string;
  user_id: string;
  timestamp: string;
  latitude: number | null;
  longitude: number | null;
  patient_name: string;
  patient_email: string;
  health_profile?: {
    age: number | null;
    blood_group: string | null;
    conditions: string | null;
    allergies: string | null;
  };
}

export default function HospitalDashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [emergencies, setEmergencies] = useState<ActiveEmergency[]>([]);
  const [acknowledgedIds, setAcknowledgedIds] = useState<Set<string>>(new Set());
  const [resolvingId, setResolvingId] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.id) return;
    fetchEmergencies();

    // Subscribe to real-time updates
    const channel = supabase
      .channel('hospital_emergencies')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'fall_events',
        },
        () => fetchEmergencies()
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [user?.id]);

  const fetchEmergencies = async () => {
    if (!user?.id) return;

    // Fetch active emergencies only (hospital can only see via RLS if emergency is active)
    const { data: events, error } = await supabase
      .from('fall_events')
      .select('*')
      .eq('is_emergency', true)
      .eq('resolved', false)
      .order('timestamp', { ascending: false });

    if (error) {
      console.error('Error fetching emergencies:', error);
      setLoading(false);
      return;
    }

    // For each emergency, fetch patient profile
    const enrichedEmergencies: ActiveEmergency[] = [];
    
    for (const event of events || []) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('name, email')
        .eq('user_id', event.user_id)
        .maybeSingle();

      const { data: healthProfile } = await supabase
        .from('health_profiles')
        .select('age, blood_group, conditions, allergies')
        .eq('user_id', event.user_id)
        .maybeSingle();

      if (profile) {
        enrichedEmergencies.push({
          id: event.id,
          user_id: event.user_id,
          timestamp: event.timestamp,
          latitude: event.latitude,
          longitude: event.longitude,
          patient_name: profile.name,
          patient_email: profile.email,
          health_profile: healthProfile || undefined,
        });
      }
    }

    setEmergencies(enrichedEmergencies);
    setLoading(false);
  };

  const getTimeSince = (timestamp: string) => {
    const diff = Date.now() - new Date(timestamp).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) return `${hours}h ${minutes % 60}m ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
  };

  const handleAcknowledge = async (emergencyId: string) => {
    setAcknowledgedIds((prev) => new Set([...prev, emergencyId]));
    toast.success('Emergency acknowledged. Dispatching help...');
  };

  const handleResolve = async (emergencyId: string, patientUserId: string) => {
    if (!user?.id) return;

    setResolvingId(emergencyId);

    const { error } = await supabase
      .from('fall_events')
      .update({
        resolved: true,
        resolved_at: new Date().toISOString(),
        resolved_by: user.id,
      })
      .eq('id', emergencyId);

    if (error) {
      toast.error('Failed to resolve emergency');
    } else {
      // Create notification for patient
      await supabase.from('notifications').insert({
        user_id: patientUserId,
        type: 'resolved',
        title: 'Emergency Resolved',
        message: 'Your emergency has been resolved by the hospital. Stay safe!',
        related_event_id: emergencyId,
      });

      toast.success('Emergency resolved successfully');
      fetchEmergencies();
    }

    setResolvingId(null);
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="page-header">
          <h1 className="page-title">Emergency Response Center</h1>
          <p className="page-subtitle">Monitor and respond to active patient emergencies</p>
        </div>

        {/* Emergency Count Banner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn(
            'glass-card flex items-center justify-between p-6',
            emergencies.length > 0 && 'border-danger/30 bg-danger/5'
          )}
        >
          <div className="flex items-center gap-4">
            <div className={cn(
              'flex h-14 w-14 items-center justify-center rounded-xl',
              emergencies.length > 0 ? 'bg-danger/10' : 'bg-success/10'
            )}>
              {emergencies.length > 0 ? (
                <AlertTriangle className="h-7 w-7 animate-pulse text-danger" />
              ) : (
                <Activity className="h-7 w-7 text-success" />
              )}
            </div>
            <div>
              <p className="text-4xl font-bold text-foreground">{emergencies.length}</p>
              <p className="text-muted-foreground">
                {emergencies.length === 1 ? 'Active Emergency' : 'Active Emergencies'}
              </p>
            </div>
          </div>
          {emergencies.length > 0 && (
            <Link
              to="/hospital-map"
              className="flex items-center gap-2 rounded-lg bg-primary/10 px-4 py-2 font-medium text-primary transition-colors hover:bg-primary/20"
            >
              <Navigation className="h-4 w-4" />
              View on Map
            </Link>
          )}
        </motion.div>

        {/* Active Emergencies List */}
        <div>
          <h2 className="mb-4 text-lg font-semibold text-foreground">Emergency Patients</h2>
          
          {emergencies.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card flex flex-col items-center justify-center py-20"
            >
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-success/10">
                <CheckCircle className="h-8 w-8 text-success" />
              </div>
              <h3 className="mb-2 text-xl font-semibold text-foreground">All Clear</h3>
              <p className="text-muted-foreground">No active emergencies at this time</p>
              <p className="mt-4 text-sm text-muted-foreground">
                You will be notified immediately when a patient needs help
              </p>
            </motion.div>
          ) : (
            <div className="space-y-4">
              {emergencies.map((emergency, index) => (
                <motion.div
                  key={emergency.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={cn(
                    'glass-card overflow-hidden',
                    acknowledgedIds.has(emergency.id) 
                      ? 'border-warning/30 bg-warning/5' 
                      : 'border-danger/30 bg-danger/5'
                  )}
                >
                  {/* Emergency Header */}
                  <div className="flex flex-wrap items-start justify-between gap-4 p-6">
                    <div className="flex items-start gap-4">
                      <div className={cn(
                        'flex h-14 w-14 items-center justify-center rounded-full',
                        acknowledgedIds.has(emergency.id) ? 'bg-warning/10' : 'bg-danger/10'
                      )}>
                        <AlertTriangle className={cn(
                          'h-7 w-7',
                          acknowledgedIds.has(emergency.id) 
                            ? 'text-warning' 
                            : 'animate-pulse text-danger'
                        )} />
                      </div>
                      <div>
                        <div className="flex items-center gap-3">
                          <h3 className="text-xl font-semibold text-foreground">
                            {emergency.patient_name}
                          </h3>
                          <span className={cn(
                            'rounded-full px-2 py-0.5 text-xs font-medium',
                            acknowledgedIds.has(emergency.id)
                              ? 'bg-warning/20 text-warning'
                              : 'bg-danger/20 text-danger'
                          )}>
                            {acknowledgedIds.has(emergency.id) ? 'ACKNOWLEDGED' : 'EMERGENCY'}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">{emergency.patient_email}</p>
                        <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {getTimeSince(emergency.timestamp)}
                          </span>
                          {emergency.latitude && emergency.longitude && (
                            <span className="flex items-center gap-1">
                              <MapPin className="h-4 w-4" />
                              {emergency.latitude.toFixed(4)}, {emergency.longitude.toFixed(4)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                      {!acknowledgedIds.has(emergency.id) && (
                        <button
                          onClick={() => handleAcknowledge(emergency.id)}
                          className="flex items-center gap-2 rounded-lg bg-warning/10 px-4 py-2 text-sm font-medium text-warning transition-colors hover:bg-warning/20"
                        >
                          <Phone className="h-4 w-4" />
                          Acknowledge
                        </button>
                      )}
                      <button
                        onClick={() => handleResolve(emergency.id, emergency.user_id)}
                        disabled={resolvingId === emergency.id}
                        className="flex items-center gap-2 rounded-lg bg-success px-4 py-2 text-sm font-medium text-success-foreground transition-colors hover:bg-success/90 disabled:opacity-50"
                      >
                        {resolvingId === emergency.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <CheckCircle className="h-4 w-4" />
                        )}
                        Resolve
                      </button>
                    </div>
                  </div>

                  {/* Health Profile - Critical Info Only */}
                  {emergency.health_profile && (
                    <div className="grid grid-cols-2 gap-4 border-t border-border/50 bg-card/30 p-4 md:grid-cols-4">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">
                          Age: <span className="font-semibold text-foreground">
                            {emergency.health_profile.age || 'N/A'}
                          </span>
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Heart className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">
                          Blood: <span className="font-semibold text-foreground">
                            {emergency.health_profile.blood_group || 'N/A'}
                          </span>
                        </span>
                      </div>
                      {emergency.health_profile.conditions && (
                        <div className="col-span-2 flex items-start gap-2">
                          <AlertTriangle className="mt-0.5 h-4 w-4 text-warning" />
                          <span className="text-sm">
                            <span className="text-muted-foreground">Conditions: </span>
                            <span className="font-semibold text-foreground">
                              {emergency.health_profile.conditions}
                            </span>
                          </span>
                        </div>
                      )}
                      {emergency.health_profile.allergies && (
                        <div className="col-span-2 flex items-start gap-2">
                          <AlertTriangle className="mt-0.5 h-4 w-4 text-danger" />
                          <span className="text-sm">
                            <span className="text-muted-foreground">Allergies: </span>
                            <span className="font-semibold text-danger">
                              {emergency.health_profile.allergies}
                            </span>
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Quick Map Preview */}
                  {emergency.latitude && emergency.longitude && (
                    <div className="border-t border-border/50 p-4">
                      <Link
                        to="/hospital-map"
                        className="flex items-center justify-center gap-2 rounded-lg bg-primary/10 py-3 text-sm font-medium text-primary transition-colors hover:bg-primary/20"
                      >
                        <Navigation className="h-4 w-4" />
                        View Live Location on Map
                      </Link>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
