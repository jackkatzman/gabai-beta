// Delegated auth system - uses bulletproof client for all API calls
import { api as apiBulletproof, getToken as getBulletproofToken, setToken as setBulletproofToken, clearToken } from './api-bulletproof';

const TOKEN_KEY = 'gabai_token';

export const setToken = (t: string | null) => {
  if (t) {
    localStorage.setItem(TOKEN_KEY, t);
    setBulletproofToken(t); // Keep bulletproof client in sync
  } else {
    localStorage.removeItem(TOKEN_KEY);
    clearToken(); // This clears bulletproof client's token
  }
};

export const getToken = () => getBulletproofToken();

export async function api(path: string, init: RequestInit = {}) {
  return apiBulletproof(path, init);
}