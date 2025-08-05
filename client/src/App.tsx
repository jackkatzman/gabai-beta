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
import { SettingsPage } from "@/pages/settings";
import NotFound from "@/pages/not-found";
import { Skeleton } from "@/components/ui/skeleton";

function AppContent() {
  const { user, isLoading } = useAuth();

  // Debug logging
  console.log("🔍 AppContent - User:", user);
  console.log("🔍 AppContent - isLoading:", isLoading);
  console.log("🔍 AppContent - onboardingCompleted:", user?.onboardingCompleted);

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

  // Force show main app if user has completed onboarding
  if (user && user.onboardingCompleted) {
    console.log("✅ Showing main app for authenticated user");
    console.log("🏠 Rendering HomePage component");
    return <HomePage />;
  }

  return (
    <Switch>
      {/* User exists but needs onboarding */}
      {user ? (
        <>
          <Route path="/" component={OnboardingPage} />
          <Route path="/onboarding" component={OnboardingPage} />
        </>
      ) : (
        <>
          {/* No user - show Google OAuth login */}
          <Route path="/" component={LoginPage} />
          <Route path="/login" component={LoginPage} />
          <Route path="/simple-login" component={SimpleLoginPage} />
        </>
      )}
      
      {/* Public shared list route - accessible without login */}
      <Route path="/shared/:shareCode" component={SharedListPage} />
      
      {/* OCR route accessible even without full authentication */}
      <Route path="/ocr" component={OCRPage} />
      
      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
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
  );
}

export default App;
