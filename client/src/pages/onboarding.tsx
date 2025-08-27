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
    mutationFn: async (data: OnboardingData) => {
      console.log("🚀 Starting onboarding submission");
      
      try {
        // Always fetch the current authenticated user to ensure we have the latest info
        const response = await fetch("/api/auth/user", {
          credentials: 'include',
          headers: {
            'Accept': 'application/json',
          }
        });
        
        console.log("📡 Auth check response status:", response.status);
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error("❌ Auth check failed:", response.status, errorText);
          
          if (response.status === 401) {
            throw new Error("Please sign in again to complete your profile setup.");
          }
          throw new Error(`Authentication error: ${errorText}`);
        }
        
        const currentUser = await response.json();
        console.log("✅ Current authenticated user:", currentUser?.id);
        
        if (!currentUser?.id) {
          throw new Error("No user found. Please sign in again.");
        }
        
        // Prepare the update data
        const updateData = {
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
        };
        
        console.log("📝 Submitting profile update for user:", currentUser.id);
        
        // Use the API helper which already includes credentials
        return await api.updateUser(currentUser.id, updateData);
        
      } catch (error: any) {
        console.error("💥 Onboarding submission failed:", error);
        throw error;
      }
    },
    onSuccess: (updatedUser) => {
      // Invalidate and refresh the user query with correct key
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      toast({
        title: "Welcome to GabAi!",
        description: "Your profile has been updated successfully.",
      });
      // Small delay to ensure query updates
      setTimeout(() => setLocation("/"), 500);
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
