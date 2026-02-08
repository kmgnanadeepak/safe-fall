import React, { createContext, useContext, useEffect, useState } from 'react';
import { authApi } from '@/lib/api';

export type UserRole = 'patient' | 'hospital';

export interface AuthUser {
  id: string;
  email: string;
  name?: string;
  role?: UserRole;
}

interface AuthContextType {
  user: AuthUser | null;
  session: { access_token?: string } | null;
  role: UserRole | null;
  loading: boolean;
  signUp: (email: string, password: string, name: string, role: UserRole) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [session, setSession] = useState<{ access_token?: string } | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    authApi.getSession().then(({ data, error }) => {
      if (cancelled) return;
      if (error || !data?.user) {
        setUser(null);
        setSession(null);
        setRole(null);
      } else {
        setUser(data.user);
        setRole((data.user.role as UserRole) || null);
        setSession({ access_token: undefined });
      }
      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  const signUp = async (email: string, password: string, name: string, role: UserRole) => {
    const { data, error } = await authApi.register(email, password, name, role);
    if (!error && data?.user) {
      setUser(data.user);
      setRole(data.user.role as UserRole);
      setSession(data.session ? { access_token: data.session.access_token } : null);
    }
    return { error: error as Error | null };
  };

  const signIn = async (email: string, password: string) => {
    const { data, error } = await authApi.login(email, password);
    if (!error && data?.user) {
      setUser(data.user);
      setRole(data.user.role as UserRole);
      setSession(data.session ? { access_token: data.session.access_token } : null);
    }
    return { error: error as Error | null };
  };

  const signOut = async () => {
    await authApi.logout();
    setUser(null);
    setSession(null);
    setRole(null);
  };

  return (
    <AuthContext.Provider value={{ user, session, role, loading, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
