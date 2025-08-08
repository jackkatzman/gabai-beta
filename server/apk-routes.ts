import type { Express } from "express";
import path from "path";
import fs from "fs";

export function registerApkRoutes(app: Express) {
  // APK download endpoint for beta testers
  app.get('/downloads/gabai-beta.apk', (req, res) => {
    const apkPath = path.join(process.cwd(), 'public', 'downloads', 'gabai-beta.apk');
    
    // Check if APK file exists
    if (!fs.existsSync(apkPath)) {
      return res.status(404).json({ 
        error: 'Beta APK not yet available',
        message: 'The beta APK is currently being prepared. Please check back soon or try the web app.'
      });
    }

    // Set proper headers for APK download
    res.setHeader('Content-Type', 'application/vnd.android.package-archive');
    res.setHeader('Content-Disposition', 'attachment; filename="gabai-beta.apk"');
    res.setHeader('Cache-Control', 'no-cache');
    
    // Log download for analytics
    console.log(`📱 Beta APK download requested from IP: ${req.ip} at ${new Date().toISOString()}`);
    
    // Stream the file
    const fileStream = fs.createReadStream(apkPath);
    fileStream.pipe(res);
    
    fileStream.on('error', (error) => {
      console.error('APK download error:', error);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Download failed' });
      }
    });
  });

  // Beta program info endpoint
  app.get('/api/beta-info', (req, res) => {
    res.json({
      version: '1.0.0-beta.1',
      releaseDate: '2025-08-08',
      features: [
        'Voice-first AI assistant',
        'Smart alarms with AI voices', 
        'Intelligent lists and calendar',
        'OCR text scanning',
        'Contact management',
        'Native mobile notifications'
      ],
      requirements: {
        android: '7.0+',
        storage: '100MB',
        permissions: [
          'Microphone (for voice commands)',
          'Camera (for OCR scanning)', 
          'Notifications (for alarms)',
          'Contacts (for contact management)',
          'Storage (for voice recordings)'
        ]
      },
      knownIssues: [
        'Voice recognition may be slower on older devices',
        'Battery optimization may affect alarm reliability'
      ],
      feedback: {
        email: 'beta@gabai.ai',
        discord: 'https://discord.gg/gabai-beta',
        github: 'https://github.com/gabai/mobile/issues'
      }
    });
  });

  // Beta tester registration
  app.post('/api/beta-register', (req, res) => {
    const { email, deviceInfo, feedbackTopics } = req.body;
    
    // Log beta registration (in production, save to database)
    console.log(`🧪 New beta tester registered:`, {
      email,
      deviceInfo,
      feedbackTopics,
      timestamp: new Date().toISOString(),
      ip: req.ip
    });
    
    res.json({
      success: true,
      message: 'Thank you for joining our beta program! Download link sent to your email.',
      downloadUrl: '/downloads/gabai-beta.apk'
    });
  });
}