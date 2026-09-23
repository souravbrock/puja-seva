import { useEffect, useState } from 'react';
import { LayoutDashboard, Users, ShoppingBag, ListChecks, ScrollText, Package, CalendarDays, ClipboardList, Truck, Plus, Pencil, Trash2, Check, X, Search, Eye, EyeOff } from 'lucide-react';
import { apiGet, apiSend, inr, fmtDateTime } from '../lib/format';
import { useStore } from '../contexts/StoreContext';
import { PageHeader } from '../components/layout';
import { Card, Loader, EmptyState, Field, Input, TextArea, Select, Btn, Badge, StatusBadge, Modal, Stars } from '../components/ui';
type Tab = 'overview' | 'purohits' | 'items' | 'lists' | 'pujas' | 'packages' | 'upcoming' | 'bookings' | 'orders';
const TABS: { id: Tab; label: string; icon: any }[] = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'purohits', label: 'Purohits', icon: Users },
  { id: 'items', label: 'Items', icon: ShoppingBag },
  { id: 'lists', label: 'Samagri Lists', icon: ListChecks },
  { id: 'pujas', label: 'Pujas', icon: ScrollText },
  { id: 'packages', label: 'Packages', icon: Package },
  { id: 'upcoming', label: 'Upcoming', icon: CalendarDays },
  { id: 'bookings', label: 'Bookings', icon: ClipboardList },
  { id: 'orders', label: 'Sales', icon: Truck },
];
const ITEM_CATS = ['Diya & Light', 'Fragrance', 'Flowers & Garlands', 'Prasad & Food', 'Havan', 'Cloth & Decor', 'Puja Essentials', 'Sacred Water', 'Leaves & Nuts', 'Essentials'];
const IMAGES = ['/images/hero.svg', '/images/havan.svg', '/images/diya.svg', '/images/marigold.svg'];
export default function AdminPage() {
  const { showToast } = useStore();
  const [tab, setTab] = useState<Tab>('overview');
  const [loading, setLoading] = useState(true);
  const [purohits, setPurohits] = useState<any[]>([]);
  const [items, setItems] = useState<any[]>([]);
  const [lists, setLists] = useState<any[]>([]);
  const [pujas, setPujas] = useState<any[]>([]);
  const [packages, setPackages] = useState<any[]>([]);
  const [upcoming, setUpcoming] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [q, setQ] = useState('');
  const [modal, setModal] = useState<null | Tab>(null);
  const [editRow, setEditRow] = useState<any>(null);
  const [form, setForm] = useState<any>({});
  const [saving, setSaving] = useState(false);
  const [assignRow, setAssignRow] = useState<any>(null);
  // Samagri-list item rows: pick catalogue item from dropdown + quantity,
  // same pattern as the purohit dakshina rows. Stored as [{name, qty}].
  const [listRows, setListRows] = useState<{ item_id: string; qty: string }[]>([]);
  useEffect(() => {
    if (modal === 'lists') {
      const arr = Array.isArray(form.items) ? form.items : [];
      setListRows(
        arr.length
          ? arr.map((it: any) => {
              const found = items.find((i) => i.name === it.name);
              return { item_id: found ? String(found.id) : '', qty: String(it.qty ?? 1) };
            })
          : [{ item_id: '', qty: '1' }],
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modal]);
  const syncListRows = (rows: { item_id: string; qty: string }[]) => {
    setListRows(rows);
    F(
      'items',
      rows
        .filter((r) => r.item_id)
        .map((r) => {
          const it = items.find((i) => String(i.id) === r.item_id);
          return { name: it ? it.name : '', qty: Number(r.qty) || 1 };
        }),
    );
  };
  const load = async () => {
    try {
      const [pr, it, li, pj, pk, up, bk, or] = await Promise.all([apiGet('/api/purohits'), apiGet('/api/items'), apiGet('/api/puja-lists'), apiGet('/api/pujas'), apiGet('/api/packages'), apiGet('/api/upcoming'), apiGet('/api/bookings'), apiGet('/api/orders')]);
      setPurohits(pr); setItems(it); setLists(li); setPujas(pj); setPackages(pk); setUpcoming(up); setBookings(bk); setOrders(or);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);
  const F = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }));
  const openAdd = (t: Tab, defaults: any = {}) => { setEditRow(null); setForm(defaults); setModal(t); };
  const openEdit = (t: Tab, row: any, map: (r: any) => any) => { setEditRow(row); setForm(map(row)); setModal(t); };
  const endpoint: Record<string, string> = { items: '/api/items', lists: '/api/puja-lists', pujas: '/api/pujas', packages: '/api/packages', upcoming: '/api/upcoming' };
  const save = async () => {
    if (!modal || !endpoint[modal]) return;
    setSaving(true);
    try {
      if (editRow) await apiSend(endpoint[modal], 'PUT', { id: editRow.id, ...form });
      else await apiSend(endpoint[modal], 'POST', form);
      showToast(editRow ? 'Updated successfully' : 'Added successfully');
      setModal(null); setForm({}); setEditRow(null); load();
    } catch (e: any) { showToast(e.message); } finally { setSaving(false); }
  };
  const remove = async (ep: string, id: number, label: string) => { if (!confirm(`Delete this ${label}?`)) return; try { await apiSend(ep, 'DELETE', { id }); showToast('Deleted'); load(); } catch (e: any) { showToast(e.message); } };
  const setPurohitStatus = async (id: number, status: string) => { try { await apiSend('/api/purohits', 'PUT', { id, status }); showToast(`Purohit ${status}`); load(); } catch (e: any) { showToast(e.message); } };
  const setBookingStatus = async (id: number, status: string, extra: any = {}) => { try { await apiSend('/api/bookings', 'PUT', { id, status, ...extra }); showToast(`Booking ${status}`); load(); } catch (e: any) { showToast(e.message); } };
  const setOrderStatus = async (id: number, status: string) => { try { await apiSend('/api/orders', 'PUT', { id, status }); showToast(`Order ${status}`); load(); } catch (e: any) { showToast(e.message); } };
  const pujaName = (id: number) => pujas.find((p) => p.id === id)?.name || `#${id}`;
  const purohitName = (id: number) => purohits.find((p) => p.id === id)?.full_name || `#${id}`;
  if (loading) return <Loader label="Loading admin console..." />;
  const pending = purohits.filter((p) => p.status === 'pending');
  const revenue = orders.filter((o) => o.status !== 'cancelled').reduce((s, o) => s + Number(o.total_amount || 0), 0);
  const bookingValue = bookings.filter((b) => b.status !== 'cancelled').reduce((s, b) => s + Number(b.amount || 0), 0);
  const match = (s: string) => String(s || '').toLowerCase().includes(q.toLowerCase());
  return (
    <div className="space-y-4">
      <PageHeader title="Admin Console" subtitle="Registrations, listings, bookings & sales dashboards" />
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4">
        {TABS.map((t) => (<button key={t.id} onClick={() => { setTab(t.id); setQ(''); }} className={`shrink-0 inline-flex items-center gap-1.5 text-[13px] font-bold px-4 py-2.5 rounded-xl border ${tab === t.id ? 'bg-maroon-800 text-white border-maroon-800' : 'bg-white text-stone-500 border-stone-200'}`}><t.icon size={15} /> {t.label}{t.id === 'purohits' && pending.length > 0 && <span className="min-w-[20px] h-5 px-1 rounded-full bg-saffron-500 text-white text-[11px] flex items-center justify-center">{pending.length}</span>}</button>))}
      </div>
      {tab === 'overview' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
            {[['Total bookings', bookings.length, inr(bookingValue)], ['Total orders', orders.length, inr(revenue)], ['Verified purohits', purohits.filter((p) => p.status === 'approved').length, `${pending.length} pending`], ['Live pujas', pujas.filter((p) => p.is_active).length, `${packages.length} packages`]].map(([a, b, c]) => (<Card key={a as string} className="p-4"><p className="text-[11px] font-bold uppercase tracking-wide text-stone-400">{a}</p><p className="font-display text-3xl text-maroon-900 mt-1">{b}</p><p className="text-xs font-bold text-saffron-700 mt-0.5">{c}</p></Card>))}
          </div>
          <div className="grid lg:grid-cols-2 gap-3">
            <Card className="p-4"><h3 className="font-bold text-maroon-950 mb-2.5">Booking pipeline</h3>{['booked', 'assigned', 'fulfilled', 'cancelled'].map((s) => (<div key={s} className="flex items-center justify-between py-1.5 border-b border-stone-100 last:border-0"><StatusBadge status={s} /><span className="font-bold text-maroon-900">{bookings.filter((b) => b.status === s).length}</span></div>))}<Btn variant="outline" className="w-full mt-3" onClick={() => setTab('bookings')}>Open booking dashboard</Btn></Card>
            <Card className="p-4"><h3 className="font-bold text-maroon-950 mb-2.5">Sales pipeline</h3>{['booked', 'preparing', 'dispatched', 'delivered', 'cancelled'].map((s) => (<div key={s} className="flex items-center justify-between py-1.5 border-b border-stone-100 last:border-0"><StatusBadge status={s} /><span className="font-bold text-maroon-900">{orders.filter((o) => o.status === s).length}</span></div>))}<Btn variant="outline" className="w-full mt-3" onClick={() => setTab('orders')}>Open sales dashboard</Btn></Card>
          </div>
          {pending.length > 0 && (<Card className="p-4 bg-amber-50"><h3 className="font-bold text-maroon-950">{pending.length} purohit registration(s) awaiting review</h3><Btn variant="secondary" className="mt-2.5" onClick={() => setTab('purohits')}>Review now</Btn></Card>)}
        </div>
      )}
      {tab === 'purohits' && (
        <div className="space-y-3">
          {pending.length > 0 && <h3 className="font-bold text-maroon-950">Pending approval ({pending.length})</h3>}
          {pending.map((p) => <PurohitReviewCard key={p.id} p={p} onApprove={() => setPurohitStatus(p.id, 'approved')} onDecline={() => setPurohitStatus(p.id, 'declined')} />)}
          <h3 className="font-bold text-maroon-950 pt-2">All purohits ({purohits.length})</h3>
          {purohits.filter((p) => match(p.full_name + ' ' + (p.specialization || ''))).map((p) => (
            <Card key={p.id} className="p-4">
              <div className="flex items-start justify-between gap-2 flex-wrap">
                <div><p className="font-bold text-maroon-950">{p.full_name} <span className="text-xs font-medium text-stone-400">- {p.experience_years} yrs - {p.specialization}</span></p><p className="text-xs text-stone-500 font-medium">{p.phone} - {p.email} - Aadhaar: {p.aadhaar || '-'} - {p.certification}</p><div className="flex items-center gap-1.5 mt-1.5"><StatusBadge status={p.status} /><Stars value={Number(p.rating) || 5} size={12} /><span className="text-xs font-bold text-stone-400">{(p.pricing || []).length} priced pujas - {(p.photos || []).length} photos</span></div></div>
                <div className="flex gap-1.5">
                  {p.status !== 'approved' && <button onClick={() => setPurohitStatus(p.id, 'approved')} className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center" title="Approve"><Check size={17} /></button>}
                  {p.status !== 'declined' && <button onClick={() => setPurohitStatus(p.id, 'declined')} className="w-9 h-9 rounded-xl bg-red-100 text-red-600 flex items-center justify-center" title="Decline"><X size={17} /></button>}
                  <button onClick={() => remove('/api/purohits', p.id, 'purohit')} className="w-9 h-9 rounded-xl bg-stone-100 text-stone-400 flex items-center justify-center" title="Delete"><Trash2 size={16} /></button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
      {(tab === 'items' || tab === 'lists' || tab === 'pujas' || tab === 'packages' || tab === 'upcoming') && (
        <div className="space-y-3">
          <div className="flex gap-2">
            <div className="relative flex-1"><Search size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" /><Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search..." className="pl-10" /></div>
            <button onClick={() => {
              if (tab === 'items') openAdd('items', { category: 'Essentials', unit: 'pc', in_stock: true, price: '', used_in_pujas: [] });
              if (tab === 'lists') openAdd('lists', { puja_id: pujas[0]?.id || '', tier: 'Standard', price: '', items: [] });
              if (tab === 'pujas') openAdd('pujas', { category: 'Sanskar', is_active: true, base_price: '', image_url: IMAGES[0] });
              if (tab === 'packages') openAdd('packages', { puja_id: pujas[0]?.id || '', tier: 'Standard', includes_purohit: true, is_active: true, purohit_fee: '', items_price: '', total_price: '' });
              if (tab === 'upcoming') openAdd('upcoming', { puja_id: '', purohit_id: '', price: '', seats_total: 50, image_url: IMAGES[1] });
            }} className="shrink-0 inline-flex items-center gap-1.5 bg-maroon-800 text-white text-sm font-bold rounded-xl px-4"><Plus size={16} /> Add</button>
          </div>
          {tab === 'items' && items.filter((i) => match(i.name)).map((i) => (
            <Card key={i.id} className="p-3.5 flex items-center gap-3">
              <div className="flex-1 min-w-0"><p className="font-bold text-maroon-950 truncate">{i.name} <span className="text-xs text-stone-400 font-medium">{i.name_hindi}</span></p><p className="text-xs text-stone-500 font-medium">{i.category} - {inr(i.price)}/{i.unit} - {(i.used_in_pujas || []).length} pujas {i.in_stock ? '' : '- OUT OF STOCK'}</p></div>
              <button onClick={() => openEdit('items', i, (r) => ({ name: r.name, name_hindi: r.name_hindi, description: r.description, price: r.price, unit: r.unit, category: r.category, image_url: r.image_url, used_in_pujas: r.used_in_pujas || [], in_stock: r.in_stock }))} className="w-9 h-9 rounded-xl bg-stone-100 text-stone-500 flex items-center justify-center shrink-0"><Pencil size={15} /></button>
              <button onClick={() => remove('/api/items', i.id, 'item')} className="w-9 h-9 rounded-xl bg-red-50 text-red-500 flex items-center justify-center shrink-0"><Trash2 size={15} /></button>
            </Card>
          ))}
          {tab === 'lists' && lists.filter((l) => match(l.name + ' ' + pujaName(l.puja_id))).map((l) => (
            <Card key={l.id} className="p-3.5">
              <div className="flex items-start justify-between gap-2">
                <div><p className="font-bold text-maroon-950">{l.name} <Badge tone={l.tier === 'Premium' ? 'gold' : 'maroon'}>{l.tier}</Badge></p><p className="text-xs text-stone-500 font-medium">{pujaName(l.puja_id)} - {(l.items || []).length} items - <span className="font-bold text-maroon-800">{inr(l.price)}</span></p></div>
                <div className="flex gap-1.5 shrink-0">
                  <button onClick={() => openEdit('lists', l, (r) => ({ puja_id: r.puja_id, name: r.name, description: r.description, tier: r.tier, price: r.price, items: r.items || [] }))} className="w-9 h-9 rounded-xl bg-stone-100 text-stone-500 flex items-center justify-center"><Pencil size={15} /></button>
                  <button onClick={() => remove('/api/puja-lists', l.id, 'list')} className="w-9 h-9 rounded-xl bg-red-50 text-red-500 flex items-center justify-center"><Trash2 size={15} /></button>
                </div>
              </div>
            </Card>
          ))}
          {tab === 'pujas' && pujas.filter((p) => match(p.name)).map((p) => (
            <Card key={p.id} className="p-3.5">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0"><p className="font-bold text-maroon-950">{p.name} {!p.is_active && <Badge tone="neutral">Hidden</Badge>}</p><p className="text-xs text-stone-500 font-medium">{p.category} - {p.duration} - base {inr(p.base_price)} - {(purohits.filter((pr) => pr.status === 'approved') || []).length} verified purohits available</p></div>
                <div className="flex gap-1.5 shrink-0">
                  <button onClick={async () => { await apiSend('/api/pujas', 'PUT', { id: p.id, is_active: !p.is_active }); load(); }} className="w-9 h-9 rounded-xl bg-stone-100 text-stone-500 flex items-center justify-center" title="Toggle visibility">{p.is_active ? <Eye size={15} /> : <EyeOff size={15} />}</button>
                  <button onClick={() => openEdit('pujas', p, (r) => ({ name: r.name, description: r.description, duration: r.duration, category: r.category, image_url: r.image_url, base_price: r.base_price, is_active: r.is_active }))} className="w-9 h-9 rounded-xl bg-stone-100 text-stone-500 flex items-center justify-center"><Pencil size={15} /></button>
                  <button onClick={() => remove('/api/pujas', p.id, 'puja')} className="w-9 h-9 rounded-xl bg-red-50 text-red-500 flex items-center justify-center"><Trash2 size={15} /></button>
                </div>
              </div>
            </Card>
          ))}
          {tab === 'packages' && packages.filter((p) => match(p.name)).map((p) => (
            <Card key={p.id} className="p-3.5 flex items-center gap-3">
              <div className="flex-1 min-w-0"><p className="font-bold text-maroon-950">{p.name} <Badge tone="gold">{p.tier}</Badge> {!p.is_active && <Badge tone="neutral">Hidden</Badge>}</p><p className="text-xs text-stone-500 font-medium">{pujaName(p.puja_id)} - purohit {inr(p.purohit_fee)} + kit {inr(p.items_price)} = <span className="font-bold text-maroon-800">{inr(p.total_price)}</span></p></div>
              <button onClick={() => openEdit('packages', p, (r) => ({ name: r.name, puja_id: r.puja_id, description: r.description, tier: r.tier, includes_purohit: r.includes_purohit, purohit_fee: r.purohit_fee, items_price: r.items_price, total_price: r.total_price, image_url: r.image_url, is_active: r.is_active }))} className="w-9 h-9 rounded-xl bg-stone-100 text-stone-500 flex items-center justify-center shrink-0"><Pencil size={15} /></button>
              <button onClick={() => remove('/api/packages', p.id, 'package')} className="w-9 h-9 rounded-xl bg-red-50 text-red-500 flex items-center justify-center shrink-0"><Trash2 size={15} /></button>
            </Card>
          ))}
          {tab === 'upcoming' && upcoming.filter((u) => match(u.title)).map((u) => (
            <Card key={u.id} className="p-3.5 flex items-center gap-3">
              <div className="flex-1 min-w-0"><p className="font-bold text-maroon-950">{u.title}</p><p className="text-xs text-stone-500 font-medium">{fmtDateTime(u.event_date)} - {u.venue} - {u.seats_booked}/{u.seats_total} seats - {inr(u.price)}{u.purohit_id ? ` - By ${purohitName(u.purohit_id)}` : ''}</p></div>
              <button onClick={() => openEdit('upcoming', u, (r) => ({ title: r.title, description: r.description, puja_id: r.puja_id || '', event_date: r.event_date ? new Date(r.event_date).toISOString().slice(0, 16) : '', venue: r.venue, address: r.address, purohit_id: r.purohit_id || '', price: r.price, seats_total: r.seats_total, image_url: r.image_url }))} className="w-9 h-9 rounded-xl bg-stone-100 text-stone-500 flex items-center justify-center shrink-0"><Pencil size={15} /></button>
              <button onClick={() => remove('/api/upcoming', u.id, 'event')} className="w-9 h-9 rounded-xl bg-red-50 text-red-500 flex items-center justify-center shrink-0"><Trash2 size={15} /></button>
            </Card>
          ))}
        </div>
      )}
      {tab === 'bookings' && (
        <div className="space-y-3">
          <div className="flex gap-2 overflow-x-auto pb-1">
            {['all', 'booked', 'assigned', 'fulfilled', 'cancelled'].map((s) => (<button key={s} onClick={() => setQ(s === 'all' ? '' : s)} className={`shrink-0 text-[13px] font-bold px-4 py-2 rounded-full border capitalize ${(q === s || (s === 'all' && q === '')) ? 'bg-maroon-800 text-white border-maroon-800' : 'bg-white text-stone-500 border-stone-200'}`}>{s} ({s === 'all' ? bookings.length : bookings.filter((b) => b.status === s).length})</button>))}
          </div>
          {bookings.filter((b) => !q || b.status === q).map((b) => (
            <Card key={b.id} className="p-4">
              <div className="flex items-start justify-between gap-2 flex-wrap">
                <div><p className="text-[11px] font-bold text-stone-400">#SKB-{b.id} &middot; {fmtDateTime(b.created_at)}</p><p className="font-bold text-maroon-950">{b.customer_name}{b.gotra ? ` (${b.gotra})` : ''} - {b.phone}</p><p className="text-xs text-stone-500 font-medium">{b.package_id ? `Package: ${packages.find((p) => p.id === b.package_id)?.name || '#' + b.package_id}` : b.upcoming_puja_id ? 'Event seat' : b.puja_id ? pujaName(b.puja_id) : 'Puja'} - {fmtDateTime(b.booking_date)} - {b.puja_location}</p><p className="text-xs font-medium mt-0.5">Purohit: <span className="font-bold text-maroon-800">{b.purohit_id ? purohitName(b.purohit_id) : 'Not assigned'}</span> - <span className="font-bold text-maroon-900">{inr(b.amount)}</span></p></div>
                <StatusBadge status={b.status} />
              </div>
              <div className="flex gap-1.5 mt-3 flex-wrap">
                <button onClick={() => setAssignRow(b)} className="text-[13px] font-bold bg-white border border-stone-200 rounded-lg px-3 py-1.5">Assign purohit</button>
                {['booked', 'assigned', 'fulfilled', 'cancelled'].filter((s) => s !== b.status).map((s) => (<button key={s} onClick={() => setBookingStatus(b.id, s)} className="text-[13px] font-bold bg-maroon-50 text-maroon-800 rounded-lg px-3 py-1.5 capitalize">Mark {s}</button>))}
              </div>
            </Card>
          ))}
          {bookings.length === 0 && <EmptyState title="No bookings yet" />}
        </div>
      )}
      {tab === 'orders' && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
            {[['Revenue', inr(revenue)], ['Orders', orders.length], ['Avg. order', orders.length ? inr(revenue / orders.length) : inr(0)], ['Pending dispatch', orders.filter((o) => ['booked', 'preparing'].includes(o.status)).length]].map(([a, b]) => (<Card key={a as string} className="p-3.5"><p className="text-[11px] font-bold uppercase tracking-wide text-stone-400">{a}</p><p className="font-display text-xl text-maroon-900 mt-0.5">{b}</p></Card>))}
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {['all', 'booked', 'preparing', 'dispatched', 'delivered', 'cancelled'].map((s) => (<button key={s} onClick={() => setQ(s === 'all' ? '' : s)} className={`shrink-0 text-[13px] font-bold px-4 py-2 rounded-full border capitalize ${(q === s || (s === 'all' && q === '')) ? 'bg-maroon-800 text-white border-maroon-800' : 'bg-white text-stone-500 border-stone-200'}`}>{s} ({s === 'all' ? orders.length : orders.filter((o) => o.status === s).length})</button>))}
          </div>
          {orders.filter((o) => !q || o.status === q).map((o) => (
            <Card key={o.id} className="p-4">
              <div className="flex items-start justify-between gap-2 flex-wrap">
                <div><p className="text-[11px] font-bold text-stone-400">#SKO-{o.id} &middot; {fmtDateTime(o.created_at)}</p><p className="font-bold text-maroon-950">{o.customer_name} - {o.phone}</p><p className="text-xs text-stone-500 font-medium">{(o.items || []).map((it: any) => `${it.name} x${it.qty}`).join(', ')}</p><p className="text-xs text-stone-500 font-medium">{o.delivery_address}</p></div>
                <div className="text-right"><StatusBadge status={o.status} /><p className="font-bold text-maroon-900 mt-1">{inr(o.total_amount)}</p></div>
              </div>
              <div className="flex gap-1.5 mt-3 flex-wrap">
                {['booked', 'preparing', 'dispatched', 'delivered', 'cancelled'].filter((s) => s !== o.status).map((s) => (<button key={s} onClick={() => setOrderStatus(o.id, s)} className="text-[13px] font-bold bg-maroon-50 text-maroon-800 rounded-lg px-3 py-1.5 capitalize">Mark {s}</button>))}
              </div>
            </Card>
          ))}
          {orders.length === 0 && <EmptyState title="No orders yet" />}
        </div>
      )}
      <Modal open={!!modal} onClose={() => setModal(null)} title={`${editRow ? 'Edit' : 'Add'} ${modal === 'lists' ? 'Samagri List' : modal}`} wide>
        <div className="space-y-3.5">
          {modal === 'items' && (<><div className="grid sm:grid-cols-2 gap-3.5"><Field label="Name"><Input value={form.name || ''} onChange={(e) => F('name', e.target.value)} /></Field><Field label="Hindi name"><Input value={form.name_hindi || ''} onChange={(e) => F('name_hindi', e.target.value)} /></Field><Field label="Price"><Input type="number" min={0} value={form.price ?? ''} onChange={(e) => F('price', e.target.value)} /></Field><Field label="Unit"><Input value={form.unit || ''} onChange={(e) => F('unit', e.target.value)} placeholder="pc / pkt / kg" /></Field><Field label="Category"><Select value={form.category || ''} onChange={(e) => F('category', e.target.value)}>{ITEM_CATS.map((c) => <option key={c}>{c}</option>)}</Select></Field><Field label="In stock"><Select value={String(form.in_stock ?? true)} onChange={(e) => F('in_stock', e.target.value === 'true')}><option value="true">Yes</option><option value="false">No</option></Select></Field></div><Field label="Image URL"><Input value={form.image_url || ''} onChange={(e) => F('image_url', e.target.value)} placeholder="https://..." /></Field><Field label="Description"><TextArea value={form.description || ''} onChange={(e) => F('description', e.target.value)} /></Field><Field label="Used in pujas (comma-separated)"><Input value={(form.used_in_pujas || []).join(', ')} onChange={(e) => F('used_in_pujas', e.target.value.split(',').map((s: string) => s.trim()).filter(Boolean))} placeholder="Ganesh Puja, Diwali Lakshmi Puja" /></Field></>)}
          {modal === 'lists' && (<><div className="grid sm:grid-cols-2 gap-3.5"><Field label="Puja"><Select value={form.puja_id || ''} onChange={(e) => F('puja_id', e.target.value)}><option value="">Select</option>{pujas.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</Select></Field><Field label="Tier"><Select value={form.tier || 'Standard'} onChange={(e) => F('tier', e.target.value)}><option>Basic</option><option>Standard</option><option>Premium</option></Select></Field><Field label="List name"><Input value={form.name || ''} onChange={(e) => F('name', e.target.value)} placeholder="e.g. Standard Samagri Kit" /></Field><Field label="Price"><Input type="number" min={0} value={form.price ?? ''} onChange={(e) => F('price', e.target.value)} /></Field></div><Field label="Description"><Input value={form.description || ''} onChange={(e) => F('description', e.target.value)} /></Field><Field label="Items (from catalogue + quantity)"><div className="space-y-2">{listRows.map((r, i) => (<div key={i} className="flex gap-2"><Select value={r.item_id} onChange={(e) => { const n = [...listRows]; n[i] = { ...n[i], item_id: e.target.value }; syncListRows(n); }}><option value="">Select item</option>{items.map((it) => <option key={it.id} value={it.id}>{it.name} — {inr(it.price)}/{it.unit}</option>)}</Select><Input value={r.qty} onChange={(e) => { const n = [...listRows]; n[i] = { ...n[i], qty: e.target.value.replace(/\D/g, '').slice(0, 4) }; syncListRows(n); }} placeholder="Qty" inputMode="numeric" className="max-w-[92px]" /><button type="button" onClick={() => syncListRows(listRows.filter((_, j) => j !== i))} className="w-11 h-11 rounded-xl bg-red-50 text-red-500 flex items-center justify-center shrink-0" title="Remove row"><Trash2 size={16} /></button></div>))}<button type="button" onClick={() => syncListRows([...listRows, { item_id: '', qty: '1' }])} className="text-[13px] font-bold text-saffron-700">+ Add row</button></div></Field></>)}
          {modal === 'pujas' && (<><div className="grid sm:grid-cols-2 gap-3.5"><Field label="Puja name"><Input value={form.name || ''} onChange={(e) => F('name', e.target.value)} /></Field><Field label="Category"><Input value={form.category || ''} onChange={(e) => F('category', e.target.value)} placeholder="Sanskar / Vrat / Havan" /></Field><Field label="Duration"><Input value={form.duration || ''} onChange={(e) => F('duration', e.target.value)} placeholder="e.g. 2-3 hours" /></Field><Field label="Base price"><Input type="number" min={0} value={form.base_price ?? ''} onChange={(e) => F('base_price', e.target.value)} /></Field></div><Field label="Description"><TextArea value={form.description || ''} onChange={(e) => F('description', e.target.value)} /></Field><Field label="Image"><Select value={IMAGES.includes(form.image_url) ? form.image_url : ''} onChange={(e) => F('image_url', e.target.value)}><option value="">Custom URL below</option>{IMAGES.map((u) => <option key={u} value={u}>{u}</option>)}</Select></Field>{!IMAGES.includes(form.image_url) && <Field label="Custom image URL"><Input value={form.image_url || ''} onChange={(e) => F('image_url', e.target.value)} /></Field>}<Field label="Visible to customers"><Select value={String(form.is_active ?? true)} onChange={(e) => F('is_active', e.target.value === 'true')}><option value="true">Yes</option><option value="false">No</option></Select></Field></>)}
          {modal === 'packages' && (<><div className="grid sm:grid-cols-2 gap-3.5"><Field label="Package name"><Input value={form.name || ''} onChange={(e) => F('name', e.target.value)} /></Field><Field label="Puja"><Select value={form.puja_id || ''} onChange={(e) => F('puja_id', e.target.value)}><option value="">Select</option>{pujas.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</Select></Field><Field label="Tier"><Select value={form.tier || 'Standard'} onChange={(e) => F('tier', e.target.value)}><option>Basic</option><option>Standard</option><option>Premium</option></Select></Field><Field label="Includes purohit"><Select value={String(form.includes_purohit ?? true)} onChange={(e) => F('includes_purohit', e.target.value === 'true')}><option value="true">Yes</option><option value="false">No</option></Select></Field><Field label="Purohit fee"><Input type="number" min={0} value={form.purohit_fee ?? ''} onChange={(e) => F('purohit_fee', e.target.value)} /></Field><Field label="Samagri price"><Input type="number" min={0} value={form.items_price ?? ''} onChange={(e) => F('items_price', e.target.value)} /></Field><Field label="Total price" hint="Auto = fee + kit if blank"><Input type="number" min={0} value={form.total_price ?? ''} onChange={(e) => F('total_price', e.target.value)} /></Field><Field label="Visible"><Select value={String(form.is_active ?? true)} onChange={(e) => F('is_active', e.target.value === 'true')}><option value="true">Yes</option><option value="false">No</option></Select></Field></div><Field label="Description"><TextArea value={form.description || ''} onChange={(e) => F('description', e.target.value)} /></Field></>)}
          {modal === 'upcoming' && (<><div className="grid sm:grid-cols-2 gap-3.5"><Field label="Event title"><Input value={form.title || ''} onChange={(e) => F('title', e.target.value)} /></Field><Field label="Date & time"><Input type="datetime-local" value={form.event_date ? String(form.event_date).slice(0, 16) : ''} onChange={(e) => F('event_date', e.target.value ? new Date(e.target.value).toISOString() : '')} /></Field><Field label="Venue"><Input value={form.venue || ''} onChange={(e) => F('venue', e.target.value)} /></Field><Field label="Contribution"><Input type="number" min={0} value={form.price ?? ''} onChange={(e) => F('price', e.target.value)} /></Field><Field label="Linked puja"><Select value={form.puja_id || ''} onChange={(e) => F('puja_id', e.target.value)}><option value="">None</option>{pujas.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</Select></Field><Field label="Lead purohit"><Select value={form.purohit_id || ''} onChange={(e) => F('purohit_id', e.target.value)}><option value="">None</option>{purohits.filter((p) => p.status === 'approved').map((p) => <option key={p.id} value={p.id}>{p.full_name}</option>)}</Select></Field><Field label="Total seats"><Input type="number" min={1} value={form.seats_total ?? 50} onChange={(e) => F('seats_total', e.target.value)} /></Field><Field label="Image"><Select value={IMAGES.includes(form.image_url) ? form.image_url : ''} onChange={(e) => F('image_url', e.target.value)}><option value="">Custom URL below</option>{IMAGES.map((u) => <option key={u} value={u}>{u}</option>)}</Select></Field></div><Field label="Address"><Input value={form.address || ''} onChange={(e) => F('address', e.target.value)} /></Field>{!IMAGES.includes(form.image_url) && <Field label="Custom image URL"><Input value={form.image_url || ''} onChange={(e) => F('image_url', e.target.value)} /></Field>}<Field label="Description"><TextArea value={form.description || ''} onChange={(e) => F('description', e.target.value)} /></Field></>)}
          <Btn className="w-full" disabled={saving} onClick={save}>{saving ? 'Saving...' : editRow ? 'Save Changes' : 'Add'}</Btn>
        </div>
      </Modal>
      <Modal open={!!assignRow} onClose={() => setAssignRow(null)} title={`Assign purohit - #SKB-${assignRow?.id}`}>
        <div className="space-y-2" style={{ maxHeight: '50vh', overflowY: 'auto' }}>
          {purohits.filter((p) => p.status === 'approved').map((p) => (<button key={p.id} onClick={async () => { await setBookingStatus(assignRow.id, 'assigned', { purohit_id: p.id }); setAssignRow(null); }} className="w-full text-left bg-white border border-stone-200 rounded-xl p-3 hover:border-saffron-400"><p className="font-bold text-maroon-950 text-sm">{p.full_name}</p><p className="text-xs text-stone-500 font-medium">{p.specialization} - {p.experience_years} yrs - {p.phone}</p></button>))}
          {purohits.filter((p) => p.status === 'approved').length === 0 && <p className="text-sm text-stone-400 font-medium">No approved purohits yet.</p>}
        </div>
      </Modal>
    </div>
  );
}
function PurohitReviewCard({ p, onApprove, onDecline }: { p: any; onApprove: () => void; onDecline: () => void }) {
  const [open, setOpen] = useState(false);
  const pricing = Array.isArray(p.pricing) ? p.pricing : [];
  const photos = Array.isArray(p.photos) ? p.photos : [];
  return (
    <Card className="p-4 bg-amber-50/40">
      <div className="flex items-start justify-between gap-2"><div><p className="font-bold text-maroon-950 text-[17px]">{p.full_name}</p><p className="text-xs text-stone-500 font-medium">{p.phone} - {p.email} - {p.experience_years} yrs - {p.specialization}</p><p className="text-xs text-stone-500 font-medium">Aadhaar: {p.aadhaar} - {p.certification}</p></div><StatusBadge status={p.status} /></div>
      {open && (<div className="mt-3 text-sm space-y-2 bg-white rounded-xl p-3.5 border border-stone-100"><p><span className="text-stone-400 font-semibold">Address: </span><span className="font-medium">{p.address}</span></p>{p.about && <p><span className="text-stone-400 font-semibold">About: </span><span className="font-medium">{p.about}</span></p>}<div><span className="text-stone-400 font-semibold">Pricing: </span>{pricing.length ? pricing.map((r: any, i: number) => <span key={i} className="font-bold text-maroon-900">{r.puja_name} {inr(r.price)}{i < pricing.length - 1 ? ' | ' : ''}</span>) : <span className="font-medium">Not set</span>}</div>{photos.length > 0 && <div className="flex gap-2 flex-wrap">{photos.map((u: string, i: number) => <img key={i} src={u} alt="" className="w-16 h-16 rounded-lg object-cover" />)}</div>}</div>)}
      <div className="flex gap-2 mt-3">
        <button onClick={() => setOpen(!open)} className="flex-1 text-[13px] font-bold border border-stone-200 bg-white rounded-xl py-2.5">{open ? 'Hide details' : 'View details'}</button>
        <button onClick={onDecline} className="flex-1 text-[13px] font-bold bg-red-100 text-red-700 rounded-xl py-2.5 inline-flex items-center justify-center gap-1"><X size={15} /> Decline</button>
        <button onClick={onApprove} className="flex-1 text-[13px] font-bold bg-emerald-600 text-white rounded-xl py-2.5 inline-flex items-center justify-center gap-1"><Check size={15} /> Approve</button>
      </div>
    </Card>
  );
}
