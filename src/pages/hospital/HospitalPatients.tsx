import { motion } from 'framer-motion';
import { Users } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';

export default function HospitalPatients() {
  return (
    <AppLayout>
      <div className="space-y-8">
        <div className="page-header">
          <h1 className="page-title">Patients</h1>
          <p className="page-subtitle">
            View and manage patients linked to your hospital
          </p>
        </div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card flex flex-col items-center justify-center py-20"
        >
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <Users className="h-8 w-8 text-primary" />
          </div>
          <h2 className="mb-2 text-xl font-semibold text-foreground">Patients</h2>
          <p className="text-center text-sm text-muted-foreground">
            Patient list and management will appear here.
          </p>
        </motion.div>
      </div>
    </AppLayout>
  );
}
