import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Search, BadgeCheck, Award, BookOpen, Camera, MapPin, ChevronRight } from 'lucide-react';
import { apiGet, inr, initials, absUrl } from '../lib/format';
import { PageHeader } from '../components/layout';
import { Card, Loader, EmptyState, Badge, Btn, Stars, SectionTitle } from '../components/ui';
export function PurohitsPage() {
  const [list, setList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [spec, setSpec] = useState('All');
  useEffect(() => { apiGet('/api/purohits?status=approved').then(setList).catch(console.error).finally(() => setLoading(false)); }, []);
  const specs = ['All', ...Array.from(new Set(list.map((p) => p.specialization).filter(Boolean)))];
  const filtered = list.filter((p) => (spec === 'All' || p.specialization === spec) && (p.full_name.toLowerCase().includes(q.toLowerCase()) || (p.specialization || '').toLowerCase().includes(q.toLowerCase())));
  if (loading) return <Loader label="Loading verified purohits..." />;
  return (
    <div>
      <PageHeader title="Verified Purohits" subtitle="Expertise, experience & transparent dakshina" />
      <div className="relative mb-3"><Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by name or specialization..." className="w-full rounded-2xl border border-stone-200 bg-white pl-11 pr-4 py-3 text-[15px] outline-none focus:border-saffron-500 focus:ring-2 focus:ring-saffron-200" /></div>
      <div className="flex gap-2 overflow-x-auto pb-3 -mx-4 px-4">{specs.map((s) => (<button key={s} onClick={() => setSpec(s)} className={`shrink-0 text-[13px] font-bold px-4 py-2 rounded-full border ${spec === s ? 'bg-maroon-800 text-white border-maroon-800' : 'bg-white text-stone-600 border-stone-200'}`}>{s}</button>))}</div>
      {filtered.length === 0 ? <EmptyState title="No purohits found" /> : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map((p) => {
            const pricing = Array.isArray(p.pricing) ? p.pricing : [];
            const minFee = pricing.length ? Math.min(...pricing.map((r: any) => Number(r.price) || 0)) : null;
            const photos = Array.isArray(p.photos) ? p.photos : [];
            return (
              <Link key={p.id} to={`/purohits/${p.id}`}><Card className="p-4 h-full">
                <div className="flex gap-3">
                  {photos.length > 0 ? <img src={absUrl(photos[0])} alt="" className="w-16 h-16 rounded-2xl object-cover shrink-0" /> : (<div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-maroon-700 to-saffron-600 text-white font-display text-xl flex items-center justify-center shrink-0">{initials(p.full_name)}</div>)}
                  <div className="min-w-0"><p className="font-bold text-maroon-950 flex items-center gap-1">{p.full_name} <BadgeCheck size={15} className="text-emerald-600 shrink-0" /></p><p className="text-xs font-semibold text-saffron-700">{p.specialization}</p><p className="text-xs text-stone-500">{p.experience_years} years experience &middot; {p.completed_pujas || 0} pujas done</p></div>
                </div>
                <div className="flex items-center justify-between mt-3"><span className="flex items-center gap-1.5"><Stars value={Number(p.rating) || 5} size={13} /><span className="text-xs font-bold text-stone-500">{Number(p.rating || 5).toFixed(1)}</span></span><span className="text-sm font-bold text-maroon-800">{minFee !== null ? `from ${inr(minFee)}` : 'View pricing'}</span></div>
              </Card></Link>
            );
          })}
        </div>
      )}
      <Link to="/purohit/register" className="mt-4 flex items-center justify-between bg-gradient-to-r from-gold-100 to-saffron-100 border border-gold-200 rounded-2xl p-4"><p className="text-sm font-bold text-maroon-900">Are you a purohit? Join SevaKendra and get bookings.</p><ChevronRight size={18} className="text-maroon-700" /></Link>
    </div>
  );
}
export function PurohitDetailPage() {
  const { id } = useParams();
  const [p, setP] = useState<any>(null);
  const [pujaNames, setPujaNames] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [lightbox, setLightbox] = useState<string | null>(null);
  useEffect(() => { apiGet(`/api/purohits?id=${id}`).then((d) => setP(d[0] || null)).catch(console.error).finally(() => setLoading(false)); }, [id]);
  useEffect(() => { apiGet('/api/pujas').then((d) => { const m: Record<string, string> = {}; (d || []).forEach((x: any) => { m[String(x.id)] = x.name; }); setPujaNames(m); }).catch(console.error); }, []);
  if (loading) return <Loader />;
  if (!p) return <EmptyState title="Purohit not found" action={<Btn to="/purohits">Back</Btn>} />;
  const pricing = Array.isArray(p.pricing) ? p.pricing : [];
  const photos = Array.isArray(p.photos) ? p.photos : [];
  return (
    <div className="space-y-4">
      <PageHeader title={p.full_name} subtitle={p.specialization} back />
      <Card className="p-5">
        <div className="flex gap-4">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-maroon-700 to-saffron-600 text-white font-display text-2xl flex items-center justify-center shrink-0">{initials(p.full_name)}</div>
          <div className="min-w-0"><p className="font-bold text-maroon-950 text-lg flex items-center gap-1.5 flex-wrap">{p.full_name} {p.status === 'approved' && <Badge tone="green"><BadgeCheck size={11} /> Verified</Badge>}</p><div className="flex items-center gap-1.5 mt-1"><Stars value={Number(p.rating) || 5} /><span className="text-sm font-bold text-stone-500">{Number(p.rating || 5).toFixed(1)} &middot; {p.completed_pujas || 0} pujas completed</span></div></div>
        </div>
        <div className="grid grid-cols-3 gap-2 mt-4">
          <div className="bg-cream rounded-xl p-3 text-center"><p className="font-display text-xl text-maroon-900">{p.experience_years}</p><p className="text-[11px] font-bold uppercase tracking-wide text-stone-400">Years Exp.</p></div>
          <div className="bg-cream rounded-xl p-3 text-center"><p className="font-display text-xl text-maroon-900">{pricing.length}</p><p className="text-[11px] font-bold uppercase tracking-wide text-stone-400">Puja Types</p></div>
          <div className="bg-cream rounded-xl p-3 text-center"><p className="font-display text-xl text-maroon-900">{photos.length}</p><p className="text-[11px] font-bold uppercase tracking-wide text-stone-400">Photos</p></div>
        </div>
        {p.about && <p className="text-stone-600 text-[15px] mt-4 leading-relaxed">{p.about}</p>}
        <div className="grid sm:grid-cols-2 gap-2 mt-4 text-sm">
          <div className="flex gap-2 items-start bg-cream rounded-xl p-3"><Award size={17} className="text-gold-600 shrink-0 mt-0.5" /><div><p className="text-[11px] font-bold uppercase tracking-wide text-stone-400">Certification</p><p className="font-semibold text-maroon-950">{p.certification || 'Traditional family parampara'}</p></div></div>
          <div className="flex gap-2 items-start bg-cream rounded-xl p-3"><BookOpen size={17} className="text-gold-600 shrink-0 mt-0.5" /><div><p className="text-[11px] font-bold uppercase tracking-wide text-stone-400">Specialization</p><p className="font-semibold text-maroon-950">{p.specialization}</p></div></div>
          <div className="flex gap-2 items-start bg-cream rounded-xl p-3"><MapPin size={17} className="text-gold-600 shrink-0 mt-0.5" /><div><p className="text-[11px] font-bold uppercase tracking-wide text-stone-400">Serving</p><p className="font-semibold text-maroon-950">{p.address || 'Home visits available'}</p></div></div>
        </div>
      </Card>
      <div>
        <SectionTitle title="Puja-wise Dakshina" subtitle="Variable pricing set by the purohit" />
        {pricing.length === 0 ? <EmptyState title="Pricing on request" subtitle="Contact this purohit for a quote." /> : (
          <Card className="divide-y divide-stone-100 overflow-hidden">
            {pricing.map((r: any, i: number) => (
              <div key={i} className="flex items-center justify-between gap-3 p-4"><span className="font-semibold text-maroon-950 text-[15px]">{r.puja_name || pujaNames[String(r.puja_id)] || 'Puja'}</span><div className="flex items-center gap-2"><span className="font-display text-lg text-maroon-900">{inr(r.price)}</span>{r.puja_id && <Link to={`/book?type=puja&pujaId=${r.puja_id}&purohitId=${p.id}`} className="text-[13px] font-bold bg-maroon-800 text-white rounded-lg px-3.5 py-1.5">Book</Link>}</div></div>
            ))}
          </Card>
        )}
      </div>
      <div>
        <SectionTitle title="Puja Gallery" subtitle="Photos of the purohit performing rituals" />
        {photos.length === 0 ? (<Card className="p-6 text-center text-sm text-stone-400 font-medium"><Camera size={22} className="mx-auto mb-1.5" /> No photos uploaded yet</Card>) : (
          <div className="grid grid-cols-3 gap-2">{photos.map((u: string, i: number) => (<button key={i} onClick={() => setLightbox(u)} className="rounded-xl overflow-hidden aspect-square bg-stone-100"><img src={absUrl(u)} alt="" className="w-full h-full object-cover" /></button>))}</div>
        )}
      </div>
      <Btn to={`/book?type=puja&purohitId=${p.id}`} className="w-full" variant="secondary">Book {String(p.full_name).split(' ')[0]} for a Puja</Btn>
      {lightbox && (<div className="fixed inset-0 z-[90] bg-maroon-950/90 flex items-center justify-center p-4" onClick={() => setLightbox(null)}><img src={absUrl(lightbox)} alt="" className="max-w-full max-h-[85vh] rounded-2xl" /></div>)}
    </div>
  );
}
