// server/index.ts
import express, { Request, Response, NextFunction } from 'express';
import cookieParser from 'cookie-parser';
import path from 'path';
import { authBridgeRouter } from './routes_auth_bridge';

const app = express();

// Let Secure cookies work behind proxies (Replit/NGINX/etc.)
app.set('trust proxy', 1);

// Body & cookies
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// CORS so www.gabai.ai can send/receive cookies to gabai.ai
const FRONTEND_ORIGIN = 'https://www.gabai.ai';
app.use((req: Request, res: Response, next: NextFunction) => {
  res.header('Access-Control-Allow-Origin', FRONTEND_ORIGIN);
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

// Health (optional)
app.get('/health', (_req, res) => res.status(200).send('OK'));

// Mount our tiny auth bridge FIRST (handles only 4 endpoints)
app.use('/', authBridgeRouter);

// --- Mount your existing routes AFTER this line (unchanged) ---
try {
  // If your routes export a router: export const router = Router()
  // or default export a function (app) => { ... }
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const routesModule = require('./routes');
  const maybe = routesModule?.router ?? routesModule?.default;
  if (typeof maybe === 'function') {
    // default export is (app) => register routes
    maybe(app);
  } else if (maybe) {
    // exported { router }
    app.use('/', maybe);
  }
} catch { /* ignore if not applicable */ }

// Serve any static files you host
app.use('/public', express.static(path.join(process.cwd(), 'public')));

// 404 for unknown API routes
app.use('/api', (_req, res) => res.status(404).json({ error: 'Not found' }));

// Start server
const PORT = Number(process.env.PORT || 3000);
app.listen(PORT, () => console.log(`Server listening on :${PORT}`));

export default app;
