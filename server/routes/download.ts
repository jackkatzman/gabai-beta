import { Router } from 'express';
import path from 'path';
import fs from 'fs';

const router = Router();

router.get('/apk', (req, res) => {
  try {
    const apkPath = path.join(process.cwd(), 'attached_assets', 'GabAi.debug.v1.0.0 (39)_1755487879223.apk');
    
    if (!fs.existsSync(apkPath)) {
      return res.status(404).json({ error: 'APK file not found' });
    }
    
    const stat = fs.statSync(apkPath);
    
    res.setHeader('Content-Type', 'application/vnd.android.package-archive');
    res.setHeader('Content-Disposition', 'attachment; filename="GabAi.apk"');
    res.setHeader('Content-Length', stat.size);
    
    const fileStream = fs.createReadStream(apkPath);
    fileStream.pipe(res);
    
  } catch (error) {
    console.error('Error serving APK:', error);
    res.status(500).json({ error: 'Failed to serve APK file' });
  }
});

export default router;