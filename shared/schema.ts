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
  password: text("password"), // Password for simple authentication
  phone: text("phone"), // Phone number for SMS authentication
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
    smsConsent?: boolean; // User has consented to receive SMS/voice reminders
    smsConsentDate?: string; // When consent was given (ISO date string)
    smsConsentPhone?: string; // Phone number consent was given for
  }>().default({}),
  onboardingCompleted: boolean("onboarding_completed").default(false),
  timezone: varchar("timezone").default("America/New_York"), // User's timezone preference
  // Subscription fields
  trialEndsAt: timestamp("trial_ends_at", { withTimezone: true }), // When free trial expires
  subscriptionStatus: varchar("subscription_status").default("trial"), // trial, active, cancelled, expired
  subscriptionId: varchar("subscription_id"), // Stripe subscription ID
  isPremium: boolean("is_premium").default(false), // Quick check for premium features
  // Password reset fields
  resetToken: varchar("reset_token"),
  resetTokenExpiry: timestamp("reset_token_expiry", { withTimezone: true }),
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
  imageUrl: text("image_url"),
  metadata: jsonb("metadata").$type<{
    attachments?: {
      filename: string;
      mimetype: string;
      size: number;
      url?: string;
    }[];
  }>(),
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
  shareMode: text("share_mode").default("view"), // 'view' | 'edit' - determines if shared users can edit
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
  amount: integer("amount"), // amount in cents (e.g., $12.50 = 1250 cents)
  currency: varchar("currency").default("USD"), // currency code
  quantity: integer("quantity").default(1), // For shopping lists - how many items
  unit: varchar("unit"), // For shopping lists - unit of measure (lbs, oz, pieces, etc.)
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Groups for group reminders (premium feature)
export const groups = pgTable("groups", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(), // Creator of the group
  name: text("name").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Group members - who receives group reminders
export const groupMembers = pgTable("group_members", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  groupId: varchar("group_id").references(() => groups.id, { onDelete: "cascade" }).notNull(),
  name: text("name").notNull(), // Member's name
  phone: text("phone").notNull(), // Phone number to send SMS to
  invitedBy: varchar("invited_by").references(() => users.id), // Who added this member
  createdAt: timestamp("created_at").defaultNow(),
});

export const reminders = pgTable("reminders", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  groupId: varchar("group_id").references(() => groups.id, { onDelete: "set null" }), // If set, this is a group reminder sent to all group members
  title: text("title").notNull(),
  description: text("description"),
  dueDate: timestamp("due_date", { withTimezone: true }).notNull(),
  completed: boolean("completed").default(false),
  recurring: text("recurring"), // daily, weekly, monthly
  category: text("category"),
  // SMS reminder fields
  smsEnabled: boolean("sms_enabled").default(false),
  smsPhone: text("sms_phone"), // Phone number to send SMS to
  smsSent: boolean("sms_sent").default(false),
  smsSentAt: timestamp("sms_sent_at", { withTimezone: true }),
  smsStatus: text("sms_status"), // pending, sent, failed, delivered
  reminderMinutes: integer("reminder_minutes").default(15), // Minutes before due date to send SMS
  timezone: varchar("timezone").default("America/New_York"), // User's timezone for this reminder
  reminderType: text("reminder_type").default("sms"), // 'sms' or 'voice' - how to deliver the reminder
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const shortLinks = pgTable("short_links", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  shortCode: varchar("short_code").notNull().unique(),
  originalUrl: text("original_url").notNull(),
  clickCount: integer("click_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  expiresAt: timestamp("expires_at"),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  conversations: many(conversations),
  smartLists: many(smartLists),
  reminders: many(reminders),
  groups: many(groups),
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
  group: one(groups, {
    fields: [reminders.groupId],
    references: [groups.id],
  }),
}));

export const shortLinksRelations = relations(shortLinks, ({ one }) => ({
}));

export const groupsRelations = relations(groups, ({ one, many }) => ({
  user: one(users, {
    fields: [groups.userId],
    references: [users.id],
  }),
  members: many(groupMembers),
}));

