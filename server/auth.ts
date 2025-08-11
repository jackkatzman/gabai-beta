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

  // Determine if we're in a secure environment
  const isSecure = process.env.NODE_ENV === 'production' || 
                   (process.env.REPLIT_DOMAINS && process.env.REPLIT_DOMAINS.includes('.replit.dev'));

  console.log('🍪 Cookie secure setting:', false);
  console.log('🌐 Environment:', process.env.NODE_ENV);
  console.log('🔗 Domains:', process.env.REPLIT_DOMAINS);

  // Session configuration
  app.use(session({
    store: sessionStore,
    secret: process.env.SESSION_SECRET || 'gabai-dev-secret-change-in-production',
    resave: false, // Don't save unchanged sessions
    saveUninitialized: false, // Don't save empty sessions
    rolling: true, // Reset expiration on activity
    name: 'gabai.sid', // Simple session name
    cookie: {
      secure: false, // Disable secure for debugging OAuth issues
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days for better persistence
      path: '/', // Ensure cookie works for all paths
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
      callbackURL: '/api/auth/google/callback' // Relative URL - will use current host
    }, async (accessToken, refreshToken, profile, done) => {
      try {
        console.log('🔥 GOOGLE OAUTH CALLBACK TRIGGERED!');
        console.log('👤 Google profile:', JSON.stringify(profile, null, 2));
        console.log('📧 Email:', profile.emails?.[0]?.value);
        console.log('👨‍💻 Display name:', profile.displayName);
        
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

  // Auth routes - updated to match Google Cloud Console configuration
  app.get('/api/auth/google', (req, res, next) => {
    console.log('🚀 Starting Google OAuth flow...');
    console.log('🌐 Request hostname:', req.hostname);
    console.log('🔗 Full URL:', req.protocol + '://' + req.get('host') + req.originalUrl);
    console.log('🔑 Using Client ID:', process.env.GOOGLE_CLIENT_ID?.substring(0, 20) + '...');
    console.log('📍 Callback URL will use current host:', `${req.protocol}://${req.get('host')}/api/auth/google/callback`);
    
    const authenticator = passport.authenticate('google', { 
      scope: ['profile', 'email'],
      accessType: 'offline',
      prompt: 'consent'
    });
    
    console.log('🔄 Calling passport.authenticate...');
    authenticator(req, res, next);
  });

  app.get('/api/auth/google/callback', (req, res, next) => {
    console.log('🔄 OAuth callback route hit!');
    console.log('🌐 Callback URL:', req.protocol + '://' + req.get('host') + req.originalUrl);
    console.log('🔍 Query params:', req.query);
    console.log('🔍 Has authorization code:', !!req.query.code);
    console.log('🔍 Has error:', !!req.query.error);
    
    if (req.query.error) {
      console.error('❌ OAuth error from Google:', req.query.error);
      return res.redirect('/?error=oauth_error');
    }
    
    passport.authenticate('google', {
      failureRedirect: '/?error=auth_failed'
    })(req, res, (err: any) => {
      if (err) {
        console.error('❌ Passport authentication error:', err);
        return res.redirect('/?error=auth_error');
      }
      
      // Successful authentication
      console.log('✅ Google OAuth success, user:', req.user);
      console.log('✅ Session after auth:', req.session);
      console.log('✅ Session ID:', req.sessionID);
      console.log('✅ Is authenticated:', req.isAuthenticated());
      
      // Force session save before redirect to ensure persistence
      req.session.save((saveErr) => {
        if (saveErr) {
          console.error('❌ Session save error:', saveErr);
          return res.redirect('/?error=session_save_failed');
        }
        
        console.log('💾 Session saved successfully');
        
        // Check if user needs onboarding
        const user = req.user as any;
        if (user && !user.onboardingCompleted) {
          console.log('🔄 User needs onboarding, redirecting...');
          res.redirect('/?onboarding=true');
        } else {
          console.log('🏠 User completed onboarding, redirecting to home...');
          res.redirect('/?auth=success');
        }
      });
    });
  });

  app.get('/auth/logout', (req, res) => {
    req.logout((err) => {
      if (err) {
        return res.status(500).json({ message: 'Logout failed' });
      }
      res.redirect('/');
    });
  });

  app.get('/auth/user', (req, res) => {
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
}

// Middleware to protect routes
export function requireAuth(req: any, res: any, next: any) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: 'Authentication required' });
}