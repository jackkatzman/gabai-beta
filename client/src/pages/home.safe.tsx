import React, { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { useUser } from '@/context/user-context';
// Keep this file LIGHT. No heavy UI libs, no icon packs, no schedulers yet.

export default function HomeSafe() {
  const { user } = useUser();
  const [location] = useLocation();
  const [ok, setOk] = useState(false);

  useEffect(() => {
    console.log('[HomeSafe] mount', { user: !!user, location });
    setOk(true);
  }, [user, location]);

  return (
    <div style={{ padding: 24, fontFamily: 'system-ui, sans-serif' }}>
      <h1 style={{ margin: 0 }}>🏠 Home (Safe)</h1>
      <p style={{ marginTop: 8 }}>User: {user?.name ?? '—'}</p>
      <p>Route: {location}</p>
      <p>Status: {ok ? '✅ Ready' : '…'}</p>

      <div style={{ marginTop: 16, padding: 12, border: '1px solid #ddd', borderRadius: 8 }}>
        <b>Next:</b> we’ll re-enable your real Home page in slices.
      </div>
    </div>
  );
}
