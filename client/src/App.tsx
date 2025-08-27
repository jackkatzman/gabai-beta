import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
// Toaster removed - using native notifications with Capacitor
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/hooks/use-theme";

import { useAuth } from "@/hooks/useAuth";
import { useSimpleAuth } from "@/hooks/useSimpleAuth";
import { UserProvider } from "@/context/user-context";
import HomePage from "@/pages/home";
import OnboardingPage from "@/pages/onboarding";
import { SharedListPage } from "@/pages/shared-list";
import LoginPage from "@/pages/login";
import SimpleLoginPage from "@/pages/simple-login";
import { OCRPage } from "@/pages/ocr";
import SettingsPage from "@/pages/settings";
import { ContactsPage } from "@/components/contacts/contacts-page";
import { AlarmsPage } from "@/pages/alarms";
import { LandingPage } from "@/pages/landing";
import AnalyticsPage from "@/pages/analytics";
import DevTestPage from "@/pages/dev-test";
import React from "react";
import { isNativeMobileApp } from "@/utils/capacitor";
import { setupDeepLinkHandler } from "@/lib/deep-link-handler";
import { shouldUseMobileBypass, createMobileTestUser } from "@/utils/mobile-bypass-auth";

import NotFound from "@/pages/not-found";
import { Skeleton } from "@/components/ui/skeleton";
import { Component, type ReactNode } from "react";
// ThemeProvider temporarily removed due to React hook conflict

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
  const { user, isLoading } = useAuth();
  const [mobileAuthAttempted, setMobileAuthAttempted] = React.useState(false);

  console.log("🔍 Auth state:", { 
    user: !!user, 
    userName: user?.name,
    userId: user?.id,
    isLoading,
    onboarded: user?.onboardingCompleted,
    timestamp: new Date().toISOString()
  });

  // Add additional debugging to understand why isLoading stays true
  React.useEffect(() => {
    console.log("🔍 Auth loading changed:", isLoading, new Date().toISOString());
    if (isLoading) {
      console.log("🔍 Still loading... checking for stuck state");
    }
  }, [isLoading]);

  // Show simple loading for all environments
  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center p-6">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-700 dark:text-gray-300 text-lg">Loading...</p>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-2">Please wait</p>
        </div>
      </div>
    );
  }



  // Not authenticated - show login page
  if (!user) {
    console.log("🚫 No authenticated user - showing login");
    return <LoginPage />;
  }

  console.log("✅ Authenticated user found - showing main app", user.name);

  return (
    <Switch>
      <Route path="/analytics" component={AnalyticsPage} />
      <Route path="/dev-test" component={DevTestPage} />
      <Route path="/simple-login" component={SimpleLoginPage} />
      <Route path="/shared/:listId" component={SharedListPage} />
      <Route path="/ocr" component={OCRPage} />
      <Route path="/settings" component={SettingsPage} />
      <Route path="/contacts" component={ContactsPage} />
      <Route path="/alarms" component={AlarmsPage} />
      
      {/* Onboarding route - accessible after authentication */}
      <Route path="/onboarding">
        {() => {
          if (user && !user.onboardingCompleted) {
            return <OnboardingPage />;
          }
          if (user?.onboardingCompleted === true) {
            return <HomePage />;
          }
          return <LoginPage />;
        }}
      </Route>
      
      {/* Protected routes - require authentication */}
      <Route path="/lists">
        {() => {
          if (user?.onboardingCompleted === true) {
            return <HomePage />;
          }
          if (user && !user.onboardingCompleted) {
            return <OnboardingPage />;
          }
          return <LoginPage />;
        }}
      </Route>
      
      <Route path="/calendar">
        {() => {
          if (user?.onboardingCompleted === true) {
            return <HomePage />;
          }
          if (user && !user.onboardingCompleted) {
            return <OnboardingPage />;
          }
          return <LoginPage />;
        }}
      </Route>

      <Route path="/">
        {() => {
          // For mobile apps, prioritize demo experience
          if (isNativeMobileApp() && user) {
            console.log('📱 Mobile app with user detected - showing HomePage');
            return <HomePage />;
          }
          
          // Show main app for users who completed onboarding
          if (user?.onboardingCompleted === true) {
            return <HomePage />;
          }

          if (user && !user.onboardingCompleted) {
            return <OnboardingPage />;
          }

          // Go directly to login for better user experience
          return <LoginPage />;
        }}
      </Route>
      
      {/* Landing page available at /landing for marketing */}
      <Route path="/landing" component={LandingPage} />
      
      {/* Mobile authentication route - bypasses any caching */}
      <Route path="/mobile-auth">
        {() => {
          console.log('📱 Mobile auth route accessed');
          return <LoginPage />;
        }}
      </Route>
      
      <Route component={NotFound} />
    </Switch>
  );
}

export default function App() {
  // Setup deep link handler for mobile OAuth
  React.useEffect(() => {
    setupDeepLinkHandler();
  }, []);

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <UserProvider>
          <ThemeProvider>
            <TooltipProvider>
              <div className="h-full font-sans antialiased bg-gradient-to-br from-blue-50 to-indigo-100 text-gray-900 dark:from-gray-900 dark:to-gray-800 dark:text-gray-100">
                <AppContent />
              </div>
            </TooltipProvider>
          </ThemeProvider>
        </UserProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
