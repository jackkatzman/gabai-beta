// Initialize Twilio client if credentials are available
export let twilioClient: any = null;

// Import profanity filtering
import { censorText } from './profanity';

// Initialize on startup
(async () => {
  try {
    // Check for Twilio credentials
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const verifyServiceSid = process.env.TWILIO_VERIFY_SERVICE_SID;
    
    console.log('🔍 Twilio Environment Check:', {
      accountSid: accountSid ? 'Present' : 'Missing',
      authToken: authToken ? 'Present' : 'Missing',
      verifyServiceSid: verifyServiceSid ? 'Present' : 'Missing'
    });
    
    if (accountSid && authToken) {
      // Import and initialize Twilio client
      const { default: twilio } = await import('twilio');
      twilioClient = twilio(accountSid, authToken);
      
      console.log('📱 Twilio client initialized successfully');
      
      if (verifyServiceSid) {
        console.log('✅ Twilio Verify service available:', verifyServiceSid.substring(0, 8) + '...');
      }
      
      if (process.env.TWILIO_PHONE_NUMBER) {
        console.log('✅ Twilio phone number configured:', process.env.TWILIO_PHONE_NUMBER.substring(0, 5) + '...');
      } else {
        console.log('⚠️  No Twilio phone number configured - reminder SMS will fail');
      }
    } else {
      console.log('📱 Twilio credentials not found - SMS will use development mode');
    }
  } catch (error) {
    console.error('❌ Failed to initialize Twilio:', error);
  }
})();

export interface SMSResult {
  success: boolean;
  messageId?: string;
  error?: string;
  devMode?: boolean;
  magicLink?: string;
  backupCode?: string;
  verificationSid?: string;
}

export async function sendMagicLinkSMS(
  phoneNumber: string, 
  token: string, 
  deviceInfo?: string,
  requestHost?: string
): Promise<SMSResult> {
  // Use standardized phone normalization
  const cleanPhone = normalizePhoneNumber(phoneNumber);
  
  // Generate magic link - Use gabai.ai for production
  let baseUrl: string;
  
  // Always use gabai.ai for production, regardless of request host
  if (process.env.NODE_ENV === 'production' || (requestHost && !requestHost.includes('localhost') && !requestHost.includes('replit'))) {
    baseUrl = 'https://gabai.ai';
  } else if (requestHost && !requestHost.includes('localhost')) {
    baseUrl = `https://${requestHost}`;
  } else {
    baseUrl = `http://localhost:${process.env.PORT || 5000}`;
  }
  
  const magicLink = `${baseUrl}/api/auth/magic-link?token=${token}&mobile=true&sms=true`;
  const codeOnly = token.slice(-6).toUpperCase(); // Last 6 characters as backup code
  
  // Filter the SMS content for profanity (though this one should be clean)
  const smsContent = censorText(`🔐 GabAi Sign-in

Tap this link to sign in:
${magicLink}

Or enter code: ${codeOnly}

Expires in 15 minutes.`, 'magic-link-sms');

  try {
    // Check if Twilio client is available
    if (!twilioClient) {
      console.log('🛠️ Using development mode - No Twilio configuration');
      
      // Development mode: Log the SMS content
      console.log('\n' + '📱'.repeat(60));
      console.log('⚠️  SMS SEND FAILED - Development Mode');
      console.log('📱'.repeat(60));
      console.log('📞 Phone Number:', cleanPhone);
      console.log('💬 SMS Content:');
      console.log(smsContent);
      console.log('🔗 Magic Link:', magicLink);
      console.log('🔑 Backup Code:', codeOnly);
      console.log('📱'.repeat(60) + '\n');
      
      return { 
        success: false, 
        error: 'SMS service not configured - check console for development link',
        devMode: true,
        magicLink,
        backupCode: codeOnly
      };
    }
    
    // Send SMS via Twilio
    console.log('📱 Sending Twilio SMS:', { to: cleanPhone });
    
    // Use the configured Twilio phone number
    const fromNumber = process.env.TWILIO_PHONE_NUMBER;
    if (!fromNumber) {
      throw new Error('TWILIO_PHONE_NUMBER environment variable not set');
    }
    console.log('📱 Using Twilio number:', fromNumber);
    
    const message = await twilioClient.messages.create({
      body: smsContent,
      from: fromNumber,
      to: cleanPhone
    });
    
    console.log('✅ Magic link SMS sent via Twilio:', { 
      phone: cleanPhone, 
      messageId: message.sid,
      status: message.status
    });
    
    return { success: true, messageId: message.sid };
  } catch (error: any) {
    console.error('❌ Failed to send magic link SMS:', error);
    
    // Fallback: Log the SMS content for debugging
    console.log('\n' + '📱'.repeat(60));
    console.log('⚠️  SMS SEND FAILED - Fallback Mode');
    console.log('📱'.repeat(60));
    console.log('📞 Phone Number:', cleanPhone);
    console.log('💬 SMS Content:');
    console.log(smsContent);
    console.log('🔗 Magic Link:', magicLink);
    console.log('🔑 Backup Code:', codeOnly);
    console.log('📱'.repeat(60) + '\n');
    
    return { 
      success: false, 
      error: error.message || 'Failed to send SMS',
      devMode: true,
      magicLink,
      backupCode: codeOnly
    };
  }
}

