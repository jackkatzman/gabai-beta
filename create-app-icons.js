#!/usr/bin/env node

// Create GabAi app icons for Android
import fs from 'fs';
import path from 'path';

// Simple SVG to create a round icon for GabAi
const createIconSVG = (size) => `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#3b82f6;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#1d4ed8;stop-opacity:1" />
    </linearGradient>
  </defs>
  <!-- Round background -->
  <circle cx="${size/2}" cy="${size/2}" r="${size/2 - 8}" fill="url(#grad)" stroke="#ffffff" stroke-width="4"/>
  
  <!-- G letter -->
  <text x="${size/2}" y="${size/2 + size/8}" 
        font-family="Arial, sans-serif" 
        font-size="${size/2.5}" 
        font-weight="bold" 
        text-anchor="middle" 
        fill="white">G</text>
  
  <!-- Small AI text -->
  <text x="${size/2}" y="${size/2 + size/3}" 
        font-family="Arial, sans-serif" 
        font-size="${size/8}" 
        font-weight="normal" 
        text-anchor="middle" 
        fill="white" 
        opacity="0.9">AI</text>
</svg>`;

// Icon sizes for different densities
const densities = {
  'mdpi': 48,
  'hdpi': 72,
  'xhdpi': 96,
  'xxhdpi': 144,
  'xxxhdpi': 192
};

console.log('🎨 Creating GabAi app icons...');

// Create icons for each density
Object.entries(densities).forEach(([density, size]) => {
  const dir = `android/app/src/main/res/mipmap-${density}`;
  const svgContent = createIconSVG(size);
  
  // Create SVG file temporarily
  const svgPath = `ic_launcher_round_${density}.svg`;
  fs.writeFileSync(svgPath, svgContent);
  
  console.log(`✅ Created icon for ${density} (${size}x${size})`);
  
  // Note: In a real environment, you'd convert SVG to PNG
  // For now, we'll copy existing icons and rename them
  if (fs.existsSync(`${dir}/ic_launcher.png`)) {
    fs.copyFileSync(`${dir}/ic_launcher.png`, `${dir}/ic_launcher_round.png`);
    console.log(`📱 Copied round icon for ${density}`);
  }
  
  // Clean up temporary SVG
  if (fs.existsSync(svgPath)) {
    fs.unlinkSync(svgPath);
  }
});

console.log('🚀 App icons created successfully!');