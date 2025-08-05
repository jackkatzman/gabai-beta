import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { OnboardingFlow } from "@/components/onboarding/onboarding-flow";
import { api } from "@/lib/api";
import { useUser } from "@/context/user-context";
import { useToast } from "@/hooks/use-toast";
import type { OnboardingData } from "@/types";

export default function OnboardingPage() {
  const [, setLocation] = useLocation();
  const { user } = useUser();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const updateUserMutation = useMutation({
    mutationFn: (data: OnboardingData) => {
      if (!user?.id) throw new Error("User not found");
      return api.updateUser(user.id, {
        name: data.name,
        age: data.age,
        location: data.location,
        profession: data.profession,
        preferences: {
          religious: data.religious,
          dietary: data.dietary,
          sleepSchedule: data.sleepSchedule,
          communicationStyle: data.communicationStyle,
          interests: data.interests,
          familyDetails: data.familyDetails,
        },
        onboardingCompleted: true,
      });
    },
    onSuccess: (updatedUser) => {
      // Invalidate and refresh the user query
      queryClient.invalidateQueries({ queryKey: ["/auth/user"] });
      toast({
        title: "Welcome to GabAi!",
        description: "Your profile has been updated successfully.",
      });
      setLocation("/");
    },
    onError: (error: any) => {
      console.error("Onboarding error:", error);
      toast({
        title: "Setup Failed", 
        description: error.message || "Failed to update your profile. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleOnboardingComplete = (data: OnboardingData) => {
    updateUserMutation.mutate(data);
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
