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
export async function sendCodeSMS(phoneNumber: string, code?: string): Promise<SMSResult> {
  let cleanPhone = phoneNumber.replace(/[^\d+]/g, '');
  
  // Add +1 if it's a US number without country code
  console.log('📱 Original phone:', phoneNumber);
  console.log('📱 Cleaned phone:', cleanPhone);
  
  if (!cleanPhone.startsWith('+') && cleanPhone.length === 10) {
    cleanPhone = '+1' + cleanPhone;
    console.log('📱 Added +1 prefix for 10-digit number:', cleanPhone);
  } else if (cleanPhone.startsWith('1') && cleanPhone.length === 11) {
    cleanPhone = '+' + cleanPhone;
    console.log('📱 Added + prefix for 11-digit number:', cleanPhone);
  }
  
  console.log('📱 Final formatted phone:', cleanPhone);

  try {
    // Handle test numbers only (allow real numbers to use Twilio even in dev)
    if (/^\+1555/.test(cleanPhone)) {
      console.log('📱 Using development mode for test number:', cleanPhone);
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

    if (!twilioClient || !process.env.TWILIO_VERIFY_SERVICE_SID) {
      console.log('📱 SMS Code Development Mode:', { phone: cleanPhone, code });
      const devCode = code || generateVerificationCode();
      console.log('='.repeat(50));
      console.log(`📱 SMS TO: ${cleanPhone}`);
      console.log(`🔐 CODE: ${devCode}`);
      console.log('='.repeat(50));
      
      return { 
        success: true, // Return success in dev mode
        messageId: 'dev-mode-' + Date.now(),
        devMode: true,
        backupCode: devCode,
        verificationSid: 'dev-mode-' + Date.now()
      };
    }
    
    console.log('📱 Sending Twilio Verify SMS to:', cleanPhone);
    
    // Use Twilio Verify (works immediately, no A2P registration needed)
    const verification = await twilioClient.verify.v2
      .services(process.env.TWILIO_VERIFY_SERVICE_SID)
      .verifications
      .create({
        to: cleanPhone,
        channel: 'sms'
      });
    
    console.log('✅ Verification code SMS sent via Twilio Verify:', { 
      phone: cleanPhone, 
      verificationSid: verification.sid,
      status: verification.status
    });
    
    return { 
      success: true, 
      messageId: verification.sid,
      verificationSid: verification.sid
    };
  } catch (error: any) {
    console.error('❌ Failed to send verification code SMS:', error);
    const fallbackCode = code || generateVerificationCode();
    return { 
      success: false, 
      error: error.message || 'Failed to send SMS',
      devMode: true,
      backupCode: fallbackCode
    };
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
        verificationSid: verificationSid
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
      verificationSid: verificationSid,
      cleanCode: cleanCode,
      timestamp: new Date().toISOString()
    });
    
    // Handle specific Twilio errors
    if (error.status === 404) {
      console.error('❌ VERIFY 404: Verification request not found for sid:', verificationSid);
      return { 
        success: false, 
        error: 'No verification request found. Please request a new code.',
        details: { status: 404, verificationSid }
      };
    }
    
    if (error.code === 20404) {
      console.error('❌ VERIFY 20404: Verification resource not found');
      return { 
        success: false, 
        error: 'Verification expired or not found. Please request a new code.',
        details: { code: 20404, verificationSid }
      };
    }
    
    return { 
      success: false, 
      error: error.message || 'Failed to verify code',
      details: { 
        errorCode: error.code,
        errorStatus: error.status,
        verificationSid 
      }
    };
  }
}