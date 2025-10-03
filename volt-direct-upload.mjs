#!/usr/bin/env node

import fs from 'fs';
import FormData from 'form-data';

// VoltBuilder API credentials from environment
const API_CREDENTIALS = process.env.VOLT_PASSWORD;
if (!API_CREDENTIALS) {
  console.error('❌ VOLT_PASSWORD environment variable not set');
  process.exit(1);
}

// Parse credentials
const [CLIENT_ID, CLIENT_SECRET] = API_CREDENTIALS.split(':');
const ZIP_FILE = 'gabai-v87-enhanced.zip';

async function uploadToVoltBuilder() {
  console.log('🚀 VoltBuilder Direct Upload');
  console.log('============================');
  console.log(`📦 Uploading ${ZIP_FILE}...`);
  
  if (!fs.existsSync(ZIP_FILE)) {
    console.error(`❌ File not found: ${ZIP_FILE}`);
    process.exit(1);
  }
  
  const fileSize = fs.statSync(ZIP_FILE).size;
  console.log(`📊 File size: ${(fileSize / 1024 / 1024).toFixed(2)} MB`);
  
  const form = new FormData();
  
  // Add the zip file
  form.append('file', fs.createReadStream(ZIP_FILE), {
    filename: ZIP_FILE,
    contentType: 'application/zip'
  });
  
  // Add platform
  form.append('platform', 'android');
  
  // Add release mode
  form.append('debug', 'false');
  
  // Use Basic Auth with the credentials
  const auth = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64');
  
  try {
    // Try the direct upload endpoint
    console.log('📤 Uploading to VoltBuilder...');
    const response = await fetch('https://api.volt.build/app', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        ...form.getHeaders()
      },
      body: form
    });
    
    const responseText = await response.text();
    
    if (response.ok || response.status === 202) {
      console.log('✅ Upload successful!');
      try {
        const data = JSON.parse(responseText);
        console.log('\n📋 Build Details:');
        console.log('  Build ID:', data.id || data.buildId);
        console.log('  Status:', data.status || 'Queued');
        console.log('  Platform: Android');
        
        const buildId = data.id || data.buildId;
        if (buildId) {
          console.log('\n🔗 Check build progress at:');
          console.log(`  https://volt.build/app/${buildId}`);
        }
      } catch {
        // If response is not JSON, just show it
        console.log('Response:', responseText);
      }
    } else {
      console.error(`❌ Upload failed: ${response.status} ${response.statusText}`);
      console.error('Response:', responseText);
      
      // If Basic auth fails, suggest alternative
      if (response.status === 401 || response.status === 403) {
        console.log('\n💡 If authentication fails, try:');
        console.log('1. Login to VoltBuilder at https://volt.build');
        console.log('2. Go to https://volt.build/plan/');
        console.log('3. Click "Copy API Credentials to Clipboard"');
        console.log('4. Update your VOLT_PASSWORD environment variable');
      }
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
    
    // Try alternative without auth as fallback
    console.log('\n🔄 Trying alternative upload method...');
    
    const altForm = new FormData();
    altForm.append('app', fs.createReadStream(ZIP_FILE));
    altForm.append('platform', 'android');
    
    try {
      const altResponse = await fetch('https://volt.build/api/upload', {
        method: 'POST',
        headers: altForm.getHeaders(),
        body: altForm
      });
      
      if (altResponse.ok) {
        const result = await altResponse.text();
        console.log('✅ Alternative upload successful!');
        console.log('Response:', result);
      } else {
        console.error('Alternative method also failed');
      }
    } catch (altError) {
      console.error('Alternative method error:', altError.message);
    }
  }
}

// Main execution
uploadToVoltBuilder().catch(error => {
  console.error('\n❌ Fatal error:', error.message);
  process.exit(1);
});