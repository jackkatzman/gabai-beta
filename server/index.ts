import express, { type Request, Response, NextFunction } from "express";
import cookieParser from "cookie-parser";
import { registerRoutes } from "./routes";
import { serveStatic, log } from "./static";
import { setupAuth } from "./auth";
import { setupSimpleMobileAuth } from "./mobile-auth-simple";
import { logger } from "./logger";

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

  // Allow requests from whitelisted origins OR requests with no origin (APK/mobile apps)
  if (!origin) {
    // No origin header (typical for mobile apps/APK) - allow the request
    res.header('Access-Control-Allow-Origin', '*');
  } else if (origin === 'null' || ALLOWED_ORIGINS.includes(origin) || origin.includes('localhost') || origin.includes('gabai.ai')) {
    // Specific origin or 'null' origin (file:// protocol) - echo back the origin
    res.header('Access-Control-Allow-Origin', origin);
    res.header('Vary', 'Origin');
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

// IMPORTANT: Don't use global body parsers that would interfere with multipart
// Instead, apply them selectively per route type
app.use(cookieParser());

// Add security headers for OAuth and cache-busting
app.use((req, res, next) => {
  res.header('X-Frame-Options', 'DENY');
  res.header('X-Content-Type-Options', 'nosniff');
  res.header('Referrer-Policy', 'strict-origin-when-cross-origin');

  // EMERGENCY: Force cache invalidation for ALL routes
  res.header('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
  res.header('Pragma', 'no-cache');
  res.header('Expires', '0');
  res.header('Surrogate-Control', 'no-store');
  res.header('ETag', '"' + Date.now() + '"');
  res.header('Last-Modified', new Date().toUTCString());

  next();
});

// Setup authentication before routes
setupAuth(app);

// Setup simplified mobile authentication for VoltBuilder apps
setupSimpleMobileAuth(app);

// Register ZIP download handler BEFORE Vite middleware (works in both dev and prod)
import fs from "fs";
import path from "path";

app.get(/^\/.*\.zip$/, (req, res) => {
  const fileName = req.path.substring(1); // Remove leading slash
  // Use __dirname for CommonJS compatibility (Netlify) or import.meta.dirname for ESM
  const dirname = typeof __dirname !== 'undefined' ? __dirname : import.meta.dirname;
  const distPath = path.resolve(dirname, "..", "dist", "public");
  const filePath = path.resolve(distPath, fileName);
  
  // Security: Prevent path traversal attacks
  if (!filePath.startsWith(distPath + path.sep) && filePath !== distPath) {
    console.log(`⚠️ Security: Path traversal attempt blocked for: ${fileName}`);
    return res.status(403).json({ error: 'Access denied' });
  }
  
  console.log(`📦 ZIP download request: ${fileName}`);
  console.log(`📁 Looking for file at: ${filePath}`);
  
  if (!fs.existsSync(filePath)) {
    console.log(`❌ ZIP file not found: ${filePath}`);
    return res.status(404).json({ error: 'File not found' });
  }
  
  const stat = fs.statSync(filePath);
  console.log(`✅ Found ZIP file: ${stat.size} bytes`);
  
  res.setHeader('Content-Type', 'application/zip');
  res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
  res.setHeader('Content-Length', stat.size.toString());
  res.setHeader('Cache-Control', 'no-cache');
  
  // Stream the file
  const fileStream = fs.createReadStream(filePath);
  fileStream.pipe(res);
  
  fileStream.on('error', (err) => {
    console.error('❌ ZIP stream error:', err);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Download failed' });
    }
  });
  
  fileStream.on('end', () => {
    console.log(`✅ ZIP download completed: ${fileName}`);
  });
});

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

// Register routes (required for both serverless and regular server)
(async () => {
  try {
    const server = await registerRoutes(app);
    
    // Only start the actual server if not in serverless environment
    if (process.env.NETLIFY !== 'true' && !process.env.AWS_LAMBDA_FUNCTION_NAME) {

    // Start SMS reminder checking (every 1 minute)
    // This runs in all environments including production
    if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
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
    logger.info('🏭 Production mode - setting up static file serving', 'server-startup');
    try {
      serveStatic(app);
      logger.info('✅ Static file serving configured successfully', 'server-startup');
    } catch (error) {
      logger.error('❌ CRITICAL: Failed to setup static file serving', 'server-startup', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });
      logger.error('This will cause SPA routing to fail - /chat and other routes will 404', 'server-startup');
      // Re-throw to prevent server from starting in broken state
      throw error;
    }
  }

  // Cloud Run compatibility: Use PORT environment variable
  // Cloud Run sets PORT environment variable for proper routing
  // Must bind to 0.0.0.0 for external access
  const defaultPort = '5000';
  const port = parseInt(process.env.PORT || defaultPort, 10);
  
  // Log startup configuration
  logger.info('🚀 Server startup configuration', 'server-startup', {
    NODE_ENV: process.env.NODE_ENV || 'production',
    PORT: port,
    HOST: '0.0.0.0',
    DATABASE_URL: process.env.DATABASE_URL ? 'configured' : 'missing',
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID ? 'configured' : 'missing',
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET ? 'configured' : 'missing',
  });

  // Add startup timeout for Cloud Run with better error reporting
  const startupTimeout = setTimeout(() => {
    console.error('⏱️ Server startup timeout after 45 seconds');
    console.error('This usually means the server failed to bind to the correct port');
    console.error('Port configuration:', { 
      requestedPort: port, 
      envPort: process.env.PORT,
      defaultPort 
    });
    process.exit(1);
  }, 45000); // 45 second timeout (Cloud Run allows up to 60s)

  // Ensure server binds correctly with explicit error handling
  server.listen(port, "0.0.0.0", () => {
    clearTimeout(startupTimeout); // Clear timeout on successful startup
    logger.info(`✅ Server successfully started`, 'server-startup', {
      host: '0.0.0.0',
      port: port
    });
    log(`serving on port ${port}`);

    // Log OAuth configuration status
    if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
      logger.info('✅ OAuth configuration detected', 'server-startup');
    } else {
      logger.warn('⚠️ OAuth not configured - Google login will not work', 'server-startup');
    }

    // Log Cloud Run detection
    if (process.env.K_SERVICE || process.env.CLOUD_RUN_JOB) {
      logger.info('☁️ Running on Cloud Run', 'server-startup', {
        service: process.env.K_SERVICE,
        job: process.env.CLOUD_RUN_JOB
      });
    }

    // Ready for traffic
    logger.info('🚀 Server is ready to accept traffic', 'server-startup');
  });

  // Handle server errors
  server.on('error', (error: any) => {
    clearTimeout(startupTimeout);
    logger.error('❌ Server failed to start', 'server-startup', {
      error: error.message,
      code: error.code,
      stack: error.stack
    });
    
    if (error.code === 'EADDRINUSE') {
      logger.error(`Port ${port} is already in use. Please check for other processes.`, 'server-startup');
    } else if (error.code === 'EACCES') {
      logger.error(`Permission denied to bind to port ${port}. Try a port > 1024.`, 'server-startup');
    }
    
    // Exit with error code for Cloud Run to detect failure
    process.exit(1);
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

    }
  } catch (error) {
    console.error('❌ Failed to initialize application:', error);
    if (process.env.NETLIFY !== 'true') {
      process.exit(1);
    }
  }
})();

// Export app for serverless environments
export default app;