import { useState, useEffect, ReactNode } from 'react';
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { Flame, Home, ShoppingBag, ScrollText, Users, User, ShoppingCart, ArrowLeft, ShieldCheck, LayoutDashboard, Sparkles } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useStore } from '../contexts/StoreContext';
import { timeParts } from '../lib/format';
export function useNow(ms = 1000) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), ms); return () => clearInterval(t); }, [ms]);
  return now;
}
export function Countdown({ target, dark }: { target: string; dark?: boolean }) {
  const now = useNow(1000);
  const { d, h, m, s, past } = timeParts(target, now);
  if (past) return <span className={`text-xs font-semibold ${dark ? 'text-gold-200' : 'text-stone-500'}`}>Event started</span>;
  const cells = [{ v: d, l: 'days' }, { v: h, l: 'hrs' }, { v: m, l: 'min' }, { v: s, l: 'sec' }];
  return (<div className="flex items-center gap-1.5">{cells.map((c, i) => (<div key={c.l} className="flex items-center gap-1.5"><div className={`rounded-lg px-2 py-1.5 text-center min-w-[52px] ${dark ? 'bg-white/15 backdrop-blur text-white' : 'bg-maroon-900 text-white'}`}><div className="font-display text-lg leading-none">{String(c.v).padStart(2, '0')}</div><div className={`text-[10px] font-semibold uppercase tracking-wider ${dark ? 'text-gold-200' : 'text-gold-300'}`}>{c.l}</div></div>{i < 3 && <span className={`font-bold ${dark ? 'text-white/70' : 'text-maroon-300'}`}>:</span>}</div>))}</div>);
}
export function MiniCountdown({ target }: { target: string }) {
  const now = useNow(1000);
  const { d, h, m, s, past } = timeParts(target, now);
  if (past) return <span className="text-xs font-semibold text-stone-400">Started</span>;
  return <span className="text-xs font-bold text-saffron-700 tabular-nums">{d}d : {String(h).padStart(2, '0')}h : {String(m).padStart(2, '0')}m : {String(s).padStart(2, '0')}s</span>;
}
function Logo() {
  return (<Link to="/" className="flex items-center gap-2"><div className="w-9 h-9 rounded-xl bg-gradient-to-br from-saffron-500 to-maroon-700 flex items-center justify-center shadow-md shadow-maroon-900/20"><Flame size={20} className="text-white" /></div><div className="leading-none"><p className="font-display text-lg text-maroon-900">SevaKendra</p><p className="text-[10px] font-bold tracking-[0.18em] uppercase text-saffron-600">Puja Marketplace</p></div></Link>);
}
export function Header() {
  const { user, role } = useAuth();
  const { cartCount } = useStore();
  const location = useLocation();
  const hideCart = location.pathname.startsWith('/admin');
  const showConsole = role === 'admin';
  const showCart = !hideCart;
  return (
    <header className="sticky top-0 z-40 bg-cream/90 backdrop-blur-md border-b border-maroon-100">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between gap-2">
        <Logo />
        <nav className="hidden lg:flex items-center gap-1 text-sm font-semibold text-maroon-900">
          <Link to="/items" className="px-3 py-2 rounded-lg hover:bg-maroon-50">Dashakarma</Link>
          <Link to="/pujas" className="px-3 py-2 rounded-lg hover:bg-maroon-50">Pujas</Link>
          <Link to="/purohits" className="px-3 py-2 rounded-lg hover:bg-maroon-50">Purohits</Link>
          <Link to="/packages" className="px-3 py-2 rounded-lg hover:bg-maroon-50">Packages</Link>
          <Link to="/upcoming" className="px-3 py-2 rounded-lg hover:bg-maroon-50">Upcoming</Link>
        </nav>
        <div className="flex items-center gap-2">
          {showConsole ? (
            <Link to="/admin" className="hidden sm:inline-flex items-center gap-1.5 text-xs font-bold bg-maroon-800 text-white px-3 py-2 rounded-xl">
              <LayoutDashboard size={14} /><span>Console</span>
            </Link>
          ) : null}
          {showCart ? (
            <Link to="/cart" className="relative w-10 h-10 rounded-xl bg-white border border-stone-200 flex items-center justify-center text-maroon-800">
              <ShoppingCart size={19} />
              {cartCount > 0 ? (<span className="absolute -top-1.5 -right-1.5 min-w-[20px] h-5 px-1 rounded-full bg-saffron-500 text-white text-[11px] font-bold flex items-center justify-center">{cartCount}</span>) : null}
            </Link>
          ) : null}
          <Link to={user ? '/profile' : '/login'} className="h-10 px-3 rounded-xl bg-maroon-800 text-white text-sm font-bold flex items-center gap-1.5">
            <User size={16} /><span className="hidden sm:inline">{user ? 'Account' : 'Sign In'}</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
export function BottomNav() {
  const { role } = useAuth();
  const tabs = [
    { to: '/', label: 'Home', icon: Home, end: true },
    { to: '/items', label: 'Shop', icon: ShoppingBag, end: false },
    { to: '/pujas', label: 'Pujas', icon: ScrollText, end: false },
    { to: '/purohits', label: 'Purohits', icon: Users, end: false },
    ...(role === 'admin' ? [{ to: '/admin', label: 'Console', icon: ShieldCheck, end: false }] : [{ to: '/profile', label: 'Account', icon: User, end: false }]),
  ];
  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur border-t border-maroon-100" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
      <div className="grid grid-cols-5">
        {tabs.map((t) => {
          const Icon = t.icon;
          return (
            <NavLink key={t.to} to={t.to} end={t.end} className={({ isActive }) => `flex flex-col items-center gap-0.5 py-2.5 text-[11px] font-bold ${isActive ? 'text-maroon-800' : 'text-stone-400'}`}>
              {({ isActive }) => (<><Icon size={20} strokeWidth={isActive ? 2.4 : 2} />{t.label}</>)}
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
export function AppShell({ children }: { children: ReactNode }) {
  const { toast } = useStore();
  return (<div className="min-h-screen bg-cream font-body text-stone-800"><Header /><main className="max-w-6xl mx-auto px-4 pb-28 md:pb-16 pt-4">{children}</main><BottomNav />{toast && (<div className="fixed bottom-24 md:bottom-8 left-1/2 -translate-x-1/2 z-[90] bg-maroon-950 text-white text-sm font-semibold px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-2 max-w-[92vw]"><Sparkles size={16} className="text-gold-300 shrink-0" /><span className="truncate">{toast}</span></div>)}<footer className="hidden md:block border-t border-maroon-100 mt-8"><div className="max-w-6xl mx-auto px-4 py-8 flex items-center justify-between text-sm text-stone-500"><p className="font-display text-maroon-900 text-base">SevaKendra Puja Marketplace</p><div className="flex gap-5 font-semibold"><Link to="/purohit/register" className="hover:text-maroon-700">Join as Purohit</Link><Link to="/packages" className="hover:text-maroon-700">Puja Packages</Link><Link to="/upcoming" className="hover:text-maroon-700">Upcoming Pujas</Link></div></div></footer></div>);
}
export function PageHeader({ title, subtitle, back }: { title: string; subtitle?: string; back?: boolean }) {
  const navigate = useNavigate();
  return (<div className="flex items-start gap-3 mb-4">{back && (<button onClick={() => navigate(-1)} className="w-10 h-10 rounded-xl bg-white border border-stone-200 flex items-center justify-center text-maroon-800 shrink-0"><ArrowLeft size={19} /></button>)}<div><h1 className="font-display text-2xl text-maroon-950 leading-tight">{title}</h1>{subtitle && <p className="text-[13px] text-stone-500 mt-0.5">{subtitle}</p>}</div></div>);
}
