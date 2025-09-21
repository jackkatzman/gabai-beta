// server/index.ts
import express, { Request, Response, NextFunction } from 'express';
import cookieParser from 'cookie-parser';
import path from 'path';

const app = express();

// If behind a proxy (Replit/NGINX/etc.) this lets Secure cookies work
app.set('trust proxy', 1);

// Body & cookies
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// ===== CORS for www.gabai.ai <-> gabai.ai (send cookies) =====
const FRONTEND_ORIGIN = 'https://www.gabai.ai';

app.use((req: Request, res: Response, next: NextFunction) => {
  res.header('Access-Control-Allow-Origin', FRONTEND_ORIGIN);
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

// Health (nice to have)
app.get('/health', (_req, res) => res.status(200).send('OK'));

// ===== Mount API routes =====
import { router as apiRouter } from './routes';
app.use('/', apiRouter); // routes file defines /api/... paths

// (Optional) serve any static public files your server hosts
app.use('/public', express.static(path.join(process.cwd(), 'public')));

// 404 for unknown API routes
app.use('/api', (_req, res) => res.status(404).json({ error: 'Not found' }));

// Start server (if run directly)
const PORT = Number(process.env.PORT || 3000);
app.listen(PORT, () => {
  console.log(`Server listening on :${PORT}`);
});

export default app;
