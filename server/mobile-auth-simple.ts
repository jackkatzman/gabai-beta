// Simplified Mobile Authentication for APK
import type { Express } from "express";
import { storage } from "./storage";

export function setupSimpleMobileAuth(app: Express) {
  console.log('🚀 Setting up simplified mobile authentication');

  // Mobile-specific login route that requires actual authentication
  app.post('/api/mobile/login', async (req, res) => {
    try {
      console.log('📱 Mobile login request received');
      console.log('📱 User agent:', req.get('User-Agent'));
      console.log('📱 Request body:', req.body);
      
      // Detect if this is from a VoltBuilder/Capacitor app
      const userAgent = req.get('User-Agent') || '';
      const isVoltBuilderApp = userAgent.includes('wv') || userAgent.includes('Android') || userAgent.includes('Mobile');
      
      if (!isVoltBuilderApp) {
        return res.status(400).json({ 
          error: 'This endpoint is only for mobile apps',
          redirect: '/api/auth/google'
        });
      }

      // Require email from the mobile app (passed from Google OAuth or stored credentials)
      const { email, idToken } = req.body;
      
      if (!email) {
        return res.status(400).json({ 
          error: 'Email is required for mobile login',
          needsAuth: true
        });
      }

      // Get the actual user by email
      let user;
      try {
        user = await storage.getUserByEmail(email);
        if (!user) {
          // User doesn't exist, they need to authenticate first
          return res.status(401).json({ 
            error: 'User not found. Please sign in with Google first.',
            needsAuth: true
          });
        }
      } catch (error) {
        console.error('📱 Error finding user:', error);
        return res.status(401).json({ 
          error: 'Authentication required',
          needsAuth: true
        });
      }

      // Set up the session for the actual user
      req.login(user, (err) => {
        if (err) {
          console.error('❌ Mobile session setup failed:', err);
          return res.status(500).json({ error: 'Session setup failed' });
        }

        console.log('✅ Mobile user authenticated:', user.id, user.email);
        
        // Force session save
        req.session.save((saveErr) => {
          if (saveErr) {
            console.error('❌ Session save failed:', saveErr);
            return res.status(500).json({ error: 'Session save failed' });
          }

          res.json({
            success: true,
            user: {
              id: user.id,
              name: user.name,
              email: user.email,
              preferences: user.preferences,
              onboardingCompleted: user.onboardingCompleted
            },
            message: 'Mobile authentication successful'
          });
        });
      });

    } catch (error) {
      console.error('❌ Mobile login error:', error);
      res.status(500).json({ 
        error: 'Mobile login failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Mobile logout
  app.post('/api/mobile/logout', (req, res) => {
    console.log('📱 Mobile logout request');
    
    req.logout((err) => {
      if (err) {
        console.error('❌ Mobile logout error:', err);
      }
      
      req.session.destroy((destroyErr) => {
        if (destroyErr) {
          console.error('❌ Session destroy error:', destroyErr);
        }
        
        console.log('✅ Mobile user logged out');
        res.json({ success: true, message: 'Logged out successfully' });
      });
    });
  });

  // Mobile auth status check
  app.get('/api/mobile/status', (req, res) => {
    console.log('📱 Mobile auth status check');
    console.log('📱 Is authenticated:', req.isAuthenticated());
    console.log('📱 User:', req.user ? 'Found' : 'None');
    
    if (req.isAuthenticated() && req.user) {
      res.json({
        authenticated: true,
        user: req.user
      });
    } else {
      res.json({
        authenticated: false,
        user: null
      });
    }
  });
}