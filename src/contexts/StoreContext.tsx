import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
export interface CartLine { key: string; kind: 'item' | 'list'; refId: number; name: string; price: number; qty: number; unit?: string; }
interface StoreCtx { cart: CartLine[]; addToCart: (line: Omit<CartLine, 'qty'>, qty?: number) => void; updateQty: (key: string, qty: number) => void; removeLine: (key: string) => void; clearCart: () => void; cartCount: number; cartTotal: number; toast: string | null; showToast: (msg: string) => void; }
const StoreContext = createContext<StoreCtx>({ cart: [], addToCart: () => {}, updateQty: () => {}, removeLine: () => {}, clearCart: () => {}, cartCount: 0, cartTotal: 0, toast: null, showToast: () => {} });
export function StoreProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartLine[]>(() => { try { return JSON.parse(localStorage.getItem('sk_cart') || '[]'); } catch { return []; } });
  const [toast, setToast] = useState<string | null>(null);
  const [toastTimer, setToastTimer] = useState<any>(null);
  useEffect(() => { localStorage.setItem('sk_cart', JSON.stringify(cart)); }, [cart]);
  const showToast = (msg: string) => { setToast(msg); if (toastTimer) clearTimeout(toastTimer); setToastTimer(setTimeout(() => setToast(null), 2600)); };
  const addToCart = (line: Omit<CartLine, 'qty'>, qty = 1) => {
    setCart((prev) => {
      const found = prev.find((l) => l.key === line.key);
      if (found) return prev.map((l) => (l.key === line.key ? { ...l, qty: l.qty + qty } : l));
      return [...prev, { ...line, qty }];
    });
    showToast(`${line.name} added to cart`);
  };
  const updateQty = (key: string, qty: number) => {
    if (qty <= 0) { setCart((prev) => prev.filter((l) => l.key !== key)); return; }
    setCart((prev) => prev.map((l) => (l.key === key ? { ...l, qty } : l)));
  };
  const removeLine = (key: string) => setCart((prev) => prev.filter((l) => l.key !== key));
  const clearCart = () => setCart([]);
  const cartCount = cart.reduce((s, l) => s + l.qty, 0);
  const cartTotal = cart.reduce((s, l) => s + l.qty * Number(l.price || 0), 0);
  return <StoreContext.Provider value={{ cart, addToCart, updateQty, removeLine, clearCart, cartCount, cartTotal, toast, showToast }}>{children}</StoreContext.Provider>;
}
export const useStore = () => useContext(StoreContext);
