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

// CRITICAL: Add login route FIRST before any other middleware
console.log('🔧 Setting up /api/login route BEFORE all other middleware...');

// Simple test route first
app.get('/api/test', (req, res) => {
  console.log('✅ TEST ROUTE REACHED from browser!');
  res.json({ message: 'Express server is working!', timestamp: Date.now() });
});

app.get('/api/login', (req, res) => {
  console.log('🚀🚀🚀 LOGIN ROUTE HIT - BROWSER REQUEST RECEIVED!');
  console.log('🌐 Request from:', req.get('host'));
  console.log('🔄 User clicked login button, starting OAuth...');
  
  const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
    `response_type=code` +
    `&client_id=${process.env.GOOGLE_CLIENT_ID}` +
    `&redirect_uri=https://gab-ai-jack741.replit.app/api/auth/google/callback` +
    `&scope=profile%20email` +
    `&access_type=offline` +
    `&prompt=consent`;
  
  console.log('✅ Sending redirect to Google OAuth...');
  return res.redirect(googleAuthUrl);
});

// Setup authentication after login route
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

    // Add middleware to ensure API routes are handled before Vite catch-all
    app.use('/api/*', (req, res, next) => {
      console.log(`🔍 API middleware: ${req.method} ${req.path}`);
      console.log(`🔍 Full URL: ${req.originalUrl}`);
      console.log(`🔍 Headers: ${JSON.stringify(req.headers.accept)}`);
      next();
    });

    // Login route moved to top of file - this duplicate is removed

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
  // Use dynamic port selection to avoid conflicts
  const basePort = parseInt(process.env.PORT || '8080', 10);
  
  // Kill any existing processes on common ports
  const killExistingProcesses = () => {
    try {
      require('child_process').execSync('pkill -f "tsx.*server" || true', { stdio: 'ignore' });
      require('child_process').execSync('pkill -f "node.*server" || true', { stdio: 'ignore' });
    } catch (e) {
      // Ignore errors
    }
  };
  
  const startServer = (port: number, attempts = 0): void => {
    if (attempts > 15) {
      console.error('❌ Could not find available port after 15 attempts');
      process.exit(1);
    }
    
    if (attempts === 0) {
      killExistingProcesses();
    }
    
    const serverInstance = server.listen(port, "0.0.0.0", (error?: Error) => {
      if (error) {
        if (error.message.includes('EADDRINUSE')) {
          console.log(`⚠️ Port ${port} in use, trying ${port + 1}...`);
          setTimeout(() => startServer(port + 1, attempts + 1), 1000);
        } else {
          console.error('❌ Failed to start server:', error);
          process.exit(1);
        }
      } else {
        log(`serving on port ${port}`);
        
        // Log OAuth configuration status
        if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
          console.log('✅ OAuth configuration detected');
        } else {
          console.log('⚠️  OAuth not configured - Google login will not work');
        }
        
        // Prevent duplicate server instances
        return;
      }
    });
    
    serverInstance.on('error', (error: any) => {
      if (error.code === 'EADDRINUSE') {
        console.log(`⚠️ Port ${port} in use, trying ${port + 1}...`);
        setTimeout(() => startServer(port + 1, attempts + 1), 1000);
      }
    });
  };
  
  startServer(basePort);
  
  } catch (error) {
    console.error('❌ Failed to initialize application:', error);
    process.exit(1);
  }
})();
