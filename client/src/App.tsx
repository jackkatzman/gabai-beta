import * as React from 'react';

export default function App() {
  React.useEffect(() => {
    console.log('App mounted OK');
  }, []);

  return (
    <div style={{ padding: 24, fontFamily: 'system-ui, sans-serif' }}>
      <h1>GabAi ✅</h1>
      <p>If you see this, React is mounted and routing is fine.</p>
      <p>Next, we’ll plug your real pages back in.</p>
    </div>
  );
}
