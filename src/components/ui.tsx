import { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Flame, Flower2, Sparkles, Leaf, Star, Gift, BellRing, Droplets, Sun, Wheat, Package, AlertCircle, ChevronRight, Minus, Plus, X } from 'lucide-react';
import { inr } from '../lib/format';
export function Loader({ label = 'Loading...' }: { label?: string }) {
  return (<div className="flex flex-col items-center justify-center py-14 gap-3"><div className="w-10 h-10 rounded-full border-[3px] border-saffron-200 border-t-saffron-600 animate-spin" /><p className="text-sm text-stone-500 font-medium">{label}</p></div>);
}
export function FullLoader() {
  return (<div className="min-h-[70vh] flex items-center justify-center"><Loader label="Preparing your sacred experience..." /></div>);
}
export function EmptyState({ icon, title, subtitle, action }: { icon?: ReactNode; title: string; subtitle?: string; action?: ReactNode }) {
  return (<div className="flex flex-col items-center text-center py-14 px-6 gap-2 bg-white rounded-2xl border border-stone-200/80"><div className="w-14 h-14 rounded-2xl bg-saffron-100 text-saffron-700 flex items-center justify-center mb-1">{icon || <AlertCircle size={26} />}</div><h3 className="font-display text-lg text-maroon-900">{title}</h3>{subtitle && <p className="text-sm text-stone-500 max-w-xs">{subtitle}</p>}{action && <div className="mt-2">{action}</div>}</div>);
}
export function Btn({ to, onClick, variant = 'primary', className = '', children, disabled, type }: { to?: string; onClick?: () => void; variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost' | 'gold'; className?: string; children: ReactNode; disabled?: boolean; type?: 'button' | 'submit'; }) {
  const styles: Record<string, string> = {
    primary: 'bg-gradient-to-r from-maroon-700 to-maroon-800 text-white shadow-lg shadow-maroon-900/20 hover:from-maroon-800 hover:to-maroon-900',
    secondary: 'bg-saffron-500 text-white shadow-lg shadow-saffron-500/25 hover:bg-saffron-600',
    outline: 'border border-maroon-200 text-maroon-800 bg-white hover:bg-maroon-50',
    danger: 'bg-red-600 text-white hover:bg-red-700',
    ghost: 'text-maroon-700 hover:bg-maroon-50',
    gold: 'bg-gradient-to-r from-gold-500 to-gold-600 text-maroon-950 shadow-lg shadow-gold-500/25 hover:brightness-105',
  };
  const cls = `inline-flex items-center justify-center gap-2 font-semibold rounded-xl px-5 py-3 text-sm transition active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none ${styles[variant]} ${className}`;
  if (to) return <Link to={to} className={cls}>{children}</Link>;
  return <button type={type || 'button'} onClick={onClick} disabled={disabled} className={cls}>{children}</button>;
}
export function Card({ className = '', children, onClick }: { className?: string; children: ReactNode; onClick?: () => void }) {
  return <div onClick={onClick} className={`bg-white rounded-2xl border border-stone-200/70 shadow-[0_2px_16px_-6px_rgba(90,20,20,0.15)] ${className}`}>{children}</div>;
}
export function SectionTitle({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (<div className="flex items-end justify-between gap-3 mb-3"><div><h2 className="font-display text-xl text-maroon-900 leading-tight">{title}</h2>{subtitle && <p className="text-[13px] text-stone-500 mt-0.5">{subtitle}</p>}</div>{action}</div>);
}
export function Field({ label, error, hint, children, required }: { label: string; error?: string; hint?: string; children: ReactNode; required?: boolean }) {
  return (<label className="block"><span className="text-[13px] font-semibold text-maroon-900">{label} {required && <span className="text-red-500">*</span>}</span><div className="mt-1.5">{children}</div>{hint && !error && <span className="text-xs text-stone-400 mt-1 block">{hint}</span>}{error && <span className="text-xs text-red-600 mt-1 block font-medium">{error}</span>}</label>);
}
const inputCls = 'w-full rounded-xl border border-stone-200 bg-white px-4 py-2.5 text-[15px] text-stone-800 placeholder:text-stone-400 outline-none focus:border-saffron-500 focus:ring-2 focus:ring-saffron-200 transition';
export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`${inputCls} ${props.className || ''}`} />;
}
export function TextArea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={`${inputCls} min-h-[90px] resize-y ${props.className || ''}`} />;
}
export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={`${inputCls} ${props.className || ''}`}>{props.children}</select>;
}
export function Badge({ tone = 'neutral', children }: { tone?: 'neutral' | 'green' | 'amber' | 'red' | 'maroon' | 'gold' | 'blue'; children: ReactNode }) {
  const map: Record<string, string> = { neutral: 'bg-stone-100 text-stone-600', green: 'bg-emerald-100 text-emerald-800', amber: 'bg-amber-100 text-amber-800', red: 'bg-red-100 text-red-700', maroon: 'bg-maroon-100 text-maroon-800', gold: 'bg-gold-100 text-gold-700', blue: 'bg-sky-100 text-sky-800' };
  return <span className={`inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wide px-2.5 py-1 rounded-full ${map[tone]}`}>{children}</span>;
}
export function StatusBadge({ status }: { status: string }) {
  const s = (status || '').toLowerCase();
  const map: Record<string, 'green' | 'amber' | 'blue' | 'red' | 'neutral'> = { booked: 'amber', assigned: 'blue', fulfilled: 'green', delivered: 'green', preparing: 'blue', dispatched: 'blue', cancelled: 'red', pending: 'amber', approved: 'green', declined: 'red' };
  return <Badge tone={map[s] || 'neutral'}>{status}</Badge>;
}
export function Stars({ value = 5, size = 14 }: { value?: number; size?: number }) {
  return (<span className="inline-flex items-center gap-0.5">{[1, 2, 3, 4, 5].map((i) => (<Star key={i} size={size} className={i <= Math.round(value) ? 'fill-gold-500 text-gold-500' : 'text-stone-300'} />))}</span>);
}
export function QtyStepper({ qty, onChange, small }: { qty: number; onChange: (q: number) => void; small?: boolean }) {
  const b = small ? 'w-7 h-7' : 'w-9 h-9';
  return (<div className="inline-flex items-center gap-1 bg-maroon-50 border border-maroon-100 rounded-full p-1"><button onClick={() => onChange(qty - 1)} className={`${b} rounded-full bg-white shadow-sm flex items-center justify-center text-maroon-800 active:scale-95`}><Minus size={small ? 13 : 15} /></button><span className={`font-bold text-maroon-900 ${small ? 'w-6 text-sm' : 'w-8'} text-center`}>{qty}</span><button onClick={() => onChange(qty + 1)} className={`${b} rounded-full bg-white shadow-sm flex items-center justify-center text-maroon-800 active:scale-95`}><Plus size={small ? 13 : 15} /></button></div>);
}
export function Modal({ open, onClose, title, children, wide }: { open: boolean; onClose: () => void; title: string; children: ReactNode; wide?: boolean }) {
  if (!open) return null;
  return (<div className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center"><div className="absolute inset-0 bg-maroon-950/60 backdrop-blur-[2px]" onClick={onClose} /><div className={`relative w-full ${wide ? 'sm:max-w-2xl' : 'sm:max-w-md'} bg-cream rounded-t-3xl sm:rounded-3xl max-h-[92vh] overflow-y-auto p-5 sm:p-6 shadow-2xl`}><div className="flex items-center justify-between mb-4"><h3 className="font-display text-lg text-maroon-900">{title}</h3><button onClick={onClose} className="w-9 h-9 rounded-full bg-white border border-stone-200 flex items-center justify-center text-stone-500"><X size={18} /></button></div>{children}</div></div>);
}
export function Price({ value, className = '', unit }: { value: number | string; className?: string; unit?: string }) {
  return <span className={`font-bold text-maroon-800 ${className}`}>{inr(value)}{unit && <span className="text-xs font-medium text-stone-400"> /{unit}</span>}</span>;
}
export function LinkRow({ to, title, subtitle, icon }: { to: string; title: string; subtitle?: string; icon?: ReactNode }) {
  return (<Link to={to} className="flex items-center gap-3 bg-white rounded-2xl border border-stone-200/70 p-4 active:scale-[0.99] transition">{icon && <div className="w-10 h-10 rounded-xl bg-maroon-50 text-maroon-700 flex items-center justify-center shrink-0">{icon}</div>}<div className="flex-1 min-w-0"><p className="font-semibold text-maroon-950 text-[15px]">{title}</p>{subtitle && <p className="text-xs text-stone-500 truncate">{subtitle}</p>}</div><ChevronRight size={18} className="text-stone-300 shrink-0" /></Link>);
}
const CATEGORY_ICONS: Record<string, any> = { 'Diya & Light': Flame, 'Fragrance': Sparkles, 'Flowers & Garlands': Flower2, 'Prasad & Food': Wheat, 'Havan': Sun, 'Cloth & Decor': Gift, 'Puja Essentials': BellRing, 'Sacred Water': Droplets, 'Essentials': Package, 'Leaves & Nuts': Leaf };
export function ItemIcon({ category, size = 26 }: { category?: string; size?: number }) {
  const Icon = (category && CATEGORY_ICONS[category]) || Package;
  return <Icon size={size} />;
}
