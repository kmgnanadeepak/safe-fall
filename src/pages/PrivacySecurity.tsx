import { motion } from 'framer-motion';
import { 
  Shield, 
  Eye, 
  Lock, 
  Users, 
  AlertTriangle, 
  CheckCircle,
  Info,
  Database,
  Key
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useAuth } from '@/contexts/AuthContext';

export default function PrivacySecurity() {
  const { role } = useAuth();

  const dataAccessRules = [
    {
      icon: Eye,
      title: 'Your Data Visibility',
      description: role === 'patient' 
        ? 'Only you can view your personal data, health profile, and fall history under normal circumstances.'
        : 'You can only view patient data during active emergencies or for patients explicitly assigned to your hospital.',
      color: 'text-info',
      bgColor: 'bg-info/10',
    },
    {
      icon: AlertTriangle,
      title: 'Emergency Data Access',
      description: role === 'patient'
        ? 'During emergencies, your health profile and live location are temporarily shared with hospitals to enable rapid response.'
        : 'Emergency access is automatically granted when a patient triggers an emergency. This access is revoked once resolved.',
      color: 'text-warning',
      bgColor: 'bg-warning/10',
    },
    {
      icon: Users,
      title: 'Hospital Access Limitations',
      description: role === 'patient'
        ? 'Hospitals cannot browse patient data freely. They can only access your information if you are assigned to them or have an active emergency.'
        : 'Patient data access is strictly limited to assigned patients and active emergencies. Global patient browsing is not permitted.',
      color: 'text-danger',
      bgColor: 'bg-danger/10',
    },
    {
      icon: Lock,
      title: 'Row-Level Security',
      description: 'All data is protected by database-level security policies that enforce access rules regardless of application code.',
      color: 'text-success',
      bgColor: 'bg-success/10',
    },
  ];

  const privacyControls = [
    {
      title: 'Location Sharing',
      description: 'Your location is only tracked during active emergencies or when you manually share it.',
      enabled: true,
    },
    {
      title: 'Health Profile Visibility',
      description: 'Your health information is only visible to you and authorized responders during emergencies.',
      enabled: true,
    },
    {
      title: 'Notification History',
      description: 'Notifications are stored securely and only visible to you.',
      enabled: true,
    },
    {
      title: 'Fall Event Recording',
      description: 'Fall events are recorded with sensor data for analysis and emergency response.',
      enabled: true,
    },
  ];

  const securityFeatures = [
    {
      icon: Key,
      title: 'Secure Authentication',
      description: 'Your account is protected with industry-standard authentication including encrypted passwords.',
    },
    {
      icon: Database,
      title: 'Data Encryption',
      description: 'All sensitive data is encrypted at rest and in transit using modern encryption standards.',
    },
    {
      icon: Shield,
      title: 'Access Logging',
      description: 'All data access attempts are logged for audit purposes and security monitoring.',
    },
  ];

  return (
    <AppLayout>
      <div className="mx-auto max-w-4xl space-y-8">
        {/* Header */}
        <div className="page-header">
          <h1 className="page-title">Privacy & Security</h1>
          <p className="page-subtitle">
            Understand how your data is protected and who can access it
          </p>
        </div>

        {/* Data Access Rules */}
        <div>
          <h2 className="mb-4 text-lg font-semibold text-foreground">Data Access Rules</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {dataAccessRules.map((rule, index) => (
              <motion.div
                key={rule.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="glass-card p-6"
              >
                <div className="flex items-start gap-4">
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${rule.bgColor}`}>
                    <rule.icon className={`h-5 w-5 ${rule.color}`} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">{rule.title}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">{rule.description}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Privacy Controls */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <h2 className="mb-4 text-lg font-semibold text-foreground">Privacy Controls</h2>
          <div className="glass-card divide-y divide-border/50">
            {privacyControls.map((control) => (
              <div key={control.title} className="flex items-center justify-between p-4">
                <div className="flex-1">
                  <h3 className="font-medium text-foreground">{control.title}</h3>
                  <p className="text-sm text-muted-foreground">{control.description}</p>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-success" />
                  <span className="text-sm font-medium text-success">Active</span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Security Features */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <h2 className="mb-4 text-lg font-semibold text-foreground">Security Features</h2>
          <div className="grid gap-4 md:grid-cols-3">
            {securityFeatures.map((feature, index) => (
              <div key={feature.title} className="glass-card p-6 text-center">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground">{feature.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Important Notice */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="flex items-start gap-4 rounded-lg border border-info/30 bg-info/10 p-4"
        >
          <Info className="mt-0.5 h-5 w-5 shrink-0 text-info" />
          <div>
            <h3 className="font-semibold text-foreground">Healthcare-Grade Security</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              SafeFall AI implements healthcare-grade security standards to protect your sensitive 
              medical and personal information. All access is logged, audited, and follows the 
              principle of least privilege.
            </p>
          </div>
        </motion.div>
      </div>
    </AppLayout>
  );
}
