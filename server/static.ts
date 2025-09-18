import express, { type Express } from "express";
import fs from "fs";
import path from "path";

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

export function serveStatic(app: Express) {
  const distPath = path.resolve(import.meta.dirname, "..", "dist", "public");

  if (!fs.existsSync(distPath)) {
    console.log(`❌ Public directory not found at: ${distPath}`);
    console.log(`📁 Current dirname: ${import.meta.dirname}`);
    console.log(`📁 Checking if public exists at alternate locations...`);
    
    // Try other potential locations
    const altPaths = [
      path.resolve(import.meta.dirname, "public"),
      path.resolve(process.cwd(), "public"),
      path.resolve(".", "public")
    ];
    
    for (const altPath of altPaths) {
      if (fs.existsSync(altPath)) {
        console.log(`✅ Found public directory at: ${altPath}`);
        break;
      } else {
        console.log(`❌ Not found at: ${altPath}`);
      }
    }
    
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`,
    );
  }

  console.log(`✅ Serving static files from: ${distPath}`);
  console.log(`📂 Public directory contents:`, fs.readdirSync(distPath).slice(0, 10));
  
  // Serve zip files directly with proper streaming 
  app.get('/*.zip', (req, res) => {
    const fileName = req.path.substring(1); // Remove leading slash
    const filePath = path.resolve(distPath, fileName);
    
    console.log(`📦 ZIP download request: ${fileName}`);
    console.log(`📁 Full path: ${filePath}`);
    
    if (!fs.existsSync(filePath)) {
      console.log(`❌ File not found: ${filePath}`);
      return res.status(404).json({ error: 'File not found' });
    }
    
    const stat = fs.statSync(filePath);
    console.log(`📊 File size: ${stat.size} bytes`);
    
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.setHeader('Content-Length', stat.size);
    res.setHeader('Cache-Control', 'no-cache');
    
    // Stream the file
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
    
    fileStream.on('error', (err) => {
      console.error('❌ File stream error:', err);
      res.status(500).json({ error: 'Download failed' });
    });
    
    fileStream.on('end', () => {
      console.log(`✅ ZIP download completed: ${fileName}`);
    });
  });

  // Serve other static files normally
  app.use(express.static(distPath));

  // fall through to index.html for HTML routes only (NOT API routes)
  app.use("*", (req, res, next) => {
    // CRITICAL: Skip API routes to prevent HTML responses for API calls
    if (req.path.startsWith('/api/')) {
      console.log('⚠️ API route not found:', req.path);
      return res.status(404).json({ 
        error: 'API endpoint not found',
        path: req.path,
        message: 'The requested API endpoint does not exist'
      });
    }
    
    // Skip if already handled or is a static file
    if (res.headersSent || 
        req.path.includes('.zip') || 
        req.path.includes('.json') || 
        req.path.includes('.png') ||
        req.path.includes('.css') ||
        req.path.includes('.js')) {
      return next();
    }
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}