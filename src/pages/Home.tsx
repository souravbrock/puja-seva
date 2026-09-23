import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShoppingBag, ScrollText, Users, Package, CalendarDays, ChevronRight, MapPin, ArrowRight, BadgeCheck, Star, Clock } from 'lucide-react';
import { apiGet, inr, fmtDateTime, initials, absUrl } from '../lib/format';
import { Countdown, MiniCountdown } from '../components/layout';
import { Card, SectionTitle, Stars, Price, Badge, Loader } from '../components/ui';
import { useStore } from '../contexts/StoreContext';
const fadeUp = { initial: { opacity: 0, y: 18 }, animate: { opacity: 1, y: 0 } };
export default function Home() {
  const [items, setItems] = useState<any[]>([]);
  const [pujas, setPujas] = useState<any[]>([]);
  const [purohits, setPurohits] = useState<any[]>([]);
  const [packages, setPackages] = useState<any[]>([]);
  const [upcoming, setUpcoming] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { addToCart } = useStore();
  useEffect(() => {
    (async () => {
      try {
        const [it, pj, pr, pk, up] = await Promise.all([apiGet('/api/items'), apiGet('/api/pujas'), apiGet('/api/purohits?status=approved'), apiGet('/api/packages'), apiGet('/api/upcoming')]);
        setItems(it); setPujas(pj.filter((p: any) => p.is_active));
        setPurohits(pr); setPackages(pk.filter((p: any) => p.is_active)); setUpcoming(up);
      } catch (e) { console.error(e); } finally { setLoading(false); }
    })();
  }, []);
  const nextEvent = upcoming.filter((u) => new Date(u.event_date).getTime() > Date.now()).sort((a, b) => +new Date(a.event_date) - +new Date(b.event_date))[0];
  if (loading) return <Loader label="Loading SevaKendra..." />;
  return (
    <div className="space-y-6">
      <motion.section {...fadeUp} className="relative overflow-hidden rounded-3xl bg-maroon-950 text-white">
        <img src="/images/hero.svg" alt="Puja thali" className="absolute inset-0 w-full h-full object-cover opacity-45" />
        <div className="absolute inset-0 bg-gradient-to-t from-maroon-950 via-maroon-950/60 to-maroon-950/20" />
        <div className="relative p-6 sm:p-10 max-w-2xl">
          <Badge tone="gold">Shubh Aarambh</Badge>
          <h1 className="font-display text-3xl sm:text-5xl leading-tight mt-3 text-balance">Book Trusted Purohits & Complete Dashakarma Kits</h1>
          <p className="text-white/80 mt-3 text-sm sm:text-base">Verified purohits, authentic samagri, and all-inclusive puja packages delivered and performed at your home.</p>
          <div className="flex flex-wrap gap-2.5 mt-5">
            <Link to="/packages" className="inline-flex items-center gap-2 bg-saffron-500 hover:bg-saffron-600 text-white font-bold rounded-xl px-5 py-3 text-sm shadow-lg shadow-saffron-900/40">Book Puja Package <ArrowRight size={16} /></Link>
            <Link to="/items" className="inline-flex items-center gap-2 bg-white/15 hover:bg-white/25 backdrop-blur text-white font-bold rounded-xl px-5 py-3 text-sm border border-white/20">Shop Dashakarma</Link>
          </div>
        </div>
      </motion.section>
      <motion.section {...fadeUp} transition={{ delay: 0.05 }} className="grid grid-cols-4 sm:grid-cols-5 gap-2.5">
        {[{ to: '/items', icon: ShoppingBag, label: 'Dashakarma' }, { to: '/pujas', icon: ScrollText, label: 'Pujas' }, { to: '/purohits', icon: Users, label: 'Purohits' }, { to: '/packages', icon: Package, label: 'Packages' }, { to: '/upcoming', icon: CalendarDays, label: 'Upcoming' }].map((a) => (
          <Link key={a.to} to={a.to} className="flex flex-col items-center gap-1.5 bg-white rounded-2xl border border-stone-200/70 py-4 px-1 active:scale-95 transition shadow-sm last:col-span-4 sm:last:col-span-1 last:flex-row sm:last:flex-col last:justify-center">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-maroon-700 to-saffron-600 text-white flex items-center justify-center"><a.icon size={20} /></div>
            <span className="text-xs font-bold text-maroon-950">{a.label}</span>
          </Link>
        ))}
      </motion.section>
      {nextEvent && (
        <motion.section {...fadeUp} transition={{ delay: 0.08 }}>
          <SectionTitle title="Upcoming Community Puja" subtitle="Reserve your seat before the countdown ends" action={<Link to="/upcoming" className="text-sm font-bold text-saffron-700 inline-flex items-center gap-1">View all <ChevronRight size={16} /></Link>} />
          <Card className="overflow-hidden">
            <div className="relative">
              <img src={absUrl(nextEvent.image_url) || '/images/havan.svg'} alt={nextEvent.title} className="w-full h-44 sm:h-56 object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-maroon-950/90 via-maroon-950/30 to-transparent" />
              <div className="absolute bottom-0 inset-x-0 p-4 flex items-end justify-between gap-3">
                <div><h3 className="font-display text-xl text-white">{nextEvent.title}</h3><p className="text-white/80 text-xs font-medium flex items-center gap-1 mt-1"><MapPin size={12} /> {nextEvent.venue} &middot; {fmtDateTime(nextEvent.event_date)}</p></div>
                <Link to={`/book?type=upcoming&upcomingId=${nextEvent.id}`} className="shrink-0 bg-gold-500 hover:bg-gold-400 text-maroon-950 text-sm font-bold rounded-xl px-4 py-2.5">Book Seat</Link>
              </div>
            </div>
            <div className="p-4 flex items-center justify-between gap-3 flex-wrap bg-gradient-to-r from-maroon-50 to-gold-50">
              <Countdown target={nextEvent.event_date} />
              <div className="text-right"><p className="text-xs text-stone-500 font-semibold">Contribution</p><p className="font-display text-xl text-maroon-900">{inr(nextEvent.price)}</p></div>
            </div>
          </Card>
        </motion.section>
      )}
      <section>
        <SectionTitle title="Popular Pujas" subtitle="Performed by verified purohits at your home" action={<Link to="/pujas" className="text-sm font-bold text-saffron-700 inline-flex items-center gap-1">View all <ChevronRight size={16} /></Link>} />
        <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4">
          {pujas.slice(0, 8).map((p) => (
            <Link key={p.id} to={`/pujas/${p.id}`} className="shrink-0 w-[240px] bg-white rounded-2xl border border-stone-200/70 overflow-hidden shadow-sm">
              <img src={absUrl(p.image_url) || '/images/diya.svg'} alt={p.name} className="w-full h-32 object-cover" />
              <div className="p-3"><p className="font-bold text-maroon-950 text-[15px] leading-snug">{p.name}</p><p className="text-xs text-stone-500 mt-0.5 flex items-center gap-1"><Clock size={12} /> {p.duration || 'Varies'}</p><p className="mt-1.5 text-sm font-bold text-saffron-700">from {inr(p.base_price)}</p></div>
            </Link>
          ))}
        </div>
      </section>
      <section>
        <SectionTitle title="Complete Puja Packages" subtitle="Purohit + dashakarma samagri in one booking" action={<Link to="/packages" className="text-sm font-bold text-saffron-700 inline-flex items-center gap-1">View all <ChevronRight size={16} /></Link>} />
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {packages.slice(0, 3).map((pk) => (
            <Card key={pk.id} className="p-4">
              <div className="flex items-start justify-between gap-2"><div><Badge tone="maroon">{pk.tier}</Badge><h3 className="font-bold text-maroon-950 mt-1.5 leading-snug">{pk.name}</h3></div><p className="font-display text-lg text-maroon-900 whitespace-nowrap">{inr(pk.total_price)}</p></div>
              <div className="mt-2 text-xs text-stone-500 font-medium space-y-0.5"><p>Purohit dakshina: {inr(pk.purohit_fee)}</p><p>Samagri kit: {inr(pk.items_price)}</p></div>
              <Link to={`/book?type=package&packageId=${pk.id}`} className="mt-3 block text-center bg-maroon-800 hover:bg-maroon-900 text-white text-sm font-bold rounded-xl py-2.5">Book Package</Link>
            </Card>
          ))}
        </div>
      </section>
      <section>
        <SectionTitle title="Dashakarma Essentials" subtitle="Individual samagri items with fixed prices" action={<Link to="/items" className="text-sm font-bold text-saffron-700 inline-flex items-center gap-1">Shop all <ChevronRight size={16} /></Link>} />
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {items.slice(0, 8).map((it) => (
            <Card key={it.id} className="overflow-hidden">
              <Link to={`/items/${it.id}`}>
                <div className="h-24 bg-gradient-to-br from-maroon-100 via-gold-100 to-saffron-100 flex items-center justify-center text-maroon-700"><span className="font-display text-2xl">{it.name_hindi?.[0] || it.name?.[0]}</span></div>
                <div className="p-3"><p className="font-bold text-maroon-950 text-sm leading-snug truncate">{it.name}</p><div className="flex items-center justify-between mt-1"><Price value={it.price} unit={it.unit} className="text-sm" /></div></div>
              </Link>
              <div className="px-3 pb-3"><button onClick={() => addToCart({ key: `item-${it.id}`, kind: 'item', refId: it.id, name: it.name, price: Number(it.price), unit: it.unit })} className="w-full text-xs font-bold bg-saffron-100 hover:bg-saffron-200 text-saffron-800 rounded-lg py-2">Add to Cart</button></div>
            </Card>
          ))}
        </div>
      </section>
      <section>
        <SectionTitle title="Verified Purohits" subtitle="Expertise, experience & transparent dakshina" action={<Link to="/purohits" className="text-sm font-bold text-saffron-700 inline-flex items-center gap-1">View all <ChevronRight size={16} /></Link>} />
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {purohits.slice(0, 3).map((p) => (
            <Link key={p.id} to={`/purohits/${p.id}`}><Card className="p-4 flex gap-3"><div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-maroon-700 to-saffron-600 text-white font-display text-lg flex items-center justify-center shrink-0">{initials(p.full_name)}</div><div className="min-w-0"><p className="font-bold text-maroon-950 flex items-center gap-1.5 truncate">{p.full_name} <BadgeCheck size={15} className="text-emerald-600 shrink-0" /></p><p className="text-xs text-stone-500 font-medium truncate">{p.specialization} &middot; {p.experience_years} yrs exp</p><div className="flex items-center gap-1.5 mt-1"><Stars value={Number(p.rating) || 5} /><span className="text-xs font-bold text-stone-500">{Number(p.rating || 5).toFixed(1)}</span></div></div></Card></Link>
          ))}
        </div>
      </section>
      {upcoming.length > 1 && (
        <section>
          <SectionTitle title="More Upcoming Events" />
          <div className="space-y-2.5">
            {upcoming.filter((u) => !nextEvent || u.id !== nextEvent.id).slice(0, 3).map((u) => (
              <Link key={u.id} to="/upcoming"><Card className="p-3.5 flex items-center gap-3"><img src={absUrl(u.image_url) || '/images/marigold.svg'} alt="" className="w-14 h-14 rounded-xl object-cover shrink-0" /><div className="flex-1 min-w-0"><p className="font-bold text-maroon-950 text-[15px] truncate">{u.title}</p><p className="text-xs text-stone-500 font-medium">{fmtDateTime(u.event_date)} &middot; {u.venue}</p><MiniCountdown target={u.event_date} /></div><span className="text-sm font-bold text-maroon-800 shrink-0">{inr(u.price)}</span></Card></Link>
            ))}
          </div>
        </section>
      )}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-maroon-800 to-maroon-950 text-white p-6 sm:p-8">
        <Star size={120} className="absolute -right-6 -bottom-6 text-white/5" />
        <h2 className="font-display text-2xl">Are you a Purohit?</h2>
        <p className="text-white/75 text-sm mt-1 max-w-md">Register with your certification and experience, set your own dakshina for each puja, and receive bookings from devotees near you.</p>
        <Link to="/purohit/register" className="mt-4 inline-flex items-center gap-2 bg-gold-500 hover:bg-gold-400 text-maroon-950 font-bold rounded-xl px-5 py-3 text-sm">Register as Purohit <ArrowRight size={16} /></Link>
      </section>
    </div>
  );
}
