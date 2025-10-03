#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const FormData = require('form-data');

// VoltBuilder API credentials from environment
const API_CREDENTIALS = process.env.VOLT_PASSWORD;
if (!API_CREDENTIALS) {
  console.error('❌ VOLT_PASSWORD environment variable not set');
  process.exit(1);
}

const [CLIENT_ID, CLIENT_SECRET] = API_CREDENTIALS.split(':');
const ZIP_FILE = 'gabai-v87-enhanced.zip';

async function getAuthToken() {
  console.log('🔑 Getting authentication token from VoltBuilder...');
  
  const authUrl = 'https://api.volt.build/v1/auth';
  const authData = new URLSearchParams({
    grant_type: 'client_credentials',
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET
  });
  
  try {
    const response = await fetch(authUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: authData.toString()
    });
    
    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Auth failed: ${response.status} - ${text}`);
    }
    
    const data = await response.json();
    console.log('✅ Authentication successful');
    return data.access_token;
  } catch (error) {
    console.error('❌ Authentication failed:', error.message);
    throw error;
  }
}

async function uploadToVoltBuilder(token) {
  console.log(`📦 Uploading ${ZIP_FILE} to VoltBuilder...`);
  
  if (!fs.existsSync(ZIP_FILE)) {
    console.error(`❌ File not found: ${ZIP_FILE}`);
    process.exit(1);
  }
  
  const fileSize = fs.statSync(ZIP_FILE).size;
  console.log(`📊 File size: ${(fileSize / 1024 / 1024).toFixed(2)} MB`);
  
  const form = new FormData();
  form.append('platform', 'android');
  form.append('app', fs.createReadStream(ZIP_FILE), {
    filename: ZIP_FILE,
    contentType: 'application/zip'
  });
  
  // Add voltbuilder.json configuration
  const voltConfig = {
    androidKeystorePassword: process.env.VOLT_PASSWORD.split(':')[1],
    androidKeystoreAlias: "gabai",
    androidKeystoreAliasPassword: process.env.VOLT_PASSWORD.split(':')[1],
    release: "release"
  };
  
  form.append('voltbuilder.json', JSON.stringify(voltConfig), {
    filename: 'voltbuilder.json',
    contentType: 'application/json'
  });
  
  try {
    const response = await fetch('https://api.volt.build/v1/app', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        ...form.getHeaders()
      },
      body: form
    });
    
    const responseText = await response.text();
    
    if (response.ok || response.status === 202) {
      console.log('✅ Upload successful!');
      try {
        const data = JSON.parse(responseText);
        console.log('📋 Build Details:');
        console.log('  Build ID:', data.id);
        console.log('  Status:', data.status);
        console.log('  Platform:', data.platform);
        console.log('🔗 Check build progress at:');
        console.log(`  https://volt.build/app/${data.id}`);
        return data.id;
      } catch {
        console.log('Response:', responseText);
      }
    } else {
      console.error('❌ Upload failed:', response.status);
      console.error('Response:', responseText);
      throw new Error(`Upload failed: ${response.status}`);
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  }
}

// Main execution
async function main() {
  console.log('🚀 VoltBuilder APK Upload Script');
  console.log('================================');
  
  try {
    // Step 1: Get auth token
    const token = await getAuthToken();
    
    // Step 2: Upload the APK package
    const buildId = await uploadToVoltBuilder(token);
    
    console.log('\n✨ Done! Your APK is being built.');
    console.log('Check the build status in VoltBuilder dashboard.');
  } catch (error) {
    console.error('\n❌ Process failed:', error.message);
    process.exit(1);
  }
}

// Run the script
main();