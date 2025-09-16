import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Phone, CheckCircle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import VerificationInput from '@/components/sms/verification-input';
// Note: Using fetch instead of apiRequest for better error handling
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiUrl } from '@/lib/api-config';

export default function PhoneVerificationPage() {
  const [step, setStep] = useState<'phone' | 'verification' | 'success'>('phone');
  const [phoneNumber, setPhoneNumber] = useState('');
  const queryClient = useQueryClient();

  // Send verification code mutation
  const sendCodeMutation = useMutation({
    mutationFn: async (phone: string) => {
      const url = apiUrl('/api/sms/send-verification');
      console.log('📱 Sending SMS to:', url);
      const response = await fetch(url, {
        method: 'POST',
        body: JSON.stringify({ phoneNumber: phone }),
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to send verification code');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Verification code sent",
        description: `Check your messages for a 6-digit code`,
      });
      setStep('verification');
    },
    onError: (error: any) => {
      toast({
        title: "Failed to send code",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    }
  });

  // Verify code mutation
  const verifyCodeMutation = useMutation({
    mutationFn: async (code: string) => {
      // Use same E.164 validation for consistency
      const cleanNumber = phoneNumber.replace(/\D/g, '');
      let e164Number = '';
      
      if (cleanNumber.length === 11 && cleanNumber.startsWith('1')) {
        const usNumber = cleanNumber.slice(1);
        if (usNumber.length === 10 && !/^[01]/.test(usNumber[0])) {
          e164Number = '+1' + usNumber;
        }
      } else if (cleanNumber.length === 10 && !/^[01]/.test(cleanNumber[0])) {
        e164Number = '+1' + cleanNumber;
      }
      
      if (!e164Number) {
        throw new Error('Invalid phone number format');
      }
      
      console.log('📱 Verifying with E.164 number:', e164Number);
      
      // Verify code and create account in one step
      const url = apiUrl('/api/sms/verify-code');
      console.log('📱 Making API call to:', url);
      const verifyResponse = await fetch(url, {
        method: 'POST',
        body: JSON.stringify({ 
          phoneNumber: e164Number, 
          code, 
          createAccount: true 
        }),
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (!verifyResponse.ok) {
        const error = await verifyResponse.json();
        throw new Error(error.error || 'Failed to verify code');
      }
      
      const result = await verifyResponse.json();
      
      if (result.verified && result.token) {
        // Store the auth token in BOTH localStorage and sessionStorage for mobile compatibility
        localStorage.setItem('gabai_token', result.token);
        localStorage.setItem('gabai_user', JSON.stringify(result.user));
        sessionStorage.setItem('gabai_token', result.token);
        sessionStorage.setItem('gabai_user', JSON.stringify(result.user));
        
        // Also try storing with a simpler key
        localStorage.setItem('token', result.token);
        sessionStorage.setItem('token', result.token);
        
        // CRITICAL FIX: For APK loading from Replit dev URL, we need special handling
        const isAPK = navigator.userAgent.includes('wv') && navigator.userAgent.includes('Android');
        const isReplitDev = window.location.hostname.includes('replit');
        
        if (isAPK && isReplitDev) {
          // APK is loading from Replit dev URL - store token for cross-domain use
          console.log('🔧 APK on Replit dev URL detected - storing token for cross-domain API calls');
          
          // Store a flag that we're authenticated via SMS
          localStorage.setItem('gabai_sms_authenticated', 'true');
          localStorage.setItem('gabai_auth_timestamp', Date.now().toString());
          
          // Try to set cookie for gabai.ai (won't work due to cross-domain but try anyway)
          document.cookie = `gabai_token=${result.token}; domain=.gabai.ai; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=None; Secure`;
          console.log('🍪 APK: Attempted cross-domain cookie (may not work)');
        } else if (isAPK) {
          // APK loading from production
          document.cookie = `gabai_token=${result.token}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=None; Secure`;
          console.log('🍪 APK: Token cookie set for current domain');
        } else {
          // For web, use standard cookie settings
          const isSecure = window.location.protocol === 'https:';
          const cookieOptions = isSecure 
            ? `; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=None; Secure`
            : `; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Lax`;
          document.cookie = `gabai_token=${result.token}${cookieOptions}`;
          console.log('🍪 Web: Token stored as cookie with options:', cookieOptions);
        }
        
        console.log('✅ SMS Authentication successful! Token stored:', result.token.substring(0, 20) + '...');
        console.log('🔍 Verifying token storage...');
        console.log('🔍 localStorage token:', localStorage.getItem('gabai_token')?.substring(0, 20) + '...');
        console.log('🔍 sessionStorage token:', sessionStorage.getItem('gabai_token')?.substring(0, 20) + '...');
        console.log('🔍 localStorage keys after storage:', Object.keys(localStorage));
        console.log('🔍 sessionStorage keys after storage:', Object.keys(sessionStorage));
        
        // CRITICAL FIX: Seed React Query cache immediately
        console.log('🚀 Seeding React Query cache with user data');
        queryClient.setQueryData(['/api/auth/user'], result.user);
        // Invalidate without refetch to prevent stuck query
        queryClient.invalidateQueries({ 
          queryKey: ['/api/auth/user'], 
          refetchType: 'none' 
        });
        console.log('✅ React Query cache updated - isLoading should be false now');
        
        // Add debugging before redirect
        console.log('🔍 Pre-redirect localStorage check:');
        console.log('  - Token exists:', !!localStorage.getItem('gabai_token'));
        console.log('  - User exists:', !!localStorage.getItem('gabai_user'));
        console.log('  - All keys:', Object.keys(localStorage));
        console.log('  - Window origin:', window.location.origin);
        
        // Try to force a localStorage sync
        try {
          localStorage.setItem('gabai_token_check', 'verified');
          console.log('  - Test write successful');
        } catch (e) {
          console.error('  - localStorage write failed:', e);
        }
        
        // Add a small delay to ensure localStorage is flushed
        setTimeout(() => {
          console.log('🔁 Redirecting to chat...');
          // Detect APK environment (WebView or Cordova)
          const isAPK = window.location.protocol === 'file:' || 
                       (navigator.userAgent.includes('wv') && navigator.userAgent.includes('Android')) ||
                       (typeof window.cordova !== 'undefined');
          
          console.log('✅ SMS verified - navigating to home');
          // Use replace to prevent back button issues
          // Navigate to root which will auto-redirect to chat if authenticated
          window.location.replace('/');
        }, 1000);
      }
      
      return result;
    },
    onSuccess: () => {
      toast({
        title: "Phone verified!",
        description: "Logging you in...",
      });
      setStep('success');
    },
    onError: (error: any) => {
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
    // Use the same E.164 validation as send to ensure consistency
    const cleanNumber = phoneNumber.replace(/\D/g, '');
    let e164Number = '';
    
    if (cleanNumber.length === 11 && cleanNumber.startsWith('1')) {
      const usNumber = cleanNumber.slice(1);
      if (usNumber.length === 10 && !/^[01]/.test(usNumber[0])) {
        e164Number = '+1' + usNumber;
      }
    } else if (cleanNumber.length === 10 && !/^[01]/.test(cleanNumber[0])) {
      e164Number = '+1' + cleanNumber;
    }
    
    if (!e164Number) {
      toast({
        title: "Invalid Phone Number",
        description: "Phone number validation failed",
        variant: "destructive",
      });
      return;
    }
    
    console.log('📱 Verifying with phone number:', phoneNumber, '->', e164Number);
    verifyCodeMutation.mutate(code);
  };

  const handleResendCode = () => {
    // Use the same E.164 validation as send to ensure consistency
    const cleanNumber = phoneNumber.replace(/\D/g, '');
    let e164Number = '';
    
    if (cleanNumber.length === 11 && cleanNumber.startsWith('1')) {
      const usNumber = cleanNumber.slice(1);
      if (usNumber.length === 10 && !/^[01]/.test(usNumber[0])) {
        e164Number = '+1' + usNumber;
      }
    } else if (cleanNumber.length === 10 && !/^[01]/.test(cleanNumber[0])) {
      e164Number = '+1' + cleanNumber;
    }
    
    if (!e164Number) {
      toast({
        title: "Invalid Phone Number",
        description: "Phone number validation failed",
        variant: "destructive",
      });
      return;
    }
    
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
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
                <CheckCircle className="w-8 h-8" />
                Welcome to GabAi!
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center p-8">
                <div className="inline-flex items-center justify-center w-20 h-20 mb-4 bg-green-100 dark:bg-green-900/30 rounded-full">
                  <CheckCircle className="w-12 h-12 text-green-600" />
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