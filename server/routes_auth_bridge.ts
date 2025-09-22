// server/routes_auth_bridge.ts
import { Router, Request, Response } from 'express';

export const authBridgeRouter = Router();

// set a cross-site cookie so www.gabai.ai can send it to gabai.ai
function setSessionCookie(res: Response, token: string) {
  res.cookie('session', token, {
    domain: '.gabai.ai',  // share cookie with www.gabai.ai
    path: '/',
    httpOnly: true,
    secure: true,         // required with SameSite=None
    sameSite: 'none',     // allow cross-site cookie
    maxAge: 1000 * 60 * 60 * 24 * 30, // 30 days
  });
}

// POST /api/sms/send-verification  (stub OK for now)
authBridgeRouter.post('/api/sms/send-verification', async (req: Request, res: Response) => {
  const { phone } = req.body ?? {};
  if (!phone) return res.status(400).json({ error: 'phone required' });
  // TODO: call your real SMS sender here if needed
  return res.json({ ok: true });
});

// POST /api/sms/verify-code  → set the cookie and return JSON
authBridgeRouter.post('/api/sms/verify-code', async (req: Request, res: Response) => {
  const { phone, phoneNumber, code } = req.body ?? {};
  const p = String(phone ?? phoneNumber ?? '');
  if (!p || !code) return res.status(400).json({ error: 'phone and code required' });

  // TODO: call your real verification (Twilio Verify, etc.)
  // const ok = await verifySmsCode(p, code, verificationSid);
  // if (!ok) return res.status(401).json({ error: 'invalid code' });

  // TEMP token so you can continue today — swap for your real JWT/session id later
  const token = p;
  setSessionCookie(res, token);
  return res.json({ ok: true });
});

// GET /api/auth/user  → return user or null (200 always)
authBridgeRouter.get('/api/auth/user', async (req: Request, res: Response) => {
  const token = (req as any).cookies?.session;
  if (!token) return res.status(200).json({ user: null });

  // TODO: real lookup by token
  return res.json({ user: { id: token, name: token } });
});

// POST /api/auth/logout  → clear cookie
authBridgeRouter.post('/api/auth/logout', (req: Request, res: Response) => {
  res.clearCookie('session', {
    domain: '.gabai.ai', path: '/', httpOnly: true, secure: true, sameSite: 'none'
  });
  return res.json({ ok: true });
});
