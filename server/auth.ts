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

  // Session configuration
  app.use(session({
    store: sessionStore,
    secret: process.env.SESSION_SECRET || 'gabai-dev-secret-change-in-production',
    resave: false,
    saveUninitialized: false,
    rolling: true, // Reset expiration on activity
    cookie: {
      secure: true, // Always use secure cookies for OAuth
      httpOnly: true,
      sameSite: 'lax', // Changed from 'none' to 'lax' for better compatibility
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    }
  }));

  // Initialize passport
  app.use(passport.initialize());
  app.use(passport.session());

  // Configure Google OAuth strategy
  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    // Determine the callback URL based on environment
    const getCallbackURL = () => {
      if (process.env.REPLIT_DOMAINS) {
        const domain = process.env.REPLIT_DOMAINS.split(',')[0];
        return `https://${domain}/auth/google/callback`;
      }
      return "http://localhost:5000/auth/google/callback";
    };

    console.log('OAuth callback URL:', getCallbackURL());
    
    passport.use(new GoogleStrategy({
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: getCallbackURL()
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
      console.log('Deserializing user ID:', id);
      const user = await storage.getUser(id);
      console.log('Deserialized user:', user);
      done(null, user);
    } catch (error) {
      console.error('Deserialization error:', error);
      done(error, null);
    }
  });

  // Auth routes
  app.get('/auth/google',
    passport.authenticate('google', { scope: ['profile', 'email'] })
  );

  app.get('/auth/google/callback',
    passport.authenticate('google', { failureRedirect: '/login' }),
    (req, res) => {
      // Successful authentication
      console.log('Google OAuth success, user:', req.user);
      console.log('Session after auth:', req.session);
      console.log('Is authenticated:', req.isAuthenticated());
      
      // Force session save before redirect
      req.session.save((err) => {
        if (err) {
          console.error('Session save error:', err);
        } else {
          console.log('Session saved successfully');
        }
        res.redirect('/');
      });
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
    console.log('Auth check - full session:', JSON.stringify(req.session, null, 2));
    console.log('Auth check - user:', req.user);
    console.log('Auth check - isAuthenticated:', req.isAuthenticated());
    console.log('Auth check - session.passport:', req.session?.passport);
    
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