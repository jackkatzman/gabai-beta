#!/usr/bin/env node

import fs from 'fs';
import FormData from 'form-data';

const ZIP_FILE = 'gabai-v141.zip';
const VOLT_CREDS = process.env.Voltbuiler;

if (!VOLT_CREDS) {
  console.error('❌ Voltbuiler secret not found');
  process.exit(1);
}

const [CLIENT_ID, CLIENT_SECRET] = VOLT_CREDS.split(':');

console.log('🚀 Uploading GabAI v141 to VoltBuilder');
console.log('=====================================');

if (!fs.existsSync(ZIP_FILE)) {
  console.error(`❌ ${ZIP_FILE} not found`);
  process.exit(1);
}

const fileSize = fs.statSync(ZIP_FILE).size;
console.log(`📦 File size: ${(fileSize / 1024 / 1024).toFixed(2)} MB`);

async function uploadToVoltBuilder() {
  try {
    // Step 1: Get OAuth2 token
    console.log('🔑 Getting OAuth2 token...');
    
    const authParams = new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET
    });
    
    const authResponse = await fetch('https://api.volt.build/v1/authenticate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: authParams.toString()
    });
    
    if (!authResponse.ok) {
      const errorText = await authResponse.text();
      console.error('❌ Auth failed:', authResponse.status, errorText);
      process.exit(1);
    }
    
    const authData = await authResponse.json();
    const accessToken = authData.access_token;
    
    console.log(`✅ Got token: ${accessToken.slice(0, 15)}...`);
    
    // Step 2: Upload using the correct /v1/app endpoint
    console.log('📤 Uploading to VoltBuilder...');
    
    const form = new FormData();
    form.append('app', fs.createReadStream(ZIP_FILE), {
      filename: ZIP_FILE,
      contentType: 'application/zip'
    });
    form.append('platform', 'android');
    
    const uploadResponse = await fetch('https://api.volt.build/v1/app', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        ...form.getHeaders()
      },
      body: form
    });
    
    const responseText = await uploadResponse.text();
    
    if (uploadResponse.ok || uploadResponse.status === 202) {
      console.log('✅ Upload successful!');
      try {
        const data = JSON.parse(responseText);
        console.log('\n📋 Build Details:');
        console.log('  Build ID:', data.id || data.buildId || 'Unknown');
        console.log('  Status:', data.status || 'Queued');
        console.log('  Platform: Android v141');
        
        const buildId = data.id || data.buildId;
        if (buildId) {
          console.log('\n🔗 Check build at: https://volt.build/app/' + buildId);
        }
      } catch {
        console.log('Response:', responseText);
      }
    } else {
      console.error(`❌ Upload failed: ${uploadResponse.status}`);
      console.error('Response:', responseText);
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

uploadToVoltBuilder();
