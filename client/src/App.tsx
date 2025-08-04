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
import NotFound from "@/pages/not-found";
import { Skeleton } from "@/components/ui/skeleton";

function AppContent() {
  const { user, isLoading } = useAuth();

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

  return (
    <Switch>
      {/* If user exists and onboarding is complete, show main app */}
      {user && user.onboardingCompleted ? (
        <>
          <Route path="/" component={HomePage} />
          <Route path="/lists" component={HomePage} />
          <Route path="/calendar" component={HomePage} />
          <Route path="/reminders" component={HomePage} />
          <Route path="/settings" component={HomePage} />
        </>
      ) : user ? (
        <>
          {/* User exists but needs onboarding */}
          <Route path="/" component={OnboardingPage} />
          <Route path="/onboarding" component={OnboardingPage} />
        </>
      ) : (
        <>
          {/* No user - show login */}
          <Route path="/" component={LoginPage} />
          <Route path="/login" component={LoginPage} />
        </>
      )}
      
      {/* Public shared list route - accessible without login */}
      <Route path="/shared/:shareCode" component={SharedListPage} />
      
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