// Function to generate a random 6-digit verification code
export function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Function to send reminder SMS for tasks/alarms
export async function sendReminderSMS(phoneNumber: string, title: string, description?: string): Promise<SMSResult> {
  let cleanPhone = phoneNumber.replace(/[^\d+]/g, '');
  
  // Add +1 if it's a US number without country code
  if (!cleanPhone.startsWith('+') && cleanPhone.length === 10) {
    cleanPhone = '+1' + cleanPhone;
  } else if (cleanPhone.startsWith('1') && cleanPhone.length === 11) {
    cleanPhone = '+' + cleanPhone;
  }
  
  // CRITICAL: Filter user-generated content for profanity (mandatory)
  const cleanTitle = censorText(title, 'sms-reminder-title');
  const cleanDescription = description ? censorText(description, 'sms-reminder-desc') : undefined;
  
  // Simplified message format that works better with carriers (using filtered content)
  const smsContent = `GabAi: ${cleanTitle}${cleanDescription ? ' - ' + cleanDescription : ''}. Reply STOP to unsubscribe.`;

  try {
    if (!twilioClient) {
      console.log('📱 Reminder SMS Development Mode:', { phone: cleanPhone, title });
      return { 
        success: true,
        messageId: 'reminder-dev-' + Date.now(),
        devMode: true
      };
    }
    
    // For reminders, we'll use regular SMS first, then Verify as fallback
    // Skip Twilio Verify for now since it doesn't support custom messages
    
    console.log('📱 Sending reminder SMS (regular):', { phone: cleanPhone, title });
    
    // Use the configured Twilio phone number
    const fromNumber = process.env.TWILIO_PHONE_NUMBER;
    if (!fromNumber) {
      throw new Error('TWILIO_PHONE_NUMBER environment variable not set');
    }
    console.log('📱 Using Twilio number:', fromNumber);
    
    const message = await twilioClient.messages.create({
      body: smsContent,
      from: fromNumber,
      to: cleanPhone
    });
    
    console.log('✅ Reminder SMS sent via Twilio:', { 
      phone: cleanPhone, 
      messageId: message.sid,
      status: message.status,
      errorCode: message.errorCode,
      errorMessage: message.errorMessage,
      price: message.price,
      title 
    });
    
    // Check for delivery status
    if (message.status === 'failed' || message.errorCode) {
      console.error('⚠️ SMS may have failed:', {
        status: message.status,
        errorCode: message.errorCode,
        errorMessage: message.errorMessage
      });
    }
    
    return { success: true, messageId: message.sid };
  } catch (error: any) {
    console.error('❌ Failed to send reminder SMS:', {
      message: error.message,
      code: error.code,
      moreInfo: error.moreInfo,
      details: error.details
    });
    
    // Common Twilio error codes
    if (error.code === 21211) {
      console.error('📱 Invalid phone number format. Number should be in E.164 format: +1XXXXXXXXXX');
    } else if (error.code === 21608) {
      console.error('📱 The phone number is not verified. In trial mode, you can only send to verified numbers.');
      console.error('📱 Please verify this number in your Twilio console: https://console.twilio.com/us1/develop/phone-numbers/manage/verified');
    } else if (error.code === 21610) {
      console.error('📱 The recipient has opted out of receiving SMS from this number.');
    } else if (error.code === 21614) {
      console.error('📱 "To" number is not a valid mobile number or is not SMS-capable.');
    }
    
    return { 
      success: false, 
      error: error.message || 'Failed to send reminder SMS',
      devMode: true
    };
  }
}

