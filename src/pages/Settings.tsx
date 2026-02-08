import { motion } from 'framer-motion';
import { 
  User, 
  Bell, 
  Shield, 
  Phone, 
  Heart,
  LogOut,
  ChevronRight,
  Moon,
  Sun
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { cn } from '@/lib/utils';

export default function Settings() {
  const { user, role, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const settingsSections = [
    {
      title: 'Account',
      items: [
        {
          icon: User,
          label: 'Profile',
          description: 'Manage your account information',
          path: '/health-profile',
        },
        {
          icon: Bell,
          label: 'Notifications',
          description: 'Configure notification preferences',
          path: '/notifications',
        },
      ],
    },
    {
      title: 'Safety',
      items: [
        {
          icon: Phone,
          label: 'Emergency Contacts',
          description: 'Manage emergency contact list',
          path: '/emergency-contacts',
        },
        {
          icon: Heart,
          label: 'Health Profile',
          description: 'Update medical information',
          path: '/health-profile',
        },
        {
          icon: Shield,
          label: 'Privacy & Security',
          description: 'Control data sharing settings',
          path: '/privacy-security',
        },
      ],
    },
  ];

  return (
    <AppLayout>
      <div className="mx-auto max-w-3xl space-y-8">
        {/* Header */}
        <div className="page-header">
          <h1 className="page-title">Settings</h1>
          <p className="page-subtitle">Manage your account and preferences</p>
        </div>

        {/* User Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-6"
        >
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <span className="text-2xl font-bold text-primary">
                {user?.email?.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <h2 className="text-xl font-semibold text-foreground">{user?.email}</h2>
              <p className="text-sm text-muted-foreground capitalize">{role} Account</p>
            </div>
          </div>
        </motion.div>

        {/* Theme Toggle */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card p-6"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {theme === 'dark' ? (
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <Moon className="h-5 w-5 text-primary" />
                </div>
              ) : (
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-warning/10">
                  <Sun className="h-5 w-5 text-warning" />
                </div>
              )}
              <div>
                <h3 className="font-medium text-foreground">
                  {theme === 'dark' ? 'Dark Mode' : 'Light Mode'}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {theme === 'dark' 
                    ? 'Using dark theme with glassmorphism effects'
                    : 'Using light theme for better visibility'}
                </p>
              </div>
            </div>
            <button
              onClick={toggleTheme}
              className={cn(
                'relative h-7 w-12 rounded-full transition-colors',
                theme === 'dark' ? 'bg-primary' : 'bg-muted'
              )}
            >
              <div
                className={cn(
                  'absolute top-1 h-5 w-5 rounded-full bg-white transition-transform',
                  theme === 'dark' ? 'translate-x-6' : 'translate-x-1'
                )}
              />
            </button>
          </div>
        </motion.div>

        {/* Settings Sections */}
        {settingsSections.map((section, sectionIndex) => (
          <motion.div
            key={section.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 + sectionIndex * 0.1 }}
          >
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              {section.title}
            </h2>
            <div className="glass-card divide-y divide-border/50">
              {section.items.map((item) => (
                <Link
                  key={item.label}
                  to={item.path}
                  className="flex items-center justify-between p-4 transition-colors hover:bg-muted/50"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                      <item.icon className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div>
                      <h3 className="font-medium text-foreground">{item.label}</h3>
                      <p className="text-sm text-muted-foreground">{item.description}</p>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </Link>
              ))}
            </div>
          </motion.div>
        ))}

        {/* Sign Out */}
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          onClick={handleSignOut}
          className="glass-card flex w-full items-center justify-between p-4 text-destructive transition-colors hover:bg-destructive/10"
        >
          <div className="flex items-center gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-destructive/10">
              <LogOut className="h-5 w-5" />
            </div>
            <div className="text-left">
              <h3 className="font-medium">Sign Out</h3>
              <p className="text-sm text-muted-foreground">Log out of your account</p>
            </div>
          </div>
          <ChevronRight className="h-5 w-5" />
        </motion.button>

        {/* Version */}
        <p className="text-center text-xs text-muted-foreground">
          SafeFall AI v1.0.0 • Healthcare-Grade Protection
        </p>
      </div>
    </AppLayout>
  );
}
