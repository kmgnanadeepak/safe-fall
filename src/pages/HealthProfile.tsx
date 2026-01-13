import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Heart, Save, Loader2, AlertCircle } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface HealthProfileData {
  age: number | null;
  gender: string;
  blood_group: string;
  conditions: string;
  allergies: string;
  notes: string;
}

const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const genders = ['Male', 'Female', 'Other', 'Prefer not to say'];

export default function HealthProfile() {
  const { user, role } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasProfile, setHasProfile] = useState(false);
  const [formData, setFormData] = useState<HealthProfileData>({
    age: null,
    gender: '',
    blood_group: '',
    conditions: '',
    allergies: '',
    notes: '',
  });

  const isReadOnly = role === 'hospital';

  useEffect(() => {
    if (!user?.id) return;
    fetchProfile();
  }, [user?.id]);

  const fetchProfile = async () => {
    if (!user?.id) return;

    const { data, error } = await supabase
      .from('health_profiles')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (data) {
      setFormData({
        age: data.age,
        gender: data.gender || '',
        blood_group: data.blood_group || '',
        conditions: data.conditions || '',
        allergies: data.allergies || '',
        notes: data.notes || '',
      });
      setHasProfile(true);
    }
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id || isReadOnly) return;

    setSaving(true);

    const payload = {
      user_id: user.id,
      age: formData.age,
      gender: formData.gender || null,
      blood_group: formData.blood_group || null,
      conditions: formData.conditions || null,
      allergies: formData.allergies || null,
      notes: formData.notes || null,
    };

    if (hasProfile) {
      const { error } = await supabase
        .from('health_profiles')
        .update(payload)
        .eq('user_id', user.id);

      if (error) {
        toast.error('Failed to update profile');
      } else {
        toast.success('Health profile updated');
      }
    } else {
      const { error } = await supabase
        .from('health_profiles')
        .insert(payload);

      if (error) {
        toast.error('Failed to create profile');
      } else {
        toast.success('Health profile created');
        setHasProfile(true);
      }
    }

    setSaving(false);
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
      <div className="mx-auto max-w-3xl space-y-8">
        {/* Header */}
        <div className="page-header">
          <h1 className="page-title">Health Profile</h1>
          <p className="page-subtitle">
            {isReadOnly 
              ? 'View patient health information (read-only during emergency access)'
              : 'Manage your medical information for emergency responders'}
          </p>
        </div>

        {isReadOnly && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3 rounded-lg border border-warning/30 bg-warning/10 p-4"
          >
            <AlertCircle className="h-5 w-5 text-warning" />
            <p className="text-sm text-warning">
              You have read-only access to this profile during an active emergency.
            </p>
          </motion.div>
        )}

        {/* Form */}
        <motion.form
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          onSubmit={handleSubmit}
          className="glass-card space-y-6 p-6"
        >
          <div className="flex items-center gap-3 border-b border-border/50 pb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Heart className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="font-semibold text-foreground">Medical Information</h2>
              <p className="text-sm text-muted-foreground">Critical health details for emergencies</p>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-foreground">Age</label>
              <input
                type="number"
                value={formData.age || ''}
                onChange={(e) => setFormData({ ...formData, age: e.target.value ? parseInt(e.target.value) : null })}
                className="glass-input w-full"
                placeholder="Enter age"
                min={1}
                max={150}
                disabled={isReadOnly}
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-foreground">Gender</label>
              <select
                value={formData.gender}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                className="glass-input w-full"
                disabled={isReadOnly}
              >
                <option value="">Select gender</option>
                {genders.map((g) => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-foreground">Blood Group</label>
              <select
                value={formData.blood_group}
                onChange={(e) => setFormData({ ...formData, blood_group: e.target.value })}
                className="glass-input w-full"
                disabled={isReadOnly}
              >
                <option value="">Select blood group</option>
                {bloodGroups.map((bg) => (
                  <option key={bg} value={bg}>{bg}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-foreground">Medical Conditions</label>
            <textarea
              value={formData.conditions}
              onChange={(e) => setFormData({ ...formData, conditions: e.target.value })}
              className="glass-input min-h-24 w-full resize-none"
              placeholder="e.g., Diabetes, Hypertension, Heart Disease"
              maxLength={1000}
              disabled={isReadOnly}
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-foreground">Allergies</label>
            <textarea
              value={formData.allergies}
              onChange={(e) => setFormData({ ...formData, allergies: e.target.value })}
              className="glass-input min-h-24 w-full resize-none"
              placeholder="e.g., Penicillin, Peanuts, Latex"
              maxLength={1000}
              disabled={isReadOnly}
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-foreground">Emergency Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="glass-input min-h-24 w-full resize-none"
              placeholder="Any additional information for emergency responders"
              maxLength={2000}
              disabled={isReadOnly}
            />
          </div>

          {!isReadOnly && (
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="btn-gradient flex items-center gap-2"
              >
                {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
                {hasProfile ? 'Update Profile' : 'Save Profile'}
              </button>
            </div>
          )}
        </motion.form>
      </div>
    </AppLayout>
  );
}
