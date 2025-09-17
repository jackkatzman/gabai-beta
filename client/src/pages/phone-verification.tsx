import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowLeft, Phone } from 'lucide-react';
import { GabaiCheckIcon } from '@/components/ui/gabai-check-icon';
import { toast } from '@/hooks/use-toast';
import VerificationInput from '@/components/sms/verification-input';
import { useLocation } from 'wouter';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api, setToken } from '@/lib/auth';

// Module-level flag to prevent duplicate verification attempts (ChatGPT fix)
let verifying = false;

export default function PhoneVerificationPage() {
  const [step, setStep] = useState<'phone' | 'verification' | 'success'>('phone');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationSid, setVerificationSid] = useState<string>('');
  const [resendCooldown, setResendCooldown] = useState(0);
  const [smsOptIn, setSmsOptIn] = useState(false);
  const queryClient = useQueryClient();
  const [, navigate] = useLocation();

  // Send verification code mutation
  const sendCodeMutation = useMutation({
    mutationFn: async (phone: string) => {
      console.log('📱 Sending SMS verification code to:', phone);
      return await api('/api/sms/send-verification', {
        method: 'POST',
        body: JSON.stringify({ phoneNumber: phone })
      });
    },
    onSuccess: (data: any) => {
      console.log('📱 SMS send response:', data);
      if (data.verificationSid) {
        setVerificationSid(data.verificationSid);
        console.log('📱 Stored verificationSid:', data.verificationSid);
      }
      toast({
        title: "Verification code sent",
        description: `Check your messages for a 6-digit code. Only the newest code works.`,
      });
      setStep('verification');
      // Start 60-second cooldown
      setResendCooldown(60);
      const timer = setInterval(() => {
        setResendCooldown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    },
    onError: (error: any) => {
      toast({
        title: "Failed to send code",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    }
  });

  // SMS verification mutation - using verificationSid
  const verifyCodeMutation = useMutation({
    mutationFn: async (code: string) => {
      // Set module-level flag to prevent duplicates (ChatGPT fix)
      verifying = true;
      
      try {
        console.log('📱 Starting SMS verification with phone:', phoneNumber);
        
        // Clean code - digits only, trimmed
        const cleanCode = code.replace(/\D/g, '').trim();
        console.log('📱 Cleaned code:', code, '->', cleanCode);
        
        // Convert phone to E.164 format for verification
        const cleanNumber = phoneNumber.replace(/\D/g, '');
        let e164Phone = '';
        if (cleanNumber.length === 10) {
          e164Phone = '+1' + cleanNumber;
        } else if (cleanNumber.startsWith('1') && cleanNumber.length === 11) {
          e164Phone = '+' + cleanNumber;
        } else {
          e164Phone = '+' + cleanNumber;
        }
        
        console.log('📱 Using E.164 phone for verification:', e164Phone);
        
        // Step 1: Verify SMS using phone + code (NOT verificationSid)
        console.log('📱 Sending verification request...');
        const data = await api('/api/sms/verify-code', {
          method: 'POST',
          body: JSON.stringify({ 
            phone: e164Phone,  // Send E.164 formatted phone
            code: cleanCode, 
            createAccount: true
          })
        });

        console.log('📱 Verification response:', data);
        
        // Check for success field first (server returns success: true)
        if (!data.success) {
          console.error('❌ Verification failed. Server response:', data);
          throw new Error(data.error || 'Verification failed');
        }
        
        const token = data.token;  // Server returns "token", not "jwt"
        if (!token) {
          console.error('❌ No token in response. Full response:', data);
          throw new Error('No token received from server');
        }
        
        // Step 2: Persist token
        console.log('📱 Saving token...');
        setToken(token);                                   
        localStorage.setItem('gabai_token', token); // Double-ensure it's saved
        await Promise.resolve();                         // flush microtask

        // Step 3: Confirm token works with credentials: 'include' (api() handles this)
        console.log('📱 Confirming authentication...');
        try {
          const me = await api('/api/auth/user');        
          console.log('📱 User confirmation successful:', me);
          
          // Step 4: Hydrate React Query cache
          queryClient.setQueryData(['/api/auth/user'], me);
        } catch (authError: any) {
          console.error('❌ Failed to confirm auth:', authError);
          // Still try to navigate even if auth check fails
        }

        // Step 5: Navigate after everything is confirmed
        console.log('📱 Navigating to chat...');
        
        // Detect if running as APK (same detection as App.tsx)
        const isAPK = window.location.protocol === 'file:' || 
                      window.location.hostname === 'localhost' ||
                      typeof (window as any).Android !== 'undefined' ||
                      window.location.hostname.includes('replit');
        
        requestAnimationFrame(() => {
          console.log('📱 Navigation frame - navigating now (APK:', isAPK, ')');
          if (isAPK) {
            // Use hash routing for APK environments as per development journal
            console.log('📱 APK detected - using hash navigation to chat');
            window.location.href = '/#/chat';
          } else {
            // Use regular routing for web
            navigate('/chat', { replace: true });
          }
        });
        
        return data;
      } catch (error: any) {
        console.error('❌ Verification error:', error);
        console.error('❌ Error details:', {
          message: error?.message,
          stack: error?.stack,
          verificationSid,
          code
        });
        throw error;
      } finally {
        // Always reset flag, even on error (ChatGPT fix)
        verifying = false;
      }
    },
    onSuccess: () => {
      console.log('✅ Verification successful, showing success toast');
      toast({
        title: "Phone verified!",
        description: "Logging you in...",
      });
      setStep('success');
    },
    onError: (error: any) => {
      console.error('❌ Verification mutation onError:', error);
      toast({
        title: "Verification failed",
        description: error.message || "Please check the code and try again",
        variant: "destructive",
      });
    }
  });

  const handleSendCode = () => {
    if (!phoneNumber.trim()) {
      toast({
        title: "Phone number required",
        description: "Please enter your phone number",
        variant: "destructive",
      });
      return;
    }
    
    if (!smsOptIn) {
      toast({
        title: "Consent required",
        description: "Please check the consent box to receive SMS messages",
        variant: "destructive",
      });
      return;
    }
    
    // Robust E.164 validation for US numbers
    const cleanNumber = phoneNumber.replace(/\D/g, '');
    let e164Number = '';
    
    // Handle US numbers: must be exactly 10 digits or 11 with leading 1
    if (cleanNumber.length === 11 && cleanNumber.startsWith('1')) {
      // 11 digits with leading 1 - strip the 1
      const usNumber = cleanNumber.slice(1);
      // US area codes can't start with 0 or 1
      if (usNumber.length === 10 && !/^[01]/.test(usNumber[0])) {
        e164Number = '+1' + usNumber;
      }
    } else if (cleanNumber.length === 10) {
      // Exactly 10 digits - validate it's a valid US number
      // US area codes can't start with 0 or 1
      if (!/^[01]/.test(cleanNumber[0])) {
        e164Number = '+1' + cleanNumber;
      }
    }
    
    // Validation failed
    if (!e164Number) {
      toast({
        title: "Invalid Phone Number",
        description: "Please enter a valid 10-digit US phone number (e.g., 555-123-4567)",
        variant: "destructive",
      });
      console.log('❌ Invalid phone number:', phoneNumber, 'cleaned:', cleanNumber);
      return;
    }
    
    console.log('📱 Converting phone number:', phoneNumber, '->', e164Number);
    sendCodeMutation.mutate(e164Number);
  };

  const handleVerifyCode = (code: string) => {
    console.log('📱 handleVerifyCode called with code:', code, 'phone:', phoneNumber);
    
    // Prevent duplicate verification attempts (ChatGPT fix)
    if (verifying) {
      console.log('⚠️ Verification already in progress, ignoring duplicate attempt');
      return;
    }
    
    if (!phoneNumber || phoneNumber.length < 10) {
      toast({
        title: "Phone number required",
        description: "Please enter your phone number first",
        variant: "destructive",
      });
      return;
    }
    
    console.log('📱 Verifying code for phone:', phoneNumber);
    verifyCodeMutation.mutate(code);
  };

  const handleResendCode = () => {
    if (resendCooldown > 0) return;
    
    // Clear old verificationSid
    setVerificationSid('');
    
    // Use simplified phone normalization (match server logic)
    let cleanNumber = phoneNumber.replace(/\D/g, '');
    let e164Number = '';
    
    if (cleanNumber.length === 10) {
      e164Number = '+1' + cleanNumber;
    } else if (cleanNumber.startsWith('1') && cleanNumber.length === 11) {
      e164Number = '+' + cleanNumber;
    } else if (cleanNumber.length >= 10) {
      e164Number = '+' + cleanNumber;
    }
    
    if (!e164Number || e164Number.length < 12) {
      toast({
        title: "Invalid Phone Number",
        description: "Phone number validation failed",
        variant: "destructive",
      });
      return;
    }
    
    console.log('📱 Resending code to:', e164Number);
    sendCodeMutation.mutate(e164Number);
  };

  const formatPhoneNumber = (value: string) => {
    // Remove all non-digits
    const numbers = value.replace(/\D/g, '');
    
    // Limit to 10 digits for US numbers
    const limited = numbers.slice(0, 10);
    
    // Simple formatting with just dashes for easier editing
    if (limited.length > 6) {
      return `${limited.slice(0, 3)}-${limited.slice(3, 6)}-${limited.slice(6)}`;
    } else if (limited.length > 3) {
      return `${limited.slice(0, 3)}-${limited.slice(3)}`;
    } else {
      return limited;
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value;
    
    // Allow direct typing of numbers and backspace to work naturally
    // Remove all non-digits except existing dashes
    const cleaned = input.replace(/[^\d-]/g, '');
    
    // If user is deleting (input is shorter than current), allow it
    if (cleaned.length < phoneNumber.length) {
      // Just keep the digits when deleting
      const digitsOnly = cleaned.replace(/-/g, '');
      if (digitsOnly.length === 0) {
        setPhoneNumber('');
      } else {
        setPhoneNumber(formatPhoneNumber(digitsOnly));
      }
    } else {
      // Format on typing
      const formatted = formatPhoneNumber(cleaned);
      setPhoneNumber(formatted);
    }
  };

  const goBack = () => {
    if (step === 'verification') {
      setStep('phone');
    } else if (step === 'success') {
      setStep('phone');
      setPhoneNumber('');
    }
  };

  return (
    <div className="min-h-screen bg-orange-400 flex items-center justify-center p-4" style={{ backgroundColor: '#fb923c' }}>
      {/* EMERGENCY ORANGE THEME - FORCE VISIBLE */}
      <div className="fixed top-0 left-0 right-0 bg-red-600 text-white text-center py-4 z-50 font-black shadow-lg border-b-4 border-yellow-400">
        🚨 V2.2 ORANGE THEME FORCE DEPLOYED - NO MORE BLUE! 🚨
      </div>
      <div className="w-full max-w-md">
        {/* GabAi Logo and Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 mb-4 bg-blue-600 rounded-full">
            <Phone className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            GabAi
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            Your AI Personal Assistant
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            by Booah LLC
          </p>
        </div>

        {/* Phone Number Input Step */}
        {step === 'phone' && (
          <Card className="shadow-lg border-0 bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm">
            <CardHeader className="text-center pb-4">
              <CardTitle className="text-2xl font-semibold">
                Sign in with SMS
              </CardTitle>
              <CardDescription className="text-base mt-2">
                We'll text you a verification code
                <br />
                <span className="text-xs text-gray-500 mt-1">Service provided by Booah LLC</span>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="555-123-4567"
                  value={phoneNumber}
                  onChange={handlePhoneChange}
                  className="text-center text-lg h-12 font-mono"
                  data-testid="input-phone-number"
                  autoComplete="tel"
                  inputMode="numeric"
                />
              </div>
              
              <div className="flex items-start space-x-2">
                <Checkbox
                  id="sms-consent"
                  checked={smsOptIn}
                  onCheckedChange={(checked) => setSmsOptIn(checked as boolean)}
                  className="mt-0.5"
                  data-testid="checkbox-sms-consent"
                />
                <Label
                  htmlFor="sms-consent"
                  className="text-sm text-gray-600 dark:text-gray-300 cursor-pointer leading-relaxed"
                >
                  I consent to receive automated SMS text message reminders at this number from Booah LLC (GabAi Reminder App). Message frequency varies. Message & data rates may apply. Reply STOP to unsubscribe.
                </Label>
              </div>
              
              <Button
                onClick={handleSendCode}
                disabled={sendCodeMutation.isPending}
                className="w-full h-12 text-base bg-blue-600 hover:bg-blue-700"
                data-testid="button-send-code"
              >
                {sendCodeMutation.isPending ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Sending Code...
                  </>
                ) : (
                  'Get Verification Code'
                )}
              </Button>

            </CardContent>
          </Card>
        )}

        {/* Verification Code Step */}
        {step === 'verification' && (
          <div className="space-y-4">
            <Button
              variant="ghost"
              onClick={goBack}
              className="mb-4 hover:bg-gray-100 dark:hover:bg-gray-800"
              data-testid="button-back"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Change Number
            </Button>
            
            <Card className="shadow-lg border-0 bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm">
              <CardHeader className="text-center pb-4">
                <CardTitle className="text-xl">
                  Enter Verification Code
                </CardTitle>
                <CardDescription className="text-base mt-2">
                  We sent a code to {phoneNumber}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <VerificationInput
                  phoneNumber={phoneNumber}
                  onCodeVerified={handleVerifyCode}
                  onResendCode={handleResendCode}
                  isVerifying={verifyCodeMutation.isPending}
                  isResending={sendCodeMutation.isPending}
                  resendCooldown={resendCooldown}
                />
              </CardContent>
            </Card>
          </div>
        )}

        {/* Success Step - Auto-redirecting */}
        {step === 'success' && (
          <Card className="shadow-lg border-0 bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm">
            <CardHeader className="text-center">
              <CardTitle className="flex items-center gap-2 justify-center text-green-600 text-2xl">
                <GabaiCheckIcon size="lg" className="text-blue-500" />
                Welcome to GabAi!
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center p-8">
                <div className="inline-flex items-center justify-center w-20 h-20 mb-4 bg-green-100 dark:bg-green-900/30 rounded-full">
                  <GabaiCheckIcon size="lg" className="text-blue-500 w-12 h-12" />
                </div>
                <p className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  Authentication Successful
                </p>
                <p className="text-gray-600 dark:text-gray-300">
                  Redirecting to your assistant...
                </p>
                <div className="mt-4">
                  <svg className="animate-spin h-8 w-8 mx-auto text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

      </div>
    </div>
  );
}