import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, CalendarDays, ShieldCheck, UserPlus, LayoutDashboard, Save } from 'lucide-react';
import { apiSend, initials } from '../lib/format';
import { useAuth } from '../contexts/AuthContext';
import { useStore } from '../contexts/StoreContext';
import { PageHeader } from '../components/layout';
import { Card, Field, Input, TextArea, Btn, Badge, LinkRow } from '../components/ui';
export default function ProfilePage() {
  const { user, profile, role, refreshProfile, signOut } = useAuth();
  const { showToast } = useStore();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', phone: '', gotra: '', address: '' });
  const [saving, setSaving] = useState(false);
  useEffect(() => { if (profile) setForm({ name: profile.name || '', phone: profile.phone || '', gotra: profile.gotra || '', address: profile.address || '' }); }, [profile]);
  const save = async () => {
    if (!profile) return;
    setSaving(true);
    try { await apiSend('/api/profiles', 'PUT', { id: profile.id, ...form }); await refreshProfile(); showToast('Profile updated'); } catch (e: any) { showToast(e.message); } finally { setSaving(false); }
  };
  const logout = async () => { await signOut(); navigate('/', { replace: true }); };
  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <PageHeader title="My Account" subtitle={user?.email} />
      <Card className="p-5 flex items-center gap-4">
        <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-maroon-700 to-saffron-600 text-white font-display text-2xl flex items-center justify-center shrink-0">{initials(profile?.name || user?.email)}</div>
        <div><h2 className="font-display text-xl text-maroon-950">{profile?.name || 'Devotee'}</h2><p className="text-[13px] text-stone-500 font-medium">{user?.email}</p><div className="mt-1"><Badge tone={role === 'admin' ? 'maroon' : role === 'purohit' ? 'gold' : 'neutral'}>{role}</Badge></div></div>
      </Card>
      <div className="space-y-2.5">
        <LinkRow to="/my-bookings" title="My Bookings & Orders" subtitle="Track puja and delivery status" icon={<CalendarDays size={19} />} />
        {role === 'admin' && <LinkRow to="/admin" title="Admin Console" subtitle="Registrations, listings, bookings & sales" icon={<LayoutDashboard size={19} />} />}
        <LinkRow to="/purohit/dashboard" title="Purohit Dashboard" subtitle="Manage profile, pricing, photos & assignments" icon={<ShieldCheck size={19} />} />
        <LinkRow to="/purohit/register" title="Join as Purohit" subtitle="Register with certification & experience" icon={<UserPlus size={19} />} />
      </div>
      <Card className="p-4 sm:p-5 space-y-3.5">
        <h3 className="font-bold text-maroon-950">Profile details</h3>
        <div className="grid sm:grid-cols-2 gap-3.5">
          <Field label="Full name"><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
          <Field label="Phone"><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} inputMode="numeric" maxLength={10} /></Field>
        </div>
        <Field label="Gotra (if known)"><Input value={form.gotra} onChange={(e) => setForm({ ...form, gotra: e.target.value })} placeholder="e.g. Bharadwaj" /></Field>
        <Field label="Address"><TextArea value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="Home address" /></Field>
        <Btn onClick={save} disabled={saving} className="w-full sm:w-auto"><Save size={16} /> {saving ? 'Saving...' : 'Save Profile'}</Btn>
      </Card>
      <button onClick={logout} className="w-full flex items-center justify-center gap-2 bg-white border border-red-200 text-red-600 font-bold rounded-2xl py-3.5 text-sm"><LogOut size={17} /> Sign Out</button>
    </div>
  );
}
