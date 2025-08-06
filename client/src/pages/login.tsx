import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Download, Smartphone } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { LogoSpinner } from "@/components/ui/logo-spinner";
import { useState, useEffect } from "react";

export default function LoginPage() {
  const login = () => {
    // Clear any cached OAuth data and force fresh request
    sessionStorage.clear();
    localStorage.clear();
    const timestamp = Date.now();
    window.location.href = `/api/auth/google?fresh=${timestamp}`;
  };
  const isLoggingIn = false;
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      console.log('🎯 PWA install prompt available!');
      setDeferredPrompt(e);
      setShowInstallPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handler);
    
    // Always show install option for Android and other devices
    setTimeout(() => {
      console.log('📱 Showing install option for all devices');
      console.log('📱 Current showInstallPrompt state:', showInstallPrompt);
      setShowInstallPrompt(true);
    }, 1000);
    
    return () => window.removeEventListener('beforeinstallprompt', handler);
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

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center">
            <LogoSpinner size="lg" />
          </div>
          <div>
            <CardTitle className="text-2xl font-bold">Welcome to GabAi</CardTitle>
            <CardDescription className="text-muted-foreground mt-2">
              Your voice-first smart assistant for managing lists, appointments, and daily tasks
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button 
            onClick={() => login()}
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
            )}
          </Button>
          
          {/* Always show install button for debugging */}
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
          
          <div className="text-center text-sm text-muted-foreground">
            <p>Sign in to sync your data across all devices</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}