import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Search, Clock, BadgeCheck, ChevronRight, ListChecks, Users, Package } from 'lucide-react';
import { apiGet, inr, initials } from '../lib/format';
import { PageHeader } from '../components/layout';
import { Card, Loader, EmptyState, Badge, Btn, Stars, Price, SectionTitle } from '../components/ui';
import { useStore } from '../contexts/StoreContext';
export function PujasPage() {
  const [pujas, setPujas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  useEffect(() => { apiGet('/api/pujas').then((d) => setPujas(d.filter((p: any) => p.is_active))).catch(console.error).finally(() => setLoading(false)); }, []);
  const filtered = pujas.filter((p) => p.name.toLowerCase().includes(q.toLowerCase()));
  if (loading) return <Loader label="Loading pujas..." />;
  return (
    <div>
      <PageHeader title="Pujas & Anushthans" subtitle="Vedic rituals performed at your home or venue" />
      <div className="relative mb-4"><Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search Griha Pravesh, Rudrabhishek..." className="w-full rounded-2xl border border-stone-200 bg-white pl-11 pr-4 py-3 text-[15px] outline-none focus:border-saffron-500 focus:ring-2 focus:ring-saffron-200" /></div>
      {filtered.length === 0 ? <EmptyState title="No pujas found" /> : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map((p) => (
            <Link key={p.id} to={`/pujas/${p.id}`}><Card className="overflow-hidden h-full"><img src={p.image_url || '/images/diya.svg'} alt={p.name} className="w-full h-40 object-cover" /><div className="p-4"><Badge tone="gold">{p.category}</Badge><h3 className="font-display text-lg text-maroon-950 mt-1.5 leading-snug">{p.name}</h3><p className="text-[13px] text-stone-500 mt-1" style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{p.description}</p><div className="flex items-center justify-between mt-3"><span className="text-xs font-semibold text-stone-500 inline-flex items-center gap-1"><Clock size={13} /> {p.duration || 'Varies'}</span><span className="text-sm font-bold text-saffron-700">from {inr(p.base_price)}</span></div></div></Card></Link>
          ))}
        </div>
      )}
    </div>
  );
}
export function PujaDetailPage() {
  const { id } = useParams();
  const [puja, setPuja] = useState<any>(null);
  const [lists, setLists] = useState<any[]>([]);
  const [purohits, setPurohits] = useState<any[]>([]);
  const [packages, setPackages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [openList, setOpenList] = useState<number | null>(null);
  const { addToCart } = useStore();
  useEffect(() => {
    (async () => {
      try {
        const [pj, li, pr, pk] = await Promise.all([apiGet(`/api/pujas?id=${id}`), apiGet(`/api/puja-lists?puja_id=${id}`), apiGet('/api/purohits?status=approved'), apiGet(`/api/packages?puja_id=${id}`)]);
        setPuja(pj[0] || null); setLists(li); setPurohits(pr); setPackages(pk.filter((p: any) => p.is_active));
      } catch (e) { console.error(e); } finally { setLoading(false); }
    })();
  }, [id]);
  if (loading) return <Loader />;
  if (!puja) return <EmptyState title="Puja not found" action={<Btn to="/pujas">Back to Pujas</Btn>} />;
  const purohitPriceFor = (p: any) => {
    const arr = Array.isArray(p.pricing) ? p.pricing : [];
    const hit = arr.find((r: any) => Number(r.puja_id) === Number(puja.id) || r.puja_name === puja.name);
    return hit ? Number(hit.price) : null;
  };
  return (
    <div className="space-y-4">
      <PageHeader title={puja.name} subtitle={`${puja.category} - ${puja.duration || 'Flexible duration'}`} back />
      <Card className="overflow-hidden">
        <img src={puja.image_url || '/images/havan.svg'} alt={puja.name} className="w-full h-52 sm:h-64 object-cover" />
        <div className="p-4 sm:p-5">
          <p className="text-stone-600 text-[15px] leading-relaxed">{puja.description}</p>
          <div className="flex items-center justify-between mt-4 bg-cream rounded-2xl p-4 flex-wrap gap-2"><div><p className="text-xs font-bold uppercase tracking-wide text-stone-400">Base dakshina from</p><Price value={puja.base_price} className="text-2xl" /></div><Btn to={`/book?type=puja&pujaId=${puja.id}`}>Book this Puja</Btn></div>
        </div>
      </Card>
      <div>
        <SectionTitle title="Puja Dashakarma Lists" subtitle="Complete samagri kits with variable pricing by tier" />
        {lists.length === 0 ? <EmptyState title="No lists yet" subtitle="The admin will publish samagri lists for this puja soon." /> : (
          <div className="space-y-2.5">
            {lists.map((l) => {
              const items = Array.isArray(l.items) ? l.items : [];
              const open = openList === l.id;
              return (
                <Card key={l.id} className="p-4">
                  <div className="flex gap-3">
                    <div className="w-11 h-11 rounded-xl bg-maroon-50 text-maroon-700 flex items-center justify-center shrink-0"><ListChecks size={20} /></div>
                    <div className="flex-1"><div className="flex items-center gap-2 flex-wrap"><h3 className="font-bold text-maroon-950">{l.name}</h3><Badge tone={l.tier === 'Premium' ? 'gold' : l.tier === 'Basic' ? 'neutral' : 'maroon'}>{l.tier}</Badge></div><p className="text-xs text-stone-500 mt-0.5">{items.length} items &middot; {l.description}</p><p className="font-display text-xl text-maroon-900 mt-1">{inr(l.price)}</p></div>
                  </div>
                  {open && (<ul className="mt-3 grid sm:grid-cols-2 gap-1.5 bg-cream rounded-xl p-3">{items.map((it: any, i: number) => (<li key={i} className="text-[13px] text-stone-600 font-medium flex justify-between gap-2"><span>{it.name}</span><span className="text-stone-400">x {it.qty}</span></li>))}</ul>)}
                  <div className="flex gap-2 mt-3">
                    <button onClick={() => setOpenList(open ? null : l.id)} className="flex-1 text-[13px] font-bold border border-stone-200 rounded-xl py-2.5 text-stone-600">{open ? 'Hide items' : `View ${items.length} items`}</button>
                    <button onClick={() => addToCart({ key: `list-${l.id}`, kind: 'list', refId: l.id, name: `${l.name} (${puja.name})`, price: Number(l.price) })} className="flex-1 text-[13px] font-bold bg-saffron-500 hover:bg-saffron-600 text-white rounded-xl py-2.5">Add Kit to Cart</button>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
      <div>
        <SectionTitle title="Purohits for this Puja" subtitle="Each purohit sets their own dakshina" />
        <div className="grid sm:grid-cols-2 gap-2.5">
          {purohits.map((p) => {
            const fee = purohitPriceFor(p);
            return (
              <Card key={p.id} className="p-4 flex gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-maroon-700 to-saffron-600 text-white font-display flex items-center justify-center shrink-0">{initials(p.full_name)}</div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-maroon-950 flex items-center gap-1 truncate">{p.full_name} <BadgeCheck size={14} className="text-emerald-600 shrink-0" /></p>
                  <p className="text-xs text-stone-500">{p.experience_years} yrs &middot; {p.specialization}</p>
                  <div className="flex items-center gap-1.5 mt-0.5"><Stars value={Number(p.rating) || 5} size={12} /><span className="text-xs font-bold text-stone-500">{Number(p.rating || 5).toFixed(1)}</span></div>
                  <div className="flex items-center justify-between mt-2 gap-2"><span className="text-sm font-bold text-maroon-800">{fee !== null ? inr(fee) : `from ${inr(puja.base_price)}`}</span><Link to={`/book?type=puja&pujaId=${puja.id}&purohitId=${p.id}`} className="text-[13px] font-bold bg-maroon-800 text-white rounded-lg px-3.5 py-1.5">Book</Link></div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
      {packages.length > 0 && (
        <div>
          <SectionTitle title="Complete Packages" subtitle="Purohit + samagri bundled together" />
          <div className="grid sm:grid-cols-2 gap-2.5">
            {packages.map((pk) => (
              <Card key={pk.id} className="p-4">
                <div className="flex items-center gap-2"><Package size={16} className="text-saffron-600" /><Badge tone="gold">{pk.tier}</Badge></div>
                <h3 className="font-bold text-maroon-950 mt-1.5">{pk.name}</h3>
                <p className="text-xs text-stone-500 mt-0.5">Purohit {inr(pk.purohit_fee)} + Samagri {inr(pk.items_price)}</p>
                <div className="flex items-center justify-between mt-2"><Price value={pk.total_price} className="text-lg" /><Link to={`/book?type=package&packageId=${pk.id}`} className="text-[13px] font-bold text-saffron-700 inline-flex items-center gap-0.5">Book <ChevronRight size={15} /></Link></div>
              </Card>
            ))}
          </div>
        </div>
      )}
      <div className="flex items-center gap-2 text-xs text-stone-500 bg-white rounded-2xl border border-stone-200/70 p-3.5"><Users size={16} className="text-saffron-600 shrink-0" /> Prefer to choose your purohit first? <Link to="/purohits" className="font-bold text-saffron-700">Browse all purohits</Link></div>
    </div>
  );
}
