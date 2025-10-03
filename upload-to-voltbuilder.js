#!/usr/bin/env node

import FormData from 'form-data';
import fs from 'fs';
import fetch from 'node-fetch';
import path from 'path';

// VoltBuilder upload configuration
const VOLTBUILDER_UPLOAD_URL = 'https://api.volt.build/app';
const ZIP_FILE = 'gabai-v87-enhanced.zip';

async function uploadToVoltBuilder() {
  console.log('🚀 Starting VoltBuilder upload...');
  
  // Check if zip file exists
  if (!fs.existsSync(ZIP_FILE)) {
    console.error(`❌ Error: ${ZIP_FILE} not found`);
    process.exit(1);
  }
  
  const fileSize = fs.statSync(ZIP_FILE).size;
  console.log(`📦 Found ${ZIP_FILE} (${(fileSize / 1024 / 1024).toFixed(2)} MB)`);
  
  // Check for credentials
  const email = process.env.VOLTBUILDER_EMAIL;
  const password = process.env.VOLTBUILDER_PASSWORD;
  
  if (!email || !password) {
    console.error('❌ VoltBuilder credentials not found in environment variables');
    console.log('Please set VOLTBUILDER_EMAIL and VOLTBUILDER_PASSWORD');
    process.exit(1);
  }
  
  try {
    // Create form data
    const form = new FormData();
    form.append('file', fs.createReadStream(ZIP_FILE));
    form.append('email', email);
    form.append('password', password);
    form.append('platform', 'android');
    form.append('debug', 'false');
    
    console.log('📤 Uploading to VoltBuilder...');
    
    // Upload to VoltBuilder
    const response = await fetch(VOLTBUILDER_UPLOAD_URL, {
      method: 'POST',
      body: form,
      headers: form.getHeaders()
    });
    
    const responseText = await response.text();
    
    if (response.ok) {
      console.log('✅ Upload successful!');
      try {
        const data = JSON.parse(responseText);
        console.log('Build ID:', data.id);
        console.log('Status:', data.status);
        console.log('Check build status at: https://volt.build/app/' + data.id);
      } catch {
        console.log('Response:', responseText);
      }
    } else {
      console.error('❌ Upload failed:', response.status, response.statusText);
      console.error('Response:', responseText);
    }
  } catch (error) {
    console.error('❌ Error uploading to VoltBuilder:', error);
  }
}

// Run the upload
uploadToVoltBuilder();