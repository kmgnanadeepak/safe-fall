import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Phone, Plus, Edit2, Trash2, User, Loader2, X, Check } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface EmergencyContact {
  id: string;
  name: string;
  relation: string;
  phone: string;
}

export default function EmergencyContacts() {
  const { user } = useAuth();
  const [contacts, setContacts] = useState<EmergencyContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: '', relation: '', phone: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user?.id) return;
    fetchContacts();
  }, [user?.id]);

  const fetchContacts = async () => {
    if (!user?.id) return;
    
    const { data, error } = await supabase
      .from('emergency_contacts')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      toast.error('Failed to load contacts');
    } else {
      setContacts(data || []);
    }
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) return;

    setSaving(true);

    if (editingId) {
      const { error } = await supabase
        .from('emergency_contacts')
        .update(formData)
        .eq('id', editingId)
        .eq('user_id', user.id);

      if (error) {
        toast.error('Failed to update contact');
      } else {
        toast.success('Contact updated');
        fetchContacts();
      }
    } else {
      const { error } = await supabase
        .from('emergency_contacts')
        .insert({ ...formData, user_id: user.id });

      if (error) {
        toast.error('Failed to add contact');
      } else {
        toast.success('Contact added');
        fetchContacts();
      }
    }

    setSaving(false);
    resetForm();
  };

  const handleEdit = (contact: EmergencyContact) => {
    setFormData({ name: contact.name, relation: contact.relation, phone: contact.phone });
    setEditingId(contact.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!user?.id) return;
    
    const { error } = await supabase
      .from('emergency_contacts')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      toast.error('Failed to delete contact');
    } else {
      toast.success('Contact deleted');
      fetchContacts();
    }
  };

  const resetForm = () => {
    setFormData({ name: '', relation: '', phone: '' });
    setEditingId(null);
    setShowForm(false);
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
        <div className="flex items-center justify-between">
          <div className="page-header">
            <h1 className="page-title">Emergency Contacts</h1>
            <p className="page-subtitle">Manage contacts who will be notified during emergencies</p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="btn-gradient flex items-center gap-2"
          >
            <Plus className="h-5 w-5" />
            Add Contact
          </button>
        </div>

        {/* Form Modal */}
        {showForm && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-card p-6"
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-foreground">
                {editingId ? 'Edit Contact' : 'Add New Contact'}
              </h2>
              <button onClick={resetForm} className="text-muted-foreground hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <label className="mb-2 block text-sm font-medium text-foreground">Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="glass-input w-full"
                    placeholder="Contact name"
                    required
                    maxLength={100}
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-foreground">Relation</label>
                  <input
                    type="text"
                    value={formData.relation}
                    onChange={(e) => setFormData({ ...formData, relation: e.target.value })}
                    className="glass-input w-full"
                    placeholder="e.g., Spouse, Child, Doctor"
                    required
                    maxLength={50}
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-foreground">Phone</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="glass-input w-full"
                    placeholder="+1 234 567 8900"
                    required
                    maxLength={20}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3">
                <button type="button" onClick={resetForm} className="glass-card px-4 py-2 text-sm">
                  Cancel
                </button>
                <button type="submit" disabled={saving} className="btn-gradient flex items-center gap-2 px-4 py-2 text-sm">
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                  {editingId ? 'Update' : 'Save'}
                </button>
              </div>
            </form>
          </motion.div>
        )}

        {/* Contacts List */}
        {contacts.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card flex flex-col items-center justify-center py-16"
          >
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
              <Phone className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="mb-2 text-lg font-medium text-foreground">No Emergency Contacts</h3>
            <p className="mb-6 text-center text-muted-foreground">
              Add contacts who should be notified in case of an emergency
            </p>
            <button onClick={() => setShowForm(true)} className="btn-gradient flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Add Your First Contact
            </button>
          </motion.div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {contacts.map((contact, index) => (
              <motion.div
                key={contact.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="glass-card p-6"
              >
                <div className="mb-4 flex items-start justify-between">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                    <User className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(contact)}
                      className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(contact.id)}
                      className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <h3 className="mb-1 text-lg font-semibold text-foreground">{contact.name}</h3>
                <p className="mb-3 text-sm text-muted-foreground">{contact.relation}</p>
                <div className="flex items-center gap-2 text-primary">
                  <Phone className="h-4 w-4" />
                  <a href={`tel:${contact.phone}`} className="text-sm font-medium hover:underline">
                    {contact.phone}
                  </a>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
