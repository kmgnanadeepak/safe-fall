import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Bell, CheckCircle, AlertTriangle, Info, Loader2, Check, Trash2 } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  created_at: string;
  related_event_id: string | null;
}

const typeConfig: Record<string, { icon: typeof Bell; className: string }> = {
  emergency: { icon: AlertTriangle, className: 'text-danger bg-danger/10' },
  resolved: { icon: CheckCircle, className: 'text-success bg-success/10' },
  info: { icon: Info, className: 'text-info bg-info/10' },
  default: { icon: Bell, className: 'text-primary bg-primary/10' },
};

export default function Notifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  useEffect(() => {
    if (!user?.id) return;
    fetchNotifications();

    // Subscribe to real-time updates
    const channel = supabase
      .channel(`user_notifications_${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        () => fetchNotifications()
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [user?.id]);

  const fetchNotifications = async () => {
    if (!user?.id) return;

    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setNotifications(data);
    }
    setLoading(false);
  };

  const markAsRead = async (id: string) => {
    if (!user?.id) return;

    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', id)
      .eq('user_id', user.id);

    if (!error) {
      setNotifications(prev =>
        prev.map(n => n.id === id ? { ...n, read: true } : n)
      );
    }
  };

  const markAllAsRead = async () => {
    if (!user?.id) return;

    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', user.id)
      .eq('read', false);

    if (!error) {
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      toast.success('All notifications marked as read');
    }
  };

  const filteredNotifications = notifications.filter(n => 
    filter === 'all' ? true : !n.read
  );

  const unreadCount = notifications.filter(n => !n.read).length;

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
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="page-header">
            <h1 className="page-title">Notifications</h1>
            <p className="page-subtitle">
              {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}` : 'All caught up!'}
            </p>
          </div>
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="glass-card flex items-center gap-2 px-4 py-2 text-sm transition-colors hover:bg-primary/10 hover:text-primary"
            >
              <Check className="h-4 w-4" />
              Mark All Read
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="flex gap-2">
          {[
            { key: 'all', label: `All (${notifications.length})` },
            { key: 'unread', label: `Unread (${unreadCount})` },
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

        {/* Notifications List */}
        {filteredNotifications.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card flex flex-col items-center justify-center py-16"
          >
            <Bell className="mb-4 h-12 w-12 text-muted-foreground" />
            <h3 className="mb-2 text-lg font-medium text-foreground">
              {filter === 'unread' ? 'No Unread Notifications' : 'No Notifications'}
            </h3>
            <p className="text-muted-foreground">
              {filter === 'unread' 
                ? 'You\'re all caught up!' 
                : 'Notifications will appear here when events occur'}
            </p>
          </motion.div>
        ) : (
          <div className="space-y-3">
            {filteredNotifications.map((notification, index) => {
              const config = typeConfig[notification.type] || typeConfig.default;
              const Icon = config.icon;

              return (
                <motion.div
                  key={notification.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => !notification.read && markAsRead(notification.id)}
                  className={cn(
                    'glass-card cursor-pointer p-4 transition-all hover:border-primary/30',
                    !notification.read && 'border-l-4 border-l-primary bg-primary/5'
                  )}
                >
                  <div className="flex items-start gap-4">
                    <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-full', config.className)}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h3 className={cn(
                            'font-semibold',
                            notification.read ? 'text-foreground' : 'text-foreground'
                          )}>
                            {notification.title}
                          </h3>
                          <p className="mt-1 text-sm text-muted-foreground">
                            {notification.message}
                          </p>
                        </div>
                        {!notification.read && (
                          <div className="h-2 w-2 shrink-0 rounded-full bg-primary" />
                        )}
                      </div>
                      <p className="mt-2 text-xs text-muted-foreground">
                        {new Date(notification.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
