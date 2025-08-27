import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Download, Smartphone, UserCheck } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { LogoSpinner } from "@/components/ui/logo-spinner";
import { useState, useEffect } from "react";
import { isNativeMobileApp } from "@/utils/device";
import { addMobileDebugInfo } from "@/utils/mobile-debug";
import { initializeMobileAuth } from "@/utils/mobile-auth-handler";
import { shouldUseMobileBypass } from "@/utils/mobile-bypass-auth";
import { Capacitor } from '@capacitor/core';
import { startCapacitorLogin } from "@/lib/capacitor-auth";
import { setupDeepLinks } from "@/lib/deepLinks";
import { signInWithGoogle } from "@/lib/firebase";
import { useFirebaseAuth } from "@/hooks/useFirebaseAuth";

export default function LoginPage() {
  const { login, devLogin, isLoggingIn, isDevLoggingIn, isLoading } = useAuth();
  const { user: firebaseUser, isLoading: firebaseLoading, error: firebaseError } = useFirebaseAuth();
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [showDevLogin, setShowDevLogin] = useState(false);
  const [devName, setDevName] = useState("");
  const [devEmail, setDevEmail] = useState("");

  // Detect if we're in mobile app environment
  const isMobileApp = shouldUseMobileBypass();

  // All hooks must be called before any early returns
  useEffect(() => {
    // Add mobile debugging and auth handling
    addMobileDebugInfo();
    initializeMobileAuth();

    // Debug mobile detection
    console.log('🔍 LOGIN PAGE: Mobile app detected:', isMobileApp);
    
    // Auto-trigger email authentication for mobile users
    if (isMobileApp) {
      console.log('📱 Mobile app detected - auto-triggering authentication modal');
      // Give the page a moment to load, then trigger the modal
      const timer = setTimeout(() => {
        const signInButton = document.querySelector('[data-testid="button-sign-in-email"]') as HTMLButtonElement;
        if (signInButton) {
          console.log('🎯 Auto-clicking sign-in button for mobile');
          signInButton.click();
        }
      }, 1000);
      
      return () => clearTimeout(timer);
    }
    
    // Only show install prompts for web users, not mobile app users
    if (!isMobileApp) {
      const handler = (e: Event) => {
        e.preventDefault();
        console.log('🎯 PWA install prompt available!');
        setDeferredPrompt(e);
        setShowInstallPrompt(true);
      };

      window.addEventListener('beforeinstallprompt', handler);

      // Show install option for web users after delay
      setTimeout(() => {
        console.log('📱 Showing install option for web users');
        setShowInstallPrompt(true);
      }, 1000);

      return () => window.removeEventListener('beforeinstallprompt', handler);
    } else {
      console.log('📱 Mobile app detected - hiding install prompts');
    }
  }, [isMobileApp]);

  // Initialize safe deep link handling
  useEffect(() => {
    console.log('🔗 Setting up safe deep link handler');
    setupDeepLinks();
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;

      if (outcome === 'accepted') {
        setShowInstallPrompt(false);
      }
      setDeferredPrompt(null);
    } else {
      // Show Android-specific install instructions
      alert('To install GabAi on Android:\n\n1. Chrome: Tap the three dots menu (⋮) → "Add to Home screen"\n2. Edge: Tap the three dots menu → "Apps" → "Install this site as an app"\n3. Samsung Internet: Tap the menu → "Add page to" → "Home screen"\n\nThis will add GabAi as an app icon on your home screen!');
    }
  };

  const handleDevLogin = () => {
    if (devName.trim() && devEmail.trim()) {
      devLogin({ name: devName.trim(), email: devEmail.trim() });
    }
  };

  const handleCapacitorLogin = async () => {
    try {
      console.log('🚀 Starting Capacitor browser login...');
      await startCapacitorLogin();
    } catch (error) {
      console.error('❌ Capacitor login error:', error);
    }
  };

  // Check Firebase auth first
  if (firebaseUser && !isLoading) {
    console.log('✅ Firebase user authenticated, redirecting...');
    window.location.href = firebaseUser.onboardingCompleted ? '/' : '/onboarding';
    return null;
  }

  // Loading state check after all hooks  
  if (isLoading || firebaseLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <LogoSpinner />
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="relative">
              {/* Speech bubble background */}
              <div className="relative w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-3xl flex items-center justify-center shadow-lg">
                {/* Speech bubble tail */}
                <div className="absolute -bottom-2 left-6 w-4 h-4 bg-gradient-to-br from-blue-500 to-blue-600 rotate-45 rounded-sm"></div>

                {/* Checkmark */}
                <svg
                  className="w-8 h-8 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={3}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
            </div>
          </div>
          <div>
            <CardTitle className="text-2xl font-bold">Welcome to GabAi</CardTitle>
            <CardDescription className="text-muted-foreground mt-2">
              {isMobileApp ? (
                <>Welcome to the GabAi mobile app! Sign in to access your voice-first AI assistant</>
              ) : (
                <>Your voice-first smart assistant for managing lists, appointments, and daily tasks</>
              )}
            </CardDescription>
            {isMobileApp && (
              <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100">
                <Smartphone className="w-3 h-3 mr-1" />
                Mobile App
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            data-testid="button-sign-in-email"
            onClick={async () => {
              console.log('🔐 Starting authentication');
              try {
                // Show email authentication modal for all users
                console.log('📧 Starting email authentication flow');
                  
                  // Create custom mobile login form
                  const modal = document.createElement('div');
                  modal.style.cssText = `
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(0,0,0,0.8);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 10000;
                  `;
                  
                  modal.innerHTML = `
                    <div style="
                      background: white;
                      border-radius: 12px;
                      padding: 40px;
                      width: 90%;
                      max-width: 400px;
                      text-align: center;
                      box-shadow: 0 20px 50px rgba(0,0,0,0.5);
                    ">
                      <h2 style="margin: 0 0 20px 0; color: #333;">Welcome to GabAi</h2>
                      <p style="color: #666; margin-bottom: 30px;">Enter your email to continue</p>
                      <input type="email" id="mobile-email" placeholder="Enter your email" style="
                        width: 100%;
                        padding: 15px;
                        border: 2px solid #ddd;
                        border-radius: 8px;
                        font-size: 16px;
                        margin-bottom: 20px;
                        box-sizing: border-box;
                      ">
                      <button id="mobile-submit" style="
                        width: 100%;
                        padding: 15px;
                        background: #4285f4;
                        color: white;
                        border: none;
                        border-radius: 8px;
                        font-size: 16px;
                        cursor: pointer;
                        margin-bottom: 15px;
                      ">Continue</button>
                      <button id="mobile-cancel" style="
                        width: 100%;
                        padding: 10px;
                        background: transparent;
                        color: #666;
                        border: none;
                        font-size: 14px;
                        cursor: pointer;
                      ">Cancel</button>
                    </div>
                  `;
                  
                  document.body.appendChild(modal);
                  
                  const emailInput = modal.querySelector('#mobile-email') as HTMLInputElement;
                  const submitBtn = modal.querySelector('#mobile-submit') as HTMLButtonElement;
                  const cancelBtn = modal.querySelector('#mobile-cancel') as HTMLButtonElement;
                  
                  const cleanup = () => {
                    document.body.removeChild(modal);
                  };
                  
                  cancelBtn.onclick = cleanup;
                  modal.onclick = (e) => {
                    if (e.target === modal) cleanup();
                  };
                  
                  submitBtn.onclick = async () => {
                    const email = emailInput.value.trim();
                    if (!email || !email.includes('@')) {
                      alert('Please enter a valid email address');
                      return;
                    }
                    
                    submitBtn.textContent = 'Sending magic link...';
                    submitBtn.disabled = true;
                    
                    try {
                      const response = await fetch('/api/auth/mobile-login', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ email, name: email.split('@')[0] })
                      });
                      
                      const result = await response.json();
                      
                      if (response.ok && result.success) {
                        console.log('✅ Magic link sent successfully');
                        
                        // Show development mode magic link directly in mobile app for testing
                        const showDevLink = result.devMode && (result.magicLink || result.backupCode);
                        
                        // Update modal to show success message
                        modal.querySelector('div').innerHTML = `
                          <div style="
                            background: white;
                            border-radius: 12px;
                            padding: 40px;
                            width: 90%;
                            max-width: 400px;
                            text-align: center;
                            box-shadow: 0 20px 50px rgba(0,0,0,0.5);
                          ">
                            <div style="margin-bottom: 20px;">
                              <div style="width: 60px; height: 60px; background: #4CAF50; border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center;">
                                <svg width="30" height="30" viewBox="0 0 24 24" fill="white">
                                  <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                                </svg>
                              </div>
                            </div>
                            <h2 style="margin: 0 0 10px 0; color: #333;">${showDevLink ? 'Development Mode' : 'Check Your Email!'}</h2>
                            <p style="color: #666; margin-bottom: 20px;">${showDevLink ? 'Click the link below to sign in:' : 'We\'ve sent a secure sign-in link to:'}</p>
                            <p style="color: #4285f4; font-weight: bold; margin-bottom: 20px;">${email}</p>
                            
                            ${showDevLink ? `
                              <div style="background: #f0f8ff; border: 2px solid #4285f4; border-radius: 8px; padding: 15px; margin: 20px 0;">
                                <p style="margin: 0 0 10px 0; color: #333; font-size: 14px;">Development Magic Link:</p>
                                <a href="${result.magicLink}" 
                                   style="color: #4285f4; word-break: break-all; font-size: 12px; text-decoration: none; display: block; margin-bottom: 10px;">${result.magicLink}</a>
                                ${result.backupCode ? `<p style="margin: 0; font-size: 12px; color: #666;">Backup Code: <strong>${result.backupCode}</strong></p>` : ''}
                              </div>
                              <button onclick="
                                this.textContent = 'Signing in...';
                                this.disabled = true;
                                
                                try {
                                  // Extract token from magic link URL
                                  const magicLink = '${result.magicLink}';
                                  console.log('🔗 Magic link:', magicLink);
                                  
                                  // Extract token using regex as backup
                                  const tokenMatch = magicLink.match(/token=([^&]+)/);
                                  const token = tokenMatch ? tokenMatch[1] : null;
                                  
                                  console.log('🎫 Extracted token:', token ? token.slice(0, 8) + '...' : 'null');
                                  
                                  if (!token) {
                                    throw new Error('Could not extract token from magic link');
                                  }
                                  
                                  // Call verification endpoint directly
                                  fetch('/api/auth/verify-magic-token', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    credentials: 'include',
                                    body: JSON.stringify({ token: token })
                                  }).then(response => {
                                    console.log('📡 Response status:', response.status);
                                    return response.json();
                                  })
                                  .then(data => {
                                    console.log('📦 Response data:', data);
                                    if (data.success) {
                                      console.log('✅ Authentication successful');
                                      // Small delay to ensure session is set
                                      setTimeout(() => {
                                        window.location.reload();
                                      }, 500);
                                    } else {
                                      throw new Error(data.error || 'Authentication failed');
                                    }
                                  }).catch(error => {
                                    console.error('❌ Magic link authentication failed:', error);
                                    alert('Authentication failed: ' + error.message);
                                    this.textContent = 'Sign In Now';
                                    this.disabled = false;
                                  });
                                } catch (error) {
                                  console.error('❌ Token extraction failed:', error);
                                  alert('Authentication failed: ' + error.message);
                                  this.textContent = 'Sign In Now';
                                  this.disabled = false;
                                }
                              " style="
                                width: 100%;
                                padding: 15px;
                                background: #4285f4;
                                color: white;
                                border: none;
                                border-radius: 8px;
                                font-size: 16px;
                                cursor: pointer;
                                margin-bottom: 10px;
                                font-weight: bold;
                              ">Sign In Now</button>
                            ` : `
                              <p style="color: #999; font-size: 14px; margin-bottom: 20px;">Click the link in your email to sign in. The link will expire in 15 minutes for security.</p>
                            `}
                            
                            <button onclick="document.body.removeChild(document.querySelector('[style*=\\"position: fixed\\"]'))" style="
                              width: 100%;
                              padding: 12px;
                              background: ${showDevLink ? '#ccc' : '#4285f4'};
                              color: ${showDevLink ? '#666' : 'white'};
                              border: none;
                              border-radius: 8px;
                              font-size: 16px;
                              cursor: pointer;
                            ">${showDevLink ? 'Close' : 'Got it'}</button>
                          </div>
                        `;
                      } else {
                        throw new Error(result.error || 'Failed to send magic link');
                      }
                    } catch (error) {
                      console.error('❌ Magic link error:', error);
                      alert('Failed to send magic link. Please check your email address and try again.');
                      submitBtn.textContent = 'Continue';
                      submitBtn.disabled = false;
                    }
                  };
                  
                  // Focus email input
                  setTimeout(() => emailInput.focus(), 100);
                // Fallback: If email modal fails for any reason, use OAuth
                // This ensures users always have a way to sign in
              } catch (error) {
                console.error('❌ Sign-in error:', error);
                alert('Authentication failed. Please try again.');
              }
            }}
            disabled={isLoggingIn}
            className="w-full h-12 text-base"
            size="lg"
          >
            {isLoggingIn ? (
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Signing in...</span>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                {isMobileApp ? (
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
                  </svg>
                ) : (
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path
                      fill="currentColor"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="currentColor"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                )}
                <span>Sign In with Email</span>
              </div>
            )}
          </Button>

          {/* Alternative: Google Sign-In */}
          <Button
            variant="outline"
            onClick={() => {
              console.log('🌐 Using Google OAuth');
              window.location.href = "/api/auth/google";
            }}
            className="w-full h-12 text-base"
            size="lg"
          >
            <div className="flex items-center space-x-2">
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              <span>Continue with Google</span>
            </div>
          </Button>

          {/* Development login fallback */}
          {import.meta.env.DEV && (
            <div className="space-y-3">
              <div className="text-center">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowDevLogin(!showDevLogin)}
                  className="text-xs"
                >
                  <UserCheck className="h-3 w-3 mr-1" />
                  Development Login
                </Button>
              </div>

              {showDevLogin && (
                <div className="space-y-3 p-3 border rounded-lg bg-yellow-50 dark:bg-yellow-900/20">
                  <div className="text-xs text-yellow-700 dark:text-yellow-300 text-center">
                    Development only - bypasses OAuth
                  </div>
                  <div className="space-y-2">
                    <div>
                      <Label htmlFor="dev-name" className="text-xs">Name</Label>
                      <Input
                        id="dev-name"
                        value={devName}
                        onChange={(e) => setDevName(e.target.value)}
                        placeholder="Your name"
                        className="h-8 text-sm"
                      />
                    </div>
                    <div>
                      <Label htmlFor="dev-email" className="text-xs">Email</Label>
                      <Input
                        id="dev-email"
                        type="email"
                        value={devEmail}
                        onChange={(e) => setDevEmail(e.target.value)}
                        placeholder="your@email.com"
                        className="h-8 text-sm"
                      />
                    </div>
                    <Button
                      onClick={handleDevLogin}
                      disabled={!devName.trim() || !devEmail.trim() || isDevLoggingIn}
                      className="w-full h-8 text-xs"
                      size="sm"
                    >
                      {isDevLoggingIn ? "Signing in..." : "Sign In (Dev)"}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Only show install button for web users */}
          {!isMobileApp && (
            <div className="space-y-3">
              <div className="flex items-center justify-center space-x-2">
                <Smartphone className="h-4 w-4 text-blue-600" />
                <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-200">
                  Install Available
                </Badge>
              </div>
              <Button
                variant="outline"
                className="w-full"
                onClick={handleInstallClick}
              >
                <Download className="h-4 w-4 mr-2" />
                Install GabAi App
              </Button>
              <p className="text-xs text-muted-foreground text-center">
                Install for faster access and offline support
              </p>
            </div>
          )}

          <div className="text-center text-sm text-muted-foreground">
            <p>{isMobileApp ? "Sign in to access your personal AI assistant" : "Sign in to sync your data across all devices"}</p>
          </div>
        </CardContent>
      </Card>


    </div>
  );
}