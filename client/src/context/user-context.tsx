// client/src/context/user-context.tsx
import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from "react";
import type { User } from "@shared/schema";

/** Context shape */
type Ctx = {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  logout: () => Promise<void>;
};

/** React context */
const UserContext = createContext<Ctx | undefined>(undefined);

/** Single source of truth for the API host */
const API_BASE =
  (typeof window !== "undefined" && (window as any).API_BASE) ||
  import.meta.env.VITE_API_BASE ||
  "https://gabai.ai";

/** Helper: fetch JSON and refuse HTML (prevents “Unexpected token '<'” when SPA answers) */
async function getJSON<T = any>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, { credentials: "include", ...init });
  const ct = res.headers.get("content-type") || "";
  if (!ct.includes("application/json")) {
    const body = await res.text();
    throw new Error(
      `Expected JSON from ${url} but got ${ct}. First chars: ${body.slice(0, 80)}`
    );
  }
  if (res.status === 204) return null as unknown as T;
  return res.json() as Promise<T>;
}

/** Public helpers (import these elsewhere if needed) */
export async function sendVerify(phone: string) {
  return getJSON(`${API_BASE}/api/sms/send-verification`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ phone }),
  });
}

export async function verifyCode(phone: string, code: string, verificationSid?: string) {
  const payload: Record<string, any> = { phone, code };
  if (verificationSid) payload.verificationSid = verificationSid;

  const out = await getJSON(`${API_BASE}/api/sms/verify-code`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  // If you want a temporary client-only bypass while server cookies are being wired:
  // localStorage.setItem("gabai_dev_user", JSON.stringify({ id: "dev", name: phone }));

  return out;
}

export async function fetchCurrentUser(): Promise<{ user: User | null }> {
  // Dev bypass (uncomment while server cookies are being fixed)
  // const dev = localStorage.getItem("gabai_dev_user");
  // if (dev) return { user: JSON.parse(dev) };

  return getJSON(`${API_BASE}/api/auth/user`);
}

export async function doLogout() {
  await getJSON(`${API_BASE}/api/auth/logout`, { method: "POST" });
}

/** Provider */
export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setError(null);
      const data = await fetchCurrentUser();
      setUser(data?.user ?? null);
    } catch (e: any) {
      console.error("🔥 /api/auth/user failed:", e);
      setError(e?.message ?? "Failed to load user");
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await doLogout();
    } catch (e) {
      console.warn("logout error:", e);
    } finally {
      setUser(null);
      // localStorage.removeItem("gabai_dev_user"); // if using dev bypass
    }
  }, []);

  useEffect(() => {
    // Initial load
    refresh();
    // Optional: light polling to keep session fresh. Uncomment if desired.
    // const t = window.setInterval(refresh, 60_000);
    // return () => window.clearInterval(t);
  }, [refresh]);

  const value = useMemo<Ctx>(
    () => ({ user, isLoading, error, refresh, logout }),
    [user, isLoading, error, refresh, logout]
  );

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

/** Hook */
export function useUser() {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error("useUser() must be used inside <UserProvider>");
  return ctx;
}
