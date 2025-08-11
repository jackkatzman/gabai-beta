import { apiRequest } from "./queryClient";
import type { User, Message, SmartList, ListItem, Reminder, InsertSmartList, InsertListItem } from "@shared/schema";

// Type aliases for backward compatibility
type ShoppingList = SmartList;
type ShoppingItem = ListItem;

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
    const response = await apiRequest("/api/users", "POST", {
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
    const response = await apiRequest(`/api/users/${id}`, "GET");
    return response.json();
  },

  async updateUser(id: string, updates: Partial<User>): Promise<User> {
    const response = await fetch(`/api/users/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include', // Ensure cookies are sent
      body: JSON.stringify(updates)
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`${response.status}: ${errorText}`);
    }
    
    return response.json();
  },

  // Chat operations
  async sendMessage(message: string, userId: string, conversationId?: string): Promise<{
    message: Message;
    conversationId: string;
    suggestions?: string[];
    actions?: any[];
  }> {
    const response = await apiRequest("/api/chat", "POST", {
      message,
      userId,
      conversationId,
    });
    return response.json();
  },

  async getMessages(conversationId: string): Promise<Message[]> {
    const response = await apiRequest(`/api/messages/${conversationId}`, "GET");
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

  // Get available voices
  async getVoices(): Promise<{ voices: any[], provider: string, default?: string }> {
    const response = await fetch("/api/voices");
    if (!response.ok) {
      throw new Error(`Failed to fetch voices: ${response.statusText}`);
    }
    return response.json();
  },

  // Smart list operations
  async getSmartLists(userId: string): Promise<(SmartList & { items: ListItem[] })[]> {
    const response = await apiRequest(`/api/smart-lists/${userId}`, "GET");
    return response.json();
  },

  async createSmartList(listData: InsertSmartList): Promise<SmartList> {
    const response = await apiRequest("/api/smart-lists", "POST", listData);
    return response.json();
  },

  async updateSmartList(id: string, updates: Partial<SmartList>): Promise<SmartList> {
    const response = await apiRequest(`/api/smart-lists/${id}`, "PATCH", updates);
    return response.json();
  },

  async shareList(listId: string): Promise<{ shareCode: string }> {
    const response = await apiRequest(`/api/smart-lists/${listId}/share`, "POST");
    return response.json();
  },

  async joinSharedList(shareCode: string, userId: string): Promise<SmartList> {
    const response = await apiRequest("/api/smart-lists/join", "POST", {
      shareCode,
      userId,
    });
    return response.json();
  },

  async getSharedList(shareCode: string): Promise<SmartList & { items: ListItem[] }> {
    const response = await apiRequest(`/api/shared/${shareCode}`, "GET");
    return response.json();
  },

  async addCollaborator(listId: string, email: string): Promise<SmartList> {
    const response = await apiRequest(`/api/smart-lists/${listId}/collaborators`, "POST", {
      email,
    });
    return response.json();
  },

  async searchUserByEmail(email: string): Promise<{id: string, email: string, firstName?: string, lastName?: string}> {
    const response = await apiRequest(`/api/users/search?email=${encodeURIComponent(email)}`, "GET");
    return response.json();
  },

  async createListItem(itemData: InsertListItem): Promise<ListItem> {
    const response = await apiRequest("/api/list-items", "POST", itemData);
    return response.json();
  },

  async updateListItem(id: string, updates: Partial<ListItem>): Promise<ListItem> {
    const response = await apiRequest(`/api/list-items/${id}`, "PATCH", updates);
    return response.json();
  },

  async deleteListItem(id: string): Promise<void> {
    await apiRequest(`/api/list-items/${id}`, "DELETE");
  },

  async toggleListItem(id: string): Promise<ListItem> {
    const response = await apiRequest(`/api/list-items/${id}/toggle`, "PATCH");
    return response.json();
  },

  // Backward compatibility aliases
  async getShoppingLists(userId: string): Promise<(ShoppingList & { items: ShoppingItem[] })[]> {
    return this.getSmartLists(userId);
  },

  async createShoppingList(userId: string, name: string): Promise<ShoppingList> {
    return this.createSmartList({
      userId,
      name,
      type: "shopping",
      categories: ["Produce", "Dairy", "Meat", "Pantry", "Frozen", "Beverages", "Household"],
    });
  },

  async createShoppingItem(listId: string, name: string, category?: string): Promise<ShoppingItem> {
    return this.createListItem({
      listId,
      name,
      category,
    });
  },

  async updateShoppingItem(id: string, updates: Partial<ShoppingItem>): Promise<ShoppingItem> {
    return this.updateListItem(id, updates);
  },

  async deleteShoppingItem(id: string): Promise<void> {
    return this.deleteListItem(id);
  },

  // Reminder operations
  async getReminders(userId: string): Promise<Reminder[]> {
    const response = await apiRequest(`/api/reminders/${userId}`, "GET");
    return response.json();
  },

  async createReminder(reminderData: Omit<Reminder, "id" | "createdAt" | "updatedAt">): Promise<Reminder> {
    const response = await apiRequest("/api/reminders", "POST", reminderData);
    return response.json();
  },

  async updateReminder(id: string, updates: Partial<Reminder>): Promise<Reminder> {
    const response = await apiRequest(`/api/reminders/${id}`, "PATCH", updates);
    return response.json();
  },

  async deleteReminder(id: string): Promise<void> {
    await apiRequest(`/api/reminders/${id}`, "DELETE");
  },

  // Contact operations
  async getContacts(userId: string): Promise<any[]> {
    const response = await apiRequest(`/api/contacts/${userId}`, "GET");
    return response.json();
  },

  async createContact(contactData: any): Promise<any> {
    const response = await apiRequest("/api/contacts", "POST", contactData);
    return response.json();
  },

  async downloadVCard(contactId: string): Promise<void> {
    window.open(`/api/contacts/${contactId}/vcard`, '_blank');
  },

  async processBusinessCard(imageFile: File, userId: string): Promise<any> {
    const formData = new FormData();
    formData.append('image', imageFile);
    formData.append('userId', userId);
    
    const response = await fetch('/api/ocr/business-card', {
      method: 'POST',
      body: formData,
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return response.json();
  },
};
