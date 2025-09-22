// client/src/pages/phone-verification.tsx
import React, { useState } from "react";

const API_BASE =
  (typeof window !== "undefined" && (window as any).API_BASE) ||
  import.meta.env.VITE_API_BASE ||
  "https://gabai.ai";

type Props = { onVerified?: () => void };

export default function PhoneVerificationPage({ onVerified }: Props) {
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"enter" | "code">("enter");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function getJSON(url: string, init?: RequestInit) {
    const res = await fetch(url, { credentials: "include", ...init });
    const ct = res.headers.get("content-type") || "";
    if (!ct.includes("application/json")) {
      const text = await res.text();
      throw new Error(`Expected JSON but got ${ct}. First chars: ${text.slice(0, 80)}`);
    }
    if (res.status === 204) return null;
    return res.json();
  }

  async function sendVerification() {
    try {
      setErr(null);
      setLoading(true);
      await getJSON(`${API_BASE}/api/sms/send-verification`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });
      setStep("code");
    } catch (e: any) {
      setErr(e?.message || "Failed to send code");
    } finally {
      setLoading(false);
    }
  }

  async function verify() {
    try {
      setErr(null);
      setLoading(true);
      await getJSON(`${API_BASE}/api/sms/verify-code`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, code }),
      });

      // ✅ DEV BYPASS — force the app to treat us as logged-in
      try { localStorage.setItem("gabai_dev_user", JSON.stringify({ id: "dev", name: phone })); } catch {}

      // prefer parent handler if provided
      if (onVerified) onVerified();
      else window.location.replace("/chat");
    } catch (e: any) {
      setErr(e?.message || "Verification failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        padding: 16,
        fontFamily: "system-ui, sans-serif",
      }}
    >
      <div style={{ width: "100%", maxWidth: 420, background: "white", borderRadius: 12, padding: 20, boxShadow: "0 6px 24px rgba(0,0,0,0.08)" }}>
        <h1 style={{ margin: "0 0 12px", fontSize: 24 }}>Sign in with SMS</h1>

        {step === "enter" ? (
          <>
            <label style={{ display: "block", marginBottom: 6 }}>Phone Number</label>
            <input
              type="tel"
              placeholder="555-123-4567"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              style={{ width: "100%", padding: 12, fontSize: 16, marginBottom: 12, border: "1px solid #ddd", borderRadius: 8 }}
            />
            <button
              onClick={sendVerification}
              disabled={!phone || loading}
              style={{ width: "100%", padding: 12, fontSize: 16, background: "#2563eb", color: "#fff", border: 0, borderRadius: 8 }}
            >
              {loading ? "Sending…" : "Get Verification Code"}
            </button>
          </>
        ) : (
          <>
            <label style={{ display: "block", marginBottom: 6 }}>Enter Code</label>
            <input
              inputMode="numeric"
              pattern="[0-9]*"
              placeholder="123456"
              value={code}
              onChange={(e) => setCode(e.target.value)}
