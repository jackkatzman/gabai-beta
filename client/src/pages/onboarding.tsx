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
      console.log("Starting onboarding submission for user:", user);
      
      // If no user in context, try to fetch current authenticated user
      if (!user?.id) {
        console.log("No user in context, fetching current user...");
        try {
          const response = await fetch("/api/auth/user", {
            credentials: 'include' // Ensure cookies are sent
          });
          console.log("Auth response status:", response.status);
          
          if (!response.ok) {
            const errorText = await response.text();
            console.error("Auth check failed:", errorText);
            throw new Error("Not authenticated. Please sign in again.");
          }
          
          const currentUser = await response.json();
          console.log("Found current user:", currentUser);
          
          if (!currentUser?.id) {
            throw new Error("No authenticated user found. Please sign in again.");
          }
          
          // Use the fetched user ID - make the API call with credentials
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
          
          console.log("Submitting update data for user:", currentUser.id, updateData);
          
          // Make the update API call directly with fetch to ensure credentials
          const updateResponse = await fetch(`/api/users/${currentUser.id}`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify(updateData)
          });
          
          console.log("Update response status:", updateResponse.status);
          
          if (!updateResponse.ok) {
            const errorText = await updateResponse.text();
            console.error("Update failed:", errorText);
            throw new Error(`Update failed: ${errorText}`);
          }
          
          return updateResponse.json();
        } catch (error) {
          console.error("Failed to update user:", error);
          throw error;
        }
      }
      
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
      
      console.log("Submitting update data:", updateData);
      return api.updateUser(user.id, updateData);
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
