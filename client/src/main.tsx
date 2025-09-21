// client/src/main.tsx  — PROBE ENTRY
import { createRoot } from 'react-dom/client';
import { useEffect } from 'react';

function Probe() {
  useEffect(() => {
    console.log('Probe useEffect fired ✅');
  }, []);
  return (
    <div style={{ padding: 24, fontFamily: 'system-ui, sans-serif' }}>
      🔍 Probe OK — React hooks working
    </div>
  );
}

const el = document.getElementById('root');
if (!el) throw new Error('#root not found');
createRoot(el).render(<Probe />);
