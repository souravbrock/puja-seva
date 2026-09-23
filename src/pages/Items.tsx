import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Search, ShoppingCart, ScrollText, Check } from 'lucide-react';
import { apiGet, inr, absUrl } from '../lib/format';
import { PageHeader } from '../components/layout';
import { Card, Loader, EmptyState, Badge, Btn, ItemIcon, QtyStepper, Price, SectionTitle } from '../components/ui';
import { useStore } from '../contexts/StoreContext';
export function ItemsPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [cat, setCat] = useState('All');
  const { addToCart } = useStore();
  useEffect(() => { apiGet('/api/items').then(setItems).catch(console.error).finally(() => setLoading(false)); }, []);
  const cats = ['All', ...Array.from(new Set(items.map((i) => i.category).filter(Boolean)))];
  const filtered = items.filter((i) => (cat === 'All' || i.category === cat) && (i.name.toLowerCase().includes(q.toLowerCase()) || (i.name_hindi || '').includes(q)));
  if (loading) return <Loader label="Loading dashakarma items..." />;
  return (
    <div>
      <PageHeader title="Dashakarma Shop" subtitle="Authentic samagri items at fixed prices" />
      <div className="relative mb-3"><Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search kapoor, agarbatti, nariyal..." className="w-full rounded-2xl border border-stone-200 bg-white pl-11 pr-4 py-3 text-[15px] outline-none focus:border-saffron-500 focus:ring-2 focus:ring-saffron-200" /></div>
      <div className="flex gap-2 overflow-x-auto pb-3 -mx-4 px-4">{cats.map((c) => (<button key={c} onClick={() => setCat(c)} className={`shrink-0 text-[13px] font-bold px-4 py-2 rounded-full border ${cat === c ? 'bg-maroon-800 text-white border-maroon-800' : 'bg-white text-stone-600 border-stone-200'}`}>{c}</button>))}</div>
      {filtered.length === 0 ? <EmptyState title="No items found" subtitle="Try a different search or category." /> : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {filtered.map((it) => (
            <Card key={it.id} className="overflow-hidden flex flex-col">
              <Link to={`/items/${it.id}`} className="block">
                {it.image_url ? <img src={absUrl(it.image_url)} alt={it.name} className="w-full h-28 object-cover" /> : (<div className="h-28 bg-gradient-to-br from-maroon-100 via-gold-100 to-saffron-100 flex items-center justify-center text-maroon-700"><ItemIcon category={it.category} /></div>)}
                <div className="p-3 pb-1"><p className="text-[11px] font-bold uppercase tracking-wide text-saffron-700">{it.category}</p><p className="font-bold text-maroon-950 text-[15px] leading-snug">{it.name}</p>{it.name_hindi && <p className="text-xs text-stone-400 font-medium">{it.name_hindi}</p>}<div className="mt-1"><Price value={it.price} unit={it.unit} className="text-[15px]" /></div></div>
              </Link>
              <div className="p-3 pt-2 mt-auto"><button disabled={!it.in_stock} onClick={() => addToCart({ key: `item-${it.id}`, kind: 'item', refId: it.id, name: it.name, price: Number(it.price), unit: it.unit })} className="w-full text-[13px] font-bold bg-maroon-800 hover:bg-maroon-900 disabled:opacity-40 text-white rounded-xl py-2.5 inline-flex items-center justify-center gap-1.5"><ShoppingCart size={15} /> {it.in_stock ? 'Add to Cart' : 'Out of Stock'}</button></div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
export function ItemDetailPage() {
  const { id } = useParams();
  const [item, setItem] = useState<any>(null);
  const [related, setRelated] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [qty, setQty] = useState(1);
  const { addToCart } = useStore();
  useEffect(() => {
    (async () => {
      try {
        const rows = await apiGet(`/api/items?id=${id}`);
        const it = rows[0]; setItem(it);
        if (it) { const all = await apiGet(`/api/items?category=${encodeURIComponent(it.category)}`); setRelated(all.filter((r: any) => r.id !== it.id).slice(0, 4)); }
      } catch (e) { console.error(e); } finally { setLoading(false); }
    })();
  }, [id]);
  if (loading) return <Loader />;
  if (!item) return <EmptyState title="Item not found" action={<Btn to="/items">Back to Shop</Btn>} />;
  const usedIn = Array.isArray(item.used_in_pujas) ? item.used_in_pujas : [];
  return (
    <div className="space-y-4">
      <PageHeader title={item.name} subtitle={item.name_hindi || item.category} back />
      <Card className="overflow-hidden">
        {item.image_url ? <img src={absUrl(item.image_url)} alt={item.name} className="w-full h-56 sm:h-72 object-cover" /> : (<div className="h-52 bg-gradient-to-br from-maroon-800 via-maroon-700 to-saffron-600 flex flex-col items-center justify-center text-white gap-2"><ItemIcon category={item.category} size={44} /><span className="font-display text-3xl">{item.name_hindi || item.name}</span></div>)}
        <div className="p-4 sm:p-5">
          <div className="flex items-center gap-2 flex-wrap"><Badge tone="maroon">{item.category}</Badge>{item.in_stock ? <Badge tone="green"><Check size={11} /> In stock</Badge> : <Badge tone="red">Out of stock</Badge>}</div>
          <p className="text-stone-600 text-[15px] mt-3 leading-relaxed">{item.description || 'Pure, authentic samagri sourced for vedic rituals.'}</p>
          <div className="flex items-center justify-between mt-4 bg-cream rounded-2xl p-4"><div><p className="text-xs font-bold uppercase tracking-wide text-stone-400">Price</p><Price value={item.price} unit={item.unit} className="text-2xl" /></div><QtyStepper qty={qty} onChange={(v) => setQty(Math.max(1, v))} /></div>
          <div className="grid grid-cols-2 gap-2.5 mt-3">
            <Btn variant="outline" disabled={!item.in_stock} onClick={() => addToCart({ key: `item-${item.id}`, kind: 'item', refId: item.id, name: item.name, price: Number(item.price), unit: item.unit }, qty)}>Add to Cart</Btn>
            <Btn to="/cart" variant="secondary" onClick={() => item.in_stock && addToCart({ key: `item-${item.id}`, kind: 'item', refId: item.id, name: item.name, price: Number(item.price), unit: item.unit }, qty)}>Buy Now</Btn>
          </div>
        </div>
      </Card>
      {usedIn.length > 0 && (
        <Card className="p-4 sm:p-5">
          <SectionTitle title="Used in these Pujas" subtitle="This samagri is part of the vidhi for" />
          <div className="flex flex-wrap gap-2">{usedIn.map((p: string, i: number) => (<span key={i} className="inline-flex items-center gap-1.5 bg-maroon-50 border border-maroon-100 text-maroon-800 text-[13px] font-semibold px-3 py-1.5 rounded-full"><ScrollText size={13} /> {p}</span>))}</div>
        </Card>
      )}
      {related.length > 0 && (
        <div>
          <SectionTitle title="Related Items" />
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">{related.map((r) => (<Link key={r.id} to={`/items/${r.id}`}><Card className="p-3 text-center"><ItemIcon category={r.category} size={22} /><p className="font-bold text-maroon-950 text-sm mt-2 truncate">{r.name}</p><Price value={r.price} className="text-sm" /></Card></Link>))}</div>
        </div>
      )}
    </div>
  );
}
