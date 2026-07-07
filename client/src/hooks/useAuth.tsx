import { createContext, type ReactNode, useContext, useEffect, useState } from 'react';
import { logout as authLogout, initSession } from '../services/auth';
import { connectSocket, disconnectSocket } from '../services/socket';

export interface AuthState {
  user: { uid: string; pseudo: string; email?: string } | null;
  loading: boolean;
  emailVerified: boolean;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthState>({
  user: null,
  loading: true,
  emailVerified: false,
  logout: async () => {},
  refresh: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<{ uid: string; pseudo: string; email?: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [emailVerified, setEmailVerified] = useState(false);

  const fetchUser = async () => {
    try {
      connectSocket();
      const res = await fetch('/api/auth/me');
      if (!res.ok) throw new Error('Non connecté');
      const profile = await res.json();
      const userData = { uid: profile.uid, pseudo: profile.pseudo || '', email: profile.email };
      setUser(userData);
      setEmailVerified(!!profile.emailVerified);
      initSession(profile.uid);
    } catch {
      setUser(null);
      setEmailVerified(false);
      disconnectSocket();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const logout = async () => {
    await authLogout();
    setUser(null);
    setEmailVerified(false);
    disconnectSocket();
  };

  return (
    <AuthContext.Provider value={{ user, loading, emailVerified, logout, refresh: fetchUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
