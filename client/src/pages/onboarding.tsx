import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { OnboardingFlow } from "@/components/onboarding/onboarding-flow";
import { api } from "@/lib/api";
import { useUser } from "@/context/user-context";
import { useToast } from "@/hooks/use-toast";
import type { OnboardingData } from "@/types";

export default function OnboardingPage() {
  const [, setLocation] = useLocation();
  const { setUser } = useUser();
  const { toast } = useToast();

  const createUserMutation = useMutation({
    mutationFn: (data: OnboardingData) => api.createUser(data),
    onSuccess: (user) => {
      setUser(user);
      toast({
        title: "Welcome to GabAi!",
        description: "Your profile has been created successfully.",
      });
      setLocation("/");
    },
    onError: (error: any) => {
      toast({
        title: "Setup Failed",
        description: error.message || "Failed to create your profile. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleOnboardingComplete = (data: OnboardingData) => {
    createUserMutation.mutate(data);
  };

  const handleClose = () => {
    setLocation("/");
  };

  return (
    <OnboardingFlow
      onComplete={handleOnboardingComplete}
      onClose={handleClose}
    />
  );
}
