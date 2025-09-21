import * as React from 'react';

function toE164US(input: string): string | null {
  const clean = (input || '').replace(/\D/g, '');
  if (clean.length === 11 && clean.startsWith('1')) {
    const us = clean.slice(1);
    if (us.length === 10 && !/^[01]/.test(us[0])) return '+1' + us;
  } else if (clean.length === 10 && !/^[01]/.test(clean[0])) {
    return '+1' + clean;
  }
  return null;
}

type Props = { onVerified?: () => void };

function PhoneVerificationPage({ onVerified }: Props) {
  const [step, setStep] = React.useState<'phone' | 'verify' | 'done'>('phone');
  const [phone, setPhone] = React.useState('');
  const [code, setCode] = React.useState('');
  const [busy, setBusy] = React.useState(false);
  const [msg, setMsg] = React.useState<string | null>(null);
  const apiBase = 'https://gabai.ai';

  function formatInput(v: string) {
    const n = v.replace(/\D/g, '').slice(0, 10);
    if (n.length > 6) return `${n.slice(0,3)}-${n.slice(3,6)}-${n.slice(6)}`;
    if (n.length > 3) return `${n.slice(0,3)}-${n.slice(3)}`;
    return n;
  }

  async function sendCode() {
    setMsg(null);
    const e164 = toE164US(phone);
    if (!e164) return setMsg('Enter a valid US number, e.g. 555-123-4567');
    setBusy(true);
    try {
      const res = await fetch(`${apiBase}/api/sms/send-verification`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: e164 }),
      });
      const text = await res.text();
      if (!res.ok) throw new Error(text || 'Failed to send code');
      setMsg('Code sent. Check your SMS.');
      setStep('verify');
    } catch (e: any) {
      setMsg(e?.message || 'Failed to send code');
    } finally {
      setBusy(false);
    }
  }

  async function verifyCode() {
    setMsg(null);
    const e164 = toE164US(phone);
    if (!e164) return setMsg('Invalid phone (format changed).');
    if (!code || code.length < 4) return setMsg('Enter the 6-digit code');
    setBusy(true);
    try {
      const res = await fetch(`${apiBase}/api/sms/verify-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: e164, code, createAccount: true }),
      });
      const text = await res.text();
      if (!res.ok) throw new Error(text || 'Verify failed');
      const result = text ? JSON.parse(text) : {};
      if (!result?.verified || !result?.token) throw new Error('Code not approved yet');

      localStorage.setItem('gabai_token', result.token);
      localStorage.setItem('gabai_user', JSON.stringify(result.user || {}));
      document.cookie = `gabai_token=${result.token}; path=/; max-age=${7*24*60*60}; SameSite=None; Secure`;

      setMsg('Verified! Redirecting…');
      setStep('done');
      if (onVerified) {
        onVerified();
      } else {
        window.history.replaceState({}, '', '/chat');
        window.location.reload();
      }
    } catch (e: any) {
      setMsg(e?.message || 'Failed to verify code');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 16, fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ width: '100%', maxWidth: 420, background: 'white', borderRadius: 12, padding: 20, boxShadow: '0 6px 24px rgba(0,0,0,.08)' }}>
        <h1 style={{ margin: 0, fontSize: 24, marginBottom: 12 }}>Sign in with SMS</h1>
        {msg && <div style={{ marginBottom: 12, color: '#2563eb' }}>{msg}</div>}

        {step === 'phone' && (
          <>
            <label style={{ display: 'block', marginBottom: 6 }}>Phone Number</label>
            <input
              type="tel"
              value={phone}
              onChange={e => setPhone(formatInput(e.target.value))}
              placeholder="555-123-4567"
              style={{ width: '100%', padding: 12, fontSize: 16, marginBottom: 12, border: '1px solid #ddd', borderRadius: 8 }}
            />
            <button onClick={sendCode} disabled={busy}
              style={{ width: '100%', padding: 12, fontSize: 16, background: '#2563eb', color: '#fff', border: 0, borderRadius: 8 }}>
              {busy ? 'Sending…' : 'Get Verification Code'}
            </button>
          </>
        )}

        {step === 'verify' && (
          <>
            <div style={{ marginBottom: 8 }}>We sent a code to {phone}</div>
            <label style={{ display: 'block', marginBottom: 6 }}>Verification Code</label>
            <input
              type="text"
              value={code}
              onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="123456"
              style={{ width: '100%', padding: 12, fontSize: 16, marginBottom: 12, border: '1px solid #ddd', borderRadius: 8, letterSpacing: 3, textAlign: 'center' }}
            />
            <button onClick={verifyCode} disabled={busy}
              style={{ width: '100%', padding: 12, fontSize: 16, background: '#16a34a', color: '#fff', border: 0, borderRadius: 8 }}>
              {busy ? 'Verifying…' : 'Verify & Sign In'}
            </button>
            <button onClick={sendCode} disabled={busy}
              style={{ width: '100%', padding: 10, marginTop: 8, fontSize: 14, background: '#f3f4f6', border: '1px solid #e5e7eb', borderRadius: 8 }}>
              Resend Code
            </button>
          </>
        )}

        {step === 'done' && <div>Authenticated. Redirecting…</div>}
      </div>
    </div>
  );
}

export default PhoneVerificationPage;
