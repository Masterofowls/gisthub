import React, { createContext, useContext, useEffect, useState } from 'react';
import { getToken, saveToken, clearToken, saveAuthMode, validatePAT } from '../services/auth-service';
import { fetchUser } from '../services/github-api';
import { cacheService } from '../services/cache-service';
import { User } from '../types/github';

interface AuthContextType {
  token: string | null;
  user: User | null;
  isLoading: boolean;
  signIn: (token: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  token: null,
  user: null,
  isLoading: true,
  signIn: async () => {},
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const stored = await getToken();
        if (stored) {
          const ok = await validatePAT(stored);
          if (ok) {
            const u = await fetchUser(stored);
            setToken(stored);
            setUser(u);
          } else {
            await clearToken();
          }
        }
      } catch {
        // ignore
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const signIn = async (newToken: string) => {
    const u = await fetchUser(newToken);
    await saveToken(newToken);
    await saveAuthMode('pat');
    setToken(newToken);
    setUser(u);
  };

  const signOut = async () => {
    await clearToken();
    await cacheService.clearAll();
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ token, user, isLoading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
