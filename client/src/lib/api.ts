import { apiRequest } from "./queryClient";
import type { User, Message, ShoppingList, ShoppingItem, Reminder } from "@shared/schema";

export interface OnboardingData {
  name: string;
  age?: number;
  location?: string;
  profession?: string;
  email?: string;
  religious?: string;
  dietary?: string[];
  sleepSchedule?: {
    bedtime: string;
    wakeup: string;
  };
  communicationStyle?: string;
  interests?: string[];
  familyDetails?: string;
}

export const api = {
  // User operations
  async createUser(userData: OnboardingData): Promise<User> {
    const response = await apiRequest("POST", "/api/users", {
      ...userData,
      preferences: {
        religious: userData.religious,
        dietary: userData.dietary,
        sleepSchedule: userData.sleepSchedule,
        communicationStyle: userData.communicationStyle,
        interests: userData.interests,
        familyDetails: userData.familyDetails,
      },
      onboardingCompleted: true,
    });
    return response.json();
  },

  async getUser(id: string): Promise<User> {
    const response = await apiRequest("GET", `/api/users/${id}`);
    return response.json();
  },

  async updateUser(id: string, updates: Partial<User>): Promise<User> {
    const response = await apiRequest("PATCH", `/api/users/${id}`, updates);
    return response.json();
  },

  // Chat operations
  async sendMessage(message: string, userId: string, conversationId?: string): Promise<{
    message: Message;
    conversationId: string;
    suggestions?: string[];
    actions?: any[];
  }> {
    const response = await apiRequest("POST", "/api/chat", {
      message,
      userId,
      conversationId,
    });
    return response.json();
  },

  async getMessages(conversationId: string): Promise<Message[]> {
    const response = await apiRequest("GET", `/api/messages/${conversationId}`);
    return response.json();
  },

  // Voice operations
  async transcribeAudio(audioBlob: Blob): Promise<{ text: string }> {
    const formData = new FormData();
    formData.append("audio", audioBlob, "audio.wav");

    const response = await fetch("/api/transcribe", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Transcription failed: ${response.statusText}`);
    }

    return response.json();
  },

  async generateSpeech(text: string): Promise<Blob> {
    const response = await fetch("/api/speak", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });

    if (!response.ok) {
      throw new Error(`Speech generation failed: ${response.statusText}`);
    }

    return response.blob();
  },

  // Shopping list operations
  async getShoppingLists(userId: string): Promise<ShoppingList[]> {
    const response = await apiRequest("GET", `/api/shopping-lists/${userId}`);
    return response.json();
  },

  async createShoppingList(userId: string, name: string): Promise<ShoppingList> {
    const response = await apiRequest("POST", "/api/shopping-lists", {
      userId,
      name,
    });
    return response.json();
  },

  async createShoppingItem(listId: string, name: string, category?: string): Promise<ShoppingItem> {
    const response = await apiRequest("POST", "/api/shopping-items", {
      listId,
      name,
      category,
    });
    return response.json();
  },

  async updateShoppingItem(id: string, updates: Partial<ShoppingItem>): Promise<ShoppingItem> {
    const response = await apiRequest("PATCH", `/api/shopping-items/${id}`, updates);
    return response.json();
  },

  async deleteShoppingItem(id: string): Promise<void> {
    await apiRequest("DELETE", `/api/shopping-items/${id}`);
  },

  // Reminder operations
  async getReminders(userId: string): Promise<Reminder[]> {
    const response = await apiRequest("GET", `/api/reminders/${userId}`);
    return response.json();
  },

  async createReminder(reminderData: Omit<Reminder, "id" | "createdAt" | "updatedAt">): Promise<Reminder> {
    const response = await apiRequest("POST", "/api/reminders", reminderData);
    return response.json();
  },

  async updateReminder(id: string, updates: Partial<Reminder>): Promise<Reminder> {
    const response = await apiRequest("PATCH", `/api/reminders/${id}`, updates);
    return response.json();
  },

  async deleteReminder(id: string): Promise<void> {
    await apiRequest("DELETE", `/api/reminders/${id}`);
  },
};
