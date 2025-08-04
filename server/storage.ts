import {
  users,
  conversations,
  messages,
  shoppingLists,
  shoppingItems,
  reminders,
  type User,
  type InsertUser,
  type Conversation,
  type InsertConversation,
  type Message,
  type InsertMessage,
  type ShoppingList,
  type InsertShoppingList,
  type ShoppingItem,
  type InsertShoppingItem,
  type Reminder,
  type InsertReminder,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and } from "drizzle-orm";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<InsertUser>): Promise<User>;
  
  // Conversation operations
  getConversations(userId: string): Promise<Conversation[]>;
  createConversation(conversation: InsertConversation): Promise<Conversation>;
  getConversation(id: string): Promise<Conversation | undefined>;
  
  // Message operations
  getMessages(conversationId: string): Promise<Message[]>;
  createMessage(message: InsertMessage): Promise<Message>;
  
  // Shopping list operations
  getShoppingLists(userId: string): Promise<(ShoppingList & { items: ShoppingItem[] })[]>;
  createShoppingList(list: InsertShoppingList): Promise<ShoppingList>;
  getShoppingList(id: string): Promise<(ShoppingList & { items: ShoppingItem[] }) | undefined>;
  
  // Shopping item operations
  createShoppingItem(item: InsertShoppingItem): Promise<ShoppingItem>;
  updateShoppingItem(id: string, updates: Partial<InsertShoppingItem>): Promise<ShoppingItem>;
  deleteShoppingItem(id: string): Promise<void>;
  
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

  // Shopping list operations
  async getShoppingLists(userId: string): Promise<(ShoppingList & { items: ShoppingItem[] })[]> {
    const lists = await db
      .select()
      .from(shoppingLists)
      .where(eq(shoppingLists.userId, userId))
      .orderBy(desc(shoppingLists.updatedAt));

    const listsWithItems = await Promise.all(
      lists.map(async (list) => {
        const items = await db
          .select()
          .from(shoppingItems)
          .where(eq(shoppingItems.listId, list.id))
          .orderBy(shoppingItems.createdAt);
        return { ...list, items };
      })
    );

    return listsWithItems;
  }

  async createShoppingList(insertList: InsertShoppingList): Promise<ShoppingList> {
    const [list] = await db.insert(shoppingLists).values(insertList).returning();
    return list;
  }

  async getShoppingList(id: string): Promise<(ShoppingList & { items: ShoppingItem[] }) | undefined> {
    const [list] = await db
      .select()
      .from(shoppingLists)
      .where(eq(shoppingLists.id, id));

    if (!list) return undefined;

    const items = await db
      .select()
      .from(shoppingItems)
      .where(eq(shoppingItems.listId, id))
      .orderBy(shoppingItems.createdAt);

    return { ...list, items };
  }

  // Shopping item operations
  async createShoppingItem(insertItem: InsertShoppingItem): Promise<ShoppingItem> {
    const [item] = await db.insert(shoppingItems).values(insertItem).returning();
    return item;
  }

  async updateShoppingItem(id: string, updates: Partial<InsertShoppingItem>): Promise<ShoppingItem> {
    const [item] = await db
      .update(shoppingItems)
      .set(updates)
      .where(eq(shoppingItems.id, id))
      .returning();
    return item;
  }

  async deleteShoppingItem(id: string): Promise<void> {
    await db.delete(shoppingItems).where(eq(shoppingItems.id, id));
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
}

export const storage = new DatabaseStorage();
