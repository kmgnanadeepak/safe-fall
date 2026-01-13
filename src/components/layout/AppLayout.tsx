import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Activity, 
  Bell, 
  Heart, 
  History, 
  Home, 
  LogOut, 
  Map, 
  MessageSquare, 
  Phone, 
  Settings, 
  Shield,
  Users,
  BarChart3
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

interface AppLayoutProps {
  children: React.ReactNode;
}

const patientNavItems = [
  { icon: Home, label: 'Dashboard', path: '/dashboard' },
  { icon: Phone, label: 'Emergency Contacts', path: '/emergency-contacts' },
  { icon: Heart, label: 'Health Profile', path: '/health-profile' },
  { icon: History, label: 'Fall History', path: '/fall-history' },
  { icon: Map, label: 'Live Map', path: '/live-map' },
  { icon: MessageSquare, label: 'Analysis Chat', path: '/analysis-chat' },
  { icon: Settings, label: 'Settings', path: '/settings' },
];

const hospitalNavItems = [
  { icon: Home, label: 'Dashboard', path: '/hospital-dashboard' },
  { icon: Users, label: 'Patients', path: '/hospital-patients' },
  { icon: Map, label: 'Emergency Map', path: '/hospital-map' },
  { icon: BarChart3, label: 'Analytics', path: '/hospital-analytics' },
  { icon: MessageSquare, label: 'Analysis Chat', path: '/analysis-chat' },
  { icon: Settings, label: 'Settings', path: '/settings' },
];

export function AppLayout({ children }: AppLayoutProps) {
  const { user, role, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  
  const navItems = role === 'hospital' ? hospitalNavItems : patientNavItems;

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r border-border/50 bg-sidebar">
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex h-16 items-center gap-3 border-b border-border/50 px-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
              <Shield className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-foreground">SafeFall AI</h1>
              <p className="text-xs text-muted-foreground capitalize">{role || 'Patient'}</p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 overflow-y-auto p-4">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    'nav-link',
                    isActive && 'active'
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* User Section */}
          <div className="border-t border-border/50 p-4">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <span className="text-sm font-semibold text-primary">
                  {user?.email?.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1 truncate">
                <p className="truncate text-sm font-medium text-foreground">
                  {user?.email}
                </p>
                <p className="text-xs text-muted-foreground capitalize">{role}</p>
              </div>
            </div>
            <button
              onClick={handleSignOut}
              className="nav-link w-full hover:bg-destructive/10 hover:text-destructive"
            >
              <LogOut className="h-5 w-5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="ml-64 flex-1">
        {/* Top Bar */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border/50 bg-background/80 px-8 backdrop-blur-lg">
          <div className="flex items-center gap-4">
            <Activity className="h-5 w-5 text-success" />
            <span className="text-sm text-muted-foreground">System Active</span>
          </div>
          <div className="flex items-center gap-4">
            <NotificationBell />
          </div>
        </header>

        {/* Page Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
            className="p-8"
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}

function NotificationBell() {
  const [unreadCount, setUnreadCount] = React.useState(0);
  const { user } = useAuth();
  const navigate = useNavigate();

  React.useEffect(() => {
    if (!user?.id) return;

    let channel: ReturnType<typeof import('@/integrations/supabase/client').supabase.channel> | null = null;

    const fetchUnread = async () => {
      const { supabase } = await import('@/integrations/supabase/client');
      const { data } = await supabase
        .from('notifications')
        .select('id')
        .eq('user_id', user.id)
        .eq('read', false);
      
      setUnreadCount(data?.length ?? 0);
    };

    const setupSubscription = async () => {
      const { supabase } = await import('@/integrations/supabase/client');
      
      channel = supabase
        .channel(`notifications-${user.id}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${user.id}`,
          },
          () => fetchUnread()
        )
        .subscribe();
    };

    fetchUnread();
    setupSubscription();

    return () => {
      if (channel) {
        channel.unsubscribe();
      }
    };
  }, [user?.id]);

  if (!user) return null;

  return (
    <button 
      onClick={() => navigate('/notifications')}
      className="relative rounded-lg p-2 transition-colors hover:bg-muted"
    >
      <Bell className="h-5 w-5 text-muted-foreground" />
      {unreadCount > 0 && (
        <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
          {unreadCount > 9 ? '9+' : unreadCount}
        </span>
      )}
    </button>
  );
}
