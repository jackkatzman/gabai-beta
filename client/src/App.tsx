import * as React from 'react';
import PhoneVerificationPage from './pages/phone-verification';

function ChatPlaceholder() {
  const userRaw = localStorage.getItem('gabai_user');
  const user = userRaw ? JSON.parse(userRaw) : null;

  return (
    <div style={{ padding: 24, fontFamily: 'system-ui, sans-serif' }}>
      <h1>GabAi — Logged in ✅</h1>
      <p>Token found. This is a temporary “chat” screen so you can proceed.</p>
      <pre style={{ background:'#f6f6f6', padding:12, borderRadius:8, overflow:'auto' }}>
{JSON.stringify(user || { note: 'no user cached' }, null, 2)}
      </pre>
      <div style={{ marginTop: 12 }}>
        <button
          onClick={() => {
            // simple logout
            localStorage.clear();
            document.cookie = 'gabai_token=; Max-Age=0; path=/; SameSite=None; Secure';
            window.history.replaceState({}, '', '/phone');
            window.location.reload();
          }}
          style={{ padding:'10px 14px', borderRadius:8, border:'1px solid #ddd', background:'#fff' }}
        >
          Log out
        </button>
      </div>
    </div>
  );
}

export default function App() {
  const [path, setPath] = React.useState(window.location.pathname);

  // decide initial route based on token
  React.useEffect(() => {
    const token = localStorage.getItem('gabai_token');
    const desired = token ? '/chat' : '/phone';
    if (window.location.pathname !== desired) {
      window.history.replaceState({}, '', desired);
      setPath(desired);
    }
  }, []);

  // keep path state in sync if it changes
  React.useEffect(() => {
    const onPop = () => setPath(window.location.pathname);
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  if (path === '/chat') return <ChatPlaceholder />;

  // default: phone flow; when verified, go to /chat
  return (
    <PhoneVerificationPage
      onVerified={() => {
        window.history.replaceState({}, '', '/chat');
        setPath('/chat');
      }}
    />
  );
}
