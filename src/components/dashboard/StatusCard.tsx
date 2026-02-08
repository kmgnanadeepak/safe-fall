import { motion } from 'framer-motion';
import { CheckCircle, AlertTriangle, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatusCardProps {
  status: 'safe' | 'warning' | 'emergency';
  title: string;
  description: string;
}

const statusConfig = {
  safe: {
    icon: CheckCircle,
    className: 'status-safe',
    bgClass: 'bg-success/10 border-success/20',
    textClass: 'text-success',
  },
  warning: {
    icon: AlertTriangle,
    className: 'status-warning',
    bgClass: 'bg-warning/10 border-warning/20',
    textClass: 'text-warning',
  },
  emergency: {
    icon: AlertCircle,
    className: 'status-emergency',
    bgClass: 'bg-danger/10 border-danger/20',
    textClass: 'text-danger',
  },
};

export function StatusCard({ status, title, description }: StatusCardProps) {
  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className={cn(
        'glass-card flex items-center gap-4 border p-6',
        config.bgClass
      )}
    >
      <div className={cn('flex h-12 w-12 items-center justify-center rounded-full', config.bgClass)}>
        <Icon className={cn('h-6 w-6', config.textClass)} />
      </div>
      <div>
        <h3 className={cn('text-lg font-semibold', config.textClass)}>{title}</h3>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
    </motion.div>
  );
}