// Updated function to send custom verification SMS with Twilio
// Add optional channel parameter for voice fallback (ChatGPT recommended)
export async function sendCodeSMS(phoneNumber: string, code?: string, channel: 'sms' | 'call' = 'sms'): Promise<SMSResult> {
  console.log('\n🚀🚀🚀 sendCodeSMS STARTED 🚀🚀🚀');
  console.log('🚀 Input phoneNumber:', phoneNumber);
  console.log('🚀 Input code:', code);
  
  let cleanPhone = phoneNumber.replace(/[^\d+]/g, '');
  
  // Add +1 if it's a US number without country code
  console.log('📱 Original phone:', phoneNumber);
  console.log('📱 Cleaned phone (removed non-digits except +):', cleanPhone);
  
  if (!cleanPhone.startsWith('+') && cleanPhone.length === 10) {
    cleanPhone = '+1' + cleanPhone;
    console.log('📱 Added +1 prefix for 10-digit US number:', cleanPhone);
  } else if (cleanPhone.startsWith('1') && cleanPhone.length === 11) {
    cleanPhone = '+' + cleanPhone;
    console.log('📱 Added + prefix for 11-digit number starting with 1:', cleanPhone);
  } else if (cleanPhone.startsWith('+')) {
    console.log('📱 Phone already has + prefix:', cleanPhone);
  } else {
    console.log('⚠️  Unusual phone format, keeping as is:', cleanPhone);
  }
  
  console.log('📱 Final formatted phone for Twilio:', cleanPhone);

  try {
    // Check Twilio configuration
    console.log('🔍 Checking Twilio configuration...');
    console.log('🔍 twilioClient available:', !!twilioClient);
    console.log('🔍 TWILIO_ACCOUNT_SID:', process.env.TWILIO_ACCOUNT_SID ? 'Present' : 'Missing');
    console.log('🔍 TWILIO_AUTH_TOKEN:', process.env.TWILIO_AUTH_TOKEN ? 'Present' : 'Missing');
    console.log('🔍 TWILIO_VERIFY_SERVICE_SID:', process.env.TWILIO_VERIFY_SERVICE_SID ? 'Present' : 'Missing');
    console.log('🔍 TWILIO_PHONE_NUMBER:', process.env.TWILIO_PHONE_NUMBER ? 'Present' : 'Missing');
    
    // Handle test numbers only (allow real numbers to use Twilio even in dev)
    if (/^\+1555/.test(cleanPhone)) {
      console.log('📱 Detected test number (555), using development mode:', cleanPhone);
      const devCode = code || generateVerificationCode();
      console.log('='.repeat(50));
      console.log(`📱 SMS TO: ${cleanPhone}`);
      console.log(`🔐 CODE: ${devCode}`);
      console.log('='.repeat(50));
      
      return { 
        success: true,
        messageId: 'dev-mode-' + Date.now(),
        devMode: true,
        backupCode: devCode,
        verificationSid: 'dev-mode-' + Date.now()
      };
    }

    if (!twilioClient) {
      console.log('⚠️  Twilio client not initialized - using Development Mode');
      console.log('📱 SMS Code Development Mode:', { phone: cleanPhone, code });
      const devCode = code || generateVerificationCode();
      console.log('\n' + '='.repeat(60));
      console.log('🎯 DEVELOPMENT MODE - SMS SIMULATION');
      console.log('='.repeat(60));
      console.log(`📱 SMS TO: ${cleanPhone}`);
      console.log(`🔐 VERIFICATION CODE: ${devCode}`);
      console.log('='.repeat(60) + '\n');
      
      console.log('🚀 Returning development mode result');
      console.log('🚀🚀🚀 sendCodeSMS COMPLETED (dev mode) 🚀🚀🚀\n');
      return { 
        success: true, // Return success in dev mode
        messageId: 'dev-mode-' + Date.now(),
        devMode: true,
        backupCode: devCode,
        verificationSid: 'dev-mode-' + Date.now()
      };
    }
    
    // Check if we should use regular SMS instead of Verify (for better delivery)
    // Allow SMS_ALLOW_LEGACY to work in production for better carrier compatibility
    const useRegularSMS = process.env.SMS_ALLOW_LEGACY === '1' || process.env.SMS_ALLOW_LEGACY === 'true';
    const verificationCode = code || generateVerificationCode();
    console.log('🔧 SMS Configuration:');
    console.log('  - Environment:', process.env.NODE_ENV);
    console.log('  - Use regular SMS:', useRegularSMS);
    console.log('  - Generated code:', verificationCode);
    console.log('  - SMS_ALLOW_LEGACY:', process.env.SMS_ALLOW_LEGACY);
    console.log('  - Force Verify in production:', isProduction);
    
    if (useRegularSMS || !process.env.TWILIO_VERIFY_SERVICE_SID) {
      // Use regular Twilio SMS (may have better delivery for some carriers)
      console.log('📱 Using REGULAR Twilio SMS (not Verify) for:', cleanPhone);
      console.log('📱 Reason:', !process.env.TWILIO_VERIFY_SERVICE_SID ? 'No Verify Service SID' : 'Legacy mode enabled');
      
      const fromNumber = process.env.TWILIO_PHONE_NUMBER;
      if (!fromNumber) {
        console.error('❌ TWILIO_PHONE_NUMBER environment variable is missing!');
        throw new Error('TWILIO_PHONE_NUMBER not configured');
      }
      
      console.log('📨 Sending SMS via Twilio messages API...');
      console.log('  - From:', fromNumber);
      console.log('  - To:', cleanPhone);
      console.log('  - Message body:', `Your GabAi verification code is: ${verificationCode}. Valid for 10 minutes.`);
      
      const message = await twilioClient.messages.create({
        body: `Your GabAi verification code is: ${verificationCode}. Valid for 10 minutes.`,
        from: fromNumber,
        to: cleanPhone
      });
      
      console.log('✅ Regular SMS sent successfully via Twilio!');
      console.log('📨 Message details:', {
        phone: cleanPhone,
        messageId: message.sid,
        status: message.status,
        code: verificationCode,
        errorCode: message.errorCode,
        errorMessage: message.errorMessage,
        dateCreated: message.dateCreated,
        price: message.price
      });
      
      console.log('🚀 Returning success result with messageId:', message.sid);
      console.log('🚀🚀🚀 sendCodeSMS COMPLETED (regular SMS) 🚀🚀🚀\n');
      return {
        success: true,
        messageId: message.sid,
        verificationSid: message.sid,
        backupCode: verificationCode
      };
    }
    
    console.log('📱 Using Twilio VERIFY service');
    console.log('📱 Sending Twilio Verify', channel === 'call' ? 'VOICE CALL' : 'SMS', 'to:', cleanPhone);
    console.log('📱 Verify Service SID:', process.env.TWILIO_VERIFY_SERVICE_SID?.substring(0, 10) + '...');
    console.log('📨 Creating Twilio Verify verification...');
    
    // Use Twilio Verify (works immediately, no A2P registration needed)
    // Support voice fallback for stubborn carriers (ChatGPT recommended)
    const verification = await twilioClient.verify.v2
      .services(process.env.TWILIO_VERIFY_SERVICE_SID)
      .verifications
      .create({
        to: cleanPhone,
        channel: channel  // Can be 'sms' or 'call' for voice fallback
      });
    
    console.log('✅ Twilio Verify SMS sent successfully!');
    console.log('📨 Verification details:', { 
      phone: cleanPhone, 
      verificationSid: verification.sid,
      status: verification.status,
      sendCodeAttempts: verification.sendCodeAttempts,
      dateCreated: verification.dateCreated,
      valid: verification.valid
    });
    
    // Check if this is a trial account issue
    if (verification.status === 'pending') {
      console.log('\n⚠️  SMS sent but status is pending. If you\'re not receiving the SMS:');
      console.log('   1. For TRIAL accounts: Verify your phone number at:');
      console.log('      https://console.twilio.com/us1/develop/phone-numbers/manage/verified');
      console.log('   2. Make sure your phone can receive SMS from the US');
      console.log('   3. Check if the number is in the correct format: +1XXXXXXXXXX\n');
    }
    
    console.log('🚀 Returning success result with verificationSid:', verification.sid);
    console.log('🚀🚀🚀 sendCodeSMS COMPLETED (Verify service) 🚀🚀🚀\n');
    return { 
      success: true, 
      messageId: verification.sid,
      verificationSid: verification.sid
    };
  } catch (error: any) {
    console.error('\n🚨🚨🚨 SMS SEND ERROR 🚨🚨🚨');
    console.error('❌ Failed to send verification code SMS:');
    console.error('  - Error message:', error.message);
    console.error('  - Error code:', error.code);
    console.error('  - More info:', error.moreInfo);
    console.error('  - Details:', error.details);
    console.error('  - Stack:', error.stack);
    
    // Provide specific error guidance
    if (error.code === 60200) {
      console.error('\n📱 INVALID PHONE NUMBER: The number is not valid or not SMS-capable');
      console.error('   Make sure the number is in E.164 format: +1XXXXXXXXXX\n');
    } else if (error.code === 60203) {
      console.error('\n📱 MAX SEND ATTEMPTS REACHED: Too many attempts to this number');
      console.error('   Wait a few minutes before trying again\n');
    } else if (error.code === 20404) {
      console.error('\n📱 VERIFY SERVICE NOT FOUND: Check your TWILIO_VERIFY_SERVICE_SID');
      console.error('   Create a Verify Service at: https://console.twilio.com/us1/develop/verify/services\n');
    } else if (error.status === 429) {
      console.error('\n📱 RATE LIMIT: Too many requests. Wait before trying again.\n');
    } else if (error.message && error.message.includes('not verified')) {
      console.error('\n📱 PHONE NOT VERIFIED IN TRIAL ACCOUNT:');
      console.error('   1. Go to: https://console.twilio.com/us1/develop/phone-numbers/manage/verified');
      console.error('   2. Add and verify your phone number');
      console.error('   3. Try sending the SMS again\n');
    }
    
    const fallbackCode = code || generateVerificationCode();
    const result = { 
      success: false, 
      error: error.message || 'Failed to send SMS',
      devMode: true,
      backupCode: fallbackCode
    };
    console.log('🚀 Returning error result:', result);
    console.log('🚀🚀🚀 sendCodeSMS COMPLETED (with error) 🚀🚀🚀\n');
    return result;
  }
}

