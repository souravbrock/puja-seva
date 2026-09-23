import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart, Trash2, CheckCircle2, Truck } from 'lucide-react';
import { apiSend, inr } from '../lib/format';
import { useAuth } from '../contexts/AuthContext';
import { useStore } from '../contexts/StoreContext';
import { PageHeader } from '../components/layout';
import { Card, EmptyState, Field, Input, TextArea, Btn, QtyStepper } from '../components/ui';
export default function CartPage() {
  const { cart, updateQty, removeLine, clearCart, cartTotal } = useStore();
  const { user, profile } = useAuth();
  const [form, setForm] = useState({ name: profile?.name || '', phone: profile?.phone || '', email: user?.email || profile?.email || '', address: profile?.address || '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState<any>(null);
  const set = (k: string, v: string) => { setForm((f) => ({ ...f, [k]: v })); setErrors((e) => ({ ...e, [k]: '' })); };
  const delivery = cartTotal >= 999 || cartTotal === 0 ? 0 : 49;
  const grand = cartTotal + delivery;
  const submit = async () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = 'Name is required';
    if (!form.phone.trim() || !/^[6-9]\d{9}$/.test(form.phone.replace(/\s/g, ''))) e.phone = 'Enter a valid 10-digit number';
    if (!form.address.trim()) e.address = 'Delivery address is required';
    setErrors(e);
    if (Object.keys(e).length > 0) return;
    setSubmitting(true);
    try {
      const order = await apiSend('/api/orders', 'POST', { user_id: user?.id || null, customer_name: form.name.trim(), phone: form.phone.trim(), email: form.email.trim(), delivery_address: form.address.trim(), items: cart.map((l) => ({ kind: l.kind, refId: l.refId, name: l.name, price: l.price, qty: l.qty, unit: l.unit })), total_amount: grand });
      setDone(order); clearCart();
    } catch (err: any) { setErrors({ submit: err.message }); } finally { setSubmitting(false); }
  };
  if (done) {
    return (
      <div className="max-w-lg mx-auto text-center py-8">
        <CheckCircle2 size={64} className="mx-auto text-emerald-500" />
        <h1 className="font-display text-3xl text-maroon-950 mt-4">Order Placed</h1>
        <p className="text-stone-500 text-sm mt-2">Order ID <span className="font-bold text-maroon-800">#SKO-{done.id}</span> &middot; Status: <span className="font-bold text-amber-700">Booked</span></p>
        <Card className="p-5 mt-5 text-left">
          {(done.items || []).map((it: any, i: number) => (<div key={i} className="flex justify-between text-sm py-1.5 border-b border-dashed border-stone-100 last:border-0"><span className="font-medium text-stone-600">{it.name} x {it.qty}</span><span className="font-bold text-maroon-900">{inr(Number(it.price) * it.qty)}</span></div>))}
          <div className="flex justify-between pt-2.5"><span className="font-bold text-maroon-950">Pay on delivery</span><span className="font-display text-xl text-maroon-900">{inr(done.total_amount)}</span></div>
          <p className="text-xs text-stone-400 mt-2 font-medium">Delivering to: {done.delivery_address}</p>
        </Card>
        <div className="grid grid-cols-2 gap-2.5 mt-4"><Btn variant="outline" to="/my-bookings">Track Order</Btn><Btn to="/items">Shop More</Btn></div>
      </div>
    );
  }
  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <PageHeader title="Your Cart" subtitle="Dashakarma items & samagri kits" />
      {cart.length === 0 ? (<EmptyState icon={<ShoppingCart size={26} />} title="Cart is empty" subtitle="Add dashakarma items or puja samagri kits to get started." action={<Btn to="/items">Browse Shop</Btn>} />) : (
        <>
          <Card className="divide-y divide-stone-100 overflow-hidden">
            {cart.map((l) => (
              <div key={l.key} className="p-4 flex items-center gap-3">
                <div className="flex-1 min-w-0"><p className="text-[11px] font-bold uppercase tracking-wide text-saffron-700">{l.kind === 'list' ? 'Samagri Kit' : 'Item'}</p><p className="font-bold text-maroon-950 text-[15px] leading-snug">{l.name}</p><p className="text-sm font-bold text-stone-500">{inr(l.price)}{l.unit ? ` /${l.unit}` : ''}</p></div>
                <QtyStepper qty={l.qty} onChange={(q) => updateQty(l.key, q)} small />
                <div className="text-right w-20 shrink-0"><p className="font-bold text-maroon-900 text-[15px]">{inr(Number(l.price) * l.qty)}</p><button onClick={() => removeLine(l.key)} className="text-stone-300 hover:text-red-500 mt-1"><Trash2 size={16} /></button></div>
              </div>
            ))}
          </Card>
          <Card className="p-4 sm:p-5 space-y-3">
            <h3 className="font-bold text-maroon-950 flex items-center gap-2"><Truck size={17} className="text-saffron-600" /> Delivery details</h3>
            <div className="grid sm:grid-cols-2 gap-3">
              <Field label="Full name" required error={errors.name}><Input value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="Receiver's name" /></Field>
              <Field label="Phone" required error={errors.phone}><Input value={form.phone} onChange={(e) => set('phone', e.target.value)} placeholder="10-digit mobile" inputMode="numeric" maxLength={10} /></Field>
            </div>
            <Field label="Email"><Input value={form.email} onChange={(e) => set('email', e.target.value)} placeholder="you@example.com" type="email" /></Field>
            <Field label="Delivery address" required error={errors.address}><TextArea value={form.address} onChange={(e) => set('address', e.target.value)} placeholder="Flat, street, area, city, PIN" /></Field>
          </Card>
          <Card className="p-4 sm:p-5">
            <div className="text-sm space-y-1.5">
              <div className="flex justify-between"><span className="text-stone-500 font-medium">Subtotal ({cart.reduce((s, l) => s + l.qty, 0)} items)</span><span className="font-bold text-maroon-900">{inr(cartTotal)}</span></div>
              <div className="flex justify-between"><span className="text-stone-500 font-medium">Delivery</span><span className="font-bold text-maroon-900">{delivery === 0 ? 'FREE' : inr(delivery)}</span></div>
              {delivery > 0 && <p className="text-xs text-saffron-700 font-semibold">Add {inr(999 - cartTotal)} more for free delivery</p>}
              <div className="border-t border-dashed border-stone-200 pt-2 flex justify-between"><span className="font-bold text-maroon-950">Total</span><span className="font-display text-2xl text-maroon-900">{inr(grand)}</span></div>
            </div>
            {errors.submit && <p className="text-sm font-semibold text-red-600 mt-2">{errors.submit}</p>}
            <Btn className="w-full mt-3" disabled={submitting} onClick={submit}>{submitting ? 'Placing order...' : `Place Order - ${inr(grand)}`}</Btn>
            <p className="text-[11px] text-stone-400 text-center font-medium mt-2">Cash / UPI on delivery. Track status: booked to preparing to dispatched to delivered.</p>
          </Card>
          <p className="text-center"><Link to="/items" className="text-sm font-bold text-saffron-700">Continue shopping</Link></p>
        </>
      )}
    </div>
  );
}
