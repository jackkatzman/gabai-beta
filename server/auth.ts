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

  console.log('🍪 Cookie secure setting:', isSecure);
  console.log('🌐 Environment:', process.env.NODE_ENV);
  console.log('🔗 Domains:', process.env.REPLIT_DOMAINS);

  // Session configuration
  app.use(session({
    store: sessionStore,
    secret: process.env.SESSION_SECRET || 'gabai-dev-secret-change-in-production',
    resave: true, // Force session save to store
    saveUninitialized: false,
    rolling: true, // Reset expiration on activity
    name: 'gabai.sid', // Custom session name
    cookie: {
      secure: isSecure || false, // Use secure cookies only in production/Replit
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      domain: undefined, // Let browser determine domain
    }
  }));

  // Initialize passport
  app.use(passport.initialize());
  app.use(passport.session());

  // Configure Google OAuth strategy with ONLY the working Replit domain
  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    const callbackURL = `https://gab-ai-jack741.replit.app/api/auth/google/callback`;
    console.log('🎯 OAuth callback URL:', callbackURL);
    console.log('🔑 Full Client ID:', process.env.GOOGLE_CLIENT_ID);
    console.log('🔒 Client Secret (first 10 chars):', process.env.GOOGLE_CLIENT_SECRET?.substring(0, 10) + '...');
    console.log('🔒 Client Secret length:', process.env.GOOGLE_CLIENT_SECRET?.length);
    
    passport.use(new GoogleStrategy({
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: callbackURL
    }, async (accessToken, refreshToken, profile, done) => {
      try {
        // Check if user exists
        let user = await storage.getUserByEmail(profile.emails?.[0]?.value || '');
        
        if (!user) {
          // Create new user
          user = await storage.createUser({
            name: profile.displayName || 'User',
            email: profile.emails?.[0]?.value || '',
            preferences: {},
            onboardingCompleted: false
          });
        }

        return done(null, user);
      } catch (error) {
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
    passport.authenticate('google', { scope: ['profile', 'email'] })(req, res, next);
  });

  app.get('/api/auth/google/callback',
    passport.authenticate('google', { failureRedirect: '/login' }),
    (req, res) => {
      // Successful authentication
      console.log('✅ Google OAuth success, user:', req.user);
      console.log('✅ Session after auth:', req.session);
      console.log('✅ Session ID:', req.sessionID);
      console.log('✅ Is authenticated:', req.isAuthenticated());
      
      // Check if user needs onboarding
      const user = req.user as any;
      if (user && !user.onboardingCompleted) {
        console.log('🔄 User needs onboarding, redirecting...');
        res.redirect('/onboarding');
      } else {
        console.log('🏠 User completed onboarding, redirecting to home...');
        res.redirect('/');
      }
    }
  );

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