// Function to make voice reminder call
export async function makeReminderCall(phoneNumber: string, title: string, description?: string): Promise<SMSResult> {
  let cleanPhone = phoneNumber.replace(/[^\d+]/g, '');
  
  // Add +1 if it's a US number without country code
  if (!cleanPhone.startsWith('+') && cleanPhone.length === 10) {
    cleanPhone = '+1' + cleanPhone;
  } else if (cleanPhone.startsWith('1') && cleanPhone.length === 11) {
    cleanPhone = '+' + cleanPhone;
  }
  
  // CRITICAL: Filter user-generated content for profanity (mandatory)
  const cleanTitle = censorText(title, 'voice-reminder-title');
  const cleanDescription = description ? censorText(description, 'voice-reminder-desc') : '';
  
  // Create reminder message for voice (using filtered content)
  const message = `Hello! This is your reminder from GabAi. ${cleanTitle}. ${cleanDescription}`;
  
  try {
    if (!twilioClient) {
      console.log('📞 Voice Call Development Mode:', { phone: cleanPhone, title });
      return { 
        success: true,
        messageId: 'voice-dev-' + Date.now(),
        devMode: true
      };
    }
    
    console.log('📞 Making reminder voice call:', { phone: cleanPhone, title });
    
    // Use the configured Twilio phone number
    const fromNumber = process.env.TWILIO_PHONE_NUMBER;
    if (!fromNumber) {
      throw new Error('TWILIO_PHONE_NUMBER environment variable not set');
    }
    
    // Get the base URL for the TwiML webhook
    // Use local server in development for testing, production URL when deployed
    const baseUrl = process.env.NODE_ENV === 'production'
      ? 'https://gabai.ai'
      : process.env.REPLIT_DEV_DOMAIN 
        ? `https://${process.env.REPLIT_DEV_DOMAIN}`
        : `http://localhost:5000`;
    
    // Create URL-encoded message for TwiML endpoint
    const encodedMessage = encodeURIComponent(message);
    const twimlUrl = `${baseUrl}/api/webhooks/twilio/voice?message=${encodedMessage}`;
    
    console.log('📞 TwiML URL:', twimlUrl);
    
    // Make the voice call
    const call = await twilioClient.calls.create({
      from: fromNumber,
      to: cleanPhone,
      url: twimlUrl,
      method: 'GET',
      machineDetection: 'DetectMessageEnd', // Wait for answering machine to finish
      machineDetectionTimeout: 10
    });
    
    console.log('✅ Voice call initiated via Twilio:', { 
      phone: cleanPhone, 
      callSid: call.sid,
      status: call.status,
      title 
    });
    
    return { success: true, messageId: call.sid };
  } catch (error: any) {
    console.error('❌ Failed to make reminder call:', {
      message: error.message,
      code: error.code,
      moreInfo: error.moreInfo
    });
    
    return { 
      success: false, 
      error: error.message || 'Failed to make reminder call',
      devMode: true
    };
  }
}

