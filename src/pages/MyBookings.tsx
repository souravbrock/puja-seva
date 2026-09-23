import { useEffect, useState } from 'react';
import { CalendarDays, ShoppingBag, MapPin, Phone } from 'lucide-react';
import { apiGet, apiSend, inr, fmtDateTime } from '../lib/format';
import { useAuth } from '../contexts/AuthContext';
import { useStore } from '../contexts/StoreContext';
import { PageHeader } from '../components/layout';
import { Card, Loader, EmptyState, Btn, StatusBadge, Badge } from '../components/ui';
const BOOKING_STEPS = ['booked', 'assigned', 'fulfilled'];
const ORDER_STEPS = ['booked', 'preparing', 'dispatched', 'delivered'];
function Timeline({ steps, current }: { steps: string[]; current: string }) {
  const idx = steps.indexOf(current.toLowerCase());
  if (current.toLowerCase() === 'cancelled') return <span className="inline-block mt-3 text-xs font-bold text-red-600 bg-red-50 px-3 py-1.5 rounded-full">Cancelled</span>;
  return (
    <div className="flex items-center mt-3">
      {steps.map((s, i) => (
        <div key={s} className="flex items-center flex-1 last:flex-none">
          <div className="flex flex-col items-center gap-1"><div className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold ${i <= idx ? 'bg-emerald-500 text-white' : 'bg-stone-200 text-stone-400'}`}>{i + 1}</div><span className={`text-[10px] font-bold uppercase ${i <= idx ? 'text-emerald-700' : 'text-stone-400'}`}>{s}</span></div>
          {i < steps.length - 1 && <div className={`h-0.5 flex-1 mx-1 mb-4 rounded ${i < idx ? 'bg-emerald-500' : 'bg-stone-200'}`} />}
        </div>
      ))}
    </div>
  );
}
export default function MyBookingsPage() {
  const { user } = useAuth();
  const { showToast } = useStore();
  const [tab, setTab] = useState<'bookings' | 'orders'>('bookings');
  const [bookings, setBookings] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [pujas, setPujas] = useState<any[]>([]);
  const [packages, setPackages] = useState<any[]>([]);
  const [purohits, setPurohits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const load = async () => {
    if (!user) return;
    try {
      const [b, o, pj, pk, pr] = await Promise.all([apiGet(`/api/bookings?user_id=${user.id}`), apiGet(`/api/orders?user_id=${user.id}`), apiGet('/api/pujas'), apiGet('/api/packages'), apiGet('/api/purohits')]);
      setBookings(b); setOrders(o); setPujas(pj); setPackages(pk); setPurohits(pr);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, [user]);
  const bookingTitle = (b: any) => {
    if (b.package_id) return packages.find((p) => p.id === b.package_id)?.name || `Package #${b.package_id}`;
    if (b.upcoming_puja_id) return 'Community Puja Seat';
    if (b.puja_id) return pujas.find((p) => p.id === b.puja_id)?.name || `Puja #${b.puja_id}`;
    return 'Puja Booking';
  };
  const purohitName = (id: number) => purohits.find((p) => p.id === id)?.full_name;
  const cancelBooking = async (id: number) => { if (!confirm('Cancel this booking?')) return; await apiSend('/api/bookings', 'PUT', { id, status: 'cancelled' }); showToast('Booking cancelled'); load(); };
  const cancelOrder = async (id: number) => { if (!confirm('Cancel this order?')) return; await apiSend('/api/orders', 'PUT', { id, status: 'cancelled' }); showToast('Order cancelled'); load(); };
  if (loading) return <Loader label="Loading your bookings..." />;
  return (
    <div className="max-w-2xl mx-auto">
      <PageHeader title="My Bookings & Orders" subtitle="Live status of pujas and samagri orders" />
      <div className="grid grid-cols-2 gap-2 bg-white border border-stone-200/70 rounded-2xl p-1.5 mb-4">
        <button onClick={() => setTab('bookings')} className={`flex items-center justify-center gap-2 font-bold text-sm rounded-xl py-2.5 ${tab === 'bookings' ? 'bg-maroon-800 text-white' : 'text-stone-500'}`}><CalendarDays size={16} /> Puja Bookings ({bookings.length})</button>
        <button onClick={() => setTab('orders')} className={`flex items-center justify-center gap-2 font-bold text-sm rounded-xl py-2.5 ${tab === 'orders' ? 'bg-maroon-800 text-white' : 'text-stone-500'}`}><ShoppingBag size={16} /> Orders ({orders.length})</button>
      </div>
      {tab === 'bookings' && (bookings.length === 0 ? <EmptyState title="No bookings yet" subtitle="Book a puja package or reserve an event seat." action={<Btn to="/packages">Browse Packages</Btn>} /> : (
        <div className="space-y-3">
          {bookings.map((b) => (
            <Card key={b.id} className="p-4">
              <div className="flex items-start justify-between gap-2"><div><p className="text-[11px] font-bold text-stone-400">#SKB-{b.id} &middot; {fmtDateTime(b.created_at)}</p><h3 className="font-bold text-maroon-950 text-[17px]">{bookingTitle(b)}</h3></div><StatusBadge status={b.status} /></div>
              <div className="text-[13px] text-stone-500 font-medium mt-1.5 space-y-1">
                <p>{fmtDateTime(b.booking_date)}{b.gotra ? ` - ${b.gotra} gotra` : ''}</p>
                <p className="flex items-center gap-1"><MapPin size={12} /> {b.puja_location}</p>
                {b.purohit_id && purohitName(b.purohit_id) && <p>Purohit: <span className="font-bold text-maroon-800">{purohitName(b.purohit_id)}</span></p>}
                {!b.purohit_id && b.status === 'booked' && <p><Badge tone="amber">Purohit assignment pending</Badge></p>}
                <p className="flex items-center gap-1"><Phone size={12} /> {b.phone}</p>
              </div>
              <Timeline steps={BOOKING_STEPS} current={b.status} />
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-dashed border-stone-200"><span className="font-display text-xl text-maroon-900">{inr(b.amount)}</span>{b.status === 'booked' && <button onClick={() => cancelBooking(b.id)} className="text-[13px] font-bold text-red-500">Cancel booking</button>}</div>
            </Card>
          ))}
        </div>
      ))}
      {tab === 'orders' && (orders.length === 0 ? <EmptyState title="No orders yet" subtitle="Order dashakarma items for home delivery." action={<Btn to="/items">Shop Items</Btn>} /> : (
        <div className="space-y-3">
          {orders.map((o) => (
            <Card key={o.id} className="p-4">
              <div className="flex items-start justify-between gap-2"><div><p className="text-[11px] font-bold text-stone-400">#SKO-{o.id} &middot; {fmtDateTime(o.created_at)}</p><h3 className="font-bold text-maroon-950 text-[17px]">{(o.items || []).length} item(s) &middot; {inr(o.total_amount)}</h3></div><StatusBadge status={o.status} /></div>
              <div className="bg-cream rounded-xl p-3 mt-2.5 text-[13px]">
                {(o.items || []).map((it: any, i: number) => (<div key={i} className="flex justify-between py-0.5"><span className="text-stone-600 font-medium">{it.name} x {it.qty}</span><span className="font-bold text-maroon-900">{inr(Number(it.price) * it.qty)}</span></div>))}
                <p className="text-stone-400 font-medium mt-1.5 flex items-center gap-1"><MapPin size={12} /> {o.delivery_address}</p>
              </div>
              <Timeline steps={ORDER_STEPS} current={o.status} />
              {o.status === 'booked' && <div className="text-right mt-2"><button onClick={() => cancelOrder(o.id)} className="text-[13px] font-bold text-red-500">Cancel order</button></div>}
            </Card>
          ))}
        </div>
      ))}
    </div>
  );
}
