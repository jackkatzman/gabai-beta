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
  const { refetch } = useAuth();
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
          
          // Save token to localStorage (for both web and APK)
          if (result.token) {
            console.log('💾 Saving authentication token');
            localStorage.setItem('gabai_token', result.token);
          }
          
          // Refetch user data to update auth state (instead of reload)
          console.log('🔄 Refreshing auth state...');
          await refetch();
          
          // Navigate to chat (main page after login)
          setLocation('/chat');
        } else {
          throw new Error(result.error || 'Registration failed');
        }
      } else {
        // Login
        console.log('🔐 Starting login attempt...', { email: formData.email, hasPassword: !!formData.password });
        
        const result = await api('/api/auth/login', {
          method: 'POST',
          body: JSON.stringify({
            email: formData.email,
            password: formData.password
          })
        });
        
        console.log('📨 Login API response:', result);
        
        if (result.success) {
          console.log('✅ Login successful');
          
          // Save token to localStorage (for both web and APK)
          if (result.token) {
            console.log('💾 Saving authentication token');
            localStorage.setItem('gabai_token', result.token);
          }
          
          // Refetch user data to update auth state (instead of reload)
          console.log('🔄 Refreshing auth state...');
          await refetch();
          
          // Navigate to chat (main page after login)
          setLocation('/chat');
        } else {
          throw new Error(result.error || 'Login failed');
        }
      }
    } catch (error) {
      console.error('❌ Authentication error:', error);
      console.error('❌ Error details:', {
        message: (error as Error).message,
        stack: (error as Error).stack,
        error: error
      });
      alert('Login failed: ' + (error as Error).message);
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