// client/src/context/user-context.tsx
import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from "react";
import type { User } from "@shared/schema";

type Ctx = {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  logout: () => Promise<void>;
};

const UserContext = createContext<Ctx | undefined>(undefined);

// --- API BASE ---
const API_BASE =
  (typeof window !== "undefined" && (window as any).API_BASE) ||
  import.meta.env.VITE_API_BASE ||
  "https://gabai.ai";

// --- tiny helper that refuses HTML (no more "<!doctype" JSON errors) ---
async function getJSON<T = any>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, { credentials: "include", ...init });
  const ct = res.headers.get("content-type") || "";
  if (!ct.includes("application/json")) {
    const text = await res.text();
    throw new Error(`Expected JSON from ${url} but got ${ct}. First chars: ${text.slice(0, 80)}`);
  }
  if (res.status === 204) return null as unknown as T;
  return res.json() as Promise<T>;
}

// --- public helpers (optional to import elsewhere) ---
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

  // DEV BYPASS — stash a fake user so the app treats you as signed in
  try { localStorage.setItem("gabai_dev_user", JSON.stringify({ id: "dev", name: phone })); } catch {}

  return out;
}

export async function fetchCurrentUser(): Promise<{ user: User | null }> {
  // If dev-bypass exists, short-circuit immediately
  try {
    const dev = localStorage.getItem("gabai_dev_user");
    if (dev) return { user: JSON.parse(dev) as User };
  } catch {}
  return getJSON(`${API_BASE}/api/auth/user`);
}

export async function doLogout() {
  try { await getJSON(`${API_BASE}/api/auth/logout`, { method: "POST" }); } catch {}
  try { localStorage.removeItem("gabai_dev_user"); } catch {}
}

// --- Provider ---
export function UserProvider({ children }: { children: React.ReactNode }) {
  // ✅ seed user synchronously from localStorage so UI doesn’t show “sign in” flash
  const seeded: User | null = (() => {
    try {
      const s = localStorage.getItem("gabai_dev_user");
      return s ? (JSON.parse(s) as User) : null;
    } catch { return null; }
  })();

  const [user, setUser] = useState<User | null>(seeded);
  const [isLoading, setLoading] = useState<boolean>(!seeded);
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
    try { await doLogout(); } catch {}
    setUser(null);
  }, []);

  useEffect(() => {
    // If we already had a seeded user, we’re “ready” but still refresh in background
    refresh();
  }, [refresh]);

  const value = useMemo<Ctx>(
    () => ({ user, isLoading, error, refresh, logout }),
    [user, isLoading, error, refresh, logout]
  );

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

// --- Hook ---
export function useUser() {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error("useUser() must be used inside <UserProvider>");
  return ctx;
}
