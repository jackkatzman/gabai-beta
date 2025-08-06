import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { setupAuth } from "./auth";

const app = express();

// Trust proxy for Replit environment (must be set before session middleware)
app.set('trust proxy', 1);

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Add security headers for OAuth
app.use((req, res, next) => {
  res.header('X-Frame-Options', 'DENY');
  res.header('X-Content-Type-Options', 'nosniff');
  res.header('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

// Setup authentication before routes
setupAuth(app);

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

    const server = await registerRoutes(app);

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
        port: process.env.PORT || '8080',
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

  // Serve static files for PWA (manifest, service worker)
  app.use('/manifest.json', express.static('./public/manifest.json'));
  app.use('/sw.js', express.static('./public/sw.js'));

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // For Autoscale compatibility, use standard listen call without reusePort
  // Autoscale sets PORT env var automatically for proper routing
  const port = parseInt(process.env.PORT || '8080', 10);
  
  server.listen(port, "0.0.0.0", (error?: Error) => {
    if (error) {
      if (error.message.includes('EADDRINUSE')) {
        console.error(`❌ Port ${port} is already in use. Trying to kill existing process...`);
        process.exit(1);
      } else {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
      }
    }
    log(`serving on port ${port}`);
    
    // Log OAuth configuration status
    if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
      console.log('✅ OAuth configuration detected');
    } else {
      console.log('⚠️  OAuth not configured - Google login will not work');
    }
  });
  
  } catch (error) {
    console.error('❌ Failed to initialize application:', error);
    process.exit(1);
  }
})();
