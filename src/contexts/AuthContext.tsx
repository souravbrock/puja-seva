import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { apiGet, apiSend, fetchMe, getToken, signOutLocal, OtpUser } from '../lib/api';
import { ADMIN_EMAIL } from '../lib/format';

interface Profile {
  id: number;
  user_id: number;
  email: string;
  name: string;
  phone: string;
  role: string;
  gotra: string;
  address: string;
}

interface AuthCtx {
  user: OtpUser | null;
  session: { token: string } | null;
  profile: Profile | null;
  role: string;
  loading: boolean;
  refreshProfile: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthCtx>({
  user: null,
  session: null,
  profile: null,
  role: 'customer',
  loading: true,
  refreshProfile: async () => {},
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<OtpUser | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const loadSession = async () => {
    const token = getToken();
    if (!token) {
      setUser(null);
      setProfile(null);
      setLoading(false);
      return;
    }
    try {
      const me = await fetchMe();
      setUser(me.user);
      if (me.profile) {
        setProfile(me.profile as unknown as Profile);
      } else {
        // Lazy-create profile row on first login
        try {
          const p = await apiSend('/api/profiles', 'POST', {
            user_id: me.user.id,
            email: me.user.email,
            name: me.user.name,
          });
          setProfile(p);
        } catch {
          setProfile(null);
        }
      }
    } catch {
      signOutLocal();
      setUser(null);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadSession();
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'gbps_token') void loadSession();
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  // Re-apply admin role if ADMIN_EMAIL matches (server is authoritative)
  useEffect(() => {
    const syncAdmin = async () => {
      if (
        user &&
        profile &&
        user.email.toLowerCase() === ADMIN_EMAIL &&
        profile.role !== 'admin'
      ) {
        try {
          const rows = await apiGet(`/api/profiles?user_id=${user.id}`);
          void rows;
          await loadSession();
        } catch {
          /* noop */
        }
      }
    };
    void syncAdmin();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const refreshProfile = async () => {
    await loadSession();
  };

  const signOut = async () => {
    signOutLocal();
    setUser(null);
    setProfile(null);
  };

  const token = getToken();
  const session = user && token ? { token } : null;
  const role =
    profile?.role ||
    (user && user.email.toLowerCase() === ADMIN_EMAIL ? 'admin' : 'customer');

  return (
    <AuthContext.Provider
      value={{ user, session, profile, role, loading, refreshProfile, signOut }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
