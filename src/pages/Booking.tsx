import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CheckCircle2, MapPin, CalendarDays, User } from 'lucide-react';
import { apiGet, apiSend, inr, fmtDateTime } from '../lib/format';
import { useAuth } from '../contexts/AuthContext';
import { PageHeader } from '../components/layout';
import { Card, Loader, Field, Input, TextArea, Select, Btn } from '../components/ui';
export default function BookingPage() {
  const [params] = useSearchParams();
  const { user, profile } = useAuth();
  const type = params.get('type') || 'puja';
  const packageId = params.get('packageId');
  const pujaId = params.get('pujaId');
  const purohitId = params.get('purohitId');
  const upcomingId = params.get('upcomingId');
  const [loading, setLoading] = useState(true);
  const [pkg, setPkg] = useState<any>(null);
  const [puja, setPuja] = useState<any>(null);
  const [purohit, setPurohit] = useState<any>(null);
  const [purohits, setPurohits] = useState<any[]>([]);
  const [pujas, setPujas] = useState<any[]>([]);
  const [event, setEvent] = useState<any>(null);
  const [selPurohitId, setSelPurohitId] = useState(purohitId || '');
  const [selPujaId, setSelPujaId] = useState(pujaId || '');
  const [done, setDone] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [form, setForm] = useState({ name: '', gotra: '', phone: '', email: '', location: '', date: '', notes: '' });
  const set = (k: string, v: string) => { setForm((f) => ({ ...f, [k]: v })); setErrors((e) => ({ ...e, [k]: '' })); };
  useEffect(() => {
    (async () => {
      try {
        const [pjAll, prAll] = await Promise.all([apiGet('/api/pujas'), apiGet('/api/purohits?status=approved')]);
        setPujas(pjAll.filter((p: any) => p.is_active)); setPurohits(prAll);
        if (packageId) { const d = await apiGet(`/api/packages?id=${packageId}`); const p = d[0]; setPkg(p); if (p?.puja_id) { const pj = pjAll.find((x: any) => x.id === p.puja_id); setPuja(pj); setSelPujaId(String(p.puja_id)); } }
        if (pujaId) { const pj = pjAll.find((x: any) => String(x.id) === String(pujaId)); setPuja(pj || null); }
        if (purohitId) { const pr = prAll.find((x: any) => String(x.id) === String(purohitId)); setPurohit(pr || null); }
        if (upcomingId) { const d = await apiGet(`/api/upcoming?id=${upcomingId}`); setEvent(d[0] || null); }
      } catch (e) { console.error(e); } finally { setLoading(false); }
    })();
  }, [packageId, pujaId, purohitId, upcomingId]);
  useEffect(() => { if (profile || user) setForm((f) => ({ ...f, name: f.name || profile?.name || '', phone: f.phone || profile?.phone || '', email: f.email || user?.email || profile?.email || '', gotra: f.gotra || profile?.gotra || '', location: f.location || profile?.address || '' })); }, [profile, user]);
  useEffect(() => { if (selPurohitId) { const pr = purohits.find((x) => String(x.id) === String(selPurohitId)); setPurohit(pr || null); } else setPurohit(null); }, [selPurohitId, purohits]);
  useEffect(() => { if (selPujaId && !puja) { const pj = pujas.find((x) => String(x.id) === String(selPujaId)); if (pj) setPuja(pj); } }, [selPujaId, pujas, puja]);
  const effectivePuja = puja || pujas.find((x) => String(x.id) === String(selPujaId));
  const purohitFee = (() => {
    if (!purohit || !effectivePuja) return 0;
    const arr = Array.isArray(purohit.pricing) ? purohit.pricing : [];
    const hit = arr.find((r: any) => Number(r.puja_id) === Number(effectivePuja.id) || r.puja_name === effectivePuja.name);
    return hit ? Number(hit.price) : 0;
  })();
  const amount = type === 'package' ? Number(pkg?.total_price || 0) : type === 'upcoming' ? Number(event?.price || 0) : Number(effectivePuja?.base_price || 0) + purohitFee;
  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = 'Full name is required';
    if (!form.phone.trim() || !/^[6-9]\d{9}$/.test(form.phone.replace(/\s/g, ''))) e.phone = 'Enter a valid 10-digit mobile number';
    if (!form.email.trim() || !/^\S+@\S+\.\S+$/.test(form.email)) e.email = 'Enter a valid email';
    if (type !== 'upcoming' && !form.location.trim()) e.location = 'Puja location is required';
    if (type !== 'upcoming' && !form.date) e.date = 'Preferred date & time is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };
  const submit = async () => {
    if (!validate()) return;
    setSubmitting(true);
    try {
      const booking = await apiSend('/api/bookings', 'POST', { user_id: user?.id || null, customer_name: form.name.trim(), gotra: form.gotra.trim(), phone: form.phone.trim(), email: form.email.trim(), puja_location: type === 'upcoming' ? `${event?.venue || ''} ${event?.address || ''}`.trim() : form.location.trim(), package_id: type === 'package' ? Number(packageId) : null, puja_id: effectivePuja ? Number(effectivePuja.id) : null, purohit_id: selPurohitId ? Number(selPurohitId) : null, upcoming_puja_id: type === 'upcoming' ? Number(upcomingId) : null, booking_date: type === 'upcoming' ? event?.event_date : new Date(form.date).toISOString(), amount, notes: form.notes.trim() });
      setDone(booking);
    } catch (e: any) { setErrors({ submit: e.message }); } finally { setSubmitting(false); }
  };
  if (loading) return <Loader label="Preparing booking..." />;
  if (done) {
    return (
      <div className="max-w-lg mx-auto text-center py-8">
        <CheckCircle2 size={64} className="mx-auto text-emerald-500" />
        <h1 className="font-display text-3xl text-maroon-950 mt-4">Booking Confirmed</h1>
        <p className="text-stone-500 text-sm mt-2">Booking ID <span className="font-bold text-maroon-800">#SKB-{done.id}</span> &middot; Status: <span className="font-bold text-amber-700">Booked</span></p>
        <Card className="p-5 mt-5 text-left space-y-2.5 text-sm">
          <Row k="Devotee" v={`${done.customer_name}${done.gotra ? ` (${done.gotra} gotra)` : ''}`} />
          <Row k="Contact" v={`${done.phone} - ${done.email}`} />
          <Row k="Puja" v={type === 'package' ? pkg?.name : type === 'upcoming' ? event?.title : effectivePuja?.name} />
          {purohit && <Row k="Purohit" v={purohit.full_name} />}
          <Row k="When" v={fmtDateTime(done.booking_date)} />
          <Row k="Where" v={done.puja_location} />
          <div className="border-t border-dashed border-stone-200 pt-2.5 flex justify-between"><span className="font-bold text-maroon-950">Amount payable</span><span className="font-display text-xl text-maroon-900">{inr(done.amount)}</span></div>
        </Card>
        <p className="text-xs text-stone-400 mt-3">Our team will call you shortly to confirm the purohit assignment. Track status in My Bookings.</p>
        <div className="grid grid-cols-2 gap-2.5 mt-4"><Btn variant="outline" to="/my-bookings">Track Booking</Btn><Btn to="/">Back Home</Btn></div>
      </div>
    );
  }
  const title = type === 'package' ? 'Book Puja Package' : type === 'upcoming' ? 'Book Event Seat' : 'Book a Puja';
  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <PageHeader title={title} subtitle="Share your details to confirm the booking" back />
      <Card className="p-4 sm:p-5 bg-gradient-to-br from-maroon-900 to-maroon-800 text-white" >
        <p className="text-[11px] font-bold uppercase tracking-widest text-gold-300">Booking summary</p>
        <h2 className="font-display text-xl mt-1">{type === 'package' ? pkg?.name : type === 'upcoming' ? event?.title : effectivePuja?.name || 'Select a puja below'}</h2>
        <div className="text-[13px] text-white/80 mt-1.5 space-y-1 font-medium">
          {type === 'package' && pkg && <p>Purohit {inr(pkg.purohit_fee)} + Samagri {inr(pkg.items_price)} &middot; {pkg.tier} tier</p>}
          {type === 'puja' && effectivePuja && <p>Base {inr(effectivePuja.base_price)}{purohit ? ` + ${String(purohit.full_name).split(' ')[0]}'s dakshina ${inr(purohitFee)}` : ' + purohit dakshina as applicable'}</p>}
          {type === 'upcoming' && event && <p className="flex items-center gap-1.5"><MapPin size={13} /> {event.venue} &middot; {fmtDateTime(event.event_date)}</p>}
          {purohit && <p className="flex items-center gap-1.5"><User size={13} /> Purohit: {purohit.full_name} ({purohit.experience_years} yrs)</p>}
        </div>
        <div className="flex items-end justify-between mt-3 pt-3 border-t border-white/15"><span className="text-sm font-semibold text-white/70">Total payable</span><span className="font-display text-3xl text-gold-300">{inr(amount)}</span></div>
      </Card>
      {(type === 'puja' || type === 'package') && (
        <Card className="p-4 sm:p-5 space-y-3">
          <h3 className="font-bold text-maroon-950 flex items-center gap-2"><CalendarDays size={17} className="text-saffron-600" /> Choose puja & purohit</h3>
          {type === 'puja' && !pujaId && (<Field label="Select Puja"><Select value={selPujaId} onChange={(e) => { setSelPujaId(e.target.value); const pj = pujas.find((x) => String(x.id) === e.target.value); setPuja(pj || null); }}><option value="">-- Choose a puja --</option>{pujas.map((p) => <option key={p.id} value={p.id}>{p.name} - from {inr(p.base_price)}</option>)}</Select></Field>)}
          <Field label="Select Purohit (optional)" hint="Leave blank and we will assign a verified purohit">
            <Select value={selPurohitId} onChange={(e) => setSelPurohitId(e.target.value)}><option value="">Auto-assign a verified purohit</option>{purohits.map((p) => <option key={p.id} value={p.id}>{p.full_name} - {p.specialization}, {p.experience_years} yrs</option>)}</Select>
          </Field>
        </Card>
      )}
      <Card className="p-4 sm:p-5 space-y-3.5">
        <h3 className="font-bold text-maroon-950">Your details</h3>
        <div className="grid sm:grid-cols-2 gap-3.5">
          <Field label="Full name" required error={errors.name}><Input value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="e.g. Ananya Sharma" /></Field>
          <Field label="Gotra (if known)" hint="Used during sankalpa"><Input value={form.gotra} onChange={(e) => set('gotra', e.target.value)} placeholder="e.g. Kashyap" /></Field>
          <Field label="Phone number" required error={errors.phone}><Input value={form.phone} onChange={(e) => set('phone', e.target.value)} placeholder="10-digit mobile" inputMode="numeric" maxLength={10} /></Field>
          <Field label="Email" required error={errors.email}><Input value={form.email} onChange={(e) => set('email', e.target.value)} placeholder="you@example.com" type="email" /></Field>
        </div>
        {type !== 'upcoming' ? (<><Field label="Puja location / delivery address" required error={errors.location} hint="Full address where the puja will be performed"><TextArea value={form.location} onChange={(e) => set('location', e.target.value)} placeholder="Flat, street, area, city, PIN" /></Field><Field label="Preferred date & time" required error={errors.date}><Input type="datetime-local" value={form.date} onChange={(e) => set('date', e.target.value)} min={new Date().toISOString().slice(0, 16)} /></Field></>) : (<div className="bg-cream rounded-xl p-3.5 text-sm text-stone-600 font-medium">Seat will be reserved for <span className="font-bold text-maroon-900">{form.name || 'you'}</span> at {event?.venue} on {fmtDateTime(event?.event_date)}. Carry this booking ID at entry.</div>)}
        <Field label="Notes (optional)" hint="Family details, special wishes, parking info..."><TextArea value={form.notes} onChange={(e) => set('notes', e.target.value)} placeholder="Anything the purohit should know" /></Field>
        {errors.submit && <p className="text-sm font-semibold text-red-600">{errors.submit}</p>}
        <Btn className="w-full" disabled={submitting} onClick={submit}>{submitting ? 'Confirming...' : `Confirm Booking - ${inr(amount)}`}</Btn>
        <p className="text-[11px] text-stone-400 text-center font-medium">Pay the purohit directly or via UPI on the day. Free rescheduling up to 24 hrs before.</p>
      </Card>
    </div>
  );
}
function Row({ k, v }: { k: string; v: any }) {
  return <div className="flex justify-between gap-3"><span className="text-stone-400 font-semibold shrink-0">{k}</span><span className="font-bold text-maroon-950 text-right">{v || '-'}</span></div>;
}