// Standardized phone number normalization function
export function normalizePhoneNumber(phoneNumber: string): string {
  // Remove all non-digits
  let cleanPhone = phoneNumber.replace(/\D/g, '');
  
  console.log('📱 Normalizing phone:', phoneNumber, '->', cleanPhone);
  
  // Add +1 if it's a US number without country code
  if (cleanPhone.length === 10) {
    cleanPhone = '+1' + cleanPhone;
  } else if (cleanPhone.startsWith('1') && cleanPhone.length === 11) {
    cleanPhone = '+' + cleanPhone;
  } else if (!cleanPhone.startsWith('+')) {
    // For international numbers, add + if missing
    cleanPhone = '+' + cleanPhone;
  }
  
  console.log('📱 Normalized to E.164:', cleanPhone);
  return cleanPhone;
}

// BACKWARD COMPATIBILITY: Verify by phone number for cached frontends
export async function verifyCodeByPhone(phoneNumber: string, code: string): Promise<{ success: boolean; error?: string }> {
  // Normalize phone number
  const cleanPhone = normalizePhoneNumber(phoneNumber);
  const cleanCode = code.replace(/\D/g, '').trim();
  
  console.log('📱 FALLBACK: Verifying by phone number:', { phone: cleanPhone, code: cleanCode });
  
  try {
    if (!twilioClient || !process.env.TWILIO_VERIFY_SERVICE_SID) {
      console.log('📱 Development mode - accepting any 6-digit code');
      if (/^\d{6}$/.test(cleanCode)) {
        return { success: true };
      }
      return { success: false, error: 'Invalid code format' };
    }
    
    // Use Twilio Verify to check by phone number (legacy method)
    const verificationCheck = await twilioClient.verify.v2
      .services(process.env.TWILIO_VERIFY_SERVICE_SID)
      .verificationChecks
      .create({
        to: cleanPhone,
        code: cleanCode
      });
    
    console.log('✅ Phone verification result:', verificationCheck.status);
    
    if (verificationCheck.status === 'approved') {
      return { success: true };
    } else {
      return { 
        success: false, 
        error: 'Invalid or expired verification code'
      };
    }
  } catch (error: any) {
    console.error('❌ Phone verification failed:', error.message);
    return { 
      success: false, 
      error: error.message || 'Verification failed' 
    };
  }
}

