import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, jsonb, boolean, integer } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  age: integer("age"),
  location: text("location"),
  profession: text("profession"),
  email: text("email").unique(),
  preferences: jsonb("preferences").$type<{
    religious?: string;
    dietary?: string[];
    sleepSchedule?: { bedtime: string; wakeup: string };
    communicationStyle?: string;
    interests?: string[];
    familyDetails?: string;
    notificationMethod?: "browser" | "toast" | "calendar" | "none";
    notificationSound?: boolean;
    notificationAdvance?: number; // minutes before due date
  }>().default({}),
  onboardingCompleted: boolean("onboarding_completed").default(false),
  timezone: varchar("timezone").default("America/New_York"), // User's timezone preference
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const conversations = pgTable("conversations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  title: text("title"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const messages = pgTable("messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  conversationId: varchar("conversation_id").references(() => conversations.id).notNull(),
  role: text("role").$type<"user" | "assistant">().notNull(),
  content: text("content").notNull(),
  audioUrl: text("audio_url"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const smartLists = pgTable("smart_lists", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  name: text("name").notNull(),
  type: text("type").notNull().default("shopping"), // shopping, punch_list, waiting_list, todo, etc
  description: text("description"),
  isShared: boolean("is_shared").default(false),
  shareCode: varchar("share_code").unique(),
  collaborators: jsonb("collaborators").$type<string[]>().default([]),
  sortBy: text("sort_by").default("category"), // category, priority, date_added, custom
  categories: jsonb("categories").$type<string[]>().default([]),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const listItems = pgTable("list_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  listId: varchar("list_id").references(() => smartLists.id).notNull(),
  name: text("name").notNull(),
  category: text("category"),
  priority: integer("priority").default(1), // 1-5 scale
  completed: boolean("completed").default(false),
  notes: text("notes"),
  assignedTo: text("assigned_to"), // for contractor lists: "plumber", "painter", etc
  addedBy: text("added_by"), // user who added this item
  dueDate: timestamp("due_date"),
  position: integer("position").default(0), // for custom ordering
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const reminders = pgTable("reminders", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  title: text("title").notNull(),
  description: text("description"),
  dueDate: timestamp("due_date").notNull(),
  completed: boolean("completed").default(false),
  recurring: text("recurring"), // daily, weekly, monthly
  category: text("category"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  conversations: many(conversations),
  smartLists: many(smartLists),
  reminders: many(reminders),
}));

export const conversationsRelations = relations(conversations, ({ one, many }) => ({
  user: one(users, {
    fields: [conversations.userId],
    references: [users.id],
  }),
  messages: many(messages),
}));

export const messagesRelations = relations(messages, ({ one }) => ({
  conversation: one(conversations, {
    fields: [messages.conversationId],
    references: [conversations.id],
  }),
}));

export const smartListsRelations = relations(smartLists, ({ one, many }) => ({
  user: one(users, {
    fields: [smartLists.userId],
    references: [users.id],
  }),
  items: many(listItems),
}));

export const listItemsRelations = relations(listItems, ({ one }) => ({
  list: one(smartLists, {
    fields: [listItems.listId],
    references: [smartLists.id],
  }),
}));

export const remindersRelations = relations(reminders, ({ one }) => ({
  user: one(users, {
    fields: [reminders.userId],
    references: [users.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertConversationSchema = createInsertSchema(conversations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  createdAt: true,
});

export const insertSmartListSchema = createInsertSchema(smartLists).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertListItemSchema = createInsertSchema(listItems).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertReminderSchema = createInsertSchema(reminders).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Conversation = typeof conversations.$inferSelect;
export type InsertConversation = z.infer<typeof insertConversationSchema>;
export type Message = typeof messages.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type SmartList = typeof smartLists.$inferSelect;
export type InsertSmartList = z.infer<typeof insertSmartListSchema>;
export type ListItem = typeof listItems.$inferSelect;
export type InsertListItem = z.infer<typeof insertListItemSchema>;

// Keep backward compatibility aliases
export type ShoppingList = SmartList;
export type InsertShoppingList = InsertSmartList;
export type ShoppingItem = ListItem;
export type InsertShoppingItem = InsertListItem;
export type Reminder = typeof reminders.$inferSelect;
export type InsertReminder = z.infer<typeof insertReminderSchema>;

// Contacts table for business card storage
export const contacts = pgTable("contacts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  company: varchar("company"),
  jobTitle: varchar("job_title"),
  email: varchar("email"),
  phone: varchar("phone"),
  website: varchar("website"),
  address: varchar("address"),
  notes: text("notes"),
  source: varchar("source").default("business_card"), // business_card, manual, etc.
  originalOcrText: text("original_ocr_text"), // Store original OCR text
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertContactSchema = createInsertSchema(contacts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type Contact = typeof contacts.$inferSelect;
export type InsertContact = z.infer<typeof insertContactSchema>;
