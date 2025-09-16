// ChatGPT's bulletproof API client - single source of truth
const API = 'https://gabai.ai';

let _token: string | null = null;

export function setToken(t: string) {
  _token = t;
  localStorage.setItem('gabai_token', t);
  console.log('🔑 Token set:', t.substring(0, 20) + '...');
}

export function getToken() {
  return _token ?? (_token = localStorage.getItem('gabai_token'));
}

export function clearToken() {
  _token = null;
  localStorage.removeItem('gabai_token');
  console.log('🔑 Token cleared');
}

export async function api(path: string, init: RequestInit = {}) {
  const headers = new Headers(init.headers || {});
  const t = getToken();
  
  if (t) {
    headers.set('Authorization', `Bearer ${t}`);
    console.log('🔑 Bearer token added to:', path);
  }
  
  if (!headers.has('Content-Type') && init.body && !(init.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }
  
  console.log('🌐 API call:', `${API}${path}`);
  
  const res = await fetch(`${API}${path}`, {
    ...init,
    headers,
    credentials: 'omit', // do NOT rely on cookies in Cordova
  });
  
  if (res.status === 401) {
    console.log('❌ 401 - clearing token and redirecting to login');
    clearToken();
    // HashRouter safe redirect
    window.location.hash = '#/login';
    throw new Error('401 Unauthorized');
  }
  
  if (!res.ok) {
    const errorText = await res.text().catch(() => res.statusText);
    throw new Error(`${res.status}: ${errorText}`);
  }
  
  const ct = res.headers.get('content-type') || '';
  return ct.includes('application/json') ? res.json() : res.text();
}