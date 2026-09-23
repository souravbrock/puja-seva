import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BadgeCheck, Camera, Trash2, Plus, CalendarDays, Award, ImagePlus, CheckCircle2, Clock } from 'lucide-react';
import { apiGet, apiSend, inr, fmtDateTime, uploadPhoto } from '../lib/format';
import { useAuth } from '../contexts/AuthContext';
import { useStore } from '../contexts/StoreContext';
import { PageHeader } from '../components/layout';
import { Card, Loader, EmptyState, Field, Input, TextArea, Select, Btn, StatusBadge } from '../components/ui';
interface PriceRow { puja_id: string; puja_name: string; price: string; }
const emptyRow: PriceRow = { puja_id: '', puja_name: '', price: '' };
export function PurohitRegisterPage() {
  const { user } = useAuth();
  const [pujas, setPujas] = useState<any[]>([]);
  const [form, setForm] = useState({ full_name: '', phone: '', email: '', aadhaar: '', address: '', experience_years: '', specialization: '', certification: '', about: '' });
  const [rows, setRows] = useState<PriceRow[]>([{ ...emptyRow }]);
  const [photos, setPhotos] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [done, setDone] = useState(false);
  const set = (k: string, v: string) => { setForm((f) => ({ ...f, [k]: v })); setErrors((e) => ({ ...e, [k]: '' })); };
  useEffect(() => { apiGet('/api/pujas').then(setPujas).catch(console.error); }, []);
  useEffect(() => { if (user?.email) setForm((f) => ({ ...f, email: f.email || user.email })); }, [user]);
  const onFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    try { const urls: string[] = []; for (const f of Array.from(files).slice(0, 10)) urls.push(await uploadPhoto(f)); setPhotos((p) => [...p, ...urls]); }
    catch (e: any) { setErrors({ photos: e.message }); } finally { setUploading(false); }
  };
  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.full_name.trim()) e.full_name = 'Legal name is required';
    if (!/^[6-9]\d{9}$/.test(form.phone.replace(/\s/g, ''))) e.phone = 'Valid 10-digit number required';
    if (!/^\S+@\S+\.\S+$/.test(form.email)) e.email = 'Valid email required';
    if (!/^\d{12}$/.test(form.aadhaar.replace(/\s/g, ''))) e.aadhaar = '12-digit Aadhaar number required';
    if (!form.address.trim()) e.address = 'Permanent address is required';
    if (form.experience_years === '' || Number(form.experience_years) < 0) e.experience_years = 'Experience required';
    if (!form.specialization.trim()) e.specialization = 'Specialization required';
    if (!form.certification.trim()) e.certification = 'Certification / parampara required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };
  const submit = async () => {
    if (!validate()) { window.scrollTo({ top: 0, behavior: 'smooth' }); return; }
    setSubmitting(true);
    try {
      const pricing = rows.filter((r) => r.puja_id && r.price).map((r) => ({ puja_id: Number(r.puja_id), puja_name: pujas.find((p) => String(p.id) === r.puja_id)?.name || r.puja_name, price: Number(r.price) }));
      await apiSend('/api/purohits', 'POST', { user_id: user?.id || null, ...form, experience_years: Number(form.experience_years), pricing, photos });
      if (user) { try { const pr = await apiGet(`/api/profiles?user_id=${user.id}`); if (pr[0]) await apiSend('/api/profiles', 'PUT', { id: pr[0].id, role: 'purohit' }); } catch { /* noop */ } }
      setDone(true);
    } catch (e: any) { setErrors({ submit: e.message }); } finally { setSubmitting(false); }
  };
  if (done) {
    return (
      <div className="max-w-lg mx-auto text-center py-10">
        <CheckCircle2 size={64} className="mx-auto text-emerald-500" />
        <h1 className="font-display text-3xl text-maroon-950 mt-4">Application Submitted</h1>
        <p className="text-stone-500 text-sm mt-2 leading-relaxed">Namaste, {form.full_name.split(' ')[0]}. Your registration is <span className="font-bold text-amber-700">pending review</span>. Our team verifies Aadhaar and certification within 24-48 hours, after which your profile goes live for bookings.</p>
        <div className="grid grid-cols-2 gap-2.5 mt-5"><Btn variant="outline" to="/purohit/dashboard">Track Status</Btn><Btn to="/">Back Home</Btn></div>
      </div>
    );
  }
  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <PageHeader title="Purohit Registration" subtitle="Join SevaKendra - verified profile, your own pricing" back />
      {!user && <Card className="p-3.5 text-sm font-semibold text-maroon-800 bg-gold-50"><span>Tip: </span><Link to="/login" className="underline">sign in</Link><span> first so this registration links to your account.</span></Card>}
      <Card className="p-4 sm:p-5 space-y-3.5">
        <h3 className="font-bold text-maroon-950">Personal & KYC details</h3>
        <div className="grid sm:grid-cols-2 gap-3.5">
          <Field label="Full legal name (as per Aadhaar)" required error={errors.full_name}><Input value={form.full_name} onChange={(e) => set('full_name', e.target.value)} placeholder="e.g. Pt. Ramesh Shastri" /></Field>
          <Field label="Phone number" required error={errors.phone}><Input value={form.phone} onChange={(e) => set('phone', e.target.value)} placeholder="10-digit mobile" inputMode="numeric" maxLength={10} /></Field>
          <Field label="Email" required error={errors.email}><Input value={form.email} onChange={(e) => set('email', e.target.value)} type="email" /></Field>
          <Field label="Aadhaar number" required error={errors.aadhaar} hint="12 digits, kept private"><Input value={form.aadhaar} onChange={(e) => set('aadhaar', e.target.value)} placeholder="XXXX XXXX XXXX" inputMode="numeric" maxLength={12} /></Field>
        </div>
        <Field label="Permanent address" required error={errors.address}><TextArea value={form.address} onChange={(e) => set('address', e.target.value)} placeholder="Full permanent address" /></Field>
      </Card>
      <Card className="p-4 sm:p-5 space-y-3.5">
        <h3 className="font-bold text-maroon-950">Expertise & credentials</h3>
        <div className="grid sm:grid-cols-2 gap-3.5">
          <Field label="Years of experience" required error={errors.experience_years}><Input type="number" min={0} max={70} value={form.experience_years} onChange={(e) => set('experience_years', e.target.value)} placeholder="e.g. 12" /></Field>
          <Field label="Specialization" required error={errors.specialization}><Input value={form.specialization} onChange={(e) => set('specialization', e.target.value)} placeholder="e.g. Griha Pravesh, Vivah" /></Field>
        </div>
        <Field label="Certification / Parampara" required error={errors.certification} hint="Veda pathshala, gurukul, family tradition..."><Input value={form.certification} onChange={(e) => set('certification', e.target.value)} placeholder="e.g. Kashi Veda Pathshala, Shukla Yajurveda" /></Field>
        <Field label="About you" hint="Languages, regions served, notable temples..."><TextArea value={form.about} onChange={(e) => set('about', e.target.value)} placeholder="Brief introduction for devotees" /></Field>
      </Card>
      <Card className="p-4 sm:p-5 space-y-3">
        <div className="flex items-center justify-between"><h3 className="font-bold text-maroon-950">Your dakshina per puja</h3><button onClick={() => setRows((r) => [...r, { ...emptyRow }])} className="text-[13px] font-bold text-saffron-700 inline-flex items-center gap-1"><Plus size={14} /> Add row</button></div>
        {rows.map((r, i) => (
          <div key={i} className="grid grid-cols-[1fr_110px_36px] gap-2">
            <Select value={r.puja_id} onChange={(e) => setRows((rs) => rs.map((x, j) => j === i ? { ...x, puja_id: e.target.value } : x))}><option value="">Select puja</option>{pujas.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</Select>
            <Input placeholder="fee" type="number" min={0} value={r.price} onChange={(e) => setRows((rs) => rs.map((x, j) => j === i ? { ...x, price: e.target.value } : x))} />
            <button onClick={() => setRows((rs) => rs.filter((_, j) => j !== i))} className="w-9 h-[42px] rounded-xl bg-red-50 text-red-500 flex items-center justify-center"><Trash2 size={16} /></button>
          </div>
        ))}
      </Card>
      <Card className="p-4 sm:p-5 space-y-3">
        <h3 className="font-bold text-maroon-950 flex items-center gap-2"><Camera size={17} className="text-saffron-600" /> Photos performing pujas</h3>
        <label className={`flex flex-col items-center justify-center gap-2 border-2 border-dashed border-stone-200 rounded-2xl p-6 cursor-pointer hover:border-saffron-400 transition ${uploading ? 'opacity-50 pointer-events-none' : ''}`}>
          <ImagePlus size={26} className="text-saffron-600" />
          <span className="text-sm font-bold text-maroon-900">{uploading ? 'Uploading photos...' : 'Tap to upload (multiple allowed)'}</span>
          <span className="text-xs text-stone-400 font-medium">JPG / PNG - auto-compressed</span>
          <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => onFiles(e.target.files)} />
        </label>
        {errors.photos && <p className="text-sm font-semibold text-red-600">{errors.photos}</p>}
        {photos.length > 0 && (<div className="grid grid-cols-4 gap-2">{photos.map((u, i) => (<div key={i} className="relative rounded-xl overflow-hidden aspect-square bg-stone-100"><img src={u} alt="" className="w-full h-full object-cover" /><button onClick={() => setPhotos((p) => p.filter((_, j) => j !== i))} className="absolute top-1 right-1 w-6 h-6 rounded-full bg-maroon-950/80 text-white flex items-center justify-center"><Trash2 size={12} /></button></div>))}</div>)}
      </Card>
      {errors.submit && <p className="text-sm font-semibold text-red-600">{errors.submit}</p>}
      <Btn className="w-full" disabled={submitting || uploading} onClick={submit}>{submitting ? 'Submitting...' : 'Submit for Verification'}</Btn>
      <p className="text-[11px] text-stone-400 text-center font-medium">By submitting you agree to SevaKendra code of conduct for purohits.</p>
    </div>
  );
}
export function PurohitDashboardPage() {
  const { user } = useAuth();
  const { showToast } = useStore();
  const [record, setRecord] = useState<any>(null);
  const [pujas, setPujas] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ experience_years: '', specialization: '', certification: '', about: '', phone: '', address: '' });
  const [rows, setRows] = useState<PriceRow[]>([]);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const load = async () => {
    if (!user) return;
    try {
      const [pj, byUid] = await Promise.all([apiGet('/api/pujas'), apiGet(`/api/purohits?user_id=${user.id}`)]);
      setPujas(pj);
      let rec = byUid[0] || null;
      if (!rec && user.email) { const byEmail = await apiGet(`/api/purohits?email=${encodeURIComponent(user.email)}`); rec = byEmail[0] || null; if (rec && !rec.user_id) { try { await apiSend('/api/purohits', 'PUT', { id: rec.id, user_id: user.id }); } catch { /* noop */ } } }
      setRecord(rec);
      if (rec) {
        setForm({ experience_years: String(rec.experience_years ?? ''), specialization: rec.specialization || '', certification: rec.certification || '', about: rec.about || '', phone: rec.phone || '', address: rec.address || '' });
        const pr = Array.isArray(rec.pricing) ? rec.pricing : [];
        setRows(pr.length ? pr.map((r: any) => ({ puja_id: String(r.puja_id || ''), puja_name: r.puja_name || '', price: String(r.price ?? '') })) : [{ ...emptyRow }]);
        const b = await apiGet(`/api/bookings?purohit_id=${rec.id}`);
        setBookings(b);
      }
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, [user]);
  const saveProfile = async () => {
    if (!record) return;
    setSaving(true);
    try {
      const pricing = rows.filter((r) => r.puja_id && r.price).map((r) => ({ puja_id: Number(r.puja_id), puja_name: pujas.find((p) => String(p.id) === r.puja_id)?.name || r.puja_name, price: Number(r.price) }));
      const updated = await apiSend('/api/purohits', 'PUT', { id: record.id, experience_years: Number(form.experience_years) || 0, specialization: form.specialization, certification: form.certification, about: form.about, phone: form.phone, address: form.address, pricing });
      setRecord(updated); setEditing(false); showToast('Profile updated');
    } catch (e: any) { showToast(e.message); } finally { setSaving(false); }
  };
  const bulkUpload = async (files: FileList | null) => {
    if (!files || !record) return;
    setUploading(true);
    try {
      const urls: string[] = [];
      for (const f of Array.from(files).slice(0, 12)) urls.push(await uploadPhoto(f));
      const updated = await apiSend('/api/purohits', 'PUT', { id: record.id, photos: [...(record.photos || []), ...urls] });
      setRecord(updated); showToast(`${urls.length} photo(s) uploaded`);
    } catch (e: any) { showToast(e.message); } finally { setUploading(false); }
  };
  const removePhoto = async (url: string) => {
    if (!record) return;
    const updated = await apiSend('/api/purohits', 'PUT', { id: record.id, photos: (record.photos || []).filter((u: string) => u !== url) });
    setRecord(updated); showToast('Photo removed');
  };
  if (loading) return <Loader label="Loading dashboard..." />;
  if (!record) return <EmptyState icon={<BadgeCheck size={26} />} title="No purohit profile yet" subtitle="Register as a purohit to access your dashboard, pricing and bookings." action={<Btn to="/purohit/register">Register Now</Btn>} />;
  const photos = Array.isArray(record.photos) ? record.photos : [];
  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <PageHeader title={`Namaste, ${String(record.full_name).split(' ')[0]}`} subtitle="Manage your profile, pricing & assignments" />
      <Card className={`p-4 flex items-center gap-3 ${record.status === 'approved' ? 'bg-emerald-50' : record.status === 'declined' ? 'bg-red-50' : 'bg-amber-50'}`}>
        {record.status === 'approved' ? <BadgeCheck size={22} className="text-emerald-600" /> : <Clock size={22} className="text-amber-600" />}
        <div className="text-sm"><p className="font-bold text-maroon-950">Verification status: <StatusBadge status={record.status} /></p><p className="text-stone-500 font-medium">{record.status === 'approved' ? 'Your profile is live. Devotees can now book you.' : record.status === 'declined' ? 'Your application was declined. Contact support for details.' : 'Under review - usually completed within 24-48 hours.'}</p></div>
      </Card>
      <div className="grid grid-cols-3 gap-2.5">
        <Card className="p-4 text-center"><p className="font-display text-2xl text-maroon-900">{record.experience_years}</p><p className="text-[11px] font-bold uppercase tracking-wide text-stone-400">Yrs Exp</p></Card>
        <Card className="p-4 text-center"><p className="font-display text-2xl text-maroon-900">{Number(record.rating || 5).toFixed(1)}</p><p className="text-[11px] font-bold uppercase tracking-wide text-stone-400">Rating</p></Card>
        <Card className="p-4 text-center"><p className="font-display text-2xl text-maroon-900">{bookings.length}</p><p className="text-[11px] font-bold uppercase tracking-wide text-stone-400">Bookings</p></Card>
      </div>
      <Card className="p-4 sm:p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-maroon-950 flex items-center gap-2"><Award size={17} className="text-saffron-600" /> Experience & credentials</h3>
          {!editing ? <button onClick={() => setEditing(true)} className="text-[13px] font-bold text-saffron-700">Edit</button> : (<div className="flex gap-2"><button onClick={() => setEditing(false)} className="text-[13px] font-bold text-stone-400">Cancel</button><button onClick={saveProfile} disabled={saving} className="text-[13px] font-bold text-emerald-700">{saving ? 'Saving...' : 'Save'}</button></div>)}
        </div>
        {!editing ? (
          <div className="text-sm space-y-2">
            <p><span className="text-stone-400 font-semibold">Experience: </span><span className="font-bold text-maroon-950">{record.experience_years} years</span></p>
            <p><span className="text-stone-400 font-semibold">Specialization: </span><span className="font-bold text-maroon-950">{record.specialization}</span></p>
            <p><span className="text-stone-400 font-semibold">Certification: </span><span className="font-bold text-maroon-950">{record.certification}</span></p>
            {record.about && <p className="text-stone-600">{record.about}</p>}
          </div>
        ) : (
          <div className="space-y-3">
            <div className="grid sm:grid-cols-2 gap-3">
              <Field label="Years of experience"><Input type="number" min={0} value={form.experience_years} onChange={(e) => setForm({ ...form, experience_years: e.target.value })} /></Field>
              <Field label="Phone"><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></Field>
            </div>
            <Field label="Specialization"><Input value={form.specialization} onChange={(e) => setForm({ ...form, specialization: e.target.value })} /></Field>
            <Field label="Certification"><Input value={form.certification} onChange={(e) => setForm({ ...form, certification: e.target.value })} /></Field>
            <Field label="About"><TextArea value={form.about} onChange={(e) => setForm({ ...form, about: e.target.value })} /></Field>
            <Field label="Address"><TextArea value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></Field>
          </div>
        )}
      </Card>
      <Card className="p-4 sm:p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-maroon-950">My dakshina per puja</h3>
          <div className="flex gap-2">
            <button onClick={() => setRows((r) => [...r, { ...emptyRow }])} className="text-[13px] font-bold text-saffron-700 inline-flex items-center gap-1"><Plus size={14} /> Row</button>
            <button onClick={saveProfile} disabled={saving} className="text-[13px] font-bold text-emerald-700">{saving ? 'Saving...' : 'Save pricing'}</button>
          </div>
        </div>
        {rows.map((r, i) => (
          <div key={i} className="grid grid-cols-[1fr_110px_36px] gap-2">
            <Select value={r.puja_id} onChange={(e) => setRows((rs) => rs.map((x, j) => j === i ? { ...x, puja_id: e.target.value } : x))}><option value="">Select puja</option>{pujas.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</Select>
            <Input placeholder="fee" type="number" min={0} value={r.price} onChange={(e) => setRows((rs) => rs.map((x, j) => j === i ? { ...x, price: e.target.value } : x))} />
            <button onClick={() => setRows((rs) => rs.filter((_, j) => j !== i))} className="w-9 h-[42px] rounded-xl bg-red-50 text-red-500 flex items-center justify-center"><Trash2 size={16} /></button>
          </div>
        ))}
      </Card>
      <Card className="p-4 sm:p-5 space-y-3">
        <h3 className="font-bold text-maroon-950 flex items-center gap-2"><Camera size={17} className="text-saffron-600" /> Puja photos ({photos.length})</h3>
        <label className={`flex items-center justify-center gap-2 border-2 border-dashed border-stone-200 rounded-2xl p-4 cursor-pointer hover:border-saffron-400 transition text-sm font-bold text-maroon-900 ${uploading ? 'opacity-50 pointer-events-none' : ''}`}>
          <ImagePlus size={19} className="text-saffron-600" /> {uploading ? 'Uploading...' : 'Bulk upload photos'}
          <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => bulkUpload(e.target.files)} />
        </label>
        {photos.length > 0 && (<div className="grid grid-cols-3 sm:grid-cols-4 gap-2">{photos.map((u: string, i: number) => (<div key={i} className="relative rounded-xl overflow-hidden aspect-square bg-stone-100"><img src={u} alt="" className="w-full h-full object-cover" /><button onClick={() => removePhoto(u)} className="absolute top-1 right-1 w-6 h-6 rounded-full bg-maroon-950/80 text-white flex items-center justify-center"><Trash2 size={12} /></button></div>))}</div>)}
      </Card>
      <div>
        <h3 className="font-bold text-maroon-950 flex items-center gap-2 mb-2.5"><CalendarDays size={17} className="text-saffron-600" /> My assigned bookings</h3>
        {bookings.length === 0 ? <EmptyState title="No assignments yet" subtitle="New bookings assigned to you will appear here." /> : (
          <div className="space-y-2.5">
            {bookings.map((b) => (
              <Card key={b.id} className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div><p className="text-[11px] font-bold text-stone-400">#SKB-{b.id} &middot; {fmtDateTime(b.booking_date)}</p><p className="font-bold text-maroon-950">{b.customer_name}{b.gotra ? ` (${b.gotra})` : ''}</p><p className="text-[13px] text-stone-500 font-medium">{b.phone} &middot; {b.puja_location}</p>{b.notes && <p className="text-[13px] text-stone-500 italic mt-1">{b.notes}</p>}</div>
                  <div className="text-right shrink-0"><StatusBadge status={b.status} /><p className="font-bold text-maroon-900 mt-1">{inr(b.amount)}</p></div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
