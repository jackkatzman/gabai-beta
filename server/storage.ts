import {
  users,
  conversations,
  messages,
  smartLists,
  listItems,
  reminders,
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
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, sql } from "drizzle-orm";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<InsertUser>): Promise<User>;
  
  // Conversation operations
  getConversations(userId: string): Promise<Conversation[]>;
  createConversation(conversation: InsertConversation): Promise<Conversation>;
  getConversation(id: string): Promise<Conversation | undefined>;
  
  // Message operations
  getMessages(conversationId: string): Promise<Message[]>;
  createMessage(message: InsertMessage): Promise<Message>;
  
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
  createListItem(item: InsertListItem): Promise<ListItem>;
  updateListItem(id: string, updates: Partial<InsertListItem>): Promise<ListItem>;
  deleteListItem(id: string): Promise<void>;
  
  // Reminder operations
  getReminders(userId: string): Promise<Reminder[]>;
  createReminder(reminder: InsertReminder): Promise<Reminder>;
  updateReminder(id: string, updates: Partial<InsertReminder>): Promise<Reminder>;
  deleteReminder(id: string): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
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
    const updateData = {
      ...updates,
      preferences: updates.preferences as any,
      updatedAt: new Date()
    };
    const [user] = await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, id))
      .returning();
    return user;
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
      role: insertMessage.role as "user" | "assistant"
    };
    const [message] = await db.insert(messages).values([messageData]).returning();
    return message;
  }

  // Smart list operations
  async getSmartLists(userId: string): Promise<(SmartList & { items: ListItem[] })[]> {
    // Get lists owned by user + lists where user is a collaborator
    const ownedLists = await db
      .select()
      .from(smartLists)
      .where(eq(smartLists.userId, userId))
      .orderBy(desc(smartLists.updatedAt));

    // Get lists where user is a collaborator
    const collaborativeLists = await db
      .select()
      .from(smartLists)
      .where(sql`jsonb_array_elements_text(${smartLists.collaborators}) = ${userId}`)
      .orderBy(desc(smartLists.updatedAt));

    const allLists = [...ownedLists, ...collaborativeLists];

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

  // Reminder operations
  async getReminders(userId: string): Promise<Reminder[]> {
    return await db
      .select()
      .from(reminders)
      .where(eq(reminders.userId, userId))
      .orderBy(reminders.dueDate);
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
}

export const storage = new DatabaseStorage();
