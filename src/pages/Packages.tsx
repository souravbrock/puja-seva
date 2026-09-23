import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BadgeCheck, Package, ArrowRight } from 'lucide-react';
import { apiGet, inr } from '../lib/format';
import { PageHeader } from '../components/layout';
import { Card, Loader, EmptyState, Badge, SectionTitle } from '../components/ui';
export default function PackagesPage() {
  const [packages, setPackages] = useState<any[]>([]);
  const [pujas, setPujas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tier, setTier] = useState('All');
  useEffect(() => { Promise.all([apiGet('/api/packages'), apiGet('/api/pujas')]).then(([pk, pj]) => { setPackages(pk.filter((p: any) => p.is_active)); setPujas(pj); }).catch(console.error).finally(() => setLoading(false)); }, []);
  const pujaName = (id: number) => pujas.find((p) => p.id === id)?.name || 'Puja';
  const filtered = packages.filter((p) => tier === 'All' || p.tier === tier);
  if (loading) return <Loader label="Loading complete packages..." />;
  return (
    <div>
      <PageHeader title="Complete Puja Packages" subtitle="Verified purohit + full dashakarma kit in one booking" />
      <div className="rounded-2xl overflow-hidden relative mb-4"><img src="/images/marigold.svg" alt="" className="w-full h-36 sm:h-44 object-cover" /><div className="absolute inset-0 bg-gradient-to-r from-maroon-950/85 to-maroon-950/20 flex items-center"><p className="text-white font-display text-lg sm:text-2xl px-5 max-w-md leading-snug">One booking. Everything arranged - purohit, samagri & vidhi.</p></div></div>
      <div className="flex gap-2 mb-4">{['All', 'Basic', 'Standard', 'Premium'].map((t) => (<button key={t} onClick={() => setTier(t)} className={`flex-1 text-[13px] font-bold px-3 py-2.5 rounded-xl border ${tier === t ? 'bg-maroon-800 text-white border-maroon-800' : 'bg-white text-stone-600 border-stone-200'}`}>{t}</button>))}</div>
      {filtered.length === 0 ? <EmptyState title="No packages" subtitle="Try another tier." /> : (
        <div className="grid sm:grid-cols-2 gap-3">
          {filtered.map((pk) => (
            <Card key={pk.id} className="p-5 flex flex-col">
              <div className="flex items-center justify-between"><Badge tone={pk.tier === 'Premium' ? 'gold' : pk.tier === 'Basic' ? 'neutral' : 'maroon'}><Package size={11} /> {pk.tier} Package</Badge>{pk.includes_purohit && <span className="text-[11px] font-bold text-emerald-700 inline-flex items-center gap-1"><BadgeCheck size={13} /> Purohit included</span>}</div>
              <h3 className="font-display text-xl text-maroon-950 mt-2 leading-snug">{pk.name}</h3>
              <p className="text-[13px] font-semibold text-saffron-700">{pujaName(pk.puja_id)}</p>
              <p className="text-sm text-stone-500 mt-1.5 leading-relaxed">{pk.description}</p>
              <div className="mt-3 bg-cream rounded-xl p-3.5 text-sm space-y-1.5">
                <div className="flex justify-between"><span className="text-stone-500 font-medium">Purohit dakshina</span><span className="font-bold text-maroon-900">{inr(pk.purohit_fee)}</span></div>
                <div className="flex justify-between"><span className="text-stone-500 font-medium">Dashakarma kit</span><span className="font-bold text-maroon-900">{inr(pk.items_price)}</span></div>
                <div className="border-t border-dashed border-stone-200 pt-1.5 flex justify-between"><span className="font-bold text-maroon-950">Total</span><span className="font-display text-xl text-maroon-900">{inr(pk.total_price)}</span></div>
              </div>
              <Link to={`/book?type=package&packageId=${pk.id}`} className="mt-3 inline-flex items-center justify-center gap-2 bg-gradient-to-r from-maroon-700 to-maroon-800 text-white text-sm font-bold rounded-xl py-3">Book this Package <ArrowRight size={16} /></Link>
            </Card>
          ))}
        </div>
      )}
      <div className="mt-5">
        <SectionTitle title="How it works" />
        <div className="grid sm:grid-cols-3 gap-2.5 text-sm">{[['1. Book & share details', 'Pick a package, date and your puja location.'], ['2. We assign & confirm', 'A verified purohit is assigned; samagri kit is packed.'], ['3. Puja at your home', 'Purohit arrives with the kit and performs the vidhi.']].map(([t, s]) => (<Card key={t} className="p-4"><p className="font-bold text-maroon-950">{t}</p><p className="text-stone-500 text-[13px] mt-1">{s}</p></Card>))}</div>
      </div>
    </div>
  );
}
