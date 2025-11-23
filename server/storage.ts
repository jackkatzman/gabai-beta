import {
  users,
  conversations,
  messages,
  smartLists,
  listItems,
  reminders,
  contacts,
  magicLinkTokens,
  smsVerificationCodes,
  userPatterns,
  activityLog,
  groups,
  groupMembers,
  type User,
  type InsertUser,
  type Conversation,
  type InsertConversation,
  type Message,
  type InsertMessage,
  type SmartList,
  type InsertSmartList,
  type ListItem,
  type InsertListItem,
  type Reminder,
  type InsertReminder,
  type Contact,
  type InsertContact,
  type MagicLinkToken,
  type InsertMagicLinkToken,
  type SmsVerificationCode,
  type InsertSmsVerificationCode,
  type UserPattern,
  type InsertUserPattern,
  type ActivityLog,
  type InsertActivityLog,
  type Group,
  type InsertGroup,
  type GroupMember,
  type InsertGroupMember,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, sql } from "drizzle-orm";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByPhone(phone: string): Promise<User | undefined>;
  getUserByResetToken(token: string): Promise<User | undefined>;
  getUserByToken(token: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<InsertUser>): Promise<User>;
  deleteUser(id: string): Promise<void>;
  
  // Conversation operations
  getConversations(userId: string): Promise<Conversation[]>;
  createConversation(conversation: InsertConversation): Promise<Conversation>;
  getConversation(id: string): Promise<Conversation | undefined>;
  deleteConversation(id: string): Promise<void>;
  
  // Message operations
  getMessages(conversationId: string): Promise<Message[]>;
  createMessage(message: InsertMessage): Promise<Message>;
  updateMessage(id: string, updates: Partial<InsertMessage>): Promise<Message>;
  deleteMessage(id: string): Promise<void>;
  
  // Smart list operations
  getSmartLists(userId: string): Promise<(SmartList & { items: ListItem[] })[]>;
  createSmartList(list: InsertSmartList): Promise<SmartList>;
  getSmartList(id: string): Promise<(SmartList & { items: ListItem[] }) | undefined>;
  updateSmartList(id: string, updates: Partial<InsertSmartList>): Promise<SmartList>;
  deleteSmartList(id: string): Promise<void>;
  getSharedList(shareCode: string): Promise<(SmartList & { items: ListItem[] }) | undefined>;
  shareList(id: string): Promise<string>; // Returns share code
  joinSharedList(shareCode: string, userId: string): Promise<SmartList>;
  addCollaborator(listId: string, collaboratorId: string): Promise<SmartList>;
  
  // List item operations
  getListItems(listId: string): Promise<ListItem[]>;
  getListItem(id: string): Promise<ListItem | undefined>;
  createListItem(item: InsertListItem): Promise<ListItem>;
  updateListItem(id: string, updates: Partial<InsertListItem>): Promise<ListItem>;
  deleteListItem(id: string): Promise<void>;
  toggleListItem(id: string): Promise<ListItem>;
  
  // Permission checking
  canUserEditList(userId: string, listId: string): Promise<boolean>;
  
  // Reminder operations
  getReminders(userId: string): Promise<Reminder[]>;
  getReminder(id: string): Promise<Reminder | undefined>;
  createReminder(reminder: InsertReminder): Promise<Reminder>;
  updateReminder(id: string, updates: Partial<InsertReminder>): Promise<Reminder>;
  deleteReminder(id: string): Promise<void>;

  // Contact operations
  getContacts(userId: string): Promise<Contact[]>;
  createContact(contact: InsertContact): Promise<Contact>;
  getContact(id: string): Promise<Contact | undefined>;
  updateContact(id: string, updates: Partial<InsertContact>): Promise<Contact>;
  deleteContact(id: string): Promise<void>;

  // Group management operations
  getGroups(userId: string): Promise<(Group & { members: GroupMember[] })[]>;
  getGroup(id: string): Promise<(Group & { members: GroupMember[] }) | undefined>;
  createGroup(group: InsertGroup): Promise<Group>;
  updateGroup(id: string, updates: Partial<InsertGroup>): Promise<Group>;
  deleteGroup(id: string): Promise<void>;
  getGroupMembers(groupId: string): Promise<GroupMember[]>;
  addGroupMember(member: InsertGroupMember): Promise<GroupMember>;
  removeGroupMember(id: string): Promise<void>;
  
  // Subscription operations
  startTrial(userId: string, durationDays: number): Promise<User>;
  checkSubscriptionStatus(userId: string): Promise<{ isPremium: boolean; trialEnded: boolean; subscriptionStatus: string }>;

  // Magic link token operations
  createMagicLinkToken(token: InsertMagicLinkToken): Promise<MagicLinkToken>;
  getMagicLinkToken(token: string): Promise<MagicLinkToken | undefined>;
  getAllMagicLinkTokens(): Promise<MagicLinkToken[]>;
  useMagicLinkToken(token: string): Promise<void>;
  cleanupExpiredTokens(): Promise<void>;

  // SMS verification operations
  createSmsVerificationCode(verification: InsertSmsVerificationCode): Promise<SmsVerificationCode>;
  verifySmsCode(phoneNumber: string, code: string): Promise<{ success: boolean; error?: string }>;
  cleanupExpiredSmsVerificationCodes(): Promise<void>;

  // Pattern recognition operations
  createUserPattern(pattern: InsertUserPattern): Promise<UserPattern>;
  getUserPatterns(userId: string): Promise<UserPattern[]>;
  updateUserPattern(id: string, updates: Partial<InsertUserPattern>): Promise<UserPattern>;
  findSimilarPattern(userId: string, activity: string): Promise<UserPattern | undefined>;
  
  // Activity logging operations
  createActivityLog(log: InsertActivityLog): Promise<ActivityLog>;
  getActivityLogs(userId: string, days: number): Promise<ActivityLog[]>;

  // Admin analytics operations
  getUserCount(): Promise<number>;
  getConversationCount(): Promise<number>;
  getMessageCount(): Promise<number>;
  getSmartListCount(): Promise<number>;
  getListItemCount(): Promise<number>;
  getReminderCount(): Promise<number>;
  getContactCount(): Promise<number>;
  getRecentUsers(limit: number): Promise<Array<{
    id: string;
    name: string;
    email: string;
    createdAt: string;
    lastActive: string;
    messageCount: number;
  }>>;

  // Enhanced analytics operations
  getUserGrowthMetrics(): Promise<{
    daily: number;
    weekly: number;
    monthly: number;
  }>;
  getUserLocationData(): Promise<Array<{
    country: string;
    region: string;
    count: number;
    percentage: number;
  }>>;
  getUserTimezoneData(): Promise<Array<{
    timezone: string;
    count: number;
    percentage: number;
  }>>;
  getUserDemographics(): Promise<{
    averageAge: number;
    professions: Array<{ profession: string; count: number; }>;
    onboardingCompletion: number;
  }>;
  getConversationMetrics(): Promise<{
    totalConversations: number;
    averageMessagesPerConversation: number;
    averageResponseTime: number;
    topTopics: Array<{ topic: string; frequency: number; }>;
    voiceUsagePercent: number;
    messagesLast24h: number;
    messagesLast7d: number;
    messagesLast30d: number;
  }>;
  getFeatureUsageMetrics(): Promise<{
    voiceTranscriptions: number;
    linksShortenedToday: number;
    ocrProcessed: number;
  }>;
  getRevenueMetrics(): Promise<{
    totalRevenue: number;
    revenueToday: number;
    revenueThisMonth: number;
    topPerformingLinks: Array<{
      domain: string;
      clicks: number;
      revenue: number;
    }>;
    conversionRate: number;
    averageCommission: number;
  }>;
  getSystemHealthMetrics(): Promise<{
    uptime: number;
    apiResponseTime: number;
    errorRate: number;
    databaseConnections: number;
    storageUsed: number;
    openaiApiCalls: number;
    elevenlabsCalls: number;
  }>;
  getUserProfiles(): Promise<Array<{
    id: string;
    name: string;
    email: string;
    age?: number;
    location?: string;
    profession?: string;
    timezone: string;
    preferences: any;
    onboardingCompleted: boolean;
    createdAt: string;
    updatedAt: string;
    lastActive: string;
    messageCount: number;
    listCount: number;
    reminderCount: number;
    contactCount: number;
    voiceUsagePercent: number;
    favoriteFeatures: string[];
    // Enhanced fields for payment status and analytics
    subscriptionStatus?: 'free' | 'trial' | 'premium' | 'cancelled';
    subscriptionPlan?: string;
    trialExpiresAt?: string;
    lifetimeValue?: number;
    registrationSource?: string;
  }>>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    console.log('Looking up user with ID:', id);
    const [user] = await db.select().from(users).where(eq(users.id, id));
    console.log('Found user:', user);
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async getUserByPhone(phone: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.phone, phone));
    return user;
  }

  async getUserByResetToken(token: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.resetToken, token));
    return user;
  }

  async getUserByToken(token: string): Promise<User | undefined> {
    try {
      let userId: string | undefined;

      // Try JWT format first (3 parts separated by dots)
      if (token.includes('.')) {
        const parts = token.split('.');
        if (parts.length === 3) {
          // Decode JWT payload (middle part)
          let payloadB64 = parts[1];
          // Handle base64url padding
          while (payloadB64.length % 4) payloadB64 += '=';
          payloadB64 = payloadB64.replace(/-/g, '+').replace(/_/g, '/');
          
          const payload = JSON.parse(Buffer.from(payloadB64, 'base64').toString());
          userId = payload.sub || payload.userId || payload.uid;
          
          // Check JWT expiration if present
          if (payload.exp) {
            const now = Math.floor(Date.now() / 1000);
            if (payload.exp < now) {
              console.log('❌ getUserByToken: JWT token expired');
              return undefined;
            }
          }
        }
      }

      // Try legacy base64 format if JWT failed
      if (!userId) {
        // Normalize base64 padding
        let normalizedToken = token.replace(/-/g, '+').replace(/_/g, '/');
        while (normalizedToken.length % 4) {
          normalizedToken += '=';
        }
        
        const decoded = JSON.parse(Buffer.from(normalizedToken, 'base64').toString());
        
        // Validate decoded token has userId
        if (!decoded || typeof decoded !== 'object') {
          console.log('❌ getUserByToken: Invalid decoded token format');
          return undefined;
        }
        
        userId = decoded.userId;
        
        // Check token age for legacy tokens (7 days)
        if (decoded.timestamp) {
          const tokenAge = Date.now() - decoded.timestamp;
          const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days
          if (tokenAge > maxAge) {
            console.log('❌ getUserByToken: Legacy token expired');
            return undefined;
          }
        }
      }

      // Look up user by ID
      if (userId) {
        return await this.getUser(userId);
      }

      return undefined;
    } catch (error) {
      console.error('getUserByToken error:', error);
      return undefined;
    }
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users).orderBy(desc(users.createdAt));
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const userData = {
      ...insertUser,
      preferences: insertUser.preferences as any
    };
    const [user] = await db.insert(users).values([userData]).returning();
    return user;
  }

  async updateUser(id: string, updates: Partial<InsertUser>): Promise<User> {
    // If preferences are being updated, merge them with existing preferences
    let finalPreferences = updates.preferences;
    
    if (updates.preferences) {
      // Fetch current user to get existing preferences
      const [currentUser] = await db.select().from(users).where(eq(users.id, id));
      if (currentUser && currentUser.preferences) {
        // Deep merge preferences - handle both as objects
        const existingPrefs = typeof currentUser.preferences === 'object' ? currentUser.preferences : {};
        const newPrefs = typeof updates.preferences === 'object' ? updates.preferences : {};
        finalPreferences = {
          ...existingPrefs,
          ...newPrefs
        };
      }
    }
    
    const updateData = {
      ...updates,
      preferences: finalPreferences as any,
      updatedAt: new Date()
    };
    
    const [user] = await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async deleteUser(id: string): Promise<void> {
    await db.delete(users).where(eq(users.id, id));
  }

  // Conversation operations
  async getConversations(userId: string): Promise<Conversation[]> {
    return await db
      .select()
      .from(conversations)
      .where(eq(conversations.userId, userId))
      .orderBy(desc(conversations.updatedAt));
  }

  async createConversation(insertConversation: InsertConversation): Promise<Conversation> {
    const [conversation] = await db
      .insert(conversations)
      .values(insertConversation)
      .returning();
    return conversation;
  }

  async getConversation(id: string): Promise<Conversation | undefined> {
    const [conversation] = await db
      .select()
      .from(conversations)
      .where(eq(conversations.id, id));
    return conversation;
  }

  async deleteConversation(id: string): Promise<void> {
    await db.delete(conversations).where(eq(conversations.id, id));
  }

  // Message operations
  async getMessages(conversationId: string): Promise<Message[]> {
    return await db
      .select()
      .from(messages)
      .where(eq(messages.conversationId, conversationId))
      .orderBy(messages.createdAt);
  }

  async createMessage(insertMessage: InsertMessage): Promise<Message> {
    const messageData = {
      ...insertMessage,
      role: insertMessage.role as "user" | "assistant",
      imageUrl: insertMessage.imageUrl
    };
    const [message] = await db.insert(messages).values([messageData]).returning();
    return message;
  }

  async updateMessage(id: string, updates: Partial<InsertMessage>): Promise<Message> {
    const [message] = await db
      .update(messages)
      .set({ ...updates, imageUrl: updates.imageUrl })
      .where(eq(messages.id, id))
      .returning();
    return message;
  }

  async deleteMessage(id: string): Promise<void> {
    await db.delete(messages).where(eq(messages.id, id));
  }

  // Smart list operations
  async getSmartLists(userId: string): Promise<(SmartList & { items: ListItem[] })[]> {
    // Get lists owned by user + lists where user is a collaborator
    const ownedLists = await db
      .select()
      .from(smartLists)
      .where(eq(smartLists.userId, userId))
      .orderBy(desc(smartLists.updatedAt));

    // For now, only return owned lists to avoid JSONB query issues
    // TODO: Add collaborative lists support when needed
    const allLists = [...ownedLists];

    const listsWithItems = await Promise.all(
      allLists.map(async (list) => {
        const items = await db
          .select()
          .from(listItems)
          .where(eq(listItems.listId, list.id))
          .orderBy(listItems.position, listItems.createdAt);
        return { ...list, items };
      })
    );

    return listsWithItems;
  }

  async createSmartList(insertList: InsertSmartList): Promise<SmartList> {
    const listData = {
      ...insertList,
      shareCode: insertList.isShared ? `${Date.now()}-${Math.random().toString(36).substr(2, 9)}` : null,
      collaborators: insertList.collaborators as any,
      categories: insertList.categories as any
    };
    const [list] = await db.insert(smartLists).values([listData]).returning();
    return list;
  }

  async getSmartList(id: string): Promise<(SmartList & { items: ListItem[] }) | undefined> {
    const [list] = await db
      .select()
      .from(smartLists)
      .where(eq(smartLists.id, id));

    if (!list) return undefined;

    const items = await db
      .select()
      .from(listItems)
      .where(eq(listItems.listId, id))
      .orderBy(listItems.position, listItems.createdAt);

    return { ...list, items };
  }

  async updateSmartList(id: string, updates: Partial<InsertSmartList>): Promise<SmartList> {
    const updateData = {
      ...updates,
      collaborators: updates.collaborators as any,
      categories: updates.categories as any,
      updatedAt: new Date()
    };
    const [list] = await db
      .update(smartLists)
      .set(updateData)
      .where(eq(smartLists.id, id))
      .returning();
    return list;
  }

  async getSharedList(shareCode: string): Promise<(SmartList & { items: ListItem[] }) | undefined> {
    const [list] = await db
      .select()
      .from(smartLists)
      .where(eq(smartLists.shareCode, shareCode));

    if (!list) return undefined;

    const items = await db
      .select()
      .from(listItems)
      .where(eq(listItems.listId, list.id))
      .orderBy(listItems.position, listItems.createdAt);

    return { ...list, items };
  }

  async addCollaborator(listId: string, collaboratorId: string): Promise<SmartList> {
    const [list] = await db
      .select()
      .from(smartLists)
      .where(eq(smartLists.id, listId));

    if (!list) throw new Error("List not found");

    const collaborators = [...(list.collaborators || []), collaboratorId];
    
    const [updatedList] = await db
      .update(smartLists)
      .set({ 
        collaborators: collaborators as any,
        updatedAt: new Date() 
      })
      .where(eq(smartLists.id, listId))
      .returning();

    return updatedList;
  }

  // List item operations
  async createListItem(insertItem: InsertListItem): Promise<ListItem> {
    const [item] = await db.insert(listItems).values([insertItem]).returning();
    return item;
  }

  async updateListItem(id: string, updates: Partial<InsertListItem>): Promise<ListItem> {
    const [item] = await db
      .update(listItems)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(listItems.id, id))
      .returning();
    return item;
  }

  async deleteListItem(id: string): Promise<void> {
    await db.delete(listItems).where(eq(listItems.id, id));
  }

  async getListItems(listId: string): Promise<ListItem[]> {
    return await db.select().from(listItems).where(eq(listItems.listId, listId));
  }
  
  async getListItem(id: string): Promise<ListItem | undefined> {
    const [item] = await db.select().from(listItems).where(eq(listItems.id, id));
    return item;
  }

  async toggleListItem(id: string): Promise<ListItem> {
    // Get the current item
    const [currentItem] = await db
      .select()
      .from(listItems)
      .where(eq(listItems.id, id));
    
    if (!currentItem) {
      throw new Error("List item not found");
    }

    // Toggle completed status
    const [item] = await db
      .update(listItems)
      .set({ 
        completed: !currentItem.completed,
        updatedAt: new Date() 
      })
      .where(eq(listItems.id, id))
      .returning();
    
    if (!item) {
      throw new Error("Failed to toggle list item");
    }
    
    return item;
  }
  
  async canUserEditList(userId: string, listId: string): Promise<boolean> {
    // Get the list
    const [list] = await db
      .select()
      .from(smartLists)
      .where(eq(smartLists.id, listId));
    
    if (!list) {
      return false;
    }
    
    // User is the owner
    if (list.userId === userId) {
      return true;
    }
    
    // Check if user is a collaborator with edit permissions
    const collaborators = list.collaborators as string[] || [];
    if (collaborators.includes(userId)) {
      // If user is a collaborator, check the shareMode
      return list.shareMode === 'edit';
    }
    
    return false;
  }

  // Reminder operations
  async getReminders(userId: string): Promise<Reminder[]> {
    return await db
      .select()
      .from(reminders)
      .where(eq(reminders.userId, userId))
      .orderBy(reminders.dueDate);
  }

  async getReminder(id: string): Promise<Reminder | undefined> {
    const [reminder] = await db
      .select()
      .from(reminders)
      .where(eq(reminders.id, id));
    return reminder;
  }

  async createReminder(insertReminder: InsertReminder): Promise<Reminder> {
    const [reminder] = await db.insert(reminders).values(insertReminder).returning();
    return reminder;
  }

  async updateReminder(id: string, updates: Partial<InsertReminder>): Promise<Reminder> {
    const [reminder] = await db
      .update(reminders)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(reminders.id, id))
      .returning();
    return reminder;
  }

  async deleteReminder(id: string): Promise<void> {
    await db.delete(reminders).where(eq(reminders.id, id));
  }

  // Additional smart list methods
  async deleteSmartList(id: string): Promise<void> {
    // Delete all items first
    await db.delete(listItems).where(eq(listItems.listId, id));
    // Then delete the list
    await db.delete(smartLists).where(eq(smartLists.id, id));
  }

  async shareSmartList(id: string): Promise<string> {
    const shareCode = Math.random().toString(36).substring(2, 10).toUpperCase();
    await db
      .update(smartLists)
      .set({ 
        shareCode,
        isShared: true,
        updatedAt: new Date() 
      })
      .where(eq(smartLists.id, id));
    return shareCode;
  }

  async shareList(id: string): Promise<string> {
    // Alias for backward compatibility
    return this.shareSmartList(id);
  }

  async joinSharedList(shareCode: string, userId: string): Promise<SmartList> {
    const [list] = await db
      .select()
      .from(smartLists)
      .where(eq(smartLists.shareCode, shareCode));

    if (!list) throw new Error("List not found with this share code");

    // Add user as collaborator
    const collaborators = [...(list.collaborators || []), userId];
    
    const [updatedList] = await db
      .update(smartLists)
      .set({ 
        collaborators: collaborators as any,
        updatedAt: new Date() 
      })
      .where(eq(smartLists.id, list.id))
      .returning();

    return updatedList;
  }

  // Contact operations
  async getContacts(userId: string): Promise<Contact[]> {
    return await db
      .select()
      .from(contacts)
      .where(eq(contacts.userId, userId))
      .orderBy(desc(contacts.createdAt));
  }

  async createContact(insertContact: InsertContact): Promise<Contact> {
    const [contact] = await db.insert(contacts).values([insertContact]).returning();
    return contact;
  }

  async getContact(id: string): Promise<Contact | undefined> {
    const [contact] = await db.select().from(contacts).where(eq(contacts.id, id));
    return contact;
  }

  async updateContact(id: string, updates: Partial<InsertContact>): Promise<Contact> {
    const [contact] = await db
      .update(contacts)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(contacts.id, id))
      .returning();
    return contact;
  }

  async deleteContact(id: string): Promise<void> {
    await db.delete(contacts).where(eq(contacts.id, id));
  }

  // Group management operations
  async getGroups(userId: string): Promise<(Group & { members: GroupMember[] })[]> {
    const userGroups = await db.select().from(groups).where(eq(groups.userId, userId));
    const groupsWithMembers = await Promise.all(
      userGroups.map(async (group) => {
        const members = await db.select().from(groupMembers).where(eq(groupMembers.groupId, group.id));
        return { ...group, members };
      })
    );
    return groupsWithMembers;
  }

  async getGroup(id: string): Promise<(Group & { members: GroupMember[] }) | undefined> {
    const [group] = await db.select().from(groups).where(eq(groups.id, id));
    if (!group) return undefined;
    const members = await db.select().from(groupMembers).where(eq(groupMembers.groupId, id));
    return { ...group, members };
  }

  async createGroup(group: InsertGroup): Promise<Group> {
    const [newGroup] = await db.insert(groups).values(group).returning();
    return newGroup;
  }

  async updateGroup(id: string, updates: Partial<InsertGroup>): Promise<Group> {
    const [updatedGroup] = await db
      .update(groups)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(groups.id, id))
      .returning();
    return updatedGroup;
  }

  async deleteGroup(id: string): Promise<void> {
    // Members will be deleted automatically by CASCADE
    await db.delete(groups).where(eq(groups.id, id));
  }

  async getGroupMembers(groupId: string): Promise<GroupMember[]> {
    return await db.select().from(groupMembers).where(eq(groupMembers.groupId, groupId));
  }

  async addGroupMember(member: InsertGroupMember): Promise<GroupMember> {
    const [newMember] = await db.insert(groupMembers).values(member).returning();
    return newMember;
  }

  async removeGroupMember(id: string): Promise<void> {
    await db.delete(groupMembers).where(eq(groupMembers.id, id));
  }

  // Subscription operations
  async startTrial(userId: string, durationDays: number): Promise<User> {
    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + durationDays);
    
    const [user] = await db
      .update(users)
      .set({
        trialEndsAt,
        subscriptionStatus: 'trial',
        isPremium: true,
      })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  async checkSubscriptionStatus(userId: string): Promise<{ isPremium: boolean; trialEnded: boolean; subscriptionStatus: string }> {
    const [user] = await db.select().from(users).where(eq(users.id, userId));
    if (!user) {
      return { isPremium: false, trialEnded: false, subscriptionStatus: 'none' };
    }

    const now = new Date();
    const trialEnded = user.trialEndsAt ? now > user.trialEndsAt : false;
    const isPremium = user.isPremium && !trialEnded;

    return {
      isPremium,
      trialEnded,
      subscriptionStatus: user.subscriptionStatus || 'none',
    };
  }

  // Magic link token operations
  async createMagicLinkToken(token: InsertMagicLinkToken): Promise<MagicLinkToken> {
    // Clean up any existing tokens for this email first
    await db.delete(magicLinkTokens)
      .where(eq(magicLinkTokens.email, token.email));
    
    console.log('🔍 Inserting magic link token:', JSON.stringify(token, null, 2));
    const [created] = await db.insert(magicLinkTokens).values(token).returning();
    console.log('✅ Magic link token created:', created?.id);
    return created;
  }

  async getMagicLinkToken(token: string): Promise<MagicLinkToken | undefined> {
    const [found] = await db.select().from(magicLinkTokens).where(eq(magicLinkTokens.token, token));
    return found;
  }

  async getAllMagicLinkTokens(): Promise<MagicLinkToken[]> {
    return await db.select().from(magicLinkTokens);
  }

  async useMagicLinkToken(token: string): Promise<void> {
    await db.update(magicLinkTokens)
      .set({ used: true })
      .where(eq(magicLinkTokens.token, token));
  }

  async cleanupExpiredTokens(): Promise<void> {
    await db.delete(magicLinkTokens)
      .where(sql`expires_at < NOW() OR used = true`);
  }

  // SMS verification operations
  async createSmsVerificationCode(verification: InsertSmsVerificationCode): Promise<SmsVerificationCode> {
    // Clean up expired codes for this phone number first
    await db.delete(smsVerificationCodes)
      .where(and(
        eq(smsVerificationCodes.phoneNumber, verification.phoneNumber),
        sql`expires_at < NOW() OR used = true`
      ));
    
    const [created] = await db.insert(smsVerificationCodes).values(verification).returning();
    return created;
  }

  async verifySmsCode(phoneNumber: string, code: string): Promise<{ success: boolean; error?: string }> {
    const [verification] = await db.select()
      .from(smsVerificationCodes)
      .where(and(
        eq(smsVerificationCodes.phoneNumber, phoneNumber),
        eq(smsVerificationCodes.code, code),
        eq(smsVerificationCodes.used, false),
        sql`expires_at > NOW()`
      ));

    if (!verification) {
      // Check if code exists but is expired or used
      const [expiredCode] = await db.select()
        .from(smsVerificationCodes)
        .where(and(
          eq(smsVerificationCodes.phoneNumber, phoneNumber),
          eq(smsVerificationCodes.code, code)
        ));

      if (expiredCode) {
        if (expiredCode.used) {
          return { success: false, error: "Code has already been used" };
        }
        if (new Date() > expiredCode.expiresAt) {
          return { success: false, error: "Code has expired" };
        }
      }

      // Update attempts count for security
      await db.update(smsVerificationCodes)
        .set({ attempts: sql`attempts + 1` })
        .where(eq(smsVerificationCodes.phoneNumber, phoneNumber));

      return { success: false, error: "Invalid verification code" };
    }

    // Mark code as used
    await db.update(smsVerificationCodes)
      .set({ used: true })
      .where(eq(smsVerificationCodes.id, verification.id));

    return { success: true };
  }

  async cleanupExpiredSmsVerificationCodes(): Promise<void> {
    await db.delete(smsVerificationCodes)
      .where(sql`expires_at < NOW() OR used = true`);
  }

  // Pattern recognition operations
  async createUserPattern(pattern: InsertUserPattern): Promise<UserPattern> {
    const [created] = await db.insert(userPatterns).values([pattern]).returning();
    return created;
  }

  async getUserPatterns(userId: string): Promise<UserPattern[]> {
    return await db.select()
      .from(userPatterns)
      .where(eq(userPatterns.userId, userId))
      .orderBy(desc(userPatterns.confidence));
  }

  async updateUserPattern(id: string, updates: Partial<InsertUserPattern>): Promise<UserPattern> {
    const [updated] = await db.update(userPatterns)
      .set(updates)
      .where(eq(userPatterns.id, id))
      .returning();
    return updated;
  }

  async findSimilarPattern(userId: string, activity: string): Promise<UserPattern | undefined> {
    const patterns = await db.select()
      .from(userPatterns)
      .where(and(
        eq(userPatterns.userId, userId),
        sql`lower(activity) LIKE lower(${'%' + activity + '%'})`
      ));
    return patterns[0];
  }

  // Activity logging operations
  async createActivityLog(log: InsertActivityLog): Promise<ActivityLog> {
    const [created] = await db.insert(activityLog).values(log).returning();
    return created;
  }

  async getActivityLogs(userId: string, days: number): Promise<ActivityLog[]> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    return await db.select()
      .from(activityLog)
      .where(and(
        eq(activityLog.userId, userId),
        sql`timestamp > ${cutoffDate.toISOString()}`
      ))
      .orderBy(desc(activityLog.timestamp));
  }

  // Admin analytics operations
  async getUserCount(): Promise<number> {
    const result = await db.select({ count: sql<number>`count(*)` }).from(users);
    return result[0]?.count || 0;
  }

  async getConversationCount(): Promise<number> {
    const result = await db.select({ count: sql<number>`count(*)` }).from(conversations);
    return result[0]?.count || 0;
  }

  async getMessageCount(): Promise<number> {
    const result = await db.select({ count: sql<number>`count(*)` }).from(messages);
    return result[0]?.count || 0;
  }

  async getSmartListCount(): Promise<number> {
    const result = await db.select({ count: sql<number>`count(*)` }).from(smartLists);
    return result[0]?.count || 0;
  }

  async getListItemCount(): Promise<number> {
    const result = await db.select({ count: sql<number>`count(*)` }).from(listItems);
    return result[0]?.count || 0;
  }

  async getReminderCount(): Promise<number> {
    const result = await db.select({ count: sql<number>`count(*)` }).from(reminders);
    return result[0]?.count || 0;
  }

  async getContactCount(): Promise<number> {
    const result = await db.select({ count: sql<number>`count(*)` }).from(contacts);
    return result[0]?.count || 0;
  }

  async getRecentUsers(limit: number): Promise<Array<{
    id: string;
    name: string;
    email: string;
    createdAt: string;
    lastActive: string;
    messageCount: number;
  }>> {
    const recentUsers = await db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      })
      .from(users)
      .orderBy(desc(users.createdAt))
      .limit(limit);

    // Get message counts for each user
    const usersWithStats = await Promise.all(
      recentUsers.map(async (user) => {
        const messageCount = await db
          .select({ count: sql<number>`count(*)` })
          .from(messages)
          .innerJoin(conversations, eq(messages.conversationId, conversations.id))
          .where(eq(conversations.userId, user.id));

        return {
          id: user.id,
          name: user.name || 'Anonymous',
          email: user.email || 'No email',
          createdAt: user.createdAt?.toISOString() || new Date().toISOString(),
          lastActive: user.updatedAt?.toISOString() || user.createdAt?.toISOString() || new Date().toISOString(),
          messageCount: messageCount[0]?.count || 0,
        };
      })
    );

    return usersWithStats;
  }

  // Enhanced analytics implementations
  async getUserGrowthMetrics(): Promise<{
    daily: number;
    weekly: number;
    monthly: number;
  }> {
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [dailyGrowth, weeklyGrowth, monthlyGrowth] = await Promise.all([
      db.select({ count: sql<number>`count(*)` })
        .from(users)
        .where(sql`${users.createdAt} >= ${oneDayAgo}`),
      db.select({ count: sql<number>`count(*)` })
        .from(users)
        .where(sql`${users.createdAt} >= ${oneWeekAgo}`),
      db.select({ count: sql<number>`count(*)` })
        .from(users)
        .where(sql`${users.createdAt} >= ${oneMonthAgo}`)
    ]);

    return {
      daily: dailyGrowth[0]?.count || 0,
      weekly: weeklyGrowth[0]?.count || 0,
      monthly: monthlyGrowth[0]?.count || 0
    };
  }

  async getUserLocationData(): Promise<Array<{
    country: string;
    region: string;
    count: number;
    percentage: number;
  }>> {
    // Simulated location data - in production, collect from user preferences or IP geolocation
    const totalUsers = await this.getUserCount();
    const mockLocationData = [
      { country: 'United States', region: 'North America', count: Math.floor(totalUsers * 0.45), percentage: 45 },
      { country: 'Canada', region: 'North America', count: Math.floor(totalUsers * 0.15), percentage: 15 },
      { country: 'United Kingdom', region: 'Europe', count: Math.floor(totalUsers * 0.12), percentage: 12 },
      { country: 'Germany', region: 'Europe', count: Math.floor(totalUsers * 0.08), percentage: 8 },
      { country: 'Australia', region: 'Oceania', count: Math.floor(totalUsers * 0.05), percentage: 5 },
      { country: 'Other', region: 'Various', count: Math.floor(totalUsers * 0.15), percentage: 15 }
    ];
    return mockLocationData;
  }

  async getUserTimezoneData(): Promise<Array<{
    timezone: string;
    count: number;
    percentage: number;
  }>> {
    const totalUsers = await this.getUserCount();
    const mockTimezoneData = [
      { timezone: 'America/New_York (EST)', count: Math.floor(totalUsers * 0.35), percentage: 35 },
      { timezone: 'America/Los_Angeles (PST)', count: Math.floor(totalUsers * 0.25), percentage: 25 },
      { timezone: 'Europe/London (GMT)', count: Math.floor(totalUsers * 0.15), percentage: 15 },
      { timezone: 'Europe/Berlin (CET)', count: Math.floor(totalUsers * 0.10), percentage: 10 },
      { timezone: 'Australia/Sydney (AEST)', count: Math.floor(totalUsers * 0.08), percentage: 8 },
      { timezone: 'Other Timezones', count: Math.floor(totalUsers * 0.07), percentage: 7 }
    ];
    return mockTimezoneData;
  }

  async getUserDemographics(): Promise<{
    averageAge: number;
    professions: Array<{ profession: string; count: number; }>;
    onboardingCompletion: number;
  }> {
    const totalUsers = await this.getUserCount();
    
    // Get users with profession data from preferences
    const usersWithPrefs = await db
      .select({ preferences: users.preferences })
      .from(users)
      .where(sql`${users.preferences} IS NOT NULL`);

    const professionCounts: { [key: string]: number } = {};
    let completedOnboarding = 0;

    for (const user of usersWithPrefs) {
      const prefs = user.preferences as any;
      if (prefs?.profession) {
        const profession = prefs.profession.toLowerCase();
        professionCounts[profession] = (professionCounts[profession] || 0) + 1;
      }
      if (prefs?.onboardingCompleted) {
        completedOnboarding++;
      }
    }

    const professions = Object.entries(professionCounts)
      .map(([profession, count]) => ({ profession, count }))
      .sort((a, b) => b.count - a.count);

    return {
      averageAge: 32, // Simulated average age
      professions,
      onboardingCompletion: totalUsers > 0 ? Math.round((completedOnboarding / totalUsers) * 100) : 0
    };
  }

  async getConversationMetrics(): Promise<{
    totalConversations: number;
    averageMessagesPerConversation: number;
    averageResponseTime: number;
    topTopics: Array<{ topic: string; frequency: number; }>;
    voiceUsagePercent: number;
    messagesLast24h: number;
    messagesLast7d: number;
    messagesLast30d: number;
  }> {
    const totalConversations = await this.getConversationCount();
    const totalMessages = await this.getMessageCount();

    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [messages24h, messages7d, messages30d] = await Promise.all([
      db.select({ count: sql<number>`count(*)` })
        .from(messages)
        .where(sql`${messages.createdAt} >= ${oneDayAgo}`),
      db.select({ count: sql<number>`count(*)` })
        .from(messages)
        .where(sql`${messages.createdAt} >= ${oneWeekAgo}`),
      db.select({ count: sql<number>`count(*)` })
        .from(messages)
        .where(sql`${messages.createdAt} >= ${oneMonthAgo}`)
    ]);

    // Count voice messages (messages with audioUrl)
    const voiceMessages = await db.select({ count: sql<number>`count(*)` })
      .from(messages)
      .where(sql`${messages.audioUrl} IS NOT NULL`);

    const voiceUsagePercent = totalMessages > 0 ? 
      Math.round((voiceMessages[0]?.count || 0) / totalMessages * 100) : 0;

    return {
      totalConversations,
      averageMessagesPerConversation: totalConversations > 0 ? 
        Math.round(totalMessages / totalConversations) : 0,
      averageResponseTime: 750, // Simulated response time in ms
      topTopics: [
        { topic: 'smart lists', frequency: 45 },
        { topic: 'reminders', frequency: 32 },
        { topic: 'voice commands', frequency: 28 },
        { topic: 'scheduling', frequency: 24 },
        { topic: 'contacts', frequency: 18 }
      ],
      voiceUsagePercent,
      messagesLast24h: messages24h[0]?.count || 0,
      messagesLast7d: messages7d[0]?.count || 0,
      messagesLast30d: messages30d[0]?.count || 0
    };
  }

  async getFeatureUsageMetrics(): Promise<{
    voiceTranscriptions: number;
    linksShortenedToday: number;
    ocrProcessed: number;
  }> {
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    // Count voice messages created today
    const voiceToday = await db.select({ count: sql<number>`count(*)` })
      .from(messages)
      .where(sql`${messages.audioUrl} IS NOT NULL AND ${messages.createdAt} >= ${oneDayAgo}`);

    // Count contacts created today (OCR feature usage proxy)
    const contactsToday = await db.select({ count: sql<number>`count(*)` })
      .from(contacts)
      .where(sql`${contacts.createdAt} >= ${oneDayAgo}`);

    return {
      voiceTranscriptions: voiceToday[0]?.count || 0,
      linksShortenedToday: Math.floor(Math.random() * 25) + 5, // Simulated link shortening
      ocrProcessed: contactsToday[0]?.count || 0
    };
  }

  async getRevenueMetrics(): Promise<{
    totalRevenue: number;
    revenueToday: number;
    revenueThisMonth: number;
    topPerformingLinks: Array<{
      domain: string;
      clicks: number;
      revenue: number;
    }>;
    conversionRate: number;
    averageCommission: number;
  }> {
    // Simulated revenue data based on feature usage
    const totalMessages = await this.getMessageCount();
    const baseRevenue = totalMessages * 0.05; // $0.05 per message in affiliate potential

    return {
      totalRevenue: Math.round(baseRevenue * 100) / 100,
      revenueToday: Math.round(baseRevenue * 0.1 * 100) / 100,
      revenueThisMonth: Math.round(baseRevenue * 0.7 * 100) / 100,
      topPerformingLinks: [
        { domain: 'amazon.com', clicks: 89, revenue: 234.50 },
        { domain: 'booking.com', clicks: 34, revenue: 156.20 },
        { domain: 'vrbo.com', clicks: 12, revenue: 89.40 },
        { domain: 'expedia.com', clicks: 8, revenue: 45.80 },
        { domain: 'walmart.com', clicks: 23, revenue: 67.30 }
      ],
      conversionRate: 3.2,
      averageCommission: 2.85
    };
  }

  async getSystemHealthMetrics(): Promise<{
    uptime: number;
    apiResponseTime: number;
    errorRate: number;
    databaseConnections: number;
    storageUsed: number;
    openaiApiCalls: number;
    elevenlabsCalls: number;
  }> {
    const totalMessages = await this.getMessageCount();
    const totalUsers = await this.getUserCount();

    return {
      uptime: 99.8,
      apiResponseTime: 245,
      errorRate: 0.2,
      databaseConnections: 8,
      storageUsed: Math.min(85, Math.floor(totalUsers / 10) + 15),
      openaiApiCalls: totalMessages * 2, // Estimate 2 API calls per message
      elevenlabsCalls: Math.floor(totalMessages * 0.3) // Estimate 30% voice usage
    };
  }

  async getUserProfiles(): Promise<Array<{
    id: string;
    name: string;
    email: string;
    age?: number;
    location?: string;
    profession?: string;
    timezone: string;
    preferences: any;
    onboardingCompleted: boolean;
    createdAt: string;
    updatedAt: string;
    lastActive: string;
    messageCount: number;
    listCount: number;
    reminderCount: number;
    contactCount: number;
    voiceUsagePercent: number;
    favoriteFeatures: string[];
  }>> {
    // Get all users with their basic information
    const allUsers = await db.select().from(users).orderBy(desc(users.createdAt));

    // Get detailed stats for each user
    const userProfiles = await Promise.all(
      allUsers.map(async (user) => {
        const [messageStats, listStats, reminderStats, contactStats, voiceStats] = await Promise.all([
          // Message count
          db.select({ count: sql<number>`count(*)` })
            .from(messages)
            .innerJoin(conversations, eq(messages.conversationId, conversations.id))
            .where(eq(conversations.userId, user.id)),
          
          // Smart lists count
          db.select({ count: sql<number>`count(*)` })
            .from(smartLists)
            .where(eq(smartLists.userId, user.id)),
          
          // Reminders count
          db.select({ count: sql<number>`count(*)` })
            .from(reminders)
            .where(eq(reminders.userId, user.id)),
          
          // Contacts count
          db.select({ count: sql<number>`count(*)` })
            .from(contacts)
            .where(eq(contacts.userId, user.id)),
          
          // Voice messages count
          db.select({ count: sql<number>`count(*)` })
            .from(messages)
            .innerJoin(conversations, eq(messages.conversationId, conversations.id))
            .where(and(
              eq(conversations.userId, user.id),
              sql`${messages.audioUrl} IS NOT NULL`
            ))
        ]);

        const totalMessages = messageStats[0]?.count || 0;
        const voiceMessages = voiceStats[0]?.count || 0;
        const voiceUsagePercent = totalMessages > 0 ? Math.round((voiceMessages / totalMessages) * 100) : 0;

        // Extract user preferences
        const prefs = user.preferences as any || {};
        
        // Determine favorite features based on usage
        const favoriteFeatures: string[] = [];
        const listCount = listStats[0]?.count || 0;
        const reminderCount = reminderStats[0]?.count || 0;
        const contactCount = contactStats[0]?.count || 0;

        if (listCount > 3) favoriteFeatures.push('Smart Lists');
        if (reminderCount > 5) favoriteFeatures.push('Reminders');
        if (contactCount > 2) favoriteFeatures.push('Contacts');
        if (voiceUsagePercent > 30) favoriteFeatures.push('Voice Commands');
        if (totalMessages > 20) favoriteFeatures.push('AI Chat');

        // Determine subscription status based on activity and account age
        const accountAge = user.createdAt ? 
          Math.floor((new Date().getTime() - new Date(user.createdAt).getTime()) / (1000 * 60 * 60 * 24)) 
          : 0;
        
        // Mock subscription logic for now - replace with actual payment system later
        let subscriptionStatus: 'free' | 'trial' | 'premium' | 'cancelled' = 'free';
        let subscriptionPlan = 'Free Plan';
        let trialExpiresAt: string | undefined;
        let lifetimeValue = 0;
        
        // High-activity users are likely premium (mock logic)
        if (totalMessages > 50 && listCount > 5 && voiceUsagePercent > 40) {
          subscriptionStatus = 'premium';
          subscriptionPlan = 'Premium Monthly';
          lifetimeValue = 14.99; // Mock monthly subscription
        } else if (accountAge <= 7 && totalMessages > 10) {
          // New users with decent activity might be in trial
          subscriptionStatus = 'trial';
          subscriptionPlan = 'Premium Trial';
          trialExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(); // 7 days from now
        }

        // Determine registration source based on email domain and user patterns
        let registrationSource = 'direct';
        if (user.email?.includes('@gmail.com') || user.email?.includes('@googlemail.com')) {
          registrationSource = 'google_oauth';
        } else if (user.email?.includes('@outlook.') || user.email?.includes('@hotmail.')) {
          registrationSource = 'microsoft_oauth';
        } else if (user.email?.includes('@test.') || user.email?.includes('@example.')) {
          registrationSource = 'development';
        }

        return {
          id: user.id,
          name: user.name || 'Anonymous User',
          email: user.email || 'No email',
          age: user.age || undefined,
          location: user.location || undefined,
          profession: user.profession || undefined,
          timezone: user.timezone || 'UTC',
          preferences: prefs,
          onboardingCompleted: user.onboardingCompleted || false,
          createdAt: user.createdAt?.toISOString() || new Date().toISOString(),
          updatedAt: user.updatedAt?.toISOString() || new Date().toISOString(),
          lastActive: user.updatedAt?.toISOString() || user.createdAt?.toISOString() || new Date().toISOString(),
          messageCount: totalMessages,
          listCount: listCount,
          reminderCount: reminderCount,
          contactCount: contactCount,
          voiceUsagePercent,
          favoriteFeatures,
          // Enhanced analytics fields
          subscriptionStatus,
          subscriptionPlan,
          trialExpiresAt,
          lifetimeValue,
          registrationSource
        };
      })
    );

    return userProfiles;
  }
}

export const storage = new DatabaseStorage();
