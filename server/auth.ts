import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import session from 'express-session';
import MemoryStore from 'memorystore';
import type { Express } from 'express';
import { storage } from './storage';

export function setupAuth(app: Express) {
  // Use memory store for now (works reliably with OAuth)
  const MemStore = MemoryStore(session);
  const sessionStore = new MemStore({
    checkPeriod: 86400000 // prune expired entries every 24h
  });

  // Force secure cookies for HTTPS Replit environment
  const isOnReplit = process.env.REPLIT_DOMAINS || process.env.REPLIT_DEV_DOMAIN;
  const shouldUseSecureCookies = isOnReplit; // Always secure on Replit since it's HTTPS

  console.log('🍪 Cookie secure setting:', shouldUseSecureCookies);
  console.log('🌐 Environment:', process.env.NODE_ENV);
  console.log('🔗 Domains:', process.env.REPLIT_DOMAINS);

  // Session configuration optimized for Replit HTTPS environment
  app.use(session({
    store: sessionStore,
    secret: process.env.SESSION_SECRET || 'gabai-dev-secret-change-in-production',
    resave: false, // Don't save unchanged sessions
    saveUninitialized: false, // Don't save empty sessions
    rolling: true, // Reset expiration on activity
    name: 'gabai.sid', // Simple session name
    cookie: {
      secure: false, // TEMPORARILY disable secure for debugging
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      path: '/',
      domain: undefined,
    }
  }));

  // Initialize passport
  app.use(passport.initialize());
  app.use(passport.session());

  // Configure Google OAuth strategy - dynamic callback URL
  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    console.log('🌐 Environment:', process.env.NODE_ENV);
    console.log('🔑 Client ID:', process.env.GOOGLE_CLIENT_ID);
    console.log('🔒 Client Secret configured:', !!process.env.GOOGLE_CLIENT_SECRET);
    
    passport.use(new GoogleStrategy({
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.NODE_ENV === 'production' 
        ? 'https://gabai.ai/api/auth/google/callback'
        : '/api/auth/google/callback' // Use relative URL - works with any domain
    }, async (accessToken, refreshToken, profile, done) => {
      try {
        console.log('🔥 GOOGLE OAUTH CALLBACK TRIGGERED!');
        // Only log PII in development mode
        const isProd = process.env.NODE_ENV === 'production';
        if (!isProd) {
          console.log('👤 Google profile:', JSON.stringify(profile, null, 2));
          console.log('📧 Email:', profile.emails?.[0]?.value);
          console.log('👨‍💻 Display name:', profile.displayName);
        }
        
        // Check if user exists
        const email = profile.emails?.[0]?.value || '';
        console.log('🔍 Looking for user with email:', email);
        
        let user = await storage.getUserByEmail(email);
        console.log('🔍 Existing user found:', !!user);
        
        if (!user) {
          console.log('➕ Creating new user...');
          // Create new user
          user = await storage.createUser({
            name: profile.displayName || 'User',
            email: email,
            preferences: {},
            onboardingCompleted: false
          });
          console.log('✅ New user created:', user.id);
        } else {
          console.log('✅ Existing user logged in:', user.id);
        }

        console.log('🎯 Returning user to passport:', user.id);
        return done(null, user);
      } catch (error) {
        console.error('❌ OAuth strategy error:', error);
        return done(error, undefined);
      }
    }));
  }

  // Serialize user for session
  passport.serializeUser((user: any, done) => {
    console.log('Serializing user:', user.id);
    done(null, user.id);
  });

  // Deserialize user from session
  passport.deserializeUser(async (id: string, done) => {
    try {
      console.log('🔄 Deserializing user ID:', id);
      const user = await storage.getUser(id);
      console.log('✅ Deserialized user:', user ? 'Found' : 'Not found');
      done(null, user);
    } catch (error) {
      console.error('❌ Deserialization error:', error);
      done(error, null);
    }
  });

  // Start Google OAuth - universal domain support
  app.get('/api/auth/google', (req, res, next) => {
    // Set the callback URL dynamically based on current host
    const currentHost = req.get('host');
    const callbackURL = process.env.NODE_ENV === 'production' 
      ? 'https://gabai.ai/api/auth/google/callback'
      : `https://${currentHost}/api/auth/google/callback`;
    
    console.log('🔄 Google OAuth starting with callback:', callbackURL);
    
    const userAgent = req.get('User-Agent') || '';
    const isMobile = /Mobile|Android|iPhone|iPad/i.test(userAgent);
    const isAPK = userAgent.includes('GabAi') || 
                  userAgent.includes('wv') || 
                  userAgent.includes('Replit-Bonsai') ||
                  req.query.mobile === 'true' || 
                  req.query.source === 'apk';
    const state = isAPK ? 'apk_native' : isMobile ? 'mobile' : 'web';
    
    console.log('🔐 Starting Google OAuth:', { 
      isMobile, 
      isAPK, 
      state, 
      userAgent: userAgent.substring(0, 100) 
    });
    
    let oauthOptions: any;
    
    if (isAPK) {
      console.log('📱 APK detected - using minimal OAuth parameters to prevent 400 errors');
      oauthOptions = {
        scope: ['profile', 'email'],
        state: state
        // Remove all other parameters that can cause 400 errors in APK environment
      };
    } else {
      // Standard web OAuth parameters
      oauthOptions = {
        scope: ['profile', 'email'],
        state: state,
        access_type: 'offline',
        prompt: 'select_account'
      };
    }
    
    passport.authenticate('google', oauthOptions)(req, res, next);
  });

  // Callback from Google (HTTPS)
  app.get('/api/auth/google/callback',
    (req, res, next) => {
      console.log('📥 OAuth callback received:', {
        query: req.query,
        userAgent: req.get('User-Agent')?.substring(0, 100)
      });
      
      passport.authenticate('google', { 
        failureRedirect: '/login?error=oauth_failed&details=' + encodeURIComponent(JSON.stringify(req.query))
      })(req, res, next);
    },
    (req, res) => {
      console.log('🔥 Google OAuth callback successful');
      const user = req.user as any;
      const state = req.query.state as string;
      const isAPK = state === 'apk_native';
      
      if (!user) {
        console.error('❌ No user found in OAuth callback');
        return res.redirect('/login?error=no_user_data');
      }
      
      console.log('✅ OAuth successful for user:', user.id, 'State:', state);
      
      // Create secure token for APK authentication
      const token = Buffer.from(JSON.stringify({
        userId: user.id, 
        timestamp: Date.now(),
        source: isAPK ? 'apk_oauth' : 'web_oauth'
      })).toString('base64');
      
      if (isAPK) {
        console.log('📱 APK OAuth - closing auth window and triggering parent refresh');
        // Send a simple page that closes the auth window
        res.send(`
          <!DOCTYPE html>
          <html>
          <head>
            <title>Authentication Success</title>
          </head>
          <body>
            <h2>Authentication Successful!</h2>
            <p>Returning to GabAi...</p>
            <script>
              // Close this window/tab and let parent know auth is complete
              if (window.opener) {
                window.opener.postMessage('auth_success', '*');
                window.close();
              } else {
                // Fallback - redirect to main app
                setTimeout(() => {
                  window.location.href = '/';
                }, 2000);
              }
            </script>
          </body>
          </html>
        `);
      } else {
        console.log('🌐 Web OAuth - redirecting to home');
        res.redirect(`/?auth=success&t=${token}`);
      }
    }
  );

  // Deep link testing endpoint for debugging mobile auth flow
  app.get('/api/auth/applink-test', (req,res) =>
    res.redirect('https://gabai.ai/auth/callback?ok=1&src=test'));

  // HTTPS App Link handler - this is what Android will open when the link is clicked
  app.get('/auth/callback', async (req, res) => {
    const ok = req.query.ok;
    const mobile = req.query.mobile;
    const src = req.query.src;
    
    console.log('🔗 App Link callback accessed:', { ok, mobile, src });
    
    if (mobile && req.sessionID) {
      console.log('📱 Mobile auth callback - session available');
      // The user should already be authenticated from the OAuth callback
      // This page will refresh the app state
    }
    
    // This page will be loaded in the app and trigger the authentication
    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Authentication Success</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            margin: 0;
            padding: 20px;
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            text-align: center;
          }
          .container {
            background: rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(10px);
            border-radius: 20px;
            padding: 40px;
            max-width: 400px;
            width: 100%;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
          }
          h1 {
            margin: 0 0 20px 0;
            font-size: 24px;
            font-weight: 600;
          }
          p {
            margin: 10px 0;
            opacity: 0.9;
            line-height: 1.5;
          }
          .loading {
            display: inline-block;
            width: 20px;
            height: 20px;
            border: 3px solid rgba(255,255,255,0.3);
            border-radius: 50%;
            border-top-color: white;
            animation: spin 1s ease-in-out infinite;
          }
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>✅ Authentication Success</h1>
          <p>You're now signed in to GabAi!</p>
          <div class="loading"></div>
          <p>Returning to app...</p>
        </div>
        
        <script>
          // Store auth success
          if ('${ok}' === '1') {
            localStorage.setItem('gabai_mobile_auth_success', Date.now().toString());
            
            // Give user a moment to see success message, then redirect to app home
            setTimeout(() => {
              window.location.href = '/';
            }, 2000);
          } else {
            // Handle error case
            localStorage.setItem('gabai_mobile_auth_error', 'Authentication failed');
            setTimeout(() => {
              window.location.href = '/?error=auth_failed';
            }, 2000);
          }
        </script>
      </body>
      </html>
    `);
  });

  // Mobile auth callback page - handles OAuth success for mobile apps
  app.get('/mobile-auth-callback', (req, res) => {
    const token = req.query.token;
    const success = req.query.success;
    
    // This page will be loaded in the device browser and automatically close
    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Authentication Success</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            margin: 0;
            padding: 20px;
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            text-align: center;
          }
          .container {
            max-width: 400px;
            padding: 40px 20px;
          }
          .success-icon {
            font-size: 48px;
            margin-bottom: 20px;
          }
          h1 {
            font-size: 24px;
            margin-bottom: 10px;
          }
          p {
            font-size: 16px;
            opacity: 0.9;
            margin-bottom: 30px;
          }
          .token {
            background: rgba(255,255,255,0.1);
            padding: 15px;
            border-radius: 8px;
            word-break: break-all;
            margin-bottom: 20px;
            font-family: monospace;
            font-size: 12px;
          }
          .close-instruction {
            font-size: 14px;
            opacity: 0.8;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="success-icon">✅</div>
          <h1>Authentication Successful!</h1>
          <p>You've successfully logged in to GabAi.</p>
          ${token ? `
            <div class="token">
              Token: ${token}
            </div>
            <script>
              // Store token in localStorage for the app to access
              localStorage.setItem('gabai_mobile_token', '${token}');
              localStorage.setItem('gabai_mobile_auth_success', 'true');
              
              // Try to close the browser tab/window
              setTimeout(() => {
                window.close();
              }, 2000);
            </script>
          ` : ''}
          <p class="close-instruction">Please return to the GabAi app.</p>
        </div>
      </body>
      </html>
    `);
  });

  // Mobile bypass disabled - removed endpoint

  // Simple test login for development
  app.post('/api/auth/test-login', async (req, res) => {
    try {
      const testUser = {
        id: 'test-user-123',
        name: 'Test User',
        email: 'test@example.com',
        age: 30,
        location: 'Test City',
        profession: 'Developer',
        preferences: {
          religious: 'none',
          dietary: [],
          interests: ['technology'],
          communication: 'casual',
          language: 'English',
          timezone: 'America/New_York'
        },
        onboardingCompleted: true,
        timezone: 'America/New_York',
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      // Simulate authentication 
      req.login(testUser, (err) => {
        if (err) {
          console.error('Test login error:', err);
          return res.status(500).json({ error: 'Test login failed' });
        }
        res.json(testUser);
      });
    } catch (error) {
      console.error('Test login error:', error);
      res.status(500).json({ error: 'Test login failed' });
    }
  });

  app.get('/api/auth/logout', (req, res) => {
    console.log('🚪 Logging out user...');
    req.logout((err) => {
      if (err) {
        console.error('❌ Logout error:', err);
        return res.status(500).json({ message: 'Logout failed' });
      }
      req.session.destroy((destroyErr) => {
        if (destroyErr) {
          console.error('❌ Session destroy error:', destroyErr);
        }
        console.log('✅ User logged out successfully');
        res.redirect('/');
      });
    });
  });

  app.get('/api/auth/user', (req, res) => {
    console.log('🔍 SESSION ID:', req.sessionID);
    console.log('🔍 Session exists:', !!req.session);
    console.log('🔍 Session passport:', (req.session as any)?.passport);
    console.log('🔍 User object:', req.user);
    console.log('🔍 Is authenticated:', req.isAuthenticated());
    console.log('🍪 Cookie header:', req.headers.cookie);
    console.log('🌐 User agent:', req.headers['user-agent']?.substring(0, 50));
    
    if (req.isAuthenticated()) {
      res.json(req.user);
    } else {
      res.status(401).json({ message: 'Not authenticated' });
    }
  });

  // Mobile token verification endpoint
  app.post('/api/auth/mobile/verify', async (req, res) => {
    try {
      const { token } = req.body;
      
      if (!token) {
        return res.status(400).json({ error: 'Token required' });
      }
      
      // Decode the token
      const decoded = JSON.parse(Buffer.from(token, 'base64').toString());
      const { userId, timestamp } = decoded;
      
      // Check if token is not too old (24 hours max)
      const maxAge = 24 * 60 * 60 * 1000; // 24 hours
      if (Date.now() - timestamp > maxAge) {
        return res.status(401).json({ error: 'Token expired' });
      }
      
      // Get user from database
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      console.log('✅ Mobile token verified for user:', user.id);
      
      res.json({
        success: true,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          preferences: user.preferences,
          onboardingCompleted: user.onboardingCompleted
        }
      });
      
    } catch (error) {
      console.error('❌ Mobile token verification failed:', error);
      res.status(500).json({ error: 'Token verification failed' });
    }
  });
  
  // Mobile logout endpoint
  app.post('/api/auth/mobile/logout', (req, res) => {
    console.log('📱 Mobile logout requested');
    res.json({ success: true, message: 'Logged out successfully' });
  });

  // Magic link route moved to routes.ts to avoid conflicts
}

// Middleware to protect routes
export function requireAuth(req: any, res: any, next: any) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: 'Authentication required' });
}