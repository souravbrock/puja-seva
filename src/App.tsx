import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { StoreProvider } from './contexts/StoreContext';
import { AppShell } from './components/layout';
import { FullLoader } from './components/ui';
import Home from './pages/Home';
import { ItemsPage, ItemDetailPage } from './pages/Items';
import { PujasPage, PujaDetailPage } from './pages/Pujas';
import { PurohitsPage, PurohitDetailPage } from './pages/Purohits';
import PackagesPage from './pages/Packages';
import UpcomingPage from './pages/Upcoming';
import BookingPage from './pages/Booking';
import CartPage from './pages/Cart';
import MyBookingsPage from './pages/MyBookings';
import AuthPage from './pages/Auth';
import ProfilePage from './pages/Profile';
import { PurohitRegisterPage, PurohitDashboardPage } from './pages/Purohit';
import AdminPage from './pages/Admin';
function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <FullLoader />;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}
function RequireAdmin({ children }: { children: React.ReactNode }) {
  const { user, role, loading } = useAuth();
  if (loading) return <FullLoader />;
  if (!user) return <Navigate to="/login" replace />;
  if (role !== 'admin') return <Navigate to="/" replace />;
  return <>{children}</>;
}
function AppRoutes() {
  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/items" element={<ItemsPage />} />
        <Route path="/items/:id" element={<ItemDetailPage />} />
        <Route path="/pujas" element={<PujasPage />} />
        <Route path="/pujas/:id" element={<PujaDetailPage />} />
        <Route path="/purohits" element={<PurohitsPage />} />
        <Route path="/purohits/:id" element={<PurohitDetailPage />} />
        <Route path="/packages" element={<PackagesPage />} />
        <Route path="/upcoming" element={<UpcomingPage />} />
        <Route path="/cart" element={<CartPage />} />
        <Route path="/login" element={<AuthPage />} />
        <Route path="/book" element={<RequireAuth><BookingPage /></RequireAuth>} />
        <Route path="/my-bookings" element={<RequireAuth><MyBookingsPage /></RequireAuth>} />
        <Route path="/profile" element={<RequireAuth><ProfilePage /></RequireAuth>} />
        <Route path="/purohit/register" element={<PurohitRegisterPage />} />
        <Route path="/purohit/dashboard" element={<RequireAuth><PurohitDashboardPage /></RequireAuth>} />
        <Route path="/admin" element={<RequireAdmin><AdminPage /></RequireAdmin>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AppShell>
  );
}
export default function App() {
  return (<BrowserRouter><AuthProvider><StoreProvider><AppRoutes /></StoreProvider></AuthProvider></BrowserRouter>);
}
