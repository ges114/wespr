import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  email: text("email").unique(),
  password: text("password").notNull(),
  displayName: text("display_name").notNull(),
  auraId: text("aura_id").notNull().unique(),
  avatar: text("avatar"),
  bio: text("bio"),
  walletBalance: integer("wallet_balance").notNull().default(423050),
  preferences: text("preferences").default("{}"),
  eudiVerified: boolean("eudi_verified").notNull().default(false),
  eudiVerifiedAt: timestamp("eudi_verified_at"),
});

export const contacts = pgTable("contacts", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id", { length: 36 }).notNull().references(() => users.id),
  contactId: varchar("contact_id", { length: 36 }).notNull().references(() => users.id),
});

export const chats = pgTable("chats", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  isGroup: boolean("is_group").notNull().default(false),
  name: text("name"),
  avatar: text("avatar"),
  isOfficial: boolean("is_official").notNull().default(false),
});

export const chatMembers = pgTable("chat_members", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  chatId: varchar("chat_id", { length: 36 }).notNull().references(() => chats.id),
  userId: varchar("user_id", { length: 36 }).notNull().references(() => users.id),
});

export const messages = pgTable("messages", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  chatId: varchar("chat_id", { length: 36 }).notNull().references(() => chats.id),
  senderId: varchar("sender_id", { length: 36 }).notNull().references(() => users.id),
  content: text("content").notNull(),
  sentAt: timestamp("sent_at").notNull().defaultNow(),
});

export const posts = pgTable("posts", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id", { length: 36 }).notNull().references(() => users.id),
  content: text("content").notNull(),
  image: text("image"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const postLikes = pgTable("post_likes", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  postId: varchar("post_id", { length: 36 }).notNull().references(() => posts.id),
  userId: varchar("user_id", { length: 36 }).notNull().references(() => users.id),
});

export const postComments = pgTable("post_comments", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  postId: varchar("post_id", { length: 36 }).notNull().references(() => posts.id),
  userId: varchar("user_id", { length: 36 }).notNull().references(() => users.id),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const transactions = pgTable("transactions", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id", { length: 36 }).notNull().references(() => users.id),
  type: text("type").notNull(),
  amount: integer("amount").notNull(),
  description: text("description").notNull(),
  receiptData: text("receipt_data"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const serviceItems = pgTable("service_items", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  category: text("category").notNull(),
  subcategory: text("subcategory").notNull(),
  label: text("label").notNull(),
  icon: text("icon").notNull().default("ShoppingBag"),
  colorBg: text("color_bg").notNull().default("bg-slate-100"),
  colorText: text("color_text").notNull().default("text-slate-600"),
  isDefault: boolean("is_default").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const serviceCategories = pgTable("service_categories", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  key: text("key").notNull().unique(),
  title: text("title").notNull(),
  headerTitle: text("header_title").notNull(),
  headerSubtitle: text("header_subtitle").notNull(),
  icon: text("icon").notNull().default("ShoppingBag"),
  colorClass: text("color_class").notNull().default("bg-slate-600 text-white"),
  menuIcon: text("menu_icon").notNull().default("ShoppingBag"),
  menuColor: text("menu_color").notNull().default("text-slate-500"),
  menuSubtitle: text("menu_subtitle"),
  isDefault: boolean("is_default").notNull().default(false),
  sortOrder: integer("sort_order").notNull().default(99),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const payCategories = pgTable("pay_categories", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  key: text("key").notNull().unique(),
  title: text("title").notNull(),
  headerTitle: text("header_title").notNull(),
  headerSubtitle: text("header_subtitle").notNull(),
  icon: text("icon").notNull().default("Wallet"),
  colorClass: text("color_class").notNull().default("bg-emerald-600 text-white"),
  menuIcon: text("menu_icon").notNull().default("Wallet"),
  menuColor: text("menu_color").notNull().default("text-emerald-500"),
  menuSubtitle: text("menu_subtitle"),
  isDefault: boolean("is_default").notNull().default(false),
  sortOrder: integer("sort_order").notNull().default(99),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({ id: true, walletBalance: true });
export const insertContactSchema = createInsertSchema(contacts).omit({ id: true });
export const insertChatSchema = createInsertSchema(chats).omit({ id: true });
export const insertChatMemberSchema = createInsertSchema(chatMembers).omit({ id: true });
export const insertMessageSchema = createInsertSchema(messages).omit({ id: true, sentAt: true });
export const insertPostSchema = createInsertSchema(posts).omit({ id: true, createdAt: true });
export const insertPostLikeSchema = createInsertSchema(postLikes).omit({ id: true });
export const insertPostCommentSchema = createInsertSchema(postComments).omit({ id: true, createdAt: true });
export const insertTransactionSchema = createInsertSchema(transactions).omit({ id: true, createdAt: true });
export const insertServiceItemSchema = createInsertSchema(serviceItems).omit({ id: true, createdAt: true });
export const insertServiceCategorySchema = createInsertSchema(serviceCategories).omit({ id: true, createdAt: true });
export const insertPayCategorySchema = createInsertSchema(payCategories).omit({ id: true, createdAt: true });

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Contact = typeof contacts.$inferSelect;
export type Chat = typeof chats.$inferSelect;
export type ChatMember = typeof chatMembers.$inferSelect;
export type Message = typeof messages.$inferSelect;
export type Post = typeof posts.$inferSelect;
export type PostLike = typeof postLikes.$inferSelect;
export type PostComment = typeof postComments.$inferSelect;
export type Transaction = typeof transactions.$inferSelect;
export type ServiceItem = typeof serviceItems.$inferSelect;
export type InsertServiceItem = z.infer<typeof insertServiceItemSchema>;
export type ServiceCategory = typeof serviceCategories.$inferSelect;
export type InsertServiceCategory = z.infer<typeof insertServiceCategorySchema>;
export type PayCategory = typeof payCategories.$inferSelect;
export type InsertPayCategory = z.infer<typeof insertPayCategorySchema>;