export const groupMembersRelations = relations(groupMembers, ({ one }) => ({
  group: one(groups, {
    fields: [groupMembers.groupId],
    references: [groups.id],
  }),
  inviter: one(users, {
    fields: [groupMembers.invitedBy],
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

export const insertShortLinkSchema = createInsertSchema(shortLinks).omit({
  id: true,
  createdAt: true,
});

export const insertGroupSchema = createInsertSchema(groups).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertGroupMemberSchema = createInsertSchema(groupMembers).omit({
  id: true,
  createdAt: true,
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
export type ShortLink = typeof shortLinks.$inferSelect;
export type InsertShortLink = z.infer<typeof insertShortLinkSchema>;
export type Group = typeof groups.$inferSelect;
export type InsertGroup = z.infer<typeof insertGroupSchema>;
export type GroupMember = typeof groupMembers.$inferSelect;
export type InsertGroupMember = z.infer<typeof insertGroupMemberSchema>;

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

// Magic link tokens for secure email authentication
export const magicLinkTokens = pgTable("magic_link_tokens", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").notNull(),
  token: varchar("token").notNull().unique(),
  used: boolean("used").default(false),
  expiresAt: timestamp("expires_at").notNull(),
  deviceFingerprint: text("device_fingerprint"), // Basic device info for security
  createdAt: timestamp("created_at").defaultNow(),
});

// SMS verification codes for phone number verification
export const smsVerificationCodes = pgTable("sms_verification_codes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  phoneNumber: varchar("phone_number").notNull(),
  code: varchar("code").notNull(),
  used: boolean("used").default(false),
  expiresAt: timestamp("expires_at").notNull(),
  attempts: integer("attempts").default(0),
  userId: varchar("user_id").references(() => users.id), // Optional - for existing users
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertMagicLinkTokenSchema = createInsertSchema(magicLinkTokens).omit({
  id: true,
  createdAt: true,
});

export const insertSmsVerificationCodeSchema = createInsertSchema(smsVerificationCodes).omit({
  id: true,
  createdAt: true,
});

export type MagicLinkToken = typeof magicLinkTokens.$inferSelect;
export type InsertMagicLinkToken = z.infer<typeof insertMagicLinkTokenSchema>;
export type SmsVerificationCode = typeof smsVerificationCodes.$inferSelect;
export type InsertSmsVerificationCode = z.infer<typeof insertSmsVerificationCodeSchema>;

// Pattern recognition for learning user behaviors
export const userPatterns = pgTable("user_patterns", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  patternType: varchar("pattern_type").notNull(), // "daily_task", "weekly_routine", "location_based", etc
  activity: text("activity").notNull(), // "pick up kids from daycare"
  timeOfDay: varchar("time_of_day"), // "15:00" for 3pm
  dayOfWeek: integer("day_of_week"), // 0-6 for Sunday-Saturday
  location: text("location"), // "daycare center"
  frequency: integer("frequency").default(1), // How many times observed
  confidence: integer("confidence").default(0), // 0-100 confidence score
  lastOccurred: timestamp("last_occurred"),
  suggestedToUser: boolean("suggested_to_user").default(false),
  userAccepted: boolean("user_accepted"),
  metadata: jsonb("metadata").$type<{
    triggers?: string[]; // Words/phrases that trigger this pattern
    context?: string; // Additional context
    relatedPeople?: string[]; // "kids", "spouse", etc
  }>().default({}),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Track user activity for pattern learning
export const activityLog = pgTable("activity_log", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  activityType: varchar("activity_type").notNull(), // "reminder_created", "task_completed", "voice_command"
  description: text("description").notNull(),
  timestamp: timestamp("timestamp").defaultNow(),
  dayOfWeek: integer("day_of_week").notNull(), // 0-6
  hourOfDay: integer("hour_of_day").notNull(), // 0-23
  location: text("location"),
  metadata: jsonb("metadata").$type<any>().default({}),
});

export const insertUserPatternSchema = createInsertSchema(userPatterns).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertActivityLogSchema = createInsertSchema(activityLog).omit({
  id: true,
  timestamp: true,
});

export type UserPattern = typeof userPatterns.$inferSelect;
export type InsertUserPattern = z.infer<typeof insertUserPatternSchema>;
export type ActivityLog = typeof activityLog.$inferSelect;
export type InsertActivityLog = z.infer<typeof insertActivityLogSchema>;

export const dailyUsageLimits = pgTable("daily_usage_limits", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  date: varchar("date").notNull(),
  chatCount: integer("chat_count").default(0).notNull(),
  listItemCount: integer("list_item_count").default(0).notNull(),
  reminderCount: integer("reminder_count").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  userDateUnique: sql`UNIQUE (user_id, date)`
}));

export const insertDailyUsageLimitsSchema = createInsertSchema(dailyUsageLimits).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type DailyUsageLimits = typeof dailyUsageLimits.$inferSelect;
export type InsertDailyUsageLimits = z.infer<typeof insertDailyUsageLimitsSchema>;
