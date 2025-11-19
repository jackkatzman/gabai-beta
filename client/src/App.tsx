import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import SimpleAuthPage from "./pages/simple-auth";
import React, { Component, type ReactNode } from "react";
import { Switch, Route, useLocation, Router } from "wouter";
import { useAuth } from "./hooks/useAuth";
import { UserProvider } from "./context/user-context";
import HomePage from "./pages/home";
import OnboardingPage from "./pages/onboarding";
import { SharedListPage } from "./pages/shared-list";
import SimpleLoginPage from "./pages/simple-login";
import SettingsPage from "./pages/settings";
import { ContactsPage } from "./components/contacts/contacts-page";
import { SMSRemindersPage } from "./pages/sms-reminders";
import { SMSCompliancePage } from "./pages/sms-compliance";
import { LandingPage } from "./pages/landing";
import { MobileLandingPage } from "./pages/mobile-landing";
import AnalyticsPage from "./pages/analytics";
import DevTestPage from "./pages/dev-test";
import CordovaTestPage from "./pages/cordova-test";
import AboutPage from "./pages/about";
import PrivacyPage from "./pages/privacy";
import NotFound from "./pages/not-found";
import PhoneVerificationPage from "./pages/phone-verification";
import PasswordResetPage from "./pages/password-reset";
import GroupsPage from "./pages/groups";
import { isNativeMobileApp } from "./utils/capacitor";
import { setupDeepLinkHandler } from "./lib/deep-link-handler";
import { CordovaDirect } from "./lib/cordova-direct";

class ErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('React Error Boundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="h-full flex items-center justify-center p-4">
          <div className="text-center space-y-4">
            <h1 className="text-2xl font-bold text-red-600">Something went wrong</h1>
            <p className="text-gray-600">The application encountered an error.</p>
            <button 
              onClick={() => window.location.reload()} 
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Reload Page
            </button>
            {this.state.error && (
              <details className="text-left text-sm text-gray-500 mt-4">
                <summary>Error Details</summary>
                <pre className="mt-2 p-2 bg-gray-100 rounded overflow-auto">
                  {this.state.error.message}
                  {this.state.error.stack}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

function AppContent() {
  const { user, isLoading, authReady } = useAuth();
  const [location, setLocation] = useLocation();
  const [mobileAuthAttempted, setMobileAuthAttempted] = React.useState(false);

  console.log("🔍 Auth state:", { 
    user: !!user, 
    userName: user?.name,
    userId: user?.id,
    isLoading,
    authReady,
    onboarded: user?.onboardingCompleted,
    location,
    timestamp: new Date().toISOString()
  });
  
  // Fix incorrect hash routing from phone verification  
  React.useEffect(() => {
    // Check if we're on phone-verification with a hash route
    if (window.location.pathname === '/phone-verification' && window.location.hash === '#/chat') {
      console.log('🔄 Fixing incorrect URL: /phone-verification#/chat -> /chat');
      // Redirect to the correct chat URL
      window.location.hash = '#/chat'; // CHATGPT FIX: Use hash routing
    }
  }, []);

  // Add additional debugging and handle APK navigation
  React.useEffect(() => {
    console.log("🔍 Auth state changed:", { isLoading, authReady, hasUser: !!user }, new Date().toISOString());
    if (!authReady) {
      console.log("🔍 Auth not ready yet, waiting for authentication to settle...");
    }
    
    // If we have a user and auth is ready
    if (authReady && user) {
      // Check if user needs onboarding first (redirect from ANY page)
      if (!user.onboardingCompleted && location !== '/onboarding') {
        console.log('🚀 New user needs onboarding, redirecting to /onboarding');
        setLocation('/onboarding');
      } else if (location === '/' || location === '') {
        // Only redirect to chat if on root page and onboarding is complete
        console.log('🚀 User authenticated and auth ready, navigating to chat');
        setLocation('/chat');
      }
    }
  }, [authReady, user, location, setLocation]);

  return (
    <Switch>
      {/* Public routes - accessible without authentication */}
      <Route path="/about" component={AboutPage} />
      <Route path="/privacy" component={PrivacyPage} />
      <Route path="/landing" component={LandingPage} />
      <Route path="/sms-compliance" component={SMSCompliancePage} />
      <Route path="/shared/:shareCode" component={SharedListPage} />
      <Route path="/password-reset" component={PasswordResetPage} />
      <Route path="/auth" component={SimpleAuthPage} />
      
      {/* AuthReady Gate: Show loading while authentication is settling */}
      {!authReady && (
        <Route>
          {() => (
            <div className="h-full flex items-center justify-center bg-gray-50 dark:bg-gray-900" data-testid="auth-loading-screen">
              <div className="text-center p-6">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-700 dark:text-gray-300 text-lg">Authenticating...</p>
                <p className="text-gray-500 dark:text-gray-400 text-sm mt-2">Please wait while we verify your session</p>
              </div>
            </div>
          )}
        </Route>
      )}
      
      {/* Authenticated user routes - only render when authReady AND user exists */}
      {authReady && user && (
        <Switch>
          <Route path="/analytics" component={AnalyticsPage} />
          <Route path="/dev-test" component={DevTestPage} />
          <Route path="/cordova-test" component={CordovaTestPage} />
          <Route path="/simple-login" component={SimpleAuthPage} />
          <Route path="/settings" component={SettingsPage} />
          <Route path="/contacts" component={ContactsPage} />
          <Route path="/groups" component={GroupsPage} />
          <Route path="/sms-reminders" component={SMSRemindersPage} />
          <Route path="/reminders" component={SMSRemindersPage} />
          
          {/* Onboarding route - accessible after authentication */}
          <Route path="/onboarding" component={OnboardingPage} />
          
          {/* Protected routes - require authentication */}
          <Route path="/lists" component={HomePage} />
          <Route path="/calendar" component={HomePage} />
          <Route path="/chat" component={HomePage} />

          <Route path="/">
            {() => {
              // Check if user needs onboarding
              if (user.onboardingCompleted === false) {
                console.log("🚀 User needs onboarding, redirecting...");
                setLocation('/onboarding');
                return null;
              }
              // Show HomePage for users who completed onboarding
              return <HomePage />;
            }}
          </Route>
          
          <Route component={NotFound} />
        </Switch>
      )}
      
      {/* Non-authenticated user routes - only render when authReady AND no user */}
      {authReady && !user && (
        <Switch>
          <Route path="/simple-login" component={SimpleAuthPage} />
          <Route path="/mobile-auth" component={SimpleAuthPage} />
          <Route path="/phone-verification" component={PhoneVerificationPage} />
          <Route path="/sms-reminders" component={SMSRemindersPage} />
          <Route path="/reminders" component={SMSRemindersPage} />
          
          {/* Default route for non-authenticated users - show login */}
          <Route path="/">
            {() => {
              console.log("🏠 Showing SimpleAuth page for non-authenticated visitor (includes SMS auth)");
              return <SimpleAuthPage />;
            }}
          </Route>
          
          <Route component={NotFound} />
        </Switch>
      )}
    </Switch>
  );
}

// Hash router for APK environments
const useHashLocation = () => {
  const [location, setLocation] = React.useState(() => {
    const hash = window.location.hash.slice(1) || '/';
    return hash;
  });

  React.useEffect(() => {
    const handler = () => {
      const hash = window.location.hash.slice(1) || '/';
      setLocation(hash);
    };
    window.addEventListener('hashchange', handler);
    return () => window.removeEventListener('hashchange', handler);
  }, []);

  const navigate = React.useCallback((to: string) => {
    window.location.hash = to;
  }, []);

  return [location, navigate] as const;
};

export default function App() {
  // Detect if running as APK
  const isAPK = window.location.protocol === 'file:' || 
                window.location.hostname === 'localhost' ||
                typeof window.Android !== 'undefined';

  // Setup deep link handler for mobile OAuth and initialize Cordova
  React.useEffect(() => {
    setupDeepLinkHandler();
    
    // Initialize Cordova and permissions when app starts
    const initializeCordova = async () => {
      if (window.cordova) {
        console.log('📦 Cordova detected, waiting for deviceready...');
        document.addEventListener('deviceready', async () => {
          console.log('✅ Device ready!');
          
          // Log available plugins
          console.log('🔌 Available plugins:', {
            camera: !!navigator.camera,
            mediaCapture: !!navigator.device?.capture,
            diagnostic: !!window.cordova?.plugins?.diagnostic,
            permissions: !!window.cordova?.plugins?.permissions,
            contacts: !!(window.ContactsX || (window.navigator as any)?.contactsX),
            file: !!window.resolveLocalFileSystemURL
          });
          
          // Initialize direct Cordova implementation
          try {
            console.log('🔐 Initializing direct Cordova implementation...');
            await CordovaDirect.initialize();
            console.log('✅ Direct Cordova initialized');
            
            // Log available plugins (no permission requests)
            const plugins = CordovaDirect.getAvailablePlugins();
            console.log('📱 Available plugins:', plugins);
          } catch (error) {
            console.error('❌ Failed to initialize:', error);
          }
        }, false);
      } else {
        console.log('🌐 Running in web browser mode');
      }
    };
    
    initializeCordova();
  }, []);

  // Use hash routing for APK, regular routing for web
  const routerHook = React.useMemo(() => {
    if (isAPK) {
      console.log('📱 Using hash routing for APK');
      return useHashLocation;
    }
    console.log('🌐 Using regular routing for web');
    return undefined;
  }, [isAPK]);

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <Router hook={routerHook}>
          <UserProvider>
            <div className="h-full font-sans antialiased bg-gradient-to-br from-blue-50 to-indigo-100 text-gray-900 dark:from-gray-900 dark:to-gray-800 dark:text-gray-100">
              <AppContent />
            </div>
          </UserProvider>
        </Router>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
