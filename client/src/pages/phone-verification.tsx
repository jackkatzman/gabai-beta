```tsx
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Phone, CheckCircle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import VerificationInput from '@/components/sms/verification-input';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiUrl } from '@/lib/api-config';

type Step = 'phone' | 'verification' | 'success';

function toE164US(input: string): string | null {
  const clean = (input || '').replace(/\D/g, '');
  if (clean.length === 11 && clean.startsWith('1')) {
    const us = clean.slice(1);
    if (us.length === 10 && !/^[01]/.test(us[0])) return `+1${us}`;
  } else if (clean.length === 10 && !/^[01]/.test(clean[0])) {
    return `+1${clean}`;
  }
  return null;
}

function formatPhoneForInput(value: string) {
  const nums = value.replace(/\D/g, '').slice(0, 10);
  if (nums.length > 6) return `${nums.slice(0,3)}-${nums.slice(3,6)}-${nums.slice(6)}`;
  if (nums.length > 3) return `${nums.slice(0,3)}-${nums.slice(3)}`;
  return nums;
}

export default function PhoneVerificationPage() {
  const [step, setStep] = useState<Step>('phone');
  const [phoneNumber, setPhoneNumber] = useState('');
  const queryClient = useQueryClient();

  // --- SEND CODE ---
  const sendCodeMutation = useMutation({
    mutationFn: async (e164Phone: string) => {
      const url = apiUrl('/api/sms/send-verification');
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: e164Phone }),
      });
      const text = await res.text();
      if (!res.ok) throw new Error(text || 'Failed to send verification code');
      return text ? JSON.parse(text) : {};
    },
    onSuccess: () => {
      toast({ title: 'Verification code sent', description: 'Check your messages for the 6-digit code.' });
      setStep('verification');
    },
    onError: (err: any) => {
      toast({ title: 'Failed to send code', description: err?.message || 'Please try again', variant: 'destructive' });
    },
  });

  // --- VERIFY CODE ---
  const verifyCodeMutation = useMutation({
    mutationFn: async (code: string) => {
      const e164 = toE164US(phoneNumber);
      if (!e164) throw new Error('Invalid phone number format');

      const url = apiUrl('/api/sms/verify-code'); // change to '/api/sms/check-code' if that’s your server route
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: e164, code, createAccount: true }),
      });
      const text = await res.text();
      if (!res.ok) throw new Error(`verify-code ${res.status}: ${text}`);
      const result = text ? JSON.parse(text) : {};
      return result as { verified?: boolean; token?: string; user?: any };
    },
    onSuccess: (result) => {
      if (!result?.verified || !result?.token) throw new Error('Code not approved yet');

      // Store token & user
      localStorage.setItem('gabai_token', result.token!);
      localStorage.setItem('gabai_user', JSON.stringify(result.user || {}));
      sessionStorage.setItem('gabai_token', result.token!);
      sessionStorage.setItem('gabai_user', JSON.stringify(result.user || {}));
      document.cookie = `gabai_token=${result.token}; path=/; max-age=${7*24*60*60}; SameSite=None; Secure`;

      // Seed React Query cache
      queryClient.setQueryData(['/api/auth/user'], result.user || {});
      queryClient.invalidateQueries({ queryKey: ['/api/auth/user'], refetchType: 'none' });

      setStep('success');
      setTimeout(() => window.location.replace('/'), 800);
    },
    onError: (err: any) => {
      toast({ title: 'Verification failed', description: err?.message || 'Please check the code and try again', variant: 'destructive' });
    },
  });

  // --- Handlers ---
  const handleSendCode = () => {
    if (!phoneNumber.trim()) {
      toast({ title: 'Phone number required', description: 'Please enter your phone number', variant: 'destructive' });
      return;
    }
    const e164 = toE164US(phoneNumber);
    if (!e164) {
      toast({ title: 'Invalid Phone Number', description: 'Enter a valid 10-digit US number (e.g., 555-123-4567)', variant: 'destructive' });
      return;
    }
    sendCodeMutation.mutate(e164);
  };

  const handleVerifyCode = (code: string) => {
    const e164 = toE164US(phoneNumber);
    if (!e164) {
      toast({ title: 'Invalid Phone Number', description: 'Phone number validation failed', variant: 'destructive' });
      return;
    }
    verifyCodeMutation.mutate(code);
  };

  const handleResendCode = () => {
    const e164 = toE164US(phoneNumber);
    if (!e164) {
      toast({ title: 'Invalid Phone Number', description: 'Phone number validation failed', variant: 'destructive' });
      return;
    }
    sendCodeMutation.mutate(e164);
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value;
    const cleaned = input.replace(/[^\d-]/g, '');
    // deletion-friendly formatting
    if (cleaned.length < phoneNumber.length) {
      const digitsOnly = cleaned.replace(/-/g, '');
      setPhoneNumber(digitsOnly.length ? formatPhoneForInput(digitsOnly) : '');
    } else {
      setPhoneNumber(formatPhoneForInput(cleaned));
    }
  };

  const goBack = () => {
    if (step === 'verification') setStep('phone');
    else if (step === 'success') { setStep('phone'); setPhoneNumber(''); }
  };

  // --- UI ---
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 mb-4 bg-blue-600 rounded-full">
            <Phone className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">GabAi</h1>
          <p className="text-lg text-gray-600 dark:text-gray-300">Your AI Personal Assistant</p>
        </div>

        {/* Step: Phone */}
        {step === 'phone' && (
          <Card className="shadow-lg border-0 bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm">
            <CardHeader className="text-center pb-4">
              <CardTitle className="text-2xl font-semibold">Sign in with SMS</CardTitle>
              <CardDescription className="text-base mt-2">We&apos;ll text you a verification code</CardDescription>
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
                ) : ('Get Verification Code')}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Step: Verification */}
        {step === 'verification' && (
          <div className="space-y-4">
            <Button variant="ghost" onClick={goBack} className="mb-4 hover:bg-gray-100 dark:hover:bg-gray-800" data-testid="button-back">
              <ArrowLeft className="w-4 h-4 mr-2" /> Change Number
            </Button>

            <Card className="shadow-lg border-0 bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm">
              <CardHeader className="text-center pb-4">
                <CardTitle className="text-xl">Enter Verification Code</CardTitle>
                <CardDescription className="text-base mt-2">We sent a code to {phoneNumber}</CardDescription>
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

        {/* Step: Success */}
        {step === 'success' && (
          <Card className="shadow-lg border-0 bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm">
            <CardHeader className="text-center">
              <CardTitle className="flex items-center gap-2 justify-center text-green-600 text-2xl">
                <CheckCircle className="w-8 h-8" /> Welcome to GabAi!
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center p-8">
                <div className="inline-flex items-center justify-center w-20 h-20 mb-4 bg-green-100 dark:bg-green-900/30 rounded-full">
                  <CheckCircle className="w-12 h-12 text-green-600" />
                </div>
                <p className="text-lg font-medium text-gray-900 dark:text-white mb-2">Authentication Successful</p>
                <p className="text-gray-600 dark:text-gray-300">Redirecting to your assistant...</p>
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
```
