import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
// Toaster removed - using native notifications with Capacitor
import { TooltipProvider } from "@/components/ui/tooltip";

import { useAuth } from "@/hooks/useAuth";
import { UserProvider } from "@/context/user-context";
import HomePage from "@/pages/home";
import OnboardingPage from "@/pages/onboarding";
import { SharedListPage } from "@/pages/shared-list";
import LoginPage from "@/pages/login";
import SimpleLoginPage from "@/pages/simple-login";
import { OCRPage } from "@/pages/ocr";
import SettingsPage from "@/pages/settings";
import { ContactsPage } from "@/components/contacts/contacts-page";
import AnalyticsPage from "@/pages/analytics";

import NotFound from "@/pages/not-found";
import { Skeleton } from "@/components/ui/skeleton";
import { Component, type ReactNode } from "react";
// import { ThemeProvider } from "@/hooks/use-theme";

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

  console.log("Auth state:", { user: !!user, isLoading, onboarded: user?.onboardingCompleted });

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <Switch>
      <Route path="/analytics" component={AnalyticsPage} />
      <Route path="/simple-login" component={SimpleLoginPage} />
      <Route path="/shared/:listId" component={SharedListPage} />
      <Route path="/ocr" component={OCRPage} />
      <Route path="/settings" component={SettingsPage} />
      <Route path="/contacts" component={ContactsPage} />
      <Route path="/">
        {() => {
          // Show main app for users who completed onboarding
          if (user?.onboardingCompleted === true) {
            return <HomePage />;
          }

          if (user && !user.onboardingCompleted) {
            return <OnboardingPage />;
          }

          return <LoginPage />;
        }}
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ErrorBoundary>
        <TooltipProvider>
          <UserProvider>
            <div className="h-full font-sans antialiased bg-gray-50 text-gray-900">
              {/* Native notifications handled by Capacitor */}
              <AppContent />
            </div>
          </UserProvider>
        </TooltipProvider>
      </ErrorBoundary>
    </QueryClientProvider>
  );
}

export default App;
