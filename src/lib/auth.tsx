import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { User, AppRole } from '../../server/src/shared/types.ts';
import { getMe, logout as apiLogout } from './api/auth.ts';
import { getStoredToken } from './api/client.ts';

export type ClientRole = 'tourist' | 'host' | 'admin';

type AuthValue = {
  user: User | null;
  role: ClientRole | null;
  fullName: string;
  loading: boolean;
  signOut: () => Promise<void>;
  refresh: () => Promise<void>;
};

const AuthContext = createContext<AuthValue>({
  user: null,
  role: null,
  fullName: '',
  loading: true,
  signOut: async () => {},
  refresh: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const loadUser = async () => {
    const token = getStoredToken();
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      const u = await getMe();
      setUser(u);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadUser();
  }, []);

  const clientRole: ClientRole | null = user?.role
    ? (user.role.toLowerCase() as ClientRole)
    : null;

  const value: AuthValue = {
    user,
    role: clientRole,
    fullName: user?.fullName || '',
    loading,
    signOut: async () => {
      await apiLogout();
      setUser(null);
    },
    refresh: async () => {
      await loadUser();
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
