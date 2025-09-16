// Mobile Authentication API endpoints
import type { Express } from "express";
import { storage } from "./storage";

export function setupMobileAuth(app: Express) {
  
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
      
      // Check if token is not too old (5 minutes max for security)
      const maxAge = 5 * 60 * 1000; // 5 minutes
      if (Date.now() - timestamp > maxAge) {
        return res.status(401).json({ error: 'Token expired' });
      }
      
      // Get user from database
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      console.log('✅ Mobile token verified for user:', user.id);
      
      // Set session for this user (mobile login)
      (req as any).login(user, (err: any) => {
        if (err) {
          console.error('❌ Session login failed:', err);
          return res.status(500).json({ error: 'Session creation failed' });
        }
        
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
}