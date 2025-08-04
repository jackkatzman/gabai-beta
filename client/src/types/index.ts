// Re-export shared types from schema
export type {
  User,
  Message,
  Conversation,
  ShoppingList,
  ShoppingItem,
  Reminder,
  InsertUser,
  InsertMessage,
  InsertConversation,
  InsertShoppingList,
  InsertShoppingItem,
  InsertReminder,
} from "@shared/schema";

// Additional client-specific types
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

export interface VoiceSettings {
  enabled: boolean;
  language: string;
  voice?: string;
  autoPlay: boolean;
}

export interface ChatResponse {
  message: Message;
  conversationId: string;
  suggestions?: string[];
  actions?: any[];
}