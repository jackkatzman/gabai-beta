import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/hooks/use-theme";
import { useAuth } from "@/hooks/useAuth";
import { UserProvider } from "@/context/user-context";
import HomePage from "@/pages/home";
import OnboardingPage from "@/pages/onboarding";
import { SharedListPage } from "@/pages/shared-list";
import LoginPage from "@/pages/login";
import SimpleLoginPage from "@/pages/simple-login";
import { OCRPage } from "@/pages/ocr";
import SettingsPage from "@/pages/settings";
import NotFound from "@/pages/not-found";
import { Skeleton } from "@/components/ui/skeleton";
import { Component, type ReactNode } from "react";

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

  // Debug logging (remove in production)
  console.log("🔍 Auth state:", { email: user?.email, isLoading, onboardingCompleted: user?.onboardingCompleted });
  console.log("🔍 App content rendering, user:", user, "isLoading:", isLoading);

  // Show loading while checking user state
  if (isLoading) {
    return (
      <div className="h-full flex flex-col">
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center space-x-3">
            <Skeleton className="w-8 h-8 rounded-full" />
            <Skeleton className="h-6 w-16" />
          </div>
          <Skeleton className="w-8 h-8 rounded-full" />
        </div>
        <div className="flex-1 p-4 space-y-4">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      </div>
    );
  }

  // Show main app for users who completed onboarding
  if (user?.onboardingCompleted === true) {
    return <HomePage />;
  }

  // If user exists but hasn't completed onboarding
  if (user && !user.onboardingCompleted) {
    console.log("📝 User needs onboarding");
    return <OnboardingPage />;
  }

  // No user - show login
  console.log("🔐 No user - showing login");
  return <LoginPage />;
}

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <TooltipProvider>
            <UserProvider>
              <div className="h-full font-sans antialiased bg-background text-foreground">
                <Toaster />
                <AppContent />
              </div>
            </UserProvider>
          </TooltipProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