// Function to verify code using Twilio Verify - requires phone number
export async function verifyCodeSMS(phoneOrSid: string, code: string): Promise<{ success: boolean; error?: string; details?: any }> {
  // Clean code - digits only, trimmed
  const cleanCode = code.replace(/\D/g, '').trim();
  
  console.log('📱 VERIFY START: Verifying code:', { 
    phoneOrSid, 
    phoneLength: phoneOrSid?.length,
    phonePrefix: phoneOrSid?.substring(0, 10),
    originalCode: code, 
    cleanCode,
    cleanCodeLength: cleanCode.length,
    timestamp: new Date().toISOString()
  });

  try {
    if (!twilioClient || !process.env.TWILIO_VERIFY_SERVICE_SID) {
      console.log('📱 Code verification development mode - accepting any 6-digit code');
      
      // In development mode, accept any 6-digit code
      if (/^\d{6}$/.test(cleanCode)) {
        console.log('✅ Development mode - code accepted:', cleanCode);
        return { success: true };
      } else {
        return { success: false, error: 'Invalid code format - must be 6 digits' };
      }
    }
    
    // Use Twilio Verify to check the verification code with phone number
    console.log('📱 VERIFY: Calling Twilio API with:', {
      serviceSid: process.env.TWILIO_VERIFY_SERVICE_SID?.substring(0, 10) + '...',
      phoneOrSid: phoneOrSid,
      code: cleanCode
    });
    
    const verificationCheck = await twilioClient.verify.v2
      .services(process.env.TWILIO_VERIFY_SERVICE_SID)
      .verificationChecks
      .create({
        to: phoneOrSid,  // Phone number in E.164 format
        code: cleanCode
      });
    
    console.log('📱 VERIFY RESULT: Twilio verification response:', {
      phoneOrSid,
      status: verificationCheck.status,
      valid: verificationCheck.valid,
      dateCreated: verificationCheck.dateCreated,
      dateUpdated: verificationCheck.dateUpdated,
      sid: verificationCheck.sid,
      serviceSid: verificationCheck.serviceSid,
      accountSid: verificationCheck.accountSid?.substring(0, 10) + '...',
      timestamp: new Date().toISOString()
    });
    
    if (verificationCheck.status === 'approved') {
      console.log('✅ VERIFY SUCCESS: Code verified successfully via Twilio Verify');
      return { success: true };
    } else {
      console.log('❌ VERIFY FAILED: Code verification failed via Twilio Verify:', {
        status: verificationCheck.status,
        valid: verificationCheck.valid,
        phoneOrSid: phoneOrSid
      });
      return { 
        success: false, 
        error: `Verification failed: ${verificationCheck.status}`,
        details: { status: verificationCheck.status, valid: verificationCheck.valid }
      };
    }
  } catch (error: any) {
    console.error('❌ VERIFY ERROR: Failed to verify code:', {
      message: error.message,
      status: error.status,
      code: error.code,
      moreInfo: error.moreInfo,
      details: error.details,
      phoneOrSid: phoneOrSid,
      cleanCode: cleanCode,
      timestamp: new Date().toISOString()
    });
    
    // Handle specific Twilio errors
    if (error.status === 404) {
      console.error('❌ VERIFY 404: Verification request not found for phone:', phoneOrSid);
      return { 
        success: false, 
        error: 'No verification request found. Please request a new code.',
        details: { status: 404, phoneOrSid }
      };
    }
    
    if (error.code === 20404) {
      console.error('❌ VERIFY 20404: Verification resource not found');
      return { 
        success: false, 
        error: 'Verification expired or not found. Please request a new code.',
        details: { code: 20404, phoneOrSid }
      };
    }
    
    return { 
      success: false, 
      error: error.message || 'Failed to verify code',
      details: { 
        errorCode: error.code,
        errorStatus: error.status,
        phoneOrSid 
      }
    };
  }
}