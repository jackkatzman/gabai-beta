import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { Eye, EyeOff } from "lucide-react";
import { api } from '@/lib/api-bulletproof';
import { useLocation } from "wouter";
import gabaiIcon from "@assets/gabai-icon-optimized.png";

export default function SimpleAuthPage() {
  const { loginWithGoogle, refetch } = useAuth();
  const [, setLocation] = useLocation();
  const [isRegistering, setIsRegistering] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: ''
  });
  
  // Detect if we're in APK mode - only for actual APK environments
  const isAPK = window.location.protocol === 'file:' || 
                (navigator.userAgent.includes('wv') && navigator.userAgent.includes('Android'));

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (isRegistering) {
        // Registration
        const result = await api('/api/auth/register', {
          method: 'POST',
          body: JSON.stringify({
            email: formData.email,
            password: formData.password,
            name: formData.name || formData.email.split('@')[0]
          })
        });
        
        if (result.success) {
          console.log('✅ Registration successful');
          
          // For APK: Save token to localStorage (like SMS auth)
          if (result.token && isAPK) {
            console.log('📱 APK mode: Saving authentication token');
            localStorage.setItem('gabai_token', result.token);
          }
          
          // Refetch user data to update auth state (instead of reload)
          console.log('🔄 Refreshing auth state...');
          await refetch();
          
          // Navigate to home
          setLocation('/home');
        } else {
          throw new Error(result.error || 'Registration failed');
        }
      } else {
        // Login
        const result = await api('/api/auth/login', {
          method: 'POST',
          body: JSON.stringify({
            email: formData.email,
            password: formData.password
          })
        });
        
        if (result.success) {
          console.log('✅ Login successful');
          
          // For APK: Save token to localStorage (like SMS auth)
          if (result.token && isAPK) {
            console.log('📱 APK mode: Saving authentication token');
            localStorage.setItem('gabai_token', result.token);
          }
          
          // Refetch user data to update auth state (instead of reload)
          console.log('🔄 Refreshing auth state...');
          await refetch();
          
          // Navigate to home
          setLocation('/home');
        } else {
          throw new Error(result.error || 'Login failed');
        }
      }
    } catch (error) {
      console.error('❌ Authentication error:', error);
      alert((error as Error).message);
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
          <p className="text-gray-600 dark:text-gray-300 mt-2">Your AI Personal Assistant</p>
        </div>

        {/* Auth form - available for all users */}
        <Card className="shadow-lg border-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">
              {isRegistering ? 'Create Account' : 'Welcome Back'}
            </CardTitle>
            <CardDescription>
              {isRegistering 
                ? 'Sign up to get started with GabAi' 
                : 'Sign in to continue to GabAi'
              }
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {isRegistering && (
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name (optional)</Label>
                  <Input
                    id="name"
                    name="name"
                    type="text"
                    placeholder="Enter your name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full"
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="Enter your email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  autoComplete="email"
                  inputMode="email"
                  className="w-full"
                  style={{ fontSize: '16px', minHeight: '48px' }}
                  data-testid="input-email"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={formData.password}
                    onChange={handleInputChange}
                    required
                    autoComplete="current-password"
                    className="w-full pr-10"
                    style={{ fontSize: '16px', minHeight: '48px' }}
                    data-testid="input-password"
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
                {!isRegistering && (
                  <div className="text-right">
                    <button
                      type="button"
                      onClick={() => setLocation('/password-reset')}
                      className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                      data-testid="link-forgot-password"
                    >
                      Forgot password?
                    </button>
                  </div>
                )}
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-11 text-base"
                size="lg"
              >
                {isLoading
                  ? (isRegistering ? 'Creating account...' : 'Signing in...')
                  : (isRegistering ? 'Create Account' : 'Sign In')
                }
              </Button>
            </form>

            {/* Divider */}
            <div className="mt-6 mb-6 flex items-center">
              <div className="flex-1 border-t border-gray-300 dark:border-gray-600"></div>
              <span className="px-4 text-sm text-gray-500 dark:text-gray-400">or</span>
              <div className="flex-1 border-t border-gray-300 dark:border-gray-600"></div>
            </div>

            {/* Authentication Options */}
            <div className="space-y-3">
              {/* Google Sign-In Button - only show for web */}
              {!isAPK && (
                <Button
                  type="button"
                  variant="outline"
                  className="w-full h-11 text-base"
                  onClick={() => window.location.href = '/api/auth/google'}
                  size="lg"
                >
                  <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                    <path fill="#4285f4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34a853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#fbbc05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#ea4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Continue with Google
                </Button>
              )}

              {/* SMS Sign-In Button - always available */}
              <Button
                type="button"
                variant="outline"
                className="w-full h-11 text-base"
                onClick={() => setLocation('/phone-verification')}
                size="lg"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
                Sign in with Phone
              </Button>
            </div>

            <div className="mt-6 text-center">
              <button
                type="button"
                onClick={() => setIsRegistering(!isRegistering)}
                className="text-blue-600 dark:text-blue-400 hover:underline block w-full"
              >
                {isRegistering
                  ? 'Already have an account? Sign in'
                  : "Don't have an account? Sign up"
                }
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-8 text-sm text-gray-500 dark:text-gray-400">
          © 2025 GabAi — Owned and operated by Booah LLC
        </div>
      </div>
    </div>
  );
}