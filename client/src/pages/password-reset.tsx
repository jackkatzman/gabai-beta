import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useLocation } from "wouter";
import { Eye, EyeOff } from "lucide-react";
import gabaiIcon from "@assets/gabai-icon-optimized.png";
import { api } from '@/lib/api-bulletproof';

export default function PasswordResetPage() {
  const [, setLocation] = useLocation();
  const [step, setStep] = useState<'request' | 'reset'>('request');
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');

  // Check if we have a token in URL (for email links)
  useState(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const tokenParam = urlParams.get('token');
    if (tokenParam) {
      setToken(tokenParam);
      setStep('reset');
    }
  });

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('');

    try {
      const result = await api('/api/auth/request-password-reset', {
        method: 'POST',
        body: JSON.stringify({ email })
      });

      if (result.success) {
        setMessage('Password reset link sent! Check your email.');
        setTimeout(() => setLocation('/auth'), 3000);
      } else {
        throw new Error(result.error || 'Failed to send reset email');
      }
    } catch (error) {
      setMessage((error as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('');

    try {
      const result = await api('/api/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ token, newPassword })
      });

      if (result.success) {
        setMessage('Password reset successful! Redirecting to login...');
        setTimeout(() => setLocation('/auth'), 2000);
      } else {
        throw new Error(result.error || 'Failed to reset password');
      }
    } catch (error) {
      setMessage((error as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo and Title */}
        <div className="text-center mb-8">
          <img 
            src={gabaiIcon} 
            alt="GabAi" 
            className="w-16 h-16 mx-auto mb-4 rounded-full"
          />
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">GabAi</h1>
          <p className="text-gray-600 dark:text-gray-300 mt-2">Reset Your Password</p>
        </div>

        <Card className="shadow-lg border-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">
              {step === 'request' ? 'Forgot Password?' : 'Create New Password'}
            </CardTitle>
            <CardDescription>
              {step === 'request' 
                ? 'Enter your email to receive a password reset link' 
                : 'Enter your new password below'
              }
            </CardDescription>
          </CardHeader>

          <CardContent>
            {step === 'request' ? (
              <form onSubmit={handleRequestReset} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                    inputMode="email"
                    className="w-full"
                    style={{ fontSize: '16px', minHeight: '48px' }}
                    data-testid="input-reset-email"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-11 text-base"
                  size="lg"
                  data-testid="button-request-reset"
                >
                  {isLoading ? 'Sending...' : 'Send Reset Link'}
                </Button>
              </form>
            ) : (
              <form onSubmit={handleResetPassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="newPassword">New Password</Label>
                  <div className="relative">
                    <Input
                      id="newPassword"
                      name="newPassword"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter new password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      autoComplete="new-password"
                      className="w-full pr-10"
                      style={{ fontSize: '16px', minHeight: '48px' }}
                      data-testid="input-new-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2"
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4 text-gray-400" />
                      ) : (
                        <Eye className="h-4 w-4 text-gray-400" />
                      )}
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-11 text-base"
                  size="lg"
                  data-testid="button-reset-password"
                >
                  {isLoading ? 'Resetting...' : 'Reset Password'}
                </Button>
              </form>
            )}

            {message && (
              <div className={`mt-4 p-3 rounded ${message.includes('successful') || message.includes('sent') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                {message}
              </div>
            )}

            <div className="mt-6 text-center">
              <Button
                type="button"
                variant="link"
                onClick={() => setLocation('/auth')}
                className="text-sm"
                data-testid="link-back-to-login"
              >
                Back to Login
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
