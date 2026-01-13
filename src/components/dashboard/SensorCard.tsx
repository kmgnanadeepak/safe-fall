import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';

interface SensorCardProps {
  icon: LucideIcon;
  label: string;
  values: { label: string; value: number }[];
  delay?: number;
}

export function SensorCard({ icon: Icon, label, values, delay = 0 }: SensorCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      className="sensor-card"
    >
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
          <Icon className="h-5 w-5 text-primary" />
        </div>
        <h3 className="text-sm font-medium text-muted-foreground">{label}</h3>
      </div>
      <div className="grid grid-cols-3 gap-4">
        {values.map((item) => (
          <div key={item.label} className="text-center">
            <p className="sensor-value">{item.value.toFixed(2)}</p>
            <p className="mt-1 text-xs text-muted-foreground">{item.label}</p>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
