// Re-export shared types from schema
export type {
  User,
  Message,
  Conversation,
  SmartList,
  ListItem,
  Reminder,
  InsertUser,
  InsertMessage,
  InsertConversation,
  InsertSmartList,
  InsertListItem,
  InsertReminder,
} from "@shared/schema";

// Backward compatibility aliases
export type ShoppingList = SmartList;
export type ShoppingItem = ListItem;
export type InsertShoppingList = InsertSmartList;
export type InsertShoppingItem = InsertListItem;

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
  timezone?: string;
}

export interface VoiceSettings {
  enabled: boolean;
  language: string;
  voice?: string;
  autoPlay: boolean;
}

export interface ChatResponse {
  message: any;
  conversationId: string;
  suggestions?: string[];
  actions?: any[];
}