// server/index.ts
import express, { Request, Response, NextFunction } from 'express';
import cookieParser from 'cookie-parser';
import path from 'path';

// --- Create app and baseline config ---
const app = express();

// If you're behind a proxy (Replit/NGINX/Netlify functions/etc.)
app.set('trust proxy', 1);

// Body & cookie parsing
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// --- CORS for www.gabai.ai <-> gabai.ai with credentials (cookies) ---
const FRONTEND_ORIGIN = 'https://www.gabai.ai';

app.use((req: Request, res: Response, next: NextFunction) => {
  res.header('Access-Control-Allow-Origin', FRONTEND_ORIGIN);
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

// --- Health check (optional but handy) ---
app.get('/health', (_req, res) => res.status(200).send('OK'));

// ===================================================================
// MOUNT YOUR EXISTING ROUTES BELOW (leave your structure as-is)
// ===================================================================
// If your routes export a default function like (app) => { ... }:
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const routesModule = require('./routes'); // TS will transpile this
  const maybeFn = routesModule?.default ?? routesModule;
  if (typeof maybeFn === 'function') {
    // Pattern: export default function register(app) { ... }
    maybeFn(app);
  } else if (routesModule?.router) {
    // Pattern: export const router = express.Router()...
    app.use('/api', routesModule.router);
  }
} catch (e) {
  // If you don't have a central routes module, ignore this.
  // Your code may mount routes elsewhere; that's fine.
}

// If you also have static/Vite wiring modules, keep them:
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const staticModule = require('./static');
  const maybeFn = staticModule?.default ?? staticModule;
  if (typeof maybeFn === 'function') maybeFn(app);
} catch { /* noop */ }

try {
  // If you have a vite/dev helper (local dev only), it might export a function
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const viteModule = require('./vite');
  const maybeFn = viteModule?.default ?? viteModule;
  if (typeof maybeFn === 'function') maybeFn(app);
} catch { /* noop */ }

// ===================================================================
// IMPORTANT: In your verify-code handler (POST /api/sms/verify-code),
// after you confirm the code and generate a session token, set the cookie:
// ===================================================================
//
//   res.cookie('session', token, {
//     domain: '.gabai.ai',      // share cookie between apex and www
//     path: '/',
//     httpOnly: true,
//     secure: true,             // required with SameSite=None
//     sameSite: 'none',         // allow cross-site cookie from www -> apex
//     maxAge: 1000 * 60 * 60 * 24 * 30, // 30 days
//   });
//   return res.json({ ok: true });
//
// And make sure GET /api/auth/user reads req.cookies.session to return { user }.

// --- 404 fallback for unknown API routes (optional) ---
app.use('/api', (_req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// --- Start server if this file is run directly ---
const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;
if (import.meta && (import.meta as any).url && process.argv[1]?.includes('index')) {
  app.listen(PORT, () => {
    console.log(`Server listening on :${PORT}`);
  });
}

// Export the app (useful if something else imports it, or for tests)
export default app;
