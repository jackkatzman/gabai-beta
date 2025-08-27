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
}