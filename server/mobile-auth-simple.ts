// Simplified Mobile Authentication for APK
import type { Express } from "express";
import { storage } from "./storage";

export function setupSimpleMobileAuth(app: Express) {
  console.log('🚀 Setting up simplified mobile authentication');

  // Mobile-specific login route that creates a demo user for VoltBuilder apps
  app.post('/api/mobile/login', async (req, res) => {
    try {
      console.log('📱 Mobile login request received');
      console.log('📱 User agent:', req.get('User-Agent'));
      console.log('📱 Device info:', req.body);
      
      // Detect if this is from a VoltBuilder/Capacitor app
      const userAgent = req.get('User-Agent') || '';
      const isVoltBuilderApp = userAgent.includes('wv') || userAgent.includes('Android') || userAgent.includes('Mobile');
      
      if (!isVoltBuilderApp) {
        return res.status(400).json({ 
          error: 'This endpoint is only for mobile apps',
          redirect: '/api/auth/google'
        });
      }

      // Create or get a demo user for mobile testing
      let user;
      try {
        // Try to get existing demo user
        user = await storage.getUserByEmail('demo@gabai.app');
      } catch (error) {
        // User doesn't exist, create one
        console.log('📱 Creating demo user for mobile app');
      }
      
      if (!user) {
        user = await storage.createUser({
          name: 'GabAi Mobile User',
          email: 'demo@gabai.app',
          preferences: {
            communicationStyle: 'friendly',
            interests: ['technology', 'productivity']
          },
          onboardingCompleted: true // Skip onboarding for mobile demo
        });
        console.log('✅ Demo user created:', user.id);
      }

      // Set up the session manually
      req.login(user, (err) => {
        if (err) {
          console.error('❌ Mobile session setup failed:', err);
          return res.status(500).json({ error: 'Session setup failed' });
        }

        console.log('✅ Mobile user authenticated:', user.id);
        
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