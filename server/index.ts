import express, { type Request, Response, NextFunction } from "express";
import cookieParser from "cookie-parser";
import { registerRoutes } from "./routes";
import { serveStatic, log } from "./static";
import { setupAuth } from "./auth";
import { setupSimpleMobileAuth } from "./mobile-auth-simple";

const app = express();

// Trust proxy for Replit environment (must be set before session middleware)
app.set('trust proxy', 1);

// CORS configuration for APK support
const ALLOWED_ORIGINS = [
  'https://gabai.ai',
  'http://gabai.ai',
  'https://localhost',
  'http://localhost',
  'http://localhost:3000',
  'http://localhost:5173',
  'http://localhost:5000',
  'capacitor://localhost',
  'ionic://localhost',
  'file://'
];

app.use((req, res, next) => {
  const origin = req.headers.origin as string | undefined;

  // Allow requests from whitelisted origins
  if (origin && (ALLOWED_ORIGINS.includes(origin) || origin.includes('localhost') || origin.includes('gabai.ai'))) {
    res.header('Access-Control-Allow-Origin', origin);  // echo back exact origin
    res.header('Vary', 'Origin');                       // caching correctness
  }

  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }

  next();
});

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

// Add security headers for OAuth and cache-busting
app.use((req, res, next) => {
  res.header('X-Frame-Options', 'DENY');
  res.header('X-Content-Type-Options', 'nosniff');
  res.header('Referrer-Policy', 'strict-origin-when-cross-origin');

  // EMERGENCY: Force cache invalidation for all API routes
  if (req.path.startsWith('/api/')) {
    res.header('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.header('Pragma', 'no-cache');
    res.header('Expires', '0');
    res.header('Surrogate-Control', 'no-store');
  }

  next();
});

// Setup authentication before routes
setupAuth(app);

// Setup simplified mobile authentication for VoltBuilder apps
setupSimpleMobileAuth(app);

// OAuth routes are handled by Passport.js in setupAuth() - no manual routes needed

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  try {
    // Add a test route to verify OAuth routes are working
    app.get('/api/test-route', (req, res) => {
      console.log('✅ Test route accessed successfully!');
      res.json({ message: 'Express routes are working', timestamp: new Date().toISOString() });
    });

    // Add health check endpoint with /api prefix for monitoring
    app.get('/api/health', (req, res) => {
      res.set('Cache-Control', 'no-store');
      res.status(200).json({ 
        ok: true,
        status: 'healthy', 
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development',
        domain: process.env.REPLIT_DOMAINS || 'localhost'
      });
    });

    // Version endpoint with cache busting
    app.get('/api/version', (_req, res) => {
      res.set({
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      });

      res.json({
        version: 'V2.1-CACHE-BUST-FIX',
        buildTime: new Date().toISOString(),
        deployment: 'ORANGE-THEME-ACTIVE',
        message: '🟠 ORANGE THEME DEPLOYED! Clear browser cache if still seeing blue',
        frontendStatus: 'Orange background with yellow banner should be visible'
      });
    });

    const server = await registerRoutes(app);

    // Start SMS reminder checking (every 1 minute) - disabled in Cloud Run
    // Cloud Run doesn't support background intervals, use Cloud Scheduler instead
    const isCloudRun = process.env.K_SERVICE || process.env.CLOUD_RUN_JOB;

    if (!isCloudRun && process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
      const { checkAndSendPendingReminders } = await import('./sms-reminder-service');

      // Check immediately on startup
      checkAndSendPendingReminders();

      // Then check every minute
      const smsInterval = setInterval(() => {
        checkAndSendPendingReminders();
      }, 60 * 1000); // 1 minute

      console.log('📱 SMS reminder service started - checking every minute');

      // Store interval for cleanup
      (global as any).smsInterval = smsInterval;
    } else if (isCloudRun) {
      console.log('☁️ Running on Cloud Run - SMS reminder interval disabled (use Cloud Scheduler instead)');
    } else {
      console.log('⚠️ SMS reminder service not started - Twilio credentials missing');
    }

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // Health check endpoint for Autoscale deployment monitoring (before Vite setup)
  app.get('/health', (req, res) => {
    try {
      // Set a timeout to ensure health check doesn't hang
      const timeout = setTimeout(() => {
        if (!res.headersSent) {
          res.status(500).json({ 
            status: 'timeout', 
            timestamp: new Date().toISOString(),
            message: 'Health check timed out'
          });
        }
      }, 5000); // 5 second timeout

      // Clear timeout and respond immediately
      clearTimeout(timeout);
      res.status(200).json({ 
        status: 'healthy', 
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development',
        domain: process.env.REPLIT_DOMAINS || 'localhost'
      });
    } catch (error) {
      res.status(500).json({ 
        status: 'error', 
        timestamp: new Date().toISOString(),
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Add readiness check endpoint (before Vite setup)
  app.get('/ready', (req, res) => {
    try {
      res.status(200).json({ 
        status: 'ready', 
        timestamp: new Date().toISOString(),
        port: process.env.PORT || '5000',
        oauth_configured: !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET)
      });
    } catch (error) {
      res.status(500).json({ 
        status: 'not_ready', 
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    const devModule = "./" + (process.env.VITE_DEV_ENTRY || "vite");
    const { setupVite } = await import(devModule);
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // Replit compatibility: Use PORT environment variable
  // Replit sets PORT environment variable automatically for proper routing
  // Must bind to 0.0.0.0 for external access
  // Always use 5000 as default for both development and production on Replit
  const defaultPort = '5000';  // Replit requires port 5000
  const port = parseInt(process.env.PORT || defaultPort, 10);

  // Add startup timeout for Cloud Run
  const startupTimeout = setTimeout(() => {
    console.error('⏱️ Server startup timeout - exiting to trigger Cloud Run restart');
    process.exit(1);
  }, 30000); // 30 second timeout

  server.listen(port, "0.0.0.0", () => {
    clearTimeout(startupTimeout); // Clear timeout on successful startup
    log(`serving on port ${port}`);

    // Log OAuth configuration status
    if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
      console.log('✅ OAuth configuration detected');
    } else {
      console.log('⚠️  OAuth not configured - Google login will not work');
    }

    // Log Cloud Run detection
    if (process.env.K_SERVICE || process.env.CLOUD_RUN_JOB) {
      console.log('☁️ Running on Cloud Run');
    }
  });

  // Graceful shutdown handling for Cloud Run
  const gracefulShutdown = async (signal: string) => {
    console.log(`\n${signal} received, starting graceful shutdown...`);

    // Clear SMS interval if it exists
    if ((global as any).smsInterval) {
      clearInterval((global as any).smsInterval);
      console.log('✅ SMS reminder interval cleared');
    }

    // Close server
    server.close(() => {
      console.log('✅ HTTP server closed');
      process.exit(0);
    });

    // Force exit after 10 seconds
    setTimeout(() => {
      console.error('⚠️ Forcefully shutting down after timeout');
      process.exit(1);
    }, 10000);
  };

  // Listen for termination signals
  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  } catch (error) {
    console.error('❌ Failed to initialize application:', error);
    process.exit(1);
  }
})();