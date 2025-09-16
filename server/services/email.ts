import * as postmark from 'postmark';

// Initialize Postmark with API key if available
let postmarkClient: postmark.ServerClient | null = null;
if (process.env.POSTMARK_API_KEY) {
  postmarkClient = new postmark.ServerClient(process.env.POSTMARK_API_KEY);
}

export async function sendMagicLink(email: string, token: string, deviceInfo?: string, requestHost?: string) {
  // Smart domain detection - works for both gabai.ai and replit domains
  let baseUrl;
  
  // Priority: use gabai.ai if in production, otherwise use request host, fallback to replit
  if (process.env.NODE_ENV === 'production') {
    baseUrl = 'https://gabai.ai';
  } else if (requestHost) {
    // Use the host from the request (works for any domain)
    baseUrl = `https://${requestHost}`;
  } else {
    // Fallback to current environment
    const isOnReplit = process.env.REPLIT_DOMAINS || process.env.REPLIT_DEV_DOMAIN;
    if (isOnReplit) {
      const domain = process.env.REPLIT_DOMAINS?.split(',')[0] || 
                    `${process.env.REPL_SLUG}-${process.env.REPL_OWNER}.replit.dev`;
      baseUrl = `https://${domain}`;
    } else {
      baseUrl = `http://localhost:${process.env.PORT || 5000}`;
    }
  }
    
  // Create mobile-friendly magic link that works within the app
  const magicLink = `${baseUrl}/api/auth/magic-link?token=${token}&mobile=true`;
  const codeOnly = token.slice(-6).toUpperCase(); // Last 6 characters as backup code
  
  const emailContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #4285f4;">Welcome to GabAi</h1>
        <p style="color: #666; font-size: 16px;">Your secure sign-in link is ready</p>
      </div>
      
      <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <p style="margin: 0 0 15px 0; font-size: 16px;">Click the button below to sign in:</p>
        <div style="text-align: center;">
          <a href="${magicLink}" 
             style="display: inline-block; background: #4285f4; color: white; padding: 12px 24px; 
                    text-decoration: none; border-radius: 6px; font-weight: bold;">
            Sign In to GabAi
          </a>
        </div>
      </div>
      
      <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 6px; margin: 20px 0;">
        <p style="margin: 0; color: #856404;"><strong>Backup Code:</strong> ${codeOnly}</p>
        <p style="margin: 5px 0 0 0; font-size: 14px; color: #856404;">
          If the link doesn't work, you can enter this code on the sign-in page.
        </p>
      </div>
      
      <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
        <p style="color: #999; font-size: 14px;">
          This link will expire in 15 minutes for security. 
          ${deviceInfo ? `Requested from: ${deviceInfo}` : ''}
        </p>
        <p style="color: #999; font-size: 14px;">
          If you didn't request this, please ignore this email.
        </p>
      </div>
    </div>
  `;

  const emailMessage = {
    From: 'no-reply@symcousa.com',
    To: email,
    Subject: 'Sign in to GabAi',
    TextBody: `
Sign in to GabAi

Click this link to sign in: ${magicLink}

Backup code: ${codeOnly}

This link expires in 15 minutes.
If you didn't request this, please ignore this email.
    `.trim(),
    HtmlBody: emailContent,
  };

  try {
    // Check if Postmark client is available and we have API key
    if (!postmarkClient) { // Use dev mode if no Postmark client
      console.log('🔧 Using development mode - No Postmark API key');
      console.log('📧 Using development mode - magic link will appear in app interface');
      console.log('\n' + '='.repeat(60));
      console.log('📧 DEVELOPMENT MODE - Magic Link Authentication');
      console.log('='.repeat(60));
      console.log('📨 Email To:', email);
      console.log('🔗 Magic Link:', magicLink);
      console.log('🔑 Backup Code:', codeOnly);
      console.log('⏱️  Expires in: 15 minutes');
      console.log('='.repeat(60) + '\n');
      console.log('💡 TIP: Copy the magic link above and paste it in your browser');
      console.log('     Or use the backup code on the login page\n');
      
      return { 
        success: true, 
        messageId: 'dev-mode-' + Date.now(),
        devMode: true,
        magicLink,
        backupCode: codeOnly
      };
    }
    
    const response = await postmarkClient!.sendEmail(emailMessage);
    console.log('✅ Magic link email sent via Postmark:', { 
      email, 
      messageId: response.MessageID,
      to: response.To
    });
    
    return { success: true, messageId: response.MessageID };
  } catch (error: any) {
    console.error('❌ Failed to send magic link email:', error);
    
    // Check for Postmark account pending approval error
    const isPendingApproval = error.message?.includes('pending approval') || 
                             error.message?.includes('same domain');
    
    if (isPendingApproval) {
      console.log('\n' + '🔒'.repeat(60));
      console.log('⚠️  POSTMARK ACCOUNT PENDING APPROVAL');
      console.log('🔒'.repeat(60));
      console.log('📧 Currently can only send to @gabaiapp.com addresses');
      console.log('✅ DKIM is verified and working!');
      console.log('⏳ Once approved, all email addresses will work');
      console.log('🔒'.repeat(60) + '\n');
    }
    
    // Fallback: Log the magic link for debugging
    console.log('\n' + '='.repeat(60));
    console.log('⚠️  EMAIL SEND FAILED - Fallback Mode');
    console.log('='.repeat(60));
    console.log('📨 Email To:', email);
    console.log('🔗 Magic Link:', magicLink);
    console.log('🔑 Backup Code:', codeOnly);
    console.log('='.repeat(60) + '\n');
    
    // Provide detailed error for Postmark issues
    if (error.response) {
      console.error('Postmark Error Details:', error.response.body);
    }
    
    const errorMessage = isPendingApproval 
      ? 'Email account pending approval. Currently can only send to @gabaiapp.com addresses.'
      : error.response?.body?.errors?.[0]?.message || error.message || 'Failed to send email';
    
    return { 
      success: false, 
      error: errorMessage,
      devMode: true,
      magicLink,
      backupCode: codeOnly,
      isPendingApproval
    };
  }
}