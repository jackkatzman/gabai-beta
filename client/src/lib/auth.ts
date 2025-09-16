// ChatGPT's simplified auth system - surgical fix for race conditions
const TOKEN_KEY = 'gabai_token';

export const setToken = (t: string | null) =>
  t ? localStorage.setItem(TOKEN_KEY, t) : localStorage.removeItem(TOKEN_KEY);

export const getToken = () => localStorage.getItem(TOKEN_KEY);

export async function api(path: string, init: RequestInit = {}) {
  const h = new Headers(init.headers || {});
  const t = getToken();
  if (t) h.set('Authorization', `Bearer ${t}`);
  const res = await fetch(`https://gabai.ai${path}`, { 
    ...init, 
    headers: h,
    credentials: 'include' // CRUCIAL for cookie-based sessions
  });
  if (res.status === 401) { 
    setToken(null); 
    location.hash = '#/login'; 
    throw new Error('401'); 
  }
  return res.headers.get('content-type')?.includes('json') ? res.json() : res.text();
}