import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { History, AlertTriangle, CheckCircle, Clock, MapPin, Loader2 } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

interface FallEvent {
  id: string;
  timestamp: string;
  is_emergency: boolean;
  resolved: boolean;
  resolved_at: string | null;
  latitude: number | null;
  longitude: number | null;
  notes: string | null;
}

export default function FallHistory() {
  const { user } = useAuth();
  const [events, setEvents] = useState<FallEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'emergency' | 'false_alarm'>('all');

  useEffect(() => {
    if (!user?.id) return;
    fetchEvents();
  }, [user?.id]);

  const fetchEvents = async () => {
    if (!user?.id) return;

    const { data, error } = await supabase
      .from('fall_events')
      .select('*')
      .eq('user_id', user.id)
      .order('timestamp', { ascending: false });

    if (!error && data) {
      setEvents(data);
    }
    setLoading(false);
  };

  const filteredEvents = events.filter((event) => {
    if (filter === 'emergency') return event.is_emergency;
    if (filter === 'false_alarm') return !event.is_emergency && event.resolved;
    return true;
  });

  const stats = {
    total: events.length,
    emergencies: events.filter((e) => e.is_emergency).length,
    falseAlarms: events.filter((e) => !e.is_emergency && e.resolved).length,
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
          <h1 className="page-title">Fall History</h1>
          <p className="page-subtitle">View your chronological fall detection timeline</p>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-3">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card p-6"
          >
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                <History className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-3xl font-bold text-foreground">{stats.total}</p>
                <p className="text-sm text-muted-foreground">Total Falls</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="glass-card p-6"
          >
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-danger/10">
                <AlertTriangle className="h-6 w-6 text-danger" />
              </div>
              <div>
                <p className="text-3xl font-bold text-foreground">{stats.emergencies}</p>
                <p className="text-sm text-muted-foreground">Emergencies</p>
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
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-success/10">
                <CheckCircle className="h-6 w-6 text-success" />
              </div>
              <div>
                <p className="text-3xl font-bold text-foreground">{stats.falseAlarms}</p>
                <p className="text-sm text-muted-foreground">False Alarms</p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Filters */}
        <div className="flex gap-2">
          {[
            { key: 'all', label: 'All Events' },
            { key: 'emergency', label: 'Emergencies' },
            { key: 'false_alarm', label: 'False Alarms' },
          ].map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key as typeof filter)}
              className={cn(
                'rounded-lg px-4 py-2 text-sm font-medium transition-all',
                filter === f.key
                  ? 'bg-primary text-primary-foreground'
                  : 'glass-card text-muted-foreground hover:text-foreground'
              )}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Timeline */}
        {filteredEvents.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card flex flex-col items-center justify-center py-16"
          >
            <History className="mb-4 h-12 w-12 text-muted-foreground" />
            <h3 className="mb-2 text-lg font-medium text-foreground">No Fall Events</h3>
            <p className="text-muted-foreground">
              {filter === 'all' 
                ? 'No fall events have been recorded yet' 
                : `No ${filter === 'emergency' ? 'emergencies' : 'false alarms'} recorded`}
            </p>
          </motion.div>
        ) : (
          <div className="relative">
            {/* Timeline Line */}
            <div className="absolute left-6 top-0 h-full w-0.5 bg-border" />

            {/* Events */}
            <div className="space-y-6">
              {filteredEvents.map((event, index) => {
                const date = new Date(event.timestamp);
                const isEmergency = event.is_emergency;

                return (
                  <motion.div
                    key={event.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="relative flex gap-6 pl-12"
                  >
                    {/* Timeline Dot */}
                    <div
                      className={cn(
                        'absolute left-4 top-2 h-5 w-5 rounded-full border-4',
                        isEmergency
                          ? 'border-danger bg-danger/20'
                          : 'border-success bg-success/20'
                      )}
                    />

                    {/* Event Card */}
                    <div className={cn(
                      'glass-card flex-1 p-6',
                      isEmergency ? 'border-danger/20' : 'border-success/20'
                    )}>
                      <div className="mb-4 flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          {isEmergency ? (
                            <div className="status-emergency">
                              <AlertTriangle className="h-4 w-4" />
                              Emergency
                            </div>
                          ) : (
                            <div className="status-safe">
                              <CheckCircle className="h-4 w-4" />
                              False Alarm
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Clock className="h-4 w-4" />
                          {date.toLocaleTimeString()}
                        </div>
                      </div>

                      <p className="mb-2 text-sm font-medium text-foreground">
                        {date.toLocaleDateString('en-US', { 
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>

                      {event.latitude && event.longitude && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <MapPin className="h-4 w-4" />
                          <span>
                            {event.latitude.toFixed(4)}, {event.longitude.toFixed(4)}
                          </span>
                        </div>
                      )}

                      {event.resolved && event.resolved_at && (
                        <p className="mt-3 text-xs text-muted-foreground">
                          Resolved: {new Date(event.resolved_at).toLocaleString()}
                        </p>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
