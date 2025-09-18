import { apiRequest } from "./queryClient";
import { CordovaNative } from "./cordova-native";
import { api as bulletproofApi } from "./api-bulletproof";
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

  async createConversation(data: { userId: string }): Promise<{ id: string }> {
    const response = await apiRequest("/api/conversations", "POST", data);
    return response.json();
  },

  async updateUser(id: string, updates: Partial<User>): Promise<User> {
    return await bulletproofApi(`/api/users/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates)
    });
  },

  // Chat operations
  async sendMessage(message: string, userId: string, conversationId?: string, imageData?: string): Promise<{
    message: Message;
    userMessage: Message;
    conversationId: string;
    suggestions?: string[];
    actions?: any[];
  }> {
    const response = await apiRequest("/api/chat", "POST", {
      message,
      userId,
      conversationId,
      imageData,
    });
    return response.json();
  },

  async getMessages(conversationId: string): Promise<Message[]> {
    const response = await apiRequest(`/api/messages/${conversationId}`, "GET");
    return response.json();
  },

  // Voice operations
  async transcribeAudio(audioBlob: Blob): Promise<{ text: string }> {
    // Defensive check - ensure we have a proper Blob
    if (!(audioBlob instanceof Blob)) {
      console.error('❌ transcribeAudio received non-Blob:', {
        type: typeof audioBlob,
        constructor: (audioBlob as any)?.constructor?.name,
        value: audioBlob
      });
      throw new Error('transcribeAudio requires a Blob object');
    }

    // Choose filename based on MIME type
    let filename = 'audio.bin'; // Default fallback
    const mimeType = audioBlob.type || 'application/octet-stream';
    
    console.log('🎤 Transcribing audio:', {
      mimeType,
      size: audioBlob.size,
      isBlob: audioBlob instanceof Blob
    });
    
    if (mimeType.includes('mp4') || mimeType.includes('m4a')) {
      filename = 'audio.m4a';
    } else if (mimeType.includes('mpeg')) {
      filename = 'audio.mp3';  // Use mp3 extension for audio/mpeg
    } else if (mimeType.includes('3gpp') || mimeType.includes('3gp')) {
      filename = 'audio.3gp';
    } else if (mimeType.includes('amr')) {
      filename = 'audio.amr';
    } else if (mimeType.includes('webm')) {
      filename = 'audio.webm';
    } else if (mimeType.includes('wav')) {
      filename = 'audio.wav';
    }

    const formData = new FormData();
    formData.append("audio", audioBlob, filename);

    // Check if we're in production or development
    // APK uses file:// protocol, production uses gabai.ai domain
    const isProduction = window.location.hostname === 'gabai.ai' || 
                         window.location.protocol === 'file:';
    const finalUrl = isProduction ? "https://gabai.ai/api/transcribe" : "/api/transcribe";
    
    console.log('📤 Sending transcription request to:', finalUrl, {
      hostname: window.location.hostname,
      protocol: window.location.protocol,
      isProduction
    });

    const transcribeResponse = await fetch(finalUrl, {
      method: "POST",
      body: formData,
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('gabai_token') || sessionStorage.getItem('gabai_token') || ''}`
      }
    });

    if (!transcribeResponse.ok) {
      const errorText = await transcribeResponse.text();
      console.error('❌ Transcription failed:', transcribeResponse.status, errorText);
      throw new Error(`Transcription failed: ${transcribeResponse.statusText}`);
    }

    return transcribeResponse.json();
  },

  async generateSpeech(text: string): Promise<Blob> {
    // For blob responses, we need to handle this specially
    const token = localStorage.getItem('gabai_token') || sessionStorage.getItem('gabai_token');
    const response = await fetch("/api/speak", {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        ...(token && { "Authorization": `Bearer ${token}` })
      },
      body: JSON.stringify({ text }),
    });

    if (!response.ok) {
      throw new Error(`Speech generation failed: ${response.statusText}`);
    }

    return response.blob();
  },

  // Get available voices
  async getVoices(): Promise<{ voices: any[], provider: string, default?: string }> {
    return await bulletproofApi('/api/voices');
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

  async deleteSmartList(id: string): Promise<void> {
    await apiRequest(`/api/smart-lists/${id}`, "DELETE");
  },

  async generateListName(user: User): Promise<{ name: string }> {
    const response = await apiRequest("/api/generate-list-name", "POST", { 
      userId: user.id,
      userPreferences: user.preferences,
      profession: user.profession || "general"
    });
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

  async updateContact(contactId: string, contactData: any): Promise<any> {
    const response = await apiRequest(`/api/contacts/${contactId}`, "PATCH", contactData);
    return response.json();
  },

  async deleteContact(contactId: string): Promise<void> {
    await apiRequest(`/api/contacts/${contactId}`, "DELETE");
  },

  async downloadVCard(contactId: string): Promise<void> {
    try {
      // Check if Cordova native is available
      if (CordovaNative.isAvailable()) {
        console.log('📇 Using native Cordova VCard download');
        
        // Fetch the VCard data using bulletproof API
        const token = localStorage.getItem('gabai_token') || sessionStorage.getItem('gabai_token');
        const response = await fetch(`/api/contacts/${contactId}/vcard`, {
          method: 'GET',
          headers: {
            'Accept': 'text/vcard, application/octet-stream, */*',
            ...(token && { 'Authorization': `Bearer ${token}` })
          }
        });
        
        if (!response.ok) {
          throw new Error(`Failed to download VCard: ${response.statusText}`);
        }
        
        const blob = await response.blob();
        const contentDisposition = response.headers.get('Content-Disposition');
        const filename = contentDisposition 
          ? contentDisposition.split('filename=')[1]?.replace(/"/g, '') 
          : 'contact.vcf';
        
        // Use native file opener
        await CordovaNative.openVcfFile(blob, filename);
        return;
      }
      
      // Check if we're in APK/WebView environment (without Cordova)
      const isAPK = window.location.protocol === 'file:' || 
                    (window as any).IS_APK || 
                    (window as any).IS_VOLTBUILDER_APK ||
                    /wv|Android/.test(navigator.userAgent);
      
      // Get auth token for APK
      let gabaiToken = localStorage.getItem('gabai_token') || 
                       sessionStorage.getItem('gabai_token') || 
                       localStorage.getItem('token') || 
                       sessionStorage.getItem('token');
      
      // Build download URL
      const baseUrl = isAPK ? 'https://gabai.ai' : window.location.origin;
      const downloadUrl = gabaiToken 
        ? `${baseUrl}/api/contacts/${contactId}/vcard?token=${encodeURIComponent(gabaiToken)}`
        : `${baseUrl}/api/contacts/${contactId}/vcard`;
      
      console.log('📇 VCard download URL:', downloadUrl);
      
      // For APK/WebView, always use absolute URL and open in system browser
      if (isAPK) {
        console.log('📱 APK detected - opening VCard in system browser');
        
        // Ensure URL is absolute
        const absoluteUrl = downloadUrl.startsWith('http') ? downloadUrl : 
                           downloadUrl.startsWith('//') ? `https:${downloadUrl}` :
                           `https://gabai.ai${downloadUrl}`;
        
        console.log('📧 Opening absolute URL:', absoluteUrl);
        
        // Try multiple methods to open in system browser
        if ((window as any).cordova?.InAppBrowser) {
          (window as any).cordova.InAppBrowser.open(absoluteUrl, '_system');
        } else {
          // Fallback to window.open with _system
          window.open(absoluteUrl, '_system');
        }
        return;
      }
      
      // For web, use standard download with bulletproof API
      const token = localStorage.getItem('gabai_token') || sessionStorage.getItem('gabai_token');
      const response = await fetch(`/api/contacts/${contactId}/vcard`, {
        method: 'GET',
        headers: {
          'Accept': 'text/vcard, application/octet-stream, */*',
          ...(token && { 'Authorization': `Bearer ${token}` })
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to download VCard: ${response.statusText}`);
      }
      
      const blob = await response.blob();
      const contentDisposition = response.headers.get('Content-Disposition');
      const filename = contentDisposition 
        ? contentDisposition.split('filename=')[1]?.replace(/"/g, '') 
        : 'contact.vcf';
      
      // Web download
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.style.display = 'none';
      document.body.appendChild(a);
      
      // Trigger download
      a.click();
      
      // Cleanup
      setTimeout(() => {
        window.URL.revokeObjectURL(url);
        if (document.body.contains(a)) {
          document.body.removeChild(a);
        }
      }, 2000);
    } catch (error) {
      console.error('VCard download error:', error);
      // Fallback to direct link
      window.open(`/api/contacts/${contactId}/vcard`, '_blank');
    }
  },

  async processBusinessCard(imageFile: File, userId: string): Promise<any> {
    const formData = new FormData();
    formData.append('image', imageFile);
    formData.append('userId', userId);
    
    // For FormData uploads, use bulletproof API approach
    const token = localStorage.getItem('gabai_token') || sessionStorage.getItem('gabai_token');
    const response = await fetch('/api/ocr/business-card', {
      method: 'POST',
      body: formData,
      headers: {
        ...(token && { 'Authorization': `Bearer ${token}` })
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return response.json();
  },
};
