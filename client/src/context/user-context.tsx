import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

type User = {
  id: string;
  name?: string;
  phone?: string;
  email?: string;
  // add any other fields you use in HomePage
} | null;

type Ctx = {
  user: User;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  logout: () => Promise<void>;
};

const UserContext = createContext<Ctx | undefined>(undefined);

// -------- API BASE (one source of truth) --------
const API_BASE =
  (typeof window !== 'undefined' && (window as any).API_BASE) ||
  import.meta.env.VITE_API_BASE ||
  'https://gabai.ai';

// -------- JSON helper that refuses HTML --------
async function getJSON(url: string, init?: RequestInit) {
  const res = await fetch(url, { credentials: 'include', ...init });
  const ct = res.headers.get('content-type') || '';
  if (!ct.includes('application/json')) {
    const text = await res.text();
    throw new Error(
      `Expected JSON, got ${ct}. First chars: ${text.slice(0, 80)}`
    );
  }
  // If the server sometimes returns 204 with no JSON, guard it:
  if (res.status === 204) return null as any;
  return res.json();
}

// -------- Public helpers you can import elsewhere --------
export async function sendVerify(phone: string) {
  return getJSON(`${API_BASE}/api/sms/send-verification`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone }),
  });
}

export async function verifyCode(phone: string, code: string) {
  return getJSON(`${API_BASE}/api/sms/verify-code`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone, code }),
  });
}

export async function fetchCurrentUser(): Promise<{ user: User }> {
  return getJSON(`${API_BASE}/api/auth/user`);
}

export async function doLogout() {
  // adjust endpoint if your API uses a different path
  await getJSON(`${API_BASE}/api/auth/logout`, { method: 'POST' });
}

// -------- Provider --------
export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setError(null);
      const data = await fetchCurrentUser();
      setUser(data?.user ?? null);
    } catch (err: any) {
      console.error('🔥 /api/auth/user failed:', err);
      setError(err?.message ?? 'Failed to load user');
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await doLogout();
    } catch (err) {
      console.warn('logout error:', err);
    } finally {
      setUser(null);
    }
  }, []);

  // Initial load
  useEffect(() => {
    let alive = true;
    (async () => {
      await refresh();
      // Optional: light polling to keep session fresh; comment out if not needed
      // const timer = window.setInterval(refresh, 60_000);
      // return () => { alive = false; window.clearInterval(timer); };
    })();
    return () => {
      alive = false;
    };
  }, [refresh]);

  const value = useMemo<Ctx>(
    () => ({ user, isLoading, error, refresh, logout }),
    [user, isLoading, error, refresh, logout]
  );

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

// -------- Hook --------
export function useUser() {
  const ctx = useContext(UserContext);
  if (!ctx) {
    throw new Error('useUser() must be used inside <UserProvider>');
  }
  return ctx;
}
